import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { authApi } from '@/api/auth.api';
import { getRoleHomeRoute } from '@/config/role-navigation';
import { PasswordInput, toast } from '@/components/ui';
import { AuthBrand } from '@/features/auth/components/AuthBrand';
import { ApiError } from '@/lib/http/api-error';
import { sessionStorageService } from '@/lib/storage/session-storage';

import { AuthLayout } from '@/components/layout/AuthLayout';

const MIN_PASSWORD_LENGTH = 8;

function getLinkToken(searchParams: URLSearchParams) {
  const raw = searchParams.get('token') ?? searchParams.get('firstAccessToken') ?? '';
  return raw.trim();
}

function getLinkCode(searchParams: URLSearchParams) {
  const raw = searchParams.get('code') ?? searchParams.get('codigo') ?? '';
  return raw.trim();
}

export function FirstAccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const tokenFromLink = getLinkToken(searchParams);
  const codeFromLink = getLinkCode(searchParams);
  const isResetStep = Boolean(tokenFromLink);

  const [codigo, setCodigo] = useState(codeFromLink);
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [isSendingLink, setIsSendingLink] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  const handleSendLink = async (event: FormEvent) => {
    event.preventDefault();

    if (!codigo.trim()) {
      toast.warning('Informe o código para enviar o link.');
      return;
    }

    setIsSendingLink(true);

    try {
      await authApi.startFirstAccess(codigo.trim());
      toast.success('Link enviado por e-mail. Clique no link recebido para continuar.');
    } catch (cause) {
      if (cause instanceof ApiError) {
        toast.danger(cause.message);
      } else {
        toast.danger('Falha ao enviar link por e-mail.');
      }
    } finally {
      setIsSendingLink(false);
    }
  };

  const handleFinish = async (event: FormEvent) => {
    event.preventDefault();

    const codeToUse = codigo.trim();

    if (!tokenFromLink) {
      toast.danger('Link inválido. Solicite um novo e-mail de redefinição.');
      return;
    }

    if (!codeToUse) {
      toast.warning('Código não identificado no link. Informe o seu código.');
      return;
    }

    if (!novaSenha.trim() || !confirmarSenha.trim()) {
      toast.warning('Preencha a nova palavra-passe e a confirmação.');
      return;
    }

    if (novaSenha.length < MIN_PASSWORD_LENGTH) {
      toast.warning(`A nova palavra-passe deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }

    if (novaSenha !== confirmarSenha) {
      toast.warning('A confirmação da palavra-passe não corresponde.');
      return;
    }

    setIsFinishing(true);

    try {
      const session = await authApi.finishFirstAccess(codeToUse, tokenFromLink, novaSenha);
      sessionStorageService.saveSession(session);
      toast.success('Palavra-passe definida com sucesso.');
      navigate(getRoleHomeRoute(session.user.perfil), { replace: true });
    } catch (cause) {
      if (cause instanceof ApiError) {
        toast.danger(cause.message);
      } else {
        toast.danger('Falha ao concluir a definição da palavra-passe.');
      }
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <AuthLayout>
      <AuthBrand />

      <section className="mx-auto w-full rounded-[18px] border border-[#D6DBE5] bg-[#F7F8FB] px-5 py-7 shadow-[0_8px_18px_rgba(17,24,39,0.05)] sm:rounded-[22px] sm:px-11 sm:py-11">
        <div className="mb-10 sm:mb-11">
          <div className="flex items-start gap-3 sm:items-center sm:gap-5">
            <span className="h-10 w-[4px] shrink-0 rounded-full bg-[#2D8AE8]" />
            <div>
              <h2 className="text-[1.45rem] font-bold leading-tight text-[#1F57D6] sm:text-[1.95rem]">Entrar</h2>
              <p className="mt-2 text-[0.94rem] text-[#5F6776] sm:text-[1.06rem]">
                {isResetStep ? 'Defina a sua nova palavra-passe.' : 'Receba um link por e-mail para redefinir a sua palavra-passe.'}
              </p>
            </div>
          </div>
        </div>

        {!isResetStep ? (
          <form className="space-y-8 sm:space-y-9" onSubmit={handleSendLink}>
            <label className="space-y-3.5">
              <span className="text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-[#6C7381] sm:text-[0.92rem] sm:tracking-[0.09em]">
                Número de estudante ou nome de utilizador
              </span>
              <input
                className="h-13 w-full rounded-md border border-[#C9CFDB] bg-[#F3F5F9] px-5 text-[0.96rem] text-[#4B5563] outline-none transition focus:border-[#2D8AE8] focus:ring-2 focus:ring-[#2D8AE8]/20 sm:h-[54px]"
                value={codigo}
                onChange={(event) => setCodigo(event.target.value)}
              />
            </label>

            <button
              className="mt-1 h-13 w-full rounded-lg border border-[#D0D6E2] bg-white px-5 text-[0.95rem] font-semibold text-[#1F57D6] transition hover:bg-[#EEF4FF] disabled:cursor-not-allowed disabled:opacity-70 sm:h-[54px]"
              disabled={isSendingLink}
              type="submit"
            >
              {isSendingLink ? 'A enviar...' : 'Enviar link por e-mail'}
            </button>

            <Link className="block pt-4 text-[1rem] text-[#1F57D6] hover:text-[#1647C0]" to="/login">
              Voltar ao início de sessão
            </Link>
          </form>
        ) : (
          <form className="space-y-8 sm:space-y-9" onSubmit={handleFinish}>
            <label className="space-y-3.5">
              <span className="text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-[#6C7381] sm:text-[0.92rem] sm:tracking-[0.09em]">
                Número de estudante ou nome de utilizador
              </span>
              <input
                className="h-13 w-full rounded-md border border-[#C9CFDB] bg-[#F3F5F9] px-5 text-[0.96rem] text-[#4B5563] outline-none transition focus:border-[#2D8AE8] focus:ring-2 focus:ring-[#2D8AE8]/20 sm:h-[54px]"
                disabled={Boolean(codeFromLink)}
                value={codigo}
                onChange={(event) => setCodigo(event.target.value)}
              />
            </label>

            <label className="space-y-3.5">
              <span className="text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-[#6C7381] sm:text-[0.92rem] sm:tracking-[0.09em]">Palavra-passe</span>
              <PasswordInput
                className="h-13 w-full rounded-md border border-[#C9CFDB] bg-[#F3F5F9] px-5 text-[0.96rem] text-[#4B5563] outline-none transition focus:border-[#2D8AE8] focus:ring-2 focus:ring-[#2D8AE8]/20 sm:h-[54px]"
                placeholder="Mínimo 8 caracteres"
                value={novaSenha}
                onChange={(event) => setNovaSenha(event.target.value)}
              />
            </label>

            <label className="space-y-3.5">
              <span className="text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-[#6C7381] sm:text-[0.92rem] sm:tracking-[0.09em]">
                Confirme a palavra-passe
              </span>
              <PasswordInput
                className="h-13 w-full rounded-md border border-[#C9CFDB] bg-[#F3F5F9] px-5 text-[0.96rem] text-[#4B5563] outline-none transition focus:border-[#2D8AE8] focus:ring-2 focus:ring-[#2D8AE8]/20 sm:h-[54px]"
                placeholder="Repita a nova palavra-passe"
                value={confirmarSenha}
                onChange={(event) => setConfirmarSenha(event.target.value)}
              />
            </label>

            <button
              className="mt-1 h-13 w-full rounded-lg bg-[#1A56DB] px-4 text-[0.86rem] font-semibold uppercase tracking-[0.08em] sm:px-5 sm:text-[0.94rem] sm:tracking-[0.15em] text-white transition hover:bg-[#1647C0] disabled:cursor-not-allowed disabled:opacity-70 sm:h-[54px]"
              disabled={isFinishing}
              type="submit"
            >
              {isFinishing ? 'A concluir...' : 'Definir palavra-passe \u21AA'}
            </button>

            <Link className="block pt-4 text-[1rem] text-[#1F57D6] hover:text-[#1647C0]" to="/login">
              Voltar ao início de sessão
            </Link>
          </form>
        )}
      </section>
    </AuthLayout>
  );
}
