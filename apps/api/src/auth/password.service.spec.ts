import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const password = 'correct horse battery staple';
  let service: PasswordService;

  beforeEach(() => {
    service = new PasswordService();
  });

  it('creates unique versioned scrypt hashes and verifies only the password', async () => {
    const firstHash = await service.hash(password);
    const secondHash = await service.hash(password);

    expect(firstHash).toMatch(
      /^scrypt\$v1\$32768\$8\$3\$[A-Za-z0-9_-]{22}\$[A-Za-z0-9_-]{43}$/,
    );
    expect(secondHash).not.toBe(firstHash);
    await expect(service.verify(password, firstHash)).resolves.toBe(true);
    await expect(
      service.verify('incorrect password value', firstHash),
    ).resolves.toBe(false);
  });

  it.each([
    '',
    'sha256$v1$32768$8$3$QkJCQkJCQkJCQkJCQkJCQg$E8iawnYmavbrtgzG0OR8aFNoAlUZ_D-BxAaFIk2MLz4',
    'scrypt$v1$1$8$3$QkJCQkJCQkJCQkJCQkJCQg$E8iawnYmavbrtgzG0OR8aFNoAlUZ_D-BxAaFIk2MLz4',
    'scrypt$v1$32768$8$3$not+base64$E8iawnYmavbrtgzG0OR8aFNoAlUZ_D-BxAaFIk2MLz4',
  ])('fails closed for malformed or unsupported hash %p', async (hash) => {
    await expect(service.verify(password, hash)).resolves.toBe(false);
  });

  it('performs the fixed dummy scrypt path without exposing a result', async () => {
    await expect(service.verifyDummy(password)).resolves.toBeUndefined();
  });
});
