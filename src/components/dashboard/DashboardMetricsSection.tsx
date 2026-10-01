'use client';

/**
 * src/components/dashboard/DashboardMetricsSection.tsx
 *
 * Bloco 2 — Métricas & DAX do Dashboard (Subgates 3.4A e 3.4C)
 *
 * Ambiente Operacional e Pedagógico para Gestão de Medidas DAX:
 * - Listagem, busca e filtragem por padrão de cálculo DAX e status de linhagem;
 * - Barra de cobertura semântica de métricas homologadas da Aba 6 (Regras D-02 e D-03);
 * - Ações diretas de Inspecionar (Linhagem & TMDL), Editar e Excluir;
 * - Suporte a cópia de fórmula DAX em um clique e visualização de formato;
 * - Empty states instrutivos e conformidade com isenção Excel-Only.
 */

import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Code2,
  Link2,
  Plus,
  Sparkles,
  Search,
  Filter,
  Eye,
  Edit3,
  Trash2,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { MedidaDax } from '@/core/domain/entities/medida-dax';
import { MetricaAnalitica } from '@/core/domain/entities/metrica-analitica';
import {
  CategoriaMedidaDax,
  ROTULOS_CATEGORIA_MEDIDA_DAX,
} from '@/core/domain/enums/categoria-medida-dax';

interface DashboardMetricsSectionProps {
  medidas: MedidaDax[];
  isIsento?: boolean;
  modeloPowerBiId?: string;
  modeloPowerBiNome?: string;
  demandaId?: string;
  metricasHomologadas?: MetricaAnalitica[];
  modeloAnaliticoNome?: string | null;
  datasetNome?: string | null;
  isReadOnly?: boolean;
  onOpenCreateModal?: (metricaSugeridaId?: string) => void;
  onOpenEditModal?: (medida: MedidaDax) => void;
  onOpenInspectModal?: (medida: MedidaDax) => void;
  onOpenDeleteModal?: (medida: MedidaDax) => void;
}

