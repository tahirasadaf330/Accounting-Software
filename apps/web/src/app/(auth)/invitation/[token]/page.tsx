'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

interface InvitationDetails {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  companyName: string;
}

export default function AcceptInvitationPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [pageError, setPageError] = useState('');

  useEffect(() => {
    loadInvitation();
  }, [token]);

  const loadInvitation = async () => {
    try {
      const data = await api.get<InvitationDetails>(`/auth/invitation/${token}`);
      setInvitation(data);
    } catch (err: any) {
      setPageError(err.message || 'Invalid or expired invitation');
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const result = await api.post<any>(`/auth/invitation/${token}/accept`, { password });

      useAuthStore.setState({
        user: result.user,
        tenant: result.tenant,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        isAuthenticated: true,
      });

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to accept invitation');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
        <div className="flex items-center justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Invitation unavailable</h1>
          <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {pageError}
          </div>
          <p className="mt-6 text-sm text-gray-600">
            <Link href="/login" className="font-medium text-primary-600 hover:text-primary-700">
              Go to sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Accept Invitation</h1>
        <p className="mt-2 text-sm text-gray-600">
          Set up your account to join <strong>{invitation?.companyName}</strong>
        </p>
      </div>

      <div className="mb-6 space-y-3 rounded-lg bg-gray-50 p-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Name</span>
          <span className="font-medium text-gray-900">
            {invitation?.firstName} {invitation?.lastName}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Email</span>
          <span className="font-medium text-gray-900">{invitation?.email}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Role</span>
          <span className="font-medium text-gray-900">
            {invitation?.role.replace('_', ' ')}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
            Create password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            placeholder="At least 8 characters"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-gray-700">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            placeholder="Re-enter your password"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {submitting ? 'Setting up account...' : 'Accept & create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary-600 hover:text-primary-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}
