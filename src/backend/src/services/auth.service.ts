import { authRepository } from '../repositories/auth.repository.js';
import type {
  CreateAuthUserInput,
  FirstAccessFinishInput,
  FirstAccessStartInput,
  FirstAccessStartResult,
  LoginFinishInput,
  LoginResult,
  LoginStartInput,
  LoginStartResult,
  RefreshTokenInput,
  RefreshTokenResult,
  RegisterInput,
  RequestSecurityContext,
} from '../types/auth.types.js';
import { env } from '../config/env.js';
import { emailService } from './email.service.js';
import { AppError } from '../utils/app-error.js';
import {
  ACCESS_TOKEN_EXPIRES_IN_SECONDS,
  generateAccessToken,
  generateLoginFlowToken,
  LOGIN_FLOW_TOKEN_EXPIRES_IN_SECONDS,
  verifyLoginFlowToken,
} from '../utils/auth-token.js';
import { comparePasswordHash } from '../utils/comparePasswordHash.js';
import { generatePasswordHash } from '../utils/generatePasswordHash.js';
import { generateSecureToken, hashSecureToken, safeEqualTokenHash } from '../utils/secure-token.js';

type AuthUserRecord = NonNullable<Awaited<ReturnType<typeof authRepository.findUserByCodigo>>>;
const REFRESH_TOKEN_EXPIRES_IN_SECONDS = env.REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60;

class AuthService {
  async createUser({ nome, codigo, email, senha, perfil, activo, mustSetPassword }: RegisterInput) {
    const existingUser = await authRepository.findUserByCodigo(codigo);

    if (existingUser) {
      throw new AppError(
        `User with code ${codigo} already exists.`,
        409,
        'AUTH_CODE_ALREADY_IN_USE',
        { codigo },
      );
    }

    if (!senha && mustSetPassword === false) {
      throw new AppError(
        'Password cannot be omitted when mustSetPassword is false.',
        400,
        'AUTH_PASSWORD_REQUIRED_FOR_IMMEDIATE_LOGIN',
      );
    }

    const senhaHash = senha ? await generatePasswordHash(senha) : null;
    const resolvedMustSetPassword = mustSetPassword ?? senhaHash === null;

    const data: CreateAuthUserInput = {
      nome,
      codigo,
      ...(email !== undefined ? { email } : {}),
      ...(senhaHash !== null ? { senhaHash } : {}),
      perfil,
      ...(activo !== undefined ? { activo } : {}),
      mustSetPassword: resolvedMustSetPassword,
    };

    return authRepository.createUser(data);
  }

  async startLogin({ codigo }: LoginStartInput): Promise<LoginStartResult> {
    const user = await authRepository.findUserByCodigo(codigo);

    if (!user) {
      throw new AppError('Invalid credentials.', 401, 'AUTH_INVALID_CREDENTIALS');
    }

    if (!user.activo) {
      throw new AppError('User account is inactive.', 403, 'AUTH_ACCOUNT_INACTIVE', {
        codigo,
      });
    }

    if (user.mustSetPassword || !user.senhaHash) {
      await this.issueFirstAccessToken(user);

      return {
        nextStep: 'EMAIL_TOKEN',
        expiresInSeconds: env.FIRST_ACCESS_TOKEN_EXPIRES_IN_SECONDS,
      };
    }

    return {
      loginFlowToken: generateLoginFlowToken(codigo),
      nextStep: 'PASSWORD',
      expiresInSeconds: LOGIN_FLOW_TOKEN_EXPIRES_IN_SECONDS,
    };
  }

