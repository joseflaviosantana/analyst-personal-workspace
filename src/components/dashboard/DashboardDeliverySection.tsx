'use client';

/**
 * src/components/dashboard/DashboardDeliverySection.tsx
 *
 * Bloco 6 da Aba 7: Entrega, Exportação & Governança (Subgate 3.4E)
 *
 * Responsabilidade:
 * - Apresentar status global de prontidão da entrega da etapa Power BI & Dashboard;
 * - Exibir checklist determinístico interativo (11 itens estruturais);
 * - Visualizar e copiar o memorial descritivo em Markdown;
 * - Oferecer exportações em Markdown (.md), Pacote Estruturado (.json) e TMDL (.tmdl);
 * - Apresentar a ficha estruturada de portfólio (salvaguarda de confidencialidade);
 * - Respeitar o Progressive Disclosure com navegação focada e sem poluição visual.
 */

import React, { useState } from 'react';
import { clsx } from 'clsx';
import {
  PackageCheck,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Download,
  Copy,
  Check,
  FileText,
  FileCode,
  Briefcase,
  Layers,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import {
  PacoteEntregaDashboard,
  ItemChecklistEntrega,
} from '@/core/domain/dashboard-delivery/dashboard-delivery-types';

interface DashboardDeliverySectionProps {
  pacote: PacoteEntregaDashboard | null;
  documentacaoMarkdown: string;
  pacoteJson: string;
  medidasTmdl: string;
  manifestoLayoutJson: string;
  isLoading: boolean;
  onRecarregarPacote: () => void;
  isIsento?: boolean;
}

export function DashboardDeliverySection({
  pacote,
  documentacaoMarkdown,
  pacoteJson,
  medidasTmdl,
  manifestoLayoutJson,
  isLoading,
  onRecarregarPacote,
  isIsento = false,
}: DashboardDeliverySectionProps) {
  const [abaInterna, setAbaInterna] = useState<'checklist' | 'documentacao' | 'portfolio'>('checklist');
  const [copiado, setCopiado] = useState(false);
  const [itemChecklistExpandido, setItemChecklistExpandido] = useState<string | null>(null);

  const handleCopiarMarkdown = async () => {
    if (!documentacaoMarkdown) return;
    try {
      await navigator.clipboard.writeText(documentacaoMarkdown);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleDownloadArquivo = (conteudo: string, nomeArquivo: string, tipoMime: string) => {
    const blob = new Blob([conteudo], { type: tipoMime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!pacote && isLoading) {
    return (
      <Card className="p-8 text-center border-slate-800 bg-slate-900/60">
        <Clock className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-300 font-medium">Consolidando Pacote de Entrega e Checklist...</p>
        <p className="text-xs text-slate-500 mt-1">
          Avaliando conformidade normativa, rastreabilidade DataViz e gerando memorial descritivo.
        </p>
      </Card>
    );
  }

  if (!pacote) {
    return (
      <Card className="p-8 text-center border-slate-800 bg-slate-900/60">
        <AlertOctagon className="w-8 h-8 text-amber-400 mx-auto mb-3" />
        <p className="text-sm text-slate-300 font-medium">Nenhum Pacote de Entrega Gerado</p>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          Gere o pacote para consolidar os artefatos de Power BI, DAX e Dashboard.
        </p>
        <button
          type="button"
          onClick={onRecarregarPacote}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
        >
          Gerar Pacote de Entrega Agora
        </button>
      </Card>
    );
  }

  const { checklist, statusEntrega, casePortfolio, demanda } = pacote;

  const statusBadgeConfig = {
    PRONTO_PARA_ENTREGA: {
      bg: 'bg-emerald-950/70 text-emerald-300 border-emerald-700/80',
      icon: CheckCircle2,
      texto: 'Pronto para Entrega',
      subtexto: 'Zero bloqueios normativos detectados. Apto para avanço no workflow.',
    },
    BLOQUEADO: {
      bg: 'bg-rose-950/70 text-rose-300 border-rose-700/80',
      icon: AlertOctagon,
      texto: 'Bloqueio Impeditivo',
      subtexto: `${checklist.totalBloqueados} item(ns) bloqueado(s) exigem resolução antes do avanço.`,
    },
    EM_DESENVOLVIMENTO: {
      bg: 'bg-amber-950/70 text-amber-300 border-amber-700/80',
      icon: Clock,
      texto: 'Em Desenvolvimento',
      subtexto: 'Artefatos em estruturação. Conclua as pendências antes da entrega formal.',
    },
  }[statusEntrega];

  const StatusIcon = statusBadgeConfig.icon;

  return (
    <div data-testid="dashboard-delivery-section" className="space-y-4">
      {/* 1. Banner Superior de Síntese da Entrega */}
      <Card className="p-5 border-slate-800 bg-slate-900/80 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={clsx('p-2.5 rounded-lg border', statusBadgeConfig.bg)}>
              <StatusIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Governança da Etapa
                </span>
                <span
                  className={clsx(
                    'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                    statusBadgeConfig.bg
                  )}
                >
                  {statusBadgeConfig.texto}
                </span>
                {isIsento && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    Isento Excel-Only
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-white mt-1">
                Pacote de Entrega — {demanda.titulo}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">{statusBadgeConfig.subtexto}</p>
            </div>
          </div>

          {/* Taxa de Conclusão e Métricas */}
          <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-5">
            <div className="text-center">
              <span className="text-2xl font-extrabold text-white">
                {checklist.percentualConclusao}%
              </span>
              <span className="block text-[10px] uppercase tracking-wider text-slate-400">
                Checklist
              </span>
            </div>
            <div className="text-left text-xs space-y-0.5">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{checklist.totalConcluidos} concluído(s)</span>
              </div>
              {checklist.totalPendentes > 0 && (
                <div className="flex items-center gap-1.5 text-amber-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{checklist.totalPendentes} pendente(s)</span>
                </div>
              )}
              {checklist.totalBloqueados > 0 && (
                <div className="flex items-center gap-1.5 text-rose-400 font-semibold">
                  <AlertOctagon className="w-3.5 h-3.5" />
                  <span>{checklist.totalBloqueados} bloqueio(s)</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Barra de Ações de Exportação Rápida */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="btn-export-markdown"
              onClick={() =>
                handleDownloadArquivo(
                  documentacaoMarkdown,
                  `memorial-dashboard-${demanda.id}.md`,
                  'text/markdown'
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-600/40 text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Memorial (.md)</span>
            </button>

            <button
              type="button"
              data-testid="btn-export-json"
              onClick={() =>
                handleDownloadArquivo(
                  pacoteJson,
                  `pacote-dashboard-${demanda.id}.json`,
                  'application/json'
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-600/40 text-xs font-medium transition-colors"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Exportar Pacote (.json)</span>
            </button>

            {pacote.catalogoMedidasDax.length > 0 && (
              <button
                type="button"
                data-testid="btn-export-tmdl"
                onClick={() =>
                  handleDownloadArquivo(
                    medidasTmdl,
                    `medidas-dax-${demanda.id}.tmdl`,
                    'text/plain'
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-600/40 text-xs font-medium transition-colors"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Exportar DAX TMDL (.tmdl)</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="btn-copy-markdown"
              onClick={handleCopiarMarkdown}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
            >
              {copiado ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Markdown</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Card>

      {/* 2. Navegador de Abas Internas (Progressive Disclosure) */}
      <div className="flex border-b border-slate-800 gap-1 text-xs">
        <button
          type="button"
          data-testid="tab-delivery-checklist"
          onClick={() => setAbaInterna('checklist')}
          className={clsx(
            'px-4 py-2.5 font-medium border-b-2 transition-colors flex items-center gap-2',
            abaInterna === 'checklist'
              ? 'border-blue-500 text-blue-300 bg-blue-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          )}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Checklist de Prontidão ({checklist.totalConcluidos}/{checklist.totalItens})</span>
        </button>

        <button
          type="button"
          data-testid="tab-delivery-documentation"
          onClick={() => setAbaInterna('documentacao')}
          className={clsx(
            'px-4 py-2.5 font-medium border-b-2 transition-colors flex items-center gap-2',
            abaInterna === 'documentacao'
              ? 'border-blue-500 text-blue-300 bg-blue-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          )}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Memorial Técnico Automático (Markdown)</span>
        </button>

        <button
          type="button"
          data-testid="tab-delivery-portfolio"
          onClick={() => setAbaInterna('portfolio')}
          className={clsx(
            'px-4 py-2.5 font-medium border-b-2 transition-colors flex items-center gap-2',
            abaInterna === 'portfolio'
              ? 'border-blue-500 text-blue-300 bg-blue-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          )}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Ficha de Portfólio (Estrutura Preparada)</span>
        </button>
      </div>

      {/* 3. Conteúdo da Aba 1: Checklist de Entrega */}
      {abaInterna === 'checklist' && (
        <Card className="p-4 border-slate-800 bg-slate-900/60 space-y-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Critérios Determinísticos de Prontidão
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Avaliação estritamente somente-leitura e auditável
            </span>
          </div>

          <div className="space-y-2">
            {checklist.itens.map((item) => {
              const isExpandido = itemChecklistExpandido === item.id;
              const statusCfg = {
                CONCLUIDO: {
                  badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
                  icon: CheckCircle2,
                  label: 'Concluído',
                },
                BLOQUEADO: {
                  badge: 'bg-rose-950/80 text-rose-300 border-rose-800',
                  icon: AlertOctagon,
                  label: 'Bloqueado',
                },
                PENDENTE: {
                  badge: 'bg-amber-950/80 text-amber-300 border-amber-800',
                  icon: Clock,
                  label: 'Pendente',
                },
                NAO_APLICAVEL: {
                  badge: 'bg-slate-800 text-slate-400 border-slate-700',
                  icon: ShieldCheck,
                  label: 'Isento / N/A',
                },
              }[item.status];

              const ItemIcon = statusCfg.icon;

              return (
                <div
                  key={item.id}
                  data-testid={`checklist-item-${item.id}`}
                  className={clsx(
                    'p-3 rounded-lg border transition-all text-xs',
                    item.status === 'BLOQUEADO'
                      ? 'border-rose-900/60 bg-rose-950/10'
                      : item.status === 'CONCLUIDO'
                      ? 'border-slate-800/80 bg-slate-900/40'
                      : 'border-slate-800 bg-slate-900/20'
                  )}
                >
                  <div
                    className="flex items-center justify-between cursor-pointer select-none"
                    onClick={() =>
                      setItemChecklistExpandido(isExpandido ? null : item.id)
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <ItemIcon
                        className={clsx(
                          'w-4 h-4 shrink-0',
                          item.status === 'CONCLUIDO' && 'text-emerald-400',
                          item.status === 'BLOQUEADO' && 'text-rose-400',
                          item.status === 'PENDENTE' && 'text-amber-400',
                          item.status === 'NAO_APLICAVEL' && 'text-slate-400'
                        )}
                      />
                      <div>
                        <span className="font-mono text-[11px] text-slate-500 mr-2">
                          {item.codigo}
                        </span>
                        <span className="font-semibold text-slate-200">
                          {item.titulo}
                        </span>
                        {item.obrigatorio && (
                          <span className="ml-2 text-[10px] text-rose-400 font-mono">
                            [Obrigatório]
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={clsx(
                          'px-2 py-0.5 rounded text-[10px] font-bold border',
                          statusCfg.badge
                        )}
                      >
                        {statusCfg.label}
                      </span>
                      {isExpandido ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Detalhes Expandidos */}
                  {isExpandido && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5 text-[11px] text-slate-400 pl-6">
                      <p className="leading-relaxed text-slate-300">{item.descricao}</p>
                      {item.evidencia && (
                        <p className="text-slate-400 font-mono bg-slate-950/40 p-2 rounded border border-slate-800">
                          <strong className="text-slate-300">Evidência:</strong> {item.evidencia}
                        </p>
                      )}
                      {item.acaoSugerida && (
                        <p className="text-amber-300 font-mono bg-amber-950/20 p-2 rounded border border-amber-900/40">
                          <strong>Ação sugerida:</strong> {item.acaoSugerida}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* 4. Conteúdo da Aba 2: Memorial Técnico em Markdown */}
      {abaInterna === 'documentacao' && (
        <Card className="p-4 border-slate-800 bg-slate-900/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Visualização da Documentação Automática
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopiarMarkdown}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700"
              >
                {copiado ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiado ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          <pre
            data-testid="documentation-markdown-preview"
            className="p-4 rounded-lg bg-slate-950/80 border border-slate-800/80 font-mono text-xs text-slate-300 overflow-x-auto max-h-[500px] overflow-y-auto whitespace-pre-wrap leading-relaxed select-text"
          >
            {documentacaoMarkdown}
          </pre>
        </Card>
      )}

      {/* 5. Conteúdo da Aba 3: Ficha Estrutural de Portfólio */}
      {abaInterna === 'portfolio' && (
        <Card className="p-5 border-slate-800 bg-slate-900/60 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                Ficha Técnica para Case de Portfólio
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">
                {casePortfolio.tituloCase}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Estrutura pré-formatada para futura exportação de case profissional. Nenhuma publicação externa é realizada.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded text-[11px] font-mono bg-purple-950/60 text-purple-300 border border-purple-800">
              Sanitizado
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 space-y-1">
              <span className="font-semibold text-slate-300 block">Problema de Negócio</span>
              <p className="text-slate-400 leading-relaxed">{casePortfolio.problemaNegocio}</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 space-y-1">
              <span className="font-semibold text-slate-300 block">Contexto Operacional</span>
              <p className="text-slate-400 leading-relaxed">{casePortfolio.contexto}</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 space-y-1 md:col-span-2">
              <span className="font-semibold text-slate-300 block">Processo Analítico Aplicado</span>
              <p className="text-slate-400 leading-relaxed">{casePortfolio.processoAplicado}</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 space-y-1">
              <span className="font-semibold text-slate-300 block">Ferramentas Utilizadas</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {casePortfolio.ferramentasUtilizadas.map((f, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 border border-slate-700"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 space-y-1">
              <span className="font-semibold text-slate-300 block">Métricas Chave</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {casePortfolio.metricasChave.map((m, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded text-[11px] bg-blue-950/50 text-blue-300 border border-blue-800"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 space-y-1 md:col-span-2">
              <span className="font-semibold text-slate-300 block">Decisões Metodológicas</span>
              <ul className="list-disc list-inside text-slate-400 space-y-1 mt-1">
                {casePortfolio.decisoesMetodologicas.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 space-y-1 md:col-span-2">
              <span className="font-semibold text-slate-300 block">Resultados e Aprendizados</span>
              <ul className="list-disc list-inside text-slate-400 space-y-1 mt-1">
                {casePortfolio.aprendizadosTecnicos.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
