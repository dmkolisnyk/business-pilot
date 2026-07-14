import {
  buildAuthRequestBody,
  getInitialAuthFormValues,
  mapAuthErrorToFieldErrors,
  validateAuthForm,
} from './validation';

describe('auth validation helpers', () => {
  it('creates mode-specific initial values', () => {
    expect(getInitialAuthFormValues('login')).toEqual({
      email: '',
      password: '',
      name: '',
      organizationName: '',
    });
    expect(getInitialAuthFormValues('register')).toEqual({
      email: '',
      password: '',
      name: '',
      organizationName: 'My Workspace',
    });
  });

  it('normalizes registration payloads without sending empty optional fields', () => {
    expect(
      buildAuthRequestBody('register', {
        email: ' Owner@Example.com ',
        password: 'correct horse battery staple',
        name: '  Store Owner  ',
        organizationName: '  Example Store  ',
      }),
    ).toEqual({
      email: 'owner@example.com',
      password: 'correct horse battery staple',
      name: 'Store Owner',
      organizationName: 'Example Store',
    });
  });

  it('validates obvious form issues before the request leaves the browser', () => {
    expect(
      validateAuthForm('login', {
        email: 'invalid',
        password: 'short',
        name: '',
        organizationName: '',
      }),
    ).toEqual({
      email: 'Enter a valid email address.',
      password: 'Password must be between 15 and 128 characters.',
    });
  });

  it('matches the backend password contract for Unicode inputs', () => {
    expect(
      validateAuthForm('login', {
        email: 'owner@example.com',
        password: '🔐'.repeat(15),
        name: '',
        organizationName: '',
      }),
    ).toEqual({});

    expect(
      validateAuthForm('login', {
        email: 'owner@example.com',
        password: '🔐'.repeat(14),
        name: '',
        organizationName: '',
      }),
    ).toEqual({
      password: 'Password must be between 15 and 128 characters.',
    });

    expect(
      validateAuthForm('login', {
        email: 'owner@example.com',
        password: `${'a'.repeat(14)}\ud800`,
        name: '',
        organizationName: '',
      }),
    ).toEqual({
      password: 'Password must be between 15 and 128 characters.',
    });
  });

  it('maps backend errors to field and form messages', () => {
    expect(
      mapAuthErrorToFieldErrors('register', {
        statusCode: 409,
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'An account with this email already exists',
      }),
    ).toEqual({
      email: 'An account with this email already exists',
    });

    expect(
      mapAuthErrorToFieldErrors('login', {
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      }),
    ).toEqual({
      form: 'Invalid email or password',
    });
  });
});
