'use client';

import React from 'react';
import {
  GitFork,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeftRight,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { ModeloAnaliticoCompleto } from '@/core/domain/entities/modelo-analitico';
import { CardinalidadeRelacionamento } from '@/core/domain/enums/cardinalidade-relacionamento';
import { DirecaoFiltroRelacionamento } from '@/core/domain/enums/direcao-filtro-relacionamento';

interface RelationshipsSectionProps {
  modelo: ModeloAnaliticoCompleto;
  onOpenAddRelationship: () => void;
  onDeleteRelationship: (relacionamentoId: string) => void;
  isReadOnly?: boolean;
}

export function RelationshipsSection({
  modelo,
  onOpenAddRelationship,
  onDeleteRelationship,
  isReadOnly = false,
}: RelationshipsSectionProps) {
  const getEntidadeNome = (id: string) => {
    const ent = modelo.entidades.find((e) => e.id === id);
    return ent ? ent.nome : id;
  };

  const getAtributoNome = (entidadeId: string, atributoId: string) => {
    const ent = modelo.entidades.find((e) => e.id === entidadeId);
    if (!ent) return atributoId;
    const atr = ent.atributos.find((a) => a.id === atributoId);
    return atr ? atr.nome_amigavel : atributoId;
  };

  return (
    <Card className="p-6 bg-slate-900/80 border-slate-800 space-y-5" data-testid="relationships-section">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <GitFork className="h-5 w-5 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">Relacionamentos Analíticos</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Integridade referencial, cardinalidade e controle de direção de filtro entre Fato e Dimensões.
          </p>
        </div>

        {!isReadOnly && modelo.entidades.length >= 2 && (
          <button
            type="button"
            onClick={onOpenAddRelationship}
            data-testid="btn-open-add-relationship"
            className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-purple-500 transition-colors shadow-sm shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Adicionar Relacionamento</span>
          </button>
        )}
      </div>

      {modelo.relacionamentos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center space-y-2">
          <Info className="h-6 w-6 text-slate-500 mx-auto" />
          <p className="text-xs font-medium text-slate-300">Nenhum relacionamento cadastrado.</p>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            {modelo.entidades.length < 2
              ? 'Cadastre ao menos duas entidades no modelo para estabelecer relacionamentos.'
              : 'Conecte tabelas Fato às Dimensões através de chaves primárias e estrangeiras.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {modelo.relacionamentos.map((rel) => {
            const ehNM = rel.tipo_relacionamento === CardinalidadeRelacionamento.MUITOS_PARA_MUITOS;
            const ehBidirecional = rel.direcao_filtro === DirecaoFiltroRelacionamento.BIDIRECIONAL;

            return (
              <div
                key={rel.id}
                className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3"
                data-testid={`relationship-item-${rel.id}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  {/* Fluxo do Relacionamento */}
                  <div className="flex items-center gap-3 flex-wrap text-xs">
                    <div className="space-y-0.5">
                      <span className="font-semibold text-slate-200">
                        {getEntidadeNome(rel.entidade_origem_id)}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono block">
                        .{getAtributoNome(rel.entidade_origem_id, rel.atributo_origem_id)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
                      <span className="font-mono font-bold text-[11px] text-purple-400">
                        {rel.tipo_relacionamento}
                      </span>
                      {ehBidirecional ? (
                        <ArrowLeftRight className="h-3.5 w-3.5 text-amber-400" />
                      ) : (
                        <ArrowRight className="h-3.5 w-3.5 text-blue-400" />
                      )}
                      <span className="text-[10px] text-slate-400">
                        {ehBidirecional ? 'BIDIRECIONAL' : 'UNIDIRECIONAL'}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="font-semibold text-slate-200">
                        {getEntidadeNome(rel.entidade_destino_id)}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono block">
                        .{getAtributoNome(rel.entidade_destino_id, rel.atributo_destino_id)}
                      </span>
                    </div>
                  </div>

                  {/* Ação de Remoção */}
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => onDeleteRelationship(rel.id)}
                      data-testid={`btn-delete-relationship-${rel.id}`}
                      className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-rose-400 hover:border-rose-900/60 transition-colors shrink-0"
                      title="Remover relacionamento"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Avisos de Alerta Crítico (M-06 / M-07) se aplicável */}
                {(ehNM || ehBidirecional) && (
                  <div className="rounded-lg bg-amber-950/30 border border-amber-800/50 p-2.5 text-xs text-amber-300 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-amber-200">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <span>Alerta Crítico de Modelagem:</span>
                      {ehNM && <span className="underline">M-06 (N:M)</span>}
                      {ehBidirecional && <span className="underline">M-07 (Bidirecional)</span>}
                    </div>
                    <p className="text-[11px] text-amber-300/90 leading-relaxed">
                      {rel.justificativa
                        ? `Justificativa registrada: "${rel.justificativa}"`
                        : 'Atenção: Este relacionamento exigirá justificativa técnica formal no momento da homologação.'}
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
