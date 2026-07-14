'use client';

import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import { useState } from 'react';
import {
  buildAuthRequestBody,
  getInitialAuthFormValues,
  mapAuthErrorToFieldErrors,
  type AuthFormErrors,
  type AuthFormValues,
  validateAuthForm,
} from '@/lib/auth/validation';

interface AuthFormProps {
  mode: 'login' | 'register';
  redirectTo: string;
  actionLabel: string;
  submitLabel: string;
  alternateLinkHref: string;
  alternateLinkLabel: string;
}

function fieldClassName(hasError: boolean): string {
  return [
    'mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-4',
    hasError
      ? 'border-rose-300 bg-rose-50/60 text-slate-950 focus:border-rose-400 focus:ring-rose-100'
      : 'border-slate-200 bg-white text-slate-950 focus:border-sky-400 focus:ring-sky-100',
  ].join(' ');
}

function hasErrors(errors: AuthFormErrors): boolean {
  return (
    errors.form !== undefined ||
    errors.email !== undefined ||
    errors.password !== undefined ||
    errors.name !== undefined ||
    errors.organizationName !== undefined
  );
}

function buildInitialState(mode: 'login' | 'register'): AuthFormValues {
  return getInitialAuthFormValues(mode);
}

export function AuthForm({
  mode,
  redirectTo,
  actionLabel,
  submitLabel,
  alternateLinkHref,
  alternateLinkLabel,
}: AuthFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [values, setValues] = useState<AuthFormValues>(() => buildInitialState(mode));
  const [errors, setErrors] = useState<AuthFormErrors>({});
  const isRegister = mode === 'register';
  const submitPath = `/api/auth/${mode}`;

  function updateValue(field: keyof AuthFormValues, value: string): void {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    const validationErrors = validateAuthForm(mode, values);
    if (hasErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsPending(true);
    try {
      const response = await fetch(submitPath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildAuthRequestBody(mode, values)),
      });
      const payload = (await response.json().catch(() => null)) as unknown;

      if (!response.ok) {
        setErrors(mapAuthErrorToFieldErrors(mode, payload));
        return;
      }

      router.replace(redirectTo);
      router.refresh();
    } catch {
      setErrors({
        form: 'Unable to reach the authentication service. Check the backend and try again.',
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
          {actionLabel}
        </h2>
        <p className="text-sm leading-6 text-slate-600">
          {isRegister
            ? 'Create the workspace that will hold your store data, reports, and recommendations.'
            : 'Pick up where your last sync left off and continue into the dashboard.'}
        </p>
      </div>

      {errors.form ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-900">
          {errors.form}
        </div>
      ) : null}

      <label className="block">
        <span className="text-sm font-medium text-slate-800">Email</span>
        <input
          autoComplete="email"
          className={fieldClassName(errors.email !== undefined)}
          disabled={isPending}
          inputMode="email"
          name="email"
          onChange={(event) => updateValue('email', event.target.value)}
          placeholder="owner@example.com"
          required
          type="email"
          value={values.email}
        />
        {errors.email ? (
          <span className="mt-2 block text-sm text-rose-700">{errors.email}</span>
        ) : null}
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-800">Password</span>
        <input
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          className={fieldClassName(errors.password !== undefined)}
          disabled={isPending}
          name="password"
          onChange={(event) => updateValue('password', event.target.value)}
          placeholder="At least 15 characters"
          required
          type="password"
          value={values.password}
        />
        {errors.password ? (
          <span className="mt-2 block text-sm text-rose-700">{errors.password}</span>
        ) : null}
      </label>

      {isRegister ? (
        <>
          <label className="block">
            <span className="text-sm font-medium text-slate-800">Your name</span>
            <input
              autoComplete="name"
              className={fieldClassName(errors.name !== undefined)}
              disabled={isPending}
              name="name"
              onChange={(event) => updateValue('name', event.target.value)}
              placeholder="Store owner"
              type="text"
              value={values.name}
            />
            {errors.name ? (
              <span className="mt-2 block text-sm text-rose-700">{errors.name}</span>
            ) : null}
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-800">Workspace name</span>
            <input
              autoComplete="organization"
              className={fieldClassName(errors.organizationName !== undefined)}
              disabled={isPending}
              name="organizationName"
              onChange={(event) => updateValue('organizationName', event.target.value)}
              placeholder="My Workspace"
              type="text"
              value={values.organizationName}
            />
            {errors.organizationName ? (
              <span className="mt-2 block text-sm text-rose-700">
                {errors.organizationName}
              </span>
            ) : null}
          </label>
        </>
      ) : null}

      <button
        className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={isPending}
        type="submit"
      >
        {isPending ? 'Working…' : submitLabel}
      </button>

      <p className="text-sm leading-6 text-slate-600">
        {mode === 'login' ? 'Need a workspace?' : 'Already have an account?'}{' '}
        <a
          className="font-semibold text-sky-700 underline decoration-sky-200 underline-offset-4 transition hover:text-sky-900"
          href={alternateLinkHref}
        >
          {alternateLinkLabel}
        </a>
      </p>
    </form>
  );
}
