import './global.css';
import { Inter, Poppins } from 'next/font/google';
import Link from 'next/link';

import { AppSessionProvider } from '../components/providers/AppSessionProvider';

/**
 * Loading Inter locally optimized for readable body text.
 */
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

/**
 * Loading Poppins locally optimized for prominent, bold display headers.
 */
const poppins = Poppins({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata = {
  title: 'Globus Dei - Network de Missões',
  description: 'Conectando missionários, projetos e agências ao redor do mundo.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br" className={`${inter.variable} ${poppins.variable}`}>
      <body className="font-sans bg-background text-foreground antialiased min-h-screen flex flex-col">
        <AppSessionProvider>
          <header className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur-sm">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img src="/logo.png" alt="Globus Dei Logo" className="h-10 w-auto" />
                <span className="font-display font-semibold text-2xl text-primary">Globus Dei</span>
              </div>

              <nav className="flex items-center gap-8 text-sm font-medium">
                <a href="#" className="hover:text-primary transition-colors text-slate-700">Rede Global</a>
                <a href="#" className="hover:text-primary transition-colors text-slate-700">Projetos</a>
                <a href="#" className="hover:text-primary transition-colors text-slate-700">Oportunidades</a>
              </nav>

              <div className="flex items-center gap-3">
                <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors px-3 py-2 rounded-xl hover:bg-slate-50">
                  Entrar
                </Link>
                <Link href="/register" className="text-sm font-semibold bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90 active:scale-95 transition-all">
                  Criar Conta
                </Link>
              </div>
            </div>
          </header>

          <main className="flex-grow">
            {children}
          </main>

          <footer className="border-t border-border mt-auto py-8">
            <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
              &copy; 2026 Globus Dei. Todos os direitos reservados.
            </div>
          </footer>
        </AppSessionProvider>
      </body>
    </html>
  );
}
