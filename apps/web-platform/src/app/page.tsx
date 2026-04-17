import Link from 'next/link';
import {
  FolderOpen,
  GraduationCap,
  Banknote,
  Globe,
  BookOpen,
  Users,
  Brain,
  Stethoscope,
  HandHeart,
  Sparkles,
  Check,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-primary selection:text-white">

      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <section className="bg-[#faf7f4] pt-16 pb-12">
        <div className="container mx-auto px-8">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-20">
            {/* Copy */}
            <div className="flex-1 text-center lg:text-left space-y-6">
              <span className="inline-block px-5 py-2 bg-orange-100 text-primary border border-orange-200 rounded-full text-xs font-bold uppercase tracking-widest">
                Rede Missionária Global
              </span>
              <h1 className="text-5xl lg:text-6xl font-display font-bold text-slate-900 leading-[1.1] tracking-tight">
                Conectando{' '}
                <span className="text-primary italic">Missionários</span>,{' '}
                <br className="hidden lg:block" />
                Projetos e Agências
              </h1>
              <p className="text-lg text-slate-500 max-w-xl mx-auto lg:mx-0 leading-loose">
                Descubra projetos missionários, apoie iniciativas e faça parte
                de uma comunidade tecnológica que transforma vidas através do
                evangelho ao redor do mundo.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-8 py-4 bg-primary text-white rounded-xl font-semibold text-base hover:bg-primary/90 active:scale-95 transition-all"
                >
                  Entrar na Rede
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-8 py-4 bg-transparent text-primary border border-primary/30 rounded-xl font-semibold text-base hover:bg-primary/5 hover:border-primary/60 active:scale-95 transition-all"
                >
                  Criar Conta Grátis
                </Link>
              </div>
            </div>

            {/* Logo */}
            <div className="flex-1 flex justify-center">
              <img
                src="/logo.png"
                alt="Globus Dei"
                className="h-52 lg:h-80 w-auto hover:scale-[1.03] transition-transform duration-700 pointer-events-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Benefits ─────────────────────────────────────────────────── */}
      <section className="pt-36 pb-24 bg-white" style={{ paddingBottom: '7rem' }}>
        <div className="container mx-auto px-8">
          {/* Heading */}
          <div className="text-center mb-24">
            <span className="inline-block px-5 py-2 bg-slate-900 text-white rounded-full text-xs font-bold mb-6 uppercase tracking-widest">
              Benefícios da Rede
            </span>
            <h2 className="text-4xl lg:text-5xl font-display font-bold text-slate-900 mb-6 tracking-tight">
              O Que Você Ganha ao Entrar
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Ao se juntar à nossa comunidade, você terá acesso a recursos
              exclusivos para potencializar seu ministério e chamado global.
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                Icon: FolderOpen,
                title: 'Apresente Seus Projetos',
                desc: 'Divulgue suas iniciativas missionárias para uma audiência global de apoiadores e parceiros qualificados.',
              },
              {
                Icon: GraduationCap,
                title: 'Bolsas de Estudo',
                desc: 'Acesse oportunidades de capacitação e formação missionária com bolsas integrais ou parciais de parceiros.',
              },
              {
                Icon: Banknote,
                title: 'Contribuições Financeiras',
                desc: 'Receba apoio direto da rede e do Fundo de Apoio às Missões integrado à plataforma.',
              },
              {
                Icon: Globe,
                title: 'Apoio no Campo',
                desc: 'Suporte logístico, vistos e auxílio operacional para missionários em atividade nas frentes de batalha.',
              },
              {
                Icon: BookOpen,
                title: 'Cursos e Treinamentos',
                desc: 'Acesso a conteúdos exclusivos, cursos e materiais para aprofundamento teológico e linguístico.',
              },
              {
                Icon: Users,
                title: 'Networking Global',
                desc: 'Conecte-se com outros missionários, agências de envio e mentores ministeriais ao redor do mundo.',
              },
            ].map(({ Icon, title, desc }, idx) => (
              <div
                key={idx}
                className="p-10 rounded-2xl border border-slate-100 hover:border-primary/20 transition-colors duration-300 group"
              >
                <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-orange-100 transition-colors">
                  <Icon size={32} className="text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">{title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Fundo de Apoio (Sustainability) ──────────────────────────── */}
      <section className="bg-slate-900 text-white" style={{ padding: '7rem 0' }}>
        <div className="container mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            {/* Left: text */}
            <div>
              <span className="inline-block px-5 py-2 bg-primary/20 text-primary border border-primary/30 rounded-full text-xs font-bold mb-12 uppercase tracking-widest">
                Sustentabilidade
              </span>
              <h2 className="text-4xl lg:text-5xl font-display font-bold mb-10 leading-tight tracking-tight">
                Fundo de Apoio <br />às Missões
              </h2>
              <p className="text-lg text-slate-400 leading-loose max-w-lg">
                Nosso{' '}
                <strong className="text-white font-semibold">Fundo de Apoio às Missões</strong>{' '}
                é alimentado por ideias inovadoras, lucrativas e recorrentes que garantem
                sustentabilidade financeira a longo prazo para todos os projetos da plataforma.
              </p>
            </div>

            {/* Right: checklist */}
            <div className="space-y-8">
              {[
                'Captação através de iniciativas lucrativas corporativas',
                'Análise criteriosa e triagem técnica de necessidades',
                'Distribuição estratégica de recursos para frentes de impacto',
                'Transparência total com prestação de contas automatizada',
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-6 group">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/30 transition-colors">
                    <Check size={18} className="text-primary" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-white text-lg leading-relaxed">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Holistic Care ────────────────────────────────────────────── */}
      <section className="bg-[#faf7f4]" style={{ paddingTop: '8rem', paddingBottom: '7rem' }}>
        <div className="container mx-auto px-8">
          <div className="text-center mb-24">
            <h2 className="text-4xl lg:text-5xl font-display font-bold text-slate-900 mb-6 tracking-tight">
              Cuidado Além do Financeiro
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Cuidamos do missionário de forma integral: emocional, física,
              espiritual e com mentoria estratégica contínua.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                Icon: Brain,
                title: 'Apoio Psicológico',
                desc: 'Sessões individuais e para famílias com psicólogos cristãos especializados.',
                tags: ['Terapia Individual', 'Suporte em Crise'],
                color: 'text-blue-500',
                bg: 'bg-blue-50',
              },
              {
                Icon: Stethoscope,
                title: 'Assistência Médica',
                desc: 'Parcerias para cuidado médico e telemedicina no campo missionário.',
                tags: ['Telemedicina', 'Emergências'],
                color: 'text-red-500',
                bg: 'bg-red-50',
              },
              {
                Icon: HandHeart,
                title: 'Grupo de Intercessão',
                desc: 'Rede de oração contínua 24/7 cobrindo todas as frentes de batalha.',
                tags: ['Oração 24/7', 'Rede Espiritual'],
                color: 'text-purple-500',
                bg: 'bg-purple-50',
              },
              {
                Icon: Sparkles,
                title: 'Acompanhamento',
                desc: 'Mentoria personalizada e supervisão ministerial contínua por especialistas.',
                tags: ['Mentoria VIP', 'Feedback Real'],
                color: 'text-primary',
                bg: 'bg-orange-50',
              },
            ].map(({ Icon, title, desc, tags, color, bg }, i) => (
              <div
                key={i}
                className="bg-white p-10 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors duration-300"
              >
                <div className={`w-16 h-16 ${bg} rounded-2xl flex items-center justify-center mb-8`}>
                  <Icon size={32} className={color} strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">{title}</h3>
                <p className="text-slate-500 mb-8 text-sm leading-relaxed">{desc}</p>
                <div className="space-y-3">
                  {tags.map((tag, id) => (
                    <div key={id} className="flex items-center gap-3 text-sm text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0" />
                      {tag}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-8">
          <div className="bg-primary rounded-3xl px-16 py-24 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
            <h2 className="text-4xl lg:text-6xl font-display font-bold mb-8 relative z-10 tracking-tight">
              Pronto para Fazer a Diferença?
            </h2>
            <p className="text-lg text-orange-100 mb-12 max-w-xl mx-auto relative z-10 leading-relaxed">
              Junte-se a milhares de missionários e agências que já estão
              transformando o mundo através da tecnologia e união.
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

      {/* ─── Stats ────────────────────────────────────────────────────── */}
      <section className="py-24 border-t border-slate-100">
        <div className="container mx-auto px-8 grid grid-cols-2 lg:grid-cols-4 gap-12">
          {[
            { n: '15+', l: 'Projetos Ativos' },
            { n: '15+', l: 'Apoiados' },
            { n: '8+', l: 'Países' },
            { n: '5+', l: 'Agências Parceiras' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-5xl font-display font-black text-slate-900 mb-3">{stat.n}</div>
              <div className="text-slate-400 font-medium uppercase tracking-widest text-xs">{stat.l}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
