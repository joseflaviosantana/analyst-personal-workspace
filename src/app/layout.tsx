import type { Metadata } from 'next';
import './globals.css';
import { Shell } from '@/components/layout/Shell';

export const metadata: Metadata = {
  title: 'Analyst Personal Workspace — V1',
  description: 'Sistema Operacional Pessoal para Trabalho em Dados e BI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-blue-600/30">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
