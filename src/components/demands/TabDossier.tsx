'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DemandaComProjeto } from '@/core/domain/entities/demanda';
import { EstudoCasoPortfolio, isChecklistSanitizacaoCompleto } from '@/core/domain/entities/estudo-caso-portfolio';
import { AtivoAprendizado } from '@/core/domain/entities/ativo-aprendizado';
import { StatusEstudoCaso } from '@/core/domain/enums/status-estudo-caso';
import { EstadoDemanda, normalizarEstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { CompilarDossieVivoOutput } from '@/core/use-cases/dossier/compilar-dossie-vivo.use-case';
import { ExportarEstudoCasoPortfolioOutput } from '@/core/use-cases/portfolio/exportar-estudo-caso-portfolio.use-case';

import {
  compilarDossieVivoAction,
  obterEstudoCasoAction,
  gerarRascunhoEstudoCasoAction,
  atualizarEstudoCasoAction,
  homologarEstudoCasoAction,
  exportarEstudoCasoAction,
  curarAtivoAprendizadoAction,
  listarAtivosAprendizadoAction,
} from '@/app/actions/dossier-portfolio-actions';

import { DossierViewer } from '@/components/dossier-portfolio/DossierViewer';
import { PortfolioCaseEditor } from '@/components/dossier-portfolio/PortfolioCaseEditor';
import { HomologateAprov10Modal } from '@/components/dossier-portfolio/HomologateAprov10Modal';
import { ExportCaseModal } from '@/components/dossier-portfolio/ExportCaseModal';
import { LearnedAssetsSection } from '@/components/dossier-portfolio/LearnedAssetsSection';

import {
  FileText,
  Briefcase,
  BookOpen,
  Award,
  Download,
  Save,
  Wand2,
  Lock,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

interface TabDossierProps {
  demand: DemandaComProjeto;
}

type SubTab = 'dossier' | 'case' | 'assets';

export function TabDossier({ demand }: TabDossierProps) {
  const router = useRouter();

  const [activeSubTab, setActiveSubTab] = useState<SubTab>('case');
  const [dossierData, setDossierData] = useState<CompilarDossieVivoOutput | null>(null);
  const [caseData, setCaseData] = useState<EstudoCasoPortfolio | null>(null);
  const [ativos, setAtivos] = useState<AtivoAprendizado[]>([]);

  const [isLoadingDossier, setIsLoadingDossier] = useState(false);
  const [isLoadingCase, setIsLoadingCase] = useState(false);
  const [isLoadingAtivos, setIsLoadingAtivos] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modais
  const [isHomologateModalOpen, setIsHomologateModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportData, setExportData] = useState<ExportarEstudoCasoPortfolioOutput | null>(null);

  // Governança de Workflow
  const estadoAtual = normalizarEstadoDemanda(demand.estado);
  const isSuspensa = estadoAtual === EstadoDemanda.SUSPENSA;
  const isCancelada = estadoAtual === EstadoDemanda.CANCELADA;

  // Salvaguarda 3: SUSPENSA e CANCELADA bloqueiam mutações do Portfólio & Aprendizados
  // Salvaguarda 4: CONCLUIDA é permitida para elaboração, revisão e APROV-10
  const isMutationsBlocked = isSuspensa || isCancelada;

  // Carregamento de Dados
  const carregarDossie = useCallback(async () => {
    setIsLoadingDossier(true);
    try {
      const res = await compilarDossieVivoAction(demand.id);
      if (res.success && res.data) {
        setDossierData(res.data);
      }
    } catch {
      setFeedback({ type: 'error', message: 'Erro ao compilar o Dossiê Técnico Vivo.' });
    } finally {
      setIsLoadingDossier(false);
    }
  }, [demand.id]);

  const carregarCase = useCallback(async () => {
    setIsLoadingCase(true);
    try {
      const res = await obterEstudoCasoAction(demand.id);
      if (res.success) {
        setCaseData(res.data);
      }
    } catch {
      setFeedback({ type: 'error', message: 'Erro ao buscar o Estudo de Caso de Portfólio.' });
    } finally {
      setIsLoadingCase(false);
    }
  }, [demand.id]);

  const carregarAtivos = useCallback(async () => {
    setIsLoadingAtivos(true);
    try {
      const res = await listarAtivosAprendizadoAction(demand.id);
      if (res.success && res.data) {
        setAtivos(res.data);
      }
    } catch {
      setFeedback({ type: 'error', message: 'Erro ao listar ativos de aprendizado.' });
    } finally {
      setIsLoadingAtivos(false);
    }
  }, [demand.id]);

  useEffect(() => {
    carregarDossie();
    carregarCase();
    carregarAtivos();
  }, [carregarDossie, carregarCase, carregarAtivos]);

  // Ações do Estudo de Caso
  const handleGerarRascunho = async () => {
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await gerarRascunhoEstudoCasoAction(demand.id);
      if (!res.success) {
        throw new Error(res.error);
      }
      setCaseData(res.data);
      setFeedback({
        type: 'success',
        message: 'Rascunho determinístico STAR gerado com sucesso a partir dos fatos da demanda.',
      });
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Falha ao gerar rascunho de estudo de caso.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSalvarEdicoes = async () => {
    if (!caseData) return;
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await atualizarEstudoCasoAction({
        caseId: caseData.id,
        titulo: caseData.titulo,
        problema_negocio: caseData.problema_negocio,
        processo_preparacao: caseData.processo_preparacao,
        modelagem_decisoes: caseData.modelagem_decisoes,
        validacao_resultados: caseData.validacao_resultados,
        competencias_demonstradas: caseData.competencias_demonstradas,
        ferramentas_utilizadas: caseData.ferramentas_utilizadas,
        metricas_fatos: caseData.metricas_fatos,
        tecnicas_sanitizacao: caseData.tecnicas_sanitizacao,
        checklist_sanitizacao: caseData.checklist_sanitizacao,
      });

      if (!res.success) {
        throw new Error(res.error);
      }

      setCaseData(res.data);
      const isNowRascunho = res.data.status === StatusEstudoCaso.RASCUNHO;
      setFeedback({
        type: 'success',
        message: isNowRascunho
          ? 'Alterações salvas com sucesso. Status do case está em RASCUNHO (requer APROV-10 para exportação).'
          : 'Alterações salvas com sucesso.',
      });
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Falha ao salvar estudo de caso.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHomologarAprov10 = async (autor: string, justificativa?: string) => {
    if (!caseData) return;
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await homologarEstudoCasoAction({
        caseId: caseData.id,
        autor,
        justificativa,
      });

      if (!res.success) {
        throw new Error(res.error);
      }

      setCaseData(res.data);
      setFeedback({
        type: 'success',
        message: `Estudo de caso homologado com sucesso via APROV-10 por ${autor}. Exportação pública liberada.`,
      });
      router.refresh();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Falha ao homologar via APROV-10.',
      });
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportarCase = async () => {
    if (!caseData) return;
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await exportarEstudoCasoAction(caseData.id);
      if (!res.success) {
        throw new Error(res.error);
      }
      setExportData(res.data);
      setIsExportModalOpen(true);
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Falha ao exportar estudo de caso.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCurarAtivo = async (input: {
    titulo: string;
    categoria: any;
    descricao?: string;
    procedimento_padrao: string;
    contexto_aplicacao?: string;
    tags?: string[];
  }) => {
    const res = await curarAtivoAprendizadoAction({
      demandaId: demand.id,
      titulo: input.titulo,
      categoria: input.categoria,
      descricao: input.descricao,
      procedimento_padrao: input.procedimento_padrao,
      contexto_aplicacao: input.contexto_aplicacao,
      tags: input.tags ?? [],
    });

    if (!res.success) {
      throw new Error(res.error);
    }

    setAtivos((prev) => [res.data, ...prev]);
    setFeedback({
      type: 'success',
      message: `Ativo "${input.titulo}" curado e promovido para a Memória Operacional permanente com sucesso.`,
    });
  };

  // Status visual do Case
  const isHomologado = caseData?.status === StatusEstudoCaso.HOMOLOGADO_APROV_10;
  const isChecklistOk = caseData ? isChecklistSanitizacaoCompleto(caseData.checklist_sanitizacao) : false;

  return (
    <div className="space-y-6" data-testid="tab-dossier">
      {/* Banner de Feedback */}
      {feedback && (
        <div
          data-testid="dossier-feedback-alert"
          className={`p-3.5 rounded-lg border text-xs flex items-center justify-between transition-all ${
            feedback.type === 'success'
              ? 'border-emerald-800/70 bg-emerald-950/40 text-emerald-200'
              : 'border-rose-800/70 bg-rose-950/40 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white text-xs underline ml-4"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Alerta de Demanda Suspensa / Cancelada */}
      {isMutationsBlocked && (
        <div
          className="p-4 rounded-xl border border-amber-800/80 bg-amber-950/30 text-amber-200 text-xs flex items-start gap-3"
          data-testid="dossier-blocked-warning"
        >
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-white block">
              Modo Somente Leitura Ativo (Demanda {estadoAtual})
            </span>
            <p className="leading-relaxed text-amber-300/80">
              Demandas com status {estadoAtual} bloqueiam mutações, edições de estudo de caso e
              curadoria de aprendizados. O Dossiê Técnico Vivo permanece 100% consultável e exportável
              para auditoria.
            </p>
          </div>
        </div>
      )}

      {/* Sub-Tabs de Navegação Interna da Aba 11 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveSubTab('case')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'case'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            data-testid="subtab-case"
          >
            <Briefcase className="h-4 w-4" />
            <span>Estudo de Caso STAR</span>
            {caseData && (
              <span
                className={`ml-1 px-1.5 py-0.2 rounded text-[10px] ${
                  isHomologado
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}
              >
                {isHomologado ? 'APROV-10' : 'Rascunho'}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('dossier')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'dossier'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            data-testid="subtab-dossier"
          >
            <FileText className="h-4 w-4" />
            <span>Dossiê Técnico Vivo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('assets')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'assets'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            data-testid="subtab-assets"
          >
            <BookOpen className="h-4 w-4" />
            <span>Ativos de Aprendizado</span>
            <span className="ml-1 px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-300">
              {ativos.length}
            </span>
          </button>
        </div>

        {/* Informações da Demanda */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Demanda: <strong className="text-slate-200">{demand.titulo}</strong></span>
        </div>
      </div>

      {/* Conteúdo da Sub-Tab 1: Dossiê Técnico Vivo */}
      {activeSubTab === 'dossier' && (
        <DossierViewer
          dossierData={dossierData}
          isLoading={isLoadingDossier}
          onRefresh={carregarDossie}
        />
      )}

      {/* Conteúdo da Sub-Tab 2: Estudo de Caso de Portfólio STAR */}
      {activeSubTab === 'case' && (
        <div className="space-y-6" data-testid="portfolio-case-section">
          {/* Header de Estado Inequívoco do Case */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border bg-slate-900 shadow-md border-slate-800">
            <div className="flex items-start gap-3">
              {isHomologado ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-400 shrink-0">
                  <ShieldCheck className="h-5 w-5" />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-950/80 border border-amber-800 text-amber-400 shrink-0">
                  <ShieldAlert className="h-5 w-5" />
                </div>
              )}

              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className={`px-3 py-1 text-xs font-bold rounded-full border uppercase tracking-wider ${
                      isHomologado
                        ? 'bg-emerald-950/90 border-emerald-700 text-emerald-300'
                        : 'bg-amber-950/90 border-amber-700 text-amber-300'
                    }`}
                    data-testid="case-status-badge"
                  >
                    {isHomologado ? `HOMOLOGADO (APROV-10) — v${caseData?.versao}` : `RASCUNHO — v${caseData?.versao || 1}`}
                  </span>

                  {isHomologado && caseData?.homologado_por && (
                    <span className="text-xs text-slate-300" data-testid="case-homologado-info">
                      Homologado por: <strong>{caseData.homologado_por}</strong> em{' '}
                      {new Date(caseData.homologado_em || '').toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed max-w-2xl">
                  {isHomologado
                    ? 'Estudo de caso formalmente homologado pelo analista humano. Qualquer alteração de conteúdo material invalidará deterministicamente esta homologação e reverterá o status para RASCUNHO.'
                    : 'Estudo de caso em fase de elaboração e revisão. A exportação pública permanece bloqueada até homologação soberana APROV-10.'}
                </p>
              </div>
            </div>

            {/* Ações do Case */}
            <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center shrink-0">
              {(!caseData || caseData.status === StatusEstudoCaso.RASCUNHO) && (
                <button
                  type="button"
                  onClick={handleGerarRascunho}
                  disabled={isSubmitting || isMutationsBlocked}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-50"
                  data-testid="btn-generate-draft"
                >
                  <Wand2 className="h-3.5 w-3.5 text-blue-400" />
                  <span>{caseData ? 'Regenerar STAR' : 'Gerar Rascunho STAR'}</span>
                </button>
              )}

              {caseData && (
                <>
                  <button
                    type="button"
                    onClick={handleSalvarEdicoes}
                    disabled={isSubmitting || isMutationsBlocked}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-700 bg-slate-800 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-50"
                    data-testid="btn-save-case"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>Salvar Alterações</span>
                  </button>

                  {!isHomologado && (
                    <button
                      type="button"
                      onClick={() => setIsHomologateModalOpen(true)}
                      disabled={!isChecklistOk || isSubmitting || isMutationsBlocked}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={!isChecklistOk ? 'Complete 100% do checklist de sanitização para habilitar' : ''}
                      data-testid="btn-open-aprov10-modal"
                    >
                      <Award className="h-3.5 w-3.5" />
                      <span>Homologar APROV-10</span>
                    </button>
                  )}

                  {/* Botão de Exportação Pública */}
                  <button
                    type="button"
                    onClick={handleExportarCase}
                    disabled={!isHomologado || isSubmitting}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isHomologado
                        ? 'bg-blue-600 hover:bg-blue-500 text-white'
                        : 'bg-slate-800 text-slate-500 border border-slate-800 cursor-not-allowed'
                    }`}
                    title={
                      !isHomologado
                        ? 'Exportação bloqueada: Requer homologação formal APROV-10 prévia'
                        : 'Exportar estudo de caso homologado'
                    }
                    data-testid="btn-export-case"
                  >
                    {isHomologado ? <Download className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                    <span>Exportar Estudo de Caso</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Visualizador / Editor do Case */}
          {isLoadingCase ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              Carregando dados do estudo de caso...
            </div>
          ) : caseData ? (
            <PortfolioCaseEditor
              caseData={caseData}
              disabled={isMutationsBlocked}
              onChange={(patch) => setCaseData((prev) => (prev ? { ...prev, ...patch } : null))}
            />
          ) : (
            <div className="p-12 text-center rounded-xl border border-slate-800 bg-slate-900/60 space-y-3">
              <Briefcase className="h-8 w-8 text-blue-400 mx-auto" />
              <h3 className="text-base font-semibold text-white">
                Nenhum Estudo de Caso Estruturado Ainda
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Clique no botão abaixo para gerar deterministicamente a versão candidata STAR
                a partir dos fatos, ativos de dados e métricas reais registrados nesta demanda.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleGerarRascunho}
                  disabled={isSubmitting || isMutationsBlocked}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors disabled:opacity-50"
                  data-testid="btn-generate-initial-case"
                >
                  <Wand2 className="h-4 w-4" />
                  <span>Gerar Versão Candidata STAR</span>
                </button>
              </div>
            </div>
          )}

          {/* Modal de Homologação Soberana APROV-10 */}
          {caseData && (
            <HomologateAprov10Modal
              isOpen={isHomologateModalOpen}
              onClose={() => setIsHomologateModalOpen(false)}
              onConfirm={handleHomologarAprov10}
              caseData={caseData}
              isSubmitting={isSubmitting}
            />
          )}

          {/* Modal de Exportação do Case Homologado */}
          <ExportCaseModal
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
            exportData={exportData}
          />
        </div>
      )}

      {/* Conteúdo da Sub-Tab 3: Ativos de Aprendizado & Memória Operacional */}
      {activeSubTab === 'assets' && (
        <LearnedAssetsSection
          ativos={ativos}
          disabled={isMutationsBlocked}
          onCurarAtivo={handleCurarAtivo}
          isLoading={isLoadingAtivos}
        />
      )}
    </div>
  );
}
