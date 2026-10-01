import { describe, it, expect } from "vitest";
import {
  DashboardCopilotEngine,
  ContextoAnaliseDashboardCopilot,
  EstrategiaInsightDashboard,
  InsightDashboardCopilot,
} from "@/core/domain/dashboard-copilot";
import { ModeloPowerBi } from "@/core/domain/entities/modelo-powerbi";
import { MedidaDax } from "@/core/domain/entities/medida-dax";
import { PaginaRelatorio } from "@/core/domain/entities/pagina-relatorio";
import { VisualDashboard } from "@/core/domain/entities/visual-dashboard";
import { ModeloAnaliticoCompleto } from "@/core/domain/entities/modelo-analitico";
import { TipoFormatoModeloPowerBi } from "@/core/domain/enums/tipo-formato-modelo-powerbi";
import { StatusModeloPowerBi } from "@/core/domain/enums/status-modelo-powerbi";
import { CategoriaMedidaDax } from "@/core/domain/enums/categoria-medida-dax";
import { PublicoAlvoPagina } from "@/core/domain/enums/publico-alvo-pagina";
import { LayoutGridPagina } from "@/core/domain/enums/layout-grid-pagina";
import { TipoVisualDashboard } from "@/core/domain/enums/tipo-visual-dashboard";
import { PosicaoLayoutVisual } from "@/core/domain/enums/posicao-layout-visual";
import { TipoArquiteturaModelo } from "@/core/domain/enums/tipo-arquitetura-modelo";
import { StatusModeloAnalitico } from "@/core/domain/enums/status-modelo-analitico";
import { TipoEntidadeAnalitica } from "@/core/domain/enums/tipo-entidade-analitica";
import { PapelEntidadeAnalitica } from "@/core/domain/enums/papel-entidade-analitica";
import { TipoDadoAnalitico } from "@/core/domain/enums/tipo-dado-analitico";
import { TipoOrigemEntidade } from "@/core/domain/enums/tipo-origem-entidade";
import { ResultadoProntidaoDashboard } from "@/core/domain/rules/dashboard-rules-evaluator";

