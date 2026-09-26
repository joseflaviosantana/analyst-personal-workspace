'use client';

import React, { useState } from 'react';
import { PlayCircle, AlertTriangle, X, ArrowRight } from 'lucide-react';
import { resumeDemandAction } from '@/app/actions/workflow-actions';
import { 
  EstadoDemanda, 
  ROTULOS_ESTADO_DEMANDA, 
  normalizarEstadoDemanda 
} from '@/core/domain/enums/estado-demanda';

interface ResumeDemandModalProps {
  isOpen: boolean;
  onClose: () => void;
  demandaId: string;
  demandaTitulo: string;
  estadoAnterior?: EstadoDemanda | string | null;
  onSuccess?: () => void;
}

export function ResumeDemandModal({
  isOpen,
  onClose,
  demandaId,
  demandaTitulo,
  estadoAnterior,
  onSuccess,
}: ResumeDemandModalProps) {
  const [justificativa, setJustificativa] = useState('Cliente autorizou a retomada das atividades analíticas.');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const estadoRetorno = estadoAnterior ? normalizarEstadoDemanda(estadoAnterior) : EstadoDemanda.NOVA;
  const rotuloRetorno = ROTULOS_ESTADO_DEMANDA[estadoRetorno] || 'Estado Anterior';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (justificativa.trim().length < 5) {
      setError('A justificativa de retomada deve conter no mínimo 5 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const res = await resumeDemandAction({
        demandaId,
        justificativa: justificativa.trim(),
      });

      if (!res.success) {
        setError(res.error || 'Erro ao retomar demanda.');
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
        data-testid="modal-resume-demand"
        className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-base">
            <PlayCircle className="h-5 w-5" />
            <span>Retomar Demanda Suspensa</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
            data-testid="btn-close-resume-modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300">
          Você está retomando a demanda <strong className="text-white">{demandaTitulo}</strong>.
          Conforme as regras de governança, ela retornará exatamente para a etapa em que foi pausada:
        </p>

        <div className="flex items-center gap-3 rounded-lg bg-slate-950 border border-slate-800 p-3 text-xs">
          <span className="text-amber-400 font-semibold">Suspensa</span>
          <ArrowRight className="h-4 w-4 text-slate-500" />
          <span className="text-emerald-400 font-semibold" data-testid="target-resume-state">
            {rotuloRetorno}
          </span>
        </div>

        {error && (
          <div 
            data-testid="resume-modal-error"
            className="flex items-center gap-2 rounded-lg bg-red-950/60 border border-red-800/80 p-3 text-xs text-red-300"
          >
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Justificativa de Retomada (Obrigatória):
            </label>
            <textarea
              rows={3}
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              placeholder="Descreva a autorização ou motivo do retorno ao fluxo..."
              data-testid="input-resume-justification"
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none placeholder:text-slate-600"
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
              data-testid="btn-confirm-resume"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 transition-colors"
            >
              <PlayCircle className="h-4 w-4" />
              <span>{loading ? 'Retomando...' : 'Confirmar Retomada'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
