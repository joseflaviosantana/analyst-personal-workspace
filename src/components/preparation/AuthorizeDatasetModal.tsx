'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, AlertTriangle, Hash, Loader2 } from 'lucide-react';
import { autorizarDatasetAnaliseAction } from '@/app/actions/preparation-actions';
import { AtivoDados } from '@/core/domain/entities/ativo-dados';
import { DatasetAutorizadoAnalise } from '@/core/domain/entities/dataset-autorizado-analise';
import { CategoriaAtivoDados } from '@/core/domain/enums/categoria-ativo-dados';

interface AuthorizeDatasetModalProps {
  isOpen: boolean;
  onClose: () => void;
  demandaId: string;
  receitaId: string | null;
  ativosDisponiveis: AtivoDados[];
  onSuccess: (autorizado: DatasetAutorizadoAnalise) => void;
}

export function AuthorizeDatasetModal({
  isOpen,
  onClose,
  demandaId,
  receitaId,
  ativosDisponiveis,
  onSuccess,
}: AuthorizeDatasetModalProps) {
  // Preferir ativos preparados derivados se houver, caso contrário o primeiro disponível
  const ativoSugerido =
    ativosDisponiveis.find((a) => a.categoria_ativo === CategoriaAtivoDados.PREPARADO_DERIVADO) ||
    ativosDisponiveis[0];

  const [selectedAssetId, setSelectedAssetId] = useState<string>(ativoSugerido?.id || '');
  const [versaoRotulo, setVersaoRotulo] = useState(
    ativoSugerido?.categoria_ativo === CategoriaAtivoDados.PREPARADO_DERIVADO
      ? '1.0-preparado'
      : '1.0-bruto'
  );
  const [justificativa, setJustificativa] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const ativoSelecionado = ativosDisponiveis.find((a) => a.id === selectedAssetId);
  const isDerivado = ativoSelecionado?.categoria_ativo === CategoriaAtivoDados.PREPARADO_DERIVADO;

  const handleAssetChange = (assetId: string) => {
    setSelectedAssetId(assetId);
    const chosen = ativosDisponiveis.find((a) => a.id === assetId);
    if (chosen?.categoria_ativo === CategoriaAtivoDados.PREPARADO_DERIVADO) {
      setVersaoRotulo('1.0-preparado');
    } else {
      setVersaoRotulo('1.0-bruto');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (justificativa.trim().length < 15) {
      setError('A justificativa de homologação deve conter no mínimo 15 caracteres explicativos.');
      return;
    }
    if (!selectedAssetId) {
      setError('Selecione o ativo de dados a ser autorizado.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await autorizarDatasetAnaliseAction({
        demanda_id: demandaId,
        ativo_dados_id: selectedAssetId,
        receita_preparacao_id: isDerivado ? receitaId : null,
        versao_rotulo: versaoRotulo.trim(),
        justificativa_autorizacao: justificativa.trim(),
        autorizado_por_tipo: 'HUMANO',
      });

      if (!res.success) {
        setError(res.error || 'Erro ao homologar dataset para análise.');
      } else {
        onSuccess(res.data);
        onClose();
        setJustificativa('');
      }
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado ao autorizar dataset.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      data-testid="authorize-dataset-modal"
    >
      <div className="w-full max-w-lg rounded-xl border border-emerald-800 bg-slate-900 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Homologar Dataset para Análise</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="btn-close-authorize-modal"
            className="text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-lg border border-emerald-900/60 bg-emerald-950/20 p-3 text-xs text-emerald-300 leading-relaxed">
          A homologação formal congela o <strong>snapshot SHA-256 de integridade física</strong> e todas as anomalias aceitas como restrição, tornando o conjunto de dados o contrato estável e auditável para Modelagem e DAX.
        </div>

        {error && (
          <div
            className="rounded-lg border border-rose-800 bg-rose-950/60 p-3 text-xs text-rose-300"
            data-testid="error-authorize-dataset"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="auth-asset-select" className="block text-xs font-semibold text-slate-300 mb-1">
              Ativo de Dados a ser Homologado <span className="text-rose-400">*</span>
            </label>
            <select
              id="auth-asset-select"
              value={selectedAssetId}
              onChange={(e) => handleAssetChange(e.target.value)}
              data-testid="select-auth-asset"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
              required
            >
              {ativosDisponiveis.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome_arquivo} ({a.categoria_ativo}) — {a.total_linhas} linhas
                </option>
              ))}
            </select>
            {ativoSelecionado && (
              <span className="text-[11px] font-mono text-slate-400 mt-1 block truncate">
                Hash Snapshot: {ativoSelecionado.hash_sha256}
              </span>
            )}
          </div>

          <div>
            <label htmlFor="auth-version-label" className="block text-xs font-semibold text-slate-300 mb-1">
              Rótulo da Versão Homologada <span className="text-rose-400">*</span>
            </label>
            <input
              id="auth-version-label"
              type="text"
              value={versaoRotulo}
              onChange={(e) => setVersaoRotulo(e.target.value)}
              placeholder="Ex: 1.0-preparado ou 2.0-higienizado"
              data-testid="input-auth-version"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none font-mono"
              required
            />
          </div>

          <div>
            <label htmlFor="auth-justification" className="block text-xs font-semibold text-slate-300 mb-1">
              Justificativa Formal de Homologação <span className="text-rose-400">*</span>
            </label>
            <textarea
              id="auth-justification"
              rows={3}
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              placeholder="Atesto que os dados foram submetidos à preparação, os tratamentos foram validados deterministicamente e o conjunto está homologado para alimentar as análises..."
              data-testid="input-auth-justification"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
              required
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Caracteres: {justificativa.trim().length} / 15 mínimos exigidos
            </span>
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
              disabled={isSubmitting || justificativa.trim().length < 15}
              data-testid="btn-submit-authorize-dataset"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Homologando...</span>
                </>
              ) : (
                <span>Confirmar Homologação</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
