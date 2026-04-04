'use client';

import { useState, useEffect } from 'react';

type PendingAgent = {
  id: string;
  name: string;
  email: string;
  status: string;
  updatedAt: string;
  interviewLink?: string;
  answers: { question: { title: string }; text: string }[];
};

type AvailabilitySlot = {
  id: string;
  startTime: string;
  endTime: string;
  meetLink?: string;
  agent?: { name: string };
};

export default function ColaboradorDashboard() {
  const [activeTab, setActiveTab] = useState<'triagem' | 'agenda'>('triagem');
  const [agents, setAgents] = useState<PendingAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<PendingAgent | null>(null);
  
  // Agenda states
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [newSlot, setNewSlot] = useState({ startTime: '', endTime: '', meetLink: '' });

  // MOCK Staff ID
  const staffId = 'STAFF_MOCK_UUID';

  useEffect(() => {
    fetchAgents();
    fetchSlots();
  }, []);

  const fetchAgents = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/onboarding/pending-analysis');
      const data = await res.json();
      setAgents(data);
    } catch (e) {
      console.error('Falha ao buscar pendências', e);
    }
  };

  const fetchSlots = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/staff/${staffId}/slots`);
      const data = await res.json();
      setSlots(data);
    } catch (e) {
      console.error('Falha ao buscar slots', e);
    }
  };

  const approveForInterview = async () => {
    if (!selectedAgent) return;
    try {
      const res = await fetch(`http://localhost:3001/api/onboarding/${selectedAgent.id}/approve`, {
        method: 'POST',
      });
      if (res.ok) {
        setSelectedAgent(null);
        fetchAgents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const createSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:3001/api/staff/${staffId}/slots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSlot),
      });
      if (res.ok) {
        setNewSlot({ startTime: '', endTime: '', meetLink: '' });
        fetchSlots();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteSlot = async (id: string) => {
    try {
      await fetch(`http://localhost:3001/api/staff/slots/${id}`, { method: 'DELETE' });
      fetchSlots();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Globus Dei</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <button 
            onClick={() => setActiveTab('triagem')}
            className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'triagem' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Análises Pendentes
          </button>
          <button 
            onClick={() => setActiveTab('agenda')}
            className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'agenda' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Minha Agenda
          </button>
          <a href="#" className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
            Empreendimentos
          </a>
        </nav>
      </aside>

      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {activeTab === 'triagem' ? 'Painel do Colaborador - Triagem' : 'Gestão de Disponibilidade'}
          </h1>
        </div>

        {activeTab === 'triagem' ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agente (Candidato)</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Atual</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Última Atualização</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {agents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                          {agent.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                          <div className="text-sm text-gray-500">{agent.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${agent.status === 'SUBMITTED' ? 'bg-yellow-100 text-yellow-800' : 
                          agent.status === 'QUALIFIED' ? 'bg-purple-100 text-purple-800' : 
                          'bg-blue-100 text-blue-800'}`}>
                        {agent.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(agent.updatedAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => setSelectedAgent(agent)}
                        className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-4 py-2 rounded-lg font-semibold"
                      >
                        {agent.status === 'SUBMITTED' ? 'Analisar Questionário' : 'Ver Detalhes'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {agents.length === 0 && (
              <div className="p-8 text-center text-gray-500">Nenhum agente pendente de análise no momento.</div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold mb-4">Adicionar Horário</h3>
                <form onSubmit={createSlot} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Início</label>
                    <input 
                      type="datetime-local" 
                      required
                      className="w-full mt-1 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      value={newSlot.startTime}
                      onChange={e => setNewSlot({...newSlot, startTime: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Término</label>
                    <input 
                      type="datetime-local" 
                      required
                      className="w-full mt-1 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      value={newSlot.endTime}
                      onChange={e => setNewSlot({...newSlot, endTime: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Link do Meet (Opcional)</label>
                    <input 
                      type="url" 
                      placeholder="https://meet.google.com/..."
                      className="w-full mt-1 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      value={newSlot.meetLink}
                      onChange={e => setNewSlot({...newSlot, meetLink: e.target.value})}
                    />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Salvar Horário
                  </button>
                </form>
              </div>
            </div>
            
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Horário</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {slots.map(slot => (
                      <tr key={slot.id}>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {new Date(slot.startTime).toLocaleString('pt-BR')} - {new Date(slot.endTime).toLocaleTimeString('pt-BR')}
                        </td>
                        <td className="px-6 py-4">
                          {slot.agent ? (
                            <span className="text-green-600 font-medium">Reservado por {slot.agent.name}</span>
                          ) : (
                            <span className="text-gray-400 italic">Disponível</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {!slot.agent && (
                            <button onClick={() => deleteSlot(slot.id)} className="text-red-600 hover:text-red-900 text-sm font-bold">
                              Remover
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal de Análise */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Análise Missiológica</h2>
                <button onClick={() => setSelectedAgent(null)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="mb-8 space-y-6">
                <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Respostas do Questionário</h3>
                {selectedAgent.answers.map((ans, idx) => (
                  <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-sm font-bold text-gray-900 mb-2">{ans.question.title}</p>
                    <p className="text-gray-600 italic">"{ans.text}"</p>
                  </div>
                ))}
              </div>

              {selectedAgent.status === 'SUBMITTED' ? (
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 sm:flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-blue-900">Aprovar Triagem?</h3>
                    <p className="text-blue-700 text-sm">O agente será notificado para escolher um horário de entrevista.</p>
                  </div>
                  <button 
                    onClick={approveForInterview}
                    className="mt-4 sm:mt-0 bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition"
                  >
                    Liberar Agendamento
                  </button>
                </div>
              ) : selectedAgent.status === 'QUALIFIED' ? (
                <div className="bg-purple-50 p-6 rounded-xl border border-purple-100 text-center text-purple-800">
                  Aguardando o agente selecionar um horário na agenda.
                </div>
              ) : (
                <div className="bg-green-50 p-6 rounded-xl border border-green-100 text-center">
                  <p className="text-green-800 font-medium">Entrevista agendada!</p>
                  <button 
                    onClick={() => window.open(selectedAgent.interviewLink, '_blank')}
                    className="mt-2 text-blue-600 font-bold hover:underline"
                  >
                    Link do Meet (Nova Aba)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
