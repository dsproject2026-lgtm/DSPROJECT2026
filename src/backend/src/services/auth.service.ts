import { authRepository } from '../repositories/auth.repository.js';
import type {
  CreateAuthUserInput,
  ChangePasswordInput,
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
const EMAIL_SEND_COOLDOWN_MS = 60_000;
const recentEmailSendKeys = new Map<string, ReturnType<typeof setTimeout>>();
const inFlightEmailSends = new Map<string, Promise<void>>();

class AuthService {
  async createUser({
    nome,
    codigo,
    email,
    faculdadeId,
    cursoId,
    ano,
    senha,
    perfil,
    activo,
    mustSetPassword,
  }: RegisterInput) {
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
      ...(faculdadeId !== undefined ? { faculdadeId } : {}),
      ...(cursoId !== undefined ? { cursoId } : {}),
      ...(ano !== undefined ? { ano } : {}),
      ...(senhaHash !== null ? { senhaHash } : {}),
      perfil,
      ...(activo !== undefined ? { activo } : {}),
      mustSetPassword: resolvedMustSetPassword,
    };

    return authRepository.createUser(data);
  }

  async startLogin({ codigo }: LoginStartInput, context?: RequestSecurityContext): Promise<LoginStartResult> {
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
      await this.issueFirstAccessToken(user, context);

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

  async startFirstAccess(
    { codigo }: FirstAccessStartInput,
    context?: RequestSecurityContext,
  ): Promise<FirstAccessStartResult> {
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

    await this.issueFirstAccessToken(user, context);

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

  private async issueFirstAccessToken(user: AuthUserRecord, context?: RequestSecurityContext) {
    if (!user.email) {
      throw new AppError('O email do utilizador é obrigatório para o primeiro acesso.', 400, 'AUTH_EMAIL_REQUIRED', {
        codigo: user.codigo,
      });
    }

    await this.sendEmailOnce(`first-access:${user.id}`, () =>
      this.issuePasswordSetupTokenAndSendEmail(user, 'FIRST_ACCESS', context),
    );
  }

  async startPasswordRecovery({
    codigo,
  }: PasswordRecoveryStartInput, context?: RequestSecurityContext): Promise<PasswordRecoveryStartResult> {
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

    await this.sendEmailOnce(`password-recovery:${user.id}`, () =>
      this.issuePasswordSetupTokenAndSendEmail(user, 'PASSWORD_RECOVERY', context),
    );

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

  async changePassword(userId: string, { senhaAtual, novaSenha }: ChangePasswordInput) {
    const user = await authRepository.findUserById(userId);

    if (!user) {
      throw new AppError('Sessão inválida. Inicie sessão novamente.', 401, 'AUTH_USER_NOT_FOUND');
    }

    if (!user) {
      throw new AppError('Utilizador autenticado não encontrado.', 404, 'AUTH_USER_NOT_FOUND');
    }

    if (!user.activo) {
      throw new AppError('A conta do utilizador está inativa.', 403, 'AUTH_ACCOUNT_INACTIVE', {
        userId,
      });
    }

    if (!user.senhaHash) {
      throw new AppError(
        'É necessário configurar a senha antes de alterar a senha.',
        403,
        'AUTH_PASSWORD_SETUP_REQUIRED',
        { userId },
      );
    }

    const currentPasswordMatches = await comparePasswordHash(senhaAtual, user.senhaHash);

    if (!currentPasswordMatches) {
      throw new AppError('A senha atual está incorreta.', 401, 'AUTH_CURRENT_PASSWORD_INVALID');
    }

    const nextPasswordMatchesCurrent = await comparePasswordHash(novaSenha, user.senhaHash);

    if (nextPasswordMatchesCurrent) {
      throw new AppError(
        'A nova senha deve ser diferente da senha atual.',
        400,
        'AUTH_NEW_PASSWORD_EQUALS_CURRENT',
      );
    }

    await authRepository.updatePasswordById(userId, await generatePasswordHash(novaSenha));

    return {
      changed: true,
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
      faculdadeId: user.faculdadeId,
      cursoId: user.cursoId,
      ano: user.ano,
      faculdade: user.faculdade,
      curso: user.curso,
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

  private async sendEmailOnce(key: string, send: () => Promise<void>) {
    if (recentEmailSendKeys.has(key)) {
      return false;
    }

    const inFlightSend = inFlightEmailSends.get(key);
    if (inFlightSend) {
      await inFlightSend;
      return false;
    }

    const sendPromise = send();
    inFlightEmailSends.set(key, sendPromise);

    try {
      await sendPromise;
      const timeout = setTimeout(() => {
        recentEmailSendKeys.delete(key);
      }, EMAIL_SEND_COOLDOWN_MS);
      recentEmailSendKeys.set(key, timeout);
      return true;
    } finally {
      inFlightEmailSends.delete(key);
    }
  }

  private async issuePasswordSetupTokenAndSendEmail(
    user: AuthUserRecord,
    purpose: 'FIRST_ACCESS' | 'PASSWORD_RECOVERY',
    context?: RequestSecurityContext,
  ) {
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

    const emailPayload = {
      to: user.email!,
      nome: user.nome,
      codigo: user.codigo,
      token: rawToken,
      expiresInSeconds: env.FIRST_ACCESS_TOKEN_EXPIRES_IN_SECONDS,
      ...(context?.requestOrigin !== undefined ? { requestOrigin: context.requestOrigin } : {}),
    };

    if (purpose === 'FIRST_ACCESS') {
      await emailService.sendFirstAccessEmail(emailPayload);
      return;
    }

    await emailService.sendPasswordRecoveryEmail(emailPayload);
  }
}

export const authService = new AuthService();
