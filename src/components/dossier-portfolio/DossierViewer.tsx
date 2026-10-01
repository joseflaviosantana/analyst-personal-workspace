'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { CompilarDossieVivoOutput } from '@/core/use-cases/dossier/compilar-dossie-vivo.use-case';
import {
  FileText,
  Copy,
  Check,
  Download,
  RefreshCw,
  Layers,
  Database,
  Calculator,
  ShieldCheck,
  CheckSquare,
} from 'lucide-react';

interface DossierViewerProps {
  dossierData: CompilarDossieVivoOutput | null;
  isLoading: boolean;
  onRefresh: () => Promise<void>;
}

export function DossierViewer({ dossierData, isLoading, onRefresh }: DossierViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!dossierData?.markdown) return;
    try {
      await navigator.clipboard.writeText(dossierData.markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownload = () => {
    if (!dossierData?.markdown) return;
    const blob = new Blob([dossierData.markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dossie-tecnico-${dossierData.demandaId}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const summary = dossierData?.compilationData;

  return (
    <div className="space-y-6" data-testid="dossier-viewer-container">
      {/* Top Banner Informativo de Governança Interna */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-blue-900/60 bg-blue-950/20 text-blue-200">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">
                Dossiê Técnico Concorrente (Memória Interna Viva)
              </span>
              <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-blue-900/70 border border-blue-700/80 text-blue-300">
                11 Seções Metodológicas
              </span>
            </div>
            <p className="text-xs text-blue-300/80 mt-1 max-w-2xl leading-relaxed">
              Registro técnico completo e contínuo da demanda. Permanece 100% consultável e exportável
              em qualquer estado operacional, sem requerer a trava APROV-10 (exclusiva para o portfólio público).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-50"
            data-testid="btn-refresh-dossier"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Recarregar</span>
          </button>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!dossierData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-50"
            data-testid="btn-copy-dossier-md"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copiar MD</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={!dossierData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white transition-colors disabled:opacity-50"
            data-testid="btn-download-dossier-md"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Baixar .md</span>
          </button>
        </div>
      </div>

      {/* Grid de Resumo Estrutural da Demanda */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="p-3 bg-slate-900/60 border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block font-medium">Requisitos</span>
            <div className="flex items-center justify-center gap-1.5 mt-1 text-slate-200">
              <CheckSquare className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-base font-bold">{summary.requisitos?.length || 0}</span>
            </div>
          </Card>
          <Card className="p-3 bg-slate-900/60 border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block font-medium">Ativos de Dados</span>
            <div className="flex items-center justify-center gap-1.5 mt-1 text-slate-200">
              <Database className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-base font-bold">{summary.ativosDados?.length || 0}</span>
            </div>
          </Card>
          <Card className="p-3 bg-slate-900/60 border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block font-medium">Pipelines M</span>
            <div className="flex items-center justify-center gap-1.5 mt-1 text-slate-200">
              <Layers className="h-3.5 w-3.5 text-teal-400" />
              <span className="text-base font-bold">{summary.receitasPreparacao?.length || 0}</span>
            </div>
          </Card>
          <Card className="p-3 bg-slate-900/60 border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block font-medium">Medidas DAX</span>
            <div className="flex items-center justify-center gap-1.5 mt-1 text-slate-200">
              <Calculator className="h-3.5 w-3.5 text-indigo-400" />
              <span className="text-base font-bold">{summary.medidasDax?.length || 0}</span>
            </div>
          </Card>
          <Card className="p-3 bg-slate-900/60 border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block font-medium">Validações</span>
            <div className="flex items-center justify-center gap-1.5 mt-1 text-slate-200">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-base font-bold">{summary.validacoes?.length || 0}</span>
            </div>
          </Card>
          <Card className="p-3 bg-slate-900/60 border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block font-medium">Entregáveis</span>
            <div className="flex items-center justify-center gap-1.5 mt-1 text-slate-200">
              <FileText className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-base font-bold">{summary.entregaveis?.length || 0}</span>
            </div>
          </Card>
        </div>
      )}

      {/* Visualizador de Conteúdo Markdown em Bloco de Código Estilizado */}
      <Card className="p-6 bg-slate-950/70 border-slate-800">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Compilação Markdown (Auditoria & Rastreabilidade)
            </span>
          </div>
          {dossierData && (
            <span className="text-[11px] text-slate-400">
              Gerado em: {new Date(dossierData.geradoEm).toLocaleString('pt-BR')}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-400" />
            Compilando dossiê concorrente a partir das 10 etapas analíticas...
          </div>
        ) : dossierData?.markdown ? (
          <div
            className="p-5 rounded-lg bg-slate-950 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed overflow-x-auto border border-slate-800/60 max-h-[600px] overflow-y-auto selection:bg-blue-900 selection:text-white"
            data-testid="dossier-markdown-content"
          >
            {dossierData.markdown}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-sm">
            Nenhum dado de dossiê disponível para esta demanda.
          </div>
        )}
      </Card>
    </div>
  );
}
