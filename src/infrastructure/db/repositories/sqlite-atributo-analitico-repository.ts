import { asc, eq } from 'drizzle-orm';
import { db } from '../client';
import { atributosAnaliticos } from '../schema';
import { AtributoAnalitico } from '@/core/domain/entities/atributo-analitico';
import { TipoDadoAnalitico } from '@/core/domain/enums/tipo-dado-analitico';
import { PapelAtributoAnalitico } from '@/core/domain/enums/papel-atributo-analitico';
import { IAtributoAnaliticoRepository } from '@/core/domain/repositories/atributo-analitico-repository.interface';

export class SqliteAtributoAnaliticoRepository implements IAtributoAnaliticoRepository {
  private database: typeof db;

  constructor(customDb?: typeof db) {
    this.database = customDb ?? db;
  }

  private mapRowToEntity(row: typeof atributosAnaliticos.$inferSelect): AtributoAnalitico {
    return {
      id: row.id,
      entidade_id: row.entidade_id,
      nome_original: row.nome_original,
      nome_amigavel: row.nome_amigavel,
      tipo_dado: row.tipo_dado as TipoDadoAnalitico,
      papel: row.papel as PapelAtributoAnalitico,
      ordem: row.ordem,
      oculto: row.oculto === 1,
      descricao: row.descricao ?? null,
      formato_exibicao: row.formato_exibicao ?? null,
      criado_em: row.criado_em,
      atualizado_em: row.atualizado_em,
    };
  }

  async findById(id: string): Promise<AtributoAnalitico | null> {
    const row = this.database
      .select()
      .from(atributosAnaliticos)
      .where(eq(atributosAnaliticos.id, id))
      .get();

    if (!row) return null;
    return this.mapRowToEntity(row);
  }

  async findByEntidadeId(entidadeId: string): Promise<AtributoAnalitico[]> {
    const rows = this.database
      .select()
      .from(atributosAnaliticos)
      .where(eq(atributosAnaliticos.entidade_id, entidadeId))
      .orderBy(asc(atributosAnaliticos.ordem))
      .all();

    return rows.map((r) => this.mapRowToEntity(r));
  }

  async create(atributo: AtributoAnalitico): Promise<AtributoAnalitico> {
    this.database
      .insert(atributosAnaliticos)
      .values({
        id: atributo.id,
        entidade_id: atributo.entidade_id,
        nome_original: atributo.nome_original,
        nome_amigavel: atributo.nome_amigavel,
        tipo_dado: atributo.tipo_dado,
        papel: atributo.papel,
        ordem: atributo.ordem,
        oculto: atributo.oculto ? 1 : 0,
        descricao: atributo.descricao,
        formato_exibicao: atributo.formato_exibicao,
        criado_em: atributo.criado_em,
        atualizado_em: atributo.atualizado_em,
      })
      .run();

    return atributo;
  }

  async update(atributo: AtributoAnalitico): Promise<AtributoAnalitico> {
    this.database
      .update(atributosAnaliticos)
      .set({
        nome_original: atributo.nome_original,
        nome_amigavel: atributo.nome_amigavel,
        tipo_dado: atributo.tipo_dado,
        papel: atributo.papel,
        ordem: atributo.ordem,
        oculto: atributo.oculto ? 1 : 0,
        descricao: atributo.descricao,
        formato_exibicao: atributo.formato_exibicao,
        atualizado_em: atributo.atualizado_em,
      })
      .where(eq(atributosAnaliticos.id, atributo.id))
      .run();

    return atributo;
  }

  async delete(id: string): Promise<void> {
    this.database
      .delete(atributosAnaliticos)
      .where(eq(atributosAnaliticos.id, id))
      .run();
  }

  async createBatch(atributos: AtributoAnalitico[]): Promise<AtributoAnalitico[]> {
    if (atributos.length === 0) return [];

    this.database.transaction((tx) => {
      for (const attr of atributos) {
        tx.insert(atributosAnaliticos)
          .values({
            id: attr.id,
            entidade_id: attr.entidade_id,
            nome_original: attr.nome_original,
            nome_amigavel: attr.nome_amigavel,
            tipo_dado: attr.tipo_dado,
            papel: attr.papel,
            ordem: attr.ordem,
            oculto: attr.oculto ? 1 : 0,
            descricao: attr.descricao,
            formato_exibicao: attr.formato_exibicao,
            criado_em: attr.criado_em,
            atualizado_em: attr.atualizado_em,
          })
          .run();
      }
    });

    return atributos;
  }
}
