import { and, desc, eq } from 'drizzle-orm';
import { db } from '../client';
import {
  atributosAnaliticos,
  entidadesAnaliticas,
  metricasAnaliticas,
  modelosAnaliticos,
  relacionamentosAnaliticos,
} from '../schema';
import { ModeloAnalitico, ModeloAnaliticoCompleto } from '@/core/domain/entities/modelo-analitico';
import { EntidadeAnaliticaComAtributos } from '@/core/domain/entities/entidade-analitica';
import { AtributoAnalitico } from '@/core/domain/entities/atributo-analitico';
import { RelacionamentoAnalitico } from '@/core/domain/entities/relacionamento-analitico';
import { MetricaAnalitica } from '@/core/domain/entities/metrica-analitica';
import { StatusModeloAnalitico } from '@/core/domain/enums/status-modelo-analitico';
import { TipoArquiteturaModelo } from '@/core/domain/enums/tipo-arquitetura-modelo';
import { TipoEntidadeAnalitica } from '@/core/domain/enums/tipo-entidade-analitica';
import { PapelEntidadeAnalitica } from '@/core/domain/enums/papel-entidade-analitica';
import { TipoOrigemEntidade } from '@/core/domain/enums/tipo-origem-entidade';
import { TipoDadoAnalitico } from '@/core/domain/enums/tipo-dado-analitico';
import { PapelAtributoAnalitico } from '@/core/domain/enums/papel-atributo-analitico';
import { CardinalidadeRelacionamento } from '@/core/domain/enums/cardinalidade-relacionamento';
import { DirecaoFiltroRelacionamento } from '@/core/domain/enums/direcao-filtro-relacionamento';
import { TipoAgregacaoMetrica } from '@/core/domain/enums/tipo-agregacao-metrica';
import { TipoAditividadeMetrica } from '@/core/domain/enums/tipo-aditividade-metrica';
import { UnidadeMedidaMetrica } from '@/core/domain/enums/unidade-medida-metrica';
import { StatusMetricaAnalitica } from '@/core/domain/enums/status-metrica-analitica';
import { IModeloAnaliticoRepository } from '@/core/domain/repositories/modelo-analitico-repository.interface';

export class SqliteModeloAnaliticoRepository implements IModeloAnaliticoRepository {
  private database: typeof db;

  constructor(customDb?: typeof db) {
    this.database = customDb ?? db;
  }

  private mapRowToEntity(row: typeof modelosAnaliticos.$inferSelect): ModeloAnalitico {
    return {
      id: row.id,
      demanda_id: row.demanda_id,
      dataset_autorizado_id: row.dataset_autorizado_id,
      nome: row.nome,
      descricao: row.descricao ?? null,
      tipo_arquitetura: row.tipo_arquitetura as TipoArquiteturaModelo,
      status: row.status as StatusModeloAnalitico,
      homologado_em: row.homologado_em ?? null,
      homologado_por: row.homologado_por ?? null,
      justificativa_homologacao: row.justificativa_homologacao ?? null,
      revogado_em: row.revogado_em ?? null,
      motivo_revogacao: row.motivo_revogacao ?? null,
      criado_em: row.criado_em,
      atualizado_em: row.atualizado_em,
    };
  }

  async findById(id: string): Promise<ModeloAnalitico | null> {
    const row = this.database
      .select()
      .from(modelosAnaliticos)
      .where(eq(modelosAnaliticos.id, id))
      .get();

    if (!row) return null;
    return this.mapRowToEntity(row);
  }

  async findByDemandaId(demandaId: string): Promise<ModeloAnalitico[]> {
    const rows = this.database
      .select()
      .from(modelosAnaliticos)
      .where(eq(modelosAnaliticos.demanda_id, demandaId))
      .orderBy(desc(modelosAnaliticos.criado_em))
      .all();

    return rows.map((r) => this.mapRowToEntity(r));
  }

  async findHomologadoByDemandaId(demandaId: string): Promise<ModeloAnalitico | null> {
    const row = this.database
      .select()
      .from(modelosAnaliticos)
      .where(
        and(
          eq(modelosAnaliticos.demanda_id, demandaId),
          eq(modelosAnaliticos.status, StatusModeloAnalitico.HOMOLOGADO)
        )
      )
      .get();

    if (!row) return null;
    return this.mapRowToEntity(row);
  }

