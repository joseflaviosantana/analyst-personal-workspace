'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  Loader2,
  X
} from 'lucide-react';
import { DemandaComProjeto } from '@/core/domain/entities/demanda';
import { AtivoDados } from '@/core/domain/entities/ativo-dados';
import { ReceitaPreparacao } from '@/core/domain/entities/receita-preparacao';
import { EtapaTransformacao } from '@/core/domain/entities/etapa-transformacao';
import { LinhagemAtivos } from '@/core/domain/entities/linhagem-ativos';
import { DatasetAutorizadoAnalise } from '@/core/domain/entities/dataset-autorizado-analise';
import { ProblemaQualidade } from '@/core/domain/entities/problema-qualidade';
import { ProntidaoModelagemOutput } from '@/core/use-cases/preparation';
import {
  EstadoDemanda,
  isEstadoTerminal,
  normalizarEstadoDemanda
} from '@/core/domain/enums/estado-demanda';
import { StatusEtapaTransformacao } from '@/core/domain/enums/status-etapa-transformacao';

import {
  listarReceitasDemandaAction,
  obterReceitaAtivaDemandaAction,
  obterReceitaPreparacaoAction,
  reordenarEtapasTransformacaoAction,
  excluirEtapaTransformacaoAction,
  listarProblemasEtapaAction,
  consultarLinhagemDemandaAction,
  obterDatasetAutorizadoVigenteAction,
  verificarProntidaoParaModelagemAction,
  validarEtapaPreparacaoAction,
  validarTratamentoProblemaAction,
} from '@/app/actions/preparation-actions';
import { listQualityProblemsAction } from '@/app/actions/quality-actions';
import { advanceDemandAction } from '@/app/actions/workflow-actions';

import { PreparationNextActionBanner } from '@/components/preparation/PreparationNextActionBanner';
import { DatasetAuthorizationSection } from '@/components/preparation/DatasetAuthorizationSection';
import { RecipeHeaderCard } from '@/components/preparation/RecipeHeaderCard';
import { TransformationStepsList } from '@/components/preparation/TransformationStepsList';
import { ProblemTreatmentVerificationCard } from '@/components/preparation/ProblemTreatmentVerificationCard';
import { LineageFlowView } from '@/components/preparation/LineageFlowView';

import { CreateRecipeModal } from '@/components/preparation/CreateRecipeModal';
import { EditRecipeModal } from '@/components/preparation/EditRecipeModal';
import { AddTransformationStepModal } from '@/components/preparation/AddTransformationStepModal';
import { EditTransformationStepModal } from '@/components/preparation/EditTransformationStepModal';
import { CancelTransformationStepModal } from '@/components/preparation/CancelTransformationStepModal';
import { AssociateProblemModal } from '@/components/preparation/AssociateProblemModal';
import { RegisterDerivedAssetModal } from '@/components/preparation/RegisterDerivedAssetModal';
import { AuthorizeDatasetModal } from '@/components/preparation/AuthorizeDatasetModal';
import { RevokeDatasetModal } from '@/components/preparation/RevokeDatasetModal';
import { ConcludeRecipeModal } from '@/components/preparation/ConcludeRecipeModal';

interface TabPreparationProps {
  demand: DemandaComProjeto;
  initialAssets?: AtivoDados[];
}

