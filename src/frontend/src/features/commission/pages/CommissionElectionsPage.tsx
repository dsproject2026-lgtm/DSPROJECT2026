import { useEffect, useState } from 'react';
import { AlertTriangle, Plus } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { commissionApi } from '@/api/commission.api';
import { CommissionSegmentTabs } from '@/features/commission/components/CommissionSegmentTabs';
import { Spinner, UiDateTimePicker, UiPageSkeleton, UiSelect, toast } from '@/components/ui';
import { ApiError } from '@/lib/http/api-error';
import type { CreateElectionInput, FacultyItem, PositionItem } from '@/types/commission';

type ElectionFormData = {
  cargoId: string;
  escopoEleitores: 'TODOS' | 'FACULDADE';
  faculdadeId: string;
  titulo: string;
  descricao: string;
  dataInicioCandidatura: string;
  dataFimCandidatura: string;
  dataInicioVotacao: string;
  dataFimVotacao: string;
};

const INITIAL_FORM: ElectionFormData = {
  cargoId: '',
  escopoEleitores: 'TODOS',
  faculdadeId: '',
  titulo: '',
  descricao: '',
  dataInicioCandidatura: '',
  dataFimCandidatura: '',
  dataInicioVotacao: '',
  dataFimVotacao: '',
};

