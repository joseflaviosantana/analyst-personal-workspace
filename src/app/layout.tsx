import type { Metadata } from 'next';
import './globals.css';

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
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
