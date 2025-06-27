"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuthActions } from "@/hooks/useAuthActions"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [urlMessage, setUrlMessage] = useState("")
  const { isLoading, error, actions: { signInUser, clearError } } = useAuthActions()
  const searchParams = useSearchParams()

  useEffect(() => {
    const message = searchParams.get('message')
    const errorParam = searchParams.get('error')
    
    if (message) {
      setUrlMessage(message)
    } else if (errorParam) {
      switch (errorParam) {
        case 'invalid-token':
          setUrlMessage('Invalid or expired claim link. Please contact an administrator.')
          break
        case 'missing-token':
          setUrlMessage('Missing claim token. Please use a valid claim link.')
          break
        case 'server-error':
          setUrlMessage('Server error occurred. Please try again later.')
          break
        default:
          setUrlMessage('An error occurred. Please try signing in.')
      }
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setUrlMessage("")
    
    const result = await signInUser({ email, password })
    if (!result.success) {
      // Error is automatically set by the hook
      console.error("Sign in failed:", result.error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {(error || urlMessage) && (
            <div className={`text-sm text-center ${error ? 'text-red-600' : 'text-green-600'}`}>
              {error || urlMessage}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </div>

          <div className="text-center">
            <Link 
              href="/auth/signup" 
              className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Don&apos;t have an account? Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
