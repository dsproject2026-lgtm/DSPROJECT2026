import { useState } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle2, Plus, X } from 'lucide-react';

type Perfil = 'ADMIN' | 'GESTOR_ELEITORAL' | 'AUDITOR' | 'ELEITOR';

type ElectorFormData = {
  codigo: string;
  nome: string;
  email: string;
  perfil: Perfil;
  activo: boolean;
  mustSetPassword: boolean;
  eleicaoId: string;
  jaVotou: boolean;
};

type ElectorFormErrors = Partial<Record<keyof ElectorFormData, string>>;

type ModalProps = {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
};

const INITIAL_FORM: ElectorFormData = {
  codigo: '',
  nome: '',
  email: '',
  perfil: 'ELEITOR',
  activo: true,
  mustSetPassword: true,
  eleicaoId: '',
  jaVotou: false,
};

function BaseModal({ title, isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-md bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="text-[18px] font-semibold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-50"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[calc(90vh-74px)] overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

function boolLabel(value: boolean) {
  return value ? 'TRUE' : 'FALSE';
}

function renderValue(value: string) {
  return value.trim().length > 0 ? value : '-';
}

export function CommissionElectorsRegisterPage() {
  const [form, setForm] = useState<ElectorFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<ElectorFormErrors>({});
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [message, setMessage] = useState('');

  const validateForm = () => {
    const nextErrors: ElectorFormErrors = {};

    if (!form.codigo.trim()) nextErrors.codigo = 'codigo e obrigatorio.';
    if (!form.nome.trim()) nextErrors.nome = 'nome e obrigatorio.';
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = 'email invalido.';
    }
    if (!form.eleicaoId.trim()) nextErrors.eleicaoId = 'eleicaoId e obrigatorio.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const updateField = <K extends keyof ElectorFormData>(key: K, value: ElectorFormData[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (errors[key]) {
      setErrors((current) => ({ ...current, [key]: undefined }));
    }
  };

  const openConfirmation = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;
    setIsConfirmOpen(true);
  };

  const confirmRegister = () => {
    setIsConfirmOpen(false);
    setIsSuccessOpen(true);
    setMessage('Eleitor preparado com campos alinhados aos modelos da DB.');
    setForm(INITIAL_FORM);
    setErrors({});
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-slate-900">Registrar Eleitor</h1>
        <p className="mt-1 text-[13px] text-slate-500">
          Formulario alinhado com os atributos de <strong>utilizadores</strong> + <strong>elegiveis</strong>.
        </p>
      </div>

      {message ? (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-[13px] text-blue-700">{message}</div>
      ) : null}

      <form onSubmit={openConfirmation} className="rounded-md border border-slate-200 bg-white p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">codigo</label>
            <input
              value={form.codigo}
              onChange={(event) => updateField('codigo', event.target.value)}
              className={`h-10 w-full rounded-md border px-3 text-[14px] outline-none focus:ring-2 ${errors.codigo ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'}`}
              placeholder="Ex: 2026001"
            />
            {errors.codigo ? <p className="mt-1 text-[12px] text-red-600">{errors.codigo}</p> : null}
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">nome</label>
            <input
              value={form.nome}
              onChange={(event) => updateField('nome', event.target.value)}
              className={`h-10 w-full rounded-md border px-3 text-[14px] outline-none focus:ring-2 ${errors.nome ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'}`}
              placeholder="Nome completo"
            />
            {errors.nome ? <p className="mt-1 text-[12px] text-red-600">{errors.nome}</p> : null}
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">email (opcional)</label>
            <input
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              className={`h-10 w-full rounded-md border px-3 text-[14px] outline-none focus:ring-2 ${errors.email ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'}`}
              placeholder="email@up.ac.mz"
            />
            {errors.email ? <p className="mt-1 text-[12px] text-red-600">{errors.email}</p> : null}
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">perfil</label>
            <select
              value={form.perfil}
              onChange={(event) => updateField('perfil', event.target.value as Perfil)}
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-[14px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="ADMIN">ADMIN</option>
              <option value="GESTOR_ELEITORAL">GESTOR_ELEITORAL</option>
              <option value="AUDITOR">AUDITOR</option>
              <option value="ELEITOR">ELEITOR</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">eleicaoId</label>
            <input
              value={form.eleicaoId}
              onChange={(event) => updateField('eleicaoId', event.target.value)}
              className={`h-10 w-full rounded-md border px-3 text-[14px] outline-none focus:ring-2 ${errors.eleicaoId ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'}`}
              placeholder="Ex: ele-2026-aeup"
            />
            {errors.eleicaoId ? <p className="mt-1 text-[12px] text-red-600">{errors.eleicaoId}</p> : null}
          </div>

          <div className="grid grid-cols-1 gap-2 rounded-md border border-slate-200 p-3">
            <label className="flex items-center gap-2 text-[13px] text-slate-700">
              <input
                type="checkbox"
                checked={form.activo}
                onChange={(event) => updateField('activo', event.target.checked)}
              />
              activo
            </label>
            <label className="flex items-center gap-2 text-[13px] text-slate-700">
              <input
                type="checkbox"
                checked={form.mustSetPassword}
                onChange={(event) => updateField('mustSetPassword', event.target.checked)}
              />
              mustSetPassword
            </label>
            <label className="flex items-center gap-2 text-[13px] text-slate-700">
              <input
                type="checkbox"
                checked={form.jaVotou}
                onChange={(event) => updateField('jaVotou', event.target.checked)}
              />
              jaVotou
            </label>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            className="inline-flex h-10 items-center rounded-md bg-blue-600 px-4 text-[13px] font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Guardar Eleitor
          </button>
        </div>
      </form>

      <div className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-[13px] text-blue-700">
        Esta tela e apenas para registo. A listagem fica em <strong>Comissao &gt; Estudantes &gt; Visualizar</strong>.
      </div>

      <BaseModal title="Confirmar Registo" isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)}>
        <div className="space-y-4 text-[14px] text-slate-700">
          <p>Confirmar registo do eleitor com os campos da tabela?</p>
          <div className="rounded-md bg-slate-50 p-3">
            <p><strong>codigo:</strong> {renderValue(form.codigo)}</p>
            <p><strong>nome:</strong> {renderValue(form.nome)}</p>
            <p><strong>email:</strong> {renderValue(form.email)}</p>
            <p><strong>perfil:</strong> {form.perfil}</p>
            <p><strong>activo:</strong> {boolLabel(form.activo)}</p>
            <p><strong>mustSetPassword:</strong> {boolLabel(form.mustSetPassword)}</p>
            <p><strong>eleicaoId:</strong> {renderValue(form.eleicaoId)}</p>
            <p><strong>jaVotou:</strong> {boolLabel(form.jaVotou)}</p>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsConfirmOpen(false)}
              className="h-10 rounded-md border border-slate-300 bg-white px-4 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmRegister}
              className="h-10 rounded-md bg-blue-600 px-4 text-[13px] font-semibold text-white hover:bg-blue-700"
            >
              Confirmar
            </button>
          </div>
        </div>
      </BaseModal>

      <BaseModal title="Registo Concluido" isOpen={isSuccessOpen} onClose={() => setIsSuccessOpen(false)}>
        <div className="flex flex-col items-center justify-center gap-3 py-4 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          <p className="text-[15px] font-semibold text-slate-900">Eleitor registado com sucesso.</p>
          <button
            type="button"
            onClick={() => setIsSuccessOpen(false)}
            className="mt-2 h-10 rounded-md bg-blue-600 px-4 text-[13px] font-semibold text-white hover:bg-blue-700"
          >
            Fechar
          </button>
        </div>
      </BaseModal>
    </section>
  );
}
