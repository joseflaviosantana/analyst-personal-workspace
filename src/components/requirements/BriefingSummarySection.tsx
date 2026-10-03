'use client';

import React, { useState } from 'react';
import {
  FileText,
  Target,
  Calendar,
  Layers,
  LayoutTemplate,
  ShieldAlert,
  Clock,
  Edit3,
  X,
  Loader2,
  CheckCircle2,
  Lock,
  Sparkles,
  Info,
} from 'lucide-react';
import { DemandaComProjeto } from '@/core/domain/entities/demanda';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { atualizarBriefingDemandaAction } from '@/app/actions/requirements-actions';
import { aplicarSugestoesIntakeNoBriefing } from '@/core/domain/intake/intake-briefing-merger';

interface BriefingSummarySectionProps {
  demand: DemandaComProjeto;
  isReadOnly: boolean;
  onUpdated?: () => void;
}

export function BriefingSummarySection({
  demand,
  isReadOnly,
  onUpdated,
}: BriefingSummarySectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [intakeInfoMsg, setIntakeInfoMsg] = useState<string | null>(null);

  // Form states
  const [contexto, setContexto] = useState(demand.contexto || '');
  const [objetivoInicial, setObjetivoInicial] = useState(demand.objetivo_inicial || '');
  const [periodoAnalise, setPeriodoAnalise] = useState(demand.periodo_analise || '');
  const [granularidade, setGranularidade] = useState(demand.granularidade || '');
  const [formatoEntrega, setFormatoEntrega] = useState(demand.formato_entrega || '');
  const [restricoesDeclaradas, setRestricoesDeclaradas] = useState(demand.restricoes_declaradas || '');
  const [prazoEsperado, setPrazoEsperado] = useState(demand.prazo_esperado || '');

  const handleOpenModal = () => {
    setContexto(demand.contexto || '');
    setObjetivoInicial(demand.objetivo_inicial || '');
    setPeriodoAnalise(demand.periodo_analise || '');
    setGranularidade(demand.granularidade || '');
    setFormatoEntrega(demand.formato_entrega || '');
    setRestricoesDeclaradas(demand.restricoes_declaradas || '');
    setPrazoEsperado(demand.prazo_esperado || '');
    setError(null);
    setIntakeInfoMsg(null);
    setIsModalOpen(true);
  };

  const handleFillIntakeSuggestions = () => {
    const res = aplicarSugestoesIntakeNoBriefing(
      {
        contexto,
        objetivoInicial,
        periodoAnalise,
        granularidade,
        formatoEntrega,
        restricoesDeclaradas,
        prazoEsperado,
      },
      demand.intake_snapshot
    );

    setContexto(res.valores.contexto);
    setObjetivoInicial(res.valores.objetivoInicial);
    setPeriodoAnalise(res.valores.periodoAnalise);
    setGranularidade(res.valores.granularidade);
    setFormatoEntrega(res.valores.formatoEntrega);
    setRestricoesDeclaradas(res.valores.restricoesDeclaradas);
    setPrazoEsperado(res.valores.prazoEsperado);

    if (res.camposPreenchidos.length > 0) {
      setIntakeInfoMsg(
        `Sugestões preenchidas nos campos vazios: ${res.camposPreenchidos.join(', ')}. Seus dados existentes foram preservados.`
      );
    } else {
      setIntakeInfoMsg(
        'Nenhum campo vazio pôde ser preenchido: seus dados manuais foram preservados ou não havia sugestão no Intake.'
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await atualizarBriefingDemandaAction({
        demandaId: demand.id,
        contexto,
        objetivoInicial,
        periodoAnalise,
        granularidade,
        formatoEntrega,
        restricoesDeclaradas,
        prazoEsperado,
      });

      if (!res.success) {
        setError(res.error || 'Erro ao atualizar briefing.');
      } else {
        setSuccessMsg('Briefing estruturado atualizado com sucesso.');
        setIsModalOpen(false);
        if (onUpdated) onUpdated();
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4" data-testid="briefing-summary-section">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-400" />
            <span>Briefing Analítico Estruturado</span>
          </h3>
          <p className="text-xs text-slate-400">
            Delimitação formal de escopo, período, granularidade e restrições da demanda analítica.
          </p>
        </div>
        {!isReadOnly && (
          <button
            type="button"
            onClick={handleOpenModal}
            data-testid="btn-edit-briefing"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 transition-colors"
          >
            <Edit3 className="h-3.5 w-3.5 text-blue-400" />
            <span>Editar Briefing</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div className="rounded-lg border border-emerald-800/60 bg-emerald-950/40 p-3 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Grid de Informações Estruturadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Contexto / Problema */}
        <Card className="p-4 bg-slate-900/50">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-1.5">
            <FileText className="h-3.5 w-3.5 text-cyan-400" />
            <span>Problema / Contexto de Negócio</span>
          </div>
          <p
            className="text-xs text-slate-200 whitespace-pre-line leading-relaxed"
            data-testid="briefing-contexto"
          >
            {demand.contexto || <span className="text-slate-500 italic">Não informado</span>}
          </p>
        </Card>

        {/* Objetivo Analítico */}
        <Card className="p-4 bg-slate-900/50">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-1.5">
            <Target className="h-3.5 w-3.5 text-emerald-400" />
            <span>Objetivo Analítico Delimitado</span>
          </div>
          <p
            className="text-xs text-slate-200 whitespace-pre-line leading-relaxed"
            data-testid="briefing-objetivo"
          >
            {demand.objetivo_inicial || (
              <span className="text-slate-500 italic">Não informado</span>
            )}
          </p>
        </Card>

        {/* Período de Análise */}
        <Card className="p-4 bg-slate-900/50">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-1.5">
            <Calendar className="h-3.5 w-3.5 text-amber-400" />
            <span>Período de Análise</span>
          </div>
          <p
            className="text-xs text-slate-200 font-medium"
            data-testid="briefing-periodo"
          >
            {demand.periodo_analise || (
              <span className="text-slate-500 italic font-normal">A definir</span>
            )}
          </p>
        </Card>

        {/* Granularidade */}
        <Card className="p-4 bg-slate-900/50">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-1.5">
            <Layers className="h-3.5 w-3.5 text-purple-400" />
            <span>Granularidade Esperada</span>
          </div>
          <p
            className="text-xs text-slate-200 font-medium"
            data-testid="briefing-granularidade"
          >
            {demand.granularidade || (
              <span className="text-slate-500 italic font-normal">A definir</span>
            )}
          </p>
        </Card>

        {/* Formato de Entrega */}
        <Card className="p-4 bg-slate-900/50">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-1.5">
            <LayoutTemplate className="h-3.5 w-3.5 text-indigo-400" />
            <span>Formato de Entrega Pretendido</span>
          </div>
          <p
            className="text-xs text-slate-200 font-medium"
            data-testid="briefing-formato"
          >
            {demand.formato_entrega || (
              <span className="text-slate-500 italic font-normal">A definir</span>
            )}
          </p>
        </Card>

        {/* Restrições Declaradas */}
        <Card className="p-4 bg-slate-900/50">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
            <span>Restrições Declaradas</span>
          </div>
          <p
            className="text-xs text-slate-200 leading-relaxed"
            data-testid="briefing-restricoes"
          >
            {demand.restricoes_declaradas || (
              <span className="text-slate-500 italic font-normal">Nenhuma restrição</span>
            )}
          </p>
        </Card>
      </div>

      {/* Solicitação Bruta Imutável */}
      <Card className="p-4 bg-slate-950/70 border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Solicitação Bruta Original do Contratante
            </span>
          </div>
          <Badge variant="neutral" className="text-[10px]">
            Original Imutável
          </Badge>
        </div>
        <div
          data-testid="briefing-solicitacao-bruta"
          className="rounded border border-slate-800 bg-slate-900/60 p-3 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto"
        >
          {demand.solicitacao_bruta}
        </div>
        <p className="mt-1.5 text-[11px] text-slate-500">
          Registro verbatim preservado para auditoria e rastreabilidade de requisitos.
        </p>
      </Card>

      {/* Modal de Edição do Briefing */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-blue-400" />
                <span>Editar Briefing Analítico</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-rose-800 bg-rose-950/40 p-3 text-xs text-rose-300">
                {error}
              </div>
            )}

            {demand.intake_snapshot && (
              <div className="mb-4 rounded-lg border border-blue-900/60 bg-blue-950/30 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-blue-200">
                  <Sparkles className="h-4 w-4 text-blue-400 shrink-0" />
                  <span>Existem descobertas do Intake Snapshot disponíveis para este briefing.</span>
                </div>
                <button
                  type="button"
                  onClick={handleFillIntakeSuggestions}
                  data-testid="btn-fill-intake-suggestions"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/50 bg-blue-600/30 px-3 py-1.5 text-xs font-semibold text-blue-200 hover:bg-blue-600/50 hover:text-white transition-colors shrink-0"
                >
                  <Sparkles className="h-3.5 w-3.5 text-blue-300" />
                  <span>Preencher Sugestões do Intake</span>
                </button>
              </div>
            )}

            {intakeInfoMsg && (
              <div
                className="mb-4 rounded-lg border border-blue-800 bg-blue-950/60 p-3 text-xs text-blue-200 flex items-center justify-between gap-2 animate-in fade-in"
                data-testid="msg-intake-fill-feedback"
              >
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-400 shrink-0" />
                  <span>{intakeInfoMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIntakeInfoMsg(null)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Problema / Contexto de Negócio
                </label>
                <textarea
                  value={contexto}
                  onChange={(e) => setContexto(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                  placeholder="Descreva a dor, contexto ou oportunidade que originou a demanda..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Objetivo Analítico
                </label>
                <textarea
                  value={objetivoInicial}
                  onChange={(e) => setObjetivoInicial(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                  placeholder="Qual a pergunta analítica ou objetivo específico a ser respondido?"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Período de Análise
                  </label>
                  <input
                    type="text"
                    value={periodoAnalise}
                    onChange={(e) => setPeriodoAnalise(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                    placeholder="Ex.: Últimos 24 meses (2024-2025)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Granularidade Esperada
                  </label>
                  <input
                    type="text"
                    value={granularidade}
                    onChange={(e) => setGranularidade(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                    placeholder="Ex.: Mensal por Filial e Categoria"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Formato de Entrega Pretendido
                  </label>
                  <input
                    type="text"
                    value={formatoEntrega}
                    onChange={(e) => setFormatoEntrega(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                    placeholder="Ex.: Relatório Power BI (.pbix) + Visão Executiva"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Prazo Esperado
                  </label>
                  <input
                    type="text"
                    value={prazoEsperado}
                    onChange={(e) => setPrazoEsperado(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                    placeholder="Ex.: 15/10/2026"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Restrições Declaradas
                </label>
                <textarea
                  value={restricoesDeclaradas}
                  onChange={(e) => setRestricoesDeclaradas(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                  placeholder="Ex.: Acesso restrito via VPN, sem acesso a dados cadastrais sensíveis..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
