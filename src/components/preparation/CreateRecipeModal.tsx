'use client';

import React, { useState } from 'react';
import { X, FileCode2, Loader2 } from 'lucide-react';
import { criarReceitaPreparacaoAction } from '@/app/actions/preparation-actions';
import { ReceitaPreparacao } from '@/core/domain/entities/receita-preparacao';

interface CreateRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  demandaId: string;
  onSuccess: (receita: ReceitaPreparacao) => void;
}

export function CreateRecipeModal({
  isOpen,
  onClose,
  demandaId,
  onSuccess,
}: CreateRecipeModalProps) {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (titulo.trim().length < 3) {
      setError('O título da receita deve conter no mínimo 3 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await criarReceitaPreparacaoAction({
        demanda_id: demandaId,
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
      });

      if (!res.success) {
        setError(res.error || 'Erro ao criar receita de preparação.');
      } else {
        onSuccess(res.data);
        onClose();
        setTitulo('');
        setDescricao('');
      }
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado ao criar receita.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      data-testid="create-recipe-modal"
    >
      <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileCode2 className="h-5 w-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">Nova Receita de Preparação</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="btn-close-create-recipe-modal"
            className="text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div
            className="rounded-lg border border-rose-800 bg-rose-950/60 p-3 text-xs text-rose-300"
            data-testid="error-create-recipe"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="create-recipe-title" className="block text-xs font-semibold text-slate-300 mb-1">
              Título da Receita <span className="text-rose-400">*</span>
            </label>
            <input
              id="create-recipe-title"
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Tratamento e Higienização de Vendas Corporativas"
              data-testid="input-recipe-title"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="create-recipe-desc" className="block text-xs font-semibold text-slate-300 mb-1">
              Descrição / Objetivo Técnico
            </label>
            <textarea
              id="create-recipe-desc"
              rows={3}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o escopo da preparação, as ferramentas planejadas e o resultado esperado..."
              data-testid="input-recipe-description"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
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
              data-testid="btn-submit-create-recipe"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Criando...</span>
                </>
              ) : (
                <span>Criar Receita</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