  async findCompletoById(id: string): Promise<ModeloAnaliticoCompleto | null> {
    const modelo = await this.findById(id);
    if (!modelo) return null;

    const entidadesRows = this.database
      .select()
      .from(entidadesAnaliticas)
      .where(eq(entidadesAnaliticas.modelo_id, id))
      .orderBy(entidadesAnaliticas.ordem_apresentacao)
      .all();

    const entidadesComAtributos: EntidadeAnaliticaComAtributos[] = [];

    for (const entRow of entidadesRows) {
      const atributosRows = this.database
        .select()
        .from(atributosAnaliticos)
        .where(eq(atributosAnaliticos.entidade_id, entRow.id))
        .orderBy(atributosAnaliticos.ordem)
        .all();

      const atributos: AtributoAnalitico[] = atributosRows.map((a) => ({
        id: a.id,
        entidade_id: a.entidade_id,
        nome_original: a.nome_original,
        nome_amigavel: a.nome_amigavel,
        tipo_dado: a.tipo_dado as TipoDadoAnalitico,
        papel: a.papel as PapelAtributoAnalitico,
        ordem: a.ordem,
        oculto: a.oculto === 1,
        descricao: a.descricao ?? null,
        formato_exibicao: a.formato_exibicao ?? null,
        criado_em: a.criado_em,
        atualizado_em: a.atualizado_em,
      }));

      entidadesComAtributos.push({
        id: entRow.id,
        modelo_id: entRow.modelo_id,
        ativo_dados_id: entRow.ativo_dados_id ?? null,
        nome: entRow.nome,
        tipo: entRow.tipo as TipoEntidadeAnalitica,
        papel: entRow.papel as PapelEntidadeAnalitica,
        origem_tipo: entRow.origem_tipo as TipoOrigemEntidade,
        descricao: entRow.descricao ?? null,
        ordem_apresentacao: entRow.ordem_apresentacao,
        criado_em: entRow.criado_em,
        atualizado_em: entRow.atualizado_em,
        atributos,
      });
    }

    const relacionamentosRows = this.database
      .select()
      .from(relacionamentosAnaliticos)
      .where(eq(relacionamentosAnaliticos.modelo_id, id))
      .all();

    const relacionamentos: RelacionamentoAnalitico[] = relacionamentosRows.map((r) => ({
      id: r.id,
      modelo_id: r.modelo_id,
      entidade_origem_id: r.entidade_origem_id,
      atributo_origem_id: r.atributo_origem_id,
      entidade_destino_id: r.entidade_destino_id,
      atributo_destino_id: r.atributo_destino_id,
      tipo_relacionamento: r.tipo_relacionamento as CardinalidadeRelacionamento,
      direcao_filtro: r.direcao_filtro as DirecaoFiltroRelacionamento,
      ativo: r.ativo === 1,
      justificativa: r.justificativa ?? null,
      criado_em: r.criado_em,
      atualizado_em: r.atualizado_em,
    }));

    const metricasRows = this.database
      .select()
      .from(metricasAnaliticas)
      .where(eq(metricasAnaliticas.modelo_id, id))
      .orderBy(metricasAnaliticas.ordem)
      .all();

    const metricas: MetricaAnalitica[] = metricasRows.map((m) => {
      let attrDeps: string[] = [];
      let metDeps: string[] = [];
      try {
        attrDeps = JSON.parse(m.atributos_dependentes_ids);
      } catch {
        attrDeps = [];
      }
      try {
        metDeps = JSON.parse(m.metricas_dependentes_ids);
      } catch {
        metDeps = [];
      }

      return {
        id: m.id,
        modelo_id: m.modelo_id,
        entidade_id: m.entidade_id ?? null,
        nome: m.nome,
        descricao: m.descricao ?? null,
        tipo_agregacao: m.tipo_agregacao as TipoAgregacaoMetrica,
        tipo_aditividade: m.tipo_aditividade as TipoAditividadeMetrica,
        formula_declarativa: m.formula_declarativa,
        unidade_medida: m.unidade_medida as UnidadeMedidaMetrica,
        formato_exibicao: m.formato_exibicao ?? null,
        status: m.status as StatusMetricaAnalitica,
        atributos_dependentes_ids: attrDeps,
        metricas_dependentes_ids: metDeps,
        pergunta_negocio_associada: m.pergunta_negocio_associada ?? null,
        objetivo_negocio_associado: m.objetivo_negocio_associado ?? null,
        ordem: m.ordem,
        criado_em: m.criado_em,
        atualizado_em: m.atualizado_em,
      };
    });

    return {
      ...modelo,
      entidades: entidadesComAtributos,
      relacionamentos,
      metricas,
    };
  }

