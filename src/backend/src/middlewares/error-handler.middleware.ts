import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

import { Prisma } from '../generated/prisma/client.js';
import { AppError } from '../utils/app-error.js';
import { buildErrorResponse } from '../utils/error-response.js';

export const errorHandler: ErrorRequestHandler = (error, request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    error.type === 'entity.too.large'
  ) {
    response.status(413).json(
      buildErrorResponse({
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request body exceeds the allowed size limit.',
        statusCode: 413,
        ...(error instanceof Error ? { error } : {}),
        request,
      }),
    );
    return;
  }

  if (error instanceof ZodError) {
    response.status(400).json(
      buildErrorResponse({
        code: 'VALIDATION_ERROR',
        message: 'Validation error.',
        statusCode: 400,
        details: error.flatten(),
        ...(error instanceof Error ? { error } : {}),
        request,
      }),
    );
    return;
  }

  if (error instanceof Error && error.name === 'TokenExpiredError') {
    response.status(401).json(
      buildErrorResponse({
        code: 'AUTH_TOKEN_EXPIRED',
        message: 'Authentication token has expired.',
        statusCode: 401,
        ...(error instanceof Error ? { error } : {}),
        request,
      }),
    );
    return;
  }

  if (error instanceof Error && error.name === 'NotBeforeError') {
    response.status(401).json(
      buildErrorResponse({
        code: 'AUTH_TOKEN_NOT_ACTIVE',
        message: 'Authentication token is not active yet.',
        statusCode: 401,
        ...(error instanceof Error ? { error } : {}),
        request,
      }),
    );
    return;
  }

  if (error instanceof Error && error.name === 'JsonWebTokenError') {
    response.status(401).json(
      buildErrorResponse({
        code: 'AUTH_INVALID_TOKEN',
        message: 'Authentication token is invalid.',
        statusCode: 401,
        ...(error instanceof Error ? { error } : {}),
        request,
      }),
    );
    return;
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json(
      buildErrorResponse({
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        ...(error.details ? { details: error.details } : {}),
        ...(error instanceof Error ? { error } : {}),
        request,
      }),
    );
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      response.status(409).json(
        buildErrorResponse({
          code: 'DATABASE_UNIQUE_CONSTRAINT',
          message: 'A record with the provided unique field already exists.',
          statusCode: 409,
          details: {
            prismaCode: error.code,
            target: error.meta?.target,
          },
          ...(error instanceof Error ? { error } : {}),
          request,
        }),
      );
      return;
    }

    if (error.code === 'P2003') {
      response.status(409).json(
        buildErrorResponse({
          code: 'DATABASE_FOREIGN_KEY_CONSTRAINT',
          message: 'The requested operation violates a relation constraint.',
          statusCode: 409,
          details: {
            prismaCode: error.code,
            fieldName: error.meta?.field_name,
          },
          ...(error instanceof Error ? { error } : {}),
          request,
        }),
      );
      return;
    }

    if (error.code === 'P2025') {
      response.status(404).json(
        buildErrorResponse({
          code: 'DATABASE_RECORD_NOT_FOUND',
          message: 'The requested record was not found.',
          statusCode: 404,
          details: {
            prismaCode: error.code,
            cause: error.meta?.cause,
          },
          ...(error instanceof Error ? { error } : {}),
          request,
        }),
      );
      return;
    }

    response.status(400).json(
      buildErrorResponse({
        code: 'DATABASE_REQUEST_ERROR',
        message: 'The database rejected the request.',
        statusCode: 400,
        details: {
          prismaCode: error.code,
          meta: error.meta,
        },
        ...(error instanceof Error ? { error } : {}),
        request,
      }),
    );
    return;
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    response.status(400).json(
      buildErrorResponse({
        code: 'DATABASE_VALIDATION_ERROR',
        message: 'The database request is invalid.',
        statusCode: 400,
        ...(error instanceof Error ? { error } : {}),
        request,
      }),
    );
    return;
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    response.status(503).json(
      buildErrorResponse({
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database connection is currently unavailable.',
        statusCode: 503,
        ...(error instanceof Error ? { error } : {}),
        request,
      }),
    );
    return;
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    response.status(503).json(
      buildErrorResponse({
        code: 'DATABASE_ENGINE_ERROR',
        message: 'Database engine is temporarily unavailable.',
        statusCode: 503,
        ...(error instanceof Error ? { error } : {}),
        request,
      }),
    );
    return;
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    response.status(500).json(
      buildErrorResponse({
        code: 'DATABASE_UNKNOWN_ERROR',
        message: 'An unexpected database error occurred.',
        statusCode: 500,
        ...(error instanceof Error ? { error } : {}),
        request,
      }),
    );
    return;
  }

  if (error instanceof SyntaxError && 'body' in error) {
    response.status(400).json(
      buildErrorResponse({
        code: 'INVALID_JSON',
        message: 'Request body contains invalid JSON.',
        statusCode: 400,
        ...(error instanceof Error ? { error } : {}),
        request,
      }),
    );
    return;
  }

  const unexpectedError = error instanceof Error ? error : new Error('Unknown error.');

  console.error(unexpectedError);

  response.status(500).json(
    buildErrorResponse({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error.',
      statusCode: 500,
      ...(unexpectedError instanceof Error ? { error: unexpectedError } : {}),
      request,
    }),
  );
};
