'use client';

import Link from 'next/link';

export function MainFooter() {
  return (
    <footer className="bg-slate-900 text-white py-24 border-t border-slate-800">
      <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-16">
        <div className="col-span-1 md:col-span-1">
          <div className="flex items-center gap-3 mb-8">
            <img src="/logo.png" alt="Globus Dei" className="h-12 w-auto brightness-200 contrast-200" />
            <span className="font-display font-bold text-2xl text-white">Globus Dei</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-sm">
            Conectando o chamado missionário ao redor do globo. Uma plataforma dedicada a projetos e agências com transparência e impacto.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-sm uppercase tracking-widest text-primary mb-8 underline underline-offset-8 decoration-primary/20 transition-all">Explorar</h4>
          <ul className="space-y-4 text-slate-400 text-sm font-medium">
            <li><Link href="#" className="hover:text-white transition-colors">Rede Global</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Projetos Missionários</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Agências Paceiras</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-sm uppercase tracking-widest text-primary mb-8 underline underline-offset-8 decoration-primary/20">Plataforma</h4>
          <ul className="space-y-4 text-slate-400 text-sm font-medium">
            <li><Link href="#" className="hover:text-white transition-colors">Sobre Nós</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Como Ajudar</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Blog Missionário</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-sm uppercase tracking-widest text-primary mb-8 underline underline-offset-8 decoration-primary/20">Suporte</h4>
          <ul className="space-y-4 text-slate-400 text-sm font-medium">
            <li><Link href="#" className="hover:text-white transition-colors">Ajuda</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Privacidade</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Termos de Uso</Link></li>
          </ul>
        </div>
      </div>

      <div className="container mx-auto px-6 mt-24 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-8">
        <p className="text-slate-500 text-sm">
          © 2026 Globus Dei. Todos os direitos reservados.
        </p>
        <div className="flex gap-6 text-slate-500">
           <span className="text-xs uppercase font-black opacity-30">GD CORE v1.0.0</span>
        </div>
      </div>
    </footer>
  );
}
