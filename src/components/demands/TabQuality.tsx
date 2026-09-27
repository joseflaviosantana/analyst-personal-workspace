'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Database,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  X,
  FileSpreadsheet,
  Layers,
  ArrowRight
} from 'lucide-react';
import { DemandaComProjeto } from '@/core/domain/entities/demanda';
import { AtivoDados } from '@/core/domain/entities/ativo-dados';
import { DiagnosticoQualidade } from '@/core/domain/entities/diagnostico-qualidade';
import { ProblemaQualidade } from '@/core/domain/entities/problema-qualidade';
import { RegraQualidade } from '@/core/domain/entities/regra-qualidade';
import { ResultadoQualityGate } from '@/core/domain/rules/quality-gate';
import {
  EstadoDemanda,
  isEstadoTerminal,
  normalizarEstadoDemanda
} from '@/core/domain/enums/estado-demanda';

import {
  runQualityDiagnosticAction,
  getAssetQualityDiagnosticAction,
  listQualityProblemsAction,
  evaluateQualityGateAction,
  listQualityRulesAction
} from '@/app/actions/quality-actions';
import { advanceDemandAction } from '@/app/actions/workflow-actions';

import { QualitySummaryHeader } from '@/components/quality/QualitySummaryHeader';
import { NextActionBanner } from '@/components/quality/NextActionBanner';
import { DiagnosticDetailsAccordion } from '@/components/quality/DiagnosticDetailsAccordion';
import { ProblemQueue } from '@/components/quality/ProblemQueue';
import { QualityRulesSection } from '@/components/quality/QualityRulesSection';
import { DeliberateProblemModal } from '@/components/quality/DeliberateProblemModal';
import { UpdateProblemStatusModal } from '@/components/quality/UpdateProblemStatusModal';
import { ManualProblemModal } from '@/components/quality/ManualProblemModal';
import { QualityRuleModal } from '@/components/quality/QualityRuleModal';

interface TabQualityProps {
  demand: DemandaComProjeto;
  initialAssets?: AtivoDados[];
}

