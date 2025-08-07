import { getAdminUser } from "@/lib/admin";
import { Users, Search, Filter, MoreVertical } from "lucide-react";
import prisma from "@/lib/prisma";
import LimitDropdown from "@/components/admin/LimitDropdown";
import Image from "next/image";

async function getUsers(page: number = 1, limit: number = 10) {
  try {
    const skip = (page - 1) * limit;
    
    const [users, totalUsers] = await Promise.all([
      prisma.user.findMany({
        where: {
          deletedAt: null
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          email: true,
          isVerified: true,
          isAdmin: true,
          isDatingActive: true,
          createdAt: true,
          avatarUrl: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.user.count({
        where: {
          deletedAt: null
        }
      })
    ]);

    return {
      users,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
      limit
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    return {
      users: [],
      totalUsers: 0,
      totalPages: 0,
      currentPage: page,
      limit
    };
  }
}

export default async function AdminUsers({
  searchParams,
}: {
  searchParams: { page?: string; limit?: string };
}) {
  const admin = await getAdminUser();
  
  const page = parseInt(searchParams.page || '1');
  const limit = parseInt(searchParams.limit || '10');
  
  const { users, totalUsers, totalPages, currentPage } = await getUsers(page, limit);

  // Format time ago
  function timeAgo(date: Date) {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks} weeks ago`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} months ago`;
  }

  // Get initials for avatar
  function getInitials(name: string) {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Users</h1>
            <p className="text-gray-600">Manage platform users and permissions</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <Users className="h-3 w-3 mr-1" />
              {totalUsers.toLocaleString()} Total Users
            </span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          
          <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
            <option>All Users</option>
            <option>Admins</option>
            <option>Verified</option>
            <option>Suspended</option>
          </select>
          
          <LimitDropdown currentLimit={limit} />
          
          <button className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700">
            Search
          </button>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Users</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {users.length > 0 ? (
            users.map((user) => (
              <div key={user.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {user.avatarUrl ? (
                      <Image 
                        src={user.avatarUrl} 
                        alt={user.displayName}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {getInitials(user.displayName)}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.displayName}</p>
                      <p className="text-sm text-gray-500">@{user.username} • Joined {timeAgo(user.createdAt)}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        {user.isVerified && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Verified
                          </span>
                        )}
                        {!user.isVerified && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending Verification
                          </span>
                        )}
                        {user.isAdmin && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            Admin
                          </span>
                        )}
                        {user.isDatingActive && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-pink-100 text-pink-800">
                            Dating Active
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center">
              <p className="text-gray-500">No users found.</p>
            </div>
          )}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalUsers)} of {totalUsers} users
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Previous Page */}
                {currentPage > 1 && (
                  <a
                    href={`/admin/users?page=${currentPage - 1}&limit=${limit}`}
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
                        href={`/admin/users?page=${pageNum}&limit=${limit}`}
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
                    href={`/admin/users?page=${currentPage + 1}&limit=${limit}`}
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
