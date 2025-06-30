"use client"

import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: "USER" | "ADMIN"
  fallback?: React.ReactNode
}

export function ProtectedRoute({ 
  children, 
  requiredRole,
  fallback 
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated, isTemporary } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Only redirect if we're definitely not loading and not authenticated
    // This prevents premature redirects while checking localStorage tokens
    if (!isLoading && !isAuthenticated && !isTemporary) {
      // Small delay to ensure localStorage check is complete
      const timer = setTimeout(() => {
        router.push("/auth/signin")
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [isLoading, isAuthenticated, isTemporary, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Redirecting to sign in...</p>
        </div>
      </div>
    )
  }

  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <h1 className="text-6xl font-bold text-gray-900 dark:text-white">403</h1>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              Access Denied
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              You don&apos;t have permission to access this resource.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
