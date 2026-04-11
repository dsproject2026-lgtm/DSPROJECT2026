import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Eye, Pencil, Search, Trash2, X } from 'lucide-react';

type CandidateStatus = 'PENDENTE' | 'APROVADO' | 'REJEITADO';

type CandidateRow = {
  id: string;
  eleicaoId: string;
  utilizadorId: string;
  registadoPor: string | null;
  nome: string;
  fotoUrl: string | null;
  biografia: string | null;
  proposta: string | null;
  estado: CandidateStatus;
};

type ModalProps = {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
};

const INITIAL_CANDIDATES: CandidateRow[] = [
  {
    id: 'cand-001',
    eleicaoId: 'ele-2026-aeup',
    utilizadorId: 'user-2026001',
    registadoPor: 'com-0001',
    nome: 'Artur Mandlate',
    fotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    biografia: 'Estudante finalista com experiência em liderança estudantil.',
    proposta: 'Digitalizar processos académicos e reforçar transparência.',
    estado: 'APROVADO',
  },
  {
    id: 'cand-002',
    eleicaoId: 'ele-2026-aeup',
    utilizadorId: 'user-2026002',
    registadoPor: null,
    nome: 'Elena Sitoe',
    fotoUrl: null,
    biografia: 'Representante académica com atuação em projetos sociais.',
    proposta: 'Aumentar apoio estudantil e melhorar comunicação institucional.',
    estado: 'PENDENTE',
  },
  {
    id: 'cand-003',
    eleicaoId: 'ele-2026-conselho',
    utilizadorId: 'user-2026003',
    registadoPor: 'com-0002',
    nome: 'Jaime Cuambe',
    fotoUrl: null,
    biografia: null,
    proposta: null,
    estado: 'REJEITADO',
  },
];

