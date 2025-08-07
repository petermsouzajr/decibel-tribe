import { requireAdmin } from "@/lib/admin";
import { Shield, Users, Flag, Settings } from "lucide-react";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ensure user is admin
  await requireAdmin();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-purple-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/"
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                Back to Site
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Admin Sidebar */}
          <aside className="w-64 bg-white rounded-lg shadow-sm p-6">
            <nav className="space-y-2">
              <Link
                href="/admin"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
              >
                <Shield className="h-5 w-5" />
                <span>Dashboard</span>
              </Link>
              
              <Link
                href="/admin/reports"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
              >
                <Flag className="h-5 w-5" />
                <span>Reports</span>
              </Link>
              
              <Link
                href="/admin/users"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
              >
                <Users className="h-5 w-5" />
                <span>Users</span>
              </Link>
              
              <Link
                href="/admin/settings"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </Link>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
