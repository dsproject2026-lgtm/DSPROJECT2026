import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { authApi } from '@/api/auth.api';
import { toast } from '@/components/ui';
import { AuthBrand } from '@/features/auth/components/AuthBrand';
import { ApiError } from '@/lib/http/api-error';
import { sessionStorageService } from '@/lib/storage/session-storage';

import { AuthLayout } from '@/components/layout/AuthLayout';

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
      toast.warning('Código não identificado no link. Informe seu código.');
      return;
    }

    if (!novaSenha.trim() || !confirmarSenha.trim()) {
      toast.warning('Preencha a nova senha e a confirmação.');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      toast.warning('A confirmação da senha não corresponde.');
      return;
    }

    setIsFinishing(true);

    try {
      const session = await authApi.finishFirstAccess(codeToUse, tokenFromLink, novaSenha);
      sessionStorageService.saveSession(session);
      toast.success('Senha definida com sucesso.');
      navigate('/dashboard', { replace: true });
    } catch (cause) {
      if (cause instanceof ApiError) {
        toast.danger(cause.message);
      } else {
        toast.danger('Falha ao concluir definição de senha.');
      }
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <AuthLayout>
      <AuthBrand />

      <section className="mx-auto w-full rounded-[22px] border border-[#D6DBE5] bg-[#F7F8FB] px-6 py-8 shadow-[0_8px_18px_rgba(17,24,39,0.05)] sm:px-10 sm:py-10">
        <div>
          <div className="flex items-center gap-5">
            <span className="h-11 w-[4px] rounded-full bg-[#2D8AE8]" />
            <div>
              <h2 className="text-[1.8rem] font-bold leading-none text-[#1F57D6] sm:text-[1.95rem]">Acesso a Urna</h2>
              <p className="mt-2 text-[1rem] text-[#5F6776] sm:text-[1.06rem]">
                {isResetStep ? 'Defina sua nova senha.' : 'Receba link por e-mail para redefinir sua senha.'}
              </p>
            </div>
          </div>
        </div>

        {!isResetStep ? (
          <form className="mt-12 space-y-7" onSubmit={handleSendLink}>
            <label className="space-y-3">
              <span className="text-[0.88rem] font-semibold uppercase tracking-[0.09em] text-[#6C7381] sm:text-[0.92rem]">
                Numero de estudante ou username
              </span>
              <input
                className="h-13 w-full rounded-md border border-[#C9CFDB] bg-[#F3F5F9] px-5 text-[0.96rem] text-[#4B5563] outline-none transition focus:border-[#2D8AE8] focus:ring-2 focus:ring-[#2D8AE8]/20 sm:h-[54px]"
                value={codigo}
                onChange={(event) => setCodigo(event.target.value)}
              />
            </label>

            <button
              className="h-13 w-full rounded-lg border border-[#D0D6E2] bg-white px-5 text-[0.95rem] font-semibold text-[#1F57D6] transition hover:bg-[#EEF4FF] disabled:cursor-not-allowed disabled:opacity-70 sm:h-[54px]"
              disabled={isSendingLink}
              type="submit"
            >
              {isSendingLink ? 'Enviando...' : 'Enviar link por email'}
            </button>

            <Link className="mt-1 text-[1rem] text-[#1F57D6] hover:text-[#1647C0]" to="/login">
              Voltar para login
            </Link>
          </form>
        ) : (
          <form className="mt-12 space-y-7" onSubmit={handleFinish}>
            <label className="space-y-3">
              <span className="text-[0.88rem] font-semibold uppercase tracking-[0.09em] text-[#6C7381] sm:text-[0.92rem]">
                Numero de estudante ou username
              </span>
              <input
                className="h-13 w-full rounded-md border border-[#C9CFDB] bg-[#F3F5F9] px-5 text-[0.96rem] text-[#4B5563] outline-none transition focus:border-[#2D8AE8] focus:ring-2 focus:ring-[#2D8AE8]/20 sm:h-[54px]"
                disabled={Boolean(codeFromLink)}
                value={codigo}
                onChange={(event) => setCodigo(event.target.value)}
              />
            </label>

            <label className="space-y-3">
              <span className="text-[0.88rem] font-semibold uppercase tracking-[0.09em] text-[#6C7381] sm:text-[0.92rem]">Senha</span>
              <input
                className="h-13 w-full rounded-md border border-[#C9CFDB] bg-[#F3F5F9] px-5 text-[0.96rem] text-[#4B5563] outline-none transition focus:border-[#2D8AE8] focus:ring-2 focus:ring-[#2D8AE8]/20 sm:h-[54px]"
                placeholder="Mínimo 8 caracteres"
                type="password"
                value={novaSenha}
                onChange={(event) => setNovaSenha(event.target.value)}
              />
            </label>

            <label className="space-y-3">
              <span className="text-[0.88rem] font-semibold uppercase tracking-[0.09em] text-[#6C7381] sm:text-[0.92rem]">
                Confirme a senha
              </span>
              <input
                className="h-13 w-full rounded-md border border-[#C9CFDB] bg-[#F3F5F9] px-5 text-[0.96rem] text-[#4B5563] outline-none transition focus:border-[#2D8AE8] focus:ring-2 focus:ring-[#2D8AE8]/20 sm:h-[54px]"
                placeholder="Repita a nova senha"
                type="password"
                value={confirmarSenha}
                onChange={(event) => setConfirmarSenha(event.target.value)}
              />
            </label>

            <button
              className="h-13 w-full rounded-lg bg-[#1A56DB] px-5 text-[0.94rem] font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-[#1647C0] disabled:cursor-not-allowed disabled:opacity-70 sm:h-[54px]"
              disabled={isFinishing}
              type="submit"
            >
              {isFinishing ? 'Concluindo...' : 'Definir senha \u21AA'}
            </button>

            <Link className="mt-1 text-[1rem] text-[#1F57D6] hover:text-[#1647C0]" to="/login">
              Voltar para login
            </Link>
          </form>
        )}
      </section>
    </AuthLayout>
  );
}
