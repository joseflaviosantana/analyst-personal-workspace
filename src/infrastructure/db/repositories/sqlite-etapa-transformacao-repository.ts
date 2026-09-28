import { and, asc, eq } from 'drizzle-orm';
import { db } from '../client';
import {
  etapasTransformacao,
  etapasProblemasQualidade,
  linhagemAtivos,
} from '../schema';
import { EtapaTransformacao } from '@/core/domain/entities/etapa-transformacao';
import { TipoOperacaoPreparacao } from '@/core/domain/enums/tipo-operacao-preparacao';
import { CapacidadeFerramenta } from '@/core/domain/enums/capacidade-ferramenta';
import { StatusEtapaTransformacao } from '@/core/domain/enums/status-etapa-transformacao';
import { IEtapaTransformacaoRepository } from '@/core/domain/repositories/etapa-transformacao-repository.interface';

export class SqliteEtapaTransformacaoRepository implements IEtapaTransformacaoRepository {
  private database: typeof db;

  constructor(customDb?: typeof db) {
    this.database = customDb ?? db;
  }

  private mapRowToEntity(row: typeof etapasTransformacao.$inferSelect): EtapaTransformacao {
    return {
      id: row.id,
      receita_id: row.receita_id,
      ordem: row.ordem,
      tipo_operacao: row.tipo_operacao as TipoOperacaoPreparacao,
      capacidade_ferramenta: row.capacidade_ferramenta as CapacidadeFerramenta,
      ferramenta_nome: row.ferramenta_nome,
      ferramenta_versao: row.ferramenta_versao,
      descricao: row.descricao,
      especificacao_tecnica: row.especificacao_tecnica,
      status: row.status as StatusEtapaTransformacao,
      justificativa: row.justificativa,
      criado_em: row.criado_em,
      atualizado_em: row.atualizado_em,
    };
  }

  async findById(id: string): Promise<EtapaTransformacao | null> {
    const row = this.database
      .select()
      .from(etapasTransformacao)
      .where(eq(etapasTransformacao.id, id))
      .get();

    if (!row) return null;
    return this.mapRowToEntity(row);
  }

  async findByReceitaId(receitaId: string): Promise<EtapaTransformacao[]> {
    const rows = this.database
      .select()
      .from(etapasTransformacao)
      .where(eq(etapasTransformacao.receita_id, receitaId))
      .orderBy(asc(etapasTransformacao.ordem))
      .all();

    return rows.map((r) => this.mapRowToEntity(r));
  }

  async create(etapa: EtapaTransformacao): Promise<EtapaTransformacao> {
    const now = new Date().toISOString();
    this.database
      .insert(etapasTransformacao)
      .values({
        id: etapa.id,
        receita_id: etapa.receita_id,
        ordem: etapa.ordem,
        tipo_operacao: etapa.tipo_operacao,
        capacidade_ferramenta: etapa.capacidade_ferramenta,
        ferramenta_nome: etapa.ferramenta_nome,
        ferramenta_versao: etapa.ferramenta_versao ?? null,
        descricao: etapa.descricao,
        especificacao_tecnica: etapa.especificacao_tecnica ?? null,
        status: etapa.status,
        justificativa: etapa.justificativa ?? null,
        criado_em: etapa.criado_em || now,
        atualizado_em: etapa.atualizado_em || now,
      })
      .run();

    return etapa;
  }

  async update(id: string, dados: Partial<EtapaTransformacao>): Promise<EtapaTransformacao | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const updateValues: Record<string, unknown> = {
      atualizado_em: now,
    };

    if (dados.ordem !== undefined) updateValues.ordem = dados.ordem;
    if (dados.tipo_operacao !== undefined) updateValues.tipo_operacao = dados.tipo_operacao;
    if (dados.capacidade_ferramenta !== undefined) updateValues.capacidade_ferramenta = dados.capacidade_ferramenta;
    if (dados.ferramenta_nome !== undefined) updateValues.ferramenta_nome = dados.ferramenta_nome;
    if (dados.ferramenta_versao !== undefined) updateValues.ferramenta_versao = dados.ferramenta_versao;
    if (dados.descricao !== undefined) updateValues.descricao = dados.descricao;
    if (dados.especificacao_tecnica !== undefined) updateValues.especificacao_tecnica = dados.especificacao_tecnica;
    if (dados.status !== undefined) updateValues.status = dados.status;
    if (dados.justificativa !== undefined) updateValues.justificativa = dados.justificativa;

    this.database
      .update(etapasTransformacao)
      .set(updateValues)
      .where(eq(etapasTransformacao.id, id))
      .run();

