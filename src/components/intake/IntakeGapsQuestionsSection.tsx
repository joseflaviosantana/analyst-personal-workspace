'use client';

import React, { useState } from 'react';
import {
  HelpCircle,
  AlertTriangle,
  CheckSquare,
  Info,
  ChevronDown,
  ChevronUp,
  FileText,
  GraduationCap,
  MessageCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  Search,
  Code2,
  AlertCircle,
  Quote,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PerguntaClarificacaoIntake, TipoResolucaoLacuna } from '@/core/domain/intake/intake-types';
import { IntakeContractorScriptModal } from './IntakeContractorScriptModal';

export interface PerguntaDeliberacao extends PerguntaClarificacaoIntake {
  aceita: boolean;
}

interface IntakeGapsQuestionsSectionProps {
  lacunas: string[];
  perguntas: PerguntaDeliberacao[];
  onTogglePergunta: (index: number) => void;
  demandaTitulo?: string;
}

export function IntakeGapsQuestionsSection({
  lacunas,
  perguntas,
  onTogglePergunta,
  demandaTitulo,
}: IntakeGapsQuestionsSectionProps) {
  const [modalRoteiroAberto, setModalRoteiroAberto] = useState(false);
  const [expandidos, setExpandidos] = useState<Record<number, boolean>>({});

  const totalAceitas = perguntas.filter((p) => p.aceita).length;
  const perguntasAceitas = perguntas.filter((p) => p.aceita);

  const toggleExpandir = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandidos((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const getPriorityBadge = (p: PerguntaDeliberacao) => {
    const isArquivoAusente =
      p.id === 'intake_perg_colunas_planilha' || p.id === 'intake_perg_dados_fonte';

    if (isArquivoAusente) {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-rose-950/80 border border-rose-800/60 px-2 py-0.5 text-[10px] font-semibold text-rose-300">
          <AlertTriangle className="h-3 w-3" />
          <span>🔴 Impede avançar agora</span>
        </span>
      );
    }

    const prioridade = p.prioridadeNivel || (p.bloqueanteRecomendado ? 'ESSENCIAL_BLOQUEANTE' : 'IMPORTANTE');
    if (
      prioridade === 'ESSENCIAL_BLOQUEANTE' ||
      prioridade === 'IMPORTANTE' ||
      p.id === 'intake_perg_data_reuniao' ||
      p.id === 'intake_perg_definicao_faturamento' ||
      p.id === 'intake_perg_criterio_ranking_produtos' ||
      p.id === 'intake_perg_excecoes'
    ) {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-amber-950/80 border border-amber-800/60 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
          <Clock className="h-3 w-3" />
          <span>🟡 Resolver antes da entrega</span>
        </span>
      );
    }

    if (prioridade === 'EXPLORATORIA') {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-blue-950/80 border border-blue-800/60 px-2 py-0.5 text-[10px] font-medium text-blue-300">
          <Sparkles className="h-3 w-3" />
          <span>💡 Ajuda a melhorar a solução</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 rounded bg-blue-950/80 border border-blue-800/60 px-2 py-0.5 text-[10px] font-medium text-blue-300">
        <Sparkles className="h-3 w-3" />
        <span>💡 Ajuda a melhorar a solução</span>
      </span>
    );
  };

  const getResolucaoLabel = (tipo?: TipoResolucaoLacuna) => {
    switch (tipo) {
      case 'PERGUNTAR_CONTRATANTE':
        return 'Regra de negócio a esclarecer com o cliente';
      case 'INVESTIGAR_DADOS':
        return 'Inspeção técnica dos dados na planilha';
      case 'DECISAO_TECNICA_ANALISTA':
        return 'Decisão técnica de modelagem do analista';
      default:
        return 'Alinhamento analítico';
    }
  };

  return (
    <Card className="p-5 border-amber-900/50 bg-slate-900/90 shadow-md space-y-4" data-testid="section-lacunas-perguntas">
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold text-slate-300 tracking-wider">
              3. 🟡 PRECISAMOS PERGUNTAR
            </span>
            <Badge variant="warning" data-testid="badge-lacunas">
              O QUE AINDA PRECISAMOS ESCLARECER
            </Badge>
            <span className="text-xs text-slate-400">
              {totalAceitas} de {perguntas.length} selecionada(s)
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Perguntas para alinhamento com quem pediu e regras de negócio essenciais.
            <span className="text-slate-500 ml-1">📘 Nome profissional: clarificação de escopo e regras de negócio.</span>
          </p>
        </div>

        {/* Ação: Preparar Perguntas para o Contratante */}
        <button
          type="button"
          onClick={() => setModalRoteiroAberto(true)}
          disabled={totalAceitas === 0}
          data-testid="btn-preparar-roteiro-contratante"
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm self-start sm:self-auto ${
            totalAceitas > 0
              ? 'bg-blue-600 hover:bg-blue-500 text-white'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Preparar perguntas para o cliente</span>
        </button>
      </div>

      {/* Lacunas de Informação Detectadas (Recolhidas por padrão para reduzir carga cognitiva) */}
      {lacunas.length > 0 && (
        <details className="group rounded-lg bg-slate-950/60 border border-slate-800/80 p-2.5 text-xs text-slate-300">
          <summary className="cursor-pointer font-medium text-slate-400 hover:text-slate-200 flex items-center justify-between select-none">
            <span className="flex items-center gap-2">
              <Info className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
              <span>Ver {lacunas.length} ponto(s) de atenção detectados no pedido</span>
            </span>
            <span className="text-[10px] text-slate-500 group-open:hidden">ver lista</span>
            <span className="text-[10px] text-slate-500 hidden group-open:inline">ocultar</span>
          </summary>
          <ul className="mt-2 space-y-1 text-slate-300 list-disc list-inside pl-2 border-t border-slate-800/80 pt-2">
            {lacunas.map((lacuna, idx) => (
              <li key={idx} className="leading-relaxed">
                {lacuna}
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* Lista de Perguntas (Camada Operacional Concisa + Progressive Disclosure) */}
      <div className="space-y-3">
        {perguntas.length > 0 ? (
          <div className="space-y-2.5" data-testid="list-perguntas-intake">
            {perguntas.map((p, idx) => {
              const isAceita = p.aceita;
              const isExpandido = expandidos[idx] ?? false;

              return (
                <div
                  key={p.id || idx}
                  data-testid={`item-pergunta-${idx}`}
                  className={`rounded-lg border transition-all overflow-hidden ${
                    isAceita
                      ? 'border-slate-700 bg-slate-950/90 shadow-sm'
                      : 'border-slate-800/80 bg-slate-950/40 opacity-60'
                  }`}
                >
                  {/* Visualização Principal Concisa */}
                  <div className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Pergunta */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-semibold leading-snug ${
                          isAceita ? 'text-slate-100' : 'text-slate-400 line-through'
                        }`}
                      >
                        {p.perguntaSugeridaContratante || p.pergunta}
                      </p>
                    </div>

                    {/* Ações e Status Rápido */}
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between sm:justify-end flex-shrink-0">
                      {/* Indicação simples de quando importa */}
                      <span data-testid={`badge-prioridade-pergunta-${idx}`}>
                        {getPriorityBadge(p)}
                      </span>

                      {/* Decisão do Usuário: [Perguntar] [Não perguntar] */}
                      <div className="flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-md border border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            if (!isAceita) onTogglePergunta(idx);
                          }}
                          aria-label="Perguntar"
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                            isAceita
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <CheckSquare className="h-3 w-3" />
                          <span>Perguntar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (isAceita) onTogglePergunta(idx);
                          }}
                          aria-label="Não perguntar"
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-all ${
                            !isAceita
                              ? 'bg-slate-800 text-slate-300 font-semibold shadow-sm'
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          <span>Não perguntar</span>
                        </button>
                      </div>

                      {/* Rótulo de status preservado para acessibilidade e testes */}
                      <span data-testid={`badge-status-pergunta-${idx}`} className="sr-only">
                        {isAceita ? 'Aceita (Rascunho)' : 'Descartada'}
                      </span>

                      {/* Botão Entender Melhor */}
                      <button
                        type="button"
                        onClick={(e) => toggleExpandir(idx, e)}
                        data-testid={`btn-expandir-clarificacao-${idx}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-amber-300 hover:text-amber-200 bg-amber-950/30 hover:bg-amber-950/50 border border-amber-800/40 rounded-md transition-colors"
                        title={isExpandido ? 'Recolher detalhes' : 'Entender melhor o raciocínio profissional'}
                      >
                        <span>{isExpandido ? 'Recolher' : 'Entender melhor'}</span>
                        {isExpandido ? (
                          <ChevronUp className="h-3.5 w-3.5 text-amber-400" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-amber-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Nível de Aprofundamento: Explicação sob demanda (Entender Melhor) */}
                  {isExpandido && (
                    <div
                      className="px-4 pb-4 pt-3 border-t border-slate-800/80 bg-slate-950/80 space-y-3 animate-in fade-in duration-200"
                      data-testid={`clarificacao-assistida-detalhes-${idx}`}
                    >
                      {/* CAMADA 1 — VISÍVEL AO ABRIR "ENTENDER MELHOR" */}
                      {/* 1. Como Pensar Como Analista */}
                      {p.comoPensarComoAnalista && (
                        <div className="rounded-lg bg-indigo-950/30 border border-indigo-800/50 p-3 space-y-1.5">
                          <div className="flex items-center justify-between gap-1.5 text-xs font-semibold text-indigo-300">
                            <span className="flex items-center gap-1.5">
                              <GraduationCap className="h-4 w-4 text-indigo-400" />
                              <span>Como Pensar como Analista</span>
                            </span>
                            <span className="text-[10px] text-indigo-400 font-normal">
                              📘 Raciocínio analítico
                            </span>
                          </div>
                          <p className="text-xs text-indigo-100 leading-relaxed font-medium">
                            {p.comoPensarComoAnalista}
                          </p>
                        </div>
                      )}

                      {/* 2. Como Perguntar ao Cliente (Linguagem Clara) */}
                      <div
                        className="rounded-lg bg-emerald-950/20 border border-emerald-900/40 p-3 space-y-2"
                        data-testid={`clarificacao-contratante-${idx}`}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                          <MessageCircle className="h-4 w-4 text-emerald-400" />
                          <span>Como Perguntar ao Cliente</span>
                        </div>

                        <div className="space-y-2 text-xs text-slate-300">
                          <div>
                            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                              Pergunta sugerida:
                            </span>
                            <p className="text-slate-100 font-medium mt-0.5 bg-slate-900/60 p-2 rounded border border-slate-800">
                              «{p.perguntaSugeridaContratante || p.pergunta}»
                            </p>
                          </div>

                          {(p.seContratanteNaoEntender || p.comoExplicarContratante) && (
                            <div>
                              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                                Se o cliente tiver dúvida de por que você está perguntando:
                              </span>
                              <p className="text-slate-300 mt-0.5 leading-relaxed bg-slate-900/40 p-2 rounded border border-slate-800/60">
                                {p.seContratanteNaoEntender || p.comoExplicarContratante}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 3. Por que essa resposta importa */}
                      {(p.justificativaPrioridade || p.porQuePrecisoPerguntar || p.porQueImportaAnalise) && (
                        <div className="rounded-lg bg-blue-950/20 border border-blue-900/40 p-3 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-300">
                            <HelpCircle className="h-4 w-4 text-blue-400" />
                            <span>Por que essa resposta importa</span>
                          </div>
                          <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/40 p-2 rounded border border-slate-800/60">
                            {p.justificativaPrioridade || p.porQuePrecisoPerguntar || p.porQueImportaAnalise}
                          </p>
                        </div>
                      )}

                      {/* CAMADA 2 — APROFUNDAMENTO PROFISSIONAL (Recolhido por padrão) */}
                      <details
                        className="group rounded-lg bg-slate-900/60 border border-slate-800/80 p-3 text-xs"
                        data-testid={`clarificacao-analista-${idx}`}
                      >
                        <summary className="cursor-pointer font-semibold text-slate-300 hover:text-white flex items-center justify-between select-none">
                          <span className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-amber-400" />
                            <span>Aprofundar análise</span>
                          </span>
                          <span className="text-[11px] text-slate-400 group-open:hidden">ver impactos, riscos e regras</span>
                          <span className="text-[11px] text-slate-400 hidden group-open:inline">recolher</span>
                        </summary>

                        <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-3">
                          {/* Classificação e Metadados Profissionais */}
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] p-2 rounded bg-slate-950/60 border border-slate-800">
                            <span className="text-amber-300 font-medium flex items-center gap-1.5">
                              <GraduationCap className="h-3.5 w-3.5 text-amber-400" />
                              <span>Classificação: {getResolucaoLabel(p.tipoResolucao)}</span>
                            </span>
                            <span className="text-slate-400">
                              📘 Categoria profissional: {p.categoria.toLowerCase().replace(/_/g, ' ')}
                            </span>
                          </div>

                          {/* Grid com Origem, Riscos, Bloqueios e Mudanças */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300">
                            {/* Origem no pedido original */}
                            <div className="space-y-0.5">
                              <span className="text-[11px] font-medium text-slate-400">
                                Origem no pedido original:
                              </span>
                              {p.oQueContratantePediu && p.oQueContratantePediu !== 'Não informado no Pedido Original.' ? (
                                <p className="text-slate-200 bg-slate-950/60 p-2 rounded border border-slate-800/60 italic flex items-center gap-1">
                                  <Quote className="h-3 w-3 text-blue-400 flex-shrink-0" />
                                  <span>«{p.oQueContratantePediu}»</span>
                                </p>
                              ) : (
                                <div className="space-y-1">
                                  <p className="text-slate-400 bg-slate-950/60 p-1.5 rounded border border-slate-800/60 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3 text-slate-500 flex-shrink-0" />
                                    <span>Não informado no Pedido Original.</span>
                                  </p>
                                  {p.lacunaIdentificadaCopiloto && (
                                    <p className="text-amber-300 text-[11px] bg-amber-950/20 p-1 rounded border border-amber-800/30">
                                      {p.lacunaIdentificadaCopiloto}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* O que ainda precisamos saber */}
                            {p.oQueAindaPrecisamosSaber && (
                              <div className="space-y-0.5">
                                <span className="text-[11px] font-medium text-slate-400">
                                  O que ainda precisamos saber:
                                </span>
                                <p className="text-amber-200/90 bg-slate-950/60 p-2 rounded border border-slate-800/60 leading-relaxed">
                                  {p.oQueAindaPrecisamosSaber}
                                </p>
                              </div>
                            )}

                            {p.oQuePodeDarErradoSeNaoPerguntar && (
                              <div className="space-y-0.5">
                                <span className="text-[11px] font-medium text-rose-400">
                                  O que pode dar errado se não esclarecer:
                                </span>
                                <p className="text-slate-300 leading-relaxed bg-slate-950/60 p-2 rounded border border-slate-800/60">
                                  {p.oQuePodeDarErradoSeNaoPerguntar}
                                </p>
                              </div>
                            )}

                            {p.oQueRespostaVaiMudar && (
                              <div className="space-y-0.5">
                                <span className="text-[11px] font-medium text-emerald-400">
                                  O que esta resposta vai mudar no trabalho:
                                </span>
                                <p className="text-slate-300 leading-relaxed bg-slate-950/60 p-2 rounded border border-slate-800/60">
                                  {p.oQueRespostaVaiMudar}
                                </p>
                              </div>
                            )}

                            {p.bloqueioEspecifico && (
                              <div className="space-y-0.5 sm:col-span-2">
                                <span className="text-[11px] font-medium text-amber-400">
                                  O que fica travado até esclarecer:
                                </span>
                                <p className="text-amber-200 text-xs bg-amber-950/20 p-2 rounded border border-amber-800/40">
                                  {p.bloqueioEspecifico}
                                </p>
                              </div>
                            )}

                            {p.oQueRespostaVaiDefinir && (
                              <div className="space-y-0.5 sm:col-span-2">
                                <span className="text-[11px] font-medium text-slate-400">
                                  O que a resposta vai definir:
                                </span>
                                <p className="text-slate-300 leading-relaxed bg-slate-950/60 p-2 rounded border border-slate-800/60">
                                  {p.oQueRespostaVaiDefinir}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </details>

                      {/* CAMADA 3 — DETALHES TÉCNICOS (Nível mais profundo) */}
                      {p.entendaTecnicamente && (
                        <details className="group rounded bg-slate-900/60 border border-slate-800 p-2.5 text-xs">
                          <summary className="cursor-pointer font-semibold text-slate-400 hover:text-slate-200 flex items-center justify-between select-none">
                            <span className="flex items-center gap-1.5">
                              <Code2 className="h-3.5 w-3.5 text-blue-400" />
                              <span>Ver detalhes técnicos (modelagem e fórmulas)</span>
                            </span>
                            <span className="text-[10px] text-slate-500 group-open:hidden">expandir</span>
                            <span className="text-[10px] text-slate-500 hidden group-open:inline">recolher</span>
                          </summary>
                          <div className="mt-2 space-y-1 pl-4 border-l-2 border-blue-500/40">
                            <p className="text-slate-300 leading-relaxed">
                              {p.entendaTecnicamente}
                            </p>
                            <span className="text-[10px] text-slate-500 block">
                              📘 Nome profissional: modelagem dimensional e regras de transformação.
                            </span>
                          </div>
                        </details>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">Nenhuma pergunta adicional gerada.</p>
        )}
      </div>

      {/* Modal de Roteiro para o Contratante */}
      <IntakeContractorScriptModal
        isOpen={modalRoteiroAberto}
        onClose={() => setModalRoteiroAberto(false)}
        perguntasSelecionadas={perguntasAceitas}
        demandaTitulo={demandaTitulo}
      />
    </Card>
  );
}


