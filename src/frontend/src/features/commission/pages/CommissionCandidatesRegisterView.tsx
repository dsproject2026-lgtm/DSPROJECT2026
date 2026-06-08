import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';

import { commissionApi } from '@/api/commission.api';
import { CommissionSegmentTabs } from '@/features/commission/components/CommissionSegmentTabs';
import { Spinner, UiPageSkeleton, UiSelect, toast } from '@/components/ui';
import { ApiError } from '@/lib/http/api-error';
import type { CandidateUserItem, CommissionElectionItem } from '@/types/commission';

export function CommissionCandidatesRegisterPage() {
  const [elections, setElections] = useState<CommissionElectionItem[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState('');
  const [candidateUsers, setCandidateUsers] = useState<CandidateUserItem[]>([]);
  const [selectedCandidateUserId, setSelectedCandidateUserId] = useState('');
  const [isBootLoading, setIsBootLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const selectedElection = useMemo(
    () => elections.find((item) => item.id === selectedElectionId) ?? null,
    [elections, selectedElectionId],
  );

  const programmedElections = useMemo(
    () => elections.filter((election) => election.estado === 'PROGRAMADA'),
    [elections],
  );

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      setIsBootLoading(true);
      try {
        const electionsResponse = await commissionApi.listElections();
        if (!isActive) return;
        const available = electionsResponse.items.filter((item) => item.estado === 'PROGRAMADA');
        setElections(electionsResponse.items);
        setSelectedElectionId(available[0]?.id ?? '');
      } catch (cause) {
        if (!isActive) return;
        toast.danger(cause instanceof ApiError ? cause.message : 'Não foi possível carregar os dados.');
      } finally {
        if (isActive) setIsBootLoading(false);
      }
    };

    void load();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedElectionId) {
      setCandidateUsers([]);
      return;
    }

    let isActive = true;
    const loadCandidateUsers = async () => {
      try {
        const response = await commissionApi.listCandidateUsers(undefined, selectedElectionId);
        if (!isActive) return;
        setCandidateUsers(response.items);
      } catch (cause) {
        if (!isActive) return;
        toast.danger(cause instanceof ApiError ? cause.message : 'Não foi possível carregar eleitores elegíveis.');
      }
    };

    void loadCandidateUsers();
    return () => {
      isActive = false;
    };
  }, [selectedElectionId]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedElectionId) {
      toast.danger('Seleccione uma eleição programada.');
      return;
    }
    if (!selectedCandidateUserId) {
      toast.danger('Seleccione o eleitor a associar.');
      return;
    }

    try {
      setIsSaving(true);
      await commissionApi.createCandidate(selectedElectionId, {
        utilizadorId: selectedCandidateUserId,
      });
      toast.success('Candidato associado com sucesso.', {
        description: 'O candidato fica aprovado por defeito e poderá preencher fotografia e proposta no seu ecrã.',
      });
      setSelectedCandidateUserId('');
    } catch (cause) {
      const message =
        cause instanceof ApiError
          ? cause.message
          : cause instanceof Error
            ? cause.message
            : 'Falha ao associar candidato.';
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
        <h1 className="text-ui-2xl font-semibold leading-tight text-[#0f172a]">Associar Candidato</h1>
        <p className="text-ui-sm text-[#475569]">
          Associe um eleitor elegível a uma eleição programada.
        </p>
      </div>

      <CommissionSegmentTabs segment="candidatos" />

      <form onSubmit={submit} className="rounded-sm border border-[#e2e8f0] bg-white p-5 shadow-none">
        <div className="grid gap-4">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">
              Eleição
            </label>
            <UiSelect
              value={selectedElectionId}
              onChange={(value) => {
                setSelectedElectionId(value);
                setSelectedCandidateUserId('');
              }}
              placeholder="Seleccione a eleição"
              ariaLabel="Eleição"
              options={programmedElections.map((election) => ({
                value: election.id,
                label: `${election.titulo} (${election.estado})`,
              }))}
              isSearchable
            />
            {selectedElection ? (
              <p className="mt-2 text-xs text-[#64748b]">
                Candidatos e eleitores só podem ser geridos enquanto a eleição estiver programada.
              </p>
            ) : null}
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">
              Promover Candidato
            </label>
            <UiSelect
              value={selectedCandidateUserId}
              onChange={setSelectedCandidateUserId}
              placeholder="Pesquisar por nome, código ou e-mail"
              ariaLabel="Promover Candidato"
              isDisabled={!selectedElectionId}
              options={candidateUsers.map((user) => ({
                value: user.id,
                label: `${user.nome} (${user.codigo}) - ${user.faculdade?.nome ?? 'sem faculdade'}`,
                disabled: !user.activo,
              }))}
              isSearchable
              searchPlaceholder="Pesquisar eleitor..."
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
            Associar Candidato
          </button>
        </div>
      </form>
    </section>
  );
}
