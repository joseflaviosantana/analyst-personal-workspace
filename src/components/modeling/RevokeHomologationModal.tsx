'use client';

import React, { useState } from 'react';
import { X, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { revogarHomologacaoModeloAction } from '@/app/actions/modeling-actions';

interface RevokeHomologationModalProps {
  isOpen: boolean;
  onClose: () => void;
  modeloId: string;
  modeloNome: string;
  demandaId: string;
  onSuccess: (msg: string) => void;
}

export function RevokeHomologationModal({
  isOpen,
  onClose,
  modeloId,
  modeloNome,
  demandaId,
  onSuccess,
}: RevokeHomologationModalProps) {
  const [motivo, setMotivo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (motivo.trim().length < 15) {
      setError('O motivo da revogação deve conter no mínimo 15 caracteres.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await revogarHomologacaoModeloAction(
        {
          modeloId,
          motivo: motivo.trim(),
        },
        demandaId
      );

      if (!res.success) {
        setError(res.error || 'Falha ao revogar homologação do modelo.');
      } else {
        onSuccess(`Homologação do modelo "${modeloNome}" revogada formalmente.`);
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado ao revogar homologação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      data-testid="revoke-homologation-modal"
    >
      <div className="w-full max-w-lg rounded-xl border border-rose-900/80 bg-slate-900 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-rose-400" />
            <h3 className="text-base font-bold text-white">Revogar Homologação de Modelo</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-rose-950/70 border border-rose-800 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="rounded-lg bg-rose-950/30 border border-rose-900/50 p-3 text-rose-300 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-rose-200">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>Atenção: Ação de Governança Estrita</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              A revogação cancela a vigência da homologação do modelo &quot;{modeloNome}&quot;. A demanda não poderá avançar para Validação até que um novo ciclo de homologação seja formalizado.
            </p>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Motivo Formal da Revogação * (Mínimo 15 caracteres)
            </label>
            <textarea
              rows={3}
              required
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Descreva o motivo que fundamenta a revogação técnica deste modelo analítico..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-rose-500"
              data-testid="input-revoke-justification"
            />
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Caracteres digitados: {motivo.trim().length} / 15 mínimo
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              data-testid="btn-submit-revoke-homologation"
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 transition-colors disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Revogando...' : 'Confirmar Revogação'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
