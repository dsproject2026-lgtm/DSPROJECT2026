import type { Request } from 'express';

export const getClientIp = (request: Request) => {
  const forwardedFor = request.headers['x-forwarded-for'];

  if (typeof forwardedFor === 'string') {
    return forwardedFor.split(',')[0]?.trim() || request.ip || '127.0.0.1';
  }

  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return forwardedFor[0] ?? request.ip ?? '127.0.0.1';
  }

  return request.ip || '127.0.0.1';
};
