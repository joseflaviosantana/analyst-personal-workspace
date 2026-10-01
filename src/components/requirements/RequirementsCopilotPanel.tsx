'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Plus,
  Lightbulb,
} from 'lucide-react';
import {
  DiagnosticoRequisitosCopiloto,
  SugestaoPerguntaCopiloto,
  ConceitoPedagogicoRequisitos,
} from '@/core/domain/requirements-copilot';
import { ProntidaoRequisitosOutput } from '@/core/use-cases/requirements/avaliar-prontidao-requisitos.use-case';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { criarPerguntaClarificacaoAction } from '@/app/actions/requirements-actions';

interface RequirementsCopilotPanelProps {
  demandaId: string;
  diagnostico: DiagnosticoRequisitosCopiloto | null;
  prontidao: ProntidaoRequisitosOutput | null;
  isReadOnly: boolean;
  onQuestionAdded?: () => void;
}

export function RequirementsCopilotPanel({
  demandaId,
  diagnostico,
  prontidao,
  isReadOnly,
  onQuestionAdded,
}: RequirementsCopilotPanelProps) {
  const [activeTab, setActiveTab] = useState<'prontidao' | 'sugestoes' | 'dicionario'>('prontidao');
  const [expandedConcept, setExpandedConcept] = useState<string | null>(null);
  const [addingQuestion, setAddingQuestion] = useState<string | null>(null);

  if (!diagnostico) {
    return (
      <Card className="p-6 bg-slate-900/40 border-slate-800 text-center">
        <Sparkles className="h-6 w-6 text-slate-500 mx-auto mb-2 animate-pulse" />
        <p className="text-xs text-slate-400">Carregando análise do Copiloto...</p>
      </Card>
    );
  }

  const handleAddSuggestedQuestion = async (sug: SugestaoPerguntaCopiloto) => {
    if (isReadOnly) return;
    setAddingQuestion(sug.id);
    try {
      const res = await criarPerguntaClarificacaoAction({
        demandaId,
        pergunta: sug.perguntaSugerida,
        motivacao: sug.motivacao,
        bloqueante: sug.bloqueanteRecomendado,
      });
      if (res.success && onQuestionAdded) {
        onQuestionAdded();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAddingQuestion(null);
    }
  };

  const { resumoOperacional, sugestoesPedagogicas, dicionarioConceitos, metricasBriefing } =
    diagnostico;

  return (
    <Card className="p-5 bg-slate-900/60 border-slate-800" data-testid="requirements-copilot-panel">
      {/* Header do Copiloto */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-indigo-950/80 border border-indigo-800/60 p-1.5 text-indigo-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Copiloto Consultivo de Requisitos
            </h4>
            <p className="text-[11px] text-slate-400">
              Apoio metodológico, detecção de lacunas e boas práticas analíticas.
            </p>
          </div>
        </div>

        {/* Abas do Copiloto */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('prontidao')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors ${
              activeTab === 'prontidao'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Prontidão
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sugestoes')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors ${
              activeTab === 'sugestoes'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sugestões ({sugestoesPedagogicas.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dicionario')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors ${
              activeTab === 'dicionario'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Dicionário ({dicionarioConceitos.length})
          </button>
        </div>
      </div>

      {/* Conteúdo Aba 1: Prontidão */}
      {activeTab === 'prontidao' && (
        <div className="space-y-3" data-testid="copilot-tab-prontidao">
          {/* Status Geral */}
          <div
            className={`rounded-lg border p-3 flex items-start gap-2.5 text-xs ${
              prontidao?.bloqueado
                ? 'border-rose-800/80 bg-rose-950/30 text-rose-200'
                : prontidao?.exigeJustificativaRessalva
                ? 'border-amber-800/80 bg-amber-950/30 text-amber-200'
                : 'border-emerald-800/80 bg-emerald-950/30 text-emerald-200'
            }`}
          >
            {prontidao?.bloqueado ? (
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            ) : prontidao?.exigeJustificativaRessalva ? (
              <Info className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
            )}
            <div className="space-y-1">
              <span className="font-semibold block">
                {resumoOperacional.titulo} ({resumoOperacional.statusBriefing})
              </span>
              <p className="text-[11px] leading-relaxed">
                <strong>Onde estamos:</strong> {resumoOperacional.ondeEstou}
              </p>
              <p className="text-[11px] leading-relaxed">
                <strong>Próximo passo:</strong> {resumoOperacional.oQueDevoFazerAgora}
              </p>
            </div>
          </div>

          {/* Checklist G-REQ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-2.5 flex items-center justify-between">
              <span className="text-slate-300">G-REQ-01: Solicitação Imutável</span>
              <Badge variant="success" className="text-[10px]">Preservada</Badge>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-2.5 flex items-center justify-between">
              <span className="text-slate-300">G-REQ-02: Perguntas Bloqueantes</span>
              <Badge
                variant={metricasBriefing.perguntasBloqueantes > 0 ? 'warning' : 'success'}
                className="text-[10px]"
              >
                {metricasBriefing.perguntasBloqueantes > 0
                  ? `${metricasBriefing.perguntasBloqueantes} pendente(s)`
                  : 'Zero pendentes'}
              </Badge>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-2.5 flex items-center justify-between">
              <span className="text-slate-300">G-REQ-03: Escopo Delimitado</span>
              <Badge
                variant={metricasBriefing.temObjetivo || metricasBriefing.totalObrigatorios > 0 ? 'success' : 'warning'}
                className="text-[10px]"
              >
                {metricasBriefing.temObjetivo || metricasBriefing.totalObrigatorios > 0 ? 'Atendido' : 'Indefinido'}
              </Badge>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-2.5 flex items-center justify-between">
              <span className="text-slate-300">G-REQ-04: Homologação Humana</span>
              <Badge
                variant={prontidao?.isHomologado ? 'success' : 'neutral'}
                className="text-[10px]"
              >
                {prontidao?.isHomologado ? 'Homologado' : 'Pendente'}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo Aba 2: Sugestões */}
      {activeTab === 'sugestoes' && (
        <div className="space-y-3" data-testid="copilot-tab-sugestoes">
          {sugestoesPedagogicas.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">
              Nenhuma sugestão adicional no momento. O briefing analítico possui boa cobertura inicial.
            </p>
          ) : (
            sugestoesPedagogicas.map((sug: SugestaoPerguntaCopiloto) => (
              <div
                key={sug.id}
                className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span className="font-semibold text-slate-200">{sug.titulo}</span>
                    <Badge variant="neutral" className="text-[10px]">
                      {sug.categoria}
                    </Badge>
                    {sug.bloqueanteRecomendado && (
                      <Badge variant="warning" className="text-[10px]">
                        Bloqueante
                      </Badge>
                    )}
                  </div>
                  <p className="text-slate-300 font-medium">{sug.perguntaSugerida}</p>
                  <p className="text-[11px] text-slate-400">{sug.motivacao}</p>
                </div>

                {!isReadOnly && (
                  <button
                    type="button"
                    disabled={addingQuestion === sug.id}
                    onClick={() => handleAddSuggestedQuestion(sug)}
                    className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded bg-slate-800 text-cyan-300 hover:bg-slate-700 border border-slate-700"
                    title="Adicionar à lista de perguntas de clarificação"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Adicionar</span>
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Conteúdo Aba 3: Dicionário Metodológico */}
      {activeTab === 'dicionario' && (
        <div className="space-y-2" data-testid="copilot-tab-dicionario">
          {dicionarioConceitos.map((conceito: ConceitoPedagogicoRequisitos) => {
            const isExpanded = expandedConcept === conceito.termo;
            return (
              <div
                key={conceito.termo}
                className="rounded-lg border border-slate-800 bg-slate-950/60 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpandedConcept(isExpanded ? null : conceito.termo)}
                  className="w-full px-3 py-2 text-left flex items-center justify-between text-xs font-semibold text-slate-200 hover:bg-slate-800/50"
                >
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
                    <span>{conceito.termo}</span>
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-3 pb-3 text-xs text-slate-300 space-y-2 border-t border-slate-800/60 pt-2">
                    <p className="leading-relaxed">
                      <strong>Definição:</strong> {conceito.definicao}
                    </p>
                    <p className="leading-relaxed text-slate-400">
                      <strong>Por que importa em BI:</strong> {conceito.porQueImporta}
                    </p>
                    <div className="rounded bg-slate-900 p-2 text-[11px] text-cyan-300">
                      <strong>Dica Prática:</strong> {conceito.dicaPratica}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
