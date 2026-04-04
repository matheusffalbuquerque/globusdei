'use client';

import Link from 'next/link';

/**
 * Globus Dei Main Landing Page
 * Ported and enhanced from the Python prototype with full feature descriptions.
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-primary selection:text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-orange-50 py-24 lg:py-32">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-60"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
            <div className="flex-1 text-center lg:text-left space-y-8">
              <span className="inline-block px-5 py-2 bg-orange-100 text-primary rounded-full text-xs font-black uppercase tracking-widest shadow-sm">
                Rede Missionária Global
              </span>
              <h1 className="text-5xl lg:text-7xl font-display font-bold text-slate-900 leading-[1.1] tracking-tighter">
                Conectando <span className="text-primary italic">Missionários</span>, <br />
                Projetos e Agências
              </h1>
              <p className="text-xl text-slate-500 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
                Descubra projetos missionários, apoie iniciativas e faça parte de uma comunidade tecnológica que transforma vidas através do evangelho ao redor do mundo.
              </p>
              <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start pt-4">
                <Link 
                  href="/login" 
                  className="px-10 py-5 bg-primary text-white rounded-2xl hover:bg-orange-700 transition-all shadow-2xl shadow-orange-200 font-bold text-lg hover:-translate-y-1 active:scale-95"
                >
                  Entrar na Rede
                </Link>
                <Link 
                  href="/register" 
                  className="px-10 py-5 bg-white text-primary border-2 border-primary/20 rounded-2xl hover:bg-orange-50 transition-all font-bold text-lg hover:border-primary/40 shadow-sm"
                >
                  Criar Conta Grátis
                </Link>
              </div>
            </div>

            <div className="flex-1 flex justify-center relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-[100px] opacity-40 animate-pulse"></div>
              <img 
                src="/logo.png" 
                alt="Globus Dei Logo" 
                className="relative h-72 lg:h-[450px] w-auto drop-shadow-[0_35px_35px_rgba(141,71,46,0.3)] hover:scale-105 transition-transform duration-700 pointer-events-none" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section - O Que Você Ganha */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-24">
            <span className="inline-block px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold mb-4 uppercase tracking-tighter">
              BENEFÍCIOS DA REDE
            </span>
            <h2 className="text-4xl lg:text-6xl font-display font-bold text-slate-900 mb-6 tracking-tight">O Que Você Ganha ao Entrar</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">
              Ao se juntar à nossa comunidade, você terá acesso a recursos exclusivos para potencializar seu ministério e chamado global.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[
              { title: "Apresente Seus Projetos", desc: "Divulgue suas iniciativas missionárias para uma audiência global de apoiadores e parceiros qualificados.", icon: "📋" },
              { title: "Bolsas de Estudo", desc: "Acesse oportunidades de capacitação e formação missionária com bolsas integrais ou parciais de parceiros.", icon: "🎓" },
              { title: "Contribuições Financeiras", desc: "Receba apoio direto da rede e do Fundo de Apoio às Missões integrado à plataforma.", icon: "💰" },
              { title: "Apoio no Campo", desc: "Suporte logístico, vistos e auxílio operacional para missionários em atividade nas frentes de batalha.", icon: "🌍" },
              { title: "Cursos e Treinamentos", desc: "Acesso a conteúdos exclusivos, cursos e materiais para aprofundamento teológico e linguístico.", icon: "📚" },
              { title: "Networking Global", desc: "Conecte-se com outros missionários, agências de envio e mentores ministeriais ao redor do mundo.", icon: "🤝" }
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-10 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 group">
                <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition-transform">{item.icon}</div>
                <h3 className="text-2xl font-display font-bold text-slate-900 mb-4 tracking-tight">{item.title}</h3>
                <p className="text-slate-500 leading-relaxed font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Strategic Support Section - Fundo de Apoio */}
      <section className="py-32 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-primary/10 to-transparent"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <span className="inline-block px-4 py-2 bg-primary text-white rounded-full text-xs font-bold mb-6 tracking-widest">
                SUSTENTABILIDADE
              </span>
              <h2 className="text-4xl lg:text-6xl font-display font-bold mb-8 leading-tight tracking-tighter">
                Fundo de Apoio <br />às Missões
              </h2>
              <p className="text-xl text-slate-300 mb-8 leading-relaxed font-medium">
                Nosso <strong className="text-white decoration-primary underline underline-offset-4">Fundo de Apoio às Missões</strong> é alimentado por ideias inovadoras, lucrativas e recorrentes que garantem sustentabilidade aos projetos.
              </p>
              <div className="space-y-6">
                {[
                  "Captação através de iniciativas lucrativas corporativas",
                  "Análise criteriosa e triagem técnica de necessidades",
                  "Distribuição estratégica de recursos para frentes de impacto",
                  "Transparência total com prestação de contas automatizada"
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-4 group">
                    <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold group-hover:bg-primary group-hover:text-white transition-colors">{i+1}</div>
                    <span className="text-slate-300 font-bold text-lg">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl p-12 rounded-[48px] border border-white/10 shadow-3xl text-center">
               <p className="text-slate-400 font-black uppercase tracking-tighter text-sm mb-4">Total Distribuído 2024</p>
               <h3 className="text-7xl font-display font-bold text-primary mb-12 tabular-nums">R$ 2,5M+</h3>
               <div className="grid grid-cols-2 gap-8 text-left">
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                    <p className="text-slate-500 text-xs font-bold uppercase mb-2">Projetos Apoiados</p>
                    <p className="text-2xl font-bold">120+</p>
                  </div>
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                    <p className="text-slate-500 text-xs font-bold uppercase mb-2">Países Alcançados</p>
                    <p className="text-2xl font-bold">45+</p>
                  </div>
               </div>
               <button className="w-full mt-12 bg-white text-slate-900 font-bold py-5 rounded-2xl hover:scale-105 transition-transform">
                  Ver Relatório de Transparência
               </button>
            </div>
          </div>
        </div>
      </section>

      {/* Holistic Care Section */}
      <section className="py-32 bg-orange-50/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="text-4xl lg:text-6xl font-display font-bold text-slate-900 mb-6 tracking-tight">Cuidado Além do Financeiro</h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium">
              Cuidamos do missionário de forma integral: emocional, física, espiritual e mentoria estratégica.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { t: "Apoio Psicológico", d: "Sessões individuais e para famílias com psicólogos cristãos especializados.", b: ["Terapia Pessoal", "Suporte em Crise"], c: "bg-blue-600" },
              { t: "Assistência Médica", d: "Parcerias para cuidado médico e telemedicina no campo missionário.", b: ["Telemedicina", "Emergências"], c: "bg-red-600" },
              { t: "Grupo de Intercessão", d: "Rede de oração contínua 24/7 cobrindo todas frentes de batalha.", b: ["Oração 24/7", "Rede Espiritual"], c: "bg-purple-600" },
              { t: "Acompanhamento", d: "Mentoria personalizada e supervisão ministerial contínua.", b: ["Mentoria VIP", "Feedback Real"], c: "bg-primary" }
            ].map((card, i) => (
              <div key={i} className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 hover:shadow-2xl transition-all duration-500">
                <div className={`w-14 h-14 ${card.c} rounded-2xl mb-8 shadow-lg`}></div>
                <h3 className="text-2xl font-display font-bold text-slate-900 mb-4">{card.t}</h3>
                <p className="text-slate-500 mb-8 font-medium leading-relaxed">{card.d}</p>
                <div className="space-y-3">
                  {card.b.map((item, id) => (
                    <div key={id} className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
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
          <div className="bg-primary rounded-[64px] p-20 text-center text-white relative overflow-hidden shadow-2xl shadow-orange-200">
             <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent"></div>
             <h2 className="text-5xl lg:text-7xl font-display font-bold mb-10 relative z-10 tracking-tight">Pronto para Fazer a Diferença?</h2>
             <p className="text-xl text-orange-50 mb-12 max-w-2xl mx-auto font-medium relative z-10 leading-relaxed">
               Junte-se a milhares de missionários e agências que já estão transformando o mundo através da tecnologia e união.
             </p>
             <Link 
                href="/register"
                className="inline-block px-12 py-6 bg-white text-primary font-black rounded-3xl text-2xl hover:scale-105 active:scale-95 transition-all shadow-xl relative z-10 uppercase tracking-widest text-center"
              >
                Criar Minha Conta Agora
             </Link>
          </div>
        </div>
      </section>

      {/* Final Statistics Footer Section */}
      <section className="py-24 border-t border-slate-100">
        <div className="container mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              { n: "500+", l: "Projetos Ativos" },
              { n: "2.5K+", l: "Missionários" },
              { n: "80+", l: "Países" },
              { n: "150+", l: "Agências Parceiras" }
            ].map((stat, i) => (
              <div key={i} className="text-center group">
                <div className="text-6xl font-display font-black text-slate-900 mb-2 group-hover:text-primary transition-colors">{stat.n}</div>
                <div className="text-slate-400 font-bold uppercase tracking-widest text-sm">{stat.l}</div>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}
