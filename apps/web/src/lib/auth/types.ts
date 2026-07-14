export type AuthOrganizationRole = 'owner' | 'admin' | 'member';

export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
}

export interface PublicOrganizationMembership {
  id: string;
  name: string;
  slug: string;
  role: AuthOrganizationRole;
}

export interface AuthPrincipal {
  user: PublicUser;
  organizations: PublicOrganizationMembership[];
}

export interface AuthSessionResponse extends AuthPrincipal {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

export interface AuthErrorResponse {
  statusCode: number;
  code: string;
  message: string;
  errors?: ValidationErrorDetail[];
}

