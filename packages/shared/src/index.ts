export type BusinessPilotHealthResponse = {
  service: 'business-pilot-api';
  status: 'ok';
  timestamp: string;
};

export type ApiErrorResponse = {
  message: string;
  statusCode: number;
  error?: string;
};

export type OrganizationId = string;
export type UserId = string;

export type WooCommerceConnectionStatus =
  | 'not_connected'
  | 'pending'
  | 'connected'
  | 'failed';

export type SyncStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';