'use client';

export default function NotAuthorizedPage() {
  return (
    <div className="rounded-xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200">
      <h1 className="text-2xl font-bold text-gray-900">You&apos;re not authorized</h1>
      <p className="mt-3 text-sm text-gray-600">
        Your Microsoft sign-in worked, but you don&apos;t have access to this app yet. Please ask
        your administrator to add your account, then sign in again.
      </p>
      {/* /login adapts to the active mode: sso → forwards to Microsoft; both/password → login page */}
      <a
        href="/login"
        className="mt-6 inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Back to sign in
      </a>
    </div>
  );
}
