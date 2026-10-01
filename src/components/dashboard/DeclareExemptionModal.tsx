'use client';

/**
 * src/components/dashboard/DeclareExemptionModal.tsx
 *
 * Modal de Declaração Formal de Isenção (Excel-Only) (Subgate 3.4B)
 *
 * Princípios de UX & Governança:
 * - Formalizar metodologicamente que a entrega da demanda é puramente tabular;
 * - Exigir justificativa auditável com no mínimo 15 caracteres (Regra D-08);
 * - Esclarecer que a isenção previne bloqueios de validação e aprova a conformidade;
 * - Contador de caracteres visual com feedback dinâmico;
 * - 100% integrado à Server Action criarModeloPowerBiAction.
 */

import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  ShieldCheck,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { TipoFormatoModeloPowerBi } from '@/core/domain/enums/tipo-formato-modelo-powerbi';
import { StatusModeloPowerBi } from '@/core/domain/enums/status-modelo-powerbi';
import { criarModeloPowerBiAction } from '@/app/actions/dashboard-actions';

interface DeclareExemptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  demandaId: string;
  onSuccess: () => void;
}

export function DeclareExemptionModal({
  isOpen,
  onClose,
  demandaId,
  onSuccess,
}: DeclareExemptionModalProps) {
  const [nomeArquivo, setNomeArquivo] = useState('Entrega-Tabular-Excel.xlsx');
  const [caminhoLocal, setCaminhoLocal] = useState('');
  const [justificativa, setJustificativa] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const charCount = justificativa.trim().length;
  const isJustificativaValida = charCount >= 15;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeArquivo.trim()) {
      setError('O nome do artefato tabular é obrigatório.');
      return;
    }

    if (!isJustificativaValida) {
      setError(
        'A justificativa formal de isenção de Power BI exige no mínimo 15 caracteres para conformidade D-08.'
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await criarModeloPowerBiAction({
        demandaId,
        nomeArquivo: nomeArquivo.trim(),
        caminhoLocal: caminhoLocal.trim() || null,
        tipoFormato: TipoFormatoModeloPowerBi.ISENTO_EXCEL_ONLY,
        status: StatusModeloPowerBi.HOMOLOGADO,
        justificativaIsencao: justificativa.trim(),
        tamanhoBytes: 0,
      });

      if (!res.success) {
        setError(res.error || 'Falha ao formalizar declaração de isenção.');
      } else {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado ao registrar isenção.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      data-testid="declare-exemption-modal"
    >
      <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Cabeçalho do Modal */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Declarar Isenção de Power BI
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 font-mono">
                  Regra D-08
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Formalização metodológica de entrega exclusiva em planilha / consumo tabular
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
          {/* Contexto Pedagógico da Isenção */}
          <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/20 p-3.5 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-bold text-emerald-300 block mb-0.5">
                Como funciona a governança de Isenção (Excel-Only)?
              </span>
              <p className="text-slate-300">
                Nem toda demanda exige um painel interativo no Power BI. Quando a necessidade de negócio
                é plenamente atendida por relatórios tabulares ou planilhas executivas, a declaração de isenção
                dispensa a criação de medidas DAX e visuais, concedendo status de conformidade sem pendências.
              </p>
            </div>
          </div>

          {/* 1. Nome do Artefato Tabular */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Nome do Artefato Tabular / Planilha <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={nomeArquivo}
              onChange={(e) => setNomeArquivo(e.target.value)}
              placeholder="Entrega-Tabular-Excel.xlsx"
              data-testid="input-nome-isencao"
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white font-mono placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Nome do arquivo ou modelo tabular entregue ao usuário de negócio.
            </span>
          </div>

          {/* 2. Caminho Local (Opcional) */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Caminho no Disco Local (Opcional)
            </label>
            <input
              type="text"
              value={caminhoLocal}
              onChange={(e) => setCaminhoLocal(e.target.value)}
              placeholder="C:\Relatorios\Entrega-Tabular-Excel.xlsx"
              data-testid="input-caminho-isencao"
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white font-mono placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* 3. Justificativa Formal da Isenção com Contador */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-300 font-semibold">
                Justificativa Formal da Isenção <span className="text-rose-400">*</span>
              </label>
              <span
                data-testid="counter-justificativa"
                className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                  isJustificativaValida
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                    : 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
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
              placeholder="Descreva formalmente por que a demanda é estritamente tabular (ex: Demanda com consumo exclusivo via planilha dinâmica pelo comitê executivo, sem necessidade de painel interativo)."
              data-testid="textarea-justificativa-isencao"
              className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none leading-relaxed"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Esta justificativa será registrada na auditoria de conformidade (Regra D-08).
            </span>
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
              disabled={isSubmitting || !isJustificativaValida}
              data-testid="btn-submit-declare-exemption"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 font-semibold text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Registrando Isenção...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Formalizar Isenção (Excel-Only)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
