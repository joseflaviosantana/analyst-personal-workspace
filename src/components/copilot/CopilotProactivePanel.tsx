'use client';

import React, { useState } from 'react';
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
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { OrientacaoCopilotoOutput } from '@/core/use-cases/copilot';
import { CopilotConceptCard } from './CopilotConceptCard';

export interface CopilotProactivePanelProps {
  orientacao: OrientacaoCopilotoOutput;
  isReadOnly?: boolean;
  onOpenCreateModel?: () => void;
  onOpenAddEntity?: () => void;
  onOpenCreateMetric?: () => void;
  onOpenSpecifyCalendar?: () => void;
  onOpenHomologate?: () => void;
  onScrollToCompliance?: () => void;
  onScrollToEntities?: () => void;
  onScrollToMetrics?: () => void;
  onAdvanceDemand?: () => void;
}

export function CopilotProactivePanel({
  orientacao,
  isReadOnly = false,
  onOpenCreateModel,
  onOpenAddEntity,
  onOpenCreateMetric,
  onOpenHomologate,
  onScrollToCompliance,
  onAdvanceDemand,
}: CopilotProactivePanelProps) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const {
    cenario,
    prioridade,
    temBloqueio,
    temAlertaCritico,
    prontoParaAvanco,
    acaoRecomendada,
    nivel1,
    nivel2,
    nivel3,
    perguntasChave,
  } = orientacao;

  // Mapeamento conservador de data-testid para preservar integralmente a suíte de testes E2E existente
  const containerTestIdPorCenario: Record<string, string> = {
    SEM_DATASET_VIGENTE: 'modeling-banner-no-dataset',
    SEM_MODELO_CRIADO: 'modeling-banner-no-model',
    HOMOLOGACAO_REVOGADA: 'modeling-banner-invalidated',
    HOMOLOGACAO_INVALIDADA: 'modeling-banner-invalidated',
    HOMOLOGADO_E_VIGENTE: 'modeling-banner-homologated',
    BLOQUEIO_CONFORMIDADE: 'modeling-banner-blocked',
    SEM_ENTIDADE_FATO: 'modeling-banner-no-fact',
    SEM_METRICAS_CADASTRADAS: 'modeling-banner-no-metrics',
    ALERTA_CRITICO_PENDENTE: 'modeling-banner-critical-alerts',
    PRONTO_PARA_HOMOLOGACAO: 'modeling-banner-ready',
  };

  const containerTestId = containerTestIdPorCenario[cenario] || 'copilot-proactive-panel';

  // Cores de contêiner temáticas sóbrias de acordo com a severidade
  const getContainerStyles = () => {
    if (temBloqueio) {
      return 'border-red-900/60 bg-red-950/20 text-red-200';
    }
    if (temAlertaCritico || prioridade === 'ACAO_NECESSARIA') {
      return 'border-amber-900/60 bg-amber-950/20 text-amber-200';
    }
    if (cenario === 'HOMOLOGADO_E_VIGENTE' || cenario === 'PRONTO_PARA_HOMOLOGACAO') {
      return 'border-emerald-900/60 bg-emerald-950/20 text-emerald-200';
    }
    return 'border-blue-900/60 bg-blue-950/25 text-blue-200';
  };

  // Renderizador governado da ação recomendada sem mutações automáticas
  const renderActionButton = () => {
    if (isReadOnly) return null;

    switch (cenario) {
      case 'SEM_MODELO_CRIADO':
        return onOpenCreateModel ? (
          <button
            type="button"
            onClick={onOpenCreateModel}
            data-testid="btn-banner-create-model"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors shadow-sm shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Criar Modelo com Fato Inicial</span>
          </button>
        ) : null;

      case 'HOMOLOGACAO_REVOGADA':
      case 'HOMOLOGACAO_INVALIDADA':
        return onOpenHomologate && prontoParaAvanco ? (
          <button
            type="button"
            onClick={onOpenHomologate}
            data-testid="btn-banner-rehomologate"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-rose-500 transition-colors shadow-sm shrink-0"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Re-homologar Modelo</span>
          </button>
        ) : null;

      case 'HOMOLOGADO_E_VIGENTE':
        if (orientacao.hierarquia?.proximoPasso && !orientacao.hierarquia.proximoPasso.podeExecutar) {
          return null;
        }
        return onAdvanceDemand ? (
          <button
            type="button"
            onClick={onAdvanceDemand}
            data-testid="btn-banner-advance-workflow"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors shadow-sm shrink-0"
          >
            <span>{orientacao.hierarquia?.proximoPasso?.acaoTitulo || 'Avançar para Em Validação'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : null;

      case 'BLOQUEIO_CONFORMIDADE':
        return onScrollToCompliance ? (
          <button
            type="button"
            onClick={onScrollToCompliance}
            data-testid="btn-banner-view-blocks"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-800/80 hover:bg-red-700/80 border border-red-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors shadow-sm shrink-0"
          >
            <span>Ver Diagnósticos de Bloqueio</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : null;

      case 'SEM_ENTIDADE_FATO':
        return onOpenAddEntity ? (
          <button
            type="button"
            onClick={onOpenAddEntity}
            data-testid="btn-banner-add-fact"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 px-3.5 py-2 text-xs font-semibold text-white transition-colors shadow-sm shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Adicionar Entidade Fato</span>
          </button>
        ) : null;

      case 'SEM_METRICAS_CADASTRADAS':
        return onOpenCreateMetric ? (
          <button
            type="button"
            onClick={onOpenCreateMetric}
            data-testid="btn-banner-add-metric"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 px-3.5 py-2 text-xs font-semibold text-white transition-colors shadow-sm shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Cadastrar Primeira Métrica</span>
          </button>
        ) : null;

      case 'ALERTA_CRITICO_PENDENTE':
        return onOpenHomologate ? (
          <button
            type="button"
            onClick={onOpenHomologate}
            data-testid="btn-banner-homologate-with-alerts"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-orange-600 hover:orange-500 px-3.5 py-2 text-xs font-semibold text-white transition-colors shadow-sm shrink-0"
          >
            <FileCheck2 className="h-4 w-4" />
            <span>Homologar com Justificativa</span>
          </button>
        ) : null;

      case 'PRONTO_PARA_HOMOLOGACAO':
        return onOpenHomologate ? (
          <button
            type="button"
            onClick={onOpenHomologate}
            data-testid="btn-banner-homologate"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-white transition-colors shadow-sm shrink-0"
          >
            <FileCheck2 className="h-4 w-4" />
            <span>Homologar Modelo Analítico</span>
          </button>
        ) : null;

      default:
        return null;
    }
  };

  // Ícone sóbrio do cabeçalho
  const getHeaderIcon = () => {
    if (temBloqueio) return <ShieldAlert className="h-5 w-5 text-red-400 shrink-0" />;
    if (temAlertaCritico) return <AlertTriangle className="h-5 w-5 text-orange-400 shrink-0" />;
    if (cenario === 'SEM_ENTIDADE_FATO') return <Table className="h-5 w-5 text-amber-400 shrink-0" />;
    if (cenario === 'SEM_METRICAS_CADASTRADAS') return <BarChart3 className="h-5 w-5 text-blue-400 shrink-0" />;
    if (cenario === 'HOMOLOGADO_E_VIGENTE') return <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />;
    if (cenario === 'PRONTO_PARA_HOMOLOGACAO') return <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />;
    return <Sparkles className="h-5 w-5 text-blue-400 shrink-0" />;
  };

  return (
    <section
      id="copilot-main-panel"
      role="region"
      aria-labelledby="copilot-title"
      data-testid={containerTestId}
      className={`rounded-xl border p-5 space-y-4 shadow-sm transition-colors ${getContainerStyles()}`}
    >
      {/* Cabeçalho de Orientação (Nível 1) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {getHeaderIcon()}
          <div>
            <h2 id="copilot-title" className="text-sm font-semibold text-white tracking-tight">
              {nivel1.titulo}
            </h2>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
              <span className="text-blue-400 font-medium">📍 Onde você está:</span>
              <span className="opacity-95 text-slate-300">
                {orientacao.hierarquia?.ondeVoceEsta || nivel1.ondeEstou}
              </span>
            </div>
          </div>
        </div>

        {/* Botão de Ação Prioritária Recomendada */}
        {renderActionButton()}
      </div>

      {/* Diagnóstico Operacional e Orientação (Nível 1: Sempre Visível) */}
      <div className="rounded-lg bg-slate-900/60 p-3.5 text-xs text-slate-300 space-y-2.5 border border-slate-800/60 leading-relaxed">
        {/* 🎯 O que estamos fazendo */}
        <div className="flex items-start gap-2">
          <span className="shrink-0 font-medium text-slate-400">🎯 O que estamos fazendo:</span>
          <span className="text-slate-200">
            {orientacao.hierarquia?.oQueEstamosFazendo || perguntasChave.oQueEstouFazendo}
          </span>
        </div>

        {/* 💡 Por que estamos fazendo isso */}
        <div className="flex items-start gap-2">
          <span className="shrink-0 font-medium text-slate-400">💡 Por que estamos fazendo isso:</span>
          <span className="text-slate-300">
            {orientacao.hierarquia?.porQueEstamosFazendo || perguntasChave.porQueEstouFazendoIsso}
          </span>
        </div>

        {/* ✅ Situação atual (Existe algo me impedindo de avançar?) */}
        <div className="pt-2 border-t border-slate-800/60">
          <div className="flex flex-wrap items-center gap-2">
            <span className="shrink-0 font-medium text-slate-400">Situação atual:</span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold border ${
                temBloqueio
                  ? 'bg-red-950/80 border-red-800 text-red-200'
                  : temAlertaCritico || prioridade === 'ACAO_NECESSARIA'
                  ? 'bg-amber-950/80 border-amber-800 text-amber-200'
                  : cenario === 'HOMOLOGADO_E_VIGENTE'
                  ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
                  : 'bg-slate-800/80 border-slate-700 text-slate-200'
              }`}
            >
              {orientacao.hierarquia?.situacaoAtual?.mensagemBloqueio ||
                (temBloqueio
                  ? '⛔ Bloqueio ativo impede a homologação'
                  : temAlertaCritico
                  ? '⚠️ Alertas críticos requerem justificativa'
                  : cenario === 'HOMOLOGADO_E_VIGENTE'
                  ? '✅ Nenhum bloqueio impede o avanço'
                  : 'ℹ️ Estruturação em andamento')}
            </span>
          </div>
          <p className="mt-1 text-slate-400 text-[11px] leading-normal">
            {orientacao.hierarquia?.situacaoAtual?.descricao || perguntasChave.condicoesEBloqueios}
          </p>
        </div>

        {/* ➡️ Próximo passo */}
        <div className="flex items-start gap-2 pt-2 border-t border-slate-800/60">
          <span className="shrink-0 font-medium text-slate-400">➡️ Próximo passo:</span>
          <span className="text-slate-200 font-medium">
            {orientacao.hierarquia?.proximoPasso?.descricao || perguntasChave.oQueDevoFazerAgora}
          </span>
        </div>
      </div>

      {/* Aprendizado Pedagógico de Conceitos (Nível 2) */}
      <CopilotConceptCard
        conceitos={nivel2.conceitosChave}
        dicaProfissional={nivel2.dicaProfissional}
      />

      {/* Detalhes Técnicos & Auditoria M-01 a M-11 (Nível 3 Sob Demanda) */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          aria-expanded={showTechnicalDetails}
          data-testid="btn-toggle-technical-details"
          className="text-xs text-slate-400 hover:text-slate-200 inline-flex items-center gap-1.5 transition-colors font-medium py-1"
        >
          <span>
            {showTechnicalDetails
              ? 'Ocultar detalhes técnicos e conformidade'
              : 'Verificar detalhes técnicos e conformidade (M-01 a M-11)'}
          </span>
          {showTechnicalDetails ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>

        {showTechnicalDetails && (
          <div
            className="mt-2.5 rounded-lg bg-slate-950/80 border border-slate-800 p-4 text-xs text-slate-300 space-y-3"
            data-testid="copilot-technical-details"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center border-b border-slate-800/80 pb-3">
              <div className="bg-slate-900/80 rounded p-2 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Entidades</span>
                <strong className="text-sm text-white">
                  {nivel3.metricasEstruturais.totalEntidades}
                </strong>
                <span className="text-[10px] text-slate-500 block">
                  ({nivel3.metricasEstruturais.totalFatos} Fatos, {nivel3.metricasEstruturais.totalDimensoes} Dim)
                </span>
              </div>
              <div className="bg-slate-900/80 rounded p-2 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Relacionamentos</span>
                <strong className="text-sm text-white">
                  {nivel3.metricasEstruturais.totalRelacionamentos}
                </strong>
              </div>
              <div className="bg-slate-900/80 rounded p-2 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Métricas</span>
                <strong className="text-sm text-white">
                  {nivel3.metricasEstruturais.totalMetricas}
                </strong>
              </div>
              <div className="bg-slate-900/80 rounded p-2 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Bloqueios / Alertas</span>
                <strong
                  className={`text-sm ${
                    nivel3.metricasEstruturais.totalBloqueios > 0
                      ? 'text-red-400'
                      : nivel3.metricasEstruturais.totalAlertasCriticos > 0
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {nivel3.metricasEstruturais.totalBloqueios} / {nivel3.metricasEstruturais.totalAlertasCriticos}
                </strong>
              </div>
            </div>

            {/* Diagnósticos Ativos */}
            <div className="space-y-2">
              <h4 className="font-semibold text-white text-[11px] uppercase tracking-wider">
                Regras Aplicáveis ({nivel3.regrasAplicaveis.join(', ')})
              </h4>
              {nivel3.diagnosticos.length === 0 ? (
                <p className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Nenhum diagnóstico impeditivo. Modelo matematicamente conforme.</span>
                </p>
              ) : (
                <ul className="space-y-1.5 text-[11px]">
                  {nivel3.diagnosticos.map((diag, idx) => (
                    <li
                      key={idx}
                      className={`p-2 rounded border ${
                        diag.severidade === 'BLOQUEIO'
                          ? 'bg-red-950/40 border-red-900/60 text-red-200'
                          : diag.severidade === 'ALERTA_CRITICO'
                          ? 'bg-amber-950/40 border-amber-900/60 text-amber-200'
                          : 'bg-slate-900/40 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="font-semibold flex items-center gap-1.5">
                        <span className="px-1 py-0.2 rounded bg-black/40 text-[10px]">
                          {diag.codigo}
                        </span>
                        <span>{diag.titulo}</span>
                      </div>
                      <p className="mt-0.5 text-slate-400">{diag.detalhe}</p>
                      {diag.acaoNecessaria && (
                        <p className="mt-1 font-medium text-white">
                          Ação necessária: {diag.acaoNecessaria}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
