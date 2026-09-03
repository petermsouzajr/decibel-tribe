# Dating Match Preferences - All Locations

This document lists all places in the dating app where users can set or edit their match preferences (filters for potential matches).

---

## Summary: **4 Main Locations**

There are **4 distinct places** where users can edit their dating match preferences:

1. **Dating Onboarding Flow** (`/dating/onboarding`)
2. **Dating Profile Page - Preferences Tab** (`/dating/profile` → Preferences tab)
3. **Basic Filters Panel** (Modal from Dating Deck)
4. **Advanced Filters Panel** (Modal from Settings dropdown)

---

## 1. Dating Onboarding Flow
**Route:** `/dating/onboarding`  
**Component:** `DatingOnboardingFlow.tsx`  
**When:** First-time setup when enabling dating feature  
**Access:** Via "Continue to Dating Setup" button from intro screen

### Preferences That Can Be Set:
- ✅ Preferred Gender(s) (multiple with orientations)
- ✅ Preferred Sexual Orientation(s)
- ✅ Preferred Age Range (min/max)
- ✅ Preferred Height Range (min/max)
- ✅ Preferred Max Distance
- ✅ Preferred Vaccination Status
- ✅ Preferred Religions (multiple)
- ✅ Preferred Instruments (music filter)
- ✅ Preferred Skills (music filter)
- ✅ Match Music Tastes toggle

**Note:** This is a multi-step flow that also collects user's own profile information.

---

## 2. Dating Profile Page - Preferences Tab
**Route:** `/dating/profile`  
**Component:** `DatingProfileEditor.tsx` → `DatingPreferencesForm.tsx` (Preferences tab)  
**When:** Anytime after onboarding  
**Access:** 
- Settings dropdown → "Edit Profile" → Preferences tab
- "Update Preferences" button from empty state
- Direct navigation to `/dating/profile`

### Preferences That Can Be Set:
- ✅ Preferred Gender (single, stored as JSON)
- ✅ Preferred Sexual Orientation
- ✅ Preferred Age Range (min/max)
- ✅ Preferred Height Range (min/max)
- ✅ Preferred Max Distance
- ✅ Preferred Vaccination Status
- ✅ Preferred Religions (multiple)
- ✅ Preferred Instruments (music filter)
- ✅ Preferred Skills (music filter)
- ✅ Match Music Tastes toggle

**Note:** This is the most comprehensive preferences editor. Uses `DatingPreferencesForm` component.

---

## 3. Basic Filters Panel
**Route:** Modal overlay on Dating Deck  
**Component:** `BasicFiltersPanel.tsx`  
**When:** While browsing matches  
**Access:** "Filters" button in Dating Deck header

### Preferences That Can Be Set:
- ✅ Preferred Age Range (min/max)
- ✅ Preferred Height Range (min/max)
- ✅ Preferred Max Distance
- ✅ Preferred Vaccination Status
- ✅ Preferred Religions (multiple)
- ✅ Preferred Has Kids
- ✅ Preferred Smokes
- ✅ Preferred Drinks
- ✅ Preferred Activity Level

**Note:** This is a quick filter panel focused on basic demographics. Does NOT include gender/orientation preferences or music filters.

---

## 4. Advanced Filters Panel
**Route:** Modal overlay on Dating Deck  
**Component:** `FilterPanel.tsx`  
**When:** While browsing matches  
**Access:** Settings dropdown → "Advanced Filters"

### Preferences That Can Be Set:
- ✅ Preferred Instruments (music filter)
- ✅ Preferred Skills (music filter)

**Note:** This is specifically for music-related filters only. Very focused scope.

---

## Comparison Table

| Preference | Onboarding | Profile Page | Basic Filters | Advanced Filters |
|------------|------------|-------------|---------------|------------------|
| **Gender** | ✅ Multiple | ✅ Single | ❌ | ❌ |
| **Sexual Orientation** | ✅ Multiple | ✅ | ❌ | ❌ |
| **Age Range** | ✅ | ✅ | ✅ | ❌ |
| **Height Range** | ✅ | ✅ | ✅ | ❌ |
| **Max Distance** | ✅ | ✅ | ✅ | ❌ |
| **Vaccination** | ✅ | ✅ | ✅ | ❌ |
| **Religions** | ✅ | ✅ | ✅ | ❌ |
| **Has Kids** | ❌ | ❌ | ✅ | ❌ |
| **Smokes** | ❌ | ❌ | ✅ | ❌ |
| **Drinks** | ❌ | ❌ | ✅ | ❌ |
| **Activity Level** | ❌ | ❌ | ✅ | ❌ |
| **Instruments** | ✅ | ✅ | ❌ | ✅ |
| **Skills** | ✅ | ✅ | ❌ | ✅ |
| **Match Music Tastes** | ✅ | ✅ | ❌ | ❌ |

---

## Key Observations

### Redundancy Issues:
1. **Age, Height, Distance, Vaccination, Religions** appear in 3 places (Onboarding, Profile, Basic Filters)
2. **Music filters** (Instruments/Skills) appear in 3 places (Onboarding, Profile, Advanced Filters)
3. **Gender/Orientation** only in 2 places (Onboarding, Profile) - not in Basic Filters

### Missing from Basic Filters:
- Gender preferences
- Sexual orientation preferences
- Music filters (moved to Advanced Filters)

### Missing from Profile Page:
- Has Kids preference
- Smokes preference
- Drinks preference
- Activity Level preference

### Consistency Issues:
- Basic Filters Panel has some preferences (Has Kids, Smokes, Drinks, Activity) that Profile Page doesn't have
- Profile Page has Gender/Orientation that Basic Filters doesn't have
- This creates confusion about where to find certain preferences

---

## Recommendations

### Option 1: Consolidate to Single Location
- Make Profile Page (`/dating/profile` → Preferences tab) the **single source of truth**
- Remove preferences from Basic Filters Panel (keep it as view-only or remove entirely)
- Keep Advanced Filters for quick music filter access (or move to Profile Page too)

### Option 2: Clear Separation of Concerns
- **Profile Page**: All comprehensive preferences (including Has Kids, Smokes, Drinks, Activity)
- **Basic Filters**: Quick demographic filters only (Age, Height, Distance, Vaccination, Religions)
- **Advanced Filters**: Music filters only
- **Onboarding**: Initial setup only (not for editing)

### Option 3: Unified Filter System
- Create a single, comprehensive filter panel accessible from Dating Deck
- Include ALL preferences in one place
- Remove redundancy across multiple locations

---

## Current User Flow

1. **First Time:** Onboarding → Sets all preferences
2. **Quick Changes:** Basic Filters Panel → Quick demographic adjustments
3. **Music Filters:** Advanced Filters Panel → Music-specific filters
4. **Comprehensive Edit:** Profile Page → Full preferences editor
5. **Gender/Orientation Changes:** Must use Profile Page (not in Basic Filters)

---

*Last Updated: Based on codebase analysis*

