import { Injectable, PipeTransform } from '@nestjs/common';
import { AuthValidationException } from '../auth.errors';
import type { ValidationErrorDetail } from '../auth.types';
import { normalizeAndValidateEmail, validatePassword } from './register.dto';

export interface LoginDto {
  email: string;
  password: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

@Injectable()
export class LoginValidationPipe implements PipeTransform<unknown, LoginDto> {
  transform(value: unknown): LoginDto {
    if (!isRecord(value)) {
      throw new AuthValidationException([
        { field: 'body', message: 'Request body must be an object' },
      ]);
    }

    const errors: ValidationErrorDetail[] = [];
    const email = normalizeAndValidateEmail(value.email, errors);
    const password = validatePassword(value.password, errors);

    if (errors.length > 0 || email === null || password === null) {
      throw new AuthValidationException(errors);
    }

    return { email, password };
  }
}
