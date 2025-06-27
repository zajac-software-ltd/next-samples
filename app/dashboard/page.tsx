"use client"

import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useAuth } from "@/hooks/useAuth"
import { useClaimToken } from "@/hooks/useClaimToken"

export default function DashboardPage() {
  const { user, isTemporary, session } = useAuth()
  
  // Get the current session token for temporary sessions
  const sessionToken = typeof window !== 'undefined' ? localStorage.getItem('temp-session-token') : null
  const { claimUrl, isLoading: isLoadingClaimUrl } = useClaimToken(sessionToken, isTemporary)

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Dashboard
          </h1>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* User Info Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Your Profile
              </h2>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Name:</span> {user?.name || "Not set"}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Email:</span> {user?.email}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Role:</span> 
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                    user?.role === "ADMIN" 
                      ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                  }`}>
                    {user?.role}
                  </span>
                </p>
                {session?.isTemporary && (
                  <p className="text-sm">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                      ⏰ Temporary Session (expires: {session.expiresAt ? new Date(session.expiresAt).toLocaleTimeString() : '1 hour'})
                    </span>
                  </p>
                )}
                {session?.authType && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Auth Type:</span> 
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      session.authType === 'credentials'
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                        : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
                    }`}>
                      {session.authType === 'credentials' ? 'Password' : 'Token Link'}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h2>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded">
                  Edit Profile
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded">
                  Change Password
                </button>
                {user?.role === "ADMIN" && (
                  <button className="w-full text-left px-3 py-2 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded">
                    Admin Panel
                  </button>
                )}
              </div>
            </div>

            {/* Stats Card (placeholder) */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Statistics
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Last Login</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Today</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Account Status</span>
                  <span className="text-sm font-medium text-green-600">Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Recent Activity
              </h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-400 text-center">
                No recent activity to show.
              </p>
            </div>
          </div>            {/* Claim Account Card - only show for temporary sessions */}
            {session?.isTemporary && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg shadow p-6 border border-yellow-200 dark:border-yellow-700 mt-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="mr-2">🔑</span>
                Claim Your Account
              </h2>                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  You&apos;re using a temporary session that will expire in 1 hour. Claim your account to set a permanent password and get full access.
                </p>
              <div className="space-y-2">
                {isLoadingClaimUrl ? (
                  <div className="block w-full text-center px-4 py-2 bg-gray-400 text-white text-sm font-medium rounded">
                    Loading claim link...
                  </div>
                ) : claimUrl ? (
                  <a 
                    href={claimUrl}
                    className="block w-full text-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded transition-colors"
                  >
                    Claim Account & Set Password
                  </a>
                ) : (
                  <div className="block w-full text-center px-4 py-2 bg-gray-400 text-white text-sm font-medium rounded">
                    Claim link unavailable
                  </div>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  After claiming, you can login with your email and password
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
