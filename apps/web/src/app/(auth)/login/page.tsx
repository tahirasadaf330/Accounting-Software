'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const SSO_URL = `${API_BASE}/auth/microsoft`;
// 'password' → form only · 'both' → form + Microsoft button · 'sso' → Microsoft only
const AUTH_MODE = process.env.NEXT_PUBLIC_AUTH_MODE || 'password';

type Banner = 'none' | 'signedOut' | 'ssoError';

function useBanner(): Banner {
  const [banner, setBanner] = useState<Banner>('none');
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get('signedOut')) setBanner('signedOut');
    else if (q.get('error')) setBanner('ssoError');
  }, []);
  return banner;
}

function MicrosoftButton({ primary }: { primary: boolean }) {
  return (
    <a
      href={SSO_URL}
      className={
        primary
          ? 'flex w-full items-center justify-center rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700'
          : 'flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50'
      }
    >
      Sign in with Microsoft
    </a>
  );
}

/** sso mode: no login form — go straight to Microsoft, except right after sign-out/error. */
function SsoLogin() {
  const [mode, setMode] = useState<'redirecting' | 'stay'>('redirecting');
  const banner = useBanner();

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get('signedOut') || q.get('error')) {
      setMode('stay');
    } else {
      window.location.href = SSO_URL;
    }
  }, []);

  if (mode === 'redirecting') {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        <p className="text-sm text-gray-600">Redirecting to Microsoft…</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Sign in</h1>
        <p className="mt-2 text-sm text-gray-600">Use your Microsoft account to access the app</p>
      </div>

      {banner === 'signedOut' && (
        <div className="mb-4 rounded-lg bg-gray-50 p-3 text-center text-sm text-gray-600">
          You have been signed out.
        </div>
      )}
      {banner === 'ssoError' && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-700">
          Sorry, we couldn&apos;t sign you in. Please try again.
        </div>
      )}

      <MicrosoftButton primary />
    </div>
  );
}

/**
 * password / both modes: the classic email/password (+ MFA) form.
 * With withMicrosoft (both mode) a "Sign in with Microsoft" button is offered alongside,
 * so users can fall back to their password while SSO is being rolled out.
 */
function PasswordLogin({ withMicrosoft }: { withMicrosoft: boolean }) {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const banner = useBanner();
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
        {banner === 'signedOut' && !error && (
          <div className="rounded-lg bg-gray-50 p-3 text-center text-sm text-gray-600">
            You have been signed out.
          </div>
        )}
        {banner === 'ssoError' && !error && (
          <div className="rounded-lg bg-red-50 p-3 text-center text-sm text-red-700">
            Microsoft sign-in failed — try again or sign in with your password.
          </div>
        )}
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

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      {withMicrosoft && (
        <>
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs font-medium uppercase text-gray-400">or</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>
          <MicrosoftButton primary={false} />
        </>
      )}
    </div>
  );
}

export default function LoginPage() {
  if (AUTH_MODE === 'sso') return <SsoLogin />;
  return <PasswordLogin withMicrosoft={AUTH_MODE === 'both'} />;
}
