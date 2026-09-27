'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Info,
  Clock
} from 'lucide-react';
import { ProblemaQualidade } from '@/core/domain/entities/problema-qualidade';
import { StatusProblemaQualidade, ROTULOS_STATUS_PROBLEMA_QUALIDADE } from '@/core/domain/enums/status-problema-qualidade';
import { updateQualityProblemStatusAction } from '@/app/actions/quality-actions';

interface UpdateProblemStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  problem: ProblemaQualidade | null;
  demandaId: string;
  onSuccess: (updated: ProblemaQualidade) => void;
}

export function UpdateProblemStatusModal({
  isOpen,
  onClose,
  problem,
  demandaId,
  onSuccess,
}: UpdateProblemStatusModalProps) {
  const [novoStatus, setNovoStatus] = useState<StatusProblemaQualidade>(
    problem?.status || StatusProblemaQualidade.TRATADO
  );
  const [justificativa, setJustificativa] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (problem) {
      setNovoStatus(problem.status);
      setJustificativa('');
      setErrorMessage(null);
    }
  }, [problem]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !problem) return null;

  const charCount = justificativa.trim().length;
  const isJustificativaValida = charCount >= 15;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isJustificativaValida) {
      setErrorMessage('A justificativa da alteração de status é obrigatória e deve conter no mínimo 15 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await updateQualityProblemStatusAction({
        problemaId: problem.id,
        demandaId,
        novoStatus,
        justificativa: justificativa.trim(),
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Falha ao atualizar o status.');
      } else {
        onSuccess(res.data);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro inesperado ao atualizar o status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      data-testid="update-problem-status-modal"
    >
      <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header do Modal */}
        <div className="flex items-center justify-between border-b border-slate-800 p-5 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Atualizar Status Operacional
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">
                {problem.titulo}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Fechar Modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {errorMessage && (
            <div className="rounded-lg border border-rose-800 bg-rose-950/60 p-3 text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Seleção do Novo Status */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Novo Status do Problema:
            </label>
            <select
              value={novoStatus}
              onChange={(e) => setNovoStatus(e.target.value as StatusProblemaQualidade)}
              data-testid="select-new-problem-status"
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value={StatusProblemaQualidade.TRATADO}>
                {ROTULOS_STATUS_PROBLEMA_QUALIDADE[StatusProblemaQualidade.TRATADO]} (Problema corrigido e resolvido)
              </option>
              <option value={StatusProblemaQualidade.ACEITO_COMO_RESTRICAO}>
                {ROTULOS_STATUS_PROBLEMA_QUALIDADE[StatusProblemaQualidade.ACEITO_COMO_RESTRICAO]} (Aceito como limitação conhecida)
              </option>
              <option value={StatusProblemaQualidade.EM_INVESTIGACAO}>
                {ROTULOS_STATUS_PROBLEMA_QUALIDADE[StatusProblemaQualidade.EM_INVESTIGACAO]} (Análise e tratamento em andamento)
              </option>
              <option value={StatusProblemaQualidade.ABERTO}>
                {ROTULOS_STATUS_PROBLEMA_QUALIDADE[StatusProblemaQualidade.ABERTO]} (Em aberto)
              </option>
            </select>
          </div>

          {/* Justificativa Formal Mandatória */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Justificativa da Alteração: <span className="text-rose-400">*</span>
              </label>
              <span
                className={`text-[11px] font-mono ${
                  isJustificativaValida ? 'text-emerald-400 font-semibold' : 'text-amber-400'
                }`}
                data-testid="status-justificativa-char-count"
              >
                {charCount} / 15 caracteres mínimos
              </span>
            </div>

            <textarea
              rows={4}
              required
              placeholder="Descreva a ação de correção realizada ou o motivo da aceitação da restrição (mínimo de 15 caracteres obrigatório)..."
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              data-testid="textarea-status-justificativa"
              className="w-full rounded-lg bg-slate-950 border border-slate-800 p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              A alteração de status é registrada de forma auditável e reavalia imediatamente o Quality Gate.
            </p>
          </div>

          {/* Footer do Modal */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isJustificativaValida}
              data-testid="btn-confirm-status-update"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Atualizando...</span>
                </>
              ) : (
                <span>Confirmar Atualização</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
