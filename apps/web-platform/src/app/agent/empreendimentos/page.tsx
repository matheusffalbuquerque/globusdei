'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Empreendimento = {
  id: string;
  name: string;
  type: string;
  category: string;
  priorityScore: number;
  isBankVerified: boolean;
  ownerId: string;
};

type Invite = {
  id: string;
  token: string;
  empreendimento: { name: string };
  role: string;
};

export default function MyEmpreendimentos() {
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // MOCK Agent Identity
  const agentId = 'MOCK_AGENT_ID';
  const agentEmail = 'matheus@example.com';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch My Empreendimentos (Filtering by owner or agent list would be done backend)
      // For now, we list all or mock filtering
      const resEmp = await fetch('http://localhost:3001/api/empreendimentos'); // Need this endpoint or similar
      const dataEmp = await resEmp.json();
      setEmpreendimentos(dataEmp);

      // Fetch My Invites
      const resInv = await fetch(`http://localhost:3001/api/empreendimentos/invites/my-invites?email=${agentEmail}`);
      const dataInv = await resInv.json();
      setInvites(dataInv);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const acceptInvite = async (token: string) => {
    try {
      const res = await fetch('http://localhost:3001/api/empreendimentos/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, agentId }),
      });
      if (res.ok) {
        fetchData(); // Refresh
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Meus Empreendimentos</h1>
            <p className="text-gray-500 mt-2">Gerencie suas iniciativas e colaborações na Globus Dei.</p>
          </div>
          <button 
            onClick={() => router.push('/agent/empreendimentos/create')}
            className="bg-orange-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:bg-orange-700 transition"
          >
            + Nova Iniciativa
          </button>
        </div>

        {/* Notificações de Convite Estilo LinkedIn */}
        {invites.length > 0 && (
          <div className="mb-12 bg-blue-50 border border-blue-100 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
              <span className="mr-2">🔔</span> Convites Pendentes
            </h2>
            <div className="space-y-4">
              {invites.map(invite => (
                <div key={invite.id} className="bg-white p-4 rounded-xl border border-blue-200 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-900">
                      Você foi convidado para ser <span className="text-blue-600">{invite.role}</span> no projeto <span className="text-orange-600">{invite.empreendimento.name}</span>
                    </p>
                    <p className="text-sm text-gray-500">Aceite para começar a colaborar agora mesmo.</p>
                  </div>
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => acceptInvite(invite.token)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition"
                    >
                      Aceitar
                    </button>
                    <button className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition">
                      Recusar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista de Empreendimentos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {empreendimentos.map(emp => (
            <div key={emp.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition group">
              <div className="h-32 bg-gradient-to-r from-gray-100 to-gray-200 relative">
                {/* Logo Placeholder */}
                <div className="absolute -bottom-6 left-6 w-16 h-16 bg-white rounded-xl shadow-md border border-gray-50 flex items-center justify-center font-bold text-xl text-gray-400">
                  {emp.name.charAt(0)}
                </div>
                <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-600">
                  {emp.type}
                </div>
              </div>
              <div className="p-8 pt-10">
                <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-orange-600 transition">{emp.name}</h3>
                <p className="text-sm text-gray-400 mb-4 uppercase tracking-widest font-bold">{emp.category}</p>
                
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-50">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-tighter">Score Prioridade</span>
                    <span className={`text-lg font-bold ${emp.priorityScore > 70 ? 'text-red-500' : 'text-blue-500'}`}>{emp.priorityScore}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-tighter">Status Banco</span>
                    {emp.isBankVerified ? (
                      <span className="text-green-600 font-bold flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                        Verificado
                      </span>
                    ) : (
                      <span className="text-gray-400 font-medium">Pendente</span>
                    )}
                  </div>
                </div>

                <button 
                  onClick={() => router.push(`/agent/empreendimentos/edit/${emp.id}`)}
                  className="w-full mt-8 bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-black transition"
                >
                  Gerenciar Projeto
                </button>
              </div>
            </div>
          ))}
          {empreendimentos.length === 0 && !loading && (
            <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
              <p className="text-gray-400 text-lg">Você ainda não possui iniciativas cadastradas.</p>
              <button 
                onClick={() => router.push('/agent/empreendimentos/create')}
                className="mt-4 text-orange-600 font-bold hover:underline"
              >
                Clique aqui para criar sua primeira
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
