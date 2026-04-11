import { RoleSectionPage } from '@/components/common/RoleSectionPage';
import { Button, Card, CardContent, Chip } from '@/components/ui';

const dashboardSummaryCards = [
  { title: 'Eleições Ativas', value: '2' },
  { title: 'Total de Votos', value: '14.502' },
  { title: 'Estudantes Elegíveis', value: '28.400' },
  { title: 'Participação', value: '51.1%' },
] as const;

const dashboardRows = [
  {
    nome: 'Eleições AEUP 2026',
    subtitulo: 'Direção Executiva Central',
    estado: 'A DECORRER',
    inicio: '12/05/2026',
    fim: '18/05/2026',
    votos: '14.502',
  },
  {
    nome: 'Eleições AEUP 2026',
    subtitulo: 'Direção Executiva Central',
    estado: 'PROGRAMADA',
    inicio: '12/05/2026',
    fim: '18/05/2026',
    votos: '14.502',
  },
  {
    nome: 'Conselho Universitário',
    subtitulo: 'Representantes Estudantis',
    estado: 'ENCERRADAS',
    inicio: '20/05/2026',
    fim: '22/05/2026',
    votos: '0',
  },
] as const;

const studentsRows = [
  {
    nome: 'António Nkosi',
    email: 'antonio.nkosi@up.ac.mz',
    numero: '2021045922',
    curso: 'Engenharia Informática',
    elegibilidade: 'ELEGÍVEL',
  },
  {
    nome: 'Beatriz Sitoe',
    email: 'beatriz.sitoe@up.ac.mz',
    numero: '2020011400',
    curso: 'Lic. em Pedagogia',
    elegibilidade: 'ELEGÍVEL',
  },
  {
    nome: 'João Mondlane',
    email: 'joao.mondlane@up.ac.mz',
    numero: '2019088331',
    curso: 'Economia Aplicada',
    elegibilidade: 'INATIVO',
  },
] as const;

function stateBadgeClass(estado: string) {
  if (estado === 'A DECORRER') {
    return 'warning';
  }

  if (estado === 'ENCERRADAS') {
    return 'default';
  }

  return 'primary';
}

