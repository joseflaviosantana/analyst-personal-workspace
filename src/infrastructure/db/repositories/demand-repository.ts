import { eq, desc, sql, notInArray } from 'drizzle-orm';
import { db } from '../client';
import { demandas, projetos } from '../schema';
import { Demanda, DemandaComProjeto } from '@/core/domain/entities/demanda';
import { EstadoDemanda, normalizarEstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';

export class SqliteDemandRepository implements IDemandRepository {
  private database: typeof db;

  constructor(customDb?: typeof db) {
    this.database = customDb ?? db;
  }

  async create(demand: Demanda): Promise<Demanda> {
    this.database.insert(demandas).values(demand).run();
    return demand;
  }

  async findById(id: string): Promise<DemandaComProjeto | null> {
    const row = this.database
      .select({
        demanda: demandas,
        projetoNome: projetos.nome,
      })
      .from(demandas)
      .innerJoin(projetos, eq(demandas.projeto_id, projetos.id))
      .where(eq(demandas.id, id))
      .get();

    if (!row) return null;

    return {
      id: row.demanda.id,
      projeto_id: row.demanda.projeto_id,
      titulo: row.demanda.titulo,
      solicitacao_bruta: row.demanda.solicitacao_bruta,
      contexto: row.demanda.contexto,
      objetivo_inicial: row.demanda.objetivo_inicial,
      prazo_esperado: row.demanda.prazo_esperado,
      restricoes_declaradas: row.demanda.restricoes_declaradas,
      periodo_analise: row.demanda.periodo_analise,
      granularidade: row.demanda.granularidade,
      formato_entrega: row.demanda.formato_entrega,
      requisitos_homologados_em: row.demanda.requisitos_homologados_em,
      requisitos_homologados_por: row.demanda.requisitos_homologados_por,
      requisitos_justificativa_homologacao: row.demanda.requisitos_justificativa_homologacao,
      requisitos_ressalvas: row.demanda.requisitos_ressalvas,
      estado: normalizarEstadoDemanda(row.demanda.estado),
      estado_anterior: row.demanda.estado_anterior ? normalizarEstadoDemanda(row.demanda.estado_anterior) : null,
      intake_snapshot: row.demanda.intake_snapshot ?? null,
      criado_em: row.demanda.criado_em,
      atualizado_em: row.demanda.atualizado_em,
      data_conclusao: row.demanda.data_conclusao,
      projetoNome: row.projetoNome,
    };
  }

  async findByProjectId(projectId: string): Promise<Demanda[]> {
    const rows = this.database
      .select()
      .from(demandas)
      .where(eq(demandas.projeto_id, projectId))
      .orderBy(desc(demandas.atualizado_em))
      .all();

    return rows.map((r) => ({
      id: r.id,
      projeto_id: r.projeto_id,
      titulo: r.titulo,
      solicitacao_bruta: r.solicitacao_bruta,
      contexto: r.contexto,
      objetivo_inicial: r.objetivo_inicial,
      prazo_esperado: r.prazo_esperado,
      restricoes_declaradas: r.restricoes_declaradas,
      periodo_analise: r.periodo_analise,
      granularidade: r.granularidade,
      formato_entrega: r.formato_entrega,
      requisitos_homologados_em: r.requisitos_homologados_em,
      requisitos_homologados_por: r.requisitos_homologados_por,
      requisitos_justificativa_homologacao: r.requisitos_justificativa_homologacao,
      requisitos_ressalvas: r.requisitos_ressalvas,
      estado: normalizarEstadoDemanda(r.estado),
      estado_anterior: r.estado_anterior ? normalizarEstadoDemanda(r.estado_anterior) : null,
      criado_em: r.criado_em,
      atualizado_em: r.atualizado_em,
      data_conclusao: r.data_conclusao,
    }));
  }

  async findAll(): Promise<DemandaComProjeto[]> {
    const rows = this.database
      .select({
        demanda: demandas,
        projetoNome: projetos.nome,
      })
      .from(demandas)
      .innerJoin(projetos, eq(demandas.projeto_id, projetos.id))
      .orderBy(desc(demandas.atualizado_em))
      .all();

    return rows.map((r) => ({
      id: r.demanda.id,
      projeto_id: r.demanda.projeto_id,
      titulo: r.demanda.titulo,
      solicitacao_bruta: r.demanda.solicitacao_bruta,
      contexto: r.demanda.contexto,
      objetivo_inicial: r.demanda.objetivo_inicial,
      prazo_esperado: r.demanda.prazo_esperado,
      restricoes_declaradas: r.demanda.restricoes_declaradas,
      periodo_analise: r.demanda.periodo_analise,
      granularidade: r.demanda.granularidade,
      formato_entrega: r.demanda.formato_entrega,
      requisitos_homologados_em: r.demanda.requisitos_homologados_em,
      requisitos_homologados_por: r.demanda.requisitos_homologados_por,
      requisitos_justificativa_homologacao: r.demanda.requisitos_justificativa_homologacao,
      requisitos_ressalvas: r.demanda.requisitos_ressalvas,
      estado: normalizarEstadoDemanda(r.demanda.estado),
      estado_anterior: r.demanda.estado_anterior ? normalizarEstadoDemanda(r.demanda.estado_anterior) : null,
      criado_em: r.demanda.criado_em,
      atualizado_em: r.demanda.atualizado_em,
      data_conclusao: r.demanda.data_conclusao,
      projetoNome: r.projetoNome,
    }));
  }

  async findRecent(limit = 5): Promise<DemandaComProjeto[]> {
    const rows = this.database
      .select({
        demanda: demandas,
        projetoNome: projetos.nome,
      })
      .from(demandas)
      .innerJoin(projetos, eq(demandas.projeto_id, projetos.id))
      .orderBy(desc(demandas.atualizado_em))
      .limit(limit)
      .all();

    return rows.map((r) => ({
      id: r.demanda.id,
      projeto_id: r.demanda.projeto_id,
      titulo: r.demanda.titulo,
      solicitacao_bruta: r.demanda.solicitacao_bruta,
      contexto: r.demanda.contexto,
      objetivo_inicial: r.demanda.objetivo_inicial,
      prazo_esperado: r.demanda.prazo_esperado,
      restricoes_declaradas: r.demanda.restricoes_declaradas,
      periodo_analise: r.demanda.periodo_analise,
      granularidade: r.demanda.granularidade,
      formato_entrega: r.demanda.formato_entrega,
      requisitos_homologados_em: r.demanda.requisitos_homologados_em,
      requisitos_homologados_por: r.demanda.requisitos_homologados_por,
      requisitos_justificativa_homologacao: r.demanda.requisitos_justificativa_homologacao,
      requisitos_ressalvas: r.demanda.requisitos_ressalvas,
      estado: normalizarEstadoDemanda(r.demanda.estado),
      estado_anterior: r.demanda.estado_anterior ? normalizarEstadoDemanda(r.demanda.estado_anterior) : null,
      criado_em: r.demanda.criado_em,
      atualizado_em: r.demanda.atualizado_em,
      data_conclusao: r.demanda.data_conclusao,
      projetoNome: r.projetoNome,
    }));
  }

  async update(id: string, data: Partial<Demanda>): Promise<Demanda | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    // Blindagem de imutabilidade: solicitacao_bruta não pode ser alterada após a criação da demanda
    const { solicitacao_bruta: _omit, ...safeData } = data as any;

    const updatedData = {
      ...safeData,
      atualizado_em: new Date().toISOString(),
    };

    this.database
      .update(demandas)
      .set(updatedData)
      .where(eq(demandas.id, id))
      .run();

    return this.findById(id);
  }

  async countActive(): Promise<number> {
    const result = this.database
      .select({ count: sql<number>`count(*)` })
      .from(demandas)
      .where(
        notInArray(demandas.estado, [EstadoDemanda.CONCLUIDA, EstadoDemanda.CANCELADA])
      )
      .get();

    return result ? Number(result.count) : 0;
  }

  async countTotal(): Promise<number> {
    const result = this.database
      .select({ count: sql<number>`count(*)` })
      .from(demandas)
      .get();

    return result ? Number(result.count) : 0;
  }
}
