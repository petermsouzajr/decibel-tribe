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

### 1. Create Report — DONE
```typescript
POST /api/reports
{
  "type": "post" | "message" | "profile" | "group" | "event",
  "targetId": "string",
  "reason": ReportReason,
  "description": "string?"
}
```

### 2. Get Reports (Admin Only) — DONE
```typescript
GET /api/reports?status=pending&page=1&limit=20
```

### 3. Update Report Status (Admin Only) — DONE
```typescript
PATCH /api/reports/[reportId]
{
  "status": ReportStatus,
  "adminNotes": "string?",
  "action": "warn" | "suspend" | "ban" | "delete_content"
}
```

## UI Components

### 1. Report Modal — DONE
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

### 2. Report Button — DONE
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
- Post actions menu (three dots) — IMPLEMENTED
- Message context menu — PENDING (messages model not present)
- Profile page (flag icon) — IMPLEMENTED
- Group page — IMPLEMENTED
- Event page — IMPLEMENTED

### 3. Admin Dashboard / Reports — PARTIAL
- Reports list with pagination — DONE
- Filter by status, reason, date — BASIC STATUS UI PRESENT; BACKEND READY FOR STATUS
- Report detail view — DONE
- Status update functionality — DONE (status + notes)
- Bulk actions — PENDING

## Implementation Strategy

### Phase 1: Core Reporting (Week 1) — DONE
1. **Database Setup** — DONE
   - Create Report model and enums — DONE
   - Add relations to existing models — DONE
   - Run migration — DONE (safe script, no data loss)

2. **API Development** — DONE
   - Create report endpoint — DONE
   - Add validation and rate limiting — DONE
   - Implement basic admin endpoints — DONE

3. **Basic UI** — DONE
   - Report modal component — DONE
   - Report button component — DONE
   - Add to posts and profiles — DONE
   - Add to groups and events — DONE

### Phase 2: Admin Interface (Week 2) — PARTIAL
1. **Admin Dashboard**
   - Reports list with filters — PARTIAL (basic status control available)
   - Report detail view — DONE
   - Status update functionality — DONE

2. **Admin Actions** — PARTIAL
   - User warning system — PENDING
   - Content deletion — PENDING
   - User suspension/banning — PENDING

### Phase 3: Advanced Features (Week 3) — PENDING
1. **Automation**
   - Auto-flag suspicious content — PENDING
   - Rate limiting for reports — BASIC (per-user/day) DONE
   - Duplicate report detection — PENDING

2. **Analytics** — PENDING
   - Report trends
   - Most reported users/content
   - Resolution time metrics

## Admin Workflow
- Dashboard badge for pending reports — DONE (count)
- Daily review flow — AVAILABLE via list + detail + status update

## Rate Limiting & Anti-Abuse
- Max 5 reports per user per day — DONE
- Cooldown period between reports — PENDING
- Duplicate report detection — PENDING
- False report penalties — PENDING

## Content Moderation Actions — PARTIAL
- Warning system, suspensions/bans, deletions — PENDING

## Implementation Priority

### High Priority (MVP)
- [x] Report database model
- [x] Basic report API
- [x] Report modal UI
- [x] Admin reports list
- [x] Basic admin actions

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
│   └── admin/
│       └── reports/
│           ├── page.tsx
│           └── [reportId]/
│               └── page.tsx
├── components/
│   └── reports/
│       ├── ReportModal.tsx
│       ├── ReportButton.tsx
│       ├── ReportsList.tsx (PENDING)
│       └── ReportDetail.tsx (PENDING)
└── lib/
    └── reports.ts
```

---

All MVP-level reporting tasks are complete across posts, profiles, groups, and events with admin review flows. Remaining items are enhancements (filters/bulk actions, notifications, enforcement tooling, and analytics).
