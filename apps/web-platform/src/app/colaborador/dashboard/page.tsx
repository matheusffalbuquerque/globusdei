'use client';

import { useState, useEffect } from 'react';

type PendingAgent = {
  id: string;
  name: string;
  email: string;
  status: string;
  updatedAt: string;
  answers: { question: { title: string }; text: string }[];
};

export default function ColaboradorDashboard() {
  const [agents, setAgents] = useState<PendingAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<PendingAgent | null>(null);
  
  // Modal states
  const [googleMeetLink, setGoogleMeetLink] = useState('');
  const [interviewDate, setInterviewDate] = useState('');

  useEffect(() => {
    fetchAgents();
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

  const scheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent) return;

    try {
      const res = await fetch(`http://localhost:3001/api/onboarding/${selectedAgent.id}/schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewLink: googleMeetLink, interviewDate }),
      });
      
      if (res.ok) {
        setSelectedAgent(null);
        fetchAgents(); // Refresh list
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar fake pra dar cara de Dashboard */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Globus Dei</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <a href="#" className="flex items-center px-4 py-3 text-sm font-medium bg-blue-50 text-blue-700 rounded-lg">
            Análises Pendentes
          </a>
          <a href="#" className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
            Empreendimentos
          </a>
        </nav>
      </aside>

      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Painel do Colaborador - Triagem</h1>

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
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${agent.status === 'SUBMITTED' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
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
                      Analisar e Agendar
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
                {selectedAgent.answers.length === 0 && (
                  <p className="text-gray-500">Este usuário não respondeu perguntas ou usou um fluxo legado.</p>
                )}
              </div>

              {selectedAgent.status === 'SUBMITTED' ? (
                <form onSubmit={scheduleInterview} className="bg-blue-50/50 p-6 rounded-xl border border-blue-100">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">Agendar Entrevista com Candidato</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Link do Google Meet</label>
                      <input 
                        type="url" 
                        required 
                        value={googleMeetLink}
                        onChange={e => setGoogleMeetLink(e.target.value)}
                        placeholder="https://meet.google.com/xxx-xxxx-xxx"
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Data e Hora</label>
                      <input 
                        type="datetime-local" 
                        required 
                        value={interviewDate}
                        onChange={e => setInterviewDate(e.target.value)}
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2"
                      />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                      Confirmar Agendamento e Notificar
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-green-50 p-6 rounded-xl border border-green-100 text-center">
                  <p className="text-green-800 font-medium">Entrevista já agendada para este agente!</p>
                  <p className="text-green-600 text-sm mt-1">Status: {selectedAgent.status}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
