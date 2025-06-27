"use client"

import { useState, useCallback } from "react"
import { signIn, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

interface SignInData {
  email: string
  password: string
}

interface SignUpData {
  name: string
  email: string
  password: string
  phone?: string
}

export function useAuthActions() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const signInUser = useCallback(async (data: SignInData) => {
    try {
      setIsLoading(true)
      setError("")

      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid credentials")
        return { success: false, error: "Invalid credentials" }
      } else {
        router.push("/dashboard")
        router.refresh()
        return { success: true }
      }
    } catch (error) {
      const errorMessage = "An error occurred. Please try again."
      setError(errorMessage)
      console.error("Sign in error:", error)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [router])

  const signUpUser = useCallback(async (data: SignUpData) => {
    try {
      setIsLoading(true)
      setError("")

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        router.push("/auth/signin?message=Registration successful")
        return { success: true }
      } else {
        const errorData = await response.json()
        const errorMessage = errorData.error || "Registration failed"
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }
    } catch (error) {
      const errorMessage = "An error occurred. Please try again."
      setError(errorMessage)
      console.error("Registration error:", error)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [router])

  const clearError = useCallback(() => {
    setError("")
  }, [])

  const logoutUser = useCallback(async (callbackUrl: string = "/") => {
    try {
      // Clear localStorage token
      localStorage.removeItem('temp-session-token')
      
      // Call temporary session logout API (optional, to clean up server-side)
      try {
        await fetch('/api/auth/logout-temp', {
          method: 'POST',
          credentials: 'include',
        })
      } catch (error) {
        // Ignore errors for temp logout - localStorage cleanup is primary
        console.warn('Temporary session logout failed:', error)
      }
      
      // Sign out of NextAuth session
      await signOut({ callbackUrl, redirect: true })
    } catch (error) {
      console.error('Logout error:', error)
      // Force redirect on error
      window.location.href = callbackUrl
    }
  }, [])

  return {
    isLoading,
    error,
    actions: {
      signInUser,
      signUpUser,
      logoutUser,
      clearError
    }
  }
}
