import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

/**
 * Core authenticated layout wrapper specifically for the internal agent/missionary portal.
 * Ensures the side-nav and top-bar are distinctly separate from the public landing pages.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession();

  if (!session) {
    redirect('/login?callbackUrl=/dashboard');
  }

  return (
    <div className="flex min-h-[calc(100vh-145px)] border-t border-border">
      {/* Sidebar - strictly adhering to the classic minimalist design */}
      <aside className="w-64 border-r border-border bg-muted/40 hidden md:block">
        <nav className="flex flex-col gap-1 p-6">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Painel</span>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded text-primary bg-primary/5 font-medium transition-colors">Visão Geral</a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded text-foreground hover:bg-muted/80 font-medium transition-colors">Meus Projetos</a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded text-foreground hover:bg-muted/80 font-medium transition-colors">Financeiro</a>
          
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 mt-6">Ajustes</span>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded text-foreground hover:bg-muted/80 font-medium transition-colors">Configurações</a>
        </nav>
      </aside>

      {/* Main Data Content Area */}
      <div className="flex-1 overflow-auto bg-background p-8 lg:p-12">
        {children}
      </div>
    </div>
  );
}
