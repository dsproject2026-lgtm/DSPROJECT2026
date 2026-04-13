import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { authServiceMock } = vi.hoisted(() => ({
  authServiceMock: {
    createUser: vi.fn(),
    startLogin: vi.fn(),
    finishLogin: vi.fn(),
    startFirstAccess: vi.fn(),
    finishFirstAccess: vi.fn(),
    startPasswordRecovery: vi.fn(),
    finishPasswordRecovery: vi.fn(),
    refreshSession: vi.fn(),
    revokeRefreshSession: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

vi.mock('../../src/services/auth.service.js', () => ({
  authService: authServiceMock,
}));

import { createApp } from '../../src/app.js';
import { generateAccessToken } from '../../src/utils/auth-token.js';

const app = createApp();

type LoginStartResponse = {
  success: boolean;
  data: {
    nextStep: 'PASSWORD' | 'EMAIL_TOKEN';
  };
};

type ErrorResponse = {
  success: boolean;
  error: {
    code: string;
  };
};

type MeResponse = {
  success: boolean;
  data: {
    codigo: string;
  };
};

describe('auth routes integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts login flow with code-only request', async () => {
    authServiceMock.startLogin.mockResolvedValue({
      nextStep: 'PASSWORD',
      loginFlowToken: 'flow-token',
      expiresInSeconds: 300,
    });

    const response = await request(app).post('/api/v1/auth/login/start').send({
      codigo: '2026001',
    });
    const body = response.body as LoginStartResponse;

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.nextStep).toBe('PASSWORD');
    expect(authServiceMock.startLogin).toHaveBeenCalledWith({ codigo: '2026001' });
  });

  it('rejects /auth/me without bearer token', async () => {
    const response = await request(app).get('/api/v1/auth/me');
    const body = response.body as ErrorResponse;

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('AUTH_TOKEN_REQUIRED');
  });

  it('returns authenticated user in /auth/me with valid bearer token', async () => {
    const accessToken = generateAccessToken({
      sub: 'user-1',
      codigo: '2026001',
      perfil: 'ELEITOR',
      purpose: 'ACCESS',
    });

    authServiceMock.getCurrentUser.mockResolvedValue({
      id: 'user-1',
      codigo: '2026001',
      nome: 'User One',
      email: 'user@example.com',
      perfil: 'ELEITOR',
      activo: true,
      mustSetPassword: false,
      createdAt: new Date().toISOString(),
      candidaturas: [],
    });

    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    const body = response.body as MeResponse;

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.codigo).toBe('2026001');
    expect(authServiceMock.getCurrentUser).toHaveBeenCalledWith('user-1');
  });
});
