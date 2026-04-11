import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BadgeCheck,
  CalendarDays,
  Check,
  Clock3,
  Eye,
  FileDown,
  GraduationCap,
  Image as ImageIcon,
  Lock,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  Upload,
  User,
  Users,
  Vote,
} from 'lucide-react';

type ElectionStatus = 'rascunho' | 'programada' | 'activa' | 'encerrada';

type Election = {
  id: string;
  name: string;
  subtitle: string;
  status: ElectionStatus;
  startDate: string;
  endDate: string;
  registeredVotes: number;
  eligibleStudents: number;
  candidatureStart: string;
  candidatureEnd: string;
  votingStart: string;
  votingEnd: string;
  description: string;
  roles: string[];
  autoStart: boolean;
  createdAt: string;
};

type CandidateResult = {
  id: string;
  electionId: string;
  name: string;
  listName: string;
  votes: number;
  avatar: string;
  role: string;
};

type CandidateItem = {
  id: string;
  electionId: string;
  name: string;
  email: string;
  role: string;
  listName: string;
  biography: string;
  proposal: string;
  image: string;
  status: 'Aprovado' | 'Em análise' | 'Rejeitado';
};

type StudentItem = {
  id: string;
  name: string;
  email: string;
  faculty: string;
  course: string;
  eligible: boolean;
  year: string;
};

type CommitteeMember = {
  id: string;
  name: string;
  role: string;
  status: 'Activo' | 'Inactivo';
  email: string;
};

type AuditLog = {
  id: string;
  user: string;
  action: string;
  at: string;
  module: string;
};

type UserProfile = {
  name: string;
  email: string;
  photo: string;
  theme: 'Claro' | 'Escuro' | 'Sistema';
};

type FormState = {
  title: string;
  description: string;
  candidatureStart: string;
  candidatureEnd: string;
  votingStart: string;
  votingEnd: string;
  roles: string[];
  autoStart: boolean;
};

type FormErrors = Partial<Record<keyof FormState, string>> & {
  general?: string;
};

const STORAGE_KEYS = {
  elections: 'commission:elections',
  roles: 'commission:roles',
  profile: 'commission:profile',
};

const DEFAULT_PROFILE: UserProfile = {
  name: 'João Machava',
  email: 'joao.machava@up.ac.mz',
  photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  theme: 'Claro',
};

const INITIAL_ELECTIONS: Election[] = [
  {
    id: '1',
    name: 'Eleições AEUP 2026',
    subtitle: 'Direcção Executiva Central',
    status: 'activa',
    startDate: '12/05/2026',
    endDate: '18/05/2026',
    registeredVotes: 14502,
    eligibleStudents: 28400,
    candidatureStart: '2026-05-01T08:00',
    candidatureEnd: '2026-05-05T18:00',
    votingStart: '2026-05-12T08:00',
    votingEnd: '2026-05-18T18:00',
    description: 'Pleito principal da associação estudantil.',
    roles: ['Presidente'],
    autoStart: true,
    createdAt: '2026-04-20T10:00:00',
  },
  {
    id: '2',
    name: 'Eleições AEUP 2026/2027',
    subtitle: 'Direcção Executiva Central',
    status: 'programada',
    startDate: '12/06/2026',
    endDate: '18/06/2026',
    registeredVotes: 0,
    eligibleStudents: 28400,
    candidatureStart: '2026-06-01T08:00',
    candidatureEnd: '2026-06-05T18:00',
    votingStart: '2026-06-12T08:00',
    votingEnd: '2026-06-18T18:00',
    description: 'Nova edição já programada pela comissão.',
    roles: ['Vice-Presidente'],
    autoStart: true,
    createdAt: '2026-05-02T14:00:00',
  },
  {
    id: '3',
    name: 'Conselho Universitário',
    subtitle: 'Representantes Estudantis',
    status: 'encerrada',
    startDate: '20/05/2026',
    endDate: '22/05/2026',
    registeredVotes: 18340,
    eligibleStudents: 28600,
    candidatureStart: '2026-05-10T08:00',
    candidatureEnd: '2026-05-14T18:00',
    votingStart: '2026-05-20T08:00',
    votingEnd: '2026-05-22T18:00',
    description: 'Escolha de representantes estudantis.',
    roles: ['Representante Titular'],
    autoStart: true,
    createdAt: '2026-05-01T11:30:00',
  },
];

const DEFAULT_ROLES = [
  'Presidente',
  'Vice-Presidente',
  'Secretário Geral',
  'Representante Titular',
  'Representante Suplente',
];

const INITIAL_RESULTS: CandidateResult[] = [
  { id: '1', electionId: '1', name: 'Artur Mandlate', listName: 'LISTA A - INOVAÇÃO ACADÉMICA', votes: 15240, avatar: 'AM', role: 'Presidente' },
  { id: '2', electionId: '1', name: 'Elena Sitoe', listName: 'LISTA B - UP DINÂMICA', votes: 13252, avatar: 'ES', role: 'Presidente' },
  { id: '3', electionId: '3', name: 'Joana Mucavele', listName: 'LISTA A - RENOVAÇÃO', votes: 9640, avatar: 'JM', role: 'Representante Titular' },
  { id: '4', electionId: '3', name: 'Carlos Cossa', listName: 'LISTA B - FUTURO ACADÉMICO', votes: 8700, avatar: 'CC', role: 'Representante Titular' },
  { id: '5', electionId: '3', name: 'Lina Tembe', listName: 'LISTA C - UNIÃO ESTUDANTIL', votes: 0, avatar: 'LT', role: 'Representante Titular' },
];

