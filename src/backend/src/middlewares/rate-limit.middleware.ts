import type { RequestHandler, Response } from 'express';

import {
  apiRateLimitConfig,
  authRateLimitConfig,
  sseRateLimitConfig,
} from '../config/rate-limit.js';
import { createInMemoryRateLimiter } from '../services/rate-limit.service.js';
import type { RateLimitRuleConfig, RateLimitState } from '../types/rate-limit.types.js';
import { AppError } from '../utils/app-error.js';

const formatPolicy = (config: RateLimitRuleConfig) =>
  `${config.maxRequests};w=${Math.ceil(config.windowMs / 1000)}`;

const setRateLimitHeaders = (
  response: Response,
  config: RateLimitRuleConfig,
  state: RateLimitState,
) => {
  const resetInSeconds = Math.max(0, Math.ceil((state.resetAt - Date.now()) / 1000));

  response.setHeader('RateLimit-Policy', formatPolicy(config));
  response.setHeader('RateLimit-Limit', String(state.limit));
  response.setHeader('RateLimit-Remaining', String(state.remaining));
  response.setHeader('RateLimit-Reset', String(resetInSeconds));

  response.setHeader('X-RateLimit-Limit', String(state.limit));
  response.setHeader('X-RateLimit-Remaining', String(state.remaining));
  response.setHeader('X-RateLimit-Reset', String(resetInSeconds));

  if (state.isBlocked) {
    response.setHeader('Retry-After', String(resetInSeconds));
  }
};

export const createRateLimitMiddleware = (config: RateLimitRuleConfig): RequestHandler => {
  const limiter = createInMemoryRateLimiter(config);

  return (request, response, next) => {
    const state = limiter.evaluate(request);

    if (!state) {
      next();
      return;
    }

    setRateLimitHeaders(response, config, state);

    if (state.isBlocked) {
      const retryAfterSeconds = Math.max(0, Math.ceil((state.resetAt - Date.now()) / 1000));

      next(
        new AppError('Too many requests. Please try again later.', 429, 'RATE_LIMIT_EXCEEDED', {
          rule: config.id,
          limit: state.limit,
          remaining: state.remaining,
          totalHits: state.totalHits,
          retryAfterSeconds,
          resetAt: new Date(state.resetAt).toISOString(),
          ...(state.blockedUntil !== undefined
            ? { blockedUntil: new Date(state.blockedUntil).toISOString() }
            : {}),
        }),
      );
      return;
    }

    next();
  };
};

export const apiRateLimitMiddleware = createRateLimitMiddleware(apiRateLimitConfig);
export const authRateLimitMiddleware = createRateLimitMiddleware(authRateLimitConfig);
export const sseRateLimitMiddleware = createRateLimitMiddleware(sseRateLimitConfig);
