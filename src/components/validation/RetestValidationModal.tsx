'use client';

import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Loader2, ArrowRight } from 'lucide-react';
import { ValidacaoConciliacao } from '@/core/domain/entities/validacao-conciliacao';
import { retestarValidacaoAction } from '@/app/actions/validation-actions';

interface RetestValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  validacao: ValidacaoConciliacao | null;
  demandaId: string;
  onSuccess: (msg: string) => void;
}

export function RetestValidationModal({
  isOpen,
  onClose,
  validacao,
  demandaId,
  onSuccess,
}: RetestValidationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [novoValorObtido, setNovoValorObtido] = useState<string>('');
  const [executadoPor, setExecutadoPor] = useState('Analista Responsável');
  const [notasEvidencia, setNotasEvidencia] = useState('');

  useEffect(() => {
    if (validacao) {
      setExecutadoPor(validacao.executado_por || 'Analista Responsável');
      setNovoValorObtido('');
      setNotasEvidencia('');
      setError(null);
    }
  }, [validacao]);

  if (!isOpen || !validacao) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (novoValorObtido.trim() === '') {
      setError('Informe o novo valor obtido na verificação.');
      return;
    }

    const valNum = parseFloat(novoValorObtido);
    if (!Number.isFinite(valNum)) {
      setError('O valor obtido deve ser um número válido.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const res = await retestarValidacaoAction(
      {
        id: validacao.id,
        valor_obtido: valNum,
        executado_por: executadoPor.trim() || 'Analista Responsável',
        notas_evidencia: notasEvidencia.trim() !== '' ? notasEvidencia.trim() : null,
      },
      demandaId
    );

    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error);
    } else {
      const msg = res.data.resultado === 'APROVADO'
        ? `Reteste da validação "${res.data.titulo}" APROVADO com sucesso (dentro da tolerância).`
        : `Reteste da validação "${res.data.titulo}" concluído. Status resultante: ${res.data.resultado}.`;
      onSuccess(msg);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
      data-testid="retest-validation-modal"
    >
      <div className="relative w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">
              Executar Reteste de Validação
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div
            data-testid="retest-modal-error"
            className="mt-4 rounded-lg bg-rose-950/70 border border-rose-800 p-3 text-xs text-rose-300"
          >
            {error}
          </div>
        )}

        {/* Parâmetros Fixos de Referência */}
        <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/80 p-3.5 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Check:</span>
            <span className="font-semibold text-white">{validacao.titulo}</span>
          </div>
          {validacao.base_referencia && (
            <div className="flex justify-between">
              <span className="text-slate-400">Base de Referência:</span>
              <span className="text-slate-300">{validacao.base_referencia}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-slate-800/60 pt-2">
            <span className="text-slate-400">Valor Esperado (Referência):</span>
            <span className="font-bold text-blue-400" data-testid="retest-fixed-expected-value">
              {validacao.valor_esperado !== null && validacao.valor_esperado !== undefined
                ? `${validacao.valor_esperado} ${validacao.unidade_medida || ''}`.trim()
                : 'Não aplicável'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Tolerância Permitida:</span>
            <span className="text-slate-300">
              {validacao.tolerancia_permitida} {validacao.unidade_medida || ''}
            </span>
          </div>
          {validacao.valor_obtido !== null && validacao.valor_obtido !== undefined && (
            <div className="flex justify-between text-amber-300/90">
              <span>Valor Obtido Anterior:</span>
              <span>{validacao.valor_obtido} (Desvio: {validacao.divergencia_absoluta})</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300">
              Novo Valor Obtido (Apurado após ajuste) <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              step="any"
              required
              autoFocus
              value={novoValorObtido}
              onChange={(e) => setNovoValorObtido(e.target.value)}
              placeholder="Digite o novo valor apurado"
              data-testid="input-retest-obtained-value"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300">
              Executor do Reteste
            </label>
            <input
              type="text"
              value={executadoPor}
              onChange={(e) => setExecutadoPor(e.target.value)}
              placeholder="Analista Responsável"
              data-testid="input-retest-executed-by"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300">
              Notas do Reteste / Ajuste Realizado (Opcional)
            </label>
            <textarea
              rows={2}
              value={notasEvidencia}
              onChange={(e) => setNotasEvidencia(e.target.value)}
              placeholder="Ex.: Corrigido cálculo DAX de devoluções no Power BI e recalculado."
              data-testid="input-retest-notes"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              data-testid="btn-submit-retest"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 transition-colors"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Avaliando Reteste...' : 'Confirmar Reteste'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
