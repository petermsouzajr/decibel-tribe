import { requireAdmin } from "@/lib/admin";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function ReportDetail(props: {
  params: Promise<{ reportId: string }>;
}) {
  const params = await props.params;
  await requireAdmin();
  const report = await prisma.report.findUnique({
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
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">
          Report #{report.id}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Status:{" "}
          <span className="font-semibold text-gray-900">{report.status}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 rounded-lg bg-white p-6 shadow-sm lg:col-span-2">
          <div>
            <h2 className="mb-2 font-semibold text-gray-900">Reason</h2>
            <p className="text-gray-900">{report.reason}</p>
          </div>
          <div>
            <h2 className="mb-2 font-semibold text-gray-900">Description</h2>
            <p className="whitespace-pre-wrap text-gray-900">
              {report.description || "—"}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <h2 className="mb-2 font-semibold text-gray-900">Reporter</h2>
              <p className="text-gray-900">@{report.reporter?.username}</p>
            </div>
            {report.reported && (
              <div>
                <h2 className="mb-2 font-semibold text-gray-900">
                  Reported User
                </h2>
                <p className="text-gray-900">@{report.reported?.username}</p>
              </div>
            )}
          </div>
        </div>
        <div className="space-y-4 rounded-lg bg-white p-6 shadow-sm">
          <form
            action={`/api/reports/${report.id}`}
            method="post"
            className="space-y-3"
          >
            <input type="hidden" name="_method" value="PATCH" />
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-900">
                Update Status
              </label>
              <select name="status" className="w-full rounded border px-3 py-2">
                <option value="PENDING">Pending</option>
                <option value="INVESTIGATING">Investigating</option>
                <option value="RESOLVED_ACTION_TAKEN">
                  Resolved - Action Taken
                </option>
                <option value="RESOLVED_NO_ACTION">Resolved - No Action</option>
                <option value="DISMISSED">Dismissed</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-900">
                Admin Notes
              </label>
              <textarea
                name="adminNotes"
                className="min-h-[100px] w-full rounded border px-3 py-2"
                defaultValue={report.adminNotes || ""}
              />
            </div>
            <button
              type="submit"
              className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
            >
              Save
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
