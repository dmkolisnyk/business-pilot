import type { ReactNode } from 'react';

interface AuthPageShellProps {
  eyebrow: string;
  title: string;
  description: string;
  highlights: string[];
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthPageShell({
  eyebrow,
  title,
  description,
  highlights,
  children,
  footer,
}: AuthPageShellProps) {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(245,158,11,0.14),_transparent_24%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-stretch">
        <section className="hidden w-full max-w-xl flex-col justify-between overflow-hidden rounded-[2rem] border border-white/60 bg-slate-950 px-10 py-10 text-white shadow-[0_30px_100px_rgba(15,23,42,0.2)] lg:flex">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-cyan-100">
              <span className="h-2 w-2 rounded-full bg-cyan-300" />
              {eyebrow}
            </div>
            <div className="space-y-5">
              <h1 className="max-w-lg text-5xl font-semibold leading-tight tracking-tight text-balance">
                {title}
              </h1>
              <p className="max-w-xl text-base leading-7 text-slate-300">
                {description}
              </p>
            </div>
          </div>

          <div className="grid gap-3">
            {highlights.map((highlight) => (
              <div
                key={highlight}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
              >
                <span className="h-2 w-2 rounded-full bg-amber-300" />
                <span>{highlight}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="flex w-full items-center justify-center lg:max-w-[34rem] lg:flex-none lg:pl-8">
          <div className="w-full max-w-lg rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-8">
            {children}
            {footer ? <div className="mt-6">{footer}</div> : null}
          </div>
        </section>
      </div>
    </main>
  );
}

