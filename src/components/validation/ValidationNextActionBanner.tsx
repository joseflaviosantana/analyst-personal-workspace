'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, ShieldAlert, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import { ResultadoAvaliacaoValidacao } from '@/core/domain/rules/validation-rules-evaluator';

interface ValidationNextActionBannerProps {
  prontidao: ResultadoAvaliacaoValidacao | null;
  onOpenCreateModal?: () => void;
  isReadOnly?: boolean;
}

export function ValidationNextActionBanner({
  prontidao,
  onOpenCreateModal,
  isReadOnly = false,
}: ValidationNextActionBannerProps) {
  if (!prontidao) return null;

  const isBloqueado = !prontidao.pronto_para_entrega;
  const hasBloqueios = prontidao.bloqueios_entrega.length > 0;
  const hasAlertas = prontidao.alertas_criticos.length > 0;

  if (!isBloqueado) {
    return (
      <div
        data-testid="validation-next-action-banner"
        className="rounded-xl border border-emerald-800/80 bg-emerald-950/40 p-4 shadow-sm"
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-emerald-200">
              Etapa de Validação Concluída com Sucesso
            </h4>
            <p className="mt-1 text-xs text-emerald-300/90 leading-relaxed">
              Todos os checks de validação obrigatórios foram executados e encontram-se dentro da tolerância definida.
              A demanda está apta para avançar no workflow para o estado <strong>Pronta para Entrega</strong>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="validation-next-action-banner"
      className={clsx(
        'rounded-xl border p-4 shadow-sm',
        hasBloqueios
          ? 'border-amber-800/80 bg-amber-950/40'
          : 'border-blue-800/80 bg-blue-950/40'
      )}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          {hasBloqueios ? (
            <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
          )}
          <div>
            <h4 className="text-sm font-semibold text-white">
              {hasBloqueios
                ? 'Avanço para Pronta para Entrega Bloqueado (Governança V-01 / V-02)'
                : 'Atenção Operacional na Etapa de Validação'}
            </h4>
            <div className="mt-1 space-y-1 text-xs text-slate-300">
              {prontidao.bloqueios_entrega.map((bloqueio, idx) => (
                <p key={idx} className="flex items-center gap-1.5 text-amber-300 font-medium">
                  <span>•</span>
                  <span>{bloqueio}</span>
                </p>
              ))}
              {prontidao.alertas_criticos.map((alerta, idx) => (
                <p key={idx} className="flex items-center gap-1.5 text-slate-300">
                  <span>•</span>
                  <span>{alerta}</span>
                </p>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              {prontidao.total_validacoes === 0
                ? 'Ação Necessária: Cadastre ao menos um check de conciliação ou teste de integridade para satisfazer a regra V-01.'
                : 'Ação Necessária: Ajuste os cálculos ou dados e execute o Reteste dos checks divergentes para satisfazer a regra V-02.'}
            </p>
          </div>
        </div>

        {!isReadOnly && onOpenCreateModal && (
          <button
            type="button"
            onClick={onOpenCreateModal}
            data-testid="btn-banner-create-validation"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 shrink-0 transition-colors"
          >
            <span>Novo Check de Conciliação</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
