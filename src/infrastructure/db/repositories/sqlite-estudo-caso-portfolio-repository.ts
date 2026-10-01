/**
 * src/infrastructure/db/repositories/sqlite-estudo-caso-portfolio-repository.ts
 *
 * Implementação SQLite do repositório de Estudo de Caso de Portfólio (Subgate 3.9 — Aba 11).
 */

import { eq } from 'drizzle-orm';
import { db } from '../client';
import { estudosCasoPortfolio } from '../schema';
import {
  EstudoCasoPortfolio,
  ChecklistSanitizacao,
  MetricaFatoCase,
  criarChecklistSanitizacaoPadrao,
} from '@/core/domain/entities/estudo-caso-portfolio';
import { StatusEstudoCaso } from '@/core/domain/enums/status-estudo-caso';
import { TecnicaSanitizacao } from '@/core/domain/enums/tecnica-sanitizacao';
import { IEstudoCasoPortfolioRepository } from '@/core/domain/repositories/estudo-caso-portfolio-repository.interface';

export class SqliteEstudoCasoPortfolioRepository implements IEstudoCasoPortfolioRepository {
  private database: typeof db;

  constructor(customDb?: typeof db) {
    this.database = customDb ?? db;
  }

  private mapRowToEntity(row: typeof estudosCasoPortfolio.$inferSelect): EstudoCasoPortfolio {
    let competencias: string[] = [];
    let ferramentas: string[] = [];
    let metricasFatos: MetricaFatoCase[] = [];
    let tecnicas: TecnicaSanitizacao[] = [];
    let checklist: ChecklistSanitizacao = criarChecklistSanitizacaoPadrao();

    try {
      if (row.competencias_demonstradas) {
        competencias = JSON.parse(row.competencias_demonstradas);
      }
    } catch {
      competencias = [];
    }

    try {
      if (row.ferramentas_utilizadas) {
        ferramentas = JSON.parse(row.ferramentas_utilizadas);
      }
    } catch {
      ferramentas = [];
    }

    try {
      if (row.metricas_fatos) {
        metricasFatos = JSON.parse(row.metricas_fatos);
      }
    } catch {
      metricasFatos = [];
    }

    try {
      if (row.tecnicas_sanitizacao) {
        tecnicas = JSON.parse(row.tecnicas_sanitizacao);
      }
    } catch {
      tecnicas = [];
    }

    try {
      if (row.checklist_sanitizacao) {
        checklist = {
          ...criarChecklistSanitizacaoPadrao(),
          ...JSON.parse(row.checklist_sanitizacao),
        };
      }
    } catch {
      checklist = criarChecklistSanitizacaoPadrao();
    }

    return {
      id: row.id,
      demanda_id: row.demanda_id,
      projeto_id: row.projeto_id ?? null,
      titulo: row.titulo,
      problema_negocio: row.problema_negocio,
      processo_preparacao: row.processo_preparacao,
      modelagem_decisoes: row.modelagem_decisoes,
      validacao_resultados: row.validacao_resultados,
      competencias_demonstradas: competencias,
      ferramentas_utilizadas: ferramentas,
      metricas_fatos: metricasFatos,
      tecnicas_sanitizacao: tecnicas,
      checklist_sanitizacao: checklist,
      status: row.status as StatusEstudoCaso,
      homologado_em: row.homologado_em ?? null,
      homologado_por: row.homologado_por ?? null,
      versao: row.versao,
      criado_em: row.criado_em,
      atualizado_em: row.atualizado_em,
    };
  }

  async findByDemandId(demandaId: string): Promise<EstudoCasoPortfolio | null> {
    const rows = await this.database
      .select()
      .from(estudosCasoPortfolio)
      .where(eq(estudosCasoPortfolio.demanda_id, demandaId))
      .limit(1);

    if (rows.length === 0) return null;
    return this.mapRowToEntity(rows[0]);
  }

  async findById(id: string): Promise<EstudoCasoPortfolio | null> {
    const rows = await this.database
      .select()
      .from(estudosCasoPortfolio)
      .where(eq(estudosCasoPortfolio.id, id))
      .limit(1);

    if (rows.length === 0) return null;
    return this.mapRowToEntity(rows[0]);
  }

  async save(casePortfolio: EstudoCasoPortfolio): Promise<EstudoCasoPortfolio> {
    const existing = await this.findById(casePortfolio.id);

    const values = {
      id: casePortfolio.id,
      demanda_id: casePortfolio.demanda_id,
      projeto_id: casePortfolio.projeto_id,
      titulo: casePortfolio.titulo,
      problema_negocio: casePortfolio.problema_negocio,
      processo_preparacao: casePortfolio.processo_preparacao,
      modelagem_decisoes: casePortfolio.modelagem_decisoes,
      validacao_resultados: casePortfolio.validacao_resultados,
      competencias_demonstradas: JSON.stringify(casePortfolio.competencias_demonstradas),
      ferramentas_utilizadas: JSON.stringify(casePortfolio.ferramentas_utilizadas),
      metricas_fatos: JSON.stringify(casePortfolio.metricas_fatos),
      tecnicas_sanitizacao: JSON.stringify(casePortfolio.tecnicas_sanitizacao),
      checklist_sanitizacao: JSON.stringify(casePortfolio.checklist_sanitizacao),
      status: casePortfolio.status,
      homologado_em: casePortfolio.homologado_em,
      homologado_por: casePortfolio.homologado_por,
      versao: casePortfolio.versao,
      criado_em: casePortfolio.criado_em,
      atualizado_em: casePortfolio.atualizado_em,
    };

    if (existing) {
      await this.database
        .update(estudosCasoPortfolio)
        .set(values)
        .where(eq(estudosCasoPortfolio.id, casePortfolio.id));
    } else {
      await this.database.insert(estudosCasoPortfolio).values(values);
    }

    return casePortfolio;
  }

  async update(id: string, partial: Partial<EstudoCasoPortfolio>): Promise<EstudoCasoPortfolio> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Estudo de caso de portfólio com ID '${id}' não encontrado.`);
    }

    const updatedEntity: EstudoCasoPortfolio = {
      ...existing,
      ...partial,
      atualizado_em: new Date().toISOString(),
    };

    await this.save(updatedEntity);
    return updatedEntity;
  }

  async delete(id: string): Promise<void> {
    await this.database
      .delete(estudosCasoPortfolio)
      .where(eq(estudosCasoPortfolio.id, id));
  }
}
