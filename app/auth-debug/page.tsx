"use client"

import { useAuth } from "@/hooks/useAuth"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"

export default function AuthDebugPage() {
  const { user, isLoading, isAuthenticated, isTemporary, authType, status } = useAuth()
  const { data: nextAuthSession, status: nextAuthStatus } = useSession()
  const [localStorageToken, setLocalStorageToken] = useState<string | null>(null)

  useEffect(() => {
    // Check localStorage token
    const token = localStorage.getItem('temp-session-token')
    setLocalStorageToken(token)
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">useAuth Hook</h2>
          <div className="space-y-2 text-sm">
            <p><strong>isLoading:</strong> {isLoading.toString()}</p>
            <p><strong>isAuthenticated:</strong> {isAuthenticated.toString()}</p>
            <p><strong>isTemporary:</strong> {isTemporary.toString()}</p>
            <p><strong>authType:</strong> {authType}</p>
            <p><strong>status:</strong> {status}</p>
            <p><strong>user:</strong> {user ? JSON.stringify(user, null, 2) : 'null'}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">NextAuth Session</h2>
          <div className="space-y-2 text-sm">
            <p><strong>status:</strong> {nextAuthStatus}</p>
            <p><strong>session:</strong> {nextAuthSession ? JSON.stringify(nextAuthSession, null, 2) : 'null'}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">localStorage</h2>
          <div className="space-y-2 text-sm">
            <p><strong>temp-session-token:</strong></p>
            <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs overflow-auto">
              {localStorageToken || 'null'}
            </pre>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Navigation Test</h2>
          <div className="space-y-2">
            <a href="/dashboard" className="block text-blue-600 hover:underline">
              Go to Dashboard (should work with temp session)
            </a>
            <a href="/admin/users" className="block text-blue-600 hover:underline">
              Go to Admin (should require credentials)
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
