import os from 'node:os';

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
    connectionTimeout: 5_000,
    greetingTimeout: 5_000,
    socketTimeout: 5_000,
    auth:
      env.SMTP_USER && env.SMTP_PASS
        ? {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          }
        : undefined,
  });

  private getSystemHeader() {
    const header = env.SMTP_FROM && !env.SMTP_FROM.includes('@') ? env.SMTP_FROM : 'Sistema de Votação Online';
    return `${header}\n${'='.repeat(Math.min(48, header.length))}`;
  }

  private buildHtmlHeader() {
    const header = env.SMTP_FROM && !env.SMTP_FROM.includes('@') ? env.SMTP_FROM : 'Sistema de Votação Online';
    return `<div style="font-family:Arial,sans-serif;padding:14px 0 8px;border-bottom:1px solid #ddd;margin-bottom:20px;">
      <strong style="font-size:18px;color:#111;">${header}</strong>
    </div>`;
  }

  private getServerHost(requestOrigin?: string) {
    if (requestOrigin) {
      try {
        const originUrl = new URL(requestOrigin);
        if (originUrl.hostname && !this.isLocalHostname(originUrl.hostname)) {
          return originUrl.hostname;
        }
      } catch {
        // Ignora origens encaminhadas inválidas e procura o endereço na rede local.
      }
    }

    const interfaces = os.networkInterfaces();
    for (const addresses of Object.values(interfaces)) {
      for (const address of addresses ?? []) {
        if (address.family === 'IPv4' && !address.internal) {
          return address.address;
        }
      }
    }

    return 'localhost';
  }

  private isLocalHostname(hostname: string) {
    return ['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(hostname);
  }

  private resolveFrontendUrl(path: string, configuredUrl?: string, requestOrigin?: string) {
    const baseUrl = configuredUrl ?? (env.CLIENT_URL ? `${env.CLIENT_URL.replace(/\/$/, '')}${path}` : undefined);

    if (!baseUrl) {
      return undefined;
    }

    try {
      const url = new URL(baseUrl);
      if (this.isLocalHostname(url.hostname)) {
        url.hostname = this.getServerHost(requestOrigin);
      }
      return url.toString().replace(/\/$/, '');
    } catch {
      return baseUrl.replace(/\/$/, '');
    }
  }

  async sendFirstAccessEmail({
    to,
    nome,
    codigo,
    token,
    expiresInSeconds,
    requestOrigin,
  }: {
    to: string;
    nome: string;
    codigo: string;
    token: string;
    expiresInSeconds: number;
    requestOrigin?: string;
  }) {
    if (!isEmailConfigured()) {
      throw new AppError('O serviço de email não está configurado.', 503, 'EMAIL_PROVIDER_NOT_CONFIGURED');
    }

    const firstAccessUrlBase = this.resolveFrontendUrl('/primeiro-acesso', env.FIRST_ACCESS_URL, requestOrigin);
    const firstAccessUrl = firstAccessUrlBase
      ? `${firstAccessUrlBase.replace(/\/$/, '')}?codigo=${encodeURIComponent(codigo)}&token=${encodeURIComponent(token)}`
      : undefined;

    const expiresInMinutes = Math.ceil(expiresInSeconds / 60);
    const subject = 'Sistema de Votação Online — Configuração de senha';
    const text = [
      this.getSystemHeader(),
      '',
      `Olá ${nome},`,
      '',
      'Estamos a enviar este e-mail porque foi iniciado o processo de primeiro acesso à aplicação.',
      '',
      `Código de utilizador: ${codigo}`,
      `Token de validação: ${token}`,
      `Validade: ${expiresInMinutes} minuto(s)`,
      '',
      firstAccessUrl
        ? `Abra este link para concluir o primeiro acesso: ${firstAccessUrl}`
        : 'Utilize o código e o token acima para finalizar o primeiro acesso na aplicação.',
      '',
      'Se não solicitou esta ação, ignore esta mensagem.',
    ].join('\n');

    const html = `
      <div style="font-family:Arial,sans-serif;color:#111;line-height:1.5;">
        ${this.buildHtmlHeader()}
        <p>Olá ${nome},</p>
        <p>Estamos a enviar este e-mail porque foi iniciado o processo de primeiro acesso à aplicação.</p>
        <p><strong>Código de utilizador:</strong> ${codigo}<br>
        <strong>Token de validação:</strong> ${token}<br>
        <strong>Validade:</strong> ${expiresInMinutes} minuto(s)</p>
        <p>${firstAccessUrl ? `Abra este link para concluir o primeiro acesso: <a href="${firstAccessUrl}">${firstAccessUrl}</a>` : 'Utilize o código e o token acima para finalizar o primeiro acesso na aplicação.'}</p>
        <p style="color:#555;font-size:13px;">Se não solicitou esta ação, ignore esta mensagem.</p>
      </div>
    `;

    await this.transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject,
      text,
      html,
    });
  }

  async sendPasswordRecoveryEmail({
    to,
    nome,
    codigo,
    token,
    expiresInSeconds,
    requestOrigin,
  }: {
    to: string;
    nome: string;
    codigo: string;
    token: string;
    expiresInSeconds: number;
    requestOrigin?: string;
  }) {
    if (!isEmailConfigured()) {
      throw new AppError('O serviço de email não está configurado.', 503, 'EMAIL_PROVIDER_NOT_CONFIGURED');
    }

    const passwordRecoveryUrlBase = this.resolveFrontendUrl(
      '/recuperar-senha',
      env.PASSWORD_RECOVERY_URL,
      requestOrigin,
    );
    const passwordRecoveryUrl = passwordRecoveryUrlBase
      ? `${passwordRecoveryUrlBase.replace(/\/$/, '')}?codigo=${encodeURIComponent(codigo)}&token=${encodeURIComponent(token)}`
      : undefined;

    const expiresInMinutes = Math.ceil(expiresInSeconds / 60);
    const subject = 'Sistema de Votação Online — Recuperação de senha';
    const text = [
      this.getSystemHeader(),
      '',
      `Olá ${nome},`,
      '',
      'Recebemos um pedido de recuperação de senha para a sua conta.',
      '',
      `Código de utilizador: ${codigo}`,
      `Token de validação: ${token}`,
      `Validade: ${expiresInMinutes} minuto(s)`,
      '',
      passwordRecoveryUrl
        ? `Abra este link para redefinir a sua senha: ${passwordRecoveryUrl}`
        : 'Utilize o código e o token acima para redefinir a sua senha na aplicação.',
      '',
      'Se não solicitou esta ação, ignore esta mensagem.',
    ].join('\n');

    const html = `
      <div style="font-family:Arial,sans-serif;color:#111;line-height:1.5;">
        ${this.buildHtmlHeader()}
        <p>Olá ${nome},</p>
        <p>Recebemos um pedido de recuperação de senha para a sua conta.</p>
        <p><strong>Código de utilizador:</strong> ${codigo}<br>
        <strong>Token de validação:</strong> ${token}<br>
        <strong>Validade:</strong> ${expiresInMinutes} minuto(s)</p>
        <p>${passwordRecoveryUrl ? `Abra este link para redefinir a sua senha: <a href="${passwordRecoveryUrl}">${passwordRecoveryUrl}</a>` : 'Utilize o código e o token acima para redefinir a sua senha na aplicação.'}</p>
        <p style="color:#555;font-size:13px;">Se não solicitou esta ação, ignore esta mensagem.</p>
      </div>
    `;

    await this.transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject,
      text,
      html,
    });
  }
}

export const emailService = new EmailService();
