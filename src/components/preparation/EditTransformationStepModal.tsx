'use client';

import React, { useState, useEffect } from 'react';
import { X, Edit3, Loader2 } from 'lucide-react';
import { atualizarEtapaTransformacaoAction } from '@/app/actions/preparation-actions';
import { EtapaTransformacao } from '@/core/domain/entities/etapa-transformacao';
import {
  TipoOperacaoPreparacao,
  ROTULOS_TIPO_OPERACAO_PREPARACAO
} from '@/core/domain/enums/tipo-operacao-preparacao';
import {
  CapacidadeFerramenta,
  ROTULOS_CAPACIDADE_FERRAMENTA
} from '@/core/domain/enums/capacidade-ferramenta';

interface EditTransformationStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  etapa: EtapaTransformacao | null;
  demandaId: string;
  onSuccess: (etapa: EtapaTransformacao) => void;
}

export function EditTransformationStepModal({
  isOpen,
  onClose,
  etapa,
  demandaId,
  onSuccess,
}: EditTransformationStepModalProps) {
  const [tipoOperacao, setTipoOperacao] = useState<TipoOperacaoPreparacao>(TipoOperacaoPreparacao.REMOVER_DUPLICIDADES);
  const [capacidade, setCapacidade] = useState<CapacidadeFerramenta>(CapacidadeFerramenta.MOTOR_M_POWER_QUERY);
  const [ferramentaNome, setFerramentaNome] = useState('');
  const [ferramentaVersao, setFerramentaVersao] = useState('');
  const [descricao, setDescricao] = useState('');
  const [especificacaoTecnica, setEspecificacaoTecnica] = useState('');
  const [justificativa, setJustificativa] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (etapa) {
      setTipoOperacao(etapa.tipo_operacao);
      setCapacidade(etapa.capacidade_ferramenta);
      setFerramentaNome(etapa.ferramenta_nome);
      setFerramentaVersao(etapa.ferramenta_versao || '');
      setDescricao(etapa.descricao);
      setEspecificacaoTecnica(etapa.especificacao_tecnica || '');
      setJustificativa(etapa.justificativa || '');
      setError(null);
    }
  }, [etapa]);

  if (!isOpen || !etapa) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (descricao.trim().length < 5) {
      setError('A descrição da etapa deve conter no mínimo 5 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await atualizarEtapaTransformacaoAction(
        {
          id: etapa.id,
          tipo_operacao: tipoOperacao,
          capacidade_ferramenta: capacidade,
          ferramenta_nome: ferramentaNome.trim(),
          ferramenta_versao: ferramentaVersao.trim() || null,
          descricao: descricao.trim(),
          especificacao_tecnica: especificacaoTecnica.trim() || null,
          justificativa: justificativa.trim() || null,
        },
        demandaId
      );

      if (!res.success) {
        setError(res.error || 'Erro ao atualizar etapa.');
      } else {
        onSuccess(res.data);
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado ao atualizar etapa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto"
      data-testid="edit-step-modal"
    >
      <div className="w-full max-w-2xl rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">Editar Etapa #{etapa.ordem}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="btn-close-edit-step-modal"
            className="text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div
            className="rounded-lg border border-rose-800 bg-rose-950/60 p-3 text-xs text-rose-300"
            data-testid="error-edit-step"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-step-operation" className="block text-xs font-semibold text-slate-300 mb-1">
                Tipo de Operação
              </label>
              <select
                id="edit-step-operation"
                value={tipoOperacao}
                onChange={(e) => setTipoOperacao(e.target.value as TipoOperacaoPreparacao)}
                data-testid="input-edit-step-operation"
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
              <label htmlFor="edit-step-capacity" className="block text-xs font-semibold text-slate-300 mb-1">
                Capacidade Técnica
              </label>
              <select
                id="edit-step-capacity"
                value={capacidade}
                onChange={(e) => setCapacidade(e.target.value as CapacidadeFerramenta)}
                data-testid="input-edit-step-capacity"
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
              <label htmlFor="edit-step-tool-name" className="block text-xs font-semibold text-slate-300 mb-1">
                Ferramenta / Tecnologia
              </label>
              <input
                id="edit-step-tool-name"
                type="text"
                value={ferramentaNome}
                onChange={(e) => setFerramentaNome(e.target.value)}
                data-testid="input-edit-step-tool-name"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label htmlFor="edit-step-tool-version" className="block text-xs font-semibold text-slate-300 mb-1">
                Versão (Opcional)
              </label>
              <input
                id="edit-step-tool-version"
                type="text"
                value={ferramentaVersao}
                onChange={(e) => setFerramentaVersao(e.target.value)}
                data-testid="input-edit-step-tool-version"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="edit-step-desc" className="block text-xs font-semibold text-slate-300 mb-1">
              Descrição da Etapa
            </label>
            <textarea
              id="edit-step-desc"
              rows={2}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              data-testid="input-edit-step-description"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="edit-step-spec" className="block text-xs font-semibold text-slate-300 mb-1">
              Especificação Técnica / Script
            </label>
            <textarea
              id="edit-step-spec"
              rows={4}
              value={especificacaoTecnica}
              onChange={(e) => setEspecificacaoTecnica(e.target.value)}
              data-testid="input-edit-step-spec"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="edit-step-justification" className="block text-xs font-semibold text-slate-300 mb-1">
              Justificativa Técnica (Opcional)
            </label>
            <input
              id="edit-step-justification"
              type="text"
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              data-testid="input-edit-step-justification"
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
              data-testid="btn-submit-edit-step"
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
