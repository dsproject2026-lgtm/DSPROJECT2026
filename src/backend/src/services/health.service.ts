import { env, isDatabaseConfigured } from '../config/env.js';
import { healthRepository } from '../repositories/health.repository.js';
import type { ReadinessPayload } from '../types/health.types.js';

class HealthService {
  getLiveness() {
    return {
      status: 'ok' as const,
      timestamp: new Date().toISOString(),
      uptimeInSeconds: Math.floor(process.uptime()),
      environment: env.NODE_ENV,
    };
  }

  async getReadiness(): Promise<{ httpStatus: number; payload: ReadinessPayload }> {
    if (!isDatabaseConfigured) {
      return {
        httpStatus: 200,
        payload: {
          status: 'ok',
          timestamp: new Date().toISOString(),
          database: {
            configured: false,
            status: 'not_configured',
          },
        },
      };
    }

    try {
      await healthRepository.pingDatabase();

      return {
        httpStatus: 200,
        payload: {
          status: 'ok',
          timestamp: new Date().toISOString(),
          database: {
            configured: true,
            status: 'up',
          },
        },
      };
    } catch {
      return {
        httpStatus: 503,
        payload: {
          status: 'degraded',
          timestamp: new Date().toISOString(),
          database: {
            configured: true,
            status: 'down',
          },
        },
      };
    }
  }

  async getOverview() {
    const readiness = await this.getReadiness();

    return {
      httpStatus: readiness.httpStatus,
      payload: {
        ...this.getLiveness(),
        database: readiness.payload.database,
        security: {
          rateLimiter: {
            enabled: true,
            strategy: 'in_memory_sliding_window',
            scope: 'single_instance',
          },
        },
      },
    };
  }
}

export const healthService = new HealthService();
