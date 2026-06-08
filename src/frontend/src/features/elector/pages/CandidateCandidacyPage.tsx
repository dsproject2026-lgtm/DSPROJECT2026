import { useEffect, useState, type FormEvent } from 'react';

import { candidateApi } from '@/api/candidate.api';
import { Spinner, UiPageSkeleton, UiSelect, toast } from '@/components/ui';
import { ApiError } from '@/lib/http/api-error';
import type { CandidateItem } from '@/types/commission';

export function CandidateCandidacyPage() {
  const [candidacies, setCandidacies] = useState<CandidateItem[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState({ nome: '', fotoUrl: '', biografia: '', proposta: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const response = await candidateApi.listMine();
        if (!isActive) return;
        setCandidacies(response.items);
        const first = response.items[0];
        if (first) {
          setSelectedId(first.id);
          setForm({
            nome: first.nome,
            fotoUrl: first.fotoUrl ?? '',
            biografia: first.biografia ?? '',
            proposta: first.proposta ?? '',
          });
        }
      } catch (cause) {
        if (!isActive) return;
        toast.danger(cause instanceof ApiError ? cause.message : 'Falha ao carregar candidatura.');
      } finally {
        if (isActive) setIsLoading(false);
      }
    };
    void load();
    return () => {
      isActive = false;
    };
  }, []);

  const selected = candidacies.find((item) => item.id === selectedId) ?? null;
  const canEditSelected = selected ? isCandidacyWindowOpen(selected) : false;

  const changeSelected = (candidateId: string) => {
    const candidate = candidacies.find((item) => item.id === candidateId);
    setSelectedId(candidateId);
    setForm({
      nome: candidate?.nome ?? '',
      fotoUrl: candidate?.fotoUrl ?? '',
      biografia: candidate?.biografia ?? '',
      proposta: candidate?.proposta ?? '',
    });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    try {
      setIsSaving(true);
      await candidateApi.updateMine(selected.eleicaoId, selected.id, {
        fotoUrl: form.fotoUrl.trim() || null,
        biografia: form.biografia.trim() || null,
        proposta: form.proposta.trim() || null,
      });
      toast.success('Candidatura actualizada com sucesso.');
    } catch (cause) {
      const message =
        cause instanceof ApiError
          ? cause.message
          : cause instanceof Error
            ? cause.message
            : 'Falha ao actualizar candidatura.';
      toast.danger(message);
    } finally {
      setIsSaving(false);
    }
  };

  const uploadPhoto = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.danger('Seleccione uma imagem válida.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setForm((current) => ({ ...current, fotoUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  if (isLoading) {
    return <UiPageSkeleton />;
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-ui-2xl font-semibold leading-tight text-[#0f172a]">Minha Candidatura</h1>
        <p className="text-ui-sm text-[#475569]">Actualize os dados que os eleitores verão no boletim.</p>
      </div>

      {candidacies.length === 0 ? (
        <div className="rounded-sm border border-[#e2e8f0] bg-white p-5 text-sm text-[#475569]">
          Nenhuma candidatura associada ao seu utilizador.
        </div>
      ) : (
        <form onSubmit={submit} className="rounded-sm border border-[#e2e8f0] bg-white p-5 shadow-none">
          <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">
                Candidatura
              </label>
              <UiSelect
                value={selectedId}
                onChange={changeSelected}
                ariaLabel="Candidatura"
                options={candidacies.map((candidate) => ({
                  value: candidate.id,
                  label: `${candidate.eleicao.titulo} (${candidate.estado})`,
                }))}
              />
            </div>

            <TextField label="Nome completo" value={form.nome} disabled onChange={(nome) => setForm((current) => ({ ...current, nome }))} />
            {selected && !canEditSelected ? (
              <div className="rounded-sm border border-[#fed7aa] bg-[#fff7ed] px-3 py-2 text-sm text-[#9a3412]">
                A alteração dos dados está bloqueada porque o período de candidatura não está aberto.
              </div>
            ) : null}
            <div className="lg:row-span-2">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">
                Foto do candidato
              </label>
              <input
                type="file"
                accept="image/*"
                disabled={!canEditSelected}
                onChange={(event) => uploadPhoto(event.target.files?.[0] ?? null)}
                className="block w-full rounded-sm border border-[#d1d9e6] bg-white px-3 py-2 text-sm text-[#475569] file:mr-4 file:rounded-sm file:border-0 file:bg-[#1A56DB] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white disabled:bg-[#f8fafc]"
              />
              {form.fotoUrl ? (
                <img src={form.fotoUrl} alt="Foto do candidato" className="mt-3 h-28 w-28 rounded-sm object-cover" />
              ) : null}
            </div>
            <TextArea label="Biografia" value={form.biografia} disabled={!canEditSelected} onChange={(biografia) => setForm((current) => ({ ...current, biografia }))} />
            <div className="lg:col-span-2">
              <TextArea label="Proposta / programa eleitoral" value={form.proposta} disabled={!canEditSelected} onChange={(proposta) => setForm((current) => ({ ...current, proposta }))} />
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={isSaving || !canEditSelected}
              className="inline-flex h-10 items-center rounded-md bg-[#1A56DB] px-4 text-sm font-medium text-white transition hover:bg-[#1647C0] disabled:opacity-60"
            >
              {isSaving ? <Spinner size="sm" className="mr-2 text-white" /> : null}
              Guardar Dados
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

function isCandidacyWindowOpen(candidate: CandidateItem) {
  const start = candidate.eleicao.dataInicioCandidatura ? new Date(candidate.eleicao.dataInicioCandidatura) : null;
  const end = candidate.eleicao.dataFimCandidatura ? new Date(candidate.eleicao.dataFimCandidatura) : null;
  const now = new Date();

  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return false;
  }

  return start <= now && now <= end;
}

function TextField({ label, value, disabled = false, onChange }: { label: string; value: string; disabled?: boolean; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">{label}</label>
      <input
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-sm border border-[#d1d9e6] bg-white px-3 text-sm text-[#475569] outline-none focus:border-[#0b73c9] disabled:bg-[#f8fafc] disabled:text-[#64748b]"
      />
    </div>
  );
}

function TextArea({ label, value, disabled = false, onChange }: { label: string; value: string; disabled?: boolean; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">{label}</label>
      <textarea
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-[120px] w-full rounded-sm border border-[#d1d9e6] bg-white px-3 py-2 text-sm text-[#475569] outline-none focus:border-[#0b73c9] disabled:bg-[#f8fafc] disabled:text-[#64748b]"
      />
    </div>
  );
}