function BaseModal({ title, isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-md bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="text-[18px] font-semibold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-50"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[calc(90vh-74px)] overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

function renderValue(value: string | null) {
  return value && value.trim().length > 0 ? value : '-';
}

export function CommissionCandidatesViewPage() {
  const [rows, setRows] = useState<CandidateRow[]>(INITIAL_CANDIDATES);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | CandidateStatus>('todos');
  const [detailCandidate, setDetailCandidate] = useState<CandidateRow | null>(null);
  const [editingCandidate, setEditingCandidate] = useState<CandidateRow | null>(null);
  const [editError, setEditError] = useState('');

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesQuery =
        query.length === 0 ||
        [row.id, row.nome, row.eleicaoId, row.utilizadorId, row.registadoPor ?? '']
          .join(' ')
          .toLowerCase()
          .includes(query);
      const matchesStatus = statusFilter === 'todos' || row.estado === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [rows, search, statusFilter]);

  const handleDelete = (id: string) => {
    setRows((current) => current.filter((row) => row.id !== id));
    if (detailCandidate?.id === id) {
      setDetailCandidate(null);
    }
    if (editingCandidate?.id === id) {
      setEditingCandidate(null);
    }
  };

  const handleSaveEdit = () => {
    if (!editingCandidate) return;

    if (!editingCandidate.nome.trim() || !editingCandidate.eleicaoId.trim() || !editingCandidate.utilizadorId.trim()) {
      setEditError('Nome, eleicaoId e utilizadorId sao obrigatorios.');
      return;
    }

    if (editingCandidate.fotoUrl && !/^https?:\/\//i.test(editingCandidate.fotoUrl)) {
      setEditError('fotoUrl deve ser um URL valido (http/https).');
      return;
    }

    setRows((current) =>
      current.map((row) =>
        row.id === editingCandidate.id
          ? {
              ...editingCandidate,
              nome: editingCandidate.nome.trim(),
              eleicaoId: editingCandidate.eleicaoId.trim(),
              utilizadorId: editingCandidate.utilizadorId.trim(),
              registadoPor: editingCandidate.registadoPor?.trim() || null,
              fotoUrl: editingCandidate.fotoUrl?.trim() || null,
              biografia: editingCandidate.biografia?.trim() || null,
              proposta: editingCandidate.proposta?.trim() || null,
            }
          : row,
      ),
    );

    setEditError('');
    setEditingCandidate(null);
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-slate-900">Visualizacao de Candidatos</h1>
        <p className="mt-1 text-[13px] text-slate-500">
          Campos alinhados com a tabela <strong>candidatos</strong> da base de dados.
        </p>
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar por id, nome, eleicaoId, utilizadorId ou registadoPor"
              className="h-10 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 text-[14px] text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'todos' | CandidateStatus)}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-[14px] text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="todos">Todos os estados</option>
            <option value="PENDENTE">PENDENTE</option>
            <option value="APROVADO">APROVADO</option>
            <option value="REJEITADO">REJEITADO</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <table className="w-full text-left text-[14px]">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.12em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">eleicaoId</th>
              <th className="px-4 py-3">utilizadorId</th>
              <th className="px-4 py-3">registadoPor</th>
              <th className="px-4 py-3">estado</th>
              <th className="px-4 py-3 text-right">Acoes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-[14px] text-slate-700">
            {filteredRows.map((row) => (
              <tr key={row.id} className="transition hover:bg-slate-50">
                <td className="px-4 py-4">
                  <p className="font-semibold text-slate-900">{row.nome}</p>
                  <p className="text-[12px] text-slate-500">id: {row.id}</p>
                </td>
                <td className="px-4 py-4">{row.eleicaoId}</td>
                <td className="px-4 py-4">{row.utilizadorId}</td>
                <td className="px-4 py-4">{renderValue(row.registadoPor)}</td>
                <td className="px-4 py-4">
                  <span className="rounded bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">{row.estado}</span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex justify-end gap-2 text-slate-500">
                    <button
                      type="button"
                      onClick={() => setDetailCandidate(row)}
                      className="rounded p-1 hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Visualizar"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCandidate(row)}
                      className="rounded p-1 hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(row.id)}
                      className="rounded p-1 hover:bg-red-50 hover:text-red-600"
                      aria-label="Deletar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[14px] text-slate-500">
                  Nenhum candidato encontrado para os filtros aplicados.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <BaseModal title="Detalhes do Candidato" isOpen={Boolean(detailCandidate)} onClose={() => setDetailCandidate(null)}>
        {detailCandidate ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">id</p>
              <p className="mt-1 text-[14px] text-slate-700">{detailCandidate.id}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">nome</p>
              <p className="mt-1 text-[15px] font-semibold text-slate-900">{detailCandidate.nome}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">eleicaoId</p>
              <p className="mt-1 text-[14px] text-slate-700">{detailCandidate.eleicaoId}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">utilizadorId</p>
              <p className="mt-1 text-[14px] text-slate-700">{detailCandidate.utilizadorId}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">registadoPor</p>
              <p className="mt-1 text-[14px] text-slate-700">{renderValue(detailCandidate.registadoPor)}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">estado</p>
              <p className="mt-1 text-[14px] text-slate-700">{detailCandidate.estado}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">fotoUrl</p>
              <p className="mt-1 break-all text-[14px] text-slate-700">{renderValue(detailCandidate.fotoUrl)}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">biografia</p>
              <p className="mt-1 text-[14px] text-slate-700">{renderValue(detailCandidate.biografia)}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">proposta</p>
              <p className="mt-1 text-[14px] text-slate-700">{renderValue(detailCandidate.proposta)}</p>
            </div>
          </div>
        ) : null}
      </BaseModal>

      <BaseModal
        title="Editar Candidato"
        isOpen={Boolean(editingCandidate)}
        onClose={() => {
          setEditingCandidate(null);
          setEditError('');
        }}
      >
        {editingCandidate ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Nome</label>
              <input
                value={editingCandidate.nome}
                onChange={(event) =>
                  setEditingCandidate((current) =>
                    current
                      ? {
                          ...current,
                          nome: event.target.value,
                        }
                      : current,
                  )
                }
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-[14px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">eleicaoId</label>
              <input
                value={editingCandidate.eleicaoId}
                onChange={(event) =>
                  setEditingCandidate((current) =>
                    current
                      ? {
                          ...current,
                          eleicaoId: event.target.value,
                        }
                      : current,
                  )
                }
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-[14px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">utilizadorId</label>
              <input
                value={editingCandidate.utilizadorId}
                onChange={(event) =>
                  setEditingCandidate((current) =>
                    current
                      ? {
                          ...current,
                          utilizadorId: event.target.value,
                        }
                      : current,
                  )
                }
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-[14px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">registadoPor</label>
              <input
                value={editingCandidate.registadoPor ?? ''}
                onChange={(event) =>
                  setEditingCandidate((current) =>
                    current
                      ? {
                          ...current,
                          registadoPor: event.target.value,
                        }
                      : current,
                  )
                }
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-[14px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Opcional"
              />
            </div>
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">estado</label>
              <select
                value={editingCandidate.estado}
                onChange={(event) =>
                  setEditingCandidate((current) =>
                    current
                      ? {
                          ...current,
                          estado: event.target.value as CandidateStatus,
                        }
                      : current,
                  )
                }
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-[14px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="PENDENTE">PENDENTE</option>
                <option value="APROVADO">APROVADO</option>
                <option value="REJEITADO">REJEITADO</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">fotoUrl</label>
              <input
                value={editingCandidate.fotoUrl ?? ''}
                onChange={(event) =>
                  setEditingCandidate((current) =>
                    current
                      ? {
                          ...current,
                          fotoUrl: event.target.value,
                        }
                      : current,
                  )
                }
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-[14px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="https://..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">biografia</label>
              <textarea
                value={editingCandidate.biografia ?? ''}
                onChange={(event) =>
                  setEditingCandidate((current) =>
                    current
                      ? {
                          ...current,
                          biografia: event.target.value,
                        }
                      : current,
                  )
                }
                className="min-h-[96px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-[14px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">proposta</label>
              <textarea
                value={editingCandidate.proposta ?? ''}
                onChange={(event) =>
                  setEditingCandidate((current) =>
                    current
                      ? {
                          ...current,
                          proposta: event.target.value,
                        }
                      : current,
                  )
                }
                className="min-h-[96px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-[14px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingCandidate(null)}
                className="h-10 rounded-md border border-slate-300 bg-white px-4 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="h-10 rounded-md bg-blue-600 px-4 text-[13px] font-semibold text-white hover:bg-blue-700"
              >
                Guardar Alteracoes
              </button>
            </div>
            {editError ? <p className="md:col-span-2 text-[12px] text-red-600">{editError}</p> : null}
          </div>
        ) : null}
      </BaseModal>
    </section>
  );
}