describe("DashboardCopilotEngine — Subgates 3.3A e 3.3B: Inteligência Analítica Contextual", () => {
  function criarContextoPadrao(): ContextoAnaliseDashboardCopilot {
    const modeloPowerBi: ModeloPowerBi = {
      id: "pbi-01",
      demanda_id: "dem-01",
      modelo_analitico_id: "mod-01",
      nome_arquivo: "RelatorioVendas.pbip",
      caminho_local: "C:/Projetos/BI/RelatorioVendas.pbip",
      tipo_formato: TipoFormatoModeloPowerBi.PBIP,
      status: StatusModeloPowerBi.EM_DESENVOLVIMENTO,
      justificativa_isencao: null,
      hash_sha256: "hash123",
      versao_powerbi: "2.126.0",
      tamanho_bytes: 2048,
      criado_em: "2026-09-30T10:00:00Z",
      atualizado_em: "2026-09-30T10:00:00Z",
    };

    const medidas: MedidaDax[] = [
      {
        id: "dax-01",
        modelo_powerbi_id: "pbi-01",
        metrica_analitica_id: "met-01",
        nome: "Total Vendas",
        tabela_hospedeira: "_Medidas",
        expressao_dax: "SUM(FatoVendas[valor_venda])",
        descricao: "Faturamento bruto total realizado",
        formato_string: "R$ #,##0.00",
        categoria_dax: CategoriaMedidaDax.AGREGACAO_SIMPLES,
        ordem: 1,
        criado_em: "2026-09-30T10:00:00Z",
        atualizado_em: "2026-09-30T10:00:00Z",
      },
    ];

    const paginas: PaginaRelatorio[] = [
      {
        id: "pag-01",
        modelo_powerbi_id: "pbi-01",
        nome: "Visão Executiva",
        ordem: 1,
        objetivo_analitico: "Monitorar o faturamento global e metas mensais da companhia.",
        publico_alvo: PublicoAlvoPagina.EXECUTIVO,
        layout_grid: LayoutGridPagina.PADRAO_16_9,
        criado_em: "2026-09-30T10:00:00Z",
        atualizado_em: "2026-09-30T10:00:00Z",
      },
    ];

    const visuais: VisualDashboard[] = [
      {
        id: "vis-01",
        pagina_id: "pag-01",
        titulo: "Receita Total Realizada",
        tipo_visual: TipoVisualDashboard.CARTAO_KPI,
        posicao_layout: PosicaoLayoutVisual.TOPO_KPIS,
        medidas_utilizadas_ids: ["dax-01"],
        atributos_utilizados_ids: [],
        justificativa_dataviz: "Cartão de KPI para destaque do faturamento.",
        ordem: 1,
        criado_em: "2026-09-30T10:00:00Z",
        atualizado_em: "2026-09-30T10:00:00Z",
      },
    ];

    const modeloAnalitico: ModeloAnaliticoCompleto = {
      id: "mod-01",
      demanda_id: "dem-01",
      nome: "Modelo Vendas Star",
      tipo_arquitetura: TipoArquiteturaModelo.ESTRELA,
      status: StatusModeloAnalitico.HOMOLOGADO,
      dataset_autorizado_id: "ds-01",
      descricao: null,
      justificativa_homologacao: "Homologado",
      homologado_por: "Analista",
      homologado_em: "2026-09-30T09:00:00Z",
      revogado_em: null,
      motivo_revogacao: null,
      criado_em: "2026-09-30T08:00:00Z",
      atualizado_em: "2026-09-30T09:00:00Z",
      entidades: [],
      relacionamentos: [],
      metricas: [
        {
          id: "met-01",
          modelo_id: "mod-01",
          entidade_id: "ent-01",
          nome: "Faturamento Bruto",
          tipo_agregacao: "SOMA" as any,
          tipo_aditividade: "TOTALMENTE_ADITIVA" as any,
          unidade_medida: "MOEDA" as any,
          formula_declarativa: "SUM(valor)",
          formato_exibicao: "R$ #,##0.00",
          status: "HOMOLOGADA" as any,
          atributos_dependentes_ids: [],
          metricas_dependentes_ids: [],
          pergunta_negocio_associada: "Qual o faturamento bruto total do período?",
          objetivo_negocio_associado: "Acompanhar receita",
          descricao: "Faturamento bruto total",
          ordem: 1,
          criado_em: "2026-09-30T08:00:00Z",
          atualizado_em: "2026-09-30T08:00:00Z",
        },
      ],
    };

    return {
      demandaId: "dem-01",
      estadoDemanda: "EM_DESENVOLVIMENTO",
      modeloPowerBi,
      medidas,
      paginas,
      visuais,
      modeloAnalitico,
      resultadoConformidadeDax: null,
    };
  }

  // =========================================================================
  // Testes de Fundamentos: Determinismo, Não-Bloqueio e Imutabilidade
  // =========================================================================
  describe("Fundamentos Arquiteturais", () => {
    it("mesmo contexto produz exatamente os mesmos insights de forma determinística", () => {
      const ctx = criarContextoPadrao();
      const res1 = DashboardCopilotEngine.analisar(ctx);
      const res2 = DashboardCopilotEngine.analisar(ctx);

      expect(res1.total_insights).toBe(res2.total_insights);
      expect(res1.insights.map((i) => i.id)).toEqual(res2.insights.map((i) => i.id));
      expect(res1.insights.map((i) => i.titulo)).toEqual(res2.insights.map((i) => i.titulo));
      expect(res1.resumo_contexto).toEqual(res2.resumo_contexto);
    });

    it("ordem dos insights respeita estritamente o nível de prioridade (1 a 6)", () => {
      const ctx = criarContextoPadrao();
      const res = DashboardCopilotEngine.analisar(ctx);

      for (let i = 0; i < res.insights.length - 1; i++) {
        const atual = res.insights[i];
        const proximo = res.insights[i + 1];
        expect(atual.ordemPrioridade).toBeLessThanOrEqual(proximo.ordemPrioridade);
      }
    });

    it("Copiloto NUNCA produz BLOQUEIO e limita-se a naturezas orientativas", () => {
      const ctx = criarContextoPadrao();
      ctx.paginas = [];
      ctx.visuais = [];

      const res = DashboardCopilotEngine.analisar(ctx);
      expect(res.total_insights).toBeGreaterThan(0);

      for (const insight of res.insights) {
        expect(insight.natureza).not.toBe("BLOQUEIO");
        expect(["ORIENTACAO", "OPORTUNIDADE", "SUGESTAO"]).toContain(insight.natureza);
      }
    });

    it("Copiloto não altera prontidão do Dashboard nem autoridade do Motor D-01 a D-08", () => {
      const mockResultadoMotorDax: ResultadoProntidaoDashboard = {
        modelo_powerbi_id: "pbi-01",
        demanda_id: "dem-01",
        status_geral: "BLOQUEIO",
        apto_para_validacao: false,
        isento_powerbi: false,
        total_bloqueios: 2,
        total_alertas_criticos: 1,
        total_recomendacoes: 1,
        diagnosticos: [],
        resumo: {
          total_medidas: 2,
          total_paginas: 1,
          total_visuais: 1,
          metricas_homologadas_cobertas: 1,
          total_metricas_homologadas: 1,
        },
        avaliado_em: "2026-09-30T10:00:00Z",
      };

      const ctx = criarContextoPadrao();
      ctx.resultadoConformidadeDax = mockResultadoMotorDax;

      const resCopilot = DashboardCopilotEngine.analisar(ctx);
      expect((resCopilot as any).apto_para_validacao).toBeUndefined();
      expect((resCopilot as any).status_geral).toBeUndefined();
      expect(ctx.resultadoConformidadeDax.apto_para_validacao).toBe(false);
      expect(ctx.resultadoConformidadeDax.status_geral).toBe("BLOQUEIO");
    });

    it("avaliação não modifica o objeto de contexto recebido (pureza e imutabilidade)", () => {
      const ctx = criarContextoPadrao();
      const snapshotOriginal = JSON.parse(JSON.stringify(ctx));

      Object.freeze(ctx.medidas);
      Object.freeze(ctx.paginas);
      Object.freeze(ctx.visuais);

      const res = DashboardCopilotEngine.analisar(ctx);
      expect(res).toBeDefined();
      expect(JSON.parse(JSON.stringify(ctx))).toEqual(snapshotOriginal);
    });

    it("contexto vazio ou nulo é tratado com segurança sem exceções", () => {
      const resVazio = DashboardCopilotEngine.analisar({
        modeloPowerBi: null,
        medidas: [],
        paginas: [],
        visuais: [],
      });
      expect(resVazio.total_insights).toBeGreaterThanOrEqual(1);
      expect(resVazio.resumo_contexto.possui_modelo).toBe(false);
    });

    it("executa de forma 100% autônoma e síncrona sem requisições de rede ou LLM", () => {
      const ctx = criarContextoPadrao();
      const inicio = performance.now();
      const res = DashboardCopilotEngine.analisar(ctx);
      const duracao = performance.now() - inicio;

      expect(duracao).toBeLessThan(50);
      expect(res.insights.length).toBeGreaterThan(0);
      res.insights.forEach((insight) => {
        expect(insight.fatoDetectado).toBeDefined();
        expect(insight.oportunidade).toBeDefined();
        expect(insight.sugestaoAcao).toBeDefined();
        expect(insight.pedagogico.conceitoChave).toBeDefined();
        if (insight.proximaAcaoSugerida) {
          expect(insight.proximaAcaoSugerida.requerIntervencaoHumana).toBe(true);
        }
      });
    });
  });

  // =========================================================================
  // Estratégia 1: Inteligência Temporal (Time Intelligence)
  // =========================================================================
  describe("Estratégia 1: Inteligência Temporal", () => {
    it("deve sugerir Time Intelligence quando há dimensão calendário e métrica aditiva sem cálculo temporal", () => {
      const ctx = criarContextoPadrao();
      ctx.modeloAnalitico!.entidades = [
        {
          id: "dim-cal",
          modelo_id: "mod-01",
          ativo_dados_id: null,
          nome: "DimCalendario",
          tipo: TipoEntidadeAnalitica.DIMENSAO,
          papel: PapelEntidadeAnalitica.DIMENSAO_CALENDARIO,
          origem_tipo: TipoOrigemEntidade.DIMENSAO_SISTEMA,
          ordem_apresentacao: 1,
          descricao: "Dimensão de tempo para análise temporal",
          criado_em: "2026-09-30T10:00:00Z",
          atualizado_em: "2026-09-30T10:00:00Z",
          atributos: [],
        },
      ];

      const res = DashboardCopilotEngine.analisar(ctx);
      const insightTime = res.insights.find((i) => i.codigo === "D-COP-TIME-01");

      expect(insightTime).toBeDefined();
      expect(insightTime?.categoria).toBe("INTELIGENCIA_TEMPORAL");
      expect(insightTime?.natureza).toBe("OPORTUNIDADE");
      expect(insightTime?.ordemPrioridade).toBe(3);
      expect(insightTime?.titulo).toContain("Oportunidade de Análise Temporal");
      expect(insightTime?.fatoDetectado).toContain("Dimensão temporal");
    });

    it("NÃO deve inventar Time Intelligence se não há dimensão calendário nem atributos de data", () => {
      const ctx = criarContextoPadrao();
      ctx.modeloAnalitico!.entidades = [
        {
          id: "dim-cli",
          modelo_id: "mod-01",
          ativo_dados_id: null,
          nome: "DimCliente",
          tipo: TipoEntidadeAnalitica.DIMENSAO,
          papel: PapelEntidadeAnalitica.DIMENSAO_PADRAO,
          origem_tipo: TipoOrigemEntidade.DIMENSAO_SISTEMA,
          ordem_apresentacao: 1,
          descricao: "Dados de clientes",
          criado_em: "2026-09-30T10:00:00Z",
          atualizado_em: "2026-09-30T10:00:00Z",
          atributos: [
            {
              id: "a1",
              entidade_id: "dim-cli",
              nome_original: "Nome",
              nome_amigavel: "Nome",
              tipo_dado: TipoDadoAnalitico.TEXTO,
              papel: "DIMENSAO" as any,
              ordem: 1,
              oculto: false,
              descricao: null,
              formato_exibicao: null,
              criado_em: "2026-09-30T10:00:00Z",
              atualizado_em: "2026-09-30T10:00:00Z",
            },
          ],
        },
      ];

      const res = DashboardCopilotEngine.analisar(ctx);
      const insightTime = res.insights.find((i) => i.codigo === "D-COP-TIME-01");

      expect(insightTime).toBeUndefined();
    });

    it("NÃO deve sugerir Time Intelligence se o modelo já possui medidas com SAMEPERIODLASTYEAR ou YTD", () => {
      const ctx = criarContextoPadrao();
      ctx.modeloAnalitico!.entidades = [
        {
          id: "dim-cal",
          modelo_id: "mod-01",
          ativo_dados_id: null,
          nome: "d_tempo",
          tipo: TipoEntidadeAnalitica.DIMENSAO,
          papel: PapelEntidadeAnalitica.DIMENSAO_CALENDARIO,
          origem_tipo: TipoOrigemEntidade.DIMENSAO_SISTEMA,
          ordem_apresentacao: 1,
          descricao: "Calendario",
          criado_em: "2026-09-30T10:00:00Z",
          atualizado_em: "2026-09-30T10:00:00Z",
          atributos: [],
        },
      ];
      ctx.medidas.push({
        id: "dax-yoy",
        modelo_powerbi_id: "pbi-01",
        metrica_analitica_id: null,
        nome: "Vendas YoY",
        tabela_hospedeira: "_Medidas",
        expressao_dax: "CALCULATE([Total Vendas], SAMEPERIODLASTYEAR(d_tempo[Data]))",
        descricao: "Crescimento anual",
        formato_string: "0.0%",
        categoria_dax: CategoriaMedidaDax.TIME_INTELLIGENCE,
        ordem: 2,
        criado_em: "2026-09-30T10:00:00Z",
        atualizado_em: "2026-09-30T10:00:00Z",
      });

      const res = DashboardCopilotEngine.analisar(ctx);
      const insightTime = res.insights.find((i) => i.codigo === "D-COP-TIME-01");

      expect(insightTime).toBeUndefined();
    });
  });

  // =========================================================================
  // Estratégia 2: KPI sem Contexto Comparativo
  // =========================================================================
  describe("Estratégia 2: KPI sem Contexto Comparativo", () => {
    it("deve sugerir contexto comparativo para Cartão de KPI que exibe apenas valor absoluto", () => {
      const ctx = criarContextoPadrao();
      const res = DashboardCopilotEngine.analisar(ctx);
      const insightKpi = res.insights.find((i) => i.codigo === "D-COP-KPI-COMP-01");

      expect(insightKpi).toBeDefined();
      expect(insightKpi?.categoria).toBe("CONTEXTO_COMPARATIVO");
      expect(insightKpi?.natureza).toBe("OPORTUNIDADE");
      expect(insightKpi?.titulo).toContain("Contexto Comparativo no Cartão");
      expect(insightKpi?.oportunidade).toContain("Apresentar simultaneamente o valor realizado e a taxa de atingimento");
    });

    it("NÃO deve sugerir comparativo quando o cartão já exibe taxa, percentual ou meta", () => {
      const ctx = criarContextoPadrao();
      // Troca a medida do cartão para Margem Percentual
      ctx.medidas[0].nome = "Margem Percentual";
      ctx.medidas[0].formato_string = "0.0%";

      const res = DashboardCopilotEngine.analisar(ctx);
      const insightKpi = res.insights.find((i) => i.codigo === "D-COP-KPI-COMP-01");

      expect(insightKpi).toBeUndefined();
    });
  });

  // =========================================================================
  // Estratégia 3: Pergunta de Negócio sem Cobertura
  // =========================================================================
  describe("Estratégia 3: Pergunta de Negócio sem Cobertura", () => {
    it("deve detectar pergunta de negócio sem cobertura visual com Prioridade 1", () => {
      const ctx = criarContextoPadrao();
      // Adiciona métrica 2 com pergunta, mas sem medida cadastrada
      ctx.modeloAnalitico!.metricas.push({
        id: "met-02",
        modelo_id: "mod-01",
        entidade_id: "ent-01",
        nome: "Ticket Médio",
        tipo_agregacao: "MEDIA" as any,
        tipo_aditividade: "NAO_ADITIVA" as any,
        unidade_medida: "MOEDA" as any,
        formula_declarativa: "DIVIDE(SUM(valor), COUNT(id))",
        formato_exibicao: "R$ #,##0.00",
        status: "HOMOLOGADA" as any,
        atributos_dependentes_ids: [],
        metricas_dependentes_ids: [],
        pergunta_negocio_associada: "Qual o ticket médio por compra no mês?",
        objetivo_negocio_associado: "Monitorar qualidade do ticket",
        descricao: null,
        ordem: 2,
        criado_em: "2026-09-30T08:00:00Z",
        atualizado_em: "2026-09-30T08:00:00Z",
      });

      const res = DashboardCopilotEngine.analisar(ctx);
      const insightPergunta = res.insights.find(
        (i) => i.codigo === "D-COP-PERGUNTA-01" && i.titulo.includes("Qual o ticket médio")
      );

      expect(insightPergunta).toBeDefined();
      expect(insightPergunta?.prioridade).toBe("PRIORIDADE_1_PERGUNTA_SEM_COBERTURA");
      expect(insightPergunta?.ordemPrioridade).toBe(1);
      expect(res.insight_principal?.id).toBe(insightPergunta?.id);
      expect(res.proxima_acao_principal?.tipo).toBe("COBRIR_PERGUNTA_NEGOCIO");
    });

    it("NÃO deve gerar falsa lacuna se a pergunta já possui Métrica -> DAX -> Visual", () => {
      const ctx = criarContextoPadrao();
      // met-01 tem pergunta e já tem dax-01 associada ao vis-01
      const res = DashboardCopilotEngine.analisar(ctx);
      const insightPergunta = res.insights.find(
        (i) => i.codigo === "D-COP-PERGUNTA-01" && i.entidadesRelacionadas.some((e) => e.id === "met-01")
      );

      expect(insightPergunta).toBeUndefined();
    });
  });

  // =========================================================================
  // Estratégia 4: Medida sem Representação Analítica
  // =========================================================================
  describe("Estratégia 4: Medida sem Representação Analítica", () => {
    it("deve sugerir revisão para medida final cadastrada que não aparece em nenhum visual", () => {
      const ctx = criarContextoPadrao();
      // Adiciona dax-02 sem vincular ao visual
      ctx.medidas.push({
        id: "dax-02",
        modelo_powerbi_id: "pbi-01",
        metrica_analitica_id: null,
        nome: "Desconto Total",
        tabela_hospedeira: "_Medidas",
        expressao_dax: "SUM(FatoVendas[desconto])",
        descricao: "Descontos concedidos",
        formato_string: "R$ #,##0.00",
        categoria_dax: CategoriaMedidaDax.AGREGACAO_SIMPLES,
        ordem: 2,
        criado_em: "2026-09-30T10:00:00Z",
        atualizado_em: "2026-09-30T10:00:00Z",
      });

      const res = DashboardCopilotEngine.analisar(ctx);
      const insightOrfa = res.insights.find(
        (i) => i.codigo === "D-COP-MEDIDA-ORFA-01" && i.titulo.includes("Desconto Total")
      );

      expect(insightOrfa).toBeDefined();
      expect(insightOrfa?.natureza).toBe("SUGESTAO");
      expect(insightOrfa?.explicacao).toContain("etapas intermediárias de apoio");
    });

    it("NÃO deve gerar falso alarme para medida explicitamente documentada como auxiliar", () => {
      const ctx = criarContextoPadrao();
      ctx.medidas.push({
        id: "dax-aux",
        modelo_powerbi_id: "pbi-01",
        metrica_analitica_id: null,
        nome: "_DenominadorQtd",
        tabela_hospedeira: "_Medidas",
        expressao_dax: "COUNT(FatoVendas[id])",
        descricao: "Cálculo auxiliar interno de apoio",
        formato_string: "#,##0",
        categoria_dax: CategoriaMedidaDax.AGREGACAO_SIMPLES,
        ordem: 2,
        criado_em: "2026-09-30T10:00:00Z",
        atualizado_em: "2026-09-30T10:00:00Z",
      });

      const res = DashboardCopilotEngine.analisar(ctx);
      const insightOrfa = res.insights.find(
        (i) => i.codigo === "D-COP-MEDIDA-ORFA-01" && i.titulo.includes("_DenominadorQtd")
      );

      expect(insightOrfa).toBeUndefined();
    });
  });

  // =========================================================================
  // Estratégia 5: Página sem Foco Analítico Claro
  // =========================================================================
  describe("Estratégia 5: Página sem Foco Analítico Claro", () => {
    it("deve detectar página com objetivo curto ou genérico", () => {
      const ctx = criarContextoPadrao();
      ctx.paginas[0].objetivo_analitico = "Página 1";

      const res = DashboardCopilotEngine.analisar(ctx);
      const insightFoco = res.insights.find((i) => i.codigo === "D-COP-PAG-FOCO-01");

      expect(insightFoco).toBeDefined();
      expect(insightFoco?.titulo).toContain("Refinamento do Foco Analítico");
      expect(insightFoco?.fatoDetectado).toContain("classificado como termo genérico");
    });

    it("NÃO deve gerar insight se o objetivo da página for descritivo e substancial", () => {
      const ctx = criarContextoPadrao();
      ctx.paginas[0].objetivo_analitico =
        "Monitorar o faturamento diário consolidado e desvios de metas por filial.";

      const res = DashboardCopilotEngine.analisar(ctx);
      const insightFoco = res.insights.find((i) => i.codigo === "D-COP-PAG-FOCO-01");

      expect(insightFoco).toBeUndefined();
    });
  });

  // =========================================================================
  // Estratégia 6: Filtros e Segmentações (Slicers)
  // =========================================================================
  describe("Estratégia 6: Filtros e Segmentações", () => {
    it("deve sugerir segmentador quando há dimensão analítica relevante e múltiplos visuais", () => {
      const ctx = criarContextoPadrao();
      ctx.visuais.push({
        id: "vis-02",
        pagina_id: "pag-01",
        titulo: "Vendas por Mês",
        tipo_visual: TipoVisualDashboard.GRAFICO_LINHAS,
        posicao_layout: PosicaoLayoutVisual.CENTRAL_TENDENCIAS,
        medidas_utilizadas_ids: ["dax-01"],
        atributos_utilizados_ids: [],
        justificativa_dataviz: "Tendência",
        ordem: 2,
        criado_em: "2026-09-30T10:00:00Z",
        atualizado_em: "2026-09-30T10:00:00Z",
      });

      ctx.modeloAnalitico!.entidades = [
        {
          id: "dim-canal",
          modelo_id: "mod-01",
          ativo_dados_id: null,
          nome: "DimCanalVendas",
          tipo: TipoEntidadeAnalitica.DIMENSAO,
          papel: PapelEntidadeAnalitica.DIMENSAO_PADRAO,
          origem_tipo: TipoOrigemEntidade.DIMENSAO_SISTEMA,
          ordem_apresentacao: 1,
          descricao: "Canais de venda",
          criado_em: "2026-09-30T10:00:00Z",
          atualizado_em: "2026-09-30T10:00:00Z",
          atributos: [],
        },
      ];

      const res = DashboardCopilotEngine.analisar(ctx);
      const insightSlicer = res.insights.find((i) => i.codigo === "D-COP-SLICER-01");

      expect(insightSlicer).toBeDefined();
      expect(insightSlicer?.titulo).toContain("DimCanalVendas");
    });

    it("NÃO deve sugerir segmentador se o dashboard já possui visual SEGMENTADOR_DADOS", () => {
      const ctx = criarContextoPadrao();
      ctx.visuais.push(
        {
          id: "vis-02",
          pagina_id: "pag-01",
          titulo: "Vendas",
          tipo_visual: TipoVisualDashboard.GRAFICO_BARRAS,
          posicao_layout: PosicaoLayoutVisual.INFERIOR_DETALHES,
          medidas_utilizadas_ids: ["dax-01"],
          atributos_utilizados_ids: [],
          justificativa_dataviz: "Gráfico",
          ordem: 2,
          criado_em: "2026-09-30T10:00:00Z",
          atualizado_em: "2026-09-30T10:00:00Z",
        },
        {
          id: "vis-slicer",
          pagina_id: "pag-01",
          titulo: "Filtro Canal",
          tipo_visual: TipoVisualDashboard.OUTRO,
          posicao_layout: PosicaoLayoutVisual.LATERAL_FILTROS,
          medidas_utilizadas_ids: [],
          atributos_utilizados_ids: ["att-canal"],
          justificativa_dataviz: "Segmentador de dados de canal",
          ordem: 3,
          criado_em: "2026-09-30T10:00:00Z",
          atualizado_em: "2026-09-30T10:00:00Z",
        }
      );

      const res = DashboardCopilotEngine.analisar(ctx);
      const insightSlicer = res.insights.find((i) => i.codigo === "D-COP-SLICER-01");

      expect(insightSlicer).toBeUndefined();
    });
  });

  // =========================================================================
  // Estratégia 7: Drill-Through e Tooltip de Página
  // =========================================================================
  describe("Estratégia 7: Drill-Through e Tooltip", () => {
    it("deve sugerir Drill-Through quando há página executiva e página de detalhamento", () => {
      const ctx = criarContextoPadrao();
      ctx.paginas.push({
        id: "pag-02",
        modelo_powerbi_id: "pbi-01",
        nome: "Detalhamento Operacional de Vendas",
        ordem: 2,
        objetivo_analitico: "Permitir inspeção detalhada por transação e produto.",
        publico_alvo: PublicoAlvoPagina.OPERACIONAL,
        layout_grid: LayoutGridPagina.PADRAO_16_9,
        criado_em: "2026-09-30T10:00:00Z",
        atualizado_em: "2026-09-30T10:00:00Z",
      });

      const res = DashboardCopilotEngine.analisar(ctx);
      const insightDrill = res.insights.find((i) => i.codigo === "D-COP-DRILL-01");

      expect(insightDrill).toBeDefined();
      expect(insightDrill?.titulo).toContain("Drill-Through para \"Detalhamento Operacional de Vendas\"");
    });

    it("NÃO deve sugerir drill-through se há apenas uma página no relatório", () => {
      const ctx = criarContextoPadrao();
      expect(ctx.paginas).toHaveLength(1);

      const res = DashboardCopilotEngine.analisar(ctx);
      const insightDrill = res.insights.find((i) => i.codigo === "D-COP-DRILL-01");

      expect(insightDrill).toBeUndefined();
    });
  });

  // =========================================================================
  // Estratégia 8: Consistência Semântica e Nomenclatura
  // =========================================================================
  describe("Estratégia 8: Consistência Semântica", () => {
    it("deve sugerir padronização para medida com prefixo ou nomenclatura técnica de código", () => {
      const ctx = criarContextoPadrao();
      ctx.medidas[0].nome = "calc_total_vendas_faturadas";

      const res = DashboardCopilotEngine.analisar(ctx);
      const insightNome = res.insights.find((i) => i.codigo === "D-COP-SEMANTICA-01");

      expect(insightNome).toBeDefined();
      expect(insightNome?.titulo).toContain("Nomenclatura Amigável");
      expect(insightNome?.fatoDetectado).toContain("convenção de nomenclatura de desenvolvimento");
    });

    it("deve sugerir documentação quando a medida não possui descrição funcional", () => {
      const ctx = criarContextoPadrao();
      ctx.medidas[0].descricao = "";

      const res = DashboardCopilotEngine.analisar(ctx);
      const insightDesc = res.insights.find((i) => i.codigo === "D-COP-SEMANTICA-02");

      expect(insightDesc).toBeDefined();
      expect(insightDesc?.titulo).toContain("Documentação do Significado de Negócio");
    });

    it("NÃO deve gerar insight de semântica se o nome é amigável e a descrição está preenchida", () => {
      const ctx = criarContextoPadrao();
      ctx.medidas[0].nome = "Total Vendas";
      ctx.medidas[0].descricao = "Soma total do faturamento bruto";

      const res = DashboardCopilotEngine.analisar(ctx);
      const insightNome = res.insights.find(
        (i) => i.codigo === "D-COP-SEMANTICA-01" && i.entidadesRelacionadas.some((e) => e.id === "dax-01")
      );
      const insightDesc = res.insights.find(
        (i) => i.codigo === "D-COP-SEMANTICA-02" && i.entidadesRelacionadas.some((e) => e.id === "dax-01")
      );

      expect(insightNome).toBeUndefined();
      expect(insightDesc).toBeUndefined();
    });
  });

  // =========================================================================
  // Extensibilidade Plugável
  // =========================================================================
  describe("Extensibilidade Plugável", () => {
    it("suporta extensão por novas estratégias plugáveis sem modificar o núcleo", () => {
      const estrategiaCustomizada: EstrategiaInsightDashboard = {
        codigo: "D-COP-CUSTOM-TEST",
        executar: (ctx) => [
          {
            id: `custom-test:${ctx.demandaId ?? "default"}`,
            codigo: "D-COP-CUSTOM-TEST-01",
            categoria: "EXPERIENCIA_VISUAL",
            natureza: "SUGESTAO",
            prioridade: "PRIORIDADE_6_REFINAMENTO",
            ordemPrioridade: 6,
            titulo: "Insight Customizado de Teste",
            deteccao: "Detectado em teste de extensibilidade.",
            explicacao: "Verifica se novas estratégias podem ser plugadas com segurança.",
            recomendacao: "Manter arquitetura aberta a novas regras.",
            fatoDetectado: "Evidência customizada.",
            oportunidade: "Extensão modular.",
            sugestaoAcao: "Validar plugabilidade.",
            proximaAcaoSugerida: {
              tipo: "NENHUMA",
              titulo: "Nenhuma ação automática",
              descricao: "Demonstração de plugabilidade.",
              requerIntervencaoHumana: true,
            },
            pedagogico: {
              conceitoChave: "Extensibilidade Arquitetural",
              porQueImporta: "Permite adicionar novas heurísticas sem alterar o núcleo.",
              dicaProfissional: "Prefira composição de regras sobre condicionais aninhadas.",
            },
            entidadesRelacionadas: [],
          },
        ],
      };

      const ctx = criarContextoPadrao();
      const res = DashboardCopilotEngine.analisar(ctx, [estrategiaCustomizada]);

      expect(res.total_insights).toBe(1);
      expect(res.insights[0].codigo).toBe("D-COP-CUSTOM-TEST-01");
      expect(res.insights[0].titulo).toBe("Insight Customizado de Teste");
    });
  });
});
