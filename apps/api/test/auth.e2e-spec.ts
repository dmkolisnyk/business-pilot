import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import type { AuthSessionResponse } from '../src/auth/auth.types';
import { PrismaService } from '../src/prisma/prisma.service';

const TEST_JWT_SECRET = 'test-only-jwt-secret-with-at-least-32-bytes';
const PASSWORD = 'correct horse battery staple';

interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string | null;
}

interface StoredOrganization {
  id: string;
  name: string;
  slug: string;
}

interface StoredMembership {
  id: string;
  userId: string;
  organizationId: string;
  role: 'owner' | 'admin' | 'member';
  createdOrder: number;
}

interface FindUniqueArguments {
  where: {
    id?: string;
    email?: string;
  };
  select?: Record<string, unknown>;
}

interface CreateUserArguments {
  data: {
    email: string;
    passwordHash: string;
    name: string | null;
    memberships: {
      create: {
        role: 'owner';
        organization: {
          create: {
            name: string;
            slug: string;
          };
        };
      };
    };
  };
  select: Record<string, unknown>;
}

interface FakeTransactionClient {
  user: {
    create: (args: unknown) => Promise<unknown>;
  };
}

class StatefulPrismaDouble {
  readonly user = {
    findUnique: (args: unknown): Promise<unknown> => this.findUniqueUser(args),
  };

  private users: StoredUser[] = [];
  private organizations: StoredOrganization[] = [];
  private memberships: StoredMembership[] = [];
  private nextUserId = 1;
  private nextOrganizationId = 1;
  private nextMembershipId = 1;
  private nextCreatedOrder = 1;
  private rejectNextCreateAfterStaging = false;
  transactionCount = 0;

  reset(): void {
    this.users = [];
    this.organizations = [];
    this.memberships = [];
    this.nextUserId = 1;
    this.nextOrganizationId = 1;
    this.nextMembershipId = 1;
    this.nextCreatedOrder = 1;
    this.rejectNextCreateAfterStaging = false;
    this.transactionCount = 0;
  }

  rejectNextCreateWithEmailConflictAfterStaging(): void {
    this.rejectNextCreateAfterStaging = true;
  }

  async $transaction<T>(
    callback: (transaction: FakeTransactionClient) => Promise<T>,
  ): Promise<T> {
    this.transactionCount += 1;
    const snapshot = {
      users: [...this.users],
      organizations: [...this.organizations],
      memberships: [...this.memberships],
      nextUserId: this.nextUserId,
      nextOrganizationId: this.nextOrganizationId,
      nextMembershipId: this.nextMembershipId,
      nextCreatedOrder: this.nextCreatedOrder,
    };

    try {
      return await callback({
        user: {
          create: (args: unknown) => this.createUserWithOrganization(args),
        },
      });
    } catch (error) {
      this.users = snapshot.users;
      this.organizations = snapshot.organizations;
      this.memberships = snapshot.memberships;
      this.nextUserId = snapshot.nextUserId;
      this.nextOrganizationId = snapshot.nextOrganizationId;
      this.nextMembershipId = snapshot.nextMembershipId;
      this.nextCreatedOrder = snapshot.nextCreatedOrder;
      throw error;
    }
  }

  get counts(): { users: number; organizations: number; memberships: number } {
    return {
      users: this.users.length,
      organizations: this.organizations.length,
      memberships: this.memberships.length,
    };
  }

  getStoredUser(email: string): StoredUser | undefined {
    return this.users.find((user) => user.email === email);
  }

  getMemberships(): StoredMembership[] {
    return [...this.memberships];
  }

  deleteUser(userId: string): void {
    this.users = this.users.filter((user) => user.id !== userId);
    this.memberships = this.memberships.filter(
      (membership) => membership.userId !== userId,
    );
  }

  private findUniqueUser(args: unknown): Promise<unknown> {
    const { where, select } = args as FindUniqueArguments;
    if (select === undefined) {
      throw new Error(
        'Stateful Prisma double requires an explicit safe select',
      );
    }

    const user =
      where.email !== undefined
        ? this.users.find((candidate) => candidate.email === where.email)
        : this.users.find((candidate) => candidate.id === where.id);
    if (user === undefined) {
      return Promise.resolve(null);
    }

    const result: Record<string, unknown> = {};
    if (select.id === true) {
      result.id = user.id;
    }
    if (select.email === true) {
      result.email = user.email;
    }
    if (select.name === true) {
      result.name = user.name;
    }
    if (select.passwordHash === true) {
      result.passwordHash = user.passwordHash;
    }
    if (typeof select.memberships === 'object') {
      result.memberships = this.memberships
        .filter((membership) => membership.userId === user.id)
        .sort(
          (left, right) =>
            left.createdOrder - right.createdOrder ||
            left.id.localeCompare(right.id),
        )
        .map((membership) => {
          const organization = this.organizations.find(
            (candidate) => candidate.id === membership.organizationId,
          );
          if (organization === undefined) {
            throw new Error(
              'Stateful Prisma double has an orphaned membership',
            );
          }

          return {
            role: membership.role,
            organization: { ...organization },
          };
        });
    }

    return Promise.resolve(result);
  }

