'use client';

import React from 'react';
import {
  Play,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  FileText,
  Info,
  HelpCircle,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { ResultadoQualityGate } from '@/core/domain/rules/quality-gate';
import { ProblemaQualidade } from '@/core/domain/entities/problema-qualidade';

interface NextActionBannerProps {
  hasAssets: boolean;
  hasDiagnostic: boolean;
  isExecuting: boolean;
  qualityGate: ResultadoQualityGate | null;
  problemas: ProblemaQualidade[];
  onRunDiagnostic: () => void;
  onScrollToProblems: () => void;
  onAdvanceDemand?: () => void;
  isReadOnly?: boolean;
}

export function NextActionBanner({
  hasAssets,
  hasDiagnostic,
  isExecuting,
  qualityGate,
  problemas,
  onRunDiagnostic,
  onScrollToProblems,
  onAdvanceDemand,
  isReadOnly = false,
}: NextActionBannerProps) {
  if (!hasAssets) {
    return (
      <div
        className="flex items-center justify-between rounded-xl border border-amber-800/80 bg-amber-950/30 p-4 text-amber-300"
        data-testid="next-action-banner-no-assets"
      >
        <div className="flex items-center gap-3">
          <Info className="h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <h2 className="text-sm font-semibold">Nenhum Ativo de Dados Catalogado</h2>
            <p className="text-xs text-amber-400/90 mt-0.5">
              Cadastre ao menos um arquivo de dados na Aba 3 (Ativos de Dados) para iniciar a análise de qualidade.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasDiagnostic) {
    return (
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-blue-800/80 bg-blue-950/40 p-4 text-blue-200"
        data-testid="next-action-banner-need-diagnostic"
      >
        <div className="flex items-center gap-3">
          <Play className="h-5 w-5 shrink-0 text-blue-400 fill-current" />
          <div>
            <h2 className="text-sm font-semibold text-white">Próximo Passo: Executar Primeiro Diagnóstico</h2>
            <p className="text-xs text-blue-300/90 mt-0.5">
              O arquivo foi catalogado. Execute a varredura determinística para avaliar nulos, duplicidades, tipos e regras de negócio.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRunDiagnostic}
          disabled={isExecuting || isReadOnly}
          data-testid="btn-banner-run-diagnostic"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 transition-colors shrink-0"
        >
          {isExecuting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Executando...</span>
            </>
          ) : (
            <>
              <span>Executar Diagnóstico</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </div>
    );
  }

  const pendentes = qualityGate?.detalhes.totalPendentes ??
    problemas.filter((p) => p.severidade === 'PENDENTE').length;

  const criticosBloqueantes = qualityGate?.detalhes.totalCriticosBloqueantes ??
    problemas.filter((p) => p.severidade === 'CRITICA' && (p.status === 'ABERTO' || p.status === 'EM_INVESTIGACAO')).length;

  const altosBloqueantes = qualityGate?.detalhes.totalAltosBloqueantes ??
    problemas.filter((p) => p.severidade === 'ALTA' && (p.status === 'ABERTO' || p.status === 'EM_INVESTIGACAO')).length;

  // Cenário 1: Há pendências de classificação humana (invariante de proteção)
  if (pendentes > 0) {
    return (
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-amber-800 bg-amber-950/40 p-4 text-amber-200"
        data-testid="next-action-banner-pending"
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <h2 className="text-sm font-semibold text-amber-300">
              Ação Necessária: {pendentes} problema(s) aguardando sua deliberação
            </h2>
            <p className="text-xs text-amber-300/80 mt-0.5">
              O Quality Gate bloqueia o avanço até que você defina a severidade (risco) e a ação de cada anomalia detectada.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onScrollToProblems}
          data-testid="btn-banner-resolve-pending"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm hover:bg-amber-500 transition-colors shrink-0"
        >
          <span>Classificar Pendências</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  // Cenário 2: Há problemas críticos ou altos em aberto
  if (criticosBloqueantes > 0 || altosBloqueantes > 0) {
    const total = criticosBloqueantes + altosBloqueantes;
    return (
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-rose-900 bg-rose-950/40 p-4 text-rose-200"
        data-testid="next-action-banner-critical"
      >
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-5 w-5 shrink-0 text-rose-400" />
          <div>
            <h2 className="text-sm font-semibold text-rose-300">
              Ação Bloqueante: {total} anomalia(s) de alto risco em aberto
            </h2>
            <p className="text-xs text-rose-300/80 mt-0.5">
              Marque como 'Tratado' após corrigir ou 'Aceitar como Restrição' com justificativa formal para liberar o avanço.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onScrollToProblems}
          data-testid="btn-banner-treat-critical"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-600 transition-colors shrink-0"
        >
          <span>Ver Problemas Bloqueantes</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  // Cenário 3: Liberado com Ressalva (guardrail operacional atingido)
  if (qualityGate?.decisao === 'LIBERADO_COM_RESSALVA') {
    return (
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-cyan-800 bg-cyan-950/40 p-4 text-cyan-200"
        data-testid="next-action-banner-ressalva"
      >
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 shrink-0 text-cyan-400" />
          <div>
            <h2 className="text-sm font-semibold text-cyan-300">
              Qualidade Liberada com Ressalva
            </h2>
            <p className="text-xs text-cyan-300/80 mt-0.5">
              O diagnóstico foi concluído com limitações de amostra. Ao avançar a demanda para Modelagem, será solicitada justificativa formal.
            </p>
          </div>
        </div>
        {onAdvanceDemand && !isReadOnly && (
          <button
            type="button"
            onClick={onAdvanceDemand}
            data-testid="btn-banner-advance-demand"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-cyan-500 transition-colors shrink-0"
          >
            <span>Avançar para Modelagem</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  }

  // Cenário 4: Totalmente Liberado
  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-emerald-800 bg-emerald-950/40 p-4 text-emerald-200"
      data-testid="next-action-banner-cleared"
    >
      <div className="flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
        <div>
          <h2 className="text-sm font-semibold text-emerald-300">
            Qualidade Liberada para Modelagem e Análise
          </h2>
          <p className="text-xs text-emerald-300/80 mt-0.5">
            Todos os problemas foram deliberados e tratados. O Quality Gate está verde e a demanda pode prosseguir.
          </p>
        </div>
      </div>
      {onAdvanceDemand && !isReadOnly && (
        <button
          type="button"
          onClick={onAdvanceDemand}
          data-testid="btn-banner-advance-demand"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors shrink-0"
        >
          <span>Avançar Demanda</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
