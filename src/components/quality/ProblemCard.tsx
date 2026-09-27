'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  HelpCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Layers,
  UserCheck,
  Database,
  ArrowRight,
  ShieldCheck,
  Edit2
} from 'lucide-react';
import { ProblemaQualidade } from '@/core/domain/entities/problema-qualidade';
import { SeveridadeProblema, ROTULOS_SEVERIDADE_PROBLEMA } from '@/core/domain/enums/severidade-problema';
import { StatusProblemaQualidade, ROTULOS_STATUS_PROBLEMA_QUALIDADE } from '@/core/domain/enums/status-problema-qualidade';
import { ROTULOS_ACAO_PROBLEMA_QUALIDADE, AcaoProblemaQualidade } from '@/core/domain/enums/acao-problema-qualidade';
import { ROTULOS_CATEGORIA_PROBLEMA_QUALIDADE } from '@/core/domain/enums/categoria-problema-qualidade';
import { Card } from '@/components/ui/Card';

interface ProblemCardProps {
  problem: ProblemaQualidade;
  onDeliberate: (problem: ProblemaQualidade) => void;
  onUpdateStatus: (problem: ProblemaQualidade) => void;
  isReadOnly?: boolean;
}

export function ProblemCard({
  problem,
  onDeliberate,
  onUpdateStatus,
  isReadOnly = false,
}: ProblemCardProps) {
  const [showEvidences, setShowEvidences] = useState(false);

  const isPendente = problem.severidade === SeveridadeProblema.PENDENTE;
  const isCritica = problem.severidade === SeveridadeProblema.CRITICA;
  const isAlta = problem.severidade === SeveridadeProblema.ALTA;
  const isTratado = problem.status === StatusProblemaQualidade.TRATADO;
  const isAceito = problem.status === StatusProblemaQualidade.ACEITO_COMO_RESTRICAO;
  const isInvestigando = problem.status === StatusProblemaQualidade.EM_INVESTIGACAO;

  // Estilização contextual do card de acordo com o risco
  const cardBorderClass = isPendente
    ? 'border-amber-600/80 bg-amber-950/20 hover:border-amber-500'
    : isCritica && !isTratado && !isAceito
    ? 'border-rose-800 bg-rose-950/20 hover:border-rose-700'
    : isAlta && !isTratado && !isAceito
    ? 'border-orange-800 bg-orange-950/20 hover:border-orange-700'
    : isTratado || isAceito
    ? 'border-slate-800 bg-slate-900/40 opacity-90'
    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700';

  return (
    <Card
      className={`p-5 transition-colors ${cardBorderClass}`}
      testId={`problem-card-${problem.id}`}
    >
      <div className="flex flex-col gap-4">
        {/* Topo: Badges de Governança e Severidade */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2">
            {/* Badge de Severidade */}
            <span
              className={`rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wider border ${
                isPendente
                  ? 'bg-amber-900/60 border-amber-700 text-amber-300 animate-pulse'
                  : isCritica
                  ? 'bg-rose-900/60 border-rose-700 text-rose-300'
                  : isAlta
                  ? 'bg-orange-900/60 border-orange-700 text-orange-300'
                  : problem.severidade === SeveridadeProblema.MEDIA
                  ? 'bg-blue-900/60 border-blue-700 text-blue-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
              data-testid={`badge-severity-${problem.id}`}
            >
              {ROTULOS_SEVERIDADE_PROBLEMA[problem.severidade] || problem.severidade}
            </span>

            {/* Badge de Status Operacional */}
            <span
              className={`rounded px-2 py-0.5 text-xs font-semibold border ${
                isTratado
                  ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                  : isAceito
                  ? 'bg-purple-950/80 border-purple-800 text-purple-300'
                  : isInvestigando
                  ? 'bg-cyan-950/80 border-cyan-800 text-cyan-300'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300'
              }`}
              data-testid={`badge-status-${problem.id}`}
            >
              {ROTULOS_STATUS_PROBLEMA_QUALIDADE[problem.status] || problem.status}
            </span>

            {/* Badge de Origem */}
            <span className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] font-medium text-slate-400">
              {problem.origem_deteccao === 'MANUAL'
                ? '✍️ Declarado Manualmente'
                : problem.regra_id
                ? '📋 Regra de Negócio'
                : '🤖 Scanner Automático'}
            </span>

            {problem.regra_snapshot && (
              <span className="text-[10px] text-blue-400 font-medium">
                Regra: {problem.regra_snapshot.nome} (v{problem.regra_snapshot.versao})
              </span>
            )}
          </div>

          {/* Localização Factual */}
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">{problem.tabela_afetada}</span>
            {problem.coluna_afetada && (
              <>
                <span>•</span>
                <span className="font-mono text-cyan-400">[{problem.coluna_afetada}]</span>
              </>
            )}
          </div>
        </div>

        {/* Informações Principais: Título, Descrição e Impacto */}
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight" data-testid={`problem-title-${problem.id}`}>
            {problem.titulo}
          </h2>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            {problem.descricao}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-3 pt-2 border-t border-slate-800/50">
            <div>
              <span className="text-slate-500">Linhas Afetadas: </span>
              <strong className="text-slate-200">{problem.total_linhas_afetadas.toLocaleString('pt-BR')}</strong>
              {problem.percentual_linhas_afetadas > 0 && (
                <span className="text-slate-400 ml-1">({problem.percentual_linhas_afetadas.toFixed(2)}%)</span>
              )}
            </div>

            <div>
              <span className="text-slate-500">Categoria: </span>
              <span className="text-slate-300">
                {ROTULOS_CATEGORIA_PROBLEMA_QUALIDADE[problem.categoria] || problem.categoria}
              </span>
            </div>

            {problem.impacto_calculo && (
              <div>
                <span className="text-slate-500">Impacto em Métricas: </span>
                <span className="text-amber-300 font-medium">{problem.impacto_calculo}</span>
              </div>
            )}
          </div>
        </div>

        {/* Informações de Deliberação Humana Existente */}
        {problem.deliberado_por_humano && (
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs space-y-1.5" data-testid={`problem-deliberation-info-${problem.id}`}>
            <div className="flex items-center justify-between text-slate-400">
              <div className="flex items-center gap-1.5 font-semibold text-slate-300">
                <UserCheck className="h-3.5 w-3.5 text-blue-400" />
                <span>Deliberação do Analista:</span>
                <span className="text-white font-bold">
                  {problem.acao_deliberada
                    ? ROTULOS_ACAO_PROBLEMA_QUALIDADE[problem.acao_deliberada as AcaoProblemaQualidade] || problem.acao_deliberada
                    : 'Ação não informada'}
                </span>
              </div>
              {problem.deliberado_em && (
                <span className="text-[11px] text-slate-500">
                  {new Date(problem.deliberado_em).toLocaleString('pt-BR')}
                </span>
              )}
            </div>
            {problem.justificativa_deliberacao && (
              <p className="text-slate-300 pl-5 text-[11px] italic leading-relaxed">
                "{problem.justificativa_deliberacao}"
              </p>
            )}
          </div>
        )}

        {/* Amostra de Evidências (Anti-PII Progressive Disclosure) */}
        {problem.amostra_evidencias && problem.amostra_evidencias.length > 0 && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowEvidences(!showEvidences)}
              data-testid={`btn-toggle-evidences-${problem.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
            >
              {showEvidences ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              <span>
                {showEvidences
                  ? 'Ocultar evidências'
                  : `Ver amostra de evidências (${problem.amostra_evidencias.length} registro(s) despersonalizado(s))`}
              </span>
            </button>

            {showEvidences && (
              <div className="mt-3 overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-3" data-testid={`table-evidences-${problem.id}`}>
                <table className="w-full text-left text-xs text-slate-300">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] text-slate-500 uppercase tracking-wider">
                      <th className="pb-1.5 pr-4">Linha</th>
                      <th className="pb-1.5 pr-4">Coluna</th>
                      <th className="pb-1.5 pr-4">Detalhe Estrutural da Violação</th>
                      <th className="pb-1.5">Valor Observado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {problem.amostra_evidencias.map((ev, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40">
                        <td className="py-1.5 pr-4 text-slate-400">
                          {ev.numeroLinha ? `#${ev.numeroLinha}` : ev.linhaDuplicada ? `Linha #${ev.linhaDuplicada} (dupl. da #${ev.linhaOriginal})` : '—'}
                        </td>
                        <td className="py-1.5 pr-4 text-cyan-400">{ev.coluna || '—'}</td>
                        <td className="py-1.5 pr-4 font-sans text-slate-300">{ev.detalhe}</td>
                        <td className="py-1.5 text-amber-300 truncate max-w-xs">{ev.valorObservado || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-2 text-[10px] text-slate-500 font-sans">
                  🛡️ Salvaguarda Anti-PII: Amostra técnica com valores despersonalizados para conformidade.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Ações Operacionais do Card */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          <div className="text-[11px] text-slate-500">
            Cadastrado em {new Date(problem.criado_em).toLocaleDateString('pt-BR')}
          </div>

          <div className="flex items-center gap-2">
            {isPendente ? (
              <button
                type="button"
                onClick={() => onDeliberate(problem)}
                disabled={isReadOnly}
                data-testid={`btn-deliberate-problem-${problem.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-sm hover:bg-amber-500 disabled:opacity-50 transition-colors"
              >
                <span>Deliberar Decisão</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onUpdateStatus(problem)}
                  disabled={isReadOnly}
                  data-testid={`btn-update-status-${problem.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white disabled:opacity-50 transition-colors"
                >
                  <span>Atualizar Status</span>
                </button>

                <button
                  type="button"
                  onClick={() => onDeliberate(problem)}
                  disabled={isReadOnly}
                  data-testid={`btn-redeliberate-problem-${problem.id}`}
                  className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors px-2 py-1"
                  title="Reclassificar severidade ou ação deliberada"
                >
                  <Edit2 className="h-3 w-3" />
                  <span>Reclassificar</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
