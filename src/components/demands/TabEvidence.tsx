'use client';

/**
 * src/components/demands/TabEvidence.tsx
 *
 * Aba 8 — Evidências (Evidence Core — Subgate 3.5A).
 *
 * Infraestrutura canônica para visualização, registro, deliberação humana
 * e auditoria de evidências analíticas com rigor epistêmico.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileCheck2,
  Plus,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  Filter,
  Sparkles,
  Lock,
  Globe,
  RefreshCw,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import { Card } from '@/components/ui/Card';
import { DemandaComProjeto } from '@/core/domain/entities/demanda';
import { AtivoDados } from '@/core/domain/entities/ativo-dados';
import {
  EvidenciaAnalitica,
  ResumoMetricasEvidencias,
} from '@/core/domain/entities/evidencia-analitica';
import {
  TipoEvidenciaAnalitica,
  ROTULOS_TIPO_EVIDENCIA,
} from '@/core/domain/enums/tipo-evidencia-analitica';
import {
  EtapaOrigemEvidencia,
  ROTULOS_ETAPA_ORIGEM_EVIDENCIA,
} from '@/core/domain/enums/etapa-origem-evidencia';
import {
  MetodoCapturaEvidencia,
  ROTULOS_METODO_CAPTURA,
} from '@/core/domain/enums/metodo-captura-evidencia';
import {
  StatusValidacaoEvidencia,
  ROTULOS_STATUS_VALIDACAO_EVIDENCIA,
} from '@/core/domain/enums/status-validacao-evidencia';
import {
  ClassificacaoExposicaoEvidencia,
  ROTULOS_CLASSIFICACAO_EXPOSICAO,
} from '@/core/domain/enums/classificacao-exposicao-evidencia';
import {
  listarEvidenciasDemandaAction,
  registrarEvidenciaAction,
  deliberarEvidenciaAction,
  alterarExposicaoEvidenciaAction,
} from '@/app/actions/evidence-actions';
import {
  EstadoDemanda,
  normalizarEstadoDemanda,
  isEstadoTerminal,
} from '@/core/domain/enums/estado-demanda';

interface TabEvidenceProps {
  demand: DemandaComProjeto;
  initialAssets?: AtivoDados[];
}

export function TabEvidence({ demand }: TabEvidenceProps) {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [evidencias, setEvidencias] = useState<EvidenciaAnalitica[]>([]);
  const [metricas, setMetricas] = useState<ResumoMetricasEvidencias | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Governança de Workflow Read-Only
  const estadoAtual = normalizarEstadoDemanda(demand.estado);
  const isSuspensa = estadoAtual === EstadoDemanda.SUSPENSA;
  const isConcluida = estadoAtual === EstadoDemanda.CONCLUIDA;
  const isCancelada = estadoAtual === EstadoDemanda.CANCELADA;
  const isTerminal = isEstadoTerminal(estadoAtual);
  const isReadOnly = isSuspensa || isTerminal;

  // Filtros
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');

  // Modal de Criação Manual
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    tipo: TipoEvidenciaAnalitica.DADOS as TipoEvidenciaAnalitica,
    etapaOrigem: EtapaOrigemEvidencia.DADOS as EtapaOrigemEvidencia,
    fatoObservado: '',
    estadoAnterior: '',
    acaoRegistrada: '',
    estadoPosterior: '',
    resultadoMensuravel: '',
    inferenciaRecomendacao: '',
    classificacaoExposicao: ClassificacaoExposicaoEvidencia.INTERNA as ClassificacaoExposicaoEvidencia,
    elegibilidadePortfolio: false,
    executor: 'ANALISTA',
  });

  // Modal de Deliberação Humana
  const [isDeliberarModalOpen, setIsDeliberarModalOpen] = useState(false);
  const [evidenciaParaDeliberar, setEvidenciaParaDeliberar] = useState<EvidenciaAnalitica | null>(
    null
  );
  const [statusDeliberacao, setStatusDeliberacao] = useState<'CONFIRMADA' | 'REJEITADA'>(
    'CONFIRMADA'
  );
  const [justificativaDeliberacao, setJustificativaDeliberacao] = useState('');

  const carregarEvidencias = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listarEvidenciasDemandaAction({ demandaId: demand.id });
      if (res.success && res.data) {
        setEvidencias(res.data.evidencias);
        setMetricas(res.data.metricas);
      } else {
        setFeedback({ type: 'error', message: res.error || 'Erro ao carregar evidências.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Falha na comunicação com o repositório de evidências.' });
    } finally {
      setLoading(false);
    }
  }, [demand.id]);

  useEffect(() => {
    carregarEvidencias();
  }, [carregarEvidencias]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await registrarEvidenciaAction({
        demandaId: demand.id,
        projetoId: demand.projeto_id,
        titulo: formData.titulo,
        descricao: formData.descricao,
        tipo: formData.tipo,
        etapaOrigem: formData.etapaOrigem,
        fatoObservado: formData.fatoObservado,
        estadoAnterior: formData.estadoAnterior || null,
        acaoRegistrada: formData.acaoRegistrada,
        estadoPosterior: formData.estadoPosterior || null,
        resultadoMensuravel: formData.resultadoMensuravel || null,
        inferenciaRecomendacao: formData.inferenciaRecomendacao || null,
        classificacaoExposicao: formData.classificacaoExposicao,
        elegibilidadePortfolio: formData.elegibilidadePortfolio,
        metodoCaptura: MetodoCapturaEvidencia.MANUAL,
        statusValidacao: StatusValidacaoEvidencia.AGUARDANDO_REVISAO,
        executor: formData.executor || 'ANALISTA',
      });

      if (!res.success) {
        setFeedback({ type: 'error', message: res.error || 'Erro ao registrar evidência.' });
      } else {
        setFeedback({ type: 'success', message: 'Evidência registrada com sucesso no Evidence Core.' });
        setIsCreateModalOpen(false);
        setFormData({
          titulo: '',
          descricao: '',
          tipo: TipoEvidenciaAnalitica.DADOS,
          etapaOrigem: EtapaOrigemEvidencia.DADOS,
          fatoObservado: '',
          estadoAnterior: '',
          acaoRegistrada: '',
          estadoPosterior: '',
          resultadoMensuravel: '',
          inferenciaRecomendacao: '',
          classificacaoExposicao: ClassificacaoExposicaoEvidencia.INTERNA,
          elegibilidadePortfolio: false,
          executor: 'ANALISTA',
        });
        await carregarEvidencias();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro inesperado ao registrar evidência.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAbrirDeliberacao = (ev: EvidenciaAnalitica, status: 'CONFIRMADA' | 'REJEITADA') => {
    if (isReadOnly) return;
    setEvidenciaParaDeliberar(ev);
    setStatusDeliberacao(status);
    setJustificativaDeliberacao('');
    setIsDeliberarModalOpen(true);
  };

  const handleDeliberarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!evidenciaParaDeliberar) return;

    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await deliberarEvidenciaAction(
        {
          id: evidenciaParaDeliberar.id,
          status: statusDeliberacao,
          decisaoHumana: justificativaDeliberacao,
          revisor: 'ANALISTA',
        },
        demand.id
      );

      if (!res.success) {
        setFeedback({ type: 'error', message: res.error || 'Erro ao deliberar evidência.' });
      } else {
        setFeedback({
          type: 'success',
          message: `Evidência "${evidenciaParaDeliberar.titulo}" foi ${statusDeliberacao === 'CONFIRMADA' ? 'confirmada' : 'rejeitada'} com sucesso.`,
        });
        setIsDeliberarModalOpen(false);
        setEvidenciaParaDeliberar(null);
        await carregarEvidencias();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro inesperado na deliberação.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAlterarExposicao = async (
    ev: EvidenciaAnalitica,
    novaClassificacao: ClassificacaoExposicaoEvidencia
  ) => {
    if (isReadOnly) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      const elegivel =
        novaClassificacao === ClassificacaoExposicaoEvidencia.CONFIDENCIAL
          ? false
          : ev.elegibilidade_portfolio;

      const res = await alterarExposicaoEvidenciaAction(
        {
          id: ev.id,
          classificacaoExposicao: novaClassificacao,
          elegibilidadePortfolio: elegivel,
        },
        demand.id
      );

      if (!res.success) {
        setFeedback({ type: 'error', message: res.error || 'Erro ao alterar exposição.' });
      } else {
        setFeedback({
          type: 'success',
          message: `Classificação de "${ev.titulo}" alterada para ${ROTULOS_CLASSIFICACAO_EXPOSICAO[novaClassificacao]}.`,
        });
        await carregarEvidencias();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao alterar exposição.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setActionLoading(false);
    }
  };

  // Filtragem em memória para resposta instantânea na UI
  const evidenciasFiltradas = evidencias.filter((ev) => {
    if (filtroStatus !== 'TODOS' && ev.status_validacao !== filtroStatus) {
      return false;
    }
    if (filtroTipo !== 'TODOS' && ev.tipo !== filtroTipo) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6" data-testid="tab-evidence-container">
      {/* Banner de Governança Read-Only quando aplicável */}
      {isReadOnly && (
        <div
          className="flex items-center gap-2.5 rounded-lg border border-amber-800/80 bg-amber-950/40 p-3.5 text-xs text-amber-300"
          data-testid="evidence-banner-readonly-governance"
        >
          <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400" />
          <span>
            {isSuspensa && 'Demanda Suspensa: O registro e deliberação de evidências analíticas estão congelados enquanto a demanda estiver suspensa.'}
            {isConcluida && 'Demanda Concluída: O repositório de evidências analíticas está imutável para fins de auditoria, conformidade e prestação de contas.'}
            {isCancelada && 'Demanda Cancelada: As evidências analíticas estão arquivadas em modo somente-leitura.'}
          </span>
        </div>
      )}

      {/* Feedback Alert */}
      {feedback && (
        <div
          data-testid="evidence-feedback-alert"
          className={clsx(
            'flex items-center justify-between rounded-lg p-3 text-xs border',
            feedback.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/70 border-rose-800 text-rose-300'
          )}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="hover:opacity-75"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Cabeçalho do Evidence Core */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Evidence Core & Rastreabilidade Canônica
            </h2>
            <span className="rounded-full bg-indigo-950/80 border border-indigo-800 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
              Subgate 3.5A
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400 max-w-2xl leading-relaxed">
            Repositório auditável de fatos, artefatos, deliberações e deltas mensuráveis do
            trabalho analítico. Separa rigorosamente Fatos Observados de Decisões Humanas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => carregarEvidencias()}
            disabled={loading || actionLoading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50"
            title="Atualizar lista de evidências"
          >
            <RefreshCw className={clsx('h-3.5 w-3.5', loading && 'animate-spin')} />
            <span>Atualizar</span>
          </button>

          {!isReadOnly && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              data-testid="btn-nova-evidencia"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Registrar Evidência</span>
            </button>
          )}
        </div>
      </div>

      {/* Resumo Quantitativo do Evidence Core */}
      {metricas && (
        <div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
          data-testid="evidence-metrics-summary"
        >
          <Card className="p-3 bg-slate-900 border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-slate-400">Total de Evidências</span>
            <span
              className="text-xl font-bold text-white mt-1 font-mono"
              data-testid="metric-total-evidencias"
            >
              {metricas.total}
            </span>
          </Card>

          <Card className="p-3 bg-slate-900 border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-emerald-400">Confirmadas</span>
            <span
              className="text-xl font-bold text-emerald-400 mt-1 font-mono"
              data-testid="metric-confirmadas"
            >
              {metricas.por_status[StatusValidacaoEvidencia.CONFIRMADA]}
            </span>
          </Card>

          <Card className="p-3 bg-slate-900 border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-amber-400">Aguardando Revisão</span>
            <span
              className="text-xl font-bold text-amber-400 mt-1 font-mono"
              data-testid="metric-aguardando"
            >
              {metricas.por_status[StatusValidacaoEvidencia.AGUARDANDO_REVISAO]}
            </span>
          </Card>

          <Card className="p-3 bg-slate-900 border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-slate-400">Uso Interno</span>
            <span
              className="text-xl font-bold text-slate-300 mt-1 font-mono"
              data-testid="metric-internas"
            >
              {metricas.por_classificacao[ClassificacaoExposicaoEvidencia.INTERNA]}
            </span>
          </Card>

          <Card className="p-3 bg-slate-900 border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-rose-400">Confidenciais</span>
            <span
              className="text-xl font-bold text-rose-400 mt-1 font-mono"
              data-testid="metric-confidenciais"
            >
              {metricas.por_classificacao[ClassificacaoExposicaoEvidencia.CONFIDENCIAL]}
            </span>
          </Card>

          <Card className="p-3 bg-slate-900 border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-cyan-400">Elegíveis Portfólio</span>
            <span
              className="text-xl font-bold text-cyan-300 mt-1 font-mono"
              data-testid="metric-portfolio"
            >
              {metricas.total_elegiveis_portfolio}
            </span>
          </Card>
        </div>
      )}

      {/* Barra de Filtros Rápidos */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-2">
            <Filter className="h-3.5 w-3.5 text-slate-500" />
            <span>Filtrar por:</span>
          </div>

          {/* Filtro de Status */}
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            data-testid="select-filtro-status"
            className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
          >
            <option value="TODOS">Todos os Status</option>
            <option value={StatusValidacaoEvidencia.CONFIRMADA}>Confirmadas</option>
            <option value={StatusValidacaoEvidencia.AGUARDANDO_REVISAO}>Aguardando Revisão</option>
            <option value={StatusValidacaoEvidencia.CAPTURADA}>Capturadas</option>
            <option value={StatusValidacaoEvidencia.REJEITADA}>Rejeitadas</option>
          </select>

          {/* Filtro de Tipo */}
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            data-testid="select-filtro-tipo"
            className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
          >
            <option value="TODOS">Todos os Tipos</option>
            {Object.entries(ROTULOS_TIPO_EVIDENCIA).map(([tipo, rotulo]) => (
              <option key={tipo} value={tipo}>
                {rotulo}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-400">
          Exibindo <strong className="text-slate-200">{evidenciasFiltradas.length}</strong> de{' '}
          <strong className="text-slate-200">{evidencias.length}</strong> evidências
        </div>
      </div>

      {/* Conteúdo Principal: Estado Vazio ou Lista */}
      {loading ? (
        <Card className="p-12 text-center bg-slate-900 border-slate-800">
          <RefreshCw className="h-8 w-8 text-indigo-400 mx-auto animate-spin mb-3" />
          <p className="text-sm text-slate-300">Carregando repositório de evidências...</p>
        </Card>
      ) : evidencias.length === 0 ? (
        /* Estado Vazio Apropriado e Educativo */
        <Card
          className="p-10 text-center bg-slate-900/60 border-slate-800 border-dashed"
          data-testid="evidence-empty-state"
        >
          <div className="mx-auto w-12 h-12 rounded-full bg-indigo-950/80 border border-indigo-800 flex items-center justify-center mb-4 text-indigo-400">
            <FileCheck2 className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-white">Nenhuma evidência registrada ainda</h3>
          <p className="mt-2 text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            O Evidence Core registra marcos verificáveis do trabalho analítico (descobertas de
            dados, anomalias tratadas, regras DAX validadas, conciliações e homologações).
          </p>
          {!isReadOnly && (
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                data-testid="btn-empty-state-nova-evidencia"
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 shadow-sm transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Registrar Primeira Evidência Manual</span>
              </button>
            </div>
          )}
        </Card>
      ) : evidenciasFiltradas.length === 0 ? (
        <Card className="p-8 text-center bg-slate-900/40 border-slate-800">
          <HelpCircle className="h-6 w-6 text-slate-500 mx-auto mb-2" />
          <p className="text-xs text-slate-400">
            Nenhuma evidência encontrada para a combinação de filtros selecionada.
          </p>
          <button
            type="button"
            onClick={() => {
              setFiltroStatus('TODOS');
              setFiltroTipo('TODOS');
            }}
            className="mt-3 text-xs text-indigo-400 hover:underline"
          >
            Limpar filtros
          </button>
        </Card>
      ) : (
        /* Listagem Canônica de Evidências */
        <div className="space-y-4" data-testid="evidence-list">
          {evidenciasFiltradas.map((ev) => {
            const isConfirmada = ev.status_validacao === StatusValidacaoEvidencia.CONFIRMADA;
            const isRejeitada = ev.status_validacao === StatusValidacaoEvidencia.REJEITADA;
            const isConfidencial =
              ev.classificacao_exposicao === ClassificacaoExposicaoEvidencia.CONFIDENCIAL;

            return (
              <Card
                key={ev.id}
                data-testid={`evidence-item-${ev.id}`}
                className={clsx(
                  'p-5 transition-colors border',
                  isConfirmada
                    ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    : isRejeitada
                      ? 'bg-rose-950/10 border-rose-900/40'
                      : 'bg-slate-900/90 border-amber-900/40'
                )}
              >
                {/* Linha 1: Badges de Origem, Tipo, Status e Classificação */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-800/80">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-indigo-950/80 border border-indigo-800 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
                      {ROTULOS_TIPO_EVIDENCIA[ev.tipo] || ev.tipo}
                    </span>

                    <span className="rounded-md bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                      {ROTULOS_ETAPA_ORIGEM_EVIDENCIA[ev.etapa_origem] || ev.etapa_origem}
                    </span>

                    <span
                      className={clsx(
                        'rounded-md px-2 py-0.5 text-[10px] font-semibold border flex items-center gap-1',
                        isConfirmada
                          ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                          : isRejeitada
                            ? 'bg-rose-950/80 border-rose-800 text-rose-300'
                            : 'bg-amber-950/80 border-amber-800 text-amber-300'
                      )}
                    >
                      {isConfirmada ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : isRejeitada ? (
                        <XCircle className="h-3 w-3" />
                      ) : (
                        <AlertCircle className="h-3 w-3" />
                      )}
                      <span>{ROTULOS_STATUS_VALIDACAO_EVIDENCIA[ev.status_validacao]}</span>
                    </span>

                    <span
                      className={clsx(
                        'rounded-md px-2 py-0.5 text-[10px] font-medium border flex items-center gap-1',
                        isConfidencial
                          ? 'bg-rose-950/50 border-rose-800 text-rose-300'
                          : ev.classificacao_exposicao === ClassificacaoExposicaoEvidencia.PUBLICA
                            ? 'bg-cyan-950/50 border-cyan-800 text-cyan-300'
                            : 'bg-slate-800 border-slate-700 text-slate-300'
                      )}
                    >
                      {isConfidencial ? (
                        <Lock className="h-3 w-3" />
                      ) : ev.classificacao_exposicao === ClassificacaoExposicaoEvidencia.PUBLICA ? (
                        <Globe className="h-3 w-3" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                      <span>{ROTULOS_CLASSIFICACAO_EXPOSICAO[ev.classificacao_exposicao]}</span>
                    </span>

                    {ev.elegibilidade_portfolio && (
                      <span className="rounded-md bg-cyan-950/70 border border-cyan-700 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        <span>Portfólio Ready</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-500" />
                      <span>{new Date(ev.criado_em).toLocaleString('pt-BR')}</span>
                    </span>
                    <span>•</span>
                    <span>Executor: <strong className="text-slate-300">{ev.executor}</strong></span>
                  </div>
                </div>

                {/* Linha 2: Título e Descrição */}
                <div className="mt-3">
                  <h4 className="text-sm font-bold text-white tracking-tight">{ev.titulo}</h4>
                  <p className="mt-1 text-xs text-slate-300 leading-relaxed">{ev.descricao}</p>
                </div>

                {/* Linha 3: Estrutura Epistêmica (Fato, Ação, Resultado, Decisão) */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Fato Observado */}
                  <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-3">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-400 mb-1">
                      <span>🔍 Fato Observado</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {ev.fato_observado}
                    </p>
                    {ev.estado_anterior && (
                      <p className="mt-2 text-[11px] text-slate-400 border-t border-slate-900 pt-1.5">
                        <span className="text-slate-500">Estado Anterior:</span> {ev.estado_anterior}
                      </p>
                    )}
                  </div>

                  {/* Ação Registrada */}
                  <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-3">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-blue-400 mb-1">
                      <span>⚡ Ação Registrada</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {ev.acao_registrada}
                    </p>
                    {ev.estado_posterior && (
                      <p className="mt-2 text-[11px] text-slate-400 border-t border-slate-900 pt-1.5">
                        <span className="text-slate-500">Estado Posterior:</span> {ev.estado_posterior}
                      </p>
                    )}
                  </div>

                  {/* Resultado Mensurável (se houver) */}
                  {ev.resultado_mensuravel && (
                    <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-3">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-400 mb-1">
                        <span>📊 Resultado Mensurável</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed font-mono text-[11px]">
                        {ev.resultado_mensuravel}
                      </p>
                    </div>
                  )}

                  {/* Inferência / Recomendação (se houver) */}
                  {ev.inferencia_recomendacao && (
                    <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-3">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-cyan-400 mb-1">
                        <span>💡 Inferência / Recomendação</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        {ev.inferencia_recomendacao}
                      </p>
                    </div>
                  )}

                  {/* Decisão Humana / Deliberação (se houver) */}
                  {ev.decisao_humana && (
                    <div className="col-span-1 md:col-span-2 rounded-lg border border-indigo-950/80 bg-indigo-950/20 p-3">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-indigo-300 mb-1">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>⚖️ Decisão Humana & Homologação Registrada</span>
                      </div>
                      <p className="text-slate-200 leading-relaxed whitespace-pre-wrap text-[11px]">
                        {ev.decisao_humana}
                      </p>
                    </div>
                  )}
                </div>

                {/* Linha 4: Barra de Ações Rápidas de Governança */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-[11px]">Sensibilidade:</span>
                    <select
                      value={ev.classificacao_exposicao}
                      onChange={(e) =>
                        handleAlterarExposicao(
                          ev,
                          e.target.value as ClassificacaoExposicaoEvidencia
                        )
                      }
                      disabled={actionLoading || isReadOnly}
                      data-testid={`select-exposicao-${ev.id}`}
                      className="rounded bg-slate-800 border border-slate-700 px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                    >
                      <option value={ClassificacaoExposicaoEvidencia.INTERNA}>Interna</option>
                      <option value={ClassificacaoExposicaoEvidencia.CONFIDENCIAL}>Confidencial</option>
                      <option value={ClassificacaoExposicaoEvidencia.SANITIZAVEL}>Sanitizável</option>
                      <option value={ClassificacaoExposicaoEvidencia.PUBLICA}>Pública</option>
                    </select>
                  </div>

                  {!isReadOnly && (
                    <div className="flex items-center gap-2">
                      {!isConfirmada && (
                        <button
                          type="button"
                          onClick={() => handleAbrirDeliberacao(ev, 'CONFIRMADA')}
                          disabled={actionLoading}
                          data-testid={`btn-confirmar-evidencia-${ev.id}`}
                          className="inline-flex items-center gap-1 rounded bg-emerald-950 border border-emerald-800/80 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-900 hover:text-white transition-colors disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Confirmar Evidência</span>
                        </button>
                      )}

                      {!isRejeitada && (
                        <button
                          type="button"
                          onClick={() => handleAbrirDeliberacao(ev, 'REJEITADA')}
                          disabled={actionLoading}
                          data-testid={`btn-rejeitar-evidencia-${ev.id}`}
                          className="inline-flex items-center gap-1 rounded bg-rose-950 border border-rose-800/80 px-2.5 py-1 text-[11px] font-semibold text-rose-300 hover:bg-rose-900 hover:text-white transition-colors disabled:opacity-50"
                        >
                          <XCircle className="h-3 w-3" />
                          <span>Rejeitar</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal: Registrar Nova Evidência Manual */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          data-testid="modal-nova-evidencia"
        >
          <div className="w-full max-w-2xl rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-5 w-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Registrar Evidência Analítica</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Título da Evidência *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    placeholder="Ex: Conciliação de Faturamento e Métrica Líquida"
                    data-testid="input-titulo-evidencia"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Tipo de Evidência *</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) =>
                      setFormData({ ...formData, tipo: e.target.value as TipoEvidenciaAnalitica })
                    }
                    data-testid="select-tipo-evidencia"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
                  >
                    {Object.entries(ROTULOS_TIPO_EVIDENCIA).map(([tipo, rotulo]) => (
                      <option key={tipo} value={tipo}>
                        {rotulo}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Descrição Contextual *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Contextualize a motivação e circunstância desta evidência no projeto..."
                  data-testid="textarea-descricao-evidencia"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Fato Observado vs. Ação Registrada */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-amber-400 mb-1">
                    🔍 Fato Observado (O que foi constatado) *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formData.fatoObservado}
                    onChange={(e) => setFormData({ ...formData, fatoObservado: e.target.value })}
                    placeholder="Constatação factual estrita nos dados ou regras..."
                    data-testid="textarea-fato-observado"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-blue-400 mb-1">
                    ⚡ Ação Registrada (O que foi executado) *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formData.acaoRegistrada}
                    onChange={(e) => setFormData({ ...formData, acaoRegistrada: e.target.value })}
                    placeholder="Ação, ajuste ou intervenção realizada..."
                    data-testid="textarea-acao-registrada"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Estado Anterior vs. Posterior */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-400 mb-1">Estado Anterior</label>
                  <input
                    type="text"
                    value={formData.estadoAnterior}
                    onChange={(e) => setFormData({ ...formData, estadoAnterior: e.target.value })}
                    placeholder="Ex: Tabela com 14% de nulos na coluna cliente_id"
                    data-testid="input-estado-anterior"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-400 mb-1">Estado Posterior</label>
                  <input
                    type="text"
                    value={formData.estadoPosterior}
                    onChange={(e) => setFormData({ ...formData, estadoPosterior: e.target.value })}
                    placeholder="Ex: 0% de nulos após regra de imputação homologada"
                    data-testid="input-estado-posterior"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Resultado Mensurável & Inferência */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-emerald-400 mb-1">
                    📊 Resultado Mensurável (Delta / Métrica)
                  </label>
                  <input
                    type="text"
                    value={formData.resultadoMensuravel}
                    onChange={(e) =>
                      setFormData({ ...formData, resultadoMensuravel: e.target.value })
                    }
                    placeholder="Ex: Delta = 0,00%, 100% conciliado"
                    data-testid="input-resultado-mensuravel"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-cyan-400 mb-1">
                    💡 Inferência / Recomendação
                  </label>
                  <input
                    type="text"
                    value={formData.inferenciaRecomendacao}
                    onChange={(e) =>
                      setFormData({ ...formData, inferenciaRecomendacao: e.target.value })
                    }
                    placeholder="Ex: Recomenda-se monitorar taxa de cancelamento semanalmente"
                    data-testid="input-inferencia-recomendacao"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Governança e Sensibilidade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Classificação de Exposição *
                  </label>
                  <select
                    value={formData.classificacaoExposicao}
                    onChange={(e) => {
                      const val = e.target.value as ClassificacaoExposicaoEvidencia;
                      setFormData({
                        ...formData,
                        classificacaoExposicao: val,
                        elegibilidadePortfolio:
                          val === ClassificacaoExposicaoEvidencia.CONFIDENCIAL
                            ? false
                            : formData.elegibilidadePortfolio,
                      });
                    }}
                    data-testid="select-classificacao-modal"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
                  >
                    {Object.entries(ROTULOS_CLASSIFICACAO_EXPOSICAO).map(([val, rotulo]) => (
                      <option key={val} value={val}>
                        {rotulo}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="elegibilidadePortfolio"
                    checked={formData.elegibilidadePortfolio}
                    disabled={
                      formData.classificacaoExposicao ===
                      ClassificacaoExposicaoEvidencia.CONFIDENCIAL
                    }
                    onChange={(e) =>
                      setFormData({ ...formData, elegibilidadePortfolio: e.target.checked })
                    }
                    data-testid="checkbox-elegibilidade-portfolio"
                    className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0"
                  />
                  <label
                    htmlFor="elegibilidadePortfolio"
                    className={clsx(
                      'text-xs',
                      formData.classificacaoExposicao ===
                        ClassificacaoExposicaoEvidencia.CONFIDENCIAL
                        ? 'text-slate-600 cursor-not-allowed'
                        : 'text-slate-300 cursor-pointer'
                    )}
                  >
                    Elegível para compor case futuro de portfólio
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={actionLoading}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  data-testid="btn-salvar-evidencia"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors shadow-sm disabled:opacity-50"
                >
                  {actionLoading ? 'Registrando...' : 'Salvar Evidência'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Deliberação Humana (Confirmar / Rejeitar) */}
      {isDeliberarModalOpen && evidenciaParaDeliberar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          data-testid="modal-deliberar-evidencia"
        >
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                {statusDeliberacao === 'CONFIRMADA' ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-rose-400" />
                )}
                <h3 className="text-sm font-bold text-white">
                  {statusDeliberacao === 'CONFIRMADA'
                    ? 'Confirmar / Homologar Evidência'
                    : 'Rejeitar Evidência'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDeliberarModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleDeliberarSubmit} className="mt-4 space-y-4 text-xs">
              <div className="rounded-lg bg-slate-950 p-3 border border-slate-800">
                <span className="text-[11px] text-slate-500">Evidência:</span>
                <p className="text-xs font-semibold text-white">{evidenciaParaDeliberar.titulo}</p>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  {evidenciaParaDeliberar.descricao}
                </p>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Justificativa da Decisão Humana *
                </label>
                <textarea
                  rows={3}
                  required
                  value={justificativaDeliberacao}
                  onChange={(e) => setJustificativaDeliberacao(e.target.value)}
                  placeholder={
                    statusDeliberacao === 'CONFIRMADA'
                      ? 'Ex: Fato conferido contra a base de dados de produção e cálculo aprovado para o fechamento executivo.'
                      : 'Ex: Fato não reproduzido após recálculo; evidência descartada.'
                  }
                  data-testid="textarea-justificativa-deliberacao"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDeliberarModalOpen(false)}
                  disabled={actionLoading}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  data-testid="btn-confirmar-deliberacao-submit"
                  className={clsx(
                    'rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors shadow-sm disabled:opacity-50',
                    statusDeliberacao === 'CONFIRMADA'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-rose-600 hover:bg-rose-500'
                  )}
                >
                  {actionLoading
                    ? 'Registrando...'
                    : statusDeliberacao === 'CONFIRMADA'
                      ? 'Confirmar Evidência'
                      : 'Rejeitar Evidência'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
