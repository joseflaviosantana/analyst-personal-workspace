/**
 * src/core/domain/evidence-events/event-types.ts
 *
 * Contratos canônicos de Eventos Analíticos e Políticas de Captura (Subgate 3.5B.1).
 *
 * Princípios Fundamentais:
 * 1. Desacoplamento: Etapas operacionais (Qualidade, Preparação, Modelagem, DAX, etc.)
 *    apenas emitem eventos tipados; desconhecem a persistência e regras do Evidence Core.
 * 2. Determinismo: Políticas de captura e geração de candidatos a evidência são puras,
 *    auditáveis e totalmente desacopladas de LLM.
 * 3. Rigor Epistêmico: Nunca converte inferências ou dados incompletos em fatos inventados.
 */

import { EtapaOrigemEvidencia } from '../enums/etapa-origem-evidencia';
import { TipoEvidenciaAnalitica } from '../enums/tipo-evidencia-analitica';
import { ClassificacaoExposicaoEvidencia } from '../enums/classificacao-exposicao-evidencia';

/**
 * Categorias temáticas extensíveis para proveniência dos eventos
 */
export type CategoriaEventoAnalitico =
  | 'DADOS'
  | 'QUALIDADE'
  | 'PREPARACAO'
  | 'MODELAGEM'
  | 'DAX'
  | 'DASHBOARD'
  | 'VALIDACAO'
  | 'ENTREGA'
  | 'REVISAO'
  | 'SISTEMA';

/**
 * Decisão determinística da Política de Captura do motor
 */
export const PoliticaCaptura = {
  IGNORAR: 'IGNORAR',
  REGISTRAR_AUTOMATICAMENTE: 'REGISTRAR_AUTOMATICAMENTE',
  SOLICITAR_REVISAO_HUMANA: 'SOLICITAR_REVISAO_HUMANA',
} as const;

export type PoliticaCaptura = (typeof PoliticaCaptura)[keyof typeof PoliticaCaptura];

/**
 * Contrato canônico de um Evento Analítico emitido no workspace
 */
export interface EventoAnalitico<TPayload = Record<string, unknown>> {
  id_evento: string; // UUID determinístico/único do evento
  demanda_id: string; // Vínculo obrigatório com a demanda
  projeto_id?: string | null; // Vínculo contextual com o projeto
  etapa_origem: EtapaOrigemEvidencia; // Etapa do workflow analítico
  categoria: CategoriaEventoAnalitico;
  tipo_evento: string; // Código padronizado (ex: 'QUALIDADE_REGRA_EXECUTADA')
  ocorrido_em: string; // Timestamp ISO 8601 em UTC
  executor: string; // Ex: 'SISTEMA_DETERMINISTICO', 'ANALISTA', 'COPILOTO'
  artefato_origem_tipo?: string | null; // Ex: 'REGRA_QUALIDADE', 'ATIVO_DADOS'
  artefato_origem_id?: string | null; // ID do artefato
  payload: TPayload; // Dados estruturados do evento (sem 'any')
  correlation_id?: string | null; // Rastreabilidade transversal de jornadas
  causation_id?: string | null; // ID do evento ou ação causal anterior
  versao_contrato: string; // Ex: '1.0'
}

/**
 * Avaliação da política de captura determinística para um evento
 */
export interface DecisaoPoliticaCaptura {
  politica: PoliticaCaptura;
  motivo: string;
  requer_intervencao_humana: boolean;
}

/**
 * Candidato a evidência produzido pelo Event Engine antes da persistência no Evidence Core
 */
export interface CandidatoEvidencia {
  tipo: TipoEvidenciaAnalitica;
  etapa_origem: EtapaOrigemEvidencia;
  artefato_origem_tipo?: string | null;
  artefato_origem_id?: string | null;
  titulo: string;
  descricao: string;

  // Rigor Epistêmico Obrigatório
  fato_observado: string;
  estado_anterior?: string | null;
  acao_registrada: string;
  estado_posterior?: string | null;
  resultado_mensuravel?: string | null;
  inferencia_recomendacao?: string | null;
  decisao_humana?: string | null;

  classificacao_exposicao?: ClassificacaoExposicaoEvidencia;
  elegibilidade_portfolio?: boolean;
  metadados_adicionais?: Record<string, unknown> | null;
}

/**
 * Resultado completo do processamento de um evento pelo Evidence Event Engine
 */
export interface ResultadoProcessamentoEvento {
  id_evento: string;
  demanda_id: string;
  tipo_evento: string;
  politica_aplicada: PoliticaCaptura;
  status_processamento: 'REGISTRADO' | 'AGUARDANDO_REVISAO' | 'IGNORADO' | 'DUPLICADO' | 'ERRO';
  ja_processado: boolean;
  evidencia_gerada_id?: string | null;
  motivo: string;
  processado_em: string;
  erro_detalhe?: string | null;
}