  private createUserWithOrganization(args: unknown): Promise<unknown> {
    const { data, select } = args as CreateUserArguments;
    if (this.users.some((user) => user.email === data.email)) {
      return Promise.reject(
        Object.assign(new Error('Unique constraint failed'), {
          code: 'P2002',
          meta: { target: ['email'] },
        }),
      );
    }

    const user: StoredUser = {
      id: `user_${this.nextUserId++}`,
      email: data.email,
      passwordHash: data.passwordHash,
      name: data.name,
    };
    const organization: StoredOrganization = {
      id: `organization_${this.nextOrganizationId++}`,
      name: data.memberships.create.organization.create.name,
      slug: data.memberships.create.organization.create.slug,
    };
    const membership: StoredMembership = {
      id: `membership_${this.nextMembershipId++}`,
      userId: user.id,
      organizationId: organization.id,
      role: data.memberships.create.role,
      createdOrder: this.nextCreatedOrder++,
    };

    this.users.push(user);
    this.organizations.push(organization);
    this.memberships.push(membership);

    if (this.rejectNextCreateAfterStaging) {
      this.rejectNextCreateAfterStaging = false;
      return Promise.reject(
        Object.assign(new Error('Concurrent email conflict'), {
          code: 'P2002',
          meta: { target: ['email'] },
        }),
      );
    }

    return this.findUniqueUser({
      where: { id: user.id },
      select,
    });
  }
}

function tamperToken(token: string): string {
  const [header, claims, signature] = token.split('.');
  const tamperedSignature = `${signature.startsWith('A') ? 'B' : 'A'}${signature.slice(
    1,
  )}`;
  return `${header}.${claims}.${tamperedSignature}`;
}

