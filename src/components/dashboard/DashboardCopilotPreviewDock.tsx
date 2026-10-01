'use client';

/**
 * src/components/dashboard/DashboardCopilotPreviewDock.tsx
 *
 * Reserva Arquitetural e Visual do Copiloto Proativo de Dashboard (Subgate 3.4A)
 *
 * Exibe a orientação pedagógica mínima derivada estritamente de `estadoPedagogico`,
 * sem duplicar regras nem executar computações analíticas dentro do componente React.
 * Prepara o espaço contextual para a expansão completa no Subgate 3.4D.
 */

import React, { useState } from 'react';
import { Sparkles, BookOpen, Lightbulb, ChevronDown, ChevronUp, Bot, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { EstadoPedagogicoDashboard } from '@/core/use-cases/dashboard/executar-copiloto-dashboard.use-case';

interface DashboardCopilotPreviewDockProps {
  estadoPedagogico?: EstadoPedagogicoDashboard;
  totalInsights?: number;
}

export function DashboardCopilotPreviewDock({
  estadoPedagogico,
  totalInsights = 0,
}: DashboardCopilotPreviewDockProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!estadoPedagogico) {
    return null;
  }

  return (
    <div data-testid="dashboard-copilot-dock" className="space-y-3">
      <Card className="p-4 border-indigo-900/50 bg-gradient-to-b from-indigo-950/30 via-slate-900/90 to-slate-950 shadow-md">
        {/* Cabeçalho do Dock */}
        <div className="flex items-center justify-between border-b border-indigo-950/60 pb-2.5 mb-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">
                Copiloto Proativo (Contextual)
              </span>
              <h4 className="text-xs font-semibold text-white">
                Orientação &amp; Aprendizado
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {totalInsights > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-300 font-mono">
                {totalInsights} insight(s)
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
              title={isExpanded ? 'Recolher Orientação' : 'Expandir Orientação'}
            >
              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Conteúdo Pedagógico Progressivo */}
        {isExpanded && (
          <div className="space-y-3 text-xs">
            {/* O que foi detectado */}
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-1.5 text-indigo-300 font-semibold mb-1 text-[11px]">
                <Bot className="h-3.5 w-3.5" />
                <span>O que foi detectado:</span>
              </div>
              <p className="text-slate-300 leading-snug text-[11px]">
                {estadoPedagogico.oQueFoiDetectado}
              </p>
            </div>

            {/* O que devo considerar fazer agora */}
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-1.5 text-amber-300 font-semibold mb-1 text-[11px]">
                <Lightbulb className="h-3.5 w-3.5" />
                <span>O que considerar fazer agora:</span>
              </div>
              <p className="text-slate-300 leading-snug text-[11px]">
                {estadoPedagogico.oQueConsiderarFazerAgora}
              </p>
            </div>

            {/* O que estou aprendendo neste momento */}
            {estadoPedagogico.oQueEstouAprendendo && (
              <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-900/40">
                <div className="flex items-center gap-1.5 text-blue-300 font-semibold mb-1 text-[11px]">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Aprenda Enquanto Trabalha:</span>
                </div>
                <p className="text-slate-300 leading-snug text-[11px]">
                  {estadoPedagogico.oQueEstouAprendendo}
                </p>
              </div>
            )}

            {/* Nota de Reserva Arquitetural */}
            <div className="pt-1 text-[10px] text-slate-500 font-mono text-center">
              Painel Completo com Progressive Disclosure e Filtros: Subgate 3.4D
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
