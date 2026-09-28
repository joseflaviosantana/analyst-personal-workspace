import { describe, it, expect, beforeEach } from "vitest";
import { CriarModeloAnaliticoUseCase } from "@/core/use-cases/modeling/criar-modelo-analitico.use-case";
import { AtualizarModeloAnaliticoUseCase } from "@/core/use-cases/modeling/atualizar-modelo-analitico.use-case";
import { AdicionarEntidadeAnaliticaUseCase } from "@/core/use-cases/modeling/adicionar-entidade-analitica.use-case";
import { ConfigurarAtributosEntidadeUseCase } from "@/core/use-cases/modeling/configurar-atributos-entidade.use-case";
import { RemoverEntidadeAnaliticaUseCase } from "@/core/use-cases/modeling/remover-entidade-analitica.use-case";
import { AdicionarRelacionamentoAnaliticoUseCase } from "@/core/use-cases/modeling/adicionar-relacionamento-analitico.use-case";
import { RemoverRelacionamentoAnaliticoUseCase } from "@/core/use-cases/modeling/remover-relacionamento-analitico.use-case";
import { AvaliarConformidadeModeloUseCase } from "@/core/use-cases/modeling/avaliar-conformidade-modelo.use-case";

import { IModeloAnaliticoRepository } from "@/core/domain/repositories/modelo-analitico-repository.interface";
import { IDatasetAutorizadoRepository } from "@/core/domain/repositories/dataset-autorizado-repository.interface";
import { IAtivoDadosRepository } from "@/core/domain/repositories/ativo-dados-repository.interface";
import { IEntidadeAnaliticaRepository } from "@/core/domain/repositories/entidade-analitica-repository.interface";
import { IAtributoAnaliticoRepository } from "@/core/domain/repositories/atributo-analitico-repository.interface";
import { IRelacionamentoAnaliticoRepository } from "@/core/domain/repositories/relacionamento-analitico-repository.interface";
import { IMetricaAnaliticaRepository } from "@/core/domain/repositories/metrica-analitica-repository.interface";

import { ModeloAnalitico, ModeloAnaliticoCompleto } from "@/core/domain/entities/modelo-analitico";
import { EntidadeAnalitica } from "@/core/domain/entities/entidade-analitica";
import { AtributoAnalitico } from "@/core/domain/entities/atributo-analitico";
import { RelacionamentoAnalitico } from "@/core/domain/entities/relacionamento-analitico";
import { MetricaAnalitica } from "@/core/domain/entities/metrica-analitica";
import { DatasetAutorizadoAnalise } from "@/core/domain/entities/dataset-autorizado-analise";
import { AtivoDados } from "@/core/domain/entities/ativo-dados";

import { StatusAutorizacaoDataset } from "@/core/domain/enums/status-autorizacao-dataset";
import { StatusModeloAnalitico } from "@/core/domain/enums/status-modelo-analitico";
import { TipoArquiteturaModelo } from "@/core/domain/enums/tipo-arquitetura-modelo";
import { TipoEntidadeAnalitica } from "@/core/domain/enums/tipo-entidade-analitica";
import { PapelEntidadeAnalitica } from "@/core/domain/enums/papel-entidade-analitica";
import { TipoOrigemEntidade } from "@/core/domain/enums/tipo-origem-entidade";
import { TipoDadoAnalitico } from "@/core/domain/enums/tipo-dado-analitico";
import { PapelAtributoAnalitico } from "@/core/domain/enums/papel-atributo-analitico";
import { CardinalidadeRelacionamento } from "@/core/domain/enums/cardinalidade-relacionamento";
import { DirecaoFiltroRelacionamento } from "@/core/domain/enums/direcao-filtro-relacionamento";
import { FormatoArquivo } from "@/core/domain/enums/formato-arquivo";
import { StatusAtivoDados } from "@/core/domain/enums/status-ativo-dados";

