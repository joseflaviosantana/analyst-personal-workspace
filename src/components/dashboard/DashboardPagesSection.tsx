'use client';

/**
 * src/components/dashboard/DashboardPagesSection.tsx
 *
 * Bloco 3 — Páginas do Dashboard (Subgate 3.4D)
 *
 * Implementa a fundação do Premium Dashboard Automation + Human-in-the-Loop:
 * - Geração determinística de proposta completa de páginas a partir do modelo analítico e DAX;
 * - Revisão e homologação humana explícita (Estados: PROPOSTO -> APROVADO);
 * - Seleção de templates estruturais profissionais (Executive, Analytical, Operational);
 * - Gestão manual de páginas (criação e exclusão atômica).
 */

import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Users,
  Layout,
  Eye,
  Sparkles,
  CheckCircle2,
  Trash2,
  HelpCircle,
  Loader2,
  XCircle,
  Layers,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { PaginaRelatorio } from '@/core/domain/entities/pagina-relatorio';
import { ROTULOS_PUBLICO_ALVO_PAGINA } from '@/core/domain/enums/publico-alvo-pagina';
import { ROTULOS_LAYOUT_GRID_PAGINA } from '@/core/domain/enums/layout-grid-pagina';
import { DashboardSpecification } from '@/core/domain/dashboard-automation/dashboard-specification';
import {
  ID_TEMPLATE_EXECUTIVE_PREMIUM,
  CATALOGO_TEMPLATES_PREMIUM,
  TEMPLATES_PREMIUM_DASHBOARD,
  TemplateDashboardDefinicao,
  TipoTemplateDashboard,
} from '@/core/domain/dashboard-design/dashboard-template';

interface DashboardPagesSectionProps {
  paginas: PaginaRelatorio[];
  isIsento?: boolean;
  demandaId?: string;
  modeloPowerBiId?: string;
  propostaAtual?: DashboardSpecification | null;
  isGerandoProposta?: boolean;
  isAprovandoProposta?: boolean;
  isReadOnly?: boolean;
  onGerarProposta?: (templateId: string) => Promise<void>;
  onAprovarProposta?: () => Promise<void>;
  onDescartarProposta?: () => void;
  onExcluirPagina?: (paginaId: string) => Promise<void>;
  onOpenCreateModal?: () => void;
  onNavegarParaVisuais?: (paginaId?: string) => void;
}

