/**
 * Avaliador Determinístico de Regras de Dashboard e DAX (V1 — Subunidade 3.7 / Bloco 7)
 * Regras D-01 a D-08 — Avaliação Estrutural, Rastreabilidade e Prontidão de Dashboard
 */

import { ModeloPowerBi } from "@/core/domain/entities/modelo-powerbi";
import { MedidaDax } from "@/core/domain/entities/medida-dax";
import { PaginaRelatorio } from "@/core/domain/entities/pagina-relatorio";
import { VisualDashboard } from "@/core/domain/entities/visual-dashboard";
import { ModeloAnaliticoCompleto } from "@/core/domain/entities/modelo-analitico";
import { TipoFormatoModeloPowerBi } from "@/core/domain/enums/tipo-formato-modelo-powerbi";
import { StatusModeloPowerBi } from "@/core/domain/enums/status-modelo-powerbi";

export type SeveridadeRegraDashboard = "BLOQUEIO" | "ALERTA_CRITICO" | "RECOMENDACAO";

export type CodigoRegraDashboard =
  | "D-01"
  | "D-02"
  | "D-03"
  | "D-04"
  | "D-05"
  | "D-06"
  | "D-07"
  | "D-08";

export interface DiagnosticoRegraDashboard {
  codigo_regra: CodigoRegraDashboard;
  severidade: SeveridadeRegraDashboard;
  titulo: string;
  deteccao: string;
  explicacao: string;
  recomendacao: string;
  impacto_prontidao: string;
  evidencia: string;
  entidade_relacionada_id?: string;
}

export interface ContextoAvaliacaoDashboard {
  modeloPowerBi: ModeloPowerBi | null;
  medidas: MedidaDax[];
  paginas: PaginaRelatorio[];
  visuais: VisualDashboard[];
  modeloAnalitico?: ModeloAnaliticoCompleto | null;
}

export interface ResultadoProntidaoDashboard {
  modelo_powerbi_id?: string;
  demanda_id?: string;
  status_geral: SeveridadeRegraDashboard | "CONFORME";
  apto_para_validacao: boolean;
  isento_powerbi: boolean;
  total_bloqueios: number;
  total_alertas_criticos: number;
  total_recomendacoes: number;
  diagnosticos: DiagnosticoRegraDashboard[];
  resumo: {
    total_medidas: number;
    total_paginas: number;
    total_visuais: number;
    metricas_homologadas_cobertas: number;
    total_metricas_homologadas: number;
  };
  avaliado_em: string;
}

export class DashboardRulesEvaluator {
  /**
   * Executa a avaliação determinística completa das regras D-01 a D-08.
   */
  public static avaliar(contexto: ContextoAvaliacaoDashboard): ResultadoProntidaoDashboard {
    const { modeloPowerBi, medidas, paginas, visuais, modeloAnalitico } = contexto;
    const diagnosticos: DiagnosticoRegraDashboard[] = [];

    const isIsento = modeloPowerBi?.tipo_formato === TipoFormatoModeloPowerBi.ISENTO_EXCEL_ONLY;

    // D-01 — Existência e estado válido do Modelo Power BI
    this.avaliarD01(modeloPowerBi, diagnosticos);

    // Se o modelo Power BI não foi declarado, não há como prosseguir com avaliações de artefatos
    if (modeloPowerBi) {
      if (isIsento) {
        // Modo ISENTO_EXCEL_ONLY: preserva o escopo sem exigir artefatos Power BI
        // D-08 avalia prontidão formal da isenção
        this.avaliarD08Isento(modeloPowerBi, diagnosticos);
      } else {
        // D-02 — Cobertura das métricas analíticas homologadas por medidas DAX
        this.avaliarD02(modeloPowerBi, medidas, modeloAnalitico, diagnosticos);

        // D-03 — Linhagem Métrica Analítica -> Medida DAX
        this.avaliarD03(medidas, modeloAnalitico, diagnosticos);

        // D-04 — Validade estrutural das medidas DAX
        this.avaliarD04(medidas, diagnosticos);

        // D-05 — Páginas com objetivo analítico e público-alvo definidos
        this.avaliarD05(paginas, diagnosticos);

        // D-06 — Visuais com medidas/atributos coerentes e justificativa DataViz
        this.avaliarD06(paginas, visuais, medidas, diagnosticos);

        // D-07 — Rastreabilidade ponta a ponta
        this.avaliarD07(medidas, visuais, modeloAnalitico, diagnosticos);

        // D-08 — Prontidão estrutural do Dashboard para validação
        this.avaliarD08(modeloPowerBi, medidas, paginas, visuais, diagnosticos);
      }
    }

    const totalBloqueios = diagnosticos.filter((d) => d.severidade === "BLOQUEIO").length;
    const totalAlertas = diagnosticos.filter((d) => d.severidade === "ALERTA_CRITICO").length;
    const totalRecomendacoes = diagnosticos.filter((d) => d.severidade === "RECOMENDACAO").length;

    let statusGeral: SeveridadeRegraDashboard | "CONFORME" = "CONFORME";
    if (totalBloqueios > 0) {
      statusGeral = "BLOQUEIO";
    } else if (totalAlertas > 0) {
      statusGeral = "ALERTA_CRITICO";
    } else if (totalRecomendacoes > 0) {
      statusGeral = "RECOMENDACAO";
    }

    // Métricas homologadas cobertas
    const totalMetricasHomologadas = modeloAnalitico?.metricas?.length ?? 0;
    let metricasCobertas = 0;
    if (totalMetricasHomologadas > 0 && modeloAnalitico) {
      const metricasIdsComDax = new Set(
        medidas.map((m) => m.metrica_analitica_id).filter((id): id is string => Boolean(id))
      );
      metricasCobertas = modeloAnalitico.metricas.filter((m) => metricasIdsComDax.has(m.id)).length;
    }

    const aptoParaValidacao =
      totalBloqueios === 0 &&
      (isIsento
        ? (modeloPowerBi?.justificativa_isencao?.trim().length ?? 0) >= 15
        : paginas.length > 0 &&
          visuais.length > 0 &&
          medidas.length > 0 &&
          modeloPowerBi !== null);

    return {
      modelo_powerbi_id: modeloPowerBi?.id,
      demanda_id: modeloPowerBi?.demanda_id,
      status_geral: statusGeral,
      apto_para_validacao: aptoParaValidacao,
      isento_powerbi: isIsento,
      total_bloqueios: totalBloqueios,
      total_alertas_criticos: totalAlertas,
      total_recomendacoes: totalRecomendacoes,
      diagnosticos,
      resumo: {
        total_medidas: medidas.length,
        total_paginas: paginas.length,
        total_visuais: visuais.length,
        metricas_homologadas_cobertas: metricasCobertas,
        total_metricas_homologadas: totalMetricasHomologadas,
      },
      avaliado_em: new Date().toISOString(),
    };
  }

