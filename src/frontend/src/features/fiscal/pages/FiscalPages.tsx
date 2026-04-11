import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Filter,
  Image as ImageIcon,
  Lock,
  Save,
  Search,
  ShieldAlert,
  ShieldCheck,
  Upload,
  User,
  Vote,
  XCircle,
} from 'lucide-react';

type AuditSeverity = 'success' | 'info' | 'warning' | 'danger';

type AuditLog = {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  election: string;
  ip: string;
  details: string;
  severity: AuditSeverity;
};

type ElectionResult = {
  id: string;
  election: string;
  status: 'ACTIVA' | 'ENCERRADA';
  totalVotes: number;
  eligibleStudents: number;
  candidates: Array<{
    id: string;
    name: string;
    list: string;
    votes: number;
  }>;
};

type ReportItem = {
  id: string;
  name: string;
  type: string;
  election: string;
  generatedAt: string;
  status: 'Gerado' | 'Pendente';
};

type UserProfile = {
  name: string;
  email: string;
  photo: string;
  theme: 'Claro' | 'Escuro' | 'Sistema';
};

const STORAGE_KEYS = {
  profile: 'fiscal:profile',
};

const DEFAULT_PROFILE: UserProfile = {
  name: 'João Machava',
  email: 'joao.machava@up.ac.mz',
  photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  theme: 'Claro',
};

const INITIAL_LOGS: AuditLog[] = [
  {
    id: '1',
    timestamp: '2024-05-24 16:45:12.441',
    user: 'Admin_Geral',
    action: 'CANDIDATURA APROVADA',
    election: 'Reitoria 2024',
    ip: '192.168.10.45',
    details: 'A candidatura da Lista A foi aprovada pelo administrador.',
    severity: 'info',
  },
  {
    id: '2',
    timestamp: '2024-05-24 16:42:08.109',
    user: 'U_20239912',
    action: 'VOTO REGISTADO',
    election: 'Reitoria 2024',
    ip: '41.220.32.11',
    details: 'Voto submetido com sucesso e registado de forma imutável.',
    severity: 'success',
  },
  {
    id: '3',
    timestamp: '2024-05-24 16:38:44.002',
    user: 'Sys_Monitor',
    action: 'FALHA DE INTEGRIDADE',
    election: '-',
    ip: '10.0.0.12',
    details: 'Foi detectada inconsistência numa verificação automática de integridade.',
    severity: 'danger',
  },
  {
    id: '4',
    timestamp: '2024-05-24 16:35:59.882',
    user: 'Fiscal_01',
    action: 'LOGIN',
    election: '-',
    ip: '192.168.1.102',
    details: 'Autenticação do fiscal concluída com sucesso.',
    severity: 'info',
  },
  {
    id: '5',
    timestamp: '2024-05-24 16:30:12.115',
    user: 'Admin_Geral',
    action: 'ALTERAÇÃO DE CONFIG',
    election: 'Reitoria 2024',
    ip: '192.168.10.45',
    details: 'Actualização dos parâmetros do processo eleitoral.',
    severity: 'warning',
  },
  {
    id: '6',
    timestamp: '2024-05-24 16:28:00.311',
    user: 'Fiscal_02',
    action: 'VERIFICAÇÃO MANUAL',
    election: 'Reitoria 2024',
    ip: '192.168.10.58',
    details: 'Foi realizada conferência manual da apuração parcial.',
    severity: 'info',
  },
  {
    id: '7',
    timestamp: '2024-05-24 16:22:44.210',
    user: 'Sys_Monitor',
    action: 'SINCRONIZAÇÃO',
    election: '-',
    ip: '10.0.0.10',
    details: 'Sincronização entre serviços concluída sem divergências.',
    severity: 'success',
  },
  {
    id: '8',
    timestamp: '2024-05-24 16:18:20.501',
    user: 'Fiscal_03',
    action: 'LOGIN',
    election: '-',
    ip: '192.168.10.77',
    details: 'Sessão de fiscalização iniciada.',
    severity: 'info',
  },
  {
    id: '9',
    timestamp: '2024-05-24 16:12:02.901',
    user: 'Admin_Geral',
    action: 'EXPORTAÇÃO DE RELATÓRIO',
    election: 'Conselho 2024',
    ip: '192.168.10.45',
    details: 'Exportação do relatório de conformidade em CSV.',
    severity: 'info',
  },
  {
    id: '10',
    timestamp: '2024-05-24 16:05:11.128',
    user: 'Sys_Monitor',
    action: 'ALERTA DE LATÊNCIA',
    election: '-',
    ip: '10.0.0.19',
    details: 'Foi detectado atraso acima do esperado na replicação.',
    severity: 'warning',
  },
  {
    id: '11',
    timestamp: '2024-05-24 15:58:08.873',
    user: 'Fiscal_01',
    action: 'VERIFICAÇÃO MANUAL',
    election: 'Conselho 2024',
    ip: '192.168.1.102',
    details: 'Verificação de consistência do total de eleitores elegíveis.',
    severity: 'success',
  },
  {
    id: '12',
    timestamp: '2024-05-24 15:51:49.092',
    user: 'Sys_Monitor',
    action: 'FALHA DE INTEGRIDADE',
    election: 'Reitoria 2024',
    ip: '10.0.0.12',
    details: 'Checksum divergente num snapshot temporário da base de dados.',
    severity: 'danger',
  },
];

