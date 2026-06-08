import { useEffect, useState } from 'react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { commissionApi } from '@/api/commission.api';
import { Chip, ConfirmDialog, UiPageSkeleton, UiTable, toast } from '@/components/ui';
import { CommissionSegmentTabs } from '@/features/commission/components/CommissionSegmentTabs';
import { ApiError } from '@/lib/http/api-error';
import { formatStateLabel, getStateChipColor } from '@/lib/ui/state-chip';
import type { CommissionElectionItem } from '@/types/commission';

export function CommissionElectionsListPage() {
  const navigate = useNavigate();
  const [elections, setElections] = useState<CommissionElectionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyElectionId, setBusyElectionId] = useState<string | null>(null);
  const [electionToDelete, setElectionToDelete] = useState<CommissionElectionItem | null>(null);

  const load = async () => {
    const response = await commissionApi.listElections();
    setElections(response.items);
  };

  useEffect(() => {
    let isActive = true;
    const boot = async () => {
      setIsLoading(true);
      try {
        const response = await commissionApi.listElections();
        if (!isActive) return;
        setElections(response.items);
      } catch (cause) {
        if (!isActive) return;
        toast.danger(cause instanceof ApiError ? cause.message : 'Não foi possível carregar as eleições.');
      } finally {
        if (isActive) setIsLoading(false);
      }
    };
    void boot();
    return () => {
      isActive = false;
    };
  }, []);

  const deleteElection = async () => {
    if (!electionToDelete) return;
    if (electionToDelete.estado === 'ABERTA') {
      toast.warning('Eleições abertas não podem ser eliminadas.');
      return;
    }

    try {
      setBusyElectionId(electionToDelete.id);
      await commissionApi.deleteElection(electionToDelete.id);
      await load();
      setElectionToDelete(null);
      toast.success('Eleição eliminada com sucesso.');
    } catch (cause) {
      toast.danger(cause instanceof ApiError ? cause.message : 'Não foi possível eliminar a eleição.');
    } finally {
      setBusyElectionId(null);
    }
  };

  if (isLoading) return <UiPageSkeleton />;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-ui-2xl font-semibold leading-tight text-[#0f172a]">Eleições</h1>
        <p className="text-ui-sm text-[#475569]">Consulte, edite ou elimine eleições quando as regras permitirem.</p>
      </div>

      <CommissionSegmentTabs segment="eleicoes" />

      <div className="overflow-hidden rounded-sm border border-[#e2e8f0] bg-white shadow-none">
        <UiTable
          ariaLabel="Eleições"
          columns={[
            { id: 'titulo', label: 'Título', className: 'font-semibold' },
            { id: 'cargo', label: 'Cargo', className: 'font-semibold' },
            { id: 'estado', label: 'Estado', className: 'font-semibold' },
            { id: 'acoes', label: 'Ações', className: 'font-semibold text-right' },
          ]}
          rows={elections.map((item) => ({
            id: item.id,
            cells: [
              <div key={`${item.id}:titulo`}>
                <p className="text-base font-semibold text-[#0f172a]">{item.titulo}</p>
                <p className="text-sm text-[#64748b]">{item.descricao ?? '-'}</p>
              </div>,
              <span key={`${item.id}:cargo`} className="text-base">{item.cargo.nome}</span>,
              <Chip key={`${item.id}:estado`} size="sm" variant="soft" color={getStateChipColor(item.estado)} className="font-semibold">
                {formatStateLabel(item.estado)}
              </Chip>,
              <div key={`${item.id}:acoes`} className="flex justify-end gap-1">
                <button type="button" onClick={() => navigate(`/comissao/eleicoes/detalhes/${item.id}`)} className="rounded-[8px] p-1.5 text-[#64748b] transition hover:bg-[#f1f5f9] hover:text-[#0f172a]" aria-label="Visualizar">
                  <Eye className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => navigate(`/comissao/eleicoes/registrar?edit=${encodeURIComponent(item.id)}`)} disabled={item.estado === 'ABERTA'} className="rounded-[8px] p-1.5 text-[#64748b] transition hover:bg-[#f1f5f9] hover:text-[#0f172a] disabled:cursor-not-allowed disabled:opacity-40" aria-label="Editar">
                  <Pencil className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => setElectionToDelete(item)} disabled={item.estado === 'ABERTA' || busyElectionId === item.id} className="rounded-[8px] p-1.5 text-[#b91c1c] transition hover:bg-[#fef2f2] disabled:cursor-not-allowed disabled:opacity-40" aria-label="Eliminar">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>,
            ],
          }))}
          emptyMessage="Nenhuma eleição disponível."
        />
      </div>

      <ConfirmDialog
        open={Boolean(electionToDelete)}
        title="Eliminar eleição"
        description={`Pretende eliminar a eleição "${electionToDelete?.titulo ?? ''}"?`}
        confirmLabel="Eliminar"
        tone="danger"
        isLoading={electionToDelete ? busyElectionId === electionToDelete.id : false}
        onCancel={() => setElectionToDelete(null)}
        onConfirm={() => void deleteElection()}
      />
    </section>
  );
}
