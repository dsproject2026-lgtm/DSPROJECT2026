import type { Request } from 'express';

export interface RateLimitRuleConfig {
  id: string;
  maxRequests: number;
  windowMs: number;
  blockDurationMs: number;
  skip?: (request: Request) => boolean;
  keyGenerator?: (request: Request) => string;
}

export interface RateLimitState {
  totalHits: number;
  limit: number;
  remaining: number;
  resetAt: number;
  isBlocked: boolean;
  blockedUntil?: number;
}
