'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Scale,
  Plus,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react';
import { DemandaComProjeto } from '@/core/domain/entities/demanda';
import { AtivoDados } from '@/core/domain/entities/ativo-dados';
import { ValidacaoConciliacao } from '@/core/domain/entities/validacao-conciliacao';
import { ResultadoAvaliacaoValidacao } from '@/core/domain/rules/validation-rules-evaluator';
import {
  EstadoDemanda,
  isEstadoTerminal,
  normalizarEstadoDemanda,
} from '@/core/domain/enums/estado-demanda';

import {
  listarValidacoesAction,
  obterProntidaoValidacaoAction,
  removerValidacaoAction,
} from '@/app/actions/validation-actions';
import { obterModeloAtivoDemandaAction } from '@/app/actions/modeling-actions';

import { ValidationSummaryCards } from '@/components/validation/ValidationSummaryCards';
import { ValidationNextActionBanner } from '@/components/validation/ValidationNextActionBanner';
import { ValidationCardList } from '@/components/validation/ValidationCardList';
import { CreateValidationModal } from '@/components/validation/CreateValidationModal';
import { RetestValidationModal } from '@/components/validation/RetestValidationModal';

interface TabValidationProps {
  demand: DemandaComProjeto;
  initialAssets?: AtivoDados[];
}

export function TabValidation({ demand }: TabValidationProps) {
  const router = useRouter();

  const [validacoes, setValidacoes] = useState<ValidacaoConciliacao[]>([]);
  const [prontidao, setProntidao] = useState<ResultadoAvaliacaoValidacao | null>(null);
  const [metricasDisponiveis, setMetricasDisponiveis] = useState<{ id: string; nome: string }[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [retestModalOpen, setRetestModalOpen] = useState(false);
  const [selectedForRetest, setSelectedForRetest] = useState<ValidacaoConciliacao | null>(null);

  // Governança de Workflow Read-Only
  const estadoAtual = normalizarEstadoDemanda(demand.estado);
  const isSuspensa = estadoAtual === EstadoDemanda.SUSPENSA;
  const isConcluida = estadoAtual === EstadoDemanda.CONCLUIDA;
  const isCancelada = estadoAtual === EstadoDemanda.CANCELADA;
  const isTerminal = isEstadoTerminal(estadoAtual);
  const isReadOnly = isSuspensa || isTerminal;

  const carregarDados = useCallback(async () => {
    setIsLoading(true);
    try {
      const [resVal, resPront, resMod] = await Promise.all([
        listarValidacoesAction(demand.id),
        obterProntidaoValidacaoAction(demand.id),
        obterModeloAtivoDemandaAction(demand.id),
      ]);

      if (resVal.success) {
        setValidacoes(resVal.data);
      }
      if (resPront.success) {
        setProntidao(resPront.data);
      }
      if (resMod.success && resMod.data) {
        const metricas = (resMod.data.metricas || []).map((m: any) => ({
          id: m.id,
          nome: m.nome,
        }));
        setMetricasDisponiveis(metricas);
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Falha ao carregar dados da etapa de validação.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [demand.id]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const handleSuccess = (msg: string) => {
    setFeedback({ type: 'success', message: msg });
    carregarDados();
    router.refresh();
  };

  const handleOpenRetest = (val: ValidacaoConciliacao) => {
    setSelectedForRetest(val);
    setRetestModalOpen(true);
  };

  const handleRemoveValidation = async (id: string) => {
    if (!window.confirm('Confirma a remoção deste check de validação?')) {
      return;
    }
    const res = await removerValidacaoAction(id, demand.id);
    if (!res.success) {
      setFeedback({ type: 'error', message: res.error });
    } else {
      handleSuccess('Check de validação removido com sucesso.');
    }
  };

  return (
    <div className="space-y-6" data-testid="tab-validation-container">
      {/* Header da Aba com Contexto Metodológico */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">
              Validação Multicamadas & Conciliação Numérica
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-400 max-w-2xl leading-relaxed">
            Confronto metódico de integridade em todas as camadas (dados brutos, regras de transformação,
            DAX, reconciliação de KPIs e requisitos) com tolerância determinística e governança V-01/V-02.
          </p>
        </div>

        {!isReadOnly && (
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            data-testid="btn-open-create-validation"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 shrink-0 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Check de Conciliação</span>
          </button>
        )}
      </div>

      {/* Banner de Feedback */}
      {feedback && (
        <div
          data-testid="tab-validation-feedback"
          className={`flex items-center justify-between rounded-lg p-3 text-xs border ${
            feedback.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/70 border-rose-800 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 gap-2 text-xs">
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          <span>Carregando validações da demanda...</span>
        </div>
      ) : (
        <>
          {/* Cards de Resumo Quantitativo */}
          <ValidationSummaryCards
            totalValidacoes={prontidao?.total_validacoes ?? validacoes.length}
            totalObrigatorias={prontidao?.total_obrigatorias ?? validacoes.filter((v) => v.obrigatoria).length}
            totalAprovadas={prontidao?.total_aprovadas ?? validacoes.filter((v) => v.resultado === 'APROVADO').length}
            totalDivergentes={prontidao?.total_divergentes ?? validacoes.filter((v) => v.resultado === 'DIVERGENTE').length}
            totalPendentesReteste={prontidao?.total_pendentes_reteste ?? validacoes.filter((v) => v.resultado === 'PENDENTE_RETESTE').length}
          />

          {/* Banner Preventivo de Governança de Workflow (V-01 / V-02) */}
          <ValidationNextActionBanner
            prontidao={prontidao}
            onOpenCreateModal={() => setCreateModalOpen(true)}
            isReadOnly={isReadOnly}
          />

          {/* Lista de Validações com Filtro, Busca e Ações */}
          <ValidationCardList
            validacoes={validacoes}
            onOpenRetest={handleOpenRetest}
            onRemove={handleRemoveValidation}
            onOpenCreate={() => setCreateModalOpen(true)}
            isReadOnly={isReadOnly}
          />
        </>
      )}

      {/* Modais */}
      <CreateValidationModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        demandaId={demand.id}
        metricasDisponiveis={metricasDisponiveis}
        onSuccess={handleSuccess}
      />

      <RetestValidationModal
        isOpen={retestModalOpen}
        onClose={() => {
          setRetestModalOpen(false);
          setSelectedForRetest(null);
        }}
        validacao={selectedForRetest}
        demandaId={demand.id}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
