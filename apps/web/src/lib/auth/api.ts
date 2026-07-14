import 'server-only';

import type {
  AuthErrorResponse,
  AuthPrincipal,
  AuthSessionResponse,
  ValidationErrorDetail,
} from './types';
import { AuthApiError, isAuthErrorResponse } from './errors';
import { buildAuthRequestBody } from './validation';

function getBackendBaseUrl(): string {
  const backendBaseUrl =
    process.env.API_URL ??
    process.env.INTERNAL_API_URL ??
    process.env.NEXT_PUBLIC_API_URL;

  if (
    backendBaseUrl === undefined ||
    backendBaseUrl.trim().length === 0
  ) {
    throw new Error('Backend API URL is not configured');
  }

  return backendBaseUrl.endsWith('/')
    ? backendBaseUrl
    : `${backendBaseUrl}/`;
}

function createBackendUrl(path: string): string {
  return new URL(path.replace(/^\/+/, ''), getBackendBaseUrl()).toString();
}

async function readJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text.trim().length === 0) {
    return null;
  }

  return JSON.parse(text) as unknown;
}

function toAuthErrorResponse(
  statusCode: number,
  payload: unknown,
  fallbackCode: string,
  fallbackMessage: string,
): AuthErrorResponse {
  if (isAuthErrorResponse(payload)) {
    return payload;
  }

  return {
    statusCode,
    code: fallbackCode,
    message: fallbackMessage,
    errors: undefined,
  };
}

async function requestBackendAuth<T>(
  path: string,
  init: RequestInit,
): Promise<T> {
  const response = await fetch(createBackendUrl(path), {
    ...init,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const payload = await readJsonResponse(response);

  if (!response.ok) {
    throw new AuthApiError(
      toAuthErrorResponse(
        response.status,
        payload,
        'AUTH_BACKEND_ERROR',
        'Authentication service request failed',
      ),
    );
  }

  return payload as T;
}

export async function registerWithBackend(
  values: Parameters<typeof buildAuthRequestBody>[1],
): Promise<AuthSessionResponse> {
  return requestBackendAuth<AuthSessionResponse>('auth/register', {
    method: 'POST',
    body: JSON.stringify(buildAuthRequestBody('register', values)),
  });
}

export async function loginWithBackend(
  values: Parameters<typeof buildAuthRequestBody>[1],
): Promise<AuthSessionResponse> {
  return requestBackendAuth<AuthSessionResponse>('auth/login', {
    method: 'POST',
    body: JSON.stringify(buildAuthRequestBody('login', values)),
  });
}

export async function fetchCurrentPrincipal(
  accessToken: string,
): Promise<AuthPrincipal | null> {
  try {
    return await requestBackendAuth<AuthPrincipal>('auth/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch (error) {
    if (error instanceof AuthApiError && error.statusCode === 401) {
      return null;
    }

    throw error;
  }
}

export function unwrapAuthErrorResponse(
  error: unknown,
): AuthErrorResponse | null {
  if (error instanceof AuthApiError) {
    return error.response;
  }

  if (isAuthErrorResponse(error)) {
    return error;
  }

  return null;
}

export function createUnavailableAuthError(
  message: string,
): AuthErrorResponse {
  return {
    statusCode: 503,
    code: 'AUTH_BACKEND_UNAVAILABLE',
    message,
    errors: undefined,
  };
}

export function createValidationAuthError(
  errors: ValidationErrorDetail[],
): AuthErrorResponse {
  return {
    statusCode: 400,
    code: 'VALIDATION_ERROR',
    message: 'Request validation failed',
    errors,
  };
}