const INITIAL_CANDIDATES: CandidateItem[] = [
  {
    id: 'c1',
    electionId: '1',
    name: 'Artur Mandlate',
    email: 'artur.mandlate@up.ac.mz',
    role: 'Presidente',
    listName: 'Lista A',
    biography: 'Estudante finalista com experiência em liderança estudantil e organização de actividades académicas.',
    proposal: 'Digitalizar processos académicos, reforçar transparência e melhorar a comunicação institucional com os estudantes.',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    status: 'Aprovado',
  },
  {
    id: 'c2',
    electionId: '1',
    name: 'Elena Sitoe',
    email: 'elena.sitoe@up.ac.mz',
    role: 'Vice-Presidente',
    listName: 'Lista B',
    biography: 'Estudante com forte participação em projectos sociais, representação académica e dinamização estudantil.',
    proposal: 'Aumentar o apoio estudantil, criar mecanismos de escuta activa e melhorar o acompanhamento administrativo.',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    status: 'Em análise',
  },
  {
    id: 'c3',
    electionId: '3',
    name: 'Jaime Cuambe',
    email: 'jaime.cuambe@up.ac.mz',
    role: 'Representante Titular',
    listName: 'Lista C',
    biography: 'Candidato ligado a iniciativas de representação universitária e organização de debates estudantis.',
    proposal: 'Criar um conselho permanente de diálogo entre estudantes e departamentos académicos.',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    status: 'Aprovado',
  },
];

const INITIAL_STUDENTS: StudentItem[] = [
  { id: '2026001', name: 'Marta Chongo', email: 'marta.chongo@up.ac.mz', faculty: 'Engenharia', course: 'Engenharia Informática', eligible: true, year: '4º Ano' },
  { id: '2026002', name: 'Rui Tembe', email: 'rui.tembe@up.ac.mz', faculty: 'Direito', course: 'Direito', eligible: true, year: '3º Ano' },
  { id: '2026003', name: 'Lina Mucavele', email: 'lina.mucavele@up.ac.mz', faculty: 'Medicina', course: 'Medicina Geral', eligible: false, year: '5º Ano' },
  { id: '2026004', name: 'Joana Sitoe', email: 'joana.sitoe@up.ac.mz', faculty: 'Economia', course: 'Economia Aplicada', eligible: true, year: '2º Ano' },
  { id: '2026005', name: 'Paulo Machatine', email: 'paulo.machatine@up.ac.mz', faculty: 'Arquitectura', course: 'Arquitectura', eligible: true, year: '4º Ano' },
];

const INITIAL_MEMBERS: CommitteeMember[] = [
  { id: 'm1', name: 'João Machava', role: 'Presidente da Comissão', status: 'Activo', email: 'joao.machava@up.ac.mz' },
  { id: 'm2', name: 'Paula Cossa', role: 'Secretária', status: 'Activo', email: 'paula.cossa@up.ac.mz' },
  { id: 'm3', name: 'Carlos Mabote', role: 'Fiscal', status: 'Inactivo', email: 'carlos.mabote@up.ac.mz' },
];

const INITIAL_LOGS: AuditLog[] = [
  { id: 'l1', user: 'João Machava', action: 'Criou uma nova eleição', at: '15/05/2026 14:30', module: 'Eleições' },
  { id: 'l2', user: 'Paula Cossa', action: 'Aprovou candidatura Lista A', at: '15/05/2026 13:20', module: 'Candidaturas' },
  { id: 'l3', user: 'Sistema', action: 'Mudou estado para ENCERRADA automaticamente', at: '15/05/2026 12:00', module: 'Automação' },
];

const INITIAL_FORM: FormState = {
  title: '',
  description: '',
  candidatureStart: '',
  candidatureEnd: '',
  votingStart: '',
  votingEnd: '',
  roles: ['Presidente'],
  autoStart: true,
};

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

function getStatusMeta(status: ElectionStatus) {
  switch (status) {
    case 'activa':
      return { label: 'ACTIVA', className: 'bg-amber-400 text-white' };
    case 'programada':
      return { label: 'PROGRAMADA', className: 'bg-slate-200 text-slate-600' };
    case 'encerrada':
      return { label: 'ENCERRADA', className: 'bg-slate-700 text-white' };
    case 'rascunho':
    default:
      return { label: 'RASCUNHO', className: 'bg-zinc-200 text-zinc-700' };
  }
}

function calculateParticipation(votes: number, eligible: number) {
  if (!eligible) return 0;
  return Number(((votes / eligible) * 100).toFixed(1));
}

function toInputDateTime(date: string) {
  return date || '';
}

function validateElectionForm(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.title.trim()) errors.title = 'O título da eleição é obrigatório.';
  if (!form.description.trim()) errors.description = 'A descrição do pleito é obrigatória.';
  if (!form.candidatureStart) errors.candidatureStart = 'Define o início do período de candidaturas.';
  if (!form.candidatureEnd) errors.candidatureEnd = 'Define o fim do período de candidaturas.';
  if (!form.votingStart) errors.votingStart = 'Define o início do período de votação.';
  if (!form.votingEnd) errors.votingEnd = 'Define o fim da votação.';
  if (!form.roles.length) errors.roles = 'Selecciona um cargo em disputa.';

  const candidatureStart = form.candidatureStart ? new Date(form.candidatureStart) : null;
  const candidatureEnd = form.candidatureEnd ? new Date(form.candidatureEnd) : null;
  const votingStart = form.votingStart ? new Date(form.votingStart) : null;
  const votingEnd = form.votingEnd ? new Date(form.votingEnd) : null;

  if (candidatureStart && candidatureEnd && candidatureEnd <= candidatureStart) {
    errors.candidatureEnd = 'O fim das candidaturas deve ser depois do início.';
  }
  if (votingStart && votingEnd && votingEnd <= votingStart) {
    errors.votingEnd = 'O fim da votação deve ser depois do início.';
  }
  if (candidatureEnd && votingStart && candidatureEnd >= votingStart) {
    errors.votingStart = 'A votação deve começar depois do fim das candidaturas.';
  }

  return errors;
}