  // =========================================================================
  // D-01: Existência e Estado Válido do Modelo Power BI
  // =========================================================================
  private static avaliarD01(
    modeloPowerBi: ModeloPowerBi | null,
    diagnosticos: DiagnosticoRegraDashboard[]
  ): void {
    if (!modeloPowerBi) {
      diagnosticos.push({
        codigo_regra: "D-01",
        severidade: "BLOQUEIO",
        titulo: "Modelo Power BI Não Declarado",
        deteccao: "A demanda não possui modelo Power BI associado nem declaração formal de isenção.",
        explicacao:
          "Toda demanda profissional em fase de validação analítica requer um artefato de visualização (.pbix/.pbip/TMDL) ou uma declaração formal de isenção de Power BI (ex: entregas exclusivas em planilha Excel).",
        recomendacao:
          "Vincule um arquivo de modelo Power BI (.pbix/.pbip) ou declare formalmente a isenção de Power BI na aba correspondente.",
        impacto_prontidao: "Bloqueia o avanço da demanda e a preparação para a etapa de Validação.",
        evidencia: "modeloPowerBi: null",
      });
      return;
    }

    if (modeloPowerBi.tipo_formato === TipoFormatoModeloPowerBi.ISENTO_EXCEL_ONLY) {
      const justificativa = modeloPowerBi.justificativa_isencao?.trim() ?? "";
      if (justificativa.length < 15) {
        diagnosticos.push({
          codigo_regra: "D-01",
          severidade: "BLOQUEIO",
          titulo: "Justificativa de Isenção de Power BI Ausente ou Insuficiente",
          deteccao: `O modelo foi declarado com formato ISENTO_EXCEL_ONLY, porém a justificativa técnica possui ${justificativa.length} caractere(s) (mínimo exigido: 15).`,
          explicacao:
            "A isenção do desenvolvimento de Power BI deve ser fundamentada formalmente para fins de governança e auditoria da entrega analítica.",
          recomendacao:
            "Preencha uma justificativa técnica clara e formal (mínimo de 15 caracteres) explicando o motivo da dispensa de dashboard em Power BI.",
          impacto_prontidao: "Bloqueia a homologação da isenção de Power BI.",
          evidencia: `tipo_formato: ISENTO_EXCEL_ONLY, justificativa_length: ${justificativa.length}`,
          entidade_relacionada_id: modeloPowerBi.id,
        });
      }
      return;
    }

    // Modelo normal (PBIX / PBIP)
    if (!modeloPowerBi.nome_arquivo || modeloPowerBi.nome_arquivo.trim().length === 0) {
      diagnosticos.push({
        codigo_regra: "D-01",
        severidade: "BLOQUEIO",
        titulo: "Nome de Arquivo do Modelo Ausente",
        deteccao: "O modelo Power BI cadastrado não possui um nome de arquivo válido definido.",
        explicacao: "Todo artefato de dashboard deve ter nome de arquivo rastreável e referenciável.",
        recomendacao: "Informe o nome do arquivo do modelo Power BI (ex: 'RelatorioVendas.pbip').",
        impacto_prontidao: "Bloqueia a identificação do artefato.",
        evidencia: `id: ${modeloPowerBi.id}, nome_arquivo: ''`,
        entidade_relacionada_id: modeloPowerBi.id,
      });
    }

    if (!modeloPowerBi.status) {
      diagnosticos.push({
        codigo_regra: "D-01",
        severidade: "ALERTA_CRITICO",
        titulo: "Modelo Power BI com Status Indefinido",
        deteccao: "O modelo Power BI está cadastrado sem status formal definido.",
        explicacao: "O status do modelo reflete a maturidade do artefato dentro do ciclo de entrega.",
        recomendacao: "Defina o status de desenvolvimento do modelo Power BI.",
        impacto_prontidao: "Requer atenção do analista antes de submeter o dashboard para validação.",
        evidencia: `status: null`,
        entidade_relacionada_id: modeloPowerBi.id,
      });
    }
  }

