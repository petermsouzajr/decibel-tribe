# User Account Deletion Plan

## Overview

This document outlines the implementation strategy for user account deletion in the Decibel Tribe application. The system uses **soft deletes** to mark users as deleted rather than permanently removing their data, while ensuring that deleted users' content is properly filtered throughout the application.

## Core Principles

1. **Simple Soft Delete Strategy**: Users are marked as deleted with a `deletedAt` timestamp - no complex cascading deletions
2. **Content Filtering**: Deleted users' content is filtered out rather than deleted, maintaining data integrity
3. **Grace Period**: 90-day grace period for account reactivation
4. **Industry Standard**: Follows patterns used by major platforms (GitHub, Discord, etc.)
5. **Privacy Compliance**: Ensures GDPR and other privacy regulation compliance

## Database Schema Changes

### User Model Updates

```prisma
model User {
  // ... existing fields ...
  deletedAt DateTime? // Soft delete timestamp
  
  // ... rest of existing fields ...
}
```

### Migration Strategy

1. ✅ Add `deletedAt` field to User model
2. ✅ Create database migration
3. ✅ Update Prisma client
4. ✅ Implement filtering logic across all features

## Content Handling Strategy

### 1. Posts ✅
- **Visibility**: Deleted users' posts are filtered out from feeds
- **Comments**: Deleted users' comments are hidden
- **Likes/Dislikes**: Deleted users' reactions are filtered out
- **Bookmarks**: Deleted users' bookmarks are filtered out

### 2. Events ✅
- **Event Creation**: Events created by deleted users are filtered out
- **Event Attendance**: Deleted users are filtered from attendee lists
- **Event Comments**: Comments from deleted users are hidden

### 3. Groups ✅
- **Group Membership**: Deleted users are filtered from group member lists
- **Group Posts**: Posts from deleted users in groups are hidden

### 4. Social Interactions ✅
- **Follows**: Deleted users are filtered from following/follower lists
- **Notifications**: Notifications from deleted users are hidden
- **Suggestions**: Deleted users are filtered from "Who to follow" suggestions

### 5. Messaging ✅
- **StreamChat**: User remains active in StreamChat during grace period
- **Messages**: User can still access their messages if they reactivate
- **Permanent Deletion**: StreamChat user deleted only after grace period expires

### 6. Search & Discovery ✅
- **Search Results**: Deleted users are filtered from search results
- **User Profiles**: Deleted user profiles show appropriate "deleted" state
- **User Posts**: Posts from deleted users are filtered from user profile pages

## Implementation Plan

### Phase 1: Database Schema & Core Deletion Logic ✅

1. **Database Migration** ✅
   - Add `deletedAt` field to User model
   - Create migration file
   - Update Prisma schema

2. **Core Deletion Function** ✅
   - Create `deleteUserAccount` server action
   - Implement simple soft delete logic (just mark `deletedAt`)
   - Add validation and confirmation

3. **User Interface** ✅
   - Add "Delete Account" option to user profile page
   - Create confirmation dialog with warning steps
   - Implement data export functionality

### Phase 2: Content Filtering ✅

1. **Query Modifications** ✅
   - Update all user-related queries to filter out deleted users
   - Modify feed queries to exclude deleted user content
   - Update search functionality

2. **Component Updates** ✅
   - Update user display components to handle deleted users
   - Modify post/comment components to hide deleted user content
   - Update event and group components

### Phase 3: Advanced Features ✅

1. **Grace Period** ✅
   - Implement 90-day grace period for account recovery
   - Add account reactivation functionality
   - Handle login attempts for deleted accounts

2. **Data Export**
   - Allow users to export their data before deletion
   - Implement GDPR compliance features

3. **Admin Tools**
   - Admin interface for managing deleted accounts
   - Bulk operations for content cleanup

## Implementation Approach

### Simple Soft Delete Strategy

The implementation follows industry best practices with a **simple soft delete approach**:

1. **Mark as Deleted**: Only set `deletedAt = now()` in the database
2. **Filter Content**: Use `deletedAt: null` filters in all queries
3. **No Cascading Deletions**: Don't delete related data, just filter it out
4. **Grace Period**: 90-day window for account reactivation

### Benefits of This Approach:

- ✅ **Reliable**: Simple operation, less likely to fail
- ✅ **Reversible**: Easy to reactivate within grace period  
- ✅ **Fast**: Quick database operation
- ✅ **Safe**: No data loss during deletion
- ✅ **Industry Standard**: Matches how major platforms work

### Query Pattern

All user-related queries now include:
```typescript
where: {
  // ... other conditions
  user: {
    deletedAt: null, // Filter out deleted users
  },
}
```

## API Endpoints

### New Endpoints

```
POST /api/users/delete-account
- Deletes user account (soft delete)
- Requires confirmation
- Returns success/error status

POST /api/users/reactivate-account
- Reactivates account within grace period
- Requires authentication
- Returns updated user data

GET /api/users/export-data
- Exports user's personal data
- Returns JSON file download
```