export function DashboardMetricsSection({
  medidas = [],
  isIsento = false,
  modeloPowerBiId,
  modeloPowerBiNome,
  demandaId,
  metricasHomologadas = [],
  modeloAnaliticoNome,
  datasetNome,
  isReadOnly = false,
  onOpenCreateModal,
  onOpenEditModal,
  onOpenInspectModal,
  onOpenDeleteModal,
}: DashboardMetricsSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('TODAS');
  const [selectedLinhagem, setSelectedLinhagem] = useState<'TODAS' | 'VINCULADAS' | 'AUXILIARES'>('TODAS');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Mapa de métricas homologadas por ID para consulta rápida de nomes
  const metricasMap = useMemo(() => {
    const map = new Map<string, MetricaAnalitica>();
    for (const m of metricasHomologadas) {
      map.set(m.id, m);
    }
    return map;
  }, [metricasHomologadas]);

  // Métricas cobertas vs não cobertas (Regra D-02)
  const metricasCobertasIds = useMemo(() => {
    return new Set(medidas.map((m) => m.metrica_analitica_id).filter(Boolean));
  }, [medidas]);

  const metricasNaoCobertas = useMemo(() => {
    return metricasHomologadas.filter((m) => !metricasCobertasIds.has(m.id));
  }, [metricasHomologadas, metricasCobertasIds]);

  // Filtros combinados
  const filteredMedidas = useMemo(() => {
    return medidas.filter((m) => {
      const matchSearch =
        m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.tabela_hospedeira.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.descricao && m.descricao.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchCat =
        selectedCategoria === 'TODAS' || m.categoria_dax === selectedCategoria;

      const matchLinhagem =
        selectedLinhagem === 'TODAS' ||
        (selectedLinhagem === 'VINCULADAS' && Boolean(m.metrica_analitica_id)) ||
        (selectedLinhagem === 'AUXILIARES' && !m.metrica_analitica_id);

      return matchSearch && matchCat && matchLinhagem;
    });
  }, [medidas, searchTerm, selectedCategoria, selectedLinhagem]);

  const handleCopyFormula = (id: string, formula: string) => {
    navigator.clipboard.writeText(formula);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 1. Estado Isento (Excel-Only)
  if (isIsento) {
    return (
      <Card data-testid="dashboard-metrics-isento" className="p-6 text-center border-emerald-900/60 bg-emerald-950/20">
        <Calculator className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-white">Etapa Isenta de Medidas DAX</h3>
        <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto leading-relaxed">
          Esta demanda opera sob declaração formal de isenção de Power BI (Excel-only). Os cálculos analíticos são consumidos diretamente em formato tabular sem necessidade de fórmulas DAX (Regra D-08).
        </p>
      </Card>
    );
  }

  return (
    <div data-testid="dashboard-metrics-content" className="space-y-4">
      {/* 2. Barra de Cobertura de Métricas Homologadas (Regra D-02) */}
      {metricasHomologadas.length > 0 && (
        <Card
          data-testid="metrics-coverage-banner"
          className="p-4 border-slate-800 bg-slate-900/90 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  metricasNaoCobertas.length === 0
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {metricasNaoCobertas.length === 0 ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">
                    Cobertura de Métricas Homologadas (Regra D-02):
                  </span>
                  <span className="text-xs font-mono font-semibold text-blue-400">
                    {metricasHomologadas.length - metricasNaoCobertas.length} de{' '}
                    {metricasHomologadas.length} implementada(s)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {metricasNaoCobertas.length === 0
                    ? 'Todas as métricas de negócio acordadas na Modelagem possuem medidas DAX correspondentes.'
                    : `${metricasNaoCobertas.length} métrica(s) aprovada(s) ainda aguarda(m) implementação em DAX.`}
                </p>
              </div>
            </div>

            {metricasNaoCobertas.length > 0 && !isReadOnly && onOpenCreateModal && (
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => onOpenCreateModal(metricasNaoCobertas[0].id)}
                  data-testid="btn-cover-next-metric"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/90 hover:bg-blue-600 text-white text-xs font-semibold transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Implementar "{metricasNaoCobertas[0].nome}"</span>
                </button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* 3. Cabeçalho de Ações e Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Catálogo de Medidas DAX</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-mono font-normal">
              {medidas.length}
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Especificações de cálculo tabular e rastreabilidade com o modelo semântico
          </p>
        </div>

        {!isReadOnly && onOpenCreateModal && (
          <button
            type="button"
            onClick={() => onOpenCreateModal()}
            data-testid="btn-add-medida-dax"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 font-semibold text-white text-xs hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/30 flex-shrink-0 self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Medida DAX</span>
          </button>
        )}
      </div>

      {/* 4. Barra de Busca e Filtros Rápidos */}
      {medidas.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, tabela ou descrição..."
              data-testid="input-search-medidas"
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950 text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none text-xs"
            />
          </div>

          <select
            value={selectedCategoria}
            onChange={(e) => setSelectedCategoria(e.target.value)}
            data-testid="select-filter-categoria"
            className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-950 text-white focus:border-blue-500 focus:outline-none text-xs"
          >
            <option value="TODAS">Todas as Categorias</option>
            {Object.entries(ROTULOS_CATEGORIA_MEDIDA_DAX).map(([cat, label]) => (
              <option key={cat} value={cat}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={selectedLinhagem}
            onChange={(e) => setSelectedLinhagem(e.target.value as any)}
            data-testid="select-filter-linhagem"
            className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-950 text-white focus:border-blue-500 focus:outline-none text-xs"
          >
            <option value="TODAS">Toda Linhagem</option>
            <option value="VINCULADAS">Com Métrica Homologada</option>
            <option value="AUXILIARES">Medidas Auxiliares</option>
          </select>
        </div>
      )}

      {/* 5. Lista de Medidas ou Estado Vazio */}
      {medidas.length === 0 ? (
        <Card data-testid="dashboard-metrics-empty" className="p-8 text-center border-slate-800 bg-slate-900/60">
          <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-3 text-blue-400">
            <Calculator className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-white">Nenhuma Medida DAX Cadastrada</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
            As medidas DAX implementam o cálculo formal das métricas homologadas no Power BI.
            Elas garantem governança analítica e evitam cálculos implícitos frágeis.
          </p>
          {onOpenCreateModal && (
            <div className="mt-5">
              <button
                type="button"
                onClick={() => onOpenCreateModal()}
                data-testid="btn-add-first-medida"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 font-semibold text-white text-xs hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/30"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Adicionar Primeira Medida DAX</span>
              </button>
            </div>
          )}
        </Card>
      ) : filteredMedidas.length === 0 ? (
        <Card className="p-6 text-center border-slate-800 bg-slate-900/60 text-xs text-slate-400">
          Nenhuma medida DAX corresponde aos filtros selecionados.
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredMedidas.map((medida) => {
            const metricaVinculada = medida.metrica_analitica_id
              ? metricasMap.get(medida.metrica_analitica_id)
              : null;

            return (
              <Card
                key={medida.id}
                data-testid={`medida-dax-card-${medida.id}`}
                className="p-4 border-slate-800 bg-slate-900/90 hover:border-slate-700/80 transition-all space-y-3 shadow-sm"
              >
                {/* Linha Superior: Nome, Tabela e Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-500">[{medida.tabela_hospedeira}]</span>
                    <h4 className="text-sm font-bold text-white">{medida.nome}</h4>
                    {medida.formato_string && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800/80 border border-slate-700 font-mono text-slate-300">
                        {medida.formato_string}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700/60 text-slate-300">
                      {ROTULOS_CATEGORIA_MEDIDA_DAX[medida.categoria_dax] || medida.categoria_dax}
                    </span>

                    {metricaVinculada ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 flex items-center gap-1">
                        <Link2 className="h-3 w-3" />
                        <span>Métrica: {metricaVinculada.nome}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800/60 text-slate-500">
                        Medida Auxiliar
                      </span>
                    )}
                  </div>
                </div>

                {/* Fórmula DAX com botão de cópia */}
                <div className="relative rounded-lg bg-slate-950 border border-slate-800/80 p-3 font-mono text-xs text-blue-200 overflow-x-auto whitespace-pre leading-relaxed group">
                  <code>{medida.expressao_dax}</code>
                  <button
                    type="button"
                    onClick={() => handleCopyFormula(medida.id, medida.expressao_dax)}
                    title="Copiar fórmula DAX"
                    aria-label="Copiar fórmula DAX"
                    className="absolute top-2 right-2 p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors opacity-80 group-hover:opacity-100"
                  >
                    {copiedId === medida.id ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                {/* Descrição e Barra Inferior de Ações */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs">
                  <div className="text-slate-400 italic text-[11px] truncate max-w-md">
                    {medida.descricao || 'Sem descrição funcional cadastrada.'}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {onOpenInspectModal && (
                      <button
                        type="button"
                        onClick={() => onOpenInspectModal(medida)}
                        data-testid={`btn-inspect-medida-${medida.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors text-[11px]"
                      >
                        <Eye className="h-3 w-3 text-blue-400" />
                        <span>Inspecionar</span>
                      </button>
                    )}

                    {!isReadOnly && onOpenEditModal && (
                      <button
                        type="button"
                        onClick={() => onOpenEditModal(medida)}
                        data-testid={`btn-edit-medida-${medida.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors text-[11px]"
                      >
                        <Edit3 className="h-3 w-3 text-amber-400" />
                        <span>Editar</span>
                      </button>
                    )}

                    {!isReadOnly && onOpenDeleteModal && (
                      <button
                        type="button"
                        onClick={() => onOpenDeleteModal(medida)}
                        data-testid={`btn-delete-medida-${medida.id}`}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-slate-800 bg-slate-900 text-slate-400 hover:text-rose-400 hover:border-rose-900/60 transition-colors text-[11px]"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
