'use client';

import React, { useState } from 'react';
import { PauseCircle, AlertTriangle, X } from 'lucide-react';
import { suspendDemandAction } from '@/app/actions/workflow-actions';

interface SuspendDemandModalProps {
  isOpen: boolean;
  onClose: () => void;
  demandaId: string;
  demandaTitulo: string;
  onSuccess?: () => void;
}

const MOTIVOS_SUGERIDOS = [
  'Aguardando decisão do cliente',
  'Contrato ou faturamento pausado',
  'Aguardando envio de base de dados suplementar',
  'Auditoria interna do cliente',
  'Inviabilidade técnica temporária',
];

export function SuspendDemandModal({
  isOpen,
  onClose,
  demandaId,
  demandaTitulo,
  onSuccess,
}: SuspendDemandModalProps) {
  const [motivoSelecionado, setMotivoSelecionado] = useState(MOTIVOS_SUGERIDOS[0]);
  const [detalhes, setDetalhes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const justificativaCompleta = detalhes.trim()
      ? `[${motivoSelecionado}] ${detalhes.trim()}`
      : motivoSelecionado;

    if (justificativaCompleta.length < 5) {
      setError('A justificativa de suspensão deve conter no mínimo 5 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const res = await suspendDemandAction({
        demandaId,
        justificativa: justificativaCompleta,
      });

      if (!res.success) {
        setError(res.error || 'Erro ao suspender demanda.');
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
        data-testid="modal-suspend-demand"
        className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-base">
            <PauseCircle className="h-5 w-5" />
            <span>Suspender Demanda</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
            data-testid="btn-close-suspend-modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300">
          Você está suspendendo temporariamente a demanda <strong className="text-white">{demandaTitulo}</strong>.
          O estado operacional atual será congelado e preservado para permitir a retomada exata posterior.
        </p>

        {error && (
          <div 
            data-testid="suspend-modal-error"
            className="flex items-center gap-2 rounded-lg bg-red-950/60 border border-red-800/80 p-3 text-xs text-red-300"
          >
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Motivo da Suspensão:
            </label>
            <select
              value={motivoSelecionado}
              onChange={(e) => setMotivoSelecionado(e.target.value)}
              data-testid="select-suspend-reason"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
            >
              {MOTIVOS_SUGERIDOS.map((m) => (
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
              placeholder="Descreva o contexto formal da pausa solicitado pelo cliente ou impedimento..."
              data-testid="input-suspend-justification"
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs text-slate-200 focus:border-amber-500 focus:outline-none placeholder:text-slate-600"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              data-testid="btn-confirm-suspend"
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-500 disabled:opacity-50 transition-colors"
            >
              <PauseCircle className="h-4 w-4" />
              <span>{loading ? 'Suspendendo...' : 'Confirmar Suspensão'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
