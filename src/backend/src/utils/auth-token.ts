import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';
import type { AccessTokenPayload, JwtPayload, LoginFlowTokenPayload } from '../types/auth.types.js';
import { AppError } from './app-error.js';

const JWT_ISSUER = 'dsproject2026-backend';
export const ACCESS_TOKEN_EXPIRES_IN_SECONDS = 12 * 60 * 60;
const ACCESS_TOKEN_EXPIRES_IN = `${ACCESS_TOKEN_EXPIRES_IN_SECONDS}s`;
export const LOGIN_FLOW_TOKEN_EXPIRES_IN_SECONDS = 300;

export const generateAccessToken = (payload: JwtPayload) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    audience: 'api',
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    issuer: JWT_ISSUER,
  });
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      audience: 'api',
      issuer: JWT_ISSUER,
    });

    if (
      typeof decoded !== 'object' ||
      decoded === null ||
      decoded.purpose !== 'ACCESS' ||
      typeof decoded.sub !== 'string' ||
      typeof decoded.codigo !== 'string' ||
      typeof decoded.perfil !== 'string'
    ) {
      throw new AppError('O token de autenticação é inválido.', 401, 'AUTH_INVALID_TOKEN');
    }

    return {
      sub: decoded.sub,
      codigo: decoded.codigo,
      perfil: decoded.perfil as AccessTokenPayload['perfil'],
      purpose: 'ACCESS',
    };
  } catch {
    throw new AppError('O token de autenticação é inválido.', 401, 'AUTH_INVALID_TOKEN');
  }
};

export const generateLoginFlowToken = (codigo: string) => {
  const payload: LoginFlowTokenPayload = {
    codigo,
    purpose: 'LOGIN_FLOW',
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    audience: 'login-flow',
    expiresIn: LOGIN_FLOW_TOKEN_EXPIRES_IN_SECONDS,
    issuer: JWT_ISSUER,
  });
};

export const verifyLoginFlowToken = (token: string): LoginFlowTokenPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      audience: 'login-flow',
      issuer: JWT_ISSUER,
    });

    if (
      typeof decoded !== 'object' ||
      decoded === null ||
      decoded.purpose !== 'LOGIN_FLOW' ||
      typeof decoded.codigo !== 'string'
    ) {
      throw new AppError(
        'Token do fluxo de login inválido ou expirado.',
        401,
        'AUTH_INVALID_LOGIN_FLOW_TOKEN',
      );
    }

    return {
      codigo: decoded.codigo,
      purpose: 'LOGIN_FLOW',
    };
  } catch {
    throw new AppError(
      'Token do fluxo de login inválido ou expirado.',
      401,
      'AUTH_INVALID_LOGIN_FLOW_TOKEN',
    );
  }
};
