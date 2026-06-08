import { useEffect, useState, type FormEvent } from 'react';
import { Building2, Plus } from 'lucide-react';

import { commissionApi } from '@/api/commission.api';
import { Spinner, UiPageSkeleton, UiTable, toast } from '@/components/ui';
import { ApiError } from '@/lib/http/api-error';
import type { FacultyItem } from '@/types/commission';

export function CommissionFacultiesPage() {
  const [faculties, setFaculties] = useState<FacultyItem[]>([]);
  const [facultyName, setFacultyName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const load = async () => {
    const response = await commissionApi.listFaculties();
    setFaculties(response.items);
  };

  useEffect(() => {
    let isActive = true;
    const boot = async () => {
      setIsLoading(true);
      try {
        await load();
      } catch (cause) {
        if (!isActive) return;
        toast.danger(cause instanceof ApiError ? cause.message : 'Falha ao carregar faculdades.');
      } finally {
        if (isActive) setIsLoading(false);
      }
    };
    void boot();
    return () => {
      isActive = false;
    };
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!facultyName.trim()) {
      toast.danger('Informe o nome da faculdade.');
      return;
    }

    try {
      setIsSaving(true);
      await commissionApi.createFaculty({ nome: facultyName.trim(), cursos: [] });
      toast.success('Faculdade registada com sucesso.');
      setFacultyName('');
      await load();
    } catch (cause) {
      const message =
        cause instanceof ApiError
          ? cause.message
          : cause instanceof Error
            ? cause.message
            : 'Falha ao registar faculdade.';
      toast.danger(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <UiPageSkeleton />;
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-ui-2xl font-semibold leading-tight text-[#0f172a]">Faculdades</h1>
        <p className="text-ui-sm text-[#475569]">
          Registe as faculdades que serão associadas aos estudantes e às eleições.
        </p>
      </div>

      <form onSubmit={submit} className="rounded-sm border border-[#e2e8f0] bg-white p-5 shadow-none">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">
              Faculdade
            </label>
            <input
              value={facultyName}
              onChange={(event) => setFacultyName(event.target.value)}
              className="h-11 w-full rounded-sm border border-[#d1d9e6] bg-white px-3 text-sm text-[#475569] outline-none focus:border-[#0b73c9]"
              placeholder="Ex.: Engenharia e Tecnologia"
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
            Guardar
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-sm border border-[#e2e8f0] bg-white shadow-none">
        <UiTable
          ariaLabel="Faculdades"
          columns={[
            { id: 'faculdade', label: 'Faculdade', className: 'font-semibold' },
          ]}
          rows={faculties.map((faculty) => ({
            id: faculty.id,
            cells: [
              <div key={`${faculty.id}:name`} className="flex items-center gap-2 text-base font-semibold text-[#0f172a]">
                <Building2 className="h-4 w-4 text-[#1A56DB]" />
                {faculty.nome}
              </div>,
            ],
          }))}
          emptyMessage="Nenhuma faculdade registada."
        />
      </div>
    </section>
  );
}
