import { Injectable } from '@nestjs/common';
import { Buffer } from 'node:buffer';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { VerifiedAccessToken } from './auth.types';

export const ACCESS_TOKEN_EXPIRES_IN_SECONDS = 3600 as const;

const TOKEN_ISSUER = 'business-pilot-api';
const TOKEN_AUDIENCE = 'business-pilot-web';
const MAX_TOKEN_LENGTH = 4096;
const MAX_CLOCK_SKEW_SECONDS = 60;
const HMAC_SIGNATURE_LENGTH = 32;
const SUBJECT_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

interface JwtHeader {
  alg: 'HS256';
  typ: 'JWT';
}

interface JwtClaims {
  sub: string;
  iss: typeof TOKEN_ISSUER;
  aud: typeof TOKEN_AUDIENCE;
  iat: number;
  exp: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(
  value: Record<string, unknown>,
  expectedKeys: string[],
): boolean {
  const actualKeys = Object.keys(value).sort();
  return (
    actualKeys.length === expectedKeys.length &&
    actualKeys.every((key, index) => key === expectedKeys[index])
  );
}

function decodeCanonicalBase64Url(value: string): Buffer | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) {
    return null;
  }

  const decoded = Buffer.from(value, 'base64url');
  return decoded.toString('base64url') === value ? decoded : null;
}

function parseJsonObject(value: Buffer): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(value.toString('utf8'));
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

@Injectable()
export class TokenService {
  private readonly secret: Buffer;

  constructor() {
    const configuredSecret = process.env.JWT_SECRET;
    if (
      configuredSecret === undefined ||
      Buffer.byteLength(configuredSecret, 'utf8') < 32
    ) {
      throw new Error('JWT_SECRET must contain at least 32 UTF-8 bytes');
    }

    this.secret = Buffer.from(configuredSecret, 'utf8');
  }

  issue(subject: string, issuedAt = this.currentTime()): string {
    if (!SUBJECT_PATTERN.test(subject)) {
      throw new Error('Access-token subject is invalid');
    }

    const header: JwtHeader = { alg: 'HS256', typ: 'JWT' };
    const claims: JwtClaims = {
      sub: subject,
      iss: TOKEN_ISSUER,
      aud: TOKEN_AUDIENCE,
      iat: issuedAt,
      exp: issuedAt + ACCESS_TOKEN_EXPIRES_IN_SECONDS,
    };
    const encodedHeader = this.encodeJson(header);
    const encodedClaims = this.encodeJson(claims);
    const signingInput = `${encodedHeader}.${encodedClaims}`;
    const signature = this.sign(signingInput).toString('base64url');

    return `${signingInput}.${signature}`;
  }

  verify(token: string, now = this.currentTime()): VerifiedAccessToken | null {
    if (token.length === 0 || token.length > MAX_TOKEN_LENGTH) {
      return null;
    }

    const segments = token.split('.');
    if (segments.length !== 3) {
      return null;
    }

    const [encodedHeader, encodedClaims, encodedSignature] = segments;
    const headerBytes = decodeCanonicalBase64Url(encodedHeader);
    const signature = decodeCanonicalBase64Url(encodedSignature);
    if (
      headerBytes === null ||
      signature === null ||
      signature.length !== HMAC_SIGNATURE_LENGTH
    ) {
      return null;
    }

    const header = parseJsonObject(headerBytes);
    if (
      header === null ||
      !hasExactKeys(header, ['alg', 'typ']) ||
      header.alg !== 'HS256' ||
      header.typ !== 'JWT'
    ) {
      return null;
    }

    const signingInput = `${encodedHeader}.${encodedClaims}`;
    const expectedSignature = this.sign(signingInput);
    if (!timingSafeEqual(signature, expectedSignature)) {
      return null;
    }

    const claimsBytes = decodeCanonicalBase64Url(encodedClaims);
    if (claimsBytes === null) {
      return null;
    }

    const claims = parseJsonObject(claimsBytes);
    if (!this.areClaimsValid(claims, now)) {
      return null;
    }

    return { subject: claims.sub };
  }

  private areClaimsValid(
    claims: Record<string, unknown> | null,
    now: number,
  ): claims is JwtClaims & Record<string, unknown> {
    if (
      claims === null ||
      !hasExactKeys(claims, ['aud', 'exp', 'iat', 'iss', 'sub']) ||
      typeof claims.sub !== 'string' ||
      !SUBJECT_PATTERN.test(claims.sub) ||
      claims.iss !== TOKEN_ISSUER ||
      claims.aud !== TOKEN_AUDIENCE ||
      typeof claims.iat !== 'number' ||
      !Number.isSafeInteger(claims.iat) ||
      typeof claims.exp !== 'number' ||
      !Number.isSafeInteger(claims.exp)
    ) {
      return false;
    }

    return (
      claims.iat >= 0 &&
      claims.iat <= now + MAX_CLOCK_SKEW_SECONDS &&
      claims.exp - claims.iat === ACCESS_TOKEN_EXPIRES_IN_SECONDS &&
      claims.exp > now
    );
  }

  private currentTime(): number {
    return Math.floor(Date.now() / 1000);
  }

  private encodeJson(value: JwtHeader | JwtClaims): string {
    return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
  }

  private sign(signingInput: string): Buffer {
    return createHmac('sha256', this.secret)
      .update(signingInput, 'ascii')
      .digest();
  }
}