function toIsoOrNull(value: string) {
  if (!value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function toLocalInput(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 16);
}

export function CommissionElectionsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editElectionId = searchParams.get('edit');
  const [positions, setPositions] = useState<PositionItem[]>([]);
  const [faculties, setFaculties] = useState<FacultyItem[]>([]);
  const [form, setForm] = useState<ElectionFormData>(INITIAL_FORM);
  const [isBootLoading, setIsBootLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const isEditMode = Boolean(editElectionId);

  const loadData = async () => {
    const [positionsResponse, facultiesResponse] = await Promise.all([
      commissionApi.listPositions(),
      commissionApi.listFaculties(),
    ]);

    setPositions(positionsResponse.items);
    setFaculties(facultiesResponse.items);
    if (editElectionId) {
      const election = await commissionApi.getElectionById(editElectionId);
      setForm({
        cargoId: election.cargoId,
        escopoEleitores: election.escopoEleitores,
        faculdadeId: election.faculdadeId ?? '',
        titulo: election.titulo,
        descricao: election.descricao ?? '',
        dataInicioCandidatura: toLocalInput(election.dataInicioCandidatura),
        dataFimCandidatura: toLocalInput(election.dataFimCandidatura),
        dataInicioVotacao: toLocalInput(election.dataInicioVotacao),
        dataFimVotacao: toLocalInput(election.dataFimVotacao),
      });
      return;
    }

    setForm((current) => ({ ...current, cargoId: current.cargoId || positionsResponse.items[0]?.id || '' }));
  };

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      setIsBootLoading(true);
      try {
        await loadData();
      } catch (cause) {
        if (!isActive) return;
        const message = cause instanceof ApiError ? cause.message : 'Falha ao carregar dados.';
        toast.danger(message);
      } finally {
        if (isActive) setIsBootLoading(false);
      }
    };

    void load();
    return () => {
      isActive = false;
    };
  }, [editElectionId]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.cargoId.trim()) {
      toast.danger('Seleccione um cargo.');
      return;
    }
    if (!form.titulo.trim()) {
      toast.danger('O título é obrigatório.');
      return;
    }
    if (form.escopoEleitores === 'FACULDADE' && !form.faculdadeId) {
      toast.danger('Seleccione a faculdade autorizada a votar.');
      return;
    }

    const payload: CreateElectionInput = {
      cargoId: form.cargoId,
      escopoEleitores: form.escopoEleitores,
      faculdadeId: form.escopoEleitores === 'FACULDADE' ? form.faculdadeId : null,
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim() || null,
      dataInicioCandidatura: toIsoOrNull(form.dataInicioCandidatura),
      dataFimCandidatura: toIsoOrNull(form.dataFimCandidatura),
      dataInicioVotacao: toIsoOrNull(form.dataInicioVotacao),
      dataFimVotacao: toIsoOrNull(form.dataFimVotacao),
    };

    try {
      setIsSaving(true);
      if (editElectionId) {
        await commissionApi.updateElection(editElectionId, payload);
        toast.success('Eleição actualizada com sucesso.');
        navigate(`/comissao/eleicoes/detalhes/${editElectionId}`);
        return;
      }

      await commissionApi.createElection(payload);
      toast.success('Eleição criada com sucesso.', {
        description: 'O estado inicial foi definido automaticamente como PROGRAMADA.',
      });
      await loadData();
      setForm((current) => ({ ...INITIAL_FORM, cargoId: current.cargoId }));
    } catch (cause) {
      const message =
        cause instanceof ApiError
          ? cause.message
          : cause instanceof Error
            ? cause.message
            : isEditMode
              ? 'Não foi possível actualizar a eleição.'
              : 'Não foi possível criar a eleição.';
      toast.danger(isEditMode ? 'Falha ao actualizar a eleição.' : 'Falha ao criar a eleição.', {
        description: message,
        indicator: <AlertTriangle className="h-4 w-4" />,
      });
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
        <h1 className="text-ui-2xl font-semibold leading-tight text-[#0f172a]">
          {isEditMode ? 'Editar Eleição' : 'Gerir Eleições'}
        </h1>
        <p className="text-ui-sm text-[#475569]">
          Crie a eleição, defina quem pode votar e parametrize as datas principais.
        </p>
      </div>

      <CommissionSegmentTabs segment="eleicoes" />

      <form onSubmit={submit} className="rounded-sm border border-[#e2e8f0] bg-white p-5 shadow-none">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">
              Cargo
            </label>
            <UiSelect
              value={form.cargoId}
              onChange={(cargoId) => setForm((current) => ({ ...current, cargoId }))}
              placeholder="Seleccione"
              ariaLabel="Cargo"
              options={positions.map((position) => ({ value: position.id, label: position.nome }))}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">
              Quem pode votar
            </label>
            <UiSelect
              value={form.escopoEleitores}
              onChange={(escopoEleitores) =>
                setForm((current) => ({
                  ...current,
                  escopoEleitores: escopoEleitores as 'TODOS' | 'FACULDADE',
                  faculdadeId: escopoEleitores === 'TODOS' ? '' : current.faculdadeId,
                }))
              }
              ariaLabel="Quem pode votar"
              options={[
                { value: 'TODOS', label: 'Todos os estudantes' },
                { value: 'FACULDADE', label: 'Uma faculdade específica' },
              ]}
            />
          </div>

          {form.escopoEleitores === 'FACULDADE' ? (
            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">
                Faculdade
              </label>
              <UiSelect
                value={form.faculdadeId}
                onChange={(faculdadeId) => setForm((current) => ({ ...current, faculdadeId }))}
                placeholder="Seleccione a faculdade"
                ariaLabel="Faculdade"
                options={faculties.map((faculty) => ({ value: faculty.id, label: faculty.nome }))}
                isSearchable
              />
            </div>
          ) : null}

          <div className="md:col-span-2">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">
              Título
            </label>
            <input
              value={form.titulo}
              onChange={(event) => setForm((current) => ({ ...current, titulo: event.target.value }))}
              className="h-11 w-full rounded-sm border border-[#d1d9e6] bg-white px-3 text-sm text-[#475569] outline-none focus:border-[#0b73c9]"
              placeholder="Título da eleição"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">
              Descrição
            </label>
            <textarea
              value={form.descricao}
              onChange={(event) => setForm((current) => ({ ...current, descricao: event.target.value }))}
              className="min-h-[90px] w-full rounded-sm border border-[#d1d9e6] bg-white px-3 py-2 text-sm text-[#475569] outline-none focus:border-[#0b73c9]"
            />
          </div>

          <UiDateField
            label="Início das candidaturas"
            value={form.dataInicioCandidatura}
            onChange={(dataInicioCandidatura) => setForm((current) => ({ ...current, dataInicioCandidatura }))}
          />
          <UiDateField
            label="Fim candidaturas"
            value={form.dataFimCandidatura}
            onChange={(dataFimCandidatura) => setForm((current) => ({ ...current, dataFimCandidatura }))}
          />
          <UiDateField
            label="Início da votação"
            value={form.dataInicioVotacao}
            onChange={(dataInicioVotacao) => setForm((current) => ({ ...current, dataInicioVotacao }))}
          />
          <UiDateField
            label="Fim da votação"
            value={form.dataFimVotacao}
            onChange={(dataFimVotacao) => setForm((current) => ({ ...current, dataFimVotacao }))}
          />
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex h-10 items-center rounded-md bg-[#1A56DB] px-4 text-sm font-medium text-white transition hover:bg-[#1647C0] disabled:opacity-60"
          >
            {isSaving ? <Spinner size="sm" className="mr-2 text-white" /> : <Plus className="mr-2 h-4 w-4" />}
            {isEditMode ? 'Guardar alterações' : 'Criar eleição'}
          </button>
        </div>
      </form>
    </section>
  );
}

function UiDateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">
        {label}
      </label>
      <UiDateTimePicker value={value} onChange={onChange} ariaLabel={label} />
    </div>
  );
}