  async create(modelo: ModeloAnalitico): Promise<ModeloAnalitico> {
    this.database
      .insert(modelosAnaliticos)
      .values({
        id: modelo.id,
        demanda_id: modelo.demanda_id,
        dataset_autorizado_id: modelo.dataset_autorizado_id,
        nome: modelo.nome,
        descricao: modelo.descricao,
        tipo_arquitetura: modelo.tipo_arquitetura,
        status: modelo.status,
        homologado_em: modelo.homologado_em,
        homologado_por: modelo.homologado_por,
        justificativa_homologacao: modelo.justificativa_homologacao,
        revogado_em: modelo.revogado_em,
        motivo_revogacao: modelo.motivo_revogacao,
        criado_em: modelo.criado_em,
        atualizado_em: modelo.atualizado_em,
      })
      .run();

    return modelo;
  }

  async update(modelo: ModeloAnalitico): Promise<ModeloAnalitico> {
    this.database
      .update(modelosAnaliticos)
      .set({
        nome: modelo.nome,
        descricao: modelo.descricao,
        tipo_arquitetura: modelo.tipo_arquitetura,
        status: modelo.status,
        homologado_em: modelo.homologado_em,
        homologado_por: modelo.homologado_por,
        justificativa_homologacao: modelo.justificativa_homologacao,
        revogado_em: modelo.revogado_em,
        motivo_revogacao: modelo.motivo_revogacao,
        atualizado_em: modelo.atualizado_em,
      })
      .where(eq(modelosAnaliticos.id, modelo.id))
      .run();

    return modelo;
  }

  async delete(id: string): Promise<void> {
    this.database
      .delete(modelosAnaliticos)
      .where(eq(modelosAnaliticos.id, id))
      .run();
  }

  async homologarTransacional(
    id: string,
    homologadoPor: string,
    justificativa: string,
    timestamp: string
  ): Promise<ModeloAnalitico> {
    return this.database.transaction((tx) => {
      const target = tx
        .select()
        .from(modelosAnaliticos)
        .where(eq(modelosAnaliticos.id, id))
        .get();

      if (!target) {
        throw new Error(`Modelo analítico com ID ${id} não encontrado.`);
      }

      // 1. Revoga atomicamente qualquer outro modelo homologado da mesma demanda
      const homologadosAtuais = tx
        .select()
        .from(modelosAnaliticos)
        .where(
          and(
            eq(modelosAnaliticos.demanda_id, target.demanda_id),
            eq(modelosAnaliticos.status, StatusModeloAnalitico.HOMOLOGADO)
          )
        )
        .all();

      for (const h of homologadosAtuais) {
        if (h.id !== id) {
          tx.update(modelosAnaliticos)
            .set({
              status: StatusModeloAnalitico.REVOGADO,
              revogado_em: timestamp,
              motivo_revogacao: 'Substituído por novo modelo analítico homologado.',
              atualizado_em: timestamp,
            })
            .where(eq(modelosAnaliticos.id, h.id))
            .run();
        }
      }

      // 2. Homologa o modelo selecionado
      tx.update(modelosAnaliticos)
        .set({
          status: StatusModeloAnalitico.HOMOLOGADO,
          homologado_em: timestamp,
          homologado_por: homologadoPor,
          justificativa_homologacao: justificativa,
          atualizado_em: timestamp,
        })
        .where(eq(modelosAnaliticos.id, id))
        .run();

      const updated = tx
        .select()
        .from(modelosAnaliticos)
        .where(eq(modelosAnaliticos.id, id))
        .get();

      if (!updated) {
        throw new Error('Falha ao recuperar modelo homologado pós-transação.');
      }

      return this.mapRowToEntity(updated);
    });
  }

  async revogar(id: string, motivo: string, timestamp: string): Promise<ModeloAnalitico | null> {
    const target = await this.findById(id);
    if (!target) return null;

    this.database
      .update(modelosAnaliticos)
      .set({
        status: StatusModeloAnalitico.REVOGADO,
        revogado_em: timestamp,
        motivo_revogacao: motivo,
        atualizado_em: timestamp,
      })
      .where(eq(modelosAnaliticos.id, id))
      .run();

    return this.findById(id);
  }
}
