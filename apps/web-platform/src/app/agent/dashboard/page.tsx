'use client';

import { useState, useEffect } from 'react';

type AgentStatus = 'ENTERED' | 'SUBMITTED' | 'QUALIFIED' | 'SCHEDULED' | 'FEEDBACK_PROVIDED' | 'APPROVED' | 'REJECTED';

type AgentData = {
  id: string;
  name: string;
  email: string;
  status: AgentStatus;
  interviewDate?: string;
  interviewLink?: string;
  feedback?: string;
};

type Slot = {
  id: string;
  startTime: string;
  endTime: string;
  staff: { name: string };
};

export default function AgentDashboard() {
  const [agent, setAgent] = useState<AgentData | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isClaiming, setIsClaiming] = useState(false);

  // MOCK Agent ID
  const agentId = 'MOCK_AGENT_ID';

  useEffect(() => {
    fetchAgentData();
    fetchSlots();
  }, []);

  const fetchAgentData = async () => {
    try {
      // For this mock, we fetch from a generic agent endpoint or the onboarding status
      // Real app would fetch the logged-in agent profile
      const res = await fetch(`http://localhost:3001/api/onboarding/pending-analysis`);
      const allPending = await res.json();
      const current = allPending.find((a: any) => a.id === agentId) || {
        id: agentId,
        name: 'Matheus',
        email: 'matheus@example.com',
        status: 'SUBMITTED', // Default mock
      };
      setAgent(current);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSlots = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/onboarding/slots');
      const data = await res.json();
      setSlots(data);
    } catch (e) {
      console.error(e);
    }
  };

  const claimSlot = async (slotId: string) => {
    setIsClaiming(true);
    try {
      const res = await fetch(`http://localhost:3001/api/onboarding/${agentId}/claim-slot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId }),
      });
      if (res.ok) {
        fetchAgentData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsClaiming(false);
    }
  };

  if (!agent) return <div className="p-8">Carregando painel...</div>;

  const steps = [
    { label: 'Processando sua candidatura', status: ['SUBMITTED', 'QUALIFIED', 'SCHEDULED', 'APPROVED', 'REJECTED'], current: agent.status === 'SUBMITTED' },
    { label: 'Candidatura ativa', status: ['QUALIFIED', 'SCHEDULED', 'APPROVED', 'REJECTED'], current: agent.status === 'QUALIFIED' },
    { label: 'Entrevista Agendada', status: ['SCHEDULED', 'APPROVED', 'REJECTED'], current: agent.status === 'SCHEDULED' },
    { label: 'Conclusão', status: ['APPROVED', 'REJECTED'], current: agent.status === 'APPROVED' || agent.status === 'REJECTED' },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Header Estilo BairesDev */}
      <header className="border-b border-gray-100 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-xl italic">GD</div>
          <span className="text-xl font-bold tracking-tight">Globus Dei</span>
        </div>
        <div className="flex items-center space-x-6 text-sm font-medium text-gray-600">
          <a href="#" className="text-orange-600">Início</a>
          <a href="#">Missões</a>
          <a href="#">Recursos</a>
          <div className="w-8 h-8 rounded-full bg-gray-200 border border-gray-300"></div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-12">
        <h1 className="text-3xl font-bold mb-12 text-gray-900">Boas-vindas ao Dashboard, {agent.name}!</h1>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Lado Esquerdo: Conteúdo Principal */}
          <div className="flex-1 space-y-12">
            
            {/* Status Card */}
            <div className="flex items-start space-x-8">
              <div className="w-48 h-48 flex-shrink-0">
                <img src="https://cdni.iconscout.com/illustration/premium/thumb/man-working-on-laptop-2122359-1790435.png" alt="Working" className="w-full h-full object-contain" />
              </div>
              <div className="pt-8">
                {agent.status === 'SUBMITTED' && (
                  <>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Muito bem! Sua aplicação foi enviada.</h2>
                    <p className="text-gray-500 text-lg">Estamos analisando suas respostas para encontrar o melhor lugar para você na missão global.</p>
                  </>
                )}
                {agent.status === 'QUALIFIED' && (
                  <>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2 text-orange-600">Prepare-se para a entrevista!</h2>
                    <p className="text-gray-500 text-lg">Seu questionário foi aprovado. Agora, escolha um horário que funcione para você abaixo.</p>
                  </>
                )}
                {agent.status === 'SCHEDULED' && (
                  <>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2 text-green-600">Tudo pronto para a entrevista!</h2>
                    <p className="text-gray-500 text-lg">Sua sessão está confirmada para {new Date(agent.interviewDate!).toLocaleString('pt-BR')}.</p>
                    <a 
                      href={agent.interviewLink} 
                      target="_blank" 
                      className="mt-6 inline-block bg-orange-600 text-white font-bold px-8 py-3 rounded-xl shadow-lg hover:bg-orange-700 transition"
                    >
                      Entrar no Google Meet
                    </a>
                  </>
                )}
                {agent.status === 'APPROVED' && (
                  <>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2 text-blue-600">Parabéns, Agente!</h2>
                    <p className="text-gray-500 text-lg text-green-600 italic">"Bem-vindo à família Globus Dei. {agent.feedback}"</p>
                    <p className="mt-4 text-gray-500">Você agora tem acesso total aos recursos exclusivos de missões.</p>
                  </>
                )}
              </div>
            </div>

            {/* Slot Picker Section (only for QUALIFIED) */}
            {agent.status === 'QUALIFIED' && (
              <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
                <h3 className="text-xl font-bold mb-6 text-gray-900 border-b border-gray-200 pb-4">Horários Disponíveis da Semana</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {slots.length > 0 ? slots.map(slot => (
                    <button 
                      key={slot.id}
                      disabled={isClaiming}
                      onClick={() => claimSlot(slot.id)}
                      className="flex flex-col items-start bg-white p-4 rounded-xl border border-gray-200 hover:border-orange-500 hover:shadow-md transition group"
                    >
                      <span className="text-sm font-bold text-gray-400 group-hover:text-orange-500 uppercase tracking-widest mb-1">
                        {new Date(slot.startTime).toLocaleDateString('pt-BR', { weekday: 'long' })}
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        {new Date(slot.startTime).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit' })} às {new Date(slot.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-xs text-gray-400 mt-2">Entrevistador: {slot.staff.name}</span>
                    </button>
                  )) : (
                    <p className="text-gray-500 italic">Aguardando novos horários serem liberados pelos colaboradores...</p>
                  )}
                </div>
              </div>
            )}

            {/* Dicas Card (Mock from Reference) */}
            <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
              <h3 className="text-lg font-bold mb-6 text-gray-800">Dicas para aumentar suas chances:</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm3 11H7a1 1 0 110-2h6a1 1 0 110 2zm0-4H7a1 1 0 110-2h6a1 1 0 110 2z"/></svg>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Atualize suas habilidades:</p>
                    <p className="text-gray-500 text-sm">Aprendeu algo novo? Compartilhe conosco! Adicione formações teológicas ou linguísticas.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Lado Direito: Status Timeline */}
          <div className="w-full lg:w-72">
            <div className="sticky top-12 border-l-2 border-gray-100 ml-4 py-4 px-8">
              <h3 className="text-sm font-bold text-gray-400 tracking-widest uppercase mb-8 ml-[-32px]">Seu status</h3>
              
              <div className="space-y-12">
                {steps.map((step, idx) => {
                  const isActive = step.status.includes(agent.status);
                  return (
                    <div key={idx} className="relative">
                      {/* Circle Dot */}
                      <div className={`absolute left-[-41px] top-1 w-4 h-4 rounded-full border-4 border-white ring-4 ring-offset-0 ${step.current ? 'bg-orange-600 ring-orange-100' : isActive ? 'bg-gray-900 ring-gray-100' : 'bg-gray-100 ring-transparent'}`}></div>
                      
                      <div className={isActive ? 'text-gray-900' : 'text-gray-400'}>
                        <p className={`text-sm font-bold ${step.current ? 'text-orange-600' : ''}`}>{step.label}</p>
                        {step.current && (
                          <div className="mt-2 text-xs font-medium text-gray-500 leading-relaxed">
                            {agent.status === 'SUBMITTED' && 'Estamos analisando seu perfil para encontrar o melhor papel para você.'}
                            {agent.status === 'QUALIFIED' && 'Aprovação concluída! Por favor, prossiga para o agendamento da conversa.'}
                            {agent.status === 'SCHEDULED' && 'Horário reservado. Prepare seu ambiente e oração para o dia da entrevista.'}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
