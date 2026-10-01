'use client';

import React, { useEffect, useState } from 'react';
import {
  ArrowUp,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { OrientacaoCopilotoOutput } from '@/core/use-cases/copilot';

interface CopilotStickyDockProps {
  orientacao: OrientacaoCopilotoOutput;
  targetElementId?: string;
  onExecuteAction?: () => void;
  actionButtonLabel?: string;
  actionButtonIcon?: React.ReactNode;
  isReadOnly?: boolean;
}

export function CopilotStickyDock({
  orientacao,
  targetElementId = 'copilot-main-panel',
  onExecuteAction,
  actionButtonLabel,
  actionButtonIcon,
  isReadOnly = false,
}: CopilotStickyDockProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById(targetElementId);
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Quando o painel principal superior sai do campo de visão (scroll para baixo), o dock aparece
        setIsVisible(!entry.isIntersecting);
      },
      {
        threshold: 0.1,
      }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [targetElementId]);

  if (!isVisible) {
    return null;
  }

  const { prioridade, cenario, temBloqueio, acaoRecomendada, hierarquia } = orientacao;

  const scrollToTopPanel = () => {
    const target = document.getElementById(targetElementId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Cores de status sóbrias
  const statusStyles = temBloqueio
    ? 'border-red-800/80 bg-slate-950/90 text-red-300'
    : prioridade === 'ACAO_NECESSARIA'
    ? 'border-amber-800/80 bg-slate-950/90 text-amber-300'
    : prioridade === 'PROXIMO_PASSO' && cenario === 'HOMOLOGADO_E_VIGENTE'
    ? 'border-emerald-800/80 bg-slate-950/90 text-emerald-300'
    : 'border-slate-700 bg-slate-950/90 text-slate-200';

  const statusTextStyles = temBloqueio
    ? 'text-red-300'
    : prioridade === 'ACAO_NECESSARIA'
    ? 'text-amber-300'
    : cenario === 'HOMOLOGADO_E_VIGENTE'
    ? 'text-emerald-300'
    : 'text-slate-300';

  return (
    <aside
      role="complementary"
      aria-label="Acompanhamento do Copiloto"
      data-testid="copilot-sticky-dock"
      className={`fixed bottom-4 right-4 sm:right-6 z-30 flex items-center gap-3 rounded-lg border px-3.5 py-2 shadow-lg backdrop-blur-md transition-all duration-200 text-xs ${statusStyles}`}
    >
      <div className="flex items-center gap-2">
        {temBloqueio ? (
          <ShieldAlert className="h-4 w-4 text-red-400 shrink-0" />
        ) : prioridade === 'ACAO_NECESSARIA' ? (
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
        ) : cenario === 'HOMOLOGADO_E_VIGENTE' ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
        ) : (
          <Sparkles className="h-4 w-4 text-blue-400 shrink-0" />
        )}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-semibold text-slate-300 hidden md:inline">
            6. Modelagem
          </span>
          <span className="text-slate-600 hidden md:inline">•</span>
          <span className={`font-medium ${statusTextStyles}`}>
            {hierarquia?.situacaoAtual?.rotulo || (temBloqueio ? 'Bloqueio Ativo' : 'Situação Regular')}
          </span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-slate-300 hidden sm:inline">
            <strong className="text-white">Próximo: </strong>
            {hierarquia?.proximoPasso?.acaoTitulo || acaoRecomendada.titulo}
          </span>
        </div>
        <div className="sm:hidden font-medium text-white truncate max-w-[140px]">
          {hierarquia?.proximoPasso?.acaoTitulo || acaoRecomendada.titulo}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {!isReadOnly && onExecuteAction && hierarquia?.proximoPasso?.podeExecutar !== false && (
          <button
            type="button"
            onClick={onExecuteAction}
            data-testid="btn-dock-action"
            className="inline-flex items-center gap-1.5 rounded bg-blue-600 hover:bg-blue-500 px-2.5 py-1 text-xs font-semibold text-white transition-colors shadow-sm"
          >
            {actionButtonIcon}
            <span>{actionButtonLabel || hierarquia?.proximoPasso?.acaoTitulo || 'Executar Ação'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={scrollToTopPanel}
          data-testid="btn-dock-scroll-top"
          title="Rolar para o painel principal do Copiloto"
          aria-label="Rolar para o painel principal do Copiloto"
          className="inline-flex items-center justify-center p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
