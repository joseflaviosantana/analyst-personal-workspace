'use client';

import React, { useState } from 'react';
import {
  Bot,
  HelpCircle,
  Target,
  Briefcase,
  Layers,
  BarChart2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  XCircle,
  Calculator,
  AlertTriangle,
  Lightbulb,
  GraduationCap,
  ShieldAlert,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ResultadoAnaliseIntake } from '@/core/domain/intake/intake-types';

interface IntakeInferencesSectionProps {
  inferencias: ResultadoAnaliseIntake['inferencias'];
}

export function IntakeInferencesSection({ inferencias }: IntakeInferencesSectionProps) {
  const [expandedKpis, setExpandedKpis] = useState<Record<number, boolean>>({});
  const [statusSugestoes, setStatusSugestoes] = useState<Record<number, 'MANTIDA' | 'DESCARTADA' | 'PENDENTE'>>({});

  const toggleExpand = (idx: number) => {
    setExpandedKpis((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const setStatus = (idx: number, status: 'MANTIDA' | 'DESCARTADA') => {
    setStatusSugestoes((prev) => ({
      ...prev,
      [idx]: prev[idx] === status ? 'PENDENTE' : status,
    }));
  };

  const getExplicacaoSimples = (ind: ResultadoAnaliseIntake['inferencias']['indicadoresSugeridos'][0]) => {
    if (ind.oQueE) {
      return ind.oQueE.split('📘')[0].trim();
    }
    return ind.descricao;
  };

  return (
    <Card className="p-5 border-blue-900/50 bg-slate-900/90 shadow-md space-y-4" data-testid="section-inferencias">
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold text-slate-300 tracking-wider">
              5. 💡 SUGESTÕES DO COPILOTO
            </span>
            <Badge variant="default" data-testid="badge-inferencias-copiloto">
              SUGESTÕES E HIPÓTESES
            </Badge>
          </div>
          <p className="text-[11px] text-slate-400">
            Ideias do Copiloto para apoiar seu raciocínio. A decisão de usar é sempre sua.
          </p>
        </div>
        <span className="text-[11px] text-blue-400 font-medium flex items-center gap-1 self-start sm:self-auto">
          <Bot className="h-3.5 w-3.5" />
          <span>Tier 1 Heurístico Local</span>
        </span>
      </div>

      {/* Grid de Interpretação Básica: Domínio, Objetivo e Dimensões */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Domínio & Contexto */}
        <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-blue-400" />
              <span>Domínio de Negócio</span>
            </span>
            <span className="rounded bg-blue-950/80 border border-blue-800/60 px-2 py-0.5 text-xs font-mono font-semibold text-blue-300">
              {inferencias.dominioNegocio}
            </span>
          </div>

          <div className="space-y-0.5 text-xs text-slate-300">
            <span className="text-[11px] font-medium text-slate-400">Contexto identificado:</span>
            <p className="bg-slate-900/70 p-2 rounded border border-slate-800/80 leading-relaxed text-slate-200">
              {inferencias.contextoIdentificado}
            </p>
          </div>
        </div>

        {/* Problema Aparente & Objetivo Provável */}
        <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-3.5 space-y-2">
          <div className="space-y-0.5 text-xs text-slate-300">
            <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1.5">
              <HelpCircle className="h-3.5 w-3.5 text-amber-400" />
              <span>Problema aparente:</span>
            </span>
            <p className="bg-slate-900/70 p-2 rounded border border-slate-800/80 leading-relaxed text-slate-200">
              {inferencias.problemaAparente}
            </p>
          </div>

          <div className="space-y-0.5 text-xs text-slate-300">
            <span className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-emerald-400" />
              <span>Objetivo provável:</span>
            </span>
            <p className="bg-slate-900/70 p-2 rounded border border-slate-800/80 leading-relaxed text-slate-200">
              {inferencias.objetivoProvavel}
            </p>
          </div>
        </div>

        {/* Dimensões Analíticas (Categorias para análise) */}
        <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-3.5 space-y-2 md:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-400" />
              <span>Categorias para análise (Dimensões sugeridas)</span>
            </span>
            <span className="text-[11px] text-slate-500">
              📘 Nome profissional: dimensões analíticas (ex.: tempo, filial, produto)
            </span>
          </div>
          {inferencias.dimensoesAnaliticasIdentificadas.length > 0 ? (
            <div className="flex flex-wrap gap-1.5" data-testid="list-dimensoes-inferidas">
              {inferencias.dimensoesAnaliticasIdentificadas.map((dim, idx) => (
                <span
                  key={idx}
                  className="rounded bg-slate-900 border border-slate-800 px-2.5 py-1 text-xs text-slate-300 font-mono"
                >
                  {dim}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">Nenhuma dimensão preliminar sugerida.</p>
          )}
        </div>

        {/* Métricas e Sugestões do Copiloto (Camada Operacional Concisa + Progressive Disclosure) */}
        <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-3.5 space-y-3 md:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-800/80 pb-2">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-blue-400" />
              <span>Métricas e análises sugeridas</span>
            </span>
            <span className="text-[11px] text-slate-400">
              Sugestão do Copiloto não é requisito nem KPI • A decisão é sua
            </span>
          </div>

          {inferencias.indicadoresSugeridos.length > 0 ? (
            <div className="space-y-2.5" data-testid="list-indicadores-sugeridos">
              {inferencias.indicadoresSugeridos.map((ind, idx) => {
                const isExpanded = !!expandedKpis[idx];
                const status = statusSugestoes[idx] || 'PENDENTE';
                const explicacaoSimples = getExplicacaoSimples(ind);

                return (
                  <div
                    key={idx}
                    className={`rounded-lg border transition-all overflow-hidden ${
                      status === 'MANTIDA'
                        ? 'border-emerald-700/60 bg-emerald-950/20'
                        : status === 'DESCARTADA'
                        ? 'border-slate-800 bg-slate-950/40 opacity-60'
                        : 'border-slate-800 bg-slate-900/60'
                    }`}
                  >
                    {/* Visualização Principal Concisa */}
                    <div className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Nome Simples e Explicação Curta */}
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-blue-400 flex-shrink-0" />
                          <span className="text-xs font-bold text-slate-100">
                            {ind.nome}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 pl-6 leading-relaxed">
                          {explicacaoSimples}
                        </p>
                      </div>

                      {/* Decisão Humana: [Manter] [Descartar] [Entender melhor] */}
                      <div className="flex items-center gap-2 self-start sm:self-auto pl-6 sm:pl-0 flex-shrink-0">
                        <div className="flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-md border border-slate-800">
                          <button
                            type="button"
                            onClick={() => setStatus(idx, 'MANTIDA')}
                            title="Manter esta sugestão para avaliação"
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                              status === 'MANTIDA'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-emerald-300'
                            }`}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Manter</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setStatus(idx, 'DESCARTADA')}
                            title="Descartar esta sugestão analítica"
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                              status === 'DESCARTADA'
                                ? 'bg-slate-700 text-slate-200 font-semibold shadow-sm'
                                : 'text-slate-500 hover:text-rose-300'
                            }`}
                          >
                            <XCircle className="h-3 w-3" />
                            <span>Descartar</span>
                          </button>
                        </div>

                        {/* Botão de Progressive Disclosure */}
                        <button
                          type="button"
                          onClick={() => toggleExpand(idx)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-blue-300 hover:text-blue-200 bg-blue-950/30 hover:bg-blue-950/50 border border-blue-800/40 rounded-md transition-colors"
                          title={isExpanded ? 'Recolher detalhes' : 'Entender melhor o conceito e fórmula'}
                          aria-expanded={isExpanded}
                        >
                          <span>{isExpanded ? 'Recolher' : 'Entender melhor'}</span>
                          {isExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5 text-blue-400" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 text-blue-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Nível de Aprofundamento Sob Demanda (Entender Melhor) */}
                    {isExpanded && (
                      <div className="border-t border-slate-800 bg-slate-950/80 p-3.5 space-y-3 text-xs animate-in fade-in duration-200">
                        {/* Termo Profissional e Salvaguarda */}
                        <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded bg-blue-950/30 border border-blue-900/40">
                          <span className="text-blue-300 font-medium flex items-center gap-1.5">
                            <GraduationCap className="h-3.5 w-3.5 text-blue-400" />
                            <span>
                              📘 Nome profissional: {ind.ehKpi ? 'KPI (Indicador-Chave de Desempenho)' : 'Métrica Analítica de Diagnóstico'}
                            </span>
                          </span>
                          <span className="text-[10px] text-amber-300/90 font-medium flex items-center gap-1">
                            <ShieldAlert className="h-3 w-3" />
                            <span>Sugestão do Copiloto — decisão humana necessária</span>
                          </span>
                        </div>

                        {/* Finalidade Analítica: Como isso ajuda? */}
                        <div className="rounded bg-indigo-950/20 border border-indigo-900/40 p-3 space-y-2">
                          <span className="font-semibold text-indigo-300 flex items-center gap-1.5 text-xs">
                            <Lightbulb className="h-3.5 w-3.5 text-indigo-400" />
                            <span>Finalidade Analítica e Utilidade</span>
                          </span>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                            {(ind.avaliacaoSugestao?.relevanciaPedido || ind.porQueSugerido) && (
                              <div>
                                <span className="font-medium text-slate-400">Como isso ajuda neste projeto:</span>
                                <p className="text-slate-200 mt-0.5 leading-relaxed">
                                  {ind.avaliacaoSugestao?.relevanciaPedido || ind.porQueSugerido}
                                </p>
                              </div>
                            )}

                            {(ind.avaliacaoSugestao?.valorAnalitico || ind.oQueAjudaResponder) && (
                              <div>
                                <span className="font-medium text-slate-400">O que podemos descobrir com isso:</span>
                                <p className="text-slate-200 mt-0.5 leading-relaxed">
                                  {ind.avaliacaoSugestao?.valorAnalitico || ind.oQueAjudaResponder}
                                </p>
                              </div>
                            )}

                            {(ind.avaliacaoSugestao?.dependencias || ind.oQuePrecisaConfirmar) && (
                              <div className="sm:col-span-2">
                                <span className="font-medium text-slate-400">O que precisamos nos dados (Dependências):</span>
                                <p className="text-slate-200 mt-0.5 leading-relaxed">
                                  {ind.avaliacaoSugestao?.dependencias || ind.oQuePrecisaConfirmar}
                                </p>
                              </div>
                            )}

                            {ind.avaliacaoSugestao?.recomendacaoFundamentada && (
                              <div className="sm:col-span-2 pt-1 border-t border-indigo-900/40">
                                <span className="font-medium text-slate-400">Justificativa do Copiloto:</span>
                                <p className="text-indigo-200 font-medium mt-0.5">
                                  {ind.avaliacaoSugestao.recomendacaoFundamentada}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Detalhes Técnicos e Fórmulas */}
                        {ind.comoCalcular && (
                          <div className="rounded bg-slate-900/60 border border-slate-800 p-2.5 space-y-1">
                            <span className="font-medium text-slate-400 flex items-center gap-1.5 text-[11px]">
                              <Calculator className="h-3.5 w-3.5 text-blue-400" />
                              <span>Fórmula técnica de cálculo:</span>
                            </span>
                            <p className="text-slate-200 font-mono text-xs bg-slate-950/70 p-1.5 rounded border border-slate-800">
                              {ind.comoCalcular}
                            </p>
                          </div>
                        )}

                        {/* Exemplo Prático */}
                        {ind.exemploSimples && (
                          <div className="rounded bg-slate-900/60 border border-slate-800 p-2.5 space-y-1">
                            <span className="font-medium text-cyan-300 text-[11px]">Exemplo prático:</span>
                            <p className="text-slate-200 italic leading-relaxed text-xs">
                              {ind.exemploSimples}
                            </p>
                          </div>
                        )}

                        {/* Quando NÃO usar */}
                        {ind.quandoNaoAdequado && (
                          <div className="rounded bg-rose-950/20 border border-rose-900/40 p-2.5 space-y-1">
                            <span className="font-medium text-rose-300 flex items-center gap-1.5 text-[11px]">
                              <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                              <span>Quando este indicador pode NÃO ser adequado:</span>
                            </span>
                            <p className="text-rose-200/90 text-xs leading-relaxed">
                              {ind.quandoNaoAdequado}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">Nenhum indicador adicional inferido.</p>
          )}
        </div>
      </div>
    </Card>
  );
}

