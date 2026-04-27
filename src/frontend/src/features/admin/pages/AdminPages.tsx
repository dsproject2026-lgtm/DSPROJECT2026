import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Check,
  Download,
  Eye,
  Filter,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  Users,
  Vote,
} from 'lucide-react';
import { Button, Card, CardContent, Chip, UiPagination, UiSelect, UiTable, toast } from '@/components/ui';

type ElectionStatus = 'ACTIVA' | 'PROGRAMADA' | 'ENCERRADA';
type StudentEligibility = 'ELEGÍVEL' | 'INATIVO';
type MemberStatus = 'ATIVO' | 'INATIVO';
type AdminRole = 'Comissão' | 'Fiscal' | 'Auditor' | 'Patrulha';
type AuditSeverity = 'INFO' | 'ALERTA' | 'CRÍTICO';

type DashboardElectionRow = {
  id: string;
  nome: string;
  subtitulo: string;
  estado: ElectionStatus;
  inicio: string;
  fim: string;
  votos: number;
};

type StudentRow = {
  id: string;
  nome: string;
  email: string;
  numero: string;
  curso: string;
  faculdade: string;
  anoAcademico: string;
  elegibilidade: StudentEligibility;
};

type CandidateRow = {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  eleicao: string;
  biografia: string;
  proposta: string;
  imagem: string;
};

type CommissionMember = {
  id: string;
  nome: string;
  email: string;
  funcao: AdminRole;
  estado: MemberStatus;
};

type AuditLog = {
  id: string;
  origem: string;
  acao: string;
  modulo: string;
  severidade: AuditSeverity;
  dataHora: string;
};

type AdminSettingsState = {
  autoOpenElection: boolean;
  autoCloseElection: boolean;
  allowImmediateResults: boolean;
  blockMultipleVotes: boolean;
  requireEligibilityValidation: boolean;
  enableAuditTrail: boolean;
};

type CandidateFormState = {
  nome: string;
  email: string;
  cargo: string;
  eleicao: string;
  biografia: string;
  proposta: string;
  imagemUrl: string;
};

type StudentDetails = StudentRow | null;

const dashboardInitialRows: DashboardElectionRow[] = [
  {
    id: '1',
    nome: 'Eleições AEUP 2026',
    subtitulo: 'Direção Executiva Central',
    estado: 'ACTIVA',
    inicio: '12/05/2026',
    fim: '18/05/2026',
    votos: 14502,
  },
  {
    id: '2',
    nome: 'Eleições AEUP 2026/2027',
    subtitulo: 'Direção Executiva Central',
    estado: 'PROGRAMADA',
    inicio: '12/06/2026',
    fim: '18/06/2026',
    votos: 0,
  },
  {
    id: '3',
    nome: 'Conselho Universitário',
    subtitulo: 'Representantes Estudantis',
    estado: 'ENCERRADA',
    inicio: '20/05/2026',
    fim: '22/05/2026',
    votos: 14502,
  },
  {
    id: '4',
    nome: 'Assembleia da Faculdade',
    subtitulo: 'Representantes Académicos',
    estado: 'PROGRAMADA',
    inicio: '24/06/2026',
    fim: '26/06/2026',
    votos: 0,
  },
];

const studentsInitialRows: StudentRow[] = [
  {
    id: '1',
    nome: 'António Nkosi',
    email: 'antonio.nkosi@up.ac.mz',
    numero: '2021045922',
    curso: 'Engenharia Informática',
    faculdade: 'Engenharia',
    anoAcademico: '2024',
    elegibilidade: 'ELEGÍVEL',
  },
  {
    id: '2',
    nome: 'Beatriz Sitoe',
    email: 'beatriz.sitoe@up.ac.mz',
    numero: '2020011490',
    curso: 'Lic. em Pedagogia',
    faculdade: 'Educação',
    anoAcademico: '2024',
    elegibilidade: 'ELEGÍVEL',
  },
  {
    id: '3',
    nome: 'João Mondlane',
    email: 'joao.mondlane@up.ac.mz',
    numero: '2019068331',
    curso: 'Economia Aplicada',
    faculdade: 'Economia',
    anoAcademico: '2024',
    elegibilidade: 'INATIVO',
  },
  {
    id: '4',
    nome: 'Lúcia Gove',
    email: 'lucia.gove@up.ac.mz',
    numero: '2021060214',
    curso: 'Biologia Marinha',
    faculdade: 'Ciências',
    anoAcademico: '2024',
    elegibilidade: 'INATIVO',
  },
  {
    id: '5',
    nome: 'Marcos Baloi',
    email: 'marcos.baloi@up.ac.mz',
    numero: '2022023410',
    curso: 'Direito',
    faculdade: 'Direito',
    anoAcademico: '2023',
    elegibilidade: 'ELEGÍVEL',
  },
  {
    id: '6',
    nome: 'Yolanda Matusse',
    email: 'yolanda.matusse@up.ac.mz',
    numero: '2023052198',
    curso: 'Arquitetura',
    faculdade: 'Arquitetura',
    anoAcademico: '2024',
    elegibilidade: 'ELEGÍVEL',
  },
];

