import { requireAdmin } from "@/lib/admin";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function ReportDetail({ params }: { params: { reportId: string } }) {
  await requireAdmin();
  const report = await (prisma as any).report.findUnique({
    where: { id: params.reportId },
    include: {
      reporter: { select: { id: true, username: true } },
      reported: { select: { id: true, username: true } },
      post: { select: { id: true } },
      group: { select: { id: true, name: true } },
      event: { select: { id: true, title: true } },
    },
  });
  if (!report) return notFound();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">Report #{report.id}</h1>
        <p className="text-sm text-gray-500 mt-1">Status: <span className="font-semibold text-gray-900">{report.status}</span></p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2 space-y-4">
          <div>
            <h2 className="font-semibold mb-2 text-gray-900">Reason</h2>
            <p className="text-gray-900">{report.reason}</p>
          </div>
          <div>
            <h2 className="font-semibold mb-2 text-gray-900">Description</h2>
            <p className="whitespace-pre-wrap text-gray-900">{report.description || '—'}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h2 className="font-semibold mb-2 text-gray-900">Reporter</h2>
              <p className="text-gray-900">@{report.reporter?.username}</p>
            </div>
            {report.reported && (
              <div>
                <h2 className="font-semibold mb-2 text-gray-900">Reported User</h2>
                <p className="text-gray-900">@{report.reported?.username}</p>
              </div>
            )}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <form action={`/api/reports/${report.id}`} method="post" className="space-y-3">
            <input type="hidden" name="_method" value="PATCH" />
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900">Update Status</label>
              <select name="status" className="w-full border rounded px-3 py-2">
                <option value="PENDING">Pending</option>
                <option value="INVESTIGATING">Investigating</option>
                <option value="RESOLVED_ACTION_TAKEN">Resolved - Action Taken</option>
                <option value="RESOLVED_NO_ACTION">Resolved - No Action</option>
                <option value="DISMISSED">Dismissed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900">Admin Notes</label>
              <textarea name="adminNotes" className="w-full border rounded px-3 py-2 min-h-[100px]" defaultValue={report.adminNotes || ''} />
            </div>
            <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700">Save</button>
          </form>
        </div>
      </div>
    </div>
  );
}
