/**
 * src/infrastructure/db/repositories/sqlite-ativo-aprendizado-repository.ts
 *
 * Implementação SQLite do repositório de Ativos de Aprendizado (Subgate 3.9 — Aba 11).
 */

import { desc, eq, like, or } from 'drizzle-orm';
import { db } from '../client';
import { ativosAprendizado } from '../schema';
import { AtivoAprendizado } from '@/core/domain/entities/ativo-aprendizado';
import { CategoriaAtivoAprendizado } from '@/core/domain/enums/categoria-ativo-aprendizado';
import {
  IAtivoAprendizadoRepository,
  FiltrosConsultaAtivosAprendizado,
} from '@/core/domain/repositories/ativo-aprendizado-repository.interface';

export class SqliteAtivoAprendizadoRepository implements IAtivoAprendizadoRepository {
  private database: typeof db;

  constructor(customDb?: typeof db) {
    this.database = customDb ?? db;
  }

  private mapRowToEntity(row: typeof ativosAprendizado.$inferSelect): AtivoAprendizado {
    let tags: string[] = [];
    try {
      if (row.tags) {
        tags = JSON.parse(row.tags);
      }
    } catch {
      tags = [];
    }

    return {
      id: row.id,
      demanda_id: row.demanda_id ?? null,
      titulo: row.titulo,
      categoria: row.categoria as CategoriaAtivoAprendizado,
      descricao: row.descricao ?? null,
      procedimento_padrao: row.procedimento_padrao,
      contexto_aplicacao: row.contexto_aplicacao ?? null,
      tags,
      criado_em: row.criado_em,
      atualizado_em: row.atualizado_em,
    };
  }

  async findByDemandId(demandaId: string): Promise<AtivoAprendizado[]> {
    const rows = await this.database
      .select()
      .from(ativosAprendizado)
      .where(eq(ativosAprendizado.demanda_id, demandaId))
      .orderBy(desc(ativosAprendizado.criado_em));

    return rows.map((r) => this.mapRowToEntity(r));
  }

  async findAll(filtros?: FiltrosConsultaAtivosAprendizado): Promise<AtivoAprendizado[]> {
    let query = this.database.select().from(ativosAprendizado);

    if (filtros?.demandaId) {
      query = query.where(eq(ativosAprendizado.demanda_id, filtros.demandaId)) as typeof query;
    }

    if (filtros?.categoria) {
      query = query.where(eq(ativosAprendizado.categoria, filtros.categoria)) as typeof query;
    }

    if (filtros?.busca) {
      const termo = `%${filtros.busca}%`;
      query = query.where(
        or(
          like(ativosAprendizado.titulo, termo),
          like(ativosAprendizado.descricao, termo),
          like(ativosAprendizado.procedimento_padrao, termo)
        )
      ) as typeof query;
    }

    const rows = await query.orderBy(desc(ativosAprendizado.criado_em));
    return rows.map((r) => this.mapRowToEntity(r));
  }

  async findById(id: string): Promise<AtivoAprendizado | null> {
    const rows = await this.database
      .select()
      .from(ativosAprendizado)
      .where(eq(ativosAprendizado.id, id))
      .limit(1);

    if (rows.length === 0) return null;
    return this.mapRowToEntity(rows[0]);
  }

  async save(ativo: AtivoAprendizado): Promise<AtivoAprendizado> {
    const existing = await this.findById(ativo.id);

    const values = {
      id: ativo.id,
      demanda_id: ativo.demanda_id,
      titulo: ativo.titulo,
      categoria: ativo.categoria,
      descricao: ativo.descricao,
      procedimento_padrao: ativo.procedimento_padrao,
      contexto_aplicacao: ativo.contexto_aplicacao,
      tags: JSON.stringify(ativo.tags),
      criado_em: ativo.criado_em,
      atualizado_em: ativo.atualizado_em,
    };

    if (existing) {
      await this.database
        .update(ativosAprendizado)
        .set(values)
        .where(eq(ativosAprendizado.id, ativo.id));
    } else {
      await this.database.insert(ativosAprendizado).values(values);
    }

    return ativo;
  }

  async delete(id: string): Promise<void> {
    await this.database
      .delete(ativosAprendizado)
      .where(eq(ativosAprendizado.id, id));
  }
}
