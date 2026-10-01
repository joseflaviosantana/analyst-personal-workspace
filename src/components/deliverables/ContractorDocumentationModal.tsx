'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Download, FileText } from 'lucide-react';

interface ContractorDocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  markdownContent: string;
  demandaTitulo: string;
}

export function ContractorDocumentationModal({
  isOpen,
  onClose,
  markdownContent,
  demandaTitulo,
}: ContractorDocumentationModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdownContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(false);
    }
  };

  const handleDownload = () => {
    const slug = demandaTitulo
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    const filename = `relatorio-entrega-${slug || 'demanda'}.md`;

    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
      data-testid="modal-contractor-documentation"
    >
      <div className="relative w-full max-w-3xl rounded-xl border border-slate-800 bg-slate-900 shadow-2xl p-6 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-semibold text-white">
                Memorial Executivo de Entrega Técnica
              </h3>
              <p className="text-xs text-slate-400">
                Documentação formal para apresentação ao contratante / stakeholder
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="mt-4 flex-1 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap select-text">
          {markdownContent}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 shrink-0 mt-4">
          <span className="text-[11px] text-slate-500">
            Documento gerado determinística e factualmente a partir dos registros do projeto.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              data-testid="btn-copiar-documentacao"
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-400" />
                  <span>Copiar Markdown</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              data-testid="btn-download-documentacao"
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Baixar Relatório (.md)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
