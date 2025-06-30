"use client"

import { useEffect, useState } from 'react'

interface UseClaimTokenResult {
  claimUrl: string | null
  isLoading: boolean
  error: string | null
}

export function useClaimToken(isTemporary: boolean): UseClaimTokenResult {
  const [claimUrl, setClaimUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Only fetch for temporary sessions
    if (!isTemporary) {
      setClaimUrl(null)
      setIsLoading(false)
      setError(null)
      return
    }

    const fetchClaimToken = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Server reads temp-session-token cookie
        const response = await fetch('/api/auth/get-claim-token', {
          method: 'POST',
        })

        const data = await response.json()

        if (response.ok && data.success) {
          setClaimUrl(data.claimUrl)
        } else {
          setError(data.error || 'Failed to get claim token')
          setClaimUrl(null)
        }
      } catch (err) {
        console.error('Error fetching claim token:', err)
        setError('Failed to fetch claim token')
        setClaimUrl(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchClaimToken()
  }, [isTemporary])

  return { claimUrl, isLoading, error }
}
