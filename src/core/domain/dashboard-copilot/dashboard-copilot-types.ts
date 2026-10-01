/**
 * src/core/domain/dashboard-copilot/dashboard-copilot-types.ts
 *
 * Contratos de domínio do Copiloto Proativo de Dashboard e DAX.
 *
 * Princípios Fundamentais:
 * 1. Orientação Analítica e Pedagógica: Foco em aprendizado, clareza e boas práticas.
 * 2. Totalmente Desacoplado de LLM: Determinístico, puro, auditável e sem chamadas externas.
 * 3. Separação Estrita de Autoridade:
 *    - O Motor D-01 a D-08 é a autoridade exclusiva sobre conformidade e prontidão (bloqueios).
 *    - O Copiloto Proativo NÃO possui autoridade para bloquear, NÃO altera prontidão e NÃO
 *      modifica automaticamente nenhum artefato do workspace.
 * 4. Extensibilidade: Permite acoplamento plugável de novas heurísticas analíticas.
 * 5. Rigor Epistêmico: Distingue explicitamente Fato Detectado, Oportunidade e Sugestão.
 */

import { ModeloPowerBi } from "@/core/domain/entities/modelo-powerbi";
import { MedidaDax } from "@/core/domain/entities/medida-dax";
import { PaginaRelatorio } from "@/core/domain/entities/pagina-relatorio";
import { VisualDashboard } from "@/core/domain/entities/visual-dashboard";
import { ModeloAnaliticoCompleto } from "@/core/domain/entities/modelo-analitico";
import { ResultadoProntidaoDashboard } from "@/core/domain/rules/dashboard-rules-evaluator";

/**
 * Categoria temática do insight do Copiloto Proativo
 */
export type CategoriaInsightDashboard =
  | "BOA_PRATICA_ANALITICA"
  | "EXPERIENCIA_VISUAL"
  | "GOVERNANCA_METRICA"
  | "ESTRUTURA_PAGINA"
  | "PRONTIDAO_OPERACIONAL"
  | "INTELIGENCIA_TEMPORAL"
  | "CONTEXTO_COMPARATIVO"
  | "COBERTURA_NEGOCIO"
  | "SEGMENTACAO_FILTRO"
  | "DRILL_THROUGH_TOOLTIP"
  | "CONSISTENCIA_SEMANTICA";

/**
 * Nível determinístico de prioridade analítica do insight
 */
export type NivelPrioridadeInsight =
  | "PRIORIDADE_1_PERGUNTA_SEM_COBERTURA"
  | "PRIORIDADE_2_ELEMENTO_FALTANTE"
  | "PRIORIDADE_3_ALTO_VALOR"
  | "PRIORIDADE_4_CLAREZA_SEMANTICA"
  | "PRIORIDADE_5_EXPERIENCIA"
  | "PRIORIDADE_6_REFINAMENTO";

/**
 * Natureza orientativa do insight (NUNCA BLOQUEIO)
 */
export type NaturezaInsightDashboard =
  | "ORIENTACAO"
  | "OPORTUNIDADE"
  | "SUGESTAO";

/**
 * Tipo de ação recomendada sugerida ao usuário (sempre com intervenção humana)
 */
export type TipoAcaoCopilotDashboard =
  | "ESTRUTURAR_PAGINAS"
  | "ENRIQUECER_VISUAIS"
  | "REVISAR_MEDIDAS_DAX"
  | "VINCULAR_LINHAGEM"
  | "EXPLORAR_CONCEITO"
  | "AVALIAR_PRONTIDAO"
  | "CRIAR_MEDIDA_TEMPORAL"
  | "ADICIONAR_COMPARATIVO_KPI"
  | "COBRIR_PERGUNTA_NEGOCIO"
  | "CONFIGURAR_DRILL_THROUGH"
  | "CONFIGURAR_SEGMENTADOR"
  | "PADRONIZAR_NOMENCLATURA"
  | "DOCUMENTAR_DESCRICAO"
  | "NENHUMA";

/**
 * Tipo da entidade relacionada ao insight
 */
