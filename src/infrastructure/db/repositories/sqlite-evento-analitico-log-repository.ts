/**
 * src/infrastructure/db/repositories/sqlite-evento-analitico-log-repository.ts
 *
 * Implementação SQLite do repositório de Event Log (Evidence Event Engine — Subgate 3.5B.1).
 */

import { desc, eq } from 'drizzle-orm';
import { db } from '../client';
import { eventosAnaliticosLog } from '../schema';
import {
  RegistroLogEventoAnalitico,
  StatusProcessamentoEvento,
} from '@/core/domain/entities/evento-analitico-log';
import { PoliticaCaptura } from '@/core/domain/evidence-events/event-types';
import { IEventoAnaliticoLogRepository } from '@/core/domain/repositories/evento-analitico-log-repository.interface';

export class SqliteEventoAnaliticoLogRepository implements IEventoAnaliticoLogRepository {
  private database: typeof db;

  constructor(customDb?: typeof db) {
    this.database = customDb ?? db;
  }

  private mapRowToEntity(row: typeof eventosAnaliticosLog.$inferSelect): RegistroLogEventoAnalitico {
    let payloadParsed: Record<string, unknown> | null = null;
    if (row.payload_snapshot) {
      try {
        payloadParsed = JSON.parse(row.payload_snapshot);
      } catch {
        payloadParsed = null;
      }
    }

    return {
      id: row.id,
      id_evento: row.id_evento,
      demanda_id: row.demanda_id,
      projeto_id: row.projeto_id ?? null,
      tipo_evento: row.tipo_evento,
      etapa_origem: row.etapa_origem,
      politica_aplicada: row.politica_aplicada as PoliticaCaptura,
      status_processamento: row.status_processamento as StatusProcessamentoEvento,
      evidencia_gerada_id: row.evidencia_gerada_id ?? null,
      correlation_id: row.correlation_id ?? null,
      causation_id: row.causation_id ?? null,
      motivo: row.motivo ?? null,
      erro_detalhe: row.erro_detalhe ?? null,
      payload_snapshot: payloadParsed,
      processado_em: row.processado_em,
    };
  }

  async findByIdEvento(idEvento: string): Promise<RegistroLogEventoAnalitico | null> {
    const row = this.database
      .select()
      .from(eventosAnaliticosLog)
      .where(eq(eventosAnaliticosLog.id_evento, idEvento))
      .get();

    if (!row) return null;
    return this.mapRowToEntity(row);
  }

  async findByDemandaId(demandaId: string): Promise<RegistroLogEventoAnalitico[]> {
    const rows = this.database
      .select()
      .from(eventosAnaliticosLog)
      .where(eq(eventosAnaliticosLog.demanda_id, demandaId))
      .orderBy(desc(eventosAnaliticosLog.processado_em))
      .all();

    return rows.map((r) => this.mapRowToEntity(r));
  }

  async create(registro: RegistroLogEventoAnalitico): Promise<RegistroLogEventoAnalitico> {
    this.database
      .insert(eventosAnaliticosLog)
      .values({
        id: registro.id,
        id_evento: registro.id_evento,
        demanda_id: registro.demanda_id,
        projeto_id: registro.projeto_id ?? null,
        tipo_evento: registro.tipo_evento,
        etapa_origem: registro.etapa_origem,
        politica_aplicada: registro.politica_aplicada,
        status_processamento: registro.status_processamento,
        evidencia_gerada_id: registro.evidencia_gerada_id ?? null,
        correlation_id: registro.correlation_id ?? null,
        causation_id: registro.causation_id ?? null,
        motivo: registro.motivo ?? null,
        erro_detalhe: registro.erro_detalhe ?? null,
        payload_snapshot: registro.payload_snapshot
          ? JSON.stringify(registro.payload_snapshot)
          : null,
        processado_em: registro.processado_em,
      })
      .run();

    return registro;
  }
}