describe('Authentication bootstrap (e2e)', () => {
  const originalJwtSecret = process.env.JWT_SECRET;
  const prisma = new StatefulPrismaDouble();
  let app: INestApplication<App>;

  beforeAll(async () => {
    process.env.JWT_SECRET = TEST_JWT_SECRET;
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    prisma.reset();
  });

  afterAll(async () => {
    await app.close();
    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }
  });

  it('registers, authenticates, and protects the complete bootstrap flow', async () => {
    const registration = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: ' Owner@Example.COM ', password: PASSWORD })
      .expect(201)
      .expect('Cache-Control', 'no-store');
    const registrationBody = registration.body as AuthSessionResponse;

    expect(typeof registrationBody.accessToken).toBe('string');
    expect(registrationBody.accessToken.length).toBeGreaterThan(0);
    expect(registrationBody.organizations[0].slug).toMatch(
      /^my-workspace-[a-f0-9]{32}$/,
    );
    expect(registrationBody).toEqual({
      accessToken: registrationBody.accessToken,
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: {
        id: 'user_1',
        email: 'owner@example.com',
        name: null,
      },
      organizations: [
        {
          id: 'organization_1',
          name: 'My Workspace',
          slug: registrationBody.organizations[0].slug,
          role: 'owner',
        },
      ],
    });
    expect(prisma.transactionCount).toBe(1);
    expect(prisma.counts).toEqual({
      users: 1,
      organizations: 1,
      memberships: 1,
    });
    expect(prisma.getMemberships()).toEqual([
      expect.objectContaining({
        userId: 'user_1',
        organizationId: 'organization_1',
        role: 'owner',
      }),
    ]);
    const storedUser = prisma.getStoredUser('owner@example.com');
    expect(storedUser?.passwordHash).toMatch(
      /^scrypt\$v1\$32768\$8\$3\$[A-Za-z0-9_-]{22}\$[A-Za-z0-9_-]{43}$/,
    );
    expect(storedUser?.passwordHash).not.toBe(PASSWORD);
    expect(JSON.stringify(registrationBody)).not.toContain('passwordHash');
    expect(JSON.stringify(registrationBody)).not.toContain(PASSWORD);

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: ' owner@EXAMPLE.com ', password: PASSWORD })
      .expect(409)
      .expect({
        statusCode: 409,
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'An account with this email already exists',
      });
    expect(prisma.counts).toEqual({
      users: 1,
      organizations: 1,
      memberships: 1,
    });
    expect(prisma.transactionCount).toBe(1);

    prisma.rejectNextCreateWithEmailConflictAfterStaging();
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'race@example.com', password: PASSWORD })
      .expect(409)
      .expect({
        statusCode: 409,
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'An account with this email already exists',
      });
    expect(prisma.getStoredUser('race@example.com')).toBeUndefined();
    expect(prisma.counts).toEqual({
      users: 1,
      organizations: 1,
      memberships: 1,
    });
    expect(prisma.transactionCount).toBe(2);

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: ' OWNER@example.COM ', password: PASSWORD })
      .expect(200)
      .expect('Cache-Control', 'no-store');
    const loginBody = login.body as AuthSessionResponse;
    expect(loginBody.user).toEqual(registrationBody.user);
    expect(loginBody.organizations).toEqual(registrationBody.organizations);
    expect(loginBody.accessToken).toEqual(expect.any(String));
    expect(JSON.stringify(loginBody)).not.toContain('passwordHash');

    const invalidCredentials = {
      statusCode: 401,
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password',
    };
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'owner@example.com', password: 'wrong password value' })
      .expect(401)
      .expect(invalidCredentials);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'unknown@example.com', password: 'wrong password value' })
      .expect(401)
      .expect(invalidCredentials);

    const authenticationRequired = {
      statusCode: 401,
      code: 'AUTHENTICATION_REQUIRED',
      message: 'Authentication required',
    };
    await request(app.getHttpServer())
      .get('/auth/me')
      .expect(401)
      .expect('Cache-Control', 'no-store')
      .expect(authenticationRequired);
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', 'Bearer not-a-jwt')
      .expect(401)
      .expect('Cache-Control', 'no-store')
      .expect(authenticationRequired);
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${tamperToken(loginBody.accessToken)}`)
      .expect(401)
      .expect('Cache-Control', 'no-store')
      .expect(authenticationRequired);
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', [
        `Bearer ${loginBody.accessToken}`,
        `Bearer ${loginBody.accessToken}`,
      ] as unknown as string)
      .expect(401)
      .expect('Cache-Control', 'no-store')
      .expect(authenticationRequired);

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${loginBody.accessToken}`)
      .expect(200)
      .expect('Cache-Control', 'no-store')
      .expect({
        user: registrationBody.user,
        organizations: registrationBody.organizations,
      });

    prisma.deleteUser(registrationBody.user.id);
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${loginBody.accessToken}`)
      .expect(401)
      .expect('Cache-Control', 'no-store')
      .expect(authenticationRequired);
  });

  it('uses validated optional user and organization names', async () => {
    const registration = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'named@example.com',
        password: PASSWORD,
        name: '  Store Owner  ',
        organizationName: '  Example Store  ',
        ignoredAdminFlag: true,
      })
      .expect(201);
    const body = registration.body as AuthSessionResponse;

    expect(body.user.name).toBe('Store Owner');
    expect(body.organizations[0].slug).toMatch(/^example-store-[a-f0-9]{32}$/);
    expect(body.organizations).toEqual([
      {
        id: 'organization_1',
        name: 'Example Store',
        slug: body.organizations[0].slug,
        role: 'owner',
      },
    ]);
    expect(JSON.stringify(body)).not.toContain('ignoredAdminFlag');
  });

  it('returns deterministic validation errors without writing tenant data', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'not-an-email', password: 'short', name: ' ' })
      .expect(400)
      .expect({
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        errors: [
          { field: 'email', message: 'Email is invalid' },
          { field: 'password', message: 'Password is invalid' },
          { field: 'name', message: 'Name is invalid' },
        ],
      });

    expect(prisma.counts).toEqual({
      users: 0,
      organizations: 0,
      memberships: 0,
    });
    expect(prisma.transactionCount).toBe(0);
  });

  it('rejects ill-formed Unicode passwords and accepts code-point limits', async () => {
    const invalidRegistrationPassword = `${'a'.repeat(14)}\ud800`;
    const invalidLoginPassword = `${'a'.repeat(14)}\ud801`;
    const passwordValidationError = {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      errors: [{ field: 'password', message: 'Password is invalid' }],
    };

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'unicode@example.com',
        password: invalidRegistrationPassword,
      })
      .expect(400)
      .expect(passwordValidationError);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'unicode@example.com', password: invalidLoginPassword })
      .expect(400)
      .expect(passwordValidationError);

    const wellFormedPassword = '🔐'.repeat(15);
    const userName = '😀'.repeat(100);
    const organizationName = '🏪'.repeat(100);
    const registration = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'unicode@example.com',
        password: wellFormedPassword,
        name: userName,
        organizationName,
      })
      .expect(201);
    const registrationBody = registration.body as AuthSessionResponse;
    expect(registrationBody.user.name).toBe(userName);
    expect(registrationBody.organizations[0].name).toBe(organizationName);
    expect(registrationBody.organizations[0].slug).toMatch(
      /^workspace-[a-f0-9]{32}$/,
    );

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'unicode@example.com', password: wellFormedPassword })
      .expect(200);
  });

  it('keeps root and health public with their existing contracts', async () => {
    await request(app.getHttpServer()).get('/').expect(200).expect({
      service: 'business-pilot-api',
      message: 'Business Pilot API',
      status: 'ok',
    });

    const health = await request(app.getHttpServer())
      .get('/health')
      .expect(200);
    const body = health.body as {
      service: string;
      status: string;
      timestamp: string;
    };
    expect(typeof body.timestamp).toBe('string');
    expect(body).toEqual({
      service: 'business-pilot-api',
      status: 'ok',
      timestamp: body.timestamp,
    });
  });
});