export function AdminDashboardPage() {
  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[34px] font-bold leading-tight tracking-[-0.02em] text-[#0f172a]">
            Painel de Controlo
          </h1>
          <p className="text-sm text-[#475569]">Sexta-feira, 15 de Maio de 2026, 14:30</p>
        </div>

        <Button type="button" className="rounded-xl">
          + Nova Eleição
        </Button>
      </header>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {dashboardSummaryCards.map((card) => (
          <Card key={card.title} className="rounded-sm border-[#e2e8f0] shadow-none">
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b7280]">{card.title}</p>
              <p className="mt-3 text-[46px] font-semibold leading-none text-[#0b73c9]">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden rounded-sm border-[#e2e8f0] shadow-none">
        <div className="border-b border-[#e2e8f0] px-5 py-4">
          <h2 className="text-[22px] font-semibold text-[#0f2c12]">Eleições em Curso e Programadas</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-[#f8fafc] text-[11px] uppercase tracking-[0.16em] text-[#64748b]">
              <tr>
                <th className="px-5 py-3 font-semibold">Nome da eleição</th>
                <th className="px-5 py-3 font-semibold">Estado</th>
                <th className="px-5 py-3 font-semibold">Início</th>
                <th className="px-5 py-3 font-semibold">Fim</th>
                <th className="px-5 py-3 font-semibold">Votos registados</th>
                <th className="px-5 py-3 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {dashboardRows.map((row) => (
                <tr key={`${row.nome}-${row.estado}`}>
                  <td className="px-5 py-4">
                    <p className="text-base font-semibold text-[#0b73c9]">{row.nome}</p>
                    <p className="text-sm text-[#64748b]">{row.subtitulo}</p>
                  </td>
                  <td className="px-5 py-4">
                    <Chip
                      size="sm"
                      variant={row.estado === 'ENCERRADAS' ? 'solid' : 'soft'}
                      color={stateBadgeClass(row.estado) as 'warning' | 'default' | 'primary'}
                      className="rounded-sm px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em]"
                    >
                      {row.estado}
                    </Chip>
                  </td>
                  <td className="px-5 py-4 text-sm text-[#1e293b]">{row.inicio}</td>
                  <td className="px-5 py-4 text-sm text-[#1e293b]">{row.fim}</td>
                  <td className="px-5 py-4 text-base font-semibold text-[#0b73c9]">{row.votos}</td>
                  <td className="px-5 py-4 text-sm text-[#94a3b8]">◉ ◌ ⊘</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}

export function AdminStudentsPage() {
  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[34px] font-bold leading-tight tracking-[-0.02em] text-[#0f172a]">
            Gestão dos Estudantes
          </h1>
        </div>

        <Button type="button" className="rounded-md">
          Importar Estudantes (CSV)
        </Button>
      </header>

      <Card className="rounded-sm border-[#e2e8f0] bg-[#eef2f7] shadow-none">
        <CardContent className="grid gap-3 p-4 md:grid-cols-[2fr_1fr_1fr_auto]">
          <input
            readOnly
            value="Nome, Número de Estudante ou Curso"
            className="h-11 rounded-sm border border-[#d1d9e6] bg-white px-3 text-sm text-[#475569]"
          />
          <input
            readOnly
            value="Todas as Faculdades"
            className="h-11 rounded-sm border border-[#d1d9e6] bg-white px-3 text-sm text-[#475569]"
          />
          <input
            readOnly
            value="2024"
            className="h-11 rounded-sm border border-[#d1d9e6] bg-white px-3 text-sm text-[#475569]"
          />
          <Button type="button" variant="secondary" className="h-11 rounded-sm border-[#d1d9e6] px-4 text-sm">
            Filtrar
          </Button>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-sm border-[#e2e8f0] shadow-none">
        <div className="flex items-center justify-between border-b border-[#e2e8f0] px-5 py-4">
          <h2 className="text-[20px] font-semibold text-[#0b73c9]">Lista de Estudantes Matriculados</h2>
          <span className="rounded-sm border border-[#d7deea] bg-[#f8fafc] px-3 py-1 text-sm text-[#64748b]">
            Total: 1,248 Registos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left">
            <thead className="bg-[#f8fafc] text-[11px] uppercase tracking-[0.16em] text-[#64748b]">
              <tr>
                <th className="px-5 py-3 font-semibold">Estudante</th>
                <th className="px-5 py-3 font-semibold">Nº Estudante</th>
                <th className="px-5 py-3 font-semibold">Curso</th>
                <th className="px-5 py-3 font-semibold">Elegibilidade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {studentsRows.map((row) => (
                <tr key={row.numero}>
                  <td className="px-5 py-4">
                    <p className="text-base font-semibold text-[#0f172a]">{row.nome}</p>
                    <p className="text-sm text-[#64748b]">{row.email}</p>
                  </td>
                  <td className="px-5 py-4 text-base text-[#334155]">{row.numero}</td>
                  <td className="px-5 py-4 text-base text-[#334155]">{row.curso}</td>
                  <td className="px-5 py-4">
                    <Chip
                      size="sm"
                      variant="soft"
                      color={row.elegibilidade === 'ELEGÍVEL' ? 'success' : 'danger'}
                      className="rounded-full px-3 py-1 text-xs font-semibold tracking-[0.08em]"
                    >
                      {row.elegibilidade}
                    </Chip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}

export function AdminCandidatesPage() {
  return (
    <RoleSectionPage
      title="Gestão de Candidatos"
      description="Base da tela para listar, validar e acompanhar candidaturas no contexto administrativo."
    />
  );
}

export function AdminCommissionPage() {
  return (
    <RoleSectionPage
      title="Gestão da Comissão"
      description="Base da tela para estruturar e supervisionar membros da comissão eleitoral."
    />
  );
}

export function AdminAuditPage() {
  return (
    <RoleSectionPage
      title="Auditoria"
      description="Base da tela para rastreabilidade de ações e conformidade do processo eleitoral."
    />
  );
}

export function AdminSettingsPage() {
  return (
    <RoleSectionPage
      title="Configurações"
      description="Base da tela para definir parâmetros globais e políticas do módulo administrativo."
    />
  );
}
