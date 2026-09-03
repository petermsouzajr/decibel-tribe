# Dating Like/Dislike Flow - Technical Analysis

## Overview
This document provides a detailed breakdown of the code execution flow when a user likes or dislikes someone on the dating deck, including all API calls, database operations, and UI state changes.

---

## Frontend Flow (Client-Side)

### 1. User Interaction
**File:** `src/components/dating/DatingDeck.tsx`

- User clicks **Like** button (Heart icon) → calls `handleLikeClick()` (line 194)
- User clicks **Dislike** button (X icon) → calls `handleDecision("DISLIKE")` (line 522)

### 2. Decision Handler
**File:** `src/components/dating/DatingDeck.tsx` (lines 219-296)

**Initial State:**
- Sets `processing = true` (line 224) - This triggers "Processing..." UI
- Prevents duplicate submissions via guard clause (line 221)

**API Call #1: POST `/api/dating/decision`**
- **Endpoint:** `POST /api/dating/decision`
- **Payload:** `{ targetUserId, decision: "LIKE" | "DISLIKE", message?: string }`
- **Timeout:** Uses default `kyInstance` timeout (likely 30s)
- **Response:** `{ success: boolean, isMatch: boolean, matchId?: string, swipeId: string }`

**After API Response:**
- If match: Shows celebration modal (lines 235-240)
- If like (no match): Shows toast notification (lines 241-245)

**API Call #2: GET `/api/dating/history?type=all`** (lines 248-260)
- **Purpose:** Refresh recent swipes list for undo functionality
- **Always executes** after decision API completes (even for dislikes)
- **Fetches:** Last 100 swipes with full user profile data
- **Includes:** User details, photos, dating profiles, match status
- **Timeout:** Uses default `kyInstance` timeout

**Navigation to Next Match:**
- **If matches remain in current batch:** Simply increments `currentIndex++` (line 264)
  - **This is instant** - no API call needed
- **If at end of batch AND more available:** Calls `fetchMatches(nextCursor)` (line 267)
  - **This triggers the expensive `/api/dating/potential-matches` call**
- **If no more matches:** Shows toast message (lines 270-272)

**Final State:**
- Sets `processing = false` (line 294) - Removes "Processing..." UI

### 3. UI Display
**File:** `src/components/dating/PotentialMatchCard.tsx` (lines 332-336)

- Shows "Processing..." text when `processing === true`
- Disabled buttons prevent interaction during processing

---

## Backend Flow (Server-Side)

### API Endpoint: POST `/api/dating/decision`
**File:** `src/app/api/dating/decision/route.ts`

#### Step-by-Step Execution:

**1. Authentication & Validation (lines 33-80)**
- Validates user session
- Checks user status (isVerified, isDatingActive)
- Validates request payload
- Blocks non-verified users from liking
- Validates targetUserId ≠ current userId

**2. Rate Limiting Check (lines 82-88)**
- **In-Memory Map:** `likeCounts` tracks likes per user
- **Limit:** 100 likes/hour per user
- **Note:** Unlimited dislikes
- **Potential Issue:** Rate limiting is in-memory (lost on server restart)

**3. Duplicate Check (lines 90-105)**
- **Database Query:** Checks if swipe already exists
- **Query:** `prisma.swipes.findUnique()` with compound key lookup
- **Index Used:** `fromUserId_toUserId` unique constraint

**4. Create Swipe Record (lines 107-117)**
- **Database Write:** `prisma.swipes.create()`
- **Data:** userId, targetUserId, direction, message, timestamp
- **UUID Generation:** Uses `crypto.randomUUID()`

**5. Match Detection (lines 122-197) - ONLY FOR LIKES**

