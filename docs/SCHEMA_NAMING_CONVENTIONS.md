# Schema Naming Conventions

## Current State

The Prisma schema has **inconsistent naming conventions**:

### PascalCase Models (Most Common)
- `User`, `Group`, `Post`, `Comment`, `Report`, `Event`, `Notification`, etc.
- These map to snake_case tables via `@@map()`:
  - `User` → `users`
  - `Post` → `posts`
  - `Comment` → `comments`
  - `Report` → `reports`
  - `Event` → `events`
  - `Notification` → `notifications`

### Snake_case Models (Dating Tables)
- `user_dating_profile`
- `user_dating_preferences`
- `user_dating_identity_verification`
- `user_photos`
- `matches` (lowercase)
- `swipes` (lowercase)

These were added later and use a different convention.

### Mixed Conventions
- `UserPreferences` (PascalCase model) → `user_preferences` (snake_case table)
- `CommentLike` (PascalCase model) → `comment_likes` (snake_case table)
- `EventAttendee` (PascalCase model) → `event_attendees` (snake_case table)

## Why the Inconsistency?

The dating tables (`user_dating_*`) were likely added later in development and used snake_case to match PostgreSQL conventions more directly. However, this creates inconsistency with the rest of the schema.

## Recommendation

### Option 1: Keep Current Convention (Recommended for Now)
- **Pros**: No migration needed, no breaking changes
- **Cons**: Inconsistent naming
- **Action**: Document the convention and use it consistently going forward

### Option 2: Standardize to PascalCase (Future Refactor)
- **Pros**: Consistent with Prisma/TypeScript conventions
- **Cons**: Requires migration, breaking changes, updates to all code references
- **Action**: Would need to:
  1. Rename models: `user_dating_profile` → `UserDatingProfile`
  2. Update all TypeScript code references
  3. Create migration to rename database tables
  4. Update seed files
  5. Update all API routes and components

### Option 3: Standardize to Snake_case (Not Recommended)
- **Pros**: Matches PostgreSQL conventions
- **Cons**: Goes against Prisma/TypeScript conventions, would require renaming most models
- **Action**: Would require massive refactoring

## Current Field Naming

- **PascalCase fields**: Most common (`displayName`, `createdAt`, `userId`)
- **camelCase fields**: Some fields (`isVerified`, `isDatingActive`)
- **snake_case fields**: None in models (only in table names via `@@map`)

## Recent Change

- `user_dating_identity_verification.isVerified` → `isIDVerified`
  - Changed to avoid confusion with `User.isVerified` (email verification)
  - Makes it clear this is ID verification, not email verification

## Best Practice Going Forward

1. **New models**: Use PascalCase (e.g., `UserDatingProfile` instead of `user_dating_profile`)
2. **New fields**: Use camelCase (e.g., `isIDVerified`, `createdAt`)
3. **Table names**: Use snake_case via `@@map()` (e.g., `@@map("user_dating_profiles")`)
4. **Consistency**: Match existing patterns in the same feature area

## Migration Path (If Standardizing)

If we decide to standardize dating tables to PascalCase in the future:

```prisma
// Before
model user_dating_profile {
  // ...
}

// After
model UserDatingProfile {
  // ...
  @@map("user_dating_profiles")
}
```

This would require:
1. Schema changes
2. Code updates (all `user_dating_profile` → `UserDatingProfile`)
3. Database migration (rename tables)
4. Seed file updates
5. Test updates

## Conclusion

The inconsistency exists because dating tables were added later with a different convention. For now, we'll document it and consider standardization as a future refactor if it becomes a maintenance issue.
