# Report Feature Implementation Plan

## Overview
The Report feature allows users to report inappropriate content (posts, messages, profiles) for review. Since you're the sole developer, this system needs to be efficient and manageable for a single admin.

## Database Schema

### 1. Report Model
```prisma
model Report {
  id          String        @id @default(cuid())
  reporterId  String        // User who made the report
  reportedId  String?       // User being reported
  postId      String?       // Post being reported
  messageId   String?       // Message being reported
  groupId     String?       // Group being reported
  eventId     String?       // Event being reported
  
  // Report details
  reason      ReportReason  // Categorized reason
  description String?       // Additional details from user
  status      ReportStatus  @default(PENDING)
  adminNotes  String?       // Internal admin notes
  
  // Metadata
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  resolvedAt  DateTime?     // When admin resolved the report
  resolvedBy  String?       // Admin who resolved it
  
  // Relations
  reporter    User          @relation("UserReports", fields: [reporterId], references: [id])
  reported    User?         @relation("ReportedUser", fields: [reportedId], references: [id])
  post        Post?         @relation(fields: [postId], references: [id])
  message     Message?      @relation(fields: [messageId], references: [id])
  group       Group?        @relation(fields: [groupId], references: [id])
  event       Event?        @relation(fields: [eventId], references: [id])
  admin       User?         @relation("AdminResolutions", fields: [resolvedBy], references: [id])
}
```

### 2. Enums
```prisma
enum ReportReason {
  HARASSMENT
  VIOLENCE
  SPAM
  INAPPROPRIATE_CONTENT
  FAKE_PROFILE
  OTHER
}

enum ReportStatus {
  PENDING
  INVESTIGATING
  RESOLVED_ACTION_TAKEN
  RESOLVED_NO_ACTION
  DISMISSED
}
```

## API Endpoints

### 1. Create Report
```typescript
POST /api/reports
{
  "type": "post" | "message" | "profile" | "group" | "event",
  "targetId": "string",
  "reason": ReportReason,
  "description": "string?"
}
```

### 2. Get Reports (Admin Only)
```typescript
GET /api/reports?status=pending&page=1&limit=20
```

### 3. Update Report Status (Admin Only)
```typescript
PATCH /api/reports/[reportId]
{
  "status": ReportStatus,
  "adminNotes": "string?",
  "action": "warn" | "suspend" | "ban" | "delete_content"
}
```

## UI Components

### 1. Report Modal
```typescript
// src/components/reports/ReportModal.tsx
interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: 'post' | 'message' | 'profile' | 'group' | 'event';
  targetId: string;
  targetData: any; // The item being reported
}
```

**Features:**
- Dropdown for report reason
- Text area for additional details
- Submit button with confirmation
- Success/error feedback

### 2. Report Button
```typescript
// src/components/reports/ReportButton.tsx
interface ReportButtonProps {
  contentType: 'post' | 'message' | 'profile' | 'group' | 'event';
  targetId: string;
  targetData: any;
  variant?: 'icon' | 'text' | 'dropdown';
}
```

**Placement:**
- Post actions menu (three dots)
- Message context menu
- Profile page (flag icon)
- Group page
- Event page

### 3. Admin Dashboard
```typescript
// src/app/(admin)/reports/page.tsx
interface ReportsPageProps {
  reports: Report[];
  filters: {
    status: ReportStatus[];
    reason: ReportReason[];
    dateRange: DateRange;
  };
}
```

**Features:**
- Filter by status, reason, date
- Bulk actions (mark as resolved, dismiss)
- Quick view of reported content
- Action buttons (warn user, suspend, ban, delete content)

## Implementation Strategy

### Phase 1: Core Reporting (Week 1)
1. **Database Setup**
   - Create Report model and enums
   - Add relations to existing models
   - Run migration

2. **API Development**
   - Create report endpoint
   - Add validation and rate limiting
   - Implement basic admin endpoints

3. **Basic UI**
   - Report modal component
   - Report button component
   - Add to posts and profiles

