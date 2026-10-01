/**
 * src/core/domain/dashboard-copilot/strategies/kpi-contexto-comparativo.strategy.ts
 *
 * Estratégia 2: KPI sem Contexto Comparativo.
 *
 * Evidência necessária:
 * - Presença de componente visual do tipo CARTAO_KPI;
 * - O visual exibe uma medida com valor absoluto (moeda, soma, contagem);
 * - Ausência de medida de comparação (meta, variação %, período homólogo) associada ao visual.
 */

import {
  ContextoAnaliseDashboardCopilot,
  EstrategiaInsightDashboard,
  InsightDashboardCopilot,
} from "../dashboard-copilot-types";
import { TipoVisualDashboard } from "@/core/domain/enums/tipo-visual-dashboard";

export class EstrategiaKpiContextoComparativo implements EstrategiaInsightDashboard {
  public readonly codigo = "D-COP-KPI-COMP";

  public executar(contexto: Readonly<ContextoAnaliseDashboardCopilot>): InsightDashboardCopilot[] {
    const insights: InsightDashboardCopilot[] = [];
    const { visuais, medidas } = contexto;

    const cartoesKpi = visuais.filter((v) => v.tipo_visual === TipoVisualDashboard.CARTAO_KPI);
    if (cartoesKpi.length === 0) {
      return insights;
    }

    const medidasMap = new Map(medidas.map((m) => [m.id, m]));

    for (const visual of cartoesKpi) {
      const medidasDoVisual = (visual.medidas_utilizadas_ids ?? [])
        .map((id) => medidasMap.get(id))
        .filter((m): m is NonNullable<typeof m> => Boolean(m));

      if (medidasDoVisual.length === 0) {
        continue;
      }

      // Verifica se alguma das medidas utilizadas já é comparativa, taxa, meta ou percentual
      const temMedidaComparativa = medidasDoVisual.some((m) => {
        const nomeUpper = m.nome.toUpperCase();
        const formato = (m.formato_string ?? "").toUpperCase();
        return (
          nomeUpper.includes("%") ||
          nomeUpper.includes("TAXA") ||
          nomeUpper.includes("MARGEM") ||
          nomeUpper.includes("META") ||
          nomeUpper.includes("TARGET") ||
          nomeUpper.includes("VARIA") ||
          nomeUpper.includes("DESVIO") ||
          nomeUpper.includes("ATINGIMENTO") ||
          nomeUpper.includes("YOY") ||
          nomeUpper.includes("MOM") ||
          formato.includes("%")
        );
      });

      if (!temMedidaComparativa) {
        const medidaPrincipal = medidasDoVisual[0];
        insights.push({
          id: `d-cop-kpi-comp:${visual.id}`,
          codigo: "D-COP-KPI-COMP-01",
          categoria: "CONTEXTO_COMPARATIVO",
          natureza: "OPORTUNIDADE",
          prioridade: "PRIORIDADE_3_ALTO_VALOR",
          ordemPrioridade: 3,
          titulo: `Oportunidade de Contexto Comparativo no Cartão "${visual.titulo}"`,
          deteccao: `O cartão de KPI "${visual.titulo}" exibe o valor absoluto da medida "${medidaPrincipal.nome}" sem referência comparativa explícita (meta, período anterior ou percentual de atingimento).`,
          explicacao:
            "Um número exibido isoladamente responde 'quanto é?', mas não esclarece 'esse resultado é bom ou ruim?'. A inclusão de uma referência contextual (meta estipulada ou período homólogo) eleva o valor analítico do cartão.",
          recomendacao:
            `Avalie a adição de uma linha de contexto comparativo ao cartão "${visual.titulo}", como a variação em relação à meta ou ao período homólogo anterior.`,
          fatoDetectado: `Visual "${visual.titulo}" do tipo CARTAO_KPI utiliza exclusivamente a medida de valor absoluto "${medidaPrincipal.nome}".`,
          oportunidade:
            "Apresentar simultaneamente o valor realizado e a taxa de atingimento da meta ou variação percentual para rápida tomada de decisão.",
          sugestaoAcao:
            `Criar medida de variação percentual ou indicador de atingimento e vinculá-la ao visual ou a um cartão secundário de apoio.`,
          proximaAcaoSugerida: {
            tipo: "ADICIONAR_COMPARATIVO_KPI",
            titulo: `Avaliar Contexto de Meta ou Variação para "${medidaPrincipal.nome}"`,
            descricao: "Verifique se a demanda possui meta estipulada para enriquecer a interpretação deste KPI.",
            requerIntervencaoHumana: true,
          },
          pedagogico: {
            conceitoChave: "Densidade de Informação em Cartões de KPI",
            porQueImporta:
              "Executivos e tomadores de decisão demandam contexto imediato: atingimento de meta (Realizado vs Meta) e direção da tendência (Crescimento vs Queda).",
            dicaProfissional:
              "No Power BI moderno, utilize o Novo Visual de Cartão (New Card Visual) com 'Reference Labels' (rótulos de referência) para exibir a meta e o percentual de atingimento abaixo do número principal.",
            termoDicionario: "Reference Labels e Cartões de KPI Contextualizados",
          },
          entidadesRelacionadas: [
            {
              tipo: "VISUAL_DASHBOARD",
              id: visual.id,
              nome: visual.titulo,
            },
            {
              tipo: "MEDIDA_DAX",
              id: medidaPrincipal.id,
              nome: medidaPrincipal.nome,
            },
          ],
        });
      }
    }

    return insights;
  }
}
