import { desc, eq } from 'drizzle-orm';
import { db } from '../client';
import { diagnosticosQualidade, problemasQualidade } from '../schema';
import { DiagnosticoQualidade, ResultadoItemVerificacao } from '@/core/domain/entities/diagnostico-qualidade';
import { ProblemaQualidade } from '@/core/domain/entities/problema-qualidade';
import { StatusExecucaoDiagnostico } from '@/core/domain/enums/status-execucao-diagnostico';
import { IDiagnosticosQualidadeRepository } from '@/core/domain/repositories/diagnosticos-qualidade-repository.interface';

export class SqliteDiagnosticosQualidadeRepository implements IDiagnosticosQualidadeRepository {
  private database: typeof db;

  constructor(customDb?: typeof db) {
    this.database = customDb ?? db;
  }

  private mapRowToEntity(row: typeof diagnosticosQualidade.$inferSelect): DiagnosticoQualidade {
    let verificacoes: ResultadoItemVerificacao[] = [];
    if (row.verificacoes_executadas) {
      try {
        verificacoes = JSON.parse(row.verificacoes_executadas) as ResultadoItemVerificacao[];
      } catch {
        verificacoes = [];
      }
    }

    let metricas: Record<string, unknown> | null = null;
    if (row.resumo_metricas) {
      try {
        metricas = JSON.parse(row.resumo_metricas) as Record<string, unknown>;
      } catch {
        metricas = null;
      }
    }

    return {
      id: row.id,
      ativo_dados_id: row.ativo_dados_id,
      demanda_id: row.demanda_id,
      iniciado_em: row.iniciado_em,
      concluido_em: row.concluido_em,
      duracao_ms: row.duracao_ms,
      total_linhas_avaliadas: row.total_linhas_avaliadas,
      total_colunas_avaliadas: row.total_colunas_avaliadas,
      verificacoes_executadas: verificacoes,
      total_problemas_detectados: row.total_problemas_detectados,
      status_execucao: row.status_execucao as StatusExecucaoDiagnostico,
      erro_mensagem: row.erro_mensagem,
      resumo_metricas: metricas,
      criado_em: row.criado_em,
      atualizado_em: row.atualizado_em,
    };
  }

  async create(diagnostico: DiagnosticoQualidade): Promise<DiagnosticoQualidade> {
    this.database
      .insert(diagnosticosQualidade)
      .values({
        id: diagnostico.id,
        ativo_dados_id: diagnostico.ativo_dados_id,
        demanda_id: diagnostico.demanda_id,
        iniciado_em: diagnostico.iniciado_em,
        concluido_em: diagnostico.concluido_em,
        duracao_ms: diagnostico.duracao_ms,
        total_linhas_avaliadas: diagnostico.total_linhas_avaliadas,
        total_colunas_avaliadas: diagnostico.total_colunas_avaliadas,
        verificacoes_executadas: JSON.stringify(diagnostico.verificacoes_executadas),
        total_problemas_detectados: diagnostico.total_problemas_detectados,
        status_execucao: diagnostico.status_execucao,
        erro_mensagem: diagnostico.erro_mensagem,
        resumo_metricas: diagnostico.resumo_metricas ? JSON.stringify(diagnostico.resumo_metricas) : null,
        criado_em: diagnostico.criado_em,
        atualizado_em: diagnostico.atualizado_em,
      })
      .run();

    return diagnostico;
  }

  async update(id: string, data: Partial<DiagnosticoQualidade>): Promise<DiagnosticoQualidade | null> {
    const valuesToUpdate: Partial<typeof diagnosticosQualidade.$inferInsert> = {
      atualizado_em: new Date().toISOString(),
    };

    if (data.concluido_em !== undefined) valuesToUpdate.concluido_em = data.concluido_em;
    if (data.duracao_ms !== undefined) valuesToUpdate.duracao_ms = data.duracao_ms;
    if (data.total_linhas_avaliadas !== undefined) valuesToUpdate.total_linhas_avaliadas = data.total_linhas_avaliadas;
    if (data.total_colunas_avaliadas !== undefined) valuesToUpdate.total_colunas_avaliadas = data.total_colunas_avaliadas;
    if (data.verificacoes_executadas !== undefined) {
      valuesToUpdate.verificacoes_executadas = JSON.stringify(data.verificacoes_executadas);
    }
    if (data.total_problemas_detectados !== undefined) {
      valuesToUpdate.total_problemas_detectados = data.total_problemas_detectados;
    }
    if (data.status_execucao !== undefined) valuesToUpdate.status_execucao = data.status_execucao;
    if (data.erro_mensagem !== undefined) valuesToUpdate.erro_mensagem = data.erro_mensagem;
    if (data.resumo_metricas !== undefined) {
      valuesToUpdate.resumo_metricas = data.resumo_metricas ? JSON.stringify(data.resumo_metricas) : null;
    }

    this.database
      .update(diagnosticosQualidade)
      .set(valuesToUpdate)
      .where(eq(diagnosticosQualidade.id, id))
      .run();

    return this.findById(id);
  }

