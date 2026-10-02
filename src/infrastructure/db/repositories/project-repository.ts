import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../client';
import { projetos, demandas } from '../schema';
import { Projeto, ProjetoComContadores, StatusProjeto } from '@/core/domain/entities/projeto';
import { IProjectRepository } from '@/core/domain/repositories/project-repository.interface';

export class SqliteProjectRepository implements IProjectRepository {
  private database: typeof db;

  constructor(customDb?: typeof db) {
    this.database = customDb ?? db;
  }

  async create(project: Projeto): Promise<Projeto> {
    this.database.insert(projetos).values(project).run();
    return project;
  }

  async findById(id: string): Promise<Projeto | null> {
    const row = this.database
      .select()
      .from(projetos)
      .where(eq(projetos.id, id))
      .get();

    if (!row) return null;

    return {
      id: row.id,
      nome: row.nome,
      descricao: row.descricao,
      status: row.status as StatusProjeto,
      data_inicio: row.data_inicio,
      data_conclusao_prevista: row.data_conclusao_prevista,
      data_conclusao_real: row.data_conclusao_real,
      criado_em: row.criado_em,
      atualizado_em: row.atualizado_em,
    };
  }

  async findAll(): Promise<ProjetoComContadores[]> {
    const rows = this.database
      .select()
      .from(projetos)
      .orderBy(desc(projetos.atualizado_em))
      .all();

    const allDemands = this.database.select().from(demandas).all();

    return rows.map((proj) => {
      const projDemands = allDemands.filter((d) => d.projeto_id === proj.id);
      const totalDemandas = projDemands.length;
      const demandasAtivas = projDemands.filter(
        (d) => d.estado !== 'CONCLUIDA' && d.estado !== 'CANCELADA'
      ).length;

      return {
        id: proj.id,
        nome: proj.nome,
        descricao: proj.descricao,
        status: proj.status as StatusProjeto,
        data_inicio: proj.data_inicio,
        data_conclusao_prevista: proj.data_conclusao_prevista,
        data_conclusao_real: proj.data_conclusao_real,
        criado_em: proj.criado_em,
        atualizado_em: proj.atualizado_em,
        totalDemandas,
        demandasAtivas,
      };
    });
  }

  async update(id: string, data: Partial<Projeto>): Promise<Projeto | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updatedData = {
      ...data,
      atualizado_em: new Date().toISOString(),
    };

    this.database
      .update(projetos)
      .set(updatedData)
      .where(eq(projetos.id, id))
      .run();

    return this.findById(id);
  }

  async countActive(): Promise<number> {
    const result = this.database
      .select({ count: sql<number>`count(*)` })
      .from(projetos)
      .where(eq(projetos.status, 'ATIVO'))
      .get();

    return result ? Number(result.count) : 0;
  }

  async countTotal(): Promise<number> {
    const result = this.database
      .select({ count: sql<number>`count(*)` })
      .from(projetos)
      .get();

    return result ? Number(result.count) : 0;
  }

  async countDemands(projectId: string): Promise<number> {
    const result = this.database
      .select({ count: sql<number>`count(*)` })
      .from(demandas)
      .where(eq(demandas.projeto_id, projectId))
      .get();

    return result ? Number(result.count) : 0;
  }

  async delete(id: string): Promise<boolean> {
    const result = this.database
      .delete(projetos)
      .where(eq(projetos.id, id))
      .run();

    return result.changes > 0;
  }
}
