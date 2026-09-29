'use client';

import React, { useState } from 'react';
import { X, Layers, Sparkles, Loader2 } from 'lucide-react';
import { TipoArquiteturaModelo } from '@/core/domain/enums/tipo-arquitetura-modelo';
import { criarModeloAnaliticoAction } from '@/app/actions/modeling-actions';

interface CreateModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  demandaId: string;
  datasetAutorizadoId: string;
  datasetVersao: string;
  onSuccess: (msg: string) => void;
}

export function CreateModelModal({
  isOpen,
  onClose,
  demandaId,
  datasetAutorizadoId,
  datasetVersao,
  onSuccess,
}: CreateModelModalProps) {
  const [nome, setNome] = useState('Modelo Analítico Dimensional');
  const [descricao, setDescricao] = useState('Modelo estrela com grão transacional baseado no dataset autorizado.');
  const [tipoArquitetura, setTipoArquitetura] = useState<TipoArquiteturaModelo>(TipoArquiteturaModelo.ESTRELA);
  const [proporEntidadeFato, setProporEntidadeFato] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const res = await criarModeloAnaliticoAction({
        demandaId,
        datasetAutorizadoId,
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
        tipoArquitetura,
        proporEntidadeFato,
      });

      if (!res.success) {
        setError(res.error || 'Falha ao criar modelo analítico.');
      } else {
        onSuccess(`Modelo analítico "${nome}" criado com sucesso!`);
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado ao criar modelo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      data-testid="create-model-modal"
    >
      <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">Criar Modelo Analítico</h3>
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
              Dataset Autorizado Vinculado
            </label>
            <input
              type="text"
              disabled
              value={`Dataset Autorizado (${datasetVersao})`}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-400"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Nome do Modelo Analítico *
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Modelo Vendas Corporativas"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              data-testid="input-model-name"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Descrição do Grão Central / Granularidade Analítica
            </label>
            <textarea
              rows={2}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Uma linha por transação de venda registrada no ERP."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              data-testid="input-model-description"
            />
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Declaração do significado de cada registro para atender à regra M-02.
            </span>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Tipo de Arquitetura Dimensional
            </label>
            <select
              value={tipoArquitetura}
              onChange={(e) => setTipoArquitetura(e.target.value as TipoArquiteturaModelo)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              data-testid="select-model-architecture"
            >
              <option value={TipoArquiteturaModelo.ESTRELA}>Estrela (Star Schema) — Recomendado</option>
              <option value={TipoArquiteturaModelo.SNOWFLAKE}>Floco de Neve (Snowflake)</option>
              <option value={TipoArquiteturaModelo.TABELA_UNICA}>Tabela Única (Flat)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="chk-propor-fato"
              checked={proporEntidadeFato}
              onChange={(e) => setProporEntidadeFato(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500"
              data-testid="chk-propose-fact"
            />
            <label htmlFor="chk-propor-fato" className="text-slate-300 select-none cursor-pointer">
              Propor automaticamente Entidade Fato inicial a partir do schema do dataset
            </label>
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
              data-testid="btn-submit-create-model"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Criando...' : 'Criar Modelo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
