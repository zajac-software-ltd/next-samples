'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Copy, Check } from 'lucide-react';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserInvited: () => void;
}

interface InviteResponse {
  message: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  claimLink: string;
  expiresAt: string;
}

export function InviteUserModal({ isOpen, onClose, onUserInvited }: InviteUserModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'USER' as 'USER' | 'ADMIN',
  });
  const [error, setError] = useState('');
  const [inviteResult, setInviteResult] = useState<InviteResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to invite user');
        return;
      }

      setInviteResult(data);
      onUserInvited();

    } catch {
      setError('Failed to invite user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = async () => {
    if (inviteResult?.claimLink) {
      try {
        await navigator.clipboard.writeText(inviteResult.claimLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Fallback for browsers that don't support clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = inviteResult.claimLink;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const handleClose = () => {
    setFormData({ name: '', email: '', role: 'USER' });
    setError('');
    setInviteResult(null);
    setCopied(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {inviteResult ? 'User Invited Successfully' : 'Invite New User'}
                </CardTitle>
                <CardDescription>
                  {inviteResult 
                    ? 'Share the claim link below with the new user'
                    : 'Create a new user account and generate a claim link'
                  }
                </CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {inviteResult ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h3 className="font-medium text-green-900 dark:text-green-100 mb-2">
                    Invitation Created
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    <strong>Name:</strong> {inviteResult.user.name}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    <strong>Email:</strong> {inviteResult.user.email}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    <strong>Role:</strong> {inviteResult.user.role}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    <strong>Expires:</strong> {new Date(inviteResult.expiresAt).toLocaleString()}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="claimLink">Claim Link</Label>
                  <div className="flex gap-2">
                    <Input
                      id="claimLink"
                      value={inviteResult.claimLink}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      onClick={handleCopyLink}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Send this link to the user. They will use it to set their password and claim their account.
                    The link expires in 7 days.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button onClick={handleClose}>
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter user's full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter user's email"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'USER' | 'ADMIN' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Invitation...
                      </>
                    ) : (
                      'Create Invitation'
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
