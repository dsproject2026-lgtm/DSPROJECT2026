import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Plus, Search } from 'lucide-react';

import { commissionApi } from '@/api/commission.api';
import { CommissionSegmentTabs } from '@/features/commission/components/CommissionSegmentTabs';
import { Chip, Spinner, UiDateTimePicker, UiPageSkeleton, UiSelect, UiTable, toast } from '@/components/ui';
import { ApiError } from '@/lib/http/api-error';
import { getStateChipColor } from '@/lib/ui/state-chip';
import type {
  CandidateState,
  CandidateUserItem,
  CreateElectionInput,
  PositionItem,
} from '@/types/commission';
import type { BackendElectionState } from '@/types/elector';

type ElectionFormData = {
  cargoId: string;
  titulo: string;
  descricao: string;
  estado: BackendElectionState;
  dataInicioCandidatura: string;
  dataFimCandidatura: string;
  dataInicioVotacao: string;
  dataFimVotacao: string;
};

const INITIAL_FORM: ElectionFormData = {
  cargoId: '',
  titulo: '',
  descricao: '',
  estado: 'PENDENTE',
  dataInicioCandidatura: '',
  dataFimCandidatura: '',
  dataInicioVotacao: '',
  dataFimVotacao: '',
};

const ESTADOS: BackendElectionState[] = [
  'PENDENTE',
  'ABERTA',
];

const ESTADO_OPTIONS = ESTADOS.map((estado) => ({
  value: estado,
  label: estado,
}));