export function TabPreparation({ demand, initialAssets = [] }: TabPreparationProps) {
  const router = useRouter();

  // Estados dos Dados da Preparação
  const [receitaAtiva, setReceitaAtiva] = useState<ReceitaPreparacao | null>(null);
  const [historicoReceitas, setHistoricoReceitas] = useState<ReceitaPreparacao[]>([]);
  const [etapas, setEtapas] = useState<EtapaTransformacao[]>([]);
  const [mapaProblemasPorEtapa, setMapaProblemasPorEtapa] = useState<Record<string, string[]>>({});
  const [problemasDemanda, setProblemasDemanda] = useState<ProblemaQualidade[]>([]);
  const [arestasLinhagem, setArestasLinhagem] = useState<LinhagemAtivos[]>([]);
  const [datasetAutorizado, setDatasetAutorizado] = useState<DatasetAutorizadoAnalise | null>(null);
  const [prontidao, setProntidao] = useState<ProntidaoModelagemOutput | null>(null);

  // Estados de Carregamento e Feedback
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modais de Governança e Interação
  const [createRecipeModalOpen, setCreateRecipeModalOpen] = useState(false);
  const [editRecipeModalOpen, setEditRecipeModalOpen] = useState(false);
  const [concludeRecipeModalOpen, setConcludeRecipeModalOpen] = useState(false);

  const [addStepModalOpen, setAddStepModalOpen] = useState(false);
  const [selectedStepForEdit, setSelectedStepForEdit] = useState<EtapaTransformacao | null>(null);
  const [selectedStepForCancel, setSelectedStepForCancel] = useState<EtapaTransformacao | null>(null);
  const [selectedStepForAssociate, setSelectedStepForAssociate] = useState<EtapaTransformacao | null>(null);
  const [selectedStepForRegisterDerived, setSelectedStepForRegisterDerived] = useState<EtapaTransformacao | null>(null);

  const [authorizeDatasetModalOpen, setAuthorizeDatasetModalOpen] = useState(false);
  const [revokeDatasetModalOpen, setRevokeDatasetModalOpen] = useState(false);

  // Governança de Workflow Read-Only
  const estadoAtual = normalizarEstadoDemanda(demand.estado);
  const isSuspensa = estadoAtual === EstadoDemanda.SUSPENSA;
  const isConcluida = estadoAtual === EstadoDemanda.CONCLUIDA;
  const isCancelada = estadoAtual === EstadoDemanda.CANCELADA;
  const isTerminal = isEstadoTerminal(estadoAtual);
  const isReadOnly = isSuspensa || isTerminal;

  // Carregamento Completo dos Dados da Aba 5
  const loadPreparationData = useCallback(async (receitaIdAlvo?: string) => {
    setIsLoading(true);
    try {
      const [
        receitasRes,
        receitaAtivaRes,
        problemasRes,
        linhagemRes,
        datasetRes,
        prontidaoRes
      ] = await Promise.all([
        listarReceitasDemandaAction(demand.id),
        obterReceitaAtivaDemandaAction(demand.id),
        listQualityProblemsAction({ demandaId: demand.id }),
        consultarLinhagemDemandaAction(demand.id),
        obterDatasetAutorizadoVigenteAction(demand.id),
        verificarProntidaoParaModelagemAction(demand.id),
      ]);

      const todasReceitas = receitasRes.success ? receitasRes.data : [];
      setHistoricoReceitas(todasReceitas);

      let receitaParaCarregar: ReceitaPreparacao | null = null;
      if (receitaIdAlvo) {
        receitaParaCarregar = todasReceitas.find((r) => r.id === receitaIdAlvo) || null;
      } else if (receitaAtivaRes.success && receitaAtivaRes.data) {
        receitaParaCarregar = receitaAtivaRes.data;
      } else if (todasReceitas.length > 0) {
        receitaParaCarregar = todasReceitas[0];
      }

      setReceitaAtiva(receitaParaCarregar);

      // Carregar etapas da receita selecionada
      if (receitaParaCarregar) {
        const receitaDetalhesRes = await obterReceitaPreparacaoAction(receitaParaCarregar.id);
        if (receitaDetalhesRes.success && receitaDetalhesRes.data) {
          const etapasCarregadas = receitaDetalhesRes.data.etapas || [];
          setEtapas(etapasCarregadas);

          // Carregar problemas vinculados para cada etapa
          const mapa: Record<string, string[]> = {};
          await Promise.all(
            etapasCarregadas.map(async (etapa) => {
              const res = await listarProblemasEtapaAction(etapa.id);
              if (res.success && res.data) {
                mapa[etapa.id] = res.data.map((p) => p.id);
              }
            })
          );
          setMapaProblemasPorEtapa(mapa);
        } else {
          setEtapas([]);
          setMapaProblemasPorEtapa({});
        }
      } else {
        setEtapas([]);
        setMapaProblemasPorEtapa({});
      }

      setProblemasDemanda(problemasRes.success ? problemasRes.data : []);
      setArestasLinhagem(linhagemRes.success ? linhagemRes.data : []);
      setDatasetAutorizado(datasetRes.success ? datasetRes.data : null);
      setProntidao(prontidaoRes.success ? prontidaoRes.data : null);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Falha ao carregar dados operacionais da esteira de preparação.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [demand.id]);

  useEffect(() => {
    loadPreparationData();
  }, [loadPreparationData]);

  // Handlers de Operações
  const handleReorderSteps = async (novasOrdens: { id: string; ordem: number }[]) => {
    if (!receitaAtiva || isReadOnly) return;
    try {
      const res = await reordenarEtapasTransformacaoAction(
        { receita_id: receitaAtiva.id, ordens: novasOrdens },
        demand.id
      );
      if (!res.success) {
        setFeedback({ type: 'error', message: res.error || 'Erro ao reordenar etapas.' });
      } else {
        setFeedback({ type: 'success', message: 'Ordem das etapas de transformação atualizada com sucesso.' });
        await loadPreparationData(receitaAtiva.id);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Erro inesperado na reordenação.' });
    }
  };

  const handleDeleteStep = async (etapa: EtapaTransformacao) => {
    if (isReadOnly) return;
    if (!confirm(`Deseja realmente excluir a etapa #${etapa.ordem} (${etapa.tipo_operacao}) em rascunho?`)) {
      return;
    }
    try {
      const res = await excluirEtapaTransformacaoAction(etapa.id, demand.id);
      if (!res.success) {
        setFeedback({ type: 'error', message: res.error || 'Erro ao excluir etapa.' });
      } else {
        setFeedback({ type: 'success', message: `Etapa #${etapa.ordem} excluída com sucesso.` });
        if (receitaAtiva) {
          await loadPreparationData(receitaAtiva.id);
        }
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Erro inesperado ao excluir etapa.' });
    }
  };

  const handleValidateStep = async (etapa: EtapaTransformacao) => {
    if (isReadOnly) return;
    try {
      const res = await validarEtapaPreparacaoAction(
        { etapa_id: etapa.id, autor_tipo: 'HUMANO' },
        demand.id
      );
      if (!res.success) {
        setFeedback({ type: 'error', message: res.error || 'Falha ao validar etapa.' });
      } else {
        setFeedback({ type: 'success', message: `Etapa #${etapa.ordem} validada comprovadamente por diagnóstico!` });
        if (receitaAtiva) {
          await loadPreparationData(receitaAtiva.id);
        }
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Erro inesperado ao validar etapa.' });
    }
  };

  const handleValidateProblem = async (problemaId: string) => {
    try {
      const res = await validarTratamentoProblemaAction(
        { problema_id: problemaId, autor_tipo: 'HUMANO' },
        demand.id
      );
      if (!res.success) {
        setFeedback({ type: 'error', message: res.error || 'Erro na validação do problema.' });
        return null;
      }
      setFeedback({
        type: res.data.resolvido ? 'success' : 'error',
        message: res.data.motivo,
      });
      if (receitaAtiva) {
        await loadPreparationData(receitaAtiva.id);
      }
      return res.data;
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Erro inesperado na validação.' });
      return null;
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
          message: res.error || 'Não foi possível avançar a demanda para Modelagem.',
        });
      } else {
        setFeedback({
          type: 'success',
          message: 'Demanda avançada com sucesso para Modelagem e Análise!',
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
  const scrollToSteps = () => {
    const el = document.getElementById('prep-steps-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToVerifications = () => {
    const el = document.getElementById('prep-verifications-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Localizar o ativo do dataset autorizado se existir
  const ativoAutorizado = datasetAutorizado
    ? initialAssets.find((a) => a.id === datasetAutorizado.ativo_dados_id) || null
    : null;

  const totalEtapasValidadas = etapas.filter((e) => e.status === StatusEtapaTransformacao.VALIDADA).length;

  return (
    <div className="space-y-6" data-testid="tab-preparation-container">
      {/* Banner de Governança Read-Only quando aplicável */}
      {isReadOnly && (
        <div
          className="flex items-center gap-2.5 rounded-lg border border-amber-800/80 bg-amber-950/40 p-3.5 text-xs text-amber-300"
          data-testid="prep-banner-readonly-governance"
        >
          <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400" />
          <span>
            {isSuspensa && 'Demanda Suspensa: O pipeline de preparação e as homologações estão congelados enquanto a demanda estiver pausada.'}
            {isConcluida && 'Demanda Concluída: A esteira de preparação e o dataset autorizado estão imutáveis para fins de auditoria e entregáveis.'}
            {isCancelada && 'Demanda Cancelada: As receitas e etapas estão arquivadas em modo somente-leitura.'}
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
          data-testid="prep-feedback-alert"
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

      {/* [Bloco A] Banner do Copiloto Proativo Explicável (6 Passos Determinísticos) */}
      <PreparationNextActionBanner
        hasAssets={initialAssets.length > 0}
        receita={receitaAtiva}
        etapas={etapas}
        datasetAutorizado={datasetAutorizado}
        problemas={problemasDemanda}
        prontidao={prontidao}
        onOpenCreateRecipe={() => setCreateRecipeModalOpen(true)}
        onOpenAddStep={() => setAddStepModalOpen(true)}
        onOpenAuthorizeDataset={() => setAuthorizeDatasetModalOpen(true)}
        onScrollToSteps={scrollToSteps}
        onScrollToVerifications={scrollToVerifications}
        onAdvanceDemand={handleAdvanceDemand}
        isReadOnly={isReadOnly}
      />

      {/* [Bloco B] Painel Executivo: Dataset Autorizado Vigente & Checklist de Prontidão */}
      <DatasetAuthorizationSection
        datasetAutorizado={datasetAutorizado}
        ativoAutorizado={ativoAutorizado}
        prontidao={prontidao}
        onOpenAuthorizeModal={() => setAuthorizeDatasetModalOpen(true)}
        onOpenRevokeModal={() => setRevokeDatasetModalOpen(true)}
        onAdvanceDemand={handleAdvanceDemand}
        isReadOnly={isReadOnly}
      />

      {/* [Bloco C] Cabeçalho da Receita de Preparação */}
      <RecipeHeaderCard
        receita={receitaAtiva}
        historicoReceitas={historicoReceitas}
        etapas={etapas}
        onSelectReceita={(id) => loadPreparationData(id)}
        onOpenCreateModal={() => setCreateRecipeModalOpen(true)}
        onOpenEditModal={() => setEditRecipeModalOpen(true)}
        onOpenConcludeModal={() => setConcludeRecipeModalOpen(true)}
        isReadOnly={isReadOnly}
      />

      {/* [Bloco D] Fila Ordenada de Etapas de Transformação */}
      {receitaAtiva && (
        <div id="prep-steps-section">
          {isLoading ? (
            <div className="flex items-center justify-center p-12 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin mr-2 text-blue-400" />
              <span className="text-xs">Carregando etapas de transformação...</span>
            </div>
          ) : (
            <TransformationStepsList
              etapas={etapas}
              problemasDemanda={problemasDemanda}
              mapaProblemasPorEtapa={mapaProblemasPorEtapa}
              onOpenAddStep={() => setAddStepModalOpen(true)}
              onOpenEditStep={(etapa) => setSelectedStepForEdit(etapa)}
              onOpenDeleteStep={handleDeleteStep}
              onOpenCancelStep={(etapa) => setSelectedStepForCancel(etapa)}
              onOpenAssociateProblem={(etapa) => setSelectedStepForAssociate(etapa)}
              onOpenRegisterDerived={(etapa) => setSelectedStepForRegisterDerived(etapa)}
              onValidateStep={handleValidateStep}
              onReorderSteps={handleReorderSteps}
              isReadOnly={isReadOnly}
            />
          )}
        </div>
      )}

      {/* [Bloco E] Painel de Validação Empírica de Problemas no Pipeline */}
      <div id="prep-verifications-section">
        <ProblemTreatmentVerificationCard
          problemas={problemasDemanda}
          etapas={etapas}
          mapaProblemasPorEtapa={mapaProblemasPorEtapa}
          onValidateProblem={handleValidateProblem}
          isReadOnly={isReadOnly}
        />
      </div>

      {/* [Bloco F] Grafo Visual de Linhagem e Procedência (DAG) */}
      <LineageFlowView
        arestas={arestasLinhagem}
        ativos={initialAssets}
        etapas={etapas}
      />

      {/* Modais de Governança */}
      <CreateRecipeModal
        isOpen={createRecipeModalOpen}
        onClose={() => setCreateRecipeModalOpen(false)}
        demandaId={demand.id}
        onSuccess={(nova) => {
          setFeedback({ type: 'success', message: `Receita "${nova.titulo}" criada em rascunho com sucesso.` });
          loadPreparationData(nova.id);
        }}
      />

      <EditRecipeModal
        isOpen={editRecipeModalOpen}
        onClose={() => setEditRecipeModalOpen(false)}
        receita={receitaAtiva}
        demandaId={demand.id}
        onSuccess={(atualizada) => {
          setFeedback({ type: 'success', message: 'Metadados da receita atualizados com sucesso.' });
          loadPreparationData(atualizada.id);
        }}
      />

      <ConcludeRecipeModal
        isOpen={concludeRecipeModalOpen}
        onClose={() => setConcludeRecipeModalOpen(false)}
        receita={receitaAtiva}
        demandaId={demand.id}
        totalEtapasValidadas={totalEtapasValidadas}
        onSuccess={(concluida) => {
          setFeedback({ type: 'success', message: `Receita "${concluida.titulo}" homologada e concluída com sucesso!` });
          loadPreparationData(concluida.id);
        }}
      />

      {receitaAtiva && (
        <AddTransformationStepModal
          isOpen={addStepModalOpen}
          onClose={() => setAddStepModalOpen(false)}
          receitaId={receitaAtiva.id}
          demandaId={demand.id}
          proximaOrdem={etapas.length + 1}
          onSuccess={(novaEtapa) => {
            setFeedback({ type: 'success', message: `Etapa #${novaEtapa.ordem} adicionada à receita.` });
            loadPreparationData(receitaAtiva.id);
          }}
        />
      )}

      <EditTransformationStepModal
        isOpen={Boolean(selectedStepForEdit)}
        onClose={() => setSelectedStepForEdit(null)}
        etapa={selectedStepForEdit}
        demandaId={demand.id}
        onSuccess={(atualizada) => {
          setFeedback({ type: 'success', message: `Etapa #${atualizada.ordem} atualizada com sucesso.` });
          if (receitaAtiva) loadPreparationData(receitaAtiva.id);
        }}
      />

      <CancelTransformationStepModal
        isOpen={Boolean(selectedStepForCancel)}
        onClose={() => setSelectedStepForCancel(null)}
        etapa={selectedStepForCancel}
        demandaId={demand.id}
        onSuccess={(cancelada) => {
          setFeedback({ type: 'success', message: `Etapa #${cancelada.ordem} cancelada auditadamente.` });
          if (receitaAtiva) loadPreparationData(receitaAtiva.id);
        }}
      />

      <AssociateProblemModal
        isOpen={Boolean(selectedStepForAssociate)}
        onClose={() => setSelectedStepForAssociate(null)}
        etapa={selectedStepForAssociate}
        problemasDemanda={problemasDemanda}
        problemasVinculadosIds={
          selectedStepForAssociate ? mapaProblemasPorEtapa[selectedStepForAssociate.id] || [] : []
        }
        demandaId={demand.id}
        onSuccess={() => {
          if (receitaAtiva) loadPreparationData(receitaAtiva.id);
        }}
      />

      {receitaAtiva && (
        <RegisterDerivedAssetModal
          isOpen={Boolean(selectedStepForRegisterDerived)}
          onClose={() => setSelectedStepForRegisterDerived(null)}
          etapa={selectedStepForRegisterDerived}
          receitaId={receitaAtiva.id}
          demandaId={demand.id}
          ativosDisponiveis={initialAssets}
          onSuccess={({ ativo }) => {
            setFeedback({
              type: 'success',
              message: `Ativo derivado "${ativo.nome_arquivo}" registrado com sucesso! A etapa foi promovida para Executada.`,
            });
            loadPreparationData(receitaAtiva.id);
            router.refresh();
          }}
        />
      )}

      <AuthorizeDatasetModal
        isOpen={authorizeDatasetModalOpen}
        onClose={() => setAuthorizeDatasetModalOpen(false)}
        demandaId={demand.id}
        receitaId={receitaAtiva?.id || null}
        ativosDisponiveis={initialAssets}
        onSuccess={(autorizado) => {
          setFeedback({
            type: 'success',
            message: `Dataset "${autorizado.versao_rotulo}" homologado e autorizado para Análise com sucesso!`,
          });
          if (receitaAtiva) loadPreparationData(receitaAtiva.id);
          router.refresh();
        }}
      />

      <RevokeDatasetModal
        isOpen={revokeDatasetModalOpen}
        onClose={() => setRevokeDatasetModalOpen(false)}
        datasetAutorizado={datasetAutorizado}
        demandaId={demand.id}
        onSuccess={() => {
          setFeedback({
            type: 'success',
            message: 'Autorização vigente do dataset revogada com sucesso.',
          });
          if (receitaAtiva) loadPreparationData(receitaAtiva.id);
          router.refresh();
        }}
      />
    </div>
  );
}
