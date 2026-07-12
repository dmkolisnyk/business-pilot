import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  EmailAlreadyExistsException,
  InvalidCredentialsException,
} from './auth.errors';
import type {
  AuthPrincipal,
  AuthSessionResponse,
  PublicOrganizationRole,
} from './auth.types';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import { PasswordService } from './password.service';
import { ACCESS_TOKEN_EXPIRES_IN_SECONDS, TokenService } from './token.service';

const PRINCIPAL_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  memberships: {
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: {
      role: true,
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  },
} satisfies Prisma.UserSelect;

const LOGIN_USER_SELECT = {
  ...PRINCIPAL_USER_SELECT,
  passwordHash: true,
} satisfies Prisma.UserSelect;

interface PrincipalRecord {
  id: string;
  email: string;
  name: string | null;
  memberships: Array<{
    role: PublicOrganizationRole;
    organization: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isEmailUniqueConstraintError(error: unknown): boolean {
  if (!isRecord(error) || error.code !== 'P2002' || !isRecord(error.meta)) {
    return false;
  }

  const target = error.meta.target;
  if (typeof target === 'string') {
    return target.toLowerCase().includes('email');
  }

  return (
    Array.isArray(target) &&
    target.some(
      (field) =>
        typeof field === 'string' && field.toLowerCase().includes('email'),
    )
  );
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
  ) {}

  async register(input: RegisterDto): Promise<AuthSessionResponse> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });
    if (existingUser !== null) {
      throw new EmailAlreadyExistsException();
    }

    const passwordHash = await this.passwordService.hash(input.password);
    const organizationSlug = this.createOrganizationSlug(
      input.organizationName,
    );

    try {
      const createdUser = await this.prisma.$transaction((transaction) =>
        transaction.user.create({
          data: {
            email: input.email,
            passwordHash,
            name: input.name,
            memberships: {
              create: {
                role: 'owner',
                organization: {
                  create: {
                    name: input.organizationName,
                    slug: organizationSlug,
                  },
                },
              },
            },
          },
          select: PRINCIPAL_USER_SELECT,
        }),
      );

      return this.createSession(this.toPrincipal(createdUser));
    } catch (error) {
      if (isEmailUniqueConstraintError(error)) {
        throw new EmailAlreadyExistsException();
      }

      throw error;
    }
  }

  async login(input: LoginDto): Promise<AuthSessionResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
      select: LOGIN_USER_SELECT,
    });

    if (user === null || user.passwordHash === null) {
      await this.passwordService
        .verifyDummy(input.password)
        .catch(() => undefined);
      throw new InvalidCredentialsException();
    }

    const passwordMatches = await this.passwordService.verify(
      input.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new InvalidCredentialsException();
    }

    return this.createSession(this.toPrincipal(user));
  }

  async findPrincipalById(userId: string): Promise<AuthPrincipal | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: PRINCIPAL_USER_SELECT,
    });

    return user === null ? null : this.toPrincipal(user);
  }

  private createOrganizationSlug(organizationName: string): string {
    const base = organizationName
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48);
    const suffix = randomBytes(16).toString('hex');

    return `${base || 'workspace'}-${suffix}`;
  }

  private createSession(principal: AuthPrincipal): AuthSessionResponse {
    return {
      accessToken: this.tokenService.issue(principal.user.id),
      tokenType: 'Bearer',
      expiresIn: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
      ...principal,
    };
  }

  private toPrincipal(user: PrincipalRecord): AuthPrincipal {
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      organizations: user.memberships.map((membership) => ({
        id: membership.organization.id,
        name: membership.organization.name,
        slug: membership.organization.slug,
        role: membership.role,
      })),
    };
  }
}