  // =========================================================================
  // D-02: Cobertura das Métricas Analíticas Homologadas por Medidas DAX
  // =========================================================================
  private static avaliarD02(
    modeloPowerBi: ModeloPowerBi,
    medidas: MedidaDax[],
    modeloAnalitico: ModeloAnaliticoCompleto | null | undefined,
    diagnosticos: DiagnosticoRegraDashboard[]
  ): void {
    if (modeloAnalitico && modeloAnalitico.metricas && modeloAnalitico.metricas.length > 0) {
      const metricasVinculadasIds = new Set(
        medidas.map((m) => m.metrica_analitica_id).filter((id): id is string => Boolean(id))
      );

      const metricasNaoCobertas = modeloAnalitico.metricas.filter(
        (m) => !metricasVinculadasIds.has(m.id)
      );

      if (metricasNaoCobertas.length > 0) {
        const nomesNaoCobertos = metricasNaoCobertas.map((m) => `"${m.nome}"`).join(", ");
        diagnosticos.push({
          codigo_regra: "D-02",
          severidade: "ALERTA_CRITICO",
          titulo: "Métricas Analíticas Homologadas Sem Medida DAX Correspondente",
          deteccao: `${metricasNaoCobertas.length} métrica(s) analítica(s) homologada(s) no modelo semântico não possuem medida DAX correspondente cadastrada no dashboard: ${nomesNaoCobertos}.`,
          explicacao:
            "Todas as métricas analíticas aprovadas na etapa de modelagem devem ser implementadas como medidas DAX no dashboard para preservar a fidelidade semântica dos indicadores de negócio.",
          recomendacao:
            "Cadastre medidas DAX associadas a cada uma das métricas da modelagem ou documente a justificativa técnica caso a métrica não seja necessária no relatório visual.",
          impacto_prontidao: "Gera alerta crítico sobre a cobertura dos KPIs acordados.",
          evidencia: `metricas_sem_dax: [${nomesNaoCobertos}], total_metricas: ${modeloAnalitico.metricas.length}, medidas_cadastradas: ${medidas.length}`,
        });
      }
    } else {
      // Se não há modelo analítico vinculado ou ele não tem métricas, o dashboard ainda requer ao menos uma medida DAX
      if (medidas.length === 0) {
        diagnosticos.push({
          codigo_regra: "D-02",
          severidade: "BLOQUEIO",
          titulo: "Nenhuma Medida DAX Cadastrada no Dashboard",
          deteccao: "O catálogo de medidas DAX está vazio e o modelo não é isento.",
          explicacao:
            "Um dashboard em Power BI requer a definição de medidas calculadas explícitas para garantir governança analítica e evitar cálculos implícitos frágeis.",
          recomendacao: "Cadastre as medidas DAX correspondentes aos principais indicadores do dashboard.",
          impacto_prontidao: "Bloqueia a aprovação estrutural do dashboard.",
          evidencia: `total_medidas: 0, tipo_formato: ${modeloPowerBi.tipo_formato}`,
          entidade_relacionada_id: modeloPowerBi.id,
        });
      }
    }
  }

