'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Loader2,
  UserCheck,
  Info
} from 'lucide-react';
import { ProblemaQualidade } from '@/core/domain/entities/problema-qualidade';
import { SeveridadeProblema, ROTULOS_SEVERIDADE_PROBLEMA } from '@/core/domain/enums/severidade-problema';
import { AcaoProblemaQualidade, ROTULOS_ACAO_PROBLEMA_QUALIDADE } from '@/core/domain/enums/acao-problema-qualidade';
import { deliberateQualityProblemAction } from '@/app/actions/quality-actions';

type SeveridadeDeliberavel =
  | SeveridadeProblema.BAIXA
  | SeveridadeProblema.MEDIA
  | SeveridadeProblema.ALTA
  | SeveridadeProblema.CRITICA;

interface DeliberateProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  problem: ProblemaQualidade | null;
  demandaId: string;
  onSuccess: (updated: ProblemaQualidade) => void;
}

export function DeliberateProblemModal({
  isOpen,
  onClose,
  problem,
  demandaId,
  onSuccess,
}: DeliberateProblemModalProps) {
  const [severidade, setSeveridade] = useState<SeveridadeDeliberavel>(
    problem?.severidade && problem.severidade !== SeveridadeProblema.PENDENTE
      ? (problem.severidade as SeveridadeDeliberavel)
      : SeveridadeProblema.ALTA
  );
  const [acaoDeliberada, setAcaoDeliberada] = useState<AcaoProblemaQualidade>(
    (problem?.acao_deliberada as AcaoProblemaQualidade) || AcaoProblemaQualidade.TRATAR_NO_PIPELINE
  );
  const [impactoCalculo, setImpactoCalculo] = useState(problem?.impacto_calculo || '');
  const [justificativa, setJustificativa] = useState(problem?.justificativa_deliberacao || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (problem) {
      setSeveridade(
        problem.severidade && problem.severidade !== SeveridadeProblema.PENDENTE
          ? (problem.severidade as SeveridadeDeliberavel)
          : SeveridadeProblema.ALTA
      );
      setAcaoDeliberada(
        (problem.acao_deliberada as AcaoProblemaQualidade) || AcaoProblemaQualidade.TRATAR_NO_PIPELINE
      );
      setImpactoCalculo(problem.impacto_calculo || '');
      setJustificativa(problem.justificativa_deliberacao || '');
      setErrorMessage(null);
    }
  }, [problem]);

  // Tecla Escape para fechar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !problem) return null;

  const charCount = justificativa.trim().length;
  const isJustificativaValida = charCount >= 15;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isJustificativaValida) {
      setErrorMessage('A justificativa da deliberação é obrigatória e deve conter no mínimo 15 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await deliberateQualityProblemAction({
        problemaId: problem.id,
        demandaId,
        severidade,
        acaoDeliberada,
        justificativa: justificativa.trim(),
        impactoCalculo: impactoCalculo.trim() || null,
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Falha ao salvar a deliberação.');
      } else {
        onSuccess(res.data);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro inesperado ao registrar a deliberação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      data-testid="deliberate-problem-modal"
    >
      <div className="w-full max-w-xl rounded-xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header do Modal */}
        <div className="flex items-center justify-between border-b border-slate-800 p-5 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-900/60 bg-amber-950/40 text-amber-400">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Deliberação Humana Soberana
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-sm">
                Anomalia: <strong className="text-slate-200">{problem.titulo}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Fechar Modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Formulário com Scroll Interno */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4">
          {/* Banner Didático de Separação Epistêmica */}
          <div className="rounded-lg border border-blue-900/60 bg-blue-950/30 p-3 text-xs text-blue-300 flex items-start gap-2.5">
            <Info className="h-4 w-4 shrink-0 text-blue-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-blue-200">
                A máquina detecta e calcula; você classifica e assume a decisão.
              </p>
              <p className="text-blue-300/80 text-[11px] leading-relaxed">
                A <strong>Severidade</strong> define o risco no Quality Gate (anomalias críticas ou altas em aberto bloqueiam o avanço). A <strong>Ação</strong> define como você pretende resolver.
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="rounded-lg border border-rose-800 bg-rose-950/60 p-3 text-xs text-rose-300 flex items-center gap-2" data-testid="deliberation-error-message">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Escolha da Severidade Definitiva */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              1. Severidade Definitiva (Classificação de Risco):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" data-testid="severity-radio-group">
              {[
                {
                  val: SeveridadeProblema.CRITICA as SeveridadeDeliberavel,
                  label: 'Crítica',
                  desc: 'Bloqueante',
                  border: 'peer-checked:border-rose-600 peer-checked:bg-rose-950/40 text-rose-400'
                },
                {
                  val: SeveridadeProblema.ALTA as SeveridadeDeliberavel,
                  label: 'Alta',
                  desc: 'Bloqueante',
                  border: 'peer-checked:border-orange-600 peer-checked:bg-orange-950/40 text-orange-400'
                },
                {
                  val: SeveridadeProblema.MEDIA as SeveridadeDeliberavel,
                  label: 'Média',
                  desc: 'Não bloqueia',
                  border: 'peer-checked:border-blue-600 peer-checked:bg-blue-950/40 text-blue-400'
                },
                {
                  val: SeveridadeProblema.BAIXA as SeveridadeDeliberavel,
                  label: 'Baixa',
                  desc: 'Não bloqueia',
                  border: 'peer-checked:border-slate-600 peer-checked:bg-slate-800 text-slate-400'
                },
              ].map((item) => (
                <label
                  key={item.val}
                  className="cursor-pointer"
                  data-testid={`radio-severity-${item.val}`}
                >
                  <input
                    type="radio"
                    name="severidade"
                    value={item.val}
                    checked={severidade === item.val}
                    onChange={() => setSeveridade(item.val)}
                    className="sr-only peer"
                  />
                  <div className={`rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-center transition-all peer-checked:ring-1 peer-checked:ring-blue-500 ${item.border}`}>
                    <div className="text-xs font-bold">{item.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 2. Escolha da Ação Deliberada */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              2. Ação Deliberada (Encaminhamento Operacional):
            </label>
            <select
              value={acaoDeliberada}
              onChange={(e) => setAcaoDeliberada(e.target.value as AcaoProblemaQualidade)}
              data-testid="select-deliberated-action"
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value={AcaoProblemaQualidade.TRATAR_NO_PIPELINE}>
                {ROTULOS_ACAO_PROBLEMA_QUALIDADE[AcaoProblemaQualidade.TRATAR_NO_PIPELINE]} (Resolver na Preparação / ETL)
              </option>
              <option value={AcaoProblemaQualidade.CORRIGIR_NA_FONTE}>
                {ROTULOS_ACAO_PROBLEMA_QUALIDADE[AcaoProblemaQualidade.CORRIGIR_NA_FONTE]} (Solicitar novo arquivo corrigido)
              </option>
              <option value={AcaoProblemaQualidade.SOLICITAR_ESCLARECIMENTO}>
                {ROTULOS_ACAO_PROBLEMA_QUALIDADE[AcaoProblemaQualidade.SOLICITAR_ESCLARECIMENTO]} (Tirar dúvida com área de negócio)
              </option>
              <option value={AcaoProblemaQualidade.ACEITAR_COMO_RESTRICAO}>
                {ROTULOS_ACAO_PROBLEMA_QUALIDADE[AcaoProblemaQualidade.ACEITAR_COMO_RESTRICAO]} (Seguir ciente da limitação técnica)
              </option>
              <option value={AcaoProblemaQualidade.MONITORAR}>
                {ROTULOS_ACAO_PROBLEMA_QUALIDADE[AcaoProblemaQualidade.MONITORAR]} (Acompanhar evolução nas próximas cargas)
              </option>
            </select>
          </div>

          {/* 3. Impacto no Cálculo / KPIs (Opcional) */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              3. Impacto em Métricas / KPIs (Opcional):
            </label>
            <input
              type="text"
              placeholder="Ex: Pode subestimar o faturamento mensal em até 2%."
              value={impactoCalculo}
              onChange={(e) => setImpactoCalculo(e.target.value)}
              data-testid="input-impacto-calculo"
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* 4. Justificativa Formal Mandatória */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                4. Justificativa Formal da Deliberação: <span className="text-rose-400">*</span>
              </label>
              <span
                className={`text-[11px] font-mono ${
                  isJustificativaValida ? 'text-emerald-400 font-semibold' : 'text-amber-400'
                }`}
                data-testid="justificativa-char-count"
              >
                {charCount} / 15 caracteres mínimos
              </span>
            </div>

            <textarea
              rows={4}
              required
              placeholder="Explique tecnicamente a razão da classificação e o direcionamento adotado (mínimo de 15 caracteres obrigatório para auditoria)..."
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              data-testid="textarea-justificativa-deliberacao"
              className="w-full rounded-lg bg-slate-950 border border-slate-800 p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Esta justificativa será registrada na trilha imutável de auditoria sob sua responsabilidade profissional.
            </p>
          </div>

          {/* Footer do Modal */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isJustificativaValida}
              data-testid="btn-confirm-deliberation"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Registrando Deliberação...</span>
                </>
              ) : (
                <span>Confirmar Deliberação</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
