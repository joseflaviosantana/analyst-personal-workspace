import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '../client';
import {
  receitasPreparacao,
  etapasTransformacao,
  etapasProblemasQualidade,
  linhagemAtivos,
  datasetsAutorizados,
} from '../schema';
import { ReceitaPreparacao } from '@/core/domain/entities/receita-preparacao';
import { StatusReceitaPreparacao } from '@/core/domain/enums/status-receita-preparacao';
import { StatusEtapaTransformacao } from '@/core/domain/enums/status-etapa-transformacao';
import { IReceitaPreparacaoRepository } from '@/core/domain/repositories/receita-preparacao-repository.interface';

export class SqliteReceitaPreparacaoRepository implements IReceitaPreparacaoRepository {
  private database: typeof db;

  constructor(customDb?: typeof db) {
    this.database = customDb ?? db;
  }

  private mapRowToEntity(row: typeof receitasPreparacao.$inferSelect): ReceitaPreparacao {
    return {
      id: row.id,
      demanda_id: row.demanda_id,
      titulo: row.titulo,
      descricao: row.descricao,
      status: row.status as StatusReceitaPreparacao,
      versao: row.versao,
      criado_em: row.criado_em,
      atualizado_em: row.atualizado_em,
    };
  }

  async findById(id: string): Promise<ReceitaPreparacao | null> {
    const row = this.database
      .select()
      .from(receitasPreparacao)
      .where(eq(receitasPreparacao.id, id))
      .get();

    if (!row) return null;
    return this.mapRowToEntity(row);
  }

  async findByDemandId(demandaId: string): Promise<ReceitaPreparacao[]> {
    const rows = this.database
      .select()
      .from(receitasPreparacao)
      .where(eq(receitasPreparacao.demanda_id, demandaId))
      .orderBy(desc(receitasPreparacao.criado_em))
      .all();

    return rows.map((r) => this.mapRowToEntity(r));
  }

  async findActiveByDemandId(demandaId: string): Promise<ReceitaPreparacao | null> {
    const row = this.database
      .select()
      .from(receitasPreparacao)
      .where(
        and(
          eq(receitasPreparacao.demanda_id, demandaId),
          inArray(receitasPreparacao.status, [
            StatusReceitaPreparacao.RASCUNHO,
            StatusReceitaPreparacao.EM_EXECUCAO,
          ])
        )
      )
      .orderBy(desc(receitasPreparacao.criado_em))
      .get();

    if (!row) return null;
    return this.mapRowToEntity(row);
  }

  async create(receita: ReceitaPreparacao): Promise<ReceitaPreparacao> {
    const now = new Date().toISOString();
    this.database
      .insert(receitasPreparacao)
      .values({
        id: receita.id,
        demanda_id: receita.demanda_id,
        titulo: receita.titulo,
        descricao: receita.descricao ?? null,
        status: receita.status,
        versao: receita.versao ?? 1,
        criado_em: receita.criado_em || now,
        atualizado_em: receita.atualizado_em || now,
      })
      .run();

    return receita;
  }

  async update(id: string, dados: Partial<ReceitaPreparacao>): Promise<ReceitaPreparacao | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const updateValues: Record<string, unknown> = {
      atualizado_em: now,
    };

    if (dados.titulo !== undefined) updateValues.titulo = dados.titulo;
    if (dados.descricao !== undefined) updateValues.descricao = dados.descricao;
    if (dados.status !== undefined) updateValues.status = dados.status;
    if (dados.versao !== undefined) updateValues.versao = dados.versao;

    this.database
      .update(receitasPreparacao)
      .set(updateValues)
      .where(eq(receitasPreparacao.id, id))
      .run();

    return this.findById(id);
  }

  async deleteDraftOnly(id: string): Promise<boolean> {
    return this.database.transaction((tx) => {
      const row = tx
        .select()
        .from(receitasPreparacao)
        .where(eq(receitasPreparacao.id, id))
        .get();

      if (!row) return false;

      if (row.status !== StatusReceitaPreparacao.RASCUNHO) {
        throw new Error(
          `Apenas receitas em RASCUNHO podem ser excluídas fisicamente. Status atual: ${row.status}`
        );
      }

      // 1. Verificar etapas de transformação associadas
      const etapas = tx
        .select()
        .from(etapasTransformacao)
        .where(eq(etapasTransformacao.receita_id, id))
        .all();

      const etapasNaoRascunho = etapas.filter(
        (e) => e.status !== StatusEtapaTransformacao.PLANEJADA
      );

      if (etapasNaoRascunho.length > 0) {
        throw new Error(
          `A receita possui ${etapasNaoRascunho.length} etapa(s) executada(s) ou validada(s) e não pode ser excluída fisicamente.`
        );
      }

      // 2. Verificar datasets autorizados vinculados
      const datasets = tx
        .select()
        .from(datasetsAutorizados)
        .where(eq(datasetsAutorizados.receita_preparacao_id, id))
        .all();

      if (datasets.length > 0) {
        throw new Error(
          `A receita está vinculada a ${datasets.length} dataset(s) autorizados e não pode ser excluída fisicamente.`
        );
      }

      // 3. Verificar se etapas estão referenciadas em linhagem
      for (const etapa of etapas) {
        const arestas = tx
          .select()
          .from(linhagemAtivos)
          .where(eq(linhagemAtivos.etapa_transformacao_id, etapa.id))
          .all();

        if (arestas.length > 0) {
          throw new Error(
            `A etapa '${etapa.id}' está vinculada a arestas de linhagem e não pode ser excluída fisicamente.`
          );
        }

        // Deletar vínculos com problemas de qualidade
        tx.delete(etapasProblemasQualidade)
          .where(eq(etapasProblemasQualidade.etapa_transformacao_id, etapa.id))
          .run();

        // Deletar etapa de rascunho
        tx.delete(etapasTransformacao)
          .where(eq(etapasTransformacao.id, etapa.id))
          .run();
      }

      // 4. Deletar a receita em rascunho
      const res = tx
        .delete(receitasPreparacao)
        .where(eq(receitasPreparacao.id, id))
        .run();

      return res.changes > 0;
    });
  }
}
