'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Loader2, X } from 'lucide-react';
import { DemandaComProjeto } from '@/core/domain/entities/demanda';
import { AtivoDados } from '@/core/domain/entities/ativo-dados';
import { ModeloAnalitico, ModeloAnaliticoCompleto } from '@/core/domain/entities/modelo-analitico';
import { EntidadeAnaliticaComAtributos } from '@/core/domain/entities/entidade-analitica';
import { MetricaAnalitica } from '@/core/domain/entities/metrica-analitica';
import { DatasetAutorizadoAnalise } from '@/core/domain/entities/dataset-autorizado-analise';
import {
  ResultadoAvaliacaoConformidade,
} from '@/core/domain/rules/modeling-rules-evaluator';
import { ProntidaoModeloOutput } from '@/core/use-cases/modeling';
import {
  EstadoDemanda,
  isEstadoTerminal,
  normalizarEstadoDemanda,
} from '@/core/domain/enums/estado-demanda';

import {
  listarModelosDemandaAction,
  obterModeloCompletoAction,
  obterModeloAtivoDemandaAction,
  removerEntidadeAnaliticaAction,
  removerRelacionamentoAnaliticoAction,
  removerMetricaAnaliticaAction,
  avaliarConformidadeModeloAction,
  verificarProntidaoModeloAction,
} from '@/app/actions/modeling-actions';
import { obterDatasetAutorizadoVigenteAction } from '@/app/actions/preparation-actions';
import { advanceDemandAction } from '@/app/actions/workflow-actions';

import { ModelingNextActionBanner } from '@/components/modeling/ModelingNextActionBanner';
import { ModelHeaderCard } from '@/components/modeling/ModelHeaderCard';
import { ModelStructureView } from '@/components/modeling/ModelStructureView';
import { EntitiesAndAttributesSection } from '@/components/modeling/EntitiesAndAttributesSection';
import { RelationshipsSection } from '@/components/modeling/RelationshipsSection';
import { MetricsSection } from '@/components/modeling/MetricsSection';
import { ComplianceEvaluationSection } from '@/components/modeling/ComplianceEvaluationSection';
import { HomologationGovernancePanel } from '@/components/modeling/HomologationGovernancePanel';

import { CreateModelModal } from '@/components/modeling/CreateModelModal';
import { EditModelModal } from '@/components/modeling/EditModelModal';
import { AddEntityModal } from '@/components/modeling/AddEntityModal';
import { ConfigureAttributesModal } from '@/components/modeling/ConfigureAttributesModal';
import { AddRelationshipModal } from '@/components/modeling/AddRelationshipModal';
import { SpecifyCalendarModal } from '@/components/modeling/SpecifyCalendarModal';
import { CreateMetricModal } from '@/components/modeling/CreateMetricModal';
import { EditMetricModal } from '@/components/modeling/EditMetricModal';
import { HomologateModelModal } from '@/components/modeling/HomologateModelModal';
import { RevokeHomologationModal } from '@/components/modeling/RevokeHomologationModal';

interface TabModelingProps {
  demand: DemandaComProjeto;
  initialAssets?: AtivoDados[];
}

