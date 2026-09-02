import { getAdminUser } from "@/lib/admin";
import { Shield, Users, Flag, TrendingUp, AlertTriangle } from "lucide-react";
import prisma from "@/lib/prisma";
import Link from "next/link";

async function getAdminStats() {
  try {
    // Get current date for "active today" calculation
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch real statistics
    const [
      totalUsers,
      activeToday,
      pendingReports,
      suspendedUsers,
      recentActivity,
    ] = await Promise.all([
      // Total users
      prisma.user.count({
        where: {
          deletedAt: null,
        },
      }),

      // Active users today (users who logged in today - using session expiration)
      prisma.session.count({
        where: {
          expiresAt: {
            gte: today,
          },
        },
      }),

      // Pending reports
      prisma.report.count({ where: { status: "PENDING" as any } }),

      // Suspended users (will be 0 until we add suspension field)
      0,

      // Recent activity (last 10 user registrations)
      prisma.user.findMany({
        where: {
          deletedAt: null,
        },
        select: {
          username: true,
          displayName: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      }),
    ]);

    return {
      stats: {
        totalUsers,
        activeToday,
        pendingReports,
        suspendedUsers,
      },
      recentActivity,
    };
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return {
      stats: {
        totalUsers: 0,
        activeToday: 0,
        pendingReports: 0,
        suspendedUsers: 0,
      },
      recentActivity: [],
    };
  }
}

export default async function AdminDashboard() {
  const admin = await getAdminUser();
  const { stats, recentActivity } = await getAdminStats();

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
      {/* Welcome Section */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Welcome back, {admin?.displayName}!
        </h1>
        <p className="text-gray-600">
          Here&apos;s what&apos;s happening on your platform today.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-lg bg-blue-100 p-2">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalUsers.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-lg bg-green-100 p-2">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Today</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.activeToday.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-lg bg-yellow-100 p-2">
              <Flag className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Pending Reports
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.pendingReports.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-lg bg-red-100 p-2">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Suspended Users
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.suspendedUsers.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Link
            href="/admin/reports"
            className="flex items-center justify-center rounded-md border border-transparent bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            <Flag className="mr-2 h-4 w-4" />
            Review Reports
          </Link>

          <a
            href="/admin/users"
            className="flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            <Users className="mr-2 h-4 w-4" />
            Manage Users
          </a>

          <a
            href="/admin/settings"
            className="flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            <Shield className="mr-2 h-4 w-4" />
            Platform Settings
          </a>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Recent Activity
        </h2>
        <div className="space-y-4">
          {recentActivity.length > 0 ? (
            recentActivity.slice(0, 5).map((user: any, index: number) => (
              <div key={user.username} className="flex items-center space-x-3">
                <div className="h-2 w-2 rounded-full bg-green-400"></div>
                <p className="text-sm text-gray-600">
                  New user <span className="font-medium">{user.username}</span>{" "}
                  joined the platform
                </p>
                <span className="text-xs text-gray-400">
                  {timeAgo(user.createdAt)}
                </span>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500">
              No recent activity to display.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
