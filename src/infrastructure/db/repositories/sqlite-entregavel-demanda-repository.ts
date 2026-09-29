import { asc, count, eq } from 'drizzle-orm';
import { db } from '../client';
import { entregaveisDemanda } from '../schema';
import { EntregavelDemanda } from '@/core/domain/entities/entregavel-demanda';
import { TipoEntregavel } from '@/core/domain/enums/tipo-entregavel';
import { StatusEntregavel } from '@/core/domain/enums/status-entregavel';
import { StatusAceiteEntrega } from '@/core/domain/enums/status-aceite-entrega';
import { IEntregavelDemandaRepository } from '@/core/domain/repositories/entregavel-demanda-repository.interface';

export class SqliteEntregavelDemandaRepository implements IEntregavelDemandaRepository {
  private database: typeof db;

  constructor(customDb?: typeof db) {
    this.database = customDb ?? db;
  }

  private mapRowToEntity(row: typeof entregaveisDemanda.$inferSelect): EntregavelDemanda {
    return {
      id: row.id,
      demanda_id: row.demanda_id,
      titulo: row.titulo,
      tipo: row.tipo as TipoEntregavel,
      versao: row.versao,
      caminho_arquivo_ou_link: row.caminho_arquivo_ou_link,
      descricao_sumario: row.descricao_sumario ?? null,
      obrigatorio: Boolean(row.obrigatorio),
      status: row.status as StatusEntregavel,
      aceite_status: row.aceite_status as StatusAceiteEntrega,
      aceite_justificativa: row.aceite_justificativa ?? null,
      aceite_por: row.aceite_por ?? null,
      aceite_em: row.aceite_em ?? null,
      criado_em: row.criado_em,
      atualizado_em: row.atualizado_em,
    };
  }

  async create(entregavel: EntregavelDemanda): Promise<EntregavelDemanda> {
    this.database
      .insert(entregaveisDemanda)
      .values({
        id: entregavel.id,
        demanda_id: entregavel.demanda_id,
        titulo: entregavel.titulo,
        tipo: entregavel.tipo,
        versao: entregavel.versao,
        caminho_arquivo_ou_link: entregavel.caminho_arquivo_ou_link,
        descricao_sumario: entregavel.descricao_sumario ?? null,
        obrigatorio: entregavel.obrigatorio,
        status: entregavel.status,
        aceite_status: entregavel.aceite_status,
        aceite_justificativa: entregavel.aceite_justificativa ?? null,
        aceite_por: entregavel.aceite_por ?? null,
        aceite_em: entregavel.aceite_em ?? null,
        criado_em: entregavel.criado_em,
        atualizado_em: entregavel.atualizado_em,
      })
      .run();

    return entregavel;
  }

  async findById(id: string): Promise<EntregavelDemanda | null> {
    const row = this.database
      .select()
      .from(entregaveisDemanda)
      .where(eq(entregaveisDemanda.id, id))
      .get();

    if (!row) return null;
    return this.mapRowToEntity(row);
  }

  async findByDemandId(demandaId: string): Promise<EntregavelDemanda[]> {
    const rows = this.database
      .select()
      .from(entregaveisDemanda)
      .where(eq(entregaveisDemanda.demanda_id, demandaId))
      .orderBy(asc(entregaveisDemanda.criado_em))
      .all();

    return rows.map((r) => this.mapRowToEntity(r));
  }

  async update(id: string, partial: Partial<EntregavelDemanda>): Promise<EntregavelDemanda | null> {
    const existente = await this.findById(id);
    if (!existente) return null;

    const valuesToUpdate: Partial<typeof entregaveisDemanda.$inferInsert> = {};

    if (partial.titulo !== undefined) valuesToUpdate.titulo = partial.titulo;
    if (partial.tipo !== undefined) valuesToUpdate.tipo = partial.tipo;
    if (partial.versao !== undefined) valuesToUpdate.versao = partial.versao;
    if (partial.caminho_arquivo_ou_link !== undefined) valuesToUpdate.caminho_arquivo_ou_link = partial.caminho_arquivo_ou_link;
    if (partial.descricao_sumario !== undefined) valuesToUpdate.descricao_sumario = partial.descricao_sumario;
    if (partial.obrigatorio !== undefined) valuesToUpdate.obrigatorio = partial.obrigatorio;
    if (partial.status !== undefined) valuesToUpdate.status = partial.status;
    if (partial.aceite_status !== undefined) valuesToUpdate.aceite_status = partial.aceite_status;
    if (partial.aceite_justificativa !== undefined) valuesToUpdate.aceite_justificativa = partial.aceite_justificativa;
    if (partial.aceite_por !== undefined) valuesToUpdate.aceite_por = partial.aceite_por;
    if (partial.aceite_em !== undefined) valuesToUpdate.aceite_em = partial.aceite_em;
    valuesToUpdate.atualizado_em = partial.atualizado_em ?? new Date().toISOString();

    this.database
      .update(entregaveisDemanda)
      .set(valuesToUpdate)
      .where(eq(entregaveisDemanda.id, id))
      .run();

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const res = this.database
      .delete(entregaveisDemanda)
      .where(eq(entregaveisDemanda.id, id))
      .run();

    return res.changes > 0;
  }

  async countByDemandId(demandaId: string): Promise<number> {
    const res = this.database
      .select({ val: count() })
      .from(entregaveisDemanda)
      .where(eq(entregaveisDemanda.demanda_id, demandaId))
      .get();

    return res?.val ?? 0;
  }
}
