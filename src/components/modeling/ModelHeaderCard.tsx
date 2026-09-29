'use client';

import React from 'react';
import {
  Layers,
  Edit,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Database,
  Hash,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { ModeloAnalitico, ModeloAnaliticoCompleto } from '@/core/domain/entities/modelo-analitico';
import { DatasetAutorizadoAnalise } from '@/core/domain/entities/dataset-autorizado-analise';
import { ProntidaoModeloOutput } from '@/core/use-cases/modeling';
import { StatusModeloAnalitico } from '@/core/domain/enums/status-modelo-analitico';
import { TipoArquiteturaModelo } from '@/core/domain/enums/tipo-arquitetura-modelo';
import { TipoEntidadeAnalitica } from '@/core/domain/enums/tipo-entidade-analitica';

interface ModelHeaderCardProps {
  modelo: ModeloAnaliticoCompleto | null;
  historicoModelos: ModeloAnalitico[];
  datasetAutorizado: DatasetAutorizadoAnalise | null;
  prontidao: ProntidaoModeloOutput | null;
  onSelectModelo: (id: string) => void;
  onOpenEditModal: () => void;
  onOpenSpecifyCalendar: () => void;
  isReadOnly?: boolean;
}

export function ModelHeaderCard({
  modelo,
  historicoModelos,
  datasetAutorizado,
  prontidao,
  onSelectModelo,
  onOpenEditModal,
  onOpenSpecifyCalendar,
  isReadOnly = false,
}: ModelHeaderCardProps) {
  if (!modelo) {
    return null;
  }

  const fatos = modelo.entidades.filter((e) => e.tipo === TipoEntidadeAnalitica.FATO);
  const dimensoes = modelo.entidades.filter((e) => e.tipo === TipoEntidadeAnalitica.DIMENSAO);
  const totalAtributos = modelo.entidades.reduce((acc, e) => acc + e.atributos.length, 0);
  const temCalendario = modelo.entidades.some(
    (e) =>
      e.papel === 'DIMENSAO_CALENDARIO' ||
      e.nome.toLowerCase().includes('calendario') ||
      e.nome.toLowerCase().includes('tempo')
  );

  const isHomologado = modelo.status === StatusModeloAnalitico.HOMOLOGADO;
  const isRevogado = modelo.status === StatusModeloAnalitico.REVOGADO;
  const temAlteracaoPosterior = prontidao?.temAlteracaoPosteriorAHomologacao ?? false;
  const isVigente = isHomologado && !temAlteracaoPosterior && !isRevogado;

  return (
    <Card className="p-6 bg-slate-900/80 border-slate-800 space-y-5" data-testid="model-header-card">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <Layers className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white tracking-tight" data-testid="model-title">
              {modelo.nome}
            </h2>

            {/* Badge de Status / Governança */}
            {isVigente && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800"
                data-testid="badge-model-homologated-vigente"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Homologação Vigente
              </span>
            )}

            {isHomologado && temAlteracaoPosterior && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-400 border border-amber-800"
                data-testid="badge-model-invalidated"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Homologação Invalidada (Alteração Posterior)
              </span>
            )}

            {isRevogado && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-400 border border-rose-800"
                data-testid="badge-model-revoked"
              >
                <XCircle className="h-3.5 w-3.5" />
                Homologação Revogada
              </span>
            )}

            {!isHomologado && !isRevogado && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-950/80 text-blue-400 border border-blue-800"
                data-testid="badge-model-rascunho"
              >
                <Clock className="h-3.5 w-3.5" />
                Em Rascunho / Modelagem
              </span>
            )}

            {/* Tipo de Arquitetura */}
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
              {modelo.tipo_arquitetura === TipoArquiteturaModelo.ESTRELA && 'Estrela (Star Schema)'}
              {modelo.tipo_arquitetura === TipoArquiteturaModelo.SNOWFLAKE && 'Floco de Neve (Snowflake)'}
              {modelo.tipo_arquitetura === TipoArquiteturaModelo.TABELA_UNICA && 'Tabela Única (Flat)'}
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed max-w-3xl" data-testid="model-description">
            {modelo.descricao || 'Nenhuma descrição semântica ou grão central informado.'}
          </p>
        </div>

        {/* Ações e Seletor */}
        <div className="flex items-center gap-2 flex-wrap">
          {historicoModelos.length > 1 && (
            <select
              value={modelo.id}
              onChange={(e) => onSelectModelo(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              data-testid="select-model-version"
            >
              {historicoModelos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome} ({m.status})
                </option>
              ))}
            </select>
          )}

          {!isReadOnly && (
            <>
              <button
                type="button"
                onClick={onOpenEditModal}
                data-testid="btn-open-edit-model"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <Edit className="h-3.5 w-3.5" />
                <span>Editar Metadados</span>
              </button>

              {!temCalendario && (
                <button
                  type="button"
                  onClick={onOpenSpecifyCalendar}
                  data-testid="btn-open-specify-calendar"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-800/80 bg-indigo-950/40 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-900/60 transition-colors"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Especificar Calendário</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Grid de Métricas Operacionais & Dataset Vinculado */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-3 border-t border-slate-800/80">
        <div className="rounded-lg bg-slate-950/60 border border-slate-800/60 p-3">
          <span className="text-[11px] text-slate-400 font-medium">Entidades Fato</span>
          <p className="text-lg font-bold text-amber-400 mt-0.5" data-testid="stat-total-facts">
            {fatos.length}
          </p>
        </div>

        <div className="rounded-lg bg-slate-950/60 border border-slate-800/60 p-3">
          <span className="text-[11px] text-slate-400 font-medium">Dimensões</span>
          <p className="text-lg font-bold text-cyan-400 mt-0.5" data-testid="stat-total-dimensions">
            {dimensoes.length}
          </p>
        </div>

        <div className="rounded-lg bg-slate-950/60 border border-slate-800/60 p-3">
          <span className="text-[11px] text-slate-400 font-medium">Total Atributos</span>
          <p className="text-lg font-bold text-slate-200 mt-0.5" data-testid="stat-total-attributes">
            {totalAtributos}
          </p>
        </div>

        <div className="rounded-lg bg-slate-950/60 border border-slate-800/60 p-3">
          <span className="text-[11px] text-slate-400 font-medium">Relacionamentos</span>
          <p className="text-lg font-bold text-purple-400 mt-0.5" data-testid="stat-total-relationships">
            {modelo.relacionamentos.length}
          </p>
        </div>

        <div className="rounded-lg bg-slate-950/60 border border-slate-800/60 p-3">
          <span className="text-[11px] text-slate-400 font-medium">Métricas</span>
          <p className="text-lg font-bold text-blue-400 mt-0.5" data-testid="stat-total-metrics">
            {modelo.metricas.length}
          </p>
        </div>

        <div className="rounded-lg bg-slate-950/60 border border-slate-800/60 p-3">
          <span className="text-[11px] text-slate-400 font-medium">Dataset Vinculado</span>
          <div className="flex items-center gap-1 mt-1 text-xs text-slate-300 font-medium truncate">
            <Database className="h-3 w-3 text-emerald-400 shrink-0" />
            <span className="truncate" title={datasetAutorizado?.versao_rotulo || modelo.dataset_autorizado_id}>
              {datasetAutorizado?.versao_rotulo || 'Autorizado'}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
