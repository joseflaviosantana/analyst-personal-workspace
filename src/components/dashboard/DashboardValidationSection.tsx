'use client';

/**
 * src/components/dashboard/DashboardValidationSection.tsx
 *
 * Bloco 5 — Validação Normativa D-01 a D-08 (Subgate 3.4A)
 *
 * Apresenta a avaliação determinística da prontidão técnica do dashboard,
 * segregando conformidade, bloqueios impeditivos, alertas críticos e recomendações.
 */

import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Info, CheckCircle2, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { ResultadoProntidaoDashboard } from '@/core/domain/rules/dashboard-rules-evaluator';

interface DashboardValidationSectionProps {
  resultadoDax?: ResultadoProntidaoDashboard | null;
  isIsento?: boolean;
}

export function DashboardValidationSection({
  resultadoDax,
  isIsento = false,
}: DashboardValidationSectionProps) {
  const isApto = resultadoDax?.apto_para_validacao ?? false;
  const statusGeral = resultadoDax?.status_geral ?? 'PENDENTE';
  const totalBloqueios = resultadoDax?.total_bloqueios ?? 0;
  const totalAlertas = resultadoDax?.total_alertas_criticos ?? 0;
  const totalRecomendacoes = resultadoDax?.total_recomendacoes ?? 0;
  const diagnosticos = resultadoDax?.diagnosticos ?? [];

  return (
    <div data-testid="dashboard-validation-content" className="space-y-4">
      {/* Banner de Prontidão Formal */}
      <Card
        data-testid="dashboard-readiness-banner"
        className={`p-5 border ${
          isApto
            ? 'border-emerald-800/80 bg-emerald-950/30'
            : 'border-rose-900/80 bg-rose-950/30'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                isApto
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
              }`}
            >
              {isApto ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Prontidão Técnica (Regras D-01 a D-08)
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isApto
                      ? 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                      : 'bg-rose-950 border border-rose-800 text-rose-300'
                  }`}
                >
                  {isApto ? 'APTO PARA VALIDAÇÃO' : 'INAPTO PARA VALIDAÇÃO'}
                </span>
              </div>

              <h3 className="text-base font-bold text-white mt-0.5">
                {isApto
                  ? isIsento
                    ? 'Isenção Formal Homologada — Pronto para Avanço'
                    : 'Estrutura Conforme e Apta para Validação Técnica'
                  : `${totalBloqueios} bloqueio(s) impedem a homologação deste Dashboard`}
              </h3>

              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {isApto
                  ? 'Todos os critérios mínimos de estrutura, modelo e métricas foram satisfeitos segundo as regras normativas.'
                  : 'Resolva os bloqueios normativos apontados abaixo para habilitar o avanço no workflow.'}
              </p>
            </div>
          </div>

          {/* Badges de Contagem */}
          <div className="flex items-center gap-2 flex-shrink-0 text-xs">
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center min-w-[70px]">
              <span className="text-[10px] text-rose-400 font-bold block">Bloqueios</span>
              <span className="text-sm font-bold text-white">{totalBloqueios}</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center min-w-[70px]">
              <span className="text-[10px] text-amber-400 font-bold block">Alertas</span>
              <span className="text-sm font-bold text-white">{totalAlertas}</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center min-w-[70px]">
              <span className="text-[10px] text-blue-400 font-bold block">Recomendações</span>
              <span className="text-sm font-bold text-white">{totalRecomendacoes}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Lista de Diagnósticos Normativos */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Diagnósticos Normativos Executados
        </h4>

        {diagnosticos.length === 0 ? (
          <Card className="p-6 text-center border-slate-800 bg-slate-900/60">
            <CheckCircle2 className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
            <p className="text-xs text-slate-300">
              Nenhuma inconformidade registrada. O dashboard cumpre integralmente os requisitos de conformidade.
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {diagnosticos.map((diag, idx) => {
              const isBloqueio = diag.severidade === 'BLOQUEIO';
              const isAlerta = diag.severidade === 'ALERTA_CRITICO';

              return (
                <Card
                  key={`${diag.codigo_regra}-${idx}`}
                  data-testid={`diagnostico-${diag.codigo_regra}`}
                  className="p-3.5 border-slate-800 bg-slate-900/70"
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex-shrink-0 ${
                        isBloqueio
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : isAlerta
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-blue-950 text-blue-300 border border-blue-800'
                      }`}
                    >
                      {diag.codigo_regra} · {diag.severidade}
                    </span>

                    <div className="flex-1">
                      <h5 className="text-xs font-semibold text-white">{diag.titulo}</h5>
                      <p className="text-xs text-slate-300 mt-1 leading-snug">{diag.deteccao}</p>
                      {diag.recomendacao && (
                        <p className="text-[11px] text-slate-400 mt-1 italic">
                          <strong className="text-slate-300">Recomendação: </strong>
                          {diag.recomendacao}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
