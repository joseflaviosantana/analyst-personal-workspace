'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FolderKanban, 
  FileText, 
  PlusCircle, 
  ShieldCheck, 
  Database,
  Layers
} from 'lucide-react';
import { clsx } from 'clsx';

interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  const pathname = usePathname();

  const mainNavItems = [
    {
      name: 'Centro de Comando',
      href: '/cockpit',
      icon: LayoutDashboard,
      active: pathname === '/' || pathname === '/cockpit',
      testId: 'nav-cockpit',
    },
    {
      name: 'Pipeline Kanban',
      href: '/pipeline',
      icon: Layers,
      active: pathname.startsWith('/pipeline'),
      testId: 'nav-pipeline',
    },
    {
      name: 'Projetos',
      href: '/projects',
      icon: FolderKanban,
      active: pathname.startsWith('/projects'),
      testId: 'nav-projects',
    },
    {
      name: 'Demandas',
      href: '/demands',
      icon: FileText,
      active: pathname.startsWith('/demands'),
      testId: 'nav-demands',
    },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-950 text-slate-100 antialiased">
      {/* Sidebar Lateral */}
      <aside 
        data-testid="main-sidebar"
        className="flex w-64 flex-col border-r border-slate-800 bg-slate-900/70 backdrop-blur-md"
        aria-label="Navegação Principal"
      >
        <div className="flex h-16 items-center px-6 border-b border-slate-800">
          <Link href="/cockpit" className="flex items-center gap-2 font-bold text-base tracking-tight text-white hover:text-blue-400 transition-colors">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white font-extrabold text-sm shadow-sm">
              A
            </span>
            <span>Analyst Workspace</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-6" aria-label="Menu Lateral">
          <div>
            <div className="px-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Operacional
            </div>
            <ul className="space-y-1">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      data-testid={item.testId}
                      className={clsx(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        item.active
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold'
                          : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      <span>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Rodapé da Sidebar */}
        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center gap-2 rounded-lg bg-slate-950/60 border border-slate-800/80 p-3 text-xs text-slate-400">
            <Database className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <div className="truncate">
              <p className="font-semibold text-slate-300">SQLite Local-First</p>
              <p className="text-[11px] text-slate-400">Dados 100% Segregados</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Conteúdo Principal + Top Header */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header 
          data-testid="top-header"
          className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900/50 px-8 backdrop-blur-md"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 border border-emerald-800/60 px-2.5 py-0.5 text-xs text-emerald-400 font-medium">
                <ShieldCheck className="h-3.5 w-3.5" />
                V1 — Operacional
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/projects/new"
              data-testid="btn-quick-new-project"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Novo Projeto</span>
            </Link>

            <Link
              href="/demands/new"
              data-testid="btn-quick-new-demand"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950 transition-colors"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Nova Demanda</span>
            </Link>
          </div>
        </header>

        {/* Palco Central de Trabalho */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
