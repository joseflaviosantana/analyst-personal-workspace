'use client';

/**
 * src/components/dashboard/InspectMedidaDaxModal.tsx
 *
 * Modal de Inspeção Aprofundada e Linhagem de Medidas DAX (Subgate 3.4C)
 *
 * Funcionalidades:
 * - Exibição da fórmula DAX e descrição funcional com cópia em 1 clique;
 * - Representação visual da Linhagem Completa (Métrica -> Medida -> Tabelas -> Modelo -> Dataset);
 * - Visualização do código TMDL oficial gerado pelo TmdlMeasureSerializer;
 * - Transparência sobre linhagem parcial quando aplicável;
 * - Resumo epistêmico e conformidade normativa.
 */

import React, { useState } from 'react';
import {
  X,
  Calculator,
  Link2,
  Copy,
  Check,
  Code2,
  Layers,
  Database,
  ArrowRight,
  FileSpreadsheet,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { MedidaDax } from '@/core/domain/entities/medida-dax';
import { MetricaAnalitica } from '@/core/domain/entities/metrica-analitica';
import { ROTULOS_CATEGORIA_MEDIDA_DAX } from '@/core/domain/enums/categoria-medida-dax';
import { TmdlMeasureSerializer } from '@/core/domain/tmdl/tmdl-measure-serializer';

interface InspectMedidaDaxModalProps {
  isOpen: boolean;
  onClose: () => void;
  medida: MedidaDax;
  modeloPowerBiNome: string;
  metricaHomologada?: MetricaAnalitica | null;
  modeloAnaliticoNome?: string | null;
  datasetNome?: string | null;
}

export function InspectMedidaDaxModal({
  isOpen,
  onClose,
  medida,
  modeloPowerBiNome,
  metricaHomologada,
  modeloAnaliticoNome,
  datasetNome,
}: InspectMedidaDaxModalProps) {
  const [copiedDax, setCopiedDax] = useState(false);
  const [copiedTmdl, setCopiedTmdl] = useState(false);

  if (!isOpen) return null;

  const tmdlSnippet = TmdlMeasureSerializer.serializeMeasure(medida);

  const handleCopyDax = () => {
    navigator.clipboard.writeText(medida.expressao_dax);
    setCopiedDax(true);
    setTimeout(() => setCopiedDax(false), 2000);
  };

  const handleCopyTmdl = () => {
    navigator.clipboard.writeText(tmdlSnippet);
    setCopiedTmdl(true);
    setTimeout(() => setCopiedTmdl(false), 2000);
  };

  const isLinhagemCompleta = Boolean(metricaHomologada && modeloAnaliticoNome && datasetNome);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      data-testid="inspect-medida-dax-modal"
    >
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">[{medida.tabela_hospedeira}]</span>
                <h3 className="text-base font-bold text-white">{medida.nome}</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {ROTULOS_CATEGORIA_MEDIDA_DAX[medida.categoria_dax] || medida.categoria_dax}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 1. Fórmula DAX com Cópia Rápida */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Fórmula de Cálculo DAX</span>
            <button
              type="button"
              onClick={handleCopyDax}
              data-testid="btn-copy-dax"
              className="inline-flex items-center gap-1 text-[11px] font-mono text-blue-400 hover:text-blue-300 transition-colors"
            >
              {copiedDax ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              <span>{copiedDax ? 'Copiado!' : 'Copiar DAX'}</span>
            </button>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 font-mono text-xs sm:text-sm text-blue-200 overflow-x-auto whitespace-pre leading-relaxed shadow-inner">
            <code>{medida.expressao_dax}</code>
          </div>
        </div>

        {/* 2. Rastreabilidade & Linhagem Semântica */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Linhagem Analítica &amp; Rastreabilidade
              </h4>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                isLinhagemCompleta
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                  : 'bg-amber-950/80 text-amber-300 border border-amber-800'
              }`}
            >
              {isLinhagemCompleta ? 'Linhagem Ponta a Ponta' : 'Linhagem Parcial'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
            {/* Etapa 1: Ativo / Dataset */}
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-2.5 flex-1 min-w-[140px]">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Dataset Base</span>
              <span className="font-semibold text-slate-200 truncate block mt-0.5">
                {datasetNome || 'Não vinculado'}
              </span>
            </div>

            <ArrowRight className="h-3.5 w-3.5 text-slate-600 flex-shrink-0" />

            {/* Etapa 2: Modelo Analítico */}
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-2.5 flex-1 min-w-[140px]">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Modelo Analítico (Aba 6)</span>
              <span className="font-semibold text-slate-200 truncate block mt-0.5">
                {modeloAnaliticoNome || 'Não vinculado'}
              </span>
            </div>

            <ArrowRight className="h-3.5 w-3.5 text-slate-600 flex-shrink-0" />

            {/* Etapa 3: Métrica de Negócio */}
            <div className="rounded-lg border border-emerald-900/60 bg-emerald-950/30 p-2.5 flex-1 min-w-[140px]">
              <span className="text-[10px] text-emerald-400 uppercase font-semibold block">Métrica Homologada</span>
              <span className="font-bold text-white truncate block mt-0.5">
                {metricaHomologada ? metricaHomologada.nome : 'Sem métrica associada'}
              </span>
            </div>

            <ArrowRight className="h-3.5 w-3.5 text-slate-600 flex-shrink-0" />

            {/* Etapa 4: Medida DAX */}
            <div className="rounded-lg border border-blue-900/60 bg-blue-950/30 p-2.5 flex-1 min-w-[140px]">
              <span className="text-[10px] text-blue-400 uppercase font-semibold block">Medida DAX (Power BI)</span>
              <span className="font-bold text-white truncate block mt-0.5">
                [{medida.nome}]
              </span>
            </div>
          </div>

          {!isLinhagemCompleta && (
            <p className="text-[11px] text-amber-400/90 leading-relaxed italic pt-1">
              * Linhagem Parcial: Esta medida opera como indicador auxiliar ou foi cadastrada sem vínculo direto a uma métrica homologada da modelagem analítica (Regra D-03).
            </p>
          )}
        </div>

        {/* 3. Snippet Oficial TMDL (Power BI Project) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <Code2 className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-semibold text-slate-300">Definição TMDL (.pbip / Git)</span>
            </div>
            <button
              type="button"
              onClick={handleCopyTmdl}
              data-testid="btn-copy-tmdl"
              className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-white transition-colors"
            >
              {copiedTmdl ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              <span>{copiedTmdl ? 'Copiado!' : 'Copiar TMDL'}</span>
            </button>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] text-slate-300 overflow-x-auto whitespace-pre">
            <code>{tmdlSnippet}</code>
          </div>
        </div>

        {/* 4. Metadados e Formato */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
          <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/40">
            <span className="text-slate-500 block">Formato String:</span>
            <span className="font-mono text-slate-200">{medida.formato_string || 'Padrão'}</span>
          </div>
          <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/40">
            <span className="text-slate-500 block">Tabela Hospedeira:</span>
            <span className="font-mono text-slate-200">{medida.tabela_hospedeira}</span>
          </div>
          <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/40">
            <span className="text-slate-500 block">Criado em:</span>
            <span className="font-mono text-slate-200">{new Date(medida.criado_em).toLocaleDateString()}</span>
          </div>
          <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/40">
            <span className="text-slate-500 block">Atualizado em:</span>
            <span className="font-mono text-slate-200">{new Date(medida.atualizado_em).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Rodapé com botão de fechar */}
        <div className="flex items-center justify-end pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 font-semibold text-slate-300 hover:text-white hover:bg-slate-700 transition-colors text-xs"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
