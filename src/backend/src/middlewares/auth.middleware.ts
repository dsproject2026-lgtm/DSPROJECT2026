import type { RequestHandler } from 'express';

import type { Perfil } from '../types/model.types.js';
import { verifyAccessToken } from '../utils/auth-token.js';
import { AppError } from '../utils/app-error.js';

const BEARER_PREFIX = 'Bearer ';

export const authenticateAccessToken: RequestHandler = (request, _response, next) => {
  const authorization = request.headers.authorization;

  if (!authorization || !authorization.startsWith(BEARER_PREFIX)) {
    next(new AppError('O token de autenticação é obrigatório.', 401, 'AUTH_TOKEN_REQUIRED'));
    return;
  }

  const token = authorization.slice(BEARER_PREFIX.length).trim();

  if (!token) {
    next(new AppError('O token de autenticação é obrigatório.', 401, 'AUTH_TOKEN_REQUIRED'));
    return;
  }

  request.auth = verifyAccessToken(token);
  next();
};

export const requirePerfis = (...perfis: Perfil[]): RequestHandler => {
  return (request, _response, next) => {
    const authenticatedPerfil = request.auth?.perfil;

    if (!authenticatedPerfil) {
      next(new AppError('O token de autenticação é obrigatório.', 401, 'AUTH_TOKEN_REQUIRED'));
      return;
    }

    if (!perfis.includes(authenticatedPerfil)) {
      next(
        new AppError('Não tem permissão para aceder a este recurso.', 403, 'AUTH_FORBIDDEN'),
      );
      return;
    }

    next();
  };
};
