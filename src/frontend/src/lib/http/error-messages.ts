const MESSAGES_PT_PT: Record<string, string> = {
  AUTH_TOKEN_REQUIRED: 'O token de autenticação é obrigatório.',
  AUTH_FORBIDDEN: 'Não tem permissão para aceder a este recurso.',
  AUTH_INVALID_CREDENTIALS: 'Credenciais inválidas.',
  AUTH_INVALID_TOKEN: 'O token de autenticação é inválido.',
  AUTH_INVALID_LOGIN_FLOW_TOKEN: 'Token do fluxo de login inválido ou expirado.',
  AUTH_ACCOUNT_INACTIVE: 'A conta do utilizador está inativa.',
  AUTH_PASSWORD_SETUP_REQUIRED: 'É necessário configurar a senha antes de iniciar sessão.',
  AUTH_LOGIN_FLOW_MISMATCH: 'O código informado não corresponde ao fluxo de login ativo.',
  AUTH_INVALID_FIRST_ACCESS_REQUEST: 'Pedido de primeiro acesso inválido.',
  AUTH_INVALID_FIRST_ACCESS_TOKEN: 'Token de primeiro acesso inválido.',
  AUTH_FIRST_ACCESS_TOKEN_EXPIRED: 'O token de primeiro acesso expirou.',
  AUTH_INVALID_PASSWORD_RECOVERY_REQUEST: 'Pedido de recuperação de senha inválido.',
  AUTH_INVALID_PASSWORD_RECOVERY_TOKEN: 'Token de recuperação de senha inválido.',
  AUTH_PASSWORD_RECOVERY_TOKEN_EXPIRED: 'O token de recuperação de senha expirou.',
  AUTH_EMAIL_REQUIRED: 'O email do utilizador é obrigatório para esta operação.',
  AUTH_PASSWORD_ALREADY_CONFIGURED: 'A senha do utilizador já está configurada.',
  AUTH_INVALID_REFRESH_TOKEN: 'Refresh token inválido.',
  AUTH_REFRESH_TOKEN_REVOKED: 'O refresh token foi revogado.',
  AUTH_REFRESH_TOKEN_EXPIRED: 'O refresh token expirou.',
  AUTH_USER_NOT_FOUND: 'Utilizador autenticado não encontrado.',
  RATE_LIMIT_EXCEEDED: 'Demasiadas tentativas. Tente novamente mais tarde.',
  EMAIL_PROVIDER_NOT_CONFIGURED: 'O serviço de email não está configurado.',
  VALIDATION_ERROR: 'Dados inválidos. Verifique os campos e tente novamente.',
  INTERNAL_SERVER_ERROR: 'Erro interno do servidor. Tente novamente.',
  UNEXPECTED_ERROR: 'Erro inesperado. Tente novamente.',
};

export const toPtPtErrorMessage = (code: string, fallbackMessage: string) => {
  return MESSAGES_PT_PT[code] ?? fallbackMessage;
};
