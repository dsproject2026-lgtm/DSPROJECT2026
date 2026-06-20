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

export function PasswordLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code') ?? '';
  const flow = searchParams.get('flow') ?? '';

  const [senha, setSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!code || !flow) {
      toast.danger('Fluxo de início de sessão inválido. Volte para a etapa do código.');
      return;
    }

    if (!senha.trim()) {
      toast.warning('Informe a palavra-passe.');
      return;
    }

    if (senha.length < MIN_PASSWORD_LENGTH) {
      toast.warning(`A palavra-passe deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }

    setIsLoading(true);

    try {
      const session = await authApi.finishLogin(code, senha, flow);
      sessionStorageService.saveSession(session);
      toast.success('Sessão iniciada com sucesso.');

      navigate(getRoleHomeRoute(session.user.perfil), { replace: true });
    } catch (cause) {
      if (cause instanceof ApiError) {
        toast.danger(cause.message);
      } else {
        toast.danger('Falha ao concluir o início de sessão.');
      }
    } finally {
      setIsLoading(false);
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
              <h2 className="text-[1.45rem] font-bold leading-tight text-[#1F57D6] sm:text-[1.95rem]">Acesso à Urna de Votação</h2>
              <p className="mt-2 text-[0.94rem] text-[#5F6776] sm:text-[1.06rem]">Insira as suas credenciais institucionais.</p>
            </div>
          </div>
        </div>

        <form className="space-y-8 sm:space-y-9" onSubmit={handleSubmit}>
          <label className="space-y-3.5">
            <span className="text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-[#6C7381] sm:text-[0.92rem] sm:tracking-[0.09em]">Palavra-passe</span>
            <PasswordInput
              className="h-13 w-full rounded-md border border-[#C9CFDB] bg-[#F3F5F9] px-5 text-[0.96rem] text-[#4B5563] outline-none transition focus:border-[#2D8AE8] focus:ring-2 focus:ring-[#2D8AE8]/20 sm:h-[54px]"
              placeholder="Digite a sua palavra-passe"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
            />
          </label>

          <Link
            className="block pt-2 text-right text-[0.94rem] font-semibold text-[#1F57D6] hover:text-[#1647C0]"
            to={`/recuperar-senha${code ? `?codigo=${encodeURIComponent(code)}` : ''}`}
          >
            Esqueci a palavra-passe
          </Link>

          <button
            className="mt-1 h-13 w-full rounded-lg bg-[#1A56DB] px-4 text-[0.86rem] font-semibold uppercase tracking-[0.08em] sm:px-5 sm:text-[0.94rem] sm:tracking-[0.15em] text-white transition hover:bg-[#1647C0] disabled:cursor-not-allowed disabled:opacity-70 sm:h-[54px]"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? 'Aguarde...' : 'Entrar \u21AA'}
          </button>

          <Link className="block pt-4 text-[1rem] text-[#1F57D6] hover:text-[#1647C0]" to="/login">
            Voltar para o passo do código
          </Link>
        </form>
      </section>
    </AuthLayout>
  );
}
