import { getAdminUser } from "@/lib/admin";
import { Flag, Clock, CheckCircle, XCircle } from "lucide-react";
import prisma from "@/lib/prisma";
import LimitDropdown from "@/components/admin/LimitDropdown";

async function getReports(page: number = 1, limit: number = 10) {
  try {
    // For now, return empty array since Report model doesn't exist yet
    // This will be updated when we implement the Report feature
    return {
      reports: [],
      totalReports: 0,
      totalPages: 0,
      currentPage: page,
      limit
    };
  } catch (error) {
    console.error("Error fetching reports:", error);
    return {
      reports: [],
      totalReports: 0,
      totalPages: 0,
      currentPage: page,
      limit
    };
  }
}

export default async function AdminReports({
  searchParams,
}: {
  searchParams: { page?: string; limit?: string };
}) {
  const admin = await getAdminUser();
  
  const page = parseInt(searchParams.page || '1');
  const limit = parseInt(searchParams.limit || '10');
  
  const { reports, totalReports, totalPages, currentPage } = await getReports(page, limit);

  // Format time ago
  function timeAgo(date: Date) {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
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
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
            <p className="text-gray-600">Manage user reports and content moderation</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              <Clock className="h-3 w-3 mr-1" />
              {totalReports} Pending
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-4">
          <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
            <option>All Status</option>
            <option>Pending</option>
            <option>Reviewed</option>
            <option>Resolved</option>
          </select>
          
          <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
            <option>All Types</option>
            <option>Harassment</option>
            <option>Spam</option>
            <option>Inappropriate Content</option>
            <option>Fake Profile</option>
            <option>Other</option>
          </select>
          
          <LimitDropdown currentLimit={limit} />
          
          <button className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700">
            Apply Filters
          </button>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Reports</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {reports.length > 0 ? (
            reports.map((report: any) => (
              <div key={report.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <Flag className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {report.reason} Report
                        </p>
                        <p className="text-sm text-gray-500">
                          Reported by <span className="font-medium">{report.reporterUsername}</span> • {timeAgo(report.createdAt)}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                            &quot;{report.description}&quot;
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      report.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      report.status === 'REVIEWED' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {report.status}
                    </span>
                    
                    <div className="flex space-x-1">
                      <button className="p-1 text-green-600 hover:bg-green-50 rounded">
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-red-600 hover:bg-red-50 rounded">
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center">
              <Flag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No reports found</p>
              <p className="text-sm text-gray-400">
                Reports will appear here once users start reporting content.
              </p>
            </div>
          )}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalReports)} of {totalReports} reports
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Previous Page */}
                {currentPage > 1 && (
                  <a
                    href={`/admin/reports?page=${currentPage - 1}&limit=${limit}`}
                    className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Previous
                  </a>
                )}
                
                {/* Page Numbers */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    if (pageNum > totalPages) return null;
                    
                    return (
                      <a
                        key={pageNum}
                        href={`/admin/reports?page=${pageNum}&limit=${limit}`}
                        className={`px-3 py-1 text-sm border rounded ${
                          pageNum === currentPage
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'text-gray-500 hover:text-gray-700 border-gray-300 hover:bg-gray-50'
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
                    className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
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
