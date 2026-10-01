/**
 * src/core/domain/dashboard-copilot/strategies/medida-sem-representacao.strategy.ts
 *
 * Estratégia 4: Medida DAX sem Representação Visual (Revisão Orientativa).
 *
 * Evidência necessária:
 * - Medida DAX cadastrada que não aparece em nenhum visual;
 * - A medida não está explicitamente documentada ou identificada como auxiliar/técnica.
 *
 * Princípio:
 * Medidas intermediárias são perfeitamente válidas em modelos DAX profissionais (ex: numeradores, denominadores).
 * O Copiloto orienta a revisão ou documentação, jamais classificando como erro.
 */

import {
  ContextoAnaliseDashboardCopilot,
  EstrategiaInsightDashboard,
  InsightDashboardCopilot,
} from "../dashboard-copilot-types";

export class EstrategiaMedidaSemRepresentacaoAnalitica implements EstrategiaInsightDashboard {
  public readonly codigo = "D-COP-MEDIDA-ORFA";

  public executar(contexto: Readonly<ContextoAnaliseDashboardCopilot>): InsightDashboardCopilot[] {
    const insights: InsightDashboardCopilot[] = [];
    const { medidas, visuais } = contexto;

    // Necessita de ao menos um visual para ter base comparativa
    if (visuais.length === 0 || medidas.length === 0) {
      return insights;
    }

    const medidasUtilizadasNosVisuais = new Set(
      visuais.flatMap((v) => v.medidas_utilizadas_ids ?? [])
    );

    for (const medida of medidas) {
      // Ignora medidas já utilizadas em algum visual
      if (medidasUtilizadasNosVisuais.has(medida.id)) {
        continue;
      }

      // Verifica se a medida é deliberadamente auxiliar/intermediária
      const nomeLower = medida.nome.toLowerCase();
      const descLower = (medida.descricao ?? "").toLowerCase();
      const ehDeclaradamenteAuxiliar =
        medida.nome.startsWith("_") ||
        nomeLower.includes("aux") ||
        nomeLower.includes("calc") ||
        nomeLower.includes("base") ||
        descLower.includes("auxiliar") ||
        descLower.includes("intermediár") ||
        descLower.includes("cálculo de apoio") ||
        descLower.includes("suporte");

      if (ehDeclaradamenteAuxiliar) {
        // Deliberadamente não gera insight se a medida é de apoio documentada
        continue;
      }

      insights.push({
        id: `d-cop-medida-sem-visual:${medida.id}`,
        codigo: "D-COP-MEDIDA-ORFA-01",
        categoria: "GOVERNANCA_METRICA",
        natureza: "SUGESTAO",
        prioridade: "PRIORIDADE_4_CLAREZA_SEMANTICA",
        ordemPrioridade: 4,
        titulo: `Revisão de Finalidade da Medida DAX "${medida.nome}"`,
        deteccao: `A medida "${medida.nome}" está cadastrada no modelo, porém não é consumida por nenhum visual registrado nas páginas do relatório.`,
        explicacao:
          "Medidas DAX calculadas podem atuar de duas formas: (1) exibição direta em componentes visuais (cartões, gráficos ou tabelas) ou (2) etapas intermediárias de apoio em fórmulas mais complexas. Se for uma medida de apoio, documentar sua finalidade evita dúvidas em auditorias analíticas.",
        recomendacao:
          `Verifique se "${medida.nome}" deve ser exibida em um visual ou se atua como medida auxiliar. Se for de apoio, registre essa finalidade em sua descrição técnica.`,
        fatoDetectado: `Medida "${medida.nome}" (ID "${medida.id}") não consta em medidas_utilizadas_ids de nenhum dos ${visuais.length} visual(is) cadastrados.`,
        oportunidade:
          "Esclarecer a arquitetura de cálculo do modelo, identificando indicadores que devam ir à tela ou documentando medidas intermediárias de apoio.",
        sugestaoAcao:
          `Vincular a medida a um visual na página correspondente OU atualizar sua descrição esclarecendo que se trata de uma medida de apoio.`,
        proximaAcaoSugerida: {
          tipo: "REVISAR_MEDIDAS_DAX",
          titulo: `Revisar Papel da Medida "${medida.nome}"`,
          descricao: "Decida entre vincular a medida a um visual analítico ou documentá-la como cálculo intermediário.",
          requerIntervencaoHumana: true,
        },
        pedagogico: {
          conceitoChave: "Medidas Finais vs. Medidas Intermediárias em DAX",
          porQueImporta:
            "Dividir fórmulas complexas em medidas menores (medidas de apoio) é uma das melhores práticas no Tabular, pois promove modularidade, reuso e manutenção limpa de código.",
          dicaProfissional:
            "Adote um padrão visual para medidas auxiliares: use o prefixo sublinhado (ex: [_Total Bruto Interno]) ou agrupe-as em pastas de exibição (Display Folders) com o rótulo 'Apoio' ou 'Interno' no Power BI.",
          termoDicionario: "Display Folders e Medidas Modulares",
        },
        entidadesRelacionadas: [
          {
            tipo: "MEDIDA_DAX",
            id: medida.id,
            nome: medida.nome,
          },
        ],
      });
    }

    return insights;
  }
}
