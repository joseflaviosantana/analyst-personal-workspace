/**
 * src/core/domain/dashboard-copilot/strategies/inteligencia-temporal.strategy.ts
 *
 * Estratégia 1: Oportunidade de Time Intelligence em DAX.
 *
 * Evidência necessária:
 * - Dimensão calendário ou atributos de data disponíveis no modelo analítico;
 * - Presença de métricas aditivas/numéricas compatíveis;
 * - Ausência de medidas de cálculo temporal já implementadas no catálogo.
 */

import {
  ContextoAnaliseDashboardCopilot,
  EstrategiaInsightDashboard,
  InsightDashboardCopilot,
} from "../dashboard-copilot-types";
import { TipoFormatoModeloPowerBi } from "@/core/domain/enums/tipo-formato-modelo-powerbi";
import { PapelEntidadeAnalitica } from "@/core/domain/enums/papel-entidade-analitica";
import { TipoDadoAnalitico } from "@/core/domain/enums/tipo-dado-analitico";

export class EstrategiaInteligenciaTemporal implements EstrategiaInsightDashboard {
  public readonly codigo = "D-COP-TIME";

  public executar(contexto: Readonly<ContextoAnaliseDashboardCopilot>): InsightDashboardCopilot[] {
    const insights: InsightDashboardCopilot[] = [];

    // Ignora modelos isentos ou sem artefato Power BI
    if (!contexto.modeloPowerBi || contexto.modeloPowerBi.tipo_formato === TipoFormatoModeloPowerBi.ISENTO_EXCEL_ONLY) {
      return insights;
    }

    const { modeloAnalitico, medidas } = contexto;
    if (!modeloAnalitico) {
      return insights;
    }

    // 1. Evidência de dimensão temporal / calendário
    const entidades = modeloAnalitico.entidades ?? [];
    const dimensaoCalendario = entidades.find((e) => {
      const nomeLower = ((e as any).nome_logico ?? (e as any).nome ?? "").toLowerCase();
      return (
        e.papel === PapelEntidadeAnalitica.DIMENSAO_CALENDARIO ||
        nomeLower.includes("calendario") ||
        nomeLower.includes("calendar") ||
        nomeLower.includes("tempo") ||
        nomeLower.includes("data")
      );
    });

    // Se não há entidade formal de calendário, verificar se há atributos do tipo DATA
    const temAtributosData = entidades.some((e) =>
      (e.atributos ?? []).some((a) => {
        const nomeLower = (a.nome_amigavel || a.nome_original).toLowerCase();
        return (
          a.tipo_dado === TipoDadoAnalitico.DATA ||
          a.tipo_dado === TipoDadoAnalitico.DATA_HORA ||
          nomeLower.includes("data") ||
          nomeLower.includes("ano") ||
          nomeLower.includes("mes")
        );
      })
    );

    const temEvidenciaTemporal = Boolean(dimensaoCalendario || temAtributosData);
    if (!temEvidenciaTemporal) {
      // Deliberadamente não gera insight se não há suporte temporal evidente
      return insights;
    }

    // 2. Evidência de métricas compatíveis com inteligência temporal (faturamento, quantidade, volume, etc.)
    const metricas = modeloAnalitico.metricas ?? [];
    const metricasCompativeis = metricas.filter((m) => {
      const nomeLower = m.nome.toLowerCase();
      return (
        m.tipo_aditividade === "TOTALMENTE_ADITIVA" ||
        m.tipo_agregacao === "SOMA" ||
        nomeLower.includes("venda") ||
        nomeLower.includes("faturamento") ||
        nomeLower.includes("receita") ||
        nomeLower.includes("volume") ||
        nomeLower.includes("quantidade") ||
        nomeLower.includes("pedido")
      );
    });

    if (metricasCompativeis.length === 0 && medidas.length === 0) {
      return insights;
    }

    // 3. Verificar se já existem medidas com Time Intelligence no catálogo DAX
    const funcoesTimeIntelligence = [
      "SAMEPERIODLASTYEAR",
      "DATEADD",
      "PARALLELPERIOD",
      "TOTALYTD",
      "DATESYTD",
      "PREVIOUSMONTH",
      "PREVIOUSYEAR",
      "DATESMTD",
      "DATESQTD",
      "CLOSINGBALANCEMONTH",
      "OPENINGBALANCEMONTH",
    ];

    const jaPossuiTimeIntelligence = medidas.some((m) => {
      const daxUpper = (m.expressao_dax ?? "").toUpperCase();
      const nomeUpper = m.nome.toUpperCase();
      const temFuncao = funcoesTimeIntelligence.some((fn) => daxUpper.includes(fn));
      const temSigla =
        nomeUpper.includes("YOY") ||
        nomeUpper.includes("MOM") ||
        nomeUpper.includes("YTD") ||
        nomeUpper.includes("ANO ANTERIOR") ||
        nomeUpper.includes("MÊS ANTERIOR");
      return temFuncao || temSigla;
    });

    if (jaPossuiTimeIntelligence) {
      // Já possui medidas temporais: nenhuma recomendação redundante
      return insights;
    }

    // Nome da métrica de referência para contextualizar a mensagem
    const metricaRef = metricasCompativeis[0]?.nome ?? medidas[0]?.nome ?? "Indicadores Principais";
    const nomeDimensaoRef = dimensaoCalendario?.nome ?? "Calendário/Data";

    insights.push({
      id: `d-cop-time-opp:${contexto.modeloPowerBi.id}`,
      codigo: "D-COP-TIME-01",
      categoria: "INTELIGENCIA_TEMPORAL",
      natureza: "OPORTUNIDADE",
      prioridade: "PRIORIDADE_3_ALTO_VALOR",
      ordemPrioridade: 3,
      titulo: `Oportunidade de Análise Temporal (YoY / YTD) para "${metricaRef}"`,
      deteccao: `O modelo dispõe da dimensão temporal "${nomeDimensaoRef}" e da métrica "${metricaRef}", mas o catálogo DAX ainda não possui medidas de cálculo temporal comparativo.`,
      explicacao:
        "Cálculos de inteligência temporal (como Year-over-Year, Month-over-Month e acumulado do ano - YTD) permitem comparar o desempenho atual com períodos homólogos e entender tendências reais de crescimento.",
      recomendacao:
        `Avalie se a demanda se beneficiaria de medidas comparativas como "${metricaRef} YoY" ou "${metricaRef} YTD", utilizando CALCULATE() com SAMEPERIODLASTYEAR() ou DATESYTD().`,
      fatoDetectado: `Dimensão temporal "${nomeDimensaoRef}" presente no modelo semântico; 0 medidas de Time Intelligence identificadas nas ${medidas.length} medida(s) cadastradas.`,
      oportunidade:
        `Responder a perguntas como: 'Quanto ${metricaRef} cresceu em relação ao mesmo período do ano anterior?' ou 'Qual o acumulado no ano fiscal?'.`,
      sugestaoAcao:
        `Criar medidas derivadas de inteligência temporal como [${metricaRef} Ano Anterior] = CALCULATE([${metricaRef}], SAMEPERIODLASTYEAR('${nomeDimensaoRef}'[Data])).`,
      proximaAcaoSugerida: {
        tipo: "CRIAR_MEDIDA_TEMPORAL",
        titulo: `Avaliar Criação de Medida Temporal para "${metricaRef}"`,
        descricao: "Considere implementar medidas YoY ou YTD se a demanda envolver análise de tendências de vendas/faturamento.",
        requerIntervencaoHumana: true,
      },
      pedagogico: {
        conceitoChave: "Time Intelligence em DAX e Dimensão de Data Contínua",
        porQueImporta:
          "Para que funções como SAMEPERIODLASTYEAR e DATEADD funcionem no VertiPaq, a dimensão calendário deve conter datas contínuas sem lacunas (gaps) marcadas como Date Table.",
        dicaProfissional:
          "Sempre utilize medidas base já explícitas dentro de CALCULATE( [Medida], SAMEPERIODLASTYEAR(...) ) em vez de repetir somas inline como CALCULATE( SUM(...), ... ). Isso garante context transition correto e evita repetição de código.",
        termoDicionario: "Time Intelligence e Context Transition",
      },
      entidadesRelacionadas: [
        {
          tipo: "MODELO_POWERBI",
          id: contexto.modeloPowerBi.id,
          nome: contexto.modeloPowerBi.nome_arquivo || "Modelo Power BI",
        },
        ...(dimensaoCalendario
          ? [
              {
                tipo: "ENTIDADE_ANALITICA" as const,
                id: dimensaoCalendario.id,
                nome: dimensaoCalendario.nome,
              },
            ]
          : []),
      ],
    });

    return insights;
  }
}
