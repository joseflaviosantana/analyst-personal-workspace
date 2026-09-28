'use client';

import React, { useState } from 'react';
import {
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Clock,
  Play,
  XCircle,
  FileCode2,
  ChevronDown,
  ChevronUp,
  Link2,
  Edit3,
  Trash2,
  AlertTriangle,
  Layers,
  Wrench,
  ShieldAlert
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EtapaTransformacao } from '@/core/domain/entities/etapa-transformacao';
import { ProblemaQualidade } from '@/core/domain/entities/problema-qualidade';
import {
  StatusEtapaTransformacao,
  ROTULOS_STATUS_ETAPA_TRANSFORMACAO
} from '@/core/domain/enums/status-etapa-transformacao';
import {
  TipoOperacaoPreparacao,
  ROTULOS_TIPO_OPERACAO_PREPARACAO
} from '@/core/domain/enums/tipo-operacao-preparacao';
import {
  CapacidadeFerramenta,
  ROTULOS_CAPACIDADE_FERRAMENTA
} from '@/core/domain/enums/capacidade-ferramenta';

interface TransformationStepCardProps {
  etapa: EtapaTransformacao;
  index: number;
  totalEtapas: number;
  problemasVinculados: ProblemaQualidade[];
  onMoveUp: () => void;
  onMoveDown: () => void;
  onOpenEdit: () => void;
  onOpenDelete: () => void;
  onOpenCancel: () => void;
  onOpenAssociateProblem: () => void;
  onOpenRegisterDerived: () => void;
  onValidateStep: () => void;
  isReadOnly?: boolean;
}

