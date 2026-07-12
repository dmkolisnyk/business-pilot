import {
  EmailAlreadyExistsException,
  InvalidCredentialsException,
} from './auth.errors';
import { AuthService } from './auth.service';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import type { PasswordService } from './password.service';
import type { TokenService } from './token.service';
import type { PrismaService } from '../prisma/prisma.service';

jest.mock('../prisma/prisma.service', () => ({
  PrismaService: jest.fn(),
}));

const passwordHash =
  'scrypt$v1$32768$8$3$QkJCQkJCQkJCQkJCQkJCQg$E8iawnYmavbrtgzG0OR8aFNoAlUZ_D-BxAaFIk2MLz4';

const principalRecord = {
  id: 'user_1',
  email: 'owner@example.com',
  name: 'Store Owner',
  memberships: [
    {
      role: 'owner' as const,
      organization: {
        id: 'organization_1',
        name: 'Example Store',
        slug: 'example-store-random',
      },
    },
  ],
};

const registerInput: RegisterDto = {
  email: 'owner@example.com',
  password: 'correct horse battery staple',
  name: 'Store Owner',
  organizationName: 'Example Store',
};

const loginInput: LoginDto = {
  email: registerInput.email,
  password: registerInput.password,
};

interface TransactionClientMock {
  user: {
    create: (args: unknown) => Promise<typeof principalRecord>;
  };
}

