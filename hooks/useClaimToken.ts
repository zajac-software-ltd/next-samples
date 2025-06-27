"use client"

import { useEffect, useState } from 'react'

interface UseClaimTokenResult {
  claimUrl: string | null
  isLoading: boolean
  error: string | null
}

export function useClaimToken(sessionToken: string | null, isTemporary: boolean): UseClaimTokenResult {
  const [claimUrl, setClaimUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Only fetch for temporary sessions with a valid session token
    if (!isTemporary || !sessionToken) {
      setClaimUrl(null)
      setIsLoading(false)
      setError(null)
      return
    }

    const fetchClaimToken = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/auth/get-claim-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionToken }),
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
  }, [sessionToken, isTemporary])

  return { claimUrl, isLoading, error }
}
