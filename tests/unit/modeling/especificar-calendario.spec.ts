import { describe, it, expect, beforeEach } from "vitest";
import { EspecificarDimensaoCalendarioUseCase } from "@/core/use-cases/modeling/especificar-dimensao-calendario.use-case";

import { IModeloAnaliticoRepository } from "@/core/domain/repositories/modelo-analitico-repository.interface";
import { IEntidadeAnaliticaRepository } from "@/core/domain/repositories/entidade-analitica-repository.interface";
import { IAtributoAnaliticoRepository } from "@/core/domain/repositories/atributo-analitico-repository.interface";

import { ModeloAnalitico } from "@/core/domain/entities/modelo-analitico";
import { EntidadeAnalitica } from "@/core/domain/entities/entidade-analitica";
import { AtributoAnalitico } from "@/core/domain/entities/atributo-analitico";

import { StatusModeloAnalitico } from "@/core/domain/enums/status-modelo-analitico";
import { TipoArquiteturaModelo } from "@/core/domain/enums/tipo-arquitetura-modelo";
import { TipoEntidadeAnalitica } from "@/core/domain/enums/tipo-entidade-analitica";
import { PapelEntidadeAnalitica } from "@/core/domain/enums/papel-entidade-analitica";
import { TipoOrigemEntidade } from "@/core/domain/enums/tipo-origem-entidade";
import { TipoDadoAnalitico } from "@/core/domain/enums/tipo-dado-analitico";
import { PapelAtributoAnalitico } from "@/core/domain/enums/papel-atributo-analitico";

describe("EspecificarDimensaoCalendarioUseCase (Subunidade 3.6B)", () => {
  let modelos: Map<string, ModeloAnalitico>;
  let entidades: Map<string, EntidadeAnalitica>;
  let atributos: Map<string, AtributoAnalitico>;

  let modeloRepo: IModeloAnaliticoRepository;
  let entidadeRepo: IEntidadeAnaliticaRepository;
  let atributoRepo: IAtributoAnaliticoRepository;

  beforeEach(() => {
    modelos = new Map();
    entidades = new Map();
    atributos = new Map();

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
      createBatch: async (b) => {
        for (const e of b) entidades.set(e.id, e);
        return b;
      },
    };

    atributoRepo = {
      findById: async (id) => atributos.get(id) ?? null,
      findByEntidadeId: async (entId) => Array.from(atributos.values()).filter((a) => a.entidade_id === entId),
      create: async (a) => {
        atributos.set(a.id, a);
        return a;
      },
      update: async (a) => {
        atributos.set(a.id, a);
        return a;
      },
      delete: async (id) => {
        atributos.delete(id);
      },
      createBatch: async (batch) => {
        for (const a of batch) atributos.set(a.id, a);
        return batch;
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
  });

  it("deve criar especificação lógica de Dimensão Calendário com os 8 atributos canônicos", async () => {
    const useCase = new EspecificarDimensaoCalendarioUseCase(
      modeloRepo,
      entidadeRepo,
      atributoRepo
    );

    const resultado = await useCase.execute({
      modeloId: "mod-1",
      nome: "Calendário Oficial",
      dataInicio: "2024-01-01",
      dataFim: "2025-12-31",
    });

    expect(resultado.id).toBeDefined();
    expect(resultado.nome).toBe("Calendário Oficial");
    expect(resultado.tipo).toBe(TipoEntidadeAnalitica.DIMENSAO);
    expect(resultado.papel).toBe(PapelEntidadeAnalitica.DIMENSAO_CALENDARIO);
    expect(resultado.origem_tipo).toBe(TipoOrigemEntidade.DIMENSAO_SISTEMA);
    expect(resultado.ativo_dados_id).toBeNull();
    expect(resultado.descricao).toContain("2024-01-01 a 2025-12-31");

    expect(resultado.atributos.length).toBe(8);

    const nomes = resultado.atributos.map((a) => a.nome_original);
    expect(nomes).toContain("data");
    expect(nomes).toContain("ano");
    expect(nomes).toContain("mes");
    expect(nomes).toContain("numero_mes");
    expect(nomes).toContain("ano_mes");
    expect(nomes).toContain("trimestre");
    expect(nomes).toContain("dia_semana");
    expect(nomes).toContain("eh_dia_util");

    // Verificar papéis e tipos canônicos
    const attrData = resultado.atributos.find((a) => a.nome_original === "data")!;
    expect(attrData.papel).toBe(PapelAtributoAnalitico.CHAVE_PRIMARIA);
    expect(attrData.tipo_dado).toBe(TipoDadoAnalitico.DATA);

    const attrAno = resultado.atributos.find((a) => a.nome_original === "ano")!;
    expect(attrAno.tipo_dado).toBe(TipoDadoAnalitico.INTEIRO);

    const attrDiaUtil = resultado.atributos.find((a) => a.nome_original === "eh_dia_util")!;
    expect(attrDiaUtil.tipo_dado).toBe(TipoDadoAnalitico.BOOLEANO);
  });

  it("deve ser idempotente atualizando a dimensão calendário já existente", async () => {
    const useCase = new EspecificarDimensaoCalendarioUseCase(
      modeloRepo,
      entidadeRepo,
      atributoRepo
    );

    const primeiro = await useCase.execute({
      modeloId: "mod-1",
      nome: "Calendário v1",
    });

    const segundo = await useCase.execute({
      modeloId: "mod-1",
      nome: "Calendário v2 Atualizado",
      dataInicio: "2020-01-01",
      dataFim: "2030-12-31",
    });

    expect(segundo.id).toBe(primeiro.id);
    expect(segundo.nome).toBe("Calendário v2 Atualizado");
    expect(segundo.atributos.length).toBe(8);
  });

  it("deve lançar erro se o modelo analítico não existir", async () => {
    const useCase = new EspecificarDimensaoCalendarioUseCase(
      modeloRepo,
      entidadeRepo,
      atributoRepo
    );

    await expect(
      useCase.execute({
        modeloId: "mod-inexistente",
      })
    ).rejects.toThrow("Modelo analítico com ID 'mod-inexistente' não encontrado");
  });
});
