'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Download, ShieldCheck, FileCheck } from 'lucide-react';
import { ExportarEstudoCasoPortfolioOutput } from '@/core/use-cases/portfolio/exportar-estudo-caso-portfolio.use-case';

interface ExportCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  exportData: ExportarEstudoCasoPortfolioOutput | null;
}

export function ExportCaseModal({ isOpen, onClose, exportData }: ExportCaseModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !exportData) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportData.markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownload = () => {
    const blob = new Blob([exportData.markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `case-portfolio-${exportData.caseId}-v${exportData.versao}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto"
      data-testid="modal-export-case"
    >
      <div className="relative w-full max-w-2xl rounded-xl border border-emerald-800/80 bg-slate-900 shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-emerald-400" />
            <h3 className="text-base font-semibold text-white">
              Estudo de Caso Homologado para Portfólio (APROV-10)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Metadados da Homologação */}
        <div className="mt-4 p-3 rounded-lg border border-emerald-900/60 bg-emerald-950/20 text-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-emerald-300">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Versão Homologada: <strong>v{exportData.versao}</strong></span>
          </div>
          <span className="text-slate-400">
            Exportado em: {new Date(exportData.exportadoEm).toLocaleString('pt-BR')}
          </span>
        </div>

        {/* Aviso de Não Publicação Automática */}
        <p className="mt-2 text-[11px] text-slate-400">
          ℹ️ Este artefato é gerado exclusivamente para seu uso e publicação humana externa (LinkedIn,
          GitHub, site pessoal). Nenhum envio automático a plataformas externas é executado pelo workspace.
        </p>

        {/* Visualizador do Markdown */}
        <div className="mt-4">
          <div className="p-4 rounded-lg bg-slate-950 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed border border-slate-800/80 max-h-[420px] overflow-y-auto selection:bg-emerald-900 selection:text-white" data-testid="export-case-markdown">
            {exportData.markdown}
          </div>
        </div>

        {/* Footer com Ações */}
        <div className="flex items-center justify-end gap-3 mt-5 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-700 bg-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            data-testid="btn-copy-export-md"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copiado para o Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copiar Markdown</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white transition-colors"
            data-testid="btn-download-export-md"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Baixar .md Sanitizado</span>
          </button>
        </div>
      </div>
    </div>
  );
}
