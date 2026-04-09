import './global.css';
import { Inter, Poppins } from 'next/font/google';

import { AppSessionProvider } from '../components/providers/AppSessionProvider';
import { AppNavbar } from '../components/landing/AppNavbar';

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
        {/*
         * AppSessionProvider é um Client Component (usa useContext do next-auth).
         * O header fica DENTRO do provider para que NavbarAuthButtons possa
         * ler a sessão via useSession() sem hydration mismatch.
         */}
        <AppSessionProvider>
          <AppNavbar />

          <main className="flex-grow">
            {children}
          </main>
        </AppSessionProvider>

        <footer className="border-t border-border mt-auto py-8">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            &copy; 2026 Globus Dei. Todos os direitos reservados.
          </div>
        </footer>
      </body>
    </html>
  );
}
