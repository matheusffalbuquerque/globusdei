'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export function NavbarAuthButtons() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div className="h-9 w-32 animate-pulse rounded-xl bg-slate-100" />;
  }

  if (session) {
    return (
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void signOut({ callbackUrl: '/' })}
          className="text-sm font-semibold bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90 active:scale-95 transition-all"
        >
          Sair
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/login"
        className="text-sm font-medium text-slate-600 hover:text-primary transition-colors px-3 py-2 rounded-xl hover:bg-slate-50"
      >
        Entrar
      </Link>
      <Link
        href="/register"
        className="text-sm font-semibold bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90 active:scale-95 transition-all"
      >
        Criar Conta
      </Link>
    </div>
  );
}
