import { asc, eq } from 'drizzle-orm';
import { db } from '../client';
import { medidasDax } from '../schema';
import { MedidaDax } from '@/core/domain/entities/medida-dax';
import { CategoriaMedidaDax } from '@/core/domain/enums/categoria-medida-dax';
import { IMedidaDaxRepository } from '@/core/domain/repositories/medida-dax-repository.interface';

export class SqliteMedidaDaxRepository implements IMedidaDaxRepository {
  private database: typeof db;

  constructor(customDb?: typeof db) {
    this.database = customDb ?? db;
  }

  private mapRowToEntity(row: typeof medidasDax.$inferSelect): MedidaDax {
    return {
      id: row.id,
      modelo_powerbi_id: row.modelo_powerbi_id,
      metrica_analitica_id: row.metrica_analitica_id ?? null,
      nome: row.nome,
      tabela_hospedeira: row.tabela_hospedeira,
      expressao_dax: row.expressao_dax,
      descricao: row.descricao ?? null,
      formato_string: row.formato_string ?? null,
      categoria_dax: row.categoria_dax as CategoriaMedidaDax,
      ordem: row.ordem,
      criado_em: row.criado_em,
      atualizado_em: row.atualizado_em,
    };
  }

  async findById(id: string): Promise<MedidaDax | null> {
    const row = this.database
      .select()
      .from(medidasDax)
      .where(eq(medidasDax.id, id))
      .get();

    if (!row) return null;
    return this.mapRowToEntity(row);
  }

  async findByModeloPowerBiId(modeloPowerBiId: string): Promise<MedidaDax[]> {
    const rows = this.database
      .select()
      .from(medidasDax)
      .where(eq(medidasDax.modelo_powerbi_id, modeloPowerBiId))
      .orderBy(asc(medidasDax.ordem))
      .all();

    return rows.map((r) => this.mapRowToEntity(r));
  }

  async findByMetricaAnaliticaId(metricaAnaliticaId: string): Promise<MedidaDax[]> {
    const rows = this.database
      .select()
      .from(medidasDax)
      .where(eq(medidasDax.metrica_analitica_id, metricaAnaliticaId))
      .orderBy(asc(medidasDax.ordem))
      .all();

    return rows.map((r) => this.mapRowToEntity(r));
  }

  async create(medida: MedidaDax): Promise<MedidaDax> {
    this.database
      .insert(medidasDax)
      .values({
        id: medida.id,
        modelo_powerbi_id: medida.modelo_powerbi_id,
        metrica_analitica_id: medida.metrica_analitica_id,
        nome: medida.nome,
        tabela_hospedeira: medida.tabela_hospedeira,
        expressao_dax: medida.expressao_dax,
        descricao: medida.descricao,
        formato_string: medida.formato_string,
        categoria_dax: medida.categoria_dax,
        ordem: medida.ordem,
        criado_em: medida.criado_em,
        atualizado_em: medida.atualizado_em,
      })
      .run();

    return medida;
  }

  async update(medida: MedidaDax): Promise<MedidaDax> {
    this.database
      .update(medidasDax)
      .set({
        metrica_analitica_id: medida.metrica_analitica_id,
        nome: medida.nome,
        tabela_hospedeira: medida.tabela_hospedeira,
        expressao_dax: medida.expressao_dax,
        descricao: medida.descricao,
        formato_string: medida.formato_string,
        categoria_dax: medida.categoria_dax,
        ordem: medida.ordem,
        atualizado_em: medida.atualizado_em,
      })
      .where(eq(medidasDax.id, medida.id))
      .run();

    return medida;
  }

  async delete(id: string): Promise<void> {
    this.database
      .delete(medidasDax)
      .where(eq(medidasDax.id, id))
      .run();
  }
}
