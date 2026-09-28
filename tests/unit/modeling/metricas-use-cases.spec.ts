import { describe, it, expect, beforeEach } from "vitest";
import { CadastrarMetricaAnaliticaUseCase } from "@/core/use-cases/modeling/cadastrar-metrica-analitica.use-case";
import { AtualizarMetricaAnaliticaUseCase } from "@/core/use-cases/modeling/atualizar-metrica-analitica.use-case";
import { RemoverMetricaAnaliticaUseCase } from "@/core/use-cases/modeling/remover-metrica-analitica.use-case";

import { IModeloAnaliticoRepository } from "@/core/domain/repositories/modelo-analitico-repository.interface";
import { IEntidadeAnaliticaRepository } from "@/core/domain/repositories/entidade-analitica-repository.interface";
import { IAtributoAnaliticoRepository } from "@/core/domain/repositories/atributo-analitico-repository.interface";
import { IMetricaAnaliticaRepository } from "@/core/domain/repositories/metrica-analitica-repository.interface";

import { ModeloAnalitico } from "@/core/domain/entities/modelo-analitico";
import { EntidadeAnalitica } from "@/core/domain/entities/entidade-analitica";
import { AtributoAnalitico } from "@/core/domain/entities/atributo-analitico";
import { MetricaAnalitica } from "@/core/domain/entities/metrica-analitica";

import { StatusModeloAnalitico } from "@/core/domain/enums/status-modelo-analitico";
import { TipoArquiteturaModelo } from "@/core/domain/enums/tipo-arquitetura-modelo";
import { TipoEntidadeAnalitica } from "@/core/domain/enums/tipo-entidade-analitica";
import { PapelEntidadeAnalitica } from "@/core/domain/enums/papel-entidade-analitica";
import { TipoOrigemEntidade } from "@/core/domain/enums/tipo-origem-entidade";
import { TipoDadoAnalitico } from "@/core/domain/enums/tipo-dado-analitico";
import { PapelAtributoAnalitico } from "@/core/domain/enums/papel-atributo-analitico";
import { TipoAgregacaoMetrica } from "@/core/domain/enums/tipo-agregacao-metrica";
import { TipoAditividadeMetrica } from "@/core/domain/enums/tipo-aditividade-metrica";
import { UnidadeMedidaMetrica } from "@/core/domain/enums/unidade-medida-metrica";
import { StatusMetricaAnalitica } from "@/core/domain/enums/status-metrica-analitica";

