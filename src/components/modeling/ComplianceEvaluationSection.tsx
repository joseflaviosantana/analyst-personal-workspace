'use client';

import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  RotateCw,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import {
  ResultadoAvaliacaoConformidade,
  DiagnosticoRegraModelagem,
} from '@/core/domain/rules/modeling-rules-evaluator';

interface ComplianceEvaluationSectionProps {
  conformidade: ResultadoAvaliacaoConformidade | null;
  onReevaluate: () => void;
  isLoading?: boolean;
}

export function ComplianceEvaluationSection({
  conformidade,
  onReevaluate,
  isLoading = false,
}: ComplianceEvaluationSectionProps) {
  if (!conformidade) {
    return null;
  }

  const bloqueios = conformidade.diagnosticos.filter((d) => d.severidade === 'BLOQUEIO');
  const alertasCriticos = conformidade.diagnosticos.filter((d) => d.severidade === 'ALERTA_CRITICO');
  const recomendacoes = conformidade.diagnosticos.filter((d) => d.severidade === 'RECOMENDACAO');

  return (
    <Card
      className="p-6 bg-slate-900/80 border-slate-800 space-y-6"
      id="modeling-compliance-section"
      data-testid="compliance-evaluation-section"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">
              Avaliação Determinística de Conformidade (Regras M-01 a M-11)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Diagnósticos produzidos pelo motor determinístico do domínio para validação prévia à homologação.
          </p>
        </div>

        <button
          type="button"
          onClick={onReevaluate}
          disabled={isLoading}
          data-testid="btn-reevaluate-compliance"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors disabled:opacity-50 shrink-0"
        >
          <RotateCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Reavaliar Modelo</span>
        </button>
      </div>

      {/* Badges Consolidadores */}
      <div className="flex items-center gap-3 flex-wrap">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${
            bloqueios.length > 0
              ? 'bg-red-950/80 text-red-400 border-red-800'
              : 'bg-slate-950 text-slate-400 border-slate-800'
          }`}
          data-testid="badge-count-blocks"
        >
          <ShieldAlert className="h-4 w-4" />
          <span>{bloqueios.length} Bloqueio(s)</span>
        </span>

        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${
            alertasCriticos.length > 0
              ? 'bg-orange-950/80 text-orange-400 border-orange-800'
              : 'bg-slate-950 text-slate-400 border-slate-800'
          }`}
          data-testid="badge-count-critical-alerts"
        >
          <AlertTriangle className="h-4 w-4" />
          <span>{alertasCriticos.length} Alerta(s) Crítico(s)</span>
        </span>

        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${
            recomendacoes.length > 0
              ? 'bg-blue-950/80 text-blue-400 border-blue-800'
              : 'bg-slate-950 text-slate-400 border-slate-800'
          }`}
          data-testid="badge-count-recommendations"
        >
          <Lightbulb className="h-4 w-4" />
          <span>{recomendacoes.length} Recomendação(ões)</span>
        </span>
      </div>

      {/* Lista de Diagnósticos */}
      {conformidade.diagnosticos.length === 0 ? (
        <div className="rounded-xl border border-emerald-800/80 bg-emerald-950/20 p-6 text-center space-y-2">
          <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
          <p className="text-sm font-semibold text-emerald-200">
            Conformidade Integral — Zero Problemas Detectados
          </p>
          <p className="text-xs text-emerald-300/80 max-w-md mx-auto">
            O modelo analítico atende plenamente a todas as regras determinísticas (M-01 a M-11) e está apto para homologação.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 1. BLOQUEIOS (vermelho) */}
          {bloqueios.map((d, index) => (
            <div
              key={`bloqueio-${d.codigo_regra}-${index}`}
              className="rounded-xl border border-red-800/80 bg-red-950/30 p-4 space-y-2.5"
              data-testid={`diagnostic-card-${d.codigo_regra}`}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-red-400 shrink-0" />
                  <span className="font-mono font-bold text-xs text-red-400 bg-red-950 px-2 py-0.5 rounded border border-red-800">
                    {d.codigo_regra}
                  </span>
                  <span className="font-semibold text-sm text-red-200">{d.titulo}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-900/80 text-white border border-red-700">
                  IMPEDE HOMOLOGAÇÃO
                </span>
              </div>

              <div className="text-xs space-y-1.5 text-slate-300 pl-6">
                <p>
                  <strong className="text-red-300">Detecção:</strong> {d.deteccao}
                </p>
                <p>
                  <strong className="text-slate-400">Por que bloqueia:</strong> {d.explicacao}
                </p>
                <p>
                  <strong className="text-emerald-300">Ação corretiva recomendada:</strong> {d.recomendacao}
                </p>
                <p className="text-[11px] font-mono text-slate-500">
                  <strong>Evidência:</strong> {d.evidencia}
                </p>
              </div>
            </div>
          ))}

          {/* 2. ALERTAS CRÍTICOS (laranja) */}
          {alertasCriticos.map((d, index) => (
            <div
              key={`alerta-${d.codigo_regra}-${index}`}
              className="rounded-xl border border-orange-800/80 bg-orange-950/30 p-4 space-y-2.5"
              data-testid={`diagnostic-card-${d.codigo_regra}`}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-400 shrink-0" />
                  <span className="font-mono font-bold text-xs text-orange-400 bg-orange-950 px-2 py-0.5 rounded border border-orange-800">
                    {d.codigo_regra}
                  </span>
                  <span className="font-semibold text-sm text-orange-200">{d.titulo}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-900/80 text-white border border-orange-700">
                  EXIGE JUSTIFICATIVA FORMAL
                </span>
              </div>

              <div className="text-xs space-y-1.5 text-slate-300 pl-6">
                <p>
                  <strong className="text-orange-300">Detecção:</strong> {d.deteccao}
                </p>
                <p>
                  <strong className="text-slate-400">Risco Analítico:</strong> {d.explicacao}
                </p>
                <p>
                  <strong className="text-cyan-300">Recomendação:</strong> {d.recomendacao}
                </p>
                <p className="text-[11px] text-orange-300/80">
                  <strong>Ação Humana Obrigatória:</strong> {d.acao_humana_necessaria}
                </p>
                <p className="text-[11px] font-mono text-slate-500">
                  <strong>Evidência:</strong> {d.evidencia}
                </p>
              </div>
            </div>
          ))}

          {/* 3. RECOMENDAÇÕES (azul) */}
          {recomendacoes.map((d, index) => (
            <div
              key={`rec-${d.codigo_regra}-${index}`}
              className="rounded-xl border border-blue-900/60 bg-blue-950/20 p-4 space-y-2.5"
              data-testid={`diagnostic-card-${d.codigo_regra}`}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-blue-400 shrink-0" />
                  <span className="font-mono font-bold text-xs text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                    {d.codigo_regra}
                  </span>
                  <span className="font-semibold text-sm text-blue-200">{d.titulo}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-950 text-blue-300 border border-blue-800">
                  BOA PRÁTICA (NÃO BLOQUEIA)
                </span>
              </div>

              <div className="text-xs space-y-1.5 text-slate-300 pl-6">
                <p>
                  <strong className="text-blue-300">Contexto:</strong> {d.deteccao}
                </p>
                <p>
                  <strong className="text-slate-400">Benefício Esperado:</strong> {d.explicacao}
                </p>
                <p>
                  <strong className="text-emerald-300">Sugestão:</strong> {d.recomendacao}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
