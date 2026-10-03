'use client';

import React, { useState } from 'react';
import { Copy, Check, X, FileText, MessageSquare, ShieldCheck, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PerguntaClarificacaoIntake } from '@/core/domain/intake/intake-types';
import { IntakeAnalysisEngine } from '@/core/domain/intake/intake-analysis-engine';

interface IntakeContractorScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  perguntasSelecionadas: PerguntaClarificacaoIntake[];
  demandaTitulo?: string;
}

export function IntakeContractorScriptModal({
  isOpen,
  onClose,
  perguntasSelecionadas,
  demandaTitulo,
}: IntakeContractorScriptModalProps) {
  const [copiado, setCopiado] = useState(false);

  if (!isOpen) return null;

  const roteiroGerado = IntakeAnalysisEngine.gerarRoteiroContratante(
    perguntasSelecionadas,
    demandaTitulo
  );

  const handleCopiar = async () => {
    try {
      await navigator.clipboard.writeText(roteiroGerado);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // Fallback para seleção de texto se o clipboard do navegador falhar
      const textarea = document.createElement('textarea');
      textarea.value = roteiroGerado;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      data-testid="modal-roteiro-contratante"
    >
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden">
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-950/80 border border-blue-800/60 rounded-lg text-blue-400">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">
                  Roteiro de Perguntas para o Contratante
                </h3>
                <Badge variant="default" data-testid="badge-qtd-perguntas-roteiro">
                  {perguntasSelecionadas.length} selecionada(s)
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Linguagem simples e orientada a negócio, livre de jargões técnicos de dados.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            data-testid="btn-fechar-roteiro-header"
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Informações pedagógicas / salvaguarda */}
        <div className="px-6 py-2.5 bg-blue-950/30 border-b border-blue-900/30 flex items-center justify-between text-xs text-blue-300">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-blue-400" />
            <span>
              Contém apenas as perguntas aceitas na etapa de revisão. Nenhuma mensagem é enviada automaticamente.
            </span>
          </span>
          <span className="text-[11px] text-slate-400">
            Pronto para WhatsApp, e-mail ou reunião presencial.
          </span>
        </div>

        {/* Corpo com o texto do roteiro formatado */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div
            data-testid="content-roteiro-contratante"
            className="rounded-lg bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap select-text max-h-[50vh] overflow-y-auto"
          >
            {roteiroGerado}
          </div>
        </div>

        {/* Rodapé com Ações */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <span className="text-xs text-slate-500">
            {copiado ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <Check className="h-4 w-4" />
                Texto copiado para a área de transferência!
              </span>
            ) : (
              'Clique no botão ao lado para copiar todo o texto formatado.'
            )}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              data-testid="btn-fechar-roteiro"
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium transition-colors"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={handleCopiar}
              data-testid="btn-copiar-roteiro"
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-sm ${
                copiado
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {copiado ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copiar Roteiro</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