### Phase 2: Admin Interface (Week 2)
1. **Admin Dashboard**
   - Reports list with filters
   - Report detail view
   - Status update functionality

2. **Admin Actions**
   - User warning system
   - Content deletion
   - User suspension/banning

### Phase 3: Advanced Features (Week 3)
1. **Automation**
   - Auto-flag suspicious content
   - Rate limiting for reports
   - Duplicate report detection

2. **Analytics**
   - Report trends
   - Most reported users/content
   - Resolution time metrics

## Admin Workflow

### 1. Daily Review Process
```
1. Check pending reports (5-10 minutes)
2. Review reported content
3. Take appropriate action:
   - Dismiss false reports
   - Warn users for minor violations
   - Suspend users for serious violations
   - Delete inappropriate content
4. Update report status with notes
```

### 2. Automated Alerts
- Email notifications for new reports
- Dashboard badge for pending reports
- Weekly summary of report activity

### 3. Quick Actions
- Pre-defined responses for common violations
- Bulk actions for similar reports
- Template messages for user warnings

## Rate Limiting & Anti-Abuse

### 1. Report Limits
- Max 5 reports per user per day
- Cooldown period between reports
- Duplicate report detection

### 2. False Report Penalties
- Track users who make false reports
- Temporary suspension for report abuse
- Warning system for report spam

## Content Moderation Actions

### 1. User Actions
- **Warning**: Send message to user
- **Temporary Suspension**: 24h, 7d, 30d, permanent
- **Content Deletion**: Remove specific posts/messages
- **Profile Restrictions**: Limit profile visibility

### 2. Automated Actions
- **Auto-delete**: Obvious spam/violations
- **Auto-flag**: Suspicious content for review
- **Rate limiting**: Prevent spam reporting

## Analytics & Insights

### 1. Report Metrics
- Reports per day/week/month
- Most common violation types
- Average resolution time
- False positive rate

### 2. User Behavior
- Most reported users
- Report patterns
- Violation trends

## Implementation Priority

### High Priority (MVP)
- [ ] Report database model
- [ ] Basic report API
- [ ] Report modal UI
- [ ] Admin reports list
- [ ] Basic admin actions

### Medium Priority
- [ ] Advanced filtering
- [ ] Bulk actions
- [ ] Email notifications
- [ ] Analytics dashboard

### Low Priority
- [ ] Automated moderation
- [ ] Advanced analytics
- [ ] Mobile optimization

## File Structure
```
src/
├── app/
│   ├── api/
│   │   └── reports/
│   │       ├── route.ts
│   │       └── [reportId]/
│   │           └── route.ts
│   └── (admin)/
│       └── reports/
│           ├── page.tsx
│           └── [reportId]/
│               └── page.tsx
├── components/
│   └── reports/
│       ├── ReportModal.tsx
│       ├── ReportButton.tsx
│       ├── ReportsList.tsx
│       └── ReportDetail.tsx
└── lib/
    └── reports.ts
```

## Security Considerations

### 1. Data Protection
- Encrypt sensitive report data
- Anonymize reporter information
- Secure admin access

### 2. Privacy
- Don't expose reporter identity to reported user
- Limit report data access to admins only
- Implement data retention policies

### 3. Legal Compliance
- Store report data for legal requirements
- Implement appeal process
- Document all moderation actions

## Testing Strategy

### 1. Unit Tests
- Report creation/validation
- Admin action permissions
- Rate limiting logic

### 2. Integration Tests
- Report workflow end-to-end
- Admin dashboard functionality
- Email notification system

### 3. User Testing
- Report flow usability
- Admin interface efficiency
- Mobile responsiveness

## Future Enhancements

### 1. AI Moderation
- Content analysis for auto-flagging
- Sentiment analysis for harassment detection
- Image recognition for inappropriate content

### 2. Community Moderation
- Trusted user moderators
- Community voting on reports
- Peer review system

### 3. Advanced Analytics
- Predictive modeling for violations
- User risk scoring
- Content quality metrics

---

This implementation provides a solid foundation for content moderation while being manageable for a single developer. The modular approach allows for incremental development and easy scaling as your platform grows.
