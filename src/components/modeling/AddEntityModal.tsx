'use client';

import React, { useState } from 'react';
import { X, Table, Plus, Loader2 } from 'lucide-react';
import { AtivoDados } from '@/core/domain/entities/ativo-dados';
import { TipoEntidadeAnalitica } from '@/core/domain/enums/tipo-entidade-analitica';
import { PapelEntidadeAnalitica } from '@/core/domain/enums/papel-entidade-analitica';
import { adicionarEntidadeAnaliticaAction } from '@/app/actions/modeling-actions';

interface AddEntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  modeloId: string;
  demandaId: string;
  initialAssets?: AtivoDados[];
  onSuccess: (msg: string) => void;
}

export function AddEntityModal({
  isOpen,
  onClose,
  modeloId,
  demandaId,
  initialAssets = [],
  onSuccess,
}: AddEntityModalProps) {
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<TipoEntidadeAnalitica>(TipoEntidadeAnalitica.DIMENSAO);
  const [papel, setPapel] = useState<PapelEntidadeAnalitica>(PapelEntidadeAnalitica.DIMENSAO_PADRAO);
  const [ativoDadosId, setAtivoDadosId] = useState<string>('');
  const [descricao, setDescricao] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTipoChange = (newTipo: TipoEntidadeAnalitica) => {
    setTipo(newTipo);
    if (newTipo === TipoEntidadeAnalitica.FATO) {
      setPapel(PapelEntidadeAnalitica.FATO_TRANSACIONAL);
    } else {
      setPapel(PapelEntidadeAnalitica.DIMENSAO_PADRAO);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || nome.length < 2) {
      setError('O nome da entidade deve ter ao menos 2 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await adicionarEntidadeAnaliticaAction(
        {
          modeloId,
          nome: nome.trim(),
          tipo,
          papel,
          ativoDadosId: ativoDadosId ? ativoDadosId : null,
          descricao: descricao.trim() || undefined,
        },
        demandaId
      );

      if (!res.success) {
        setError(res.error || 'Falha ao adicionar entidade analítica.');
      } else {
        onSuccess(`Entidade "${nome}" adicionada com sucesso!`);
        setNome('');
        setDescricao('');
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado ao adicionar entidade.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      data-testid="add-entity-modal"
    >
      <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Table className="h-5 w-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">Adicionar Entidade Analítica</h3>
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
              Nome da Entidade *
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Dim_Cliente, Fato_Vendas"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              data-testid="input-entity-name"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Classificação Dimensional *
              </label>
              <select
                value={tipo}
                onChange={(e) => handleTipoChange(e.target.value as TipoEntidadeAnalitica)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                data-testid="select-entity-type"
              >
                <option value={TipoEntidadeAnalitica.DIMENSAO}>DIMENSÃO</option>
                <option value={TipoEntidadeAnalitica.FATO}>FATO</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Papel da Entidade *
              </label>
              <select
                value={papel}
                onChange={(e) => setPapel(e.target.value as PapelEntidadeAnalitica)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                data-testid="select-entity-role"
              >
                {tipo === TipoEntidadeAnalitica.FATO ? (
                  <>
                    <option value={PapelEntidadeAnalitica.FATO_TRANSACIONAL}>Fato Transacional</option>
                    <option value={PapelEntidadeAnalitica.FATO_ACUMULADA}>Fato Acumulada</option>
                  </>
                ) : (
                  <>
                    <option value={PapelEntidadeAnalitica.DIMENSAO_PADRAO}>Dimensão Padrão</option>
                    <option value={PapelEntidadeAnalitica.DIMENSAO_CONFORMADA}>Dimensão Conformada</option>
                    <option value={PapelEntidadeAnalitica.DIMENSAO_CALENDARIO}>Dimensão Calendário</option>
                    <option value={PapelEntidadeAnalitica.TABELA_PONTE}>Tabela Ponte</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Ativo de Dados de Origem (Opcional)
            </label>
            <select
              value={ativoDadosId}
              onChange={(e) => setAtivoDadosId(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              data-testid="select-entity-asset"
            >
              <option value="">Nenhum ativo vinculado (Conceitual / Derivada)</option>
              {initialAssets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.nome_arquivo} ({asset.formato})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Descrição / Grão da Entidade
            </label>
            <textarea
              rows={2}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Uma linha por cliente cadastrado na base corporativa."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              data-testid="input-entity-description"
            />
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
              data-testid="btn-submit-add-entity"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Adicionando...' : 'Adicionar Entidade'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
