/**
 * src/core/domain/dashboard-copilot/strategies/drill-through-tooltip.strategy.ts
 *
 * Estratégia 7: Oportunidade de Drill-Through e Tooltip Personalizada.
 *
 * Evidência necessária:
 * - Existência de múltiplas páginas com papéis complementares (ex: uma página executiva/geral e outra de detalhamento/analítica);
 * - Ou modelo analítico contendo entidades com atributos em hierarquia clara (ex: Categoria e Subcategoria, Linha e Produto);
 * - Ausência de mecanismos de navegação em profundidade registrados.
 */

import {
  ContextoAnaliseDashboardCopilot,
  EstrategiaInsightDashboard,
  InsightDashboardCopilot,
} from "../dashboard-copilot-types";

export class EstrategiaDrillThroughTooltip implements EstrategiaInsightDashboard {
  public readonly codigo = "D-COP-DRILL";

  public executar(contexto: Readonly<ContextoAnaliseDashboardCopilot>): InsightDashboardCopilot[] {
    const insights: InsightDashboardCopilot[] = [];
    const { paginas, modeloAnalitico } = contexto;

    // Necessita de pelo menos 2 páginas para sugerir drill-through entre páginas
    if (paginas.length < 2) {
      return insights;
    }

    // Procura evidência de página com objetivo de detalhamento
    const paginaDetalhamento = paginas.find((p) => {
      const nomeLower = p.nome.toLowerCase();
      const objLower = (p.objetivo_analitico ?? "").toLowerCase();
      return (
        nomeLower.includes("detalh") ||
        nomeLower.includes("analit") ||
        nomeLower.includes("operac") ||
        nomeLower.includes("extrato") ||
        objLower.includes("detalh") ||
        objLower.includes("específic")
      );
    });

    const paginaVisaoGeral = paginas.find((p) => {
      const nomeLower = p.nome.toLowerCase();
      return (
        nomeLower.includes("executiv") ||
        nomeLower.includes("visao geral") ||
        nomeLower.includes("visão geral") ||
        nomeLower.includes("geral") ||
        nomeLower.includes("resumo")
      );
    });

    // Se temos tanto uma página macro quanto uma página de detalhamento, temos evidência concreta
    if (paginaDetalhamento && paginaVisaoGeral) {
      insights.push({
        id: `d-cop-drill-opp:${paginaDetalhamento.id}`,
        codigo: "D-COP-DRILL-01",
        categoria: "DRILL_THROUGH_TOOLTIP",
        natureza: "SUGESTAO",
        prioridade: "PRIORIDADE_5_EXPERIENCIA",
        ordemPrioridade: 5,
        titulo: `Oportunidade de Navegação por Drill-Through para "${paginaDetalhamento.nome}"`,
        deteccao: `O relatório possui uma página consolidada ("${paginaVisaoGeral.nome}") e uma página de aprofundamento ("${paginaDetalhamento.nome}").`,
        explicacao:
          "O recurso de Drill-Through (obtenção de detalhes) no Power BI permite que o usuário clique com o botão direito sobre um item na tela principal e seja transportado para a tela de detalhamento já filtrada por aquele contexto específico.",
        recomendacao:
          `Avalie configurar a página "${paginaDetalhamento.nome}" como destino de Drill-Through para as principais entidades analíticas da página "${paginaVisaoGeral.nome}".`,
        fatoDetectado: `Identificada estrutura de telas complementares: "${paginaVisaoGeral.nome}" (macro) e "${paginaDetalhamento.nome}" (detalhe).`,
        oportunidade:
          "Eliminar a necessidade de filtros manuais repetitivos, permitindo inspeção fluida e guiada de desvios.",
        sugestaoAcao:
          `Definir os campos de passagem de contexto de filtro na configuração de Drill-Through da página "${paginaDetalhamento.nome}".`,
        proximaAcaoSugerida: {
          tipo: "CONFIGURAR_DRILL_THROUGH",
          titulo: `Avaliar Drill-Through para "${paginaDetalhamento.nome}"`,
          descricao: "Considere vincular as páginas macro e detalhe via passagem de contexto de filtro.",
          requerIntervencaoHumana: true,
        },
        pedagogico: {
          conceitoChave: "Navegação por Drill-Through e Tooltips de Relatório",
          porQueImporta:
            "Manter telas executivas limpas requer que os detalhes fiquem em páginas secundárias, acessíveis sob demanda por Drill-Through ou Report Page Tooltips.",
          dicaProfissional:
            "Adicione um botão 'Voltar' padronizado com ação 'Voltar' (Back action) no canto superior esquerdo da página de detalhamento para que o usuário retorne à visão macro facilmente.",
          termoDicionario: "Drill-Through e Report Page Tooltips",
        },
        entidadesRelacionadas: [
          {
            tipo: "PAGINA_RELATORIO",
            id: paginaVisaoGeral.id,
            nome: paginaVisaoGeral.nome,
          },
          {
            tipo: "PAGINA_RELATORIO",
            id: paginaDetalhamento.id,
            nome: paginaDetalhamento.nome,
          },
        ],
      });
      return insights;
    }

    // Caso alternativo: modelo com hierarquias comprovadas
    if (modeloAnalitico?.entidades) {
      const entidadesComHierarquia = modeloAnalitico.entidades.filter((e) => {
        const nomesAtts = (e.atributos ?? []).map((a) => (a.nome_amigavel || a.nome_original).toLowerCase());
        const temCatSubcat = nomesAtts.some((n) => n.includes("subcat") || n.includes("sub_cat"));
        const temAnoMes = nomesAtts.some((n) => n.includes("ano")) && nomesAtts.some((n) => n.includes("mes"));
        const temPaisEstado = nomesAtts.some((n) => n.includes("estado")) && nomesAtts.some((n) => n.includes("cidade"));
        return temCatSubcat || temAnoMes || temPaisEstado;
      });

      if (entidadesComHierarquia.length > 0) {
        const entRef = entidadesComHierarquia[0];
        insights.push({
          id: `d-cop-drill-hierarquia:${entRef.id}`,
          codigo: "D-COP-DRILL-02",
          categoria: "DRILL_THROUGH_TOOLTIP",
          natureza: "SUGESTAO",
          prioridade: "PRIORIDADE_5_EXPERIENCIA",
          ordemPrioridade: 5,
          titulo: `Oportunidade de Hierarquia e Drill-Down em "${entRef.nome}"`,
          deteccao: `A dimensão "${entRef.nome}" possui atributos em níveis hierárquicos complementares.`,
          explicacao:
            "Agrupar atributos em hierarquias explícitas no modelo tabular permite que o usuário faça drill-down diretamente nos gráficos de barras ou matrizes.",
          recomendacao:
            `Estruture a hierarquia dimensional em "${entRef.nome}" para habilitar botões de drill-down direto nos visuais.`,
          fatoDetectado: `Atributos hierárquicos identificados na entidade analítica "${entRef.nome}".`,
          oportunidade:
            "Exploração multinível no mesmo gráfico (ex: navegar de Categoria para Subcategoria).",
          sugestaoAcao:
            "Criar uma Hierarquia formal no Power BI e adicioná-la ao eixo dos visuais analíticos.",
          proximaAcaoSugerida: {
            tipo: "EXPLORAR_CONCEITO",
            titulo: `Avaliar Hierarquia em "${entRef.nome}"`,
            descricao: "Estruture hierarquias explícitas para permitir drill-down direto nos gráficos.",
            requerIntervencaoHumana: true,
          },
          pedagogico: {
            conceitoChave: "Hierarquias Tabulares e Drill-Down Visual",
            porQueImporta:
              "Hierarquias pré-construídas poupam tempo dos analistas e garantem que os níveis de agregação sigam a ordem lógica de negócio.",
            dicaProfissional:
              "Ao colocar uma hierarquia no eixo do gráfico, ative a opção 'Concatenar rótulos = Desativado' para uma visualização em árvore muito mais limpa.",
            termoDicionario: "Hierarquias Tabulares e Drill-Down",
          },
          entidadesRelacionadas: [
            {
              tipo: "ENTIDADE_ANALITICA",
              id: entRef.id,
              nome: entRef.nome,
            },
          ],
        });
      }
    }

    return insights;
  }
}
