'use client';

import React from 'react';
import {
  FileCode2,
  Edit3,
  Plus,
  CheckCircle2,
  History,
  Layers,
  Calendar,
  Clock,
  Check,
  AlertCircle
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ReceitaPreparacao } from '@/core/domain/entities/receita-preparacao';
import { EtapaTransformacao } from '@/core/domain/entities/etapa-transformacao';
import {
  StatusReceitaPreparacao,
  ROTULOS_STATUS_RECEITA_PREPARACAO
} from '@/core/domain/enums/status-receita-preparacao';
import { StatusEtapaTransformacao } from '@/core/domain/enums/status-etapa-transformacao';

interface RecipeHeaderCardProps {
  receita: ReceitaPreparacao | null;
  historicoReceitas: ReceitaPreparacao[];
  etapas: EtapaTransformacao[];
  onSelectReceita: (receitaId: string) => void;
  onOpenCreateModal: () => void;
  onOpenEditModal: () => void;
  onOpenConcludeModal: () => void;
  isReadOnly?: boolean;
}

export function RecipeHeaderCard({
  receita,
  historicoReceitas,
  etapas,
  onSelectReceita,
  onOpenCreateModal,
  onOpenEditModal,
  onOpenConcludeModal,
  isReadOnly = false,
}: RecipeHeaderCardProps) {
  if (!receita) {
    return (
      <Card className="p-6 text-center py-10" data-testid="card-no-recipe-placeholder">
        <FileCode2 className="h-10 w-10 text-slate-500 mx-auto mb-3" />
        <h2 className="text-base font-semibold text-white">Nenhuma Receita de Preparação Ativa</h2>
        <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
          Crie uma receita para organizar e documentar formalmente a sequência de transformações dos dados.
        </p>
        {!isReadOnly && (
          <div className="mt-4">
            <button
              type="button"
              onClick={onOpenCreateModal}
              data-testid="btn-create-recipe-empty"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Criar Nova Receita</span>
            </button>
          </div>
        )}
      </Card>
    );
  }

  const isRascunho = receita.status === StatusReceitaPreparacao.RASCUNHO;
  const isEmExecucao = receita.status === StatusReceitaPreparacao.EM_EXECUCAO;
  const isConcluida = receita.status === StatusReceitaPreparacao.CONCLUIDA;
  const isObsoleta = receita.status === StatusReceitaPreparacao.OBSOLETA;

  // Contadores de etapas
  const totalPlanejadas = etapas.filter((e) => e.status === StatusEtapaTransformacao.PLANEJADA).length;
  const totalExecutadas = etapas.filter((e) => e.status === StatusEtapaTransformacao.EXECUTADA).length;
  const totalValidadas = etapas.filter((e) => e.status === StatusEtapaTransformacao.VALIDADA).length;
  const totalCanceladas = etapas.filter((e) => e.status === StatusEtapaTransformacao.CANCELADA).length;

  // Pode concluir se estiver em execução, sem etapas planejadas/executadas pendentes, e ao menos 1 validada
  const canConclude = isEmExecucao && totalPlanejadas === 0 && totalExecutadas === 0 && totalValidadas > 0;

  return (
    <Card className="p-6" data-testid="recipe-header-card">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        {/* Título, Versão e Metadados */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-lg font-bold text-white tracking-tight" data-testid="text-recipe-title">
              {receita.titulo}
            </h2>
            <Badge variant="neutral" className="font-mono text-xs">
              v{receita.versao}
            </Badge>
            <span
              data-testid="badge-recipe-status"
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                isConcluida
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                  : isEmExecucao
                  ? 'bg-blue-950/80 text-blue-300 border border-blue-800'
                  : isRascunho
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {ROTULOS_STATUS_RECEITA_PREPARACAO[receita.status]}
            </span>
          </div>

          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed whitespace-pre-line" data-testid="text-recipe-description">
            {receita.descricao || 'Nenhuma descrição técnica informada para esta receita.'}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-slate-400">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-slate-500" />
              <span>Criada em: {new Date(receita.criado_em).toLocaleDateString('pt-BR')}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-slate-500" />
              <span>Atualizada: {new Date(receita.atualizado_em).toLocaleString('pt-BR')}</span>
            </div>
          </div>
        </div>

        {/* Seletor de Histórico e Ações */}
        <div className="flex flex-wrap items-center gap-2">
          {historicoReceitas.length > 1 && (
            <div className="flex items-center gap-1.5">
              <History className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={receita.id}
                onChange={(e) => onSelectReceita(e.target.value)}
                data-testid="select-recipe-history"
                className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                {historicoReceitas.map((r) => (
                  <option key={r.id} value={r.id}>
                    v{r.versao} — {r.titulo} ({r.status})
                  </option>
                ))}
              </select>
            </div>
          )}

          {!isReadOnly && !isConcluida && (
            <button
              type="button"
              onClick={onOpenEditModal}
              data-testid="btn-edit-recipe-metadata"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Editar</span>
            </button>
          )}

          {!isReadOnly && isEmExecucao && (
            <button
              type="button"
              onClick={onOpenConcludeModal}
              disabled={!canConclude}
              data-testid="btn-conclude-recipe"
              title={
                canConclude
                  ? 'Concluir formalmente a receita de preparação'
                  : 'Necessário validar todas as etapas e resolver problemas do pipeline antes da conclusão.'
              }
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Concluir Receita</span>
            </button>
          )}

          {!isReadOnly && (
            <button
              type="button"
              onClick={onOpenCreateModal}
              data-testid="btn-new-recipe"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-600 hover:text-white transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Nova Receita</span>
            </button>
          )}
        </div>
      </div>

      {/* Faixa de Contadores Rápidos de Etapas */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <Layers className="h-4 w-4 text-slate-400" />
          <span className="text-slate-400">Total de Etapas:</span>
          <strong className="text-slate-200" data-testid="count-total-steps">{etapas.length}</strong>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          <span className="text-slate-400">Planejadas:</span>
          <strong className="text-amber-300">{totalPlanejadas}</strong>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-400" />
          <span className="text-slate-400">Executadas:</span>
          <strong className="text-blue-300">{totalExecutadas}</strong>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-slate-400">Validadas:</span>
          <strong className="text-emerald-300">{totalValidadas}</strong>
        </div>

        {totalCanceladas > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            <span className="text-slate-400">Canceladas:</span>
            <strong className="text-rose-300">{totalCanceladas}</strong>
          </div>
        )}
      </div>
    </Card>
  );
}
