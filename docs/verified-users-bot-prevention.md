### Bot Prevention and Verified User Strategy

**Goal**: Enhance the social network by implementing bot prevention measures for both non-logged-in (public) users and signed-up users, introducing a verified tier to bolster security against bots and fraud.

---

### Bot Prevention for Non-Logged-In Users

**Strategy**: Implement rate-limiting combined with CAPTCHAs for public access to prevent data scraping and server overload.

#### Rate-Limiting with CAPTCHAs

- **Mechanism**: Limit non-logged-in users to **50 requests per minute per IP address**. Exceeding this limit triggers a CAPTCHA challenge.
- **Implementation**:

  - **Rate-Limiting**: Use Vercel edge middleware or a library like `rate-limiter-flexible` in Next.js.

  ```javascript
  // Example using rate-limiter-flexible
  import { RateLimiterMemory } from 'rate-limiter-flexible';

  const publicRateLimiter = new RateLimiterMemory({
    points: 50, // 50 requests
    duration: 60, // per minute
  });

  export async function middleware(request) {
    if (/* user is not logged in */) {
      const ip = request.headers.get('x-forwarded-for') || 'unknown';
      try {
        await publicRateLimiter.consume(ip);
      } catch (error) {
        // Redirect to CAPTCHA page or return 429
        return new Response('Rate limit exceeded. Please complete a CAPTCHA.', { status: 429 });
      }
    }
    // Continue processing request
    return next();
  }
  ```

  - **CAPTCHA Trigger**: If the rate limit is hit, redirect to a CAPTCHA page (e.g., using Google reCAPTCHA or Cloudflare Turnstile). Passing the CAPTCHA grants a temporary token (e.g., cookie) allowing an additional block of requests (e.g., 50 more for the next hour).

- **Data Consumption Definition**: A "request" can be defined as a page view or a significant API call (e.g., fetching a feed, loading a profile). _Note: Fine-tune this based on typical user behavior._
- **Team Responsibilities**:
  - `[PlatformTeam]`: Implement rate-limiting logic and CAPTCHA integration (middleware, CAPTCHA page/component).
  - `[MediaTeam]`: Secure media assets (e.g., signed URLs) to prevent direct scraping.

**Rationale**: Standard practice balancing security and UX, allowing legitimate browsing while deterring automated scraping.

---

### Verified Tier for Signed-Up Users

**Strategy**: Implement a hybrid verification system: free verification based on identity and behavior, plus an optional paid tier for perks and instant verification.

#### Evaluation: Paid vs. Alternative Verification

1.  **Paid Verified Tier ($5/Month)**:
    - **Pros**: Effective bot deterrent (cost barrier), potential revenue stream, perceived value with perks.
    - **Cons**: User resistance (paywall perception), adoption barrier for a new platform, risk of payment fraud.
2.  **Alternative Verification (Free)**:
    - **Email/Phone Verification**: Basic identity check, raises the bar for bots.
    - **Behavioral Analysis**: Detects bot patterns using ML (e.g., Sift, Cloudflare Bot Management). Requires integration and tuning.
    - **Social Proof**: Verification through connections (e.g., followers). Leverages network trust but can be slow or complex to manage.

#### Proposed Hybrid Solution

