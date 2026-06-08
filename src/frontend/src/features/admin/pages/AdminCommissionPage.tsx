import { useEffect, useState } from 'react';
import { Check, Plus } from 'lucide-react';

import { commissionApi } from '@/api/commission.api';
import { Chip, Spinner, UiSelect, UiTable, toast } from '@/components/ui';
import { ApiError } from '@/lib/http/api-error';
import type { TeamMemberItem } from '@/types/commission';

type TeamProfile = 'GESTOR_ELEITORAL' | 'AUDITOR';

const profileLabels: Record<TeamProfile, string> = {
  GESTOR_ELEITORAL: 'Gestor eleitoral',
  AUDITOR: 'Fiscal',
};

export function AdminCommissionPage() {
  const [members, setMembers] = useState<TeamMemberItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nome: '', email: '', perfil: 'GESTOR_ELEITORAL' as TeamProfile });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [busyMemberId, setBusyMemberId] = useState<string | null>(null);

  const load = async () => {
    const response = await commissionApi.listTeamMembers();
    setMembers(response.items);
  };

  useEffect(() => {
    let isActive = true;
    const boot = async () => {
      setIsLoading(true);
      try {
        const response = await commissionApi.listTeamMembers();
        if (!isActive) return;
        setMembers(response.items);
      } catch (cause) {
        if (!isActive) return;
        toast.danger(cause instanceof ApiError ? cause.message : 'Não foi possível carregar a equipa.');
      } finally {
        if (isActive) setIsLoading(false);
      }
    };
    void boot();
    return () => {
      isActive = false;
    };
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.nome.trim() || !form.email.trim()) {
      toast.danger('Preencha o nome e o e-mail.');
      return;
    }

    try {
      setIsSaving(true);
      await commissionApi.createTeamMember({
        nome: form.nome.trim(),
        email: form.email.trim(),
        perfil: form.perfil,
      });
      toast.success('Membro registado. O e-mail de primeiro acesso foi enviado.');
      setForm({ nome: '', email: '', perfil: 'GESTOR_ELEITORAL' });
      setShowForm(false);
      await load();
    } catch (cause) {
      toast.danger(cause instanceof ApiError ? cause.message : 'Não foi possível registar o membro.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStatus = async (member: TeamMemberItem) => {
    try {
      setBusyMemberId(member.id);
      await commissionApi.updateTeamMemberStatus(member.id, !member.activo);
      await load();
      toast.success('Estado actualizado com sucesso.');
    } catch (cause) {
      toast.danger(cause instanceof ApiError ? cause.message : 'Não foi possível actualizar o estado.');
    } finally {
      setBusyMemberId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <div className="flex items-center gap-3 text-[#334155]">
          <Spinner color="accent" />
          <span className="text-sm font-semibold">A carregar equipa...</span>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-ui-2xl font-semibold leading-tight text-[#0f172a]">Gestão da Equipa</h1>
          <p className="text-ui-sm text-[#475569]">
            Registe gestores eleitorais e fiscais. O código é gerado automaticamente e o primeiro acesso é enviado por e-mail.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((current) => !current)}
          className="inline-flex h-10 items-center justify-center rounded-md bg-[#1A56DB] px-4 text-sm font-medium text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Adicionar membro
        </button>
      </div>

      {showForm ? (
        <form onSubmit={submit} className="rounded-sm border border-[#e2e8f0] bg-white p-5 shadow-none">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">Nome</label>
              <input
                value={form.nome}
                onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))}
                className="h-11 w-full rounded-sm border border-[#d1d9e6] bg-white px-3 text-sm text-[#475569] outline-none focus:border-[#0b73c9]"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="h-11 w-full rounded-sm border border-[#d1d9e6] bg-white px-3 text-sm text-[#475569] outline-none focus:border-[#0b73c9]"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">Perfil</label>
              <UiSelect
                value={form.perfil}
                onChange={(perfil) => setForm((current) => ({ ...current, perfil: perfil as TeamProfile }))}
                ariaLabel="Perfil"
                isSearchable={false}
                options={[
                  { value: 'GESTOR_ELEITORAL', label: 'Gestor eleitoral / Comissão' },
                  { value: 'AUDITOR', label: 'Fiscal' },
                ]}
              />
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex h-10 items-center rounded-md bg-[#1A56DB] px-4 text-sm font-medium text-white disabled:opacity-60"
            >
              {isSaving ? <Spinner size="sm" className="mr-2 text-white" /> : null}
              Guardar
            </button>
          </div>
        </form>
      ) : null}

      <div className="overflow-hidden rounded-sm border border-[#e2e8f0] bg-white shadow-none">
        <UiTable
          ariaLabel="Membros da equipa"
          columns={[
            { id: 'codigo', label: 'Código', className: 'font-semibold' },
            { id: 'nome', label: 'Nome', className: 'font-semibold' },
            { id: 'email', label: 'E-mail', className: 'font-semibold' },
            { id: 'perfil', label: 'Perfil', className: 'font-semibold' },
            { id: 'estado', label: 'Estado', className: 'font-semibold' },
            { id: 'accoes', label: 'Acções', className: 'text-right font-semibold' },
          ]}
          rows={members.map((member) => ({
            id: member.id,
            cells: [
              <span key={`${member.id}:codigo`} className="font-semibold text-[#0f172a]">{member.codigo}</span>,
              <span key={`${member.id}:nome`} className="font-semibold text-[#0f172a]">{member.nome}</span>,
              <span key={`${member.id}:email`} className="text-[#334155]">{member.email}</span>,
              <span key={`${member.id}:perfil`} className="text-[#334155]">{profileLabels[member.perfil]}</span>,
              <Chip key={`${member.id}:estado`} size="sm" variant="soft" color={member.activo ? 'success' : 'danger'} className="font-semibold">
                {member.activo ? 'ACTIVO' : 'INACTIVO'}
              </Chip>,
              <div key={`${member.id}:accoes`} className="flex justify-end">
                <button
                  type="button"
                  onClick={() => void toggleStatus(member)}
                  disabled={busyMemberId === member.id}
                  className="rounded p-1 text-[#64748b] transition hover:bg-[#f1f5f9] hover:text-[#0f172a] disabled:opacity-50"
                  aria-label="Alternar estado"
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>,
            ],
          }))}
          emptyMessage="Nenhum membro registado."
        />
      </div>
    </section>
  );
}