const candidatesInitialRows: CandidateRow[] = [
  {
    id: '1',
    nome: 'Artur Mandlate',
    email: 'artur.mandlate@up.ac.mz',
    cargo: 'Presidente',
    eleicao: 'Eleições AEUP 2026',
    biografia: 'Estudante finalista com experiência em liderança estudantil e organização de eventos académicos.',
    proposta: 'Digitalizar processos académicos, reforçar a transparência da associação e melhorar os serviços ao estudante.',
    imagem: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: '2',
    nome: 'Elena Sitoe',
    email: 'elena.sitoe@up.ac.mz',
    cargo: 'Vice-Presidente',
    eleicao: 'Eleições AEUP 2026',
    biografia: 'Estudante com histórico de participação em projectos sociais e representação académica.',
    proposta: 'Aumentar o apoio estudantil, criar mecanismos de escuta activa e fortalecer o acompanhamento administrativo.',
    imagem: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
  },
];

const commissionInitialMembers: CommissionMember[] = [
  {
    id: '1',
    nome: 'João Machava',
    email: 'joao.machava@up.ac.mz',
    funcao: 'Comissão',
    estado: 'ATIVO',
  },
  {
    id: '2',
    nome: 'Paula Cossa',
    email: 'paula.cossa@up.ac.mz',
    funcao: 'Auditor',
    estado: 'ATIVO',
  },
  {
    id: '3',
    nome: 'Carlos Mabote',
    email: 'carlos.mabote@up.ac.mz',
    funcao: 'Fiscal',
    estado: 'INATIVO',
  },
  {
    id: '4',
    nome: 'Marta Chongo',
    email: 'marta.chongo@up.ac.mz',
    funcao: 'Patrulha',
    estado: 'ATIVO',
  },
];

const auditInitialRows: AuditLog[] = [
  {
    id: '1',
    origem: 'Sistema',
    acao: 'Bloqueou tentativa de voto duplicado do estudante 2021045922.',
    modulo: 'Votação',
    severidade: 'CRÍTICO',
    dataHora: '15/05/2026 14:45',
  },
  {
    id: '2',
    origem: 'João Machava',
    acao: 'Criou o cargo “Presidente”.',
    modulo: 'Candidatos',
    severidade: 'INFO',
    dataHora: '15/05/2026 13:20',
  },
  {
    id: '3',
    origem: 'Paula Cossa',
    acao: 'Adicionou novo membro com função Auditor.',
    modulo: 'Comissão',
    severidade: 'ALERTA',
    dataHora: '15/05/2026 12:50',
  },
  {
    id: '4',
    origem: 'Sistema',
    acao: 'Importação CSV concluída com 248 registos válidos.',
    modulo: 'Estudantes',
    severidade: 'INFO',
    dataHora: '15/05/2026 11:18',
  },
];

const initialSettings: AdminSettingsState = {
  autoOpenElection: true,
  autoCloseElection: true,
  allowImmediateResults: false,
  blockMultipleVotes: true,
  requireEligibilityValidation: true,
  enableAuditTrail: true,
};

const initialCandidateForm: CandidateFormState = {
  nome: '',
  email: '',
  cargo: '',
  eleicao: '',
  biografia: '',
  proposta: '',
  imagemUrl: '',
};

function formatDateLabel() {
  return 'Sexta-feira, 15 de Maio de 2026, 14:30';
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-PT').format(value);
}

function electionBadgeColor(estado: ElectionStatus): 'warning' | 'primary' | 'default' {
  if (estado === 'ACTIVA') return 'warning';
  if (estado === 'ENCERRADA') return 'default';
  return 'primary';
}

function studentBadgeColor(elegibilidade: StudentEligibility): 'success' | 'danger' {
  return elegibilidade === 'ELEGÍVEL' ? 'success' : 'danger';
}

function memberBadgeColor(estado: MemberStatus): 'success' | 'danger' {
  return estado === 'ATIVO' ? 'success' : 'danger';
}

function auditBadgeColor(severidade: AuditSeverity): 'primary' | 'warning' | 'danger' {
  if (severidade === 'INFO') return 'primary';
  if (severidade === 'ALERTA') return 'warning';
  return 'danger';
}

function SummaryCard({
  title,
  value,
  icon,
  accent,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  accent?: React.ReactNode;
}) {
  return (
    <Card className="rounded-sm border-[#e2e8f0] shadow-none">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b7280]">{title}</p>
          <div className="text-[#0b73c9]">{icon}</div>
        </div>
        <p className="mt-3 text-[46px] font-semibold leading-none text-[#0b73c9]">{value}</p>
        {accent}
      </CardContent>
    </Card>
  );
}

function SectionHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e2e8f0] px-5 py-4">
      <h2 className="text-[20px] font-semibold text-[#0f2c12]">{title}</h2>
      {right}
    </div>
  );
}

function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-[34px] font-bold leading-tight tracking-[-0.02em] text-[#0f172a]">{title}</h1>
        {subtitle ? <p className="text-sm text-[#475569]">{subtitle}</p> : null}
      </div>
      {actions}
    </header>
  );
}