  // =========================================================================
  // D-03: Linhagem Métrica Analítica -> Medida DAX
  // =========================================================================
  private static avaliarD03(
    medidas: MedidaDax[],
    modeloAnalitico: ModeloAnaliticoCompleto | null | undefined,
    diagnosticos: DiagnosticoRegraDashboard[]
  ): void {
    if (!modeloAnalitico) {
      return;
    }

    const metricasValidasIds = new Set((modeloAnalitico.metricas ?? []).map((m) => m.id));

    // 1. Detectar medidas apontando para IDs inexistentes
    for (const medida of medidas) {
      if (medida.metrica_analitica_id && !metricasValidasIds.has(medida.metrica_analitica_id)) {
        diagnosticos.push({
          codigo_regra: "D-03",
          severidade: "BLOQUEIO",
          titulo: `Linhagem Quebrada na Medida DAX "${medida.nome}"`,
          deteccao: `A medida "${medida.nome}" faz referência à métrica analítica com ID "${medida.metrica_analitica_id}", que não existe no modelo analítico vinculado.`,
          explicacao:
            "A rastreabilidade semântica exige que vínculos declarados com métricas analíticas apontem para registros vigentes e válidos.",
          recomendacao:
            `Corrija a referência da medida "${medida.nome}" para uma métrica analítica válida ou remova o vínculo órfão.`,
          impacto_prontidao: "Bloqueia a integridade da linhagem semântica.",
          evidencia: `medida_id: "${medida.id}", metrica_analitica_id: "${medida.metrica_analitica_id}"`,
          entidade_relacionada_id: medida.id,
        });
      }
    }

    // 2. Recomendação se houver medidas mas nenhuma linhagem declarada
    if (modeloAnalitico.metricas && modeloAnalitico.metricas.length > 0 && medidas.length > 0) {
      const temAlgumaLinhagem = medidas.some((m) => Boolean(m.metrica_analitica_id));
      if (!temAlgumaLinhagem) {
        diagnosticos.push({
          codigo_regra: "D-03",
          severidade: "RECOMENDACAO",
          titulo: "Medidas DAX Sem Vínculo Declarado com Métricas Analíticas",
          deteccao: `Existem ${medidas.length} medida(s) DAX cadastradas, mas nenhuma possui vínculo com as métricas do modelo analítico homologado.`,
          explicacao:
            "Vincular medidas DAX às métricas analíticas permite auditoria automática de conformidade, reconciliação numérica e documentação viva no dossiê de entrega.",
          recomendacao:
            "Associe formalmente cada medida DAX à sua respectiva métrica analítica homologada.",
          impacto_prontidao: "Melhora a rastreabilidade sem bloquear a validação.",
          evidencia: `total_medidas: ${medidas.length}, medidas_vinculadas: 0`,
        });
      }
    }
  }