  async startFirstAccess({ codigo }: FirstAccessStartInput): Promise<FirstAccessStartResult> {
    const user = await authRepository.findUserByCodigo(codigo);

    if (!user) {
      throw new AppError('Invalid first access request.', 400, 'AUTH_INVALID_FIRST_ACCESS_REQUEST');
    }

    if (!user.activo) {
      throw new AppError('User account is inactive.', 403, 'AUTH_ACCOUNT_INACTIVE', {
        codigo,
      });
    }

    if (!user.email) {
      throw new AppError('User email is required for first access.', 400, 'AUTH_EMAIL_REQUIRED', {
        codigo,
      });
    }

    if (!user.mustSetPassword && user.senhaHash) {
      throw new AppError(
        'User password has already been configured.',
        409,
        'AUTH_PASSWORD_ALREADY_CONFIGURED',
        {
          codigo,
        },
      );
    }

    await this.issueFirstAccessToken(user);

    return {
      nextStep: 'EMAIL_TOKEN',
      expiresInSeconds: env.FIRST_ACCESS_TOKEN_EXPIRES_IN_SECONDS,
    };
  }

  async finishFirstAccess(
    { codigo, token, novaSenha }: FirstAccessFinishInput,
    context?: RequestSecurityContext,
  ): Promise<LoginResult> {
    const user = await authRepository.findUserByCodigo(codigo);

    if (!user || (!user.mustSetPassword && user.senhaHash)) {
      throw new AppError('Invalid first access token.', 401, 'AUTH_INVALID_FIRST_ACCESS_TOKEN');
    }

    if (!user.passwordSetupTokenHash || !user.passwordSetupTokenExpiresAt) {
      throw new AppError('Invalid first access token.', 401, 'AUTH_INVALID_FIRST_ACCESS_TOKEN');
    }

    if (user.passwordSetupTokenExpiresAt.getTime() < Date.now()) {
      throw new AppError('First access token has expired.', 401, 'AUTH_FIRST_ACCESS_TOKEN_EXPIRED');
    }

    const providedTokenHash = hashSecureToken(token);
    const tokenMatches = safeEqualTokenHash(providedTokenHash, user.passwordSetupTokenHash);

    if (!tokenMatches) {
      throw new AppError('Invalid first access token.', 401, 'AUTH_INVALID_FIRST_ACCESS_TOKEN');
    }

    const senhaHash = await generatePasswordHash(novaSenha);
    const authenticatedUser = await authRepository.completeFirstAccessById(user.id, senhaHash);
    const session = await this.issueSessionTokens(authenticatedUser, context);

    return {
      ...session,
      user: this.buildAuthenticatedUser(authenticatedUser),
    };
  }

  private async issueFirstAccessToken(user: AuthUserRecord) {
    if (!user.email) {
      throw new AppError('User email is required for first access.', 400, 'AUTH_EMAIL_REQUIRED', {
        codigo: user.codigo,
      });
    }

    const rawToken = generateSecureToken();
    const tokenHash = hashSecureToken(rawToken);
    const passwordSetupTokenExpiresAt = new Date(
      Date.now() + env.FIRST_ACCESS_TOKEN_EXPIRES_IN_SECONDS * 1_000,
    );

    await authRepository.updatePasswordSetupTokenById(
      user.id,
      tokenHash,
      passwordSetupTokenExpiresAt,
    );

    await emailService.sendFirstAccessEmail({
      to: user.email,
      nome: user.nome,
      codigo: user.codigo,
      token: rawToken,
      expiresInSeconds: env.FIRST_ACCESS_TOKEN_EXPIRES_IN_SECONDS,
    });
  }

  async finishLogin(
    { codigo, senha, loginFlowToken }: LoginFinishInput,
    context?: RequestSecurityContext,
  ): Promise<LoginResult> {
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

    if (user.mustSetPassword) {
      throw new AppError(
        'Password setup is required before login.',
        403,
        'AUTH_PASSWORD_SETUP_REQUIRED',
        { codigo },
      );
    }

    if (!user.senhaHash) {
      throw new AppError(
        'Password setup is required before login.',
        403,
        'AUTH_PASSWORD_SETUP_REQUIRED',
        { codigo },
      );
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
      ...user,
    };
    const session = await this.issueSessionTokens(authenticatedUser, context);

    return {
      ...session,
      user: this.buildAuthenticatedUser(authenticatedUser),
    };
  }

