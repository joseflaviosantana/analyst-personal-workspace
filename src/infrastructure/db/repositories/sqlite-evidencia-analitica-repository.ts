/**
 * src/infrastructure/db/repositories/sqlite-evidencia-analitica-repository.ts
 *
 * Implementação SQLite do repositório de Evidências Analíticas (Evidence Core — Subgate 3.5A).
 */

import { and, desc, eq, SQL } from 'drizzle-orm';
import { db } from '../client';
import { evidenciasAnaliticas } from '../schema';
import { EvidenciaAnalitica } from '@/core/domain/entities/evidencia-analitica';
import { TipoEvidenciaAnalitica } from '@/core/domain/enums/tipo-evidencia-analitica';
import { EtapaOrigemEvidencia } from '@/core/domain/enums/etapa-origem-evidencia';
import { MetodoCapturaEvidencia } from '@/core/domain/enums/metodo-captura-evidencia';
import { StatusValidacaoEvidencia } from '@/core/domain/enums/status-validacao-evidencia';
import { ClassificacaoExposicaoEvidencia } from '@/core/domain/enums/classificacao-exposicao-evidencia';
import {
  IEvidenciaAnaliticaRepository,
  FiltrosConsultaEvidencias,
} from '@/core/domain/repositories/evidencia-analitica-repository.interface';

export class SqliteEvidenciaAnaliticaRepository implements IEvidenciaAnaliticaRepository {
  private database: typeof db;

  constructor(customDb?: typeof db) {
    this.database = customDb ?? db;
  }

  private mapRowToEntity(row: typeof evidenciasAnaliticas.$inferSelect): EvidenciaAnalitica {
    let metadadosParsed: Record<string, unknown> | null = null;
    if (row.metadados) {
      try {
        metadadosParsed = JSON.parse(row.metadados);
      } catch {
        metadadosParsed = null;
      }
    }

    return {
      id: row.id,
      demanda_id: row.demanda_id,
      projeto_id: row.projeto_id ?? null,
      tipo: row.tipo as TipoEvidenciaAnalitica,
      etapa_origem: row.etapa_origem as EtapaOrigemEvidencia,
      artefato_origem_tipo: row.artefato_origem_tipo ?? null,
      artefato_origem_id: row.artefato_origem_id ?? null,
      titulo: row.titulo,
      descricao: row.descricao,
      fato_observado: row.fato_observado,
      estado_anterior: row.estado_anterior ?? null,
      acao_registrada: row.acao_registrada,
      estado_posterior: row.estado_posterior ?? null,
      resultado_mensuravel: row.resultado_mensuravel ?? null,
      inferencia_recomendacao: row.inferencia_recomendacao ?? null,
      decisao_humana: row.decisao_humana ?? null,
      metodo_captura: row.metodo_captura as MetodoCapturaEvidencia,
      status_validacao: row.status_validacao as StatusValidacaoEvidencia,
      classificacao_exposicao: row.classificacao_exposicao as ClassificacaoExposicaoEvidencia,
      elegibilidade_portfolio: Boolean(row.elegibilidade_portfolio),
      executor: row.executor,
      metadados: metadadosParsed,
      criado_em: row.criado_em,
      atualizado_em: row.atualizado_em,
    };
  }

  async findById(id: string): Promise<EvidenciaAnalitica | null> {
    const row = this.database
      .select()
      .from(evidenciasAnaliticas)
      .where(eq(evidenciasAnaliticas.id, id))
      .get();

    if (!row) return null;
    return this.mapRowToEntity(row);
  }

  async findByDemandaId(
    demandaId: string,
    filtros?: FiltrosConsultaEvidencias
  ): Promise<EvidenciaAnalitica[]> {
    const conditions: SQL[] = [eq(evidenciasAnaliticas.demanda_id, demandaId)];

    if (filtros?.tipo) {
      conditions.push(eq(evidenciasAnaliticas.tipo, filtros.tipo));
    }
    if (filtros?.etapa_origem) {
      conditions.push(eq(evidenciasAnaliticas.etapa_origem, filtros.etapa_origem));
    }
    if (filtros?.status_validacao) {
      conditions.push(eq(evidenciasAnaliticas.status_validacao, filtros.status_validacao));
    }
    if (filtros?.classificacao_exposicao) {
      conditions.push(
        eq(evidenciasAnaliticas.classificacao_exposicao, filtros.classificacao_exposicao)
      );
    }
    if (filtros?.elegibilidade_portfolio !== undefined) {
      conditions.push(
        eq(evidenciasAnaliticas.elegibilidade_portfolio, filtros.elegibilidade_portfolio)
      );
    }

    const rows = this.database
      .select()
      .from(evidenciasAnaliticas)
      .where(and(...conditions))
      .orderBy(desc(evidenciasAnaliticas.criado_em))
      .all();

    return rows.map((r) => this.mapRowToEntity(r));
  }

