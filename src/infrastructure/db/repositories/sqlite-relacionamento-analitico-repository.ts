import { eq } from 'drizzle-orm';
import { db } from '../client';
import { relacionamentosAnaliticos } from '../schema';
import { RelacionamentoAnalitico } from '@/core/domain/entities/relacionamento-analitico';
import { CardinalidadeRelacionamento } from '@/core/domain/enums/cardinalidade-relacionamento';
import { DirecaoFiltroRelacionamento } from '@/core/domain/enums/direcao-filtro-relacionamento';
import { IRelacionamentoAnaliticoRepository } from '@/core/domain/repositories/relacionamento-analitico-repository.interface';

export class SqliteRelacionamentoAnaliticoRepository implements IRelacionamentoAnaliticoRepository {
  private database: typeof db;

  constructor(customDb?: typeof db) {
    this.database = customDb ?? db;
  }

  private mapRowToEntity(row: typeof relacionamentosAnaliticos.$inferSelect): RelacionamentoAnalitico {
    return {
      id: row.id,
      modelo_id: row.modelo_id,
      entidade_origem_id: row.entidade_origem_id,
      atributo_origem_id: row.atributo_origem_id,
      entidade_destino_id: row.entidade_destino_id,
      atributo_destino_id: row.atributo_destino_id,
      tipo_relacionamento: row.tipo_relacionamento as CardinalidadeRelacionamento,
      direcao_filtro: row.direcao_filtro as DirecaoFiltroRelacionamento,
      ativo: row.ativo === 1,
      justificativa: row.justificativa ?? null,
      criado_em: row.criado_em,
      atualizado_em: row.atualizado_em,
    };
  }

  async findById(id: string): Promise<RelacionamentoAnalitico | null> {
    const row = this.database
      .select()
      .from(relacionamentosAnaliticos)
      .where(eq(relacionamentosAnaliticos.id, id))
      .get();

    if (!row) return null;
    return this.mapRowToEntity(row);
  }

  async findByModeloId(modeloId: string): Promise<RelacionamentoAnalitico[]> {
    const rows = this.database
      .select()
      .from(relacionamentosAnaliticos)
      .where(eq(relacionamentosAnaliticos.modelo_id, modeloId))
      .all();

    return rows.map((r) => this.mapRowToEntity(r));
  }

  async create(relacionamento: RelacionamentoAnalitico): Promise<RelacionamentoAnalitico> {
    this.database
      .insert(relacionamentosAnaliticos)
      .values({
        id: relacionamento.id,
        modelo_id: relacionamento.modelo_id,
        entidade_origem_id: relacionamento.entidade_origem_id,
        atributo_origem_id: relacionamento.atributo_origem_id,
        entidade_destino_id: relacionamento.entidade_destino_id,
        atributo_destino_id: relacionamento.atributo_destino_id,
        tipo_relacionamento: relacionamento.tipo_relacionamento,
        direcao_filtro: relacionamento.direcao_filtro,
        ativo: relacionamento.ativo ? 1 : 0,
        justificativa: relacionamento.justificativa,
        criado_em: relacionamento.criado_em,
        atualizado_em: relacionamento.atualizado_em,
      })
      .run();

    return relacionamento;
  }

  async update(relacionamento: RelacionamentoAnalitico): Promise<RelacionamentoAnalitico> {
    this.database
      .update(relacionamentosAnaliticos)
      .set({
        tipo_relacionamento: relacionamento.tipo_relacionamento,
        direcao_filtro: relacionamento.direcao_filtro,
        ativo: relacionamento.ativo ? 1 : 0,
        justificativa: relacionamento.justificativa,
        atualizado_em: relacionamento.atualizado_em,
      })
      .where(eq(relacionamentosAnaliticos.id, relacionamento.id))
      .run();

    return relacionamento;
  }

  async delete(id: string): Promise<void> {
    this.database
      .delete(relacionamentosAnaliticos)
      .where(eq(relacionamentosAnaliticos.id, id))
      .run();
  }
}
