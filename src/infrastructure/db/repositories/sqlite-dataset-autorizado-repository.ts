import { and, desc, eq } from 'drizzle-orm';
import { db } from '../client';
import { datasetsAutorizados } from '../schema';
import { DatasetAutorizadoAnalise } from '@/core/domain/entities/dataset-autorizado-analise';
import { StatusAutorizacaoDataset } from '@/core/domain/enums/status-autorizacao-dataset';
import { IDatasetAutorizadoRepository } from '@/core/domain/repositories/dataset-autorizado-repository.interface';

export class SqliteDatasetAutorizadoRepository implements IDatasetAutorizadoRepository {
  private database: typeof db;

  constructor(customDb?: typeof db) {
    this.database = customDb ?? db;
  }

  private mapRowToEntity(row: typeof datasetsAutorizados.$inferSelect): DatasetAutorizadoAnalise {
    return {
      id: row.id,
      demanda_id: row.demanda_id,
      ativo_dados_id: row.ativo_dados_id,
      diagnostico_qualidade_id: row.diagnostico_qualidade_id,
      receita_preparacao_id: row.receita_preparacao_id ?? null,
      versao_rotulo: row.versao_rotulo,
      hash_sha256_snapshot: row.hash_sha256_snapshot,
      status: row.status as StatusAutorizacaoDataset,
      justificativa_autorizacao: row.justificativa_autorizacao,
      autorizado_por_tipo: (row.autorizado_por_tipo as 'HUMANO') || 'HUMANO',
      restricoes_aceitas_snapshot: row.restricoes_aceitas_snapshot,
      autorizado_em: row.autorizado_em,
      revogado_em: row.revogado_em ?? null,
      motivo_revogacao: row.motivo_revogacao ?? null,
    };
  }

  async findById(id: string): Promise<DatasetAutorizadoAnalise | null> {
    const row = this.database
      .select()
      .from(datasetsAutorizados)
      .where(eq(datasetsAutorizados.id, id))
      .get();

    if (!row) return null;
    return this.mapRowToEntity(row);
  }

  async findVigenteByDemandId(demandaId: string): Promise<DatasetAutorizadoAnalise | null> {
    const row = this.database
      .select()
      .from(datasetsAutorizados)
      .where(
        and(
          eq(datasetsAutorizados.demanda_id, demandaId),
          eq(datasetsAutorizados.status, StatusAutorizacaoDataset.VIGENTE)
        )
      )
      .get();

    if (!row) return null;
    return this.mapRowToEntity(row);
  }

  async listarHistorico(demandaId: string): Promise<DatasetAutorizadoAnalise[]> {
    const rows = this.database
      .select()
      .from(datasetsAutorizados)
      .where(eq(datasetsAutorizados.demanda_id, demandaId))
      .orderBy(desc(datasetsAutorizados.autorizado_em))
      .all();

    return rows.map((r) => this.mapRowToEntity(r));
  }

  async autorizarTransacional(
    autorizacao: DatasetAutorizadoAnalise
  ): Promise<DatasetAutorizadoAnalise> {
    if (
      !autorizacao.justificativa_autorizacao ||
      autorizacao.justificativa_autorizacao.trim().length < 15
    ) {
      throw new Error(
        'A justificativa de homologação do dataset deve conter no mínimo 15 caracteres explicativos.'
      );
    }

    const now = new Date().toISOString();

    return this.database.transaction((tx) => {
      // 1. Localizar vigência anterior da mesma demanda
      const vigenteAnterior = tx
        .select()
        .from(datasetsAutorizados)
        .where(
          and(
            eq(datasetsAutorizados.demanda_id, autorizacao.demanda_id),
            eq(datasetsAutorizados.status, StatusAutorizacaoDataset.VIGENTE)
          )
        )
        .get();

      // 2. Se houver, transicionar para SUBSTITUIDO de forma atômica
      if (vigenteAnterior) {
        tx.update(datasetsAutorizados)
          .set({
            status: StatusAutorizacaoDataset.SUBSTITUIDO,
            revogado_em: autorizacao.autorizado_em || now,
            motivo_revogacao: `Substituído pela versão autorizada '${autorizacao.versao_rotulo}'.`,
          })
          .where(eq(datasetsAutorizados.id, vigenteAnterior.id))
          .run();
      }

      // 3. Inserir a nova autorização vigente
      tx.insert(datasetsAutorizados)
        .values({
          id: autorizacao.id,
          demanda_id: autorizacao.demanda_id,
          ativo_dados_id: autorizacao.ativo_dados_id,
          diagnostico_qualidade_id: autorizacao.diagnostico_qualidade_id,
          receita_preparacao_id: autorizacao.receita_preparacao_id ?? null,
          versao_rotulo: autorizacao.versao_rotulo,
          hash_sha256_snapshot: autorizacao.hash_sha256_snapshot,
          status: StatusAutorizacaoDataset.VIGENTE,
          justificativa_autorizacao: autorizacao.justificativa_autorizacao.trim(),
          autorizado_por_tipo: autorizacao.autorizado_por_tipo || 'HUMANO',
          restricoes_aceitas_snapshot: autorizacao.restricoes_aceitas_snapshot || '[]',
          autorizado_em: autorizacao.autorizado_em || now,
          revogado_em: null,
          motivo_revogacao: null,
        })
        .run();

      const inserido = tx
        .select()
        .from(datasetsAutorizados)
        .where(eq(datasetsAutorizados.id, autorizacao.id))
        .get();

      if (!inserido) {
        throw new Error('Falha ao recuperar dataset autorizado após inserção transacional.');
      }

      return this.mapRowToEntity(inserido);
    });
  }

  async revogar(
    id: string,
    motivo: string,
    timestamp: string
  ): Promise<DatasetAutorizadoAnalise | null> {
    if (!motivo || motivo.trim().length < 5) {
      throw new Error('Motivo da revogação deve possuir no mínimo 5 caracteres.');
    }

    return this.database.transaction((tx) => {
      const row = tx
        .select()
        .from(datasetsAutorizados)
        .where(eq(datasetsAutorizados.id, id))
        .get();

      if (!row) return null;

      if (row.status !== StatusAutorizacaoDataset.VIGENTE) {
        throw new Error(
          `Apenas autorizações no status VIGENTE podem ser revogadas. Status atual: ${row.status}`
        );
      }

      tx.update(datasetsAutorizados)
        .set({
          status: StatusAutorizacaoDataset.REVOGADO,
          revogado_em: timestamp,
          motivo_revogacao: motivo.trim(),
        })
        .where(eq(datasetsAutorizados.id, id))
        .run();

      const atualizado = tx
        .select()
        .from(datasetsAutorizados)
        .where(eq(datasetsAutorizados.id, id))
        .get();

      return atualizado ? this.mapRowToEntity(atualizado) : null;
    });
  }
}