  async findById(id: string): Promise<DiagnosticoQualidade | null> {
    const row = this.database
      .select()
      .from(diagnosticosQualidade)
      .where(eq(diagnosticosQualidade.id, id))
      .get();

    return row ? this.mapRowToEntity(row) : null;
  }

  async findLatestByAssetId(ativoDadosId: string): Promise<DiagnosticoQualidade | null> {
    const row = this.database
      .select()
      .from(diagnosticosQualidade)
      .where(eq(diagnosticosQualidade.ativo_dados_id, ativoDadosId))
      .orderBy(desc(diagnosticosQualidade.criado_em))
      .limit(1)
      .get();

    return row ? this.mapRowToEntity(row) : null;
  }

  async findByAssetId(ativoDadosId: string): Promise<DiagnosticoQualidade[]> {
    const rows = this.database
      .select()
      .from(diagnosticosQualidade)
      .where(eq(diagnosticosQualidade.ativo_dados_id, ativoDadosId))
      .orderBy(desc(diagnosticosQualidade.criado_em))
      .all();

    return rows.map((r) => this.mapRowToEntity(r));
  }

  async findByDemandId(demandaId: string): Promise<DiagnosticoQualidade[]> {
    const rows = this.database
      .select()
      .from(diagnosticosQualidade)
      .where(eq(diagnosticosQualidade.demanda_id, demandaId))
      .orderBy(desc(diagnosticosQualidade.criado_em))
      .all();

    return rows.map((r) => this.mapRowToEntity(r));
  }

  async salvarConclusaoTransacional(
    diagnosticoId: string,
    dadosUpdate: Partial<DiagnosticoQualidade>,
    problemas: ProblemaQualidade[]
  ): Promise<{ diagnostico: DiagnosticoQualidade; problemas: ProblemaQualidade[] }> {
    return this.database.transaction((tx) => {
      // 1. Inserção em lote dos problemas dentro da mesma transação atômica
      if (problemas.length > 0) {
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

        tx.insert(problemasQualidade).values(rows).run();
      }

      // 2. Atualização do diagnóstico dentro da mesma transação
      const valuesToUpdate: Partial<typeof diagnosticosQualidade.$inferInsert> = {
        atualizado_em: new Date().toISOString(),
      };

      if (dadosUpdate.concluido_em !== undefined) valuesToUpdate.concluido_em = dadosUpdate.concluido_em;
      if (dadosUpdate.duracao_ms !== undefined) valuesToUpdate.duracao_ms = dadosUpdate.duracao_ms;
      if (dadosUpdate.total_linhas_avaliadas !== undefined) valuesToUpdate.total_linhas_avaliadas = dadosUpdate.total_linhas_avaliadas;
      if (dadosUpdate.total_colunas_avaliadas !== undefined) valuesToUpdate.total_colunas_avaliadas = dadosUpdate.total_colunas_avaliadas;
      if (dadosUpdate.verificacoes_executadas !== undefined) {
        valuesToUpdate.verificacoes_executadas = JSON.stringify(dadosUpdate.verificacoes_executadas);
      }
      if (dadosUpdate.total_problemas_detectados !== undefined) {
        valuesToUpdate.total_problemas_detectados = dadosUpdate.total_problemas_detectados;
      }
      if (dadosUpdate.status_execucao !== undefined) valuesToUpdate.status_execucao = dadosUpdate.status_execucao;
      if (dadosUpdate.erro_mensagem !== undefined) valuesToUpdate.erro_mensagem = dadosUpdate.erro_mensagem;
      if (dadosUpdate.resumo_metricas !== undefined) {
        valuesToUpdate.resumo_metricas = dadosUpdate.resumo_metricas ? JSON.stringify(dadosUpdate.resumo_metricas) : null;
      }

      tx.update(diagnosticosQualidade)
        .set(valuesToUpdate)
        .where(eq(diagnosticosQualidade.id, diagnosticoId))
        .run();

      const diagRow = tx
        .select()
        .from(diagnosticosQualidade)
        .where(eq(diagnosticosQualidade.id, diagnosticoId))
        .get();

      if (!diagRow) {
        throw new Error(`Diagnóstico com ID "${diagnosticoId}" não encontrado durante a transação de conclusão.`);
      }

      return {
        diagnostico: this.mapRowToEntity(diagRow),
        problemas,
      };
    });
  }
}
