import type { AuthErrorResponse, ValidationErrorDetail } from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidationErrorDetail(value: unknown): value is ValidationErrorDetail {
  return (
    isRecord(value) &&
    typeof value.field === 'string' &&
    typeof value.message === 'string'
  );
}

export function isAuthErrorResponse(value: unknown): value is AuthErrorResponse {
  return (
    isRecord(value) &&
    typeof value.statusCode === 'number' &&
    typeof value.code === 'string' &&
    typeof value.message === 'string' &&
    (value.errors === undefined ||
      (Array.isArray(value.errors) && value.errors.every(isValidationErrorDetail)))
  );
}

export class AuthApiError extends Error {
  readonly statusCode: number;

  readonly code: string;

  readonly response: AuthErrorResponse;

  constructor(response: AuthErrorResponse) {
    super(response.message);
    this.name = 'AuthApiError';
    this.statusCode = response.statusCode;
    this.code = response.code;
    this.response = response;
  }
}

