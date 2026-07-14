import type { AuthErrorResponse, ValidationErrorDetail } from './types';

export const AUTH_PASSWORD_MIN_LENGTH = 15;
export const AUTH_PASSWORD_MAX_LENGTH = 128;
const AUTH_PASSWORD_MAX_BYTES = 512;

export type AuthMode = 'login' | 'register';

export interface AuthFormValues {
  email: string;
  password: string;
  name: string;
  organizationName: string;
}

export interface AuthFormErrors {
  form?: string;
  email?: string;
  password?: string;
  name?: string;
  organizationName?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function isWellFormedUnicode(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);
    if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
      const nextCodeUnit = value.charCodeAt(index + 1);
      if (
        index + 1 >= value.length ||
        nextCodeUnit < 0xdc00 ||
        nextCodeUnit > 0xdfff
      ) {
        return false;
      }

      index += 1;
      continue;
    }

    if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
      return false;
    }
  }

  return true;
}

export function coerceAuthFormValues(
  values: Partial<AuthFormValues> | null | undefined,
): AuthFormValues {
  return {
    email: typeof values?.email === 'string' ? values.email : '',
    password: typeof values?.password === 'string' ? values.password : '',
    name: typeof values?.name === 'string' ? values.name : '',
    organizationName:
      typeof values?.organizationName === 'string'
        ? values.organizationName
        : '',
  };
}

function isEmailLike(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function getInitialAuthFormValues(mode: AuthMode): AuthFormValues {
  return {
    email: '',
    password: '',
    name: '',
    organizationName: mode === 'register' ? 'My Workspace' : '',
  };
}

export function buildAuthRequestBody(
  mode: AuthMode,
  values: Partial<AuthFormValues> | null | undefined,
): Record<string, string> {
  const normalizedValues = coerceAuthFormValues(values);
  const email = normalizeWhitespace(normalizedValues.email).toLowerCase();
  const password = normalizedValues.password;

  if (mode === 'login') {
    return { email, password };
  }

  const organizationName = normalizeWhitespace(normalizedValues.organizationName);
  const body: Record<string, string> = {
    email,
    password,
    organizationName: organizationName.length > 0 ? organizationName : 'My Workspace',
  };
  const name = normalizeWhitespace(normalizedValues.name);
  if (name.length > 0) {
    body.name = name;
  }

  return body;
}

export function validateAuthForm(
  mode: AuthMode,
  values: AuthFormValues,
): AuthFormErrors {
  const errors: AuthFormErrors = {};
  const email = normalizeWhitespace(values.email).toLowerCase();
  const password = values.password;

  if (email.length === 0 || !isEmailLike(email)) {
    errors.email = 'Enter a valid email address.';
  }

  const passwordCodePoints = [...password].length;
  const passwordByteLength = new TextEncoder().encode(password).length;
  if (
    !isWellFormedUnicode(password) ||
    passwordCodePoints < AUTH_PASSWORD_MIN_LENGTH ||
    passwordCodePoints > AUTH_PASSWORD_MAX_LENGTH ||
    passwordByteLength > AUTH_PASSWORD_MAX_BYTES
  ) {
    errors.password = `Password must be between ${AUTH_PASSWORD_MIN_LENGTH} and ${AUTH_PASSWORD_MAX_LENGTH} characters.`;
  }

  if (mode === 'register') {
    const name = normalizeWhitespace(values.name);
    const organizationName = normalizeWhitespace(values.organizationName);

    if (name.length > 100) {
      errors.name = 'Name must be 100 characters or fewer.';
    }

    if (organizationName.length > 100) {
      errors.organizationName = 'Workspace name must be 100 characters or fewer.';
    }
  }

  return errors;
}

function assignValidationErrors(
  errors: AuthFormErrors,
  fieldErrors: ValidationErrorDetail[],
): void {
  for (const fieldError of fieldErrors) {
    if (
      fieldError.field === 'email' ||
      fieldError.field === 'password' ||
      fieldError.field === 'name' ||
      fieldError.field === 'organizationName'
    ) {
      errors[fieldError.field] = fieldError.message;
      continue;
    }

    errors.form = fieldError.message;
  }
}

export function mapAuthErrorToFieldErrors(
  mode: AuthMode,
  payload: unknown,
): AuthFormErrors {
  if (!isRecord(payload)) {
    return {
      form: 'Unable to complete the request. Please try again.',
    };
  }

  const response = payload as Partial<AuthErrorResponse>;
  const errors: AuthFormErrors = {};

  if (response.code === 'VALIDATION_ERROR' && Array.isArray(response.errors)) {
    assignValidationErrors(errors, response.errors);
  } else if (response.code === 'EMAIL_ALREADY_EXISTS') {
    if (mode === 'register') {
      errors.email =
        response.message ?? 'An account with this email already exists.';
    } else {
      errors.form = response.message ?? 'An account with this email already exists.';
    }
  } else if (response.code === 'INVALID_CREDENTIALS') {
    errors.form = response.message ?? 'Invalid email or password.';
  } else if (response.code === 'AUTHENTICATION_REQUIRED') {
    errors.form = 'Your session expired. Sign in again.';
  } else if (typeof response.message === 'string') {
    errors.form = response.message;
  }

  return errors;
}
