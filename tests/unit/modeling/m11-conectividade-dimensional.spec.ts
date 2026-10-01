import { describe, it, expect, vi } from "vitest";
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
import { HomologarModeloAnaliticoUseCase } from "@/core/use-cases/modeling/homologar-modelo-analitico.use-case";
import { IModeloAnaliticoRepository } from "@/core/domain/repositories/modelo-analitico-repository.interface";
import { IDatasetAutorizadoRepository } from "@/core/domain/repositories/dataset-autorizado-repository.interface";
import { IAuditRepository } from "@/core/domain/repositories/audit-repository.interface";
import { resolveCopilotMessages } from "@/core/use-cases/copilot/resolve-copilot-messages";
import { CopilotContext } from "@/core/use-cases/copilot/copilot-types";

describe("Regra M-11: Integridade de Conectividade Dimensional (Gate 2B.4)", () => {
  const datasetVigente: DatasetAutorizadoAnalise = {
    id: "ds-1",
    demanda_id: "dem-1",
    ativo_dados_id: "atv-1",
    diagnostico_qualidade_id: "diag-1",
    receita_preparacao_id: null,
    versao_rotulo: "1.0-preparado",
    hash_sha256_snapshot: "hash123",
    status: StatusAutorizacaoDataset.VIGENTE,
    justificativa_autorizacao: "Dataset homologado",
    autorizado_por_tipo: "HUMANO",
    restricoes_aceitas_snapshot: "[]",
    autorizado_em: new Date().toISOString(),
    revogado_em: null,
    motivo_revogacao: null,
  };

  const criarModeloValido = (tipoArquitetura: TipoArquiteturaModelo = TipoArquiteturaModelo.ESTRELA): ModeloAnaliticoCompleto => {
    const now = new Date().toISOString();
    return {
      id: "mod-1",
      demanda_id: "dem-1",
      dataset_autorizado_id: "ds-1",
      nome: "Modelo Vendas",
      descricao: "Grão central: Uma linha por item vendido na transação.",
      tipo_arquitetura: tipoArquitetura,
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
          nome: "FatoVendas",
          tipo: TipoEntidadeAnalitica.FATO,
          papel: PapelEntidadeAnalitica.FATO_TRANSACIONAL,
          origem_tipo: TipoOrigemEntidade.DATASET_AUTORIZADO,
          descricao: "Granularidade: uma linha por item vendido.",
          ordem_apresentacao: 1,
          criado_em: now,
          atualizado_em: now,
          atributos: [
            {
              id: "atr-pk-fato",
              entidade_id: "ent-fato",
              nome_original: "id_venda",
              nome_amigavel: "ID Venda",
              tipo_dado: TipoDadoAnalitico.INTEIRO,
              papel: PapelAtributoAnalitico.CHAVE_PRIMARIA,
              descricao: "Chave primária da venda transacional",
              formato_exibicao: null,
              oculto: false,
              ordem: 1,
              criado_em: now,
              atualizado_em: now,
            },
            {
              id: "atr-fk-cliente",
              entidade_id: "ent-fato",
              nome_original: "id_cliente",
              nome_amigavel: "ID Cliente",
              tipo_dado: TipoDadoAnalitico.INTEIRO,
              papel: PapelAtributoAnalitico.CHAVE_ESTRANGEIRA,
              descricao: "Chave estrangeira do cliente",
              formato_exibicao: null,
              oculto: false,
              ordem: 2,
              criado_em: now,
              atualizado_em: now,
            },
            {
              id: "atr-valor",
              entidade_id: "ent-fato",
              nome_original: "valor",
              nome_amigavel: "Valor",
              tipo_dado: TipoDadoAnalitico.DECIMAL,
              papel: PapelAtributoAnalitico.METRICA_BASE,
              descricao: "Valor monetário do item vendido",
              formato_exibicao: "R$ #,##0.00",
              oculto: false,
              ordem: 3,
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
          nome: "Faturamento Bruto",
          descricao: "Soma das vendas brutas realizadas. Reconciliação: ERP Financeiro.",
          formula_declarativa: "SUM(FatoVendas.valor)",
          tipo_agregacao: TipoAgregacaoMetrica.SOMA,
          tipo_aditividade: TipoAditividadeMetrica.TOTALMENTE_ADITIVA,
          unidade_medida: UnidadeMedidaMetrica.MOEDA,
          formato_exibicao: "R$ #,##0.00",
          status: StatusMetricaAnalitica.RASCUNHO,
          pergunta_negocio_associada: "Qual a receita total faturada?",
          objetivo_negocio_associado: "Acompanhar volume de vendas",
          atributos_dependentes_ids: ["atr-valor"],
          metricas_dependentes_ids: [],
          ordem: 1,
          criado_em: now,
          atualizado_em: now,
        },
      ],
    };
  };

  const criarDimensao = (id: string, nome: string, modeloId: string = "mod-1") => {
    const now = new Date().toISOString();
    return {
      id,
      modelo_id: modeloId,
      ativo_dados_id: null,
      nome,
      tipo: TipoEntidadeAnalitica.DIMENSAO,
      papel: PapelEntidadeAnalitica.DIMENSAO_PADRAO,
      origem_tipo: TipoOrigemEntidade.DATASET_AUTORIZADO,
      descricao: `Dimensão descritiva de ${nome}`,
      ordem_apresentacao: 2,
      criado_em: now,
      atualizado_em: now,
      atributos: [
        {
          id: `atr-pk-${id}`,
          entidade_id: id,
          nome_original: `id_${nome.toLowerCase()}`,
          nome_amigavel: `ID ${nome}`,
          tipo_dado: TipoDadoAnalitico.INTEIRO,
          papel: PapelAtributoAnalitico.CHAVE_PRIMARIA,
          descricao: `Chave primária de ${nome}`,
          formato_exibicao: null,
          oculto: false,
          ordem: 1,
          criado_em: now,
          atualizado_em: now,
        },
      ],
    };
  };

  // 1. TABELA_UNICA: não exigir relacionamentos
  describe("Cenário 1: TABELA_UNICA", () => {
    it("deve aprovar modelo TABELA_UNICA com 1 Fato + 0 Dimensões + 0 Relacionamentos sem disparar M-11", () => {
      const modelo = criarModeloValido(TipoArquiteturaModelo.TABELA_UNICA);
      const res = ModelingRulesEvaluator.avaliar(modelo, datasetVigente);

      const diagM11 = res.diagnosticos.filter((d) => d.codigo_regra === "M-11");
      expect(diagM11).toHaveLength(0);
      expect(res.status_geral).toBe("CONFORME");
      expect(res.apto_homologacao).toBe(true);
    });

    it("deve dispensar exigência de relacionamentos mesmo se houver entidade cadastrada em TABELA_UNICA", () => {
      const modelo = criarModeloValido(TipoArquiteturaModelo.TABELA_UNICA);
      modelo.entidades.push(criarDimensao("dim-extra", "InfoAdicional"));

      const res = ModelingRulesEvaluator.avaliar(modelo, datasetVigente);
      const diagM11 = res.diagnosticos.filter((d) => d.codigo_regra === "M-11");
      expect(diagM11).toHaveLength(0);
    });
  });

  // 2. ESTRELA com dimensão desconectada
  describe("Cenário 2: ESTRELA com Dimensão Desconectada", () => {
    it("deve disparar M-11 com severidade ALERTA_CRITICO quando há 1 Fato + 1 Dimensão + 0 relacionamentos", () => {
      const modelo = criarModeloValido(TipoArquiteturaModelo.ESTRELA);
      const dimCliente = criarDimensao("dim-cliente", "DimCliente");
      modelo.entidades.push(dimCliente);

      const res = ModelingRulesEvaluator.avaliar(modelo, datasetVigente);

      expect(res.total_bloqueios).toBe(0);
      expect(res.total_alertas_criticos).toBe(1);

      const diag = res.diagnosticos.find((d) => d.codigo_regra === "M-11");
      expect(diag).toBeDefined();
      expect(diag?.severidade).toBe("ALERTA_CRITICO");
      expect(diag?.titulo).toContain("DimCliente");
      expect(diag?.deteccao).toContain("esquema ESTRELA");
      expect(diag?.entidade_relacionada_id).toBe("dim-cliente");
      expect(res.status_geral).toBe("ALERTA_CRITICO");
      expect(res.apto_homologacao).toBe(true); // Alerta crítico não é bloqueio
    });
  });

  // 3. ESTRELA conectada corretamente
  describe("Cenário 3: ESTRELA Conectada Corretamente", () => {
    it("não deve disparar M-11 quando a dimensão está conectada diretamente à Fato via relacionamento ativo", () => {
      const modelo = criarModeloValido(TipoArquiteturaModelo.ESTRELA);
      const dimCliente = criarDimensao("dim-cliente", "DimCliente");
      modelo.entidades.push(dimCliente);

      const now = new Date().toISOString();
      modelo.relacionamentos.push({
        id: "rel-fato-cliente",
        modelo_id: "mod-1",
        entidade_origem_id: "ent-fato",
        atributo_origem_id: "atr-fk-cliente",
        entidade_destino_id: "dim-cliente",
        atributo_destino_id: "atr-pk-dim-cliente",
        tipo_relacionamento: CardinalidadeRelacionamento.MUITOS_PARA_UM,
        direcao_filtro: DirecaoFiltroRelacionamento.UNIDIRECIONAL,
        ativo: true,
        justificativa: null,
        criado_em: now,
        atualizado_em: now,
      });

      const res = ModelingRulesEvaluator.avaliar(modelo, datasetVigente);

      const diagM11 = res.diagnosticos.filter((d) => d.codigo_regra === "M-11");
      expect(diagM11).toHaveLength(0);
      expect(res.total_alertas_criticos).toBe(0);
      expect(res.status_geral).toBe("CONFORME");
    });
  });

  // 4. ESTRELA com múltiplas dimensões e apenas uma órfã
  describe("Cenário 4: ESTRELA com Múltiplas Dimensões e uma Órfã", () => {
    it("deve identificar nominalmente apenas a dimensão desconectada", () => {
      const modelo = criarModeloValido(TipoArquiteturaModelo.ESTRELA);
      const dimCliente = criarDimensao("dim-cliente", "DimCliente");
      const dimProduto = criarDimensao("dim-produto", "DimProduto");
      const dimRegiao = criarDimensao("dim-regiao", "DimRegiao");

      modelo.entidades.push(dimCliente, dimProduto, dimRegiao);

      const now = new Date().toISOString();
      // Conecta cliente e produto à Fato
      modelo.relacionamentos.push(
        {
          id: "rel-1",
          modelo_id: "mod-1",
          entidade_origem_id: "ent-fato",
          atributo_origem_id: "atr-fk-cliente",
          entidade_destino_id: "dim-cliente",
          atributo_destino_id: "atr-pk-dim-cliente",
          tipo_relacionamento: CardinalidadeRelacionamento.MUITOS_PARA_UM,
          direcao_filtro: DirecaoFiltroRelacionamento.UNIDIRECIONAL,
          ativo: true,
          justificativa: null,
          criado_em: now,
          atualizado_em: now,
        },
        {
          id: "rel-2",
          modelo_id: "mod-1",
          entidade_origem_id: "ent-fato",
          atributo_origem_id: "atr-pk-fato",
          entidade_destino_id: "dim-produto",
          atributo_destino_id: "atr-pk-dim-produto",
          tipo_relacionamento: CardinalidadeRelacionamento.MUITOS_PARA_UM,
          direcao_filtro: DirecaoFiltroRelacionamento.UNIDIRECIONAL,
          ativo: true,
          justificativa: null,
          criado_em: now,
          atualizado_em: now,
        }
      );

      // DimRegiao permanece desconectada
      const res = ModelingRulesEvaluator.avaliar(modelo, datasetVigente);

      const diagsM11 = res.diagnosticos.filter((d) => d.codigo_regra === "M-11");
      expect(diagsM11).toHaveLength(1);
      expect(diagsM11[0].entidade_relacionada_id).toBe("dim-regiao");
      expect(diagsM11[0].titulo).toContain("DimRegiao");
      expect(diagsM11[0].titulo).not.toContain("DimCliente");
      expect(diagsM11[0].titulo).not.toContain("DimProduto");
    });
  });

  // 5. SNOWFLAKE com dimensão conectada indiretamente
  describe("Cenário 5: SNOWFLAKE com Conectividade Indireta", () => {
    it("não deve considerar órfã uma dimensão que alcança a Fato através de cadeia relacional válida", () => {
      const modelo = criarModeloValido(TipoArquiteturaModelo.SNOWFLAKE);
      const dimProduto = criarDimensao("dim-produto", "DimProduto");
      const dimSubcategoria = criarDimensao("dim-subcategoria", "DimSubcategoria");
      const dimCategoria = criarDimensao("dim-categoria", "DimCategoria");

      modelo.entidades.push(dimProduto, dimSubcategoria, dimCategoria);

      const now = new Date().toISOString();
      // Cadeia: FatoVendas -> DimProduto -> DimSubcategoria -> DimCategoria
      modelo.relacionamentos.push(
        {
          id: "rel-1",
          modelo_id: "mod-1",
          entidade_origem_id: "ent-fato",
          atributo_origem_id: "atr-pk-fato",
          entidade_destino_id: "dim-produto",
          atributo_destino_id: "atr-pk-dim-produto",
          tipo_relacionamento: CardinalidadeRelacionamento.MUITOS_PARA_UM,
          direcao_filtro: DirecaoFiltroRelacionamento.UNIDIRECIONAL,
          ativo: true,
          justificativa: null,
          criado_em: now,
          atualizado_em: now,
        },
        {
          id: "rel-2",
          modelo_id: "mod-1",
          entidade_origem_id: "dim-produto",
          atributo_origem_id: "atr-pk-dim-produto",
          entidade_destino_id: "dim-subcategoria",
          atributo_destino_id: "atr-pk-dim-subcategoria",
          tipo_relacionamento: CardinalidadeRelacionamento.MUITOS_PARA_UM,
          direcao_filtro: DirecaoFiltroRelacionamento.UNIDIRECIONAL,
          ativo: true,
          justificativa: null,
          criado_em: now,
          atualizado_em: now,
        },
        {
          id: "rel-3",
          modelo_id: "mod-1",
          entidade_origem_id: "dim-subcategoria",
          atributo_origem_id: "atr-pk-dim-subcategoria",
          entidade_destino_id: "dim-categoria",
          atributo_destino_id: "atr-pk-dim-categoria",
          tipo_relacionamento: CardinalidadeRelacionamento.MUITOS_PARA_UM,
          direcao_filtro: DirecaoFiltroRelacionamento.UNIDIRECIONAL,
          ativo: true,
          justificativa: null,
          criado_em: now,
          atualizado_em: now,
        }
      );

      const res = ModelingRulesEvaluator.avaliar(modelo, datasetVigente);
      const diagsM11 = res.diagnosticos.filter((d) => d.codigo_regra === "M-11");
      expect(diagsM11).toHaveLength(0);
    });

    it("no esquema ESTRELA, a mesma cadeia indireta deve acusar as dimensões que não possuem ligação direta com a Fato", () => {
      // No Star Schema estrito, cada dimensão deve se ligar diretamente à Fato
      const modelo = criarModeloValido(TipoArquiteturaModelo.ESTRELA);
      const dimProduto = criarDimensao("dim-produto", "DimProduto");
      const dimSubcategoria = criarDimensao("dim-subcategoria", "DimSubcategoria");

      modelo.entidades.push(dimProduto, dimSubcategoria);

      const now = new Date().toISOString();
      // Fato -> DimProduto e DimProduto -> DimSubcategoria
      modelo.relacionamentos.push(
        {
          id: "rel-1",
          modelo_id: "mod-1",
          entidade_origem_id: "ent-fato",
          atributo_origem_id: "atr-pk-fato",
          entidade_destino_id: "dim-produto",
          atributo_destino_id: "atr-pk-dim-produto",
          tipo_relacionamento: CardinalidadeRelacionamento.MUITOS_PARA_UM,
          direcao_filtro: DirecaoFiltroRelacionamento.UNIDIRECIONAL,
          ativo: true,
          justificativa: null,
          criado_em: now,
          atualizado_em: now,
        },
        {
          id: "rel-2",
          modelo_id: "mod-1",
          entidade_origem_id: "dim-produto",
          atributo_origem_id: "atr-pk-dim-produto",
          entidade_destino_id: "dim-subcategoria",
          atributo_destino_id: "atr-pk-dim-subcategoria",
          tipo_relacionamento: CardinalidadeRelacionamento.MUITOS_PARA_UM,
          direcao_filtro: DirecaoFiltroRelacionamento.UNIDIRECIONAL,
          ativo: true,
          justificativa: null,
          criado_em: now,
          atualizado_em: now,
        }
      );

      const res = ModelingRulesEvaluator.avaliar(modelo, datasetVigente);
      const diagsM11 = res.diagnosticos.filter((d) => d.codigo_regra === "M-11");
      expect(diagsM11).toHaveLength(1);
      expect(diagsM11[0].entidade_relacionada_id).toBe("dim-subcategoria");
    });
  });

  // 6. Testes negativos e falso positivo
  describe("Cenário 6: Testes Negativos e Prevenção de Falsos Positivos", () => {
    it("deve ignorar relacionamento com ativo === false e manter diagnóstico M-11", () => {
      const modelo = criarModeloValido(TipoArquiteturaModelo.ESTRELA);
      const dimCliente = criarDimensao("dim-cliente", "DimCliente");
      modelo.entidades.push(dimCliente);

      const now = new Date().toISOString();
      modelo.relacionamentos.push({
        id: "rel-inativo",
        modelo_id: "mod-1",
        entidade_origem_id: "ent-fato",
        atributo_origem_id: "atr-fk-cliente",
        entidade_destino_id: "dim-cliente",
        atributo_destino_id: "atr-pk-dim-cliente",
        tipo_relacionamento: CardinalidadeRelacionamento.MUITOS_PARA_UM,
        direcao_filtro: DirecaoFiltroRelacionamento.UNIDIRECIONAL,
        ativo: false, // Desativado!
        justificativa: null,
        criado_em: now,
        atualizado_em: now,
      });

      const res = ModelingRulesEvaluator.avaliar(modelo, datasetVigente);
      const diagM11 = res.diagnosticos.find((d) => d.codigo_regra === "M-11");
      expect(diagM11).toBeDefined();
      expect(diagM11?.entidade_relacionada_id).toBe("dim-cliente");
    });

    it("em SNOWFLAKE, um ciclo entre duas dimensões desconectadas de qualquer Fato deve sinalizar ambas como órfãs", () => {
      const modelo = criarModeloValido(TipoArquiteturaModelo.SNOWFLAKE);
      const dimA = criarDimensao("dim-a", "DimA");
      const dimB = criarDimensao("dim-b", "DimB");

      modelo.entidades.push(dimA, dimB);

      const now = new Date().toISOString();
      // Relacionamento apenas entre DimA e DimB (ilha desconectada)
      modelo.relacionamentos.push({
        id: "rel-ilha",
        modelo_id: "mod-1",
        entidade_origem_id: "dim-a",
        atributo_origem_id: "atr-pk-dim-a",
        entidade_destino_id: "dim-b",
        atributo_destino_id: "atr-pk-dim-b",
        tipo_relacionamento: CardinalidadeRelacionamento.UM_PARA_UM,
        direcao_filtro: DirecaoFiltroRelacionamento.UNIDIRECIONAL,
        ativo: true,
        justificativa: null,
        criado_em: now,
        atualizado_em: now,
      });

      const res = ModelingRulesEvaluator.avaliar(modelo, datasetVigente);
      const diagsM11 = res.diagnosticos.filter((d) => d.codigo_regra === "M-11");
      expect(diagsM11).toHaveLength(2);
      const idsOrfas = diagsM11.map((d) => d.entidade_relacionada_id);
      expect(idsOrfas).toContain("dim-a");
      expect(idsOrfas).toContain("dim-b");
    });
  });

  // 7. Governança: Homologação com justificativa formal para tabela desconectada
  describe("Cenário 7: Governança e Homologação de Tabela Deliberadamente Desconectada", () => {
    it("deve barrar homologação se o analista NÃO fornecer justificativa formal com no mínimo 15 caracteres", async () => {
      const modelo = criarModeloValido(TipoArquiteturaModelo.ESTRELA);
      const dimParam = criarDimensao("dim-whatif", "ParametroWhatIf");
      modelo.entidades.push(dimParam);

      const mockModeloRepo: Partial<IModeloAnaliticoRepository> = {
        findById: vi.fn().mockResolvedValue(modelo),
        findCompletoById: vi.fn().mockResolvedValue(modelo),
        findByDemandaId: vi.fn().mockResolvedValue([modelo]),
        homologarTransacional: vi.fn(),
      };

      const mockDatasetRepo: Partial<IDatasetAutorizadoRepository> = {
        findById: vi.fn().mockResolvedValue(datasetVigente),
        findVigenteByDemandId: vi.fn().mockResolvedValue(datasetVigente),
      };

      const useCase = new HomologarModeloAnaliticoUseCase(
        mockModeloRepo as IModeloAnaliticoRepository,
        mockDatasetRepo as IDatasetAutorizadoRepository
      );

      // Tenta homologar sem justificativa dos alertas
      await expect(
        useCase.execute({
          modeloId: modelo.id,
          justificativa: "Modelo revisado pelo analista responsável com conformidade.",
          justificativaAlertas: "muito curta", // < 15 chars
          homologadoPor: "Analista Sênior",
        })
      ).rejects.toThrow(/alertas críticos de modelagem que exigem justificativa técnica formal com no mínimo 15 caracteres/i);
    });

    it("deve permitir homologação auditável quando o analista fornece justificativa técnica formal para a tabela desconectada", async () => {
      const modelo = criarModeloValido(TipoArquiteturaModelo.ESTRELA);
      const dimParam = criarDimensao("dim-whatif", "ParametroWhatIf");
      modelo.entidades.push(dimParam);

      const now = new Date().toISOString();
      const modeloHomologado = {
        ...modelo,
        status: StatusModeloAnalitico.HOMOLOGADO,
        homologado_em: now,
        homologado_por: "Analista Sênior",
      };

      const mockModeloRepo: Partial<IModeloAnaliticoRepository> = {
        findById: vi.fn().mockResolvedValue(modelo),
        findCompletoById: vi.fn().mockResolvedValue(modelo),
        findByDemandaId: vi.fn().mockResolvedValue([modelo]),
        homologarTransacional: vi.fn().mockResolvedValue(modeloHomologado),
      };

      const mockDatasetRepo: Partial<IDatasetAutorizadoRepository> = {
        findById: vi.fn().mockResolvedValue(datasetVigente),
        findVigenteByDemandId: vi.fn().mockResolvedValue(datasetVigente),
      };

      const mockAuditRepo: Partial<IAuditRepository> = {
        record: vi.fn().mockResolvedValue(undefined),
      };

      const useCase = new HomologarModeloAnaliticoUseCase(
        mockModeloRepo as IModeloAnaliticoRepository,
        mockDatasetRepo as IDatasetAutorizadoRepository,
        mockAuditRepo as IAuditRepository
      );

      const res = await useCase.execute({
        modeloId: modelo.id,
        justificativa: "Modelo com estrutura dimensional revisada e aprovada para análises simulatórias.",
        justificativaAlertas: "Tabela deliberadamente desconectada para parâmetros dinâmicos What-If em medidas DAX com SELECTEDVALUE.",
        homologadoPor: "Analista Sênior",
      });

      expect(res.status).toBe(StatusModeloAnalitico.HOMOLOGADO);
      expect(mockModeloRepo.homologarTransacional).toHaveBeenCalledTimes(1);
      expect(mockAuditRepo.record).toHaveBeenCalledTimes(1);

      // Comprova que o registro de auditoria consolidou o alerta reconhecido
      const callData = (mockAuditRepo.record as any).mock.calls[0][0];
      expect(callData.tipo_evento).toBe("DECISAO_HUMANA");
      expect(callData.justificativa).toContain("Tabela deliberadamente desconectada");
      const dadosNovos = JSON.parse(callData.dados_novos);
      expect(dadosNovos.total_alertas_reconhecidos).toBe(1);
    });
  });

  // 8. Copiloto Proativo Contextual para M-11
  describe("Cenário 8: Orientação Contextual do Copiloto Proativo", () => {
    it("deve fornecer orientação precisa e identificar nominalmente a dimensão desconectada", () => {
      const modelo = criarModeloValido(TipoArquiteturaModelo.ESTRELA);
      const dimCliente = criarDimensao("dim-cliente", "DimCliente");
      modelo.entidades.push(dimCliente);

      const resultadoConformidade = ModelingRulesEvaluator.avaliar(modelo, datasetVigente);

      const copilotContext: CopilotContext = {
        hasDatasetAutorizado: true,
        datasetAutorizado: datasetVigente,
        modelo,
        resultadoConformidade,
      };

      const orientacao = resolveCopilotMessages(copilotContext);

      expect(orientacao.cenario).toBe("ALERTA_CRITICO_PENDENTE");
      expect(orientacao.prioridade).toBe("ACAO_NECESSARIA");
      expect(orientacao.temAlertaCritico).toBe(true);

      // 1. Onde você está
      expect(orientacao.hierarquia.ondeVoceEsta).toContain("Modelagem Dimensional");

      // 2. O que estamos fazendo
      expect(orientacao.hierarquia.oQueEstamosFazendo).toContain("integridade dos relacionamentos");

      // 3. Por que isso importa
      expect(orientacao.hierarquia.porQueEstamosFazendo).toContain("filtrar corretamente a Fato");

      // 4. Situação atual: identificação nominal da dimensão órfã
      expect(orientacao.hierarquia.situacaoAtual.rotulo).toContain("Conectividade Dimensional");
      expect(orientacao.hierarquia.situacaoAtual.descricao).toContain("DimCliente");
      expect(orientacao.hierarquia.situacaoAtual.mensagemBloqueio).toContain("DimCliente");

      // 5. Próximo passo
      expect(orientacao.hierarquia.proximoPasso.acaoTitulo).toContain("Conectar Dimensões ou Justificar");
      expect(orientacao.hierarquia.proximoPasso.descricao).toContain("DimCliente");

      // 6. Aprenda enquanto trabalha
      const temConceitoRelacionamento = orientacao.nivel2.conceitosChave.some(
        (c) => c.id === "relacionamento"
      );
      expect(temConceitoRelacionamento).toBe(true);
    });
  });
});
