"use client"

import { signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ContinueSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleContinueSession = async () => {
      // Ensure any existing user session is cleared
      await signOut({ redirect: false });
      // Clear any existing temporary session
      await fetch('/api/auth/logout-temp', { method: 'POST', credentials: 'include' });

      try {
        const token = searchParams.get('token');
        if (!token) {
          setError('No token provided');
          return;
        }

        // Call the continue API
        const response = await fetch(`/api/auth/continue?token=${token}`, {
          credentials: 'include',
        });
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Authentication failed');
          return;
        }

        if (data.success) {
        // Cookie has been set server-side; redirect to dashboard
          router.push('/dashboard');
        } else {
          setError(data.error || 'Invalid response from server');
        }
      } catch (err) {
        console.error('Continue session error:', err);
        setError('An error occurred while setting up your session');
      } finally {
        setLoading(false);
      }
    };

    handleContinueSession();
  }, [searchParams, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Setting up your session...
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Please wait while we prepare your temporary access.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Authentication Error
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error}
          </p>
          <div className="space-y-3">
            <a
              href="/auth/signin"
              className="block w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Go to Sign In
            </a>
            <Link
              href="/"
              className="block w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium rounded-lg transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
