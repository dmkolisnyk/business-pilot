import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';
import type { AuthPrincipal, AuthSessionResponse } from './types';
import { fetchCurrentPrincipal } from './api';

export const AUTH_COOKIE_NAME = 'business-pilot.access-token';

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function buildAuthCookieOptions(expiresInSeconds: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: isProduction(),
    path: '/',
    maxAge: expiresInSeconds,
  };
}

export function buildClearedAuthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: isProduction(),
    path: '/',
    expires: new Date(0),
    maxAge: 0,
  };
}

export async function readAuthTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null;
}

export function attachAuthCookie(
  response: NextResponse,
  session: AuthSessionResponse,
): NextResponse {
  response.cookies.set(
    AUTH_COOKIE_NAME,
    session.accessToken,
    buildAuthCookieOptions(session.expiresIn),
  );
  return response;
}

export function clearAuthCookie(response: NextResponse): NextResponse {
  response.cookies.set(
    AUTH_COOKIE_NAME,
    '',
    buildClearedAuthCookieOptions(),
  );
  return response;
}

export async function loadCurrentPrincipalFromCookies(): Promise<AuthPrincipal | null> {
  const accessToken = await readAuthTokenFromCookies();
  if (accessToken === null) {
    return null;
  }

  return fetchCurrentPrincipal(accessToken);
}
