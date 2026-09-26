import { desc, eq } from 'drizzle-orm';
import { db } from '../client';
import { problemasQualidade } from '../schema';
import { EvidenciaProblemaQualidade, ProblemaQualidade } from '@/core/domain/entities/problema-qualidade';
import { CategoriaProblemaQualidade } from '@/core/domain/enums/categoria-problema-qualidade';
import { SeveridadeProblema } from '@/core/domain/enums/severidade-problema';
import { StatusProblemaQualidade } from '@/core/domain/enums/status-problema-qualidade';
import { IProblemasQualidadeRepository } from '@/core/domain/repositories/problemas-qualidade-repository.interface';

export class SqliteProblemasQualidadeRepository implements IProblemasQualidadeRepository {
  private database: typeof db;

  constructor(customDb?: typeof db) {
    this.database = customDb ?? db;
  }

  private mapRowToEntity(row: typeof problemasQualidade.$inferSelect): ProblemaQualidade {
    let evidencias: EvidenciaProblemaQualidade[] = [];
    if (row.amostra_evidencias) {
      try {
        evidencias = JSON.parse(row.amostra_evidencias) as EvidenciaProblemaQualidade[];
      } catch {
        evidencias = [];
      }
    }

    let regraSnapshot = null;
    if (row.regra_snapshot) {
      try {
        regraSnapshot = JSON.parse(row.regra_snapshot);
      } catch {
        regraSnapshot = null;
      }
    }

    return {
      id: row.id,
      diagnostico_id: row.diagnostico_id,
      ativo_dados_id: row.ativo_dados_id,
      demanda_id: row.demanda_id,
      categoria: row.categoria as CategoriaProblemaQualidade,
      titulo: row.titulo,
      descricao: row.descricao,
      tabela_afetada: row.tabela_afetada,
      coluna_afetada: row.coluna_afetada,
      total_linhas_afetadas: row.total_linhas_afetadas,
      percentual_linhas_afetadas: row.percentual_linhas_afetadas,
      amostra_evidencias: evidencias,
      severidade: row.severidade as SeveridadeProblema,
      impacto_calculo: row.impacto_calculo,
      acao_deliberada: row.acao_deliberada,
      justificativa_deliberacao: row.justificativa_deliberacao,
      deliberado_por_humano: Boolean(row.deliberado_por_humano),
      deliberado_em: row.deliberado_em,
      status: row.status as StatusProblemaQualidade,
      origem_deteccao: row.origem_deteccao as 'AUTOMATICA' | 'MANUAL',
      regra_id: row.regra_id,
      regra_snapshot: regraSnapshot,
      criado_em: row.criado_em,
      atualizado_em: row.atualizado_em,
    };
  }

  async create(problema: ProblemaQualidade): Promise<ProblemaQualidade> {
    await this.createMany([problema]);
    return problema;
  }

  async createMany(problemas: ProblemaQualidade[]): Promise<ProblemaQualidade[]> {
    if (problemas.length === 0) return [];

    const rows = problemas.map((p) => ({
      id: p.id,
      diagnostico_id: p.diagnostico_id,
      ativo_dados_id: p.ativo_dados_id,
      demanda_id: p.demanda_id,
      categoria: p.categoria,
      titulo: p.titulo,
      descricao: p.descricao,
      tabela_afetada: p.tabela_afetada,
      coluna_afetada: p.coluna_afetada,
      total_linhas_afetadas: p.total_linhas_afetadas,
      percentual_linhas_afetadas: p.percentual_linhas_afetadas,
      amostra_evidencias: JSON.stringify(p.amostra_evidencias),
      severidade: p.severidade,
      impacto_calculo: p.impacto_calculo,
      acao_deliberada: p.acao_deliberada,
      justificativa_deliberacao: p.justificativa_deliberacao,
      deliberado_por_humano: p.deliberado_por_humano ? 1 : 0,
      deliberado_em: p.deliberado_em,
      status: p.status,
      origem_deteccao: p.origem_deteccao,
      regra_id: p.regra_id ?? null,
      regra_snapshot: p.regra_snapshot ? JSON.stringify(p.regra_snapshot) : null,
      criado_em: p.criado_em,
      atualizado_em: p.atualizado_em,
    }));

    // Inserção em lote no SQLite
    this.database.insert(problemasQualidade).values(rows).run();

    return problemas;
  }

  async findById(id: string): Promise<ProblemaQualidade | null> {
    const row = this.database
      .select()
      .from(problemasQualidade)
      .where(eq(problemasQualidade.id, id))
      .get();

    return row ? this.mapRowToEntity(row) : null;
  }

  async findByDiagnosticId(diagnosticoId: string): Promise<ProblemaQualidade[]> {
    const rows = this.database
      .select()
      .from(problemasQualidade)
      .where(eq(problemasQualidade.diagnostico_id, diagnosticoId))
      .orderBy(desc(problemasQualidade.total_linhas_afetadas))
      .all();

    return rows.map((r) => this.mapRowToEntity(r));
  }

  async findByAssetId(ativoDadosId: string): Promise<ProblemaQualidade[]> {
    const rows = this.database
      .select()
      .from(problemasQualidade)
      .where(eq(problemasQualidade.ativo_dados_id, ativoDadosId))
      .orderBy(desc(problemasQualidade.criado_em))
      .all();

    return rows.map((r) => this.mapRowToEntity(r));
  }

  async findByDemandId(demandaId: string): Promise<ProblemaQualidade[]> {
    const rows = this.database
      .select()
      .from(problemasQualidade)
      .where(eq(problemasQualidade.demanda_id, demandaId))
      .orderBy(desc(problemasQualidade.criado_em))
      .all();

    return rows.map((r) => this.mapRowToEntity(r));
  }

  async update(id: string, data: Partial<ProblemaQualidade>): Promise<ProblemaQualidade | null> {
    const valuesToUpdate: Partial<typeof problemasQualidade.$inferInsert> = {
      atualizado_em: new Date().toISOString(),
    };

    if (data.severidade !== undefined) valuesToUpdate.severidade = data.severidade;
    if (data.status !== undefined) valuesToUpdate.status = data.status;
    if (data.impacto_calculo !== undefined) valuesToUpdate.impacto_calculo = data.impacto_calculo;
    if (data.acao_deliberada !== undefined) valuesToUpdate.acao_deliberada = data.acao_deliberada;
    if (data.justificativa_deliberacao !== undefined) valuesToUpdate.justificativa_deliberacao = data.justificativa_deliberacao;
    if (data.deliberado_por_humano !== undefined) valuesToUpdate.deliberado_por_humano = data.deliberado_por_humano ? 1 : 0;
    if (data.deliberado_em !== undefined) valuesToUpdate.deliberado_em = data.deliberado_em;

    this.database
      .update(problemasQualidade)
      .set(valuesToUpdate)
      .where(eq(problemasQualidade.id, id))
      .run();

    return this.findById(id);
  }
}
