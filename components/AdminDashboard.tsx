'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  UserPlus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Copy,
  RefreshCw,
  Search
} from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  emailVerified: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Invitation {
  user: User;
  invitation: {
    status: 'pending' | 'claimed' | 'expired';
    isExpired: boolean;
    isClaimed: boolean;
    expiresAt: string;
  };
}

interface InviteResult {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  invitation: {
    claimUrl: string;
    claimToken: string;
    expiresAt: string;
  };
  meta: {
    invitedBy: string;
    timestamp: string;
  };
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'USER' | 'ADMIN'>('ALL');
  const [jwtToken, setJwtToken] = useState('');
  
  // Invite form state
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    role: 'USER' as 'USER' | 'ADMIN',
    expiresInHours: 24
  });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteResult, setInviteResult] = useState<InviteResult | null>(null);

  // Generate service token
  const generateToken = async () => {
    try {
      const response = await fetch('/api/dev/generate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issuer: 'admin-dashboard',
          scopes: ['user:read', 'user:create', 'invite:send'],
          expiresIn: '2h'
        })
      });
      
      if (!response.ok) throw new Error('Failed to generate token');
      
      const data = await response.json();
      setJwtToken(data.token);
      return data.token;
    } catch (err) {
      setError('Failed to generate service token');
      return null;
    }
  };

  // Fetch users
  const fetchUsers = async (token: string) => {
    try {
      const response = await fetch('/api/service/users?limit=50', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      setError('Failed to fetch users');
    }
  };

  // Initialize dashboard
  const initializeDashboard = async () => {
    setLoading(true);
    setError('');
    
    const token = await generateToken();
    if (token) {
      await fetchUsers(token);
    }
    
    setLoading(false);
  };

  // Send invitation
  const sendInvitation = async () => {
    if (!jwtToken) return;
    
    setInviteLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/service/invites', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(inviteForm)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send invitation');
      }
      
      const data = await response.json();
      setInviteResult(data);
      setInviteForm({ name: '', email: '', role: 'USER', expiresInHours: 24 });
      await fetchUsers(jwtToken); // Refresh users list
    } catch (err: any) {
      setError(err.message);
    } finally {
      setInviteLoading(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  useEffect(() => {
    initializeDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users and invitations</p>
        </div>
        <Button onClick={initializeDashboard} variant="outline" size="sm">
          <Refresh className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
            <Badge variant="secondary">ADMIN</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === 'ADMIN').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regular Users</CardTitle>
            <Badge variant="outline">USER</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === 'USER').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invite User Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite New User
          </CardTitle>
          <CardDescription>
            Send an invitation link to a new user
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showInviteForm ? (
            <Button onClick={() => setShowInviteForm(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite User
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value as 'USER' | 'ADMIN' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="expires">Expires In (Hours)</Label>
                  <Input
                    id="expires"
                    type="number"
                    value={inviteForm.expiresInHours}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, expiresInHours: parseInt(e.target.value) }))}
                    min="1"
                    max="168"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={sendInvitation} 
                  disabled={inviteLoading || !inviteForm.name || !inviteForm.email}
                >
                  {inviteLoading ? 'Sending...' : 'Send Invitation'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowInviteForm(false);
                    setInviteResult(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Invitation Result */}
          {inviteResult && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Invitation Sent Successfully!</h4>
              <div className="space-y-2 text-sm">
                <p><strong>User:</strong> {inviteResult.user.name} ({inviteResult.user.email})</p>
                <p><strong>Role:</strong> {inviteResult.user.role}</p>
                <p><strong>Expires:</strong> {new Date(inviteResult.invitation.expiresAt).toLocaleString()}</p>
                <div className="flex items-center gap-2 mt-3">
                  <Input 
                    value={inviteResult.invitation.claimUrl} 
                    readOnly 
                    className="text-xs"
                  />
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => copyToClipboard(inviteResult.invitation.claimUrl)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Manage all users in the system
          </CardDescription>
          
          {/* Filters */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'ALL' | 'USER' | 'ADMIN')}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="ALL">All Roles</option>
              <option value="USER">Users</option>
              <option value="ADMIN">Admins</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">Email</th>
                  <th className="text-left py-2">Role</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 font-medium">{user.name}</td>
                    <td className="py-3 text-gray-600">{user.email}</td>
                    <td className="py-3">
                      <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="py-3">
                      {user.emailVerified ? (
                        <Badge variant="outline" className="text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-orange-600">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 text-gray-500 text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No users found matching your criteria
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