function FormCard({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-sm border-[#e2e8f0] shadow-none">
      <SectionHeader
        title={title}
        right={
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[#d1d9e6] px-3 py-2 text-sm text-[#475569] hover:bg-[#f8fafc]"
          >
            Fechar
          </button>
        }
      />
      <CardContent className="p-5">{children}</CardContent>
    </Card>
  );
}

function DetailsModal({
  isOpen,
  title,
  onClose,
  children,
}: {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/45 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-md border border-[#d1d9e6] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e2e8f0] px-5 py-4">
          <h3 className="text-lg font-semibold text-[#0f172a]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[#d1d9e6] px-3 py-1.5 text-sm font-semibold text-[#475569] hover:bg-[#f8fafc]"
          >
            Fechar
          </button>
        </div>
        <div className="max-h-[calc(90vh-72px)] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<DashboardElectionRow[]>(dashboardInitialRows);
  const [message, setMessage] = useState<string>('');
  const [selectedElection, setSelectedElection] = useState<DashboardElectionRow | null>(null);
  const activeCount = rows.filter((row) => row.estado === 'ACTIVA').length;
  const totalVotes = rows.reduce((acc, row) => acc + row.votos, 0);
  const eligibleStudents = 28400;
  const participation = ((14502 / eligibleStudents) * 100).toFixed(1);

  useEffect(() => {
    if (message) toast.info(message);
  }, [message]);

  function blockElection(id: string) {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, estado: 'ENCERRADA' } : row)),
    );
    setMessage('Eleição bloqueada com sucesso.');
  }

  return (
    <section className="space-y-6">
      <PageHeader title="Painel de Controlo" subtitle={formatDateLabel()} />

      {message ? (
        <div className="rounded-sm border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3 text-sm text-[#1d4ed8]">{message}</div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Eleições Ativas" value={String(activeCount)} icon={<Vote className="h-4 w-4" />} />
        <SummaryCard title="Total de Votos" value={formatNumber(totalVotes)} icon={<Check className="h-4 w-4" />} />
        <SummaryCard title="Estudantes Elegíveis" value={formatNumber(eligibleStudents)} icon={<Users className="h-4 w-4" />} />
        <SummaryCard
          title="Participação"
          value={`${participation}%`}
          icon={<CalendarDays className="h-4 w-4" />}
          accent={<div className="mt-3 h-[3px] w-[60px] rounded-full bg-[#fbbf24]" />}
        />
      </div>

      <Card className="overflow-hidden rounded-sm border-[#e2e8f0] shadow-none">
        <SectionHeader title="Eleições em Curso e Programadas" />

        <div className="overflow-x-auto">
          <UiTable
            ariaLabel="Eleições em curso e programadas"
            minWidthClassName="min-w-[860px]"
            columns={[
              { id: 'nome', label: 'Nome da eleição', className: 'font-semibold' },
              { id: 'estado', label: 'Estado', className: 'font-semibold' },
              { id: 'inicio', label: 'Início', className: 'font-semibold' },
              { id: 'fim', label: 'Fim', className: 'font-semibold' },
              { id: 'votos', label: 'Votos registados', className: 'font-semibold' },
              { id: 'acoes', label: 'Ações', className: 'text-right font-semibold' },
            ]}
            rows={rows.map((row) => ({
              id: row.id,
              cells: [
                <div key={`${row.id}:nome`}>
                  <p className="text-base font-semibold text-[#0b73c9]">{row.nome}</p>
                  <p className="text-sm text-[#64748b]">{row.subtitulo}</p>
                </div>,
                <Chip
                  key={`${row.id}:estado`}
                  size="sm"
                  variant={row.estado === 'ENCERRADA' ? 'solid' : 'soft'}
                  color={electionBadgeColor(row.estado)}
                  className="rounded-sm px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em]"
                >
                  {row.estado}
                </Chip>,
                <span key={`${row.id}:inicio`} className="text-sm text-[#1e293b]">{row.inicio}</span>,
                <span key={`${row.id}:fim`} className="text-sm text-[#1e293b]">{row.fim}</span>,
                <span key={`${row.id}:votos`} className="text-base font-semibold text-[#0b73c9]">{formatNumber(row.votos)}</span>,
                <div key={`${row.id}:acoes`} className="flex justify-end gap-2 text-[#64748b]">
                  <button type="button" onClick={() => setSelectedElection(row)} className="rounded p-1 transition hover:bg-[#f1f5f9] hover:text-[#0f172a]" aria-label="Visualizar">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => navigate('/admin/configuracoes')} className="rounded p-1 transition hover:bg-[#f1f5f9] hover:text-[#0f172a]" aria-label="Editar">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => blockElection(row.id)} className="rounded p-1 transition hover:bg-[#fef2f2] hover:text-[#dc2626]" aria-label="Deletar">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>,
              ],
            }))}
          />
        </div>
      </Card>

      <DetailsModal
        isOpen={Boolean(selectedElection)}
        title="Detalhes da Eleição"
        onClose={() => setSelectedElection(null)}
      >
        {selectedElection ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">Nome</p>
              <p className="text-base font-semibold text-[#0f172a]">{selectedElection.nome}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">Estado</p>
              <p className="text-base text-[#334155]">{selectedElection.estado}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">Início</p>
              <p className="text-base text-[#334155]">{selectedElection.inicio}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">Fim</p>
              <p className="text-base text-[#334155]">{selectedElection.fim}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">Descrição</p>
              <p className="text-base text-[#334155]">{selectedElection.subtitulo}</p>
            </div>
          </div>
        ) : null}
      </DetailsModal>
    </section>
  );
}

