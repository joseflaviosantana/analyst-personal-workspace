'use client';

import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  Play,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { TransformationStepCard } from './TransformationStepCard';
import { EtapaTransformacao } from '@/core/domain/entities/etapa-transformacao';
import { ProblemaQualidade } from '@/core/domain/entities/problema-qualidade';
import { StatusEtapaTransformacao } from '@/core/domain/enums/status-etapa-transformacao';

interface TransformationStepsListProps {
  etapas: EtapaTransformacao[];
  problemasDemanda: ProblemaQualidade[];
  mapaProblemasPorEtapa: Record<string, string[]>; // etapaId -> problemaIds
  onOpenAddStep: () => void;
  onOpenEditStep: (etapa: EtapaTransformacao) => void;
  onOpenDeleteStep: (etapa: EtapaTransformacao) => void;
  onOpenCancelStep: (etapa: EtapaTransformacao) => void;
  onOpenAssociateProblem: (etapa: EtapaTransformacao) => void;
  onOpenRegisterDerived: (etapa: EtapaTransformacao) => void;
  onValidateStep: (etapa: EtapaTransformacao) => void;
  onReorderSteps: (novasOrdens: { id: string; ordem: number }[]) => void;
  isReadOnly?: boolean;
}

export function TransformationStepsList({
  etapas,
  problemasDemanda,
  mapaProblemasPorEtapa,
  onOpenAddStep,
  onOpenEditStep,
  onOpenDeleteStep,
  onOpenCancelStep,
  onOpenAssociateProblem,
  onOpenRegisterDerived,
  onValidateStep,
  onReorderSteps,
  isReadOnly = false,
}: TransformationStepsListProps) {
  const [filtroStatus, setFiltroStatus] = useState<string>('TODAS');

  // Ordenar as etapas estritamente pela ordem numérica (1, 2, 3...)
  const etapasOrdenadas = [...etapas].sort((a, b) => a.ordem - b.ordem);

  const etapasFiltradas = etapasOrdenadas.filter((e) => {
    if (filtroStatus === 'TODAS') return true;
    return e.status === filtroStatus;
  });

  const handleMove = (index: number, direcao: 'up' | 'down') => {
    const alvoIndex = direcao === 'up' ? index - 1 : index + 1;
    if (alvoIndex < 0 || alvoIndex >= etapasOrdenadas.length) return;

    const copia = [...etapasOrdenadas];
    const temp = copia[index];
    copia[index] = copia[alvoIndex];
    copia[alvoIndex] = temp;

    const novasOrdens = copia.map((etapa, idx) => ({
      id: etapa.id,
      ordem: idx + 1,
    }));

    onReorderSteps(novasOrdens);
  };

  return (
    <div className="space-y-4" data-testid="transformation-steps-list-container">
      {/* Barra de Ferramentas da Fila de Etapas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-blue-400" />
          <h3 className="text-sm font-bold text-white">Etapas de Transformação da Receita</h3>
          <span className="text-xs text-slate-500 font-mono">({etapas.length})</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filtro de Status */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
            <Filter className="h-3 w-3 text-slate-400 ml-1.5" />
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              data-testid="select-filter-step-status"
              className="bg-transparent text-slate-300 focus:outline-none pr-2 py-0.5 text-xs"
            >
              <option value="TODAS" className="bg-slate-900">Todas ({etapas.length})</option>
              <option value={StatusEtapaTransformacao.PLANEJADA} className="bg-slate-900">
                Planejadas ({etapas.filter((e) => e.status === StatusEtapaTransformacao.PLANEJADA).length})
              </option>
              <option value={StatusEtapaTransformacao.EXECUTADA} className="bg-slate-900">
                Executadas ({etapas.filter((e) => e.status === StatusEtapaTransformacao.EXECUTADA).length})
              </option>
              <option value={StatusEtapaTransformacao.VALIDADA} className="bg-slate-900">
                Validadas ({etapas.filter((e) => e.status === StatusEtapaTransformacao.VALIDADA).length})
              </option>
              <option value={StatusEtapaTransformacao.CANCELADA} className="bg-slate-900">
                Canceladas ({etapas.filter((e) => e.status === StatusEtapaTransformacao.CANCELADA).length})
              </option>
            </select>
          </div>

          {!isReadOnly && (
            <button
              type="button"
              onClick={onOpenAddStep}
              data-testid="btn-add-step"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Adicionar Etapa</span>
            </button>
          )}
        </div>
      </div>

      {/* Lista de Cards de Etapas */}
      {etapasFiltradas.length > 0 ? (
        <div className="space-y-3" data-testid="steps-cards-list">
          {etapasFiltradas.map((etapa, idx) => {
            const problemasIds = mapaProblemasPorEtapa[etapa.id] || [];
            const problemasDaEtapa = problemasDemanda.filter((p) => problemasIds.includes(p.id));

            return (
              <TransformationStepCard
                key={etapa.id}
                etapa={etapa}
                index={idx}
                totalEtapas={etapasFiltradas.length}
                problemasVinculados={problemasDaEtapa}
                onMoveUp={() => handleMove(idx, 'up')}
                onMoveDown={() => handleMove(idx, 'down')}
                onOpenEdit={() => onOpenEditStep(etapa)}
                onOpenDelete={() => onOpenDeleteStep(etapa)}
                onOpenCancel={() => onOpenCancelStep(etapa)}
                onOpenAssociateProblem={() => onOpenAssociateProblem(etapa)}
                onOpenRegisterDerived={() => onOpenRegisterDerived(etapa)}
                onValidateStep={() => onValidateStep(etapa)}
                isReadOnly={isReadOnly}
              />
            );
          })}
        </div>
      ) : (
        <Card className="p-8 text-center" data-testid="steps-empty-state">
          <Layers className="h-8 w-8 text-slate-500 mx-auto mb-2" />
          <h4 className="text-xs font-semibold text-slate-300">
            {filtroStatus === 'TODAS'
              ? 'Nenhuma etapa de transformação cadastrada nesta receita.'
              : `Nenhuma etapa encontrada com o status "${filtroStatus}".`}
          </h4>
          <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
            Adicione operações técnicas de tratamento (ex.: remoção de duplicidades, imputação de nulos ou conversões) para estruturar a esteira.
          </p>
          {!isReadOnly && filtroStatus === 'TODAS' && (
            <div className="mt-3">
              <button
                type="button"
                onClick={onOpenAddStep}
                data-testid="btn-add-step-empty"
                className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
              >
                <Plus className="h-3 w-3" />
                <span>Adicionar Etapa</span>
              </button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
