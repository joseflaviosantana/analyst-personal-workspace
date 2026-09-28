'use client';

import React, { useState } from 'react';
import { X, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { cancelarEtapaTransformacaoAction } from '@/app/actions/preparation-actions';
import { EtapaTransformacao } from '@/core/domain/entities/etapa-transformacao';

interface CancelTransformationStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  etapa: EtapaTransformacao | null;
  demandaId: string;
  onSuccess: (etapa: EtapaTransformacao) => void;
}

export function CancelTransformationStepModal({
  isOpen,
  onClose,
  etapa,
  demandaId,
  onSuccess,
}: CancelTransformationStepModalProps) {
  const [justificativa, setJustificativa] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !etapa) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (justificativa.trim().length < 15) {
      setError('A justificativa de cancelamento da etapa deve conter no mínimo 15 caracteres explicativos.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await cancelarEtapaTransformacaoAction(
        {
          id: etapa.id,
          justificativa: justificativa.trim(),
        },
        demandaId
      );

      if (!res.success) {
        setError(res.error || 'Erro ao cancelar etapa.');
      } else {
        onSuccess(res.data);
        onClose();
        setJustificativa('');
      }
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado ao cancelar etapa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      data-testid="cancel-step-modal"
    >
      <div className="w-full max-w-lg rounded-xl border border-rose-900 bg-slate-900 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-rose-400" />
            <h3 className="text-base font-bold text-white">Cancelar Etapa #{etapa.ordem} Auditadamente</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="btn-close-cancel-step-modal"
            className="text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-lg border border-amber-800/80 bg-amber-950/30 p-3 text-xs text-amber-300 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            Esta ação descontinua a etapa #{etapa.ordem} ({etapa.tipo_operacao}), preservando seu registro histórico na trilha de auditoria para integridade e governança.
          </span>
        </div>

        {error && (
          <div
            className="rounded-lg border border-rose-800 bg-rose-950/60 p-3 text-xs text-rose-300"
            data-testid="error-cancel-step"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="cancel-step-justification" className="block text-xs font-semibold text-slate-300 mb-1">
              Justificativa Formal do Cancelamento <span className="text-rose-400">*</span>
            </label>
            <textarea
              id="cancel-step-justification"
              rows={3}
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              placeholder="Explique tecnicamente por que esta etapa não é mais necessária ou foi substituída (mínimo 15 caracteres)..."
              data-testid="input-cancel-step-justification"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-rose-500 focus:outline-none"
              required
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Caracteres: {justificativa.trim().length} / 15 mínimos exigidos
            </span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || justificativa.trim().length < 15}
              data-testid="btn-submit-cancel-step"
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-700 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Cancelando...</span>
                </>
              ) : (
                <span>Confirmar Cancelamento</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
