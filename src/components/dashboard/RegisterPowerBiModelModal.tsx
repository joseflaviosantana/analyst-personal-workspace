'use client';

/**
 * src/components/dashboard/RegisterPowerBiModelModal.tsx
 *
 * Modal de Registro de Modelo Power BI (.pbix / .pbip) (Subgate 3.4B)
 *
 * Princípios de UX:
 * - Orientar o analista sobre a distinção entre .pbix (binário) e .pbip (projeto Git/TMDL);
 * - Explicar a regra D-01 e o que acontece após o cadastro;
 * - Validação em tempo real e prevenção de erros;
 * - 100% integrado à Server Action criarModeloPowerBiAction.
 */

import React, { useState } from 'react';
import {
  X,
  FileCode,
  FolderGit2,
  FileText,
  Sparkles,
  Loader2,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  HardDrive,
} from 'lucide-react';
import { TipoFormatoModeloPowerBi } from '@/core/domain/enums/tipo-formato-modelo-powerbi';
import { StatusModeloPowerBi } from '@/core/domain/enums/status-modelo-powerbi';
import { criarModeloPowerBiAction } from '@/app/actions/dashboard-actions';

interface RegisterPowerBiModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  demandaId: string;
  modeloAnaliticoId?: string | null;
  onSuccess: () => void;
}

export function RegisterPowerBiModelModal({
  isOpen,
  onClose,
  demandaId,
  modeloAnaliticoId,
  onSuccess,
}: RegisterPowerBiModelModalProps) {
  const [tipoFormato, setTipoFormato] = useState<TipoFormatoModeloPowerBi>(
    TipoFormatoModeloPowerBi.PBIX
  );
  const [nomeArquivo, setNomeArquivo] = useState('');
  const [caminhoLocal, setCaminhoLocal] = useState('');
  const [versaoPowerBi, setVersaoPowerBi] = useState('2.138.1004.0');
  const [tamanhoKb, setTamanhoKb] = useState('2048');
  const [hashSha256, setHashSha256] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Autoajuste sugerido de extensão quando troca o formato
  const handleSelectFormato = (formato: TipoFormatoModeloPowerBi) => {
    setTipoFormato(formato);
    if (!nomeArquivo || nomeArquivo === 'painel_analitico.pbix' || nomeArquivo === 'painel_analitico.pbip') {
      setNomeArquivo(formato === TipoFormatoModeloPowerBi.PBIP ? 'painel_analitico.pbip' : 'painel_analitico.pbix');
    } else {
      const semExtensao = nomeArquivo.replace(/\.(pbix|pbip)$/i, '');
      setNomeArquivo(`${semExtensao}.${formato === TipoFormatoModeloPowerBi.PBIP ? 'pbip' : 'pbix'}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeArquivo.trim()) {
      setError('O nome do arquivo é obrigatório.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const bytes = Math.max(0, Math.floor(parseFloat(tamanhoKb || '0') * 1024));

      const res = await criarModeloPowerBiAction({
        demandaId,
        modeloAnaliticoId: modeloAnaliticoId ?? null,
        nomeArquivo: nomeArquivo.trim(),
        caminhoLocal: caminhoLocal.trim() || null,
        tipoFormato,
        status: StatusModeloPowerBi.EM_DESENVOLVIMENTO,
        versaoPowerBi: versaoPowerBi.trim() || null,
        tamanhoBytes: bytes,
        hashSha256: hashSha256.trim() || null,
      });

      if (!res.success) {
        setError(res.error || 'Falha ao registrar o modelo Power BI.');
      } else {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado ao registrar o modelo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      data-testid="register-powerbi-model-modal"
    >
      <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Cabeçalho do Modal */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <FileCode className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Registrar Arquivo Power BI
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Vincule um arquivo .pbix ou projeto .pbip para rastreabilidade de DAX e visuais
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
          {/* 1. Escolha de Formato com Pedagogia Integrada */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2">
              Formato do Modelo Power BI
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Opção PBIX */}
              <div
                onClick={() => handleSelectFormato(TipoFormatoModeloPowerBi.PBIX)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  tipoFormato === TipoFormatoModeloPowerBi.PBIX
                    ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500'
                    : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className={`h-4 w-4 ${tipoFormato === TipoFormatoModeloPowerBi.PBIX ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span className="font-bold text-white">.PBIX (Padrão Desktop)</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Arquivo binário único. Ideal para desenvolvimento local autônomo e publicação direta no Power BI Service.
                </p>
              </div>

              {/* Opção PBIP */}
              <div
                onClick={() => handleSelectFormato(TipoFormatoModeloPowerBi.PBIP)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  tipoFormato === TipoFormatoModeloPowerBi.PBIP
                    ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500'
                    : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FolderGit2 className={`h-4 w-4 ${tipoFormato === TipoFormatoModeloPowerBi.PBIP ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span className="font-bold text-white">.PBIP (Power BI Project)</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Estrutura em pastas com TMDL legível. Recomendado para colaboração em equipe com controle de versão Git.
                </p>
              </div>
            </div>
          </div>

          {/* 2. Nome do Arquivo */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Nome do Arquivo <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={nomeArquivo}
              onChange={(e) => setNomeArquivo(e.target.value)}
              placeholder={tipoFormato === TipoFormatoModeloPowerBi.PBIP ? 'painel_vendas.pbip' : 'painel_vendas.pbix'}
              data-testid="input-nome-arquivo"
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white font-mono placeholder-slate-600 focus:border-blue-500 focus:outline-none"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Nome de referência do modelo na entrega da demanda.
            </span>
          </div>

          {/* 3. Caminho Local no Disco */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Caminho no Disco Local (Opcional)
            </label>
            <div className="relative">
              <input
                type="text"
                value={caminhoLocal}
                onChange={(e) => setCaminhoLocal(e.target.value)}
                placeholder="C:\Users\Analista\Dashboards\painel_vendas.pbix"
                data-testid="input-caminho-local"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white font-mono placeholder-slate-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Permite auditar a localização física do arquivo em seu ambiente de trabalho.
            </span>
          </div>

          {/* 4. Versão e Tamanho Estimado */}
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
                data-testid="input-versao-powerbi"
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
                data-testid="input-tamanho-kb"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white font-mono placeholder-slate-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 5. Box Pedagógico "Aprenda enquanto trabalha" */}
          <div className="rounded-xl border border-blue-900/60 bg-blue-950/20 p-3.5 flex items-start gap-3">
            <Sparkles className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-bold text-blue-300 block mb-0.5">
                O que acontece após o registro?
              </span>
              <p className="text-slate-300">
                A conformidade técnica <strong>D-01 (Existência de Modelo)</strong> é aprovada imediatamente.
                Na sequência, você poderá cadastrar suas <strong>Medidas DAX</strong> vinculadas às métricas homologadas
                e definir suas <strong>Páginas &amp; Visuais</strong> com validação em tempo real.
              </p>
            </div>
          </div>

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
              disabled={isSubmitting}
              data-testid="btn-submit-register-pbi"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 font-semibold text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/30 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Registrando Modelo...</span>
                </>
              ) : (
                <>
                  <FileCode className="h-4 w-4" />
                  <span>Registrar Modelo</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
