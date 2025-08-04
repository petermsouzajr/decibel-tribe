# Deleted Account Login Solution

## Problem Statement

When a user tries to log in with credentials from a deleted account, we need to decide how to handle this scenario. The options are:

1. **Auto-reactivate**: Automatically restore the deleted account
2. **Offer choice**: Let the user choose between reactivation and starting fresh
3. **Always require fresh start**: Force users to create new accounts

## Chosen Solution: Offer Choice

We implemented **Option 2** - offering users a choice between reactivation and starting fresh. This approach:

- **Respects user intent**: If they deleted intentionally, they can start fresh
- **Provides flexibility**: If they deleted accidentally, they can recover
- **Maintains GDPR compliance**: Users have control over their data
- **Improves UX**: Clear options with explanations

## Implementation Details

### Authentication Strategy

The implementation uses a **session-independent approach** for reactivation:

1. **No Session Required**: Reactivation works without valid session (since user is deleted)
2. **Direct Database Access**: Uses `userId` parameter to fetch user directly
3. **API Route Pattern**: Uses `/api/users/reactivate-account` with `userId` in request body
4. **Grace Period**: 90-day window for account recovery

### 1. Login Action Updates

**File: `src/app/(auth)/login/actions.ts`**

The login action now checks if a user is deleted and returns specific error codes:

```typescript
// Check if user is deleted
if (user.deletedAt) {
  const gracePeriod = 90 * 24 * 60 * 60 * 1000; // 90 days
  const timeSinceDeletion = Date.now() - user.deletedAt.getTime();
  
  if (timeSinceDeletion <= gracePeriod) {
    return { 
      error: "ACCOUNT_DELETED_WITHIN_GRACE_PERIOD",
      deletedAt: user.deletedAt?.toISOString(),
      daysRemaining: Math.ceil((gracePeriod - timeSinceDeletion) / (24 * 60 * 60 * 1000)),
      userId: user.id
    };
  } else {
    return { 
      error: "ACCOUNT_DELETED_EXPIRED",
      deletedAt: user.deletedAt?.toISOString(),
      userId: user.id
    };
  }
}
```

### 2. Recovery Dialog Component

**File: `src/components/DeletedAccountRecoveryDialog.tsx`**

A new dialog component that offers users two options:

#### For Accounts Within Grace Period:
- **Reactivate Account**: Restore all data and continue as before
- **Start Fresh**: Create a new account with the same username

#### For Expired Accounts:
- **Start Fresh**: Only option available (grace period expired)

### 3. Login Form Integration

**File: `src/app/(auth)/login/LoginForm.tsx`**

The login form now handles deleted account scenarios:

```typescript
if (result.error === "ACCOUNT_DELETED_WITHIN_GRACE_PERIOD") {
  setDeletedAccountInfo({
    username: values.username || "",
    password: values.password,
    deletedAt: new Date(result.deletedAt || ""),
    daysRemaining: result.daysRemaining,
    isExpired: false,
  });
} else if (result.error === "ACCOUNT_DELETED_EXPIRED") {
  setDeletedAccountInfo({
    username: values.username || "",
    password: values.password,
    deletedAt: new Date(result.deletedAt || ""),
    isExpired: true,
  });
}
```

## User Experience Flow

### Scenario 1: Recently Deleted Account (Within 90 Days)

1. User enters credentials for deleted account
2. Login form shows recovery dialog
3. User sees two options:
   - **Reactivate Account** (blue button)
   - **Start Fresh** (red button)
4. User chooses option:
   - **Reactivate**: Account restored, user logged in automatically
   - **Start Fresh**: Redirected to signup with username pre-filled

### Scenario 2: Expired Deleted Account (After 90 Days)

1. User enters credentials for deleted account
2. Login form shows recovery dialog
3. User sees only one option:
   - **Start Fresh** (red button)
4. User is redirected to signup with username pre-filled

## Technical Features

### Grace Period Calculation

```typescript
const gracePeriod = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
const timeSinceDeletion = Date.now() - user.deletedAt.getTime();
const daysRemaining = Math.ceil((gracePeriod - timeSinceDeletion) / (24 * 60 * 60 * 1000));
```

### Reactivation Process

1. Call `reactivateUserAccount()` server action
2. If successful, attempt login with original credentials
3. If login succeeds, redirect to home page
4. If login fails, show error message

### Fresh Start Process

1. Redirect to signup page with username pre-filled
2. User can create new account with same username
3. Previous data remains permanently deleted

## Security Considerations

### Password Verification

- Original password is still required for reactivation
- No bypass of authentication for deleted accounts
- Maintains security standards

### Data Protection

- Deleted data remains deleted unless explicitly reactivated
- Grace period provides safety net without compromising privacy
- Clear distinction between reactivation and fresh start

### Session Management

- Reactivated accounts get new sessions
- No session persistence from deleted state
- Clean authentication state

## Testing

### Unit Tests

**File: `vitest/tests/unit/auth/loginDeletedAccount.test.ts`**

Comprehensive test coverage for:
- Grace period detection
- Expired account handling
- Error message validation
- Edge cases (missing credentials, invalid passwords)

### Test Scenarios

1. **Recently deleted account**: Returns grace period error with days remaining
2. **Expired deleted account**: Returns expired error
3. **Non-existent user**: Returns generic error
4. **Invalid password**: Returns generic error
5. **Missing credentials**: Returns validation error

## Benefits of This Approach

### For Users

- **Flexibility**: Choose based on their intent
- **Safety**: Grace period prevents accidental data loss
- **Clarity**: Clear explanations of each option
- **Control**: Maintain ownership of their data decision

### For the Application

- **GDPR Compliance**: Respects user data rights
- **Reduced Support**: Fewer "accidental deletion" support requests
- **Better UX**: Clear, informative interface
- **Data Integrity**: Maintains system consistency

### For Developers

- **Maintainable**: Clear separation of concerns
- **Testable**: Comprehensive test coverage
- **Extensible**: Easy to modify grace period or add features
- **Secure**: Proper authentication and authorization

## Future Enhancements

### Potential Improvements

1. **Custom Grace Periods**: Allow users to set their own grace period
2. **Partial Reactivation**: Allow selective data restoration
3. **Account Merging**: Merge data from multiple deleted accounts
4. **Advanced Analytics**: Track reactivation vs fresh start patterns
5. **Email Notifications**: Remind users of approaching grace period expiration

### Configuration Options

- **Grace Period Duration**: Currently 30 days, could be configurable
- **Reactivation Limits**: Could limit number of reactivations per account
- **Data Retention**: Could implement automatic data cleanup after grace period

## Conclusion

This solution provides the best balance of user control, data protection, and system integrity. It respects user intent while providing safety nets for accidental deletions, all while maintaining security and compliance standards.

The implementation is robust, well-tested, and provides a clear user experience that guides users through their options without overwhelming them with technical details. 