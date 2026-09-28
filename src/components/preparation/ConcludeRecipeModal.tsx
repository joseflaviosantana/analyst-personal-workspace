'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import { concluirReceitaPreparacaoAction } from '@/app/actions/preparation-actions';
import { ReceitaPreparacao } from '@/core/domain/entities/receita-preparacao';

interface ConcludeRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  receita: ReceitaPreparacao | null;
  demandaId: string;
  totalEtapasValidadas: number;
  onSuccess: (concluida: ReceitaPreparacao) => void;
}

export function ConcludeRecipeModal({
  isOpen,
  onClose,
  receita,
  demandaId,
  totalEtapasValidadas,
  onSuccess,
}: ConcludeRecipeModalProps) {
  const [justificativa, setJustificativa] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !receita) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await concluirReceitaPreparacaoAction(
        {
          receita_id: receita.id,
          justificativa: justificativa.trim() || undefined,
          autor_tipo: 'HUMANO',
        },
        demandaId
      );

      if (!res.success) {
        setError(res.error || 'Erro ao concluir receita.');
      } else {
        onSuccess(res.data);
        onClose();
        setJustificativa('');
      }
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado ao concluir receita.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      data-testid="conclude-recipe-modal"
    >
      <div className="w-full max-w-lg rounded-xl border border-emerald-800 bg-slate-900 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Concluir Receita de Preparação</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="btn-close-conclude-modal"
            className="text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-lg border border-emerald-900/60 bg-emerald-950/20 p-3 text-xs text-emerald-300 leading-relaxed">
          A conclusão formal promoverá a receita <strong>&quot;{receita.titulo}&quot;</strong> para o status <strong>CONCLUÍDA</strong> com base em <strong>{totalEtapasValidadas} etapa(s) validadas</strong> por diagnóstico de qualidade.
        </div>

        {error && (
          <div
            className="rounded-lg border border-rose-800 bg-rose-950/60 p-3 text-xs text-rose-300"
            data-testid="error-conclude-recipe"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="conclude-justification" className="block text-xs font-semibold text-slate-300 mb-1">
              Justificativa / Parecer Final da Preparação (Opcional)
            </label>
            <textarea
              id="conclude-justification"
              rows={3}
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              placeholder="Parecer técnico atestando que todas as transformações foram concluídas e validadas com sucesso..."
              data-testid="input-conclude-justification"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              data-testid="btn-submit-conclude-recipe"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Concluindo...</span>
                </>
              ) : (
                <span>Confirmar Conclusão</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
