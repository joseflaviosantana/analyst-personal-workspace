'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface ConfirmEncerramentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (justificativa?: string) => Promise<void>;
  demandaTitulo: string;
  isSubmitting?: boolean;
}

export function ConfirmEncerramentoModal({
  isOpen,
  onClose,
  onConfirm,
  demandaTitulo,
  isSubmitting = false,
}: ConfirmEncerramentoModalProps) {
  const [justificativa, setJustificativa] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrorMsg(null);
      await onConfirm(justificativa.trim() ? justificativa.trim() : undefined);
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Falha ao formalizar conclusão da demanda.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
      data-testid="modal-confirm-encerramento"
    >
      <div className="relative w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <h3 className="text-base font-semibold text-white">
              Conclusão Soberana da Demanda
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

        {/* Warning Alert */}
        <div className="mt-4 p-3 rounded-lg border border-amber-900/60 bg-amber-950/30 text-amber-200 text-xs flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <strong className="block text-amber-300 mb-0.5">Transição de Estado Terminal</strong>
            Esta ação formaliza a conclusão da demanda <strong>&ldquo;{demandaTitulo}&rdquo;</strong>. Após a conclusão, a demanda entrará em modo somente leitura para preservar a integridade auditável do projeto.
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mt-3 p-3 rounded-lg border border-rose-900/60 bg-rose-950/40 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleConfirm} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Justificativa ou Termo de Encerramento (opcional)
            </label>
            <textarea
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              placeholder="Ex: Entregáveis aprovados formalmente pelo cliente sem ressalvas pendentes."
              rows={3}
              className="w-full px-3 py-2 text-xs rounded-md bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              data-testid="btn-confirmar-encerramento"
              className="px-4 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-md flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              {isSubmitting ? 'Concluindo...' : 'Formalizar Conclusão'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
