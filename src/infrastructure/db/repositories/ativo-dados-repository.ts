import { eq, desc, count } from 'drizzle-orm';
import { db } from '../client';
import { ativosDados } from '../schema';
import { AtivoDados } from '@/core/domain/entities/ativo-dados';
import { normalizarFormatoArquivo } from '@/core/domain/enums/formato-arquivo';
import { normalizarStatusAtivoDados } from '@/core/domain/enums/status-ativo-dados';
import { IAtivoDadosRepository } from '@/core/domain/repositories/ativo-dados-repository.interface';

export class SqliteAtivoDadosRepository implements IAtivoDadosRepository {
  private database: typeof db;

  constructor(customDb?: typeof db) {
    this.database = customDb ?? db;
  }

  private mapRowToEntity(row: typeof ativosDados.$inferSelect): AtivoDados {
    return {
      id: row.id,
      demanda_id: row.demanda_id,
      nome_arquivo: row.nome_arquivo,
      caminho_local: row.caminho_local,
      formato: normalizarFormatoArquivo(row.formato),
      origem: row.origem,
      descricao_conteudo: row.descricao_conteudo,
      granularidade: row.granularidade,
      periodo_inicio: row.periodo_inicio,
      periodo_fim: row.periodo_fim,
      versao: row.versao,
      tamanho_bytes: row.tamanho_bytes,
      total_linhas: row.total_linhas,
      total_colunas: row.total_colunas,
      hash_sha256: row.hash_sha256,
      status: normalizarStatusAtivoDados(row.status),
      schema_inferido: row.schema_inferido,
      data_recebimento: row.data_recebimento,
      criado_em: row.criado_em,
      atualizado_em: row.atualizado_em,
    };
  }

  async create(asset: AtivoDados): Promise<AtivoDados> {
    this.database
      .insert(ativosDados)
      .values({
        id: asset.id,
        demanda_id: asset.demanda_id,
        nome_arquivo: asset.nome_arquivo,
        caminho_local: asset.caminho_local,
        formato: asset.formato,
        origem: asset.origem,
        descricao_conteudo: asset.descricao_conteudo,
        granularidade: asset.granularidade,
        periodo_inicio: asset.periodo_inicio,
        periodo_fim: asset.periodo_fim,
        versao: asset.versao,
        tamanho_bytes: asset.tamanho_bytes,
        total_linhas: asset.total_linhas,
        total_colunas: asset.total_colunas,
        hash_sha256: asset.hash_sha256,
        status: asset.status,
        schema_inferido: asset.schema_inferido,
        data_recebimento: asset.data_recebimento,
        criado_em: asset.criado_em,
        atualizado_em: asset.atualizado_em,
      })
      .run();

    return asset;
  }

  async findById(id: string): Promise<AtivoDados | null> {
    const row = this.database
      .select()
      .from(ativosDados)
      .where(eq(ativosDados.id, id))
      .get();

    if (!row) return null;
    return this.mapRowToEntity(row);
  }

  async findByDemandId(demandaId: string): Promise<AtivoDados[]> {
    const rows = this.database
      .select()
      .from(ativosDados)
      .where(eq(ativosDados.demanda_id, demandaId))
      .orderBy(desc(ativosDados.criado_em))
      .all();

    return rows.map((r) => this.mapRowToEntity(r));
  }

  async findByPath(caminhoLocal: string): Promise<AtivoDados | null> {
    const row = this.database
      .select()
      .from(ativosDados)
      .where(eq(ativosDados.caminho_local, caminhoLocal))
      .get();

    if (!row) return null;
    return this.mapRowToEntity(row);
  }

  async update(id: string, data: Partial<AtivoDados>): Promise<AtivoDados | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const updateValues: Record<string, any> = {
      atualizado_em: now,
    };

    if (data.nome_arquivo !== undefined) updateValues.nome_arquivo = data.nome_arquivo;
    if (data.caminho_local !== undefined) updateValues.caminho_local = data.caminho_local;
    if (data.formato !== undefined) updateValues.formato = data.formato;
    if (data.origem !== undefined) updateValues.origem = data.origem;
    if (data.descricao_conteudo !== undefined) updateValues.descricao_conteudo = data.descricao_conteudo;
    if (data.granularidade !== undefined) updateValues.granularidade = data.granularidade;
    if (data.periodo_inicio !== undefined) updateValues.periodo_inicio = data.periodo_inicio;
    if (data.periodo_fim !== undefined) updateValues.periodo_fim = data.periodo_fim;
    if (data.versao !== undefined) updateValues.versao = data.versao;
    if (data.tamanho_bytes !== undefined) updateValues.tamanho_bytes = data.tamanho_bytes;
    if (data.total_linhas !== undefined) updateValues.total_linhas = data.total_linhas;
    if (data.total_colunas !== undefined) updateValues.total_colunas = data.total_colunas;
    if (data.hash_sha256 !== undefined) updateValues.hash_sha256 = data.hash_sha256;
    if (data.status !== undefined) updateValues.status = data.status;
    if (data.schema_inferido !== undefined) updateValues.schema_inferido = data.schema_inferido;
    if (data.data_recebimento !== undefined) updateValues.data_recebimento = data.data_recebimento;

    this.database
      .update(ativosDados)
      .set(updateValues)
      .where(eq(ativosDados.id, id))
      .run();

    return this.findById(id);
  }

  async countByDemandId(demandaId: string): Promise<number> {
    const res = this.database
      .select({ total: count() })
      .from(ativosDados)
      .where(eq(ativosDados.demanda_id, demandaId))
      .get();

    return res?.total ?? 0;
  }
}