export function TabModeling({ demand, initialAssets = [] }: TabModelingProps) {
  const router = useRouter();

  // Estados dos Dados de Modelagem
  const [modeloAtivo, setModeloAtivo] = useState<ModeloAnaliticoCompleto | null>(null);
  const [historicoModelos, setHistoricoModelos] = useState<ModeloAnalitico[]>([]);
  const [datasetAutorizado, setDatasetAutorizado] = useState<DatasetAutorizadoAnalise | null>(null);
  const [prontidao, setProntidao] = useState<ProntidaoModeloOutput | null>(null);
  const [conformidade, setConformidade] = useState<ResultadoAvaliacaoConformidade | null>(null);

  // Estados de Carregamento e Feedback
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isReevaluating, setIsReevaluating] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modais
  const [createModelModalOpen, setCreateModelModalOpen] = useState(false);
  const [editModelModalOpen, setEditModelModalOpen] = useState(false);
  const [addEntityModalOpen, setAddEntityModalOpen] = useState(false);
  const [configureAttributesModalOpen, setConfigureAttributesModalOpen] = useState(false);
  const [selectedEntityForAttributes, setSelectedEntityForAttributes] = useState<EntidadeAnaliticaComAtributos | null>(null);

  const [addRelationshipModalOpen, setAddRelationshipModalOpen] = useState(false);
  const [specifyCalendarModalOpen, setSpecifyCalendarModalOpen] = useState(false);
  const [createMetricModalOpen, setCreateMetricModalOpen] = useState(false);
  const [editMetricModalOpen, setEditMetricModalOpen] = useState(false);
  const [selectedMetricForEdit, setSelectedMetricForEdit] = useState<MetricaAnalitica | null>(null);

  const [homologateModalOpen, setHomologateModalOpen] = useState(false);
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);

  // Governança de Workflow Read-Only
  const estadoAtual = normalizarEstadoDemanda(demand.estado);
  const isSuspensa = estadoAtual === EstadoDemanda.SUSPENSA;
  const isConcluida = estadoAtual === EstadoDemanda.CONCLUIDA;
  const isCancelada = estadoAtual === EstadoDemanda.CANCELADA;
  const isTerminal = isEstadoTerminal(estadoAtual);
  const isReadOnly = isSuspensa || isTerminal;

  // Carregamento Completo dos Dados da Aba 6
  const loadModelingData = useCallback(async (modeloIdAlvo?: string) => {
    setIsLoading(true);
    try {
      const [datasetRes, modelosRes] = await Promise.all([
        obterDatasetAutorizadoVigenteAction(demand.id),
        listarModelosDemandaAction(demand.id),
      ]);

      const dataset = datasetRes.success ? datasetRes.data : null;
      setDatasetAutorizado(dataset);

      const todosModelos = modelosRes.success ? modelosRes.data : [];
      setHistoricoModelos(todosModelos);

      let modeloParaCarregarId: string | null = null;
      if (modeloIdAlvo) {
        modeloParaCarregarId = modeloIdAlvo;
      } else if (todosModelos.length > 0) {
        // Prioriza o homologado ou o mais recente
        const homologado = todosModelos.find((m) => m.status === 'HOMOLOGADO');
        modeloParaCarregarId = homologado ? homologado.id : todosModelos[todosModelos.length - 1].id;
      }

      if (modeloParaCarregarId) {
        const [completoRes, prontidaoRes, conformidadeRes] = await Promise.all([
          obterModeloCompletoAction(modeloParaCarregarId),
          verificarProntidaoModeloAction({ modeloId: modeloParaCarregarId }),
          avaliarConformidadeModeloAction(modeloParaCarregarId),
        ]);

        setModeloAtivo(completoRes.success ? completoRes.data : null);
        setProntidao(prontidaoRes.success ? prontidaoRes.data : null);
        setConformidade(conformidadeRes.success ? conformidadeRes.data : null);
      } else {
        setModeloAtivo(null);
        setProntidao(null);
        setConformidade(null);
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Falha ao carregar dados operacionais da modelagem.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [demand.id]);

  useEffect(() => {
    loadModelingData();
  }, [loadModelingData]);

  // Handlers de Operações
  const handleDeleteEntity = async (entidadeId: string, nome: string) => {
    if (isReadOnly) return;
    if (!confirm(`Deseja realmente remover a entidade analítica "${nome}"? Esta ação removerá também seus atributos e relacionamentos associados.`)) {
      return;
    }
    try {
      const res = await removerEntidadeAnaliticaAction(entidadeId, demand.id);
      if (!res.success) {
        setFeedback({ type: 'error', message: res.error || 'Erro ao remover entidade.' });
      } else {
        setFeedback({ type: 'success', message: `Entidade "${nome}" removida com sucesso.` });
        if (modeloAtivo) await loadModelingData(modeloAtivo.id);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Erro inesperado ao remover entidade.' });
    }
  };

  const handleDeleteRelationship = async (relacionamentoId: string) => {
    if (isReadOnly) return;
    if (!confirm('Deseja realmente remover este relacionamento analítico?')) {
      return;
    }
    try {
      const res = await removerRelacionamentoAnaliticoAction(relacionamentoId, demand.id);
      if (!res.success) {
        setFeedback({ type: 'error', message: res.error || 'Erro ao remover relacionamento.' });
      } else {
        setFeedback({ type: 'success', message: 'Relacionamento removido com sucesso.' });
        if (modeloAtivo) await loadModelingData(modeloAtivo.id);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Erro inesperado ao remover relacionamento.' });
    }
  };

  const handleDeleteMetric = async (metricaId: string, nome: string) => {
    if (isReadOnly) return;
    if (!confirm(`Deseja realmente remover a métrica "${nome}"?`)) {
      return;
    }
    try {
      const res = await removerMetricaAnaliticaAction({ id: metricaId }, demand.id);
      if (!res.success) {
        setFeedback({ type: 'error', message: res.error || 'Erro ao remover métrica.' });
      } else {
        setFeedback({ type: 'success', message: `Métrica "${nome}" removida com sucesso.` });
        if (modeloAtivo) await loadModelingData(modeloAtivo.id);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Erro inesperado ao remover métrica.' });
    }
  };

  const handleReevaluateCompliance = async () => {
    if (!modeloAtivo) return;
    setIsReevaluating(true);
    try {
      const [conformidadeRes, prontidaoRes] = await Promise.all([
        avaliarConformidadeModeloAction(modeloAtivo.id),
        verificarProntidaoModeloAction({ modeloId: modeloAtivo.id }),
      ]);

      if (conformidadeRes.success) setConformidade(conformidadeRes.data);
      if (prontidaoRes.success) setProntidao(prontidaoRes.data);

      setFeedback({
        type: 'success',
        message: 'Avaliação determinística de conformidade reprocessada com sucesso!',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Erro ao reavaliar conformidade.' });
    } finally {
      setIsReevaluating(false);
    }
  };

  const handleAdvanceDemand = async () => {
    if (isReadOnly) return;
    setFeedback(null);
    try {
      const res = await advanceDemandAction(demand.id);
      if (!res.success) {
        setFeedback({
          type: 'error',
          message: res.error || 'Não foi possível avançar a demanda para Validação.',
        });
      } else {
        setFeedback({
          type: 'success',
          message: 'Demanda avançada com sucesso para a etapa de Validação!',
        });
        router.refresh();
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Erro inesperado ao avançar demanda.',
      });
    }
  };

  // Scroll Helpers
  const scrollToCompliance = () => {
    const el = document.getElementById('modeling-compliance-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToEntities = () => {
    const el = document.querySelector('[data-testid="entities-and-attributes-section"]');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToMetrics = () => {
    const el = document.querySelector('[data-testid="metrics-section"]');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-6" data-testid="tab-modeling-container">
      {/* Banner de Governança Read-Only quando aplicável */}
      {isReadOnly && (
        <div
          className="flex items-center gap-2.5 rounded-lg border border-amber-800/80 bg-amber-950/40 p-3.5 text-xs text-amber-300"
          data-testid="modeling-banner-readonly-governance"
        >
          <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400" />
          <span>
            {isSuspensa && 'Demanda Suspensa: As alterações e homologações do modelo analítico estão congeladas enquanto a demanda estiver suspensa.'}
            {isConcluida && 'Demanda Concluída: O modelo analítico e as métricas estão imutáveis para fins de auditoria e entregáveis.'}
            {isCancelada && 'Demanda Cancelada: As definições analíticas estão arquivadas em modo somente-leitura.'}
          </span>
        </div>
      )}

      {/* Banner de Feedback Global */}
      {feedback && (
        <div
          className={`flex items-center justify-between rounded-lg p-3 text-xs border ${
            feedback.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/70 border-rose-800 text-rose-300'
          }`}
          data-testid="modeling-feedback-alert"
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="hover:opacity-75"
            aria-label="Fechar alerta"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* [1] Copiloto Proativo Explicável da Modelagem */}
      <ModelingNextActionBanner
        hasDatasetAutorizado={Boolean(datasetAutorizado && datasetAutorizado.status === 'VIGENTE')}
        datasetAutorizado={datasetAutorizado}
        modelo={modeloAtivo}
        prontidao={prontidao}
        isReadOnly={isReadOnly}
        onOpenCreateModel={() => setCreateModelModalOpen(true)}
        onOpenAddEntity={() => setAddEntityModalOpen(true)}
        onOpenCreateMetric={() => setCreateMetricModalOpen(true)}
        onOpenSpecifyCalendar={() => setSpecifyCalendarModalOpen(true)}
        onOpenHomologate={() => setHomologateModalOpen(true)}
        onScrollToCompliance={scrollToCompliance}
        onScrollToEntities={scrollToEntities}
        onScrollToMetrics={scrollToMetrics}
        onAdvanceDemand={handleAdvanceDemand}
      />

      {/* [2] Cabeçalho Executivo do Modelo Analítico */}
      {modeloAtivo && (
        <ModelHeaderCard
          modelo={modeloAtivo}
          historicoModelos={historicoModelos}
          datasetAutorizado={datasetAutorizado}
          prontidao={prontidao}
          onSelectModelo={(id) => loadModelingData(id)}
          onOpenEditModal={() => setEditModelModalOpen(true)}
          onOpenSpecifyCalendar={() => setSpecifyCalendarModalOpen(true)}
          isReadOnly={isReadOnly}
        />
      )}

      {/* [3] Governança & Prontidão de Homologação */}
      {modeloAtivo && (
        <HomologationGovernancePanel
          modelo={modeloAtivo}
          prontidao={prontidao}
          onOpenHomologateModal={() => setHomologateModalOpen(true)}
          onOpenRevokeModal={() => setRevokeModalOpen(true)}
          onAdvanceDemand={handleAdvanceDemand}
          isReadOnly={isReadOnly}
        />
      )}

      {/* [4] Visualização da Estrutura Analítica */}
      {modeloAtivo && <ModelStructureView modelo={modeloAtivo} />}

      {/* [5] Entidades e Atributos */}
      {modeloAtivo && (
        <EntitiesAndAttributesSection
          modelo={modeloAtivo}
          onOpenAddEntity={() => setAddEntityModalOpen(true)}
          onOpenConfigureAttributes={(entidade) => {
            setSelectedEntityForAttributes(entidade);
            setConfigureAttributesModalOpen(true);
          }}
          onDeleteEntity={handleDeleteEntity}
          isReadOnly={isReadOnly}
        />
      )}

      {/* [6] Relacionamentos Analíticos */}
      {modeloAtivo && (
        <RelationshipsSection
          modelo={modeloAtivo}
          onOpenAddRelationship={() => setAddRelationshipModalOpen(true)}
          onDeleteRelationship={handleDeleteRelationship}
          isReadOnly={isReadOnly}
        />
      )}

      {/* [7] Métricas Analíticas */}
      {modeloAtivo && (
        <MetricsSection
          modelo={modeloAtivo}
          onOpenCreateMetric={() => setCreateMetricModalOpen(true)}
          onOpenEditMetric={(metrica) => {
            setSelectedMetricForEdit(metrica);
            setEditMetricModalOpen(true);
          }}
          onDeleteMetric={handleDeleteMetric}
          isReadOnly={isReadOnly}
        />
      )}

      {/* [8] Avaliação Determinística de Conformidade (Regras M-01 a M-10) */}
      {modeloAtivo && (
        <ComplianceEvaluationSection
          conformidade={conformidade}
          onReevaluate={handleReevaluateCompliance}
          isLoading={isReevaluating}
        />
      )}

      {/* Modais de Governança e Operação */}
      {datasetAutorizado && (
        <CreateModelModal
          isOpen={createModelModalOpen}
          onClose={() => setCreateModelModalOpen(false)}
          demandaId={demand.id}
          datasetAutorizadoId={datasetAutorizado.id}
          datasetVersao={datasetAutorizado.versao_rotulo}
          onSuccess={(msg) => {
            setFeedback({ type: 'success', message: msg });
            loadModelingData();
          }}
        />
      )}

      {modeloAtivo && (
        <>
          <EditModelModal
            isOpen={editModelModalOpen}
            onClose={() => setEditModelModalOpen(false)}
            modelo={modeloAtivo}
            demandaId={demand.id}
            onSuccess={(msg) => {
              setFeedback({ type: 'success', message: msg });
              loadModelingData(modeloAtivo.id);
            }}
          />

          <AddEntityModal
            isOpen={addEntityModalOpen}
            onClose={() => setAddEntityModalOpen(false)}
            modeloId={modeloAtivo.id}
            demandaId={demand.id}
            initialAssets={initialAssets}
            onSuccess={(msg) => {
              setFeedback({ type: 'success', message: msg });
              loadModelingData(modeloAtivo.id);
            }}
          />

          <ConfigureAttributesModal
            isOpen={configureAttributesModalOpen}
            onClose={() => {
              setConfigureAttributesModalOpen(false);
              setSelectedEntityForAttributes(null);
            }}
            entidade={selectedEntityForAttributes}
            demandaId={demand.id}
            onSuccess={(msg) => {
              setFeedback({ type: 'success', message: msg });
              loadModelingData(modeloAtivo.id);
            }}
          />

          <AddRelationshipModal
            isOpen={addRelationshipModalOpen}
            onClose={() => setAddRelationshipModalOpen(false)}
            modelo={modeloAtivo}
            demandaId={demand.id}
            onSuccess={(msg) => {
              setFeedback({ type: 'success', message: msg });
              loadModelingData(modeloAtivo.id);
            }}
          />

          <SpecifyCalendarModal
            isOpen={specifyCalendarModalOpen}
            onClose={() => setSpecifyCalendarModalOpen(false)}
            modeloId={modeloAtivo.id}
            demandaId={demand.id}
            onSuccess={(msg) => {
              setFeedback({ type: 'success', message: msg });
              loadModelingData(modeloAtivo.id);
            }}
          />

          <CreateMetricModal
            isOpen={createMetricModalOpen}
            onClose={() => setCreateMetricModalOpen(false)}
            modelo={modeloAtivo}
            demandaId={demand.id}
            onSuccess={(msg) => {
              setFeedback({ type: 'success', message: msg });
              loadModelingData(modeloAtivo.id);
            }}
          />

          <EditMetricModal
            isOpen={editMetricModalOpen}
            onClose={() => {
              setEditMetricModalOpen(false);
              setSelectedMetricForEdit(null);
            }}
            metrica={selectedMetricForEdit}
            modelo={modeloAtivo}
            demandaId={demand.id}
            onSuccess={(msg) => {
              setFeedback({ type: 'success', message: msg });
              loadModelingData(modeloAtivo.id);
            }}
          />

          <HomologateModelModal
            isOpen={homologateModalOpen}
            onClose={() => setHomologateModalOpen(false)}
            modelo={modeloAtivo}
            prontidao={prontidao}
            demandaId={demand.id}
            onSuccess={(msg) => {
              setFeedback({ type: 'success', message: msg });
              loadModelingData(modeloAtivo.id);
            }}
          />

          <RevokeHomologationModal
            isOpen={revokeModalOpen}
            onClose={() => setRevokeModalOpen(false)}
            modeloId={modeloAtivo.id}
            modeloNome={modeloAtivo.nome}
            demandaId={demand.id}
            onSuccess={(msg) => {
              setFeedback({ type: 'success', message: msg });
              loadModelingData(modeloAtivo.id);
            }}
          />
        </>
      )}
    </div>
  );
}
