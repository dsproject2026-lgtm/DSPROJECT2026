export type LoginStartResponse =
  | {
      nextStep: 'PASSWORD';
      loginFlowToken: string;
      expiresInSeconds: number;
    }
  | {
      nextStep: 'EMAIL_TOKEN';
      expiresInSeconds: number;
    };

export interface SessionUser {
  id: string;
  codigo: string;
  nome: string;
  email?: string | null;
  perfil: 'ADMIN' | 'GESTOR_ELEITORAL' | 'AUDITOR' | 'ELEITOR';
  activo: boolean;
  mustSetPassword: boolean;
  createdAt: string;
}

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresInSeconds: number;
  refreshTokenExpiresInSeconds: number;
}

export interface LoginResult extends SessionTokens {
  user: SessionUser;
}

export interface RefreshTokenResult extends SessionTokens {}
