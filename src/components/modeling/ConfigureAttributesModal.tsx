'use client';

import React, { useState, useEffect } from 'react';
import { X, SlidersHorizontal, Plus, Trash2, Key, Loader2 } from 'lucide-react';
import { EntidadeAnaliticaComAtributos } from '@/core/domain/entities/entidade-analitica';
import { TipoDadoAnalitico } from '@/core/domain/enums/tipo-dado-analitico';
import { PapelAtributoAnalitico } from '@/core/domain/enums/papel-atributo-analitico';
import { configurarAtributosEntidadeAction } from '@/app/actions/modeling-actions';

interface AttributeRow {
  id?: string;
  nomeOriginal: string;
  nomeAmigavel: string;
  tipoDado: TipoDadoAnalitico;
  papel: PapelAtributoAnalitico;
  descricao: string;
  oculto: boolean;
}

interface ConfigureAttributesModalProps {
  isOpen: boolean;
  onClose: () => void;
  entidade: EntidadeAnaliticaComAtributos | null;
  demandaId: string;
  onSuccess: (msg: string) => void;
}

export function ConfigureAttributesModal({
  isOpen,
  onClose,
  entidade,
  demandaId,
  onSuccess,
}: ConfigureAttributesModalProps) {
  const [rows, setRows] = useState<AttributeRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (entidade) {
      if (entidade.atributos.length > 0) {
        setRows(
          entidade.atributos.map((a) => ({
            id: a.id,
            nomeOriginal: a.nome_original,
            nomeAmigavel: a.nome_amigavel,
            tipoDado: a.tipo_dado,
            papel: a.papel,
            descricao: a.descricao || '',
            oculto: a.oculto,
          }))
        );
      } else {
        // Inicializa com uma linha vazia sugerindo chave primária
        setRows([
          {
            nomeOriginal: 'id',
            nomeAmigavel: 'ID',
            tipoDado: TipoDadoAnalitico.TEXTO,
            papel: PapelAtributoAnalitico.CHAVE_PRIMARIA,
            descricao: 'Identificador único do registro.',
            oculto: false,
          },
        ]);
      }
    }
  }, [entidade]);

  if (!isOpen || !entidade) return null;

  const handleAddRow = () => {
    const nextNum = rows.length + 1;
    setRows([
      ...rows,
      {
        nomeOriginal: `coluna_${nextNum}`,
        nomeAmigavel: `Coluna ${nextNum}`,
        tipoDado: TipoDadoAnalitico.TEXTO,
        papel: PapelAtributoAnalitico.ATRIBUTO_DESCRITIVO,
        descricao: '',
        oculto: false,
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (rows.length <= 1) {
      setError('A entidade deve possuir ao menos um atributo configurado.');
      return;
    }
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, field: keyof AttributeRow, value: any) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: value };
    setRows(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validação básica
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.nomeOriginal.trim() || !r.nomeAmigavel.trim()) {
        setError(`A linha #${i + 1} possui nome original ou nome amigável em branco.`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const res = await configurarAtributosEntidadeAction(
        {
          entidadeId: entidade.id,
          atributos: rows.map((r, idx) => ({
            id: r.id,
            nomeOriginal: r.nomeOriginal.trim(),
            nomeAmigavel: r.nomeAmigavel.trim(),
            tipoDado: r.tipoDado,
            papel: r.papel,
            ordem: idx + 1,
            oculto: r.oculto,
            descricao: r.descricao.trim() || undefined,
          })),
        },
        demandaId
      );

      if (!res.success) {
        setError(res.error || 'Falha ao salvar configuração de atributos.');
      } else {
        onSuccess(`Atributos da entidade "${entidade.nome}" configurados com sucesso!`);
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado ao salvar atributos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      data-testid="configure-attributes-modal"
    >
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 p-5">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">
              Configurar Atributos — {entidade.nome}
            </h3>
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
          <div className="mx-5 mt-3 rounded-lg bg-rose-950/70 border border-rose-800 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Para atender à regra <strong>M-03</strong>, configure ao menos um atributo com o papel de <strong>CHAVE_PRIMARIA</strong>.
            </p>
            <button
              type="button"
              onClick={handleAddRow}
              data-testid="btn-add-attribute-row"
              className="inline-flex items-center gap-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-200 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Adicionar Coluna</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-950 border-b border-slate-800 text-[10px] uppercase font-semibold text-slate-400">
                <tr>
                  <th className="py-2 px-3">Nome Amigável</th>
                  <th className="py-2 px-3">Coluna Original</th>
                  <th className="py-2 px-3">Papel Analítico</th>
                  <th className="py-2 px-3">Tipo de Dado</th>
                  <th className="py-2 px-3">Descrição Semântica</th>
                  <th className="py-2 px-2 text-center">Oculto</th>
                  <th className="py-2 px-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                {rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-900">
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        required
                        value={row.nomeAmigavel}
                        onChange={(e) => handleRowChange(idx, 'nomeAmigavel', e.target.value)}
                        className="w-full rounded bg-slate-950 border border-slate-800 px-2 py-1 text-slate-200 focus:outline-none focus:border-blue-500"
                        data-testid={`input-attr-name-${idx}`}
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        required
                        value={row.nomeOriginal}
                        onChange={(e) => handleRowChange(idx, 'nomeOriginal', e.target.value)}
                        className="w-full rounded bg-slate-950 border border-slate-800 px-2 py-1 font-mono text-[11px] text-slate-400 focus:outline-none focus:border-blue-500"
                        data-testid={`input-attr-original-${idx}`}
                      />
                    </td>
                    <td className="py-2 px-3">
                      <select
                        value={row.papel}
                        onChange={(e) => handleRowChange(idx, 'papel', e.target.value as PapelAtributoAnalitico)}
                        className="w-full rounded bg-slate-950 border border-slate-800 px-2 py-1 text-slate-200 focus:outline-none focus:border-blue-500"
                        data-testid={`select-attr-role-${idx}`}
                      >
                        <option value={PapelAtributoAnalitico.CHAVE_PRIMARIA}>Chave Primária (PK)</option>
                        <option value={PapelAtributoAnalitico.CHAVE_ESTRANGEIRA}>Chave Estrangeira (FK)</option>
                        <option value={PapelAtributoAnalitico.ATRIBUTO_DESCRITIVO}>Atributo Descritivo</option>
                        <option value={PapelAtributoAnalitico.METRICA_BASE}>Métrica Base / Medição</option>
                        <option value={PapelAtributoAnalitico.DIMENSAO_TEMPO}>Dimensão Tempo</option>
                      </select>
                    </td>
                    <td className="py-2 px-3">
                      <select
                        value={row.tipoDado}
                        onChange={(e) => handleRowChange(idx, 'tipoDado', e.target.value as TipoDadoAnalitico)}
                        className="w-full rounded bg-slate-950 border border-slate-800 px-2 py-1 font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                        data-testid={`select-attr-type-${idx}`}
                      >
                        <option value={TipoDadoAnalitico.TEXTO}>TEXTO</option>
                        <option value={TipoDadoAnalitico.INTEIRO}>INTEIRO</option>
                        <option value={TipoDadoAnalitico.DECIMAL}>DECIMAL</option>
                        <option value={TipoDadoAnalitico.DATA}>DATA</option>
                        <option value={TipoDadoAnalitico.DATA_HORA}>DATA_HORA</option>
                        <option value={TipoDadoAnalitico.BOOLEANO}>BOOLEANO</option>
                      </select>
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={row.descricao}
                        onChange={(e) => handleRowChange(idx, 'descricao', e.target.value)}
                        placeholder="Significado negocial..."
                        className="w-full rounded bg-slate-950 border border-slate-800 px-2 py-1 text-slate-300 focus:outline-none focus:border-blue-500"
                        data-testid={`input-attr-desc-${idx}`}
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <input
                        type="checkbox"
                        checked={row.oculto}
                        onChange={(e) => handleRowChange(idx, 'oculto', e.target.checked)}
                        className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500"
                        data-testid={`chk-attr-hidden-${idx}`}
                      />
                    </td>
                    <td className="py-2 px-2">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="Remover linha"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
              data-testid="btn-submit-configure-attributes"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Salvando...' : 'Salvar Atributos'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