  // =========================================================================
  // D-04: Validade Estrutural das Medidas DAX
  // =========================================================================
  private static avaliarD04(
    medidas: MedidaDax[],
    diagnosticos: DiagnosticoRegraDashboard[]
  ): void {
    // 1. Duplicidade nominal
    const nomesMap = new Map<string, string[]>();
    for (const medida of medidas) {
      const nomeNormalizado = medida.nome.trim().toLowerCase();
      if (!nomesMap.has(nomeNormalizado)) {
        nomesMap.set(nomeNormalizado, []);
      }
      nomesMap.get(nomeNormalizado)!.push(medida.id);
    }

    for (const [nomeNorm, ids] of nomesMap.entries()) {
      if (ids.length > 1) {
        const nomesOriginais = medidas.filter((m) => ids.includes(m.id)).map((m) => `"${m.nome}"`).join(", ");
        diagnosticos.push({
          codigo_regra: "D-04",
          severidade: "BLOQUEIO",
          titulo: "Duplicidade de Nomes de Medidas DAX",
          deteccao: `Foram encontradas ${ids.length} medidas com o mesmo nome no modelo: ${nomesOriginais}. O Power BI exige nomes únicos para todas as medidas em nível de modelo tabular.`,
          explicacao:
            "No motor tabular (VertiPaq / Analysis Services), o escopo de nomes de medidas é global dentro do modelo. Duplicatas provocam conflito de resolução de identificadores.",
          recomendacao: `Renomeie as medidas duplicadas para que cada indicador possua uma designação unívoca.`,
          impacto_prontidao: "Bloqueia a compilação do modelo tabular.",
          evidencia: `nome_conflitante: "${nomeNorm}", measure_ids: [${ids.join(", ")}]`,
        });
      }
    }

    // 2. Validações por medida individual
    for (const medida of medidas) {
      // Expressão DAX vazia
      if (!medida.expressao_dax || medida.expressao_dax.trim().length === 0) {
        diagnosticos.push({
          codigo_regra: "D-04",
          severidade: "BLOQUEIO",
          titulo: `Expressão DAX Vazia na Medida "${medida.nome}"`,
          deteccao: `A medida "${medida.nome}" foi cadastrada com expressão DAX em branco ou vazia.`,
          explicacao: "Toda medida DAX deve conter uma fórmula de cálculo válida.",
          recomendacao: `Preencha a fórmula DAX correspondente da medida "${medida.nome}".`,
          impacto_prontidao: "Bloqueia a avaliação da medida.",
          evidencia: `medida_id: "${medida.id}", expressao_dax: ""`,
          entidade_relacionada_id: medida.id,
        });
      }

      // Tabela hospedeira vazia
      if (!medida.tabela_hospedeira || medida.tabela_hospedeira.trim().length === 0) {
        diagnosticos.push({
          codigo_regra: "D-04",
          severidade: "BLOQUEIO",
          titulo: `Tabela Hospedeira Não Definida na Medida "${medida.nome}"`,
          deteccao: `A medida "${medida.nome}" não possui uma tabela hospedeira declarada.`,
          explicacao: "Medidas tabulares devem pertencer formalmente a uma tabela do modelo para fins de organização.",
          recomendacao: `Defina uma tabela hospedeira (ex: '_Medidas') para a medida "${medida.nome}".`,
          impacto_prontidao: "Bloqueia o mapeamento da medida.",
          evidencia: `medida_id: "${medida.id}", tabela_hospedeira: ""`,
          entidade_relacionada_id: medida.id,
        });
      } else {
        // Tabela hospedeira não dedicada (Recomendação)
        const hospedeira = medida.tabela_hospedeira.trim();
        const ehDedicada =
          hospedeira.startsWith("_") ||
          hospedeira.toLowerCase().includes("medida") ||
          hospedeira.toLowerCase().includes("kpi");
        if (!ehDedicada) {
          diagnosticos.push({
            codigo_regra: "D-04",
            severidade: "RECOMENDACAO",
            titulo: `Medida "${medida.nome}" Não Hospedada em Tabela Dedicada`,
            deteccao: `A medida "${medida.nome}" está hospedada na tabela "${hospedeira}".`,
            explicacao:
              "Recomenda-se centralizar todas as medidas calculadas em uma tabela dedicada (ex: '_Medidas' ou '_KPIs') para facilitar a manutenção e navegação no painel de campos.",
            recomendacao: `Considere mover a medida "${medida.nome}" para uma tabela dedicada como '_Medidas'.`,
            impacto_prontidao: "Sugestão de boa prática organizacional.",
            evidencia: `tabela_hospedeira: "${hospedeira}"`,
            entidade_relacionada_id: medida.id,
          });
        }
      }

      // Heurística de Boa Prática: Sugestão de DIVIDE() para Divisão Direta (Recomendação)
      if (medida.expressao_dax) {
        const codigoSemLiterais = this.limparComentariosELiteraisDax(medida.expressao_dax);
        const temDivisaoDireta =
          /\s+\/\s+/.test(codigoSemLiterais) ||
          /[\w)\]]\s*\/\s*[\w(\[]/.test(codigoSemLiterais);
        const usaDivide = codigoSemLiterais.toUpperCase().includes("DIVIDE");

        if (temDivisaoDireta && !usaDivide) {
          diagnosticos.push({
            codigo_regra: "D-04",
            severidade: "RECOMENDACAO",
            titulo: `Heurística de Boa Prática: Sugestão de DIVIDE() na Medida "${medida.nome}"`,
            deteccao: `Foi identificada divisão direta na expressão da medida "${medida.nome}".`,
            explicacao:
              "Considere utilizar a função DIVIDE() quando for desejável tratar explicitamente casos de denominador zero ou valor BLANK. Esta é uma recomendação de boa prática analítica e não indica, por si só, que a expressão DAX esteja incorreta ou seja inválida.",
            recomendacao:
              `Avalie se a substituição da divisão direta por DIVIDE(numerador, denominador, [alternativa]) é pertinente para o tratamento defensivo de nulos ou zeros na medida "${medida.nome}".`,
            impacto_prontidao:
              "Recomendação pedagógica de boa prática. Não bloqueia a prontidão do dashboard nem impede a validação.",
            evidencia: `expressao_dax: "${medida.expressao_dax.trim()}"`,
            entidade_relacionada_id: medida.id,
          });
        }
      }

      // String de formatação não declarada (Recomendação)
      if (!medida.formato_string || medida.formato_string.trim().length === 0) {
        diagnosticos.push({
          codigo_regra: "D-04",
          severidade: "RECOMENDACAO",
          titulo: `Medida "${medida.nome}" Sem String de Formatação Numérica`,
          deteccao: `A medida "${medida.nome}" não possui 'formato_string' declarado.`,
          explicacao:
            "Declarar explicitamente a formatação numérica (ex: '#,##0.00', '0.0%', 'R$ #,##0') evita formatação genérica indesejada nos visuais do relatório.",
          recomendacao: `Defina o padrão de formatação para a medida "${medida.nome}".`,
          impacto_prontidao: "Melhora a apresentação visual dos números.",
          evidencia: `medida_id: "${medida.id}", formato_string: null`,
          entidade_relacionada_id: medida.id,
        });
      }
    }
  }

