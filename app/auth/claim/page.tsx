'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; 
import { Label } from '@/components/ui/label';  
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface ClaimData {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    claimTokenExpires: string;
  };
}

export default function ClaimAccountPage() {
  const [isValidating, setIsValidating] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [claimData, setClaimData] = useState<ClaimData | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    const validateTokenAsync = async () => {
      try {
        const response = await fetch(`/api/auth/claim?token=${token}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Invalid claim token');
          return;
        }

        setClaimData(data);
      } catch {
        setError('Failed to validate claim token');
      } finally {
        setIsValidating(false);
      }
    };

    if (!token) {
      setError('No claim token provided');
      setIsValidating(false);
      return;
    }

    validateTokenAsync();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to claim account');
        return;
      }

      setSuccess(true);
      
      // Auto-login the user with their new credentials
      if (data.autoLogin) {
        console.log('Auto-login data received:', { email: data.autoLogin.email });
        setTimeout(async () => {
          console.log('Attempting auto-login...');
          const signInResult = await signIn('credentials', {
            email: data.autoLogin.email,
            password: data.autoLogin.password,
            redirect: false,
          });

          console.log('SignIn result:', signInResult);

          if (signInResult?.ok) {
            console.log('Auto-login successful, redirecting to dashboard');
            // Clear any existing temp session since we're now fully authenticated
            localStorage.removeItem('temp-session-token');
            router.push('/dashboard?message=Welcome! Your account has been claimed successfully.');
          } else {
            console.log('Auto-login failed, redirecting to manual sign-in');
            // If auto-login fails, fall back to manual sign-in
            router.push('/auth/signin?message=Account claimed successfully. Please sign in.');
          }
        }, 1500);
      } else {
        console.log('No auto-login data received, using fallback');
        // Fallback if no auto-login data
        setTimeout(() => {
          router.push('/auth/signin?message=Account claimed successfully. Please sign in.');
        }, 2000);
      }

    } catch {
      setError('Failed to claim account');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidating) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Validating claim token...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !claimData) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Claim Link</CardTitle>
            <CardDescription>
              This claim link is invalid, expired, or has already been used.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button 
              className="w-full mt-4" 
              onClick={() => router.push('/auth/signin')}
            >
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Account Claimed Successfully!</CardTitle>
            <CardDescription>
              Your account has been set up. Logging you in automatically...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-gray-600">Signing you in...</span>
            </div>
            <Alert className="mt-4">
              <AlertDescription>
                Welcome {claimData?.user.name}! Your account is now active.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Claim Your Account</CardTitle>
          <CardDescription>
            Set up your password to complete account setup
          </CardDescription>
        </CardHeader>
        <CardContent>
          {claimData && (
            <div className="mb-4 p-3 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>Name:</strong> {claimData.user.name}
              </p>
              <p className="text-sm">
                <strong>Email:</strong> {claimData.user.email}
              </p>
              <p className="text-sm">
                <strong>Role:</strong> {claimData.user.role}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Expires:</strong> {new Date(claimData.user.claimTokenExpires).toLocaleString()}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                minLength={6}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/auth/continue?token=${token}`)}
                disabled={isSubmitting}
              >
                Continue Without Claiming
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Claiming Account...
                  </>
                ) : (
                  'Claim Account'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
