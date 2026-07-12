export type PublicOrganizationRole = 'owner' | 'admin' | 'member';

export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
}

export interface PublicOrganizationMembership {
  id: string;
  name: string;
  slug: string;
  role: PublicOrganizationRole;
}

export interface AuthPrincipal {
  user: PublicUser;
  organizations: PublicOrganizationMembership[];
}

export interface AuthSessionResponse extends AuthPrincipal {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: 3600;
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

export interface VerifiedAccessToken {
  subject: string;
}