function toIsoOrNull(value: string) {
  if (!value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function CommissionElectionsPage() {
  const [positions, setPositions] = useState<PositionItem[]>([]);
  const [candidateUsers, setCandidateUsers] = useState<CandidateUserItem[]>([]);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [form, setForm] = useState<ElectionFormData>(INITIAL_FORM);
  const [isBootLoading, setIsBootLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const filteredCandidateUsers = useMemo(() => {
    const query = candidateSearch.trim().toLowerCase();
    if (!query) return candidateUsers;
    return candidateUsers.filter((item) =>
      [item.nome, item.codigo, item.email ?? ''].join(' ').toLowerCase().includes(query),
    );
  }, [candidateSearch, candidateUsers]);

  const loadData = async () => {
    const [positionsResponse, candidateUsersResponse] = await Promise.all([
      commissionApi.listPositions(),
      commissionApi.listCandidateUsers(),
    ]);

    setPositions(positionsResponse.items);
    setCandidateUsers(candidateUsersResponse.items);
    setForm((current) => ({
      ...current,
      cargoId: current.cargoId || positionsResponse.items[0]?.id || '',
    }));
  };

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      setIsBootLoading(true);
      try {
        await loadData();
      } catch (cause) {
        if (!isActive) return;
        const message =
          cause instanceof ApiError ? cause.message : 'Falha ao carregar eleições e cargos.';
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

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.cargoId.trim()) {
      toast.danger('Selecione um cargo.');
      return;
    }
    if (!form.titulo.trim()) {
      toast.danger('O título é obrigatório.');
      return;
    }

    const selectedCandidates = candidateUsers.filter((item) =>
      selectedCandidateIds.includes(item.id),
    );

    const payload: CreateElectionInput = {
      cargoId: form.cargoId,
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim() || null,
      estado: form.estado,
      dataInicioCandidatura: toIsoOrNull(form.dataInicioCandidatura),
      dataFimCandidatura: toIsoOrNull(form.dataFimCandidatura),
      dataInicioVotacao: toIsoOrNull(form.dataInicioVotacao),
      dataFimVotacao: toIsoOrNull(form.dataFimVotacao),
      ...(selectedCandidates.length > 0
        ? {
            candidatos: selectedCandidates.map((candidate) => ({
              utilizadorId: candidate.id,
              nome: candidate.nome,
              estado: 'PENDENTE' as CandidateState,
            })),
          }
        : {}),
    };

    try {
      setIsSaving(true);
      await commissionApi.createElection(payload);
      toast.success('Eleição criada com sucesso.', {
        description: 'A eleição foi registada e os candidatos vinculados foram guardados.',
        actionProps: {
          children: 'Fechar',
          onPress: () => toast.dismiss(),
          variant: 'tertiary',
        },
      });

      try {
        await loadData();
      } catch {
        toast.warning('Eleição criada, mas não foi possível actualizar a listagem.', {
          description: 'Atualize a página para sincronizar os dados mais recentes.',
        });
      }

      setForm((current) => ({
        ...INITIAL_FORM,
        cargoId: current.cargoId,
      }));
      setSelectedCandidateIds([]);
    } catch (cause) {
      const message =
        cause instanceof ApiError
          ? cause.message
          : cause instanceof Error
            ? cause.message
            : 'Não foi possível criar a eleição.';
      toast.danger('Falha ao criar eleição.', {
        description: message,
        indicator: <AlertTriangle className="h-4 w-4" />,
        actionProps: {
          children: 'Fechar',
          onPress: () => toast.dismiss(),
          variant: 'danger',
        },
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleCandidateSelection = (candidate: CandidateUserItem) => {
    if (!candidate.activo) return;

    setSelectedCandidateIds((current) =>
      current.includes(candidate.id)
        ? current.filter((id) => id !== candidate.id)
        : [...current, candidate.id],
    );
  };

  if (isBootLoading) {
    return <UiPageSkeleton />;
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-ui-2xl font-semibold leading-tight tracking-[-0.01em] text-[#0f172a]">
          Gerir Eleições
        </h1>
        <p className="text-ui-sm text-[#475569]">
          Crie eleição e selecione candidatos existentes para vincular no momento da criação.
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
              placeholder="Selecione"
              ariaLabel="Cargo"
              options={positions.map((position) => ({
                value: position.id,
                label: position.nome,
              }))}
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">
              Estado
            </label>
            <UiSelect
              value={form.estado}
              onChange={(estado) =>
                setForm((current) => ({ ...current, estado: estado as BackendElectionState }))
              }
              ariaLabel="Estado"
              options={ESTADO_OPTIONS}
            />
          </div>
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
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">
              Início candidaturas
            </label>
            <UiDateTimePicker
              value={form.dataInicioCandidatura}
              onChange={(dataInicioCandidatura) =>
                setForm((current) => ({ ...current, dataInicioCandidatura }))
              }
              ariaLabel="Início candidaturas"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">
              Fim candidaturas
            </label>
            <UiDateTimePicker
              value={form.dataFimCandidatura}
              onChange={(dataFimCandidatura) =>
                setForm((current) => ({ ...current, dataFimCandidatura }))
              }
              ariaLabel="Fim candidaturas"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">
              Início votação
            </label>
            <UiDateTimePicker
              value={form.dataInicioVotacao}
              onChange={(dataInicioVotacao) => setForm((current) => ({ ...current, dataInicioVotacao }))}
              ariaLabel="Início votação"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">
              Fim votação
            </label>
            <UiDateTimePicker
              value={form.dataFimVotacao}
              onChange={(dataFimVotacao) => setForm((current) => ({ ...current, dataFimVotacao }))}
              ariaLabel="Fim votação"
            />
          </div>

          <div className="md:col-span-2">
            <div className="mb-3 flex items-center justify-between gap-3">
              <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">
                Selecionar candidatos existentes
              </label>
              <span className="text-xs text-[#64748b]">
                {selectedCandidateIds.length} selecionado(s)
              </span>
            </div>

            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
              <input
                value={candidateSearch}
                onChange={(event) => setCandidateSearch(event.target.value)}
                placeholder="Pesquisar por nome, código ou email"
                className="h-11 w-full rounded-sm border border-[#d1d9e6] bg-white pl-10 pr-3 text-sm text-[#475569] outline-none focus:border-[#0b73c9]"
              />
            </div>

            <div className="max-h-[260px] overflow-auto rounded-sm border border-[#e2e8f0]">
              <UiTable
                ariaLabel="Selecionar candidatos"
                minWidthClassName="min-w-[640px]"
                columns={[
                  { id: 'sel', label: 'Sel.', className: 'font-semibold' },
                  { id: 'nome', label: 'Nome', className: 'font-semibold' },
                  { id: 'codigo', label: 'Código', className: 'font-semibold' },
                  { id: 'estado', label: 'Estado', className: 'font-semibold' },
                ]}
                rows={filteredCandidateUsers.map((candidate) => ({
                  id: candidate.id,
                  cells: [
                    <input
                      key={`${candidate.id}:checkbox`}
                      type="checkbox"
                      checked={selectedCandidateIds.includes(candidate.id)}
                      disabled={!candidate.activo}
                      onChange={() => toggleCandidateSelection(candidate)}
                    />,
                    <div key={`${candidate.id}:name`}>
                      <p className="font-semibold text-[#0f172a]">{candidate.nome}</p>
                      <p className="text-xs text-[#64748b]">{candidate.email ?? '-'}</p>
                    </div>,
                    <span key={`${candidate.id}:code`}>{candidate.codigo}</span>,
                    <Chip
                      key={`${candidate.id}:status`}
                      size="sm"
                      variant="soft"
                      color={getStateChipColor(candidate.activo ? 'ATIVO' : 'INATIVO')}
                      className="font-semibold"
                    >
                      {candidate.activo ? 'ATIVO' : 'INATIVO'}
                    </Chip>,
                  ],
                }))}
                emptyMessage="Nenhum candidato encontrado."
              />
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex h-10 items-center rounded-md bg-[#1A56DB] px-4 text-sm font-medium text-white transition hover:bg-[#1647C0] disabled:opacity-60"
          >
            {isSaving ? <Spinner size="sm" className="mr-2 text-white" /> : <Plus className="mr-2 h-4 w-4" />}
            Criar Eleição
          </button>
        </div>
      </form>
    </section>
  );
}
