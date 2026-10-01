'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Lock,
  RotateCcw,
} from 'lucide-react';
import { DemandaComProjeto } from '@/core/domain/entities/demanda';
import { RequisitoDemanda } from '@/core/domain/entities/requisito-demanda';
import { PerguntaClarificacao } from '@/core/domain/entities/pergunta-clarificacao';
import { ProntidaoRequisitosOutput } from '@/core/use-cases/requirements/avaliar-prontidao-requisitos.use-case';
import { DiagnosticoRequisitosCopiloto } from '@/core/domain/requirements-copilot';
import {
  EstadoDemanda,
  isEstadoTerminal,
  normalizarEstadoDemanda,
} from '@/core/domain/enums/estado-demanda';

import {
  listarRequisitosAction,
  listarPerguntasClarificacaoAction,
  avaliarProntidaoRequisitosAction,
  obterDiagnosticoCopilotoRequisitosAction,
} from '@/app/actions/requirements-actions';

import { BriefingSummarySection } from '@/components/requirements/BriefingSummarySection';
import { RequirementsList } from '@/components/requirements/RequirementsList';
import { ClarificationQuestionsList } from '@/components/requirements/ClarificationQuestionsList';
import { RequirementsCopilotPanel } from '@/components/requirements/RequirementsCopilotPanel';
import { HomologateRequirementsModal } from '@/components/requirements/HomologateRequirementsModal';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

interface TabRequirementsProps {
  demand: DemandaComProjeto;
}