  async refreshSession(
    { refreshToken }: RefreshTokenInput,
    context?: RequestSecurityContext,
  ): Promise<RefreshTokenResult> {
    const providedTokenHash = hashSecureToken(refreshToken);
    const session = await authRepository.findRefreshTokenByHash(providedTokenHash);

    if (!session) {
      throw new AppError('Refresh token is invalid.', 401, 'AUTH_INVALID_REFRESH_TOKEN');
    }

    if (session.revokedAt) {
      throw new AppError('Refresh token has been revoked.', 401, 'AUTH_REFRESH_TOKEN_REVOKED');
    }

    if (session.expiresAt.getTime() < Date.now()) {
      await authRepository.revokeRefreshTokenByHash(providedTokenHash);
      throw new AppError('Refresh token has expired.', 401, 'AUTH_REFRESH_TOKEN_EXPIRED');
    }

    const user = session.utilizador;

    if (!user.activo) {
      throw new AppError('User account is inactive.', 403, 'AUTH_ACCOUNT_INACTIVE', {
        codigo: user.codigo,
      });
    }

    if (user.mustSetPassword || !user.senhaHash) {
      throw new AppError(
        'Password setup is required before login.',
        403,
        'AUTH_PASSWORD_SETUP_REQUIRED',
        {
          codigo: user.codigo,
        },
      );
    }

    const nextRefreshToken = generateSecureToken();
    const nextRefreshTokenHash = hashSecureToken(nextRefreshToken);
    const nextRefreshTokenExpiresAt = new Date(
      Date.now() + REFRESH_TOKEN_EXPIRES_IN_SECONDS * 1_000,
    );

    await authRepository.rotateRefreshToken({
      currentTokenId: session.id,
      replacedByTokenHash: nextRefreshTokenHash,
      nextTokenHash: nextRefreshTokenHash,
      nextExpiresAt: nextRefreshTokenExpiresAt,
      userId: user.id,
      ...(context?.ip !== undefined ? { ip: context.ip } : {}),
      ...(context?.userAgent !== undefined ? { userAgent: context.userAgent } : {}),
    });

    return {
      accessToken: generateAccessToken({
        sub: user.id,
        codigo: user.codigo,
        perfil: user.perfil,
        purpose: 'ACCESS',
      }),
      refreshToken: nextRefreshToken,
      accessTokenExpiresInSeconds: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
      refreshTokenExpiresInSeconds: REFRESH_TOKEN_EXPIRES_IN_SECONDS,
    };
  }

  async revokeRefreshSession({ refreshToken }: RefreshTokenInput): Promise<void> {
    const providedTokenHash = hashSecureToken(refreshToken);
    await authRepository.revokeRefreshTokenByHash(providedTokenHash);
  }

  async getCurrentUser(userId: string) {
    const user = await authRepository.findUserById(userId);

    if (!user) {
      throw new AppError('Authenticated user was not found.', 404, 'AUTH_USER_NOT_FOUND');
    }

    return this.buildAuthenticatedUser(user);
  }

  private buildAuthenticatedUser(user: AuthUserRecord) {
    return {
      id: user.id,
      codigo: user.codigo,
      nome: user.nome,
      email: user.email,
      perfil: user.perfil,
      activo: user.activo,
      mustSetPassword: user.mustSetPassword,
      createdAt: user.createdAt,
      candidaturas: user.candidaturas,
    };
  }

  private async issueSessionTokens(user: AuthUserRecord, context?: RequestSecurityContext) {
    const refreshToken = generateSecureToken();
    const refreshTokenHash = hashSecureToken(refreshToken);
    const refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_SECONDS * 1_000);

    await authRepository.createRefreshToken({
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt: refreshTokenExpiresAt,
      ...(context?.ip !== undefined ? { ip: context.ip } : {}),
      ...(context?.userAgent !== undefined ? { userAgent: context.userAgent } : {}),
    });

    return {
      accessToken: generateAccessToken({
        sub: user.id,
        codigo: user.codigo,
        perfil: user.perfil,
        purpose: 'ACCESS',
      }),
      refreshToken,
      accessTokenExpiresInSeconds: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
      refreshTokenExpiresInSeconds: REFRESH_TOKEN_EXPIRES_IN_SECONDS,
    };
  }
}

export const authService = new AuthService();
