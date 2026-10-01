'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  RefreshCw,
  Trash2,
  Search,
  Filter,
  Scale,
  Plus,
} from 'lucide-react';
import { clsx } from 'clsx';
import { ValidacaoConciliacao } from '@/core/domain/entities/validacao-conciliacao';
import {
  ResultadoValidacao,
  ROTULOS_RESULTADO_VALIDACAO,
} from '@/core/domain/enums/resultado-validacao';
import {
  CamadaValidacao,
  ROTULOS_CAMADA_VALIDACAO,
} from '@/core/domain/enums/camada-validacao';
import { Card } from '@/components/ui/Card';

interface ValidationCardListProps {
  validacoes: ValidacaoConciliacao[];
  onOpenRetest: (val: ValidacaoConciliacao) => void;
  onRemove: (id: string) => void;
  onOpenCreate: () => void;
  isReadOnly?: boolean;
}

export function ValidationCardList({
  validacoes,
  onOpenRetest,
  onRemove,
  onOpenCreate,
  isReadOnly = false,
}: ValidationCardListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLayer, setFilterLayer] = useState<string>('TODAS');
  const [filterResult, setFilterResult] = useState<string>('TODOS');

  // Filtragem
  const filteredValidacoes = validacoes.filter((v) => {
    const matchesSearch =
      v.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.base_referencia && v.base_referencia.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesLayer = filterLayer === 'TODAS' || v.camada === filterLayer;
    const matchesResult = filterResult === 'TODOS' || v.resultado === filterResult;

    return matchesSearch && matchesLayer && matchesResult;
  });

  const getResultBadge = (res: ResultadoValidacao) => {
    switch (res) {
      case ResultadoValidacao.APROVADO:
        return (
          <span
            data-testid="badge-validation-status-aprovado"
            className="inline-flex items-center gap-1 rounded-md bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 text-[11px] font-semibold text-emerald-300"
          >
            <CheckCircle2 className="h-3 w-3" />
            <span>Aprovado</span>
          </span>
        );
      case ResultadoValidacao.DIVERGENTE:
        return (
          <span
            data-testid="badge-validation-status-divergente"
            className="inline-flex items-center gap-1 rounded-md bg-amber-950/80 border border-amber-800/80 px-2 py-0.5 text-[11px] font-semibold text-amber-300"
          >
            <AlertTriangle className="h-3 w-3" />
            <span>Divergente</span>
          </span>
        );
      case ResultadoValidacao.REJEITADO:
        return (
          <span
            data-testid="badge-validation-status-rejeitado"
            className="inline-flex items-center gap-1 rounded-md bg-rose-950/80 border border-rose-800/80 px-2 py-0.5 text-[11px] font-semibold text-rose-300"
          >
            <XCircle className="h-3 w-3" />
            <span>Rejeitado</span>
          </span>
        );
      case ResultadoValidacao.PENDENTE_RETESTE:
      default:
        return (
          <span
            data-testid="badge-validation-status-pendente"
            className="inline-flex items-center gap-1 rounded-md bg-slate-800 border border-slate-700 px-2 py-0.5 text-[11px] font-semibold text-slate-300"
          >
            <Clock className="h-3 w-3" />
            <span>Pendente de Reteste</span>
          </span>
        );
    }
  };

  if (validacoes.length === 0) {
    return (
      <Card
        data-testid="validation-empty-state"
        className="p-10 text-center border-slate-800 bg-slate-900/60"
      >
        <Scale className="h-10 w-10 text-blue-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white">
          Nenhum Check de Validação Registrado
        </h3>
        <p className="mt-1.5 text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          A etapa de Validação assegura a integridade das entregas através de verificações objetivas
          e conciliações entre os resultados apurados e as bases de referência.
        </p>
        {!isReadOnly && (
          <div className="mt-5">
            <button
              type="button"
              onClick={onOpenCreate}
              data-testid="btn-empty-create-validation"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Cadastrar Primeiro Check de Conciliação</span>
            </button>
          </div>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-4" data-testid="validation-list-container">
      {/* Barra de Filtro e Busca */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-xl p-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título ou base de referência..."
            data-testid="input-search-validation"
            className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Filtro por Camada */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="h-3 w-3 text-slate-500" />
            <select
              value={filterLayer}
              onChange={(e) => setFilterLayer(e.target.value)}
              data-testid="select-filter-layer"
              className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="TODAS">Todas as Camadas</option>
              {Object.entries(ROTULOS_CAMADA_VALIDACAO).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Resultado */}
          <select
            value={filterResult}
            onChange={(e) => setFilterResult(e.target.value)}
            data-testid="select-filter-result"
            className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="TODOS">Todos os Status</option>
            {Object.entries(ROTULOS_RESULTADO_VALIDACAO).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de Checks */}
      <div className="space-y-3">
        {filteredValidacoes.map((val) => {
          const isAprovado = val.resultado === ResultadoValidacao.APROVADO;
          const isDivergente = val.resultado === ResultadoValidacao.DIVERGENTE;

          return (
            <Card
              key={val.id}
              data-testid={`validation-card-${val.id}`}
              className={clsx(
                'p-4 transition-all border',
                isAprovado
                  ? 'border-slate-800 bg-slate-900/90'
                  : isDivergente
                  ? 'border-amber-900/50 bg-amber-950/10'
                  : 'border-slate-800 bg-slate-900/90'
              )}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {getResultBadge(val.resultado)}
                    <span className="rounded bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                      {ROTULOS_CAMADA_VALIDACAO[val.camada] || val.camada}
                    </span>
                    {val.obrigatoria && (
                      <span className="rounded bg-blue-950/60 border border-blue-900/60 px-1.5 py-0.5 text-[10px] font-medium text-blue-300">
                        Obrigatório
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-white">
                    {val.titulo}
                  </h4>
                  {val.base_referencia && (
                    <p className="text-xs text-slate-400">
                      Ref.: <span className="text-slate-300 font-medium">{val.base_referencia}</span>
                    </p>
                  )}
                </div>

                {/* Bloco Numérico de Comparação */}
                <div className="flex items-center gap-4 bg-slate-950/80 border border-slate-800/80 rounded-lg p-2.5 text-xs">
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase">Esperado</span>
                    <span className="font-semibold text-white" data-testid="card-expected-value">
                      {val.valor_esperado !== null && val.valor_esperado !== undefined
                        ? `${val.valor_esperado} ${val.unidade_medida || ''}`.trim()
                        : '—'}
                    </span>
                  </div>

                  <div className="h-6 w-px bg-slate-800" />

                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase">Obtido</span>
                    <span
                      data-testid="card-obtained-value"
                      className={clsx(
                        'font-semibold',
                        isAprovado ? 'text-emerald-400' : isDivergente ? 'text-amber-400' : 'text-white'
                      )}
                    >
                      {val.valor_obtido !== null && val.valor_obtido !== undefined
                        ? `${val.valor_obtido} ${val.unidade_medida || ''}`.trim()
                        : 'Pendente'}
                    </span>
                  </div>

                  <div className="h-6 w-px bg-slate-800" />

                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase">Desvio</span>
                    <span
                      data-testid="card-divergence-value"
                      className={clsx(
                        'font-mono font-medium',
                        isAprovado ? 'text-emerald-400' : isDivergente ? 'text-amber-400' : 'text-slate-400'
                      )}
                    >
                      {val.divergencia_absoluta !== null && val.divergencia_absoluta !== undefined
                        ? `${val.divergencia_absoluta} (${val.divergencia_percentual}%)`
                        : '—'}
                    </span>
                  </div>

                  <div className="h-6 w-px bg-slate-800" />

                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase">Tolerância</span>
                    <span className="text-slate-400">
                      ±{val.tolerancia_permitida}
                    </span>
                  </div>
                </div>

                {/* Ações */}
                {!isReadOnly && (
                  <div className="flex items-center gap-1.5 self-end md:self-center">
                    <button
                      type="button"
                      onClick={() => onOpenRetest(val)}
                      data-testid={`btn-retest-${val.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                      title="Executar novo teste / conferência"
                    >
                      <RefreshCw className="h-3 w-3 text-blue-400" />
                      <span>Retestar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onRemove(val.id)}
                      data-testid={`btn-remove-${val.id}`}
                      className="rounded-lg border border-slate-800 p-1.5 text-slate-500 hover:border-rose-900/60 hover:bg-rose-950/40 hover:text-rose-400 transition-colors"
                      title="Excluir check"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Informações de Auditoria e Notas */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-3">
                  <span>Executor: <strong className="text-slate-300">{val.executado_por || 'Analista'}</strong></span>
                  {val.executado_em && (
                    <span>Data: {new Date(val.executado_em).toLocaleString('pt-BR')}</span>
                  )}
                </div>
                {val.notas_evidencia && (
                  <span className="italic text-slate-400 truncate max-w-sm" title={val.notas_evidencia}>
                    &quot;{val.notas_evidencia}&quot;
                  </span>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
