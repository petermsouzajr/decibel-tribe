import { getAdminUser } from "@/lib/admin";
import { Flag, Clock, CheckCircle, XCircle } from "lucide-react";
import prisma from "@/lib/prisma";
import LimitDropdown from "@/components/admin/LimitDropdown";

async function getReports(page: number = 1, limit: number = 10) {
  try {
    const skip = (page - 1) * limit;
    const [reports, totalReports] = await Promise.all([
      prisma.report.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          reporter: { select: { username: true } },
        },
      }),
      prisma.report.count(),
    ]);
    return {
      reports,
      totalReports,
      totalPages: Math.ceil(totalReports / limit),
      currentPage: page,
      limit,
    };
  } catch (error) {
    console.error("Error fetching reports:", error);
    return {
      reports: [],
      totalReports: 0,
      totalPages: 0,
      currentPage: page,
      limit,
    };
  }
}

export default async function AdminReports(props: {
  searchParams: Promise<{ page?: string; limit?: string }>;
}) {
  const searchParams = await props.searchParams;
  const admin = await getAdminUser();

  const page = parseInt(searchParams.page || "1");
  const limit = parseInt(searchParams.limit || "10");

  const { reports, totalReports, totalPages, currentPage } = await getReports(
    page,
    limit,
  );

  // Format time ago
  function timeAgo(date: Date) {
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 1) return "just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
            <p className="text-gray-600">
              Manage user reports and content moderation
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
              <Clock className="mr-1 h-3 w-3" />
              {totalReports} Pending
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="flex items-center space-x-4">
          <select className="rounded-md border border-gray-300 px-3 py-2 text-sm">
            <option>All Status</option>
            <option>Pending</option>
            <option>Reviewed</option>
            <option>Resolved</option>
          </select>

          <select className="rounded-md border border-gray-300 px-3 py-2 text-sm">
            <option>All Types</option>
            <option>Harassment</option>
            <option>Spam</option>
            <option>Inappropriate Content</option>
            <option>Fake Profile</option>
            <option>Other</option>
          </select>

          <LimitDropdown currentLimit={limit} />

          <button className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">
            Apply Filters
          </button>
        </div>
      </div>

      {/* Reports List */}
      <div className="rounded-lg bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Reports
          </h2>
        </div>

        <div className="divide-y divide-gray-200">
          {reports.length > 0 ? (
            reports.map((report: any) => (
              <a
                href={`/admin/reports/${report.id}`}
                key={report.id}
                className="block px-6 py-4 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <Flag className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {report.reason} Report
                        </p>
                        <p className="text-sm text-gray-500">
                          Reported by{" "}
                          <span className="font-medium">
                            {report.reporter?.username ?? "unknown"}
                          </span>{" "}
                          • {timeAgo(report.createdAt)}
                        </p>
                        <p className="mt-1 text-sm text-gray-600">
                          &quot;{report.description}&quot;
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        report.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : report.status === "REVIEWED"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {report.status}
                    </span>
                  </div>
                </div>
              </a>
            ))
          ) : (
            <div className="px-6 py-8 text-center">
              <Flag className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p className="mb-2 text-gray-500">No reports found</p>
              <p className="text-sm text-gray-400">
                Reports will appear here once users start reporting content.
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {(currentPage - 1) * limit + 1} to{" "}
                {Math.min(currentPage * limit, totalReports)} of {totalReports}{" "}
                reports
              </div>

              <div className="flex items-center space-x-2">
                {/* Previous Page */}
                {currentPage > 1 && (
                  <a
                    href={`/admin/reports?page=${currentPage - 1}&limit=${limit}`}
                    className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  >
                    Previous
                  </a>
                )}

                {/* Page Numbers */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum =
                      Math.max(1, Math.min(totalPages - 4, currentPage - 2)) +
                      i;
                    if (pageNum > totalPages) return null;

                    return (
                      <a
                        key={pageNum}
                        href={`/admin/reports?page=${pageNum}&limit=${limit}`}
                        className={`rounded border px-3 py-1 text-sm ${
                          pageNum === currentPage
                            ? "border-purple-600 bg-purple-600 text-white"
                            : "border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                        }`}
                      >
                        {pageNum}
                      </a>
                    );
                  })}
                </div>

                {/* Next Page */}
                {currentPage < totalPages && (
                  <a
                    href={`/admin/reports?page=${currentPage + 1}&limit=${limit}`}
                    className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  >
                    Next
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