export type TipoEntidadeRelacionadaCopilot =
  | "MODELO_POWERBI"
  | "MEDIDA_DAX"
  | "PAGINA_RELATORIO"
  | "VISUAL_DASHBOARD"
  | "METRICA_ANALITICA"
  | "ENTIDADE_ANALITICA"
  | "ATRIBUTO_ANALITICO";

/**
 * Referência a entidade relacionada para rastreabilidade
 */
export interface EntidadeRelacionadaCopilot {
  tipo: TipoEntidadeRelacionadaCopilot;
  id: string;
  nome?: string;
}

/**
 * Próxima ação sugerida ao usuário
 */
export interface ProximaAcaoSugeridaCopilot {
  tipo: TipoAcaoCopilotDashboard;
  titulo: string;
  descricao: string;
  requerIntervencaoHumana: true; // Garantia explícita: copilot nunca age sozinho
}

/**
 * Conteúdo pedagógico "Aprenda enquanto trabalha"
 */
export interface OrientacaoPedagogicaCopilot {
  conceitoChave: string;
  porQueImporta: string;
  dicaProfissional: string;
  termoDicionario?: string;
}

/**
 * Estrutura para suporte futuro a feedback humano sem dependência externa
 */
export interface FeedbackHumanoInsight {
  utilidade?: "MUITO_UTIL" | "UTIL" | "NEUTRO" | "POUCO_UTIL";
  relevante?: boolean;
  comentario?: string;
  ignorado?: boolean;
  registradoEm?: string;
}

/**
 * Contrato de um insight estruturado gerado pelo Copiloto Proativo de Dashboard
 */
export interface InsightDashboardCopilot {
  id: string; // Identificador determinístico estável
  codigo: string; // Código padronizado (ex: 'D-COP-TIME-01')
  categoria: CategoriaInsightDashboard;
  natureza: NaturezaInsightDashboard; // 'ORIENTACAO' | 'OPORTUNIDADE' | 'SUGESTAO'
  prioridade: NivelPrioridadeInsight;
  ordemPrioridade: number; // 1 a 6 para ordenação determinística
  titulo: string;
  deteccao: string; // Fato observado factual nos dados
  explicacao: string; // Contextualização do porquê o tema é relevante
  recomendacao: string; // Recomendação prática
  // Rigor Epistêmico explícito:
  fatoDetectado: string;
  oportunidade: string;
  sugestaoAcao: string;
  proximaAcaoSugerida?: ProximaAcaoSugeridaCopilot;
  pedagogico: OrientacaoPedagogicaCopilot;
  entidadesRelacionadas: EntidadeRelacionadaCopilot[];
  feedbackHumano?: FeedbackHumanoInsight;
}

/**
 * Contexto de entrada analisado pelo Copiloto de Dashboard.
 * Estrutura imutável contendo os dados analíticos vigentes.
 */
export interface ContextoAnaliseDashboardCopilot {
  demandaId?: string;
  estadoDemanda?: string;
  modeloPowerBi: ModeloPowerBi | null;
  medidas: MedidaDax[];
  paginas: PaginaRelatorio[];
  visuais: VisualDashboard[];
  modeloAnalitico?: ModeloAnaliticoCompleto | null;
  resultadoConformidadeDax?: ResultadoProntidaoDashboard | null; // Referência somente-leitura ao motor D-01..D-08
  perguntasNegocio?: string[];
  requisitosNegocio?: string[];
}

/**
 * Resultado completo da avaliação do Copiloto Proativo de Dashboard
 */
export interface ResultadoCopilotoDashboard {
  gerado_em: string;
  total_insights: number;
  insight_principal?: InsightDashboardCopilot;
  proxima_acao_principal?: ProximaAcaoSugeridaCopilot;
  orientacoes_secundarias: InsightDashboardCopilot[];
  insights: InsightDashboardCopilot[];
  resumo_contexto: {
    possui_modelo: boolean;
    total_medidas: number;
    total_paginas: number;
    total_visuais: number;
    isento_powerbi: boolean;
  };
}

/**
 * Interface para estratégias plugáveis de insights analíticos do Copiloto
 */
export interface EstrategiaInsightDashboard {
  codigo: string;
  executar(contexto: Readonly<ContextoAnaliseDashboardCopilot>): InsightDashboardCopilot[];
}
