/**
 * Root Dashboard interface mapping active goals, recent financial metrics, and core tasks.
 * Serves as the jumping block for agents post-authentication.
 */
export default function DashboardPage() {
  return (
    <div className="max-w-5xl">
      <header className="mb-8 border-b border-border pb-5">
        <h1 className="text-3xl font-display font-semibold text-foreground tracking-tight">Visão Geral</h1>
        <p className="text-muted-foreground mt-2 text-sm">Acompanhe seu impacto global e o estado das suas campanhas ativas.</p>
      </header>

      {/* Minimalist KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="border border-border rounded p-6 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:border-primary/20 transition-colors">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Apoio Recebido</h3>
          <p className="text-3xl font-display font-bold text-foreground">R$ 14.500</p>
        </div>
        <div className="border border-border rounded p-6 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:border-primary/20 transition-colors">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Projetos Ativos</h3>
          <p className="text-3xl font-display font-bold text-foreground">2</p>
        </div>
        <div className="border border-border rounded p-6 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:border-primary/20 transition-colors">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Novos Apoiadores</h3>
          <p className="text-3xl font-display font-bold text-foreground">12</p>
        </div>
      </div>

      {/* Primary Data Content Mock Section */}
      <section className="border border-border rounded bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-display font-semibold text-foreground">Últimas Transações</h2>
          <button className="text-sm font-medium text-primary hover:underline">Ver todas</button>
        </div>
        <div className="p-8 text-sm text-muted-foreground italic text-center">
          Nenhuma transação processada nos últimos 7 dias.<br/>
          <span className="text-xs mt-2 block opacity-70">(Conecte ao StripeMock via FinanceService na Fase 4+ para renderizar estes cards)</span>
        </div>
      </section>
    </div>
  );
}
