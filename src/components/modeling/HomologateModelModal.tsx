'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, FileCheck2, AlertTriangle, Loader2 } from 'lucide-react';
import { ModeloAnaliticoCompleto } from '@/core/domain/entities/modelo-analitico';
import { ProntidaoModeloOutput } from '@/core/use-cases/modeling';
import { homologarModeloAnaliticoAction } from '@/app/actions/modeling-actions';

interface HomologateModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelo: ModeloAnaliticoCompleto;
  prontidao: ProntidaoModeloOutput | null;
  demandaId: string;
  onSuccess: (msg: string) => void;
}

export function HomologateModelModal({
  isOpen,
  onClose,
  modelo,
  prontidao,
  demandaId,
  onSuccess,
}: HomologateModelModalProps) {
  const [justificativa, setJustificativa] = useState('');
  const [justificativaAlertas, setJustificativaAlertas] = useState('');
  const [homologadoPor, setHomologadoPor] = useState('Analista Responsável');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const alertasCriticos = prontidao?.alertasCriticosQueExigemJustificativa ?? [];
  const exigeJustificativaAlertas = alertasCriticos.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (justificativa.trim().length < 15) {
      setError('A justificativa de homologação deve conter no mínimo 15 caracteres.');
      return;
    }

    if (exigeJustificativaAlertas && justificativaAlertas.trim().length < 15) {
      setError('A justificativa técnica dos alertas críticos deve conter no mínimo 15 caracteres.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await homologarModeloAnaliticoAction(
        {
          modeloId: modelo.id,
          justificativa: justificativa.trim(),
          justificativaAlertas: exigeJustificativaAlertas ? justificativaAlertas.trim() : undefined,
          homologadoPor: homologadoPor.trim() || 'HUMANO',
        },
        demandaId
      );

      if (!res.success) {
        setError(res.error || 'Falha ao homologar modelo analítico.');
      } else {
        onSuccess(`Modelo analítico "${modelo.nome}" homologado com sucesso!`);
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado na homologação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      data-testid="homologate-model-modal"
    >
      <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Homologar Modelo Analítico</h3>
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
          <p className="text-slate-300 leading-relaxed">
            A homologação é um <strong>ato formal e soberano do analista humano</strong>. Ela certifica a integridade dimensional do modelo e autoriza o avanço da demanda para a etapa de Validação no Workflow.
          </p>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Homologado Por (Responsável Técnico)
            </label>
            <input
              type="text"
              required
              value={homologadoPor}
              onChange={(e) => setHomologadoPor(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              data-testid="input-homologated-by"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Justificativa Formal de Homologação * (Mínimo 15 caracteres)
            </label>
            <textarea
              rows={3}
              required
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              placeholder="Descreva a fundamentação técnica e negocial que respalda a homologação deste modelo..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              data-testid="input-homologation-justification"
            />
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Caracteres digitados: {justificativa.trim().length} / 15 mínimo
            </span>
          </div>

          {exigeJustificativaAlertas && (
            <div className="rounded-lg bg-amber-950/40 border border-amber-800/60 p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Justificativa Obrigatória de Alertas Críticos</span>
              </div>
              <p className="text-[11px] text-amber-300">
                O modelo possui os seguintes alertas críticos:
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-200">
                {alertasCriticos.map((alerta, idx) => (
                  <li key={idx}>{alerta}</li>
                ))}
              </ul>

              <div className="pt-1">
                <label className="block text-amber-200 font-semibold mb-1">
                  Justificativa Técnica dos Alertas * (Mínimo 15 caracteres)
                </label>
                <textarea
                  rows={2}
                  required
                  value={justificativaAlertas}
                  onChange={(e) => setJustificativaAlertas(e.target.value)}
                  placeholder="Justifique formalmente o uso de relacionamento N:M ou filtro bidirecional..."
                  className="w-full rounded bg-slate-950 border border-amber-800/80 px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-500 text-xs"
                  data-testid="input-critical-alerts-justification"
                />
                <span className="text-[11px] text-amber-400/80 block mt-0.5">
                  Caracteres digitados: {justificativaAlertas.trim().length} / 15 mínimo
                </span>
              </div>
            </div>
          )}

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
              data-testid="btn-submit-homologate-model"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Homologando...' : 'Confirmar Homologação'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
