'use client';

import React from 'react';
import {
  TrendingUp,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Info,
  FunctionSquare,
  Scale,
  Percent,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { ModeloAnaliticoCompleto } from '@/core/domain/entities/modelo-analitico';
import { MetricaAnalitica } from '@/core/domain/entities/metrica-analitica';
import { TipoAgregacaoMetrica } from '@/core/domain/enums/tipo-agregacao-metrica';
import { TipoAditividadeMetrica } from '@/core/domain/enums/tipo-aditividade-metrica';
import { UnidadeMedidaMetrica } from '@/core/domain/enums/unidade-medida-metrica';

interface MetricsSectionProps {
  modelo: ModeloAnaliticoCompleto;
  onOpenCreateMetric: () => void;
  onOpenEditMetric: (metrica: MetricaAnalitica) => void;
  onDeleteMetric: (metricaId: string, nome: string) => void;
  isReadOnly?: boolean;
}

export function MetricsSection({
  modelo,
  onOpenCreateMetric,
  onOpenEditMetric,
  onDeleteMetric,
  isReadOnly = false,
}: MetricsSectionProps) {
  const getEntidadeNome = (id?: string | null) => {
    if (!id) return 'Modelo Global';
    const ent = modelo.entidades.find((e) => e.id === id);
    return ent ? ent.nome : id;
  };

  return (
    <Card className="p-6 bg-slate-900/80 border-slate-800 space-y-5" data-testid="metrics-section">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Métricas & Indicadores Semânticos</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Definição de cálculos declarativos, tipo de agregação, aditividade matemática e base de reconciliação.
          </p>
        </div>

        {!isReadOnly && (
          <button
            type="button"
            onClick={onOpenCreateMetric}
            data-testid="btn-open-create-metric"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors shadow-sm shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Cadastrar Métrica</span>
          </button>
        )}
      </div>

      {modelo.metricas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center space-y-2">
          <Info className="h-6 w-6 text-slate-500 mx-auto" />
          <p className="text-xs font-medium text-slate-300">Nenhuma métrica analítica cadastrada.</p>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Pela regra <em>M-05</em>, o modelo analítico requer ao menos uma métrica semântica cadastrada para atender aos requisitos de análise.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {modelo.metricas.map((metrica) => {
            const ehPercentualOuRazao =
              metrica.unidade_medida === UnidadeMedidaMetrica.PERCENTUAL ||
              metrica.unidade_medida === UnidadeMedidaMetrica.INDICE ||
              metrica.tipo_agregacao === TipoAgregacaoMetrica.MEDIA ||
              metrica.formula_declarativa.includes('/');

            const ehTotalmenteAditivaComSoma =
              metrica.tipo_aditividade === TipoAditividadeMetrica.TOTALMENTE_ADITIVA &&
              (metrica.tipo_agregacao === TipoAgregacaoMetrica.SOMA ||
                metrica.formula_declarativa.toUpperCase().includes('SUM'));

            const inconsistenciaM04 = ehPercentualOuRazao && ehTotalmenteAditivaComSoma;

            return (
              <div
                key={metrica.id}
                className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3"
                data-testid={`metric-item-${metrica.id}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-white" data-testid={`metric-name-${metrica.id}`}>
                        {metrica.nome}
                      </span>

                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                        {metrica.tipo_agregacao}
                      </span>

                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                        {metrica.tipo_aditividade}
                      </span>

                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950 text-blue-400 border border-blue-800/80">
                        {metrica.unidade_medida}
                      </span>

                      <span className="text-[11px] text-slate-500">
                        ({getEntidadeNome(metrica.entidade_id)})
                      </span>
                    </div>

                    {/* Fórmula Declarativa */}
                    <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-300 bg-slate-900/90 border border-slate-800 rounded px-2.5 py-1 w-fit">
                      <FunctionSquare className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                      <span>{metrica.formula_declarativa}</span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {metrica.descricao || 'Sem descrição negocial cadastrada.'}
                    </p>
                  </div>

                  {/* Ações */}
                  {!isReadOnly && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onOpenEditMetric(metrica)}
                        data-testid={`btn-edit-metric-${metrica.id}`}
                        className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors"
                        title="Editar métrica"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteMetric(metrica.id, metrica.nome)}
                        data-testid={`btn-delete-metric-${metrica.id}`}
                        className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-rose-400 hover:border-rose-900/60 transition-colors"
                        title="Remover métrica"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Inconsistência Matemática (M-04) */}
                {inconsistenciaM04 && (
                  <div
                    className="rounded-lg bg-red-950/40 border border-red-800/60 p-2.5 text-xs text-red-300 space-y-1"
                    data-testid={`metric-inconsistency-${metrica.id}`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-red-200">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                      <span>Bloqueio M-04: Inconsistência Matemática de Aditividade</span>
                    </div>
                    <p className="text-[11px] text-red-300/90 leading-relaxed">
                      Esta métrica é percentual/média/razão mas foi configurada como TOTALMENTE_ADITIVA com soma direta. Altere a aditividade para <strong>NAO_ADITIVA</strong> para evitar distorções graves.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
