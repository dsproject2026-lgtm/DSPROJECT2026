import type { RateLimitRuleConfig } from '../types/rate-limit.types.js';
import { env } from './env.js';

export const apiRateLimitConfig: RateLimitRuleConfig = {
  id: 'api-global',
  maxRequests: env.RATE_LIMIT_GLOBAL_MAX_REQUESTS,
  windowMs: env.RATE_LIMIT_GLOBAL_WINDOW_MS,
  blockDurationMs: env.RATE_LIMIT_GLOBAL_BLOCK_MS,
  skip: (request) => request.path.startsWith('/health'),
};

export const authRateLimitConfig: RateLimitRuleConfig = {
  id: 'auth-write',
  maxRequests: env.RATE_LIMIT_AUTH_MAX_REQUESTS,
  windowMs: env.RATE_LIMIT_AUTH_WINDOW_MS,
  blockDurationMs: env.RATE_LIMIT_AUTH_BLOCK_MS,
};

export const sseRateLimitConfig: RateLimitRuleConfig = {
  id: 'sse-stream',
  maxRequests: env.RATE_LIMIT_SSE_MAX_REQUESTS,
  windowMs: env.RATE_LIMIT_SSE_WINDOW_MS,
  blockDurationMs: env.RATE_LIMIT_SSE_BLOCK_MS,
};
