import { describe, expect, it } from 'vitest';

import {
  generateSecureToken,
  hashSecureToken,
  safeEqualTokenHash,
} from '../../src/utils/secure-token.js';

describe('secure-token utils', () => {
  it('generates random hex tokens', () => {
    const tokenA = generateSecureToken();
    const tokenB = generateSecureToken();

    expect(tokenA).toMatch(/^[a-f0-9]{64}$/);
    expect(tokenB).toMatch(/^[a-f0-9]{64}$/);
    expect(tokenA).not.toBe(tokenB);
  });

  it('hashes deterministically and compares safely', () => {
    const token = generateSecureToken();
    const hash1 = hashSecureToken(token);
    const hash2 = hashSecureToken(token);
    const otherHash = hashSecureToken(generateSecureToken());

    expect(hash1).toBe(hash2);
    expect(safeEqualTokenHash(hash1, hash2)).toBe(true);
    expect(safeEqualTokenHash(hash1, otherHash)).toBe(false);
  });
});