const INITIAL_RESULTS: ElectionResult[] = [
  {
    id: 'r1',
    election: 'Reitoria 2024',
    status: 'ACTIVA',
    totalVotes: 11240,
    eligibleStudents: 18400,
    candidates: [
      { id: '1', name: 'Lista A', list: 'Renovação Académica', votes: 5240 },
      { id: '2', name: 'Lista B', list: 'União Estudantil', votes: 4100 },
      { id: '3', name: 'Lista C', list: 'Voz Universitária', votes: 1900 },
    ],
  },
  {
    id: 'r2',
    election: 'Conselho 2024',
    status: 'ENCERRADA',
    totalVotes: 9280,
    eligibleStudents: 13200,
    candidates: [
      { id: '4', name: 'Lista A', list: 'Representação Forte', votes: 4200 },
      { id: '5', name: 'Lista B', list: 'Nova Geração', votes: 3080 },
      { id: '6', name: 'Lista C', list: 'Acção Académica', votes: 2000 },
    ],
  },
];

const INITIAL_REPORTS: ReportItem[] = [
  {
    id: 'rep1',
    name: 'Relatório Geral de Auditoria',
    type: 'Auditoria',
    election: 'Reitoria 2024',
    generatedAt: '24/05/2024 14:45',
    status: 'Gerado',
  },
  {
    id: 'rep2',
    name: 'Relatório de Integridade',
    type: 'Segurança',
    election: 'Conselho 2024',
    generatedAt: '24/05/2024 13:20',
    status: 'Gerado',
  },
  {
    id: 'rep3',
    name: 'Conferência de Resultados',
    type: 'Resultados',
    election: 'Reitoria 2024',
    generatedAt: '24/05/2024 12:15',
    status: 'Pendente',
  },
];

function useStoredState<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    const stored = window.localStorage.getItem(key);
    if (!stored) return initialValue;
    try {
      return JSON.parse(stored) as T;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, JSON.stringify(state));
    }
  }, [key, state]);

  return [state, setState] as const;
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat('pt-PT', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-PT').format(value);
}

function severityBadgeClass(severity: AuditSeverity) {
  if (severity === 'success') return 'bg-emerald-100 text-emerald-700';
  if (severity === 'warning') return 'bg-amber-100 text-amber-700';
  if (severity === 'danger') return 'bg-red-100 text-red-600';
  return 'bg-blue-100 text-blue-700';
}

function resultStatusClass(status: ElectionResult['status']) {
  return status === 'ACTIVA' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700';
}

function PrimaryButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 text-[12px] font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 ${props.className ?? ''}`}>{children}</button>;
}

function SecondaryButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 ${props.className ?? ''}`}>{children}</button>;
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-[13px] outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${props.className ?? ''}`} />;
}

function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-[13px] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${props.className ?? ''}`} />;
}

