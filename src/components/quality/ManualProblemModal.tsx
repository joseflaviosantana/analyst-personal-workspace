'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  AlertTriangle,
  Loader2,
  FileEdit,
  Database,
  Info
} from 'lucide-react';
import { AtivoDados } from '@/core/domain/entities/ativo-dados';
import { ProblemaQualidade } from '@/core/domain/entities/problema-qualidade';
import { CategoriaProblemaQualidade, ROTULOS_CATEGORIA_PROBLEMA_QUALIDADE } from '@/core/domain/enums/categoria-problema-qualidade';
import { registerManualProblemAction } from '@/app/actions/quality-actions';

interface ManualProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: AtivoDados | null;
  demandaId: string;
  diagnosticoId?: string | null;
  onSuccess: (problem: ProblemaQualidade) => void;
}

export function ManualProblemModal({
  isOpen,
  onClose,
  asset,
  demandaId,
  diagnosticoId,
  onSuccess,
}: ManualProblemModalProps) {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [colunaAfetada, setColunaAfetada] = useState('');
  const [categoria, setCategoria] = useState<CategoriaProblemaQualidade>(
    CategoriaProblemaQualidade.ANOMALIA_MANUAL_DECLARADA
  );
  const [totalLinhasAfetadas, setTotalLinhasAfetadas] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Extração das colunas inferidas do ativo
  let availableColumns: string[] = [];
  if (asset?.schema_inferido) {
    try {
      const parsed = JSON.parse(asset.schema_inferido);
      if (typeof parsed === 'object' && parsed !== null) {
        availableColumns = Object.keys(parsed);
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (isOpen) {
      setTitulo('');
      setDescricao('');
      setColunaAfetada('');
      setCategoria(CategoriaProblemaQualidade.ANOMALIA_MANUAL_DECLARADA);
      setTotalLinhasAfetadas(0);
      setErrorMessage(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !asset) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (titulo.trim().length < 3) {
      setErrorMessage('O título da anomalia deve conter no mínimo 3 caracteres.');
      return;
    }
    if (descricao.trim().length < 5) {
      setErrorMessage('A descrição da anomalia deve conter no mínimo 5 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await registerManualProblemAction({
        ativoDadosId: asset.id,
        demandaId,
        diagnosticoId: diagnosticoId || null,
        categoria,
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        tabelaAfetada: asset.nome_arquivo,
        colunaAfetada: colunaAfetada.trim() || null,
        totalLinhasAfetadas: totalLinhasAfetadas >= 0 ? totalLinhasAfetadas : 0,
        percentualLinhasAfetadas:
          asset.total_linhas && asset.total_linhas > 0 && totalLinhasAfetadas > 0
            ? Math.round((totalLinhasAfetadas / asset.total_linhas) * 10000) / 100
            : 0,
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Falha ao registrar anomalia manual.');
      } else {
        onSuccess(res.data);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro inesperado ao registrar a anomalia.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      data-testid="manual-problem-modal"
    >
      <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header do Modal */}
        <div className="flex items-center justify-between border-b border-slate-800 p-5 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-blue-400">
              <FileEdit className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Registrar Anomalia Manual
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">
                Ativo: {asset.nome_arquivo}
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

        {/* Formulário com Scroll */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-300 flex items-start gap-2.5">
            <Info className="h-4 w-4 shrink-0 text-blue-400 mt-0.5" />
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Anomalias registradas manualmente entram na fila com severidade <strong>Pendente</strong> para garantir que recebam deliberação e justificativa no fluxo uniforme de governança.
            </p>
          </div>

          {errorMessage && (
            <div className="rounded-lg border border-rose-800 bg-rose-950/60 p-3 text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Título do Problema */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Título da Anomalia: <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Formato de CEP com pontuação mista e caracteres inválidos"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              data-testid="input-manual-problem-title"
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Categoria da Anomalia:
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as CategoriaProblemaQualidade)}
              data-testid="select-manual-problem-category"
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {Object.entries(ROTULOS_CATEGORIA_PROBLEMA_QUALIDADE).map(([val, rotulo]) => (
                <option key={val} value={val}>
                  {rotulo}
                </option>
              ))}
            </select>
          </div>

          {/* Coluna Afetada */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Coluna Afetada (Opcional):
            </label>
            {availableColumns.length > 0 ? (
              <select
                value={colunaAfetada}
                onChange={(e) => setColunaAfetada(e.target.value)}
                data-testid="select-manual-problem-column"
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Nenhuma coluna específica / Aplicável a múltiplas</option>
                {availableColumns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="Ex: cep_cliente"
                value={colunaAfetada}
                onChange={(e) => setColunaAfetada(e.target.value)}
                data-testid="input-manual-problem-column"
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            )}
          </div>

          {/* Estimativa de Linhas Afetadas */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Estimativa de Linhas Afetadas:
            </label>
            <input
              type="number"
              min={0}
              value={totalLinhasAfetadas}
              onChange={(e) => setTotalLinhasAfetadas(parseInt(e.target.value, 10) || 0)}
              data-testid="input-manual-problem-lines"
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Descrição Detalhada */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Descrição Detalhada da Inconsistência: <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={4}
              required
              placeholder="Descreva o que foi observado e por que representa uma anomalia analítica..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              data-testid="textarea-manual-problem-description"
              className="w-full rounded-lg bg-slate-950 border border-slate-800 p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
            />
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
              disabled={isSubmitting || titulo.trim().length < 3 || descricao.trim().length < 5}
              data-testid="btn-confirm-manual-problem"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Cadastrando...</span>
                </>
              ) : (
                <span>Cadastrar Anomalia</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
