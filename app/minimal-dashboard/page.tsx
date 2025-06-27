"use client"

import { useAuth } from "@/hooks/useAuth"

export default function MinimalDashboardPage() {
  const { user, isLoading, isAuthenticated, isTemporary } = useAuth()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!isAuthenticated) {
    return <div>Not authenticated - but no automatic redirect</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Minimal Dashboard</h1>
      <div className="space-y-2">
        <p>✅ You are authenticated!</p>
        <p>🔗 Session type: {isTemporary ? 'Temporary' : 'Full'}</p>
        <p>👤 User: {user?.email}</p>
      </div>
    </div>
  )
}
