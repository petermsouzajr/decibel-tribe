# Dating Feature Master Plan
## Decibel Tribe - Musicians Social Network Dating Feature

**Vision:** Create a premium, free dating feature that competes with paid dating apps, specifically tailored for music lovers to find meaningful connections.

**Target:** Mobile-first web experience (no native app) with full feature parity to premium dating app tiers.

---

## Table of Contents
1. [Current Status](#current-status)
2. [Premium Features to Offer Free](#premium-features-to-offer-free)
3. [Core Feature Implementation Plan](#core-feature-implementation-plan)
4. [Best Practices & Architecture](#best-practices--architecture)
5. [Task Breakdown](#task-breakdown)
6. [Technical Specifications](#technical-specifications)

---

## Current Status

### ✅ Already Implemented
- **Schema:** Complete database models (`matches`, `swipes`, `user_dating_profile`, `user_dating_preferences`, `user_photos`, `Message`)
- **Onboarding Flow:** Complete 5-step onboarding (`DatingOnboardingFlow.tsx`) with verification checks
- **Dating Toggle:** Enable/disable dating feature (`DatingToggleButton.tsx`)
- **Matching Engine:** `GET /api/dating/potential-matches` with preference filtering, reciprocal matching, exclusion logic
- **Swipe/Decision System:** `POST /api/dating/decision` with mutual match detection, notifications, rate limiting (100 likes/hour)
- **Matches API:** `GET /api/dating/matches` with last message preview and unread counts
- **Chat System:** `GET/POST /api/dating/matches/:matchId/messages` with read receipts and pagination
- **Match Notifications:** MATCH notification type added and integrated
- **Verification System:** Non-verified users can browse/dislike but cannot like until verified
- **Message with Likes:** Optional message attachment when liking someone
- **Basic Pages:** 
  - `/dating` - Dating deck with potential matches
  - `/dating/matches` - Matches list page
  - `/dating/chat/[matchId]` - Chat interface
  - `/dating/likes-you` - See who liked you
  - `/dating/history` - Swipe history (likes/dislikes)
  - `/dating/profile` - Edit profile, photos, and preferences
  - `/dating/onboarding` - Onboarding flow
- **UI Components:**
  - `DatingDeck` - Main deck view with match cards
  - `PotentialMatchCard` - Profile card display
  - `MatchList` - List of matches
  - `ChatInterface` - Chat component
  - `MatchCelebration` - Match celebration modal
  - `LikesYouList` - Display users who liked you
  - `SwipeHistory` - Display swipe history with filters
  - `PhotoManager` - Upload/manage dating photos (max 5, min 1)
  - `DatingProfileEditor` - Edit profile with tabs (Profile/Photos/Preferences)
  - `DatingPreferencesForm` - Edit dating preferences (includes music filters)
  - `FilterPanel` - Advanced filter modal with instruments and skills
- **API Endpoints:**
  - `/api/dating/toggle` - Enable/disable dating
  - `/api/dating/preferences` - Get/update preferences
  - `/api/dating/potential-matches` - Get potential matches
  - `/api/dating/decision` - Record swipe decision
  - `/api/dating/matches` - Get user's matches
  - `/api/dating/matches/:matchId/messages` - Chat messages
  - `/api/dating/likes-you` - Get users who liked you
  - `/api/dating/history` - Get swipe history (GET) / Unlike (DELETE)
  - `/api/dating/photos` - Manage dating photos (GET/POST/PUT/DELETE)
  - `/api/dating/profile` - Get/update dating profile (GET/PUT)
  - `/api/dating/preferences` - Get/update preferences (GET/POST) - Now includes music filters

### ✅ Recently Completed
- **Photo Management** - Upload/manage dating photos (max 5, min 1 required for verification)
- **Profile Editing** - Complete profile editor with tabs for profile, photos, and preferences (`/dating/profile`)
- **"View Profile" Button** - Navigate to user's social homepage from match cards
- **"Likes You" Feature** (Phase 2.1) - See who liked you, like back directly
- **History Feature** - View past likes/dislikes, unlike non-matched users (with 3-hour undo window)
- **Advanced Filters** (Phase 2.5) - Music-specific filters for instruments and skills

### ✅ Recently Completed
- Photo management - Upload/manage dating photos (max 5, min 1 required for verification)
- Profile editing - Edit dating profile and preferences via `/dating/profile` page
- "View Profile" button - Navigate to user's social homepage from match cards
- Preferences API - GET endpoint for fetching preferences

### ❌ Not Yet Implemented
- Profile boosts (PAUSED - per master plan)
- Super likes (PAUSED - per master plan)
- ~~Travel mode~~ ✅ **COMPLETED** - Browse matches in different cities with expiration dates
- ~~Match insights~~ ✅ **COMPLETED** - Shows compatibility scores, common interests, music overlap, and conversation starters
- ~~Music compatibility scoring (40% weight algorithm)~~ ✅ **COMPLETED** - Implemented as user preference setting "Prioritize instrument and skill match" checkbox
- ~~Safety Features~~ ✅ **COMPLETED** - Report/block functionality, safety tips component
- ~~Database Indexes~~ ✅ **COMPLETED** - Added indexes for swipes, matches, blocks, and photos
- Video profiles -DO NOT IMPLEMENT, we are doing PHOTO ONLY
- Profile analytics - SKIP (big feature, separate implementation)
- Photo/Age verification - SKIP (big feature, separate implementation)
- Real-time chat updates - Mostly handled by Stream Chat integration

---

## Premium Features to Offer Free

Based on industry analysis, these are premium features in major dating apps that we'll offer **completely free**:

### 1. **Unlimited Swipes/Likes** ⭐
- **Industry Standard:** Tinder/Bumble limit free users to ~50-100 swipes/day
- **Our Approach:** Unlimited swipes, no daily limits
- **Implementation:** No rate limiting on swipe actions

### 2. **See Who Likes You** ⭐
- **Industry Standard:** Premium feature ($9.99-29.99/month)
- **Our Approach:** Free "Likes You" tab showing all users who swiped right
- **Implementation:** `GET /api/dating/likes-you` endpoint

### 3. **Profile Boosts** ⭐ PAUSE FEATURE DO NOT IMPLEMENT YET
- **Industry Standard:** $4.99-9.99 per boost
- **Our Approach:** Free daily boost (1 per day), unlimited for active users
- **Implementation:** Boost system that elevates profile in algorithm

### 4. **Advanced Filters** ⭐
- **Industry Standard:** Premium feature
- **Our Approach:** All filters free:
  - Age range
  - Distance
  - Gender/sexual orientation
  - Height range
  - Religion
  - Vaccination status
  - **Music-specific filters:**
    - Favorite genres
    - Instruments played
    - Skill level
    - Musical interests

### 5. **Read Receipts** ⭐
- **Industry Standard:** Premium feature
- **Our Approach:** Free read receipts for all messages
- **Implementation:** Track message read status

### 6. **Travel Mode/Passport** ⭐
- **Industry Standard:** Premium feature ($4.99-9.99/month)
- **Our Approach:** Free location change, unlimited cities
- **Implementation:** Allow temporary location override

### 7. **Super Likes** ⭐ DO NOT IMPLEMENT YET
- **Industry Standard:** Limited free, unlimited premium
- **Our Approach:** Unlimited super likes (with cooldown to prevent spam)
- **Implementation:** Enhanced like with notification priority

### 8. **Undo Last Swipe** ⭐
- **Industry Standard:** Premium feature
- **Our Approach:** Free undo (with 3-hour window)
- **Implementation:** Store recent swipes with undo capability

### 9. **Message Before Match** ⭐ DO NOT IMPLEMENT
- **Industry Standard:** Premium feature
- **Our Approach:** Free message with super like
- **Implementation:** Allow message attachment to super like

### 10. **Advanced Matching Algorithm** ⭐
- **Industry Standard:** Premium users get better matches
- **Our Approach:** All users get advanced algorithm including:
  - Music compatibility scoring
  - Interest overlap
  - Activity level matching
  - Profile completeness scoring

### 11. **Video Profile/Verification** ⭐
- **Industry Standard:** Premium verification badges
- **Our Approach:** Free video profiles and verification
- **Implementation:** Video upload + verification system

### 12. **Incognito Mode** ⭐ DO NOT IMPLEMENT
- **Industry Standard:** Premium privacy feature
- **Our Approach:** Free browse invisibly option
- **Implementation:** Hide profile from deck while browsing

### 13. **Priority Likes** ⭐ DO NOT IMPLEMENT- only verified users will be ale tyo use the dating feature.
- **Industry Standard:** Premium feature
- **Our Approach:** Free priority placement for active users
- **Implementation:** Algorithm prioritizes engaged users

### 14. **Extended Profile** ⭐ DO NOT IMPLEMENT
- **Industry Standard:** Premium extended bio
- **Our Approach:** Unlimited profile fields, rich media
- **Implementation:** Enhanced profile with music integration

### 15. **Match Insights** ⭐
- **Industry Standard:** Premium analytics
- **Our Approach:** Free insights:
  - Match compatibility score
  - Common interests breakdown
  - Music taste overlap
  - Activity patterns

  ADD SOME NEW METRICS, in the future we will use AI to analyze profiles and build detailed metrics like hair color, body type, eye color and etc. this will give very granular data on what kind of matched people like and give us better data to recomend successful matched per person. this will also give someone insights into their dating habits as they will have a chart and metric board available to them--in the future.

  Also implement a history feature, so you can see who you have liked in the past and UNlike someone.

  Allow message attachment to LIKES also.

  keep in mind that this is a web based datin gapp and not mobile, so actual physical swipes might not work, instead, we might need to simply use a green checkmark for the like button on the right, and a red X or the dislike button on the lower left.

  Also limit likes and dislikes frequency, so that we can detect abuse in bots or something. maybe allow 100 likes per hour block? and unlimited dislikes --what do you think?

---

## Core Feature Implementation Plan

### Phase 1: Foundation (Weeks 1-2)
**Goal:** Complete basic matching and swiping functionality

#### 1.1 Matching Engine
- **Endpoint:** `GET /api/dating/potential-matches`
- **Logic:**
  - Filter by preferences (age, gender, distance, etc.)
  - Reciprocal preference matching
  - Exclude already swiped users
  - Exclude existing matches
  - Distance calculation (Haversine formula or PostGIS)
  - Return batch of 10-20 profiles
- **Priority:** 🔴 Critical

#### 1.2 Swipe/Decision System
- **Endpoint:** `POST /api/dating/decision`
- **Logic:**
  - Record swipe (LIKE/DISLIKE)
  - Check for mutual like → create Match
  - Send notifications on match
  - Return next potential match
- **Priority:** 🔴 Critical

#### 1.3 Match List
- **Endpoint:** `GET /api/dating/matches`
- **Display:** List of matched users with last message preview
- **Priority:** 🔴 Critical

#### 1.4 Basic Chat
- **Endpoints:**
  - `GET /api/dating/matches/:matchId/messages`
  - `POST /api/dating/matches/:matchId/messages`
- **Features:**
  - Send/receive messages
  - Message history with pagination
  - Read receipts
- **Priority:** 🔴 Critical

### Phase 2: Enhanced Experience (Weeks 3-4)
**Goal:** Add premium features and polish

#### 2.1 "Likes You" Feature
- **Endpoint:** `GET /api/dating/likes-you`
- **Display:** Grid/list of users who liked you
- **Action:** Swipe directly from "Likes You" list
- **Priority:** 🟡 High

#### 2.2 Profile Boosts
- **Endpoint:** `POST /api/dating/boost`
- **Logic:**
  - Elevate profile in matching algorithm
  - 1 free boost per day
  - Track boost usage
- **Priority:** 🟡 High

#### 2.3 Super Likes
- **Enhancement:** Add "Super Like" option to swipe
- **Features:**
  - Enhanced notification
  - Message attachment option
  - Cooldown period (1 per day free, unlimited with activity)
- **Priority:** 🟡 High

#### 2.4 Undo Last Swipe
- **Endpoint:** `POST /api/dating/undo-swipe`
- **Logic:**
  - Store last 10 swipes with undo window (3 hours)
  - Remove swipe record on undo
  - Restore user to potential matches
- **Priority:** 🟡 High

#### 2.5 Advanced Filters
- **UI:** Enhanced filter panel
- **Filters:**
  - All existing preferences
  - Music genres
  - Instruments
  - Skill levels
  - Activity level
- **Priority:** 🟡 High

### Phase 3: Communication & Discovery (Weeks 5-6)
**Goal:** Enhanced chat and discovery features

#### 3.1 Enhanced Chat
- **Features:**
  - Real-time updates (WebSocket or polling)
  - Typing indicators
  - Message reactions
  - Image sharing in chat
  - Voice messages
- **Priority:** 🟡 High

#### 3.2 Travel Mode
- **Endpoint:** `POST /api/dating/location-override`
- **Features:**
  - Temporary location change
  - Browse matches in different cities
  - Set expiration date
- **Priority:** 🟢 Medium

#### 3.3 Incognito Mode
- **Feature:** Browse without appearing in others' decks
- **Implementation:** Flag in user preferences
- **Priority:** 🟢 Medium

#### 3.4 Match Insights
- **Endpoint:** `GET /api/dating/matches/:matchId/insights`
- **Display:**
  - Compatibility score
  - Common interests
  - Music overlap
  - Conversation starters
- **Priority:** 🟢 Medium

### Phase 4: Music Integration (Weeks 7-8)
**Goal:** Leverage music data for better matching

#### 4.1 Music Compatibility Scoring
- **Algorithm:**
  - Genre overlap
  - Instrument compatibility
  - Skill level matching
  - Musical interest alignment
- **Priority:** 🟡 High

#### 4.2 Music-Based Filters
- **Filters:**
  - Favorite genres (multi-select)
  - Instruments played
  - Skill level ranges
  - Musical goals (collaboration, jamming, etc.)
- **Priority:** 🟡 High

#### 4.3 Music Profile Integration
- **Display:** Show user's music profile in dating card
- **Features:**
  - Instruments
  - Genres
  - Skills
  - Musical bio
- **Priority:** 🟡 High

### Phase 5: Advanced Features (Weeks 9-10)
**Goal:** Premium polish and advanced functionality

#### 5.1 Video Profiles
- **Upload:** Video profile upload
- **Display:** Video in profile card
- **Verification:** Video verification badge
- **Priority:** 🟢 Medium

#### 5.2 Advanced Matching Algorithm
- **Factors:**
  - Music compatibility (40%)
  - Profile completeness (20%)
  - Activity level (15%)
  - Distance (15%)
  - Mutual connections (10%)
- **Priority:** 🟡 High

#### 5.3 Profile Analytics
- **Dashboard:** User's dating stats
- **Metrics:**
  - Match rate
  - Like rate
  - Message response rate
  - Profile views
- **Priority:** 🟢 Medium

#### 5.4 Safety Features
- **Features:**
  - Report user
  - Block user
  - Safety tips
  - Photo verification
- **Priority:** 🔴 Critical (Safety first!)

---

## Best Practices & Architecture

### Mobile-First Design
- **Responsive Breakpoints:**
  - Mobile: 320px - 768px (primary focus)
  - Tablet: 768px - 1024px
  - Desktop: 1024px+
- **Touch Interactions:**
  - Swipe gestures for cards
  - Large tap targets (min 44x44px)
  - Haptic feedback (where supported)
- **Performance:**
  - Lazy load images
  - Virtual scrolling for lists
  - Optimistic UI updates

### Security & Privacy
- **Data Protection:**
  - Encrypt sensitive data
  - Secure photo storage
  - Location privacy controls
- **User Safety:**
  - Report/block functionality
  - Photo verification
  - Age verification
  - Privacy settings
- **Authentication:**
  - All endpoints require auth
  - Rate limiting on actions
  - CSRF protection

### Performance Optimization
- **Database:**
  - Indexed queries (userId, location, preferences)
  - Efficient distance calculations
  - Pagination for all lists
- **Caching:**
  - Redis for match cache
  - CDN for images
  - Query result caching
- **API:**
  - Batch requests where possible
  - GraphQL or REST with field selection
  - Compression for responses

### User Experience
- **Onboarding:**
  - Progressive disclosure
  - Save progress
  - Skip optional steps
- **Feedback:**
  - Loading states
  - Error messages
  - Success confirmations
  - Empty states
- **Accessibility:**
  - ARIA labels
  - Keyboard navigation
  - Screen reader support
  - Color contrast compliance

### Code Organization
```
src/
├── app/
│   └── (main)/
│       └── dating/
│           ├── page.tsx              # Main deck view
│           ├── matches/
│           │   └── page.tsx          # Matches list
│           ├── chat/
│           │   └── [matchId]/
│           │       └── page.tsx     # Chat interface
│           ├── profile/
│           │   └── page.tsx         # Profile editing
│           └── onboarding/
│               └── page.tsx          # Onboarding flow
├── components/
│   └── dating/
│       ├── PotentialMatchCard.tsx    # Swipeable card
│       ├── DecisionButtons.tsx      # Like/Dislike buttons
│       ├── MatchList.tsx             # Matches list
│       ├── ChatInterface.tsx        # Chat component
│       ├── DatingProfileForm.tsx    # Profile form
│       ├── DatingPreferencesForm.tsx # Preferences form
│       ├── PhotoManager.tsx         # Photo upload/management
│       ├── BoostButton.tsx          # Boost feature
│       ├── SuperLikeButton.tsx      # Super like
│       └── FilterPanel.tsx          # Advanced filters
└── app/
    └── api/
        └── dating/
            ├── potential-matches/
            │   └── route.ts          # Matching engine
            ├── decision/
            │   └── route.ts          # Swipe action
            ├── matches/
            │   ├── route.ts         # Get matches
            │   └── [matchId]/
            │       └── messages/
            │           └── route.ts # Chat messages
            ├── likes-you/
            │   └── route.ts         # Who liked you
            ├── boost/
            │   └── route.ts         # Profile boost
            └── undo-swipe/
                └── route.ts         # Undo feature
```

---

## Task Breakdown

### 🔴 Critical Priority Tasks

#### Backend Tasks
1. **Matching Engine API** (`GET /api/dating/potential-matches`) ✅
   - [x] Implement preference filtering
   - [x] Add distance calculation (Haversine - placeholder)
   - [x] Exclude swiped/matched users
   - [x] Exclude non-verified users from results
   - [x] Add pagination
   - [ ] Optimize queries with indexes (TODO)
   - [ ] Add caching layer (TODO)

2. **Swipe/Decision API** (`POST /api/dating/decision`) ✅
   - [x] Create swipe record
   - [x] Check for mutual like
   - [x] Create match on mutual like
   - [x] Send match notifications
   - [x] Rate limiting (100 likes/hour)
   - [x] Block non-verified users from liking
   - [x] Support optional message with likes

3. **Matches API** (`GET /api/dating/matches`) ✅
   - [x] Fetch user's matches
   - [x] Include last message preview
   - [x] Sort by last activity
   - [x] Add unread message counts

4. **Chat APIs** ✅
   - [x] `GET /api/dating/matches/:matchId/messages` - Fetch messages
   - [x] `POST /api/dating/matches/:matchId/messages` - Send message
   - [x] Add read receipts
   - [x] Add pagination

5. **Notifications** ✅
   - [x] Add MATCH type to NotificationType enum
   - [x] Create match notifications
   - [x] Update notification system to handle matches

#### Frontend Tasks
6. **Dating Deck Page** (`/dating`) ✅
   - [x] Create PotentialMatchCard component
   - [x] Add DecisionButtons (Like/Dislike) - Web buttons (green checkmark, red X)
   - [x] Add loading states
   - [x] Add empty states
   - [x] Add match celebration modal
   - [x] Add verification banner for non-verified users
   - [x] Add message input modal for likes
   - [x] Disable like button for non-verified users

7. **Matches List Page** (`/dating/matches`) ✅
   - [x] Create MatchList component
   - [x] Display match cards with preview
   - [x] Link to chat pages
   - [x] Add unread message indicators
   - [x] Add empty state

8. **Chat Page** (`/dating/chat/[matchId]`) ✅
   - [x] Create ChatInterface component
   - [x] Display message history
   - [x] Add message input
   - [x] Add send functionality
   - [x] Add read receipts
   - [x] Add pagination for message history
   - [ ] Add typing indicators (future)
   - [ ] Add real-time updates (future)

9. **Profile Management** ✅
   - [x] Create DatingProfileForm component (integrated into DatingProfileEditor)
   - [x] Create DatingPreferencesForm component
   - [x] Create PhotoManager component
   - [x] Add profile editing page (`/dating/profile`)
   - [x] Add photo upload/delete (max 5, min 1)
   - [x] Add primary photo selection
   - [x] Add "View Profile" button to match cards

### 🟡 High Priority Tasks

10. **"Likes You" Feature** ✅
    - [x] Create API endpoint (`GET /api/dating/likes-you`)
    - [x] Create LikesYou page/component
    - [x] Display users who liked you (grid view)
    - [x] Add like/dislike buttons from likes list
    - [x] Show messages attached to likes
    - [x] Match celebration when mutual like occurs

11. **Profile Boosts**
    - [ ] Create boost API
    - [ ] Add boost button
    - [ ] Track boost usage
    - [ ] Update matching algorithm for boosted profiles

12. **Super Likes**
    - [ ] Add super like option to swipe
    - [ ] Enhanced notifications
    - [ ] Message attachment option
    - [ ] Cooldown system

13. **Undo Last Swipe** ✅
    - [x] Store recent swipes (in history)
    - [x] Add history API (`GET /api/dating/history`)
    - [x] Add unlike API (`DELETE /api/dating/history`) with 3-hour window validation
    - [x] Add history page with filters
    - [x] Add unlike button for non-matched likes
    - [x] Add 3-hour time window validation and UI messaging

14. **Advanced Filters** ✅
    - [x] Create FilterPanel component with modal UI
    - [x] Add instrument filters (all instruments from instrumentList.json)
    - [x] Add skill filters (all skills from skillsList.json)
    - [x] Update matching engine to use filters
    - [x] Add filter badge indicator on dating deck
    - [x] Save filters to preferences
    - [x] Load filters from preferences on mount

15. **Music Integration**
    - [ ] Add music compatibility scoring
    - [ ] Display music info in cards
    - [ ] Add music-based filters
    - [ ] Update matching algorithm

### 🟢 Medium Priority Tasks

16. **Travel Mode**
    - [ ] Add location override API
    - [ ] Create travel mode UI
    - [ ] Add city selection
    - [ ] Add expiration date

17. **Incognito Mode**
    - [ ] Add incognito flag to preferences
    - [ ] Update matching engine to exclude incognito users
    - [ ] Add toggle in settings

18. **Match Insights**
    - [ ] Create insights API
    - [ ] Display compatibility score
    - [ ] Show common interests
    - [ ] Add conversation starters

19. **Enhanced Chat**
    - [ ] Add real-time updates
    - [ ] Add typing indicators
    - [ ] Add message reactions
    - [ ] Add image sharing
    - [ ] Add voice messages

20. **Video Profiles**
    - [ ] Add video upload
    - [ ] Display video in profile
    - [ ] Add video verification
    - [ ] Add verification badge

21. **Advanced Matching Algorithm**
    - [ ] Implement multi-factor scoring
    - [ ] Add music compatibility (40%)
    - [ ] Add profile completeness (20%)
    - [ ] Add activity level (15%)
    - [ ] Add distance (15%)
    - [ ] Add mutual connections (10%)

22. **Profile Analytics**
    - [ ] Create analytics API
    - [ ] Display user stats
    - [ ] Show match rate
    - [ ] Show like rate
    - [ ] Show response rate

### Safety & Polish Tasks

23. **Safety Features**
    - [ ] Add report user in dating context
    - [ ] Add block user in dating context
    - [ ] Add safety tips page
    - [ ] Add photo verification
    - [ ] Add age verification

24. **Mobile Optimization**
    - [ ] Optimize swipe gestures
    - [ ] Add haptic feedback
    - [ ] Optimize image loading
    - [ ] Add virtual scrolling
    - [ ] Optimize bundle size

25. **Testing & QA**
    - [ ] Unit tests for matching logic
    - [ ] Integration tests for APIs
    - [ ] E2E tests for user flows
    - [ ] Performance testing
    - [ ] Security audit

---

## Technical Specifications

### Database Schema Enhancements

```prisma
// Add to NotificationType enum
enum NotificationType {
  // ... existing types
  MATCH
}

// Add to User model (if not exists)
model User {
  // ... existing fields
  isDatingActive Boolean @default(false)
  latitude       Float?
  longitude      Float?
  lastActiveAt   DateTime?
}

// Enhance Swipe model
model swipes {
  // ... existing fields
  isSuperLike    Boolean @default(false)
  message        String? // For message before match
  canUndo        Boolean @default(true)
  undoExpiresAt  DateTime?
}

// Add Boost model
model dating_boosts {
  id        String   @id @default(cuid())
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
  
  @@index([userId, expiresAt])
}

// Add Location Override model
model dating_location_overrides {
  id        String   @id @default(cuid())
  userId    String
  latitude  Float
  longitude Float
  city      String
  expiresAt DateTime
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
  
  @@index([userId])
}
```

### API Endpoint Specifications

#### GET /api/dating/potential-matches
**Query Parameters:**
- `cursor?: string` - Pagination cursor
- `limit?: number` - Results per page (default: 10)

**Response:**
```typescript
{
  matches: Array<{
    id: string;
    username: string;
    displayName: string;
    age: number;
    bio: string;
    photos: Array<{ url: string; isPrimary: boolean }>;
    distance: number; // in km
    musicInfo: {
      genres: string[];
      instruments: string[];
      skills: string[];
    };
    compatibilityScore?: number;
  }>;
  nextCursor: string | null;
}
```

#### POST /api/dating/decision
**Body:**
```typescript
{
  targetUserId: string;
  decision: 'LIKE' | 'DISLIKE' | 'SUPER_LIKE';
  message?: string; // Optional message for super like
}
```

**Response:**
```typescript
{
  success: boolean;
  isMatch: boolean;
  matchId?: string;
  nextMatch?: MatchProfile; // Next potential match
}
```

#### GET /api/dating/likes-you
**Response:**
```typescript
{
  users: Array<{
    id: string;
    username: string;
    displayName: string;
    age: number;
    primaryPhoto: string;
    likedAt: string; // ISO date
  }>;
}
```

### Component Specifications

#### PotentialMatchCard
**Props:**
```typescript
interface PotentialMatchCardProps {
  user: MatchProfile;
  onSwipe: (direction: 'left' | 'right' | 'up') => void;
  onSuperLike: () => void;
}
```

**Features:**
- Swipeable card (left = dislike, right = like, up = super like)
- Photo carousel
- Music info display
- Distance display
- Compatibility score (if available)

#### DecisionButtons
**Props:**
```typescript
interface DecisionButtonsProps {
  onLike: () => void;
  onDislike: () => void;
  onSuperLike: () => void;
  superLikeAvailable: boolean;
}
```

---

## Success Metrics

### User Engagement
- Daily active users in dating feature
- Swipes per user per day
- Match rate
- Message response rate
- Time spent in dating feature

### Quality Metrics
- Match quality (user feedback)
- Profile completeness rate
- Photo upload rate
- Preference completion rate

### Technical Metrics
- API response times
- Matching algorithm performance
- Database query optimization
- Mobile performance scores

---

## Timeline Estimate

- **Phase 1 (Foundation):** 2-3 weeks
- **Phase 2 (Enhanced Experience):** 2-3 weeks
- **Phase 3 (Communication & Discovery):** 2 weeks
- **Phase 4 (Music Integration):** 2 weeks
- **Phase 5 (Advanced Features):** 2-3 weeks

**Total Estimated Time:** 10-13 weeks for full implementation

---

## Next Steps

1. **Immediate Actions:**
   - Review and approve this master plan
   - Prioritize features based on user needs
   - Set up development environment
   - Create feature branches

2. **Week 1 Focus:**
   - Implement matching engine API
   - Create swipe/decision API
   - Build basic deck UI
   - Test core functionality

3. **Ongoing:**
   - Daily standups
   - Weekly progress reviews
   - User feedback collection
   - Iterative improvements

---

## Notes

- All features listed as "premium" in other apps will be **free** in Decibel Tribe
- Mobile-first design is critical - test on real devices
- Music integration is our differentiator - leverage it heavily
- Safety features are non-negotiable - implement early
- Performance is key - optimize from the start
- User feedback should drive prioritization

---

**Last Updated:** 2024
**Status:** Planning Phase
**Owner:** Development Team

