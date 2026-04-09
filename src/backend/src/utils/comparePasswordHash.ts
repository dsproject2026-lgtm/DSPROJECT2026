import bcrypt from 'bcrypt';

export const comparePasswordHash = async (senha: string, senhaHash: string) => {
  return bcrypt.compare(senha, senhaHash);
};
