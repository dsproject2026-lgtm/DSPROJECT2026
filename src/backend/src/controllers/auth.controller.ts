import type { RequestHandler } from 'express';
import { z } from 'zod';

import { authService } from '../services/auth.service.js';
import type { RegisterInput, LoginStartInput, LoginStartResult, LoginResult, LoginFinishInput } from '../types/auth.types.js';
import { PERFIS } from '../types/model.types.js';
import { buildSuccessResponse } from '../utils/success-response.js';

const registerUserSchema = z.object({
  nome: z.string().trim().min(3).max(150),
  codigo: z.string().trim().min(1).max(50),
  senha: z.string().min(6).max(255),
  perfil: z.enum(PERFIS),
  activo: z.boolean().optional(),
});

const loginStartSchema = z.object({
  codigo: z.string().trim().min(1).max(50),
});

const loginFinishSchema = z.object({
  codigo: z.string().trim().min(1).max(50),
  senha: z.string().min(6).max(255),
  loginFlowToken: z.string().trim(),
});

export const registerUser: RequestHandler = async (request, response) => {
  const { nome, codigo, senha, perfil, activo } = registerUserSchema.parse(request.body);
  const input: RegisterInput = {
    nome,
    codigo,
    senha,
    perfil,
    ...(activo !== undefined ? { activo } : {}),
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
  const result = authService.startLogin(input);

  response.status(200).json(
    buildSuccessResponse({
      message: 'Login flow initiated. Please provide your password.',
      data: result,
      request,
      statusCode: 200,
    }),
  );
};

export const finishLogin: RequestHandler = async (request, response) => {
  const { codigo, senha, loginFlowToken } = loginFinishSchema.parse(request.body);
  
  const input: LoginFinishInput = {
    codigo,
    senha,
    loginFlowToken,
  };
  const result: LoginResult = await authService.finishLogin(input);

  response.status(200).json(
    buildSuccessResponse({
      message: 'Login successful.',
      data: result,
      request,
      statusCode: 200,
    }),
  );
};
