'use client';

import React, { useState } from 'react';
import {
  Layers,
  Table,
  Key,
  Calendar,
  Hash,
  ArrowRight,
  ArrowLeftRight,
  TrendingUp,
  Tag,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { ModeloAnaliticoCompleto } from '@/core/domain/entities/modelo-analitico';
import { TipoEntidadeAnalitica } from '@/core/domain/enums/tipo-entidade-analitica';
import { PapelEntidadeAnalitica } from '@/core/domain/enums/papel-entidade-analitica';
import { PapelAtributoAnalitico } from '@/core/domain/enums/papel-atributo-analitico';
import { CardinalidadeRelacionamento } from '@/core/domain/enums/cardinalidade-relacionamento';
import { DirecaoFiltroRelacionamento } from '@/core/domain/enums/direcao-filtro-relacionamento';

interface ModelStructureViewProps {
  modelo: ModeloAnaliticoCompleto;
}

export function ModelStructureView({ modelo }: ModelStructureViewProps) {
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  const fatos = modelo.entidades.filter((e) => e.tipo === TipoEntidadeAnalitica.FATO);
  const dimensoes = modelo.entidades.filter((e) => e.tipo === TipoEntidadeAnalitica.DIMENSAO);

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
    <Card className="p-6 bg-slate-900/70 border-slate-800 space-y-6" data-testid="model-structure-view">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">Visualização da Estrutura Analítica</h3>
        </div>
        <span className="text-[11px] text-slate-400">
          Arquitetura: <strong className="text-slate-200">{modelo.tipo_arquitetura}</strong> · {modelo.entidades.length} Entidade(s) · {modelo.relacionamentos.length} Relacionamento(s)
        </span>
      </div>

      {/* Grid Dimensional: Fato no Topo/Centro e Dimensões ao Redor */}
      <div className="space-y-4">
        {/* Seção de Fatos */}
        <div>
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <Table className="h-4 w-4" />
            <span>Tabelas Fato ({fatos.length})</span>
          </div>

          {fatos.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-800 p-4 text-center text-xs text-slate-500">
              Nenhuma entidade FATO configurada no modelo.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fatos.map((fato) => {
                const isSelected = selectedEntityId === fato.id;
                return (
                  <div
                    key={fato.id}
                    onClick={() => setSelectedEntityId(isSelected ? null : fato.id)}
                    className={`cursor-pointer rounded-xl border p-4 transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-950/30 ring-1 ring-amber-500'
                        : 'border-amber-800/60 bg-slate-950/70 hover:border-amber-700/80'
                    }`}
                    data-testid={`entity-card-${fato.id}`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-semibold text-sm text-amber-200 truncate">{fato.nome}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950 text-amber-400 border border-amber-800/80 shrink-0">
                        FATO
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">
                      {fato.descricao || 'Grão não declarado formalmente.'}
                    </p>

                    <div className="space-y-1.5 border-t border-slate-800/80 pt-2.5">
                      <span className="text-[10px] uppercase font-semibold text-slate-500">Atributos ({fato.atributos.length})</span>
                      <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                        {fato.atributos.map((atr) => (
                          <div
                            key={atr.id}
                            className="flex items-center justify-between text-[11px] text-slate-300 py-0.5 px-1 rounded bg-slate-900/60"
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              {atr.papel === PapelAtributoAnalitico.CHAVE_PRIMARIA && (
                                <span title="Chave Primária">
                                  <Key className="h-3 w-3 text-amber-400 shrink-0" />
                                </span>
                              )}
                              {atr.papel === PapelAtributoAnalitico.CHAVE_ESTRANGEIRA && (
                                <span title="Chave Estrangeira">
                                  <Key className="h-3 w-3 text-blue-400 shrink-0" />
                                </span>
                              )}
                              {atr.papel === PapelAtributoAnalitico.METRICA_BASE && (
                                <span title="Coluna Métrica Base">
                                  <TrendingUp className="h-3 w-3 text-emerald-400 shrink-0" />
                                </span>
                              )}
                              <span className="truncate">{atr.nome_amigavel}</span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500 shrink-0">{atr.tipo_dado}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Seção de Dimensões */}
        <div>
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
            <Tag className="h-4 w-4" />
            <span>Tabelas Dimensão ({dimensoes.length})</span>
          </div>

          {dimensoes.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-800 p-4 text-center text-xs text-slate-500">
              Nenhuma entidade DIMENSÃO configurada no modelo.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dimensoes.map((dim) => {
                const isSelected = selectedEntityId === dim.id;
                const isCalendario =
                  dim.papel === PapelEntidadeAnalitica.DIMENSAO_CALENDARIO ||
                  dim.nome.toLowerCase().includes('calendario');

                return (
                  <div
                    key={dim.id}
                    onClick={() => setSelectedEntityId(isSelected ? null : dim.id)}
                    className={`cursor-pointer rounded-xl border p-4 transition-all ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-950/30 ring-1 ring-cyan-500'
                        : isCalendario
                        ? 'border-purple-800/60 bg-slate-950/70 hover:border-purple-700/80'
                        : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                    }`}
                    data-testid={`entity-card-${dim.id}`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 truncate">
                        {isCalendario ? (
                          <Calendar className="h-4 w-4 text-purple-400 shrink-0" />
                        ) : (
                          <Table className="h-4 w-4 text-cyan-400 shrink-0" />
                        )}
                        <span className="font-semibold text-sm text-slate-200 truncate">{dim.nome}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 border ${
                          isCalendario
                            ? 'bg-purple-950 text-purple-300 border-purple-800/80'
                            : 'bg-cyan-950 text-cyan-400 border-cyan-800/80'
                        }`}
                      >
                        {isCalendario ? 'CALENDÁRIO' : 'DIMENSÃO'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">
                      {dim.descricao || 'Dimensão analítica descritiva.'}
                    </p>

                    <div className="space-y-1.5 border-t border-slate-800/80 pt-2.5">
                      <span className="text-[10px] uppercase font-semibold text-slate-500">Atributos ({dim.atributos.length})</span>
                      <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                        {dim.atributos.map((atr) => (
                          <div
                            key={atr.id}
                            className="flex items-center justify-between text-[11px] text-slate-300 py-0.5 px-1 rounded bg-slate-900/60"
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              {atr.papel === PapelAtributoAnalitico.CHAVE_PRIMARIA && (
                                <span title="Chave Primária">
                                  <Key className="h-3 w-3 text-cyan-400 shrink-0" />
                                </span>
                              )}
                              <span className="truncate">{atr.nome_amigavel}</span>
                              {atr.oculto && (
                                <span title="Atributo Oculto">
                                  <EyeOff className="h-3 w-3 text-slate-500 shrink-0" />
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-slate-500 shrink-0">{atr.tipo_dado}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Visualização de Relacionamentos Ativos */}
        <div className="pt-2">
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-purple-400">
            <ArrowRight className="h-4 w-4" />
            <span>Relacionamentos & Propagação de Filtro ({modelo.relacionamentos.length})</span>
          </div>

          {modelo.relacionamentos.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-800 p-4 text-center text-xs text-slate-500">
              Nenhum relacionamento declarado entre entidades. Em modelos estrela, relacione tabelas fato a dimensões via chaves.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3" data-testid="relationships-diagram-grid">
              {modelo.relacionamentos.map((rel) => {
                const ehNM = rel.tipo_relacionamento === CardinalidadeRelacionamento.MUITOS_PARA_MUITOS;
                const ehBidirecional = rel.direcao_filtro === DirecaoFiltroRelacionamento.BIDIRECIONAL;

                return (
                  <div
                    key={rel.id}
                    className={`rounded-lg p-3 text-xs border flex items-center justify-between gap-3 ${
                      ehNM || ehBidirecional
                        ? 'border-amber-800/80 bg-amber-950/20 text-amber-200'
                        : 'border-slate-800 bg-slate-950/70 text-slate-300'
                    }`}
                    data-testid={`rel-view-${rel.id}`}
                  >
                    <div className="space-y-0.5 truncate flex-1">
                      <div className="font-semibold text-slate-200 truncate">
                        {getEntidadeNome(rel.entidade_origem_id)}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono truncate">
                        .{getAtributoNome(rel.entidade_origem_id, rel.atributo_origem_id)}
                      </div>
                    </div>

                    {/* Conector com Cardinalidade e Direção */}
                    <div className="flex flex-col items-center justify-center shrink-0 px-2 py-1 rounded bg-slate-900/90 border border-slate-800">
                      <span className="text-[10px] font-bold font-mono text-purple-400">
                        {rel.tipo_relacionamento}
                      </span>
                      {ehBidirecional ? (
                        <ArrowLeftRight className="h-3.5 w-3.5 text-amber-400 my-0.5" />
                      ) : (
                        <ArrowRight className="h-3.5 w-3.5 text-blue-400 my-0.5" />
                      )}
                      <span className="text-[9px] text-slate-400">
                        {ehBidirecional ? 'BIDIRECIONAL' : 'UNIDIRECIONAL'}
                      </span>
                    </div>

                    <div className="space-y-0.5 truncate flex-1 text-right">
                      <div className="font-semibold text-slate-200 truncate">
                        {getEntidadeNome(rel.entidade_destino_id)}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono truncate">
                        .{getAtributoNome(rel.entidade_destino_id, rel.atributo_destino_id)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