  // =========================================================================
  // D-05: Páginas com Objetivo Analítico e Público-Alvo Definidos
  // =========================================================================
  private static avaliarD05(
    paginas: PaginaRelatorio[],
    diagnosticos: DiagnosticoRegraDashboard[]
  ): void {
    if (paginas.length === 0) {
      diagnosticos.push({
        codigo_regra: "D-05",
        severidade: "BLOQUEIO",
        titulo: "Nenhuma Página de Relatório Definida",
        deteccao: "O dashboard não possui nenhuma página de relatório cadastrada.",
        explicacao:
          "Um relatório de Business Intelligence deve ser estruturado em ao menos uma página analítica orientada a objetivos claros de negócio.",
        recomendacao: "Crie ao menos uma página no relatório (ex: 'Visão Geral Executiva').",
        impacto_prontidao: "Bloqueia a validação estrutural do relatório.",
        evidencia: "total_paginas: 0",
      });
      return;
    }

    for (const pagina of paginas) {
      if (!pagina.nome || pagina.nome.trim().length === 0) {
        diagnosticos.push({
          codigo_regra: "D-05",
          severidade: "BLOQUEIO",
          titulo: "Página de Relatório Sem Nome",
          deteccao: `A página de relatório com ID "${pagina.id}" possui nome vazio.`,
          explicacao: "Toda página de relatório deve possuir um título claro e descritivo.",
          recomendacao: "Defina o nome da página de relatório.",
          impacto_prontidao: "Bloqueia a identificação da página.",
          evidencia: `pagina_id: "${pagina.id}", nome: ""`,
          entidade_relacionada_id: pagina.id,
        });
      }

      const objetivo = pagina.objetivo_analitico?.trim() ?? "";
      if (objetivo.length < 10) {
        diagnosticos.push({
          codigo_regra: "D-05",
          severidade: "ALERTA_CRITICO",
          titulo: `Página "${pagina.nome}" Sem Objetivo Analítico Claro`,
          deteccao: `A página "${pagina.nome}" possui objetivo analítico com ${objetivo.length} caractere(s) (mínimo recomendado: 10).`,
          explicacao:
            "Definir com clareza o objetivo analítico da tela assegura que ela responda a perguntas de negócio concretas e evite dashboards meramente decorativos.",
          recomendacao: `Descreva formalmente o objetivo analítico da página "${pagina.nome}" (ex: 'Monitorar o desempenho mensal de vendas e desvios de metas por filial').`,
          impacto_prontidao: "Requer formalização do objetivo antes da entrega final.",
          evidencia: `pagina_id: "${pagina.id}", objetivo_length: ${objetivo.length}`,
          entidade_relacionada_id: pagina.id,
        });
      }

      if (!pagina.publico_alvo) {
        diagnosticos.push({
          codigo_regra: "D-05",
          severidade: "ALERTA_CRITICO",
          titulo: `Página "${pagina.nome}" Sem Público-Alvo Declarado`,
          deteccao: `A página "${pagina.nome}" não possui público-alvo atribuído.`,
          explicacao:
            "Saber se o relatório se destina a executivos, gerentes operacionais ou analistas técnicos direciona a densidade informacional e a escolha de visuais.",
          recomendacao: `Defina o público-alvo da página "${pagina.nome}".`,
          impacto_prontidao: "Ajuda na adequação da interface.",
          evidencia: `pagina_id: "${pagina.id}", publico_alvo: null`,
          entidade_relacionada_id: pagina.id,
        });
      }
    }
  }

