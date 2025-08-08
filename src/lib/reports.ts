export type AdminReportListItem = {
  id: string;
  reason: string;
  status: string;
  description: string | null;
  createdAt: Date;
  reporter?: { id: string; username: string } | null;
  reported?: { id: string; username: string } | null;
  post?: { id: string } | null;
  group?: { id: string; name: string } | null;
  event?: { id: string; title: string } | null;
};
