import { Injectable } from '@nestjs/common';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const ALGORITHM = 'scrypt';
const VERSION = 'v1';
const COST = 32768;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 3;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;
const MAX_MEMORY = 64 * 1024 * 1024;

const DUMMY_PASSWORD_HASH =
  'scrypt$v1$32768$8$3$QkJCQkJCQkJCQkJCQkJCQg$E8iawnYmavbrtgzG0OR8aFNoAlUZ_D-BxAaFIk2MLz4';

interface ParsedPasswordHash {
  salt: Buffer;
  derivedKey: Buffer;
}

function decodeCanonicalBase64Url(
  value: string,
  expectedLength: number,
): Buffer | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) {
    return null;
  }

  const decoded = Buffer.from(value, 'base64url');
  if (
    decoded.length !== expectedLength ||
    decoded.toString('base64url') !== value
  ) {
    return null;
  }

  return decoded;
}

@Injectable()
export class PasswordService {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(SALT_LENGTH);
    const derivedKey = await this.deriveKey(password, salt);

    return [
      ALGORITHM,
      VERSION,
      COST,
      BLOCK_SIZE,
      PARALLELIZATION,
      salt.toString('base64url'),
      derivedKey.toString('base64url'),
    ].join('$');
  }

  async verify(password: string, encodedHash: string): Promise<boolean> {
    const parsedHash = this.parse(encodedHash);
    const comparisonHash = parsedHash ?? this.getDummyHash();

    try {
      const derivedKey = await this.deriveKey(password, comparisonHash.salt);
      const matches = timingSafeEqual(derivedKey, comparisonHash.derivedKey);

      return parsedHash !== null && matches;
    } catch {
      return false;
    }
  }

  async verifyDummy(password: string): Promise<void> {
    const dummyHash = this.getDummyHash();
    const derivedKey = await this.deriveKey(password, dummyHash.salt);
    timingSafeEqual(derivedKey, dummyHash.derivedKey);
  }

  private deriveKey(password: string, salt: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      scrypt(
        password,
        salt,
        KEY_LENGTH,
        {
          N: COST,
          r: BLOCK_SIZE,
          p: PARALLELIZATION,
          maxmem: MAX_MEMORY,
        },
        (error, derivedKey) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(derivedKey);
        },
      );
    });
  }

  private getDummyHash(): ParsedPasswordHash {
    const dummyHash = this.parse(DUMMY_PASSWORD_HASH);
    if (dummyHash === null) {
      throw new Error('Internal dummy password hash is invalid');
    }

    return dummyHash;
  }

  private parse(encodedHash: string): ParsedPasswordHash | null {
    const parts = encodedHash.split('$');
    if (parts.length !== 7) {
      return null;
    }

    const [algorithm, version, cost, blockSize, parallelization, salt, key] =
      parts;

    if (
      algorithm !== ALGORITHM ||
      version !== VERSION ||
      cost !== String(COST) ||
      blockSize !== String(BLOCK_SIZE) ||
      parallelization !== String(PARALLELIZATION)
    ) {
      return null;
    }

    const decodedSalt = decodeCanonicalBase64Url(salt, SALT_LENGTH);
    const decodedKey = decodeCanonicalBase64Url(key, KEY_LENGTH);
    if (decodedSalt === null || decodedKey === null) {
      return null;
    }

    return { salt: decodedSalt, derivedKey: decodedKey };
  }
}
