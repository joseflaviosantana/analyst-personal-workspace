'use client';

import React from 'react';
import {
  GitFork,
  ArrowRight,
  Database,
  FileSpreadsheet,
  Layers,
  Hash,
  FileText,
  Info
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LinhagemAtivos } from '@/core/domain/entities/linhagem-ativos';
import { AtivoDados } from '@/core/domain/entities/ativo-dados';
import { EtapaTransformacao } from '@/core/domain/entities/etapa-transformacao';
import { ROTULOS_PAPEL_ENTRADA_LINHAGEM } from '@/core/domain/enums/papel-entrada-linhagem';

interface LineageFlowViewProps {
  arestas: LinhagemAtivos[];
  ativos: AtivoDados[];
  etapas: EtapaTransformacao[];
}

export function LineageFlowView({ arestas, ativos, etapas }: LineageFlowViewProps) {
  const mapaAtivos = new Map<string, AtivoDados>(ativos.map((a) => [a.id, a]));
  const mapaEtapas = new Map<string, EtapaTransformacao>(etapas.map((e) => [e.id, e]));

  if (arestas.length === 0) {
    return (
      <Card className="p-6 text-center py-8" data-testid="lineage-empty-card">
        <GitFork className="h-8 w-8 text-slate-500 mx-auto mb-2" />
        <h4 className="text-xs font-semibold text-slate-300">
          Nenhuma Linhagem de Transformação Registrada
        </h4>
        <p className="text-[11px] text-slate-500 mt-1 max-w-md mx-auto">
          Ao executar uma etapa e registrar o ativo de dados derivado, a procedência e o caminho de transformação (Upstream / Downstream) serão visualizados aqui.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4" data-testid="lineage-flow-view">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <GitFork className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">Linhagem de Dados &amp; Procedência (DAG)</h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {arestas.length} aresta(s) de conexão
        </span>
      </div>

      <div className="space-y-3" data-testid="lineage-edges-list">
        {arestas.map((edge) => {
          const origem = mapaAtivos.get(edge.ativo_origem_id);
          const destino = mapaAtivos.get(edge.ativo_destino_id);
          const etapa = edge.etapa_transformacao_id
            ? mapaEtapas.get(edge.etapa_transformacao_id)
            : null;

          return (
            <div
              key={edge.id}
              className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-lg border border-slate-800 bg-slate-950/60"
              data-testid={`lineage-edge-${edge.id}`}
            >
              {/* Ativo Origem */}
              <div className="flex items-center gap-2.5 min-w-[220px]">
                <Database className="h-4 w-4 text-slate-400 shrink-0" />
                <div className="text-xs">
                  <span className="font-medium text-slate-200 block truncate max-w-[200px]" title={origem?.nome_arquivo || edge.ativo_origem_id}>
                    {origem?.nome_arquivo || edge.ativo_origem_id}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {ROTULOS_PAPEL_ENTRADA_LINHAGEM[edge.papel_entrada] || edge.papel_entrada}
                  </span>
                </div>
              </div>

              {/* Etapa Intermediária Conectora */}
              <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
                <ArrowRight className="h-4 w-4 text-blue-400 shrink-0 hidden md:block" />
                <div className="rounded border border-blue-900/60 bg-blue-950/30 px-2.5 py-1 text-[11px] text-blue-300 flex items-center gap-1.5">
                  <Layers className="h-3 w-3 text-blue-400" />
                  <span>
                    {etapa ? `Etapa #${etapa.ordem}: ${etapa.tipo_operacao}` : 'Derivação Direta'}
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-blue-400 shrink-0 hidden md:block" />
              </div>

              {/* Ativo Destino Derivado */}
              <div className="flex items-center gap-2.5 min-w-[220px] justify-start md:justify-end">
                <div className="text-xs text-left md:text-right">
                  <span className="font-semibold text-emerald-400 block truncate max-w-[200px]" title={destino?.nome_arquivo || edge.ativo_destino_id}>
                    {destino?.nome_arquivo || edge.ativo_destino_id}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {destino ? `${destino.total_linhas} lin × ${destino.total_colunas} col (${destino.formato})` : 'Ativo derivado'}
                  </span>
                </div>
                <FileSpreadsheet className="h-4 w-4 text-emerald-400 shrink-0" />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
