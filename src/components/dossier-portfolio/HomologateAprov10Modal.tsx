'use client';

import React, { useState } from 'react';
import { X, Award, ShieldCheck, AlertTriangle } from 'lucide-react';
import { EstudoCasoPortfolio } from '@/core/domain/entities/estudo-caso-portfolio';

interface HomologateAprov10ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (autor: string, justificativa?: string) => Promise<void>;
  caseData: EstudoCasoPortfolio;
  isSubmitting?: boolean;
}

export function HomologateAprov10Modal({
  isOpen,
  onClose,
  onConfirm,
  caseData,
  isSubmitting = false,
}: HomologateAprov10ModalProps) {
  const [autor, setAutor] = useState('');
  const [justificativa, setJustificativa] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!autor.trim()) {
      setErrorMsg('O nome do analista responsável pela homologação é obrigatório.');
      return;
    }

    try {
      setErrorMsg(null);
      await onConfirm(autor.trim(), justificativa.trim() || undefined);
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Falha na homologação formal APROV-10.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto"
      data-testid="modal-homologate-aprov10"
    >
      <div className="relative w-full max-w-lg rounded-xl border border-emerald-800/80 bg-slate-900 shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-emerald-400" />
            <h3 className="text-base font-semibold text-white">
              Homologação Soberana APROV-10
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Resumo da Versão */}
        <div className="mt-4 p-3.5 rounded-lg border border-slate-800 bg-slate-950/70 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Estudo de Caso:</span>
            <span className="text-white font-medium truncate max-w-xs">{caseData.titulo}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Versão Alvo:</span>
            <span className="text-emerald-300 font-mono font-bold">v{caseData.versao}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Checklist de Sanitização:</span>
            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
              <ShieldCheck className="h-3.5 w-3.5" />
              100% Validado (5/5)
            </span>
          </div>
        </div>

        {/* Salvaguarda Informativa Inegociável */}
        <div className="mt-4 p-3.5 rounded-lg border border-blue-900/60 bg-blue-950/30 text-blue-200 text-xs leading-relaxed space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-blue-300">
            <ShieldCheck className="h-4 w-4 text-blue-400" />
            <span>Garantias de Governança & Reversibilidade:</span>
          </div>
          <p>
            1. Esta homologação formal autoriza exclusivamente a geração de artefato para uso
            humano externo (nenhuma publicação automática é realizada).
          </p>
          <p>
            2. Qualquer edição posterior de conteúdo material invalidará deterministicamente esta
            homologação e retornará o status para RASCUNHO.
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nome do Analista Responsável <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={autor}
              disabled={isSubmitting}
              onChange={(e) => setAutor(e.target.value)}
              placeholder="Ex: José Flávio Santana (Analista Sênior)"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              data-testid="input-aprov10-autor"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Justificativa ou Parecer da Homologação (Opcional)
            </label>
            <textarea
              rows={3}
              value={justificativa}
              disabled={isSubmitting}
              onChange={(e) => setJustificativa(e.target.value)}
              placeholder="Ex: Todas as métricas foram conciliadas e mascaradas. Modelo adequado para portfólio profissional de BI."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
              data-testid="textarea-aprov10-justificativa"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg border border-rose-800 bg-rose-950/40 text-rose-200 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Footer Ações */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-2 rounded-lg border border-slate-700 bg-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white transition-colors disabled:opacity-50"
              data-testid="btn-confirm-aprov10"
            >
              <Award className="h-4 w-4" />
              <span>{isSubmitting ? 'Homologando...' : 'Homologar Formalmente (APROV-10)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