export function AdminStudentsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<StudentRow[]>(studentsInitialRows);
  const [selectedStudent, setSelectedStudent] = useState<StudentDetails>(null);
  const [search, setSearch] = useState('');
  const [faculty, setFaculty] = useState('Todas as Faculdades');
  const [academicYear, setAcademicYear] = useState('2024');
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState<string>('');
  const pageSize = 5;

  useEffect(() => {
    if (message) toast.info(message);
  }, [message]);

  const faculties = ['Todas as Faculdades', ...Array.from(new Set(studentsInitialRows.map((row) => row.faculdade)))];
  const academicYears = ['2024', '2023'];

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const query = search.trim().toLowerCase();
      const matchesQuery =
        query.length === 0 ||
        row.nome.toLowerCase().includes(query) ||
        row.numero.toLowerCase().includes(query) ||
        row.curso.toLowerCase().includes(query);
      const matchesFaculty = faculty === 'Todas as Faculdades' || row.faculdade === faculty;
      const matchesYear = academicYear === 'Todos' || row.anoAcademico === academicYear;
      return matchesQuery && matchesFaculty && matchesYear;
    });
  }, [rows, search, faculty, academicYear]);

  const pageRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  function handleImportMock() {
    const newStudent: StudentRow = {
      id: crypto.randomUUID(),
      nome: 'Celma Tivane',
      email: 'celma.tivane@up.ac.mz',
      numero: '2024065101',
      curso: 'Informática de Gestão',
      faculdade: 'Engenharia',
      anoAcademico: '2024',
      elegibilidade: 'ELEGÍVEL',
    };
    setRows((current) => [newStudent, ...current]);
    setMessage('Importação simulada concluída com sucesso. 1 estudante adicionado.');
    setPage(1);
  }

  function deleteStudent(id: string) {
    setRows((current) => current.filter((row) => row.id !== id));
    if (selectedStudent?.id === id) {
      setSelectedStudent(null);
    }
    setMessage('Estudante removido com sucesso.');
  }

  function applyFilters() {
    setPage(1);
    setMessage('Filtros aplicados à listagem.');
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Gestão dos Estudantes"
        actions={
          <Button type="button" className="rounded-md" onClick={handleImportMock}>
            <Upload className="mr-2 h-4 w-4" />
            Importar Estudantes (CSV)
          </Button>
        }
      />

      {message ? (
        <div className="rounded-sm border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3 text-sm text-[#1d4ed8]">{message}</div>
      ) : null}

      <Card className="rounded-sm border-[#e2e8f0] bg-[#eef2f7] shadow-none">
        <CardContent className="grid gap-3 p-4 md:grid-cols-[2fr_1fr_1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nome, Número de Estudante ou Curso"
              className="h-11 w-full rounded-sm border border-[#d1d9e6] bg-white pl-10 pr-3 text-sm text-[#475569] outline-none focus:border-[#0b73c9]"
            />
          </div>

          <UiSelect
            value={faculty}
            onChange={setFaculty}
            ariaLabel="Faculdade"
            options={faculties.map((item) => ({ value: item, label: item }))}
          />

          <UiSelect
            value={academicYear}
            onChange={setAcademicYear}
            ariaLabel="Ano Académico"
            options={academicYears.map((item) => ({ value: item, label: item }))}
          />

          <Button type="button" variant="secondary" className="h-11 rounded-sm border-[#d1d9e6] px-4 text-sm" onClick={applyFilters}>
            <Filter className="mr-2 h-4 w-4" />
            Filtrar
          </Button>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-sm border-[#e2e8f0] shadow-none">
        <SectionHeader
          title="Lista de Estudantes Matriculados"
          right={
            <span className="rounded-sm border border-[#d7deea] bg-[#f8fafc] px-3 py-1 text-sm text-[#64748b]">
              Total: {formatNumber(filteredRows.length)} Registos
            </span>
          }
        />

        <div className="overflow-x-auto">
          <UiTable
            ariaLabel="Lista de estudantes"
            minWidthClassName="min-w-[900px]"
            paginate={false}
            columns={[
              { id: 'estudante', label: 'Estudante', className: 'font-semibold' },
              { id: 'numero', label: 'Nº Estudante', className: 'font-semibold' },
              { id: 'curso', label: 'Curso', className: 'font-semibold' },
              { id: 'elegibilidade', label: 'Elegibilidade', className: 'font-semibold' },
              { id: 'acoes', label: 'Ações', className: 'text-right font-semibold' },
            ]}
            rows={pageRows.map((row) => ({
              id: row.id,
              cells: [
                <div key={`${row.id}:student`} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dbeafe] text-xs font-semibold text-[#1d4ed8]">
                    {row.nome.split(' ').slice(0, 2).map((part) => part[0]).join('')}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-[#0f172a]">{row.nome}</p>
                    <p className="text-sm text-[#64748b]">{row.email}</p>
                  </div>
                </div>,
                <span key={`${row.id}:numero`} className="text-base text-[#334155]">{row.numero}</span>,
                <span key={`${row.id}:curso`} className="text-base text-[#334155]">{row.curso}</span>,
                <Chip
                  key={`${row.id}:elig`}
                  size="sm"
                  variant="soft"
                  color={studentBadgeColor(row.elegibilidade)}
                  className="rounded-full px-3 py-1 text-xs font-semibold tracking-[0.08em]"
                >
                  {row.elegibilidade}
                </Chip>,
                <div key={`${row.id}:acoes`} className="flex justify-end gap-2 text-[#64748b]">
                  <button type="button" onClick={() => setSelectedStudent(row)} className="rounded p-1 transition hover:bg-[#f1f5f9] hover:text-[#0f172a]" aria-label="Visualizar">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => navigate('/admin/configuracoes')} className="rounded p-1 transition hover:bg-[#f1f5f9] hover:text-[#0f172a]" aria-label="Editar">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => deleteStudent(row.id)} className="rounded p-1 transition hover:bg-[#fef2f2] hover:text-[#dc2626]" aria-label="Deletar">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>,
              ],
            }))}
          />
        </div>

        <div className="border-t border-[#e2e8f0] px-5 py-4 text-sm text-[#64748b]">
          <UiPagination page={page} setPage={setPage} totalItems={filteredRows.length} itemsPerPage={pageSize} />
        </div>
      </Card>

      <DetailsModal isOpen={Boolean(selectedStudent)} title="Detalhes do Estudante" onClose={() => setSelectedStudent(null)}>
        {selectedStudent ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">Nome</p>
              <p className="text-base font-semibold text-[#0f172a]">{selectedStudent.nome}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">Email</p>
              <p className="text-base text-[#334155]">{selectedStudent.email}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">Número</p>
              <p className="text-base text-[#334155]">{selectedStudent.numero}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">Curso</p>
              <p className="text-base text-[#334155]">{selectedStudent.curso}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">Faculdade</p>
              <p className="text-base text-[#334155]">{selectedStudent.faculdade}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">Elegibilidade</p>
              <p className="text-base text-[#334155]">{selectedStudent.elegibilidade}</p>
            </div>
          </div>
        ) : null}
      </DetailsModal>
    </section>
  );
}