- **Free Verification Path (Standard Verified - Blue Checkmark)**:

  1.  **Mandatory**: Email and Phone Verification (`[AuthTeam]`).

      - Use services like Twilio (SMS) and SendGrid (Email) for OTPs.
      - Update user model: `isEmailVerified`, `isPhoneVerified`.

      ```javascript
      // Example: Twilio SMS Verification
      import twilio from "twilio";
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN,
      );

      async function sendVerificationCode(phoneNumber) {
        /* ... send code ... */
      }
      async function verifyCode(phoneNumber, code) {
        /* ... check code ... */
      }

      // Update user status upon successful verification
      await prisma.user.update({
        where: { id: userId },
        data: { isPhoneVerified: true },
      });
      ```

  2.  **Choose One**: Behavioral Proof OR Social Proof.

      - **Behavioral Proof** (`[PlatformTeam]`): Achieve verified status after N organic interactions (e.g., 10 likes/comments/posts) over M days (e.g., 3 days), detected via behavioral analysis (e.g., Sift integration).

      ```javascript
      // Example: Tracking with Sift (Conceptual)
      import sift from "sift-js";
      // Initialize Sift

      async function trackAndVerifyUser(userId, action) {
        // Track event
        sift.track("$event", {
          /* ... event details ... */
        });

        // Check score and interaction count
        const score = await sift.getScore(userId);
        const interactions = await countUserInteractions(userId);

        if (score < BOT_THRESHOLD && interactions >= MIN_INTERACTIONS) {
          await prisma.user.update({
            where: { id: userId },
            data: { isVerified: true },
          });
        }
      }
      ```

      - **Social Proof** (`[SocialTeam]`): Achieve verified status if followed by N (e.g., 5) already-verified users within a timeframe (e.g., 30 days).

      ```javascript
      // Example: Checking Social Proof
      async function checkSocialVerification(userId) {
        const verifiedFollowerCount = await prisma.follow.count({
          where: { followingId: userId, follower: { isVerified: true } },
        });
        if (verifiedFollowerCount >= MIN_VERIFIED_FOLLOWERS) {
          await prisma.user.update({
            where: { id: userId },
            data: { isVerified: true },
          });
        }
      }
      ```

  3.  **Outcome**: User gets `isVerified = true` status and a standard verification badge.

- **Optional Paid Tier ("Premium Verified" - Gold Badge, $5/Month)**:

  - **Benefits**: Instant verification (skips Step 2 above), distinct badge, potential perks (priority feed placement `[SocialTeam]`, message non-followers `[MessagingTeam]`, advanced analytics `[PlatformTeam]`).
  - **Implementation** (`[AuthTeam]`, `[PlatformTeam]`):

    - Integrate Stripe for subscription payments.
    - Use Stripe webhooks to update user status (`isPremiumVerified = true`).

    ```javascript
    // Example: Stripe Checkout Session
    import Stripe from "stripe";
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    async function createPremiumSubscription(userId) {
      const session = await stripe.checkout.sessions.create({
        /* ... config ... */
      });
      return session.url;
    }

    // Example: Stripe Webhook Handler
    app.post("/webhook/stripe", async (req) => {
      // Verify event signature
      const event = stripe.webhooks.constructEvent(/* ... */);

      if (event.type === "checkout.session.completed") {
        const userId = event.data.object.metadata.userId;
        await prisma.user.update({
          where: { id: userId },
          data: { isPremiumVerified: true, isVerified: true }, // Grant base verification too
        });
      }
      // Handle other events (e.g., subscription cancellations)
    });
    ```

  - Update UI components to display the correct badge and enable premium features based on `isPremiumVerified` status.

**Rationale**: Provides a free, accessible path to verification, ensuring inclusivity and security, while the optional paid tier offers user choice, additional revenue, and enhanced value.

---

### Additional Bot Prevention for Signed-Up Users

1.  **CAPTCHA on Signup** (`[AuthTeam]`):
    - Implement reCAPTCHA/Turnstile during the registration process.
2.  **Rate-Limiting for Signed-Up Users** (`[PlatformTeam]`):
    - Apply higher rate limits (e.g., 500 requests/hour) than public users.
    - Monitor for abuse patterns (e.g., mass liking/following) even within limits.
3.  **Continuous Behavioral Monitoring** (`[PlatformTeam]`):
    - Use behavioral analysis tools (e.g., Sift) ongoingly.
    - Flag verified accounts exhibiting suspicious, bot-like activity for review or re-verification.

---

### Implementation Notes

- **Threshold Tuning**: Rate limits (public/signed-up), interaction counts for verification, and behavioral analysis thresholds are starting points. Monitor platform metrics and adjust these values based on real-world usage and observed bot activity.
- **User Communication**: Clearly communicate the verification process and the benefits of both free and premium tiers to users.

This hybrid strategy provides robust bot prevention and user verification, balancing security needs with user growth and experience goals.
