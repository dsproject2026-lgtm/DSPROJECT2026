import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { authApi } from '@/api/auth.api';
import { toast } from '@/components/ui';
import { AuthBrand } from '@/features/auth/components/AuthBrand';
import { ApiError } from '@/lib/http/api-error';
import { sessionStorageService } from '@/lib/storage/session-storage';

import { AuthLayout } from '@/components/layout/AuthLayout';

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
      toast.danger('Fluxo de login inválido. Volte para a etapa do código.');
      return;
    }

    if (!senha.trim()) {
      toast.warning('Informe a senha.');
      return;
    }

    setIsLoading(true);

    try {
      const session = await authApi.finishLogin(code, senha, flow);
      sessionStorageService.saveSession(session);
      toast.success('Login realizado com sucesso.');
      navigate('/dashboard', { replace: true });
    } catch (cause) {
      if (cause instanceof ApiError) {
        toast.danger(cause.message);
      } else {
        toast.danger('Falha ao concluir login.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthBrand />

      <section className="mx-auto w-full rounded-[22px] border border-[#D6DBE5] bg-[#F7F8FB] px-8 py-10 shadow-[0_8px_18px_rgba(17,24,39,0.05)] sm:px-11 sm:py-11">
        <div className="mb-10 sm:mb-11">
          <div className="flex items-center gap-5">
            <span className="h-11 w-[4px] rounded-full bg-[#2D8AE8]" />
            <div>
              <h2 className="text-[1.8rem] font-bold leading-none text-[#1F57D6] sm:text-[1.95rem]">Acesso a Urna</h2>
              <p className="mt-2 text-[1rem] text-[#5F6776] sm:text-[1.06rem]">Insira suas credenciais institucionais.</p>
            </div>
          </div>
        </div>

        <form className="space-y-8 sm:space-y-9" onSubmit={handleSubmit}>
          <label className="space-y-3.5">
            <span className="text-[0.88rem] font-semibold uppercase tracking-[0.09em] text-[#6C7381] sm:text-[0.92rem]">Senha</span>
            <input
              className="h-13 w-full rounded-md border border-[#C9CFDB] bg-[#F3F5F9] px-5 text-[0.96rem] text-[#4B5563] outline-none transition focus:border-[#2D8AE8] focus:ring-2 focus:ring-[#2D8AE8]/20 sm:h-[54px]"
              placeholder="Digite sua senha"
              type="password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
            />
          </label>

          <Link
            className="block pt-2 text-right text-[0.94rem] font-semibold text-[#1F57D6] hover:text-[#1647C0]"
            to={`/recuperar-senha${code ? `?codigo=${encodeURIComponent(code)}` : ''}`}
          >
            Esqueci a senha
          </Link>

          <button
            className="mt-1 h-13 w-full rounded-lg bg-[#1A56DB] px-5 text-[0.94rem] font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-[#1647C0] disabled:cursor-not-allowed disabled:opacity-70 sm:h-[54px]"
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