  // =========================================================================
  // D-06: Visuais com Medidas/Atributos Coerentes e Justificativa DataViz
  // =========================================================================
  private static avaliarD06(
    paginas: PaginaRelatorio[],
    visuais: VisualDashboard[],
    medidas: MedidaDax[],
    diagnosticos: DiagnosticoRegraDashboard[]
  ): void {
    const paginasValidasIds = new Set(paginas.map((p) => p.id));
    const medidasValidasIds = new Set(medidas.map((m) => m.id));

    for (const visual of visuais) {
      // 1. Vínculo com página
      if (!paginasValidasIds.has(visual.pagina_id)) {
        diagnosticos.push({
          codigo_regra: "D-06",
          severidade: "BLOQUEIO",
          titulo: `Visual "${visual.titulo}" Vinculado a Página Inexistente`,
          deteccao: `O visual "${visual.titulo}" referencia a página com ID "${visual.pagina_id}", que não existe no relatório.`,
          explicacao: "Todo visual deve pertencer a uma página válida e existente no dashboard.",
          recomendacao: `Reatribua o visual "${visual.titulo}" a uma página de relatório existente.`,
          impacto_prontidao: "Bloqueia a integridade da hierarquia visual.",
          evidencia: `visual_id: "${visual.id}", pagina_id: "${visual.pagina_id}"`,
          entidade_relacionada_id: visual.id,
        });
      }

      // 2. Título do visual
      if (!visual.titulo || visual.titulo.trim().length === 0) {
        diagnosticos.push({
          codigo_regra: "D-06",
          severidade: "BLOQUEIO",
          titulo: "Visual com Título Ausente",
          deteccao: `O visual com ID "${visual.id}" não possui título definido.`,
          explicacao: "Cada elemento gráfico deve possuir título que identifique o que está sendo exibido.",
          recomendacao: "Defina um título descritivo para o visual.",
          impacto_prontidao: "Bloqueia a clareza do relatório.",
          evidencia: `visual_id: "${visual.id}", titulo: ""`,
          entidade_relacionada_id: visual.id,
        });
      }

      // 3. Consumo de dados (medidas ou atributos)
      const temMedidas = visual.medidas_utilizadas_ids && visual.medidas_utilizadas_ids.length > 0;
      const temAtributos = visual.atributos_utilizados_ids && visual.atributos_utilizados_ids.length > 0;

      if (!temMedidas && !temAtributos) {
        diagnosticos.push({
          codigo_regra: "D-06",
          severidade: "ALERTA_CRITICO",
          titulo: `Visual "${visual.titulo}" Sem Dados Associados`,
          deteccao: `O visual "${visual.titulo}" não referencia nenhuma medida DAX nem campo dimensional.`,
          explicacao:
            "Um componente visual sem medidas ou atributos representa um espaço vazio ou não configurado no dashboard.",
          recomendacao: `Associe medidas DAX ou atributos dimensionais ao visual "${visual.titulo}".`,
          impacto_prontidao: "Requer configuração dos dados do visual.",
          evidencia: `visual_id: "${visual.id}", tipo_visual: "${visual.tipo_visual}"`,
          entidade_relacionada_id: visual.id,
        });
      }

      // 4. Existência das medidas utilizadas
      if (temMedidas) {
        for (const mId of visual.medidas_utilizadas_ids) {
          if (!medidasValidasIds.has(mId)) {
            diagnosticos.push({
              codigo_regra: "D-06",
              severidade: "BLOQUEIO",
              titulo: `Visual "${visual.titulo}" Referencia Medida DAX Inexistente`,
              deteccao: `O visual "${visual.titulo}" referencia a medida com ID "${mId}", inexistente no catálogo de medidas do dashboard.`,
              explicacao:
                "Visuais que apontam para IDs de medidas inexistentes provocarão erro de renderização no Power BI.",
              recomendacao: `Remova a referência inválida ou cadastre a medida DAX com ID "${mId}".`,
              impacto_prontidao: "Bloqueia a consistência referencial dos dados.",
              evidencia: `visual_id: "${visual.id}", medida_inexistente_id: "${mId}"`,
              entidade_relacionada_id: visual.id,
            });
          }
        }
      }

      // 5. Justificativa DataViz (Recomendação)
      const justificativa = visual.justificativa_dataviz?.trim() ?? "";
      if (justificativa.length < 10) {
        diagnosticos.push({
          codigo_regra: "D-06",
          severidade: "RECOMENDACAO",
          titulo: `Visual "${visual.titulo}" Sem Justificativa de Data Visualization`,
          deteccao: `O visual "${visual.titulo}" possui justificativa DataViz com ${justificativa.length} caractere(s).`,
          explicacao:
            "Explicar a escolha do tipo gráfico (ex: por que usar gráfico de barras em vez de pizza, ou linha para evolução temporal) reforça o rigor metodológico do analista.",
          recomendacao: `Documente a justificativa técnica para a escolha do tipo visual '${visual.tipo_visual}' no visual "${visual.titulo}".`,
          impacto_prontidao: "Eleva o nível de maturidade analítica e governança de DataViz.",
          evidencia: `visual_id: "${visual.id}", tipo_visual: "${visual.tipo_visual}"`,
          entidade_relacionada_id: visual.id,
        });
      }
    }
  }

  // =========================================================================
  // D-07: Rastreabilidade Ponta a Ponta
  // =========================================================================
  private static avaliarD07(
    medidas: MedidaDax[],
    visuais: VisualDashboard[],
    modeloAnalitico: ModeloAnaliticoCompleto | null | undefined,
    diagnosticos: DiagnosticoRegraDashboard[]
  ): void {
    if (visuais.length === 0) {
      return;
    }

    const medidasUsadasNosVisuais = new Set(visuais.flatMap((v) => v.medidas_utilizadas_ids));

    // Se existem visuais cadastrados mas NENHUM deles consome medidas DAX
    if (medidas.length > 0 && medidasUsadasNosVisuais.size === 0) {
      diagnosticos.push({
        codigo_regra: "D-07",
        severidade: "ALERTA_CRITICO",
        titulo: "Nenhum Visual do Dashboard Utiliza Medidas DAX Calculadas",
        deteccao: `O relatório possui ${visuais.length} visual(is) e ${medidas.length} medida(s) DAX, mas nenhum visual consome medidas calculadas.`,
        explicacao:
          "Relatórios profissionais em Power BI devem fundamentar suas visualizações em medidas DAX explícitas, garantindo cálculos centralizados e auditáveis.",
        recomendacao: "Conecte as medidas DAX aos visuais correspondentes no dashboard.",
        impacto_prontidao: "Alerta sobre a falta de integração entre a camada de cálculo e a camada de visualização.",
        evidencia: `total_visuais: ${visuais.length}, total_medidas: ${medidas.length}, medidas_em_visuais: 0`,
      });
    }

    // Se houver modelo analítico com métricas: verificar medidas vinculadas que não estão em visuais
    if (modeloAnalitico && modeloAnalitico.metricas) {
      const metricasMap = new Map(modeloAnalitico.metricas.map((m) => [m.id, m.nome]));
      for (const medida of medidas) {
        if (medida.metrica_analitica_id && !medidasUsadasNosVisuais.has(medida.id)) {
          const nomeMetrica = metricasMap.get(medida.metrica_analitica_id) ?? "Desconhecida";
          diagnosticos.push({
            codigo_regra: "D-07",
            severidade: "RECOMENDACAO",
            titulo: `Medida DAX "${medida.nome}" Não Consumida em Nenhum Visual`,
            deteccao: `A medida "${medida.nome}" (vinculada à métrica "${nomeMetrica}") foi calculada mas não está associada a nenhum visual das páginas cadastradas.`,
            explicacao:
              "Métricas aprovadas que não chegam à tela do relatório podem indicar KPI esquecido ou cálculo intermediário não explicitado.",
            recomendacao:
              `Verifique se a medida "${medida.nome}" deve ser exibida em um cartão de KPI, gráfico ou tabela analítica.`,
            impacto_prontidao: "Verificação de rastreabilidade de negócio.",
            evidencia: `medida_id: "${medida.id}", metrica_vinculada: "${nomeMetrica}"`,
            entidade_relacionada_id: medida.id,
          });
        }
      }
    }
  }

