'use client';

import Link from 'next/link';

/**
 * Globus Dei Main Landing Page
 * Design System: unified button radius (rounded-xl), no card shadows on light backgrounds.
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-primary selection:text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#faf7f4] py-24 lg:py-32">
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
            <div className="flex-1 text-center lg:text-left space-y-8">
              <span className="inline-block px-4 py-1.5 bg-orange-100 text-primary border border-orange-200 rounded-full text-xs font-bold uppercase tracking-widest">
                Rede Missionária Global
              </span>
              <h1 className="text-5xl lg:text-6xl font-display font-bold text-slate-900 leading-[1.1] tracking-tight">
                Conectando <span className="text-primary italic">Missionários</span>,{' '}
                <br />
                Projetos e Agências
              </h1>
              <p className="text-lg text-slate-500 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Descubra projetos missionários, apoie iniciativas e faça parte de uma comunidade tecnológica que transforma vidas através do evangelho ao redor do mundo.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
                {/* Primary button */}
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-8 py-4 bg-primary text-white rounded-xl font-semibold text-base hover:bg-primary/90 active:scale-95 transition-all"
                >
                  Entrar na Rede
                </Link>
                {/* Ghost button — same radius, no shadow */}
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-8 py-4 bg-transparent text-primary border border-primary/30 rounded-xl font-semibold text-base hover:bg-primary/5 hover:border-primary/60 active:scale-95 transition-all"
                >
                  Criar Conta Grátis
                </Link>
              </div>
            </div>

            <div className="flex-1 flex justify-center relative">
              <img
                src="/logo.png"
                alt="Globus Dei Logo"
                className="h-64 lg:h-[420px] w-auto hover:scale-[1.03] transition-transform duration-700 pointer-events-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-28 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <span className="inline-block px-4 py-1.5 bg-slate-900 text-white rounded-full text-xs font-bold mb-5 uppercase tracking-widest">
              Benefícios da Rede
            </span>
            <h2 className="text-4xl lg:text-5xl font-display font-bold text-slate-900 mb-5 tracking-tight">O Que Você Ganha ao Entrar</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Ao se juntar à nossa comunidade, você terá acesso a recursos exclusivos para potencializar seu ministério e chamado global.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Apresente Seus Projetos', desc: 'Divulgue suas iniciativas missionárias para uma audiência global de apoiadores e parceiros qualificados.', icon: '📋' },
              { title: 'Bolsas de Estudo', desc: 'Acesse oportunidades de capacitação e formação missionária com bolsas integrais ou parciais de parceiros.', icon: '🎓' },
              { title: 'Contribuições Financeiras', desc: 'Receba apoio direto da rede e do Fundo de Apoio às Missões integrado à plataforma.', icon: '💰' },
              { title: 'Apoio no Campo', desc: 'Suporte logístico, vistos e auxílio operacional para missionários em atividade nas frentes de batalha.', icon: '🌍' },
              { title: 'Cursos e Treinamentos', desc: 'Acesso a conteúdos exclusivos, cursos e materiais para aprofundamento teológico e linguístico.', icon: '📚' },
              { title: 'Networking Global', desc: 'Conecte-se com outros missionários, agências de envio e mentores ministeriais ao redor do mundo.', icon: '🤝' },
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-8 rounded-2xl border border-slate-100 hover:border-primary/20 transition-colors duration-300 group">
                <div className="w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:bg-orange-100 transition-colors">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Strategic Support Section - Fundo de Apoio */}
      <section className="py-28 bg-slate-900 text-white overflow-hidden relative">
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <span className="inline-block px-4 py-1.5 bg-primary/20 text-primary border border-primary/30 rounded-full text-xs font-bold mb-6 uppercase tracking-widest">
                Sustentabilidade
              </span>
              <h2 className="text-4xl lg:text-5xl font-display font-bold mb-6 leading-tight tracking-tight">
                Fundo de Apoio <br />às Missões
              </h2>
              <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                Nosso <strong className="text-white">Fundo de Apoio às Missões</strong> é alimentado por ideias inovadoras, lucrativas e recorrentes que garantem sustentabilidade aos projetos.
              </p>
              <div className="space-y-5">
                {[
                  'Captação através de iniciativas lucrativas corporativas',
                  'Análise criteriosa e triagem técnica de necessidades',
                  'Distribuição estratégica de recursos para frentes de impacto',
                  'Transparência total com prestação de contas automatizada',
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                      {i + 1}
                    </div>
                    <span className="text-slate-300 text-base">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/[0.04] p-10 rounded-3xl border border-white/10 text-center">
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-3">Total Distribuído 2024</p>
              <h3 className="text-6xl font-display font-bold text-primary mb-10 tabular-nums">R$ 2,5M+</h3>
              <div className="grid grid-cols-2 gap-4 text-left mb-10">
                <div className="p-5 bg-white/[0.04] rounded-xl border border-white/5">
                  <p className="text-slate-500 text-xs font-bold uppercase mb-1">Projetos Apoiados</p>
                  <p className="text-2xl font-bold">120+</p>
                </div>
                <div className="p-5 bg-white/[0.04] rounded-xl border border-white/5">
                  <p className="text-slate-500 text-xs font-bold uppercase mb-1">Países Alcançados</p>
                  <p className="text-2xl font-bold">45+</p>
                </div>
              </div>
              <button className="w-full py-4 bg-white text-slate-900 font-semibold rounded-xl hover:bg-slate-50 active:scale-95 transition-all text-sm">
                Ver Relatório de Transparência
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Holistic Care Section */}
      <section className="py-28 bg-[#faf7f4]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-display font-bold text-slate-900 mb-5 tracking-tight">Cuidado Além do Financeiro</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Cuidamos do missionário de forma integral: emocional, física, espiritual e mentoria estratégica.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { t: 'Apoio Psicológico', d: 'Sessões individuais e para famílias com psicólogos cristãos especializados.', b: ['Terapia Pessoal', 'Suporte em Crise'], accent: 'bg-blue-500' },
              { t: 'Assistência Médica', d: 'Parcerias para cuidado médico e telemedicina no campo missionário.', b: ['Telemedicina', 'Emergências'], accent: 'bg-red-500' },
              { t: 'Grupo de Intercessão', d: 'Rede de oração contínua 24/7 cobrindo todas frentes de batalha.', b: ['Oração 24/7', 'Rede Espiritual'], accent: 'bg-purple-500' },
              { t: 'Acompanhamento', d: 'Mentoria personalizada e supervisão ministerial contínua.', b: ['Mentoria VIP', 'Feedback Real'], accent: 'bg-primary' },
            ].map((card, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors duration-300">
                <div className={`w-10 h-10 ${card.accent} rounded-lg mb-6`}></div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">{card.t}</h3>
                <p className="text-slate-500 mb-6 text-sm leading-relaxed">{card.d}</p>
                <div className="space-y-2">
                  {card.b.map((item, id) => (
                    <div key={id} className="flex items-center gap-2 text-sm text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0"></div>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="bg-primary rounded-3xl p-16 lg:p-20 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none"></div>
            <h2 className="text-4xl lg:text-6xl font-display font-bold mb-6 relative z-10 tracking-tight">
              Pronto para Fazer a Diferença?
            </h2>
            <p className="text-lg text-orange-100 mb-10 max-w-xl mx-auto relative z-10 leading-relaxed">
              Junte-se a milhares de missionários e agências que já estão transformando o mundo através da tecnologia e união.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-10 py-4 bg-white text-primary font-semibold rounded-xl text-base hover:bg-orange-50 active:scale-95 transition-all relative z-10"
            >
              Criar Minha Conta Agora
            </Link>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 border-t border-slate-100">
        <div className="container mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-10">
          {[
            { n: '500+', l: 'Projetos Ativos' },
            { n: '2.5K+', l: 'Missionários' },
            { n: '80+', l: 'Países' },
            { n: '150+', l: 'Agências Parceiras' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-5xl font-display font-black text-slate-900 mb-2">{stat.n}</div>
              <div className="text-slate-400 font-medium uppercase tracking-widest text-xs">{stat.l}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
