'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  HelpCircle,
  FileSearch,
  Database,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  X,
  Info,
  Lightbulb,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export interface IntakeSnapshotData {
  fatos?: {
    ativosDados?: string[];
    prazo?: string | null;
    periodo?: string | null;
    entregaveis?: string[];
    indicadores?: string[];
  };
  descobertasDados?: {
    dimensoes?: string[];
    itensFaltantesDados?: string[];
  };
  inferenciasCopiloto?: {
    dominioNegocio?: string;
    problemaAparente?: string;
    objetivoProvavel?: string;
    indicadoresSugeridos?: Array<{ nome: string; descricao: string }>;
  };
  sinteseProximaAcao?: {
    estadoProntidao?: string;
    explicacaoEstado?: string;
    proximaAcaoRecomendada?: string;
  };
  geradoEm?: string;
}

interface IntakeContinuityBridgeProps {
  intakeSnapshotRaw?: string | null;
  isOrigemIntake?: boolean;
}

export function IntakeContinuityBridge({
  intakeSnapshotRaw,
  isOrigemIntake,
}: IntakeContinuityBridgeProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [showDossie, setShowDossie] = useState(false);

  // Se o usuário dispensou o card ou não há snapshot nem tag de origem, não renderiza
  if (isDismissed || (!intakeSnapshotRaw && !isOrigemIntake)) {
    return null;
  }

  let snapshot: IntakeSnapshotData | null = null;
  if (intakeSnapshotRaw) {
    try {
      snapshot = JSON.parse(intakeSnapshotRaw) as IntakeSnapshotData;
    } catch {
      snapshot = null;
    }
  }

  return (
    <Card
      className="p-5 border-blue-900/60 bg-gradient-to-r from-blue-950/40 via-slate-900/90 to-indigo-950/30 shadow-lg space-y-4 animate-in fade-in duration-300"
      data-testid="intake-continuity-bridge"
    >
      {/* Cabeçalho da Ponte */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-600/20 border border-blue-500/40 p-2 text-blue-400 shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">
                Ponte de Continuidade: Entrada Inteligente → Demanda
              </h2>
              <Badge variant="info" className="text-[10px]" testId="badge-origem-intake">
                Origem Intake
              </Badge>
            </div>
            <p className="text-xs text-slate-300">
              Demanda materializada com sucesso a partir da Entrada Inteligente. Siga o fluxo sequencial recomendado para dar continuidade sem perder contexto.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="text-slate-500 hover:text-slate-300 p-1 rounded-md transition-colors"
          title="Dispensar aviso de transição"
          aria-label="Dispensar ponte de transição"
          data-testid="btn-dismiss-bridge"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Próximo Passo Recomendado Único (Sequencial e Claro) */}
      <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-4 space-y-3" data-testid="recommended-next-steps">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
            <ArrowRight className="h-4 w-4" />
            <span>Ordem Operacional Recomendada</span>
          </span>
          <span className="text-[11px] text-slate-400">
            Passo a passo metodológico para evitar suposições arbitrárias
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {/* Passo 1 */}
          <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-900/40 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300 text-[11px]">1. CLARIFICAR</span>
              <HelpCircle className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Revise as <strong>perguntas em rascunho</strong> abaixo e envie ao cliente para esclarecer prazos e regras essenciais.
            </p>
          </div>

          {/* Passo 2 */}
          <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-900/40 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-300 text-[11px]">2. VALIDAR PROPOSTAS</span>
              <FileSearch className="h-3.5 w-3.5 text-blue-400" />
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              O Copiloto propôs <strong>requisitos iniciais</strong> com base no pedido. Revise e aprove ou descarte formalmente cada um.
            </p>
          </div>

          {/* Passo 3 */}
          <div className="p-3 rounded-lg bg-purple-950/20 border border-purple-900/40 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-300 text-[11px]">3. ANEXAR DADOS</span>
              <Database className="h-3.5 w-3.5 text-purple-400" />
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Acesse a <strong>Aba 3 (Ativos de Dados)</strong> para carregar o arquivo bruto e responder às descobertas pendentes.
            </p>
          </div>

          {/* Passo 4 */}
          <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-300 text-[11px]">4. AVANÇAR WORKFLOW</span>
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Com o levantamento homologado e sem bloqueios, avance formalmente o estado da demanda no cabeçalho.
            </p>
          </div>
        </div>
      </div>

      {/* Dossiê Contextual da Entrada Inteligente (Progressive Disclosure) */}
      {snapshot && (
        <div className="border border-slate-800 rounded-lg bg-slate-950/50 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowDossie(!showDossie)}
            data-testid="btn-toggle-dossie-intake"
            className="w-full flex items-center justify-between p-3 text-xs text-slate-300 hover:text-white hover:bg-slate-900/60 transition-colors select-none"
          >
            <span className="flex items-center gap-2 font-medium">
              <Info className="h-4 w-4 text-indigo-400" />
              <span>Dossiê Contextual da Entrada Inteligente (Fatos, Descobertas e Hipóteses)</span>
            </span>
            <span className="flex items-center gap-1.5 text-xs text-indigo-400 font-semibold">
              <span>{showDossie ? 'Ocultar dossiê' : 'Expandir dossiê'}</span>
              {showDossie ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </span>
          </button>

          {showDossie && (
            <div
              className="p-4 border-t border-slate-800 space-y-4 animate-in fade-in duration-200 text-xs text-slate-300"
              data-testid="intake-snapshot-dossie-content"
            >
              {/* Fatos Declarados do Pedido */}
              {snapshot.fatos && (
                <div className="space-y-1.5 rounded-lg bg-slate-900/70 border border-slate-800 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Fatos Declarados Extraídos do Pedido</span>
                    </span>
                    <Badge variant="success" className="text-[10px]">
                      Fato Confirmado
                    </Badge>
                  </div>
                  <ul className="list-disc list-inside space-y-1 pl-1 text-slate-300">
                    {snapshot.fatos.ativosDados && snapshot.fatos.ativosDados.length > 0 && (
                      <li>Ativo(s) citado(s): {snapshot.fatos.ativosDados.join(', ')}</li>
                    )}
                    {snapshot.fatos.prazo && <li>Prazo mencionado: {snapshot.fatos.prazo}</li>}
                    {snapshot.fatos.periodo && <li>Período de referência: {snapshot.fatos.periodo}</li>}
                    {snapshot.fatos.entregaveis && snapshot.fatos.entregaveis.length > 0 && (
                      <li>Entregável(is) explícito(s): {snapshot.fatos.entregaveis.join(', ')}</li>
                    )}
                    {snapshot.fatos.indicadores && snapshot.fatos.indicadores.length > 0 && (
                      <li>Indicador(es) citado(s): {snapshot.fatos.indicadores.join(', ')}</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Verificações Futuras nos Dados (Não perguntar ao cliente) */}
              {snapshot.descobertasDados && (
                <div className="space-y-1.5 rounded-lg bg-slate-900/70 border border-slate-800 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-purple-300 flex items-center gap-1.5">
                      <Database className="h-3.5 w-3.5 text-purple-400" />
                      <span>O que vamos descobrir diretamente nos dados</span>
                    </span>
                    <Badge variant="neutral" className="text-[10px]">
                      Verificação Futura nos Dados
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Itens que dependem do carregamento da base nas Abas 3 e 4 (não devem ser perguntados ao cliente).
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-1 text-slate-300">
                    {snapshot.descobertasDados.dimensoes?.map((dim, idx) => (
                      <li key={idx}>Dimensão/agregação a inspecionar: {dim}</li>
                    ))}
                    {snapshot.descobertasDados.itensFaltantesDados?.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Hipóteses e Sugestões do Copiloto */}
              {snapshot.inferenciasCopiloto && (
                <div className="space-y-1.5 rounded-lg bg-slate-900/70 border border-slate-800 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                      <Lightbulb className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Hipóteses e Sugestões Consultivas do Copiloto</span>
                    </span>
                    <Badge variant="neutral" className="text-[10px]">
                      Inferência / Consultivo
                    </Badge>
                  </div>
                  <div className="space-y-1 text-slate-300">
                    {snapshot.inferenciasCopiloto.dominioNegocio && (
                      <p>Domínio detectado: <strong>{snapshot.inferenciasCopiloto.dominioNegocio}</strong></p>
                    )}
                    {snapshot.inferenciasCopiloto.problemaAparente && (
                      <p>Problema aparente: {snapshot.inferenciasCopiloto.problemaAparente}</p>
                    )}
                    {snapshot.inferenciasCopiloto.indicadoresSugeridos && snapshot.inferenciasCopiloto.indicadoresSugeridos.length > 0 && (
                      <div className="mt-1">
                        <span className="text-[11px] font-semibold text-slate-400">Métricas analíticas adicionais sugeridas:</span>
                        <ul className="list-disc list-inside space-y-0.5 pl-1 mt-0.5 text-slate-300">
                          {snapshot.inferenciasCopiloto.indicadoresSugeridos.map((ind, idx) => (
                            <li key={idx}>
                              <strong>{ind.nome}</strong>: {ind.descricao}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Síntese da Próxima Ação */}
              {snapshot.sinteseProximaAcao && (
                <div className="rounded-lg bg-blue-950/20 border border-blue-900/40 p-3 text-xs space-y-1">
                  <span className="font-semibold text-blue-300">
                    Síntese Operacional Gerada na Entrada Inteligente:
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    {snapshot.sinteseProximaAcao.explicacaoEstado || snapshot.sinteseProximaAcao.proximaAcaoRecomendada}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
