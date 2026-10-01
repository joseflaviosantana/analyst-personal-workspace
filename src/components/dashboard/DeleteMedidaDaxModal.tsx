'use client';

/**
 * src/components/dashboard/DeleteMedidaDaxModal.tsx
 *
 * Modal de Confirmação de Exclusão de Medida DAX (Subgate 3.4C)
 *
 * Princípios de Governança:
 * - Exige confirmação humana explícita antes de remover do modelo tabular;
 * - Alerta sobre possíveis impactos na regra D-02 caso a medida esteja vinculada a uma métrica;
 * - Executa exclusão física no SQLite via excluirMedidaDaxAction.
 */

import React, { useState } from 'react';
import { X, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { MedidaDax } from '@/core/domain/entities/medida-dax';
import { excluirMedidaDaxAction } from '@/app/actions/dashboard-actions';

interface DeleteMedidaDaxModalProps {
  isOpen: boolean;
  onClose: () => void;
  medida: MedidaDax;
  demandaId: string;
  hasLinhagem: boolean;
  onSuccess: () => void;
}

export function DeleteMedidaDaxModal({
  isOpen,
  onClose,
  medida,
  demandaId,
  hasLinhagem,
  onSuccess,
}: DeleteMedidaDaxModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await excluirMedidaDaxAction(medida.id, demandaId);
      if (!res.success) {
        setError(res.error || 'Falha ao excluir medida DAX.');
      } else {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado ao excluir medida.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      data-testid="delete-medida-dax-modal"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Excluir Medida DAX</h3>
              <p className="text-xs text-slate-400 mt-0.5">Confirmação de remoção permanente</p>
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

        {error && (
          <div className="rounded-lg bg-rose-950/60 border border-rose-800/80 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        <div className="space-y-3 text-xs text-slate-300">
          <p>
            Tem certeza que deseja excluir a medida <strong className="text-white">[{medida.nome}]</strong> da tabela{' '}
            <span className="font-mono text-slate-400">{medida.tabela_hospedeira}</span>?
          </p>

          {hasLinhagem && (
            <div className="p-3 rounded-lg border border-amber-800/60 bg-amber-950/30 text-amber-300 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-400" />
              <div className="leading-relaxed">
                <span className="font-bold block">Impacto na Regra D-02:</span>
                Esta medida está vinculada a uma métrica homologada do modelo analítico. Sua exclusão deixará a métrica sem implementação DAX, gerando alerta de conformidade.
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 font-semibold text-slate-300 hover:text-white hover:bg-slate-700 transition-colors text-xs"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isSubmitting}
            data-testid="btn-confirm-delete-medida"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 font-semibold text-white hover:bg-rose-500 transition-colors shadow-lg shadow-rose-900/30 text-xs disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Excluindo...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                <span>Excluir Definitivamente</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