function StatCard({ label, value, icon, accent }: { label: string; value: string; icon?: React.ReactNode; accent?: React.ReactNode }) {
  return (
    <div className="rounded-sm bg-white px-5 py-4 shadow-[0_0_0_1px_rgba(15,23,42,0.04)]">
      <div className="mb-4 flex items-start justify-between gap-2">
        <p className="max-w-[90px] text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
        {icon}
      </div>
      <div className="text-[24px] font-semibold tracking-[0.04em] text-blue-600">{value}</div>
      {accent}
    </div>
  );
}

function PageSection({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="rounded-sm bg-white p-4 shadow-[0_0_0_1px_rgba(15,23,42,0.04)]">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-[14px] font-semibold text-slate-900">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</label>
      {children}
      {error && (
        <div className="mt-1 flex items-center gap-1 text-[11px] text-red-500">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-[13px] outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${props.className ?? ''}`} />;
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`min-h-[110px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-[13px] outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${props.className ?? ''}`} />;
}

function SecondaryButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 ${props.className ?? ''}`}>{children}</button>;
}

function PrimaryButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 text-[12px] font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 ${props.className ?? ''}`}>{children}</button>;
}

function AppShell({ active, title, actions, children }: { active: string; title: string; actions?: React.ReactNode; children: React.ReactNode }) {
  const [profile, setProfile] = useStoredState<UserProfile>(STORAGE_KEYS.profile, DEFAULT_PROFILE);
  const [profileOpen, setProfileOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'view' | 'edit'>('view');
  const [draftProfile, setDraftProfile] = useState<UserProfile>(profile);

  useEffect(() => {
    setDraftProfile(profile);
  }, [profile]);

  function saveProfile() {
    setProfile(draftProfile);
    setViewMode('view');
  }

  function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : profile.photo;
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
                  <img src={viewMode === 'edit' ? draftProfile.photo : profile.photo} alt={profile.name} className="h-full w-full object-cover" />
                </div>
                <div>
                  <p className="text-[16px] font-semibold text-slate-900">{viewMode === 'edit' ? draftProfile.name : profile.name}</p>
                  <p className="text-[13px] text-slate-500">{viewMode === 'edit' ? draftProfile.email : profile.email}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-slate-400">{active}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {viewMode === 'view' ? (
                  <>
                    <SecondaryButton type="button" onClick={() => setProfileOpen(false)} className="h-9">Fechar</SecondaryButton>
                    <PrimaryButton type="button" onClick={() => setViewMode('edit')} className="h-9"><Pencil className="mr-2 h-4 w-4" />Editar Perfil</PrimaryButton>
                  </>
                ) : (
                  <>
                    <SecondaryButton type="button" onClick={() => setViewMode('view')} className="h-9">Cancelar</SecondaryButton>
                    <PrimaryButton type="button" onClick={saveProfile} className="h-9"><Save className="mr-2 h-4 w-4" />Guardar</PrimaryButton>
                  </>
                )}
              </div>
            </div>

            {viewMode === 'edit' && (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <FormField label="Nome"><TextInput value={draftProfile.name} onChange={(e) => setDraftProfile((prev) => ({ ...prev, name: e.target.value }))} /></FormField>
                <FormField label="Email"><TextInput value={draftProfile.email} onChange={(e) => setDraftProfile((prev) => ({ ...prev, email: e.target.value }))} /></FormField>
                <div className="md:col-span-2">
                  <FormField label="Foto do Perfil">
                    <div className="flex flex-wrap gap-3">
                      <TextInput value={draftProfile.photo} onChange={(e) => setDraftProfile((prev) => ({ ...prev, photo: e.target.value }))} placeholder="URL da imagem" />
                      <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-[12px] font-semibold text-slate-700 hover:bg-slate-50">
                        <Upload className="mr-2 h-4 w-4" />Carregar Foto
                        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                      </label>
                    </div>
                  </FormField>
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

function ElectionActions({ election, onView, onEdit, onDelete }: { election: Election; onView: () => void; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex justify-end gap-2 text-slate-500">
      <button type="button" onClick={onView} className="rounded p-1 hover:bg-slate-100"><Eye className="h-4 w-4" /></button>
      {election.status === 'programada' && (
        <>
          <button type="button" onClick={onEdit} className="rounded p-1 hover:bg-slate-100"><Pencil className="h-4 w-4" /></button>
          <button type="button" onClick={onDelete} className="rounded p-1 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
        </>
      )}
    </div>
  );
}

function ElectionDetailCard({ election, onClose }: { election: Election; onClose: () => void }) {
  return (
    <div className="rounded-sm bg-white p-5 shadow-[0_0_0_1px_rgba(15,23,42,0.04)]">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-[18px] font-semibold text-slate-900">Detalhes da Eleição</h3>
          <p className="text-[12px] text-slate-500">Consulta da programação e parâmetros do processo eleitoral.</p>
        </div>
        <SecondaryButton type="button" onClick={onClose} className="h-9">Fechar</SecondaryButton>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Título</p><p className="mt-1 text-[14px] font-semibold text-slate-900">{election.name}</p></div>
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Estado</p><p className="mt-1 text-[14px] text-slate-700">{getStatusMeta(election.status).label}</p></div>
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Início</p><p className="mt-1 text-[14px] text-slate-700">{election.startDate}</p></div>
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Fim</p><p className="mt-1 text-[14px] text-slate-700">{election.endDate}</p></div>
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Período de Candidaturas</p><p className="mt-1 text-[14px] text-slate-700">{election.candidatureStart} — {election.candidatureEnd}</p></div>
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Período de Votação</p><p className="mt-1 text-[14px] text-slate-700">{election.votingStart} — {election.votingEnd}</p></div>
        <div className="md:col-span-2"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Descrição</p><p className="mt-1 text-[14px] leading-7 text-slate-700">{election.description}</p></div>
        <div className="md:col-span-2"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Cargo em Disputa</p><div className="mt-2 flex flex-wrap gap-2">{election.roles.map((role) => <span key={role} className="rounded-md bg-blue-50 px-3 py-1.5 text-[12px] font-medium text-blue-700">{role}</span>)}</div></div>
      </div>
    </div>
  );
}

function AddElectionPanel({ onCreate, initialElection, onCancel }: { onCreate: (election: Election) => void; initialElection?: Election | null; onCancel?: () => void }) {
  const [availableRoles, setAvailableRoles] = useStoredState<string[]>(STORAGE_KEYS.roles, DEFAULT_ROLES);
  const [form, setForm] = useState<FormState>(
    initialElection
      ? {
          title: initialElection.name,
          description: initialElection.description,
          candidatureStart: initialElection.candidatureStart,
          candidatureEnd: initialElection.candidatureEnd,
          votingStart: initialElection.votingStart,
          votingEnd: initialElection.votingEnd,
          roles: initialElection.roles,
          autoStart: initialElection.autoStart,
        }
      : INITIAL_FORM,
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [newRole, setNewRole] = useState('');
  const [showRoleCard, setShowRoleCard] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined, general: undefined }));
    setSavedMessage('');
  }

  function selectRole(role: string) {
    updateField('roles', [role]);
  }

  function addRole() {
    const clean = newRole.trim();
    if (!clean) {
      setErrors((prev) => ({ ...prev, roles: 'Indica o nome do cargo antes de adicionar.' }));
      return;
    }
    if (availableRoles.includes(clean)) {
      setErrors((prev) => ({ ...prev, roles: 'Este cargo já existe.' }));
      return;
    }
    setAvailableRoles((prev) => [...prev, clean]);
    updateField('roles', [clean]);
    setNewRole('');
    setShowRoleCard(false);
  }

  function handleDraft() {
    const validation = validateElectionForm({ ...form, description: form.description || 'Rascunho em preparação.' });
    const relaxedErrors = { ...validation };
    delete relaxedErrors.description;
    delete relaxedErrors.title;
    if (Object.keys(relaxedErrors).length > 0) {
      setErrors(relaxedErrors);
      return;
    }
    setSavedMessage('Rascunho guardado localmente.');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validation = validateElectionForm(form);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    const election: Election = {
      id: initialElection?.id ?? crypto.randomUUID(),
      name: form.title,
      subtitle: form.roles[0] ?? '',
      status: 'programada',
      startDate: new Date(form.votingStart).toLocaleDateString('pt-PT'),
      endDate: new Date(form.votingEnd).toLocaleDateString('pt-PT'),
      registeredVotes: initialElection?.registeredVotes ?? 0,
      eligibleStudents: initialElection?.eligibleStudents ?? 0,
      candidatureStart: form.candidatureStart,
      candidatureEnd: form.candidatureEnd,
      votingStart: form.votingStart,
      votingEnd: form.votingEnd,
      description: form.description,
      roles: form.roles,
      autoStart: form.autoStart,
      createdAt: initialElection?.createdAt ?? new Date().toISOString(),
    };

    onCreate(election);
    setSavedMessage(initialElection ? 'Eleição actualizada com sucesso.' : 'Eleição criada com sucesso.');
    if (!initialElection) {
      setErrors({});
      setForm(INITIAL_FORM);
    }
  }

  return (
    <section className="rounded-sm bg-white px-6 py-5 shadow-[0_0_0_1px_rgba(15,23,42,0.04)]">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-[18px] font-semibold text-[#173f1f]">Configurar Processo Eleitoral</h2>
          <p className="mt-1 text-[12px] text-slate-500">Define os parâmetros, cronograma e um único cargo para a eleição.</p>
        </div>
        {onCancel && <SecondaryButton type="button" onClick={onCancel} className="h-9">Fechar</SecondaryButton>}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <FormField label="Título da Eleição" error={errors.title}><TextInput value={form.title} onChange={(e) => updateField('title', e.target.value)} placeholder="Ex: Eleições AEUP 2026/2027" /></FormField>
        <FormField label="Descrição do Pleito" error={errors.description}><Textarea value={form.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Detalhes sobre o objectivo da eleição e público-alvo..." /></FormField>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Período de Candidaturas" error={errors.candidatureStart || errors.candidatureEnd}>
            <div className="space-y-2">
              <TextInput type="datetime-local" value={toInputDateTime(form.candidatureStart)} onChange={(e) => updateField('candidatureStart', e.target.value)} />
              <TextInput type="datetime-local" value={toInputDateTime(form.candidatureEnd)} onChange={(e) => updateField('candidatureEnd', e.target.value)} />
            </div>
          </FormField>
          <FormField label="Período de Votação" error={errors.votingStart || errors.votingEnd}>
            <div className="space-y-2">
              <TextInput type="datetime-local" value={toInputDateTime(form.votingStart)} onChange={(e) => updateField('votingStart', e.target.value)} />
              <TextInput type="datetime-local" value={toInputDateTime(form.votingEnd)} onChange={(e) => updateField('votingEnd', e.target.value)} />
            </div>
          </FormField>
        </div>

        <FormField label="Cargo em Disputa" error={typeof errors.roles === 'string' ? errors.roles : undefined}>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="mb-3 flex flex-wrap gap-2">
              {availableRoles.map((role) => {
                const selected = form.roles[0] === role;
                return (
                  <button key={role} type="button" onClick={() => selectRole(role)} className={`rounded-md px-3 py-2 text-[12px] font-semibold transition ${selected ? 'bg-blue-600 text-white' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}>
                    {role}
                  </button>
                );
              })}
            </div>
            <SecondaryButton type="button" onClick={() => setShowRoleCard((prev) => !prev)} className="h-9"><Plus className="mr-2 h-4 w-4" />Adicionar Cargo</SecondaryButton>
            {showRoleCard && (
              <div className="mt-4 rounded-md border border-slate-200 bg-white p-3">
                <div className="flex flex-wrap gap-2">
                  <TextInput value={newRole} onChange={(e) => setNewRole(e.target.value)} placeholder="Nome do novo cargo" className="flex-1" />
                  <PrimaryButton type="button" onClick={addRole} className="h-10">Guardar Cargo</PrimaryButton>
                </div>
              </div>
            )}
          </div>
        </FormField>

        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[12px] font-semibold text-blue-700">Abertura Automática</p>
              <p className="text-[11px] text-slate-500">A activação e o encerramento seguem automaticamente as datas e horas definidas.</p>
            </div>
            <button type="button" onClick={() => updateField('autoStart', !form.autoStart)} className={`relative h-7 w-12 rounded-full transition ${form.autoStart ? 'bg-amber-400' : 'bg-slate-300'}`}>
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${form.autoStart ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
        </div>

        {errors.general && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-600">{errors.general}</div>}
        {savedMessage && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700">{savedMessage}</div>}

        <div className="flex justify-end gap-3 pt-2">
          <SecondaryButton type="button" onClick={handleDraft}>Guardar Rascunho</SecondaryButton>
          <PrimaryButton type="submit">{initialElection ? 'Actualizar Eleição' : 'Criar Eleição'}</PrimaryButton>
        </div>
      </form>
    </section>
  );
}

function ElectionTable({ elections, message, onView, onEdit, onDelete, showStats = true }: { elections: Election[]; message?: string; onView: (election: Election) => void; onEdit: (election: Election) => void; onDelete: (election: Election) => void; showStats?: boolean }) {
  const activeCount = elections.filter((item) => item.status === 'activa').length;
  const totalVotes = elections.reduce((sum, item) => sum + item.registeredVotes, 0);
  const eligibleStudents = elections.reduce((sum, item) => sum + item.eligibleStudents, 0);
  const participation = calculateParticipation(totalVotes, eligibleStudents);

  return (
    <div className="space-y-4">
      {message && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700">{message}</div>}
      {showStats && (
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Eleições Activas" value={String(activeCount)} icon={<BadgeCheck className="h-4 w-4 text-blue-600" />} />
          <StatCard label="Total de Votos" value={formatNumber(totalVotes)} icon={<Vote className="h-4 w-4 text-blue-600" />} />
          <StatCard label="Estudantes Elegíveis" value={formatNumber(eligibleStudents)} icon={<Users className="h-4 w-4 text-blue-600" />} />
          <StatCard label="Participação" value={`${participation}%`} icon={<CalendarDays className="h-4 w-4 text-blue-600" />} accent={<div className="mt-2 h-1.5 w-12 rounded-full bg-amber-400" />} />
        </div>
      )}
      <div>
        <h2 className="mb-4 text-[14px] font-semibold text-slate-900">Eleições em Curso e Programadas</h2>
        <div className="overflow-hidden rounded-sm border border-slate-200 bg-white">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-[0.16em] text-slate-400">
              <tr>
                <th className="px-4 py-3">Nome da Eleição</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Início</th>
                <th className="px-4 py-3">Fim</th>
                <th className="px-4 py-3">Votos Registados</th>
                <th className="px-4 py-3 text-right">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[12px] text-slate-700">
              {elections.map((election) => {
                const statusMeta = getStatusMeta(election.status);
                return (
                  <tr key={election.id}>
                    <td className="px-4 py-4"><div><p className="font-semibold text-blue-600">{election.name}</p><p className="text-[11px] text-slate-400">{election.subtitle}</p></div></td>
                    <td className="px-4 py-4"><span className={`inline-flex rounded px-2 py-1 text-[10px] font-semibold ${statusMeta.className}`}>{statusMeta.label}</span></td>
                    <td className="px-4 py-4">{election.startDate}</td>
                    <td className="px-4 py-4">{election.endDate}</td>
                    <td className="px-4 py-4 font-medium text-blue-600">{formatNumber(election.registeredVotes)}</td>
                    <td className="px-4 py-4"><ElectionActions election={election} onView={() => onView(election)} onEdit={() => onEdit(election)} onDelete={() => onDelete(election)} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CountdownCard() {
  const [remaining] = useState({ hours: '04', minutes: '12', seconds: '35' });
  return (
    <div className="flex min-h-[118px] flex-col justify-center rounded-sm bg-[#163d7a] px-6 py-4 text-white">
      <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-blue-100"><Clock3 className="h-3.5 w-3.5" /><span>Tempo Restante</span></div>
      <div className="text-[40px] font-semibold tracking-[0.08em]">{remaining.hours}:{remaining.minutes}:{remaining.seconds}</div>
      <p className="mt-1 text-[11px] text-blue-100">Eleições terminam às 18h</p>
    </div>
  );
}

function ResultRow({ candidate, totalVotes, maxVotes }: { candidate: CandidateResult; totalVotes: number; maxVotes: number }) {
  const percentage = maxVotes ? (candidate.votes / maxVotes) * 100 : 0;
  const relativeTotal = totalVotes > 0 ? ((candidate.votes / totalVotes) * 100).toFixed(1) : '0.0';
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-md bg-slate-200 text-[11px] font-semibold text-slate-700">{candidate.avatar}</div>
          <div><p className="text-[13px] font-semibold text-slate-800">{candidate.name}</p><p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">{candidate.listName}</p></div>
        </div>
        <div className="text-right text-[12px]"><p className="font-semibold text-slate-700">{formatNumber(candidate.votes)}</p><p className="text-slate-400">({relativeTotal}%)</p></div>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-blue-700" style={{ width: `${percentage}%` }} /></div>
    </div>
  );
}

export function CommissionDashboardPage() {
  const [elections, setElections] = useStoredState<Election[]>(STORAGE_KEYS.elections, INITIAL_ELECTIONS);
  const [message, setMessage] = useState('');
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [editingElection, setEditingElection] = useState<Election | null>(null);

  function saveElection(election: Election) {
    setElections((prev) => {
      const exists = prev.some((item) => item.id === election.id);
      return exists ? prev.map((item) => (item.id === election.id ? election : item)) : [election, ...prev];
    });
    setShowCreateCard(false);
    setEditingElection(null);
    setMessage('Eleição guardada com sucesso.');
  }

  function removeElection(election: Election) {
    setElections((prev) => prev.filter((item) => item.id !== election.id));
    setMessage(`A eleição “${election.name}” foi removida.`);
    if (selectedElection?.id === election.id) setSelectedElection(null);
  }

  return (
    <AppShell active="overview" title="Painel de Controlo" actions={<PrimaryButton type="button" onClick={() => { setShowCreateCard((prev) => !prev); setEditingElection(null); }}><Plus className="mr-2 h-4 w-4" />Nova Eleição</PrimaryButton>}>
      {showCreateCard && <div className="mb-6"><AddElectionPanel onCreate={saveElection} initialElection={editingElection} onCancel={() => { setShowCreateCard(false); setEditingElection(null); }} /></div>}
      {selectedElection && <div className="mb-6"><ElectionDetailCard election={selectedElection} onClose={() => setSelectedElection(null)} /></div>}
      <ElectionTable elections={elections} message={message} onView={setSelectedElection} onEdit={(election) => { setEditingElection(election); setShowCreateCard(true); }} onDelete={removeElection} />
    </AppShell>
  );
}

export function CommissionElectionsPage() {
  const [elections, setElections] = useStoredState<Election[]>(STORAGE_KEYS.elections, INITIAL_ELECTIONS);
  const [message, setMessage] = useState('');
  const [editingElection, setEditingElection] = useState<Election | null>(null);

  function saveElection(election: Election) {
    setElections((prev) => {
      const exists = prev.some((item) => item.id === election.id);
      return exists ? prev.map((item) => (item.id === election.id ? election : item)) : [election, ...prev];
    });
    setEditingElection(null);
    setMessage('Processo eleitoral guardado com sucesso.');
  }

  return (
    <AppShell active="elections" title="Configurar Processo Eleitoral">
      {message && <div className="mb-4 rounded-sm border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700">{message}</div>}
      <AddElectionPanel onCreate={saveElection} initialElection={editingElection} onCancel={() => setEditingElection(null)} />
      <div className="mt-6 rounded-sm border border-blue-100 bg-blue-50 px-4 py-3 text-[12px] text-blue-700">
        A activação e o encerramento ocorrem automaticamente de acordo com as datas e horas definidas na programação da eleição.
      </div>
    </AppShell>
  );
}

export function CommissionResultsPage() {
  const [elections] = useStoredState<Election[]>(STORAGE_KEYS.elections, INITIAL_ELECTIONS);
  const resultElections = elections.filter((item) => item.status === 'activa' || item.status === 'encerrada');
  const [selectedElectionId, setSelectedElectionId] = useState<string>(resultElections[0]?.id ?? '');
  const selectedElection = resultElections.find((item) => item.id === selectedElectionId) ?? resultElections[0];
  const electionResults = INITIAL_RESULTS.filter((item) => item.electionId === selectedElection?.id);
  const maxVotes = useMemo(() => Math.max(0, ...electionResults.map((item) => item.votes)), [electionResults]);
  const totalVotes = electionResults.reduce((sum, item) => sum + item.votes, 0);
  const participation = selectedElection ? calculateParticipation(selectedElection.registeredVotes, selectedElection.eligibleStudents || 1) : 0;

  return (
    <AppShell active="results" title="Resultados da Eleição" actions={<PrimaryButton><FileDown className="mr-2 h-4 w-4" />Exportar PDF</PrimaryButton>}>
      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {resultElections.map((election) => {
          const meta = getStatusMeta(election.status);
          const selected = election.id === selectedElection?.id;
          return (
            <button key={election.id} type="button" onClick={() => setSelectedElectionId(election.id)} className={`rounded-sm border bg-white p-4 text-left shadow-[0_0_0_1px_rgba(15,23,42,0.04)] transition ${selected ? 'border-blue-500 ring-2 ring-blue-100' : 'border-transparent'}`}>
              <div className="mb-3 flex items-center justify-between gap-3"><span className={`inline-flex rounded px-2 py-1 text-[10px] font-semibold ${meta.className}`}>{meta.label}</span><Vote className="h-4 w-4 text-blue-600" /></div>
              <p className="text-[15px] font-semibold text-slate-900">{election.name}</p>
              <p className="mt-1 text-[12px] text-slate-500">{election.subtitle}</p>
              <p className="mt-3 text-[12px] text-slate-500">{election.startDate} — {election.endDate}</p>
            </button>
          );
        })}
      </div>

      {selectedElection ? (
        <>
          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <PageSection title={`Monitoramento — ${selectedElection.name}`}>
              <div className="grid gap-4 md:grid-cols-3">
                <div><p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Estudantes Elegíveis</p><p className="mt-2 text-[24px] font-semibold text-slate-800">{formatNumber(selectedElection.eligibleStudents)}</p></div>
                <div><p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Total de Votos</p><p className="mt-2 text-[24px] font-semibold text-slate-800">{formatNumber(selectedElection.registeredVotes)}</p></div>
                <div><p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Taxa de Participação</p><p className="mt-2 text-[24px] font-semibold text-blue-700">{participation}%</p><div className="mt-2 h-1.5 w-full rounded-full bg-slate-200"><div className="h-full rounded-full bg-blue-700" style={{ width: `${Math.min(participation, 100)}%` }} /></div></div>
              </div>
            </PageSection>
            {selectedElection.status === 'activa' ? <CountdownCard /> : <div className="flex min-h-[118px] flex-col justify-center rounded-sm bg-slate-800 px-6 py-4 text-white"><div className="mb-2 text-[10px] uppercase tracking-[0.16em] text-slate-300">Estado Final</div><div className="text-[26px] font-semibold">Eleição Encerrada</div><p className="mt-1 text-[11px] text-slate-300">Os resultados abaixo representam a apuração final.</p></div>}
          </div>

          <div className="mt-8 rounded-sm bg-white p-4 shadow-[0_0_0_1px_rgba(15,23,42,0.04)]">
            <h2 className="mb-6 text-[14px] font-semibold text-slate-900">Resultados — {selectedElection.roles[0] ?? 'Cargo Principal'}</h2>
            <div className="space-y-5">
              {electionResults.length ? electionResults.map((candidate) => <ResultRow key={candidate.id} candidate={candidate} totalVotes={totalVotes} maxVotes={maxVotes} />) : <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-5 text-[13px] text-slate-500">Ainda não há resultados registados para esta eleição.</div>}
            </div>
          </div>
        </>
      ) : <div className="rounded-md border border-slate-200 bg-white px-4 py-5 text-[13px] text-slate-500 shadow-[0_0_0_1px_rgba(15,23,42,0.04)]">Não existem eleições activas ou encerradas disponíveis para mostrar resultados.</div>}
    </AppShell>
  );
}

export function CommissionCandidatesPage() {
  const [elections] = useStoredState<Election[]>(STORAGE_KEYS.elections, INITIAL_ELECTIONS);
  const [selectedElectionId, setSelectedElectionId] = useState<string>('todos');
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateItem | null>(null);

  const candidates = useMemo(() => {
    if (selectedElectionId === 'todos') return INITIAL_CANDIDATES;
    return INITIAL_CANDIDATES.filter((candidate) => candidate.electionId === selectedElectionId);
  }, [selectedElectionId]);

  return (
    <AppShell active="candidates" title="Candidatos">
      <PageSection title="Lista de Candidatos">
        <div className="mb-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => setSelectedElectionId('todos')} className={`rounded-md px-3 py-2 text-[12px] font-semibold ${selectedElectionId === 'todos' ? 'bg-blue-600 text-white' : 'border border-slate-300 bg-white text-slate-700'}`}>Todas as Eleições</button>
          {elections.map((election) => <button key={election.id} type="button" onClick={() => setSelectedElectionId(election.id)} className={`rounded-md px-3 py-2 text-[12px] font-semibold ${selectedElectionId === election.id ? 'bg-blue-600 text-white' : 'border border-slate-300 bg-white text-slate-700'}`}>{election.name}</button>)}
        </div>

        <div className="overflow-hidden rounded-md border border-slate-200">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-[0.16em] text-slate-400">
              <tr>
                <th className="px-4 py-3">Candidato</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Cargo</th>
                <th className="px-4 py-3">Lista</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {candidates.map((candidate) => (
                <tr key={candidate.id}>
                  <td className="px-4 py-4 font-semibold text-slate-800">{candidate.name}</td>
                  <td className="px-4 py-4 text-slate-600">{candidate.email}</td>
                  <td className="px-4 py-4">{candidate.role}</td>
                  <td className="px-4 py-4">{candidate.listName}</td>
                  <td className="px-4 py-4"><span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">{candidate.status}</span></td>
                  <td className="px-4 py-4"><div className="flex justify-end gap-2"><SecondaryButton type="button" onClick={() => setSelectedCandidate(candidate)} className="h-8 px-3">Ver</SecondaryButton></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageSection>

      {selectedCandidate && (
        <div className="mt-6 rounded-sm bg-white p-5 shadow-[0_0_0_1px_rgba(15,23,42,0.04)]">
          <div className="mb-5 flex items-center justify-between gap-4"><div><h2 className="text-[18px] font-semibold text-slate-900">Detalhes do Candidato</h2><p className="text-[12px] text-slate-500">Consulta completa da candidatura submetida.</p></div><SecondaryButton type="button" onClick={() => setSelectedCandidate(null)} className="h-9">Fechar</SecondaryButton></div>
          <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
            <img src={selectedCandidate.image} alt={selectedCandidate.name} className="h-[220px] w-full rounded-md object-cover" />
            <div className="space-y-4">
              <div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Nome</p><p className="mt-1 text-[16px] font-semibold text-slate-900">{selectedCandidate.name}</p></div>
              <div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Email</p><p className="mt-1 text-[14px] text-slate-700">{selectedCandidate.email}</p></div>
              <div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Cargo / Lista</p><p className="mt-1 text-[14px] text-slate-700">{selectedCandidate.role} — {selectedCandidate.listName}</p></div>
              <div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Biografia</p><p className="mt-1 text-[14px] leading-7 text-slate-700">{selectedCandidate.biography}</p></div>
              <div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Proposta</p><p className="mt-1 text-[14px] leading-7 text-slate-700">{selectedCandidate.proposal}</p></div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export function CommissionStudentsPage() {
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null);

  const students = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return INITIAL_STUDENTS;
    return INITIAL_STUDENTS.filter((student) => [student.name, student.email, student.faculty, student.course, student.id].some((value) => value.toLowerCase().includes(query)));
  }, [search]);

  const eligibleCount = students.filter((student) => student.eligible).length;

  return (
    <AppShell active="students" title="Lista de Estudantes">
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard label="Total de Estudantes" value={String(INITIAL_STUDENTS.length)} icon={<Users className="h-4 w-4 text-blue-600" />} />
        <StatCard label="Elegíveis" value={String(eligibleCount)} icon={<Check className="h-4 w-4 text-blue-600" />} />
        <StatCard label="Faculdades Abrangidas" value={String(new Set(INITIAL_STUDENTS.map((student) => student.faculty)).size)} icon={<GraduationCap className="h-4 w-4 text-blue-600" />} />
      </div>

      <PageSection title="Gestão de Elegibilidade" right={<div className="relative w-full max-w-[320px]"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><TextInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar estudante" className="pl-10" /></div>}>
        <div className="overflow-hidden rounded-md border border-slate-200">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-[0.16em] text-slate-400">
              <tr>
                <th className="px-4 py-3">Estudante</th>
                <th className="px-4 py-3">Faculdade</th>
                <th className="px-4 py-3">Curso</th>
                <th className="px-4 py-3">Elegibilidade</th>
                <th className="px-4 py-3 text-right">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {students.map((student) => (
                <tr key={student.id}>
                  <td className="px-4 py-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-[12px] font-semibold text-blue-700">{student.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</div><div><p className="font-semibold text-slate-800">{student.name}</p><p className="text-[11px] text-slate-500">{student.email}</p></div></div></td>
                  <td className="px-4 py-4">{student.faculty}</td>
                  <td className="px-4 py-4">{student.course}</td>
                  <td className="px-4 py-4"><span className={`rounded-full px-3 py-1 text-[10px] font-semibold ${student.eligible ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>{student.eligible ? 'ELEGÍVEL' : 'INATIVO'}</span></td>
                  <td className="px-4 py-4 text-right"><SecondaryButton type="button" onClick={() => setSelectedStudent(student)} className="h-8 px-3">Ver</SecondaryButton></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageSection>

      {selectedStudent && (
        <div className="mt-6 rounded-sm bg-white p-5 shadow-[0_0_0_1px_rgba(15,23,42,0.04)]">
          <div className="mb-5 flex items-center justify-between gap-4"><div><h2 className="text-[18px] font-semibold text-slate-900">Perfil do Estudante</h2><p className="text-[12px] text-slate-500">Consulta detalhada do estudante elegível.</p></div><SecondaryButton type="button" onClick={() => setSelectedStudent(null)} className="h-9">Fechar</SecondaryButton></div>
          <div className="grid gap-4 md:grid-cols-2">
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Número</p><p className="mt-1 text-[14px] text-slate-700">{selectedStudent.id}</p></div>
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Nome</p><p className="mt-1 text-[14px] font-semibold text-slate-900">{selectedStudent.name}</p></div>
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Email</p><p className="mt-1 text-[14px] text-slate-700">{selectedStudent.email}</p></div>
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Ano</p><p className="mt-1 text-[14px] text-slate-700">{selectedStudent.year}</p></div>
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Faculdade</p><p className="mt-1 text-[14px] text-slate-700">{selectedStudent.faculty}</p></div>
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Curso</p><p className="mt-1 text-[14px] text-slate-700">{selectedStudent.course}</p></div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export function CommissionCommitteePage() {
  return (
    <AppShell active="committee" title="Comissão Eleitoral">
      <PageSection title="Membros da Comissão">
        <div className="grid gap-4 md:grid-cols-3">
          {INITIAL_MEMBERS.map((member) => (
            <div key={member.id} className="rounded-md border border-slate-200 bg-white p-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-[12px] font-semibold text-slate-700">{member.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</div>
              <p className="text-[14px] font-semibold text-slate-800">{member.name}</p>
              <p className="mt-1 text-[12px] text-slate-500">{member.role}</p>
              <p className="mt-1 text-[11px] text-slate-400">{member.email}</p>
              <span className="mt-3 inline-flex rounded bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">{member.status}</span>
            </div>
          ))}
        </div>
      </PageSection>
    </AppShell>
  );
}

export function CommissionSettingsPage() {
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
    <AppShell active="settings" title="Configurações da Comissão">
      {message && <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700">{message}</div>}
      {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-600">{error}</div>}
      <div className="grid gap-4 lg:grid-cols-2">
        <PageSection title="Perfil do Utilizador">
          <div className="space-y-4 text-[12px] text-slate-600">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 overflow-hidden rounded-full bg-slate-100"><img src={draftPhoto} alt={draftName} className="h-full w-full object-cover" /></div>
              <div className="flex-1"><p className="text-[14px] font-semibold text-slate-900">{profile.name}</p><p className="text-[12px] text-slate-500">{profile.email}</p></div>
            </div>
            <FormField label="Nome"><TextInput value={draftName} onChange={(e) => setDraftName(e.target.value)} /></FormField>
            <FormField label="Foto do Perfil">
              <div className="space-y-2">
                <TextInput value={draftPhoto} onChange={(e) => setDraftPhoto(e.target.value)} placeholder="URL da imagem" />
                <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"><ImageIcon className="mr-2 h-4 w-4" />Carregar Imagem<input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} /></label>
              </div>
            </FormField>
            <PrimaryButton type="button" onClick={saveProfile}><Save className="mr-2 h-4 w-4" />Guardar Perfil</PrimaryButton>
          </div>
        </PageSection>
        <PageSection title="Aparência e Segurança">
          <div className="space-y-4 text-[12px] text-slate-600">
            <FormField label="Tema">
              <div className="flex flex-wrap gap-2">
                {(['Claro', 'Escuro', 'Sistema'] as UserProfile['theme'][]).map((option) => (
                  <button key={option} type="button" onClick={() => setTheme(option)} className={`rounded-md px-3 py-2 text-[12px] font-semibold ${theme === option ? 'bg-blue-600 text-white' : 'border border-slate-300 bg-white text-slate-700'}`}>{option}</button>
                ))}
              </div>
            </FormField>
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

export function CommissionAuditLogsPage() {
  const [filter, setFilter] = useState<'todos' | 'Eleições' | 'Candidaturas' | 'Automação'>('todos');
  const logs = useMemo(() => (filter === 'todos' ? INITIAL_LOGS : INITIAL_LOGS.filter((log) => log.module === filter)), [filter]);
  return (
    <AppShell active="committee" title="Auditoria e Histórico">
      <PageSection title="Registo de Acções" right={<div className="flex gap-2">{(['todos', 'Eleições', 'Candidaturas', 'Automação'] as const).map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-md px-3 py-2 text-[12px] font-semibold ${filter === item ? 'bg-blue-600 text-white' : 'border border-slate-300 bg-white text-slate-700'}`}>{item === 'todos' ? 'Todos' : item}</button>)}</div>}>
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="rounded-md border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-[13px] font-semibold text-slate-800">{log.action}</p><span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">{log.module}</span></div>
              <p className="mt-1 text-[12px] text-slate-500">{log.user}</p>
              <p className="mt-1 text-[11px] text-slate-400">{log.at}</p>
            </div>
          ))}
        </div>
      </PageSection>
    </AppShell>
  );
}
