import type { LoginResult, LoginStartResponse, RefreshTokenResult, SessionUser } from '@/types/auth';

import { endpoints } from './endpoints';
import { apiClient } from './http';

export const authApi = {
  startLogin(codigo: string) {
    return apiClient.post<LoginStartResponse>(endpoints.auth.loginStart, { codigo });
  },

  finishLogin(codigo: string, senha: string, loginFlowToken: string) {
    return apiClient.post<LoginResult>(endpoints.auth.loginFinish, {
      codigo,
      senha,
      loginFlowToken,
    });
  },

  startFirstAccess(codigo: string) {
    return apiClient.post<{ nextStep: 'EMAIL_TOKEN'; expiresInSeconds: number }>(
      endpoints.auth.firstAccessStart,
      {
        codigo,
      },
    );
  },

  finishFirstAccess(codigo: string, token: string, novaSenha: string) {
    return apiClient.post<LoginResult>(endpoints.auth.firstAccessFinish, {
      codigo,
      token,
      novaSenha,
    });
  },

  startPasswordRecovery(codigo: string) {
    return apiClient.post<{ nextStep: 'EMAIL_TOKEN'; expiresInSeconds: number }>(
      endpoints.auth.passwordRecoveryStart,
      {
        codigo,
      },
    );
  },

  finishPasswordRecovery(codigo: string, token: string, novaSenha: string) {
    return apiClient.post<LoginResult>(endpoints.auth.passwordRecoveryFinish, {
      codigo,
      token,
      novaSenha,
    });
  },

  refresh(refreshToken: string) {
    return apiClient.post<RefreshTokenResult>(endpoints.auth.refresh, { refreshToken });
  },

  logout(refreshToken: string) {
    return apiClient.post<{ revoked: boolean }>(endpoints.auth.logout, { refreshToken });
  },

  me() {
    return apiClient.get<SessionUser>(endpoints.auth.me, { auth: true });
  },
};
