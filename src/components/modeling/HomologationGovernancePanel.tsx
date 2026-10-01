'use client';

import React from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  FileCheck2,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Clock,
  UserCheck,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { ModeloAnaliticoCompleto } from '@/core/domain/entities/modelo-analitico';
import { ProntidaoModeloOutput } from '@/core/use-cases/modeling';
import { StatusModeloAnalitico } from '@/core/domain/enums/status-modelo-analitico';
import {
  EstadoDemanda,
  normalizarEstadoDemanda,
} from '@/core/domain/enums/estado-demanda';

interface HomologationGovernancePanelProps {
  modelo: ModeloAnaliticoCompleto;
  prontidao: ProntidaoModeloOutput | null;
  estadoDemanda?: EstadoDemanda | string;
  onOpenHomologateModal: () => void;
  onOpenRevokeModal: () => void;
  onAdvanceDemand?: () => void;
  isReadOnly?: boolean;
}

export function HomologationGovernancePanel({
  modelo,
  prontidao,
  estadoDemanda,
  onOpenHomologateModal,
  onOpenRevokeModal,
  onAdvanceDemand,
  isReadOnly = false,
}: HomologationGovernancePanelProps) {
  const isHomologado = modelo.status === StatusModeloAnalitico.HOMOLOGADO;
  const isRevogado = modelo.status === StatusModeloAnalitico.REVOGADO;
  const temAlteracaoPosterior = prontidao?.temAlteracaoPosteriorAHomologacao ?? false;
  const isVigente = isHomologado && !temAlteracaoPosterior && !isRevogado && prontidao?.homologacaoVigenteValida;

  const estadoNormalizado = estadoDemanda
    ? normalizarEstadoDemanda(estadoDemanda)
    : EstadoDemanda.EM_MODELAGEM_E_ANALISE;
  const isEmModelagem = estadoNormalizado === EstadoDemanda.EM_MODELAGEM_E_ANALISE;

  const prontoParaHomologacao = prontidao?.prontoParaHomologacao ?? false;
  const bloqueios = prontidao?.motivosBloqueio ?? [];
  const alertas = prontidao?.alertasCriticosQueExigemJustificativa ?? [];

  return (
    <Card className="p-6 bg-slate-900/80 border-slate-800 space-y-5" data-testid="homologation-governance-panel">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Governança & Homologação Humana</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Checklist determinístico de prontidão e registro formal da homologação para liberação de avanço no Workflow.
          </p>
        </div>

        {/* Ações de Homologação / Revogação */}
        {!isReadOnly && (
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {isVigente ? (
              <>
                <button
                  type="button"
                  onClick={onOpenRevokeModal}
                  data-testid="btn-open-revoke-homologation"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-900/80 bg-rose-950/40 hover:bg-rose-900/60 px-3 py-1.5 text-xs font-semibold text-rose-300 transition-colors"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Revogar Homologação</span>
                </button>

                {onAdvanceDemand && isEmModelagem && (
                  <button
                    type="button"
                    onClick={onAdvanceDemand}
                    data-testid="btn-advance-from-panel"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors shadow-sm"
                  >
                    <span>Avançar para Em Validação</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={onOpenHomologateModal}
                disabled={!prontoParaHomologacao}
                data-testid="btn-open-homologate-model"
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed px-3.5 py-1.5 text-xs font-semibold text-white transition-colors shadow-sm"
                title={
                  !prontoParaHomologacao
                    ? 'Existem bloqueios de conformidade que impedem a homologação.'
                    : 'Homologar modelo formalmente'
                }
              >
                <FileCheck2 className="h-4 w-4" />
                <span>
                  {temAlteracaoPosterior || isRevogado
                    ? 'Re-homologar Modelo'
                    : 'Homologar Modelo Analítico'}
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Evidência de Homologação Vigente */}
      {isVigente && (
        <div
          className="rounded-xl border border-emerald-800/80 bg-emerald-950/30 p-4 space-y-3"
          data-testid="panel-evidence-homologated"
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-emerald-400" />
              <span className="font-semibold text-sm text-emerald-200">
                Modelo Homologado e Válido para o Workflow
              </span>
            </div>
            <span className="text-[11px] font-mono text-emerald-300">
              {modelo.homologado_em ? new Date(modelo.homologado_em).toLocaleString('pt-BR') : ''}
            </span>
          </div>

          <div className="text-xs text-slate-300 space-y-1">
            <p>
              <strong className="text-emerald-300">Homologado por:</strong> {modelo.homologado_por || 'HUMANO'}
            </p>
            <p className="whitespace-pre-line text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800 font-mono text-[11px]">
              {modelo.justificativa_homologacao}
            </p>
          </div>
        </div>
      )}

      {/* Alerta de Homologação Invalidada */}
      {isHomologado && temAlteracaoPosterior && (
        <div
          className="rounded-xl border border-amber-800/80 bg-amber-950/30 p-4 space-y-2 text-xs text-amber-200"
          data-testid="panel-evidence-invalidated"
        >
          <div className="flex items-center gap-2 font-semibold text-amber-300">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
            <span>Homologação Anterior Invalidada Automaticamente</span>
          </div>
          <p className="text-[11px] text-amber-300/90 leading-relaxed">
            Alterações materiais foram salvas após a data da homologação formal. Por governança estrita, a demanda não poderá avançar para Validação sem que o modelo seja reavaliado e re-homologado.
          </p>
        </div>
      )}

      {/* Checklist de Prontidão Determinístico */}
      <div className="space-y-2 pt-2 border-t border-slate-800/80">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
          Critérios Determinísticos de Prontidão
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
            {bloqueios.some((b) => b.includes('M-01')) ? (
              <XCircle className="h-4 w-4 text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            )}
            <span className="text-slate-300">Dataset Autorizado Vigente</span>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
            {bloqueios.some((b) => b.includes('M-02')) ? (
              <XCircle className="h-4 w-4 text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            )}
            <span className="text-slate-300">Grão Central Declarado</span>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
            {bloqueios.some((b) => b.includes('M-03')) ? (
              <XCircle className="h-4 w-4 text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            )}
            <span className="text-slate-300">Chave Primária em Todas as Entidades</span>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
            {bloqueios.some((b) => b.includes('M-04')) ? (
              <XCircle className="h-4 w-4 text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            )}
            <span className="text-slate-300">Consistência Matemática de Aditividade</span>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
            {bloqueios.some((b) => b.includes('M-05')) ? (
              <XCircle className="h-4 w-4 text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            )}
            <span className="text-slate-300">Estrutura Mínima (Ao Menos 1 Fato e 1 Métrica)</span>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
            {temAlteracaoPosterior ? (
              <XCircle className="h-4 w-4 text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            )}
            <span className="text-slate-300">Sem Alterações Materiais Posteriores</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
