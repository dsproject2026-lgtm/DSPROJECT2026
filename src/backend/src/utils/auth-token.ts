import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';
import type { JwtPayload, LoginFlowTokenPayload } from '../types/auth.types.js';
import { AppError } from './app-error.js';

const JWT_ISSUER = 'dsproject2026-backend';
const ACCESS_TOKEN_EXPIRES_IN = '12h';
export const LOGIN_FLOW_TOKEN_EXPIRES_IN_SECONDS = 30000;

export const generateAccessToken = (payload: JwtPayload) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    audience: 'api',
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    issuer: JWT_ISSUER,
  });
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
        'Invalid or expired login flow token.',
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
      'Invalid or expired login flow token.',
      401,
      'AUTH_INVALID_LOGIN_FLOW_TOKEN',
    );
  }
};