If `decision === "LIKE"`:
  
  **5a. Check Reciprocal Swipe (lines 124-131)**
  - **Database Query:** `prisma.swipes.findUnique()` to check if target user already liked current user
  - **Query:** Compound key lookup on reversed user IDs
  
  **5b. If Mutual Like - Create Match (lines 133-144)**
  - **Database Write:** `prisma.matches.create()`
  - **Normalization:** Sorts user IDs to ensure consistent ordering (user1Id < user2Id)
  
  **5c. Create Stream Chat Channel (lines 148-159)**
  - **External API Call:** `streamServerClient.channel().create()`
  - **Purpose:** Set up 1-on-1 messaging channel
  - **Error Handling:** Logs error but doesn't fail match creation
  - **Potential Bottleneck:** External service call, network latency
  
  **5d. Fetch User Details (lines 162-171)**
  - **Database Queries:** Two parallel `prisma.user.findUnique()` calls
  - **Purpose:** Get display names/usernames for notifications
  - **Optimization:** Uses `Promise.all()` for parallel execution
  
  **5e. Create Notifications (lines 174-195)**
  - **Database Writes:** Two `prisma.notification.create()` calls
  - **Purpose:** Notify both users of the match
  - **Optimization:** Uses `Promise.all()` for parallel execution

**6. Return Response (lines 203-208)**
- Returns: `{ success: true, isMatch: boolean, matchId?: string, swipeId: string }`

---

## History API: GET `/api/dating/history?type=all`
**File:** `src/app/api/dating/history/route.ts`

### Purpose
Fetches recent swipe history for undo functionality.

### Execution Flow:

**1. Authentication (lines 7-23)**
- Validates user session
- Checks dating active status

**2. Query Swipes (lines 40-65)**
- **Database Query:** `prisma.swipes.findMany()`
- **Filter:** All swipes from current user
- **Includes:** 
  - Full target user object
  - User's dating profile
  - Primary photo
- **Limit:** Last 100 swipes
- **Order:** Most recent first

**3. Check Match Status (lines 68-74)**
- **Database Query:** `prisma.matches.findMany()`
- **Purpose:** Determine which swipes can be unliked (not matched)
- **Filters:** All matches involving current user

**4. Format Response (lines 77-99)**
- Maps swipes with user data
- Calculates `canUnlike` flag based on:
  - Direction must be "LIKE"
  - Must not be matched
  - Must be within 3-hour window

**5. Return Response (line 101)**
- Returns: `{ swipes: Array<FormattedSwipe> }`

---

## Performance Bottlenecks & Issues

### 🔴 **CRITICAL ISSUE: Sequential API Calls**

**Problem:** After recording decision, the code **ALWAYS** makes a second API call to refresh swipe history, even when not needed.

**Location:** `DatingDeck.tsx` lines 248-260

```typescript
// This ALWAYS executes after decision API
const swipeResponse = await kyInstance
  .get("/api/dating/history?type=all")
  .json<{ swipes: Array<...> }>()
  .catch(() => ({ swipes: [] }));
```

**Impact:**
- **For LIKES:** Decision API (200-500ms) + History API (300-800ms) = **500-1300ms total delay**
- **For DISLIKES:** Same delay, even though undo functionality isn't needed for dislikes
- **User Experience:** "Processing..." visible for 1-2 seconds even when next match is already loaded

