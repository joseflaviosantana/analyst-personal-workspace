'use client';

import React, { useState } from 'react';
import { X, Unlock, AlertTriangle, Loader2 } from 'lucide-react';
import { revogarAutorizacaoDatasetAction } from '@/app/actions/preparation-actions';
import { DatasetAutorizadoAnalise } from '@/core/domain/entities/dataset-autorizado-analise';

interface RevokeDatasetModalProps {
  isOpen: boolean;
  onClose: () => void;
  datasetAutorizado: DatasetAutorizadoAnalise | null;
  demandaId: string;
  onSuccess: (revogado: DatasetAutorizadoAnalise) => void;
}

export function RevokeDatasetModal({
  isOpen,
  onClose,
  datasetAutorizado,
  demandaId,
  onSuccess,
}: RevokeDatasetModalProps) {
  const [motivo, setMotivo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !datasetAutorizado) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (motivo.trim().length < 15) {
      setError('O motivo da revogação deve conter no mínimo 15 caracteres explicativos.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await revogarAutorizacaoDatasetAction(
        {
          autorizacao_id: datasetAutorizado.id,
          motivo_revogacao: motivo.trim(),
        },
        demandaId
      );

      if (!res.success) {
        setError(res.error || 'Erro ao revogar autorização.');
      } else {
        onSuccess(res.data);
        onClose();
        setMotivo('');
      }
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado ao revogar autorização.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      data-testid="revoke-dataset-modal"
    >
      <div className="w-full max-w-lg rounded-xl border border-rose-900 bg-slate-900 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Unlock className="h-5 w-5 text-rose-400" />
            <h3 className="text-base font-bold text-white">Revogar Autorização de Dataset</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="btn-close-revoke-modal"
            className="text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-lg border border-amber-800/80 bg-amber-950/30 p-3 text-xs text-amber-300 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            A revogação cancela a vigência da autorização <strong>v{datasetAutorizado.versao_rotulo}</strong>. O avanço da demanda para Modelagem ficará bloqueado até que uma nova autorização seja homologada.
          </span>
        </div>

        {error && (
          <div
            className="rounded-lg border border-rose-800 bg-rose-950/60 p-3 text-xs text-rose-300"
            data-testid="error-revoke-dataset"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="revoke-reason" className="block text-xs font-semibold text-slate-300 mb-1">
              Motivo Formal da Revogação <span className="text-rose-400">*</span>
            </label>
            <textarea
              id="revoke-reason"
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Explique tecnicamente por que o dataset vigente está sendo revogado (ex: anomalia crítica descoberta, necessidade de novos tratamentos)..."
              data-testid="input-revoke-reason"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-rose-500 focus:outline-none"
              required
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Caracteres: {motivo.trim().length} / 15 mínimos exigidos
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
              disabled={isSubmitting || motivo.trim().length < 15}
              data-testid="btn-submit-revoke-dataset"
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-700 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Revogando...</span>
                </>
              ) : (
                <span>Confirmar Revogação</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
