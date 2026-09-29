'use client';

import React, { useState, useEffect } from 'react';
import { X, Edit, Loader2 } from 'lucide-react';
import { ModeloAnaliticoCompleto } from '@/core/domain/entities/modelo-analitico';
import { TipoArquiteturaModelo } from '@/core/domain/enums/tipo-arquitetura-modelo';
import { atualizarModeloAnaliticoAction } from '@/app/actions/modeling-actions';

interface EditModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelo: ModeloAnaliticoCompleto;
  demandaId: string;
  onSuccess: (msg: string) => void;
}

export function EditModelModal({
  isOpen,
  onClose,
  modelo,
  demandaId,
  onSuccess,
}: EditModelModalProps) {
  const [nome, setNome] = useState(modelo.nome);
  const [descricao, setDescricao] = useState(modelo.descricao || '');
  const [tipoArquitetura, setTipoArquitetura] = useState<TipoArquiteturaModelo>(modelo.tipo_arquitetura);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNome(modelo.nome);
    setDescricao(modelo.descricao || '');
    setTipoArquitetura(modelo.tipo_arquitetura);
  }, [modelo]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || nome.length < 3) {
      setError('O nome do modelo deve ter ao menos 3 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await atualizarModeloAnaliticoAction(
        {
          id: modelo.id,
          nome: nome.trim(),
          descricao: descricao.trim() || undefined,
          tipoArquitetura,
        },
        demandaId
      );

      if (!res.success) {
        setError(res.error || 'Falha ao atualizar modelo analítico.');
      } else {
        onSuccess('Metadados do modelo atualizados com sucesso!');
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado ao atualizar modelo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      data-testid="edit-model-modal"
    >
      <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">Editar Metadados do Modelo</h3>
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
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Nome do Modelo Analítico *
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              data-testid="input-edit-model-name"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Descrição do Grão Central / Granularidade Analítica
            </label>
            <textarea
              rows={3}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o grão analítico central do modelo..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              data-testid="input-edit-model-description"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Tipo de Arquitetura Dimensional
            </label>
            <select
              value={tipoArquitetura}
              onChange={(e) => setTipoArquitetura(e.target.value as TipoArquiteturaModelo)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              data-testid="select-edit-model-architecture"
            >
              <option value={TipoArquiteturaModelo.ESTRELA}>Estrela (Star Schema)</option>
              <option value={TipoArquiteturaModelo.SNOWFLAKE}>Floco de Neve (Snowflake)</option>
              <option value={TipoArquiteturaModelo.TABELA_UNICA}>Tabela Única (Flat)</option>
            </select>
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
              data-testid="btn-submit-edit-model"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
