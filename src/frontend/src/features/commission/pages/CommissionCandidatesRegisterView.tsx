import { useState } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle2, Plus, X } from 'lucide-react';

type CandidateStatus = 'PENDENTE' | 'APROVADO' | 'REJEITADO';

type CandidateFormData = {
  eleicaoId: string;
  utilizadorId: string;
  registadoPor: string;
  nome: string;
  fotoUrl: string;
  biografia: string;
  proposta: string;
  estado: CandidateStatus;
};

type ModalProps = {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
};

type CandidateFormErrors = Partial<Record<keyof CandidateFormData, string>>;

const INITIAL_FORM: CandidateFormData = {
  eleicaoId: '',
  utilizadorId: '',
  registadoPor: '',
  nome: '',
  fotoUrl: '',
  biografia: '',
  proposta: '',
  estado: 'PENDENTE',
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

function renderValue(value: string) {
  return value.trim().length > 0 ? value : '-';
}

export function CommissionCandidatesRegisterPage() {
  const [form, setForm] = useState<CandidateFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<CandidateFormErrors>({});
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [message, setMessage] = useState('');

  const validateForm = () => {
    const nextErrors: CandidateFormErrors = {};

    if (!form.eleicaoId.trim()) nextErrors.eleicaoId = 'eleicaoId e obrigatorio.';
    if (!form.utilizadorId.trim()) nextErrors.utilizadorId = 'utilizadorId e obrigatorio.';
    if (!form.nome.trim()) nextErrors.nome = 'nome e obrigatorio.';
    if (form.fotoUrl.trim() && !/^https?:\/\//i.test(form.fotoUrl.trim())) {
      nextErrors.fotoUrl = 'fotoUrl deve ser um URL valido (http/https).';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const openConfirmation = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;
    setIsConfirmOpen(true);
  };

  const confirmRegister = () => {
    setIsConfirmOpen(false);
    setIsSuccessOpen(true);
    setMessage('Candidato preparado com campos alinhados ao modelo da DB.');
    setForm(INITIAL_FORM);
    setErrors({});
  };

  const updateField = <K extends keyof CandidateFormData>(key: K, value: CandidateFormData[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (errors[key]) {
      setErrors((current) => ({ ...current, [key]: undefined }));
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-slate-900">Registrar Candidato</h1>
        <p className="mt-1 text-[13px] text-slate-500">
          Formulario alinhado com os atributos de <strong>candidatos</strong>: eleicaoId, utilizadorId,
          registadoPor, nome, fotoUrl, biografia, proposta e estado.
        </p>
      </div>

      {message ? (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-[13px] text-blue-700">{message}</div>
      ) : null}

      <form onSubmit={openConfirmation} className="rounded-md border border-slate-200 bg-white p-5">
        <div className="grid gap-4 md:grid-cols-2">
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

          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">utilizadorId</label>
            <input
              value={form.utilizadorId}
              onChange={(event) => updateField('utilizadorId', event.target.value)}
              className={`h-10 w-full rounded-md border px-3 text-[14px] outline-none focus:ring-2 ${errors.utilizadorId ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'}`}
              placeholder="Ex: user-2026001"
            />
            {errors.utilizadorId ? <p className="mt-1 text-[12px] text-red-600">{errors.utilizadorId}</p> : null}
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">registadoPor (opcional)</label>
            <input
              value={form.registadoPor}
              onChange={(event) => updateField('registadoPor', event.target.value)}
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-[14px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Ex: com-0001"
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">nome</label>
            <input
              value={form.nome}
              onChange={(event) => updateField('nome', event.target.value)}
              className={`h-10 w-full rounded-md border px-3 text-[14px] outline-none focus:ring-2 ${errors.nome ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'}`}
              placeholder="Nome do candidato"
            />
            {errors.nome ? <p className="mt-1 text-[12px] text-red-600">{errors.nome}</p> : null}
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">fotoUrl (opcional)</label>
            <input
              value={form.fotoUrl}
              onChange={(event) => updateField('fotoUrl', event.target.value)}
              className={`h-10 w-full rounded-md border px-3 text-[14px] outline-none focus:ring-2 ${errors.fotoUrl ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'}`}
              placeholder="https://..."
            />
            {errors.fotoUrl ? <p className="mt-1 text-[12px] text-red-600">{errors.fotoUrl}</p> : null}
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">biografia (opcional)</label>
            <textarea
              value={form.biografia}
              onChange={(event) => updateField('biografia', event.target.value)}
              className="min-h-[96px] w-full rounded-md border border-slate-300 px-3 py-2 text-[14px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Resumo do candidato"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">proposta (opcional)</label>
            <textarea
              value={form.proposta}
              onChange={(event) => updateField('proposta', event.target.value)}
              className="min-h-[96px] w-full rounded-md border border-slate-300 px-3 py-2 text-[14px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Plano/proposta"
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">estado</label>
            <select
              value={form.estado}
              onChange={(event) => updateField('estado', event.target.value as CandidateStatus)}
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-[14px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="PENDENTE">PENDENTE</option>
              <option value="APROVADO">APROVADO</option>
              <option value="REJEITADO">REJEITADO</option>
            </select>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            className="inline-flex h-10 items-center rounded-md bg-blue-600 px-4 text-[13px] font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Guardar Candidato
          </button>
        </div>
      </form>

      <BaseModal title="Confirmar Registo" isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)}>
        <div className="space-y-4 text-[14px] text-slate-700">
          <p>Confirmar registo do candidato com os campos da tabela?</p>
          <div className="rounded-md bg-slate-50 p-3">
            <p><strong>eleicaoId:</strong> {renderValue(form.eleicaoId)}</p>
            <p><strong>utilizadorId:</strong> {renderValue(form.utilizadorId)}</p>
            <p><strong>registadoPor:</strong> {renderValue(form.registadoPor)}</p>
            <p><strong>nome:</strong> {renderValue(form.nome)}</p>
            <p><strong>fotoUrl:</strong> {renderValue(form.fotoUrl)}</p>
            <p><strong>biografia:</strong> {renderValue(form.biografia)}</p>
            <p><strong>proposta:</strong> {renderValue(form.proposta)}</p>
            <p><strong>estado:</strong> {form.estado}</p>
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
          <p className="text-[15px] font-semibold text-slate-900">Candidato registado com sucesso.</p>
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
