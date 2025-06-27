"use client"

import { useAuth } from "@/hooks/useAuth"
import { useAuthActions } from "@/hooks/useAuthActions"
import Link from "next/link"

export function AuthButton() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const { actions } = useAuthActions()

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded w-20 h-8"></div>
  }

  if (!isAuthenticated) {
    return (
      <div className="flex space-x-2">
        <Link
          href="/auth/signin"
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
        >
          Sign In
        </Link>
        <Link
          href="/auth/signup"
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
        >
          Sign Up
        </Link>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {user?.name || user?.email}
        </span>
        {user?.role === "ADMIN" && (
          <span className="px-2 py-1 text-xs font-medium text-purple-800 bg-purple-100 rounded-full dark:bg-purple-900 dark:text-purple-300">
            Admin
          </span>
        )}
      </div>
      <button
        onClick={() => actions.logoutUser("/")}
        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
      >
        Sign Out
      </button>
    </div>
  )
}
