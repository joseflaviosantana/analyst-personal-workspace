import { eq, desc, and } from 'drizzle-orm';
import { db } from '../client';
import { trilhaAuditoria } from '../schema';
import { TrilhaAuditoria } from '@/core/domain/entities/trilha-auditoria';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { randomUUID } from 'crypto';

export class SqliteAuditRepository implements IAuditRepository {
  private database: typeof db;

  constructor(customDb?: typeof db) {
    this.database = customDb ?? db;
  }

  async record(evento: Omit<TrilhaAuditoria, 'id'> & { id?: string }): Promise<TrilhaAuditoria> {
    const id = evento.id || `audit_${randomUUID()}`;
    const timestamp = evento.timestamp || new Date().toISOString();

    const novoRegistro: TrilhaAuditoria = {
      id,
      demanda_id: evento.demanda_id,
      entidade: evento.entidade,
      entidade_id: evento.entidade_id,
      tipo_evento: evento.tipo_evento,
      autor_tipo: evento.autor_tipo,
      dados_anteriores: evento.dados_anteriores ?? null,
      dados_novos: evento.dados_novos ?? null,
      justificativa: evento.justificativa ?? null,
      timestamp,
    };

    this.database.insert(trilhaAuditoria).values(novoRegistro).run();
    return novoRegistro;
  }

  async findByDemandaId(demandaId: string): Promise<TrilhaAuditoria[]> {
    const rows = this.database
      .select()
      .from(trilhaAuditoria)
      .where(eq(trilhaAuditoria.demanda_id, demandaId))
      .orderBy(desc(trilhaAuditoria.timestamp))
      .all();

    return rows.map((r) => ({
      id: r.id,
      demanda_id: r.demanda_id,
      entidade: r.entidade,
      entidade_id: r.entidade_id,
      tipo_evento: r.tipo_evento as TrilhaAuditoria['tipo_evento'],
      autor_tipo: r.autor_tipo as TrilhaAuditoria['autor_tipo'],
      dados_anteriores: r.dados_anteriores,
      dados_novos: r.dados_novos,
      justificativa: r.justificativa,
      timestamp: r.timestamp,
    }));
  }

  async findByEntidade(entidade: string, entidadeId: string): Promise<TrilhaAuditoria[]> {
    const rows = this.database
      .select()
      .from(trilhaAuditoria)
      .where(and(eq(trilhaAuditoria.entidade, entidade), eq(trilhaAuditoria.entidade_id, entidadeId)))
      .orderBy(desc(trilhaAuditoria.timestamp))
      .all();

    return rows.map((r) => ({
      id: r.id,
      demanda_id: r.demanda_id,
      entidade: r.entidade,
      entidade_id: r.entidade_id,
      tipo_evento: r.tipo_evento as TrilhaAuditoria['tipo_evento'],
      autor_tipo: r.autor_tipo as TrilhaAuditoria['autor_tipo'],
      dados_anteriores: r.dados_anteriores,
      dados_novos: r.dados_novos,
      justificativa: r.justificativa,
      timestamp: r.timestamp,
    }));
  }
}
