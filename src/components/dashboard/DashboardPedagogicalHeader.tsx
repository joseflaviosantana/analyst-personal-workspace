'use client';

/**
 * src/components/dashboard/DashboardPedagogicalHeader.tsx
 *
 * Cabeçalho Pedagógico da Aba 7 — Power BI & Dashboard (Subgate 3.4A)
 *
 * Comunicação direta e sem jargões:
 * - Onde estou: "Você está em: Power BI & Dashboard"
 * - Objetivo: transformar o modelo analítico homologado em métricas, medidas DAX e uma experiência visual capaz de responder às perguntas de negócio.
 * - Próxima Ação Principal: Indicação clara da ação humana recomendada.
 */

import React from 'react';
import { LayoutDashboard, Compass, ArrowRight, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { EstadoPedagogicoDashboard } from '@/core/use-cases/dashboard/executar-copiloto-dashboard.use-case';
import { ProximaAcaoSugeridaCopilot } from '@/core/domain/dashboard-copilot/dashboard-copilot-types';

interface DashboardPedagogicalHeaderProps {
  estadoPedagogico?: EstadoPedagogicoDashboard;
  proximaAcao?: ProximaAcaoSugeridaCopilot;
  isIsento?: boolean;
  totalMedidas?: number;
  totalPaginas?: number;
}

export function DashboardPedagogicalHeader({
  estadoPedagogico,
  proximaAcao,
  isIsento = false,
  totalMedidas = 0,
  totalPaginas = 0,
}: DashboardPedagogicalHeaderProps) {
  const acaoTitulo = proximaAcao?.titulo || 'Inicializar Estrutura do Dashboard';
  const acaoDescricao =
    proximaAcao?.descricao ||
    (isIsento
      ? 'Demanda formalmente isenta de artefatos Power BI. Prossiga para revisão e validação.'
      : totalMedidas === 0
      ? 'Adicione a primeira medida DAX ou importe o arquivo do modelo para iniciar a modelagem visual.'
      : 'Revise as medidas DAX e verifique a correspondência com as perguntas de negócio.');

  return (
    <div
      data-testid="dashboard-pedagogical-header"
      className="rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 p-5 shadow-lg relative overflow-hidden"
    >
      {/* Indicador sutil de fundo */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col gap-4">
        {/* Faixa Superior: Identificação da Etapa */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <LayoutDashboard className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-400">
                Você está em:
              </span>
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                Power BI &amp; Dashboard
                {isIsento && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-400">
                    Isenção Excel-Only
                  </span>
                )}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800/60 border border-slate-700/50">
              <Compass className="h-3.5 w-3.5 text-blue-400" />
              <span>Etapa 7 de 11</span>
            </span>
          </div>
        </div>

        {/* Objetivo Declarado da Etapa */}
        <div>
          <p
            data-testid="dashboard-pedagogical-objective"
            className="text-xs sm:text-sm text-slate-300 leading-relaxed"
          >
            <strong className="text-white font-medium">Objetivo: </strong>
            transformar o modelo analítico homologado em métricas, medidas DAX e uma experiência visual capaz de responder às perguntas de negócio.
          </p>
        </div>

        {/* Indicação Clara da Próxima Ação Principal */}
        <div
          data-testid="dashboard-next-action-banner"
          className="rounded-lg border border-indigo-900/60 bg-indigo-950/30 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 h-6 w-6 rounded-md bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 text-indigo-300">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                  Próxima Ação Principal
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  (Intervenção Humana Necessária)
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-semibold text-white mt-0.5">
                {acaoTitulo}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5 leading-snug">
                {acaoDescricao}
              </p>
            </div>
          </div>

          <div className="flex-shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/90 text-white text-xs font-medium shadow-sm hover:bg-indigo-600 transition-colors cursor-pointer">
              <span>Orientação de Trabalho</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
