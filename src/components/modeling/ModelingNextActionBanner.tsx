'use client';

import React from 'react';
import {
  Sparkles,
  Info,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Plus,
  FileCheck2,
  Table,
  BarChart3,
  Calendar,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { ModeloAnaliticoCompleto } from '@/core/domain/entities/modelo-analitico';
import { DatasetAutorizadoAnalise } from '@/core/domain/entities/dataset-autorizado-analise';
import { ProntidaoModeloOutput } from '@/core/use-cases/modeling';
import { StatusModeloAnalitico } from '@/core/domain/enums/status-modelo-analitico';
import { TipoEntidadeAnalitica } from '@/core/domain/enums/tipo-entidade-analitica';

interface ModelingNextActionBannerProps {
  hasDatasetAutorizado: boolean;
  datasetAutorizado: DatasetAutorizadoAnalise | null;
  modelo: ModeloAnaliticoCompleto | null;
  prontidao: ProntidaoModeloOutput | null;
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

export function ModelingNextActionBanner({
  hasDatasetAutorizado,
  datasetAutorizado,
  modelo,
  prontidao,
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
  // Cenário 0: Sem Dataset Autorizado Vigente
  if (!hasDatasetAutorizado || !datasetAutorizado) {
    return (
      <div
        className="rounded-xl border border-amber-800/80 bg-amber-950/30 p-5 text-amber-200 space-y-2 shadow-sm"
        data-testid="modeling-banner-no-dataset"
      >
        <div className="flex items-center gap-2.5">
          <Info className="h-5 w-5 text-amber-400 shrink-0" />
          <h2 className="text-sm font-semibold text-white">Dataset Autorizado Ausente ou Não Vigente</h2>
        </div>
        <p className="text-xs text-amber-300/90 leading-relaxed">
          <strong>1. Estado Atual:</strong> A demanda ainda não possui um dataset autorizado e homologado na esteira de Preparação (Aba 5).<br />
          <strong>2. Bloqueio Formal:</strong> Pela regra de governança <em>M-01</em>, a modelagem analítica exige obrigatoriamente um dataset auditado e com autorização vigente.<br />
          <strong>3. Ação Recomendada:</strong> Acesse a <em>Aba 5 (Preparação)</em>, conclua a receita de transformação e autorize formalmente o dataset para análise.<br />
          <strong>4. Consequência:</strong> Nenhum modelo analítico pode ser homologado sem a ancoragem física e matemática em dados autorizados.<br />
          <strong>5. Validação:</strong> Assim que autorizado, o dataset fornecerá o snapshot SHA-256 e o schema base para derivar entidades e fatos.
        </p>
      </div>
    );
  }

  // Cenário 1: Sem Modelo Analítico Criado
  if (!modelo) {
    return (
      <div
        className="rounded-xl border border-blue-800/80 bg-blue-950/40 p-5 text-blue-200 space-y-3 shadow-sm"
        data-testid="modeling-banner-no-model"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-5 w-5 text-blue-400 shrink-0" />
            <div>
              <h2 className="text-sm font-semibold text-white">
                Próxima Ação: Criar Modelo Analítico
              </h2>
              <span className="text-[11px] text-blue-300/80">Copiloto Proativo Explicável — Estado Inicial</span>
            </div>
          </div>
          {!isReadOnly && (
            <button
              type="button"
              onClick={onOpenCreateModel}
              data-testid="btn-banner-create-model"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors shadow-sm shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Criar Modelo com Fato Inicial</span>
            </button>
          )}
        </div>
        <div className="rounded-lg bg-blue-900/30 p-3 text-xs text-blue-300 space-y-1.5 border border-blue-800/40">
          <p>
            <strong>Diagnóstico Automático:</strong> O Dataset Autorizado <em>&quot;{datasetAutorizado.versao_rotulo}&quot;</em> está vigente e íntegro, pronto para servir de base dimensional.
          </p>
          <p>
            <strong>Recomendação do Copiloto:</strong> Inicialize o modelo analítico. O sistema sugere a arquitetura <em>Estrela (Star Schema)</em> e derivará automaticamente a Entidade Fato inicial e seus atributos a partir do schema catalogado.
          </p>
        </div>
      </div>
    );
  }

  const fatos = modelo.entidades.filter((e) => e.tipo === TipoEntidadeAnalitica.FATO);
  const totalEntidades = modelo.entidades.length;
  const totalMetricas = modelo.metricas.length;
  const totalBloqueios = prontidao?.motivosBloqueio?.length ?? 0;
  const totalAlertas = prontidao?.alertasCriticosQueExigemJustificativa?.length ?? 0;
  const totalRecomendacoes = prontidao?.recomendacoes?.length ?? 0;
  const temAlteracaoPosterior = prontidao?.temAlteracaoPosteriorAHomologacao ?? false;
  const isHomologado = modelo.status === StatusModeloAnalitico.HOMOLOGADO;
  const isRevogado = modelo.status === StatusModeloAnalitico.REVOGADO;

  // Cenário 9: Homologação Revogada ou Invalidada por Alteração Posterior
  if (isRevogado || (isHomologado && temAlteracaoPosterior)) {
    return (
      <div
        className="rounded-xl border border-rose-800/80 bg-rose-950/40 p-5 text-rose-200 space-y-3 shadow-sm"
        data-testid="modeling-banner-invalidated"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
            <div>
              <h2 className="text-sm font-semibold text-white">
                {isRevogado
                  ? 'Homologação Revogada Formalmente'
                  : 'Homologação Invalidada por Alteração Material'}
              </h2>
              <span className="text-[11px] text-rose-300/80">Governança Determinística — Regra 3.6C</span>
            </div>
          </div>
          {!isReadOnly && prontidao?.prontoParaHomologacao && (
            <button
              type="button"
              onClick={onOpenHomologate}
              data-testid="btn-banner-rehomologate"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-rose-500 transition-colors shadow-sm shrink-0"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Re-homologar Modelo</span>
            </button>
          )}
        </div>
        <div className="rounded-lg bg-rose-900/30 p-3 text-xs text-rose-300 space-y-1.5 border border-rose-800/40">
          <p>
            <strong>Diagnóstico:</strong>{' '}
            {isRevogado
              ? `O modelo foi revogado formalmente em ${modelo.revogado_em ? new Date(modelo.revogado_em).toLocaleString('pt-BR') : ''}. Motivo: ${modelo.motivo_revogacao || 'Não declarado'}.`
              : 'Foram detectadas alterações em entidades, atributos, relacionamentos ou métricas posteriores à homologação anterior.'}
          </p>
          <p>
            <strong>Ação Necessária:</strong> Para que a demanda volte a estar apta ao avanço no Workflow, o modelo deve passar por nova avaliação de conformidade e ser re-homologado pelo analista responsável.
          </p>
        </div>
      </div>
    );
  }

  // Cenário 8: Modelo Homologado e Vigente
  if (isHomologado && prontidao?.homologacaoVigenteValida) {
    return (
      <div
        className="rounded-xl border border-emerald-800/80 bg-emerald-950/40 p-5 text-emerald-200 space-y-3 shadow-sm"
        data-testid="modeling-banner-homologated"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
            <div>
              <h2 className="text-sm font-semibold text-white">
                Modelo Analítico Homologado & Vigente
              </h2>
              <span className="text-[11px] text-emerald-300/80">
                Homologado por {modelo.homologado_por || 'HUMANO'} em{' '}
                {modelo.homologado_em ? new Date(modelo.homologado_em).toLocaleString('pt-BR') : ''}
              </span>
            </div>
          </div>
          {!isReadOnly && onAdvanceDemand && (
            <button
              type="button"
              onClick={onAdvanceDemand}
              data-testid="btn-banner-advance-workflow"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors shadow-sm shrink-0"
            >
              <span>Avançar Demanda para Validação</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="text-xs text-emerald-300/90 leading-relaxed">
          O modelo analítico atende a todos os critérios de conformidade determinística e governança. O WorkflowEngine autoriza expressamente o avanço para a etapa <strong>Em Validação</strong>.
        </p>
      </div>
    );
  }

  // Cenário 5: Bloqueios Ativos de Conformidade (M-01 a M-05)
  if (totalBloqueios > 0) {
    return (
      <div
        className="rounded-xl border border-red-800/80 bg-red-950/40 p-5 text-red-200 space-y-3 shadow-sm"
        data-testid="modeling-banner-blocked"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="h-5 w-5 text-red-400 shrink-0" />
            <div>
              <h2 className="text-sm font-semibold text-white">
                Atenção: {totalBloqueios} Bloqueio(s) de Conformidade Detectado(s)
              </h2>
              <span className="text-[11px] text-red-300/80">Homologação Bloqueada pela Governança</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onScrollToCompliance}
            data-testid="btn-banner-view-blocks"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-800/80 hover:bg-red-700/80 border border-red-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors shadow-sm shrink-0"
          >
            <span>Ver Diagnósticos de Bloqueio</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="rounded-lg bg-red-900/30 p-3 text-xs text-red-300 space-y-1 border border-red-800/40">
          <p className="font-semibold text-white">Principais pendências a corrigir:</p>
          <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-red-200">
            {prontidao?.motivosBloqueio?.slice(0, 3).map((motivo, idx) => (
              <li key={idx}>{motivo}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // Cenário 2: Sem Entidade Fato
  if (fatos.length === 0) {
    return (
      <div
        className="rounded-xl border border-amber-800/80 bg-amber-950/40 p-5 text-amber-200 space-y-3 shadow-sm"
        data-testid="modeling-banner-no-fact"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Table className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <h2 className="text-sm font-semibold text-white">
                Próxima Ação: Adicionar Entidade FATO
              </h2>
              <span className="text-[11px] text-amber-300/80">Regra M-05 — Modelagem Dimensional</span>
            </div>
          </div>
          {!isReadOnly && (
            <button
              type="button"
              onClick={onOpenAddEntity}
              data-testid="btn-banner-add-fact"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 px-3.5 py-2 text-xs font-semibold text-white transition-colors shadow-sm shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Adicionar Entidade Fato</span>
            </button>
          )}
        </div>
        <p className="text-xs text-amber-300/90 leading-relaxed">
          O modelo possui entidades conceituais mas nenhuma classificada como <strong>FATO</strong>. Toda análise tabular requer ao menos uma Fato para ancorar medições e transações.
        </p>
      </div>
    );
  }

  // Cenário 4: Sem Métricas Cadastradas
  if (totalMetricas === 0) {
    return (
      <div
        className="rounded-xl border border-blue-800/80 bg-blue-950/40 p-5 text-blue-200 space-y-3 shadow-sm"
        data-testid="modeling-banner-no-metrics"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <BarChart3 className="h-5 w-5 text-blue-400 shrink-0" />
            <div>
              <h2 className="text-sm font-semibold text-white">
                Próxima Ação: Cadastrar Métricas Analíticas
              </h2>
              <span className="text-[11px] text-blue-300/80">Regra M-05 — Indicadores Semânticos de Negócio</span>
            </div>
          </div>
          {!isReadOnly && (
            <button
              type="button"
              onClick={onOpenCreateMetric}
              data-testid="btn-banner-add-metric"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 px-3.5 py-2 text-xs font-semibold text-white transition-colors shadow-sm shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Cadastrar Primeira Métrica</span>
            </button>
          )}
        </div>
        <p className="text-xs text-blue-300/90 leading-relaxed">
          A estrutura de entidades está definida, mas o modelo ainda não possui nenhuma métrica cadastrada. Declare seus KPIs e indicadores com tipo de agregação e unidade de medida claros.
        </p>
      </div>
    );
  }

  // Cenário 6: Alertas Críticos Pendentes de Justificativa Humana (M-06 / M-07)
  if (totalAlertas > 0) {
    return (
      <div
        className="rounded-xl border border-orange-800/80 bg-orange-950/40 p-5 text-orange-200 space-y-3 shadow-sm"
        data-testid="modeling-banner-critical-alerts"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 text-orange-400 shrink-0" />
            <div>
              <h2 className="text-sm font-semibold text-white">
                Pronto para Homologação com {totalAlertas} Alerta(s) Crítico(s)
              </h2>
              <span className="text-[11px] text-orange-300/80">Exige Justificativa Técnica Formal</span>
            </div>
          </div>
          {!isReadOnly && (
            <button
              type="button"
              onClick={onOpenHomologate}
              data-testid="btn-banner-homologate-with-alerts"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 px-3.5 py-2 text-xs font-semibold text-white transition-colors shadow-sm shrink-0"
            >
              <FileCheck2 className="h-4 w-4" />
              <span>Homologar com Justificativa</span>
            </button>
          )}
        </div>
        <div className="rounded-lg bg-orange-900/30 p-3 text-xs text-orange-300 space-y-1 border border-orange-800/40">
          <p>
            <strong>Fatos Observados:</strong> Foram identificados relacionamentos com cardinalidade N:M (M-06) e/ou propagação de filtro BIDIRECIONAL (M-07).
          </p>
          <p>
            <strong>Requisito de Governança:</strong> Esses padrões não bloqueiam compulsoriamente a homologação, mas exigem justificativa técnica formal (mínimo 15 caracteres) para registro em trilha de auditoria.
          </p>
        </div>
      </div>
    );
  }

  // Cenário 7: Pronto para Homologação Limpo
  return (
    <div
      className="rounded-xl border border-emerald-800/80 bg-emerald-950/40 p-5 text-emerald-200 space-y-3 shadow-sm"
      data-testid="modeling-banner-ready"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <div>
            <h2 className="text-sm font-semibold text-white">
              Modelo Analítico Pronto para Homologação
            </h2>
            <span className="text-[11px] text-emerald-300/80">Conformidade 100% Validada — Zero Bloqueios</span>
          </div>
        </div>
        {!isReadOnly && (
          <button
            type="button"
            onClick={onOpenHomologate}
            data-testid="btn-banner-homologate"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-white transition-colors shadow-sm shrink-0"
          >
            <FileCheck2 className="h-4 w-4" />
            <span>Homologar Modelo Analítico</span>
          </button>
        )}
      </div>
      <p className="text-xs text-emerald-300/90 leading-relaxed">
        Todas as regras de integridade matemática e dimensional foram atendidas ({totalEntidades} entidade(s), {totalMetricas} métrica(s) e {totalRecomendacoes} recomendação(ões) sugerida(s)). Clique em Homologar para registrar a decisão humana e liberar o avanço da demanda no Workflow.
      </p>
    </div>
  );
}
