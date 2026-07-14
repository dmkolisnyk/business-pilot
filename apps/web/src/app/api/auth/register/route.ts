import { NextRequest, NextResponse } from 'next/server';
import {
  createUnavailableAuthError,
  createValidationAuthError,
  registerWithBackend,
} from '@/lib/auth/api';
import { AuthApiError } from '@/lib/auth/errors';
import { attachAuthCookie } from '@/lib/auth/cookies';

function invalidBodyResponse(): NextResponse {
  return NextResponse.json(
    createValidationAuthError([
      { field: 'body', message: 'Request body must be an object' },
    ]),
    {
      status: 400,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
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
    const session = await registerWithBackend(
      body as Parameters<typeof registerWithBackend>[0],
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
