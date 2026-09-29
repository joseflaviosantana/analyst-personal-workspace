import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import fs from 'fs';
import * as schema from '@/infrastructure/db/schema';
import { SqliteProjectRepository } from '@/infrastructure/db/repositories/project-repository';
import { SqliteDemandRepository } from '@/infrastructure/db/repositories/demand-repository';
import { SqliteAuditRepository } from '@/infrastructure/db/repositories/audit-repository';
import { SqliteAtivoDadosRepository } from '@/infrastructure/db/repositories/ativo-dados-repository';
import { SqliteDiagnosticosQualidadeRepository } from '@/infrastructure/db/repositories/sqlite-diagnosticos-qualidade-repository';
import { SqliteProblemasQualidadeRepository } from '@/infrastructure/db/repositories/sqlite-problemas-qualidade-repository';
import { SqliteDatasetAutorizadoRepository } from '@/infrastructure/db/repositories/sqlite-dataset-autorizado-repository';
import { SqliteReceitaPreparacaoRepository } from '@/infrastructure/db/repositories/sqlite-receita-preparacao-repository';
import { SqliteModeloAnaliticoRepository } from '@/infrastructure/db/repositories/sqlite-modelo-analitico-repository';
import { SqliteValidacaoConciliacaoRepository } from '@/infrastructure/db/repositories/sqlite-validacao-conciliacao-repository';
import { SqliteEntregavelDemandaRepository } from '@/infrastructure/db/repositories/sqlite-entregavel-demanda-repository';
import { advanceDemandAction, WorkflowActionDeps } from '@/app/actions/workflow-actions';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { CamadaValidacao } from '@/core/domain/enums/camada-validacao';
import { ResultadoValidacao } from '@/core/domain/enums/resultado-validacao';
import { TipoEntregavel } from '@/core/domain/enums/tipo-entregavel';
import { StatusEntregavel } from '@/core/domain/enums/status-entregavel';
import { StatusAceiteEntrega } from '@/core/domain/enums/status-aceite-entrega';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Integration Tests: Governança Factual de Validação e Conclusão no Workflow (Subunidade 3.7A)', () => {
  const testDbDir = path.join(process.cwd(), '.workspace', 'data');
  const testDbPath = path.join(testDbDir, 'test_workflow_validation_integration_37a.db');
  let sqliteDb: Database.Database;
  let db: ReturnType<typeof drizzle<typeof schema>>;

  let deps: WorkflowActionDeps;
  const projetoId = 'prj_wf_val_1';
  const demandaId = 'dem_wf_val_1';

  beforeAll(async () => {
    if (!fs.existsSync(testDbDir)) {
      fs.mkdirSync(testDbDir, { recursive: true });
    }
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    sqliteDb = new Database(testDbPath);
    sqliteDb.pragma('foreign_keys = ON');
    sqliteDb.pragma('journal_mode = WAL');
    sqliteDb.pragma('synchronous = NORMAL');
    sqliteDb.pragma('busy_timeout = 5000');

    db = drizzle(sqliteDb, { schema });
    const migrationsFolder = path.join(process.cwd(), 'drizzle');
    migrate(db, { migrationsFolder });

    deps = {
      demandRepo: new SqliteDemandRepository(db),
      auditRepo: new SqliteAuditRepository(db),
      ativoDadosRepo: new SqliteAtivoDadosRepository(db),
      diagnosticosRepo: new SqliteDiagnosticosQualidadeRepository(db),
      problemasRepo: new SqliteProblemasQualidadeRepository(db),
      datasetAutorizadoRepo: new SqliteDatasetAutorizadoRepository(db),
      receitaRepo: new SqliteReceitaPreparacaoRepository(db),
      modeloRepo: new SqliteModeloAnaliticoRepository(db),
      validacaoRepo: new SqliteValidacaoConciliacaoRepository(db),
      entregavelRepo: new SqliteEntregavelDemandaRepository(db),
    };

    const projectRepo = new SqliteProjectRepository(db);
    const now = new Date().toISOString();
    await projectRepo.create({
      id: projetoId,
      nome: 'Projeto Teste Workflow Validação',
      descricao: 'Teste de Validação e Conclusão',
      status: 'ATIVO',
      data_inicio: now,
      data_conclusao_prevista: null,
      data_conclusao_real: null,
      criado_em: now,
      atualizado_em: now,
    });

    await deps.demandRepo.create({
      id: demandaId,
      projeto_id: projetoId,
      titulo: 'Demanda de Fechamento Contábil e BI',
      solicitacao_bruta: 'Conciliação e Dashboard',
      contexto: 'Financeiro',
      objetivo_inicial: 'Entregar BI auditado',
      prazo_esperado: null,
      restricoes_declaradas: null,
      estado: EstadoDemanda.EM_VALIDACAO,
      estado_anterior: EstadoDemanda.EM_MODELAGEM_E_ANALISE,
      criado_em: now,
      atualizado_em: now,
      data_conclusao: null,
    });
  });

  afterAll(() => {
    try {
      sqliteDb.close();
    } catch {
      // ignore
    }
    const filesToClean = [
      testDbPath,
      `${testDbPath}-wal`,
      `${testDbPath}-shm`,
    ];
    for (const f of filesToClean) {
      if (fs.existsSync(f)) {
        try {
          fs.unlinkSync(f);
        } catch {
          // ignore
        }
      }
    }
  });

  it('deve bloquear avanço EM_VALIDACAO -> PRONTA_PARA_ENTREGA se não houver validação cadastrada (Regra V-01)', async () => {
    const res = await advanceDemandAction(demandaId, undefined, deps);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toContain('A demanda não possui nenhuma validação analítica ou conciliação cadastrada');
    }
  });

  it('deve bloquear avanço EM_VALIDACAO -> PRONTA_PARA_ENTREGA se validação obrigatória for DIVERGENTE (Regra V-02)', async () => {
    const now = new Date().toISOString();
    await deps.validacaoRepo!.create({
      id: 'val_wf_01',
      demanda_id: demandaId,
      modelo_id: null,
      metrica_id: null,
      titulo: 'Conciliação Receita Líquida',
      camada: CamadaValidacao.CONCILIACAO_CRUZADA_KPI,
      metodo_verificacao: 'Confronto analítico SQL vs Balancete',
      valor_esperado: 200000,
      valor_obtido: 195000,
      divergencia_absoluta: 5000,
      divergencia_percentual: 2.5,
      tolerancia_permitida: 0,
      resultado: ResultadoValidacao.DIVERGENTE,
      obrigatoria: true,
      criado_em: now,
      atualizado_em: now,
    });

    const res = await advanceDemandAction(demandaId, undefined, deps);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toContain('DIVERGENTE');
    }
  });

  it('deve bloquear se validações estiverem APROVADAS mas faltar entregável disponível (Regra V-03)', async () => {
    // Atualiza validação para APROVADO
    await deps.validacaoRepo!.update('val_wf_01', {
      valor_obtido: 200000,
      divergencia_absoluta: 0,
      divergencia_percentual: 0,
      resultado: ResultadoValidacao.APROVADO,
    });

    const res = await advanceDemandAction(demandaId, undefined, deps);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toContain('nenhum entregável profissional cadastrado');
    }

    // Cadastra entregável em RASCUNHO
    const now = new Date().toISOString();
    await deps.entregavelRepo!.create({
      id: 'ent_wf_01',
      demanda_id: demandaId,
      titulo: 'Dashboard Power BI Produção',
      tipo: TipoEntregavel.DASHBOARD_POWERBI,
      versao: '1.0',
      caminho_arquivo_ou_link: 'https://app.powerbi.com/groups/me/reports/123',
      obrigatorio: true,
      status: StatusEntregavel.RASCUNHO,
      aceite_status: StatusAceiteEntrega.PENDENTE,
      criado_em: now,
      atualizado_em: now,
    });

    const resRascunho = await advanceDemandAction(demandaId, undefined, deps);
    expect(resRascunho.success).toBe(false);
    if (!resRascunho.success) {
      expect(resRascunho.error).toContain('DISPONÍVEL ou HOMOLOGADO');
    }
  });

  it('deve avançar com sucesso para PRONTA_PARA_ENTREGA quando validação aprovada e entregável disponível', async () => {
    await deps.entregavelRepo!.update('ent_wf_01', {
      status: StatusEntregavel.DISPONIVEL,
    });

    const res = await advanceDemandAction(demandaId, undefined, deps);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.estado).toBe(EstadoDemanda.PRONTA_PARA_ENTREGA);
    }
  });

  it('deve bloquear avanço PRONTA_PARA_ENTREGA -> CONCLUIDA se entregável obrigatório estiver com aceite PENDENTE (Regra V-04)', async () => {
    const res = await advanceDemandAction(demandaId, undefined, deps);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toContain('aceite PENDENTE');
    }
  });

  it('AJUSTE VINCULANTE: com 2 obrigatórios, se 1 aceito e 1 rejeitado/pendente, DEVE BLOQUEAR a conclusão', async () => {
    const now = new Date().toISOString();
    // Aceita o primeiro
    await deps.entregavelRepo!.update('ent_wf_01', {
      aceite_status: StatusAceiteEntrega.ACEITO,
      aceite_por: 'Gestor Financeiro',
      aceite_em: now,
    });

    // Cria segundo entregável obrigatório
    await deps.entregavelRepo!.create({
      id: 'ent_wf_02',
      demanda_id: demandaId,
      titulo: 'Dicionário de Métricas e Linhagem',
      tipo: TipoEntregavel.DOCUMENTO_TECNICO,
      versao: '1.0',
      caminho_arquivo_ou_link: '/docs/metricas.md',
      obrigatorio: true,
      status: StatusEntregavel.DISPONIVEL,
      aceite_status: StatusAceiteEntrega.REJEITADO,
      aceite_justificativa: 'Faltam regras de partição contábil',
      criado_em: now,
      atualizado_em: now,
    });

    const res = await advanceDemandAction(demandaId, undefined, deps);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toContain('REJEITADO');
    }
  });

  it('deve avançar com sucesso para CONCLUIDA quando TODOS os entregáveis obrigatórios estiverem ACEITOS formalmente', async () => {
    const now = new Date().toISOString();
    await deps.entregavelRepo!.update('ent_wf_02', {
      aceite_status: StatusAceiteEntrega.ACEITO,
      aceite_por: 'Gerente de Dados',
      aceite_em: now,
      aceite_justificativa: 'Dicionário complementado e aprovado',
      status: StatusEntregavel.HOMOLOGADO,
    });

    const res = await advanceDemandAction(demandaId, 'Conclusão formal autorizada pelo stakeholder', deps);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.estado).toBe(EstadoDemanda.CONCLUIDA);
    }

    // Verifica trilha de auditoria
    const timeline = await deps.auditRepo.findByDemandaId(demandaId);
    expect(timeline.length).toBeGreaterThan(0);
    expect(timeline.some((t) => t.tipo_evento === 'TRANSICAO_ESTADO')).toBe(true);
  });
});
