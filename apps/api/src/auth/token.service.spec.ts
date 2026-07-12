import { Buffer } from 'node:buffer';
import { createHmac } from 'node:crypto';
import { ACCESS_TOKEN_EXPIRES_IN_SECONDS, TokenService } from './token.service';

const TEST_SECRET = 'test-only-jwt-secret-with-at-least-32-bytes';
const NOW = 2_000_000_000;

interface TestClaims {
  sub: string;
  iss: string;
  aud: string;
  iat: number;
  exp: number;
  extra?: string;
}

function encode(value: object): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

function createSignedToken(
  claims: TestClaims,
  header: object = { alg: 'HS256', typ: 'JWT' },
): string {
  const signingInput = `${encode(header)}.${encode(claims)}`;
  const signature = createHmac('sha256', TEST_SECRET)
    .update(signingInput, 'ascii')
    .digest('base64url');
  return `${signingInput}.${signature}`;
}

function validClaims(overrides: Partial<TestClaims> = {}): TestClaims {
  return {
    sub: 'user_123',
    iss: 'business-pilot-api',
    aud: 'business-pilot-web',
    iat: NOW,
    exp: NOW + ACCESS_TOKEN_EXPIRES_IN_SECONDS,
    ...overrides,
  };
}

describe('TokenService', () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.JWT_SECRET = TEST_SECRET;
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }
  });

  it('issues a fixed HS256 token with minimal claims and verifies its subject', () => {
    const service = new TokenService();
    const token = service.issue('user_123', NOW);
    const [encodedHeader, encodedClaims] = token.split('.');

    expect(
      JSON.parse(Buffer.from(encodedHeader, 'base64url').toString('utf8')),
    ).toEqual({ alg: 'HS256', typ: 'JWT' });
    expect(
      JSON.parse(Buffer.from(encodedClaims, 'base64url').toString('utf8')),
    ).toEqual(validClaims());
    expect(service.verify(token, NOW)).toEqual({ subject: 'user_123' });
  });

  it.each([undefined, '', 'too-short'])(
    'fails initialization for a missing or weak secret: %p',
    (secret) => {
      if (secret === undefined) {
        delete process.env.JWT_SECRET;
      } else {
        process.env.JWT_SECRET = secret;
      }

      expect(() => new TokenService()).toThrow(
        'JWT_SECRET must contain at least 32 UTF-8 bytes',
      );
    },
  );

  it.each([
    ['expired', validClaims({ iat: NOW - 3601, exp: NOW - 1 })],
    ['wrong issuer', validClaims({ iss: 'other-api' })],
    ['wrong audience', validClaims({ aud: 'other-web' })],
    ['future issued-at', validClaims({ iat: NOW + 61, exp: NOW + 3661 })],
    [
      'wrong lifetime',
      validClaims({ exp: NOW + ACCESS_TOKEN_EXPIRES_IN_SECONDS + 1 }),
    ],
    ['extra claim', validClaims({ extra: 'not-allowed' })],
  ])('rejects a signed token with %s claims', (_caseName, claims) => {
    const service = new TokenService();
    expect(service.verify(createSignedToken(claims), NOW)).toBeNull();
  });

  it.each([
    ['none algorithm', { alg: 'none', typ: 'JWT' }],
    ['wrong type', { alg: 'HS256', typ: 'OTHER' }],
    ['extra header', { alg: 'HS256', typ: 'JWT', kid: 'unexpected' }],
  ])('rejects a token with a %s header', (_caseName, header) => {
    const service = new TokenService();
    expect(
      service.verify(createSignedToken(validClaims(), header), NOW),
    ).toBeNull();
  });

  it('rejects malformed, noncanonical, oversized, and tampered tokens', () => {
    const service = new TokenService();
    const validToken = createSignedToken(validClaims());
    const tamperedToken = `${validToken.slice(0, -1)}${
      validToken.endsWith('a') ? 'b' : 'a'
    }`;

    expect(service.verify('', NOW)).toBeNull();
    expect(service.verify('only.two', NOW)).toBeNull();
    expect(service.verify(`${validToken}=`, NOW)).toBeNull();
    expect(service.verify('a'.repeat(4097), NOW)).toBeNull();
    expect(service.verify(tamperedToken, NOW)).toBeNull();
  });
});
