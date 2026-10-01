import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../client';
import { requisitosDemanda } from '../schema';
import { RequisitoDemanda } from '@/core/domain/entities/requisito-demanda';
import { CategoriaRequisito } from '@/core/domain/enums/categoria-requisito';
import { StatusRequisito } from '@/core/domain/enums/status-requisito';
import { IRequisitoDemandaRepository } from '@/core/domain/repositories/requisito-demanda-repository.interface';

export class SqliteRequisitoDemandaRepository implements IRequisitoDemandaRepository {
  private database: typeof db;

  constructor(customDb?: typeof db) {
    this.database = customDb ?? db;
  }

  async create(requisito: RequisitoDemanda): Promise<RequisitoDemanda> {
    this.database.insert(requisitosDemanda).values(requisito).run();
    return requisito;
  }

  async findById(id: string): Promise<RequisitoDemanda | null> {
    const row = this.database
      .select()
      .from(requisitosDemanda)
      .where(eq(requisitosDemanda.id, id))
      .get();

    if (!row) return null;

    return {
      id: row.id,
      demanda_id: row.demanda_id,
      titulo: row.titulo,
      descricao: row.descricao,
      categoria: row.categoria as CategoriaRequisito,
      prioridade: row.prioridade as 'OBRIGATORIO' | 'DESEJAVEL',
      status: row.status as StatusRequisito,
      origem: row.origem as 'MANUAL' | 'SUGERIDO_COPILOTO',
      criado_em: row.criado_em,
      atualizado_em: row.atualizado_em,
    };
  }

  async findByDemandId(demandaId: string): Promise<RequisitoDemanda[]> {
    const rows = this.database
      .select()
      .from(requisitosDemanda)
      .where(eq(requisitosDemanda.demanda_id, demandaId))
      .orderBy(desc(requisitosDemanda.criado_em))
      .all();

    return rows.map((row) => ({
      id: row.id,
      demanda_id: row.demanda_id,
      titulo: row.titulo,
      descricao: row.descricao,
      categoria: row.categoria as CategoriaRequisito,
      prioridade: row.prioridade as 'OBRIGATORIO' | 'DESEJAVEL',
      status: row.status as StatusRequisito,
      origem: row.origem as 'MANUAL' | 'SUGERIDO_COPILOTO',
      criado_em: row.criado_em,
      atualizado_em: row.atualizado_em,
    }));
  }

  async update(id: string, partial: Partial<RequisitoDemanda>): Promise<RequisitoDemanda | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated = {
      ...partial,
      atualizado_em: new Date().toISOString(),
    };

    this.database
      .update(requisitosDemanda)
      .set(updated)
      .where(eq(requisitosDemanda.id, id))
      .run();

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const res = this.database
      .delete(requisitosDemanda)
      .where(eq(requisitosDemanda.id, id))
      .run();

    return res.changes > 0;
  }

  async countByDemandId(demandaId: string): Promise<number> {
    const result = this.database
      .select({ count: sql<number>`count(*)` })
      .from(requisitosDemanda)
      .where(eq(requisitosDemanda.demanda_id, demandaId))
      .get();

    return result ? Number(result.count) : 0;
  }
}
