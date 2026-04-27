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
  PasswordRecoveryFinishInput,
  PasswordRecoveryStartInput,
  PasswordRecoveryStartResult,
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
        `Já existe um utilizador com o código ${codigo}.`,
        409,
        'AUTH_CODE_ALREADY_IN_USE',
        { codigo },
      );
    }

    if (!senha && mustSetPassword === false) {
      throw new AppError(
        'A senha não pode ser omitida quando mustSetPassword for false.',
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

    const createdUser = await authRepository.createUser(data);

    if (createdUser.perfil === 'ELEITOR' && createdUser.activo) {
      await authRepository.assignElectorAsEligibleInAllElections(createdUser.id);
    }

    return createdUser;
  }

  async startLogin({ codigo }: LoginStartInput): Promise<LoginStartResult> {
    const user = await authRepository.findUserByCodigo(codigo);

    if (!user) {
      throw new AppError('Credenciais inválidas.', 401, 'AUTH_INVALID_CREDENTIALS');
    }

    if (!user.activo) {
      throw new AppError('A conta do utilizador está inativa.', 403, 'AUTH_ACCOUNT_INACTIVE', {
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
      throw new AppError('Pedido de primeiro acesso inválido.', 400, 'AUTH_INVALID_FIRST_ACCESS_REQUEST');
    }

    if (!user.activo) {
      throw new AppError('A conta do utilizador está inativa.', 403, 'AUTH_ACCOUNT_INACTIVE', {
        codigo,
      });
    }

    if (!user.email) {
      throw new AppError('O email do utilizador é obrigatório para o primeiro acesso.', 400, 'AUTH_EMAIL_REQUIRED', {
        codigo,
      });
    }

    if (!user.mustSetPassword && user.senhaHash) {
      throw new AppError(
        'A senha do utilizador já está configurada.',
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
      throw new AppError('Token de primeiro acesso inválido.', 401, 'AUTH_INVALID_FIRST_ACCESS_TOKEN');
    }

    if (!user.passwordSetupTokenHash || !user.passwordSetupTokenExpiresAt) {
      throw new AppError('Token de primeiro acesso inválido.', 401, 'AUTH_INVALID_FIRST_ACCESS_TOKEN');
    }

    if (user.passwordSetupTokenExpiresAt.getTime() < Date.now()) {
      throw new AppError('O token de primeiro acesso expirou.', 401, 'AUTH_FIRST_ACCESS_TOKEN_EXPIRED');
    }

    const providedTokenHash = hashSecureToken(token);
    const tokenMatches = safeEqualTokenHash(providedTokenHash, user.passwordSetupTokenHash);

    if (!tokenMatches) {
      throw new AppError('Token de primeiro acesso inválido.', 401, 'AUTH_INVALID_FIRST_ACCESS_TOKEN');
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
      throw new AppError('O email do utilizador é obrigatório para o primeiro acesso.', 400, 'AUTH_EMAIL_REQUIRED', {
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

  async startPasswordRecovery({
    codigo,
  }: PasswordRecoveryStartInput): Promise<PasswordRecoveryStartResult> {
    const user = await authRepository.findUserByCodigo(codigo);

    if (!user) {
      throw new AppError(
        'Pedido de recuperação de senha inválido.',
        400,
        'AUTH_INVALID_PASSWORD_RECOVERY_REQUEST',
      );
    }

    if (!user.activo) {
      throw new AppError('A conta do utilizador está inativa.', 403, 'AUTH_ACCOUNT_INACTIVE', {
        codigo,
      });
    }

    if (!user.email) {
      throw new AppError('O email do utilizador é obrigatório para recuperar a senha.', 400, 'AUTH_EMAIL_REQUIRED', {
        codigo,
      });
    }

    if (user.mustSetPassword || !user.senhaHash) {
      throw new AppError(
        'A conta ainda não tem senha ativa. Utilize o fluxo de primeiro acesso.',
        409,
        'AUTH_PASSWORD_SETUP_REQUIRED',
        { codigo },
      );
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

    await emailService.sendPasswordRecoveryEmail({
      to: user.email,
      nome: user.nome,
      codigo: user.codigo,
      token: rawToken,
      expiresInSeconds: env.FIRST_ACCESS_TOKEN_EXPIRES_IN_SECONDS,
    });

    return {
      nextStep: 'EMAIL_TOKEN',
      expiresInSeconds: env.FIRST_ACCESS_TOKEN_EXPIRES_IN_SECONDS,
    };
  }

  async finishPasswordRecovery(
    { codigo, token, novaSenha }: PasswordRecoveryFinishInput,
    context?: RequestSecurityContext,
  ): Promise<LoginResult> {
    const user = await authRepository.findUserByCodigo(codigo);

    if (!user || user.mustSetPassword || !user.senhaHash) {
      throw new AppError('Token de recuperação de senha inválido.', 401, 'AUTH_INVALID_PASSWORD_RECOVERY_TOKEN');
    }

    if (!user.passwordSetupTokenHash || !user.passwordSetupTokenExpiresAt) {
      throw new AppError('Token de recuperação de senha inválido.', 401, 'AUTH_INVALID_PASSWORD_RECOVERY_TOKEN');
    }

    if (user.passwordSetupTokenExpiresAt.getTime() < Date.now()) {
      throw new AppError('O token de recuperação de senha expirou.', 401, 'AUTH_PASSWORD_RECOVERY_TOKEN_EXPIRED');
    }

    const providedTokenHash = hashSecureToken(token);
    const tokenMatches = safeEqualTokenHash(providedTokenHash, user.passwordSetupTokenHash);

    if (!tokenMatches) {
      throw new AppError('Token de recuperação de senha inválido.', 401, 'AUTH_INVALID_PASSWORD_RECOVERY_TOKEN');
    }

    const senhaHash = await generatePasswordHash(novaSenha);
    const authenticatedUser = await authRepository.completePasswordRecoveryById(user.id, senhaHash);
    const session = await this.issueSessionTokens(authenticatedUser, context);

    return {
      ...session,
      user: this.buildAuthenticatedUser(authenticatedUser),
    };
  }

  async finishLogin(
    { codigo, senha, loginFlowToken }: LoginFinishInput,
    context?: RequestSecurityContext,
  ): Promise<LoginResult> {
    const loginFlow = verifyLoginFlowToken(loginFlowToken);

    if (loginFlow.codigo !== codigo) {
      throw new AppError(
        'O código informado não corresponde ao fluxo de login ativo.',
        400,
        'AUTH_LOGIN_FLOW_MISMATCH',
        { codigo },
      );
    }

    const user = await authRepository.findUserByCodigo(codigo);

    if (!user) {
      throw new AppError('Credenciais inválidas.', 401, 'AUTH_INVALID_CREDENTIALS');
    }

    if (user.mustSetPassword) {
      throw new AppError(
        'É necessário configurar a senha antes de iniciar sessão.',
        403,
        'AUTH_PASSWORD_SETUP_REQUIRED',
        { codigo },
      );
    }

    if (!user.senhaHash) {
      throw new AppError(
        'É necessário configurar a senha antes de iniciar sessão.',
        403,
        'AUTH_PASSWORD_SETUP_REQUIRED',
        { codigo },
      );
    }

    const passwordMatches = await comparePasswordHash(senha, user.senhaHash);

    if (!passwordMatches) {
      throw new AppError('Credenciais inválidas.', 401, 'AUTH_INVALID_CREDENTIALS');
    }

    if (!user.activo) {
      throw new AppError('A conta do utilizador está inativa.', 403, 'AUTH_ACCOUNT_INACTIVE', {
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
      throw new AppError('Refresh token inválido.', 401, 'AUTH_INVALID_REFRESH_TOKEN');
    }

    if (session.revokedAt) {
      throw new AppError('O refresh token foi revogado.', 401, 'AUTH_REFRESH_TOKEN_REVOKED');
    }

    if (session.expiresAt.getTime() < Date.now()) {
      await authRepository.revokeRefreshTokenByHash(providedTokenHash);
      throw new AppError('O refresh token expirou.', 401, 'AUTH_REFRESH_TOKEN_EXPIRED');
    }

    const user = session.utilizador;

    if (!user.activo) {
      throw new AppError('A conta do utilizador está inativa.', 403, 'AUTH_ACCOUNT_INACTIVE', {
        codigo: user.codigo,
      });
    }

    if (user.mustSetPassword || !user.senhaHash) {
      throw new AppError(
        'É necessário configurar a senha antes de iniciar sessão.',
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
      throw new AppError('Utilizador autenticado não encontrado.', 404, 'AUTH_USER_NOT_FOUND');
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
