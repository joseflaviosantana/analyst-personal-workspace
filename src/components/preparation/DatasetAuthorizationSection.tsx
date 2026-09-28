'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  FileCheck2,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Hash,
  Clock,
  FileText,
  ChevronDown,
  ChevronUp,
  ArrowRight
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DatasetAutorizadoAnalise } from '@/core/domain/entities/dataset-autorizado-analise';
import { AtivoDados } from '@/core/domain/entities/ativo-dados';
import { ProntidaoModelagemOutput } from '@/core/use-cases/preparation';
import { StatusAutorizacaoDataset } from '@/core/domain/enums/status-autorizacao-dataset';

interface DatasetAuthorizationSectionProps {
  datasetAutorizado: DatasetAutorizadoAnalise | null;
  ativoAutorizado: AtivoDados | null;
  prontidao: ProntidaoModelagemOutput | null;
  onOpenAuthorizeModal: () => void;
  onOpenRevokeModal: () => void;
  onAdvanceDemand?: () => void;
  isReadOnly?: boolean;
}

export function DatasetAuthorizationSection({
  datasetAutorizado,
  ativoAutorizado,
  prontidao,
  onOpenAuthorizeModal,
  onOpenRevokeModal,
  onAdvanceDemand,
  isReadOnly = false,
}: DatasetAuthorizationSectionProps) {
  const [showRestrictions, setShowRestrictions] = useState(false);

  const restricoes: Array<{ id: string; categoria: string; descricao: string; severidade: string }> =
    datasetAutorizado?.restricoes_aceitas_snapshot
      ? JSON.parse(datasetAutorizado.restricoes_aceitas_snapshot || '[]')
      : [];

  const isVigente = datasetAutorizado?.status === StatusAutorizacaoDataset.VIGENTE;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-testid="prep-dataset-authorization-section">
      {/* Coluna 1: Dataset Autorizado Vigente */}
      <Card className="p-6 flex flex-col justify-between" data-testid="card-authorized-dataset">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <h2 className="text-sm font-semibold text-white">Dataset Autorizado para Análise</h2>
            </div>
            {isVigente ? (
              <Badge variant="success" className="text-xs" data-testid="badge-dataset-vigente">
                VIGENTE / HOMOLOGADO
              </Badge>
            ) : (
              <Badge variant="neutral" className="text-xs" data-testid="badge-dataset-pendente">
                NENHUM DATASET HOMOLOGADO
              </Badge>
            )}
          </div>

          {datasetAutorizado && isVigente ? (
            <div className="mt-4 space-y-3.5 text-xs text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Rótulo da Versão:</span>
                <span className="font-mono font-semibold text-emerald-400 text-sm" data-testid="text-dataset-version">
                  {datasetAutorizado.versao_rotulo}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Ativo Homologado:</span>
                <span className="font-medium text-slate-200 truncate max-w-[240px]" title={ativoAutorizado?.nome_arquivo || datasetAutorizado.ativo_dados_id}>
                  {ativoAutorizado?.nome_arquivo || datasetAutorizado.ativo_dados_id}
                </span>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-1.5 font-mono text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Hash className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Snapshot SHA-256 Congelado:</span>
                </div>
                <div className="truncate text-slate-300 select-all" data-testid="text-dataset-hash">
                  {datasetAutorizado.hash_sha256_snapshot}
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Justificativa Formal de Homologação:</span>
                <p className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-2.5 text-slate-300 italic text-[11px] leading-relaxed" data-testid="text-dataset-justification">
                  &quot;{datasetAutorizado.justificativa_autorizacao}&quot;
                </p>
              </div>

              {restricoes.length > 0 && (
                <div className="border border-slate-800/80 rounded-lg p-2.5 bg-slate-950/40">
                  <button
                    type="button"
                    onClick={() => setShowRestrictions(!showRestrictions)}
                    className="flex items-center justify-between w-full text-[11px] font-medium text-amber-300 hover:text-amber-200"
                  >
                    <span>{restricoes.length} Restrição(ões) Aceita(s) Congelada(s)</span>
                    {showRestrictions ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                  {showRestrictions && (
                    <ul className="mt-2 space-y-1.5 pt-2 border-t border-slate-800 text-[11px] text-slate-300">
                      {restricoes.map((r) => (
                        <li key={r.id} className="flex items-start gap-1.5">
                          <span className="text-amber-400 font-semibold">•</span>
                          <span><strong>{r.categoria}:</strong> {r.descricao}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
                <Clock className="h-3 w-3 text-slate-500" />
                <span>Autorizado em: {new Date(datasetAutorizado.autorizado_em).toLocaleString('pt-BR')} (Homologação Humana)</span>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 space-y-2">
              <Lock className="h-8 w-8 mx-auto text-slate-500 mb-1" />
              <p className="text-xs max-w-sm mx-auto">
                Nenhum conjunto de dados foi homologado formalmente como dataset vigente para abastecer as próximas fases.
              </p>
              <p className="text-[11px] text-slate-500">
                A conclusão da receita de preparação habilitará a autorização formal.
              </p>
            </div>
          )}
        </div>

        {/* Ações da Autorização */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap gap-2.5">
          {!isReadOnly && (
            <button
              type="button"
              onClick={onOpenAuthorizeModal}
              data-testid="btn-open-authorize-modal"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>{isVigente ? 'Substituir / Nova Versão' : 'Autorizar Dataset'}</span>
            </button>
          )}

          {isVigente && !isReadOnly && (
            <button
              type="button"
              onClick={onOpenRevokeModal}
              data-testid="btn-open-revoke-modal"
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-900/80 bg-rose-950/40 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-900/60 hover:text-white transition-colors"
            >
              <Unlock className="h-3.5 w-3.5" />
              <span>Revogar Autorização</span>
            </button>
          )}
        </div>
      </Card>

      {/* Coluna 2: Checklist de Prontidão para Modelagem (7 Guardrails) */}
      <Card className="p-6 flex flex-col justify-between" data-testid="card-readiness-checklist">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 text-blue-400" />
              <h2 className="text-sm font-semibold text-white">Prontidão para Modelagem &amp; Análise</h2>
            </div>
            {prontidao?.pronto ? (
              <Badge variant="success" className="text-xs" data-testid="badge-prontidao-liberada">
                100% LIBERADO
              </Badge>
            ) : (
              <Badge variant="warning" className="text-xs" data-testid="badge-prontidao-bloqueada">
                BLOQUEADO ({prontidao?.motivosBloqueio.length || 0} PENDÊNCIAS)
              </Badge>
            )}
          </div>

          <div className="mt-4 space-y-2.5 text-xs">
            {/* Guardrail 1: Dataset Vigente */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800/80">
              <span className="text-slate-300">1. Dataset Autorizado Vigente</span>
              {prontidao?.detalhes.datasetAutorizado ? (
                <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Vigente</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-rose-400 font-medium">
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Pendente</span>
                </span>
              )}
            </div>

            {/* Guardrail 2: Ativo Ativo */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800/80">
              <span className="text-slate-300">2. Ativo Homologado é o Vigente</span>
              {prontidao?.detalhes.ativoAutorizado?.status === 'ATIVO' ? (
                <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Ativo</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-rose-400 font-medium">
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Não Vigente</span>
                </span>
              )}
            </div>

            {/* Guardrail 3: Integridade de Hash */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800/80">
              <span className="text-slate-300">3. Integridade Física (Sem Drift SHA-256)</span>
              {prontidao?.detalhes.hashValido ? (
                <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Íntegro</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-rose-400 font-medium">
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Divergência / Nulo</span>
                </span>
              )}
            </div>

            {/* Guardrail 4: Quality Gate do Ativo Homologado */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800/80">
              <span className="text-slate-300">4. Quality Gate do Ativo Homologado</span>
              {prontidao?.detalhes.qualityGate?.liberado ? (
                <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Liberado</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-rose-400 font-medium">
                  <XCircle className="h-3.5 w-3.5" />
                  <span>{prontidao?.detalhes.qualityGate ? 'Bloqueado' : 'Sem Diagnóstico'}</span>
                </span>
              )}
            </div>

            {/* Guardrail 5: Receita Concluída (quando aplicável) */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800/80">
              <span className="text-slate-300">5. Receita de Preparação Concluída</span>
              {prontidao?.detalhes.receitaConcluida ? (
                <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Concluída</span>
                </span>
              ) : prontidao?.detalhes.datasetAutorizado && !prontidao.detalhes.datasetAutorizado.receita_preparacao_id ? (
                <span className="inline-flex items-center gap-1 text-cyan-400 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>N/A (Ativo Bruto)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-rose-400 font-medium">
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Em Aberto</span>
                </span>
              )}
            </div>

            {/* Guardrail 6: Problemas PENDENTES */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800/80">
              <span className="text-slate-300">6. Deliberações Humanas Pendentes</span>
              {prontidao?.detalhes.problemasPendentes === 0 ? (
                <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>0 Pendentes</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-rose-400 font-medium">
                  <XCircle className="h-3.5 w-3.5" />
                  <span>{prontidao?.detalhes.problemasPendentes} Pendentes</span>
                </span>
              )}
            </div>

            {/* Guardrail 7: Problemas para tratar no pipeline não resolvidos */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800/80">
              <span className="text-slate-300">7. Tratamentos de Pipeline Resolvidos</span>
              {prontidao?.detalhes.problemasNaoTratadosNoPipeline === 0 ? (
                <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Todos Sanados</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-rose-400 font-medium">
                  <XCircle className="h-3.5 w-3.5" />
                  <span>{prontidao?.detalhes.problemasNaoTratadosNoPipeline} em Aberto</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Ação de Avanço Global da Demanda para Modelagem */}
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          {prontidao?.pronto && onAdvanceDemand && !isReadOnly ? (
            <button
              type="button"
              onClick={onAdvanceDemand}
              data-testid="btn-advance-to-modeling"
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 px-4 text-xs font-semibold text-white shadow-md hover:from-blue-500 hover:to-indigo-500 transition-all"
            >
              <span>Avançar Demanda para Modelagem &amp; Análise</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5" data-testid="msg-modeling-locked">
              <Lock className="h-3.5 w-3.5 text-slate-500" />
              <span>Avanço para Modelagem bloqueado até aprovação de todos os 7 guardrails.</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
