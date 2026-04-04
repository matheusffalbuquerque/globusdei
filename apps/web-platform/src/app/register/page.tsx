'use client';

import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirecting to keycloak for registration or custom backend register
    signIn('keycloak');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 py-20 px-6">
      <div className="max-w-xl w-full bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 p-12 border border-slate-100">
        <div className="text-center mb-12">
          <img src="/logo.png" alt="Globus Dei" className="h-16 w-auto mx-auto mb-6" />
          <h2 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Criar sua conta</h2>
          <p className="text-slate-500 mt-3 font-medium">Junte-se à maior rede de impacto missionário tecnológica.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <button 
            onClick={() => signIn('keycloak')}
            className="flex-1 flex items-center justify-center gap-3 py-4 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 transition-all"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            Google
          </button>
          <button 
            onClick={() => signIn('keycloak')}
            className="flex-1 flex items-center justify-center gap-3 py-4 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 transition-all"
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg" className="w-5 h-5" alt="Facebook" />
            Facebook
          </button>
        </div>

        <div className="relative mb-10">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-4 bg-white text-slate-400 font-bold uppercase tracking-widest">ou use seu e-mail</span></div>
        </div>

        <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Nome Completo</label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-primary focus:bg-white transition-all font-medium"
              placeholder="Digite seu nome completo"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">E-mail</label>
            <input 
              type="email" 
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-primary focus:bg-white transition-all font-medium"
              placeholder="seu@email.com"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Telefone</label>
            <input 
              type="tel" 
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-primary focus:bg-white transition-all font-medium"
              placeholder="(00) 00000-0000"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Senha</label>
            <input 
              type="password" 
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-primary focus:bg-white transition-all font-medium"
              placeholder="••••••••"
            />
          </div>

          <div className="md:col-span-2 mt-4 space-y-6">
            <button 
              type="submit"
              className="w-full py-5 bg-primary text-white rounded-3xl font-bold shadow-xl shadow-orange-100 hover:scale-[1.02] active:scale-95 transition-all text-xl"
            >
              Começar minha jornada
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