### Modified Endpoints ✅

All existing endpoints that return user data have been updated to filter out deleted users:

- ✅ `GET /api/posts/for-you` - Filters posts from deleted users
- ✅ `GET /api/posts/following` - Filters posts from deleted users
- ✅ `GET /api/search` - Filters deleted users from search results
- ✅ `GET /api/users/[userId]/posts` - Filters posts from deleted users
- ✅ `GET /api/users/following` - Filters deleted users from following list
- ✅ `GET /api/users/followed-by` - Filters deleted users from followers list
- ✅ `GET /api/events/route` - Filters deleted users from event attendees
- ✅ `GET /api/notifications/route` - Filters notifications from deleted users
- ✅ `GET /api/posts/[postId]/comments` - Filters comments from deleted users
- ✅ `GET /api/users/[username]/page` - Filters deleted user profiles
- ✅ `TrendsSidebar` - Filters deleted users from "Who to follow" suggestions

## Query Patterns

### Filtering Deleted Users

```typescript
// Example: Filtering posts to exclude deleted users
const posts = await prisma.post.findMany({
  where: {
    user: {
      deletedAt: null // Only include non-deleted users
    }
  },
  include: {
    user: {
      where: {
        deletedAt: null
      }
    }
  }
});
```

### Handling Deleted User References

```typescript
// Example: Displaying user information with fallback
const displayName = user.deletedAt ? "Deleted User" : user.displayName;
const avatarUrl = user.deletedAt ? "/default-avatar.png" : user.avatarUrl;
```

## UI/UX Considerations

### 1. User Interface Updates

- **Profile Pages**: Show "Account Deleted" for deleted users
- **Posts/Comments**: Display "[Deleted User]" instead of username
- **Search Results**: Exclude deleted users from search
- **Notifications**: Filter out notifications from deleted users

### 2. Confirmation Flow

```
1. User clicks "Delete Account"
2. Show confirmation dialog with:
   - Warning about permanent data loss
   - Option to export data first
   - Grace period information
3. Require password confirmation
4. Show final confirmation with consequences
5. Execute deletion
6. Redirect to logout
```

### 3. Error Handling

- Prevent deletion if user has pending actions
- Handle deletion failures gracefully
- Provide clear error messages
- Allow cancellation during process

## Security Considerations

### 1. Authentication
- Require password confirmation for account deletion
- Implement rate limiting on deletion attempts
- Log all deletion attempts for audit

### 2. Data Protection
- Ensure deleted data is not accessible via API
- Implement proper access controls
- Audit all data access patterns

### 3. Recovery Prevention
- Prevent unauthorized account reactivation
- Implement proper session invalidation
- Clear all user sessions on deletion

## Testing Strategy

### 1. Unit Tests
- Test deletion server action
- Test content filtering logic
- Test user interface components

### 2. Integration Tests
- Test complete deletion flow
- Test content visibility after deletion
- Test API endpoint modifications

### 3. E2E Tests
- Test full user journey
- Test edge cases and error scenarios
- Test data export functionality

## Monitoring & Analytics

### 1. Metrics to Track
- Account deletion rate
- Grace period reactivations
- Data export requests
- Deletion failure rate

### 2. Alerts
- Unusual deletion patterns
- Failed deletion attempts
- System errors during deletion

## Compliance & Legal

### 1. GDPR Compliance
- Right to be forgotten
- Data export functionality
- Clear privacy policy updates

### 2. Terms of Service
- Update terms to include deletion policy
- Clarify data retention periods
- Explain grace period terms

## Implementation Timeline

### Week 1: Foundation
- Database schema changes
- Core deletion logic
- Basic UI components

### Week 2: Content Filtering
- Update queries and components
- Test content visibility
- Fix edge cases

### Week 3: Advanced Features
- Grace period implementation
- Data export functionality
- Admin tools

### Week 4: Testing & Polish
- Comprehensive testing
- UI/UX improvements
- Documentation updates

## Risk Mitigation

### 1. Data Loss Prevention
- Implement backup strategies
- Test deletion thoroughly
- Provide data export before deletion

### 2. User Experience
- Clear communication about consequences
- Provide alternatives to deletion
- Offer account deactivation option

### 3. System Stability
- Gradual rollout
- Monitor system performance
- Have rollback procedures

## Future Enhancements

### 1. Advanced Features
- Scheduled account deletion
- Bulk data operations
- Advanced admin tools

### 2. Analytics
- Deletion reason tracking
- User feedback collection
- Retention improvement analysis

### 3. Compliance
- Additional privacy regulation support
- Enhanced data export options
- Automated compliance reporting

## Conclusion

This plan provides a comprehensive approach to implementing user account deletion while maintaining data integrity and user privacy. The soft delete strategy ensures we can recover from mistakes while the content filtering ensures deleted users' data doesn't interfere with the user experience.

The implementation should be done in phases to minimize risk and allow for proper testing at each stage. Regular monitoring and user feedback will help refine the implementation over time. 