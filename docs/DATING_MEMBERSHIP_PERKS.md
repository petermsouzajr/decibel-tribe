# Dating Tribe Membership Perks Implementation

This document describes the Stripe Checkout integration for Dating Tribe paid perk tiers.

## Overview

Dating Tribe offers two paid membership tiers that grant perks WITHOUT affecting verification badges:
- **Person Rewards** ($6.99/mo): Basic tier perks
- **ID Rewards** ($12.99/mo): Premium tier perks

These are **separate from** identity verification badges. Paying does NOT grant the verification badge or set `isIDVerified=true`.

## Database Schema Changes

Added to `UserDatingIdentityVerification` model:
- `hasPersonPerks` (boolean): Person Rewards tier active
- `hasIdPerks` (boolean): ID Rewards tier active
- `stripeCustomerId` (string, nullable): Stripe customer ID
- `stripeSubscriptionId` (string, nullable): Active Stripe subscription ID

Migration: `20260923233500_add_membership_perks`

## API Endpoints

### POST /api/dating/membership/checkout
Creates a Stripe Checkout session for subscription purchase.

**Request:**
```json
{
  "tier": "person" | "id"
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/...",
  "sessionId": "cs_...",
  "deepLinkSuccessUrl": "datingtribe://membership/success?tier=person",
  "deepLinkCancelUrl": "datingtribe://membership/cancel"
}
```

**Usage:** Call from Expo app with `WebBrowser.openBrowserAsync(url)`

### GET /api/dating/membership
Returns current membership status for authenticated user.

**Response:**
```json
{
  "hasPersonPerks": false,
  "hasIdPerks": false,
  "subscription": {
    "id": "sub_...",
    "status": "active",
    "currentPeriodEnd": 1234567890,
    "cancelAtPeriodEnd": false,
    "tier": "person"
  }
}
```

### POST /api/dating/membership/webhook
Stripe webhook handler for subscription events.

**Handles:**
- `checkout.session.completed`: Grant perks on initial purchase
- `customer.subscription.updated`: Update perk status on subscription changes
- `customer.subscription.deleted`: Remove perks on cancellation

**Signature verification:** Uses `STRIPE_MEMBERSHIP_WEBHOOK_SECRET`

## Environment Variables

Add to `.env` and Vercel Production:

```bash
# Stripe for Dating Tribe membership perks
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PRICE_PERSON_REWARDS=price_1UIzcwADmGkqFycosbwhrwu2
STRIPE_PRICE_ID_REWARDS=price_1UIzeVADmGkqFycoEPdsC2qx
STRIPE_MEMBERSHIP_WEBHOOK_SECRET=whsec_...
```

**Already created in Stripe:**
- Person Rewards: `prod_VJcsHQczupbnYq` @ $6.99/mo
- ID Rewards: `prod_VJcuNvhm4dHT1n` @ $12.99/mo

## Feature Access Logic

The `verificationTiers.ts` helper defines tier access:

```typescript
// Person tier: hasPersonPerks OR isIDVerified OR hasIdPerks
hasPersonTierAccess(status) 

// ID tier: hasIdPerks OR isIDVerified
hasIdTierAccess(status)

// ID Verification Filter: paid perks grant access
canAppearInIdVerifiedFilter(status)

// Badge display: ONLY isIDVerified counts
shouldShowIdVerifiedBadge(status)
```

**Key Rule:** Paid perks grant feature access, but NOT verification badges.

## Updated Endpoints

### `/api/dating/potential-matches`
- Now includes `hasPersonPerks` and `hasIdPerks` in response
- ID verification filter treats paid ID perks as "verified" for filtering
- Badge display still uses `isIDVerified` only

### `/api/dating/likes-you`
- ID verification filter includes users with `hasIdPerks`
- Returns perk flags in user objects
- Badge display uses `isIDVerified` only

### `searchFit.ts`
- `FitProfile` type now includes perk flags
- `canAppearInIdVerifiedFilter()` checks perks + verification
- "Show ID Verified Only" filter includes paid ID perk holders

## Deployment Steps

1. **Deploy to Vercel**
   ```bash
   git push origin cursor/dating-membership-perks-dd3a
   ```

2. **Run Migration**
   - Migration will run automatically on next deploy
   - Or run manually: `npx prisma migrate deploy`

3. **Set Environment Variables** (Vercel Dashboard)
   - Add all 4 Stripe environment variables to Production
   - Redeploy if variables added after deployment

4. **Create Stripe Webhook**
   - Go to Stripe Dashboard → Webhooks
   - Add endpoint: `https://decibeltribe.com/api/dating/membership/webhook`
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Copy signing secret to `STRIPE_MEMBERSHIP_WEBHOOK_SECRET`

5. **Test Checkout Flow**
   - Use Stripe test mode initially
   - Test price IDs: Create test products in Stripe Dashboard
   - Set test env vars:
     ```
     STRIPE_SECRET_KEY=sk_test_...
     STRIPE_PRICE_PERSON_REWARDS=price_test_...
     STRIPE_PRICE_ID_REWARDS=price_test_...
     STRIPE_MEMBERSHIP_WEBHOOK_SECRET=whsec_test_...
     ```

## Testing Checklist

### Manual Testing
- [ ] Checkout creates session and redirects to Stripe
- [ ] Successful payment triggers webhook
- [ ] Webhook sets correct perk flags
- [ ] GET /api/dating/membership returns perk status
- [ ] Users with perks appear in "ID Verified" filter
- [ ] Badge display ONLY shows for `isIDVerified=true`
- [ ] Subscription cancellation removes perks

### Webhook Testing
- [ ] Test `checkout.session.completed` event
- [ ] Test `customer.subscription.updated` (active → past_due)
- [ ] Test `customer.subscription.deleted` event
- [ ] Verify signature validation works
- [ ] Confirm metadata (userId, tier) is preserved

### Edge Cases
- [ ] User with no identity record can purchase
- [ ] Purchasing creates identity record if missing
- [ ] Multiple webhooks don't cause race conditions
- [ ] Invalid tier in metadata is handled gracefully
- [ ] Missing metadata logs error but doesn't crash

## Stripe Test Cards

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0025 0000 3155
```

## Notes

- **Deep links** for Expo: `datingtribe://membership/success?tier=person`
- **Web fallbacks**: `https://decibeltribe.com/dating/membership/...`
- Subscription metadata includes `userId` and `tier` for webhook processing
- Customer ID is cached to avoid duplicate customer creation
- Identity verification (`isIDVerified`) is completely separate from perks

## Future Enhancements

- [ ] Add proration for tier upgrades (Person → ID)
- [ ] Implement subscription management portal link
- [ ] Add trial periods (Stripe Checkout supports this)
- [ ] Track perk usage analytics
- [ ] Add one-time purchase options (not subscriptions)
