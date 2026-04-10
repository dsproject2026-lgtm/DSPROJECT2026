import nodemailer from 'nodemailer';

import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';

const isEmailConfigured = () => {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS && env.SMTP_FROM);
};

class EmailService {
  private transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth:
      env.SMTP_USER && env.SMTP_PASS
        ? {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          }
        : undefined,
  });

  async sendFirstAccessEmail({
    to,
    nome,
    codigo,
    token,
    expiresInSeconds,
  }: {
    to: string;
    nome: string;
    codigo: string;
    token: string;
    expiresInSeconds: number;
  }) {
    if (!isEmailConfigured()) {
      throw new AppError('O serviço de email não está configurado.', 503, 'EMAIL_PROVIDER_NOT_CONFIGURED');
    }

    const firstAccessUrlBase = env.FIRST_ACCESS_URL ?? (env.CLIENT_URL ? `${env.CLIENT_URL.replace(/\/$/, '')}/primeiro-acesso` : undefined);
    const firstAccessUrl = firstAccessUrlBase
      ? `${firstAccessUrlBase.replace(/\/$/, '')}?codigo=${encodeURIComponent(codigo)}&token=${encodeURIComponent(token)}`
      : undefined;

    const expiresInMinutes = Math.ceil(expiresInSeconds / 60);
    const subject = 'Configuração de senha - Primeiro acesso';
    const text = [
      `Olá ${nome},`,
      '',
      'Recebemos um pedido para configurar a sua senha no primeiro acesso.',
      `Codigo: ${codigo}`,
      `Token de validação: ${token}`,
      `Este token expira em ${expiresInMinutes} minuto(s).`,
      '',
      firstAccessUrl
        ? `Se preferir, abra este link: ${firstAccessUrl}`
        : 'Use o token acima para concluir o primeiro acesso na aplicacao.',
    ].join('\n');

    await this.transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject,
      text,
    });
  }

  async sendPasswordRecoveryEmail({
    to,
    nome,
    codigo,
    token,
    expiresInSeconds,
  }: {
    to: string;
    nome: string;
    codigo: string;
    token: string;
    expiresInSeconds: number;
  }) {
    if (!isEmailConfigured()) {
      throw new AppError('O serviço de email não está configurado.', 503, 'EMAIL_PROVIDER_NOT_CONFIGURED');
    }

    const passwordRecoveryUrlBase =
      env.PASSWORD_RECOVERY_URL ??
      (env.CLIENT_URL ? `${env.CLIENT_URL.replace(/\/$/, '')}/recuperar-senha` : undefined);
    const passwordRecoveryUrl = passwordRecoveryUrlBase
      ? `${passwordRecoveryUrlBase.replace(/\/$/, '')}?codigo=${encodeURIComponent(codigo)}&token=${encodeURIComponent(token)}`
      : undefined;

    const expiresInMinutes = Math.ceil(expiresInSeconds / 60);
    const subject = 'Recuperação de senha';
    const text = [
      `Olá ${nome},`,
      '',
      'Recebemos um pedido para recuperação da sua senha.',
      `Código: ${codigo}`,
      `Token de validação: ${token}`,
      `Este token expira em ${expiresInMinutes} minuto(s).`,
      '',
      passwordRecoveryUrl
        ? `Abra este link para redefinir a sua senha: ${passwordRecoveryUrl}`
        : 'Use o token acima para redefinir a sua senha na aplicação.',
    ].join('\n');

    await this.transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject,
      text,
    });
  }
}

export const emailService = new EmailService();
