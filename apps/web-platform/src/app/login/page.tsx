'use client';

import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    const result = await signIn('keycloak-credentials', {
      redirect: false,
      email,
      password,
      callbackUrl: '/dashboard',
    });

    if (result?.error) {
      setErrorMsg('E-mail ou senha incorretos. Tente novamente.');
      setStatus('error');
      return;
    }

    // Sucesso — redireciona manualmente para o dashboard
    window.location.href = result?.url || '/';
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 px-6">
      <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 p-12 border border-slate-100">
        <div className="text-center mb-10">
          <img src="/logo.png" alt="Globus Dei" className="h-16 w-auto mx-auto mb-6" />
          <h2 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Bem-vindo de volta</h2>
          <p className="text-slate-500 mt-2 font-medium">Acesse sua conta para continuar</p>
        </div>

        {status === 'error' && (
          <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 font-semibold text-sm">
            <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-primary focus:bg-white outline-none transition-all font-medium"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-primary focus:bg-white outline-none transition-all font-medium"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-orange-100 hover:scale-[1.02] active:scale-95 transition-all text-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-3"
          >
            {status === 'loading' ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Entrando…
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        <p className="text-center mt-10 text-slate-500 font-medium">
          Não tem uma conta?{' '}
          <Link href="/register" className="text-primary font-bold hover:underline">
            Crie uma agora
          </Link>
        </p>
      </div>
    </div>
  );
}
