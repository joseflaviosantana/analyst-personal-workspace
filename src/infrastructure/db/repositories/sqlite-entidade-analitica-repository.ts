import { asc, eq } from 'drizzle-orm';
import { db } from '../client';
import { entidadesAnaliticas } from '../schema';
import { EntidadeAnalitica } from '@/core/domain/entities/entidade-analitica';
import { TipoEntidadeAnalitica } from '@/core/domain/enums/tipo-entidade-analitica';
import { PapelEntidadeAnalitica } from '@/core/domain/enums/papel-entidade-analitica';
import { TipoOrigemEntidade } from '@/core/domain/enums/tipo-origem-entidade';
import { IEntidadeAnaliticaRepository } from '@/core/domain/repositories/entidade-analitica-repository.interface';

export class SqliteEntidadeAnaliticaRepository implements IEntidadeAnaliticaRepository {
  private database: typeof db;

  constructor(customDb?: typeof db) {
    this.database = customDb ?? db;
  }

  private mapRowToEntity(row: typeof entidadesAnaliticas.$inferSelect): EntidadeAnalitica {
    return {
      id: row.id,
      modelo_id: row.modelo_id,
      ativo_dados_id: row.ativo_dados_id ?? null,
      nome: row.nome,
      tipo: row.tipo as TipoEntidadeAnalitica,
      papel: row.papel as PapelEntidadeAnalitica,
      origem_tipo: row.origem_tipo as TipoOrigemEntidade,
      descricao: row.descricao ?? null,
      ordem_apresentacao: row.ordem_apresentacao,
      criado_em: row.criado_em,
      atualizado_em: row.atualizado_em,
    };
  }

  async findById(id: string): Promise<EntidadeAnalitica | null> {
    const row = this.database
      .select()
      .from(entidadesAnaliticas)
      .where(eq(entidadesAnaliticas.id, id))
      .get();

    if (!row) return null;
    return this.mapRowToEntity(row);
  }

  async findByModeloId(modeloId: string): Promise<EntidadeAnalitica[]> {
    const rows = this.database
      .select()
      .from(entidadesAnaliticas)
      .where(eq(entidadesAnaliticas.modelo_id, modeloId))
      .orderBy(asc(entidadesAnaliticas.ordem_apresentacao))
      .all();

    return rows.map((r) => this.mapRowToEntity(r));
  }

  async create(entidade: EntidadeAnalitica): Promise<EntidadeAnalitica> {
    this.database
      .insert(entidadesAnaliticas)
      .values({
        id: entidade.id,
        modelo_id: entidade.modelo_id,
        ativo_dados_id: entidade.ativo_dados_id,
        nome: entidade.nome,
        tipo: entidade.tipo,
        papel: entidade.papel,
        origem_tipo: entidade.origem_tipo,
        descricao: entidade.descricao,
        ordem_apresentacao: entidade.ordem_apresentacao,
        criado_em: entidade.criado_em,
        atualizado_em: entidade.atualizado_em,
      })
      .run();

    return entidade;
  }

  async update(entidade: EntidadeAnalitica): Promise<EntidadeAnalitica> {
    this.database
      .update(entidadesAnaliticas)
      .set({
        nome: entidade.nome,
        tipo: entidade.tipo,
        papel: entidade.papel,
        origem_tipo: entidade.origem_tipo,
        descricao: entidade.descricao,
        ordem_apresentacao: entidade.ordem_apresentacao,
        atualizado_em: entidade.atualizado_em,
      })
      .where(eq(entidadesAnaliticas.id, entidade.id))
      .run();

    return entidade;
  }

  async delete(id: string): Promise<void> {
    this.database
      .delete(entidadesAnaliticas)
      .where(eq(entidadesAnaliticas.id, id))
      .run();
  }

  async createBatch(entidades: EntidadeAnalitica[]): Promise<EntidadeAnalitica[]> {
    if (entidades.length === 0) return [];

    this.database.transaction((tx) => {
      for (const ent of entidades) {
        tx.insert(entidadesAnaliticas)
          .values({
            id: ent.id,
            modelo_id: ent.modelo_id,
            ativo_dados_id: ent.ativo_dados_id,
            nome: ent.nome,
            tipo: ent.tipo,
            papel: ent.papel,
            origem_tipo: ent.origem_tipo,
            descricao: ent.descricao,
            ordem_apresentacao: ent.ordem_apresentacao,
            criado_em: ent.criado_em,
            atualizado_em: ent.atualizado_em,
          })
          .run();
      }
    });

    return entidades;
  }
}
