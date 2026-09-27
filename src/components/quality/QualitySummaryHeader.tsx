'use client';

import React from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Play,
  Loader2,
  Database,
  Layers,
  FileCheck
} from 'lucide-react';
import { AtivoDados } from '@/core/domain/entities/ativo-dados';
import { DiagnosticoQualidade } from '@/core/domain/entities/diagnostico-qualidade';
import { ProblemaQualidade } from '@/core/domain/entities/problema-qualidade';
import { ResultadoQualityGate } from '@/core/domain/rules/quality-gate';
import { Card } from '@/components/ui/Card';

interface QualitySummaryHeaderProps {
  assets: AtivoDados[];
  selectedAsset: AtivoDados | null;
  onSelectAsset: (asset: AtivoDados) => void;
  qualityGate: ResultadoQualityGate | null;
  diagnostico: DiagnosticoQualidade | null;
  problemas: ProblemaQualidade[];
  isExecuting: boolean;
  onRunDiagnostic: () => void;
  isReadOnly: boolean;
}

export function QualitySummaryHeader({
  assets,
  selectedAsset,
  onSelectAsset,
  qualityGate,
  diagnostico,
  problemas,
  isExecuting,
  onRunDiagnostic,
  isReadOnly,
}: QualitySummaryHeaderProps) {
  const totalPendentes = qualityGate?.detalhes.totalPendentes ??
    problemas.filter((p) => p.severidade === 'PENDENTE').length;

  const totalCriticosBloqueantes = qualityGate?.detalhes.totalCriticosBloqueantes ??
    problemas.filter((p) => p.severidade === 'CRITICA' && (p.status === 'ABERTO' || p.status === 'EM_INVESTIGACAO')).length;

  const totalAltosBloqueantes = qualityGate?.detalhes.totalAltosBloqueantes ??
    problemas.filter((p) => p.severidade === 'ALTA' && (p.status === 'ABERTO' || p.status === 'EM_INVESTIGACAO')).length;

  const totalTratados = qualityGate?.detalhes.totalTratados ??
    problemas.filter((p) => p.status === 'TRATADO').length;

  const decisaoGate = qualityGate?.decisao;
  const isGateLiberado = decisaoGate === 'LIBERADO';
  const isGateRessalva = decisaoGate === 'LIBERADO_COM_RESSALVA';
  const isGateBloqueado = decisaoGate === 'BLOQUEADO' || !qualityGate;

  // Cálculo da saúde geral estimada (conformidade)
  let percentualConformidade = 100;
  if (diagnostico && diagnostico.total_linhas_avaliadas > 0) {
    const totalAfetadasUnicas = problemas.reduce((acc, p) => acc + (p.total_linhas_afetadas || 0), 0);
    const taxa = Math.max(0, 100 - (totalAfetadasUnicas / diagnostico.total_linhas_avaliadas) * 100);
    percentualConformidade = Math.round(taxa * 10) / 10;
  }

  return (
    <div className="space-y-4" data-testid="quality-summary-header">
      {/* Barra de Seleção de Ativo e Botão de Ação Primária */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-900/60 bg-blue-950/40 text-blue-400">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Ativo de Dados em Avaliação:
              </span>
              {assets.length > 1 ? (
                <select
                  aria-label="Selecionar Ativo de Dados para Avaliação"
                  value={selectedAsset?.id || ''}
                  onChange={(e) => {
                    const found = assets.find((a) => a.id === e.target.value);
                    if (found) onSelectAsset(found);
                  }}
                  className="rounded bg-slate-800 border border-slate-700 px-2 py-1 text-xs font-semibold text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  data-testid="select-quality-asset"
                >
                  {assets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.nome_arquivo} (v{asset.versao || '1.0'})
                    </option>
                  ))}
                </select>
              ) : selectedAsset ? (
                <span className="font-semibold text-sm text-slate-200" data-testid="selected-asset-name">
                  {selectedAsset.nome_arquivo} <span className="font-mono text-xs text-blue-400">v{selectedAsset.versao || '1.0'}</span>
                </span>
              ) : (
                <span className="text-sm text-slate-500 italic">Nenhum ativo selecionado</span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {diagnostico ? (
                <span>
                  Último diagnóstico: {new Date(diagnostico.iniciado_em).toLocaleString('pt-BR')} ({diagnostico.total_linhas_avaliadas.toLocaleString('pt-BR')} linhas)
                </span>
              ) : (
                <span className="text-amber-400">Nenhum diagnóstico de qualidade executado para este ativo.</span>
              )}
            </p>
          </div>
        </div>

        {/* Botão de Disparo do Diagnóstico */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRunDiagnostic}
            disabled={isExecuting || !selectedAsset || isReadOnly}
            data-testid="btn-run-quality-diagnostic"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Executar verificação determinística de qualidade sobre o arquivo"
          >
            {isExecuting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>Diagnosticando dados...</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>{diagnostico ? 'Reexecutar Diagnóstico' : 'Executar Diagnóstico'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid de 4 Cards do Resumo Executivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="quality-kpi-grid">
        {/* Card 1: Saúde Geral */}
        <Card className="p-4 border-slate-800 bg-slate-900/60" testId="card-kpi-health">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Saúde Geral</span>
            <FileCheck className="h-4 w-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white" data-testid="kpi-health-rate">
              {diagnostico ? `${percentualConformidade}%` : '—'}
            </span>
            <span className="text-xs text-slate-400">
              {diagnostico
                ? (percentualConformidade >= 95 ? 'Conforme' : percentualConformidade >= 80 ? 'Atenção' : 'Crítico')
                : 'Não avaliado'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 truncate">
            {diagnostico ? `${problemas.length} anomalia(s) identificada(s)` : 'Aguardando diagnóstico'}
          </p>
        </Card>

        {/* Card 2: Pendentes de Classificação */}
        <Card
          className={`p-4 transition-colors ${
            totalPendentes > 0
              ? 'border-amber-700/80 bg-amber-950/20'
              : 'border-slate-800 bg-slate-900/60'
          }`}
          testId="card-kpi-pending"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className={`text-xs font-semibold uppercase tracking-wider ${totalPendentes > 0 ? 'text-amber-300' : ''}`}>
              Pendentes de Decisão
            </span>
            <AlertTriangle className={`h-4 w-4 ${totalPendentes > 0 ? 'text-amber-400' : 'text-slate-400'}`} />
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold tracking-tight ${totalPendentes > 0 ? 'text-amber-300' : 'text-slate-200'}`}
              data-testid="kpi-pending-count"
            >
              {totalPendentes}
            </span>
            <span className="text-xs text-slate-400">
              {totalPendentes === 1 ? 'problema pendente' : 'problemas pendentes'}
            </span>
          </div>
          <p className={`text-[11px] mt-2 ${totalPendentes > 0 ? 'text-amber-400 font-medium' : 'text-slate-400'}`}>
            {totalPendentes > 0 ? 'Bloqueia o avanço da demanda' : 'Nenhuma classificação pendente'}
          </p>
        </Card>

        {/* Card 3: Riscos Críticos e Altos */}
        <Card
          className={`p-4 transition-colors ${
            totalCriticosBloqueantes > 0 || totalAltosBloqueantes > 0
              ? 'border-rose-900/80 bg-rose-950/20'
              : 'border-slate-800 bg-slate-900/60'
          }`}
          testId="card-kpi-risks"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className={`text-xs font-semibold uppercase tracking-wider ${totalCriticosBloqueantes > 0 ? 'text-rose-300' : ''}`}>
              Riscos em Aberto
            </span>
            <ShieldAlert className={`h-4 w-4 ${totalCriticosBloqueantes > 0 ? 'text-rose-400' : 'text-slate-400'}`} />
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold tracking-tight ${totalCriticosBloqueantes > 0 ? 'text-rose-300' : 'text-slate-200'}`}
              data-testid="kpi-critical-count"
            >
              {totalCriticosBloqueantes + totalAltosBloqueantes}
            </span>
            <span className="text-xs text-slate-400">
              ({totalCriticosBloqueantes} críticos, {totalAltosBloqueantes} altos)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 truncate">
            {totalTratados > 0 ? `${totalTratados} anomalia(s) já tratada(s)` : 'Sem tratamentos concluídos'}
          </p>
        </Card>

        {/* Card 4: Quality Gate */}
        <Card
          className={`p-4 border ${
            isGateLiberado
              ? 'border-emerald-800/80 bg-emerald-950/20'
              : isGateRessalva
              ? 'border-cyan-800/80 bg-cyan-950/20'
              : 'border-rose-900/80 bg-rose-950/20'
          }`}
          testId="card-kpi-quality-gate"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Quality Gate
            </span>
            {isGateLiberado ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : isGateRessalva ? (
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
            ) : (
              <ShieldAlert className="h-4 w-4 text-rose-400" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                isGateLiberado
                  ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/80'
                  : isGateRessalva
                  ? 'bg-cyan-900/60 text-cyan-300 border border-cyan-700/80'
                  : 'bg-rose-900/60 text-rose-300 border border-rose-700/80'
              }`}
              data-testid="badge-quality-gate-status"
            >
              {decisaoGate ? decisaoGate.replace(/_/g, ' ') : 'BLOQUEADO'}
            </span>
          </div>
          <p
            className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-tight"
            data-testid="quality-gate-reason"
            title={qualityGate?.motivo || 'Diagnóstico pendente'}
          >
            {qualityGate?.motivo || 'O ativo precisa de diagnóstico para liberação.'}
          </p>
        </Card>
      </div>
    </div>
  );
}
