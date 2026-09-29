import { asc, count, eq } from 'drizzle-orm';
import { db } from '../client';
import { validacoesConciliacao } from '../schema';
import { ValidacaoConciliacao } from '@/core/domain/entities/validacao-conciliacao';
import { CamadaValidacao } from '@/core/domain/enums/camada-validacao';
import { ResultadoValidacao } from '@/core/domain/enums/resultado-validacao';
import { IValidacaoConciliacaoRepository } from '@/core/domain/repositories/validacao-conciliacao-repository.interface';

export class SqliteValidacaoConciliacaoRepository implements IValidacaoConciliacaoRepository {
  private database: typeof db;

  constructor(customDb?: typeof db) {
    this.database = customDb ?? db;
  }

  private mapRowToEntity(row: typeof validacoesConciliacao.$inferSelect): ValidacaoConciliacao {
    return {
      id: row.id,
      demanda_id: row.demanda_id,
      modelo_id: row.modelo_id ?? null,
      metrica_id: row.metrica_id ?? null,
      titulo: row.titulo,
      camada: row.camada as CamadaValidacao,
      metodo_verificacao: row.metodo_verificacao,
      base_referencia: row.base_referencia ?? null,
      valor_esperado: row.valor_esperado ?? null,
      valor_obtido: row.valor_obtido ?? null,
      divergencia_absoluta: row.divergencia_absoluta ?? null,
      divergencia_percentual: row.divergencia_percentual ?? null,
      tolerancia_permitida: row.tolerancia_permitida,
      unidade_medida: row.unidade_medida ?? null,
      resultado: row.resultado as ResultadoValidacao,
      obrigatoria: Boolean(row.obrigatoria),
      acao_corretiva: row.acao_corretiva ?? null,
      notas_evidencia: row.notas_evidencia ?? null,
      executado_por: row.executado_por ?? null,
      executado_em: row.executado_em ?? null,
      criado_em: row.criado_em,
      atualizado_em: row.atualizado_em,
    };
  }

  async create(validacao: ValidacaoConciliacao): Promise<ValidacaoConciliacao> {
    this.database
      .insert(validacoesConciliacao)
      .values({
        id: validacao.id,
        demanda_id: validacao.demanda_id,
        modelo_id: validacao.modelo_id ?? null,
        metrica_id: validacao.metrica_id ?? null,
        titulo: validacao.titulo,
        camada: validacao.camada,
        metodo_verificacao: validacao.metodo_verificacao,
        base_referencia: validacao.base_referencia ?? null,
        valor_esperado: validacao.valor_esperado ?? null,
        valor_obtido: validacao.valor_obtido ?? null,
        divergencia_absoluta: validacao.divergencia_absoluta ?? null,
        divergencia_percentual: validacao.divergencia_percentual ?? null,
        tolerancia_permitida: validacao.tolerancia_permitida,
        unidade_medida: validacao.unidade_medida ?? null,
        resultado: validacao.resultado,
        obrigatoria: validacao.obrigatoria,
        acao_corretiva: validacao.acao_corretiva ?? null,
        notas_evidencia: validacao.notas_evidencia ?? null,
        executado_por: validacao.executado_por ?? null,
        executado_em: validacao.executado_em ?? null,
        criado_em: validacao.criado_em,
        atualizado_em: validacao.atualizado_em,
      })
      .run();

    return validacao;
  }

  async findById(id: string): Promise<ValidacaoConciliacao | null> {
    const row = this.database
      .select()
      .from(validacoesConciliacao)
      .where(eq(validacoesConciliacao.id, id))
      .get();

    if (!row) return null;
    return this.mapRowToEntity(row);
  }

  async findByDemandId(demandaId: string): Promise<ValidacaoConciliacao[]> {
    const rows = this.database
      .select()
      .from(validacoesConciliacao)
      .where(eq(validacoesConciliacao.demanda_id, demandaId))
      .orderBy(asc(validacoesConciliacao.criado_em))
      .all();

    return rows.map((r) => this.mapRowToEntity(r));
  }

  async update(id: string, partial: Partial<ValidacaoConciliacao>): Promise<ValidacaoConciliacao | null> {
    const existente = await this.findById(id);
    if (!existente) return null;

    const valuesToUpdate: Partial<typeof validacoesConciliacao.$inferInsert> = {};

    if (partial.titulo !== undefined) valuesToUpdate.titulo = partial.titulo;
    if (partial.camada !== undefined) valuesToUpdate.camada = partial.camada;
    if (partial.metodo_verificacao !== undefined) valuesToUpdate.metodo_verificacao = partial.metodo_verificacao;
    if (partial.base_referencia !== undefined) valuesToUpdate.base_referencia = partial.base_referencia;
    if (partial.valor_esperado !== undefined) valuesToUpdate.valor_esperado = partial.valor_esperado;
    if (partial.valor_obtido !== undefined) valuesToUpdate.valor_obtido = partial.valor_obtido;
    if (partial.divergencia_absoluta !== undefined) valuesToUpdate.divergencia_absoluta = partial.divergencia_absoluta;
    if (partial.divergencia_percentual !== undefined) valuesToUpdate.divergencia_percentual = partial.divergencia_percentual;
    if (partial.tolerancia_permitida !== undefined) valuesToUpdate.tolerancia_permitida = partial.tolerancia_permitida;
    if (partial.unidade_medida !== undefined) valuesToUpdate.unidade_medida = partial.unidade_medida;
    if (partial.resultado !== undefined) valuesToUpdate.resultado = partial.resultado;
    if (partial.obrigatoria !== undefined) valuesToUpdate.obrigatoria = partial.obrigatoria;
    if (partial.acao_corretiva !== undefined) valuesToUpdate.acao_corretiva = partial.acao_corretiva;
    if (partial.notas_evidencia !== undefined) valuesToUpdate.notas_evidencia = partial.notas_evidencia;
    if (partial.executado_por !== undefined) valuesToUpdate.executado_por = partial.executado_por;
    if (partial.executado_em !== undefined) valuesToUpdate.executado_em = partial.executado_em;
    valuesToUpdate.atualizado_em = partial.atualizado_em ?? new Date().toISOString();

    this.database
      .update(validacoesConciliacao)
      .set(valuesToUpdate)
      .where(eq(validacoesConciliacao.id, id))
      .run();

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const res = this.database
      .delete(validacoesConciliacao)
      .where(eq(validacoesConciliacao.id, id))
      .run();

    return res.changes > 0;
  }

  async countByDemandId(demandaId: string): Promise<number> {
    const res = this.database
      .select({ val: count() })
      .from(validacoesConciliacao)
      .where(eq(validacoesConciliacao.demanda_id, demandaId))
      .get();

    return res?.val ?? 0;
  }
}
