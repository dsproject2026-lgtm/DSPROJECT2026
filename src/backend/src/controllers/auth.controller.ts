import type { RequestHandler } from 'express';
import { z } from 'zod';

import { authService } from '../services/auth.service.js';
import type {
  FirstAccessFinishInput,
  FirstAccessStartInput,
  FirstAccessStartResult,
  LoginFinishInput,
  LoginResult,
  LoginStartInput,
  RefreshTokenInput,
  RefreshTokenResult,
  RegisterInput,
} from '../types/auth.types.js';
import { PERFIS } from '../types/model.types.js';
import { AppError } from '../utils/app-error.js';
import { getClientIp } from '../utils/get-client-ip.js';
import { buildSuccessResponse } from '../utils/success-response.js';

const registerUserSchema = z.object({
  nome: z.string().trim().min(3).max(150),
  codigo: z.string().trim().min(1).max(50),
  email: z.string().trim().email().max(255).optional(),
  senha: z.string().min(8).max(255).optional(),
  perfil: z.enum(PERFIS),
  activo: z.boolean().optional(),
  mustSetPassword: z.boolean().optional(),
});

const loginStartSchema = z.object({
  codigo: z.string().trim().min(1).max(50),
});

const loginFinishSchema = z.object({
  codigo: z.string().trim().min(1).max(50),
  senha: z.string().min(8).max(255),
  loginFlowToken: z.string().trim(),
});

const firstAccessStartSchema = z.object({
  codigo: z.string().trim().min(1).max(50),
});

const firstAccessFinishSchema = z.object({
  codigo: z.string().trim().min(1).max(50),
  token: z.string().trim().min(20).max(255),
  novaSenha: z.string().min(8).max(255),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().trim().min(20).max(255),
});

export const registerUser: RequestHandler = async (request, response) => {
  const { nome, codigo, email, senha, perfil, activo, mustSetPassword } = registerUserSchema.parse(
    request.body,
  );
  const input: RegisterInput = {
    nome,
    codigo,
    ...(email !== undefined ? { email } : {}),
    ...(senha !== undefined ? { senha } : {}),
    perfil,
    ...(activo !== undefined ? { activo } : {}),
    ...(mustSetPassword !== undefined ? { mustSetPassword } : {}),
  };
  const user = await authService.createUser(input);

  response.status(201).json(
    buildSuccessResponse({
      message: 'User registered successfully.',
      data: user,
      request,
      statusCode: 201,
    }),
  );
};

export const startLogin: RequestHandler = async (request, response) => {
  const { codigo } = loginStartSchema.parse(request.body);

  const input: LoginStartInput = { codigo };
  const result = await authService.startLogin(input);
  const message =
    result.nextStep === 'PASSWORD'
      ? 'Login flow initiated. Please provide your password.'
      : 'Password setup required. A first-access token has been sent to your email.';

  response.status(200).json(
    buildSuccessResponse({
      message,
      data: result,
      request,
      statusCode: 200,
    }),
  );
};

export const startFirstAccess: RequestHandler = async (request, response) => {
  const { codigo } = firstAccessStartSchema.parse(request.body);

  const input: FirstAccessStartInput = { codigo };
  const result: FirstAccessStartResult = await authService.startFirstAccess(input);

  response.status(200).json(
    buildSuccessResponse({
      message: 'First access flow initiated. Check your email for the access token.',
      data: result,
      request,
      statusCode: 200,
    }),
  );
};

export const finishFirstAccess: RequestHandler = async (request, response) => {
  const { codigo, token, novaSenha } = firstAccessFinishSchema.parse(request.body);
  const userAgentHeader = request.headers['user-agent'];
  const userAgent = typeof userAgentHeader === 'string' ? userAgentHeader : undefined;

  const input: FirstAccessFinishInput = {
    codigo,
    token,
    novaSenha,
  };
  const result: LoginResult = await authService.finishFirstAccess(input, {
    ip: getClientIp(request),
    ...(userAgent !== undefined ? { userAgent } : {}),
  });

  response.status(200).json(
    buildSuccessResponse({
      message: 'First access completed successfully.',
      data: result,
      request,
      statusCode: 200,
    }),
  );
};

export const finishLogin: RequestHandler = async (request, response) => {
  const { codigo, senha, loginFlowToken } = loginFinishSchema.parse(request.body);
  const userAgentHeader = request.headers['user-agent'];
  const userAgent = typeof userAgentHeader === 'string' ? userAgentHeader : undefined;

  const input: LoginFinishInput = {
    codigo,
    senha,
    loginFlowToken,
  };
  const result: LoginResult = await authService.finishLogin(input, {
    ip: getClientIp(request),
    ...(userAgent !== undefined ? { userAgent } : {}),
  });

  response.status(200).json(
    buildSuccessResponse({
      message: 'Login successful.',
      data: result,
      request,
      statusCode: 200,
    }),
  );
};

export const refreshAccessToken: RequestHandler = async (request, response) => {
  const { refreshToken } = refreshTokenSchema.parse(request.body);
  const userAgentHeader = request.headers['user-agent'];
  const userAgent = typeof userAgentHeader === 'string' ? userAgentHeader : undefined;
  const input: RefreshTokenInput = { refreshToken };
  const result: RefreshTokenResult = await authService.refreshSession(input, {
    ip: getClientIp(request),
    ...(userAgent !== undefined ? { userAgent } : {}),
  });

  response.status(200).json(
    buildSuccessResponse({
      message: 'Access token refreshed successfully.',
      data: result,
      request,
      statusCode: 200,
    }),
  );
};

export const logout: RequestHandler = async (request, response) => {
  const { refreshToken } = refreshTokenSchema.parse(request.body);
  const input: RefreshTokenInput = { refreshToken };
  await authService.revokeRefreshSession(input);

  response.status(200).json(
    buildSuccessResponse({
      message: 'Logout completed successfully.',
      data: {
        revoked: true,
      },
      request,
      statusCode: 200,
    }),
  );
};

export const getCurrentUser: RequestHandler = async (request, response) => {
  if (!request.auth) {
    throw new AppError('Authentication token is required.', 401, 'AUTH_TOKEN_REQUIRED');
  }

  const user = await authService.getCurrentUser(request.auth.sub);

  response.status(200).json(
    buildSuccessResponse({
      message: 'Authenticated user loaded successfully.',
      data: user,
      request,
      statusCode: 200,
    }),
  );
};
