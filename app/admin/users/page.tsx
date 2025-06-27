"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useUsersManagement } from "@/hooks/useUsersManagement"
import { InviteUserModal } from "@/components/InviteUserModal"

export default function AdminUsersPage() {
  const [showInviteModal, setShowInviteModal] = useState(false)
  const {
    users,
    pagination,
    isLoading,
    error,
    actions: { deleteUser, toggleUserRole, goToPage, clearError, refetch }
  } = useUsersManagement()

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user?")) {
      return
    }

    const result = await deleteUser(userId)
    if (!result.success) {
      // Error is automatically set by the hook
      console.error("Delete failed:", result.error)
    }
  }

  const handleToggleUserRole = async (userId: number, currentRole: string) => {
    const result = await toggleUserRole(userId, currentRole)
    if (!result.success) {
      // Error is automatically set by the hook
      console.error("Role toggle failed:", result.error)
    }
  }

  const handleUserInvited = () => {
    refetch()
  }

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            User Management
          </h1>

          {error && (
            <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-300">
              <div className="flex justify-between items-center">
                <span>{error}</span>
                <button
                  onClick={clearError}
                  className="text-red-500 hover:text-red-700 ml-4"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  All Users ({pagination.total})
                </h2>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Invite User
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading users...</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Joined
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Claim Link
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {user.name || "No name"}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {user.email}
                                </div>
                                {user.phone && (
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {user.phone}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              user.role === "ADMIN"
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {user.isClaimed ? (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                Active
                              </span>
                            ) : user.claimTokenExpires && new Date(user.claimTokenExpires) > new Date() ? (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                                Pending
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                                Expired
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleToggleUserRole(user.id, user.role)}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                            >
                              Toggle Role
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Delete
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {!user.isClaimed && user.claimToken && user.claimTokenExpires && new Date(user.claimTokenExpires) > new Date() ? (
                              <button
                                onClick={() => {
                                  const link = `${window.location.origin}/auth/claim?token=${user.claimToken}`;
                                  navigator.clipboard.writeText(link);
                                  alert('Claim link copied to clipboard');
                                }}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                Copy Link
                              </button>
                            ) : (
                              '-'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        Showing page {pagination.page} of {pagination.pages}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => goToPage(Math.max(1, pagination.page - 1))}
                          disabled={pagination.page === 1}
                          className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => goToPage(Math.min(pagination.pages, pagination.page + 1))}
                          disabled={pagination.page === pagination.pages}
                          className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <InviteUserModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onUserInvited={handleUserInvited}
      />
    </ProtectedRoute>
  )
}
