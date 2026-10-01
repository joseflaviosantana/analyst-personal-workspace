'use client';

/**
 * src/components/dashboard/DashboardProgressiveNavigation.tsx
 *
 * Navegador por Blocos Progressivos da Aba 7 — Power BI & Dashboard (Subgate 3.4A)
 *
 * Aplica Progressive Disclosure para reduzir carga cognitiva em 5 fases sequenciais:
 * 1. Visão Geral
 * 2. Métricas & DAX
 * 3. Páginas do Dashboard
 * 4. Visuais
 * 5. Validação
 */

import React from 'react';
import { clsx } from 'clsx';
import {
  FileSpreadsheet,
  Calculator,
  BookOpen,
  PieChart,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  PackageCheck,
} from 'lucide-react';

export type BlocoProgressivoDashboard =
  | 'visao-geral'
  | 'metricas-dax'
  | 'paginas'
  | 'visuais'
  | 'validacao'
  | 'entrega-documentacao';

export interface BlocoProgressivoInfo {
  id: BlocoProgressivoDashboard;
  numero: number;
  titulo: string;
  subtitulo: string;
  icon: React.ElementType;
  badgeContagem?: number;
  badgeStatus?: 'conforme' | 'atencao' | 'pendente' | 'isento';
}

interface DashboardProgressiveNavigationProps {
  blocoAtivo: BlocoProgressivoDashboard;
  onSelecionarBloco: (bloco: BlocoProgressivoDashboard) => void;
  totalMedidas?: number;
  totalPaginas?: number;
  totalVisuais?: number;
  totalBloqueios?: number;
  isIsento?: boolean;
}

export function DashboardProgressiveNavigation({
  blocoAtivo,
  onSelecionarBloco,
  totalMedidas = 0,
  totalPaginas = 0,
  totalVisuais = 0,
  totalBloqueios = 0,
  isIsento = false,
}: DashboardProgressiveNavigationProps) {
  const blocos: BlocoProgressivoInfo[] = [
    {
      id: 'visao-geral',
      numero: 1,
      titulo: 'Visão Geral',
      subtitulo: isIsento ? 'Isenção Excel-Only' : 'Modelo e Arquivo',
      icon: FileSpreadsheet,
      badgeStatus: isIsento ? 'isento' : 'conforme',
    },
    {
      id: 'metricas-dax',
      numero: 2,
      titulo: 'Métricas & DAX',
      subtitulo: `${totalMedidas} medida(s)`,
      icon: Calculator,
      badgeContagem: totalMedidas,
      badgeStatus: totalMedidas > 0 ? 'conforme' : 'pendente',
    },
    {
      id: 'paginas',
      numero: 3,
      titulo: 'Páginas do Dashboard',
      subtitulo: `${totalPaginas} página(s)`,
      icon: BookOpen,
      badgeContagem: totalPaginas,
      badgeStatus: totalPaginas > 0 ? 'conforme' : 'pendente',
    },
    {
      id: 'visuais',
      numero: 4,
      titulo: 'Visuais',
      subtitulo: `${totalVisuais} visual(is)`,
      icon: PieChart,
      badgeContagem: totalVisuais,
      badgeStatus: totalVisuais > 0 ? 'conforme' : 'pendente',
    },
    {
      id: 'validacao',
      numero: 5,
      titulo: 'Validação',
      subtitulo: totalBloqueios === 0 ? 'Prontidão' : `${totalBloqueios} bloqueio(s)`,
      icon: ShieldCheck,
      badgeStatus: totalBloqueios === 0 ? 'conforme' : 'atencao',
    },
    {
      id: 'entrega-documentacao',
      numero: 6,
      titulo: 'Entrega & Docs',
      subtitulo: totalBloqueios === 0 ? 'Pronto' : 'Pendências',
      icon: PackageCheck,
      badgeStatus: totalBloqueios === 0 ? 'conforme' : 'atencao',
    },
  ];

  return (
    <div
      data-testid="dashboard-progressive-navigation"
      className="border-b border-slate-800 pb-3"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Estrutura Progressiva da Etapa
        </span>
        <span className="text-[11px] text-slate-500 font-mono">
          Navegue pelas 6 dimensões sem sobrecarga de informação
        </span>
      </div>

      <nav
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2"
        aria-label="Navegação em Blocos Progressivos do Dashboard"
      >
        {blocos.map((bloco) => {
          const isAtivo = blocoAtivo === bloco.id;
          const Icon = bloco.icon;

          return (
            <button
              type="button"
              key={bloco.id}
              onClick={() => onSelecionarBloco(bloco.id)}
              data-testid={`btn-bloco-${bloco.id}`}
              className={clsx(
                'flex flex-col text-left p-3 rounded-lg border transition-all text-xs relative overflow-hidden',
                isAtivo
                  ? 'border-blue-500/80 bg-blue-950/40 text-white shadow-sm ring-1 ring-blue-500/30'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:border-slate-700 hover:bg-slate-900'
              )}
            >
              {/* Linha indicadora superior para aba ativa */}
              {isAtivo && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500" />
              )}

              <div className="flex items-center justify-between w-full mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className={clsx(
                      'h-5 w-5 rounded-md flex items-center justify-center text-[10px] font-bold',
                      isAtivo
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    )}
                  >
                    {bloco.numero}
                  </span>
                  <Icon className={clsx('h-3.5 w-3.5', isAtivo ? 'text-blue-400' : 'text-slate-500')} />
                </div>

                {bloco.badgeContagem !== undefined && (
                  <span
                    className={clsx(
                      'px-1.5 py-0.2 rounded text-[10px] font-mono font-medium',
                      bloco.badgeContagem > 0
                        ? 'bg-slate-800 text-slate-300'
                        : 'bg-slate-800/40 text-slate-500'
                    )}
                  >
                    {bloco.badgeContagem}
                  </span>
                )}
              </div>

              <span className={clsx('font-semibold truncate text-[12px]', isAtivo ? 'text-white' : 'text-slate-300')}>
                {bloco.titulo}
              </span>
              <span className="text-[10px] text-slate-500 truncate mt-0.5">
                {bloco.subtitulo}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
