import { Card, CardContent } from '@/components/ui';

interface RoleSectionPageProps {
  title: string;
  description: string;
}

export function RoleSectionPage({ title, description }: RoleSectionPageProps) {
  return (
    <section className="space-y-5">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-[#0f172a]">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-[#475569]">{description}</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-xl border-[#dbe2ec] bg-[#f8fafc] shadow-none">
          <CardContent className="p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">Header</p>
          <p className="mt-2 text-sm text-[#334155]">
            Área reservada para ações rápidas, filtros e estado da secção.
          </p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-[#dbe2ec] bg-[#f8fafc] shadow-none">
          <CardContent className="p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">Conteúdo</p>
          <p className="mt-2 text-sm text-[#334155]">
            Área reservada para tabela/listagem principal da funcionalidade.
          </p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-[#dbe2ec] bg-[#f8fafc] shadow-none">
          <CardContent className="p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">Detalhe</p>
          <p className="mt-2 text-sm text-[#334155]">
            Área reservada para resumo, métricas e ações complementares.
          </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
