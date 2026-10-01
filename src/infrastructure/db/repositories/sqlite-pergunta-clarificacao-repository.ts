import { eq, desc, and, inArray, sql } from 'drizzle-orm';
import { db } from '../client';
import { perguntasClarificacao } from '../schema';
import { PerguntaClarificacao } from '@/core/domain/entities/pergunta-clarificacao';
import { StatusPerguntaClarificacao } from '@/core/domain/enums/status-pergunta-clarificacao';
import { IPerguntaClarificacaoRepository } from '@/core/domain/repositories/pergunta-clarificacao-repository.interface';

export class SqlitePerguntaClarificacaoRepository implements IPerguntaClarificacaoRepository {
  private database: typeof db;

  constructor(customDb?: typeof db) {
    this.database = customDb ?? db;
  }

  async create(pergunta: PerguntaClarificacao): Promise<PerguntaClarificacao> {
    this.database.insert(perguntasClarificacao).values(pergunta).run();
    return pergunta;
  }

  async findById(id: string): Promise<PerguntaClarificacao | null> {
    const row = this.database
      .select()
      .from(perguntasClarificacao)
      .where(eq(perguntasClarificacao.id, id))
      .get();

    if (!row) return null;

    return {
      id: row.id,
      demanda_id: row.demanda_id,
      requisito_id: row.requisito_id,
      pergunta: row.pergunta,
      motivacao: row.motivacao,
      bloqueante: Boolean(row.bloqueante),
      status: row.status as StatusPerguntaClarificacao,
      enviada_em: row.enviada_em,
      resposta: row.resposta,
      respondido_por: row.respondido_por,
      respondida_em: row.respondida_em,
      impacto_decisao: row.impacto_decisao,
      criado_em: row.criado_em,
      atualizado_em: row.atualizado_em,
    };
  }

  async findByDemandId(demandaId: string): Promise<PerguntaClarificacao[]> {
    const rows = this.database
      .select()
      .from(perguntasClarificacao)
      .where(eq(perguntasClarificacao.demanda_id, demandaId))
      .orderBy(desc(perguntasClarificacao.criado_em))
      .all();

    return rows.map((row) => ({
      id: row.id,
      demanda_id: row.demanda_id,
      requisito_id: row.requisito_id,
      pergunta: row.pergunta,
      motivacao: row.motivacao,
      bloqueante: Boolean(row.bloqueante),
      status: row.status as StatusPerguntaClarificacao,
      enviada_em: row.enviada_em,
      resposta: row.resposta,
      respondido_por: row.respondido_por,
      respondida_em: row.respondida_em,
      impacto_decisao: row.impacto_decisao,
      criado_em: row.criado_em,
      atualizado_em: row.atualizado_em,
    }));
  }

  async update(id: string, partial: Partial<PerguntaClarificacao>): Promise<PerguntaClarificacao | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated = {
      ...partial,
      atualizado_em: new Date().toISOString(),
    };

    this.database
      .update(perguntasClarificacao)
      .set(updated)
      .where(eq(perguntasClarificacao.id, id))
      .run();

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const res = this.database
      .delete(perguntasClarificacao)
      .where(eq(perguntasClarificacao.id, id))
      .run();

    return res.changes > 0;
  }

  async countByDemandId(demandaId: string): Promise<number> {
    const result = this.database
      .select({ count: sql<number>`count(*)` })
      .from(perguntasClarificacao)
      .where(eq(perguntasClarificacao.demanda_id, demandaId))
      .get();

    return result ? Number(result.count) : 0;
  }

  async countBloqueantesPendentes(demandaId: string): Promise<number> {
    const result = this.database
      .select({ count: sql<number>`count(*)` })
      .from(perguntasClarificacao)
      .where(
        and(
          eq(perguntasClarificacao.demanda_id, demandaId),
          eq(perguntasClarificacao.bloqueante, true),
          inArray(perguntasClarificacao.status, [
            StatusPerguntaClarificacao.RASCUNHO,
            StatusPerguntaClarificacao.ENVIADA,
          ])
        )
      )
      .get();

    return result ? Number(result.count) : 0;
  }
}