export function TabRequirements({ demand }: TabRequirementsProps) {
  const router = useRouter();

  const [requisitos, setRequisitos] = useState<RequisitoDemanda[]>([]);
  const [perguntas, setPerguntas] = useState<PerguntaClarificacao[]>([]);
  const [prontidao, setProntidao] = useState<ProntidaoRequisitosOutput | null>(null);
  const [diagnostico, setDiagnostico] = useState<DiagnosticoRequisitosCopiloto | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isHomologateModalOpen, setIsHomologateModalOpen] = useState(false);

  // Governança de Workflow Read-Only
  const estadoAtual = normalizarEstadoDemanda(demand.estado);
  const isSuspensa = estadoAtual === EstadoDemanda.SUSPENSA;
  const isConcluida = estadoAtual === EstadoDemanda.CONCLUIDA;
  const isCancelada = estadoAtual === EstadoDemanda.CANCELADA;
  const isTerminal = isEstadoTerminal(estadoAtual);
  const isReadOnly = isSuspensa || isTerminal;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [reqRes, perRes, pronRes, diagRes] = await Promise.all([
        listarRequisitosAction(demand.id),
        listarPerguntasClarificacaoAction(demand.id),
        avaliarProntidaoRequisitosAction(demand.id),
        obterDiagnosticoCopilotoRequisitosAction(demand.id),
      ]);

      if (reqRes.success && reqRes.data) setRequisitos(reqRes.data);
      if (perRes.success && perRes.data) setPerguntas(perRes.data);
      if (pronRes.success && pronRes.data) setProntidao(pronRes.data);
      if (diagRes.success && diagRes.data) setDiagnostico(diagRes.data);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Falha ao carregar dados da etapa de requisitos.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [demand.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    loadData();
    router.refresh();
  };

  const handleHomologationSuccess = (msg: string) => {
    setFeedback({ type: 'success', message: msg });
    handleRefresh();
    setTimeout(() => setFeedback(null), 5000);
  };

  const isHomologado = Boolean(demand.requisitos_homologados_em);

  return (
    <div className="space-y-6" data-testid="tab-requirements">
      {/* 1. Banner de Governança Read-Only quando Terminal ou Suspensa */}
      {isReadOnly && (
        <div
          data-testid="requirements-readonly-banner"
          className="rounded-lg border border-slate-700 bg-slate-900/90 p-4 text-xs text-slate-300 backdrop-blur flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <Lock className="h-4 w-4 text-amber-400 shrink-0" />
            <div>
              <span className="font-semibold text-slate-200">
                Visualização em Modo Somente Leitura ({demand.estado})
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isSuspensa
                  ? 'Esta demanda encontra-se SUSPENSA. Retome-a para realizar novas edições de requisitos ou perguntas.'
                  : `Esta demanda está ${demand.estado}. Os registros de requisitos e perguntas estão congelados para preservação de auditoria.`}
              </p>
            </div>
          </div>
          <Badge variant="neutral" className="text-[10px]">
            Imutável
          </Badge>
        </div>
      )}

      {/* 2. Banner de Feedback */}
      {feedback && (
        <div
          className={`rounded-lg border p-3 text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'border-emerald-800 bg-emerald-950/40 text-emerald-300'
              : 'border-rose-800 bg-rose-950/40 text-rose-300'
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
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* 3. Marco de Homologação de Prontidão (Persistido e Auditável) */}
      <Card className="p-4 bg-slate-900/60 border-slate-800" data-testid="homologation-status-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`rounded-lg p-2 shrink-0 ${
                isHomologado
                  ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-400'
                  : prontidao?.bloqueado
                  ? 'bg-rose-950/80 border border-rose-800 text-rose-400'
                  : 'bg-amber-950/80 border border-amber-800 text-amber-400'
              }`}
            >
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                  Homologação Humana de Prontidão (Gate 1B)
                </span>
                {isHomologado ? (
                  <Badge variant="success" className="text-[10px]" testId="badge-homologado">
                    Homologado
                  </Badge>
                ) : (
                  <Badge variant="warning" className="text-[10px]" testId="badge-pendente">
                    Pendente
                  </Badge>
                )}
              </div>

              {isHomologado ? (
                <div className="text-xs text-slate-300 space-y-0.5">
                  <p>
                    Homologado por <strong className="text-slate-100">{demand.requisitos_homologados_por || 'Analista'}</strong> em{' '}
                    <span className="text-slate-200">
                      {demand.requisitos_homologados_em
                        ? new Date(demand.requisitos_homologados_em).toLocaleString('pt-BR')
                        : ''}
                    </span>
                  </p>
                  {demand.requisitos_justificativa_homologacao && (
                    <p className="text-slate-400 text-[11px]">
                      <strong>Parecer:</strong> {demand.requisitos_justificativa_homologacao}
                    </p>
                  )}
                  {demand.requisitos_ressalvas && (
                    <p className="text-amber-400/90 text-[11px]">
                      <strong>Ressalvas acordadas:</strong> {demand.requisitos_ressalvas}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  {prontidao?.bloqueado
                    ? 'Existem pendências bloqueantes a serem resolvidas antes da homologação.'
                    : 'Levantamento pronto para homologação formal pelo analista.'}
                </p>
              )}
            </div>
          </div>

          {!isReadOnly && (
            <button
              type="button"
              onClick={() => setIsHomologateModalOpen(true)}
              data-testid="btn-open-homologate-modal"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shrink-0 ${
                isHomologado
                  ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
                  : prontidao?.bloqueado
                  ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed opacity-60'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
              }`}
            >
              {isHomologado ? (
                <>
                  <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
                  <span>Revisar Homologação</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Homologar Levantamento</span>
                </>
              )}
            </button>
          )}
        </div>
      </Card>

      {isLoading ? (
        <Card className="p-12 text-center bg-slate-900/40">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-3" />
          <p className="text-xs text-slate-400">Carregando etapa de requisitos...</p>
        </Card>
      ) : (
        <>
          {/* 4. Briefing Analítico Estruturado */}
          <BriefingSummarySection
            demand={demand}
            isReadOnly={isReadOnly}
            onUpdated={handleRefresh}
          />

          {/* 5. Lista de Requisitos Analíticos */}
          <RequirementsList
            demandaId={demand.id}
            requisitos={requisitos}
            isReadOnly={isReadOnly}
            onRefresh={handleRefresh}
          />

          {/* 6. Perguntas de Clarificação com Contratante */}
          <ClarificationQuestionsList
            demandaId={demand.id}
            demandaTitulo={demand.titulo}
            perguntas={perguntas}
            isReadOnly={isReadOnly}
            onRefresh={handleRefresh}
          />

          {/* 7. Copiloto Consultivo de Requisitos */}
          <RequirementsCopilotPanel
            demandaId={demand.id}
            diagnostico={diagnostico}
            prontidao={prontidao}
            isReadOnly={isReadOnly}
            onQuestionAdded={handleRefresh}
          />
        </>
      )}

      {/* Modal de Homologação */}
      <HomologateRequirementsModal
        isOpen={isHomologateModalOpen}
        onClose={() => setIsHomologateModalOpen(false)}
        demandaId={demand.id}
        prontidao={prontidao}
        onSuccess={handleHomologationSuccess}
      />
    </div>
  );
}
