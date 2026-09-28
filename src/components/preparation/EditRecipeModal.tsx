'use client';

import React, { useState, useEffect } from 'react';
import { X, Edit3, Loader2 } from 'lucide-react';
import { atualizarReceitaPreparacaoAction } from '@/app/actions/preparation-actions';
import { ReceitaPreparacao } from '@/core/domain/entities/receita-preparacao';

interface EditRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  receita: ReceitaPreparacao | null;
  demandaId: string;
  onSuccess: (receita: ReceitaPreparacao) => void;
}

export function EditRecipeModal({
  isOpen,
  onClose,
  receita,
  demandaId,
  onSuccess,
}: EditRecipeModalProps) {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (receita) {
      setTitulo(receita.titulo);
      setDescricao(receita.descricao || '');
      setError(null);
    }
  }, [receita]);

  if (!isOpen || !receita) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (titulo.trim().length < 3) {
      setError('O título da receita deve conter no mínimo 3 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await atualizarReceitaPreparacaoAction(
        {
          id: receita.id,
          titulo: titulo.trim(),
          descricao: descricao.trim() || null,
        },
        demandaId
      );

      if (!res.success) {
        setError(res.error || 'Erro ao atualizar receita.');
      } else {
        onSuccess(res.data);
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado ao atualizar receita.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      data-testid="edit-recipe-modal"
    >
      <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">Editar Metadados da Receita</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="btn-close-edit-recipe-modal"
            className="text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div
            className="rounded-lg border border-rose-800 bg-rose-950/60 p-3 text-xs text-rose-300"
            data-testid="error-edit-recipe"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="edit-recipe-title" className="block text-xs font-semibold text-slate-300 mb-1">
              Título da Receita <span className="text-rose-400">*</span>
            </label>
            <input
              id="edit-recipe-title"
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              data-testid="input-edit-recipe-title"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="edit-recipe-desc" className="block text-xs font-semibold text-slate-300 mb-1">
              Descrição / Objetivo Técnico
            </label>
            <textarea
              id="edit-recipe-desc"
              rows={3}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              data-testid="input-edit-recipe-description"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
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
              data-testid="btn-submit-edit-recipe"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>Salvar Alterações</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
