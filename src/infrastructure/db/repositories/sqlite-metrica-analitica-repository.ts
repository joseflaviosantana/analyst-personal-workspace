import { asc, eq } from 'drizzle-orm';
import { db } from '../client';
import { metricasAnaliticas } from '../schema';
import { MetricaAnalitica } from '@/core/domain/entities/metrica-analitica';
import { TipoAgregacaoMetrica } from '@/core/domain/enums/tipo-agregacao-metrica';
import { TipoAditividadeMetrica } from '@/core/domain/enums/tipo-aditividade-metrica';
import { UnidadeMedidaMetrica } from '@/core/domain/enums/unidade-medida-metrica';
import { StatusMetricaAnalitica } from '@/core/domain/enums/status-metrica-analitica';
import { IMetricaAnaliticaRepository } from '@/core/domain/repositories/metrica-analitica-repository.interface';

export class SqliteMetricaAnaliticaRepository implements IMetricaAnaliticaRepository {
  private database: typeof db;

  constructor(customDb?: typeof db) {
    this.database = customDb ?? db;
  }

  private mapRowToEntity(row: typeof metricasAnaliticas.$inferSelect): MetricaAnalitica {
    let attrDeps: string[] = [];
    let metDeps: string[] = [];

    try {
      attrDeps = JSON.parse(row.atributos_dependentes_ids);
    } catch {
      attrDeps = [];
    }

    try {
      metDeps = JSON.parse(row.metricas_dependentes_ids);
    } catch {
      metDeps = [];
    }

    return {
      id: row.id,
      modelo_id: row.modelo_id,
      entidade_id: row.entidade_id ?? null,
      nome: row.nome,
      descricao: row.descricao ?? null,
      tipo_agregacao: row.tipo_agregacao as TipoAgregacaoMetrica,
      tipo_aditividade: row.tipo_aditividade as TipoAditividadeMetrica,
      formula_declarativa: row.formula_declarativa,
      unidade_medida: row.unidade_medida as UnidadeMedidaMetrica,
      formato_exibicao: row.formato_exibicao ?? null,
      status: row.status as StatusMetricaAnalitica,
      atributos_dependentes_ids: attrDeps,
      metricas_dependentes_ids: metDeps,
      pergunta_negocio_associada: row.pergunta_negocio_associada ?? null,
      objetivo_negocio_associado: row.objetivo_negocio_associado ?? null,
      ordem: row.ordem,
      criado_em: row.criado_em,
      atualizado_em: row.atualizado_em,
    };
  }

  async findById(id: string): Promise<MetricaAnalitica | null> {
    const row = this.database
      .select()
      .from(metricasAnaliticas)
      .where(eq(metricasAnaliticas.id, id))
      .get();

    if (!row) return null;
    return this.mapRowToEntity(row);
  }

  async findByModeloId(modeloId: string): Promise<MetricaAnalitica[]> {
    const rows = this.database
      .select()
      .from(metricasAnaliticas)
      .where(eq(metricasAnaliticas.modelo_id, modeloId))
      .orderBy(asc(metricasAnaliticas.ordem))
      .all();

    return rows.map((r) => this.mapRowToEntity(r));
  }

  async create(metrica: MetricaAnalitica): Promise<MetricaAnalitica> {
    this.database
      .insert(metricasAnaliticas)
      .values({
        id: metrica.id,
        modelo_id: metrica.modelo_id,
        entidade_id: metrica.entidade_id,
        nome: metrica.nome,
        descricao: metrica.descricao,
        tipo_agregacao: metrica.tipo_agregacao,
        tipo_aditividade: metrica.tipo_aditividade,
        formula_declarativa: metrica.formula_declarativa,
        unidade_medida: metrica.unidade_medida,
        formato_exibicao: metrica.formato_exibicao,
        status: metrica.status,
        atributos_dependentes_ids: JSON.stringify(metrica.atributos_dependentes_ids ?? []),
        metricas_dependentes_ids: JSON.stringify(metrica.metricas_dependentes_ids ?? []),
        pergunta_negocio_associada: metrica.pergunta_negocio_associada,
        objetivo_negocio_associado: metrica.objetivo_negocio_associado,
        ordem: metrica.ordem,
        criado_em: metrica.criado_em,
        atualizado_em: metrica.atualizado_em,
      })
      .run();

    return metrica;
  }

  async update(metrica: MetricaAnalitica): Promise<MetricaAnalitica> {
    this.database
      .update(metricasAnaliticas)
      .set({
        entidade_id: metrica.entidade_id,
        nome: metrica.nome,
        descricao: metrica.descricao,
        tipo_agregacao: metrica.tipo_agregacao,
        tipo_aditividade: metrica.tipo_aditividade,
        formula_declarativa: metrica.formula_declarativa,
        unidade_medida: metrica.unidade_medida,
        formato_exibicao: metrica.formato_exibicao,
        status: metrica.status,
        atributos_dependentes_ids: JSON.stringify(metrica.atributos_dependentes_ids ?? []),
        metricas_dependentes_ids: JSON.stringify(metrica.metricas_dependentes_ids ?? []),
        pergunta_negocio_associada: metrica.pergunta_negocio_associada,
        objetivo_negocio_associado: metrica.objetivo_negocio_associado,
        ordem: metrica.ordem,
        atualizado_em: metrica.atualizado_em,
      })
      .where(eq(metricasAnaliticas.id, metrica.id))
      .run();

    return metrica;
  }

  async delete(id: string): Promise<void> {
    this.database
      .delete(metricasAnaliticas)
      .where(eq(metricasAnaliticas.id, id))
      .run();
  }
}