    return this.findById(id);
  }

  async reordenar(receitaId: string, ordens: { id: string; ordem: number }[]): Promise<void> {
    this.database.transaction((tx) => {
      const now = new Date().toISOString();
      for (const item of ordens) {
        tx.update(etapasTransformacao)
          .set({ ordem: item.ordem, atualizado_em: now })
          .where(
            and(
              eq(etapasTransformacao.id, item.id),
              eq(etapasTransformacao.receita_id, receitaId)
            )
          )
          .run();
      }
    });
  }

  async deleteDraftOnly(id: string): Promise<boolean> {
    return this.database.transaction((tx) => {
      const row = tx
        .select()
        .from(etapasTransformacao)
        .where(eq(etapasTransformacao.id, id))
        .get();

      if (!row) return false;

      if (row.status !== StatusEtapaTransformacao.PLANEJADA) {
        throw new Error(
          `Apenas etapas com status PLANEJADA podem ser excluídas fisicamente. Status atual: ${row.status}`
        );
      }

      // Verificar se a etapa está vinculada a arestas de linhagem
      const arestas = tx
        .select()
        .from(linhagemAtivos)
        .where(eq(linhagemAtivos.etapa_transformacao_id, id))
        .all();

      if (arestas.length > 0) {
        throw new Error(
          `A etapa '${id}' está vinculada a arestas de linhagem e não pode ser excluída fisicamente.`
        );
      }

      // Remover vínculos com problemas de qualidade
      tx.delete(etapasProblemasQualidade)
        .where(eq(etapasProblemasQualidade.etapa_transformacao_id, id))
        .run();

      const res = tx
        .delete(etapasTransformacao)
        .where(eq(etapasTransformacao.id, id))
        .run();

      return res.changes > 0;
    });
  }

  async cancelar(id: string, justificativa: string): Promise<EtapaTransformacao | null> {
    if (!justificativa || justificativa.trim().length < 5) {
      throw new Error('Justificativa de cancelamento deve possuir no mínimo 5 caracteres.');
    }

    const etapa = await this.findById(id);
    if (!etapa) return null;

    const now = new Date().toISOString();
    const novaDescricao = etapa.descricao
      ? `${etapa.descricao}\n[CANCELADA]: ${justificativa.trim()}`
      : `[CANCELADA]: ${justificativa.trim()}`;

    this.database
      .update(etapasTransformacao)
      .set({
        status: StatusEtapaTransformacao.CANCELADA,
        descricao: novaDescricao,
        justificativa: justificativa.trim(),
        atualizado_em: now,
      })
      .where(eq(etapasTransformacao.id, id))
      .run();

    return this.findById(id);
  }

  async vincularProblema(etapaId: string, problemaId: string): Promise<void> {
    const existing = this.database
      .select()
      .from(etapasProblemasQualidade)
      .where(
        and(
          eq(etapasProblemasQualidade.etapa_transformacao_id, etapaId),
          eq(etapasProblemasQualidade.problema_qualidade_id, problemaId)
        )
      )
      .get();

    if (existing) return;

    const now = new Date().toISOString();
    this.database
      .insert(etapasProblemasQualidade)
      .values({
        id: crypto.randomUUID(),
        etapa_transformacao_id: etapaId,
        problema_qualidade_id: problemaId,
        criado_em: now,
      })
      .run();
  }

  async desvincularProblema(etapaId: string, problemaId: string): Promise<void> {
    this.database
      .delete(etapasProblemasQualidade)
      .where(
        and(
          eq(etapasProblemasQualidade.etapa_transformacao_id, etapaId),
          eq(etapasProblemasQualidade.problema_qualidade_id, problemaId)
        )
      )
      .run();
  }

  async listarProblemasPorEtapa(etapaId: string): Promise<string[]> {
    const rows = this.database
      .select({ problema_id: etapasProblemasQualidade.problema_qualidade_id })
      .from(etapasProblemasQualidade)
      .where(eq(etapasProblemasQualidade.etapa_transformacao_id, etapaId))
      .all();

    return rows.map((r) => r.problema_id);
  }

  async listarEtapasPorProblema(problemaId: string): Promise<string[]> {
    const rows = this.database
      .select({ etapa_id: etapasProblemasQualidade.etapa_transformacao_id })
      .from(etapasProblemasQualidade)
      .where(eq(etapasProblemasQualidade.problema_qualidade_id, problemaId))
      .all();

    return rows.map((r) => r.etapa_id);
  }
}