describe('AuthService', () => {
  const findUniqueMock = jest.fn<Promise<unknown>, [args: unknown]>();
  const createMock = jest.fn<
    Promise<typeof principalRecord>,
    [args: unknown]
  >();
  const transactionMock = jest.fn<
    Promise<unknown>,
    [callback: (client: TransactionClientMock) => Promise<unknown>]
  >();
  const hashMock = jest.fn<Promise<string>, [password: string]>();
  const verifyMock = jest.fn<
    Promise<boolean>,
    [password: string, encodedHash: string]
  >();
  const verifyDummyMock = jest.fn<Promise<void>, [password: string]>();
  const issueMock = jest.fn<string, [subject: string]>();

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    findUniqueMock.mockResolvedValue(null);
    createMock.mockResolvedValue(principalRecord);
    transactionMock.mockImplementation((callback) =>
      callback({ user: { create: createMock } }),
    );
    hashMock.mockResolvedValue(passwordHash);
    verifyMock.mockResolvedValue(true);
    verifyDummyMock.mockResolvedValue(undefined);
    issueMock.mockReturnValue('signed-access-token');

    const prisma = {
      user: { findUnique: findUniqueMock },
      $transaction: transactionMock,
    } as unknown as PrismaService;
    const passwordService = {
      hash: hashMock,
      verify: verifyMock,
      verifyDummy: verifyDummyMock,
    } as unknown as PasswordService;
    const tokenService = {
      issue: issueMock,
    } as unknown as TokenService;

    service = new AuthService(prisma, passwordService, tokenService);
  });

  it('hashes before atomically creating the user, organization, and owner membership', async () => {
    const result = await service.register(registerInput);

    expect(hashMock).toHaveBeenCalledWith(registerInput.password);
    expect(hashMock.mock.invocationCallOrder[0]).toBeLessThan(
      transactionMock.mock.invocationCallOrder[0],
    );
    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(createMock).toHaveBeenCalledTimes(1);

    const createArguments = createMock.mock.calls[0][0] as {
      data: {
        email: string;
        passwordHash: string;
        name: string | null;
        memberships: {
          create: {
            role: string;
            organization: { create: { name: string; slug: string } };
          };
        };
      };
    };
    expect(
      createArguments.data.memberships.create.organization.create.slug,
    ).toMatch(/^example-store-[a-f0-9]{32}$/);
    expect(createArguments.data).toEqual({
      email: registerInput.email,
      passwordHash,
      name: registerInput.name,
      memberships: {
        create: {
          role: 'owner',
          organization: {
            create: {
              name: registerInput.organizationName,
              slug: createArguments.data.memberships.create.organization.create
                .slug,
            },
          },
        },
      },
    });
    expect(result).toEqual({
      accessToken: 'signed-access-token',
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: {
        id: principalRecord.id,
        email: principalRecord.email,
        name: principalRecord.name,
      },
      organizations: [
        {
          id: 'organization_1',
          name: 'Example Store',
          slug: 'example-store-random',
          role: 'owner',
        },
      ],
    });
    expect(JSON.stringify(result)).not.toContain('passwordHash');
    expect(JSON.stringify(result)).not.toContain(registerInput.password);
  });

  it('rejects a pre-existing email before hashing or opening a transaction', async () => {
    findUniqueMock.mockResolvedValueOnce({ id: 'existing_user' });

    await expect(service.register(registerInput)).rejects.toBeInstanceOf(
      EmailAlreadyExistsException,
    );
    expect(hashMock).not.toHaveBeenCalled();
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it('maps a concurrent Prisma email conflict without exposing the database error', async () => {
    transactionMock.mockRejectedValueOnce({
      code: 'P2002',
      meta: { target: ['email'] },
    });

    await expect(service.register(registerInput)).rejects.toBeInstanceOf(
      EmailAlreadyExistsException,
    );
  });

  it('logs in with a verified hash and returns only safe current memberships', async () => {
    findUniqueMock.mockResolvedValueOnce({ ...principalRecord, passwordHash });

    const result = await service.login(loginInput);

    expect(verifyMock).toHaveBeenCalledWith(loginInput.password, passwordHash);
    expect(verifyDummyMock).not.toHaveBeenCalled();
    expect(result.user).toEqual({
      id: principalRecord.id,
      email: principalRecord.email,
      name: principalRecord.name,
    });
    expect(result.organizations).toEqual([
      {
        id: 'organization_1',
        name: 'Example Store',
        slug: 'example-store-random',
        role: 'owner',
      },
    ]);
    expect(JSON.stringify(result)).not.toContain('passwordHash');
  });

  it.each([
    ['unknown user', null],
    [
      'user without a local password',
      { ...principalRecord, passwordHash: null },
    ],
  ])(
    'uses the dummy path and generic error for %s',
    async (_caseName, user) => {
      findUniqueMock.mockResolvedValueOnce(user);

      await expect(service.login(loginInput)).rejects.toBeInstanceOf(
        InvalidCredentialsException,
      );
      expect(verifyDummyMock).toHaveBeenCalledWith(loginInput.password);
      expect(verifyMock).not.toHaveBeenCalled();
    },
  );

  it('keeps the generic credential error when dummy verification fails', async () => {
    findUniqueMock.mockResolvedValueOnce(null);
    verifyDummyMock.mockRejectedValueOnce(new Error('scrypt unavailable'));

    await expect(service.login(loginInput)).rejects.toBeInstanceOf(
      InvalidCredentialsException,
    );
    expect(verifyDummyMock).toHaveBeenCalledWith(loginInput.password);
  });

  it('uses the same generic error for a wrong password', async () => {
    findUniqueMock.mockResolvedValueOnce({ ...principalRecord, passwordHash });
    verifyMock.mockResolvedValueOnce(false);

    await expect(service.login(loginInput)).rejects.toBeInstanceOf(
      InvalidCredentialsException,
    );
    expect(verifyMock).toHaveBeenCalledWith(loginInput.password, passwordHash);
  });

  it('loads a safe current principal with deterministic membership ordering', async () => {
    findUniqueMock.mockResolvedValueOnce(principalRecord);

    await expect(service.findPrincipalById('user_1')).resolves.toEqual({
      user: {
        id: principalRecord.id,
        email: principalRecord.email,
        name: principalRecord.name,
      },
      organizations: [
        {
          id: 'organization_1',
          name: 'Example Store',
          slug: 'example-store-random',
          role: 'owner',
        },
      ],
    });
    const findArguments = findUniqueMock.mock.calls[0][0] as {
      where: { id: string };
      select: Record<string, unknown> & {
        memberships: { orderBy: unknown };
      };
    };
    expect(findArguments.where).toEqual({ id: 'user_1' });
    expect(findArguments.select).not.toHaveProperty('passwordHash');
    expect(findArguments.select.memberships.orderBy).toEqual([
      { createdAt: 'asc' },
      { id: 'asc' },
    ]);
  });
});
