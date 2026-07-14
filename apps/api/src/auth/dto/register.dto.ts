import { Injectable, PipeTransform } from '@nestjs/common';
import { Buffer } from 'node:buffer';
import { AuthValidationException } from '../auth.errors';
import type { ValidationErrorDetail } from '../auth.types';

const EMAIL_MAX_LENGTH = 254;
const PASSWORD_MIN_CODE_POINTS = 15;
const PASSWORD_MAX_CODE_POINTS = 128;
const PASSWORD_MAX_BYTES = 512;
const NAME_MAX_LENGTH = 100;
const BASIC_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface RegisterDto {
  email: string;
  password: string;
  name: string | null;
  organizationName: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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
    } else if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
      return false;
    }
  }

  return true;
}

export function normalizeAndValidateEmail(
  value: unknown,
  errors: ValidationErrorDetail[],
): string | null {
  if (typeof value !== 'string') {
    errors.push({ field: 'email', message: 'Email is invalid' });
    return null;
  }

  const email = value.trim().toLowerCase();
  if (
    email.length === 0 ||
    email.length > EMAIL_MAX_LENGTH ||
    !BASIC_EMAIL_PATTERN.test(email)
  ) {
    errors.push({ field: 'email', message: 'Email is invalid' });
    return null;
  }

  return email;
}

export function validatePassword(
  value: unknown,
  errors: ValidationErrorDetail[],
): string | null {
  if (typeof value !== 'string') {
    errors.push({ field: 'password', message: 'Password is invalid' });
    return null;
  }

  const codePointLength = [...value].length;
  const byteLength = Buffer.byteLength(value, 'utf8');
  if (
    !isWellFormedUnicode(value) ||
    codePointLength < PASSWORD_MIN_CODE_POINTS ||
    codePointLength > PASSWORD_MAX_CODE_POINTS ||
    byteLength > PASSWORD_MAX_BYTES
  ) {
    errors.push({ field: 'password', message: 'Password is invalid' });
    return null;
  }

  return value;
}

function validateOptionalName(
  value: unknown,
  errors: ValidationErrorDetail[],
): string | null {
  if (value === undefined) {
    return null;
  }

  if (typeof value !== 'string') {
    errors.push({ field: 'name', message: 'Name is invalid' });
    return null;
  }

  const name = value.trim();
  const nameLength = [...name].length;
  if (nameLength === 0 || nameLength > NAME_MAX_LENGTH) {
    errors.push({ field: 'name', message: 'Name is invalid' });
    return null;
  }

  return name;
}

function validateOrganizationName(
  value: unknown,
  errors: ValidationErrorDetail[],
): string | null {
  if (value === undefined) {
    return 'My Workspace';
  }

  if (typeof value !== 'string') {
    errors.push({
      field: 'organizationName',
      message: 'Organization name is invalid',
    });
    return null;
  }

  const organizationName = value.trim();
  const organizationNameLength = [...organizationName].length;
  if (
    organizationNameLength === 0 ||
    organizationNameLength > NAME_MAX_LENGTH
  ) {
    errors.push({
      field: 'organizationName',
      message: 'Organization name is invalid',
    });
    return null;
  }

  return organizationName;
}

@Injectable()
export class RegisterValidationPipe implements PipeTransform<
  unknown,
  RegisterDto
> {
  transform(value: unknown): RegisterDto {
    if (!isRecord(value)) {
      throw new AuthValidationException([
        { field: 'body', message: 'Request body must be an object' },
      ]);
    }

    const errors: ValidationErrorDetail[] = [];
    const email = normalizeAndValidateEmail(value.email, errors);
    const password = validatePassword(value.password, errors);
    const name = validateOptionalName(value.name, errors);
    const organizationName = validateOrganizationName(
      value.organizationName,
      errors,
    );

    if (
      errors.length > 0 ||
      email === null ||
      password === null ||
      organizationName === null
    ) {
      throw new AuthValidationException(errors);
    }

    return { email, password, name, organizationName };
  }
}
