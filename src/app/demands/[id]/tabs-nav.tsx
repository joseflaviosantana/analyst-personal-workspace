'use client';

import React from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';

interface DemandTabsNavProps {
  demandId: string;
  activeTab: string;
}

export function DemandTabsNav({ demandId, activeTab }: DemandTabsNavProps) {
  const tabs = [
    { id: 'overview', label: '1. Visão Geral', active: activeTab === 'overview', ready: true },
    { id: 'requirements', label: '2. Requisitos', active: activeTab === 'requirements', ready: false },
    { id: 'data', label: '3. Ativos de Dados', active: activeTab === 'data', ready: true },
    { id: 'quality', label: '4. Qualidade', active: activeTab === 'quality', ready: true },
    { id: 'transformation', label: '5. Preparação', active: activeTab === 'transformation', ready: true },
    { id: 'planning', label: '6. Planejamento & KPIs', active: activeTab === 'planning', ready: false },
    { id: 'powerbi', label: '7. Power BI & DAX', active: activeTab === 'powerbi', ready: false },
    { id: 'findings', label: '8. Evidências', active: activeTab === 'findings', ready: false },
    { id: 'validation', label: '9. Validação', active: activeTab === 'validation', ready: false },
    { id: 'deliverables', label: '10. Entregáveis', active: activeTab === 'deliverables', ready: false },
    { id: 'dossier', label: '11. Dossiê & Portfólio', active: activeTab === 'dossier', ready: false },
  ];

  return (
    <div className="border-b border-slate-800 overflow-x-auto pb-px" data-testid="demand-workspace-tabs">
      <nav className="flex space-x-1" aria-label="Abas do Workspace da Demanda">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={`/demands/${demandId}?tab=${t.id}`}
            data-testid={`tab-nav-${t.id}`}
            className={clsx(
              'whitespace-nowrap px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5',
              t.active
                ? 'border-blue-500 bg-blue-950/30 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            )}
          >
            <span>{t.label}</span>
            {!t.ready && (
              <span className="text-[10px] text-slate-500 font-normal">
                (Em breve)
              </span>
            )}
          </Link>
        ))}
      </nav>
    </div>
  );
}
