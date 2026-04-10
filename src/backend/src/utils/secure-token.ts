import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export const generateSecureToken = () => randomBytes(32).toString('hex');

export const hashSecureToken = (token: string) => {
  return createHash('sha256').update(token).digest('hex');
};

export const safeEqualTokenHash = (providedHash: string, storedHash: string) => {
  if (providedHash.length !== storedHash.length) {
    return false;
  }

  const provided = Buffer.from(providedHash, 'utf8');
  const stored = Buffer.from(storedHash, 'utf8');

  return timingSafeEqual(provided, stored);
};
