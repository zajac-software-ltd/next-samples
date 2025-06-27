"use client"

import { useState, useEffect, useCallback } from "react"

interface User {
  id: number
  name: string | null
  email: string
  phone: string | null
  role: "USER" | "ADMIN"
  emailVerified: string | null
  isClaimed: boolean
  claimToken: string | null   // include claim token
  claimTokenExpires: string | null
  createdAt: string
  updatedAt: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

interface UseUsersManagementProps {
  initialPage?: number
  initialLimit?: number
}

export function useUsersManagement({ 
  initialPage = 1, 
  initialLimit = 10 
}: UseUsersManagementProps = {}) {
  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    pages: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true)
      setError("")
      
      const response = await fetch(`/api/admin/users?page=${pagination.page}&limit=${pagination.limit}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch users")
      }
      
      const data = await response.json()
      setUsers(data.users)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }, [pagination.page, pagination.limit])

  const deleteUser = useCallback(async (userId: number) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        throw new Error("Failed to delete user")
      }

      // Refresh the users list
      await fetchUsers()
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete user"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [fetchUsers])

  const toggleUserRole = useCallback(async (userId: number, currentRole: string) => {
    try {
      const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN"
      
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ role: newRole })
      })

      if (!response.ok) {
        throw new Error("Failed to update user role")
      }

      // Refresh the users list
      await fetchUsers()
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update user role"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [fetchUsers])

  const goToPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }, [])

  const clearError = useCallback(() => {
    setError("")
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  return {
    users,
    pagination,
    isLoading,
    error,
    actions: {
      deleteUser,
      toggleUserRole,
      goToPage,
      clearError,
      refetch: fetchUsers
    }
  }
}
