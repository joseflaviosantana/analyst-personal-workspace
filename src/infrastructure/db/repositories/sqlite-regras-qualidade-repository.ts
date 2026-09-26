import { and, desc, eq } from 'drizzle-orm';
import { db } from '../client';
import { regrasQualidade } from '../schema';
import { ParametrosRegraQualidade, RegraQualidade } from '@/core/domain/entities/regra-qualidade';
import { StatusRegraQualidade } from '@/core/domain/enums/status-regra-qualidade';
import { TipoRegraQualidade } from '@/core/domain/enums/tipo-regra-qualidade';
import { IRegrasQualidadeRepository } from '@/core/domain/repositories/regras-qualidade-repository.interface';

export class SqliteRegrasQualidadeRepository implements IRegrasQualidadeRepository {
  private database: typeof db;

  constructor(customDb?: typeof db) {
    this.database = customDb ?? db;
  }

  private mapRowToEntity(row: typeof regrasQualidade.$inferSelect): RegraQualidade {
    let colunas: string[] = [];
    if (row.colunas) {
      try {
        colunas = JSON.parse(row.colunas) as string[];
      } catch {
        colunas = [];
      }
    }

    let parametros: ParametrosRegraQualidade;
    try {
      parametros = JSON.parse(row.parametros) as ParametrosRegraQualidade;
    } catch {
      parametros = {} as ParametrosRegraQualidade;
    }

    return {
      id: row.id,
      ativo_dados_id: row.ativo_dados_id,
      tipo: row.tipo as TipoRegraQualidade,
      coluna: row.coluna,
      colunas,
      nome: row.nome,
      descricao: row.descricao,
      parametros,
      status: row.status as StatusRegraQualidade,
      versao: row.versao,
      criado_em: row.criado_em,
      atualizado_em: row.atualizado_em,
    };
  }

  async create(regra: RegraQualidade): Promise<void> {
    this.database
      .insert(regrasQualidade)
      .values({
        id: regra.id,
        ativo_dados_id: regra.ativo_dados_id,
        tipo: regra.tipo,
        coluna: regra.coluna,
        colunas: JSON.stringify(regra.colunas ?? []),
        nome: regra.nome,
        descricao: regra.descricao,
        parametros: JSON.stringify(regra.parametros ?? {}),
        status: regra.status,
        versao: regra.versao,
        criado_em: regra.criado_em,
        atualizado_em: regra.atualizado_em,
      })
      .run();
  }

  async findById(id: string): Promise<RegraQualidade | null> {
    const row = this.database
      .select()
      .from(regrasQualidade)
      .where(eq(regrasQualidade.id, id))
      .get();

    return row ? this.mapRowToEntity(row) : null;
  }

  async findByAssetId(ativoDadosId: string, status?: StatusRegraQualidade): Promise<RegraQualidade[]> {
    const conditions = [eq(regrasQualidade.ativo_dados_id, ativoDadosId)];
    if (status) {
      conditions.push(eq(regrasQualidade.status, status));
    }

    const rows = this.database
      .select()
      .from(regrasQualidade)
      .where(and(...conditions))
      .orderBy(desc(regrasQualidade.criado_em))
      .all();

    return rows.map((r) => this.mapRowToEntity(r));
  }

  async update(regra: RegraQualidade): Promise<void> {
    this.database
      .update(regrasQualidade)
      .set({
        tipo: regra.tipo,
        coluna: regra.coluna,
        colunas: JSON.stringify(regra.colunas ?? []),
        nome: regra.nome,
        descricao: regra.descricao,
        parametros: JSON.stringify(regra.parametros ?? {}),
        status: regra.status,
        versao: regra.versao,
        atualizado_em: regra.atualizado_em,
      })
      .where(eq(regrasQualidade.id, regra.id))
      .run();
  }
}
