import { useState } from 'react';
import { Plus } from 'lucide-react';

import { positionsApi } from '@/api/positions.api';
import { Spinner, toast } from '@/components/ui';
import { ApiError } from '@/lib/http/api-error';

type PositionFormData = {
  nome: string;
  descricao: string;
};

const INITIAL_FORM: PositionFormData = {
  nome: '',
  descricao: '',
};

export function AdminPositionsRegisterPage() {
  const [form, setForm] = useState<PositionFormData>(INITIAL_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.nome.trim()) {
      toast.danger('Indique o nome do cargo.');
      return;
    }

    try {
      setIsSaving(true);
      await positionsApi.create({
        nome: form.nome.trim(),
        descricao: form.descricao.trim() || null,
      });
      setForm(INITIAL_FORM);
      toast.success('Cargo registado com sucesso.');
    } catch (cause) {
      const message =
        cause instanceof ApiError
          ? cause.message
          : cause instanceof Error
            ? cause.message
            : 'Não foi possível registar o cargo.';
      toast.danger(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-ui-2xl font-semibold leading-tight tracking-[-0.01em] text-[#0f172a]">
          Registar Cargo
        </h1>
        <p className="text-ui-sm text-[#475569]">
          Crie um novo cargo para ser usado nas eleições.
        </p>
      </div>

      <form onSubmit={submit} className="rounded-sm border border-[#e2e8f0] bg-white p-5 shadow-none">
        <div className="grid gap-4">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">
              Nome do cargo
            </label>
            <input
              value={form.nome}
              onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))}
              className="h-11 w-full rounded-sm border border-[#d1d9e6] bg-white px-3 text-sm text-[#475569] outline-none focus:border-[#0b73c9]"
              placeholder="Ex.: Presidente da Associação"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">
              Descrição (opcional)
            </label>
            <textarea
              value={form.descricao}
              onChange={(event) =>
                setForm((current) => ({ ...current, descricao: event.target.value }))
              }
              className="min-h-[110px] w-full rounded-sm border border-[#d1d9e6] bg-white px-3 py-2 text-sm text-[#475569] outline-none focus:border-[#0b73c9]"
              placeholder="Descrição breve do cargo"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex h-10 items-center rounded-md bg-[#1A56DB] px-4 text-sm font-medium text-white transition hover:bg-[#1647C0] disabled:opacity-60"
          >
            {isSaving ? <Spinner size="sm" className="mr-2 text-white" /> : <Plus className="mr-2 h-4 w-4" />}
            Guardar Cargo
          </button>
        </div>
      </form>
    </section>
  );
}
