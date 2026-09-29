'use client';

import React from 'react';
import {
  Table,
  Plus,
  SlidersHorizontal,
  Trash2,
  Key,
  Database,
  TrendingUp,
  Tag,
  EyeOff,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { ModeloAnaliticoCompleto } from '@/core/domain/entities/modelo-analitico';
import { EntidadeAnaliticaComAtributos } from '@/core/domain/entities/entidade-analitica';
import { TipoEntidadeAnalitica } from '@/core/domain/enums/tipo-entidade-analitica';
import { PapelAtributoAnalitico } from '@/core/domain/enums/papel-atributo-analitico';

interface EntitiesAndAttributesSectionProps {
  modelo: ModeloAnaliticoCompleto;
  onOpenAddEntity: () => void;
  onOpenConfigureAttributes: (entidade: EntidadeAnaliticaComAtributos) => void;
  onDeleteEntity: (entidadeId: string, nome: string) => void;
  isReadOnly?: boolean;
}

export function EntitiesAndAttributesSection({
  modelo,
  onOpenAddEntity,
  onOpenConfigureAttributes,
  onDeleteEntity,
  isReadOnly = false,
}: EntitiesAndAttributesSectionProps) {
  return (
    <Card className="p-6 bg-slate-900/80 border-slate-800 space-y-5" data-testid="entities-and-attributes-section">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Table className="h-5 w-5 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Entidades & Atributos Analíticos</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Gerenciamento conceitual de tabelas fato, dimensões, chaves primárias e mapeamento semântico.
          </p>
        </div>

        {!isReadOnly && (
          <button
            type="button"
            onClick={onOpenAddEntity}
            data-testid="btn-open-add-entity"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors shadow-sm shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Adicionar Entidade</span>
          </button>
        )}
      </div>

      {modelo.entidades.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center space-y-2">
          <Info className="h-6 w-6 text-slate-500 mx-auto" />
          <p className="text-xs font-medium text-slate-300">Nenhuma entidade analítica cadastrada.</p>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Adicione uma Entidade FATO ou tabelas de DIMENSÃO para estruturar o modelo de dados.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {modelo.entidades.map((entidade) => {
            const ehFato = entidade.tipo === TipoEntidadeAnalitica.FATO;
            const temChavePrimaria = entidade.atributos.some(
              (a) => a.papel === PapelAtributoAnalitico.CHAVE_PRIMARIA
            );
            const graoDeclarado = Boolean(entidade.descricao && entidade.descricao.trim().length >= 5);

            return (
              <div
                key={entidade.id}
                className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3"
                data-testid={`entity-item-${entidade.id}`}
              >
                {/* Cabeçalho da Entidade */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-white" data-testid={`entity-name-${entidade.id}`}>
                        {entidade.nome}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          ehFato
                            ? 'bg-amber-950 text-amber-400 border-amber-800/80'
                            : 'bg-cyan-950 text-cyan-400 border-cyan-800/80'
                        }`}
                      >
                        {entidade.tipo}
                      </span>

                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                        {entidade.papel}
                      </span>

                      {!temChavePrimaria && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-red-950/80 text-red-400 border border-red-800"
                          title="Regra M-03: Toda entidade analítica deve possuir ao menos uma CHAVE_PRIMARIA."
                        >
                          <AlertTriangle className="h-3 w-3" />
                          Sem Chave Primária (Bloqueio M-03)
                        </span>
                      )}

                      {ehFato && !graoDeclarado && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-950/80 text-amber-400 border border-amber-800"
                          title="Regra M-02: Entidade Fato deve ter grão central declarado na descrição."
                        >
                          <AlertTriangle className="h-3 w-3" />
                          Sem Grão Declarado (Bloqueio M-02)
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {entidade.descricao || 'Sem descrição declarada.'}
                    </p>
                  </div>

                  {/* Ações da Entidade */}
                  {!isReadOnly && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onOpenConfigureAttributes(entidade)}
                        data-testid={`btn-configure-attributes-${entidade.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors"
                      >
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        <span>Configurar Atributos ({entidade.atributos.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteEntity(entidade.id, entidade.nome)}
                        data-testid={`btn-delete-entity-${entidade.id}`}
                        className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-rose-400 hover:border-rose-900/60 transition-colors"
                        title="Remover entidade"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Tabela de Atributos */}
                {entidade.atributos.length > 0 && (
                  <div className="overflow-x-auto border-t border-slate-800/80 pt-2">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-[10px] uppercase font-semibold text-slate-500">
                          <th className="py-1.5 px-2">Nome Amigável</th>
                          <th className="py-1.5 px-2">Coluna Original</th>
                          <th className="py-1.5 px-2">Papel Analítico</th>
                          <th className="py-1.5 px-2">Tipo de Dado</th>
                          <th className="py-1.5 px-2">Descrição Semântica</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40 text-slate-300">
                        {entidade.atributos.map((atr) => (
                          <tr key={atr.id} className="hover:bg-slate-900/40">
                            <td className="py-1.5 px-2 font-medium flex items-center gap-1.5">
                              {atr.papel === PapelAtributoAnalitico.CHAVE_PRIMARIA && (
                                <span title="Chave Primária">
                                  <Key className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                                </span>
                              )}
                              {atr.papel === PapelAtributoAnalitico.CHAVE_ESTRANGEIRA && (
                                <span title="Chave Estrangeira">
                                  <Key className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                                </span>
                              )}
                              {atr.papel === PapelAtributoAnalitico.METRICA_BASE && (
                                <span title="Coluna Métrica Base">
                                  <TrendingUp className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                                </span>
                              )}
                              <span className={atr.oculto ? 'text-slate-500 line-through' : ''}>
                                {atr.nome_amigavel}
                              </span>
                              {atr.oculto && (
                                <span className="text-[10px] text-slate-500">(oculto)</span>
                              )}
                            </td>
                            <td className="py-1.5 px-2 font-mono text-[11px] text-slate-400">
                              {atr.nome_original}
                            </td>
                            <td className="py-1.5 px-2">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-300">
                                {atr.papel}
                              </span>
                            </td>
                            <td className="py-1.5 px-2 font-mono text-[11px] text-slate-400">
                              {atr.tipo_dado}
                            </td>
                            <td className="py-1.5 px-2 text-[11px] text-slate-400 max-w-xs truncate">
                              {atr.descricao || (
                                <span className="text-slate-600 italic">Sem descrição</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
