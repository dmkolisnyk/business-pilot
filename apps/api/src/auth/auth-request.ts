import type { Request } from 'express';
import type { AuthPrincipal } from './auth.types';

export interface AuthenticatedRequest extends Request {
  auth?: AuthPrincipal;
}
