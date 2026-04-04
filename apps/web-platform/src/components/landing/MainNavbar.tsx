'use client';

import Link from 'next/link';

export function MainNavbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-orange-100">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Globus Dei" className="h-12 w-auto drop-shadow-sm" />
          <span className="font-display font-bold text-2xl text-primary tracking-tight">Globus Dei</span>
        </div>

        <div className="hidden md:flex items-center gap-10 text-sm font-bold text-slate-600 uppercase tracking-widest">
          <Link href="#" className="hover:text-primary transition-colors">Descobrir</Link>
          <Link href="#" className="hover:text-primary transition-colors">Projetos</Link>
          <Link href="#" className="hover:text-primary transition-colors">Sobre Nós</Link>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/onboarding" className="hidden sm:block text-sm font-bold text-slate-700 hover:text-primary transition-colors pr-4">
            Entrar
          </Link>
          <Link 
            href="/onboarding" 
            className="bg-primary text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-orange-100 hover:scale-105 active:scale-95 transition-all text-sm"
          >
            Começar Agora
          </Link>
        </div>
      </div>
    </nav>
  );
}
