import { sanitizeRedirectPath } from './redirect';

describe('sanitizeRedirectPath', () => {
  it('keeps safe internal paths', () => {
    expect(sanitizeRedirectPath('/dashboard')).toBe('/dashboard');
    expect(sanitizeRedirectPath('/login?next=/dashboard')).toBe(
      '/login?next=/dashboard',
    );
  });

  it('rejects external and malformed redirect values', () => {
    expect(sanitizeRedirectPath('https://example.com')).toBe('/dashboard');
    expect(sanitizeRedirectPath('//example.com')).toBe('/dashboard');
    expect(sanitizeRedirectPath('   ')).toBe('/dashboard');
    expect(sanitizeRedirectPath(['//example.com', '/dashboard'])).toBe(
      '/dashboard',
    );
  });
});
