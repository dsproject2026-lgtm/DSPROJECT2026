import { beforeEach, describe, expect, it, vi } from 'vitest';

const { authRepositoryMock, emailServiceMock } = vi.hoisted(() => ({
  authRepositoryMock: {
    findUserByCodigo: vi.fn(),
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

describe('AuthService.startLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns PASSWORD step when user already has password', async () => {
    authRepositoryMock.findUserByCodigo.mockResolvedValue({
      id: 'u1',
      codigo: '2026001',
      nome: 'User',
      email: 'user@example.com',
      perfil: 'ELEITOR',
      activo: true,
      mustSetPassword: false,
      createdAt: new Date(),
      senhaHash: '$2b$12$existinghash',
      passwordSetupTokenHash: null,
      passwordSetupTokenExpiresAt: null,
      candidaturas: [],
    });

    const result = await authService.startLogin({ codigo: '2026001' });

    expect(result.nextStep).toBe('PASSWORD');
    expect('loginFlowToken' in result).toBe(true);
    expect(authRepositoryMock.updatePasswordSetupTokenById).not.toHaveBeenCalled();
    expect(emailServiceMock.sendFirstAccessEmail).not.toHaveBeenCalled();
  });

  it('returns EMAIL_TOKEN and sends email when password setup is required', async () => {
    authRepositoryMock.findUserByCodigo.mockResolvedValue({
      id: 'u2',
      codigo: 'CSV0001',
      nome: 'CSV User',
      email: 'csv@example.com',
      perfil: 'ELEITOR',
      activo: true,
      mustSetPassword: true,
      createdAt: new Date(),
      senhaHash: null,
      passwordSetupTokenHash: null,
      passwordSetupTokenExpiresAt: null,
      candidaturas: [],
    });

    const result = await authService.startLogin({ codigo: 'CSV0001' });

    expect(result.nextStep).toBe('EMAIL_TOKEN');
    expect(result.expiresInSeconds).toEqual(expect.any(Number));
    expect(authRepositoryMock.updatePasswordSetupTokenById).toHaveBeenCalledTimes(1);
    expect(emailServiceMock.sendFirstAccessEmail).toHaveBeenCalledTimes(1);
  });
});