function PageSection({ title, description, children, right }: { title: string; description?: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="rounded-sm bg-white p-4 shadow-[0_0_0_1px_rgba(15,23,42,0.04)]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[14px] font-semibold text-slate-900">{title}</h2>
          {description ? <p className="mt-1 text-[12px] text-slate-500">{description}</p> : null}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function SummaryCard({ title, value, icon, tone = 'neutral', subtitle }: { title: string; value: string; icon: React.ReactNode; tone?: 'neutral' | 'danger' | 'success'; subtitle?: string }) {
  const toneClass = tone === 'danger' ? 'text-red-600 bg-red-50 border-red-100' : tone === 'success' ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-slate-800 bg-white border-slate-200';
  return (
    <div className={`rounded-sm border px-5 py-4 ${toneClass}`}>
      <div className="mb-3 flex items-center gap-3">
        <div className="rounded-md bg-white/80 p-2 shadow-sm">{icon}</div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{title}</p>
      </div>
      <div className="text-[28px] font-semibold leading-none">{value}</div>
      {subtitle ? <p className="mt-2 text-[11px] text-slate-500">{subtitle}</p> : null}
    </div>
  );
}

function AppShell({ title, children, actions }: { title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  const [profile, setProfile] = useStoredState<UserProfile>(STORAGE_KEYS.profile, DEFAULT_PROFILE);
  const [profileOpen, setProfileOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [draftProfile, setDraftProfile] = useState<UserProfile>(profile);

  useEffect(() => {
    setDraftProfile(profile);
  }, [profile]);

  function saveProfile() {
    setProfile(draftProfile);
    setEditMode(false);
  }

  function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : draftProfile.photo;
      setDraftProfile((prev) => ({ ...prev, photo: result }));
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] px-6 py-5 text-slate-900">
      <main>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-semibold tracking-[-0.02em] text-slate-900">{title}</h1>
            <p className="mt-1 text-[11px] capitalize text-slate-500">{formatDateTime(new Date())}</p>
          </div>
          <div className="flex items-center gap-3">
            {actions}
            <button type="button" onClick={() => setProfileOpen((prev) => !prev)} className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm" aria-label="Abrir perfil">
              {profile.photo ? <img src={profile.photo} alt={profile.name} className="h-full w-full object-cover" /> : <User className="h-5 w-5 text-slate-500" />}
            </button>
          </div>
        </div>

        {profileOpen && (
          <div className="mb-6 rounded-sm bg-white p-5 shadow-[0_0_0_1px_rgba(15,23,42,0.04)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 overflow-hidden rounded-full bg-slate-100">
                  <img src={editMode ? draftProfile.photo : profile.photo} alt={profile.name} className="h-full w-full object-cover" />
                </div>
                <div>
                  <p className="text-[16px] font-semibold text-slate-900">{editMode ? draftProfile.name : profile.name}</p>
                  <p className="text-[13px] text-slate-500">{editMode ? draftProfile.email : profile.email}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-slate-400">Fiscal AEUP</p>
                </div>
              </div>

              <div className="flex gap-2">
                {editMode ? (
                  <>
                    <SecondaryButton type="button" onClick={() => setEditMode(false)} className="h-9">Cancelar</SecondaryButton>
                    <PrimaryButton type="button" onClick={saveProfile} className="h-9"><Save className="mr-2 h-4 w-4" />Guardar</PrimaryButton>
                  </>
                ) : (
                  <>
                    <SecondaryButton type="button" onClick={() => setProfileOpen(false)} className="h-9">Fechar</SecondaryButton>
                    <PrimaryButton type="button" onClick={() => setEditMode(true)} className="h-9">Editar Perfil</PrimaryButton>
                  </>
                )}
              </div>
            </div>

            {editMode && (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Nome</label>
                  <TextInput value={draftProfile.name} onChange={(e) => setDraftProfile((prev) => ({ ...prev, name: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Email</label>
                  <TextInput value={draftProfile.email} onChange={(e) => setDraftProfile((prev) => ({ ...prev, email: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Foto</label>
                  <div className="flex flex-wrap gap-3">
                    <TextInput value={draftProfile.photo} onChange={(e) => setDraftProfile((prev) => ({ ...prev, photo: e.target.value }))} placeholder="URL da imagem" />
                    <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-[12px] font-semibold text-slate-700 hover:bg-slate-50">
                      <Upload className="mr-2 h-4 w-4" />Carregar Foto
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {children}
      </main>
    </div>
  );
}

function downloadCsv(filename: string, rows: Record<string, string>[]) {
  const headers = Object.keys(rows[0] ?? {});
  const csv = [headers.join(','), ...rows.map((row) => headers.map((header) => JSON.stringify(row[header] ?? '')).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function AuditCenter({ title }: { title: string }) {
  const [logs] = useState<AuditLog[]>(INITIAL_LOGS);
  const [detailLog, setDetailLog] = useState<AuditLog | null>(null);
  const [message, setMessage] = useState('');
  const [draftDate, setDraftDate] = useState('');
  const [draftUser, setDraftUser] = useState('Todos os utilizadores');
  const [draftAction, setDraftAction] = useState('Todas as ações');
  const [draftElection, setDraftElection] = useState('Todas as eleições');
  const [filters, setFilters] = useState({ date: '', user: 'Todos os utilizadores', action: 'Todas as ações', election: 'Todas as eleições' });
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);

  const users = ['Todos os utilizadores', ...Array.from(new Set(logs.map((log) => log.user)))];
  const actions = ['Todas as ações', ...Array.from(new Set(logs.map((log) => log.action)))];
  const elections = ['Todas as eleições', ...Array.from(new Set(logs.map((log) => log.election)))];

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesDate = !filters.date || log.timestamp.includes(filters.date);
      const matchesUser = filters.user === 'Todos os utilizadores' || log.user === filters.user;
      const matchesAction = filters.action === 'Todas as ações' || log.action === filters.action;
      const matchesElection = filters.election === 'Todas as eleições' || log.election === filters.election;
      return matchesDate && matchesUser && matchesAction && matchesElection;
    });
  }, [logs, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const pagedLogs = filteredLogs.slice((page - 1) * pageSize, page * pageSize);
  const criticalCount = logs.filter((log) => log.severity === 'danger').length;
  const startIndex = filteredLogs.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, filteredLogs.length);

  function applyFilters() {
    setFilters({ date: draftDate, user: draftUser, action: draftAction, election: draftElection });
    setPage(1);
    setMessage('Filtros aplicados com sucesso.');
  }

  function exportLogs() {
    downloadCsv(
      'logs-auditoria.csv',
      filteredLogs.map((log) => ({
        timestamp: log.timestamp,
        utilizador: log.user,
        acao: log.action,
        eleicao: log.election,
        endereco_ip: log.ip,
        detalhes: log.details,
      })),
    );
    setMessage('Logs exportados em CSV.');
  }

  return (
    <AppShell title={title} actions={<PrimaryButton type="button" onClick={exportLogs}><Download className="mr-2 h-4 w-4" />Exportar Logs (CSV)</PrimaryButton>}>
      {message ? <div className="mb-4 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-[12px] text-blue-700">{message}</div> : null}

      <PageSection
        title="Logs de Auditoria"
        description="Interface de monitorização centralizada para transparência do sistema e integridade de dados. Todos os registos são imutáveis para fins de auditoria académica."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard title="Total de Registos" value={formatNumber(1284092)} icon={<ShieldCheck className="h-4 w-4 text-slate-700" />} />
          <SummaryCard title="Alertas Críticos" value={String(criticalCount).padStart(2, '0')} tone="danger" icon={<AlertTriangle className="h-4 w-4 text-red-600" />} />
          <SummaryCard title="Última Sincronização" value="24/05/2024 14:32:01" icon={<CheckCircle2 className="h-4 w-4 text-slate-700" />} subtitle="Sincronização do sistema" />
        </div>

        <div className="mt-5 rounded-sm border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-3 lg:grid-cols-[1.25fr_1fr_1fr_1fr_auto]">
            <TextInput value={draftDate} onChange={(e) => setDraftDate(e.target.value)} placeholder="mm/dd/yyyy" />
            <SelectInput value={draftUser} onChange={(e) => setDraftUser(e.target.value)}>
              {users.map((user) => <option key={user} value={user}>{user}</option>)}
            </SelectInput>
            <SelectInput value={draftAction} onChange={(e) => setDraftAction(e.target.value)}>
              {actions.map((action) => <option key={action} value={action}>{action}</option>)}
            </SelectInput>
            <SelectInput value={draftElection} onChange={(e) => setDraftElection(e.target.value)}>
              {elections.map((election) => <option key={election} value={election}>{election}</option>)}
            </SelectInput>
            <SecondaryButton type="button" onClick={applyFilters} className="h-10"><Filter className="mr-2 h-4 w-4" />Filtrar</SecondaryButton>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-sm border border-slate-200">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-[0.16em] text-slate-400">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Utilizador</th>
                <th className="px-4 py-3">Acção</th>
                <th className="px-4 py-3">Eleição</th>
                <th className="px-4 py-3">Endereço IP</th>
                <th className="px-4 py-3 text-center">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-[12px] text-slate-700">
              {pagedLogs.map((log) => (
                <tr key={log.id}>
                  <td className={`px-4 py-4 ${log.severity === 'danger' ? 'font-semibold text-red-600' : ''}`}>{log.timestamp}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">
                        {log.user.slice(0, 2).toUpperCase()}
                      </div>
                      <span>{log.user}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`rounded px-2 py-1 text-[10px] font-semibold ${severityBadgeClass(log.severity)}`}>{log.action}</span>
                  </td>
                  <td className="px-4 py-4">{log.election}</td>
                  <td className="px-4 py-4 text-slate-500">{log.ip}</td>
                  <td className="px-4 py-4 text-center">
                    <button type="button" onClick={() => setDetailLog(log)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[12px] text-slate-500">
          <div className="flex items-center gap-2">
            <span>Mostrar</span>
            <SelectInput value={String(pageSize)} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="h-8 w-[84px]">
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </SelectInput>
            <span>por página</span>
          </div>

          <div>Mostrando {startIndex} a {endIndex} de {formatNumber(filteredLogs.length)} registos</div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1} className="rounded border border-slate-300 px-3 py-1 disabled:opacity-50">&lt;</button>
            {Array.from({ length: Math.min(totalPages, 3) }).map((_, index) => {
              const pageNumber = index + 1;
              return (
                <button key={pageNumber} type="button" onClick={() => setPage(pageNumber)} className={`rounded px-3 py-1 ${page === pageNumber ? 'bg-slate-900 text-white' : 'border border-slate-300 text-slate-600'}`}>
                  {pageNumber}
                </button>
              );
            })}
            {totalPages > 3 ? <span className="px-1">…</span> : null}
            {totalPages > 3 ? <button type="button" onClick={() => setPage(totalPages)} className={`rounded px-3 py-1 ${page === totalPages ? 'bg-slate-900 text-white' : 'border border-slate-300 text-slate-600'}`}>{totalPages}</button> : null}
            <button type="button" onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} disabled={page === totalPages} className="rounded border border-slate-300 px-3 py-1 disabled:opacity-50">&gt;</button>
          </div>
        </div>
      </PageSection>

      {detailLog ? (
        <div className="mt-6 rounded-sm bg-white p-5 shadow-[0_0_0_1px_rgba(15,23,42,0.04)]">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-[16px] font-semibold text-slate-900">Detalhes do Registo</h3>
              <p className="text-[12px] text-slate-500">Consulta detalhada do evento auditado.</p>
            </div>
            <SecondaryButton type="button" onClick={() => setDetailLog(null)} className="h-9">Fechar</SecondaryButton>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Timestamp</p><p className="mt-1 text-[14px] text-slate-700">{detailLog.timestamp}</p></div>
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Utilizador</p><p className="mt-1 text-[14px] text-slate-700">{detailLog.user}</p></div>
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Acção</p><p className="mt-1 text-[14px] text-slate-700">{detailLog.action}</p></div>
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Eleição</p><p className="mt-1 text-[14px] text-slate-700">{detailLog.election}</p></div>
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">IP</p><p className="mt-1 text-[14px] text-slate-700">{detailLog.ip}</p></div>
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Severidade</p><p className="mt-1 text-[14px] text-slate-700">{detailLog.severity}</p></div>
            <div className="md:col-span-2"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Detalhes</p><p className="mt-1 text-[14px] leading-7 text-slate-700">{detailLog.details}</p></div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

export function FiscalDashboardPage() {
  return <AuditCenter title="Painel de Controlo" />;
}

export function FiscalAuditPage() {
  return <AuditCenter title="Registos de Auditoria" />;
}

export function FiscalResultsPage() {
  const [selectedElectionId, setSelectedElectionId] = useState(INITIAL_RESULTS[0]?.id ?? '');
  const [message, setMessage] = useState('');
  const selectedElection = INITIAL_RESULTS.find((item) => item.id === selectedElectionId) ?? INITIAL_RESULTS[0];
  const maxVotes = Math.max(0, ...selectedElection.candidates.map((candidate) => candidate.votes));

  function exportResultReport() {
    downloadCsv(
      'verificacao-resultados.csv',
      selectedElection.candidates.map((candidate) => ({
        eleicao: selectedElection.election,
        candidato: candidate.name,
        lista: candidate.list,
        votos: String(candidate.votes),
      })),
    );
    setMessage('Relatório de verificação exportado.');
  }

  return (
    <AppShell title="Verificação de Resultados" actions={<PrimaryButton type="button" onClick={exportResultReport}><Download className="mr-2 h-4 w-4" />Exportar Verificação</PrimaryButton>}>
      {message ? <div className="mb-4 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-[12px] text-blue-700">{message}</div> : null}

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        {INITIAL_RESULTS.map((election) => {
          const selected = election.id === selectedElection.id;
          return (
            <button key={election.id} type="button" onClick={() => setSelectedElectionId(election.id)} className={`rounded-sm border bg-white p-4 text-left shadow-[0_0_0_1px_rgba(15,23,42,0.04)] transition ${selected ? 'border-blue-500 ring-2 ring-blue-100' : 'border-transparent'}`}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className={`inline-flex rounded px-2 py-1 text-[10px] font-semibold ${resultStatusClass(election.status)}`}>{election.status}</span>
                <Vote className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-[15px] font-semibold text-slate-900">{election.election}</p>
              <p className="mt-2 text-[12px] text-slate-500">{formatNumber(election.totalVotes)} votos de {formatNumber(election.eligibleStudents)} elegíveis</p>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <PageSection title={`Conferência — ${selectedElection.election}`} description="Validação visual da apuração com base nos resultados registados.">
          <div className="space-y-5">
            {selectedElection.candidates.map((candidate) => {
              const percentage = maxVotes ? (candidate.votes / maxVotes) * 100 : 0;
              const share = selectedElection.totalVotes > 0 ? ((candidate.votes / selectedElection.totalVotes) * 100).toFixed(1) : '0.0';
              return (
                <div key={candidate.id} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[14px] font-semibold text-slate-800">{candidate.name}</p>
                      <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">{candidate.list}</p>
                    </div>
                    <div className="text-right text-[12px]">
                      <p className="font-semibold text-slate-700">{formatNumber(candidate.votes)}</p>
                      <p className="text-slate-400">({share}%)</p>
                    </div>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-blue-700" style={{ width: `${percentage}%` }} /></div>
                </div>
              );
            })}
          </div>
        </PageSection>

        <PageSection title="Estado da Verificação" description="Indicadores rápidos para conferência do fiscal.">
          <div className="space-y-4">
            <SummaryCard title="Total de Votos" value={formatNumber(selectedElection.totalVotes)} icon={<CheckCircle2 className="h-4 w-4 text-emerald-700" />} tone="success" />
            <SummaryCard title="Elegíveis" value={formatNumber(selectedElection.eligibleStudents)} icon={<ShieldCheck className="h-4 w-4 text-slate-700" />} />
            <SummaryCard title="Conformidade" value="100%" icon={<ShieldAlert className="h-4 w-4 text-slate-700" />} subtitle="Sem divergências detectadas nesta simulação" />
          </div>
        </PageSection>
      </div>
    </AppShell>
  );
}

export function FiscalReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>(INITIAL_REPORTS);
  const [reportType, setReportType] = useState('Todos');
  const [electionFilter, setElectionFilter] = useState('Todas');
  const [message, setMessage] = useState('');

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const typeOk = reportType === 'Todos' || report.type === reportType;
      const electionOk = electionFilter === 'Todas' || report.election === electionFilter;
      return typeOk && electionOk;
    });
  }, [reports, reportType, electionFilter]);

  function generateReport() {
    const newReport: ReportItem = {
      id: crypto.randomUUID(),
      name: 'Relatório de Fiscalização Gerado',
      type: 'Auditoria',
      election: 'Reitoria 2024',
      generatedAt: new Date().toLocaleString('pt-PT'),
      status: 'Gerado',
    };
    setReports((prev) => [newReport, ...prev]);
    setMessage('Novo relatório gerado com sucesso.');
  }

  function exportSingleReport(report: ReportItem) {
    downloadCsv('relatorio-fiscalizacao.csv', [
      {
        nome: report.name,
        tipo: report.type,
        eleicao: report.election,
        gerado_em: report.generatedAt,
        estado: report.status,
      },
    ]);
    setMessage(`Relatório “${report.name}” exportado.`);
  }

  return (
    <AppShell title="Relatórios de Fiscalização" actions={<PrimaryButton type="button" onClick={generateReport}><FileText className="mr-2 h-4 w-4" />Gerar Relatório</PrimaryButton>}>
      {message ? <div className="mb-4 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-[12px] text-blue-700">{message}</div> : null}

      <PageSection title="Filtros de Relatórios" description="Refina a listagem de relatórios disponíveis para exportação.">
        <div className="grid gap-3 md:grid-cols-3">
          <SelectInput value={reportType} onChange={(e) => setReportType(e.target.value)}>
            <option value="Todos">Todos os tipos</option>
            <option value="Auditoria">Auditoria</option>
            <option value="Segurança">Segurança</option>
            <option value="Resultados">Resultados</option>
          </SelectInput>
          <SelectInput value={electionFilter} onChange={(e) => setElectionFilter(e.target.value)}>
            <option value="Todas">Todas as eleições</option>
            <option value="Reitoria 2024">Reitoria 2024</option>
            <option value="Conselho 2024">Conselho 2024</option>
          </SelectInput>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] text-slate-500 flex items-center">{filteredReports.length} relatório(s) encontrado(s)</div>
        </div>
      </PageSection>

      <div className="mt-6 rounded-sm bg-white p-4 shadow-[0_0_0_1px_rgba(15,23,42,0.04)]">
        <h2 className="mb-4 text-[14px] font-semibold text-slate-900">Histórico de Relatórios</h2>
        <div className="overflow-hidden rounded-sm border border-slate-200">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-[0.16em] text-slate-400">
              <tr>
                <th className="px-4 py-3">Relatório</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Eleição</th>
                <th className="px-4 py-3">Gerado em</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-[12px] text-slate-700">
              {filteredReports.map((report) => (
                <tr key={report.id}>
                  <td className="px-4 py-4 font-semibold text-slate-800">{report.name}</td>
                  <td className="px-4 py-4">{report.type}</td>
                  <td className="px-4 py-4">{report.election}</td>
                  <td className="px-4 py-4">{report.generatedAt}</td>
                  <td className="px-4 py-4"><span className={`rounded px-2 py-1 text-[10px] font-semibold ${report.status === 'Gerado' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{report.status}</span></td>
                  <td className="px-4 py-4 text-right"><SecondaryButton type="button" onClick={() => exportSingleReport(report)} className="h-8 px-3">Exportar</SecondaryButton></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

export function FiscalSettingsPage() {
  const [profile, setProfile] = useStoredState<UserProfile>(STORAGE_KEYS.profile, DEFAULT_PROFILE);
  const [draftName, setDraftName] = useState(profile.name);
  const [draftPhoto, setDraftPhoto] = useState(profile.photo);
  const [theme, setTheme] = useState<UserProfile['theme']>(profile.theme);
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setDraftName(profile.name);
    setDraftPhoto(profile.photo);
    setTheme(profile.theme);
  }, [profile]);

  function saveProfile() {
    if (!draftName.trim()) {
      setError('O nome não pode ficar vazio.');
      return;
    }
    setProfile((prev) => ({ ...prev, name: draftName, photo: draftPhoto, theme }));
    setError('');
    setMessage('Perfil actualizado com sucesso.');
  }

  function changePassword() {
    if (!passwords.current || !passwords.next || !passwords.confirm) {
      setError('Preenche todos os campos da senha.');
      return;
    }
    if (passwords.next !== passwords.confirm) {
      setError('A nova senha e a confirmação não coincidem.');
      return;
    }
    setPasswords({ current: '', next: '', confirm: '' });
    setError('');
    setMessage('Senha alterada com sucesso.');
  }

  function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : draftPhoto;
      setDraftPhoto(result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <AppShell title="Configurações">
      {message ? <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700">{message}</div> : null}
      {error ? <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-600">{error}</div> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <PageSection title="Perfil do Utilizador" description="Actualizar nome, foto e identidade visual do fiscal.">
          <div className="space-y-4 text-[12px] text-slate-600">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 overflow-hidden rounded-full bg-slate-100"><img src={draftPhoto} alt={draftName} className="h-full w-full object-cover" /></div>
              <div className="flex-1"><p className="text-[14px] font-semibold text-slate-900">{profile.name}</p><p className="text-[12px] text-slate-500">{profile.email}</p></div>
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Nome</label>
              <TextInput value={draftName} onChange={(e) => setDraftName(e.target.value)} />
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Foto do Perfil</label>
              <div className="space-y-2">
                <TextInput value={draftPhoto} onChange={(e) => setDraftPhoto(e.target.value)} placeholder="URL da imagem" />
                <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-[12px] font-semibold text-slate-700 hover:bg-slate-50">
                  <ImageIcon className="mr-2 h-4 w-4" />Carregar Imagem
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>
            </div>
            <PrimaryButton type="button" onClick={saveProfile}><Save className="mr-2 h-4 w-4" />Guardar Perfil</PrimaryButton>
          </div>
        </PageSection>

        <PageSection title="Aparência e Segurança" description="Definir tema e actualizar a palavra-passe do fiscal.">
          <div className="space-y-4 text-[12px] text-slate-600">
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Tema</label>
              <div className="flex flex-wrap gap-2">
                {(['Claro', 'Escuro', 'Sistema'] as UserProfile['theme'][]).map((option) => (
                  <button key={option} type="button" onClick={() => setTheme(option)} className={`rounded-md px-3 py-2 text-[12px] font-semibold ${theme === option ? 'bg-blue-600 text-white' : 'border border-slate-300 bg-white text-slate-700'}`}>{option}</button>
                ))}
              </div>
            </div>
            <div className="rounded-md border border-slate-200 p-3">
              <div className="mb-3 flex items-center gap-2"><Lock className="h-4 w-4 text-slate-500" /><p className="text-[13px] font-semibold text-slate-900">Alterar Senha</p></div>
              <div className="space-y-3">
                <TextInput type="password" value={passwords.current} onChange={(e) => setPasswords((prev) => ({ ...prev, current: e.target.value }))} placeholder="Senha actual" />
                <TextInput type="password" value={passwords.next} onChange={(e) => setPasswords((prev) => ({ ...prev, next: e.target.value }))} placeholder="Nova senha" />
                <TextInput type="password" value={passwords.confirm} onChange={(e) => setPasswords((prev) => ({ ...prev, confirm: e.target.value }))} placeholder="Confirmar nova senha" />
                <PrimaryButton type="button" onClick={changePassword}>Alterar Senha</PrimaryButton>
              </div>
            </div>
          </div>
        </PageSection>
      </div>
    </AppShell>
  );
}
