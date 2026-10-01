'use client';

/**
 * src/components/demands/TabDashboard.tsx
 *
 * Componente Principal da Aba 7 — Power BI & Dashboard (Subgates 3.4A e 3.4B)
 *
 * Responsabilidade:
 * - Carregar o contexto analítico e diagnósticos determinísticos via Server Action;
 * - Apresentar Cabeçalho Pedagógico com propósito claro e próxima ação principal;
 * - Suportar navegação progressiva em 5 blocos (Visão Geral, Métricas & DAX, Páginas, Visuais, Validação);
 * - Orquestrar os modais operacionais do Subgate 3.4B:
 *   1. Registro de Arquivo Power BI (.pbix / .pbip);
 *   2. Declaração Formal de Isenção (Excel-Only — D-08);
 *   3. Edição de Metadados e Ciclo de Vida do Modelo;
 * - Tratar explicitamente os estados: Carregando, Vazio, Disponível, Isento Excel-only, Erro Recuperável;
 * - Integrar o dock de orientação prévia do Copiloto Proativo;
 * - Reduzir carga cognitiva com foco, clareza e separação de responsabilidades.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, RefreshCw, ShieldAlert } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { DemandaComProjeto } from '@/core/domain/entities/demanda';
import { AtivoDados } from '@/core/domain/entities/ativo-dados';
import {
  EstadoDemanda,
  normalizarEstadoDemanda,
  isEstadoTerminal,
} from '@/core/domain/enums/estado-demanda';
import {
  obterContextoDashboardAction,
  gerarPropostaDashboardAction,
  aprovarPropostaDashboardAction,
  alternarTipoVisualPersistidoAction,
  excluirPaginaRelatorioAction,
  excluirVisualDashboardAction,
  gerarPacoteEntregaDashboardAction,
} from '@/app/actions/dashboard-actions';
import { ExecutarCopilotoDashboardOutput } from '@/core/use-cases/dashboard/executar-copiloto-dashboard.use-case';
import { TipoFormatoModeloPowerBi } from '@/core/domain/enums/tipo-formato-modelo-powerbi';
import { DashboardSpecification } from '@/core/domain/dashboard-automation/dashboard-specification';
import { TipoTemplateDashboard } from '@/core/domain/dashboard-design/dashboard-template';
import { TipoVisualDashboard } from '@/core/domain/enums/tipo-visual-dashboard';
import { PacoteEntregaDashboard } from '@/core/domain/dashboard-delivery/dashboard-delivery-types';

import {
  DashboardPedagogicalHeader,
  DashboardProgressiveNavigation,
  BlocoProgressivoDashboard,
  DashboardOverviewSection,
  DashboardMetricsSection,
  DashboardPagesSection,
  DashboardVisualsSection,
  DashboardValidationSection,
  DashboardCopilotPreviewDock,
  DashboardDeliverySection,
  RegisterPowerBiModelModal,
  DeclareExemptionModal,
  EditPowerBiModelModal,
  CreateOrEditMedidaDaxModal,
  InspectMedidaDaxModal,
  DeleteMedidaDaxModal,
  CreateOrEditPaginaModal,
  CreateOrEditVisualModal,
} from '@/components/dashboard';
import { MedidaDax } from '@/core/domain/entities/medida-dax';

interface TabDashboardProps {
  demand: DemandaComProjeto;
  initialAssets?: AtivoDados[];
}

export function TabDashboard({ demand }: TabDashboardProps) {
  const [blocoAtivo, setBlocoAtivo] = useState<BlocoProgressivoDashboard>('visao-geral');
  const [data, setData] = useState<ExecutarCopilotoDashboardOutput | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Governança de Workflow Read-Only
  const estadoAtual = normalizarEstadoDemanda(demand.estado);
  const isSuspensa = estadoAtual === EstadoDemanda.SUSPENSA;
  const isConcluida = estadoAtual === EstadoDemanda.CONCLUIDA;
  const isCancelada = estadoAtual === EstadoDemanda.CANCELADA;
  const isTerminal = isEstadoTerminal(estadoAtual);
  const isReadOnly = isSuspensa || isTerminal;

  // Estados dos Modais Operacionais (Subgate 3.4B)
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isExemptionModalOpen, setIsExemptionModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Estados dos Modais de Gestão de Medidas DAX (Subgate 3.4C)
  const [isCreateMeasureModalOpen, setIsCreateMeasureModalOpen] = useState(false);
  const [isEditMeasureModalOpen, setIsEditMeasureModalOpen] = useState(false);
  const [isInspectMeasureModalOpen, setIsInspectMeasureModalOpen] = useState(false);
  const [isDeleteMeasureModalOpen, setIsDeleteMeasureModalOpen] = useState(false);
  const [selectedMeasure, setSelectedMeasure] = useState<MedidaDax | null>(null);
  const [preSelectedMetricId, setPreSelectedMetricId] = useState<string | null>(null);

  // Estados de Dashboard Automation + Human-in-the-Loop (Subgate 3.4D)
  const [propostaAtual, setPropostaAtual] = useState<DashboardSpecification | null>(null);
  const [isGerandoProposta, setIsGerandoProposta] = useState(false);
  const [isAprovandoProposta, setIsAprovandoProposta] = useState(false);
  const [isCreatePageModalOpen, setIsCreatePageModalOpen] = useState(false);
  const [isCreateVisualModalOpen, setIsCreateVisualModalOpen] = useState(false);
  const [paginaPreSelecionadaIdParaVisual, setPaginaPreSelecionadaIdParaVisual] = useState<string | null>(null);

  // Estados do Pacote de Entrega e Exportação (Subgate 3.4E)
  const [pacoteEntrega, setPacoteEntrega] = useState<PacoteEntregaDashboard | null>(null);
  const [docMarkdown, setDocMarkdown] = useState<string>('');
  const [pacoteJsonStr, setPacoteJsonStr] = useState<string>('');
  const [medidasTmdlStr, setMedidasTmdlStr] = useState<string>('');
  const [manifestoJsonStr, setManifestoJsonStr] = useState<string>('');
  const [isLoadingPacote, setIsLoadingPacote] = useState(false);

  const carregarPacoteEntrega = useCallback(async () => {
    setIsLoadingPacote(true);
    try {
      const res = await gerarPacoteEntregaDashboardAction(demand.id);
      if (res.success && res.data) {
        setPacoteEntrega(res.data.pacote);
        setDocMarkdown(res.data.documentacaoMarkdown);
        setPacoteJsonStr(res.data.pacoteJson);
        setMedidasTmdlStr(res.data.medidasTmdl);
        setManifestoJsonStr(res.data.manifestoLayoutJson);
      }
    } catch {
      // Ignorar erros secundários de entrega
    } finally {
      setIsLoadingPacote(false);
    }
  }, [demand.id]);

  const handleOpenCreateMeasureModal = (metricaSugeridaId?: string) => {
    if (isReadOnly) return;
    setSelectedMeasure(null);
    setPreSelectedMetricId(metricaSugeridaId ?? null);
    setIsCreateMeasureModalOpen(true);
  };

  const handleOpenEditMeasureModal = (medida: MedidaDax) => {
    if (isReadOnly) return;
    setSelectedMeasure(medida);
    setPreSelectedMetricId(null);
    setIsEditMeasureModalOpen(true);
  };

  const handleOpenInspectMeasureModal = (medida: MedidaDax) => {
    setSelectedMeasure(medida);
    setIsInspectMeasureModalOpen(true);
  };

  const handleOpenDeleteMeasureModal = (medida: MedidaDax) => {
    if (isReadOnly) return;
    setSelectedMeasure(medida);
    setIsDeleteMeasureModalOpen(true);
  };

  const handleGerarProposta = async (templateId: string) => {
    if (isReadOnly) return;
    setIsGerandoProposta(true);
    try {
      const res = await gerarPropostaDashboardAction(
        demand.id,
        templateId as TipoTemplateDashboard
      );
      if (res.success && res.data) {
        setPropostaAtual(res.data);
      } else {
        setError(res.error || 'Falha ao gerar proposta de dashboard.');
      }
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado ao gerar proposta de dashboard.');
    } finally {
      setIsGerandoProposta(false);
    }
  };

  const handleAprovarProposta = async () => {
    if (isReadOnly || !propostaAtual) return;
    setIsAprovandoProposta(true);
    try {
      const res = await aprovarPropostaDashboardAction(demand.id, propostaAtual);
      if (res.success) {
        setPropostaAtual(null);
        await carregarContexto();
      } else {
        setError(res.error || 'Falha ao aprovar proposta de dashboard.');
      }
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado ao aprovar proposta.');
    } finally {
      setIsAprovandoProposta(false);
    }
  };

  const handleDescartarProposta = () => {
    setPropostaAtual(null);
  };

  const handleExcluirPagina = async (paginaId: string) => {
    if (isReadOnly) return;
    try {
      const res = await excluirPaginaRelatorioAction(paginaId, demand.id);
      if (res.success) {
        await carregarContexto();
      } else {
        setError(res.error || 'Falha ao excluir página.');
      }
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado ao excluir página.');
    }
  };

  const handleExcluirVisual = async (visualId: string) => {
    if (isReadOnly) return;
    try {
      const res = await excluirVisualDashboardAction(visualId, demand.id);
      if (res.success) {
        await carregarContexto();
      } else {
        setError(res.error || 'Falha ao excluir visual.');
      }
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado ao excluir visual.');
    }
  };

  const handleAlternarVisual = async (visualId: string, novoTipo: TipoVisualDashboard) => {
    if (isReadOnly) return;
    try {
      const res = await alternarTipoVisualPersistidoAction(visualId, novoTipo, demand.id);
      if (res.success) {
        await carregarContexto();
      } else {
        setError(res.error || 'Falha ao alternar visual.');
      }
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado ao alternar visual.');
    }
  };

  const handleNavegarParaVisuais = (paginaId?: string) => {
    setBlocoAtivo('visuais');
    if (paginaId) {
      setPaginaPreSelecionadaIdParaVisual(paginaId);
    }
  };

  const carregarContexto = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await obterContextoDashboardAction(demand.id);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error || 'Falha ao recuperar dados da etapa de Dashboard.');
      }
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado ao conectar com a etapa de Dashboard.');
    } finally {
      setIsLoading(false);
    }
  }, [demand.id]);

  useEffect(() => {
    carregarContexto();
  }, [carregarContexto]);

  useEffect(() => {
    if (blocoAtivo === 'entrega-documentacao') {
      carregarPacoteEntrega();
    }
  }, [blocoAtivo, carregarPacoteEntrega]);

  // Estado: Carregando (Loading State)
  if (isLoading) {
    return (
      <div
        data-testid="tab-dashboard-loading"
        className="p-12 text-center flex flex-col items-center justify-center space-y-3 min-h-[300px]"
      >
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="text-sm text-slate-300 font-medium">
          Carregando ambiente analítico de Power BI &amp; Dashboard...
        </span>
        <span className="text-xs text-slate-500 font-mono">
          Avaliando conformidade técnica D-01 a D-08 e heurísticas do Copiloto
        </span>
      </div>
    );
  }

  // Estado: Erro Recuperável (Recoverable Error State)
  if (error || !data) {
    return (
      <Card
        data-testid="tab-dashboard-error"
        className="p-8 text-center border-rose-900/60 bg-rose-950/20 max-w-xl mx-auto"
      >
        <AlertCircle className="h-10 w-10 text-rose-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white">Falha ao Carregar o Dashboard</h3>
        <p className="text-xs text-rose-300 mt-1.5 leading-relaxed">
          {error || 'Não foi possível carregar os dados estruturais do dashboard.'}
        </p>
        <div className="mt-5">
          <button
            type="button"
            onClick={carregarContexto}
            data-testid="btn-retry-dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs font-semibold text-white hover:bg-slate-700 transition-colors shadow-sm"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Tentar Novamente</span>
          </button>
        </div>
      </Card>
    );
  }

  const { resultado, contextoUtilizado, estadoPedagogico } = data;
  const { modeloPowerBi, medidas, paginas, visuais, modeloAnalitico, resultadoConformidadeDax } =
    contextoUtilizado;

  const isIsento =
    modeloPowerBi?.tipo_formato === TipoFormatoModeloPowerBi.ISENTO_EXCEL_ONLY;
  const totalBloqueios = resultadoConformidadeDax?.total_bloqueios ?? 0;

  return (
    <div data-testid="tab-dashboard-container" className="space-y-6">
      {/* Banner de Governança Read-Only quando aplicável */}
      {isReadOnly && (
        <div
          className="flex items-center gap-2.5 rounded-lg border border-amber-800/80 bg-amber-950/40 p-3.5 text-xs text-amber-300"
          data-testid="dashboard-banner-readonly-governance"
        >
          <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400" />
          <span>
            {isSuspensa && 'Demanda Suspensa: O registro e edição de modelos Power BI, DAX e componentes visuais estão congelados enquanto a demanda estiver suspensa.'}
            {isConcluida && 'Demanda Concluída: O modelo Power BI, medidas DAX e visuais estão imutáveis para fins de auditoria e entregáveis.'}
            {isCancelada && 'Demanda Cancelada: As definições de dashboard estão arquivadas em modo somente-leitura.'}
          </span>
        </div>
      )}

      {/* 1. Cabeçalho Pedagógico com Propósito e Próxima Ação */}
      <DashboardPedagogicalHeader
        estadoPedagogico={estadoPedagogico}
        proximaAcao={resultado.proxima_acao_principal}
        isIsento={isIsento}
        totalMedidas={medidas.length}
        totalPaginas={paginas.length}
      />

      {/* 2. Navegador em 5 Blocos Progressivos (Progressive Disclosure) */}
      <DashboardProgressiveNavigation
        blocoAtivo={blocoAtivo}
        onSelecionarBloco={setBlocoAtivo}
        totalMedidas={medidas.length}
        totalPaginas={paginas.length}
        totalVisuais={visuais.length}
        totalBloqueios={totalBloqueios}
        isIsento={isIsento}
      />

      {/* 3. Área Principal de Trabalho (Grid com Conteúdo do Bloco + Dock do Copiloto) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Central / Conteúdo do Bloco Ativo (2 colunas em desktop) */}
        <div className="lg:col-span-2 space-y-4">
          {blocoAtivo === 'visao-geral' && (
            <DashboardOverviewSection
              modeloPowerBi={modeloPowerBi}
              modeloAnalitico={modeloAnalitico ?? null}
              totalMedidas={medidas.length}
              totalPaginas={paginas.length}
              totalVisuais={visuais.length}
              isReadOnly={isReadOnly}
              onOpenRegisterModal={() => !isReadOnly && setIsRegisterModalOpen(true)}
              onOpenExemptionModal={() => !isReadOnly && setIsExemptionModalOpen(true)}
              onOpenEditModal={() => !isReadOnly && setIsEditModalOpen(true)}
            />
          )}

          {blocoAtivo === 'metricas-dax' && (
            <DashboardMetricsSection
              medidas={medidas}
              isIsento={isIsento}
              modeloPowerBiId={modeloPowerBi?.id}
              modeloPowerBiNome={modeloPowerBi?.nome_arquivo}
              demandaId={demand.id}
              metricasHomologadas={modeloAnalitico?.metricas ?? []}
              modeloAnaliticoNome={modeloAnalitico?.nome}
              datasetNome={modeloAnalitico?.dataset_autorizado_id}
              isReadOnly={isReadOnly}
              onOpenCreateModal={handleOpenCreateMeasureModal}
              onOpenEditModal={handleOpenEditMeasureModal}
              onOpenInspectModal={handleOpenInspectMeasureModal}
              onOpenDeleteModal={handleOpenDeleteMeasureModal}
            />
          )}

          {blocoAtivo === 'paginas' && (
            <DashboardPagesSection
              paginas={paginas}
              isIsento={isIsento}
              demandaId={demand.id}
              modeloPowerBiId={modeloPowerBi?.id}
              propostaAtual={propostaAtual}
              isGerandoProposta={isGerandoProposta}
              isAprovandoProposta={isAprovandoProposta}
              isReadOnly={isReadOnly}
              onGerarProposta={handleGerarProposta}
              onAprovarProposta={handleAprovarProposta}
              onDescartarProposta={handleDescartarProposta}
              onExcluirPagina={handleExcluirPagina}
              onOpenCreateModal={() => !isReadOnly && setIsCreatePageModalOpen(true)}
              onNavegarParaVisuais={handleNavegarParaVisuais}
            />
          )}

          {blocoAtivo === 'visuais' && (
            <DashboardVisualsSection
              visuais={visuais}
              paginas={paginas}
              medidas={medidas}
              isIsento={isIsento}
              isReadOnly={isReadOnly}
              onOpenCreateModal={() => {
                if (isReadOnly) return;
                setPaginaPreSelecionadaIdParaVisual(paginas[0]?.id || null);
                setIsCreateVisualModalOpen(true);
              }}
              onExcluirVisual={handleExcluirVisual}
              onAlternarVisual={handleAlternarVisual}
            />
          )}

          {blocoAtivo === 'validacao' && (
            <DashboardValidationSection
              resultadoDax={resultadoConformidadeDax}
              isIsento={isIsento}
            />
          )}

          {blocoAtivo === 'entrega-documentacao' && (
            <DashboardDeliverySection
              pacote={pacoteEntrega}
              documentacaoMarkdown={docMarkdown}
              pacoteJson={pacoteJsonStr}
              medidasTmdl={medidasTmdlStr}
              manifestoLayoutJson={manifestoJsonStr}
              isLoading={isLoadingPacote}
              onRecarregarPacote={carregarPacoteEntrega}
              isIsento={isIsento}
            />
          )}
        </div>

        {/* Coluna Lateral / Reserva do Copiloto Proativo (1 coluna em desktop) */}
        <div className="lg:col-span-1">
          <DashboardCopilotPreviewDock
            estadoPedagogico={estadoPedagogico}
            totalInsights={resultado.total_insights}
          />
        </div>
      </div>

      {/* 4. Modais Operacionais de Registro de Modelo (Subgate 3.4B) */}
      <RegisterPowerBiModelModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        demandaId={demand.id}
        modeloAnaliticoId={modeloAnalitico?.id}
        onSuccess={() => {
          carregarContexto();
        }}
      />

      <DeclareExemptionModal
        isOpen={isExemptionModalOpen}
        onClose={() => setIsExemptionModalOpen(false)}
        demandaId={demand.id}
        onSuccess={() => {
          carregarContexto();
        }}
      />

      {modeloPowerBi && (
        <EditPowerBiModelModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          modelo={modeloPowerBi}
          demandaId={demand.id}
          onSuccess={() => {
            carregarContexto();
          }}
        />
      )}

      {/* 5. Modais Operacionais de Gestão de Medidas DAX (Subgate 3.4C) */}
      {modeloPowerBi && (
        <CreateOrEditMedidaDaxModal
          isOpen={isCreateMeasureModalOpen}
          onClose={() => {
            setIsCreateMeasureModalOpen(false);
            setPreSelectedMetricId(null);
          }}
          modeloPowerBiId={modeloPowerBi.id}
          demandaId={demand.id}
          metricasHomologadas={modeloAnalitico?.metricas ?? []}
          metricaPreSelecionadaId={preSelectedMetricId}
          onSuccess={carregarContexto}
        />
      )}

      {modeloPowerBi && selectedMeasure && (
        <CreateOrEditMedidaDaxModal
          isOpen={isEditMeasureModalOpen}
          onClose={() => {
            setIsEditMeasureModalOpen(false);
            setSelectedMeasure(null);
          }}
          modeloPowerBiId={modeloPowerBi.id}
          demandaId={demand.id}
          metricasHomologadas={modeloAnalitico?.metricas ?? []}
          medidaEmEdicao={selectedMeasure}
          onSuccess={carregarContexto}
        />
      )}

      {selectedMeasure && (
        <InspectMedidaDaxModal
          isOpen={isInspectMeasureModalOpen}
          onClose={() => {
            setIsInspectMeasureModalOpen(false);
            setSelectedMeasure(null);
          }}
          medida={selectedMeasure}
          modeloPowerBiNome={modeloPowerBi?.nome_arquivo ?? 'Modelo Power BI'}
          metricaHomologada={
            modeloAnalitico?.metricas?.find(
              (m) => m.id === selectedMeasure.metrica_analitica_id
            ) ?? null
          }
          modeloAnaliticoNome={modeloAnalitico?.nome}
          datasetNome={modeloAnalitico?.dataset_autorizado_id}
        />
      )}

      {selectedMeasure && (
        <DeleteMedidaDaxModal
          isOpen={isDeleteMeasureModalOpen}
          onClose={() => {
            setIsDeleteMeasureModalOpen(false);
            setSelectedMeasure(null);
          }}
          medida={selectedMeasure}
          demandaId={demand.id}
          hasLinhagem={Boolean(selectedMeasure.metrica_analitica_id)}
          onSuccess={carregarContexto}
        />
      )}

      {/* 6. Modais de Gestão de Páginas e Visuais (Subgate 3.4D) */}
      {modeloPowerBi && (
        <CreateOrEditPaginaModal
          isOpen={isCreatePageModalOpen}
          onClose={() => setIsCreatePageModalOpen(false)}
          modeloPowerBiId={modeloPowerBi.id}
          demandaId={demand.id}
          proximaOrdem={paginas.length + 1}
          onSuccess={carregarContexto}
        />
      )}

      {paginas.length > 0 && (
        <CreateOrEditVisualModal
          isOpen={isCreateVisualModalOpen}
          onClose={() => {
            setIsCreateVisualModalOpen(false);
            setPaginaPreSelecionadaIdParaVisual(null);
          }}
          demandaId={demand.id}
          paginas={paginas}
          medidas={medidas}
          paginaPreSelecionadaId={paginaPreSelecionadaIdParaVisual}
          onSuccess={carregarContexto}
        />
      )}
    </div>
  );
}
