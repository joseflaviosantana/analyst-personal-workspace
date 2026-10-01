/**
 * src/core/domain/dashboard-copilot/strategies/pergunta-negocio-cobertura.strategy.ts
 *
 * Estratégia 3: Pergunta de Negócio sem Cobertura Visual.
 *
 * Evidência necessária:
 * - Métricas analíticas no modelo semântico contendo perguntas de negócio formalmente declaradas;
 * - Ausência de medida DAX correspondente OU medida DAX não consumida por nenhum visual.
 */

import {
  ContextoAnaliseDashboardCopilot,
  EstrategiaInsightDashboard,
  InsightDashboardCopilot,
} from "../dashboard-copilot-types";

export class EstrategiaPerguntaNegocioSemCobertura implements EstrategiaInsightDashboard {
  public readonly codigo = "D-COP-PERGUNTA";

  public executar(contexto: Readonly<ContextoAnaliseDashboardCopilot>): InsightDashboardCopilot[] {
    const insights: InsightDashboardCopilot[] = [];
    const { modeloAnalitico, medidas, visuais } = contexto;

    if (!modeloAnalitico?.metricas || modeloAnalitico.metricas.length === 0) {
      return insights;
    }

    const medidasPorMetricaId = new Map(
      medidas
        .filter((m) => Boolean(m.metrica_analitica_id))
        .map((m) => [m.metrica_analitica_id!, m])
    );

    const medidasUtilizadasNosVisuais = new Set(
      visuais.flatMap((v) => v.medidas_utilizadas_ids ?? [])
    );

    for (const metrica of modeloAnalitico.metricas) {
      const pergunta = metrica.pergunta_negocio_associada?.trim();
      if (!pergunta || pergunta.length < 5) {
        continue;
      }

      const medidaVinculada = medidasPorMetricaId.get(metrica.id);
      const temMedida = Boolean(medidaVinculada);
      const temVisual = temMedida && medidasUtilizadasNosVisuais.has(medidaVinculada!.id);

      if (!temMedida || !temVisual) {
        const motivoFalta = !temMedida
          ? "não possui medida DAX cadastrada no dashboard"
          : `possui a medida "${medidaVinculada!.nome}", mas ela não foi vinculada a nenhum visual das páginas`;

        insights.push({
          id: `d-cop-pergunta-sem-cobertura:${metrica.id}`,
          codigo: "D-COP-PERGUNTA-01",
          categoria: "COBERTURA_NEGOCIO",
          natureza: "ORIENTACAO",
          prioridade: "PRIORIDADE_1_PERGUNTA_SEM_COBERTURA",
          ordemPrioridade: 1,
          titulo: `Pergunta de Negócio Sem Resposta Visual: "${pergunta}"`,
          deteccao: `A pergunta de negócio "${pergunta}" (atribuída à métrica "${metrica.nome}") ${motivoFalta}.`,
          explicacao:
            "A finalidade primordial de um dashboard de BI é responder a perguntas estratégicas e operacionais acordadas com os stakeholders. Lacunas na linhagem Métrica → DAX → Visual geram relatórios que não atendem ao escopo da demanda.",
          recomendacao:
            !temMedida
              ? `Implemente uma medida DAX para a métrica "${metrica.nome}" e posicione-a em um componente visual adequado.`
              : `Associe a medida "${medidaVinculada!.nome}" a um cartão, gráfico ou tabela para responder visualmente à pergunta.`,
          fatoDetectado: `Métrica "${metrica.nome}" possui pergunta "${pergunta}", porém o encadeamento Métrica → DAX → Visual está incompleto (${!temMedida ? "medida ausente" : "visual ausente"}).`,
          oportunidade:
            `Garantir que a entrega final responda formalmente à dúvida de negócio estipulada no início da demanda.`,
          sugestaoAcao:
            !temMedida
              ? `Cadastrar medida DAX com metrica_analitica_id = "${metrica.id}" e conectá-la a uma página.`
              : `Adicionar "${medidaVinculada!.nome}" ao catálogo de campos de um visual do dashboard.`,
          proximaAcaoSugerida: {
            tipo: "COBRIR_PERGUNTA_NEGOCIO",
            titulo: `Dar Cobertura à Pergunta "${pergunta.substring(0, 40)}..."`,
            descricao: !temMedida ? "Cadastrar medida DAX correspondente." : "Vincular a medida a um visual na página.",
            requerIntervencaoHumana: true,
          },
          pedagogico: {
            conceitoChave: "Design Orientado a Perguntas de Negócio (Question-Driven BI)",
            porQueImporta:
              "Um dashboard excelente não se mede pelo número de gráficos bonitos, mas pela clareza com que responde às decisões de negócio necessárias.",
            dicaProfissional:
              "Estruture os títulos dos visuais ou dos subtítulos como respostas diretas às perguntas acordadas (ex: 'Qual a receita acumulada?' -> 'Faturamento Total Realizado no Mês').",
            termoDicionario: "Question-Driven BI e Rastreabilidade Analítica",
          },
          entidadesRelacionadas: [
            {
              tipo: "METRICA_ANALITICA",
              id: metrica.id,
              nome: metrica.nome,
            },
            ...(medidaVinculada
              ? [
                  {
                    tipo: "MEDIDA_DAX" as const,
                    id: medidaVinculada.id,
                    nome: medidaVinculada.nome,
                  },
                ]
              : []),
          ],
        });
      }
    }

    return insights;
  }
}