export function AdminCandidatesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isRegisterRoute = location.pathname.endsWith('/registrar');
  const [rows, setRows] = useState<CandidateRow[]>(candidatesInitialRows);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateRow | null>(null);
  const [showAddCard, setShowAddCard] = useState(isRegisterRoute);
  const [showAddCargoCard, setShowAddCargoCard] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState<CandidateFormState>(initialCandidateForm);
  const [cargoName, setCargoName] = useState('');
  const [availableCargos, setAvailableCargos] = useState<string[]>([
    'Presidente',
    'Vice-Presidente',
    'Secretário Geral',
    'Representante Titular',
    'Representante Suplente',
  ]);
  const electionOptions = Array.from(new Set(dashboardInitialRows.map((row) => row.nome)));

  useEffect(() => {
    if (message) toast.info(message);
  }, [message]);

  useEffect(() => {
    if (error) toast.danger(error);
  }, [error]);

  useEffect(() => {
    setShowAddCard(isRegisterRoute);
  }, [isRegisterRoute]);

  function addCargo() {
    const clean = cargoName.trim();
    if (!clean) {
      setError('Indica o nome do cargo antes de adicionar.');
      return;
    }
    if (availableCargos.includes(clean)) {
      setError('Este cargo já existe na lista.');
      return;
    }
    setAvailableCargos((current) => [...current, clean]);
    setCargoName('');
    setShowAddCargoCard(false);
    setError('');
    setMessage('Cargo adicionado com sucesso.');
  }

  function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setForm((current) => ({ ...current, imagemUrl: result }));
      setMessage('Imagem carregada com sucesso.');
    };
    reader.readAsDataURL(file);
  }

  function addCandidate() {
    const values = [form.nome, form.email, form.cargo, form.eleicao, form.biografia, form.proposta, form.imagemUrl];
    if (values.some((value) => !value.trim())) {
      setError('Preenche todos os campos do candidato antes de guardar.');
      return;
    }

    const newCandidate: CandidateRow = {
      id: crypto.randomUUID(),
      nome: form.nome,
      email: form.email,
      cargo: form.cargo,
      eleicao: form.eleicao,
      biografia: form.biografia,
      proposta: form.proposta,
      imagem: form.imagemUrl,
    };

    setRows((current) => [newCandidate, ...current]);
    setForm(initialCandidateForm);
    setShowAddCard(false);
    setShowAddCargoCard(false);
    setError('');
    setMessage('Candidato adicionado com sucesso.');
    navigate('/admin/candidatos/visualizar');
  }

  function deleteCandidate(id: string) {
    setRows((current) => current.filter((row) => row.id !== id));
    if (selectedCandidate?.id === id) {
      setSelectedCandidate(null);
    }
    setMessage('Candidato eliminado com sucesso.');
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Gestão de Candidatos"
        actions={
          <Button type="button" className="rounded-md" onClick={() => navigate('/admin/candidatos/registrar')}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Candidato
          </Button>
        }
      />

      {message ? (
        <div className="rounded-sm border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3 text-sm text-[#1d4ed8]">{message}</div>
      ) : null}
      {error ? (
        <div className="rounded-sm border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#dc2626]">{error}</div>
      ) : null}

      {showAddCard ? (
        <FormCard title="Adicionar Novo Candidato" onClose={() => navigate('/admin/candidatos/visualizar')}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">Nome</label>
              <input
                value={form.nome}
                onChange={(e) => setForm((current) => ({ ...current, nome: e.target.value }))}
                className="h-11 w-full rounded-sm border border-[#d1d9e6] bg-white px-3 text-sm text-[#475569] outline-none focus:border-[#0b73c9]"
                placeholder="Nome completo"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">Email</label>
              <input
                value={form.email}
                onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
                className="h-11 w-full rounded-sm border border-[#d1d9e6] bg-white px-3 text-sm text-[#475569] outline-none focus:border-[#0b73c9]"
                placeholder="email@up.ac.mz"
              />
            </div>
            <div className="md:col-span-2">
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">Cargo</label>
                <button
                  type="button"
                  onClick={() => setShowAddCargoCard((current) => !current)}
                  className="rounded-md border border-[#d1d9e6] px-3 py-2 text-xs font-semibold text-[#475569] hover:bg-[#f8fafc]"
                >
                  Adicionar Cargo
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {availableCargos.map((cargo) => {
                  const isSelected = form.cargo === cargo;
                  return (
                    <button
                      key={cargo}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, cargo }))}
                      className={`rounded-md px-3 py-2 text-sm font-semibold ${
                        isSelected
                          ? 'bg-[#0b73c9] text-white'
                          : 'border border-[#d1d9e6] text-[#475569] hover:bg-[#f8fafc]'
                      }`}
                    >
                      {cargo}
                    </button>
                  );
                })}
              </div>
            </div>

            {showAddCargoCard ? (
              <div className="md:col-span-2">
                <Card className="rounded-sm border-[#e2e8f0] shadow-none">
                  <CardContent className="flex flex-col gap-3 p-4 md:flex-row">
                    <input
                      value={cargoName}
                      onChange={(e) => setCargoName(e.target.value)}
                      className="h-11 flex-1 rounded-sm border border-[#d1d9e6] bg-white px-3 text-sm text-[#475569] outline-none focus:border-[#0b73c9]"
                      placeholder="Nome do cargo"
                    />
                    <Button type="button" className="rounded-md" onClick={addCargo}>
                      Guardar Cargo
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : null}

            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">Eleição</label>
              <UiSelect
                value={form.eleicao}
                onChange={(eleicao) => setForm((current) => ({ ...current, eleicao }))}
                placeholder="Seleccionar eleição"
                ariaLabel="Eleição"
                options={electionOptions.map((option) => ({
                  value: option,
                  label: option,
                }))}
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">Biografia</label>
              <textarea
                value={form.biografia}
                onChange={(e) => setForm((current) => ({ ...current, biografia: e.target.value }))}
                className="min-h-[110px] w-full rounded-sm border border-[#d1d9e6] bg-white px-3 py-3 text-sm text-[#475569] outline-none focus:border-[#0b73c9]"
                placeholder="Resumo biográfico do candidato"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">Proposta</label>
              <textarea
                value={form.proposta}
                onChange={(e) => setForm((current) => ({ ...current, proposta: e.target.value }))}
                className="min-h-[110px] w-full rounded-sm border border-[#d1d9e6] bg-white px-3 py-3 text-sm text-[#475569] outline-none focus:border-[#0b73c9]"
                placeholder="Principais propostas do candidato"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">Imagem por URL</label>
              <input
                value={form.imagemUrl}
                onChange={(e) => setForm((current) => ({ ...current, imagemUrl: e.target.value }))}
                className="h-11 w-full rounded-sm border border-[#d1d9e6] bg-white px-3 text-sm text-[#475569] outline-none focus:border-[#0b73c9]"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">Ou fazer upload</label>
              <label className="flex h-11 cursor-pointer items-center justify-center rounded-sm border border-dashed border-[#d1d9e6] bg-white px-3 text-sm text-[#475569] hover:bg-[#f8fafc]">
                <Upload className="mr-2 h-4 w-4" />
                Escolher imagem
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="button" className="rounded-md" onClick={addCandidate}>
                Guardar Candidato
              </Button>
            </div>
          </div>
        </FormCard>
      ) : null}

      <Card className="overflow-hidden rounded-sm border-[#e2e8f0] shadow-none">
        <SectionHeader title="Lista de Candidatos" />
        <div className="overflow-x-auto">
          <UiTable
            ariaLabel="Lista de candidatos"
            minWidthClassName="min-w-[1040px]"
            columns={[
              { id: 'nome', label: 'Nome', className: 'font-semibold' },
              { id: 'email', label: 'Email', className: 'font-semibold' },
              { id: 'cargo', label: 'Cargo', className: 'font-semibold' },
              { id: 'eleicao', label: 'Eleição', className: 'font-semibold' },
              { id: 'acoes', label: 'Ações', className: 'text-right font-semibold' },
            ]}
            rows={rows.map((row) => ({
              id: row.id,
              cells: [
                <span key={`${row.id}:nome`} className="font-semibold text-[#0f172a]">{row.nome}</span>,
                <span key={`${row.id}:email`} className="text-[#334155]">{row.email}</span>,
                <span key={`${row.id}:cargo`} className="text-[#334155]">{row.cargo}</span>,
                <span key={`${row.id}:eleicao`} className="text-[#334155]">{row.eleicao}</span>,
                <div key={`${row.id}:acoes`} className="flex justify-end gap-2 text-[#64748b]">
                  <button type="button" onClick={() => setSelectedCandidate(row)} className="rounded p-1 transition hover:bg-[#f1f5f9] hover:text-[#0f172a]" aria-label="Visualizar">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => navigate('/admin/configuracoes')} className="rounded p-1 transition hover:bg-[#f1f5f9] hover:text-[#0f172a]" aria-label="Editar">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => deleteCandidate(row.id)} className="rounded p-1 transition hover:bg-[#fef2f2] hover:text-[#dc2626]" aria-label="Deletar">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>,
              ],
            }))}
          />
        </div>
      </Card>

      <DetailsModal
        isOpen={Boolean(selectedCandidate)}
        title="Detalhes do Candidato"
        onClose={() => setSelectedCandidate(null)}
      >
        {selectedCandidate ? (
          <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
            <div>
              <img
                src={selectedCandidate.imagem}
                alt={selectedCandidate.nome}
                className="h-[220px] w-full rounded-md object-cover"
              />
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">Nome</p>
                <p className="text-lg font-semibold text-[#0f172a]">{selectedCandidate.nome}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">Email</p>
                <p className="text-base text-[#334155]">{selectedCandidate.email}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">Cargo</p>
                <p className="text-base text-[#334155]">{selectedCandidate.cargo}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">Eleição</p>
                <p className="text-base text-[#334155]">{selectedCandidate.eleicao}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">Biografia</p>
                <p className="text-base leading-7 text-[#334155]">{selectedCandidate.biografia}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">Proposta</p>
                <p className="text-base leading-7 text-[#334155]">{selectedCandidate.proposta}</p>
              </div>
            </div>
          </div>
        ) : null}
      </DetailsModal>
    </section>
  );
}

