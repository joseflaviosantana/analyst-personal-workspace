'use client';

import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Sparkles, X } from 'lucide-react';
import { ConceitoModelagem } from '@/core/use-cases/copilot';

interface CopilotConceptCardProps {
  conceitos: ConceitoModelagem[];
  dicaProfissional?: string;
}

export function CopilotConceptCard({ conceitos, dicaProfissional }: CopilotConceptCardProps) {
  const [conceitoSelecionadoId, setConceitoSelecionadoId] = useState<string | null>(null);

  if (!conceitos || conceitos.length === 0) {
    return null;
  }

  const conceitoAtivo = conceitos.find((c) => c.id === conceitoSelecionadoId);

  return (
    <div className="space-y-2.5 pt-2 border-t border-slate-800/80" data-testid="copilot-concepts-section">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
          <BookOpen className="h-3.5 w-3.5 text-blue-400" />
          <span>Aprenda enquanto trabalha</span>
        </div>
        {conceitoAtivo && (
          <button
            type="button"
            onClick={() => setConceitoSelecionadoId(null)}
            className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors inline-flex items-center gap-1"
            data-testid="btn-close-concept"
          >
            <span>Fechar explicação</span>
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Lista sóbria de conceitos-chave como botões discretos */}
      <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Conceitos pedagógicos">
        {conceitos.map((conceito) => {
          const isSelected = conceito.id === conceitoSelecionadoId;
          return (
            <button
              key={conceito.id}
              type="button"
              onClick={() =>
                setConceitoSelecionadoId(isSelected ? null : conceito.id)
              }
              aria-expanded={isSelected}
              data-testid={`btn-concept-${conceito.id}`}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors border ${
                isSelected
                  ? 'bg-blue-950/80 border-blue-700 text-blue-200 font-medium'
                  : 'bg-slate-800/70 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>{conceito.termo}</span>
              {isSelected ? (
                <ChevronUp className="h-3 w-3 opacity-70" />
              ) : (
                <ChevronDown className="h-3 w-3 opacity-50" />
              )}
            </button>
          );
        })}
      </div>

      {/* Detalhamento pedagógico inline com progressive disclosure */}
      {conceitoAtivo && (
        <div
          className="rounded-lg bg-slate-950/70 border border-slate-800 p-3.5 text-xs text-slate-300 space-y-2 mt-2 leading-relaxed"
          data-testid="copilot-concept-detail"
        >
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
            <h4 className="font-semibold text-white flex items-center gap-1.5">
              <span>{conceitoAtivo.termo}</span>
              <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 uppercase tracking-wider">
                {conceitoAtivo.categoria}
              </span>
            </h4>
          </div>

          <p className="text-slate-300">
            {conceitoAtivo.definicaoSimples}
          </p>

          <div className="pt-1 text-[11px] text-slate-400">
            <strong className="text-slate-200">Por que importa: </strong>
            {conceitoAtivo.porQueImporta}
          </div>

          {conceitoAtivo.detalheTecnico && (
            <div className="pt-1 text-[11px] text-slate-400">
              <strong className="text-slate-200">Detalhe técnico: </strong>
              {conceitoAtivo.detalheTecnico}
            </div>
          )}

          {(conceitoAtivo.dicaProfissional || dicaProfissional) && (
            <div
              className="flex items-start gap-1.5 pt-1.5 text-[11px] text-blue-300/90 border-t border-slate-800/60"
              data-testid="copilot-concept-tip"
            >
              <Sparkles className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
              <span>
                <strong>Dica profissional:</strong>{' '}
                {conceitoAtivo.dicaProfissional || dicaProfissional}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
