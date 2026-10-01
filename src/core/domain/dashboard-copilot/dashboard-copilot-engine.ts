/**
 * src/core/domain/dashboard-copilot/dashboard-copilot-engine.ts
 *
 * Motor Determinístico do Copiloto Proativo de Dashboard e DAX.
 *
 * Princípios de Engenharia:
 * - Funções puras e sem efeitos colaterais.
 * - Idempotência e determinismo: mesma entrada = mesma saída e ordem estável.
 * - Priorização determinística orientada a valor analítico (sem pontuação arbitrária ou pseudo-IA):
 *     1. Pergunta de negócio sem cobertura (Prioridade 1);
 *     2. Ausência de elemento estrutural necessário (Prioridade 2);
 *     3. Oportunidade analítica de alto valor: Time Intelligence e Contexto Comparativo (Prioridade 3);
 *     4. Clareza e semântica: objetivo de página, medida órfã, nomenclatura técnica (Prioridade 4);
 *     5. Melhoria de experiência: segmentadores, drill-through e tooltips (Prioridade 5);
 *     6. Refinamentos opcionais e documentação (Prioridade 6).
 * - Separação estrita com o Motor D-01 a D-08:
 *     * O Copiloto NÃO emite 'BLOQUEIO'.
 *     * O Copiloto NÃO altera a prontidão do dashboard ('apto_para_validacao').
 *     * O Copiloto NÃO muta as entidades ou objetos recebidos.
 * - Extensibilidade por estratégias plugáveis.
 * - Totalmente livre de dependências de IA externas / LLM (Custo Zero).
 */

import {
  ContextoAnaliseDashboardCopilot,
  EstrategiaInsightDashboard,
  InsightDashboardCopilot,
  ResultadoCopilotoDashboard,
} from "./dashboard-copilot-types";
import {
  EstrategiaBaselineOrientacaoDashboard,
  EstrategiaInteligenciaTemporal,
  EstrategiaKpiContextoComparativo,
  EstrategiaPerguntaNegocioSemCobertura,
  EstrategiaMedidaSemRepresentacaoAnalitica,
  EstrategiaPaginaSemFocoAnalitico,
  EstrategiaFiltrosSegmentacoes,
  EstrategiaDrillThroughTooltip,
  EstrategiaConsistenciaSemantica,
} from "./strategies";
import { TipoFormatoModeloPowerBi } from "@/core/domain/enums/tipo-formato-modelo-powerbi";

export class DashboardCopilotEngine {
  /**
   * Catálogo padrão de estratégias de inteligência analítica do Copiloto (Subgate 3.3B)
   */
  public static readonly estrategiasPadrao: EstrategiaInsightDashboard[] = [
    new EstrategiaBaselineOrientacaoDashboard(),
    new EstrategiaPerguntaNegocioSemCobertura(),
    new EstrategiaInteligenciaTemporal(),
    new EstrategiaKpiContextoComparativo(),
    new EstrategiaMedidaSemRepresentacaoAnalitica(),
    new EstrategiaPaginaSemFocoAnalitico(),
    new EstrategiaFiltrosSegmentacoes(),
    new EstrategiaDrillThroughTooltip(),
    new EstrategiaConsistenciaSemantica(),
  ];

  /**
   * Avalia o contexto de Dashboard/DAX de forma pura e determinística.
   *
   * @param contexto Contexto analítico com dados de Power BI, medidas, páginas e visuais.
   * @param estrategias Customização opcional de estratégias de avaliação (para extensibilidade).
   * @returns Resultado estruturado contendo coleção estável, priorizada e reproduzível de insights.
   */
  public static analisar(
    contexto: Readonly<ContextoAnaliseDashboardCopilot>,
    estrategias: EstrategiaInsightDashboard[] = this.estrategiasPadrao
  ): ResultadoCopilotoDashboard {
    // 1. Tratamento seguro de contexto nulo ou indefinido
    const ctxSeguro: Readonly<ContextoAnaliseDashboardCopilot> = {
      demandaId: contexto?.demandaId,
      estadoDemanda: contexto?.estadoDemanda,
      modeloPowerBi: contexto?.modeloPowerBi ?? null,
      medidas: Array.isArray(contexto?.medidas) ? [...contexto.medidas] : [],
      paginas: Array.isArray(contexto?.paginas) ? [...contexto.paginas] : [],
      visuais: Array.isArray(contexto?.visuais) ? [...contexto.visuais] : [],
      modeloAnalitico: contexto?.modeloAnalitico ?? null,
      resultadoConformidadeDax: contexto?.resultadoConformidadeDax ?? null,
    };

    // 2. Coleta de insights pelas estratégias registradas
    const todosInsights: InsightDashboardCopilot[] = [];
    for (const estrategia of estrategias) {
      const insightsDaEstrategia = estrategia.executar(ctxSeguro);
      todosInsights.push(...insightsDaEstrategia);
    }

    // 3. Mecanismo determinístico de priorização:
    //    1º: ordemPrioridade (1 = mais urgente/alto valor a 6 = refinamento)
    //    2º: categoria (ordem alfabética)
    //    3º: codigo (ordem alfabética)
    //    4º: id estável (ordem alfabética)
    todosInsights.sort((a, b) => {
      if (a.ordemPrioridade !== b.ordemPrioridade) {
        return a.ordemPrioridade - b.ordemPrioridade;
      }
      if (a.categoria !== b.categoria) {
        return a.categoria.localeCompare(b.categoria);
      }
      if (a.codigo !== b.codigo) {
        return a.codigo.localeCompare(b.codigo);
      }
      return a.id.localeCompare(b.id);
    });

    // 4. Identificação da Próxima Ação Principal e Orientações Secundárias
    const insightPrincipal = todosInsights.length > 0 ? todosInsights[0] : undefined;
    const proximaAcaoPrincipal = insightPrincipal?.proximaAcaoSugerida;
    const orientacoesSecundarias = todosInsights.length > 1 ? todosInsights.slice(1) : [];

    // 5. Métricas do resumo de contexto
    const isento =
      ctxSeguro.modeloPowerBi?.tipo_formato === TipoFormatoModeloPowerBi.ISENTO_EXCEL_ONLY;

    return {
      gerado_em: new Date().toISOString(),
      total_insights: todosInsights.length,
      insight_principal: insightPrincipal,
      proxima_acao_principal: proximaAcaoPrincipal,
      orientacoes_secundarias: orientacoesSecundarias,
      insights: todosInsights,
      resumo_contexto: {
        possui_modelo: ctxSeguro.modeloPowerBi !== null,
        total_medidas: ctxSeguro.medidas.length,
        total_paginas: ctxSeguro.paginas.length,
        total_visuais: ctxSeguro.visuais.length,
        isento_powerbi: isento,
      },
    };
  }

  /**
   * Método de instância para compatibilidade com injeção de dependência
   */
  public analisar(
    contexto: Readonly<ContextoAnaliseDashboardCopilot>,
    estrategias?: EstrategiaInsightDashboard[]
  ): ResultadoCopilotoDashboard {
    return DashboardCopilotEngine.analisar(contexto, estrategias);
  }

  /**
   * Alias de conveniência para analisar
   */
  public avaliar(
    contexto: Readonly<ContextoAnaliseDashboardCopilot>,
    estrategias?: EstrategiaInsightDashboard[]
  ): ResultadoCopilotoDashboard {
    return DashboardCopilotEngine.analisar(contexto, estrategias);
  }
}
