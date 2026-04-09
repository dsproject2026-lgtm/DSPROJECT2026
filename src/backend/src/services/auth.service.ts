import { authRepository } from '../repositories/auth.repository.js';
import type {
  CreateAuthUserInput,
  LoginFinishInput,
  LoginResult,
  LoginStartInput,
  LoginStartResult,
  RegisterInput,
} from '../types/auth.types.js';
import { AppError } from '../utils/app-error.js';
import {
  generateAccessToken,
  generateLoginFlowToken,
  LOGIN_FLOW_TOKEN_EXPIRES_IN_SECONDS,
  verifyLoginFlowToken,
} from '../utils/auth-token.js';
import { comparePasswordHash } from '../utils/comparePasswordHash.js';
import { generatePasswordHash } from '../utils/generatePasswordHash.js';

class AuthService {
  async createUser({ nome, codigo, senha, perfil, activo }: RegisterInput) {
    const existingUser = await authRepository.findUserByCodigo(codigo);

    if (existingUser) {
      throw new AppError(
        `User with code ${codigo} already exists.`,
        409,
        'AUTH_CODE_ALREADY_IN_USE',
        { codigo },
      );
    }

    const senhaHash = await generatePasswordHash(senha);

    const data: CreateAuthUserInput = {
      nome,
      codigo,
      senhaHash,
      perfil,
      ...(activo !== undefined ? { activo } : {}),
    };

    return authRepository.createUser(data);
  }

  startLogin({ codigo }: LoginStartInput): LoginStartResult {
    return {
      loginFlowToken: generateLoginFlowToken(codigo),
      nextStep: 'PASSWORD',
      expiresInSeconds: LOGIN_FLOW_TOKEN_EXPIRES_IN_SECONDS,
    };
  }

  async finishLogin({ codigo, senha, loginFlowToken }: LoginFinishInput): Promise<LoginResult> {
    const loginFlow = verifyLoginFlowToken(loginFlowToken);

    if (loginFlow.codigo !== codigo) {
      throw new AppError(
        'Provided code does not match the active login flow.',
        400,
        'AUTH_LOGIN_FLOW_MISMATCH',
        { codigo },
      );
    }

    const user = await authRepository.findUserByCodigo(codigo);

    if (!user) {
      throw new AppError('Invalid credentials.', 401, 'AUTH_INVALID_CREDENTIALS');
    }

    const passwordMatches = await comparePasswordHash(senha, user.senhaHash);

    if (!passwordMatches) {
      throw new AppError('Invalid credentials.', 401, 'AUTH_INVALID_CREDENTIALS');
    }

    if (!user.activo) {
      throw new AppError('User account is inactive.', 403, 'AUTH_ACCOUNT_INACTIVE', {
        codigo,
      });
    }

    const authenticatedUser = {
      id: user.id,
      codigo: user.codigo,
      nome: user.nome,
      perfil: user.perfil,
      activo: user.activo,
      createdAt: user.createdAt,
      candidaturas: user.candidaturas,
    };

    return {
      accessToken: generateAccessToken({
        sub: authenticatedUser.id,
        codigo: authenticatedUser.codigo,
        perfil: authenticatedUser.perfil,
      }),
      user: authenticatedUser,
    };
  }
}

export const authService = new AuthService();
