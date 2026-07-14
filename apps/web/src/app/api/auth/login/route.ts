import { NextRequest, NextResponse } from 'next/server';
import { attachAuthCookie } from '@/lib/auth/cookies';
import {
  createUnavailableAuthError,
  createValidationAuthError,
  loginWithBackend,
} from '@/lib/auth/api';
import { AuthApiError } from '@/lib/auth/errors';

function invalidBodyResponse(): NextResponse {
  return NextResponse.json(createValidationAuthError([{ field: 'body', message: 'Request body must be an object' }]), {
    status: 400,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return invalidBodyResponse();
  }

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return invalidBodyResponse();
  }

  try {
    const session = await loginWithBackend(
      body as Parameters<typeof loginWithBackend>[0],
    );
    const response = NextResponse.json(
      {
        user: session.user,
        organizations: session.organizations,
        tokenType: session.tokenType,
        expiresIn: session.expiresIn,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    );

    return attachAuthCookie(response, session);
  } catch (error) {
    if (error instanceof AuthApiError) {
      return NextResponse.json(error.response, {
        status: error.statusCode,
        headers: {
          'Cache-Control': 'no-store',
        },
      });
    }

    return NextResponse.json(createUnavailableAuthError('Authentication service is unavailable.'), {
      status: 503,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  }
}