export function AdminCommissionPage() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<CommissionMember[]>(commissionInitialMembers);
  const [showAddCard, setShowAddCard] = useState(false);
  const [form, setForm] = useState({ nome: '', email: '', funcao: 'Comissão' as AdminRole });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (message) toast.info(message);
  }, [message]);

  useEffect(() => {
    if (error) toast.danger(error);
  }, [error]);

  function addMember() {
    if (!form.nome.trim() || !form.email.trim()) {
      setError('Preenche nome e email antes de adicionar o membro.');
      return;
    }

    setMembers((current) => [
      {
        id: crypto.randomUUID(),
        nome: form.nome,
        email: form.email,
        funcao: form.funcao,
        estado: 'ATIVO',
      },
      ...current,
    ]);
    setForm({ nome: '', email: '', funcao: 'Comissão' });
    setError('');
    setMessage('Membro adicionado com sucesso.');
    setShowAddCard(false);
  }

  function toggleMemberStatus(id: string) {
    setMembers((current) =>
      current.map((member) =>
        member.id === id
          ? { ...member, estado: member.estado === 'ATIVO' ? 'INATIVO' : 'ATIVO' }
          : member,
      ),
    );
    setMessage('Estado do membro actualizado com sucesso.');
  }

  function deleteMember(id: string) {
    setMembers((current) => current.filter((member) => member.id !== id));
    setMessage('Membro removido com sucesso.');
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Gestão da Comissão"
        actions={
          <Button type="button" className="rounded-md" onClick={() => setShowAddCard(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Membro
          </Button>
        }
      />

      {message ? (
        <div className="rounded-sm border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3 text-sm text-[#1d4ed8]">{message}</div>
      ) : null}
      {error ? (
        <div className="rounded-sm border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#dc2626]">{error}</div>
      ) : null}

      {showAddCard ? (
        <FormCard title="Adicionar Membro" onClose={() => setShowAddCard(false)}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">Nome</label>
              <input
                value={form.nome}
                onChange={(e) => setForm((current) => ({ ...current, nome: e.target.value }))}
                className="h-11 w-full rounded-sm border border-[#d1d9e6] bg-white px-3 text-sm text-[#475569] outline-none focus:border-[#0b73c9]"
                placeholder="Nome completo"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">Email</label>
              <input
                value={form.email}
                onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
                className="h-11 w-full rounded-sm border border-[#d1d9e6] bg-white px-3 text-sm text-[#475569] outline-none focus:border-[#0b73c9]"
                placeholder="email@up.ac.mz"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">Função</label>
              <UiSelect
                value={form.funcao}
                onChange={(funcao) => setForm((current) => ({ ...current, funcao: funcao as AdminRole }))}
                ariaLabel="Função"
                options={[
                  { value: 'Comissão', label: 'Comissão' },
                  { value: 'Fiscal', label: 'Fiscal' },
                  { value: 'Auditor', label: 'Auditor' },
                  { value: 'Patrulha', label: 'Patrulha' },
                ]}
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="button" className="rounded-md" onClick={addMember}>
                Guardar Membro
              </Button>
            </div>
          </div>
        </FormCard>
      ) : null}

      <Card className="overflow-hidden rounded-sm border-[#e2e8f0] shadow-none">
        <SectionHeader title="Membros Registados" />
        <div className="overflow-x-auto">
          <UiTable
            ariaLabel="Membros registados"
            minWidthClassName="min-w-[820px]"
            columns={[
              { id: 'nome', label: 'Nome', className: 'font-semibold' },
              { id: 'email', label: 'Email', className: 'font-semibold' },
              { id: 'funcao', label: 'Função', className: 'font-semibold' },
              { id: 'estado', label: 'Estado', className: 'font-semibold' },
              { id: 'acoes', label: 'Ações', className: 'text-right font-semibold' },
            ]}
            rows={members.map((member) => ({
              id: member.id,
              cells: [
                <span key={`${member.id}:nome`} className="font-semibold text-[#0f172a]">{member.nome}</span>,
                <span key={`${member.id}:email`} className="text-[#334155]">{member.email}</span>,
                <span key={`${member.id}:funcao`} className="text-[#334155]">{member.funcao}</span>,
                <Chip key={`${member.id}:estado`} size="sm" variant="soft" color={memberBadgeColor(member.estado)} className="rounded-full px-3 py-1 text-xs font-semibold tracking-[0.08em]">
                  {member.estado}
                </Chip>,
                <div key={`${member.id}:acoes`} className="flex justify-end gap-2 text-[#64748b]">
                  <button type="button" onClick={() => setMessage(`Membro: ${member.nome}`)} className="rounded p-1 transition hover:bg-[#f1f5f9] hover:text-[#0f172a]" aria-label="Visualizar">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => navigate('/admin/configuracoes')} className="rounded p-1 transition hover:bg-[#f1f5f9] hover:text-[#0f172a]" aria-label="Editar">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => deleteMember(member.id)} className="rounded p-1 transition hover:bg-[#fef2f2] hover:text-[#dc2626]" aria-label="Deletar">
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => toggleMemberStatus(member.id)} className="rounded p-1 transition hover:bg-[#f1f5f9] hover:text-[#0f172a]" aria-label="Alternar estado">
                    <Check className="h-4 w-4" />
                  </button>
                </div>,
              ],
            }))}
          />
        </div>
      </Card>
    </section>
  );
}

