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

export interface RegisterInput {
  codigo: string;
  nome: string;
  senha: string;
  perfil: Perfil;
  activo?: boolean;
}

export type CreateAuthUserInput = CreateUtilizadorComSenhaHashInput;
export type LoginInput = LoginFinishInput;

export interface JwtPayload {
  sub: EntityId;
  codigo: string;
  perfil: Perfil;
}

export interface LoginFlowTokenPayload {
  codigo: string;
  purpose: 'LOGIN_FLOW';
}

export interface AuthenticatedUser extends UtilizadorPublico {
  candidaturas: CandidatoEntity[];
}

export interface LoginStartResult {
  loginFlowToken: string;
  nextStep: 'PASSWORD';
  expiresInSeconds: number;
}

export interface LoginResult {
  accessToken: string;
  user: AuthenticatedUser;
}
