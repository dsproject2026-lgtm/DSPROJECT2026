import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { authApi } from '@/api/auth.api';
import { getRoleHomeRoute } from '@/config/role-navigation';
import { toast } from '@/components/ui';
import { AuthBrand } from '@/features/auth/components/AuthBrand';
import { ApiError } from '@/lib/http/api-error';
import { sessionStorageService } from '@/lib/storage/session-storage';

import { AuthLayout } from '@/components/layout/AuthLayout';

function getRecoveryToken(searchParams: URLSearchParams) {
  const raw = searchParams.get('token') ?? searchParams.get('passwordRecoveryToken') ?? '';
  return raw.trim();
}

function getRecoveryCode(searchParams: URLSearchParams) {
  const raw = searchParams.get('codigo') ?? searchParams.get('code') ?? '';
  return raw.trim();
}

export function PasswordRecoveryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const tokenFromLink = getRecoveryToken(searchParams);
  const codeFromLink = getRecoveryCode(searchParams);
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
      await authApi.startPasswordRecovery(codigo.trim());
      toast.success('Link de recuperação enviado por email.');
    } catch (cause) {
      if (cause instanceof ApiError) {
        toast.danger(cause.message);
      } else {
        toast.danger('Falha ao enviar link de recuperação.');
      }
    } finally {
      setIsSendingLink(false);
    }
  };

  const handleFinish = async (event: FormEvent) => {
    event.preventDefault();

    const codeToUse = codigo.trim();

    if (!tokenFromLink) {
      toast.danger('Link inválido. Solicite um novo link de recuperação.');
      return;
    }

    if (!codeToUse) {
      toast.warning('Código não identificado no link. Informe o seu código.');
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
      const session = await authApi.finishPasswordRecovery(codeToUse, tokenFromLink, novaSenha);
      sessionStorageService.saveSession(session);
      toast.success('Senha redefinida com sucesso.');
      navigate(getRoleHomeRoute(session.user.perfil), { replace: true });
    } catch (cause) {
      if (cause instanceof ApiError) {
        toast.danger(cause.message);
      } else {
        toast.danger('Falha ao redefinir a senha.');
      }
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <AuthLayout>
      <AuthBrand />

      <section className="mx-auto w-full rounded-[22px] border border-[#D6DBE5] bg-[#F7F8FB] px-8 py-10 shadow-[0_8px_18px_rgba(17,24,39,0.05)] sm:px-11 sm:py-11">
        <div className="mb-8 sm:mb-9">
          <div className="flex items-center gap-5">
            <span className="h-11 w-[4px] rounded-full bg-[#2D8AE8]" />
            <div>
              <h2 className="text-[1.8rem] font-bold leading-none text-[#1F57D6] sm:text-[1.95rem]">Recuperar Senha</h2>
              <p className="mt-2 text-[1rem] text-[#5F6776] sm:text-[1.06rem]">
                {isResetStep ? 'Defina uma nova senha para continuar.' : 'Receba o link de recuperação no seu email.'}
              </p>
            </div>
          </div>
        </div>

        {!isResetStep ? (
          <form className="flex flex-col gap-4" onSubmit={handleSendLink}>
            <label className="flex flex-col gap-2">
              <span className="text-[0.88rem] font-semibold uppercase tracking-[0.09em] text-[#6C7381] sm:text-[0.92rem]">
                Número de estudante ou username
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
              {isSendingLink ? 'A enviar...' : 'Enviar link por email'}
            </button>

            <Link className="mt-4 block text-[1rem] text-[#1F57D6] hover:text-[#1647C0]" to="/login">
              Voltar para login
            </Link>
          </form>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={handleFinish}>
            <label className="flex flex-col gap-2">
              <span className="text-[0.88rem] font-semibold uppercase tracking-[0.09em] text-[#6C7381] sm:text-[0.92rem]">
                Número de estudante ou username
              </span>
              <input
                className="h-13 w-full rounded-md border border-[#C9CFDB] bg-[#F3F5F9] px-5 text-[0.96rem] text-[#4B5563] outline-none transition focus:border-[#2D8AE8] focus:ring-2 focus:ring-[#2D8AE8]/20 sm:h-[54px]"
                disabled={Boolean(codeFromLink)}
                value={codigo}
                onChange={(event) => setCodigo(event.target.value)}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-[0.88rem] font-semibold uppercase tracking-[0.09em] text-[#6C7381] sm:text-[0.92rem]">Nova senha</span>
              <input
                className="h-13 w-full rounded-md border border-[#C9CFDB] bg-[#F3F5F9] px-5 text-[0.96rem] text-[#4B5563] outline-none transition focus:border-[#2D8AE8] focus:ring-2 focus:ring-[#2D8AE8]/20 sm:h-[54px]"
                placeholder="Mínimo 8 caracteres"
                type="password"
                value={novaSenha}
                onChange={(event) => setNovaSenha(event.target.value)}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-[0.88rem] font-semibold uppercase tracking-[0.09em] text-[#6C7381] sm:text-[0.92rem]">
                Confirmar senha
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
              {isFinishing ? 'A concluir...' : 'Redefinir senha'}
            </button>

            <Link className="mt-4 block text-[1rem] text-[#1F57D6] hover:text-[#1647C0]" to="/login">
              Voltar para login
            </Link>
          </form>
        )}
      </section>
    </AuthLayout>
  );
}
