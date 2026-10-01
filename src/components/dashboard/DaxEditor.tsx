'use client';

/**
 * src/components/dashboard/DaxEditor.tsx
 *
 * Editor Profissional de Expressões DAX com Análise Determinística em Tempo Real (Subgate 3.4C)
 *
 * Funcionalidades:
 * - Tipografia monoespaçada de alta legibilidade para fórmulas;
 * - Contador de linhas e caracteres em tempo real;
 * - Análise léxica estrutural em tempo real (delimitadores, funções, operadores);
 * - Separação visual e categórica: BLOQUEIOS (vermelho), ALERTAS (âmbar), RECOMENDAÇÕES (azul);
 * - Progressive disclosure pedagógico "Aprenda enquanto trabalha" contextual aos padrões digitados;
 * - Calibração epistêmica rigorosa: não promete execução no VertiPaq.
 */

import React, { useState, useMemo } from 'react';
import {
  Code2,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Sparkles,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  DaxRealTimeAnalyzer,
  AnaliseDaxResultado,
} from '@/core/domain/rules/dax-real-time-analyzer';
import { CategoriaMedidaDax } from '@/core/domain/enums/categoria-medida-dax';

interface DaxEditorProps {
  value: string;
  onChange: (newValue: string) => void;
  nomeMedida?: string;
  tabelaHospedeira?: string;
  categoriaDax?: CategoriaMedidaDax;
  metricaHomologadaNome?: string | null;
  placeholder?: string;
  rows?: number;
}

export function DaxEditor({
  value,
  onChange,
  nomeMedida = '',
  tabelaHospedeira = '_Medidas',
  categoriaDax,
  metricaHomologadaNome,
  placeholder = 'Ex: CALCULATE(SUM(fVendas[ValorLiquido]), DimCalendario[Ano] = 2024)',
  rows = 6,
}: DaxEditorProps) {
  const [expandPedagogico, setExpandPedagogico] = useState(true);

  // Análise determinística em tempo real memorizada a cada alteração da fórmula
  const analise: AnaliseDaxResultado = useMemo(() => {
    return DaxRealTimeAnalyzer.analisar({
      expressaoDax: value,
      nomeMedida,
      tabelaHospedeira,
      categoriaDax,
      metricaHomologadaNome,
    });
  }, [value, nomeMedida, tabelaHospedeira, categoriaDax, metricaHomologadaNome]);

  const lineCount = value.split('\n').length;
  const charCount = value.length;

  return (
    <div className="space-y-2.5" data-testid="dax-editor-container">
      {/* Barra de Ferramentas / Cabeçalho do Editor */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-blue-400" />
          <span className="font-semibold text-slate-200">Editor de Expressão DAX</span>
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
          <span>{lineCount} linha(s)</span>
          <span>•</span>
          <span>{charCount} caractere(s)</span>
          {analise.isSintaxeValidaLocalmente ? (
            <span className="inline-flex items-center gap-1 text-emerald-400 font-sans">
              <CheckCircle2 className="h-3 w-3" />
              <span>Sintaxe Balanceada</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-rose-400 font-sans font-semibold">
              <AlertCircle className="h-3 w-3" />
              <span>Pendência de Delimitadores</span>
            </span>
          )}
        </div>
      </div>

      {/* Área do Editor Monoespaçado */}
      <div className="relative rounded-xl border border-slate-800 bg-slate-950 shadow-inner focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
        <textarea
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          data-testid="textarea-dax-editor"
          spellCheck={false}
          className="w-full bg-transparent p-3 font-mono text-xs sm:text-sm text-blue-100 placeholder-slate-600 focus:outline-none resize-y leading-relaxed"
        />

        {/* Barra de Status Inferior do Editor */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-850 bg-slate-900/60 px-3 py-1.5 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Padrões:</span>
            {analise.padroesDetectados.length > 0 ? (
              analise.padroesDetectados.map((padrao, idx) => (
                <span
                  key={idx}
                  className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-blue-300 font-mono"
                >
                  {padrao}
                </span>
              ))
            ) : (
              <span className="italic text-slate-600">Nenhum padrão detectado ainda</span>
            )}
          </div>

          <span className="text-[10px] text-slate-500 hidden sm:inline italic">
            Tabular Model / Power BI DAX
          </span>
        </div>
      </div>

      {/* Painel de Diagnósticos Estruturais em Tempo Real */}
      {analise.diagnosticos.length > 0 && (
        <div className="space-y-1.5" data-testid="dax-diagnostics-panel">
          {analise.diagnosticos.map((diag) => {
            const isBloqueio = diag.severidade === 'BLOQUEIO';
            const isAlerta = diag.severidade === 'ALERTA_CRITICO';
            const isRecomendacao = diag.severidade === 'RECOMENDACAO';

            const bgClass = isBloqueio
              ? 'bg-rose-950/40 border-rose-800/70 text-rose-300'
              : isAlerta
              ? 'bg-amber-950/40 border-amber-800/70 text-amber-300'
              : 'bg-blue-950/30 border-blue-800/60 text-blue-300';

            const Icon = isBloqueio ? AlertCircle : isAlerta ? AlertTriangle : Info;

            return (
              <div
                key={diag.id}
                className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 ${bgClass}`}
              >
                <Icon className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{diag.titulo}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-mono uppercase bg-slate-900/80 border border-slate-700">
                      {diag.severidade}
                    </span>
                  </div>
                  <p className="mt-0.5 leading-relaxed text-slate-300">{diag.mensagem}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Card "Aprenda Enquanto Trabalha" (Progressive Disclosure Pedagógico) */}
      {analise.conteudoPedagogico.length > 0 && (
        <div
          data-testid="dax-pedagogical-box"
          className="rounded-xl border border-indigo-900/60 bg-indigo-950/20 p-3.5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <h4 className="text-xs font-bold text-indigo-200 uppercase tracking-wider">
                Aprenda Enquanto Trabalha — Conceitos em Ação
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setExpandPedagogico(!expandPedagogico)}
              className="text-indigo-400 hover:text-white transition-colors"
              aria-label="Alternar exibição pedagógica"
            >
              {expandPedagogico ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>

          {expandPedagogico && (
            <div className="space-y-2.5 pt-1">
              {analise.conteudoPedagogico.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-indigo-900/40 bg-slate-900/70 p-3 text-xs space-y-1.5"
                >
                  <div className="flex items-center gap-2 text-indigo-300 font-semibold">
                    <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
                    <span>{item.conceito}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] pt-1">
                    <div>
                      <span className="font-bold text-slate-300">O que é: </span>
                      <span className="text-slate-400">{item.oQueE}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-300">Por que importa: </span>
                      <span className="text-slate-400">{item.porQueImporta}</span>
                    </div>
                  </div>

                  <div className="p-2 rounded bg-indigo-950/40 border border-indigo-800/40 text-[11px]">
                    <span className="font-bold text-indigo-300">Dica Profissional: </span>
                    <span className="text-slate-300">{item.dicaProfissional}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Nota Epistêmica Permanente */}
      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono pt-1">
        <Info className="h-3 w-3 flex-shrink-0" />
        <span>{analise.avisoEpistemico}</span>
      </div>
    </div>
  );
}
