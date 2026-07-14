import { NextResponse } from 'next/server';
import { loadCurrentPrincipalFromCookies } from '@/lib/auth/cookies';
import { createUnavailableAuthError } from '@/lib/auth/api';

export async function GET(): Promise<NextResponse> {
  try {
    const principal = await loadCurrentPrincipalFromCookies();

    if (principal === null) {
      return NextResponse.json(
        {
          statusCode: 401,
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required',
        },
        {
          status: 401,
          headers: {
            'Cache-Control': 'no-store',
          },
        },
      );
    }

    return NextResponse.json(principal, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json(
      createUnavailableAuthError('Authentication service is unavailable.'),
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    );
  }
}