describe("Modelo Analítico — Use Cases (Subunidade 3.6B)", () => {
  let modelos: Map<string, ModeloAnalitico>;
  let datasets: Map<string, DatasetAutorizadoAnalise>;
  let ativos: Map<string, AtivoDados>;
  let entidades: Map<string, EntidadeAnalitica>;
  let atributos: Map<string, AtivoDados | AtributoAnalitico>;
  let atributosLista: Map<string, AtributoAnalitico>;
  let relacionamentos: Map<string, RelacionamentoAnalitico>;
  let metricas: Map<string, MetricaAnalitica>;

  let modeloRepo: IModeloAnaliticoRepository;
  let datasetRepo: IDatasetAutorizadoRepository;
  let ativoRepo: IAtivoDadosRepository;
  let entidadeRepo: IEntidadeAnaliticaRepository;
  let atributoRepo: IAtributoAnaliticoRepository;
  let relacionamentoRepo: IRelacionamentoAnaliticoRepository;
  let metricaRepo: IMetricaAnaliticaRepository;

  beforeEach(() => {
    modelos = new Map();
    datasets = new Map();
    ativos = new Map();
    entidades = new Map();
    atributosLista = new Map();
    relacionamentos = new Map();
    metricas = new Map();

    modeloRepo = {
      findById: async (id) => modelos.get(id) ?? null,
      findByDemandaId: async (demId) => Array.from(modelos.values()).filter((m) => m.demanda_id === demId),
      findHomologadoByDemandaId: async (demId) =>
        Array.from(modelos.values()).find((m) => m.demanda_id === demId && m.status === StatusModeloAnalitico.HOMOLOGADO) ?? null,
      findCompletoById: async (id): Promise<ModeloAnaliticoCompleto | null> => {
        const mod = modelos.get(id);
        if (!mod) return null;
        const ents = Array.from(entidades.values())
          .filter((e) => e.modelo_id === id)
          .map((e) => ({
            ...e,
            atributos: Array.from(atributosLista.values()).filter((a) => a.entidade_id === e.id),
          }));
        const rels = Array.from(relacionamentos.values()).filter((r) => r.modelo_id === id);
        const mets = Array.from(metricas.values()).filter((m) => m.modelo_id === id);
        return {
          ...mod,
          entidades: ents,
          relacionamentos: rels,
          metricas: mets,
        };
      },
      create: async (m) => {
        modelos.set(m.id, m);
        return m;
      },
      update: async (m) => {
        modelos.set(m.id, m);
        return m;
      },
      delete: async (id) => {
        modelos.delete(id);
      },
      homologarTransacional: async () => {
        throw new Error("Não usado na 3.6B");
      },
      revogar: async () => null,
    };

    datasetRepo = {
      findById: async (id) => datasets.get(id) ?? null,
      findVigenteByDemandId: async (demId) =>
        Array.from(datasets.values()).find((d) => d.demanda_id === demId && d.status === StatusAutorizacaoDataset.VIGENTE) ?? null,
      listarHistorico: async (demId) => Array.from(datasets.values()).filter((d) => d.demanda_id === demId),
      autorizarTransacional: async (d) => {
        datasets.set(d.id, d);
        return d;
      },
      revogar: async () => null,
    };

    ativoRepo = {
      findById: async (id: string) => ativos.get(id) ?? null,
      findByDemandId: async (demId: string) => Array.from(ativos.values()).filter((a) => a.demanda_id === demId),
      findByPath: async () => null,
      findActiveByPath: async () => null,
      countByDemandId: async () => ativos.size,
      create: async (a: AtivoDados) => {
        ativos.set(a.id, a);
        return a;
      },
      update: async (id: string, data: Partial<AtivoDados>) => {
        const exist = ativos.get(id);
        if (!exist) return null;
        const updated = { ...exist, ...data };
        ativos.set(id, updated);
        return updated;
      },
      replace: async () => {
        throw new Error("Não usado");
      },
    };

    entidadeRepo = {
      findById: async (id) => entidades.get(id) ?? null,
      findByModeloId: async (modId) => Array.from(entidades.values()).filter((e) => e.modelo_id === modId),
      create: async (e) => {
        entidades.set(e.id, e);
        return e;
      },
      update: async (e) => {
        entidades.set(e.id, e);
        return e;
      },
      delete: async (id) => {
        entidades.delete(id);
      },
      createBatch: async (batch) => {
        for (const e of batch) entidades.set(e.id, e);
        return batch;
      },
    };

    atributoRepo = {
      findById: async (id) => atributosLista.get(id) ?? null,
      findByEntidadeId: async (entId) => Array.from(atributosLista.values()).filter((a) => a.entidade_id === entId),
      create: async (a) => {
        atributosLista.set(a.id, a);
        return a;
      },
      update: async (a) => {
        atributosLista.set(a.id, a);
        return a;
      },
      delete: async (id) => {
        atributosLista.delete(id);
      },
      createBatch: async (batch) => {
        for (const a of batch) atributosLista.set(a.id, a);
        return batch;
      },
    };

    relacionamentoRepo = {
      findById: async (id) => relacionamentos.get(id) ?? null,
      findByModeloId: async (modId) => Array.from(relacionamentos.values()).filter((r) => r.modelo_id === modId),
      create: async (r) => {
        relacionamentos.set(r.id, r);
        return r;
      },
      update: async (r) => {
        relacionamentos.set(r.id, r);
        return r;
      },
      delete: async (id) => {
        relacionamentos.delete(id);
      },
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
  });

  describe("CriarModeloAnaliticoUseCase", () => {
    it("deve criar modelo com sucesso e propor Fato inicial a partir do schema do ativo", async () => {
      const ativo: AtivoDados = {
        id: "atv-1",
        demanda_id: "dem-1",
        nome_arquivo: "vendas.csv",
        caminho_local: "/data/vendas.csv",
        formato: FormatoArquivo.CSV,
        origem: null,
        descricao_conteudo: "Vendas da empresa",
        granularidade: "Uma linha por item vendido",
        periodo_inicio: null,
        periodo_fim: null,
        versao: "1.0",
        substitui_ativo_id: null,
        schema_inferido: JSON.stringify([
          { nome: "id_venda", tipo: "INTEGER" },
          { nome: "valor", tipo: "DECIMAL" },
        ]),
        status: StatusAtivoDados.ATIVO,
        tamanho_bytes: 1024,
        total_linhas: 50,
        total_colunas: 2,
        hash_sha256: "hash123",
        data_recebimento: new Date().toISOString(),
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      };
      ativos.set(ativo.id, ativo);

      const dataset: DatasetAutorizadoAnalise = {
        id: "ds-1",
        demanda_id: "dem-1",
        ativo_dados_id: "atv-1",
        diagnostico_qualidade_id: "diag-1",
        receita_preparacao_id: null,
        versao_rotulo: "1.0-bruto",
        hash_sha256_snapshot: "hash123",
        status: StatusAutorizacaoDataset.VIGENTE,
        justificativa_autorizacao: "Dados conferidos e autorizados",
        autorizado_por_tipo: "HUMANO",
        restricoes_aceitas_snapshot: "[]",
        autorizado_em: new Date().toISOString(),
        revogado_em: null,
        motivo_revogacao: null,
      };
      datasets.set(dataset.id, dataset);

      const useCase = new CriarModeloAnaliticoUseCase(
        modeloRepo,
        datasetRepo,
        ativoRepo,
        entidadeRepo,
        atributoRepo
      );

      const res = await useCase.execute({
        demandaId: "dem-1",
        datasetAutorizadoId: "ds-1",
        nome: "Modelo Vendas",
        descricao: "Modelo de análise dimensional de vendas",
        proporEntidadeFato: true,
      });

      expect(res.modelo).toBeDefined();
      expect(res.modelo.nome).toBe("Modelo Vendas");
      expect(res.modelo.status).toBe(StatusModeloAnalitico.RASCUNHO);
      expect(res.entidadeFatoInicial).toBeDefined();
      expect(res.entidadeFatoInicial?.tipo).toBe(TipoEntidadeAnalitica.FATO);
      expect(res.entidadeFatoInicial?.descricao).toContain("[Sugestão de Grão Inferida do Ativo]");
      expect(res.entidadeFatoInicial?.atributos.length).toBe(2);
      expect(res.entidadeFatoInicial?.atributos[0].papel).toBe(PapelAtributoAnalitico.CHAVE_PRIMARIA);
    });

    it("deve lançar erro se dataset não estiver VIGENTE", async () => {
      const dataset: DatasetAutorizadoAnalise = {
        id: "ds-revogado",
        demanda_id: "dem-1",
        ativo_dados_id: "atv-1",
        diagnostico_qualidade_id: "diag-1",
        receita_preparacao_id: null,
        versao_rotulo: "1.0",
        hash_sha256_snapshot: "hash",
        status: StatusAutorizacaoDataset.REVOGADO,
        justificativa_autorizacao: "Revogado",
        autorizado_por_tipo: "HUMANO",
        restricoes_aceitas_snapshot: "[]",
        autorizado_em: new Date().toISOString(),
        revogado_em: new Date().toISOString(),
        motivo_revogacao: "Erros encontrados",
      };
      datasets.set(dataset.id, dataset);

      const useCase = new CriarModeloAnaliticoUseCase(
        modeloRepo,
        datasetRepo,
        ativoRepo,
        entidadeRepo,
        atributoRepo
      );

      await expect(
        useCase.execute({
          demandaId: "dem-1",
          datasetAutorizadoId: "ds-revogado",
          nome: "Modelo Inválido",
        })
      ).rejects.toThrow("não está VIGENTE");
    });

    it("deve lançar erro se dataset pertencer a outra demanda", async () => {
      const dataset: DatasetAutorizadoAnalise = {
        id: "ds-outra",
        demanda_id: "dem-OUTRA",
        ativo_dados_id: "atv-1",
        diagnostico_qualidade_id: "diag-1",
        receita_preparacao_id: null,
        versao_rotulo: "1.0",
        hash_sha256_snapshot: "hash",
        status: StatusAutorizacaoDataset.VIGENTE,
        justificativa_autorizacao: "Vigente",
        autorizado_por_tipo: "HUMANO",
        restricoes_aceitas_snapshot: "[]",
        autorizado_em: new Date().toISOString(),
        revogado_em: null,
        motivo_revogacao: null,
      };
      datasets.set(dataset.id, dataset);

      const useCase = new CriarModeloAnaliticoUseCase(
        modeloRepo,
        datasetRepo,
        ativoRepo,
        entidadeRepo,
        atributoRepo
      );

      await expect(
        useCase.execute({
          demandaId: "dem-1",
          datasetAutorizadoId: "ds-outra",
          nome: "Modelo Cruzado",
        })
      ).rejects.toThrow("pertence à demanda 'dem-OUTRA'");
    });
  });

  describe("AtualizarModeloAnaliticoUseCase", () => {
    it("deve atualizar atributos descritivos do modelo", async () => {
      const mod: ModeloAnalitico = {
        id: "mod-1",
        demanda_id: "dem-1",
        dataset_autorizado_id: "ds-1",
        nome: "Nome Antigo",
        descricao: "Desc",
        tipo_arquitetura: TipoArquiteturaModelo.ESTRELA,
        status: StatusModeloAnalitico.RASCUNHO,
        homologado_em: null,
        homologado_por: null,
        justificativa_homologacao: null,
        revogado_em: null,
        motivo_revogacao: null,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      };
      modelos.set(mod.id, mod);

      const useCase = new AtualizarModeloAnaliticoUseCase(modeloRepo);
      const updated = await useCase.execute({
        id: "mod-1",
        nome: "Nome Novo",
        tipoArquitetura: TipoArquiteturaModelo.SNOWFLAKE,
      });

      expect(updated.nome).toBe("Nome Novo");
      expect(updated.tipo_arquitetura).toBe(TipoArquiteturaModelo.SNOWFLAKE);
    });

    it("deve bloquear atualização direta se o modelo já estiver HOMOLOGADO", async () => {
      const mod: ModeloAnalitico = {
        id: "mod-homologado",
        demanda_id: "dem-1",
        dataset_autorizado_id: "ds-1",
        nome: "Modelo Congelado",
        descricao: "Desc",
        tipo_arquitetura: TipoArquiteturaModelo.ESTRELA,
        status: StatusModeloAnalitico.HOMOLOGADO,
        homologado_em: new Date().toISOString(),
        homologado_por: "HUMANO",
        justificativa_homologacao: "Aprovado",
        revogado_em: null,
        motivo_revogacao: null,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      };
      modelos.set(mod.id, mod);

      const useCase = new AtualizarModeloAnaliticoUseCase(modeloRepo);
      await expect(
        useCase.execute({
          id: "mod-homologado",
          nome: "Tentativa de alteração",
        })
      ).rejects.toThrow("Modelos analíticos HOMOLOGADOS não podem ser alterados diretamente");
    });
  });

  describe("Adicionar, Configurar e Remover Entidades", () => {
    it("deve adicionar entidade analítica e configurar seus atributos", async () => {
      const mod: ModeloAnalitico = {
        id: "mod-1",
        demanda_id: "dem-1",
        dataset_autorizado_id: "ds-1",
        nome: "Modelo 1",
        descricao: "Desc",
        tipo_arquitetura: TipoArquiteturaModelo.ESTRELA,
        status: StatusModeloAnalitico.RASCUNHO,
        homologado_em: null,
        homologado_por: null,
        justificativa_homologacao: null,
        revogado_em: null,
        motivo_revogacao: null,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      };
      modelos.set(mod.id, mod);

      const addEntidadeUseCase = new AdicionarEntidadeAnaliticaUseCase(modeloRepo, entidadeRepo, ativoRepo);
      const entidade = await addEntidadeUseCase.execute({
        modeloId: "mod-1",
        nome: "Dimensao Clientes",
        tipo: TipoEntidadeAnalitica.DIMENSAO,
        papel: PapelEntidadeAnalitica.DIMENSAO_PADRAO,
      });

      expect(entidade.id).toBeDefined();
      expect(entidade.tipo).toBe(TipoEntidadeAnalitica.DIMENSAO);

      const configAtrUseCase = new ConfigurarAtributosEntidadeUseCase(entidadeRepo, atributoRepo);
      const attrs = await configAtrUseCase.execute({
        entidadeId: entidade.id,
        atributos: [
          {
            nomeOriginal: "id_cliente",
            nomeAmigavel: "ID Cliente",
            tipoDado: TipoDadoAnalitico.INTEIRO,
            papel: PapelAtributoAnalitico.CHAVE_PRIMARIA,
          },
          {
            nomeOriginal: "nome_cliente",
            nomeAmigavel: "Nome",
            tipoDado: TipoDadoAnalitico.TEXTO,
            papel: PapelAtributoAnalitico.ATRIBUTO_DESCRITIVO,
          },
        ],
      });

      expect(attrs.length).toBe(2);
      expect(attrs[0].papel).toBe(PapelAtributoAnalitico.CHAVE_PRIMARIA);

      // Remover entidade
      const removerEntidadeUseCase = new RemoverEntidadeAnaliticaUseCase(
        entidadeRepo,
        relacionamentoRepo,
        metricaRepo
      );
      await removerEntidadeUseCase.execute(entidade.id);
      expect(entidades.has(entidade.id)).toBe(false);
    });
  });

  describe("Relacionamentos e Avaliação de Conformidade", () => {
    it("deve adicionar relacionamento N:M com justificativa e avaliar conformidade", async () => {
      const now = new Date().toISOString();
      const mod: ModeloAnalitico = {
        id: "mod-1",
        demanda_id: "dem-1",
        dataset_autorizado_id: "ds-1",
        nome: "Modelo Vendas",
        descricao: "Grão: Uma linha por venda",
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
      modelos.set(mod.id, mod);

      const ds: DatasetAutorizadoAnalise = {
        id: "ds-1",
        demanda_id: "dem-1",
        ativo_dados_id: "atv-1",
        diagnostico_qualidade_id: "diag-1",
        receita_preparacao_id: null,
        versao_rotulo: "1.0",
        hash_sha256_snapshot: "hash",
        status: StatusAutorizacaoDataset.VIGENTE,
        justificativa_autorizacao: "Vigente",
        autorizado_por_tipo: "HUMANO",
        restricoes_aceitas_snapshot: "[]",
        autorizado_em: now,
        revogado_em: null,
        motivo_revogacao: null,
      };
      datasets.set(ds.id, ds);

      const entFato: EntidadeAnalitica = {
        id: "ent-fato",
        modelo_id: "mod-1",
        ativo_dados_id: "atv-1",
        nome: "FatoVendas",
        tipo: TipoEntidadeAnalitica.FATO,
        papel: PapelEntidadeAnalitica.FATO_TRANSACIONAL,
        origem_tipo: TipoOrigemEntidade.DATASET_AUTORIZADO,
        descricao: "Grão de venda",
        ordem_apresentacao: 1,
        criado_em: now,
        atualizado_em: now,
      };
      entidades.set(entFato.id, entFato);

      const atrFato: AtributoAnalitico = {
        id: "atr-f-1",
        entidade_id: "ent-fato",
        nome_original: "id_venda",
        nome_amigavel: "ID Venda",
        tipo_dado: TipoDadoAnalitico.INTEIRO,
        papel: PapelAtributoAnalitico.CHAVE_PRIMARIA,
        ordem: 1,
        oculto: false,
        descricao: "Identificador da venda",
        formato_exibicao: null,
        criado_em: now,
        atualizado_em: now,
      };
      atributosLista.set(atrFato.id, atrFato);

      const entDim: EntidadeAnalitica = {
        id: "ent-dim",
        modelo_id: "mod-1",
        ativo_dados_id: null,
        nome: "DimTag",
        tipo: TipoEntidadeAnalitica.DIMENSAO,
        papel: PapelEntidadeAnalitica.DIMENSAO_PADRAO,
        origem_tipo: TipoOrigemEntidade.DATASET_AUTORIZADO,
        descricao: "Tags de produtos",
        ordem_apresentacao: 2,
        criado_em: now,
        atualizado_em: now,
      };
      entidades.set(entDim.id, entDim);

      const atrDim: AtributoAnalitico = {
        id: "atr-d-1",
        entidade_id: "ent-dim",
        nome_original: "id_tag",
        nome_amigavel: "ID Tag",
        tipo_dado: TipoDadoAnalitico.INTEIRO,
        papel: PapelAtributoAnalitico.CHAVE_PRIMARIA,
        ordem: 1,
        oculto: false,
        descricao: "Identificador da tag",
        formato_exibicao: null,
        criado_em: now,
        atualizado_em: now,
      };
      atributosLista.set(atrDim.id, atrDim);

      const addRelUseCase = new AdicionarRelacionamentoAnaliticoUseCase(
        modeloRepo,
        entidadeRepo,
        atributoRepo,
        relacionamentoRepo
      );

      const rel = await addRelUseCase.execute({
        modeloId: "mod-1",
        entidadeOrigemId: "ent-fato",
        atributoOrigemId: "atr-f-1",
        entidadeDestinoId: "ent-dim",
        atributoDestinoId: "atr-d-1",
        tipoRelacionamento: CardinalidadeRelacionamento.MUITOS_PARA_MUITOS,
        direcaoFiltro: DirecaoFiltroRelacionamento.BIDIRECIONAL,
        justificativa: "Venda multi-tag",
      });

      expect(rel.tipo_relacionamento).toBe(CardinalidadeRelacionamento.MUITOS_PARA_MUITOS);
      expect(rel.direcao_filtro).toBe(DirecaoFiltroRelacionamento.BIDIRECIONAL);

      // Avaliação de conformidade
      const avaliarUseCase = new AvaliarConformidadeModeloUseCase(modeloRepo, datasetRepo);
      const avaliacao = await avaliarUseCase.execute({ modeloId: "mod-1" });

      expect(avaliacao).toBeDefined();
      expect(avaliacao.diagnosticos.some((d) => d.codigo_regra === "M-06")).toBe(true);
      expect(avaliacao.diagnosticos.some((d) => d.codigo_regra === "M-07")).toBe(true);

      // Remover relacionamento
      const remRelUseCase = new RemoverRelacionamentoAnaliticoUseCase(relacionamentoRepo);
      await remRelUseCase.execute(rel.id);
      expect(relacionamentos.has(rel.id)).toBe(false);
    });
  });
});
