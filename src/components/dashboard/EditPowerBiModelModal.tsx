'use client';

/**
 * src/components/dashboard/EditPowerBiModelModal.tsx
 *
 * Modal de Edição de Metadados e Status do Modelo Power BI (Subgate 3.4B)
 *
 * Princípios de UX:
 * - Permitir atualização do ciclo de vida (EM_DESENVOLVIMENTO, CONCLUIDO, HOMOLOGADO);
 * - Permitir ajuste de formato (.pbix, .pbip, ISENTO_EXCEL_ONLY);
 * - Validação em tempo real caso o formato seja ou passe a ser ISENTO_EXCEL_ONLY;
 * - Atualização auditável no SQLite Local-First sem perda de integridade.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Edit3,
  FileCode,
  FolderGit2,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ModeloPowerBi } from '@/core/domain/entities/modelo-powerbi';
import { TipoFormatoModeloPowerBi } from '@/core/domain/enums/tipo-formato-modelo-powerbi';
import { StatusModeloPowerBi, ROTULOS_STATUS_MODELO_POWERBI } from '@/core/domain/enums/status-modelo-powerbi';
import { atualizarModeloPowerBiAction } from '@/app/actions/dashboard-actions';

interface EditPowerBiModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelo: ModeloPowerBi;
  demandaId: string;
  onSuccess: () => void;
}

export function EditPowerBiModelModal({
  isOpen,
  onClose,
  modelo,
  demandaId,
  onSuccess,
}: EditPowerBiModelModalProps) {
  const [nomeArquivo, setNomeArquivo] = useState(modelo.nome_arquivo);
  const [caminhoLocal, setCaminhoLocal] = useState(modelo.caminho_local ?? '');
  const [tipoFormato, setTipoFormato] = useState<TipoFormatoModeloPowerBi>(modelo.tipo_formato);
  const [status, setStatus] = useState<StatusModeloPowerBi>(modelo.status);
  const [versaoPowerBi, setVersaoPowerBi] = useState(modelo.versao_powerbi ?? '');
  const [tamanhoKb, setTamanhoKb] = useState(
    modelo.tamanho_bytes ? (modelo.tamanho_bytes / 1024).toFixed(0) : '0'
  );
  const [justificativa, setJustificativa] = useState(modelo.justificativa_isencao ?? '');
  const [hashSha256, setHashSha256] = useState(modelo.hash_sha256 ?? '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNomeArquivo(modelo.nome_arquivo);
    setCaminhoLocal(modelo.caminho_local ?? '');
    setTipoFormato(modelo.tipo_formato);
    setStatus(modelo.status);
    setVersaoPowerBi(modelo.versao_powerbi ?? '');
    setTamanhoKb(modelo.tamanho_bytes ? (modelo.tamanho_bytes / 1024).toFixed(0) : '0');
    setJustificativa(modelo.justificativa_isencao ?? '');
    setHashSha256(modelo.hash_sha256 ?? '');
    setError(null);
  }, [modelo, isOpen]);

  if (!isOpen) return null;

  const isIsento = tipoFormato === TipoFormatoModeloPowerBi.ISENTO_EXCEL_ONLY;
  const charCount = justificativa.trim().length;
  const isJustificativaValida = !isIsento || charCount >= 15;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeArquivo.trim()) {
      setError('O nome do arquivo é obrigatório.');
      return;
    }

    if (isIsento && !isJustificativaValida) {
      setError(
        'A justificativa formal de isenção de Power BI exige no mínimo 15 caracteres para conformidade D-08.'
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const bytes = Math.max(0, Math.floor(parseFloat(tamanhoKb || '0') * 1024));

      const res = await atualizarModeloPowerBiAction(
        {
          id: modelo.id,
          nomeArquivo: nomeArquivo.trim(),
          caminhoLocal: caminhoLocal.trim() || null,
          tipoFormato,
          status,
          versaoPowerBi: versaoPowerBi.trim() || null,
          tamanhoBytes: bytes,
          justificativaIsencao: isIsento ? justificativa.trim() : null,
          hashSha256: hashSha256.trim() || null,
        },
        demandaId
      );

      if (!res.success) {
        setError(res.error || 'Falha ao atualizar o modelo.');
      } else {
        onSuccess();
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      data-testid="edit-powerbi-model-modal"
    >
      <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Cabeçalho do Modal */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Editar Metadados do Modelo
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Atualize status, formato, caminhos e governança do modelo vinculado
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div
            data-testid="modal-error-alert"
            className="rounded-lg bg-rose-950/60 border border-rose-800/80 p-3 flex items-start gap-2.5 text-xs text-rose-300"
          >
            <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* 1. Status do Ciclo de Vida */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Status do Ciclo de Vida do Modelo
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  value: StatusModeloPowerBi.EM_DESENVOLVIMENTO,
                  label: 'Em Desenvolvimento',
                  color: 'border-amber-700/60 text-amber-300 bg-amber-950/20',
                },
                {
                  value: StatusModeloPowerBi.CONCLUIDO,
                  label: 'Concluído',
                  color: 'border-blue-700/60 text-blue-300 bg-blue-950/20',
                },
                {
                  value: StatusModeloPowerBi.HOMOLOGADO,
                  label: 'Homologado',
                  color: 'border-emerald-700/60 text-emerald-300 bg-emerald-950/20',
                },
              ].map((s) => (
                <button
                  type="button"
                  key={s.value}
                  onClick={() => setStatus(s.value)}
                  className={`p-2.5 rounded-lg border text-center transition-all ${
                    status === s.value
                      ? `${s.color} ring-1 ring-white/20 font-bold`
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="block text-xs">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Formato */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Formato Técnico
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: TipoFormatoModeloPowerBi.PBIX, label: '.PBIX (Desktop)', icon: FileCode },
                { value: TipoFormatoModeloPowerBi.PBIP, label: '.PBIP (Projeto)', icon: FolderGit2 },
                { value: TipoFormatoModeloPowerBi.ISENTO_EXCEL_ONLY, label: 'Excel-Only', icon: FileSpreadsheet },
              ].map((f) => {
                const Icon = f.icon;
                const active = tipoFormato === f.value;
                return (
                  <button
                    type="button"
                    key={f.value}
                    onClick={() => setTipoFormato(f.value)}
                    className={`p-2 rounded-lg border flex items-center justify-center gap-1.5 transition-all ${
                      active
                        ? 'border-blue-500 bg-blue-500/10 text-white font-bold ring-1 ring-blue-500'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{f.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Nome do Arquivo */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Nome do Arquivo / Artefato <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={nomeArquivo}
              onChange={(e) => setNomeArquivo(e.target.value)}
              data-testid="input-edit-nome-arquivo"
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white font-mono placeholder-slate-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* 4. Caminho Local no Disco */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Caminho no Disco Local
            </label>
            <input
              type="text"
              value={caminhoLocal}
              onChange={(e) => setCaminhoLocal(e.target.value)}
              placeholder="C:\Dashboards\painel.pbix"
              data-testid="input-edit-caminho-local"
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white font-mono placeholder-slate-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Se for ISENTO_EXCEL_ONLY: Exibir justificativa obrigatória */}
          {isIsento && (
            <div className="space-y-1.5 p-3 rounded-xl border border-emerald-900/60 bg-emerald-950/20">
              <div className="flex items-center justify-between">
                <label className="block text-emerald-300 font-semibold">
                  Justificativa Formal da Isenção (D-08) <span className="text-rose-400">*</span>
                </label>
                <span
                  data-testid="counter-edit-justificativa"
                  className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                    isJustificativaValida
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      : 'bg-amber-950 text-amber-300 border border-amber-700'
                  }`}
                >
                  {charCount} / 15 caracteres mínimos
                </span>
              </div>
              <textarea
                required
                rows={3}
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                placeholder="Descreva a razão formal da isenção de Power BI para esta demanda."
                data-testid="textarea-edit-justificativa"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none leading-relaxed"
              />
            </div>
          )}

          {/* 5. Versão e Tamanho (para modelos não isentos) */}
          {!isIsento && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Versão do Power BI Desktop
                </label>
                <input
                  type="text"
                  value={versaoPowerBi}
                  onChange={(e) => setVersaoPowerBi(e.target.value)}
                  placeholder="2.138.1004.0"
                  data-testid="input-edit-versao-powerbi"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white font-mono placeholder-slate-600 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Tamanho Estimado (KB)
                </label>
                <input
                  type="number"
                  min="0"
                  value={tamanhoKb}
                  onChange={(e) => setTamanhoKb(e.target.value)}
                  data-testid="input-edit-tamanho-kb"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white font-mono placeholder-slate-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Rodapé com Ações */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 font-semibold text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isJustificativaValida}
              data-testid="btn-submit-edit-pbi"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 font-semibold text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/30 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Salvando Alterações...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Salvar Alterações</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
