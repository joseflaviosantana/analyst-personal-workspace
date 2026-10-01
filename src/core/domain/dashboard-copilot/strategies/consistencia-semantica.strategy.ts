/**
 * src/core/domain/dashboard-copilot/strategies/consistencia-semantica.strategy.ts
 *
 * Estratégia 8: Consistência Semântica e Nomenclatura Profissional.
 *
 * Evidência necessária:
 * - Medidas DAX com nomes puramente técnicos (prefixos como 'tbl_', 'calc_', 'f_', 'tmp_', ou camelCase/snake_case);
 * - Ou medidas DAX sem descrição funcional de negócio registrada.
 */

import {
  ContextoAnaliseDashboardCopilot,
  EstrategiaInsightDashboard,
  InsightDashboardCopilot,
} from "../dashboard-copilot-types";

export class EstrategiaConsistenciaSemantica implements EstrategiaInsightDashboard {
  public readonly codigo = "D-COP-SEMANTICA";

  public executar(contexto: Readonly<ContextoAnaliseDashboardCopilot>): InsightDashboardCopilot[] {
    const insights: InsightDashboardCopilot[] = [];
    const { medidas } = contexto;

    for (const medida of medidas) {
      const nome = medida.nome.trim();
      const nomeLower = nome.toLowerCase();

      // 1. Detecção de nomenclatura puramente técnica
      const temPrefixoTecnico =
        nomeLower.startsWith("tbl_") ||
        nomeLower.startsWith("calc_") ||
        nomeLower.startsWith("f_") ||
        nomeLower.startsWith("dim_") ||
        nomeLower.startsWith("tmp_") ||
        nomeLower.startsWith("m_");

      // Detecção de camelCase (ex: totalVendas, receitaLiquida) sem espaços
      const ehCamelCaseSemEspacos =
        !nome.includes(" ") &&
        !nome.includes("_") &&
        /^[a-z]+[A-Z]/.test(nome);

      // Detecção de snake_case (ex: faturamento_bruto)
      const ehSnakeCase =
        !nome.includes(" ") &&
        nome.includes("_") &&
        !temPrefixoTecnico;

      if (temPrefixoTecnico || ehCamelCaseSemEspacos || ehSnakeCase) {
        insights.push({
          id: `d-cop-semantica-nome:${medida.id}`,
          codigo: "D-COP-SEMANTICA-01",
          categoria: "CONSISTENCIA_SEMANTICA",
          natureza: "SUGESTAO",
          prioridade: "PRIORIDADE_4_CLAREZA_SEMANTICA",
          ordemPrioridade: 4,
          titulo: `Nomenclatura Amigável para a Medida "${medida.nome}"`,
          deteccao: `A medida "${medida.nome}" utiliza padrão de nomenclatura de banco de dados ou código técnico (prefixo/camelCase/snake_case) em vez de linguagem de negócio.`,
          explicacao:
            "No Power BI, os nomes das medidas aparecem diretamente no painel de campos, nos cabeçalhos de gráficos e nas tooltips para os usuários finais. Utilizar termos limpos em linguagem natural melhora a usabilidade e a adoção do relatório.",
          recomendacao:
            `Renomeie a medida para uma designação funcional em linguagem de negócio (ex: 'Total Vendas' em vez de '${medida.nome}').`,
          fatoDetectado: `Medida "${medida.nome}" possui convenção de nomenclatura de desenvolvimento de software em vez de designação de negócio.`,
          oportunidade:
            "Apresentar uma interface limpa e intuitiva para usuários de negócio, sem jargões de desenvolvimento.",
          sugestaoAcao:
            `Ajustar o nome da medida para português claro com espaços e maiúsculas adequadas.`,
          proximaAcaoSugerida: {
            tipo: "PADRONIZAR_NOMENCLATURA",
            titulo: `Padronizar Nome da Medida "${medida.nome}"`,
            descricao: "Adote nome em linguagem natural para facilitar a identificação do indicador pelo usuário final.",
            requerIntervencaoHumana: true,
          },
          pedagogico: {
            conceitoChave: "Nomenclatura Semântica em Modelos Tabulares",
            porQueImporta:
              "Ao contrário de bancos SQL relacionais onde prefixos e snake_case são comuns, o modelo tabular do Power BI é a camada de consumo do usuário final. Nomes de medidas devem ser autoexplicativos.",
            dicaProfissional:
              "Evite abreviações herméticas. Em vez de 'Rec_Liq_Tot', escreva 'Receita Líquida Total'. Se o nome ficar longo, use a Descrição da medida para detalhes adicionais.",
            termoDicionario: "Convenção de Nomenclatura Tabular",
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

      // 2. Detecção de ausência de descrição funcional
      const semDescricao = !medida.descricao || medida.descricao.trim().length === 0;
      if (semDescricao) {
        insights.push({
          id: `d-cop-semantica-desc:${medida.id}`,
          codigo: "D-COP-SEMANTICA-02",
          categoria: "CONSISTENCIA_SEMANTICA",
          natureza: "SUGESTAO",
          prioridade: "PRIORIDADE_6_REFINAMENTO",
          ordemPrioridade: 6,
          titulo: `Documentação do Significado de Negócio em "${medida.nome}"`,
          deteccao: `A medida "${medida.nome}" não possui descrição funcional documentada no modelo.`,
          explicacao:
            "A descrição da medida aparece como dica de ferramenta (tooltip) quando o usuário passa o mouse sobre o campo no Power BI, esclarecendo a regra de cálculo e a fonte do número.",
          recomendacao:
            `Preencha o campo de descrição explicando brevemente a fórmula e o significado de negócio do indicador "${medida.nome}".`,
          fatoDetectado: `Campo 'descricao' da medida "${medida.nome}" está vazio ou não preenchido.`,
          oportunidade:
            "Fornecer documentação viva e integrada diretamente no painel de campos para todos os analistas e gestores.",
          sugestaoAcao:
            `Adicionar breve descrição formal (ex: 'Soma total do faturamento bruto considerando vendas faturadas').`,
          proximaAcaoSugerida: {
            tipo: "DOCUMENTAR_DESCRICAO",
            titulo: `Documentar Medida "${medida.nome}"`,
            descricao: "Descreva a regra de negócio da medida para orientar os usuários do relatório.",
            requerIntervencaoHumana: true,
          },
          pedagogico: {
            conceitoChave: "Documentação Viva em Modelos Semânticos",
            porQueImporta:
              "Em equipes analíticas, medidas não documentadas geram interpretações conflitantes de KPIs e dependência excessiva de quem escreveu a fórmula original.",
            dicaProfissional:
              "Documente em 1 ou 2 frases: (1) o que a medida calcula e (2) eventuais filtros aplicados (ex: 'Exclui devoluções e cancelamentos').",
            termoDicionario: "Documentação Viva de Medidas",
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
    }

    return insights;
  }
}
