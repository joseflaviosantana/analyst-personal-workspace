'use client';

import React, { useState } from 'react';
import { X, Layers, Plus, Loader2 } from 'lucide-react';
import { adicionarEtapaTransformacaoAction } from '@/app/actions/preparation-actions';
import { EtapaTransformacao } from '@/core/domain/entities/etapa-transformacao';
import {
  TipoOperacaoPreparacao,
  ROTULOS_TIPO_OPERACAO_PREPARACAO
} from '@/core/domain/enums/tipo-operacao-preparacao';
import {
  CapacidadeFerramenta,
  ROTULOS_CAPACIDADE_FERRAMENTA
} from '@/core/domain/enums/capacidade-ferramenta';

interface AddTransformationStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  receitaId: string;
  demandaId: string;
  proximaOrdem: number;
  onSuccess: (etapa: EtapaTransformacao) => void;
}

export function AddTransformationStepModal({
  isOpen,
  onClose,
  receitaId,
  demandaId,
  proximaOrdem,
  onSuccess,
}: AddTransformationStepModalProps) {
  const [tipoOperacao, setTipoOperacao] = useState<TipoOperacaoPreparacao>(TipoOperacaoPreparacao.REMOVER_DUPLICIDADES);
  const [capacidade, setCapacidade] = useState<CapacidadeFerramenta>(CapacidadeFerramenta.MOTOR_M_POWER_QUERY);
  const [ferramentaNome, setFerramentaNome] = useState('Power Query M');
  const [ferramentaVersao, setFerramentaVersao] = useState('');
  const [descricao, setDescricao] = useState('');
  const [especificacaoTecnica, setEspecificacaoTecnica] = useState('');
  const [justificativa, setJustificativa] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Sugestão de ferramenta baseada na capacidade selecionada
  const handleCapacidadeChange = (cap: CapacidadeFerramenta) => {
    setCapacidade(cap);
    if (cap === CapacidadeFerramenta.MOTOR_M_POWER_QUERY) setFerramentaNome('Power Query M');
    else if (cap === CapacidadeFerramenta.MOTOR_SQL) setFerramentaNome('DuckDB / SQLite SQL');
    else if (cap === CapacidadeFerramenta.SCRIPT_NOTEBOOK) setFerramentaNome('Python (Pandas / Polars)');
    else if (cap === CapacidadeFerramenta.PLANILHA) setFerramentaNome('Excel Power Pivot');
    else if (cap === CapacidadeFerramenta.FRAMEWORK_TRANSFORMACAO) setFerramentaNome('dbt-core');
    else if (cap === CapacidadeFerramenta.PLATAFORMA_LAKEHOUSE) setFerramentaNome('Microsoft Fabric');
    else if (cap === CapacidadeFerramenta.MANUAL_DOCUMENTADO) setFerramentaNome('Tratamento Manual');
    else setFerramentaNome('Ferramenta Especializada');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (descricao.trim().length < 5) {
      setError('A descrição da etapa deve conter no mínimo 5 caracteres.');
      return;
    }
    if (ferramentaNome.trim().length === 0) {
      setError('O nome da ferramenta é obrigatório.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await adicionarEtapaTransformacaoAction(
        {
          receita_id: receitaId,
          tipo_operacao: tipoOperacao,
          capacidade_ferramenta: capacidade,
          ferramenta_nome: ferramentaNome.trim(),
          ferramenta_versao: ferramentaVersao.trim() || null,
          descricao: descricao.trim(),
          especificacao_tecnica: especificacaoTecnica.trim() || null,
          justificativa: justificativa.trim() || null,
          ordem: proximaOrdem,
        },
        demandaId
      );

      if (!res.success) {
        setError(res.error || 'Erro ao adicionar etapa de transformação.');
      } else {
        onSuccess(res.data);
        onClose();
        setDescricao('');
        setEspecificacaoTecnica('');
        setJustificativa('');
      }
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado ao adicionar etapa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto"
      data-testid="add-step-modal"
    >
      <div className="w-full max-w-2xl rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">Nova Etapa de Transformação (Ordem #{proximaOrdem})</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="btn-close-add-step-modal"
            className="text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div
            className="rounded-lg border border-rose-800 bg-rose-950/60 p-3 text-xs text-rose-300"
            data-testid="error-add-step"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="add-step-operation" className="block text-xs font-semibold text-slate-300 mb-1">
                Tipo de Operação de Preparação <span className="text-rose-400">*</span>
              </label>
              <select
                id="add-step-operation"
                value={tipoOperacao}
                onChange={(e) => setTipoOperacao(e.target.value as TipoOperacaoPreparacao)}
                data-testid="select-step-operation"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                {Object.entries(ROTULOS_TIPO_OPERACAO_PREPARACAO).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="add-step-capacity" className="block text-xs font-semibold text-slate-300 mb-1">
                Capacidade Técnica Computacional <span className="text-rose-400">*</span>
              </label>
              <select
                id="add-step-capacity"
                value={capacidade}
                onChange={(e) => handleCapacidadeChange(e.target.value as CapacidadeFerramenta)}
                data-testid="select-step-tool"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                {Object.entries(ROTULOS_CAPACIDADE_FERRAMENTA).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="add-step-tool-name" className="block text-xs font-semibold text-slate-300 mb-1">
                Ferramenta / Tecnologia <span className="text-rose-400">*</span>
              </label>
              <input
                id="add-step-tool-name"
                type="text"
                value={ferramentaNome}
                onChange={(e) => setFerramentaNome(e.target.value)}
                placeholder="Ex: Power Query M, DuckDB, Pandas, dbt"
                data-testid="input-tool-name"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label htmlFor="add-step-tool-version" className="block text-xs font-semibold text-slate-300 mb-1">
                Versão (Opcional)
              </label>
              <input
                id="add-step-tool-version"
                type="text"
                value={ferramentaVersao}
                onChange={(e) => setFerramentaVersao(e.target.value)}
                placeholder="Ex: 3.11, 2026.02"
                data-testid="input-step-tool-version"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="add-step-desc" className="block text-xs font-semibold text-slate-300 mb-1">
              Descrição da Etapa <span className="text-rose-400">*</span>
            </label>
            <textarea
              id="add-step-desc"
              rows={2}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o tratamento aplicado (ex: Remoção de registros duplicados considerando Chave e Data)..."
              data-testid="input-step-description"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="add-step-spec" className="block text-xs font-semibold text-slate-300 mb-1">
              Especificação Técnica / Script (Metadado Documentado)
            </label>
            <textarea
              id="add-step-spec"
              rows={4}
              value={especificacaoTecnica}
              onChange={(e) => setEspecificacaoTecnica(e.target.value)}
              placeholder="Ex: Código M do Power Query, consulta SQL ou trecho de script aplicado na transformação..."
              data-testid="input-step-spec"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
            />
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Registrado como especificação/metadado da transformação, mantendo o workspace agnóstico de fornecedor.
            </span>
          </div>

          <div>
            <label htmlFor="add-step-justification" className="block text-xs font-semibold text-slate-300 mb-1">
              Justificativa Técnica (Opcional)
            </label>
            <input
              id="add-step-justification"
              type="text"
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              placeholder="Justificativa da necessidade operacional desta transformação..."
              data-testid="input-step-justification"
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
              data-testid="btn-submit-add-step"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Adicionando...</span>
                </>
              ) : (
                <span>Adicionar Etapa</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