describe("Métricas Analíticas — Use Cases (Subunidade 3.6B)", () => {
  let modelos: Map<string, ModeloAnalitico>;
  let entidades: Map<string, EntidadeAnalitica>;
  let atributos: Map<string, AtributoAnalitico>;
  let metricas: Map<string, MetricaAnalitica>;

  let modeloRepo: IModeloAnaliticoRepository;
  let entidadeRepo: IEntidadeAnaliticaRepository;
  let atributoRepo: IAtributoAnaliticoRepository;
  let metricaRepo: IMetricaAnaliticaRepository;

  beforeEach(() => {
    modelos = new Map();
    entidades = new Map();
    atributos = new Map();
    metricas = new Map();

    modeloRepo = {
      findById: async (id) => modelos.get(id) ?? null,
      findByDemandaId: async () => [],
      findHomologadoByDemandaId: async () => null,
      findCompletoById: async () => null,
      create: async (m) => m,
      update: async (m) => m,
      delete: async () => {},
      homologarTransacional: async () => {
        throw new Error();
      },
      revogar: async () => null,
    };

    entidadeRepo = {
      findById: async (id) => entidades.get(id) ?? null,
      findByModeloId: async (modId) => Array.from(entidades.values()).filter((e) => e.modelo_id === modId),
      create: async (e) => e,
      update: async (e) => e,
      delete: async () => {},
      createBatch: async (b) => b,
    };

    atributoRepo = {
      findById: async (id) => atributos.get(id) ?? null,
      findByEntidadeId: async (entId) => Array.from(atributos.values()).filter((a) => a.entidade_id === entId),
      create: async (a) => a,
      update: async (a) => a,
      delete: async () => {},
      createBatch: async (b) => b,
    };

    metricaRepo = {
      findById: async (id) => metricas.get(id) ?? null,
      findByModeloId: async (modId) => Array.from(metricas.values()).filter((m) => m.modelo_id === modId),
      create: async (m) => {
        metricas.set(m.id, m);
        return m;
      },
      update: async (m) => {
        metricas.set(m.id, m);
        return m;
      },
      delete: async (id) => {
        metricas.delete(id);
      },
    };

    const now = new Date().toISOString();

    const modelo: ModeloAnalitico = {
      id: "mod-1",
      demanda_id: "dem-1",
      dataset_autorizado_id: "ds-1",
      nome: "Modelo Vendas",
      descricao: "Modelo",
      tipo_arquitetura: TipoArquiteturaModelo.ESTRELA,
      status: StatusModeloAnalitico.RASCUNHO,
      homologado_em: null,
      homologado_por: null,
      justificativa_homologacao: null,
      revogado_em: null,
      motivo_revogacao: null,
      criado_em: now,
      atualizado_em: now,
    };
    modelos.set(modelo.id, modelo);

    const entidade: EntidadeAnalitica = {
      id: "ent-fato",
      modelo_id: "mod-1",
      ativo_dados_id: "atv-1",
      nome: "FatoVendas",
      tipo: TipoEntidadeAnalitica.FATO,
      papel: PapelEntidadeAnalitica.FATO_TRANSACIONAL,
      origem_tipo: TipoOrigemEntidade.DATASET_AUTORIZADO,
      descricao: "Fato",
      ordem_apresentacao: 1,
      criado_em: now,
      atualizado_em: now,
    };
    entidades.set(entidade.id, entidade);

    const attr: AtributoAnalitico = {
      id: "atr-valor",
      entidade_id: "ent-fato",
      nome_original: "valor_item",
      nome_amigavel: "Valor do Item",
      tipo_dado: TipoDadoAnalitico.DECIMAL,
      papel: PapelAtributoAnalitico.METRICA_BASE,
      ordem: 1,
      oculto: false,
      descricao: "Valor monetário do item",
      formato_exibicao: "R$ #,##0.00",
      criado_em: now,
      atualizado_em: now,
    };
    atributos.set(attr.id, attr);
  });

  it("deve cadastrar métrica analítica simples com sucesso", async () => {
    const useCase = new CadastrarMetricaAnaliticaUseCase(
      modeloRepo,
      entidadeRepo,
      atributoRepo,
      metricaRepo
    );

    const metrica = await useCase.execute({
      modeloId: "mod-1",
      entidadeId: "ent-fato",
      nome: "Receita Bruta",
      descricao: "Soma de todos os valores de venda",
      tipoAgregacao: TipoAgregacaoMetrica.SOMA,
      tipoAditividade: TipoAditividadeMetrica.TOTALMENTE_ADITIVA,
      formulaDeclarativa: "SUM(FatoVendas.valor_item)",
      unidadeMedida: UnidadeMedidaMetrica.MOEDA,
      formatoExibicao: "R$ #,##0.00",
      status: StatusMetricaAnalitica.RASCUNHO,
      atributosDependentesIds: ["atr-valor"],
      perguntaNegocioAssociada: "Qual o faturamento bruto?",
      objetivoNegocioAssociado: "Acompanhar receita",
    });

    expect(metrica.id).toBeDefined();
    expect(metrica.nome).toBe("Receita Bruta");
    expect(metrica.atributos_dependentes_ids).toEqual(["atr-valor"]);
    expect(metricas.has(metrica.id)).toBe(true);
  });

  it("deve rejeitar cadastro se atributo dependente não existir ou for de outro modelo", async () => {
    const useCase = new CadastrarMetricaAnaliticaUseCase(
      modeloRepo,
      entidadeRepo,
      atributoRepo,
      metricaRepo
    );

    await expect(
      useCase.execute({
        modeloId: "mod-1",
        nome: "Métrica Invalida",
        tipoAgregacao: TipoAgregacaoMetrica.SOMA,
        tipoAditividade: TipoAditividadeMetrica.TOTALMENTE_ADITIVA,
        formulaDeclarativa: "SUM(coluna_inexistente)",
        unidadeMedida: UnidadeMedidaMetrica.MOEDA,
        atributosDependentesIds: ["atr-fantasma"],
      })
    ).rejects.toThrow("Atributo dependente com ID 'atr-fantasma' não encontrado");
  });

  it("deve cadastrar métrica composta dependente de outra métrica", async () => {
    const useCase = new CadastrarMetricaAnaliticaUseCase(
      modeloRepo,
      entidadeRepo,
      atributoRepo,
      metricaRepo
    );

    const m1 = await useCase.execute({
      modeloId: "mod-1",
      nome: "Receita Total",
      tipoAgregacao: TipoAgregacaoMetrica.SOMA,
      tipoAditividade: TipoAditividadeMetrica.TOTALMENTE_ADITIVA,
      formulaDeclarativa: "SUM(FatoVendas.valor_item)",
      unidadeMedida: UnidadeMedidaMetrica.MOEDA,
      atributosDependentesIds: ["atr-valor"],
    });

    const m2 = await useCase.execute({
      modeloId: "mod-1",
      nome: "Custos Totais",
      tipoAgregacao: TipoAgregacaoMetrica.SOMA,
      tipoAditividade: TipoAditividadeMetrica.TOTALMENTE_ADITIVA,
      formulaDeclarativa: "SUM(FatoVendas.custo_item)",
      unidadeMedida: UnidadeMedidaMetrica.MOEDA,
    });

    const mComposta = await useCase.execute({
      modeloId: "mod-1",
      nome: "Lucro Bruto",
      tipoAgregacao: TipoAgregacaoMetrica.COMPOSTA,
      tipoAditividade: TipoAditividadeMetrica.TOTALMENTE_ADITIVA,
      formulaDeclarativa: "[Receita Total] - [Custos Totais]",
      unidadeMedida: UnidadeMedidaMetrica.MOEDA,
      metricasDependentesIds: [m1.id, m2.id],
    });

    expect(mComposta.metricas_dependentes_ids).toEqual([m1.id, m2.id]);
  });

  it("deve rejeitar auto-dependência direta ao cadastrar métrica", async () => {
    const useCase = new CadastrarMetricaAnaliticaUseCase(
      modeloRepo,
      entidadeRepo,
      atributoRepo,
      metricaRepo
    );

    await expect(
      useCase.execute({
        modeloId: "mod-1",
        nome: "Métrica Circular",
        tipoAgregacao: TipoAgregacaoMetrica.SOMA,
        tipoAditividade: TipoAditividadeMetrica.TOTALMENTE_ADITIVA,
        formulaDeclarativa: "auto",
        unidadeMedida: UnidadeMedidaMetrica.MOEDA,
        metricasDependentesIds: ["met-que-ainda-nao-existe"],
      })
    ).rejects.toThrow("Métrica dependente com ID 'met-que-ainda-nao-existe' não encontrada no modelo");
  });

  it("deve detectar e rejeitar ciclo de dependência na atualização de métricas", async () => {
    const cadUseCase = new CadastrarMetricaAnaliticaUseCase(
      modeloRepo,
      entidadeRepo,
      atributoRepo,
      metricaRepo
    );
    const m1 = await cadUseCase.execute({
      modeloId: "mod-1",
      nome: "M1",
      tipoAgregacao: TipoAgregacaoMetrica.SOMA,
      tipoAditividade: TipoAditividadeMetrica.TOTALMENTE_ADITIVA,
      formulaDeclarativa: "1",
      unidadeMedida: UnidadeMedidaMetrica.QUANTIDADE,
    });

    const m2 = await cadUseCase.execute({
      modeloId: "mod-1",
      nome: "M2",
      tipoAgregacao: TipoAgregacaoMetrica.COMPOSTA,
      tipoAditividade: TipoAditividadeMetrica.TOTALMENTE_ADITIVA,
      formulaDeclarativa: "[M1] * 2",
      unidadeMedida: UnidadeMedidaMetrica.QUANTIDADE,
      metricasDependentesIds: [m1.id],
    });

    // Tentar atualizar M1 para depender de M2 (ciclo: M1 -> M2 -> M1)
    const updUseCase = new AtualizarMetricaAnaliticaUseCase(
      metricaRepo,
      entidadeRepo,
      atributoRepo
    );

    await expect(
      updUseCase.execute({
        id: m1.id,
        metricasDependentesIds: [m2.id],
      })
    ).rejects.toThrow("Dependência circular detectada");
  });

  it("deve bloquear a remoção de métrica que é referenciada por outra métrica", async () => {
    const cadUseCase = new CadastrarMetricaAnaliticaUseCase(
      modeloRepo,
      entidadeRepo,
      atributoRepo,
      metricaRepo
    );

    const mBase = await cadUseCase.execute({
      modeloId: "mod-1",
      nome: "Receita Base",
      tipoAgregacao: TipoAgregacaoMetrica.SOMA,
      tipoAditividade: TipoAditividadeMetrica.TOTALMENTE_ADITIVA,
      formulaDeclarativa: "SUM(valor)",
      unidadeMedida: UnidadeMedidaMetrica.MOEDA,
    });

    await cadUseCase.execute({
      modeloId: "mod-1",
      nome: "Receita Dobrada",
      tipoAgregacao: TipoAgregacaoMetrica.COMPOSTA,
      tipoAditividade: TipoAditividadeMetrica.TOTALMENTE_ADITIVA,
      formulaDeclarativa: "[Receita Base] * 2",
      unidadeMedida: UnidadeMedidaMetrica.MOEDA,
      metricasDependentesIds: [mBase.id],
    });

    const remUseCase = new RemoverMetricaAnaliticaUseCase(metricaRepo, modeloRepo);

    await expect(remUseCase.execute({ id: mBase.id })).rejects.toThrow(
      'Não é possível remover a métrica "Receita Base" porque ela é referenciada como dependência'
    );

    // Permite remover após excluir a dependente
    const metricasDoModelo = await metricaRepo.findByModeloId("mod-1");
    const mDobrada = metricasDoModelo.find((m) => m.nome === "Receita Dobrada")!;
    await remUseCase.execute({ id: mDobrada.id });
    expect(metricas.has(mDobrada.id)).toBe(false);

    // Agora pode remover a base
    await remUseCase.execute({ id: mBase.id });
    expect(metricas.has(mBase.id)).toBe(false);
  });
});