export function AdminAuditPage() {
  const [rows] = useState<AuditLog[]>(auditInitialRows);
  const [severityFilter, setSeverityFilter] = useState<'TODOS' | AuditSeverity>('TODOS');

  const filteredRows = useMemo(() => {
    if (severityFilter === 'TODOS') return rows;
    return rows.filter((row) => row.severidade === severityFilter);
  }, [rows, severityFilter]);

  return (
    <section className="space-y-6">
      <PageHeader
        title="Auditoria"
        actions={
          <div className="flex gap-2">
            {['TODOS', 'INFO', 'ALERTA', 'CRÍTICO'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setSeverityFilter(item as 'TODOS' | AuditSeverity)}
                className={`rounded-md px-3 py-2 text-sm font-semibold ${severityFilter === item ? 'bg-[#0b73c9] text-white' : 'border border-[#d1d9e6] text-[#475569]'}`}
              >
                {item}
              </button>
            ))}
          </div>
        }
      />

      <Card className="overflow-hidden rounded-sm border-[#e2e8f0] shadow-none">
        <SectionHeader
          title="Logs do Sistema"
          right={
            <Button type="button" variant="secondary" className="rounded-md border-[#d1d9e6]">
              <Download className="mr-2 h-4 w-4" />
              Exportar Logs
            </Button>
          }
        />
        <div className="overflow-x-auto">
          <UiTable
            ariaLabel="Logs do sistema"
            minWidthClassName="min-w-[920px]"
            columns={[
              { id: 'origem', label: 'Origem', className: 'font-semibold' },
              { id: 'acao', label: 'Ação', className: 'font-semibold' },
              { id: 'modulo', label: 'Módulo', className: 'font-semibold' },
              { id: 'severidade', label: 'Severidade', className: 'font-semibold' },
              { id: 'data', label: 'Data/Hora', className: 'font-semibold' },
            ]}
            rows={filteredRows.map((row) => ({
              id: row.id,
              cells: [
                <span key={`${row.id}:origem`} className="font-semibold text-[#0f172a]">{row.origem}</span>,
                <span key={`${row.id}:acao`} className="text-[#334155]">{row.acao}</span>,
                <span key={`${row.id}:modulo`} className="text-[#334155]">{row.modulo}</span>,
                <Chip key={`${row.id}:sev`} size="sm" variant="soft" color={auditBadgeColor(row.severidade)} className="rounded-full px-3 py-1 text-xs font-semibold tracking-[0.08em]">
                  {row.severidade}
                </Chip>,
                <span key={`${row.id}:data`} className="text-[#334155]">{row.dataHora}</span>,
              ],
            }))}
          />
        </div>
      </Card>
    </section>
  );
}

