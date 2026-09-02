import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Decibel Tribe Privacy Policy - How we collect, use, and protect your information.",
};

export default function PrivacyPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-5">
      <div className="w-full max-w-4xl space-y-8 py-10">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Privacy Policy</h1>
          <p className="mt-2 text-muted-foreground">Last updated: February 2026</p>
        </div>

        <div className="space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="mb-3 text-2xl font-semibold">1. Introduction</h2>
            <p>
              Welcome to Decibel Tribe (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your privacy
              and ensuring the security of your personal information. This Privacy Policy explains how we collect, use,
              disclose, and safeguard your information when you use our platform, including both our main social networking
              features and our dating feature.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold">2. Information We Collect</h2>
            
            <h3 className="mb-2 mt-4 text-xl font-semibold">2.1 Information You Provide</h3>
            <ul className="ml-6 list-disc space-y-2">
              <li><strong>Account Information:</strong> Username, email address, password (encrypted), display name</li>
              <li><strong>Profile Information:</strong> Bio, avatar, instruments, skills, location (optional)</li>
              <li><strong>Content:</strong> Posts, comments, messages, event listings, photos, and other content you create</li>
              <li><strong>Dating Profile (Optional):</strong> Age, height, gender, interests, preferences, photos, and other dating-specific information</li>
              <li><strong>Location Data:</strong> Zip code for proximity-based features (events, dating)</li>
            </ul>

            <h3 className="mb-2 mt-4 text-xl font-semibold">2.2 Automatically Collected Information</h3>
            <ul className="ml-6 list-disc space-y-2">
              <li><strong>Usage Data:</strong> Pages viewed, features used, time spent on the platform</li>
              <li><strong>Device Information:</strong> IP address, browser type, device type, operating system</li>
              <li><strong>Cookies:</strong> We use cookies for authentication, preferences, and analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold">3. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="ml-6 list-disc space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Create and manage your account</li>
              <li>Connect you with other musicians, fans, and potential matches</li>
              <li>Show you relevant events, posts, and profiles based on your location and preferences</li>
              <li>Send you notifications about activity on your account</li>
              <li>Respond to your support requests</li>
              <li>Detect and prevent fraud, abuse, and security issues</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold">4. Dating Feature Privacy</h2>
            <p>The dating feature has additional privacy considerations:</p>
            <ul className="ml-6 list-disc space-y-2">
              <li><strong>Opt-in Only:</strong> Dating features are completely optional and require explicit activation</li>
              <li><strong>Separate Profile:</strong> Your dating profile is separate from your main profile</li>
              <li><strong>Visibility Control:</strong> You control who can see your dating profile</li>
              <li><strong>Location Privacy:</strong> We use your zip code for matching but never display your exact location</li>
              <li><strong>Match Privacy:</strong> Your matches and conversations are private and only visible to you and your matches</li>
              <li><strong>Blocking:</strong> You can block any user to prevent them from seeing your profile or contacting you</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold">5. Information Sharing and Disclosure</h2>
            <p>We do not sell your personal information. We may share your information only in these circumstances:</p>
            <ul className="ml-6 list-disc space-y-2">
              <li><strong>With Other Users:</strong> Profile information you choose to make public</li>
              <li><strong>Service Providers:</strong> Third-party services that help us operate (hosting, email, analytics)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect rights and safety</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold">6. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your information:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>Password hashing using bcrypt</li>
              <li>Secure HTTPS connections</li>
              <li>Regular security audits</li>
              <li>Limited employee access to personal data</li>
            </ul>
            <p className="mt-2">
              However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold">7. Your Rights and Choices</h2>
            <p>You have the right to:</p>
            <ul className="ml-6 list-disc space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal information</li>
              <li><strong>Correction:</strong> Update or correct your information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Opt-out:</strong> Disable notifications, deactivate dating features</li>
              <li><strong>Export:</strong> Download your data in a portable format</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold">8. Data Retention</h2>
            <p>
              We retain your information for as long as your account is active or as needed to provide services. When you
              delete your account, we will delete or anonymize your personal information, except where we are required to
              retain it for legal purposes. Some content may remain visible if it was shared publicly (e.g., posts in
              groups).
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold">9. Children&apos;s Privacy</h2>
            <p>
              Our service is not intended for users under 18 years of age. We do not knowingly collect personal information
              from children under 18. If we become aware that a user is under 18, we will take steps to delete their
              account and information.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold">10. Third-Party Services</h2>
            <p>Our platform uses third-party services:</p>
            <ul className="ml-6 list-disc space-y-2">
              <li><strong>Google OAuth:</strong> For optional Google sign-in (subject to Google&apos;s privacy policy)</li>
              <li><strong>UploadThing:</strong> For image hosting and management</li>
              <li><strong>Stream:</strong> For messaging functionality</li>
            </ul>
            <p className="mt-2">
              These services have their own privacy policies, and we encourage you to review them.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold">11. International Users</h2>
            <p>
              Your information may be transferred to and processed in countries other than your country of residence. By
              using our service, you consent to such transfers.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold">12. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes by posting a
              notice on our platform or sending you an email. Your continued use of the service after changes become
              effective constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold">13. Contact Us</h2>
            <p>
              If you have questions or concerns about this Privacy Policy or our data practices, please contact us through
              our support channels within the platform.
            </p>
          </section>
        </div>

        <div className="border-t pt-6 text-center">
          <Link href="/login" className="text-primary hover:underline">
            Back to Login
          </Link>
          <span className="mx-3">|</span>
          <Link href="/signup" className="text-primary hover:underline">
            Back to Sign Up
          </Link>
        </div>
      </div>
    </main>
  );
}
