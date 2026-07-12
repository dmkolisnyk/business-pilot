import { HttpException, HttpStatus } from '@nestjs/common';
import type { ValidationErrorDetail } from './auth.types';

export class AuthValidationException extends HttpException {
  constructor(errors: ValidationErrorDetail[]) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        errors,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class EmailAlreadyExistsException extends HttpException {
  constructor() {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'An account with this email already exists',
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class InvalidCredentialsException extends HttpException {
  constructor() {
    super(
      {
        statusCode: HttpStatus.UNAUTHORIZED,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class AuthenticationRequiredException extends HttpException {
  constructor() {
    super(
      {
        statusCode: HttpStatus.UNAUTHORIZED,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required',
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}
