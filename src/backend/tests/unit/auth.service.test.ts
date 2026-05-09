import { beforeEach, describe, expect, it, vi } from 'vitest';

const { authRepositoryMock, emailServiceMock } = vi.hoisted(() => ({
  authRepositoryMock: {
    findUserByCodigo: vi.fn(),
    findUserById: vi.fn(),
    updatePasswordSetupTokenById: vi.fn(),
    createRefreshToken: vi.fn(),
  },
  emailServiceMock: {
    sendFirstAccessEmail: vi.fn(),
    sendPasswordRecoveryEmail: vi.fn(),
  },
}));

vi.mock('../../src/repositories/auth.repository.js', () => ({
  authRepository: authRepositoryMock,
}));

vi.mock('../../src/services/email.service.js', () => ({
  emailService: emailServiceMock,
}));

import { authService } from '../../src/services/auth.service.js';
import type { AppError } from '../../src/utils/app-error.js';

const buildAuthUser = (overrides: Record<string, unknown> = {}) => ({
  id: 'u1',
  codigo: '2026001',
  nome: 'User',
  email: 'user@example.com',
  perfil: 'ELEITOR',
  activo: true,
  mustSetPassword: false,
  createdAt: new Date('2026-04-01T10:00:00.000Z'),
  senhaHash: '$2b$12$existinghash',
  passwordSetupTokenHash: null,
  passwordSetupTokenExpiresAt: null,
  candidaturas: [],
  ...overrides,
});

describe('AuthService.startLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns PASSWORD step when user already has password', async () => {
    authRepositoryMock.findUserByCodigo.mockResolvedValue(buildAuthUser());

    const result = await authService.startLogin({ codigo: '2026001' });

    expect(result.nextStep).toBe('PASSWORD');
    expect('loginFlowToken' in result).toBe(true);
    expect(authRepositoryMock.updatePasswordSetupTokenById).not.toHaveBeenCalled();
    expect(emailServiceMock.sendFirstAccessEmail).not.toHaveBeenCalled();
  });

  it('returns EMAIL_TOKEN and sends email when password setup is required', async () => {
    authRepositoryMock.findUserByCodigo.mockResolvedValue(
      buildAuthUser({
        id: 'u2',
        codigo: 'CSV0001',
        nome: 'CSV User',
        email: 'csv@example.com',
        mustSetPassword: true,
        senhaHash: null,
      }),
    );

    const result = await authService.startLogin({ codigo: 'CSV0001' });

    expect(result.nextStep).toBe('EMAIL_TOKEN');
    expect(result.expiresInSeconds).toEqual(expect.any(Number));
    expect(authRepositoryMock.updatePasswordSetupTokenById).toHaveBeenCalledTimes(1);
    expect(emailServiceMock.sendFirstAccessEmail).toHaveBeenCalledTimes(1);
  });
});

describe('AuthService.getCurrentUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the authenticated user without password or token fields', async () => {
    authRepositoryMock.findUserById.mockResolvedValue(buildAuthUser());

    const result = await authService.getCurrentUser('u1');

    expect(result).toEqual({
      id: 'u1',
      codigo: '2026001',
      nome: 'User',
      email: 'user@example.com',
      perfil: 'ELEITOR',
      activo: true,
      mustSetPassword: false,
      createdAt: new Date('2026-04-01T10:00:00.000Z'),
      candidaturas: [],
    });
    expect('senhaHash' in result).toBe(false);
    expect('passwordSetupTokenHash' in result).toBe(false);
  });

  it('rejects inactive authenticated users', async () => {
    authRepositoryMock.findUserById.mockResolvedValue(buildAuthUser({ activo: false }));

    await expect(authService.getCurrentUser('u1')).rejects.toMatchObject({
      code: 'AUTH_ACCOUNT_INACTIVE',
      statusCode: 403,
    } satisfies Partial<AppError>);
  });
});
