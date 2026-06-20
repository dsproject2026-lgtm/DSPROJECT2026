import { useEffect, useState, type FormEvent } from 'react';
import { Building2, Eye, Pencil, Plus, Trash2, X } from 'lucide-react';

import { commissionApi } from '@/api/commission.api';
import { ConfirmDialog, Spinner, UiPageSkeleton, UiTable, toast } from '@/components/ui';
import { ApiError } from '@/lib/http/api-error';
import type { FacultyItem } from '@/types/commission';

export function CommissionFacultiesPage() {
  const [faculties, setFaculties] = useState<FacultyItem[]>([]);
  const [facultyName, setFacultyName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [facultyToView, setFacultyToView] = useState<FacultyItem | null>(null);
  const [facultyToEdit, setFacultyToEdit] = useState<FacultyItem | null>(null);
  const [facultyToDelete, setFacultyToDelete] = useState<FacultyItem | null>(null);
  const [editName, setEditName] = useState('');

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

  const openEdit = (faculty: FacultyItem) => {
    setFacultyToEdit(faculty);
    setEditName(faculty.nome);
  };

  const saveFaculty = async () => {
    if (!facultyToEdit) return;
    if (!editName.trim()) {
      toast.danger('Informe o nome da faculdade.');
      return;
    }

    try {
      setBusyId(facultyToEdit.id);
      await commissionApi.updateFaculty(facultyToEdit.id, { nome: editName.trim() });
      await load();
      setFacultyToEdit(null);
      toast.success('Faculdade actualizada com sucesso.');
    } catch (cause) {
      toast.danger(cause instanceof ApiError ? cause.message : 'Falha ao actualizar faculdade.');
    } finally {
      setBusyId(null);
    }
  };

  const removeFaculty = async () => {
    if (!facultyToDelete) return;

    try {
      setBusyId(facultyToDelete.id);
      await commissionApi.deleteFaculty(facultyToDelete.id);
      await load();
      setFacultyToDelete(null);
      toast.success('Faculdade eliminada com sucesso.');
    } catch (cause) {
      toast.danger(cause instanceof ApiError ? cause.message : 'Falha ao eliminar faculdade.');
    } finally {
      setBusyId(null);
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
            { id: 'cursos', label: 'Cursos', className: 'font-semibold' },
            { id: 'accoes', label: 'Acções', className: 'font-semibold text-right' },
          ]}
          rows={faculties.map((faculty) => ({
            id: faculty.id,
            cells: [
              <div key={`${faculty.id}:name`} className="flex items-center gap-2 text-base font-semibold text-[#0f172a]">
                <Building2 className="h-4 w-4 text-[#1A56DB]" />
                {faculty.nome}
              </div>,
              <span key={`${faculty.id}:courses`} className="text-sm text-[#475569]">
                {faculty.cursos.length}
              </span>,
              <div key={`${faculty.id}:actions`} className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFacultyToView(faculty)}
                  className="inline-flex rounded p-1 text-[#475569] transition hover:bg-[#f1f5f9]"
                  aria-label={`Visualizar faculdade ${faculty.nome}`}
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(faculty)}
                  disabled={busyId === faculty.id}
                  className="inline-flex rounded p-1 text-[#0b73c9] transition hover:bg-[#eff6ff] disabled:opacity-60"
                  aria-label={`Editar faculdade ${faculty.nome}`}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setFacultyToDelete(faculty)}
                  disabled={busyId === faculty.id}
                  className="inline-flex rounded p-1 text-[#b91c1c] transition hover:bg-[#fef2f2] disabled:opacity-60"
                  aria-label={`Eliminar faculdade ${faculty.nome}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>,
            ],
          }))}
          emptyMessage="Nenhuma faculdade registada."
        />
      </div>

      <ConfirmDialog
        open={Boolean(facultyToDelete)}
        title="Eliminar faculdade"
        description={`Pretende eliminar a faculdade "${facultyToDelete?.nome ?? ''}"?`}
        confirmLabel="Eliminar"
        tone="danger"
        isLoading={facultyToDelete ? busyId === facultyToDelete.id : false}
        onCancel={() => setFacultyToDelete(null)}
        onConfirm={() => void removeFaculty()}
      />

      {facultyToView ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 px-4">
          <div className="w-full max-w-lg rounded-sm bg-white p-5 shadow-lg">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[#0f172a]">{facultyToView.nome}</h2>
                <p className="text-sm text-[#64748b]">Detalhes da faculdade</p>
              </div>
              <button type="button" onClick={() => setFacultyToView(null)} className="rounded p-1 hover:bg-[#f1f5f9]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">Cursos</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {facultyToView.cursos.length ? (
                  facultyToView.cursos.map((course) => (
                    <span key={course.id} className="rounded-sm bg-[#f1f5f9] px-2 py-1 text-sm text-[#334155]">
                      {course.nome}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-[#64748b]">Nenhum curso registado.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {facultyToEdit ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 px-4">
          <div className="w-full max-w-lg rounded-sm bg-white p-5 shadow-lg">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[#0f172a]">Editar faculdade</h2>
                <p className="text-sm text-[#64748b]">{facultyToEdit.nome}</p>
              </div>
              <button type="button" onClick={() => setFacultyToEdit(null)} className="rounded p-1 hover:bg-[#f1f5f9]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">
                Nome
              </span>
              <input
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                className="h-11 w-full rounded-sm border border-[#d1d9e6] bg-white px-3 text-sm text-[#475569] outline-none focus:border-[#0b73c9]"
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setFacultyToEdit(null)} className="h-10 rounded-md border border-[#d1d9e6] px-4 text-sm font-medium">
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void saveFaculty()}
                disabled={busyId === facultyToEdit.id}
                className="inline-flex h-10 items-center rounded-md bg-[#1A56DB] px-4 text-sm font-medium text-white disabled:opacity-60"
              >
                {busyId === facultyToEdit.id ? <Spinner size="sm" className="mr-2 text-white" /> : null}
                Guardar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
