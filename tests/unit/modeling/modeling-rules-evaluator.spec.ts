import { describe, it, expect } from "vitest";
import { ModelingRulesEvaluator } from "@/core/domain/rules/modeling-rules-evaluator";
import { ModeloAnaliticoCompleto } from "@/core/domain/entities/modelo-analitico";
import { DatasetAutorizadoAnalise } from "@/core/domain/entities/dataset-autorizado-analise";
import { StatusAutorizacaoDataset } from "@/core/domain/enums/status-autorizacao-dataset";
import { StatusModeloAnalitico } from "@/core/domain/enums/status-modelo-analitico";
import { TipoArquiteturaModelo } from "@/core/domain/enums/tipo-arquitetura-modelo";
import { TipoEntidadeAnalitica } from "@/core/domain/enums/tipo-entidade-analitica";
import { PapelEntidadeAnalitica } from "@/core/domain/enums/papel-entidade-analitica";
import { TipoOrigemEntidade } from "@/core/domain/enums/tipo-origem-entidade";
import { PapelAtributoAnalitico } from "@/core/domain/enums/papel-atributo-analitico";
import { TipoDadoAnalitico } from "@/core/domain/enums/tipo-dado-analitico";
import { CardinalidadeRelacionamento } from "@/core/domain/enums/cardinalidade-relacionamento";
import { DirecaoFiltroRelacionamento } from "@/core/domain/enums/direcao-filtro-relacionamento";
import { TipoAgregacaoMetrica } from "@/core/domain/enums/tipo-agregacao-metrica";
import { TipoAditividadeMetrica } from "@/core/domain/enums/tipo-aditividade-metrica";
import { UnidadeMedidaMetrica } from "@/core/domain/enums/unidade-medida-metrica";
import { StatusMetricaAnalitica } from "@/core/domain/enums/status-metrica-analitica";

