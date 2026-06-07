'use client';

import { signIn } from 'next-auth/react';
import { useState, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Separator } from '../../../components/ui/separator';

const GoogleIcon = () => (
  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

// Componente interno que usa useSearchParams — deve estar dentro de <Suspense>
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const callbackUrl = '/dashboard';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    const result = await signIn('keycloak-credentials', {
      redirect: false,
      email,
      password,
      callbackUrl,
    });

    if (result?.error) {
      setErrorMsg('E-mail ou senha incorretos. Tente novamente.');
      setStatus('error');
      return;
    }

    window.location.href = result?.url || '/dashboard';
  };

  return (
    <div className="space-y-5">
      {status === 'error' && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">E-mail</label>
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="h-11"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Senha</label>
          <Input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="h-11"
          />
        </div>

        <Button
          type="submit"
          disabled={status === 'loading'}
          className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl"
        >
          {status === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {status === 'loading' ? 'Entrando…' : 'Entrar na plataforma'}
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-slate-400 whitespace-nowrap">ou escolha</span>
        <Separator className="flex-1" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full h-11 rounded-xl font-medium"
        onClick={() =>
          signIn('keycloak', { callbackUrl }, { kc_idp_hint: 'google' })
        }
      >
        <GoogleIcon />
        Continuar com Google
      </Button>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">

      {/* ── Lado esquero: formulário ── */}
      <div className="flex-1 lg:max-w-md xl:max-w-lg flex flex-col items-center justify-center bg-white px-8 py-12">
        {/* Logo mobile (só aparece em telas pequenas) */}
        <div className="lg:hidden mb-8 flex flex-col items-center gap-3 text-center">
          <img src="/logo.png" alt="Globus Dei" className="h-16 w-auto" />
          <span className="inline-block px-4 py-1 bg-orange-100 text-primary border border-orange-200 rounded-full text-xs font-bold uppercase tracking-widest">
            Rede Missionária Global
          </span>
        </div>

        <div className="w-full max-w-sm space-y-8">
          {/* Cabeçalho do formulário */}
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Portal Administrativo
            </h2>
            <p className="text-sm text-slate-500">
              Acesse sua conta para continuar
            </p>
          </div>

          {/* Formulário — useSearchParams precisa estar dentro de Suspense */}
          <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-slate-100" />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>

      {/* ── Lado direito: hero com logo ── */}
      <div className="hidden lg:flex flex-1 bg-[#faf7f4] flex-col items-center justify-center p-16 relative overflow-hidden">
        

        <div className="relative z-10 flex flex-col items-center text-center space-y-8 max-w-md">
          <img
            src="/logo.png"
            alt="Globus Dei"
            className="h-68 w-auto drop-shadow-sm"
          />

          <div className="space-y-3">
            <span className="inline-block px-5 py-2 bg-orange-100 text-primary border border-orange-200 rounded-full text-xs font-bold uppercase tracking-widest">
              Rede Missionária Global
            </span>
            <h1 className="text-3xl font-bold text-slate-900 leading-snug tracking-tight">
              Rogai, pois, ao Senhor da seara que mande {' '}
              <span className="text-primary italic">trabalhadores</span>{' '}
            </h1>
          </div>
        </div>

        <p className="absolute bottom-6 text-xs text-slate-400">
          &copy; 2026 Globus Dei. Todos os direitos reservados.
        </p>
      </div>

    </div>
  );
}
