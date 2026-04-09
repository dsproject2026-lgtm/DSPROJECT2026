export type HealthStatus = 'ok' | 'degraded';
export type DatabaseStatus = 'up' | 'down' | 'not_configured';

export interface ReadinessPayload {
  status: HealthStatus;
  timestamp: string;
  database: {
    configured: boolean;
    status: DatabaseStatus;
  };
}