describe("ModelingRulesEvaluator (M-01 a M-10)", () => {
  const datasetVigente: DatasetAutorizadoAnalise = {
    id: "ds-1",
    demanda_id: "dem-1",
    ativo_dados_id: "atv-1",
    diagnostico_qualidade_id: "diag-1",
    receita_preparacao_id: null,
    versao_rotulo: "1.0-preparado",
    hash_sha256_snapshot: "hash123",
    status: StatusAutorizacaoDataset.VIGENTE,
    justificativa_autorizacao: "Dataset validado com qualidade aprovada",
    autorizado_por_tipo: "HUMANO",
    restricoes_aceitas_snapshot: "[]",
    autorizado_em: new Date().toISOString(),
    revogado_em: null,
    motivo_revogacao: null,
  };

  const criarModeloBase = (): ModeloAnaliticoCompleto => {
    const now = new Date().toISOString();
    return {
      id: "mod-1",
      demanda_id: "dem-1",
      dataset_autorizado_id: "ds-1",
      nome: "Modelo Vendas",
      descricao: "Grão central: Uma linha por item vendido na transação.",
      tipo_arquitetura: TipoArquiteturaModelo.ESTRELA,
      status: StatusModeloAnalitico.RASCUNHO,
      homologado_em: null,
      homologado_por: null,
      justificativa_homologacao: null,
      revogado_em: null,
      motivo_revogacao: null,
      criado_em: now,
      atualizado_em: now,
      entidades: [
        {
          id: "ent-fato",
          modelo_id: "mod-1",
          ativo_dados_id: "atv-1",
          nome: "Fato Vendas",
          tipo: TipoEntidadeAnalitica.FATO,
          papel: PapelEntidadeAnalitica.FATO_TRANSACIONAL,
          origem_tipo: TipoOrigemEntidade.DATASET_AUTORIZADO,
          descricao: "Granularidade: Uma linha por item vendido na transação.",
          ordem_apresentacao: 1,
          criado_em: now,
          atualizado_em: now,
          atributos: [
            {
              id: "atr-1",
              entidade_id: "ent-fato",
              nome_original: "id_venda",
              nome_amigavel: "ID Venda",
              tipo_dado: TipoDadoAnalitico.INTEIRO,
              papel: PapelAtributoAnalitico.CHAVE_PRIMARIA,
              descricao: "Identificador primário da venda",
              formato_exibicao: null,
              oculto: false,
              ordem: 1,
              criado_em: now,
              atualizado_em: now,
            },
            {
              id: "atr-2",
              entidade_id: "ent-fato",
              nome_original: "valor_venda",
              nome_amigavel: "Valor da Venda",
              tipo_dado: TipoDadoAnalitico.DECIMAL,
              papel: PapelAtributoAnalitico.METRICA_BASE,
              descricao: "Valor transacionado do item",
              formato_exibicao: "R$ #,##0.00",
              oculto: false,
              ordem: 2,
              criado_em: now,
              atualizado_em: now,
            },
          ],
        },
      ],
      relacionamentos: [],
      metricas: [
        {
          id: "met-1",
          modelo_id: "mod-1",
          entidade_id: "ent-fato",
          nome: "Receita Total",
          descricao: "Soma das vendas brutas realizadas. Reconciliação: ERP Financeiro.",
          formula_declarativa: "SUM(FatoVendas.valor_venda)",
          tipo_agregacao: TipoAgregacaoMetrica.SOMA,
          tipo_aditividade: TipoAditividadeMetrica.TOTALMENTE_ADITIVA,
          unidade_medida: UnidadeMedidaMetrica.MOEDA,
          formato_exibicao: "R$ #,##0.00",
          status: StatusMetricaAnalitica.RASCUNHO,
          pergunta_negocio_associada: "Qual a receita total vendida?",
          objetivo_negocio_associado: "Acompanhar faturamento",
          atributos_dependentes_ids: ["atr-2"],
          metricas_dependentes_ids: [],
          ordem: 1,
          criado_em: now,
          atualizado_em: now,
        },
      ],
    };
  };

  it("M-01: deve gerar BLOQUEIO quando não há dataset ou não está VIGENTE", () => {
    const modelo = criarModeloBase();

    // Sem dataset
    const res1 = ModelingRulesEvaluator.avaliar(modelo, null);
    const diag1 = res1.diagnosticos.find((d) => d.codigo_regra === "M-01");
    expect(diag1).toBeDefined();
    expect(diag1?.severidade).toBe("BLOQUEIO");
    expect(res1.status_geral).toBe("BLOQUEIO");
    expect(res1.apto_homologacao).toBe(false);

    // Dataset revogado
    const datasetRevogado: DatasetAutorizadoAnalise = {
      ...datasetVigente,
      status: StatusAutorizacaoDataset.REVOGADO,
    };
    const res2 = ModelingRulesEvaluator.avaliar(modelo, datasetRevogado);
    const diag2 = res2.diagnosticos.find((d) => d.codigo_regra === "M-01");
    expect(diag2).toBeDefined();
    expect(diag2?.severidade).toBe("BLOQUEIO");

    // Dataset de demanda diferente
    const datasetOutraDemanda: DatasetAutorizadoAnalise = {
      ...datasetVigente,
      demanda_id: "outra-demanda",
    };
    const res3 = ModelingRulesEvaluator.avaliar(modelo, datasetOutraDemanda);
    const diag3 = res3.diagnosticos.find((d) => d.codigo_regra === "M-01");
    expect(diag3).toBeDefined();
    expect(diag3?.severidade).toBe("BLOQUEIO");
  });

  it("M-02: deve gerar BLOQUEIO se modelo ou entidade FATO não declarar grão", () => {
    const modelo = criarModeloBase();
    modelo.descricao = "";
    modelo.entidades[0].descricao = "";

    const res = ModelingRulesEvaluator.avaliar(modelo, datasetVigente);
    const diag = res.diagnosticos.find((d) => d.codigo_regra === "M-02");
    expect(diag).toBeDefined();
    expect(diag?.severidade).toBe("BLOQUEIO");
  });

  it("M-03: deve gerar BLOQUEIO se entidade não tiver identificador (chave primária)", () => {
    const modelo = criarModeloBase();
    // Remover chave primária
    modelo.entidades[0].atributos[0].papel = PapelAtributoAnalitico.ATRIBUTO_DESCRITIVO;

    const res = ModelingRulesEvaluator.avaliar(modelo, datasetVigente);
    const diag = res.diagnosticos.find((d) => d.codigo_regra === "M-03");
    expect(diag).toBeDefined();
    expect(diag?.severidade).toBe("BLOQUEIO");
    expect(diag?.entidade_relacionada_id).toBe("ent-fato");
  });

  it("M-04: deve gerar BLOQUEIO para métrica percentual/divisão tratada como TOTALMENTE_ADITIVA com SUM", () => {
    const modelo = criarModeloBase();
    modelo.metricas.push({
      id: "met-pct",
      modelo_id: "mod-1",
      entidade_id: "ent-fato",
      nome: "Margem Percentual",
      descricao: "Percentual de lucro. Fonte: ERP.",
      formula_declarativa: "SUM(FatoVendas.margem) / SUM(FatoVendas.valor_venda)",
      tipo_agregacao: TipoAgregacaoMetrica.SOMA,
      tipo_aditividade: TipoAditividadeMetrica.TOTALMENTE_ADITIVA,
      unidade_medida: UnidadeMedidaMetrica.PERCENTUAL,
      formato_exibicao: "0.0%",
      status: StatusMetricaAnalitica.RASCUNHO,
      pergunta_negocio_associada: null,
      objetivo_negocio_associado: null,
      atributos_dependentes_ids: ["atr-2"],
      metricas_dependentes_ids: [],
      ordem: 2,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    });

    const res = ModelingRulesEvaluator.avaliar(modelo, datasetVigente);
    const diag = res.diagnosticos.find((d) => d.codigo_regra === "M-04");
    expect(diag).toBeDefined();
    expect(diag?.severidade).toBe("BLOQUEIO");
    expect(diag?.metrica_relacionada_id).toBe("met-pct");
  });

  it("M-05: deve gerar BLOQUEIO quando não há entidade FATO ou não há métricas", () => {
    const modeloSemFato = criarModeloBase();
    modeloSemFato.entidades[0].tipo = TipoEntidadeAnalitica.DIMENSAO;

    const res1 = ModelingRulesEvaluator.avaliar(modeloSemFato, datasetVigente);
    const diag1 = res1.diagnosticos.find((d) => d.codigo_regra === "M-05");
    expect(diag1).toBeDefined();
    expect(diag1?.severidade).toBe("BLOQUEIO");

    const modeloSemMetrica = criarModeloBase();
    modeloSemMetrica.metricas = [];
    const res2 = ModelingRulesEvaluator.avaliar(modeloSemMetrica, datasetVigente);
    const diag2 = res2.diagnosticos.find((d) => d.codigo_regra === "M-05");
    expect(diag2).toBeDefined();
    expect(diag2?.severidade).toBe("BLOQUEIO");
  });

  it("M-06: deve gerar ALERTA_CRITICO quando há relacionamento muitos-para-muitos (MUITOS_PARA_MUITOS)", () => {
    const modelo = criarModeloBase();
    const now = new Date().toISOString();
    modelo.entidades.push({
      id: "ent-dim",
      modelo_id: "mod-1",
      ativo_dados_id: null,
      nome: "Dim Categoria",
      tipo: TipoEntidadeAnalitica.DIMENSAO,
      papel: PapelEntidadeAnalitica.DIMENSAO_PADRAO,
      origem_tipo: TipoOrigemEntidade.DATASET_AUTORIZADO,
      descricao: "Dimensão de categorias de produto",
      ordem_apresentacao: 2,
      criado_em: now,
      atualizado_em: now,
      atributos: [
        {
          id: "atr-cat-id",
          entidade_id: "ent-dim",
          nome_original: "id_categoria",
          nome_amigavel: "ID Categoria",
          tipo_dado: TipoDadoAnalitico.INTEIRO,
          papel: PapelAtributoAnalitico.CHAVE_PRIMARIA,
          descricao: "Chave primária da categoria",
          formato_exibicao: null,
          oculto: false,
          ordem: 1,
          criado_em: now,
          atualizado_em: now,
        },
      ],
    });

    modelo.relacionamentos.push({
      id: "rel-1",
      modelo_id: "mod-1",
      entidade_origem_id: "ent-fato",
      atributo_origem_id: "atr-1",
      entidade_destino_id: "ent-dim",
      atributo_destino_id: "atr-cat-id",
      tipo_relacionamento: CardinalidadeRelacionamento.MUITOS_PARA_MUITOS,
      direcao_filtro: DirecaoFiltroRelacionamento.UNIDIRECIONAL,
      ativo: true,
      justificativa: "Necessário por causa da categoria multi-tag",
      criado_em: now,
      atualizado_em: now,
    });

    const res = ModelingRulesEvaluator.avaliar(modelo, datasetVigente);
    const diag = res.diagnosticos.find((d) => d.codigo_regra === "M-06");
    expect(diag).toBeDefined();
    expect(diag?.severidade).toBe("ALERTA_CRITICO");
    expect(diag?.relacionamento_relacionado_id).toBe("rel-1");
    expect(res.status_geral).toBe("ALERTA_CRITICO");
    expect(res.apto_homologacao).toBe(true);
  });

  it("M-07: deve gerar ALERTA_CRITICO quando há relacionamento com filtro BIDIRECIONAL", () => {
    const modelo = criarModeloBase();
    const now = new Date().toISOString();
    modelo.entidades.push({
      id: "ent-dim",
      modelo_id: "mod-1",
      ativo_dados_id: null,
      nome: "Dim Categoria",
      tipo: TipoEntidadeAnalitica.DIMENSAO,
      papel: PapelEntidadeAnalitica.DIMENSAO_PADRAO,
      origem_tipo: TipoOrigemEntidade.DATASET_AUTORIZADO,
      descricao: "Dimensão de categorias de produto",
      ordem_apresentacao: 2,
      criado_em: now,
      atualizado_em: now,
      atributos: [
        {
          id: "atr-cat-id",
          entidade_id: "ent-dim",
          nome_original: "id_categoria",
          nome_amigavel: "ID Categoria",
          tipo_dado: TipoDadoAnalitico.INTEIRO,
          papel: PapelAtributoAnalitico.CHAVE_PRIMARIA,
          descricao: "Chave primária",
          formato_exibicao: null,
          oculto: false,
          ordem: 1,
          criado_em: now,
          atualizado_em: now,
        },
      ],
    });

    modelo.relacionamentos.push({
      id: "rel-bidi",
      modelo_id: "mod-1",
      entidade_origem_id: "ent-fato",
      atributo_origem_id: "atr-1",
      entidade_destino_id: "ent-dim",
      atributo_destino_id: "atr-cat-id",
      tipo_relacionamento: CardinalidadeRelacionamento.MUITOS_PARA_UM,
      direcao_filtro: DirecaoFiltroRelacionamento.BIDIRECIONAL,
      ativo: true,
      justificativa: "Necessário propagar filtro cruzado",
      criado_em: now,
      atualizado_em: now,
    });

    const res = ModelingRulesEvaluator.avaliar(modelo, datasetVigente);
    const diag = res.diagnosticos.find((d) => d.codigo_regra === "M-07");
    expect(diag).toBeDefined();
    expect(diag?.severidade).toBe("ALERTA_CRITICO");
    expect(diag?.relacionamento_relacionado_id).toBe("rel-bidi");
  });

  it("M-08: deve gerar RECOMENDACAO quando fato possui data/data_hora e não há especificação de calendário", () => {
    const modelo = criarModeloBase();
    const now = new Date().toISOString();
    // Adicionar atributo de data na Fato
    modelo.entidades[0].atributos.push({
      id: "atr-dt",
      entidade_id: "ent-fato",
      nome_original: "data_venda",
      nome_amigavel: "Data da Venda",
      tipo_dado: TipoDadoAnalitico.DATA,
      papel: PapelAtributoAnalitico.DIMENSAO_TEMPO,
      descricao: "Data da transação",
      formato_exibicao: "YYYY-MM-DD",
      oculto: false,
      ordem: 3,
      criado_em: now,
      atualizado_em: now,
    });

    const resSemCal = ModelingRulesEvaluator.avaliar(modelo, datasetVigente);
    const diagSemCal = resSemCal.diagnosticos.find((d) => d.codigo_regra === "M-08");
    expect(diagSemCal).toBeDefined();
    expect(diagSemCal?.severidade).toBe("RECOMENDACAO");

    // Adicionando entidade com papel DIMENSAO_CALENDARIO
    modelo.entidades.push({
      id: "ent-cal",
      modelo_id: "mod-1",
      ativo_dados_id: null,
      nome: "Dim Calendário",
      tipo: TipoEntidadeAnalitica.DIMENSAO,
      papel: PapelEntidadeAnalitica.DIMENSAO_CALENDARIO,
      origem_tipo: TipoOrigemEntidade.DIMENSAO_SISTEMA,
      descricao: "Dimensão de datas",
      ordem_apresentacao: 3,
      criado_em: now,
      atualizado_em: now,
      atributos: [],
    });

    const resComCal = ModelingRulesEvaluator.avaliar(modelo, datasetVigente);
    const diagComCal = resComCal.diagnosticos.find((d) => d.codigo_regra === "M-08");
    expect(diagComCal).toBeUndefined();
  });

  it("M-09: deve gerar RECOMENDACAO para métrica sem base de reconciliação", () => {
    const modelo = criarModeloBase();
    modelo.metricas[0].descricao = "Soma das vendas brutas sem menção de auditoria";

    const res = ModelingRulesEvaluator.avaliar(modelo, datasetVigente);
    const diag = res.diagnosticos.find((d) => d.codigo_regra === "M-09");
    expect(diag).toBeDefined();
    expect(diag?.severidade).toBe("RECOMENDACAO");
    expect(diag?.metrica_relacionada_id).toBe("met-1");
  });

  it("M-10: deve gerar RECOMENDACAO para atributos relevantes sem descrição amigável/negocial", () => {
    const modelo = criarModeloBase();
    modelo.entidades[0].atributos[1].descricao = null;

    const res = ModelingRulesEvaluator.avaliar(modelo, datasetVigente);
    const diag = res.diagnosticos.find((d) => d.codigo_regra === "M-10");
    expect(diag).toBeDefined();
    expect(diag?.severidade).toBe("RECOMENDACAO");
    expect(diag?.entidade_relacionada_id).toBe("ent-fato");
  });
});
