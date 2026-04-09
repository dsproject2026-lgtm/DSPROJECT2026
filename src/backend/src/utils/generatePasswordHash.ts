import bcrypt from 'bcrypt';
import { env } from '../config/env.js';

const SALT_ROUNDS = env.SALT_ROUNDS;

export const generatePasswordHash = async (senha: string) => {
  const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);
  return senhaHash;
};
