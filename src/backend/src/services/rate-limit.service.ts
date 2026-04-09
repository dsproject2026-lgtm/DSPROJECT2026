import type { Request } from 'express';

import type { RateLimitRuleConfig, RateLimitState } from '../types/rate-limit.types.js';
import { getClientIp } from '../utils/get-client-ip.js';

interface RateLimitEntry {
  hits: number[];
  lastSeenAt: number;
  blockedUntil?: number;
}

class InMemoryRateLimiter {
  private readonly entries = new Map<string, RateLimitEntry>();
  private readonly cleanupTimer: NodeJS.Timeout;

  constructor(private readonly config: RateLimitRuleConfig) {
    const cleanupIntervalMs = Math.max(
      60_000,
      Math.min(this.config.windowMs, this.config.blockDurationMs),
    );

    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, cleanupIntervalMs);
    this.cleanupTimer.unref?.();
  }

  evaluate(request: Request): RateLimitState | null {
    if (this.config.skip?.(request)) {
      return null;
    }

    const now = Date.now();
    const key = this.buildKey(request);
    const entry = this.entries.get(key) ?? {
      hits: [],
      lastSeenAt: now,
    };

    entry.lastSeenAt = now;
    entry.hits = entry.hits.filter((timestamp) => now - timestamp < this.config.windowMs);

    if (entry.blockedUntil && entry.blockedUntil > now) {
      this.entries.set(key, entry);
      return this.buildState(entry, now, true);
    }

    if (entry.blockedUntil && entry.blockedUntil <= now) {
      delete entry.blockedUntil;
    }

    entry.hits.push(now);

    if (entry.hits.length > this.config.maxRequests) {
      entry.blockedUntil = now + this.config.blockDurationMs;
      this.entries.set(key, entry);
      return this.buildState(entry, now, true);
    }

    this.entries.set(key, entry);
    return this.buildState(entry, now, false);
  }

  private buildKey(request: Request) {
    const key = this.config.keyGenerator?.(request) ?? getClientIp(request);
    return `${this.config.id}:${key}`;
  }

  private buildState(entry: RateLimitEntry, now: number, isBlocked: boolean): RateLimitState {
    const oldestHit = entry.hits[0] ?? now;
    const windowResetAt = oldestHit + this.config.windowMs;
    const resetAt = isBlocked ? Math.max(entry.blockedUntil ?? now, windowResetAt) : windowResetAt;

    return {
      totalHits: entry.hits.length,
      limit: this.config.maxRequests,
      remaining: isBlocked ? 0 : Math.max(this.config.maxRequests - entry.hits.length, 0),
      resetAt,
      isBlocked,
      ...(entry.blockedUntil !== undefined ? { blockedUntil: entry.blockedUntil } : {}),
    };
  }

  private cleanup() {
    const now = Date.now();
    const ttlMs = Math.max(this.config.windowMs, this.config.blockDurationMs) * 2;

    for (const [key, entry] of this.entries) {
      const hasActiveBlock = entry.blockedUntil !== undefined && entry.blockedUntil > now;
      const hasRecentActivity = now - entry.lastSeenAt <= ttlMs;

      if (!hasActiveBlock && !hasRecentActivity) {
        this.entries.delete(key);
      }
    }
  }
}

export const createInMemoryRateLimiter = (config: RateLimitRuleConfig) =>
  new InMemoryRateLimiter(config);
