'use client';

import React from 'react';
import { Sparkles, MessageSquareText, AlertCircle, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface IntakeInputSectionProps {
  solicitacao: string;
  onChangeSolicitacao: (text: string) => void;
  onAnalisar: () => void;
  isAnalyzing: boolean;
  error: string | null;
}

export function IntakeInputSection({
  solicitacao,
  onChangeSolicitacao,
  onAnalisar,
  isAnalyzing,
  error,
}: IntakeInputSectionProps) {
  const charCount = solicitacao.length;
  const isValidLength = charCount >= 5;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Cabeçalho da Porta de Entrada */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-950/80 border border-blue-800/60 px-3.5 py-1 text-xs font-semibold text-blue-400">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Intake Inteligente — Copiloto Proativo</span>
        </div>
        <h1
          data-testid="intake-title"
          className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
        >
          O que você precisa analisar?
        </h1>
        <p
          data-testid="intake-guidance"
          className="text-base text-slate-400 max-w-2xl mx-auto"
        >
          Cole ou descreva a solicitação como você a recebeu. Não precisa organizar ou escrever de forma técnica.
        </p>
      </div>

      {/* Card Principal de Entrada */}
      <Card className="p-6 border-slate-800 bg-slate-900/80 shadow-xl space-y-4">
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <label
                htmlFor="solicitacao-bruta-input"
                className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2"
              >
                <MessageSquareText className="h-4 w-4 text-blue-400" />
                <span>PEDIDO ORIGINAL</span>
              </label>
              <p className="text-xs text-slate-400 mt-0.5">
                Cole aqui a mensagem, solicitação ou descrição que você recebeu.
              </p>
            </div>
            <span
              data-testid="intake-char-counter"
              className="text-xs font-mono text-slate-400 self-start sm:self-auto"
            >
              {charCount} caracteres
            </span>
          </div>

          <textarea
            id="solicitacao-bruta-input"
            data-testid="textarea-solicitacao-bruta"
            rows={8}
            value={solicitacao}
            onChange={(e) => onChangeSolicitacao(e.target.value)}
            disabled={isAnalyzing}
            placeholder="Ex: Olá, precisamos com urgência de um dashboard de faturamento por filial para o ano de 2025 para apresentar na reunião de diretoria da próxima sexta-feira. Os dados estão na planilha vendas_2025.xlsx."
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60 transition-colors font-sans"
            aria-label="Texto da solicitação recebida"
            aria-describedby="intake-guidance"
          />
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div
            data-testid="intake-error-message"
            className="flex items-center gap-2.5 rounded-lg border border-rose-900/80 bg-rose-950/40 p-3.5 text-xs text-rose-300 animate-in fade-in"
            role="alert"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Barra de Ação */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
          <div className="text-xs text-slate-400 text-center sm:text-left">
            <span>Seu pedido original será preservado sem alterações para consulta e auditoria.</span>
          </div>

          <button
            type="button"
            data-testid="btn-analyze-intake"
            onClick={onAnalisar}
            disabled={isAnalyzing || !isValidLength}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950 transition-all"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Analisando com Copiloto...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Analisar Solicitação</span>
              </>
            )}
          </button>
        </div>
      </Card>
    </div>
  );
}