**Solution Options:**
1. **Make history refresh conditional:** Only fetch if user is near end of swipe list
2. **Make history refresh async:** Don't await it, let it run in background
3. **Optimize history API:** Remove unnecessary data fetching, use lighter query
4. **Remove for dislikes:** Only fetch history after likes (since dislikes can't be undone)

### 🟡 **MODERATE ISSUE: Stream Chat Channel Creation**

**Problem:** When match occurs, Stream Chat channel creation is synchronous and can add 200-500ms delay.

**Location:** `decision/route.ts` lines 148-159

**Impact:**
- Adds latency to match detection flow
- Currently has error handling but still blocks response

**Solution Options:**
1. **Make async:** Create channel asynchronously after returning match response
2. **Lazy creation:** Create channel only when first message is sent
3. **Optimize:** Use faster Stream Chat API method if available

### 🟡 **MODERATE ISSUE: History API Over-fetching**

**Problem:** History API fetches full user profiles, photos, and dating profiles for ALL 100 swipes, even though only last 10 are used.

**Location:** `history/route.ts` lines 40-65

**Impact:**
- Unnecessary data transfer
- Slower query execution
- Higher database load

**Solution Options:**
1. **Limit to 10:** Only fetch last 10 swipes needed for undo
2. **Lighter query:** Remove unnecessary includes (photos, dating profiles)
3. **Pagination:** Fetch on-demand when user scrolls history

### 🟢 **MINOR ISSUE: Next Match Loading**

**Problem:** When reaching end of batch, `fetchMatches()` is called which triggers expensive `/api/dating/potential-matches` call.

**Location:** `DatingDeck.tsx` line 267

**Impact:**
- Can take 5-60 seconds depending on database load
- User sees loading state while fetching

**Note:** This is expected behavior, but could be optimized with:
- Prefetching next batch when 3-5 matches remain
- Progressive loading indicator

### 🟢 **MINOR ISSUE: Rate Limiting is In-Memory**

**Problem:** Rate limiting uses in-memory Map, resets on server restart.

**Location:** `decision/route.ts` lines 9-29

**Impact:**
- Not persistent across server restarts
- Doesn't work in multi-instance deployments
- Users could bypass limits by waiting for restart

**Solution:** Move to Redis or database-backed rate limiting

---

## Current Execution Timeline (LIKE Flow)

### Optimistic Path (No Match):
1. **User clicks Like** → 0ms
2. **setProcessing(true)** → 0ms
3. **POST /api/dating/decision** → 200-500ms
   - Auth check
   - Rate limit check
   - Duplicate check
   - Create swipe
   - Check reciprocal swipe
   - Return response
4. **GET /api/dating/history** → 300-800ms
   - Fetch 100 swipes
   - Fetch matches
   - Format response
5. **Increment currentIndex** → 0ms (if matches available)
6. **setProcessing(false)** → 0ms
7. **Total:** **500-1300ms** before next card shows

### Match Path:
1. **User clicks Like** → 0ms
2. **setProcessing(true)** → 0ms
3. **POST /api/dating/decision** → 500-1500ms
   - All optimistic path steps
   - Plus: Create match
   - Plus: Create Stream Chat channel (200-500ms)
   - Plus: Create notifications
4. **GET /api/dating/history** → 300-800ms
5. **Show match celebration** → 0ms
6. **setProcessing(false)** → 0ms
7. **Total:** **800-2300ms** before next action

---

## Recommended Optimizations

### Priority 1: Remove Unnecessary History Fetch
**Impact:** High | **Effort:** Low

Make history fetch conditional or async:
- Only fetch if undo button is visible
- Or fetch asynchronously (don't await)
- Or skip entirely for dislikes

### Priority 2: Optimize History API
**Impact:** Medium | **Effort:** Low

Reduce data fetched:
- Limit to 10 swipes instead of 100
- Remove unnecessary includes (photos, full profiles)
- Only fetch minimal data needed for undo

### Priority 3: Async Stream Chat Channel Creation
**Impact:** Medium | **Effort:** Medium

Don't block match response on channel creation:
- Return match response immediately
- Create channel asynchronously
- Or create lazily on first message

### Priority 4: Prefetch Next Batch
**Impact:** Low | **Effort:** Medium

Start loading next batch when 3-5 matches remain:
- Improves perceived performance
- Seamless transition between batches

---

## Code Locations Summary

### Frontend
- **Main Component:** `src/components/dating/DatingDeck.tsx`
  - `handleLikeClick()` - line 194
  - `handleDecision()` - line 219
  - `fetchMatches()` - line 85
- **Card Component:** `src/components/dating/PotentialMatchCard.tsx`
  - Processing UI - line 332

### Backend APIs
- **Decision Endpoint:** `src/app/api/dating/decision/route.ts`
- **History Endpoint:** `src/app/api/dating/history/route.ts`
- **Potential Matches Endpoint:** `src/app/api/dating/potential-matches/route.ts` (called when batch runs out)

### Database Models
- `swipes` table - stores like/dislike decisions
- `matches` table - stores mutual likes
- `notifications` table - stores match notifications

---

## Testing Recommendations

1. **Measure actual API response times** in production
2. **Monitor database query performance** for:
   - Swipe creation
   - Reciprocal swipe lookup
   - History fetch
3. **Track user experience metrics:**
   - Time from click to next card
   - Percentage of users experiencing delays
4. **Load test** the decision endpoint under high concurrency

---

*Last Updated: Based on codebase analysis as of current date*

