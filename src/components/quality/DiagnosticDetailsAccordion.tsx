'use client';

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Clock,
  Layers,
  Database,
  History,
  Info
} from 'lucide-react';
import { DiagnosticoQualidade } from '@/core/domain/entities/diagnostico-qualidade';
import { ROTULOS_STATUS_EXECUCAO_DIAGNOSTICO } from '@/core/domain/enums/status-execucao-diagnostico';
import { ROTULOS_STATUS_VERIFICACAO_QUALIDADE, StatusVerificacaoQualidade } from '@/core/domain/enums/status-verificacao-qualidade';
import { Card } from '@/components/ui/Card';

interface DiagnosticDetailsAccordionProps {
  diagnostico: DiagnosticoQualidade | null;
  historico?: DiagnosticoQualidade[];
}

export function DiagnosticDetailsAccordion({
  diagnostico,
  historico = [],
}: DiagnosticDetailsAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  if (!diagnostico) {
    return null;
  }

  const isParcial = diagnostico.status_execucao === 'CONCLUIDO_PARCIALMENTE';
  const isFalha = diagnostico.status_execucao === 'FALHA';

  return (
    <Card className="border-slate-800 bg-slate-900/60 overflow-hidden" testId="diagnostic-details-accordion">
      {/* Botão de Toggle do Accordion */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        data-testid="btn-toggle-diagnostic-details"
        className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 text-left hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300">
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-white">
                Verificações V1–V7 e Metadados Técnicos do Diagnóstico
              </span>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold border ${
                  isFalha
                    ? 'bg-rose-950/80 border-rose-800 text-rose-300'
                    : isParcial
                    ? 'bg-cyan-950/80 border-cyan-800 text-cyan-300'
                    : 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                }`}
              >
                {ROTULOS_STATUS_EXECUCAO_DIAGNOSTICO[diagnostico.status_execucao] || diagnostico.status_execucao}
              </span>
              {isParcial && (
                <span className="text-[10px] text-cyan-400 font-medium">
                  🛡️ Limitado por guardrail de segurança
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Executado em {new Date(diagnostico.iniciado_em).toLocaleString('pt-BR')} • {diagnostico.total_linhas_avaliadas.toLocaleString('pt-BR')} linhas • {diagnostico.total_colunas_avaliadas} colunas • Duração: {diagnostico.duracao_ms}ms
            </p>
          </div>
        </div>

        <span className="text-xs text-blue-400 hover:text-blue-300 font-medium shrink-0">
          {isOpen ? 'Ocultar detalhes técnicos' : 'Ver detalhes técnicos'}
        </span>
      </button>

      {/* Conteúdo Expandido do Accordion */}
      {isOpen && (
        <div className="border-t border-slate-800/80 p-5 space-y-5 bg-slate-950/30">
          {/* Alerta de Falha se aplicável */}
          {diagnostico.erro_mensagem && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-800 bg-rose-950/40 p-3 text-xs text-rose-300">
              <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{diagnostico.erro_mensagem}</span>
            </div>
          )}

          {/* Grid das Verificações Executadas V1 a V7 */}
          <div>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Resultado por Verificação Estrutural (V1–V7) e Regras de Negócio:
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3" data-testid="diagnostic-verifications-grid">
              {diagnostico.verificacoes_executadas.map((item, idx) => {
                const isClean = item.status === StatusVerificacaoQualidade.EXECUTADA_SEM_PROBLEMAS;
                const isLimited = item.status === StatusVerificacaoQualidade.LIMITADA_POR_GUARDRAIL;
                const hasProblems = item.status === StatusVerificacaoQualidade.EXECUTADA_COM_PROBLEMAS;

                return (
                  <div
                    key={idx}
                    className={`rounded-lg border p-3 flex items-start justify-between gap-3 text-xs transition-colors ${
                      isClean
                        ? 'border-slate-800 bg-slate-900/40'
                        : isLimited
                        ? 'border-cyan-800/60 bg-cyan-950/20'
                        : 'border-amber-800/60 bg-amber-950/20'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {isClean && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
                        {isLimited && <ShieldAlert className="h-4 w-4 text-cyan-400 shrink-0" />}
                        {hasProblems && <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />}
                        <span className="font-semibold text-slate-200">{item.nome}</span>
                      </div>
                      {item.observacao && (
                        <p className="text-[11px] text-slate-400 pl-6 leading-tight">
                          {item.observacao}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`font-mono font-bold ${
                        isClean ? 'text-slate-400' : isLimited ? 'text-cyan-300' : 'text-amber-300'
                      }`}>
                        {item.totalProblemas} anomalia(s)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Histórico Imutável de Diagnósticos Anteriores */}
          {historico.length > 1 && (
            <div className="pt-3 border-t border-slate-800/60">
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                data-testid="btn-toggle-diagnostic-history"
                className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
              >
                <History className="h-3.5 w-3.5" />
                <span>Histórico de Auditoria: {historico.length} execuções registradas para este ativo</span>
                <span className="text-[10px] text-blue-400 underline">
                  {showHistory ? '(Ocultar histórico)' : '(Exibir histórico)'}
                </span>
              </button>

              {showHistory && (
                <div className="mt-3 space-y-2" data-testid="diagnostic-history-list">
                  {historico.map((h, i) => (
                    <div
                      key={h.id}
                      className="flex items-center justify-between text-xs p-2.5 rounded bg-slate-900 border border-slate-800/80 text-slate-300"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-500 text-[11px]">#{historico.length - i}</span>
                        <span>{new Date(h.iniciado_em).toLocaleString('pt-BR')}</span>
                        {i === 0 && (
                          <span className="rounded bg-blue-950 border border-blue-800 text-blue-300 text-[10px] px-1 font-semibold">
                            Atual
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-slate-400 text-[11px]">
                        <span>{h.total_linhas_avaliadas.toLocaleString('pt-BR')} linhas</span>
                        <span>{h.total_problemas_detectados} anomalia(s)</span>
                        <span className="font-mono">{h.duracao_ms}ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
