'use client';

import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real scenario with NextAuth + Keycloak local credentials, 
    // we would use signIn('credentials', { email, password })
    // and configure Keycloak as a back-end for that. 
    // Here we focus on the UI and the Social Login primarily.
    signIn('keycloak');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 px-6">
      <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 p-12 border border-slate-100">
        <div className="text-center mb-10">
          <img src="/logo.png" alt="Globus Dei" className="h-16 w-auto mx-auto mb-6" />
          <h2 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Bem-vindo de volta</h2>
          <p className="text-slate-500 mt-2 font-medium">Acesse sua conta para continuar</p>
        </div>

        <div className="space-y-4 mb-8">
          <button 
            onClick={() => signIn('keycloak')}
            className="w-full flex items-center justify-center gap-3 py-4 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-95"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            Entrar com Google
          </button>
        </div>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-4 bg-white text-slate-400 font-bold uppercase tracking-widest">ou</span></div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">E-mail</label>
            <input 
              type="email" 
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-primary focus:bg-white outline-none transition-all font-medium"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-orange-100 hover:scale-[1.02] active:scale-95 transition-all text-lg"
          >
            Entrar
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
