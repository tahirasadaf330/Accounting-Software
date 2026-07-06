'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password, mfaRequired ? mfaCode : undefined);
      if (result.mfaRequired) {
        setMfaRequired(true);
        setLoading(false);
        return;
      }
      const currentTenant = useAuthStore.getState().tenant;
      if (currentTenant?.status === 'PENDING_SETUP') {
        router.push('/setup');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Sign in</h1>
        <p className="mt-2 text-sm text-gray-600">Access your accounting dashboard</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {mfaRequired && (
          <div>
            <label htmlFor="mfaCode" className="mb-1 block text-sm font-medium text-gray-700">
              MFA Code
            </label>
            <input
              id="mfaCode"
              type="text"
              required
              maxLength={6}
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              placeholder="Enter 6-digit code"
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <Link href="/forgot-password" className="text-sm font-medium text-primary-600 hover:text-primary-700">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-medium text-primary-600 hover:text-primary-700">
          Create one
        </Link>
      </p>

      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 border-t border-gray-200 pt-4">
          <p className="mb-2 text-center text-xs font-medium text-gray-400">Dev Quick Login</p>
          <div className="space-y-1.5">
            {[
              { role: 'Owner', email: 'owner@demo-company.com', password: 'DemoOwner123!' },
              { role: 'Chief Accountant', email: 'chief@demo-company.com', password: 'DemoChief123!' },
              { role: 'Accountant', email: 'accountant@demo-company.com', password: 'DemoAcct123!' },
            ].map((cred) => (
              <button
                key={cred.role}
                type="button"
                onClick={() => { setEmail(cred.email); setPassword(cred.password); }}
                className="w-full rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-left text-xs text-gray-500 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
              >
                <span className="font-medium">{cred.role}</span>
                <span className="ml-2 text-gray-400">{cred.email}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
