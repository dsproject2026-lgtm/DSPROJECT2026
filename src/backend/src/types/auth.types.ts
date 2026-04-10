import type { EntityId } from './common.types.js';
import type {
  CandidatoEntity,
  CreateUtilizadorComSenhaHashInput,
  Perfil,
  UtilizadorPublico,
} from './model.types.js';

export interface LoginStartInput {
  codigo: string;
}

export interface LoginFinishInput {
  codigo: string;
  senha: string;
  loginFlowToken: string;
}

export interface FirstAccessStartInput {
  codigo: string;
}

export interface FirstAccessFinishInput {
  codigo: string;
  token: string;
  novaSenha: string;
}

export interface PasswordRecoveryStartInput {
  codigo: string;
}

export interface PasswordRecoveryFinishInput {
  codigo: string;
  token: string;
  novaSenha: string;
}

export interface RegisterInput {
  codigo: string;
  nome: string;
  email?: string;
  senha?: string;
  perfil: Perfil;
  activo?: boolean;
  mustSetPassword?: boolean;
}

export type CreateAuthUserInput = CreateUtilizadorComSenhaHashInput;
export type LoginInput = LoginFinishInput;

export interface JwtPayload {
  sub: EntityId;
  codigo: string;
  perfil: Perfil;
  purpose: 'ACCESS';
}

export interface LoginFlowTokenPayload {
  codigo: string;
  purpose: 'LOGIN_FLOW';
}

export type AccessTokenPayload = JwtPayload;

export interface RequestSecurityContext {
  ip?: string;
  userAgent?: string;
}

export interface AuthenticatedUser extends UtilizadorPublico {
  candidaturas: CandidatoEntity[];
}

export type LoginStartResult =
  | {
      loginFlowToken: string;
      nextStep: 'PASSWORD';
      expiresInSeconds: number;
    }
  | {
      nextStep: 'EMAIL_TOKEN';
      expiresInSeconds: number;
    };

export interface FirstAccessStartResult {
  expiresInSeconds: number;
  nextStep: 'EMAIL_TOKEN';
}

export interface PasswordRecoveryStartResult {
  expiresInSeconds: number;
  nextStep: 'EMAIL_TOKEN';
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresInSeconds: number;
  refreshTokenExpiresInSeconds: number;
  user: AuthenticatedUser;
}

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface RefreshTokenResult {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresInSeconds: number;
  refreshTokenExpiresInSeconds: number;
}