export function TabQuality({ demand, initialAssets = [] }: TabQualityProps) {
  const router = useRouter();

  // Filtragem de ativos vigentes
  const ativosVigentes = initialAssets.filter((a) => a.status === 'ATIVO');
  const [selectedAsset, setSelectedAsset] = useState<AtivoDados | null>(
    ativosVigentes.length > 0 ? ativosVigentes[0] : null
  );

  // Estados dos Dados de Qualidade
  const [diagnostico, setDiagnostico] = useState<DiagnosticoQualidade | null>(null);
  const [historicoDiagnosticos, setHistoricoDiagnosticos] = useState<DiagnosticoQualidade[]>([]);
  const [problemas, setProblemas] = useState<ProblemaQualidade[]>([]);
  const [regras, setRegras] = useState<RegraQualidade[]>([]);
  const [qualityGate, setQualityGate] = useState<ResultadoQualityGate | null>(null);

  // Estados de Carregamento e Feedback
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modais de Interação
  const [deliberateModalOpen, setDeliberateModalOpen] = useState(false);
  const [selectedProblemForDeliberate, setSelectedProblemForDeliberate] = useState<ProblemaQualidade | null>(null);

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedProblemForStatus, setSelectedProblemForStatus] = useState<ProblemaQualidade | null>(null);

  const [manualProblemModalOpen, setManualProblemModalOpen] = useState(false);

  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [selectedRuleForEdit, setSelectedRuleForEdit] = useState<RegraQualidade | null>(null);

  // Governança de Workflow
  const estadoAtual = normalizarEstadoDemanda(demand.estado);
  const isSuspensa = estadoAtual === EstadoDemanda.SUSPENSA;
  const isConcluida = estadoAtual === EstadoDemanda.CONCLUIDA;
  const isCancelada = estadoAtual === EstadoDemanda.CANCELADA;
  const isTerminal = isEstadoTerminal(estadoAtual);
  const isReadOnly = isSuspensa || isTerminal;

  // Carregar dados de qualidade do ativo selecionado
  const loadAssetQualityData = useCallback(async (assetId: string) => {
    setIsLoading(true);
    try {
      const [diagRes, probRes, gateRes, regrasRes] = await Promise.all([
        getAssetQualityDiagnosticAction(assetId),
        listQualityProblemsAction({ ativoDadosId: assetId }),
        evaluateQualityGateAction({ demandaId: demand.id, ativoDadosId: assetId }),
        listQualityRulesAction({ ativoDadosId: assetId }),
      ]);

      if (diagRes.success && diagRes.data) {
        setDiagnostico(diagRes.data.diagnostico);
        setHistoricoDiagnosticos(diagRes.data.historicoDiagnosticos || []);
      } else {
        setDiagnostico(null);
        setHistoricoDiagnosticos([]);
      }

      if (probRes.success && probRes.data) {
        setProblemas(probRes.data);
      } else {
        setProblemas([]);
      }

      if (gateRes.success && gateRes.data) {
        setQualityGate(gateRes.data);
      } else {
        setQualityGate(null);
      }

      if (regrasRes.success && regrasRes.data) {
        setRegras(regrasRes.data);
      } else {
        setRegras([]);
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Falha ao carregar métricas de qualidade do ativo.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [demand.id]);

  useEffect(() => {
    if (selectedAsset) {
      loadAssetQualityData(selectedAsset.id);
    } else {
      setIsLoading(false);
    }
  }, [selectedAsset, loadAssetQualityData]);

  // Disparo do Diagnóstico Determinístico
  const handleRunDiagnostic = async () => {
    if (!selectedAsset || isReadOnly || isExecuting) return;
    setIsExecuting(true);
    setFeedback(null);

    try {
      const res = await runQualityDiagnosticAction({
        ativoDadosId: selectedAsset.id,
        demandaId: demand.id,
      });

      if (!res.success) {
        setFeedback({
          type: 'error',
          message: res.error || 'Falha na execução do diagnóstico de qualidade.',
        });
      } else {
        setFeedback({
          type: 'success',
          message: `Diagnóstico executado com sucesso! ${res.data.diagnostico.total_problemas_detectados} anomalia(s) identificada(s).`,
        });
        await loadAssetQualityData(selectedAsset.id);
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Erro inesperado durante a execução do diagnóstico.',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // Sucesso de Deliberação Humana
  const handleDeliberateSuccess = async (updated: ProblemaQualidade) => {
    setFeedback({
      type: 'success',
      message: `Deliberação registrada com sucesso para "${updated.titulo}".`,
    });
    if (selectedAsset) {
      await loadAssetQualityData(selectedAsset.id);
    }
  };

  // Sucesso de Atualização de Status
  const handleStatusUpdateSuccess = async (updated: ProblemaQualidade) => {
    setFeedback({
      type: 'success',
      message: `Status do problema atualizado com sucesso.`,
    });
    if (selectedAsset) {
      await loadAssetQualityData(selectedAsset.id);
    }
  };

  // Sucesso de Cadastro Manual
  const handleManualProblemSuccess = async (newProb: ProblemaQualidade) => {
    setFeedback({
      type: 'success',
      message: `Anomalia manual "${newProb.titulo}" registrada com sucesso. Ela aguarda sua deliberação formal.`,
    });
    if (selectedAsset) {
      await loadAssetQualityData(selectedAsset.id);
    }
  };

  // Sucesso de Regras de Negócio
  const handleRuleSaved = async (rule: RegraQualidade) => {
    setFeedback({
      type: 'success',
      message: `Regra de negócio "${rule.nome}" salva com sucesso! Reexecute o diagnóstico para avaliar o ativo com as novas regras.`,
    });
    if (selectedAsset) {
      await loadAssetQualityData(selectedAsset.id);
    }
  };

  const handleRuleToggled = async (updated: RegraQualidade) => {
    setFeedback({
      type: 'success',
      message: `Regra "${updated.nome}" ${updated.status === 'ATIVA' ? 'ativada' : 'desativada'} com sucesso. Reexecute o diagnóstico para atualizar a avaliação.`,
    });
    if (selectedAsset) {
      await loadAssetQualityData(selectedAsset.id);
    }
  };

  // Avançar Demanda via Quality Gate
  const handleAdvanceDemand = async () => {
    if (isReadOnly) return;
    setFeedback(null);
    try {
      const res = await advanceDemandAction(demand.id);
      if (!res.success) {
        setFeedback({
          type: 'error',
          message: res.error || 'Não foi possível avançar a demanda.',
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

  // Scroll suave até a fila de problemas
  const scrollToProblems = () => {
    const el = document.getElementById('quality-problem-queue-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6" data-testid="tab-quality-container">
      {/* Banner de Governança Read-Only quando aplicável */}
      {isReadOnly && (
        <div
          className="flex items-center gap-2.5 rounded-lg border border-amber-800/80 bg-amber-950/40 p-3.5 text-xs text-amber-300"
          data-testid="quality-banner-readonly-governance"
        >
          <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400" />
          <span>
            {isSuspensa && 'Demanda Suspensa: A avaliação de qualidade e as deliberações estão desabilitadas enquanto a demanda estiver pausada.'}
            {isConcluida && 'Demanda Concluída: O dossiê de qualidade está congelado para auditoria e histórico de entregáveis.'}
            {isCancelada && 'Demanda Cancelada: As anomalias e regras estão arquivadas em modo estritamente somente-leitura.'}
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
          data-testid="quality-feedback-alert"
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

      {/* [Bloco A] Cabeçalho e Resumo Executivo da Qualidade */}
      <QualitySummaryHeader
        assets={ativosVigentes}
        selectedAsset={selectedAsset}
        onSelectAsset={(asset) => setSelectedAsset(asset)}
        qualityGate={qualityGate}
        diagnostico={diagnostico}
        problemas={problemas}
        isExecuting={isExecuting}
        onRunDiagnostic={handleRunDiagnostic}
        isReadOnly={isReadOnly}
      />

      {/* [Bloco B] Banner de Próxima Ação Didática */}
      <NextActionBanner
        hasAssets={ativosVigentes.length > 0}
        hasDiagnostic={!!diagnostico}
        isExecuting={isExecuting}
        qualityGate={qualityGate}
        problemas={problemas}
        onRunDiagnostic={handleRunDiagnostic}
        onScrollToProblems={scrollToProblems}
        onAdvanceDemand={handleAdvanceDemand}
        isReadOnly={isReadOnly}
      />

      {/* [Bloco C] Detalhes do Diagnóstico e Verificações V1–V7 (Accordion) */}
      <DiagnosticDetailsAccordion
        diagnostico={diagnostico}
        historico={historicoDiagnosticos}
      />

      {/* [Bloco G] Painel de Regras Humanas R1–R5 */}
      {selectedAsset && (
        <QualityRulesSection
          rules={regras}
          demandaId={demand.id}
          onOpenCreateRule={() => {
            setSelectedRuleForEdit(null);
            setRuleModalOpen(true);
          }}
          onEditRule={(rule) => {
            setSelectedRuleForEdit(rule);
            setRuleModalOpen(true);
          }}
          onRuleToggled={handleRuleToggled}
          isReadOnly={isReadOnly}
        />
      )}

      {/* [Bloco D e E] Fila de Problemas Orientada à Decisão */}
      <div id="quality-problem-queue-section">
        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin mr-2 text-blue-400" />
            <span className="text-xs">Carregando anomalias e governança de qualidade...</span>
          </div>
        ) : (
          <ProblemQueue
            problems={problemas}
            onDeliberate={(prob) => {
              setSelectedProblemForDeliberate(prob);
              setDeliberateModalOpen(true);
            }}
            onUpdateStatus={(prob) => {
              setSelectedProblemForStatus(prob);
              setStatusModalOpen(true);
            }}
            onOpenManualModal={() => setManualProblemModalOpen(true)}
            isReadOnly={isReadOnly}
          />
        )}
      </div>

      {/* Modais de Governança */}
      <DeliberateProblemModal
        isOpen={deliberateModalOpen}
        onClose={() => {
          setDeliberateModalOpen(false);
          setSelectedProblemForDeliberate(null);
        }}
        problem={selectedProblemForDeliberate}
        demandaId={demand.id}
        onSuccess={handleDeliberateSuccess}
      />

      <UpdateProblemStatusModal
        isOpen={statusModalOpen}
        onClose={() => {
          setStatusModalOpen(false);
          setSelectedProblemForStatus(null);
        }}
        problem={selectedProblemForStatus}
        demandaId={demand.id}
        onSuccess={handleStatusUpdateSuccess}
      />

      <ManualProblemModal
        isOpen={manualProblemModalOpen}
        onClose={() => setManualProblemModalOpen(false)}
        asset={selectedAsset}
        demandaId={demand.id}
        diagnosticoId={diagnostico?.id || null}
        onSuccess={handleManualProblemSuccess}
      />

      <QualityRuleModal
        isOpen={ruleModalOpen}
        onClose={() => {
          setRuleModalOpen(false);
          setSelectedRuleForEdit(null);
        }}
        asset={selectedAsset}
        demandaId={demand.id}
        ruleToEdit={selectedRuleForEdit}
        onSuccess={handleRuleSaved}
      />
    </div>
  );
}
