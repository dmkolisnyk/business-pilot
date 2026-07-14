import type { ExecutionContext } from '@nestjs/common';
import { AuthenticationRequiredException } from './auth.errors';
import { BearerAuthGuard } from './auth.guard';
import type { AuthenticatedRequest } from './auth-request';
import type { AuthPrincipal } from './auth.types';
import type { AuthService } from './auth.service';
import type { TokenService } from './token.service';

jest.mock('./auth.service', () => ({
  AuthService: jest.fn(),
}));

const token = 'header.payload.signature';
const principal: AuthPrincipal = {
  user: {
    id: 'user_1',
    email: 'owner@example.com',
    name: 'Store Owner',
  },
  organizations: [
    {
      id: 'organization_1',
      name: 'Example Store',
      slug: 'example-store-random',
      role: 'owner',
    },
  ],
};

function createExecutionContext(authorization?: string): {
  context: ExecutionContext;
  request: AuthenticatedRequest;
  setHeader: jest.Mock<void, [name: string, value: string]>;
} {
  return createExecutionContextWithHeaders(
    authorization === undefined ? [] : [authorization],
  );
}

function createExecutionContextWithHeaders(authorizationValues: string[]): {
  context: ExecutionContext;
  request: AuthenticatedRequest;
  setHeader: jest.Mock<void, [name: string, value: string]>;
} {
  const authorization = authorizationValues[0];
  const request = {
    headers: authorization === undefined ? {} : { authorization },
    headersDistinct:
      authorizationValues.length === 0
        ? {}
        : { authorization: authorizationValues },
  } as AuthenticatedRequest;
  const setHeader = jest.fn<void, [name: string, value: string]>();
  const context = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({ setHeader }),
    }),
  } as ExecutionContext;

  return { context, request, setHeader };
}

describe('BearerAuthGuard', () => {
  const verifyMock = jest.fn<
    { subject: string } | null,
    [tokenValue: string]
  >();
  const findPrincipalMock = jest.fn<
    Promise<AuthPrincipal | null>,
    [userId: string]
  >();
  let guard: BearerAuthGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    verifyMock.mockReturnValue({ subject: 'user_1' });
    findPrincipalMock.mockResolvedValue(principal);

    guard = new BearerAuthGuard(
      { verify: verifyMock } as unknown as TokenService,
      {
        findPrincipalById: findPrincipalMock,
      } as unknown as AuthService,
    );
  });

  it('verifies one bearer credential and attaches the current safe principal', async () => {
    const { context, request, setHeader } = createExecutionContext(
      `Bearer ${token}`,
    );

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(verifyMock).toHaveBeenCalledWith(token);
    expect(findPrincipalMock).toHaveBeenCalledWith('user_1');
    expect(request.auth).toBe(principal);
    expect(setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
  });

  it.each([
    ['missing header', undefined],
    ['wrong scheme', `Basic ${token}`],
    ['missing JWT segments', 'Bearer one-segment'],
    ['multiple credentials', `Bearer ${token}, Bearer ${token}`],
    ['extra whitespace', `Bearer  ${token}`],
  ])('rejects a %s', async (_caseName, authorization) => {
    const { context, setHeader } = createExecutionContext(authorization);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      AuthenticationRequiredException,
    );
    expect(verifyMock).not.toHaveBeenCalled();
    expect(findPrincipalMock).not.toHaveBeenCalled();
    expect(setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
  });

  it('rejects duplicate physical authorization header values', async () => {
    const { context } = createExecutionContextWithHeaders([
      `Bearer ${token}`,
      `Bearer ${token}`,
    ]);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      AuthenticationRequiredException,
    );
    expect(verifyMock).not.toHaveBeenCalled();
    expect(findPrincipalMock).not.toHaveBeenCalled();
  });

  it('rejects a token that fails strict verification', async () => {
    verifyMock.mockReturnValueOnce(null);
    const { context } = createExecutionContext(`Bearer ${token}`);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      AuthenticationRequiredException,
    );
    expect(findPrincipalMock).not.toHaveBeenCalled();
  });

  it('rejects a valid token whose subject no longer exists', async () => {
    findPrincipalMock.mockResolvedValueOnce(null);
    const { context } = createExecutionContext(`Bearer ${token}`);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      AuthenticationRequiredException,
    );
    expect(findPrincipalMock).toHaveBeenCalledWith('user_1');
  });
});
