'use client';

import React, { useState } from 'react';
import { X, Link2, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { associarProblemaEtapaAction, desassociarProblemaEtapaAction } from '@/app/actions/preparation-actions';
import { EtapaTransformacao } from '@/core/domain/entities/etapa-transformacao';
import { ProblemaQualidade } from '@/core/domain/entities/problema-qualidade';
import { Badge } from '@/components/ui/Badge';

interface AssociateProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  etapa: EtapaTransformacao | null;
  problemasDemanda: ProblemaQualidade[];
  problemasVinculadosIds: string[];
  demandaId: string;
  onSuccess: () => void;
}

export function AssociateProblemModal({
  isOpen,
  onClose,
  etapa,
  problemasDemanda,
  problemasVinculadosIds,
  demandaId,
  onSuccess,
}: AssociateProblemModalProps) {
  const [loadingProblemId, setLoadingProblemId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !etapa) return null;

  const handleToggle = async (problemaId: string, isCurrentlyLinked: boolean) => {
    setLoadingProblemId(problemaId);
    setError(null);

    try {
      if (isCurrentlyLinked) {
        const res = await desassociarProblemaEtapaAction(
          { etapa_id: etapa.id, problema_id: problemaId },
          demandaId
        );
        if (!res.success) {
          setError(res.error || 'Erro ao desvincular problema.');
        } else {
          onSuccess();
        }
      } else {
        const res = await associarProblemaEtapaAction(
          { etapa_id: etapa.id, problema_id: problemaId },
          demandaId
        );
        if (!res.success) {
          setError(res.error || 'Erro ao vincular problema.');
        } else {
          onSuccess();
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado na operação.');
    } finally {
      setLoadingProblemId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      data-testid="associate-problem-modal"
    >
      <div className="w-full max-w-xl rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-blue-400" />
            <div>
              <h3 className="text-base font-bold text-white">Vincular Problemas à Etapa #{etapa.ordem}</h3>
              <p className="text-[11px] text-slate-400 truncate max-w-sm">{etapa.descricao}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="btn-close-associate-modal"
            className="text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div
            className="rounded-lg border border-rose-800 bg-rose-950/60 p-3 text-xs text-rose-300 shrink-0"
            data-testid="error-associate-problem"
          >
            {error}
          </div>
        )}

        <div className="text-xs text-slate-300 shrink-0">
          Selecione quais anomalias detectadas no diagnóstico de qualidade esta etapa visa tratar e resolver:
        </div>

        <div className="overflow-y-auto space-y-2.5 pr-1 flex-1" data-testid="problems-link-list">
          {problemasDemanda.length > 0 ? (
            problemasDemanda.map((prob) => {
              const isLinked = problemasVinculadosIds.includes(prob.id);
              const isLoading = loadingProblemId === prob.id;

              return (
                <div
                  key={prob.id}
                  className={`flex items-start justify-between gap-3 p-3 rounded-lg border transition-colors ${
                    isLinked
                      ? 'border-blue-800 bg-blue-950/30'
                      : 'border-slate-800 bg-slate-950/40 hover:bg-slate-950/80'
                  }`}
                  data-testid={`problem-link-item-${prob.id}`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-white">{prob.titulo}</span>
                      <Badge
                        variant={
                          prob.severidade === 'CRITICA'
                            ? 'warning'
                            : prob.severidade === 'ALTA'
                            ? 'warning'
                            : 'neutral'
                        }
                        className="text-[9px]"
                      >
                        {prob.severidade}
                      </Badge>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">
                        ({prob.status})
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300">{prob.descricao}</p>

                    {prob.coluna_afetada && (
                      <span className="text-[10px] text-slate-400 block font-mono">
                        Coluna: {prob.coluna_afetada}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggle(prob.id, isLinked)}
                    disabled={isLoading}
                    data-testid={`btn-toggle-link-${prob.id}`}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold shrink-0 transition-colors ${
                      isLinked
                        ? 'bg-blue-600 text-white hover:bg-blue-500'
                        : 'border border-slate-700 bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {isLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : isLinked ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Vinculado</span>
                      </>
                    ) : (
                      <span>Vincular</span>
                    )}
                  </button>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 text-slate-400 text-xs">
              Nenhum problema de qualidade catalogado para esta demanda.
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-800 border border-slate-700 px-4 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}
