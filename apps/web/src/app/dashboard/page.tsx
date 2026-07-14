import { redirect } from 'next/navigation';
import { LogoutButton } from '@/components/auth/logout-button';
import { loadCurrentPrincipalFromCookies } from '@/lib/auth/cookies';

async function loadDashboardSession() {
  try {
    const principal = await loadCurrentPrincipalFromCookies();
    return { principal, loadError: null as string | null };
  } catch (error) {
    return {
      principal: null,
      loadError:
        error instanceof Error
          ? error.message
          : 'Unable to load the current user.',
    };
  }
}

export default async function DashboardPage() {
  const { principal, loadError } = await loadDashboardSession();

  if (principal === null) {
    if (loadError === null) {
      redirect('/login?next=/dashboard');
    }

    return (
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center justify-center">
          <div className="w-full rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
              Dashboard unavailable
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">
              The current user could not be loaded
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {loadError}
            </p>
            <div className="mt-6 flex justify-center">
              <LogoutButton />
            </div>
          </div>
        </div>
      </main>
    );
  }

  const primaryOrganization = principal.organizations[0];

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col gap-6">
        <header className="rounded-[2rem] border border-white/10 bg-white/5 px-6 py-6 shadow-[0_24px_80px_rgba(15,23,42,0.24)] backdrop-blur">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
                Dashboard
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-balance">
                Welcome, {principal.user.name ?? principal.user.email}
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-300">
                This route is protected by the HTTP-only session cookie. From
                here you can branch into analytics, sync, recommendations, and
                future WooCommerce setup screens.
              </p>
            </div>
            <LogoutButton />
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 text-slate-950 shadow-[0_20px_70px_rgba(15,23,42,0.12)]">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Current user
              </p>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Email
                  </dt>
                  <dd className="mt-2 text-sm font-medium text-slate-900">
                    {principal.user.email}
                  </dd>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Workspace
                  </dt>
                  <dd className="mt-2 text-sm font-medium text-slate-900">
                    {primaryOrganization
                      ? primaryOrganization.name
                      : 'No workspace found'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 text-slate-950 shadow-[0_20px_70px_rgba(15,23,42,0.12)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Memberships
            </p>
            <div className="mt-4 space-y-3">
              {principal.organizations.map((organization) => (
                <div
                  key={organization.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        {organization.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {organization.slug}
                      </p>
                    </div>
                    <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-sky-800">
                      {organization.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