  // =========================================================================
  // D-08: Prontidão Estrutural do Dashboard para Futura Validação
  // =========================================================================
  private static avaliarD08(
    modeloPowerBi: ModeloPowerBi,
    medidas: MedidaDax[],
    paginas: PaginaRelatorio[],
    visuais: VisualDashboard[],
    diagnosticos: DiagnosticoRegraDashboard[]
  ): void {
    const pendencias: string[] = [];

    if (paginas.length === 0) {
      pendencias.push("Nenhuma página de relatório cadastrada");
    }

    if (visuais.length === 0) {
      pendencias.push("Nenhum visual analítico cadastrado");
    }

    if (medidas.length === 0) {
      pendencias.push("Nenhuma medida DAX cadastrada");
    }

    const totalBloqueiosD01aD07 = diagnosticos.filter((d) => d.severidade === "BLOQUEIO").length;
    if (totalBloqueiosD01aD07 > 0) {
      pendencias.push(`${totalBloqueiosD01aD07} bloqueio(s) impeditivo(s) ativo(s)`);
    }

    if (pendencias.length > 0) {
      diagnosticos.push({
        codigo_regra: "D-08",
        severidade: "BLOQUEIO",
        titulo: "Dashboard Não Apto para Etapa de Validação",
        deteccao: `O dashboard não atende aos critérios mínimos de prontidão estrutural: ${pendencias.join("; ")}.`,
        explicacao:
          "Para que a demanda avance com segurança para a etapa de Validação Numérica e Reconciliação (Aba 9), a estrutura do dashboard (páginas, visuais e medidas DAX) deve estar devidamente concluída e sem impedimentos técnicos.",
        recomendacao:
          "Resolva as pendências estruturais indicadas antes de encaminhar o dashboard para a validação formal.",
        impacto_prontidao: "Bloqueia o avanço da demanda no Workflow e impede validação prematura.",
        evidencia: `pendencias: [${pendencias.join(", ")}]`,
        entidade_relacionada_id: modeloPowerBi.id,
      });
    }
  }

  // =========================================================================
  // D-08 (Isento): Prontidão Estrutural no Modo ISENTO_EXCEL_ONLY
  // =========================================================================
  private static avaliarD08Isento(
    modeloPowerBi: ModeloPowerBi,
    diagnosticos: DiagnosticoRegraDashboard[]
  ): void {
    const justificativa = modeloPowerBi.justificativa_isencao?.trim() ?? "";
    if (justificativa.length < 15) {
      diagnosticos.push({
        codigo_regra: "D-08",
        severidade: "BLOQUEIO",
        titulo: "Isenção de Power BI Incompleta para Validação",
        deteccao: "A declaração de isenção de Power BI não possui justificativa técnica suficiente para permitir validação.",
        explicacao:
          "Mesmo sem artefatos de Power BI, a entrega precisa ter sua isenção plenamente fundamentada para que a validação de dados ocorra diretamente sobre a planilha/base autorizada.",
        recomendacao: "Registre uma justificativa de isenção com no mínimo 15 caracteres.",
        impacto_prontidao: "Bloqueia a validação de demandas isentas de Power BI.",
        evidencia: `justificativa_length: ${justificativa.length}`,
        entidade_relacionada_id: modeloPowerBi.id,
      });
    }
  }

  /**
   * Remove comentários (//, --, /* ... *\/) e literais de string ("...") de uma expressão DAX
   * para evitar falsos positivos na detecção de operadores.
   */
  private static limparComentariosELiteraisDax(expressao: string): string {
    // 1. Remove comentários de bloco /* ... */
    let limpo = expressao.replace(/\/\*[\s\S]*?\*\//g, " ");
    // 2. Remove comentários de linha // ... e -- ...
    limpo = limpo.replace(/(\/\/|--).*$/gm, " ");
    // 3. Remove literais de texto "..." (incluindo aspas escapadas "")
    limpo = limpo.replace(/"(?:[^"]|"")*"/g, " ");
    return limpo;
  }
}
