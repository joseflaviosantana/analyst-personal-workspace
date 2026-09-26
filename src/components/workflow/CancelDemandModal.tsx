'use client';

import React, { useState } from 'react';
import { XCircle, AlertTriangle, X } from 'lucide-react';
import { cancelDemandAction } from '@/app/actions/workflow-actions';

interface CancelDemandModalProps {
  isOpen: boolean;
  onClose: () => void;
  demandaId: string;
  demandaTitulo: string;
  onSuccess?: () => void;
}

const MOTIVOS_CANCELAMENTO = [
  'Cancelada por desistência do solicitante/cliente',
  'Rescisão de contrato ou encerramento da iniciativa',
  'Inviabilidade técnica comprovada',
  'Substituída por outra demanda de maior prioridade',
  'Outro motivo corporativo',
];

export function CancelDemandModal({
  isOpen,
  onClose,
  demandaId,
  demandaTitulo,
  onSuccess,
}: CancelDemandModalProps) {
  const [motivo, setMotivo] = useState(MOTIVOS_CANCELAMENTO[0]);
  const [detalhes, setDetalhes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const justificativaCompleta = detalhes.trim()
      ? `[${motivo}] ${detalhes.trim()}`
      : motivo;

    if (justificativaCompleta.length < 5) {
      setError('A justificativa de cancelamento deve conter no mínimo 5 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const res = await cancelDemandAction({
        demandaId,
        justificativa: justificativaCompleta,
      });

      if (!res.success) {
        setError(res.error || 'Erro ao cancelar demanda.');
      } else {
        onSuccess?.();
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div 
        data-testid="modal-cancel-demand"
        className="w-full max-w-lg rounded-xl border border-red-900/60 bg-slate-900 p-6 shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-rose-400 font-semibold text-base">
            <XCircle className="h-5 w-5" />
            <span>Cancelar Demanda</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
            data-testid="btn-close-cancel-modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-lg bg-rose-950/40 border border-rose-900/60 p-3 text-xs text-rose-300 space-y-1">
          <p className="font-semibold flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-rose-400" />
            <span>Atenção: Ação de encerramento excepcional</span>
          </p>
          <p>
            O cancelamento da demanda <strong className="text-white">{demandaTitulo}</strong> interrompe o ciclo de trabalho e congela permanentemente o histórico. Todo o histórico produzido até aqui será preservado.
          </p>
        </div>

        {error && (
          <div 
            data-testid="cancel-modal-error"
            className="flex items-center gap-2 rounded-lg bg-red-950/60 border border-red-800/80 p-3 text-xs text-red-300"
          >
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Motivo do Cancelamento:
            </label>
            <select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              data-testid="select-cancel-reason"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-rose-500 focus:outline-none"
            >
              {MOTIVOS_CANCELAMENTO.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Justificativa Detalhada (Obrigatória):
            </label>
            <textarea
              rows={3}
              value={detalhes}
              onChange={(e) => setDetalhes(e.target.value)}
              placeholder="Descreva a razão formal do cancelamento da demanda..."
              data-testid="input-cancel-justification"
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs text-slate-200 focus:border-rose-500 focus:outline-none placeholder:text-slate-600"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={loading}
              data-testid="btn-confirm-cancel"
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-500 disabled:opacity-50 transition-colors"
            >
              <XCircle className="h-4 w-4" />
              <span>{loading ? 'Cancelando...' : 'Confirmar Cancelamento'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
