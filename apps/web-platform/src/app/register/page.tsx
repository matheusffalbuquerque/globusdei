'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Erro ao criar conta. Tente novamente.');
        setStatus('error');
        return;
      }

      setStatus('success');
      setTimeout(() => router.push('/login'), 1500);
    } catch {
      setErrorMsg('Erro de conexão. Verifique sua internet e tente novamente.');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 py-20 px-6">
      <div className="max-w-xl w-full bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 p-12 border border-slate-100">
        <div className="text-center mb-12">
          <img src="/logo.png" alt="Globus Dei" className="h-16 w-auto mx-auto mb-6" />
          <h2 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Criar sua conta</h2>
          <p className="text-slate-500 mt-3 font-medium">Junte-se à maior rede de impacto missionário tecnológica.</p>
        </div>

        {/* Feedback de sucesso */}
        {status === 'success' && (
          <div className="mb-8 flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 rounded-2xl px-5 py-4 font-semibold">
            <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Conta criada com sucesso! Redirecionando para o login…
          </div>
        )}

        {/* Feedback de erro */}
        {status === 'error' && (
          <div className="mb-8 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 font-semibold">
            <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Nome Completo</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-primary focus:bg-white transition-all font-medium"
              placeholder="Digite seu nome completo"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">E-mail</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-primary focus:bg-white transition-all font-medium"
              placeholder="seu@email.com"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Telefone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-primary focus:bg-white transition-all font-medium"
              placeholder="(00) 00000-0000"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Senha</label>
            <input
              type="password"
              name="password"
              required
              minLength={8}
              value={formData.password}
              onChange={handleChange}
              className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-primary focus:bg-white transition-all font-medium"
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <div className="md:col-span-2 mt-4 space-y-6">
            <button
              type="submit"
              disabled={status === 'loading' || status === 'success'}
              className="w-full py-5 bg-primary text-white rounded-3xl font-bold shadow-xl shadow-orange-100 hover:scale-[1.02] active:scale-95 transition-all text-xl disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-3"
            >
              {status === 'loading' ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Criando conta…
                </>
              ) : (
                'Começar minha jornada'
              )}
            </button>
            <p className="text-center text-slate-500 font-medium">
              Já faz parte da rede?{' '}
              <Link href="/login" className="text-primary font-bold hover:underline">
                Entre agora
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
