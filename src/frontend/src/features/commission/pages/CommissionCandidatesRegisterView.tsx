import { useEffect, useState, type ChangeEvent } from 'react';
import { ImagePlus, Plus } from 'lucide-react';

import { commissionApi } from '@/api/commission.api';
import { CommissionSegmentTabs } from '@/features/commission/components/CommissionSegmentTabs';
import { Spinner, UiPageSkeleton, UiSelect, toast } from '@/components/ui';
import { ApiError } from '@/lib/http/api-error';
import type { CandidateUserItem } from '@/types/commission';

type CandidateFormData = {
  nome: string;
  fotoDataUrl: string;
  biografia: string;
  proposta: string;
};

type CandidateFormErrors = Partial<Record<keyof CandidateFormData, string>>;

const INITIAL_FORM: CandidateFormData = {
  nome: '',
  fotoDataUrl: '',
  biografia: '',
  proposta: '',
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(new Error('Falha ao ler ficheiro de imagem.'));
    };
    reader.onerror = () => reject(new Error('Falha ao ler ficheiro de imagem.'));
    reader.readAsDataURL(file);
  });
}

export function CommissionCandidatesRegisterPage() {
  const [selectedElectionId, setSelectedElectionId] = useState('');
  const [candidateUsers, setCandidateUsers] = useState<CandidateUserItem[]>([]);
  const [selectedCandidateUserId, setSelectedCandidateUserId] = useState('');
  const [form, setForm] = useState<CandidateFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<CandidateFormErrors>({});
  const [isBootLoading, setIsBootLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      setIsBootLoading(true);
      try {
        const [electionsResponse, usersResponse] = await Promise.all([
          commissionApi.listElections(),
          commissionApi.listCandidateUsers(),
        ]);
        if (!isActive) return;
        const openElection =
          electionsResponse.items.find((item) => item.estado === 'ABERTA') ?? electionsResponse.items[0];
        setSelectedElectionId(openElection?.id ?? '');
        setCandidateUsers(usersResponse.items);
      } catch (cause) {
        if (!isActive) return;
        const message =
          cause instanceof ApiError ? cause.message : 'Não foi possível carregar dados de registo.';
        toast.danger(message);
      } finally {
        if (isActive) setIsBootLoading(false);
      }
    };

    void load();
    return () => {
      isActive = false;
    };
  }, []);

  const validateForm = () => {
    const nextErrors: CandidateFormErrors = {};
    if (!selectedElectionId) {
      toast.danger('Nenhuma eleição disponível para candidatura.');
    }
    if (!selectedCandidateUserId) {
      toast.danger('Selecione um utilizador registado.');
    }
    if (!form.nome.trim()) nextErrors.nome = 'Nome é obrigatório.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0 && Boolean(selectedElectionId) && Boolean(selectedCandidateUserId);
  };

  const updateField = <K extends keyof CandidateFormData>(key: K, value: CandidateFormData[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (errors[key]) {
      setErrors((current) => ({ ...current, [key]: undefined }));
    }
  };

  const onSelectPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.danger('Selecione um ficheiro de imagem válido.');
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      updateField('fotoDataUrl', dataUrl);
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : 'Não foi possível carregar a foto.';
      toast.danger(message);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      await commissionApi.createCandidate(selectedElectionId, {
        utilizadorId: selectedCandidateUserId,
        nome: form.nome.trim(),
        fotoUrl: form.fotoDataUrl || null,
        biografia: form.biografia.trim() || null,
        proposta: form.proposta.trim() || null,
      });

      toast.success('Candidato registado com sucesso.');
      setForm(INITIAL_FORM);
      setSelectedCandidateUserId('');
      setErrors({});
    } catch (cause) {
      const message =
        cause instanceof ApiError
          ? cause.message
          : cause instanceof Error
            ? cause.message
            : 'Falha ao registar candidato.';
      toast.danger(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isBootLoading) {
    return <UiPageSkeleton />;
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-ui-2xl font-semibold leading-tight tracking-[-0.01em] text-[#0f172a]">
          Registrar Candidato
        </h1>
        <p className="text-ui-sm text-[#475569]">
          Preencha os dados do candidato e guarde o registo.
        </p>
      </div>

      <CommissionSegmentTabs segment="candidatos" />

      <form onSubmit={submit} className="rounded-sm border border-[#e2e8f0] bg-white p-5 shadow-none">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">
              Utilizador registado
            </label>
            <UiSelect
              value={selectedCandidateUserId}
              onChange={(value) => {
                setSelectedCandidateUserId(value);
                const selected = candidateUsers.find((user) => user.id === value);
                if (selected) {
                  updateField('nome', selected.nome);
                }
              }}
              placeholder="Pesquisar e selecionar utilizador"
              ariaLabel="Utilizador registado"
              options={candidateUsers.map((user) => ({
                value: user.id,
                label: `${user.nome} (${user.codigo})`,
                disabled: !user.activo,
              }))}
              isSearchable
              searchPlaceholder="Pesquisar por nome ou código..."
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">
              Nome
            </label>
            <input
              value={form.nome}
              onChange={(event) => updateField('nome', event.target.value)}
              className={`h-11 w-full rounded-sm border px-3 text-sm outline-none ${errors.nome ? 'border-[#fecaca] text-[#dc2626] focus:border-[#dc2626]' : 'border-[#d1d9e6] bg-white text-[#475569] focus:border-[#0b73c9]'}`}
              placeholder="Digite o nome do candidato"
            />
            {errors.nome ? <p className="mt-1 text-xs text-[#dc2626]">{errors.nome}</p> : null}
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">
              Foto (opcional)
            </label>
            <label className="inline-flex h-11 cursor-pointer items-center rounded-sm border border-[#d1d9e6] bg-white px-3 text-sm text-[#475569] transition hover:bg-[#f8fafc]">
              <ImagePlus className="mr-2 h-4 w-4" />
              Carregar foto do dispositivo
              <input type="file" accept="image/*" className="hidden" onChange={onSelectPhoto} />
            </label>
            {form.fotoDataUrl ? (
              <div className="mt-3">
                <img
                  src={form.fotoDataUrl}
                  alt="Pré-visualização da foto"
                  className="h-32 w-32 rounded-md border border-[#d1d9e6] object-cover"
                />
              </div>
            ) : null}
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">
              Biografia (opcional)
            </label>
            <textarea
              value={form.biografia}
              onChange={(event) => updateField('biografia', event.target.value)}
              className="min-h-[96px] w-full rounded-sm border border-[#d1d9e6] bg-white px-3 py-2 text-sm text-[#475569] outline-none focus:border-[#0b73c9]"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">
              Proposta (opcional)
            </label>
            <textarea
              value={form.proposta}
              onChange={(event) => updateField('proposta', event.target.value)}
              className="min-h-[96px] w-full rounded-sm border border-[#d1d9e6] bg-white px-3 py-2 text-sm text-[#475569] outline-none focus:border-[#0b73c9]"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={isSaving || !selectedElectionId}
            className="inline-flex h-10 items-center rounded-md bg-[#1A56DB] px-4 text-sm font-medium text-white transition hover:bg-[#1647C0] disabled:opacity-60"
          >
            {isSaving ? <Spinner size="sm" className="mr-2 text-white" /> : <Plus className="mr-2 h-4 w-4" />}
            Guardar Candidato
          </button>
        </div>
      </form>
    </section>
  );
}