export function DashboardPagesSection({
  paginas,
  isIsento = false,
  propostaAtual = null,
  isGerandoProposta = false,
  isAprovandoProposta = false,
  isReadOnly = false,
  onGerarProposta,
  onAprovarProposta,
  onDescartarProposta,
  onExcluirPagina,
  onOpenCreateModal,
  onNavegarParaVisuais,
}: DashboardPagesSectionProps) {
  const [templateSelecionado, setTemplateSelecionado] = useState<string>(
    ID_TEMPLATE_EXECUTIVE_PREMIUM
  );
  const [paginaExcluindoId, setPaginaExcluindoId] = useState<string | null>(null);

  if (isIsento) {
    return (
      <Card data-testid="dashboard-pages-isento" className="p-6 text-center border-slate-800 bg-slate-900/60">
        <BookOpen className="h-8 w-8 text-slate-500 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-white">Etapa Isenta de Páginas de Relatório</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          Esta demanda opera sob isenção formal de Power BI (Excel-only). Nenhuma página visual é requerida para homologação.
        </p>
      </Card>
    );
  }

  const handleGerar = async () => {
    if (onGerarProposta) {
      await onGerarProposta(templateSelecionado);
    }
  };

  const handleExcluir = async (id: string) => {
    if (!onExcluirPagina) return;
    setPaginaExcluindoId(id);
    try {
      await onExcluirPagina(id);
    } finally {
      setPaginaExcluindoId(null);
    }
  };

  return (
    <div data-testid="dashboard-pages-container" className="space-y-5">
      {/* 1. SEÇÃO DE PROPOSTA EM REVISÃO (HUMAN-IN-THE-LOOP) */}
      {propostaAtual && (
        <Card
          data-testid="dashboard-proposal-banner"
          className="p-5 border-amber-600/40 bg-amber-950/20 shadow-lg space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-800/40 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">
                    Proposta de Dashboard — Human-in-the-Loop
                  </h3>
                  <span
                    data-testid="status-proposta-badge"
                    className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-300"
                  >
                    {propostaAtual.statusGeral}
                  </span>
                </div>
                <p className="text-xs text-amber-200/80 mt-0.5">
                  Template:{' '}
                  <span className="font-semibold text-white">
                    {CATALOGO_TEMPLATES_PREMIUM[propostaAtual.templateUtilizado]?.nome ??
                      propostaAtual.templateUtilizado}
                  </span>{' '}
                  · {propostaAtual.paginas.length} página(s) proposta(s)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isReadOnly && onDescartarProposta && (
                <button
                  type="button"
                  onClick={onDescartarProposta}
                  disabled={isAprovandoProposta}
                  data-testid="btn-descartar-proposta"
                  className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Descartar
                </button>
              )}

              {!isReadOnly && onAprovarProposta && (
                <button
                  type="button"
                  onClick={onAprovarProposta}
                  disabled={isAprovandoProposta}
                  data-testid="btn-aprovar-proposta"
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors shadow-sm disabled:opacity-50"
                >
                  {isAprovandoProposta ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  <span>Aprovar e Materializar Proposta</span>
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400/90">
              Páginas Propostas para Homologação:
            </h4>

            <div className="grid grid-cols-1 gap-2.5">
              {propostaAtual.paginas.map((pag) => (
                <div
                  key={pag.id}
                  data-testid={`proposta-pagina-${pag.id}`}
                  className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-[10px]">
                        {pag.ordem}
                      </span>
                      <span className="font-bold text-white text-sm">{pag.nome}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 border border-blue-800 text-blue-300">
                        {ROTULOS_PUBLICO_ALVO_PAGINA[pag.publicoAlvo] || pag.publicoAlvo}
                      </span>
                    </div>

                    <span className="text-slate-400 font-mono text-[11px]">
                      {pag.visuais.length} visual(is) planejado(s)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-300 text-[11px] pt-1 border-t border-slate-800/60">
                    <div>
                      <span className="text-slate-500 font-semibold block">Objetivo:</span>
                      <p className="line-clamp-2">{pag.objetivoAnalitico}</p>
                    </div>

                    <div>
                      <span className="text-slate-500 font-semibold block">Justificativa Analítica:</span>
                      <p className="line-clamp-2 text-slate-400">{pag.justificativa}</p>
                    </div>
                  </div>

                  {pag.perguntasAtendidas.length > 0 && (
                    <div className="text-[11px] text-slate-400">
                      <span className="text-slate-500 font-semibold">Responde a: </span>
                      {pag.perguntasAtendidas.join(' · ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* 2. CABEÇALHO DA SEÇÃO E AÇÕES PRINCIPAIS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Páginas do Relatório</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-mono font-normal">
              {paginas.length}
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Estrutura narrativa, objetivos analíticos e distribuição de público-alvo
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isReadOnly && onOpenCreateModal && (
            <button
              type="button"
              onClick={onOpenCreateModal}
              data-testid="btn-nova-pagina-manual"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-white text-xs font-medium hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Nova Página Manual</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. GERADOR DE PROPOSTA AUTOMÁTICA (CARD OPERACIONAL) */}
      {!propostaAtual && !isReadOnly && (
        <Card
          data-testid="dashboard-planner-cta"
          className="p-4 border-indigo-900/40 bg-indigo-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Dashboard Automation (Planner Determinístico)
              </h4>
            </div>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Gera automaticamente uma proposta inicial de páginas e visuais com base nas perguntas de
              negócio, métricas e DAX cadastrados, com total justificativa DataViz para sua revisão humana.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <select
              data-testid="select-template-dashboard"
              value={templateSelecionado}
              onChange={(e) => setTemplateSelecionado(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-indigo-800/60 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              {TEMPLATES_PREMIUM_DASHBOARD.map((t: TemplateDashboardDefinicao) => (
                <option key={t.tipo} value={t.tipo}>
                  {t.nome}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleGerar}
              disabled={isGerandoProposta}
              data-testid="btn-gerar-proposta"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-colors shadow-sm disabled:opacity-50"
            >
              {isGerandoProposta ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              <span>{paginas.length === 0 ? 'Gerar Proposta Inicial' : 'Regenerar Proposta'}</span>
            </button>
          </div>
        </Card>
      )}

      {/* 4. LISTA DE PÁGINAS PERSISTIDAS OU ESTADO VAZIO */}
      {paginas.length === 0 && !propostaAtual ? (
        <Card data-testid="dashboard-pages-empty" className="p-8 text-center border-slate-800 bg-slate-900/60">
          <div className="h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-3 text-indigo-400">
            <BookOpen className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-semibold text-white">Nenhuma Página Registrada no Modelo</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
            Utilize o botão acima para <strong>Gerar Proposta Inicial</strong> com suporte de DataViz ou
            adicione páginas manualmente caso prefira estruturar o relatório do zero.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {paginas.map((pagina) => (
            <Card
              key={pagina.id}
              data-testid={`pagina-relatorio-card-${pagina.id}`}
              className="p-4 border-slate-800 bg-slate-900/80 hover:border-slate-700 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 border-b border-slate-800/60 pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300">
                      {pagina.ordem}
                    </span>
                    <h4 className="text-sm font-bold text-white">{pagina.nome}</h4>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950/80 border border-blue-800/60 text-blue-300 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{ROTULOS_PUBLICO_ALVO_PAGINA[pagina.publico_alvo] || pagina.publico_alvo}</span>
                    </span>

                    {!isReadOnly && onExcluirPagina && (
                      <button
                        type="button"
                        onClick={() => handleExcluir(pagina.id)}
                        disabled={paginaExcluindoId === pagina.id}
                        data-testid={`btn-excluir-pagina-${pagina.id}`}
                        title="Excluir página"
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      >
                        {paginaExcluindoId === pagina.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-slate-500 font-medium block">Objetivo Analítico:</span>
                    <p className="text-slate-300 mt-0.5 line-clamp-2">
                      {pagina.objetivo_analitico || 'Nenhum objetivo analítico formalmente declarado.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Layout className="h-3 w-3 text-slate-500" />
                  <span>{ROTULOS_LAYOUT_GRID_PAGINA[pagina.layout_grid] || pagina.layout_grid}</span>
                </span>

                {onNavegarParaVisuais && (
                  <button
                    type="button"
                    onClick={() => onNavegarParaVisuais(pagina.id)}
                    data-testid={`btn-ver-visuais-pagina-${pagina.id}`}
                    className="text-blue-400 hover:text-blue-300 cursor-pointer flex items-center gap-1 font-medium"
                  >
                    <Eye className="h-3 w-3" />
                    <span>Ver Visuais</span>
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
