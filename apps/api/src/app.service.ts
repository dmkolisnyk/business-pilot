import { Injectable } from '@nestjs/common';
import type { BusinessPilotHealthResponse } from '@business-pilot/shared';

@Injectable()
export class AppService {
  getRoot() {
    return {
      service: 'business-pilot-api',
      message: 'Business Pilot API',
      status: 'ok',
    };
  }

  getHealth(): BusinessPilotHealthResponse {
    return {
      service: 'business-pilot-api',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
