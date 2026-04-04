'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateEmpreendimento() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    establishedDate: '',
    type: 'CHURCH',
    category: 'SOCIAL',
    location: '',
    actuationRegions: '',
    portfolioUrl: '',
    monthlyExpenses: 0,
    incomeSources: '',
    needType: 'MAINTENANCE',
    receivesInvestments: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/empreendimentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          establishedDate: new Date(formData.establishedDate).toISOString(),
          monthlyExpenses: Number(formData.monthlyExpenses),
          socialLinks: {}, // Optional JSON field
        }),
      });

      if (res.ok) {
        router.push('/agent/empreendimentos');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto py-12">
        <button 
          onClick={() => router.back()}
          className="text-sm font-bold text-gray-500 mb-8 hover:text-orange-600 transition"
        >
          ← Voltar
        </button>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Nova Iniciativa</h1>
        <p className="text-gray-500 mb-12">Conte-nos sobre o seu projeto missionário ou social.</p>

        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Sessão 1: Dados Básicos */}
          <section className="space-y-6">
            <h2 className="text-xl font-bold border-b border-gray-100 pb-3">Informações Gerais</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Nome do Empreendimento</label>
                <input 
                  type="text" required
                  className="w-full bg-gray-50 border-0 rounded-xl p-4 focus:ring-2 focus:ring-orange-500 transition"
                  placeholder="Ex: Igreja da Vila, ONG Esperança..."
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Tipo</label>
                <select 
                  className="w-full bg-gray-50 border-0 rounded-xl p-4 focus:ring-2 focus:ring-orange-500 transition"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                >
                  <option value="CHURCH">Igreja</option>
                  <option value="AGENCY">Agência</option>
                  <option value="SCHOOL">Escola</option>
                  <option value="PROJECT">Projeto</option>
                  <option value="VENTURE">Negócio Social</option>
                  <option value="ONG">ONG</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Categoria de Atuação</label>
                <select 
                  className="w-full bg-gray-50 border-0 rounded-xl p-4 focus:ring-2 focus:ring-orange-500 transition"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  <option value="EDUCATION">Educação</option>
                  <option value="SPORTS">Esportes</option>
                  <option value="TECHNOLOGY">Tecnologia</option>
                  <option value="BUSINESS">Negócios</option>
                  <option value="HEALTH">Saúde</option>
                  <option value="SOCIAL">Ação Social</option>
                  <option value="SCIENTIFICAL">Científico</option>
                  <option value="CAPACITATION">Capacitação</option>
                  <option value="SUPPORT">Suporte/Base</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Descrição da Missão</label>
                <textarea 
                  required rows={4}
                  className="w-full bg-gray-50 border-0 rounded-xl p-4 focus:ring-2 focus:ring-orange-500 transition"
                  placeholder="Descreva o propósito central deste empreendimento..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Data de Fundação</label>
                <input 
                  type="date" required
                  className="w-full bg-gray-50 border-0 rounded-xl p-4 focus:ring-2 focus:ring-orange-500 transition"
                  value={formData.establishedDate}
                  onChange={e => setFormData({...formData, establishedDate: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Localização Principal</label>
                <input 
                  type="text" required
                  className="w-full bg-gray-50 border-0 rounded-xl p-4 focus:ring-2 focus:ring-orange-500 transition"
                  placeholder="Cidade, Estado, País"
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                />
              </div>
            </div>
          </section>

          {/* Sessão 2: Impacto e Regiões */}
          <section className="space-y-6">
            <h2 className="text-xl font-bold border-b border-gray-100 pb-3">Impacto e Atuação</h2>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Regiões de Atuação (Texto Livre para IA)</label>
              <textarea 
                rows={2}
                className="w-full bg-gray-50 border-0 rounded-xl p-4 focus:ring-2 focus:ring-orange-500 transition"
                placeholder="Ex: Todo o sudeste brasileiro, foco em comunidades rurais do sertão..."
                value={formData.actuationRegions}
                onChange={e => setFormData({...formData, actuationRegions: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Link do Portfólio / Website</label>
              <input 
                type="url"
                className="w-full bg-gray-50 border-0 rounded-xl p-4 focus:ring-2 focus:ring-orange-500 transition"
                placeholder="https://sua-iniciativa.com"
                value={formData.portfolioUrl}
                onChange={e => setFormData({...formData, portfolioUrl: e.target.value})}
              />
            </div>
          </section>

          {/* Sessão 3: Necessidades Financeiras */}
          <section className="space-y-6">
            <h2 className="text-xl font-bold border-b border-gray-100 pb-3">Gestão Financeira Básica</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Gastos Mensais Estimados (R$)</label>
                <input 
                  type="number"
                  className="w-full bg-gray-50 border-0 rounded-xl p-4 focus:ring-2 focus:ring-orange-500 transition"
                  value={formData.monthlyExpenses}
                  onChange={e => setFormData({...formData, monthlyExpenses: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Tipo de Necessidade</label>
                <select 
                  className="w-full bg-gray-50 border-0 rounded-xl p-4 focus:ring-2 focus:ring-orange-500 transition"
                  value={formData.needType}
                  onChange={e => setFormData({...formData, needType: e.target.value})}
                >
                  <option value="MAINTENANCE">Manutenção</option>
                  <option value="EXPANSION">Expansão</option>
                  <option value="EMERGENCY">Emergencial</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Fontes de Renda Atuais</label>
                <input 
                  type="text"
                  className="w-full bg-gray-50 border-0 rounded-xl p-4 focus:ring-2 focus:ring-orange-500 transition"
                  placeholder="Doações, Eventos, Investimento Próprio..."
                  value={formData.incomeSources}
                  onChange={e => setFormData({...formData, incomeSources: e.target.value})}
                />
              </div>
              <div className="md:col-span-2 bg-amber-50 p-6 rounded-2xl border border-amber-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-amber-900">Aceita Investimentos pela Plataforma?</h4>
                  <p className="text-sm text-amber-700">Ao marcar como sim, sua iniciativa poderá ser listada para potenciais investidores.</p>
                </div>
                <input 
                  type="checkbox"
                  className="w-6 h-6 text-orange-600 rounded focus:ring-orange-500"
                  checked={formData.receivesInvestments}
                  onChange={e => setFormData({...formData, receivesInvestments: e.target.checked})}
                />
              </div>
            </div>
          </section>

          {/* Seção Bancária Travada */}
          <section className="bg-gray-100 p-8 rounded-3xl border border-dashed border-gray-300 opacity-60">
            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center">
              <span className="mr-2">🔒</span> Dados Bancários (Bloqueado)
            </h3>
            <p className="text-sm text-gray-500 mb-4">Esta seção estará disponível apenas após a revisão especializada de um colaborador da Globus Dei para garantir a segurança dos investimentos.</p>
          </section>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-orange-600 text-white font-bold py-5 rounded-2xl shadow-xl hover:bg-orange-700 transition transform hover:-translate-y-1 active:scale-95 disabled:bg-gray-400"
          >
            {loading ? 'Salvando...' : 'Criar Iniciativa Corporativa'}
          </button>
        </form>
      </div>
    </div>
  );
}
