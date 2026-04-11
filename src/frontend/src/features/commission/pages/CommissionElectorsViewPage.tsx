import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Eye, Pencil, Search, Trash2, X } from 'lucide-react';

type Perfil = 'ADMIN' | 'GESTOR_ELEITORAL' | 'AUDITOR' | 'ELEITOR';

type ElectorRow = {
  id: string;
  codigo: string;
  nome: string;
  email: string | null;
  perfil: Perfil;
  activo: boolean;
  mustSetPassword: boolean;
  eleicaoId: string;
  jaVotou: boolean;
  importadoEm: string;
};

type ModalProps = {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
};

const INITIAL_ELECTORS: ElectorRow[] = [
  {
    id: 'user-2026001',
    codigo: '2026001',
    nome: 'Marta Chongo',
    email: 'marta.chongo@up.ac.mz',
    perfil: 'ELEITOR',
    activo: true,
    mustSetPassword: true,
    eleicaoId: 'ele-2026-aeup',
    jaVotou: false,
    importadoEm: '2026-05-10T08:00:00Z',
  },
  {
    id: 'user-2026002',
    codigo: '2026002',
    nome: 'Rui Tembe',
    email: 'rui.tembe@up.ac.mz',
    perfil: 'ELEITOR',
    activo: true,
    mustSetPassword: false,
    eleicaoId: 'ele-2026-aeup',
    jaVotou: true,
    importadoEm: '2026-05-10T08:05:00Z',
  },
  {
    id: 'user-2026003',
    codigo: '2026003',
    nome: 'Lina Mucavele',
    email: null,
    perfil: 'ELEITOR',
    activo: false,
    mustSetPassword: false,
    eleicaoId: 'ele-2026-conselho',
    jaVotou: false,
    importadoEm: '2026-05-10T08:10:00Z',
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

export function CommissionElectorsViewPage() {
  const [rows, setRows] = useState<ElectorRow[]>(INITIAL_ELECTORS);
  const [search, setSearch] = useState('');
  const [profileFilter, setProfileFilter] = useState<'todos' | Perfil>('todos');
  const [activeFilter, setActiveFilter] = useState<'todos' | 'activos' | 'inactivos'>('todos');
  const [voteFilter, setVoteFilter] = useState<'todos' | 'ja-votou' | 'nao-votou'>('todos');
  const [detailElector, setDetailElector] = useState<ElectorRow | null>(null);
  const [editingElector, setEditingElector] = useState<ElectorRow | null>(null);
  const [editError, setEditError] = useState('');

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesQuery =
        query.length === 0 ||
        [row.id, row.codigo, row.nome, row.email ?? '', row.perfil, row.eleicaoId].join(' ').toLowerCase().includes(query);
      const matchesProfile = profileFilter === 'todos' || row.perfil === profileFilter;
      const matchesActive =
        activeFilter === 'todos' ||
        (activeFilter === 'activos' ? row.activo : !row.activo);
      const matchesVote =
        voteFilter === 'todos' ||
        (voteFilter === 'ja-votou' ? row.jaVotou : !row.jaVotou);

      return matchesQuery && matchesProfile && matchesActive && matchesVote;
    });
  }, [rows, search, profileFilter, activeFilter, voteFilter]);

  const handleDelete = (id: string) => {
    setRows((current) => current.filter((row) => row.id !== id));
    if (detailElector?.id === id) {
      setDetailElector(null);
    }
    if (editingElector?.id === id) {
      setEditingElector(null);
    }
  };

  const handleSaveEdit = () => {
    if (!editingElector) return;

    if (!editingElector.codigo.trim() || !editingElector.nome.trim() || !editingElector.eleicaoId.trim()) {
      setEditError('codigo, nome e eleicaoId sao obrigatorios.');
      return;
    }

    if (editingElector.email && editingElector.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editingElector.email.trim())) {
      setEditError('Email invalido.');
      return;
    }

    setRows((current) =>
      current.map((row) =>
        row.id === editingElector.id
          ? {
              ...editingElector,
              codigo: editingElector.codigo.trim(),
              nome: editingElector.nome.trim(),
              email: editingElector.email?.trim() || null,
              eleicaoId: editingElector.eleicaoId.trim(),
            }
          : row,
      ),
    );

    setEditError('');
    setEditingElector(null);
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-slate-900">Visualizacao de Eleitores</h1>
        <p className="mt-1 text-[13px] text-slate-500">
          Campos alinhados com as tabelas <strong>utilizadores</strong> e <strong>elegiveis</strong>.
        </p>
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="relative lg:col-span-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar por id, codigo, nome, email, perfil ou eleicaoId"
              className="h-10 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 text-[14px] text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <select
            value={profileFilter}
            onChange={(event) => setProfileFilter(event.target.value as 'todos' | Perfil)}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-[14px] text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="todos">Todos os perfis</option>
            <option value="ADMIN">ADMIN</option>
            <option value="GESTOR_ELEITORAL">GESTOR_ELEITORAL</option>
            <option value="AUDITOR">AUDITOR</option>
            <option value="ELEITOR">ELEITOR</option>
          </select>

          <select
            value={activeFilter}
            onChange={(event) => setActiveFilter(event.target.value as 'todos' | 'activos' | 'inactivos')}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-[14px] text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="todos">Todos (activo)</option>
            <option value="activos">Somente activos</option>
            <option value="inactivos">Somente inactivos</option>
          </select>

          <select
            value={voteFilter}
            onChange={(event) => setVoteFilter(event.target.value as 'todos' | 'ja-votou' | 'nao-votou')}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-[14px] text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="todos">Todos (jaVotou)</option>
            <option value="ja-votou">Somente ja votou</option>
            <option value="nao-votou">Somente nao votou</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <table className="w-full text-left text-[14px]">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.12em] text-slate-500">
            <tr>
              <th className="px-4 py-3">codigo</th>
              <th className="px-4 py-3">Utilizador</th>
              <th className="px-4 py-3">perfil</th>
              <th className="px-4 py-3">activo</th>
              <th className="px-4 py-3">mustSetPassword</th>
              <th className="px-4 py-3">eleicaoId</th>
              <th className="px-4 py-3">jaVotou</th>
              <th className="px-4 py-3 text-right">Acoes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-[14px] text-slate-700">
            {filteredRows.map((row) => (
              <tr key={row.id} className="transition hover:bg-slate-50">
                <td className="px-4 py-4 font-medium text-slate-900">{row.codigo}</td>
                <td className="px-4 py-4">
                  <p className="font-semibold text-slate-900">{row.nome}</p>
                  <p className="text-[12px] text-slate-500">{renderValue(row.email)}</p>
                </td>
                <td className="px-4 py-4">{row.perfil}</td>
                <td className="px-4 py-4">
                  <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${row.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                    {row.activo ? 'TRUE' : 'FALSE'}
                  </span>
                </td>
                <td className="px-4 py-4">{row.mustSetPassword ? 'TRUE' : 'FALSE'}</td>
                <td className="px-4 py-4">{row.eleicaoId}</td>
                <td className="px-4 py-4">{row.jaVotou ? 'TRUE' : 'FALSE'}</td>
                <td className="px-4 py-4">
                  <div className="flex justify-end gap-2 text-slate-500">
                    <button
                      type="button"
                      onClick={() => setDetailElector(row)}
                      className="rounded p-1 hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Visualizar"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingElector(row)}
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
                <td colSpan={8} className="px-4 py-8 text-center text-[14px] text-slate-500">
                  Nenhum eleitor encontrado para os filtros aplicados.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <BaseModal title="Detalhes do Eleitor" isOpen={Boolean(detailElector)} onClose={() => setDetailElector(null)}>
        {detailElector ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">id</p>
              <p className="mt-1 text-[14px] text-slate-700">{detailElector.id}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">codigo</p>
              <p className="mt-1 text-[15px] font-semibold text-slate-900">{detailElector.codigo}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">nome</p>
              <p className="mt-1 text-[14px] text-slate-700">{detailElector.nome}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">email</p>
              <p className="mt-1 text-[14px] text-slate-700">{renderValue(detailElector.email)}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">perfil</p>
              <p className="mt-1 text-[14px] text-slate-700">{detailElector.perfil}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">activo</p>
              <p className="mt-1 text-[14px] text-slate-700">{detailElector.activo ? 'TRUE' : 'FALSE'}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">mustSetPassword</p>
              <p className="mt-1 text-[14px] text-slate-700">{detailElector.mustSetPassword ? 'TRUE' : 'FALSE'}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">eleicaoId</p>
              <p className="mt-1 text-[14px] text-slate-700">{detailElector.eleicaoId}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">jaVotou</p>
              <p className="mt-1 text-[14px] text-slate-700">{detailElector.jaVotou ? 'TRUE' : 'FALSE'}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">importadoEm</p>
              <p className="mt-1 text-[14px] text-slate-700">{detailElector.importadoEm}</p>
            </div>
          </div>
        ) : null}
      </BaseModal>

      <BaseModal
        title="Editar Eleitor"
        isOpen={Boolean(editingElector)}
        onClose={() => {
          setEditingElector(null);
          setEditError('');
        }}
      >
        {editingElector ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">codigo</label>
              <input
                value={editingElector.codigo}
                onChange={(event) =>
                  setEditingElector((current) =>
                    current
                      ? {
                          ...current,
                          codigo: event.target.value,
                        }
                      : current,
                  )
                }
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-[14px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">nome</label>
              <input
                value={editingElector.nome}
                onChange={(event) =>
                  setEditingElector((current) =>
                    current
                      ? {
                          ...current,
                          nome: event.target.value,
                        }
                      : current,
                  )
                }
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-[14px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">email (opcional)</label>
              <input
                value={editingElector.email ?? ''}
                onChange={(event) =>
                  setEditingElector((current) =>
                    current
                      ? {
                          ...current,
                          email: event.target.value,
                        }
                      : current,
                  )
                }
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-[14px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">perfil</label>
              <select
                value={editingElector.perfil}
                onChange={(event) =>
                  setEditingElector((current) =>
                    current
                      ? {
                          ...current,
                          perfil: event.target.value as Perfil,
                        }
                      : current,
                  )
                }
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-[14px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="ADMIN">ADMIN</option>
                <option value="GESTOR_ELEITORAL">GESTOR_ELEITORAL</option>
                <option value="AUDITOR">AUDITOR</option>
                <option value="ELEITOR">ELEITOR</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">eleicaoId</label>
              <input
                value={editingElector.eleicaoId}
                onChange={(event) =>
                  setEditingElector((current) =>
                    current
                      ? {
                          ...current,
                          eleicaoId: event.target.value,
                        }
                      : current,
                  )
                }
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-[14px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <label className="flex items-center gap-2 text-[13px] text-slate-700">
                <input
                  type="checkbox"
                  checked={editingElector.activo}
                  onChange={(event) =>
                    setEditingElector((current) =>
                      current
                        ? {
                            ...current,
                            activo: event.target.checked,
                          }
                        : current,
                    )
                  }
                />
                activo
              </label>
              <label className="flex items-center gap-2 text-[13px] text-slate-700">
                <input
                  type="checkbox"
                  checked={editingElector.mustSetPassword}
                  onChange={(event) =>
                    setEditingElector((current) =>
                      current
                        ? {
                            ...current,
                            mustSetPassword: event.target.checked,
                          }
                        : current,
                    )
                  }
                />
                mustSetPassword
              </label>
              <label className="flex items-center gap-2 text-[13px] text-slate-700">
                <input
                  type="checkbox"
                  checked={editingElector.jaVotou}
                  onChange={(event) =>
                    setEditingElector((current) =>
                      current
                        ? {
                            ...current,
                            jaVotou: event.target.checked,
                          }
                        : current,
                    )
                  }
                />
                jaVotou
              </label>
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingElector(null)}
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
