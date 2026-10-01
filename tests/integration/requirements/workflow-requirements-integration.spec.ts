import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import fs from 'fs';
import * as schema from '@/infrastructure/db/schema';
import { SqliteProjectRepository } from '@/infrastructure/db/repositories/project-repository';
import { SqliteDemandRepository } from '@/infrastructure/db/repositories/demand-repository';
import { SqliteAuditRepository } from '@/infrastructure/db/repositories/audit-repository';
import { SqliteRequisitoDemandaRepository } from '@/infrastructure/db/repositories/sqlite-requisito-repository';
import { SqlitePerguntaClarificacaoRepository } from '@/infrastructure/db/repositories/sqlite-pergunta-clarificacao-repository';
import { TransitionDemandStateUseCase } from '@/core/use-cases/workflow';
import { AvaliarProntidaoRequisitosUseCase } from '@/core/use-cases/requirements';
import { WorkflowEngine } from '@/core/domain/rules/workflow-engine';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { StatusPerguntaClarificacao } from '@/core/domain/enums/status-pergunta-clarificacao';
import { CategoriaRequisito } from '@/core/domain/enums/categoria-requisito';

describe('Integration Tests: Workflow & Gate de Requisitos (EM_CLARIFICACAO -> DADOS_RECEBIDOS)', () => {
  const testDbDir = path.join(process.cwd(), '.workspace', 'data');
  const testDbPath = path.join(testDbDir, 'test_workflow_requirements_gate_38.db');
  let sqliteDb: Database.Database;
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let projectRepo: SqliteProjectRepository;
  let demandRepo: SqliteDemandRepository;
  let auditRepo: SqliteAuditRepository;
  let requisitoRepo: SqliteRequisitoDemandaRepository;
  let perguntaRepo: SqlitePerguntaClarificacaoRepository;
  let transitionUseCase: TransitionDemandStateUseCase;
  let avaliarProntidaoUseCase: AvaliarProntidaoRequisitosUseCase;

  const projetoId = 'prj_wf_req_1';
  const demandaId = 'dem_wf_req_1';

  beforeAll(async () => {
    if (!fs.existsSync(testDbDir)) {
      fs.mkdirSync(testDbDir, { recursive: true });
    }
    if (fs.existsSync(testDbPath)) {
      try {
        fs.unlinkSync(testDbPath);
      } catch {}
    }

    sqliteDb = new Database(testDbPath);
    sqliteDb.pragma('foreign_keys = ON');
    sqliteDb.pragma('journal_mode = WAL');
    sqliteDb.pragma('synchronous = NORMAL');
    sqliteDb.pragma('busy_timeout = 5000');

    db = drizzle(sqliteDb, { schema });
    const migrationsFolder = path.join(process.cwd(), 'drizzle');
    migrate(db, { migrationsFolder });

    projectRepo = new SqliteProjectRepository(db);
    demandRepo = new SqliteDemandRepository(db);
    auditRepo = new SqliteAuditRepository(db);
    requisitoRepo = new SqliteRequisitoDemandaRepository(db);
    perguntaRepo = new SqlitePerguntaClarificacaoRepository(db);

    transitionUseCase = new TransitionDemandStateUseCase(demandRepo, auditRepo);
    avaliarProntidaoUseCase = new AvaliarProntidaoRequisitosUseCase(
      demandRepo,
      requisitoRepo,
      perguntaRepo
    );

    const now = new Date().toISOString();
    await projectRepo.create({
      id: projetoId,
      nome: 'Projeto Workflow Gate Requisitos',
      descricao: 'Validação factual do gate de Requisitos',
      status: 'ATIVO',
      data_inicio: now,
      data_conclusao_prevista: null,
      data_conclusao_real: null,
      criado_em: now,
      atualizado_em: now,
    });

    await demandRepo.create({
      id: demandaId,
      projeto_id: projetoId,
      titulo: 'Demanda Gate Requisitos',
      solicitacao_bruta: 'Original verbatim da demanda para teste de gate.',
      contexto: 'Contexto de vendas',
      objetivo_inicial: 'Análise de conversão do funil de vendas',
      prazo_esperado: null,
      restricoes_declaradas: null,
      estado: EstadoDemanda.EM_CLARIFICACAO,
      data_conclusao: null,
      criado_em: now,
      atualizado_em: now,
    });
  });

  afterAll(() => {
    try {
      if (sqliteDb) sqliteDb.close();
      if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    } catch {}
  });

  it('deve bloquear a transição se houver pergunta bloqueante sem resposta', async () => {
    const now = new Date().toISOString();
    await perguntaRepo.create({
      id: 'perg_bloq_1',
      demanda_id: demandaId,
      requisito_id: null,
      pergunta: 'Como é calculada a perda de leads no topo do funil?',
      motivacao: 'Alinhar regra de conversão',
      bloqueante: true,
      status: StatusPerguntaClarificacao.ENVIADA,
      enviada_em: now,
      resposta: null,
      respondido_por: null,
      respondida_em: null,
      impacto_decisao: null,
      criado_em: now,
      atualizado_em: now,
    });

    const prontidao = await avaliarProntidaoUseCase.execute(demandaId);
    expect(prontidao.bloqueado).toBe(true);

    const verificacaoEngine = WorkflowEngine.podeTransitar(
      EstadoDemanda.EM_CLARIFICACAO,
      EstadoDemanda.DADOS_RECEBIDOS,
      { prontidaoRequisitos: prontidao }
    );

    expect(verificacaoEngine.valida).toBe(false);
    expect(verificacaoEngine.mensagem).toContain('Transição bloqueada na etapa de Requisitos');

    // Execução pelo use case deve falhar
    await expect(
      transitionUseCase.execute({
        demandaId,
        novoEstado: EstadoDemanda.DADOS_RECEBIDOS,
        contextoExtra: { prontidaoRequisitos: prontidao },
      })
    ).rejects.toThrow(/Transição bloqueada na etapa de Requisitos/);
  });

  it('deve exigir justificativa formal (>= 15 caracteres) quando houver ressalvas', async () => {
    // Sanar a pergunta bloqueante com resposta
    await perguntaRepo.update('perg_bloq_1', {
      status: StatusPerguntaClarificacao.RESPONDIDA,
      resposta: 'Considerar lead perdido após 14 dias sem contato.',
      respondido_por: 'Head Comercial',
      respondida_em: new Date().toISOString(),
      impacto_decisao: 'Filtro de 14 dias no pipeline',
    });

    // Demanda não possui periodo_analise e nem granularidade delimitados ainda
    const prontidao = await avaliarProntidaoUseCase.execute(demandaId);
    expect(prontidao.bloqueado).toBe(false);
    expect(prontidao.exigeJustificativaRessalva).toBe(true);

    // Tentativa de transição sem justificativa suficiente (< 15 chars)
    const engineSemJust = WorkflowEngine.podeTransitar(
      EstadoDemanda.EM_CLARIFICACAO,
      EstadoDemanda.DADOS_RECEBIDOS,
      {
        prontidaoRequisitos: prontidao,
        justificativa: 'Curta demais',
      }
    );
    expect(engineSemJust.valida).toBe(false);
    expect(engineSemJust.mensagem).toContain('mínimo 15 caracteres');

    // Com justificativa formal adequada (>= 15 chars)
    const justificativaValida = 'Avanço acordado com a gestão comercial; período será definido com a extração dos dados.';
    const engineComJust = WorkflowEngine.podeTransitar(
      EstadoDemanda.EM_CLARIFICACAO,
      EstadoDemanda.DADOS_RECEBIDOS,
      {
        prontidaoRequisitos: prontidao,
        justificativa: justificativaValida,
      }
    );
    expect(engineComJust.valida).toBe(true);

    // Efetiva a transição com sucesso
    const transicionada = await transitionUseCase.execute({
      demandaId,
      novoEstado: EstadoDemanda.DADOS_RECEBIDOS,
      justificativa: justificativaValida,
      contextoExtra: { prontidaoRequisitos: prontidao },
    });

    expect(transicionada.estado).toBe(EstadoDemanda.DADOS_RECEBIDOS);
    const auditLogs = await auditRepo.findByDemandaId(demandaId);
    const transicaoLog = auditLogs.find((l) => l.tipo_evento === 'TRANSICAO_ESTADO');
    expect(transicaoLog).toBeDefined();
    expect(transicaoLog?.dados_anteriores).toContain(EstadoDemanda.EM_CLARIFICACAO);
    expect(transicaoLog?.dados_novos).toContain(EstadoDemanda.DADOS_RECEBIDOS);
  });
});