export function TransformationStepCard({
  etapa,
  index,
  totalEtapas,
  problemasVinculados,
  onMoveUp,
  onMoveDown,
  onOpenEdit,
  onOpenDelete,
  onOpenCancel,
  onOpenAssociateProblem,
  onOpenRegisterDerived,
  onValidateStep,
  isReadOnly = false,
}: TransformationStepCardProps) {
  const [showCode, setShowCode] = useState(false);

  const isPlanejada = etapa.status === StatusEtapaTransformacao.PLANEJADA;
  const isExecutada = etapa.status === StatusEtapaTransformacao.EXECUTADA;
  const isValidada = etapa.status === StatusEtapaTransformacao.VALIDADA;
  const isCancelada = etapa.status === StatusEtapaTransformacao.CANCELADA;

  return (
    <Card
      className={`p-5 transition-all ${
        isCancelada
          ? 'border-rose-950/60 bg-slate-950/40 opacity-70'
          : isValidada
          ? 'border-emerald-900/60 bg-slate-900/70'
          : isExecutada
          ? 'border-blue-900/60 bg-slate-900/70'
          : 'border-slate-800 bg-slate-900/50'
      }`}
      data-testid={`step-card-${etapa.id}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        {/* Cabeçalho da Etapa: Ordem, Operação e Status */}
        <div className="space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-200 border border-slate-700"
              data-testid={`text-step-order-${etapa.id}`}
            >
              #{etapa.ordem}
            </span>

            <span className="font-semibold text-sm text-white" data-testid={`text-step-operation-${etapa.id}`}>
              {ROTULOS_TIPO_OPERACAO_PREPARACAO[etapa.tipo_operacao] || etapa.tipo_operacao}
            </span>

            <span
              data-testid={`badge-step-status-${etapa.id}`}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                isValidada
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : isExecutada
                  ? 'bg-blue-950 text-blue-300 border border-blue-800'
                  : isPlanejada
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-rose-950 text-rose-300 border border-rose-800'
              }`}
            >
              {isValidada && <CheckCircle2 className="h-3 w-3" />}
              {isExecutada && <Play className="h-3 w-3" />}
              {isPlanejada && <Clock className="h-3 w-3" />}
              {isCancelada && <XCircle className="h-3 w-3" />}
              <span>{ROTULOS_STATUS_ETAPA_TRANSFORMACAO[etapa.status]}</span>
            </span>
          </div>

          {/* Capacidade e Ferramenta (Metadado agnóstico) */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Wrench className="h-3 w-3 text-slate-500" />
              <span>{ROTULOS_CAPACIDADE_FERRAMENTA[etapa.capacidade_ferramenta] || etapa.capacidade_ferramenta}:</span>
              <strong className="text-slate-300">{etapa.ferramenta_nome}</strong>
              {etapa.ferramenta_versao && (
                <span className="text-slate-500 font-mono">({etapa.ferramenta_versao})</span>
              )}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed pt-1" data-testid={`text-step-description-${etapa.id}`}>
            {etapa.descricao}
          </p>
        </div>

        {/* Botões de Ordenação (Subir / Descer) */}
        {!isReadOnly && !isCancelada && (
          <div className="flex items-center gap-1 shrink-0 bg-slate-950/60 p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={index === 0}
              data-testid={`btn-step-move-up-${etapa.id}`}
              title="Mover etapa para cima"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={index === totalEtapas - 1}
              data-testid={`btn-step-move-down-${etapa.id}`}
              title="Mover etapa para baixo"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Especificação Técnica / Código Recolhível (Tratado estritamente como especificação técnica/metadado) */}
      {etapa.especificacao_tecnica && (
        <div className="mt-3 border-t border-slate-800/80 pt-2.5">
          <button
            type="button"
            onClick={() => setShowCode(!showCode)}
            className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 hover:text-slate-200"
          >
            <FileCode2 className="h-3.5 w-3.5 text-blue-400" />
            <span>Especificação Técnica da Transformação ({etapa.ferramenta_nome})</span>
            {showCode ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          {showCode && (
            <div
              className="mt-2 rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] text-slate-300 whitespace-pre-wrap overflow-x-auto leading-relaxed"
              data-testid={`code-step-spec-${etapa.id}`}
            >
              {etapa.especificacao_tecnica}
            </div>
          )}
        </div>
      )}

      {/* Problemas de Qualidade Vinculados à Etapa */}
      <div className="mt-3.5 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-400">Problemas Vinculados:</span>
          {problemasVinculados.length > 0 ? (
            problemasVinculados.map((prob) => (
              <span
                key={prob.id}
                data-testid={`badge-linked-problem-${prob.id}`}
                className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium border ${
                  prob.status === 'TRATADO'
                    ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
                    : prob.status === 'ACEITO_COMO_RESTRICAO'
                    ? 'bg-cyan-950/70 border-cyan-800 text-cyan-300'
                    : 'bg-amber-950/70 border-amber-800 text-amber-300'
                }`}
                title={prob.descricao}
              >
                <AlertTriangle className="h-2.5 w-2.5" />
                <span className="truncate max-w-[150px]">{prob.titulo}</span>
                <span className="text-[9px] uppercase font-bold">({prob.status})</span>
              </span>
            ))
          ) : (
            <span className="text-[11px] text-slate-500 italic">Nenhum problema vinculado</span>
          )}
        </div>

        {!isReadOnly && !isCancelada && (
          <button
            type="button"
            onClick={onOpenAssociateProblem}
            data-testid={`btn-link-problem-${etapa.id}`}
            className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300"
          >
            <Link2 className="h-3 w-3" />
            <span>Vincular / Gerenciar Anomalias</span>
          </button>
        )}
      </div>

      {/* Justificativa de Cancelamento se Cancelada */}
      {isCancelada && etapa.justificativa && (
        <div className="mt-3 pt-2.5 border-t border-rose-950 text-xs text-rose-300 bg-rose-950/20 p-2.5 rounded-lg border">
          <span className="font-semibold block mb-0.5 text-rose-400">Motivo do Cancelamento Auditado:</span>
          <p className="italic text-[11px]">&quot;{etapa.justificativa}&quot;</p>
        </div>
      )}

      {/* Ações Operacionais da Etapa */}
      {!isReadOnly && !isCancelada && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {/* Se planejada: Registrar Derivado */}
            {isPlanejada && (
              <button
                type="button"
                onClick={onOpenRegisterDerived}
                data-testid={`btn-register-derived-${etapa.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-slate-950 shadow-sm hover:bg-amber-500 transition-colors"
              >
                <Play className="h-3.5 w-3.5" />
                <span>Registrar Ativo Derivado</span>
              </button>
            )}

            {/* Se executada: Validar Etapa e Registrar novo snapshot se precisar */}
            {isExecutada && (
              <>
                <button
                  type="button"
                  onClick={onValidateStep}
                  data-testid={`btn-validate-step-${etapa.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Validar Etapa</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenRegisterDerived}
                  data-testid={`btn-update-derived-${etapa.id}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  <Play className="h-3 w-3" />
                  <span>Novo Ativo Derivado</span>
                </button>
              </>
            )}

            {isValidada && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                <span>Validada Comprovadamente</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenEdit}
              data-testid={`btn-edit-step-${etapa.id}`}
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
            >
              <Edit3 className="h-3 w-3" />
              <span>Editar</span>
            </button>

            {isPlanejada ? (
              <button
                type="button"
                onClick={onOpenDelete}
                data-testid={`btn-delete-step-${etapa.id}`}
                className="inline-flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300"
              >
                <Trash2 className="h-3 w-3" />
                <span>Excluir</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenCancel}
                data-testid={`btn-cancel-step-${etapa.id}`}
                className="inline-flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300"
              >
                <XCircle className="h-3 w-3" />
                <span>Cancelar</span>
              </button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
