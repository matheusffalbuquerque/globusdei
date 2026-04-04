'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

type Empreendimento = {
  id: string;
  name: string;
  description: string;
  establishedDate: string;
  type: string;
  category: string;
  location: string;
  actuationRegions: string;
  portfolioUrl: string;
  monthlyExpenses: number;
  incomeSources: string;
  needType: string;
  receivesInvestments: boolean;
  isBankVerified: boolean;
  bankDetails?: string;
};

export default function EditEmpreendimento() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [formData, setFormData] = useState<Empreendimento | null>(null);

  useEffect(() => {
    fetchEmpreendimento();
  }, [id]);

  const fetchEmpreendimento = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/empreendimentos/${id}`);
      const data = await res.json();
      setFormData({
        ...data,
        establishedDate: data.establishedDate.split('T')[0], // format for date input
      });
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    setSaving(true);
    try {
      const res = await fetch(`http://localhost:3001/api/empreendimentos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          monthlyExpenses: Number(formData.monthlyExpenses),
          establishedDate: new Date(formData.establishedDate).toISOString(),
        }),
      });
      if (res.ok) {
        router.refresh();
        alert('Dados salvos com sucesso!');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3001/api/empreendimentos/invites/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empreendimentoId: id, email: inviteEmail }),
      });
      if (res.ok) {
        alert('Convite enviado para o e-mail do agente!');
        setInviteEmail('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading || !formData) return <div className="p-20 text-center">Carregando dados...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar de Gestão */}
      <aside className="w-80 bg-white border-r border-gray-100 p-10 space-y-12 shrink-0">
        <div>
          <button onClick={() => router.push('/agent/dashboard')} className="text-sm font-bold text-gray-500 mb-8 hover:text-orange-600 transition tracking-tighter">
            ← DASHBOARD PRINCIPAL
          </button>
          <div className="w-20 h-20 bg-orange-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl mb-4 shadow-lg shadow-orange-100">
            {formData.name.charAt(0)}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">{formData.name}</h1>
          <p className="text-gray-400 text-sm mt-2">{formData.type} • {formData.category}</p>
        </div>

        <nav className="space-y-4">
          <button className="w-full text-left font-bold text-orange-600 bg-orange-50 p-4 rounded-xl">Dados da Iniciativa</button>
          <button className="w-full text-left font-bold text-gray-400 p-4 rounded-xl hover:bg-gray-50 transition">Equipe e Convites</button>
          <button className="w-full text-left font-bold text-gray-400 p-4 rounded-xl hover:bg-gray-50 transition">Relatórios</button>
        </nav>
      </aside>

      <main className="flex-1 p-16 max-w-5xl overflow-y-auto">
        <form onSubmit={handleUpdate} className="space-y-16">
          
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold text-gray-900">Editar Iniciativa</h2>
            <button 
              type="submit" 
              disabled={saving}
              className="bg-gray-900 text-white font-bold px-10 py-4 rounded-2xl hover:bg-black transition disabled:bg-gray-400"
            >
              {saving ? 'Guardando...' : 'Salvar Alterações'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             {/* Mesmos campos do Create mas com valores atuais */}
             <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Descrição do Projeto</label>
                <textarea 
                  required rows={4}
                  className="w-full bg-white border border-gray-100 rounded-2xl p-6 focus:ring-2 focus:ring-orange-500 transition shadow-sm"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              {/* ... Outros campos ... */}
          </div>

          {/* Seção Bancária Condicional */}
          <section className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
             {!formData.isBankVerified && (
               <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-8 text-center">
                 <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
                   <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
                 </div>
                 <h4 className="text-lg font-bold text-gray-900 mb-2">Seção Bloqueada para Revisão</h4>
                 <p className="text-gray-500 max-w-sm">Um colaborador especializado da Globus Dei precisa validar sua iniciativa antes de você configurar os recebimentos bancários.</p>
               </div>
             )}
             
             <h3 className="text-xl font-bold text-gray-900 mb-8">Dados Bancários para Investimento</h3>
             <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Informações da Conta (PIX, IBAN ou Dados de Transferência)</label>
                  <textarea 
                    rows={3}
                    className="w-full bg-gray-50 border-0 rounded-xl p-4 focus:ring-2 focus:ring-orange-500 transition"
                    placeholder="Cole aqui os dados para recebimento de doações/investimentos..."
                    value={formData.bankDetails || ''}
                    onChange={e => setFormData({...formData, bankDetails: e.target.value})}
                  />
                </div>
                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                   <p className="text-xs font-bold text-green-700 uppercase tracking-widest mb-1">Nota de Segurança</p>
                   <p className="text-sm text-green-600">Estes dados serão criptografados (AES-256) no servidor para sua total proteção.</p>
                </div>
             </div>
          </section>

          {/* TEAM MANAGEMENT */}
          <section className="bg-orange-600 p-10 rounded-3xl text-white shadow-xl shadow-orange-100">
             <h3 className="text-2xl font-bold mb-6">Convidar Colaborador</h3>
             <p className="text-orange-100 mb-8">Adicione outros agentes para ajudar a gerir este empreendimento. Eles receberão um convite no Dashboard e por e-mail.</p>
             
             <form onSubmit={sendInvite} className="flex gap-4">
                <input 
                  type="email" required
                  placeholder="E-mail do Agente"
                  className="flex-1 rounded-2xl p-5 text-gray-900 border-0 focus:ring-4 focus:ring-orange-400 transition shadow-inner"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                />
                <button type="submit" className="bg-gray-900 text-white font-bold px-10 rounded-2xl hover:bg-black transition">
                  Enviar Convite
                </button>
             </form>
          </section>

        </form>
      </main>
    </div>
  );
}