  async findByProjetoId(projetoId: string): Promise<EvidenciaAnalitica[]> {
    const rows = this.database
      .select()
      .from(evidenciasAnaliticas)
      .where(eq(evidenciasAnaliticas.projeto_id, projetoId))
      .orderBy(desc(evidenciasAnaliticas.criado_em))
      .all();

    return rows.map((r) => this.mapRowToEntity(r));
  }

  async create(evidencia: EvidenciaAnalitica): Promise<EvidenciaAnalitica> {
    this.database
      .insert(evidenciasAnaliticas)
      .values({
        id: evidencia.id,
        demanda_id: evidencia.demanda_id,
        projeto_id: evidencia.projeto_id ?? null,
        tipo: evidencia.tipo,
        etapa_origem: evidencia.etapa_origem,
        artefato_origem_tipo: evidencia.artefato_origem_tipo ?? null,
        artefato_origem_id: evidencia.artefato_origem_id ?? null,
        titulo: evidencia.titulo,
        descricao: evidencia.descricao,
        fato_observado: evidencia.fato_observado,
        estado_anterior: evidencia.estado_anterior ?? null,
        acao_registrada: evidencia.acao_registrada,
        estado_posterior: evidencia.estado_posterior ?? null,
        resultado_mensuravel: evidencia.resultado_mensuravel ?? null,
        inferencia_recomendacao: evidencia.inferencia_recomendacao ?? null,
        decisao_humana: evidencia.decisao_humana ?? null,
        metodo_captura: evidencia.metodo_captura,
        status_validacao: evidencia.status_validacao,
        classificacao_exposicao: evidencia.classificacao_exposicao,
        elegibilidade_portfolio: evidencia.elegibilidade_portfolio,
        executor: evidencia.executor,
        metadados: evidencia.metadados ? JSON.stringify(evidencia.metadados) : null,
        criado_em: evidencia.criado_em,
        atualizado_em: evidencia.atualizado_em,
      })
      .run();

    return evidencia;
  }

  async update(evidencia: EvidenciaAnalitica): Promise<EvidenciaAnalitica> {
    this.database
      .update(evidenciasAnaliticas)
      .set({
        tipo: evidencia.tipo,
        etapa_origem: evidencia.etapa_origem,
        artefato_origem_tipo: evidencia.artefato_origem_tipo ?? null,
        artefato_origem_id: evidencia.artefato_origem_id ?? null,
        titulo: evidencia.titulo,
        descricao: evidencia.descricao,
        fato_observado: evidencia.fato_observado,
        estado_anterior: evidencia.estado_anterior ?? null,
        acao_registrada: evidencia.acao_registrada,
        estado_posterior: evidencia.estado_posterior ?? null,
        resultado_mensuravel: evidencia.resultado_mensuravel ?? null,
        inferencia_recomendacao: evidencia.inferencia_recomendacao ?? null,
        decisao_humana: evidencia.decisao_humana ?? null,
        metodo_captura: evidencia.metodo_captura,
        status_validacao: evidencia.status_validacao,
        classificacao_exposicao: evidencia.classificacao_exposicao,
        elegibilidade_portfolio: evidencia.elegibilidade_portfolio,
        executor: evidencia.executor,
        metadados: evidencia.metadados ? JSON.stringify(evidencia.metadados) : null,
        atualizado_em: evidencia.atualizado_em,
      })
      .where(eq(evidenciasAnaliticas.id, evidencia.id))
      .run();

    return evidencia;
  }

  async delete(id: string): Promise<void> {
    this.database
      .delete(evidenciasAnaliticas)
      .where(eq(evidenciasAnaliticas.id, id))
      .run();
  }
}
