import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth/auth-form';
import { AuthPageShell } from '@/components/auth/auth-page-shell';
import { loadCurrentPrincipalFromCookies } from '@/lib/auth/cookies';
import { sanitizeRedirectPath } from '@/lib/auth/redirect';

interface RegisterPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export const metadata: Metadata = {
  title: 'Create account | Business Pilot',
  description: 'Create your Business Pilot workspace.',
};

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
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
      title="Create a workspace for your store data"
      description="Start with a clean workspace, connect WooCommerce later, and keep every tenant-scoped record tied to one organization."
      highlights={[
        'One workspace per store owner or team',
        'Registration sets up the first organization automatically',
        'The backend returns only the safe session payload to the browser',
      ]}
      footer={
        <p className="text-sm leading-6 text-slate-600">
          Already have an account?{' '}
          <Link
            className="font-semibold text-sky-700 underline decoration-sky-200 underline-offset-4 transition hover:text-sky-900"
            href={`/login?next=${encodeURIComponent(redirectTo)}`}
          >
            Sign in instead
          </Link>
        </p>
      }
    >
      <AuthForm
        actionLabel="Start your workspace"
        alternateLinkHref={`/login?next=${encodeURIComponent(redirectTo)}`}
        alternateLinkLabel="Sign in instead"
        mode="register"
        redirectTo={redirectTo}
        submitLabel="Create workspace"
      />
    </AuthPageShell>
  );
}
