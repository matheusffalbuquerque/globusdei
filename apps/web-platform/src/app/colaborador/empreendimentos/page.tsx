'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

import { apiFetch } from '../../../lib/api';

type Empreendimento = {
  id: string;
  name: string;
  type: string;
  category: string;
  location: string;
  priorityScore: number;
  isBankVerified: boolean;
  followUpStatus: string;
  internalResponsibleId?: string;
  internalNotes?: string;
  serviceLogs: { id: string, staffId: string, action: string, content: string, createdAt: string }[];
};

export default function ColaboradorEmpreendimentos() {
  const { data: session, status: sessionStatus } = useSession();
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);
  const [selected, setSelected] = useState<Empreendimento | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Internal update states
  const [score, setScore] = useState(0);
  const [followUpStatus, setFollowUpStatus] = useState('OPEN');
  const [notes, setNotes] = useState('');
  const [bankVerified, setBankVerified] = useState(false);

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      void fetchGlobalList();
    }
  }, [sessionStatus]);

  const fetchGlobalList = async () => {
    try {
      const data = await apiFetch('/empreendimentos', { session });
      setEmpreendimentos(data);
      setLoading(false);
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  };

  const handleUpdateInternal = async () => {
    if (!selected) return;
    try {
      await apiFetch(`/empreendimentos/${selected.id}/internal`, {
        method: 'PATCH',
        session,
        body: JSON.stringify({ 
          priorityScore: Number(score), 
          isBankVerified: bankVerified, 
          followUpStatus, 
          internalNotes: notes 
        }),
      });
      setSelected(null);
      await fetchGlobalList();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const openSelection = (emp: Empreendimento) => {
    setSelected(emp);
    setScore(emp.priorityScore);
    setFollowUpStatus(emp.followUpStatus);
    setNotes(emp.internalNotes || '');
    setBankVerified(emp.isBankVerified);
  };

  if (sessionStatus === 'loading') return <div className="p-10 text-center">Carregando sessão...</div>;
  if (sessionStatus !== 'authenticated') return <div className="p-10 text-center">Faça login para acessar os empreendimentos.</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar (Similar structure to Colaborador Dashboard) */}
      <aside className="w-72 bg-white border-r border-gray-100 p-8 flex flex-col pt-12">
         <span className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-10">CONTROLE INTERNO</span>
         <nav className="space-y-4">
            <a href="/colaborador/dashboard" className="w-full block font-bold text-gray-400 p-4 rounded-xl hover:bg-gray-50 transition">Triagem Onboarding</a>
            <a href="/colaborador/empreendimentos" className="w-full block font-bold text-blue-600 bg-blue-50 p-4 rounded-xl">Gestão Empreendimentos</a>
         </nav>
      </aside>

      <main className="flex-1 p-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-10">Iniciativas Corporativas (Célula Técnica)</h1>
        {error && <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-red-600">{error}</div>}

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
           <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                 <tr>
                    <th className="px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Iniciativa</th>
                    <th className="px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Score Prioridade</th>
                    <th className="px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Status Acompanhamento</th>
                    <th className="px-8 py-5 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Ação</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                 {empreendimentos.map(emp => (
                   <tr key={emp.id} className="hover:bg-gray-50 transition">
                      <td className="px-8 py-6">
                        <div className="flex items-center space-x-4">
                           <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center text-white font-bold">{emp.name.charAt(0)}</div>
                           <div>
                              <div className="font-bold text-gray-900">{emp.name}</div>
                              <div className="text-xs text-gray-400">{emp.type} • {emp.location}</div>
                           </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                         <div className={`inline-block px-4 py-2 rounded-full font-bold text-sm ${emp.priorityScore > 75 ? 'bg-red-50 text-red-600' : emp.priorityScore > 40 ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
                            {emp.priorityScore}
                         </div>
                      </td>
                      <td className="px-8 py-6">
                         <span className="text-xs font-bold text-gray-500 uppercase p-2 bg-gray-100 rounded-lg">{emp.followUpStatus}</span>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <button 
                            onClick={() => openSelection(emp)}
                            className="bg-blue-600 text-white font-bold px-6 py-2 rounded-xl text-sm hover:bg-blue-700 transition"
                         >
                            Analisar
                         </button>
                      </td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </main>

      {/* Modal de Análise Staff */}
      {selected && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
           <div className="bg-white rounded-[40px] shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-12">
              <div className="flex justify-between items-start mb-12">
                 <div>
                    <h2 className="text-4xl font-bold text-gray-900">Análise e Controle</h2>
                    <p className="text-gray-400 mt-2">Iniciativa: <span className="font-bold">{selected.name}</span></p>
                 </div>
                 <button onClick={() => setSelected(null)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full">
                    ×
                 </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                 <div className="space-y-8">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-4 tracking-tighter uppercase">Definir Score de Prioridade (0-100)</label>
                        <input 
                          type="range" min="0" max="100"
                          className="w-full h-3 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          value={score}
                          onChange={e => setScore(Number(e.target.value))}
                        />
                        <div className="text-center font-black text-4xl mt-4 text-blue-600">{score}</div>
                    </div>

                    <div className="flex items-center justify-between p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
                       <div className="max-w-[180px]">
                          <span className="font-bold text-blue-900 block">Verificação Bancária</span>
                          <p className="text-xs text-blue-700">Libera o preenchimento de dados pelo agente.</p>
                       </div>
                       <input 
                         type="checkbox" 
                         className="w-8 h-8 rounded-lg accent-green-600"
                         checked={bankVerified}
                         onChange={e => setBankVerified(e.target.checked)}
                       />
                    </div>

                    <div>
                       <label className="block text-sm font-bold text-gray-700 mb-2 uppercase text-xs tracking-widest">Status de Acompanhamento</label>
                       <select 
                         className="w-full bg-gray-50 p-4 rounded-xl border border-gray-100 font-bold"
                         value={followUpStatus}
                         onChange={e => setFollowUpStatus(e.target.value)}
                       >
                          <option value="OPEN">Aberta / Triagem</option>
                          <option value="MONITORING">Em Acompanhamento</option>
                          <option value="ON_HOLD">Em Pausa</option>
                          <option value="CLOSED">Finalizado</option>
                       </select>
                    </div>

                    <div>
                       <label className="block text-sm font-bold text-gray-700 mb-2 uppercase text-xs tracking-widest">Observações Internas (Não Público)</label>
                       <textarea 
                          rows={4}
                          className="w-full bg-gray-50 p-6 rounded-2xl border border-gray-100"
                          placeholder="Notas técnica sobre missiologia, viabilidade financeira ou riscos..."
                          value={notes}
                          onChange={e => setNotes(e.target.value)}
                       />
                    </div>

                    <button 
                       onClick={handleUpdateInternal}
                       className="w-full bg-gray-900 text-white font-bold py-5 rounded-2xl hover:bg-black transition shadow-lg"
                    >
                       Salvar Controle Técnico
                    </button>
                 </div>

                 <div className="bg-gray-50 p-10 rounded-[40px] border border-gray-100 overflow-y-auto max-h-[500px]">
                    <h3 className="text-xl font-bold mb-8">Histórico de Atendimento</h3>
                    <div className="space-y-6 relative border-l-2 border-gray-200 ml-4 py-2">
                       {selected.serviceLogs?.length > 0 ? selected.serviceLogs.map(log => (
                         <div key={log.id} className="relative pl-8">
                            <div className="absolute left-[-9px] top-1 w-4 h-4 rounded-full bg-blue-600 border-2 border-white"></div>
                            <div className="text-xs font-bold text-gray-400 uppercase mb-1">{new Date(log.createdAt).toLocaleString('pt-BR')}</div>
                            <div className="text-sm font-bold text-gray-900 mb-1">{log.action}</div>
                            <p className="text-xs text-gray-500 leading-relaxed italic">{log.content}</p>
                         </div>
                       )) : (
                         <p className="text-gray-400 italic text-center">Nenhum histórico registrado ainda.</p>
                       )}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
