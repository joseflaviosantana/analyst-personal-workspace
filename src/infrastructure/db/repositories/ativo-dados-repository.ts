import { and, eq, desc, count } from 'drizzle-orm';
import { db } from '../client';
import { ativosDados, trilhaAuditoria } from '../schema';
import { AtivoDados } from '@/core/domain/entities/ativo-dados';
import { normalizarFormatoArquivo } from '@/core/domain/enums/formato-arquivo';
import { normalizarStatusAtivoDados, StatusAtivoDados } from '@/core/domain/enums/status-ativo-dados';
import { CategoriaAtivoDados, normalizarCategoriaAtivoDados } from '@/core/domain/enums/categoria-ativo-dados';
import { IAtivoDadosRepository, ReplaceAssetParams } from '@/core/domain/repositories/ativo-dados-repository.interface';

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
      substitui_ativo_id: row.substitui_ativo_id ?? null,
      tamanho_bytes: row.tamanho_bytes,
      total_linhas: row.total_linhas,
      total_colunas: row.total_colunas,
      hash_sha256: row.hash_sha256,
      status: normalizarStatusAtivoDados(row.status),
      categoria_ativo: normalizarCategoriaAtivoDados(row.categoria_ativo),
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
        substitui_ativo_id: asset.substitui_ativo_id ?? null,
        tamanho_bytes: asset.tamanho_bytes,
        total_linhas: asset.total_linhas,
        total_colunas: asset.total_colunas,
        hash_sha256: asset.hash_sha256,
        status: asset.status,
        categoria_ativo: asset.categoria_ativo ?? CategoriaAtivoDados.BRUTO_RECEBIDO,
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

  async findActiveByPath(demandaId: string, caminhoLocal: string): Promise<AtivoDados | null> {
    const row = this.database
      .select()
      .from(ativosDados)
      .where(
        and(
          eq(ativosDados.demanda_id, demandaId),
          eq(ativosDados.caminho_local, caminhoLocal),
          eq(ativosDados.status, StatusAtivoDados.ATIVO)
        )
      )
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
    if (data.substitui_ativo_id !== undefined) updateValues.substitui_ativo_id = data.substitui_ativo_id;
    if (data.tamanho_bytes !== undefined) updateValues.tamanho_bytes = data.tamanho_bytes;
    if (data.total_linhas !== undefined) updateValues.total_linhas = data.total_linhas;
    if (data.total_colunas !== undefined) updateValues.total_colunas = data.total_colunas;
    if (data.hash_sha256 !== undefined) updateValues.hash_sha256 = data.hash_sha256;
    if (data.status !== undefined) updateValues.status = data.status;
    if (data.categoria_ativo !== undefined) updateValues.categoria_ativo = data.categoria_ativo;
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

  async replace(params: ReplaceAssetParams): Promise<{ ativoSubstituido: AtivoDados; novoAtivo: AtivoDados }> {
    const now = new Date().toISOString();

    return this.database.transaction((tx) => {
      // 1. Atomicidade Reforçada: Atualização do ativo anterior garantindo id, status = 'ATIVO' e exactly 1 row updated
      const updateResult = tx
        .update(ativosDados)
        .set({
          status: StatusAtivoDados.SUBSTITUIDO,
          atualizado_em: now,
        })
        .where(
          and(
            eq(ativosDados.id, params.antigoId),
            eq(ativosDados.status, StatusAtivoDados.ATIVO)
          )
        )
        .run();

      if (updateResult.changes !== 1) {
        throw new Error(
          `Falha na substituição atômica: O ativo anterior '${params.antigoId}' não foi localizado ou não está no estado ATIVO.`
        );
      }

      // 2. Inserção do novo ativo com substitui_ativo_id apontando para o antigo
      tx.insert(ativosDados)
        .values({
          id: params.novoAtivo.id,
          demanda_id: params.novoAtivo.demanda_id,
          nome_arquivo: params.novoAtivo.nome_arquivo,
          caminho_local: params.novoAtivo.caminho_local,
          formato: params.novoAtivo.formato,
          origem: params.novoAtivo.origem,
          descricao_conteudo: params.novoAtivo.descricao_conteudo,
          granularidade: params.novoAtivo.granularidade,
          periodo_inicio: params.novoAtivo.periodo_inicio,
          periodo_fim: params.novoAtivo.periodo_fim,
          versao: params.novoAtivo.versao,
          substitui_ativo_id: params.antigoId,
          tamanho_bytes: params.novoAtivo.tamanho_bytes,
          total_linhas: params.novoAtivo.total_linhas,
          total_colunas: params.novoAtivo.total_colunas,
          hash_sha256: params.novoAtivo.hash_sha256,
          status: StatusAtivoDados.ATIVO,
          categoria_ativo: params.novoAtivo.categoria_ativo ?? CategoriaAtivoDados.BRUTO_RECEBIDO,
          schema_inferido: params.novoAtivo.schema_inferido,
          data_recebimento: params.novoAtivo.data_recebimento,
          criado_em: params.novoAtivo.criado_em || now,
          atualizado_em: params.novoAtivo.atualizado_em || now,
        })
        .run();

      // 3. Inserção atômica do evento na trilha de auditoria
      tx.insert(trilhaAuditoria)
        .values({
          id: params.eventoAuditoria.id,
          demanda_id: params.eventoAuditoria.demanda_id,
          entidade: params.eventoAuditoria.entidade,
          entidade_id: params.eventoAuditoria.entidade_id,
          tipo_evento: params.eventoAuditoria.tipo_evento,
          autor_tipo: params.eventoAuditoria.autor_tipo,
          dados_anteriores: params.eventoAuditoria.dados_anteriores,
          dados_novos: params.eventoAuditoria.dados_novos,
          justificativa: params.eventoAuditoria.justificativa,
          timestamp: params.eventoAuditoria.timestamp,
        })
        .run();

      // Busca os dois registros atualizados para retorno tipado
      const rowAntigo = tx
        .select()
        .from(ativosDados)
        .where(eq(ativosDados.id, params.antigoId))
        .get();

      const rowNovo = tx
        .select()
        .from(ativosDados)
        .where(eq(ativosDados.id, params.novoAtivo.id))
        .get();

      if (!rowAntigo || !rowNovo) {
        throw new Error('Falha na recuperação dos ativos após a substituição atômica.');
      }

      return {
        ativoSubstituido: this.mapRowToEntity(rowAntigo),
        novoAtivo: this.mapRowToEntity(rowNovo),
      };
    });
  }
}
