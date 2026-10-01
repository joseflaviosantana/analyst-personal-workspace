'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  X,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { ProntidaoRequisitosOutput } from '@/core/use-cases/requirements/avaliar-prontidao-requisitos.use-case';
import { homologarLevantamentoRequisitosAction } from '@/app/actions/requirements-actions';

interface HomologateRequirementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  demandaId: string;
  prontidao: ProntidaoRequisitosOutput | null;
  onSuccess: (msg: string) => void;
}

export function HomologateRequirementsModal({
  isOpen,
  onClose,
  demandaId,
  prontidao,
  onSuccess,
}: HomologateRequirementsModalProps) {
  const [justificativa, setJustificativa] = useState('');
  const [ressalvas, setRessalvas] = useState('');
  const [homologadoPor, setHomologadoPor] = useState('Analista Responsável');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const bloqueado = prontidao?.bloqueado ?? false;
  const exigeJustificativa = prontidao?.exigeJustificativaRessalva ?? false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (bloqueado) {
      setError(
        'O levantamento possui bloqueios ativos (perguntas bloqueantes pendentes ou escopo indefinido) e não pode ser homologado.'
      );
      return;
    }

    if (exigeJustificativa && justificativa.trim().length < 15) {
      setError('A justificativa de homologação com ressalvas deve conter no mínimo 15 caracteres.');
      return;
    }

    if (!justificativa.trim() || justificativa.trim().length < 5) {
      setError('Informe uma justificativa válida com no mínimo 5 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await homologarLevantamentoRequisitosAction({
        demandaId,
        justificativa: justificativa.trim(),
        ressalvas: ressalvas.trim() || null,
        homologadoPor: homologadoPor.trim(),
      });

      if (!res.success) {
        setError(res.error || 'Erro ao homologar levantamento.');
      } else {
        onSuccess('Levantamento de requisitos homologado com sucesso com registro de evidência.');
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Homologação Formal do Levantamento de Requisitos</span>
          </h4>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {bloqueado ? (
          <div className="mb-4 rounded-lg border border-rose-800 bg-rose-950/40 p-3 text-xs text-rose-300 space-y-2">
            <div className="flex items-center gap-1.5 font-semibold">
              <AlertTriangle className="h-4 w-4 text-rose-400" />
              <span>Bloqueio de Governança Ativo</span>
            </div>
            <ul className="list-disc list-inside space-y-1">
              {prontidao?.motivosBloqueio.map((m, idx) => (
                <li key={idx}>{m}</li>
              ))}
            </ul>
            <p className="text-[11px] text-rose-400">
              Resolva as pendências acima antes de registrar a homologação formal.
            </p>
          </div>
        ) : exigeJustificativa ? (
          <div className="mb-4 rounded-lg border border-amber-800 bg-amber-950/40 p-3 text-xs text-amber-300 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span>Atenção: Homologação sob Ressalva</span>
            </div>
            <p className="text-[11px] text-amber-200/90 leading-relaxed">
              Existem itens de delimitação pendentes (período/granularidade não preenchidos ou perguntas informativas abertas). A homologação exige justificativa formal de no mínimo 15 caracteres para prosseguimento consciente.
            </p>
          </div>
        ) : (
          <div className="mb-4 rounded-lg border border-emerald-800 bg-emerald-950/40 p-3 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Critérios mínimos de prontidão atendidos integralmente.</span>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-rose-800 bg-rose-950/40 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Justificativa / Parecer do Analista *
            </label>
            <textarea
              required
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
              placeholder={
                exigeJustificativa
                  ? 'Descreva a motivação técnica para homologar mesmo com pendências de clarificação (mínimo 15 caracteres)...'
                  : 'Parecer do analista sobre a consistência dos requisitos acordados...'
              }
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Ressalvas ou Limitações Metodológicas Conhecidas (opcional)
            </label>
            <input
              type="text"
              value={ressalvas}
              onChange={(e) => setRessalvas(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
              placeholder="Ex.: Dados históricos de devolução só estarão disponíveis a partir de 2024..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Homologado Por (Profissional Responsável) *
            </label>
            <input
              type="text"
              required
              value={homologadoPor}
              onChange={(e) => setHomologadoPor(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
              placeholder="Nome do analista"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || bloqueado}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-40"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Homologar Levantamento</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
