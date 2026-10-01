/**
 * src/core/domain/dashboard-copilot/strategies/filtros-segmentacoes.strategy.ts
 *
 * Estratégia 6: Oportunidade de Filtros e Segmentações (Slicers).
 *
 * Evidência necessária:
 * - Dimensões categóricas adequadas no modelo (ex: Canal, Categoria, Região, Filial, Status);
 * - Páginas com múltiplos visuais cadastrados;
 * - Ausência de componentes de segmentação de dados (SEGMENTADOR_DADOS) registrados.
 */

import {
  ContextoAnaliseDashboardCopilot,
  EstrategiaInsightDashboard,
  InsightDashboardCopilot,
} from "../dashboard-copilot-types";
import { PosicaoLayoutVisual } from "@/core/domain/enums/posicao-layout-visual";
import { TipoEntidadeAnalitica } from "@/core/domain/enums/tipo-entidade-analitica";
import { PapelEntidadeAnalitica } from "@/core/domain/enums/papel-entidade-analitica";

export class EstrategiaFiltrosSegmentacoes implements EstrategiaInsightDashboard {
  public readonly codigo = "D-COP-SLICER";

  public executar(contexto: Readonly<ContextoAnaliseDashboardCopilot>): InsightDashboardCopilot[] {
    const insights: InsightDashboardCopilot[] = [];
    const { modeloAnalitico, visuais, paginas } = contexto;

    if (!modeloAnalitico?.entidades || visuais.length < 2 || paginas.length === 0) {
      return insights;
    }

    // Verifica se já existem visuais de segmentador no dashboard
    const jaPossuiSegmentadores = visuais.some(
      (v) =>
        v.posicao_layout === PosicaoLayoutVisual.LATERAL_FILTROS ||
        (v.titulo && (v.titulo.toLowerCase().includes("filtro") || v.titulo.toLowerCase().includes("slicer") || v.titulo.toLowerCase().includes("segmentad"))) ||
        (v.justificativa_dataviz && (v.justificativa_dataviz.toLowerCase().includes("slicer") || v.justificativa_dataviz.toLowerCase().includes("segmentad")))
    );
    if (jaPossuiSegmentadores) {
      return insights;
    }

    // Procura dimensões analíticas com atributos categóricos relevantes
    const dimensoesApropriadas = modeloAnalitico.entidades.filter((e) => {
      const nomeLower = e.nome.toLowerCase();
      const ehDimensao =
        e.tipo === TipoEntidadeAnalitica.DIMENSAO ||
        e.papel === PapelEntidadeAnalitica.DIMENSAO_PADRAO ||
        e.papel === PapelEntidadeAnalitica.DIMENSAO_CONFORMADA ||
        nomeLower.includes("dim_") ||
        nomeLower.includes("dimensao");

      // Dimensões com alto valor para filtro interativo
      const temNomeRelevante =
        nomeLower.includes("canal") ||
        nomeLower.includes("categoria") ||
        nomeLower.includes("produto") ||
        nomeLower.includes("filial") ||
        nomeLower.includes("regiao") ||
        nomeLower.includes("regional") ||
        nomeLower.includes("segmento") ||
        nomeLower.includes("status") ||
        nomeLower.includes("cliente");

      return ehDimensao && temNomeRelevante;
    });

    if (dimensoesApropriadas.length === 0) {
      return insights;
    }

    const dimensaoSugerida = dimensoesApropriadas[0];
    const paginaAlvo = paginas[0];

    insights.push({
      id: `d-cop-slicer-opp:${dimensaoSugerida.id}`,
      codigo: "D-COP-SLICER-01",
      categoria: "SEGMENTACAO_FILTRO",
      natureza: "OPORTUNIDADE",
      prioridade: "PRIORIDADE_5_EXPERIENCIA",
      ordemPrioridade: 5,
      titulo: `Oportunidade de Segmentação Interativa por "${dimensaoSugerida.nome}"`,
      deteccao: `O modelo dispõe da dimensão "${dimensaoSugerida.nome}", mas a página "${paginaAlvo.nome}" não possui componentes de segmentação de dados (slicers).`,
      explicacao:
        "Segmentadores de dados permitem ao usuário focar em subconjuntos específicos (como uma regional, canal ou categoria) sem necessitar de páginas duplicadas.",
      recomendacao:
        `Avalie a adição de um visual do tipo SEGMENTADOR_DADOS com o atributo principal da dimensão "${dimensaoSugerida.nome}" na barra superior ou lateral da página.`,
      fatoDetectado: `Dimensão "${dimensaoSugerida.nome}" disponível no modelo; total de visuais do tipo SEGMENTADOR_DADOS no relatório é 0.`,
      oportunidade:
        "Habilitar filtragem dinâmica e autoatendimento analítico para os tomadores de decisão.",
      sugestaoAcao:
        `Cadastrar visual do tipo SEGMENTADOR_DADOS vinculado à dimensão "${dimensaoSugerida.nome}" na página "${paginaAlvo.nome}".`,
      proximaAcaoSugerida: {
        tipo: "CONFIGURAR_SEGMENTADOR",
        titulo: `Avaliar Segmentador por "${dimensaoSugerida.nome}"`,
        descricao: "Considere adicionar um filtro interativo para enriquecer a experiência de exploração.",
        requerIntervencaoHumana: true,
      },
      pedagogico: {
        conceitoChave: "Segmentação de Dados (Slicers) e Painel de Filtros",
        porQueImporta:
          "Slicers em tela oferecem acesso imediato aos filtros mais frequentes, enquanto filtros avançados ou pontuais podem ser direcionados ao Painel de Filtros (Filter Pane) do Power BI.",
        dicaProfissional:
          "Para dimensões com muitos valores (ex: centenas de clientes ou cidades), utilize segmentadores no modo 'Pesquisa' (Search) ou 'Lista Suspensa' (Dropdown) para economizar espaço em tela.",
        termoDicionario: "Slicers e Filter Pane no Power BI",
      },
      entidadesRelacionadas: [
        {
          tipo: "ENTIDADE_ANALITICA",
          id: dimensaoSugerida.id,
          nome: dimensaoSugerida.nome,
        },
        {
          tipo: "PAGINA_RELATORIO",
          id: paginaAlvo.id,
          nome: paginaAlvo.nome,
        },
      ],
    });

    return insights;
  }
}
