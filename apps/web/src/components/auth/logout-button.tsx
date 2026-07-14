'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function LogoutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick(): Promise<void> {
    setIsPending(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Logout request failed');
      }

      router.replace('/login');
      router.refresh();
    } catch {
      setError('Unable to sign out right now. Please try again.');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div>
      <button
        className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        onClick={handleClick}
        type="button"
      >
        {isPending ? 'Signing out…' : 'Sign out'}
      </button>
      {error ? (
        <p className="mt-2 text-sm leading-6 text-rose-700">{error}</p>
      ) : null}
    </div>
  );
}
