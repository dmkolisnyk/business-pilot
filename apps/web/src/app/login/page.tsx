import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth/auth-form';
import { AuthPageShell } from '@/components/auth/auth-page-shell';
import { loadCurrentPrincipalFromCookies } from '@/lib/auth/cookies';
import { sanitizeRedirectPath } from '@/lib/auth/redirect';

interface LoginPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export const metadata: Metadata = {
  title: 'Sign in | Business Pilot',
  description: 'Sign in to your Business Pilot workspace.',
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams;
  const redirectTo = sanitizeRedirectPath(
    resolvedSearchParams?.next,
    '/dashboard',
  );

  const principal = await loadCurrentPrincipalFromCookies().catch(() => null);
  if (principal !== null) {
    redirect(redirectTo);
  }

  return (
    <AuthPageShell
      eyebrow="Authentication"
      title="Sign in with the workspace you already use"
      description="Business Pilot keeps the token in an HTTP-only cookie so your browser code never sees raw credentials."
      highlights={[
        'Protected dashboard access with server-side session checks',
        'Backend auth tokens stay out of client-side JavaScript',
        'Redirects preserve the destination you were trying to reach',
      ]}
      footer={
        <p className="text-sm leading-6 text-slate-600">
          New here?{' '}
          <Link
            className="font-semibold text-sky-700 underline decoration-sky-200 underline-offset-4 transition hover:text-sky-900"
            href={`/register?next=${encodeURIComponent(redirectTo)}`}
          >
            Create your workspace
          </Link>
        </p>
      }
    >
      <AuthForm
        actionLabel="Welcome back"
        alternateLinkHref={`/register?next=${encodeURIComponent(redirectTo)}`}
        alternateLinkLabel="Create a workspace"
        mode="login"
        redirectTo={redirectTo}
        submitLabel="Sign in"
      />
    </AuthPageShell>
  );
}
