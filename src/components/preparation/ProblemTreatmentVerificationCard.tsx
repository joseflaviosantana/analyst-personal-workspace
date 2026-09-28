'use client';

import React, { useState } from 'react';
import {
  FileCheck2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Loader2,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProblemaQualidade } from '@/core/domain/entities/problema-qualidade';
import { EtapaTransformacao } from '@/core/domain/entities/etapa-transformacao';
import { ValidarTratamentoProblemaOutput } from '@/core/use-cases/preparation';
import { StatusProblemaQualidade } from '@/core/domain/enums/status-problema-qualidade';

interface ProblemTreatmentVerificationCardProps {
  problemas: ProblemaQualidade[];
  etapas: EtapaTransformacao[];
  mapaProblemasPorEtapa: Record<string, string[]>; // etapaId -> problemaIds
  onValidateProblem: (problemaId: string) => Promise<ValidarTratamentoProblemaOutput | null>;
  isReadOnly?: boolean;
}

export function ProblemTreatmentVerificationCard({
  problemas,
  etapas,
  mapaProblemasPorEtapa,
  onValidateProblem,
  isReadOnly = false,
}: ProblemTreatmentVerificationCardProps) {
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [verificationResults, setVerificationResults] = useState<Record<string, ValidarTratamentoProblemaOutput>>({});

  // Filtrar apenas anomalias deliberadas formalmente com TRATAR_NO_PIPELINE
  const problemasTratar = problemas.filter((p) => p.acao_deliberada === 'TRATAR_NO_PIPELINE');

  if (problemasTratar.length === 0) {
    return (
      <Card className="p-6 text-center py-8" data-testid="problem-verification-empty-card">
        <ShieldCheck className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
        <h4 className="text-xs font-semibold text-white">Nenhum Débito Técnico de Qualidade Pendente no Pipeline</h4>
        <p className="text-[11px] text-slate-400 mt-1 max-w-md mx-auto">
          Não existem anomalias deliberadas para tratamento no pipeline na demanda atual.
        </p>
      </Card>
    );
  }

  // Localizar qual etapa trata cada problema
  const getEtapaTratadora = (problemaId: string): EtapaTransformacao | null => {
    for (const [etapaId, probIds] of Object.entries(mapaProblemasPorEtapa)) {
      if (probIds.includes(problemaId)) {
        return etapas.find((e) => e.id === etapaId) || null;
      }
    }
    return null;
  };

  const handleValidate = async (problemaId: string) => {
    if (isReadOnly || validatingId) return;
    setValidatingId(problemaId);
    try {
      const res = await onValidateProblem(problemaId);
      if (res) {
        setVerificationResults((prev) => ({ ...prev, [problemaId]: res }));
      }
    } finally {
      setValidatingId(null);
    }
  };

  const totalTratados = problemasTratar.filter(
    (p) => p.status === StatusProblemaQualidade.TRATADO || p.status === StatusProblemaQualidade.ACEITO_COMO_RESTRICAO
  ).length;

  return (
    <Card className="p-6 space-y-4" data-testid="problem-verification-card">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <FileCheck2 className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">
            Validação Empírica de Tratamento dos Problemas de Qualidade
          </h3>
        </div>
        <span className="text-xs font-medium text-slate-300">
          Progresso: <strong className="text-emerald-400">{totalTratados}</strong> / {problemasTratar.length} sanados
        </span>
      </div>

      <div className="space-y-3" data-testid="problem-verification-list">
        {problemasTratar.map((prob) => {
          const etapaTratadora = getEtapaTratadora(prob.id);
          const isTratado = prob.status === StatusProblemaQualidade.TRATADO;
          const result = verificationResults[prob.id];
          const isValidatingThis = validatingId === prob.id;

          return (
            <div
              key={prob.id}
              className={`p-4 rounded-lg border transition-all ${
                isTratado
                  ? 'border-emerald-900/60 bg-emerald-950/20'
                  : 'border-slate-800 bg-slate-950/60'
              }`}
              data-testid={`problem-verification-item-${prob.id}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-white">{prob.titulo}</span>
                    <Badge
                      variant={
                        prob.severidade === 'CRITICA'
                          ? 'warning'
                          : prob.severidade === 'ALTA'
                          ? 'warning'
                          : 'neutral'
                      }
                      className="text-[10px]"
                    >
                      {prob.severidade}
                    </Badge>
                    <span
                      data-testid={`badge-problem-status-${prob.id}`}
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        isTratado
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {isTratado && <CheckCircle2 className="h-3 w-3" />}
                      <span>{prob.status}</span>
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300">{prob.descricao}</p>

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
                    {prob.coluna_afetada && (
                      <span>Coluna Afetada: <code className="text-slate-300 font-mono">{prob.coluna_afetada}</code></span>
                    )}
                    <span>
                      Etapa Designada:{' '}
                      {etapaTratadora ? (
                        <strong className="text-blue-300">
                          #{etapaTratadora.ordem} — {etapaTratadora.tipo_operacao} ({etapaTratadora.status})
                        </strong>
                      ) : (
                        <span className="text-amber-400 italic">Nenhuma etapa vinculada</span>
                      )}
                    </span>
                  </div>
                </div>

                {!isReadOnly && !isTratado && (
                  <button
                    type="button"
                    onClick={() => handleValidate(prob.id)}
                    disabled={isValidatingThis || !etapaTratadora || etapaTratadora.status === 'PLANEJADA'}
                    data-testid={`btn-validate-problem-${prob.id}`}
                    title={
                      !etapaTratadora
                        ? 'Vincule uma etapa de transformação antes de validar'
                        : etapaTratadora.status === 'PLANEJADA'
                        ? 'A etapa deve ser executada e ter um ativo derivado registrado antes da validação'
                        : 'Executar teste empírico de tratamento'
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                  >
                    {isValidatingThis ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Validando...</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5" />
                        <span>Validar no Pipeline</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Laudo Empírico Retornado */}
              {result && (
                <div
                  className={`mt-3 p-2.5 rounded-lg text-xs border ${
                    result.resolvido
                      ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                      : 'bg-rose-950/50 border-rose-800 text-rose-300'
                  }`}
                  data-testid={`verification-feedback-${prob.id}`}
                >
                  <div className="flex items-center gap-1.5 font-semibold">
                    {result.resolvido ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-rose-400" />
                    )}
                    <span>{result.motivo}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
