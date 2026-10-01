'use client';

import React from 'react';
import { ModeloAnaliticoCompleto } from '@/core/domain/entities/modelo-analitico';
import { DatasetAutorizadoAnalise } from '@/core/domain/entities/dataset-autorizado-analise';
import { ProntidaoModeloOutput } from '@/core/use-cases/modeling';
import { ResultadoAvaliacaoConformidade } from '@/core/domain/rules/modeling-rules-evaluator';
import { resolveCopilotMessages, CopilotContext } from '@/core/use-cases/copilot';
import { CopilotProactivePanel } from '@/components/copilot/CopilotProactivePanel';

export interface ModelingNextActionBannerProps {
  demandaId?: string;
  estadoDemanda?: string;
  hasDatasetAutorizado: boolean;
  datasetAutorizado: DatasetAutorizadoAnalise | null;
  modelo: ModeloAnaliticoCompleto | null;
  prontidao: ProntidaoModeloOutput | null;
  conformidade?: ResultadoAvaliacaoConformidade | null;
  isReadOnly?: boolean;
  onOpenCreateModel: () => void;
  onOpenAddEntity: () => void;
  onOpenCreateMetric: () => void;
  onOpenSpecifyCalendar: () => void;
  onOpenHomologate: () => void;
  onScrollToCompliance: () => void;
  onScrollToEntities: () => void;
  onScrollToMetrics: () => void;
  onAdvanceDemand?: () => void;
}

/**
 * ModelingNextActionBanner (Evolução Conservadora — Gate 2B / 2B.1)
 *
 * Fachada pública mantida para garantir 100% de compatibilidade retroativa
 * e estabilidade das suítes de testes E2E e unitárias.
 *
 * Agora consome o núcleo determinístico do Copiloto Proativo (Gate 2A)
 * e renderiza o CopilotProactivePanel com suporte aos 3 níveis pedagógicos.
 */
export function ModelingNextActionBanner({
  demandaId,
  estadoDemanda,
  hasDatasetAutorizado,
  datasetAutorizado,
  modelo,
  prontidao,
  conformidade,
  isReadOnly = false,
  onOpenCreateModel,
  onOpenAddEntity,
  onOpenCreateMetric,
  onOpenSpecifyCalendar,
  onOpenHomologate,
  onScrollToCompliance,
  onScrollToEntities,
  onScrollToMetrics,
  onAdvanceDemand,
}: ModelingNextActionBannerProps) {
  // 1. Monta o contexto para o resolver determinístico
  const context: CopilotContext = {
    demandaId,
    estadoDemanda,
    hasDatasetAutorizado,
    datasetAutorizado,
    modelo,
    prontidao,
    resultadoConformidade: conformidade,
    isReadOnly,
  };

  // 2. Resolve a orientação pedagógica em 3 níveis (pure function)
  const orientacao = resolveCopilotMessages(context);

  // 3. Renderiza o Copiloto Proativo governado
  return (
    <CopilotProactivePanel
      orientacao={orientacao}
      isReadOnly={isReadOnly}
      onOpenCreateModel={onOpenCreateModel}
      onOpenAddEntity={onOpenAddEntity}
      onOpenCreateMetric={onOpenCreateMetric}
      onOpenSpecifyCalendar={onOpenSpecifyCalendar}
      onOpenHomologate={onOpenHomologate}
      onScrollToCompliance={onScrollToCompliance}
      onScrollToEntities={onScrollToEntities}
      onScrollToMetrics={onScrollToMetrics}
      onAdvanceDemand={onAdvanceDemand}
    />
  );
}
