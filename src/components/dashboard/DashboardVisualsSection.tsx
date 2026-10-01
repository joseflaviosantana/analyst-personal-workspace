'use client';

/**
 * src/components/dashboard/DashboardVisualsSection.tsx
 *
 * Bloco 4 — Visuais do Dashboard (Subgate 3.4D)
 *
 * Apresenta a coleção de componentes visuais do dashboard com:
 * - Filtro dinâmico por página de relatório;
 * - Justificativas profundas de Data Visualization (O que é, Por que, Pergunta respondida);
 * - Módulo pedagógico "Aprenda Enquanto Trabalha" com dicas profissionais em tempo real;
 * - Alternativas analíticas de visualização (Assistido);
 * - Gestão atômica de visuais (criação e exclusão).
 */

import React, { useState } from 'react';
import {
  PieChart,
  Plus,
  BarChart3,
  Layers,
  Compass,
  HelpCircle,
  BookOpen,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRightLeft,
  Loader2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { VisualDashboard } from '@/core/domain/entities/visual-dashboard';
import { PaginaRelatorio } from '@/core/domain/entities/pagina-relatorio';
import { MedidaDax } from '@/core/domain/entities/medida-dax';
import {
  TipoVisualDashboard,
  ROTULOS_TIPO_VISUAL_DASHBOARD,
} from '@/core/domain/enums/tipo-visual-dashboard';
import {
  PosicaoLayoutVisual,
  ROTULOS_POSICAO_LAYOUT_VISUAL,
} from '@/core/domain/enums/posicao-layout-visual';
import { obterConceitoDataViz } from '@/core/domain/dashboard-design/dataviz-pedagogy';

interface DashboardVisualsSectionProps {
  visuais: VisualDashboard[];
  paginas?: PaginaRelatorio[];
  medidas?: MedidaDax[];
  isIsento?: boolean;
  onOpenCreateModal?: () => void;
  onExcluirVisual?: (visualId: string) => Promise<void>;
  onAlternarVisual?: (visualId: string, novoTipo: TipoVisualDashboard) => Promise<void>;
}

export function DashboardVisualsSection({
  visuais,
  paginas = [],
  medidas = [],
  isIsento = false,
  onOpenCreateModal,
  onExcluirVisual,
  onAlternarVisual,
}: DashboardVisualsSectionProps) {
  const [filtroPaginaId, setFiltroPaginaId] = useState<string>('TODAS');
  const [visualExpandidoId, setVisualExpandidoId] = useState<string | null>(null);
  const [visualExcluindoId, setVisualExcluindoId] = useState<string | null>(null);
  const [visualAlternandoId, setVisualAlternandoId] = useState<string | null>(null);

  if (isIsento) {
    return (
      <Card data-testid="dashboard-visuals-isento" className="p-6 text-center border-slate-800 bg-slate-900/60">
        <PieChart className="h-8 w-8 text-slate-500 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-white">Etapa Isenta de Componentes Visuais</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          Esta demanda opera sob isenção formal de Power BI (Excel-only). Nenhum visual gráfico é requerido para homologação.
        </p>
      </Card>
    );
  }

  const visuaisFiltrados =
    filtroPaginaId === 'TODAS'
      ? visuais
      : visuais.filter((v) => v.pagina_id === filtroPaginaId);

  const toggleExpandir = (id: string) => {
    setVisualExpandidoId((prev) => (prev === id ? null : id));
  };

  const handleExcluir = async (id: string) => {
    if (!onExcluirVisual) return;
    setVisualExcluindoId(id);
    try {
      await onExcluirVisual(id);
    } finally {
      setVisualExcluindoId(null);
    }
  };

  const handleAlternarTipo = async (visualId: string, novoTipo: TipoVisualDashboard) => {
    if (!onAlternarVisual) return;
    setVisualAlternandoId(visualId);
    try {
      await onAlternarVisual(visualId, novoTipo);
    } finally {
      setVisualAlternandoId(null);
    }
  };

  return (
    <div data-testid="dashboard-visuals-container" className="space-y-4">
      {/* 1. CABEÇALHO COM CONTADOR E FILTRO POR PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Visuais Registrados</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-mono font-normal">
              {visuais.length}
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Composição gráfica, justificativas analíticas DataViz e vinculação com DAX
          </p>
        </div>

        <div className="flex items-center gap-2">
          {paginas.length > 1 && (
            <select
              data-testid="filtro-pagina-visuals"
              value={filtroPaginaId}
              onChange={(e) => setFiltroPaginaId(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
            >
              <option value="TODAS">Todas as Páginas ({visuais.length})</option>
              {paginas.map((pag) => (
                <option key={pag.id} value={pag.id}>
                  {pag.ordem}. {pag.nome}
                </option>
              ))}
            </select>
          )}

          {onOpenCreateModal && (
            <button
              type="button"
              onClick={onOpenCreateModal}
              data-testid="btn-novo-visual-manual"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-500 transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Novo Visual</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. ESTADO VAZIO */}
      {visuaisFiltrados.length === 0 ? (
        <Card data-testid="dashboard-visuals-empty" className="p-8 text-center border-slate-800 bg-slate-900/60">
          <div className="h-10 w-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-3 text-purple-400">
            <PieChart className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-semibold text-white">Nenhum Visual Encontrado</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
            {filtroPaginaId !== 'TODAS'
              ? 'Não há visuais registrados para a página selecionada.'
              : 'Gere uma proposta automática na aba de Páginas ou cadastre componentes visuais manualmente.'}
          </p>
        </Card>
      ) : (
        /* 3. GRID DE VISUAIS COM JUSTIFICATIVA DATAVIZ */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {visuaisFiltrados.map((visual) => {
            const pagina = paginas.find((p) => p.id === visual.pagina_id);
            const conceito = obterConceitoDataViz(visual.tipo_visual);
            const isExpandido = visualExpandidoId === visual.id;

            // Medidas vinculadas
            const medidasVinculadas = medidas.filter((m) =>
              visual.medidas_utilizadas_ids?.includes(m.id)
            );

            return (
              <Card
                key={visual.id}
                data-testid={`visual-dashboard-card-${visual.id}`}
                className="p-4 border-slate-800 bg-slate-900/80 hover:border-slate-700 transition-colors flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Topo do Card */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-800/60 pb-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-purple-400 flex-shrink-0" />
                        <h4 className="text-sm font-bold text-white line-clamp-1">{visual.titulo}</h4>
                      </div>
                      {pagina && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Layers className="h-3 w-3 text-slate-500" />
                          <span>Página: {pagina.nome}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950/80 border border-purple-800/60 text-purple-300 font-semibold">
                        {ROTULOS_TIPO_VISUAL_DASHBOARD[visual.tipo_visual] || visual.tipo_visual}
                      </span>

                      {onExcluirVisual && (
                        <button
                          type="button"
                          onClick={() => handleExcluir(visual.id)}
                          disabled={visualExcluindoId === visual.id}
                          data-testid={`btn-excluir-visual-${visual.id}`}
                          title="Excluir visual"
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        >
                          {visualExcluindoId === visual.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Informações de Slot e Rastreabilidade */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Compass className="h-3 w-3 text-slate-500" />
                      <span>{ROTULOS_POSICAO_LAYOUT_VISUAL[visual.posicao_layout] || visual.posicao_layout}</span>
                    </span>

                    <span className="font-mono text-slate-400">
                      {visual.medidas_utilizadas_ids?.length ?? 0} medida(s) DAX vinculada(s)
                    </span>
                  </div>

                  {/* Pills de Medidas */}
                  {medidasVinculadas.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {medidasVinculadas.map((m) => (
                        <span
                          key={m.id}
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-blue-300"
                        >
                          [{m.nome}]
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Resumo da Justificativa */}
                  {visual.justificativa_dataviz && !isExpandido && (
                    <div className="p-2 rounded bg-slate-950/60 border border-slate-800/40 text-slate-300 text-[11px]">
                      <span className="font-semibold text-slate-400 block mb-0.5">
                        Justificativa Analítica:
                      </span>
                      <p className="line-clamp-2 leading-relaxed">{visual.justificativa_dataviz}</p>
                    </div>
                  )}

                  {/* Seção Expandida: APRENDA ENQUANTO TRABALHA */}
                  {isExpandido && (
                    <div
                      data-testid={`dataviz-pedagogy-details-${visual.id}`}
                      className="p-3 rounded-lg bg-slate-950 border border-purple-900/40 text-xs space-y-2.5 animate-in fade-in duration-150"
                    >
                      <div className="flex items-center gap-1.5 text-purple-300 font-bold text-[11px]">
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>Aprenda Enquanto Trabalha: {conceito.nomeLegivel}</span>
                      </div>

                      <div className="space-y-1 text-slate-300 text-[11px] leading-relaxed">
                        <p>
                          <strong className="text-slate-400">O que é: </strong>
                          {conceito.oQueE}
                        </p>
                        <p>
                          <strong className="text-slate-400">Quando utilizar: </strong>
                          {conceito.quandoUtilizar}
                        </p>
                        <p>
                          <strong className="text-slate-400">Quando evitar: </strong>
                          {conceito.quandoEvitar}
                        </p>
                        <p className="text-purple-200/90 italic pt-1 border-t border-slate-800">
                          💡 <strong>Dica Profissional: </strong>
                          {conceito.dicaProfissional}
                        </p>
                      </div>

                      {/* Alternativas Analíticas Recomendadas */}
                      {conceito.alternativasComuns.length > 0 && (
                        <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Alternativas Analíticas Recomendadas:
                          </span>
                          <div className="space-y-1">
                            {conceito.alternativasComuns.map((alt, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between gap-2 p-1.5 rounded bg-slate-900 border border-slate-800 text-[10px]"
                              >
                                <div className="space-y-0.5">
                                  <span className="font-semibold text-purple-300">
                                    {ROTULOS_TIPO_VISUAL_DASHBOARD[alt.tipo] || alt.tipo}
                                  </span>
                                  <p className="text-slate-400">{alt.motivo}</p>
                                </div>

                                {onAlternarVisual && (
                                  <button
                                    type="button"
                                    onClick={() => handleAlternarTipo(visual.id, alt.tipo)}
                                    disabled={visualAlternandoId === visual.id}
                                    data-testid={`btn-alternar-visual-${visual.id}-${alt.tipo}`}
                                    className="px-2 py-1 rounded bg-purple-950 border border-purple-800 text-purple-200 hover:bg-purple-900 transition-colors flex items-center gap-1 flex-shrink-0"
                                  >
                                    <ArrowRightLeft className="h-3 w-3" />
                                    <span>Alternar</span>
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Rodapé com Botão de Expansão Pedagógica */}
                <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                  <button
                    type="button"
                    onClick={() => toggleExpandir(visual.id)}
                    data-testid={`btn-toggle-dataviz-${visual.id}`}
                    className="text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                  >
                    <span>{isExpandido ? 'Ocultar Justificativa' : 'Ver Por Quê & Boas Práticas'}</span>
                    {isExpandido ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>

                  <span className="text-slate-500 font-mono text-[10px]">
                    Posição #{visual.ordem}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
