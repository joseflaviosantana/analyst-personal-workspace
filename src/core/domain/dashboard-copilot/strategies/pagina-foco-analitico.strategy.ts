/**
 * src/core/domain/dashboard-copilot/strategies/pagina-foco-analitico.strategy.ts
 *
 * Estratégia 5: Página de Relatório sem Foco Analítico Claro.
 *
 * Evidência necessária:
 * - Página com objetivo analítico não preenchido ou com descrição excessivamente curta (< 20 caracteres);
 * - Ou objetivo composto por termos genéricos ("página 1", "relatório geral", "teste", "dashboard").
 */

import {
  ContextoAnaliseDashboardCopilot,
  EstrategiaInsightDashboard,
  InsightDashboardCopilot,
} from "../dashboard-copilot-types";

export class EstrategiaPaginaSemFocoAnalitico implements EstrategiaInsightDashboard {
  public readonly codigo = "D-COP-PAG-FOCO";

  public executar(contexto: Readonly<ContextoAnaliseDashboardCopilot>): InsightDashboardCopilot[] {
    const insights: InsightDashboardCopilot[] = [];
    const { paginas } = contexto;

    const termosGenericos = [
      "pagina 1",
      "página 1",
      "teste",
      "geral",
      "relatorio",
      "relatório",
      "dashboard",
      "visao geral",
      "visão geral",
      "painel",
    ];

    for (const pagina of paginas) {
      const objetivo = pagina.objetivo_analitico?.trim() ?? "";
      const objetivoLower = objetivo.toLowerCase();

      const ehMuitoCurto = objetivo.length < 20;
      const ehTermoGenerico = termosGenericos.some((t) => objetivoLower === t || objetivoLower === `${t}.`);

      if (ehMuitoCurto || ehTermoGenerico) {
        insights.push({
          id: `d-cop-pag-foco:${pagina.id}`,
          codigo: "D-COP-PAG-FOCO-01",
          categoria: "ESTRUTURA_PAGINA",
          natureza: "OPORTUNIDADE",
          prioridade: "PRIORIDADE_4_CLAREZA_SEMANTICA",
          ordemPrioridade: 4,
          titulo: `Refinamento do Foco Analítico da Página "${pagina.nome}"`,
          deteccao: `A página "${pagina.nome}" possui objetivo analítico vago ou com descrição resumida (${objetivo.length} caracteres: "${objetivo || "não declarado"}").`,
          explicacao:
            "Cada tela de um dashboard deve ter um propósito de negócio delimitado (ex: 'Monitorar o atingimento de metas diárias de vendas e identificar desvios por regional'). Objetivos genéricos enfraquecem a narrativa visual e dificultam a escolha de gráficos pertinentes.",
          recomendacao:
            `Formalize a pergunta de negócio central ou a decisão operacional suportada pela página "${pagina.nome}".`,
          fatoDetectado: `Página "${pagina.nome}" possui objetivo com ${objetivo.length} caractere(s)${ehTermoGenerico ? " (classificado como termo genérico)" : ""}.`,
          oportunidade:
            "Direcionar a composição dos gráficos para responder a uma meta de gestão concreta, eliminando visuais decorativos ou redundantes.",
          sugestaoAcao:
            `Atualizar o campo objetivo_analitico da página com uma frase descritiva detalhando público e objetivo operacional.`,
          proximaAcaoSugerida: {
            tipo: "ESTRUTURAR_PAGINAS",
            titulo: `Refinar Objetivo da Página "${pagina.nome}"`,
            descricao: "Descreva a decisão de negócio suportada por esta página de relatório.",
            requerIntervencaoHumana: true,
          },
          pedagogico: {
            conceitoChave: "Arquitetura de Telas e Teoria da Carga Cognitiva",
            porQueImporta:
              "Um dashboard onde cada página tem foco claro reduz a sobrecarga cognitiva do tomador de decisão, guiando-o do panorama executivo ao plano de ação imediato.",
            dicaProfissional:
              "Utilize a técnica '1 Tela = 1 Missão': uma página estratégica deve caber sem barra de rolagem (Single-Screen Dashboard) e responder às 3 perguntas cruciais do gestor em menos de 10 segundos.",
            termoDicionario: "Single-Screen Dashboard e Carga Cognitiva",
          },
          entidadesRelacionadas: [
            {
              tipo: "PAGINA_RELATORIO",
              id: pagina.id,
              nome: pagina.nome,
            },
          ],
        });
      }
    }

    return insights;
  }
}
