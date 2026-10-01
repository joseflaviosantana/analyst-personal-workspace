import { describe, it, expect } from "vitest";
import {
  DashboardRulesEvaluator,
  ContextoAvaliacaoDashboard,
} from "@/core/domain/rules/dashboard-rules-evaluator";
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
import { StatusMetricaAnalitica } from "@/core/domain/enums/status-metrica-analitica";
import { TipoAgregacaoMetrica } from "@/core/domain/enums/tipo-agregacao-metrica";
import { TipoAditividadeMetrica } from "@/core/domain/enums/tipo-aditividade-metrica";
import { UnidadeMedidaMetrica } from "@/core/domain/enums/unidade-medida-metrica";

describe("DashboardRulesEvaluator — Regras Determinísticas D-01 a D-08", () => {
  // Fábrica auxiliar para cenário totalmente conforme
  function criarCenarioValidoCompleto(): ContextoAvaliacaoDashboard {
    const modeloPowerBi: ModeloPowerBi = {
      id: "pbi-01",
      demanda_id: "dem-01",
      modelo_analitico_id: "mod-01",
      nome_arquivo: "VendasAnalytics.pbip",
      caminho_local: "C:/Projetos/BI/VendasAnalytics.pbip",
      tipo_formato: TipoFormatoModeloPowerBi.PBIP,
      status: StatusModeloPowerBi.EM_DESENVOLVIMENTO,
      justificativa_isencao: null,
      hash_sha256: "abc123hash",
      versao_powerbi: "2.126.927.0",
      tamanho_bytes: 4096,
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
        descricao: "Faturamento bruto total",
        formato_string: "R$ #,##0.00",
        categoria_dax: CategoriaMedidaDax.AGREGACAO_SIMPLES,
        ordem: 1,
        criado_em: "2026-09-30T10:00:00Z",
        atualizado_em: "2026-09-30T10:00:00Z",
      },
      {
        id: "dax-02",
        modelo_powerbi_id: "pbi-01",
        metrica_analitica_id: "met-02",
        nome: "Ticket Médio",
        tabela_hospedeira: "_Medidas",
        expressao_dax: "DIVIDE([Total Vendas], [Qtd Transacoes], 0)",
        descricao: "Valor médio por venda",
        formato_string: "R$ #,##0.00",
        categoria_dax: CategoriaMedidaDax.TAXA_DIVISAO,
        ordem: 2,
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
        objetivo_analitico: "Monitorar o faturamento global e ticket médio mensal.",
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
        justificativa_dataviz: "Cartão de KPI para destaque imediato do indicador principal.",
        ordem: 1,
        criado_em: "2026-09-30T10:00:00Z",
        atualizado_em: "2026-09-30T10:00:00Z",
      },
      {
        id: "vis-02",
        pagina_id: "pag-01",
        titulo: "Ticket Médio por Período",
        tipo_visual: TipoVisualDashboard.GRAFICO_LINHAS,
        posicao_layout: PosicaoLayoutVisual.CENTRAL_TENDENCIAS,
        medidas_utilizadas_ids: ["dax-02"],
        atributos_utilizados_ids: ["att-data"],
        justificativa_dataviz: "Gráfico de linhas para avaliação de evolução e tendência temporal.",
        ordem: 2,
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
      descricao: "Modelo analítico de vendas",
      justificativa_homologacao: "Homologado formalmente com regras M-01 a M-11",
      homologado_por: "Analista Sênior",
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
          entidade_id: "ent-fato",
          nome: "Faturamento Bruto",
          tipo_agregacao: TipoAgregacaoMetrica.SOMA,
          tipo_aditividade: TipoAditividadeMetrica.TOTALMENTE_ADITIVA,
          unidade_medida: UnidadeMedidaMetrica.MOEDA,
          formula_declarativa: "SUM(valor_venda)",
          formato_exibicao: "R$ #,##0.00",
          status: StatusMetricaAnalitica.HOMOLOGADA,
          atributos_dependentes_ids: ["att-val"],
          metricas_dependentes_ids: [],
          pergunta_negocio_associada: "Qual a receita total?",
          objetivo_negocio_associado: "Acompanhar faturamento",
          descricao: "Valor total de vendas",
          ordem: 1,
          criado_em: "2026-09-30T08:00:00Z",
          atualizado_em: "2026-09-30T08:00:00Z",
        },
        {
          id: "met-02",
          modelo_id: "mod-01",
          entidade_id: "ent-fato",
          nome: "Ticket Médio",
          tipo_agregacao: TipoAgregacaoMetrica.MEDIA,
          tipo_aditividade: TipoAditividadeMetrica.NAO_ADITIVA,
          unidade_medida: UnidadeMedidaMetrica.MOEDA,
          formula_declarativa: "DIVIDE(SUM(valor), COUNT(id))",
          formato_exibicao: "R$ #,##0.00",
          status: StatusMetricaAnalitica.HOMOLOGADA,
          atributos_dependentes_ids: [],
          metricas_dependentes_ids: ["met-01"],
          pergunta_negocio_associada: "Qual o ticket médio por venda?",
          objetivo_negocio_associado: "Medir qualidade do ticket",
          descricao: "Média de valor por venda",
          ordem: 2,
          criado_em: "2026-09-30T08:00:00Z",
          atualizado_em: "2026-09-30T08:00:00Z",
        },
      ],
    };

    return { modeloPowerBi, medidas, paginas, visuais, modeloAnalitico };
  }

  // =========================================================================
  // Testes de Cenário Conforme e Determinismo
  // =========================================================================
  describe("Cenário Conforme e Determinismo", () => {
    it("deve avaliar como CONFORME e apto para validação quando o dashboard atende a todos os critérios", () => {
      const contexto = criarCenarioValidoCompleto();
      const resultado = DashboardRulesEvaluator.avaliar(contexto);

      expect(resultado.status_geral).toBe("CONFORME");
      expect(resultado.apto_para_validacao).toBe(true);
      expect(resultado.total_bloqueios).toBe(0);
      expect(resultado.total_alertas_criticos).toBe(0);
      expect(resultado.total_recomendacoes).toBe(0);
      expect(resultado.diagnosticos).toHaveLength(0);
      expect(resultado.resumo.metricas_homologadas_cobertas).toBe(2);
      expect(resultado.resumo.total_metricas_homologadas).toBe(2);
      expect(resultado.resumo.total_medidas).toBe(2);
      expect(resultado.resumo.total_paginas).toBe(1);
      expect(resultado.resumo.total_visuais).toBe(2);
    });

    it("deve ser estritamente determinístico: mesma entrada produz idênticos resultados", () => {
      const contexto = criarCenarioValidoCompleto();
      const res1 = DashboardRulesEvaluator.avaliar(contexto);
      const res2 = DashboardRulesEvaluator.avaliar(contexto);

      expect(res1.status_geral).toBe(res2.status_geral);
      expect(res1.apto_para_validacao).toBe(res2.apto_para_validacao);
      expect(res1.total_bloqueios).toBe(res2.total_bloqueios);
      expect(res1.total_alertas_criticos).toBe(res2.total_alertas_criticos);
      expect(res1.diagnosticos.map((d) => d.codigo_regra)).toEqual(
        res2.diagnosticos.map((d) => d.codigo_regra)
      );
    });
  });

  // =========================================================================
  // D-01: Existência e Estado Válido do Modelo Power BI
  // =========================================================================
  describe("D-01: Existência e Estado Válido", () => {
    it("deve gerar BLOQUEIO quando modeloPowerBi for null", () => {
      const res = DashboardRulesEvaluator.avaliar({
        modeloPowerBi: null,
        medidas: [],
        paginas: [],
        visuais: [],
      });

      expect(res.status_geral).toBe("BLOQUEIO");
      expect(res.apto_para_validacao).toBe(false);
      expect(res.total_bloqueios).toBeGreaterThanOrEqual(1);

      const d01 = res.diagnosticos.find((d) => d.codigo_regra === "D-01");
      expect(d01).toBeDefined();
      expect(d01?.severidade).toBe("BLOQUEIO");
      expect(d01?.titulo).toContain("Modelo Power BI Não Declarado");
    });

    it("deve gerar BLOQUEIO quando modelo normal possui nome_arquivo vazio", () => {
      const ctx = criarCenarioValidoCompleto();
      ctx.modeloPowerBi!.nome_arquivo = "   ";

      const res = DashboardRulesEvaluator.avaliar(ctx);
      const d01 = res.diagnosticos.find(
        (d) => d.codigo_regra === "D-01" && d.titulo.includes("Nome de Arquivo")
      );
      expect(d01).toBeDefined();
      expect(d01?.severidade).toBe("BLOQUEIO");
    });

    it("deve gerar ALERTA_CRITICO quando status for indefinido", () => {
      const ctx = criarCenarioValidoCompleto();
      (ctx.modeloPowerBi as any).status = null;

      const res = DashboardRulesEvaluator.avaliar(ctx);
      const d01 = res.diagnosticos.find(
        (d) => d.codigo_regra === "D-01" && d.titulo.includes("Status Indefinido")
      );
      expect(d01).toBeDefined();
      expect(d01?.severidade).toBe("ALERTA_CRITICO");
    });
  });

  // =========================================================================
  // Modo ISENTO_EXCEL_ONLY
  // =========================================================================
  describe("ISENTO_EXCEL_ONLY: Comportamento sem falsos positivos", () => {
    it("deve aprovar como CONFORME quando ISENTO_EXCEL_ONLY possui justificativa formal válida", () => {
      const modeloIsento: ModeloPowerBi = {
        id: "pbi-isento",
        demanda_id: "dem-02",
        modelo_analitico_id: null,
        nome_arquivo: "EntregaPlanilha.xlsx",
        caminho_local: null,
        tipo_formato: TipoFormatoModeloPowerBi.ISENTO_EXCEL_ONLY,
        status: StatusModeloPowerBi.CONCLUIDO,
        justificativa_isencao: "Demanda restrita a relatório tabular em planilha Excel conforme escopo.",
        hash_sha256: null,
        versao_powerbi: null,
        tamanho_bytes: 0,
        criado_em: "2026-09-30T10:00:00Z",
        atualizado_em: "2026-09-30T10:00:00Z",
      };

      const res = DashboardRulesEvaluator.avaliar({
        modeloPowerBi: modeloIsento,
        medidas: [],
        paginas: [],
        visuais: [],
      });

      expect(res.status_geral).toBe("CONFORME");
      expect(res.isento_powerbi).toBe(true);
      expect(res.apto_para_validacao).toBe(true);
      expect(res.total_bloqueios).toBe(0);
      expect(res.total_alertas_criticos).toBe(0);
      expect(res.diagnosticos).toHaveLength(0);
    });

    it("deve gerar BLOQUEIO quando ISENTO_EXCEL_ONLY não possui justificativa ou ela for insuficiente", () => {
      const modeloIsentoInvalido: ModeloPowerBi = {
        id: "pbi-isento",
        demanda_id: "dem-02",
        modelo_analitico_id: null,
        nome_arquivo: "Planilha.xlsx",
        caminho_local: null,
        tipo_formato: TipoFormatoModeloPowerBi.ISENTO_EXCEL_ONLY,
        status: StatusModeloPowerBi.CONCLUIDO,
        justificativa_isencao: "Curto", // < 15 chars
        hash_sha256: null,
        versao_powerbi: null,
        tamanho_bytes: 0,
        criado_em: "2026-09-30T10:00:00Z",
        atualizado_em: "2026-09-30T10:00:00Z",
      };

      const res = DashboardRulesEvaluator.avaliar({
        modeloPowerBi: modeloIsentoInvalido,
        medidas: [],
        paginas: [],
        visuais: [],
      });

      expect(res.status_geral).toBe("BLOQUEIO");
      expect(res.apto_para_validacao).toBe(false);
      const d01 = res.diagnosticos.find((d) => d.codigo_regra === "D-01");
      expect(d01).toBeDefined();
      expect(d01?.severidade).toBe("BLOQUEIO");
      expect(d01?.titulo).toContain("Insuficiente");
    });
  });

  // =========================================================================
  // D-02: Cobertura das Métricas Analíticas por Medidas DAX
  // =========================================================================
  describe("D-02: Cobertura de Métricas Analíticas", () => {
    it("deve gerar ALERTA_CRITICO quando métricas homologadas não possuem medida DAX correspondente", () => {
      const ctx = criarCenarioValidoCompleto();
      // Remove a medida que cobria met-02
      ctx.medidas = [ctx.medidas[0]];

      const res = DashboardRulesEvaluator.avaliar(ctx);
      const d02 = res.diagnosticos.find((d) => d.codigo_regra === "D-02");

      expect(d02).toBeDefined();
      expect(d02?.severidade).toBe("ALERTA_CRITICO");
      expect(d02?.titulo).toContain("Sem Medida DAX");
      expect(d02?.deteccao).toContain("Ticket Médio");
    });

    it("deve gerar BLOQUEIO se não há modelo analítico e o catálogo de medidas estiver vazio", () => {
      const ctx = criarCenarioValidoCompleto();
      ctx.modeloAnalitico = null;
      ctx.medidas = [];

      const res = DashboardRulesEvaluator.avaliar(ctx);
      const d02 = res.diagnosticos.find((d) => d.codigo_regra === "D-02");

      expect(d02).toBeDefined();
      expect(d02?.severidade).toBe("BLOQUEIO");
    });
  });

  // =========================================================================
  // D-03: Linhagem Métrica Analítica -> Medida DAX
  // =========================================================================
  describe("D-03: Linhagem Métrica Analítica -> Medida DAX", () => {
    it("deve gerar BLOQUEIO quando medida aponta para metrica_analitica_id inexistente", () => {
      const ctx = criarCenarioValidoCompleto();
      ctx.medidas[0].metrica_analitica_id = "met-fantasma-inexistente";

      const res = DashboardRulesEvaluator.avaliar(ctx);
      const d03 = res.diagnosticos.find((d) => d.codigo_regra === "D-03");

      expect(d03).toBeDefined();
      expect(d03?.severidade).toBe("BLOQUEIO");
      expect(d03?.titulo).toContain("Linhagem Quebrada");
    });

    it("deve gerar RECOMENDACAO quando há métricas analíticas mas nenhuma medida DAX declara vínculo", () => {
      const ctx = criarCenarioValidoCompleto();
      ctx.medidas.forEach((m) => {
        m.metrica_analitica_id = null;
      });

      const res = DashboardRulesEvaluator.avaliar(ctx);
      const d03 = res.diagnosticos.find(
        (d) => d.codigo_regra === "D-03" && d.severidade === "RECOMENDACAO"
      );

      expect(d03).toBeDefined();
      expect(d03?.titulo).toContain("Sem Vínculo Declarado");
    });
  });

  // =========================================================================
  // D-04: Validade Estrutural das Medidas DAX
  // =========================================================================
  describe("D-04: Validade Estrutural das Medidas DAX", () => {
    it("deve gerar BLOQUEIO ao detectar medidas com nomes duplicados no mesmo modelo", () => {
      const ctx = criarCenarioValidoCompleto();
      ctx.medidas.push({
        ...ctx.medidas[0],
        id: "dax-duplicada",
        nome: "total vendas", // Mesmo nome com caixa diferente
      });

      const res = DashboardRulesEvaluator.avaliar(ctx);
      const d04 = res.diagnosticos.find(
        (d) => d.codigo_regra === "D-04" && d.titulo.includes("Duplicidade")
      );

      expect(d04).toBeDefined();
      expect(d04?.severidade).toBe("BLOQUEIO");
      expect(d04?.deteccao).toContain("total vendas");
    });

    it("deve gerar BLOQUEIO quando a expressão DAX estiver vazia", () => {
      const ctx = criarCenarioValidoCompleto();
      ctx.medidas[0].expressao_dax = "   ";

      const res = DashboardRulesEvaluator.avaliar(ctx);
      const d04 = res.diagnosticos.find(
        (d) => d.codigo_regra === "D-04" && d.titulo.includes("Expressão DAX Vazia")
      );

      expect(d04).toBeDefined();
      expect(d04?.severidade).toBe("BLOQUEIO");
    });

    // -----------------------------------------------------------------------
    // Subgate 3.2A — Testes Mandatórios de Calibração Heurística de D-04
    // -----------------------------------------------------------------------
    it("A: '/' nunca gera BLOQUEIO por si só e preserva dashboard apto para validação", () => {
      const ctx = criarCenarioValidoCompleto();
      ctx.medidas[1].expressao_dax = "[Total Vendas] / [Qtd Transacoes]";

      const res = DashboardRulesEvaluator.avaliar(ctx);
      const diagDiv = res.diagnosticos.find(
        (d) => d.codigo_regra === "D-04" && d.titulo.includes("DIVIDE()")
      );

      expect(diagDiv).toBeDefined();
      expect(diagDiv?.severidade).toBe("RECOMENDACAO");
      expect(res.total_bloqueios).toBe(0);
      expect(res.status_geral).toBe("RECOMENDACAO");
      expect(res.status_geral).not.toBe("BLOQUEIO");
      expect(res.apto_para_validacao).toBe(true);
    });

    it("B: '/' nunca é descrito como sintaticamente inválido, nem erro de compilação ou runtime", () => {
      const ctx = criarCenarioValidoCompleto();
      ctx.medidas[1].expressao_dax = "SUM(Vendas[Valor]) / COUNT(Vendas[Id])";

      const res = DashboardRulesEvaluator.avaliar(ctx);
      const diagDiv = res.diagnosticos.find(
        (d) => d.codigo_regra === "D-04" && d.titulo.includes("DIVIDE()")
      );

      expect(diagDiv).toBeDefined();
      const textoCompleto = `${diagDiv?.titulo} ${diagDiv?.deteccao} ${diagDiv?.explicacao} ${diagDiv?.recomendacao} ${diagDiv?.impacto_prontidao}`;

      expect(textoCompleto.toLowerCase()).not.toContain("sintaticamente inválid");
      expect(textoCompleto.toLowerCase()).not.toContain("erro de compilação");
      expect(textoCompleto.toLowerCase()).not.toContain("exceção em runtime");
      expect(textoCompleto.toLowerCase()).not.toContain("obrigatório");
      expect(diagDiv?.explicacao).toContain(
        "não indica, por si só, que a expressão DAX esteja incorreta ou seja inválida"
      );
    });

    it("C: DIVIDE() não recebe a recomendação de divisão direta", () => {
      const ctx = criarCenarioValidoCompleto();
      ctx.medidas[0].expressao_dax = "SUM(FatoVendas[valor_venda])";
      ctx.medidas[1].expressao_dax = "DIVIDE([Total Vendas], [Qtd Transacoes], 0)";

      const res = DashboardRulesEvaluator.avaliar(ctx);
      const diagDiv = res.diagnosticos.find(
        (d) => d.codigo_regra === "D-04" && d.titulo.includes("DIVIDE()")
      );

      expect(diagDiv).toBeUndefined();
    });

    it("D: o diagnóstico deixa claro que se trata de recomendação pedagógica e heurística de boa prática", () => {
      const ctx = criarCenarioValidoCompleto();
      ctx.medidas[1].expressao_dax = "[Margem Bruta] / [Receita Líquida]";

      const res = DashboardRulesEvaluator.avaliar(ctx);
      const diagDiv = res.diagnosticos.find(
        (d) => d.codigo_regra === "D-04" && d.titulo.includes("DIVIDE()")
      );

      expect(diagDiv).toBeDefined();
      expect(diagDiv?.titulo).toContain("Heurística de Boa Prática");
      expect(diagDiv?.severidade).toBe("RECOMENDACAO");
      expect(diagDiv?.impacto_prontidao).toContain("Recomendação pedagógica de boa prática");
      expect(diagDiv?.impacto_prontidao).toContain("Não bloqueia a prontidão");
    });

    it("E: determinismo permanece rigorosamente preservado em expressões com '/'", () => {
      const ctx = criarCenarioValidoCompleto();
      ctx.medidas[1].expressao_dax = "  [Faturamento]  /  [Meta]  ";

      const res1 = DashboardRulesEvaluator.avaliar(ctx);
      const res2 = DashboardRulesEvaluator.avaliar(ctx);

      expect(res1.status_geral).toBe(res2.status_geral);
      expect(res1.apto_para_validacao).toBe(res2.apto_para_validacao);
      expect(res1.total_recomendacoes).toBe(res2.total_recomendacoes);
      expect(res1.diagnosticos).toEqual(res2.diagnosticos);
    });

    it("F: casos não interpretáveis, comentários e literais de texto com '/' são tratados conservadoramente sem falsos positivos", () => {
      const ctx = criarCenarioValidoCompleto();
      ctx.medidas[0].expressao_dax = `
        // Comentário com operador / não deve ser detectado
        -- Outro comentário / de linha
        /* Bloco de comentário / com divisão hipotética */
        "Texto literal com data 01/01/2026 e / barra"
      `.trim();
      ctx.medidas[1].expressao_dax = "DIVIDE([Total Vendas], [Qtd Transacoes])";

      const res = DashboardRulesEvaluator.avaliar(ctx);
      const diagDiv = res.diagnosticos.find(
        (d) => d.codigo_regra === "D-04" && d.titulo.includes("DIVIDE()")
      );

      expect(diagDiv).toBeUndefined();
    });

    it("deve gerar RECOMENDACAO quando medida não possui formato_string", () => {
      const ctx = criarCenarioValidoCompleto();
      ctx.medidas[0].formato_string = null;

      const res = DashboardRulesEvaluator.avaliar(ctx);
      const d04 = res.diagnosticos.find(
        (d) => d.codigo_regra === "D-04" && d.titulo.includes("Sem String de Formatação")
      );

      expect(d04).toBeDefined();
      expect(d04?.severidade).toBe("RECOMENDACAO");
    });
  });

  // =========================================================================
  // D-05: Páginas com Objetivo Analítico e Público-Alvo
  // =========================================================================
  describe("D-05: Páginas e Objetivos Analíticos", () => {
    it("deve gerar BLOQUEIO quando não há nenhuma página cadastrada", () => {
      const ctx = criarCenarioValidoCompleto();
      ctx.paginas = [];
      ctx.visuais = [];

      const res = DashboardRulesEvaluator.avaliar(ctx);
      const d05 = res.diagnosticos.find(
        (d) => d.codigo_regra === "D-05" && d.titulo.includes("Nenhuma Página")
      );

      expect(d05).toBeDefined();
      expect(d05?.severidade).toBe("BLOQUEIO");
    });

    it("deve gerar ALERTA_CRITICO quando página possui objetivo analítico curto ou nulo", () => {
      const ctx = criarCenarioValidoCompleto();
      ctx.paginas[0].objetivo_analitico = "Curto";

      const res = DashboardRulesEvaluator.avaliar(ctx);
      const d05 = res.diagnosticos.find(
        (d) => d.codigo_regra === "D-05" && d.titulo.includes("Sem Objetivo")
      );

      expect(d05).toBeDefined();
      expect(d05?.severidade).toBe("ALERTA_CRITICO");
    });
  });

  // =========================================================================
  // D-06: Visuais Coerentes e Justificativa DataViz
  // =========================================================================
  describe("D-06: Visuais e Justificativa DataViz", () => {
    it("deve gerar BLOQUEIO quando visual referencia medida inexistente", () => {
      const ctx = criarCenarioValidoCompleto();
      ctx.visuais[0].medidas_utilizadas_ids = ["dax-fantasma-99"];

      const res = DashboardRulesEvaluator.avaliar(ctx);
      const d06 = res.diagnosticos.find(
        (d) => d.codigo_regra === "D-06" && d.titulo.includes("Medida DAX Inexistente")
      );

      expect(d06).toBeDefined();
      expect(d06?.severidade).toBe("BLOQUEIO");
    });

    it("deve gerar ALERTA_CRITICO quando visual não possui nem medidas nem atributos", () => {
      const ctx = criarCenarioValidoCompleto();
      ctx.visuais[0].medidas_utilizadas_ids = [];
      ctx.visuais[0].atributos_utilizados_ids = [];

      const res = DashboardRulesEvaluator.avaliar(ctx);
      const d06 = res.diagnosticos.find(
        (d) => d.codigo_regra === "D-06" && d.titulo.includes("Sem Dados")
      );

      expect(d06).toBeDefined();
      expect(d06?.severidade).toBe("ALERTA_CRITICO");
    });

    it("deve gerar RECOMENDACAO quando visual não possui justificativa DataViz", () => {
      const ctx = criarCenarioValidoCompleto();
      ctx.visuais[0].justificativa_dataviz = null;

      const res = DashboardRulesEvaluator.avaliar(ctx);
      const d06 = res.diagnosticos.find(
        (d) => d.codigo_regra === "D-06" && d.titulo.includes("Justificativa de Data Visualization")
      );

      expect(d06).toBeDefined();
      expect(d06?.severidade).toBe("RECOMENDACAO");
    });
  });

  // =========================================================================
  // D-07: Rastreabilidade Ponta a Ponta
  // =========================================================================
  describe("D-07: Rastreabilidade Ponta a Ponta", () => {
    it("deve gerar ALERTA_CRITICO quando visuais existem mas nenhum consome medidas DAX", () => {
      const ctx = criarCenarioValidoCompleto();
      ctx.visuais.forEach((v) => {
        v.medidas_utilizadas_ids = [];
        v.atributos_utilizados_ids = ["att-campo"];
      });

      const res = DashboardRulesEvaluator.avaliar(ctx);
      const d07 = res.diagnosticos.find(
        (d) => d.codigo_regra === "D-07" && d.titulo.includes("Nenhum Visual do Dashboard Utiliza")
      );

      expect(d07).toBeDefined();
      expect(d07?.severidade).toBe("ALERTA_CRITICO");
    });

    it("deve gerar RECOMENDACAO quando uma medida vinculada a métrica não for consumida por nenhum visual", () => {
      const ctx = criarCenarioValidoCompleto();
      // O visual 2 consome dax-01 em vez de dax-02, deixando dax-02 (Ticket Médio) de fora dos visuais
      ctx.visuais[1].medidas_utilizadas_ids = ["dax-01"];

      const res = DashboardRulesEvaluator.avaliar(ctx);
      const d07 = res.diagnosticos.find(
        (d) => d.codigo_regra === "D-07" && d.titulo.includes("Ticket Médio")
      );

      expect(d07).toBeDefined();
      expect(d07?.severidade).toBe("RECOMENDACAO");
    });
  });

  // =========================================================================
  // D-08: Prontidão Estrutural do Dashboard para Validação
  // =========================================================================
  describe("D-08: Prontidão Estrutural para Validação", () => {
    it("deve gerar BLOQUEIO D-08 quando houver bloqueios impeditivos ativos ou faltar estrutura", () => {
      const ctx = criarCenarioValidoCompleto();
      // Zera páginas e medidas
      ctx.paginas = [];
      ctx.medidas = [];
      ctx.visuais = [];

      const res = DashboardRulesEvaluator.avaliar(ctx);
      const d08 = res.diagnosticos.find((d) => d.codigo_regra === "D-08");

      expect(d08).toBeDefined();
      expect(d08?.severidade).toBe("BLOQUEIO");
      expect(res.apto_para_validacao).toBe(false);
    });

    it("deve reportar múltiplos diagnósticos simultâneos de forma independente e estruturada", () => {
      const ctx = criarCenarioValidoCompleto();
      // Introduz múltiplos problemas simultâneos:
      ctx.modeloPowerBi!.nome_arquivo = ""; // D-01 BLOQUEIO
      ctx.medidas[0].expressao_dax = ""; // D-04 BLOQUEIO
      ctx.paginas[0].objetivo_analitico = "curto"; // D-05 ALERTA_CRITICO
      ctx.visuais[0].justificativa_dataviz = ""; // D-06 RECOMENDACAO

      const res = DashboardRulesEvaluator.avaliar(ctx);

      expect(res.total_bloqueios).toBeGreaterThanOrEqual(2);
      expect(res.total_alertas_criticos).toBeGreaterThanOrEqual(1);
      expect(res.total_recomendacoes).toBeGreaterThanOrEqual(1);
      expect(res.status_geral).toBe("BLOQUEIO");
      expect(res.apto_para_validacao).toBe(false);

      const codigos = new Set(res.diagnosticos.map((d) => d.codigo_regra));
      expect(codigos.has("D-01")).toBe(true);
      expect(codigos.has("D-04")).toBe(true);
      expect(codigos.has("D-05")).toBe(true);
      expect(codigos.has("D-06")).toBe(true);
      expect(codigos.has("D-08")).toBe(true);
    });
  });
});
