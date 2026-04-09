'use client';

import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Separator } from '../../components/ui/separator';

const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

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
    <div className="flex min-h-[calc(100vh-130px)] items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <img src="/logo.png" alt="Globus Dei" className="h-14 w-auto" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Criar sua conta</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Junte-se à maior rede de impacto missionário tecnológica.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Cadastro na plataforma
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            {status === 'success' && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                Conta criada com sucesso! Redirecionando para o login…
              </div>
            )}

            {status === 'error' && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Nome completo</label>
                <Input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Digite seu nome completo"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">E-mail</label>
                  <Input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="seu@email.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Telefone</label>
                  <Input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Senha</label>
                <Input
                  type="password"
                  name="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Mínimo 8 caracteres"
                />
              </div>

              <Button
                type="submit"
                disabled={status === 'loading' || status === 'success'}
                className="w-full"
              >
                {status === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {status === 'loading' ? 'Criando conta…' : 'Começar minha jornada'}
              </Button>
            </form>

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">ou cadastre-se com</span>
              <Separator className="flex-1" />
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() =>
                signIn('keycloak', { callbackUrl: '/onboarding' }, { kc_idp_hint: 'google' })
              }
            >
              <GoogleIcon />
              Continuar com Google
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Já faz parte da rede?{' '}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Entre agora
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
