'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type AgentStatus = 'ENTERED' | 'SUBMITTED' | 'QUALIFIED' | 'SCHEDULED' | 'FEEDBACK_PROVIDED' | 'APPROVED' | 'REJECTED';

type Announcement = {
  id: string;
  title: string;
  content: string;
  type: 'SYSTEM' | 'MISSION' | 'OPPORTUNITY';
  createdAt: string;
};

type Connection = {
  id: string;
  sender: { id: string, name: string, vocationType: string };
  receiver: { id: string, name: string, vocationType: string };
};

type FollowedInitiative = {
  empreendimento: {
    id: string;
    name: string;
    category: string;
    logoUrl?: string;
  };
};

export default function AgentDashboard() {
  const [activeTab, setActiveTab] = useState<'feed' | 'pessoas' | 'iniciativas' | 'servicos'>('feed');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [following, setFollowing] = useState<FollowedInitiative[]>([]);
  
  // MOCK Agent Data (In a real app, this would come from session/API)
  const agent = {
    id: 'agent-123',
    name: 'Matheus Albuquerque',
    vocationType: 'Tecnologia & Missões',
    status: 'APPROVED' as AgentStatus,
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [annRes, connRes, followRes] = await Promise.all([
        fetch('http://localhost:3001/api/announcements'),
        fetch(`http://localhost:3001/api/connections/${agent.id}`),
        fetch(`http://localhost:3001/api/platform/following/${agent.id}`),
      ]);
      
      if (annRes.ok) setAnnouncements(await annRes.json());
      if (connRes.ok) setConnections(await connRes.json());
      if (followRes.ok) setFollowing(await followRes.json());
    } catch (e) {
      console.error('Error fetching dashboard data:', e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* Platform Sub-Header / Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex gap-8 h-full">
            {[
              { id: 'feed', label: 'Início', icon: '🏠' },
              { id: 'pessoas', label: 'Minha Rede', icon: '👥' },
              { id: 'iniciativas', label: 'Iniciativas', icon: '🚀' },
              { id: 'servicos', label: 'Serviços', icon: '🛠️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 h-full border-b-2 transition-all font-bold text-sm uppercase tracking-wider ${
                  activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-primary font-black">MA</div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Profile Snapshot */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="h-20 bg-gradient-to-r from-primary to-orange-400"></div>
              <div className="px-6 pb-6 -mt-10">
                <div className="w-20 h-20 rounded-2xl bg-white p-1 shadow-lg mb-4">
                  <div className="w-full h-full rounded-xl bg-slate-100 flex items-center justify-center text-3xl font-black text-primary border border-slate-50">MA</div>
                </div>
                <h3 className="text-xl font-display font-bold text-slate-900">{agent.name}</h3>
                <p className="text-sm text-slate-500 font-medium mb-4">{agent.vocationType}</p>
                <div className="pt-4 border-t border-slate-100 flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                  <span>Conexões</span>
                  <span className="text-primary">{connections.length}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <h4 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-widest">Minhas Iniciativas</h4>
              <Link href="/agent/empreendimentos/create" className="text-xs font-bold text-primary hover:underline">+ Criar Novo Projeto</Link>
            </div>
          </div>

          {/* Center Column: Main Content / Feed */}
          <div className="lg:col-span-6 space-y-6">
            
            {activeTab === 'feed' && (
              <div className="space-y-6">
                {/* Official Post Composer (Staff Only simulation UI) */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex gap-4 items-center">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">GD</div>
                    <div className="flex-1 bg-slate-50 rounded-2xl px-6 py-3 text-slate-400 font-medium text-sm">
                       Apenas a Globus Dei publica novidades oficiais aqui...
                    </div>
                  </div>
                </div>

                {/* Announcement List */}
                {announcements.length > 0 ? announcements.map((ann) => (
                  <div key={ann.id} className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                         <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center">
                            <img src="/logo.png" className="h-6 w-auto brightness-200" alt="GD" />
                         </div>
                         <div>
                            <h4 className="font-bold text-slate-900">Globus Dei Oficial</h4>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">{new Date(ann.createdAt).toLocaleDateString('pt-BR')}</p>
                         </div>
                      </div>
                      <span className="px-3 py-1 bg-orange-50 text-primary text-[10px] font-black uppercase rounded-lg border border-orange-100">
                        {ann.type}
                      </span>
                    </div>
                    <h3 className="text-2xl font-display font-bold text-slate-900 mb-4">{ann.title}</h3>
                    <p className="text-slate-600 leading-relaxed font-normal whitespace-pre-wrap">{ann.content}</p>
                    <div className="mt-8 pt-6 border-t border-slate-50 flex gap-4">
                       <button className="text-primary font-bold text-sm hover:underline">Ver Detalhes</button>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-slate-200">
                     <p className="text-slate-400 font-medium italic">Nenhuma atualização oficial no momento.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'pessoas' && (
              <div className="bg-white rounded-[40px] border border-slate-200 p-10 min-h-[500px]">
                <h2 className="text-3xl font-display font-bold text-slate-900 mb-8 tracking-tight">Expandir Rede Profissional</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Discovery Cards (Mocks) */}
                  {[
                    { name: 'Dr. Lucas Ferreira', voc: 'Saúde & Missões', loc: 'Angola' },
                    { name: 'Ana Clara Santos', voc: 'Educação Infantil', loc: 'Brasil' },
                    { name: 'Roberto Lima', voc: 'Engenharia Civil', loc: 'Peru' },
                  ].map((p, i) => (
                    <div key={i} className="p-6 border border-slate-100 rounded-3xl bg-slate-50/50 hover:bg-white hover:shadow-xl transition-all group">
                       <div className="w-12 h-12 bg-white rounded-xl mb-4 shadow-sm group-hover:scale-110 transition-transform"></div>
                       <h4 className="font-bold text-slate-900">{p.name}</h4>
                       <p className="text-xs text-slate-500 font-medium mb-6">{p.voc} • {p.loc}</p>
                       <button className="w-full py-2 bg-white border border-primary text-primary font-bold rounded-xl text-sm hover:bg-primary hover:text-white transition-colors">
                         Conectar
                       </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'iniciativas' && (
              <div className="bg-white rounded-[40px] border border-slate-200 p-10 min-h-[500px]">
                <h2 className="text-3xl font-display font-bold text-slate-900 mb-8 tracking-tight">Destaques da Rede</h2>
                <div className="space-y-6">
                  {following.length > 0 ? following.map((item) => (
                    <div key={item.empreendimento.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-xl border border-slate-100"></div>
                          <div>
                             <h4 className="font-bold text-slate-900">{item.empreendimento.name}</h4>
                             <p className="text-xs text-slate-500 font-bold uppercase">{item.empreendimento.category}</p>
                          </div>
                       </div>
                       <button className="text-slate-400 font-bold text-sm hover:text-primary transition-colors">Acompanhando</button>
                    </div>
                  )) : (
                    <p className="text-slate-400 italic">Você ainda não segue nenhuma iniciativa. Explore acima!</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'servicos' && (
              <div className="bg-white rounded-[40px] border border-slate-200 p-10">
                <div className="flex justify-between items-center mb-10">
                   <h2 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Suporte Técnico</h2>
                   <button className="px-6 py-2 bg-primary text-white font-bold rounded-2xl text-sm shadow-lg shadow-orange-100 hover:scale-105 active:scale-95 transition-all">Novo Pedido</button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {[
                     { label: 'Apoio Psicológico', icon: '🧠' },
                     { label: 'Assessoria Jurídica', icon: '⚖️' },
                     { label: 'Suporte em TI', icon: '💻' },
                     { label: 'Mentoria Missionária', icon: '✨' },
                   ].map((s, i) => (
                     <div key={i} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center text-center hover:border-primary transition-all">
                        <span className="text-3xl mb-4">{s.icon}</span>
                        <h4 className="font-bold text-slate-900 text-sm whitespace-nowrap">{s.label}</h4>
                     </div>
                   ))}
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Active Status & Notifications */}
          <div className="lg:col-span-3 space-y-6">
             <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <h4 className="font-bold text-slate-900 mb-6 text-sm uppercase tracking-widest border-b border-slate-50 pb-4">Status da Conta</h4>
                <div className="flex items-center gap-3">
                   <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                   <span className="text-sm font-bold text-slate-700">Membro Verificado</span>
                </div>
                <p className="mt-4 text-xs text-slate-400 leading-relaxed font-medium">Você tem acesso total aos recursos exclusivos e ao fundo missionário.</p>
             </div>

             <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden">
                <div className="relative z-10">
                   <h4 className="font-display font-bold text-xl mb-4">Próximo Evento</h4>
                   <p className="text-orange-400 text-xs font-black uppercase tracking-widest mb-6 underline underline-offset-4 decoration-white/20">LIVE: Impacto Tecnológico</p>
                   <p className="text-sm text-slate-400 mb-8 leading-relaxed font-normal">Participe da nossa próxima conferência global online para networking.</p>
                   <button className="w-full py-3 bg-primary text-white font-bold rounded-2xl text-sm hover:bg-orange-600 transition-colors">Garantir Vaga</button>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-12 translate-x-12 blur-3xl"></div>
             </div>
          </div>

        </div>
      </main>
    </div>
  );
}
