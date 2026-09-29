'use client';

import React, { useState } from 'react';
import { X, Calendar, Sparkles, Loader2 } from 'lucide-react';
import { especificarDimensaoCalendarioAction } from '@/app/actions/modeling-actions';

interface SpecifyCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  modeloId: string;
  demandaId: string;
  onSuccess: (msg: string) => void;
}

export function SpecifyCalendarModal({
  isOpen,
  onClose,
  modeloId,
  demandaId,
  onSuccess,
}: SpecifyCalendarModalProps) {
  const [nome, setNome] = useState('Dimensão Calendário');
  const [dataInicio, setDataInicio] = useState('2024-01-01');
  const [dataFim, setDataFim] = useState('2026-12-31');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await especificarDimensaoCalendarioAction(
        {
          modeloId,
          nome: nome.trim() || undefined,
          dataInicio: dataInicio || undefined,
          dataFim: dataFim || undefined,
        },
        demandaId
      );

      if (!res.success) {
        setError(res.error || 'Falha ao especificar dimensão calendário.');
      } else {
        onSuccess('Dimensão Calendário concebida e integrada ao modelo analítico com sucesso!');
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado ao especificar calendário.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      data-testid="specify-calendar-modal"
    >
      <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Especificar Dimensão Calendário</h3>
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
          <p className="text-slate-400 leading-relaxed">
            A especificação da <strong>Dimensão Calendário</strong> padroniza agregações cronológicas (ano, mês, trimestre, semestre) e viabiliza inteligência temporal sem duplicar cálculos, atendendo à recomendação <strong>M-08</strong>.
          </p>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Nome da Entidade Calendário
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              data-testid="input-calendar-name"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Data de Início
              </label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                data-testid="input-calendar-start-date"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Data de Fim
              </label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                data-testid="input-calendar-end-date"
              />
            </div>
          </div>

          <div className="rounded-lg bg-indigo-950/30 border border-indigo-800/40 p-3 text-indigo-300 text-[11px] space-y-1">
            <span className="font-semibold text-white block">Atributos Lógicos Gerados:</span>
            <span>DataKey (PK), Data, Ano, Mês, Nome_Mês, Trimestre, Semestre, Dia_Semana, É_Dia_Útil.</span>
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
              data-testid="btn-submit-specify-calendar"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Gerando...' : 'Especificar Calendário'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