export function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettingsState>(initialSettings);
  const [saved, setSaved] = useState(false);

  function toggleSetting<K extends keyof AdminSettingsState>(key: K) {
    setSettings((current) => ({ ...current, [key]: !current[key] }));
    setSaved(false);
  }

  function saveSettings() {
    setSaved(true);
    toast.success('Configurações guardadas com sucesso.');
  }

  const items: Array<{ key: keyof AdminSettingsState; title: string; description: string }> = [
    {
      key: 'autoOpenElection',
      title: 'Abertura automática das eleições',
      description: 'Inicia a votação automaticamente na data e hora programadas.',
    },
    {
      key: 'autoCloseElection',
      title: 'Encerramento automático das eleições',
      description: 'Bloqueia submissões depois do término do período oficial.',
    },
    {
      key: 'allowImmediateResults',
      title: 'Publicação imediata dos resultados',
      description: 'Permite disponibilizar resultados assim que a eleição encerrar.',
    },
    {
      key: 'blockMultipleVotes',
      title: 'Bloquear votos múltiplos',
      description: 'Garante que cada estudante vote apenas uma vez por eleição.',
    },
    {
      key: 'requireEligibilityValidation',
      title: 'Exigir validação de elegibilidade',
      description: 'Só estudantes válidos podem aparecer como aptos para votar.',
    },
    {
      key: 'enableAuditTrail',
      title: 'Activar trilha de auditoria',
      description: 'Regista eventos críticos, operacionais e administrativos do sistema.',
    },
  ];

  return (
    <section className="space-y-6">
      <PageHeader
        title="Configurações"
        actions={
          <Button type="button" className="rounded-md" onClick={saveSettings}>
            Guardar Alterações
          </Button>
        }
      />

      {saved ? (
        <div className="rounded-sm border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
          Configurações guardadas com sucesso.
        </div>
      ) : null}

      <Card className="rounded-sm border-[#e2e8f0] shadow-none">
        <SectionHeader title="Políticas Globais do Módulo Administrativo" />
        <CardContent className="space-y-4 p-5">
          {items.map((item) => (
            <div key={item.key} className="flex flex-wrap items-center justify-between gap-4 rounded-sm border border-[#e2e8f0] px-4 py-4">
              <div className="max-w-[760px]">
                <p className="text-base font-semibold text-[#0f172a]">{item.title}</p>
                <p className="mt-1 text-sm text-[#64748b]">{item.description}</p>
              </div>

              <button
                type="button"
                onClick={() => toggleSetting(item.key)}
                className={`relative h-7 w-12 rounded-full transition ${settings[item.key] ? 'bg-[#fbbf24]' : 'bg-[#cbd5e1]'}`}
                aria-label={item.title}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${settings[item.key] ? 'left-6' : 'left-1'}`}
                />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
