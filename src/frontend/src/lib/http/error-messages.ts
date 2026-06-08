const MESSAGES_PT_PT: Record<string, string> = {
  AUTH_TOKEN_REQUIRED: 'O token de autenticação é obrigatório.',
  AUTH_FORBIDDEN: 'Não tem permissão para aceder a este recurso.',
  AUTH_INVALID_CREDENTIALS: 'Credenciais inválidas.',
  AUTH_INVALID_TOKEN: 'O token de autenticação é inválido.',
  AUTH_INVALID_LOGIN_FLOW_TOKEN: 'Token do fluxo de início de sessão inválido ou expirado.',
  AUTH_ACCOUNT_INACTIVE: 'A conta do utilizador está inactiva.',
  AUTH_PASSWORD_SETUP_REQUIRED: 'É necessário configurar a palavra-passe antes de iniciar sessão.',
  AUTH_LOGIN_FLOW_MISMATCH: 'O código informado não corresponde ao fluxo de início de sessão activo.',
  AUTH_INVALID_FIRST_ACCESS_REQUEST: 'Pedido de primeiro acesso inválido.',
  AUTH_INVALID_FIRST_ACCESS_TOKEN: 'Token de primeiro acesso inválido.',
  AUTH_FIRST_ACCESS_TOKEN_EXPIRED: 'O token de primeiro acesso expirou.',
  AUTH_INVALID_PASSWORD_RECOVERY_REQUEST: 'Pedido de recuperação de palavra-passe inválido.',
  AUTH_INVALID_PASSWORD_RECOVERY_TOKEN: 'Token de recuperação de palavra-passe inválido.',
  AUTH_PASSWORD_RECOVERY_TOKEN_EXPIRED: 'O token de recuperação de palavra-passe expirou.',
  AUTH_EMAIL_REQUIRED: 'O e-mail do utilizador é obrigatório para esta operação.',
  AUTH_PASSWORD_ALREADY_CONFIGURED: 'A palavra-passe do utilizador já está configurada.',
  AUTH_CURRENT_PASSWORD_INVALID: 'A palavra-passe actual está incorrecta.',
  AUTH_NEW_PASSWORD_EQUALS_CURRENT: 'A nova palavra-passe deve ser diferente da palavra-passe actual.',
  AUTH_INVALID_REFRESH_TOKEN: 'Refresh token inválido.',
  AUTH_REFRESH_TOKEN_REVOKED: 'O refresh token foi revogado.',
  AUTH_REFRESH_TOKEN_EXPIRED: 'O refresh token expirou.',
  AUTH_USER_NOT_FOUND: 'Utilizador autenticado não encontrado.',
  RATE_LIMIT_EXCEEDED: 'Demasiadas tentativas. Tente novamente mais tarde.',
  EMAIL_PROVIDER_NOT_CONFIGURED: 'O serviço de e-mail não está configurado.',
  VALIDATION_ERROR: 'Dados inválidos. Verifique os campos e tente novamente.',
  INTERNAL_SERVER_ERROR: 'Erro interno do servidor. Tente novamente.',
  UNEXPECTED_ERROR: 'Erro inesperado. Tente novamente.',
};

export const toPtPtErrorMessage = (code: string, fallbackMessage: string) => {
  return MESSAGES_PT_PT[code] ?? fallbackMessage;
};
