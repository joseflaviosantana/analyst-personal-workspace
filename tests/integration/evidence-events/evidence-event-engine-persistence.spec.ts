import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import fs from 'fs';
import * as schema from '@/infrastructure/db/schema';
import { SqliteProjectRepository } from '@/infrastructure/db/repositories/project-repository';
import { SqliteDemandRepository } from '@/infrastructure/db/repositories/demand-repository';
import { SqliteEvidenciaAnaliticaRepository } from '@/infrastructure/db/repositories/sqlite-evidencia-analitica-repository';
import { SqliteEventoAnaliticoLogRepository } from '@/infrastructure/db/repositories/sqlite-evento-analitico-log-repository';
import { EvidenceEventEngine } from '@/core/domain/evidence-events/evidence-event-engine';
import { QualidadeRegraStrategy } from '@/core/domain/evidence-events/default-strategies/qualidade-regra-strategy';
import { DecisaoMetodologicaStrategy } from '@/core/domain/evidence-events/default-strategies/decisao-metodologica-strategy';
import { EventoTecnicoIgnoradoStrategy } from '@/core/domain/evidence-events/default-strategies/evento-tecnico-ignorado-strategy';
import { ProcessarEventoAnaliticoUseCase } from '@/core/use-cases/evidence/processar-evento-analitico.use-case';
import { RegistrarEvidenciaUseCase } from '@/core/use-cases/evidence/registrar-evidencia.use-case';
import { ConsultarEvidenciasDemandaUseCase } from '@/core/use-cases/evidence/consultar-evidencias-demanda.use-case';
import { ConsultarLogEventosDemandaUseCase } from '@/core/use-cases/evidence/consultar-log-eventos-demanda.use-case';
import { EventoAnalitico } from '@/core/domain/evidence-events/event-types';
import { EtapaOrigemEvidencia } from '@/core/domain/enums/etapa-origem-evidencia';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { StatusValidacaoEvidencia } from '@/core/domain/enums/status-validacao-evidencia';

describe('Integration Tests: Event Engine, Idempotência e Persistência SQLite (Subgate 3.5B.1)', () => {
  const testDbDir = path.join(process.cwd(), '.workspace', 'data');
  const testDbPath = path.join(testDbDir, 'test_event_engine_subgate35b1.db');
  let sqliteDb: Database.Database;
  let db: ReturnType<typeof drizzle<typeof schema>>;

  let projectRepo: SqliteProjectRepository;
  let demandRepo: SqliteDemandRepository;
  let evidenciaRepo: SqliteEvidenciaAnaliticaRepository;
  let eventLogRepo: SqliteEventoAnaliticoLogRepository;

  let eventEngine: EvidenceEventEngine;
  let registrarEvidenciaUseCase: RegistrarEvidenciaUseCase;
  let consultarEvidenciasUseCase: ConsultarEvidenciasDemandaUseCase;
  let processarEventoUseCase: ProcessarEventoAnaliticoUseCase;
  let consultarLogEventosUseCase: ConsultarLogEventosDemandaUseCase;

  const projetoId = 'prj_event_test_1';
  const demandaIdA = 'dem_event_test_A';
  const demandaIdB = 'dem_event_test_B';

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

    projectRepo = new SqliteProjectRepository(db);
    demandRepo = new SqliteDemandRepository(db);
    evidenciaRepo = new SqliteEvidenciaAnaliticaRepository(db);
    eventLogRepo = new SqliteEventoAnaliticoLogRepository(db);

    eventEngine = new EvidenceEventEngine([
      new QualidadeRegraStrategy(),
      new DecisaoMetodologicaStrategy(),
      new EventoTecnicoIgnoradoStrategy(),
    ]);

    registrarEvidenciaUseCase = new RegistrarEvidenciaUseCase(evidenciaRepo, demandRepo);
    consultarEvidenciasUseCase = new ConsultarEvidenciasDemandaUseCase(evidenciaRepo, demandRepo);
    processarEventoUseCase = new ProcessarEventoAnaliticoUseCase(
      eventEngine,
      eventLogRepo,
      registrarEvidenciaUseCase
    );
    consultarLogEventosUseCase = new ConsultarLogEventosDemandaUseCase(eventLogRepo);

    const now = new Date().toISOString();

    // Seed de Projeto
    await projectRepo.create({
      id: projetoId,
      nome: 'Projeto Event Engine Test',
      descricao: null,
      status: 'ATIVO',
      data_inicio: now,
      data_conclusao_prevista: null,
      data_conclusao_real: null,
      criado_em: now,
      atualizado_em: now,
    });

    // Seed de Demandas A e B
    await demandRepo.create({
      id: demandaIdA,
      projeto_id: projetoId,
      titulo: 'Demanda Eventos A',
      solicitacao_bruta: 'Processar eventos da Demanda A',
      contexto: null,
      objetivo_inicial: null,
      prazo_esperado: null,
      restricoes_declaradas: null,
      estado: EstadoDemanda.EM_MODELAGEM_E_ANALISE,
      estado_anterior: null,
      criado_em: now,
      atualizado_em: now,
      data_conclusao: null,
    });

    await demandRepo.create({
      id: demandaIdB,
      projeto_id: projetoId,
      titulo: 'Demanda Eventos B',
      solicitacao_bruta: 'Processar eventos da Demanda B',
      contexto: null,
      objetivo_inicial: null,
      prazo_esperado: null,
      restricoes_declaradas: null,
      estado: EstadoDemanda.EM_MODELAGEM_E_ANALISE,
      estado_anterior: null,
      criado_em: now,
      atualizado_em: now,
      data_conclusao: null,
    });
  });

  afterAll(() => {
    try {
      if (sqliteDb) {
        sqliteDb.close();
      }
      if (fs.existsSync(testDbPath)) {
        fs.unlinkSync(testDbPath);
      }
    } catch {
      // Ignora erro se arquivo de teste estiver retido
    }
  });

  it('1 e 15. mesmo evento processado duas vezes NÃO duplica evidência (Idempotência e Reprocessamento Seguro)', async () => {
    const eventoQualidade: EventoAnalitico = {
      id_evento: 'evt_idemp_001',
      demanda_id: demandaIdA,
      projeto_id: projetoId,
      etapa_origem: EtapaOrigemEvidencia.QUALIDADE,
      categoria: 'QUALIDADE',
      tipo_evento: 'QUALIDADE_REGRA_EXECUTADA',
      ocorrido_em: '2026-09-30T10:00:00Z',
      executor: 'SISTEMA_DETERMINISTICO',
      payload: {
        regraNome: 'Unicidade de Pedidos',
        ativoNome: 'Fato_Vendas',
        totalLinhasAvaliadas: 25000,
        totalNaoConformidades: 0,
        taxaConformidade: 100,
      },
      correlation_id: 'corr-flow-1',
      causation_id: 'caus-scan-1',
      versao_contrato: '1.0',
    };

    // 1ª Execução
    const resultado1 = await processarEventoUseCase.execute(eventoQualidade);
    expect(resultado1.status_processamento).toBe('REGISTRADO');
    expect(resultado1.ja_processado).toBe(false);
    expect(resultado1.evidencia_gerada_id).toBeDefined();

    // 2ª Execução (Reprocessamento com o mesmo id_evento)
    const resultado2 = await processarEventoUseCase.execute(eventoQualidade);
    expect(resultado2.status_processamento).toBe('DUPLICADO');
    expect(resultado2.ja_processado).toBe(true);
    expect(resultado2.evidencia_gerada_id).toBe(resultado1.evidencia_gerada_id);

    // Auditoria no SQLite: deve existir exatamente 1 evidência no Evidence Core
    const evidencias = await evidenciaRepo.findByDemandaId(demandaIdA);
    expect(evidencias).toHaveLength(1);
    expect(evidencias[0].id).toBe(resultado1.evidencia_gerada_id);
  });

  it('6, 7 e 8. proveniência e correlações são preservadas nos metadados da evidência no SQLite', async () => {
    const evidencias = await evidenciaRepo.findByDemandaId(demandaIdA);
    const ev = evidencias[0];

    expect(ev.metadados?.evento_origem_id).toBe('evt_idemp_001');
    expect(ev.metadados?.correlation_id).toBe('corr-flow-1');
    expect(ev.metadados?.causation_id).toBe('caus-scan-1');
    expect(ev.metadados?.politica_captura_aplicada).toBe('REGISTRAR_AUTOMATICAMENTE');
    expect(ev.metodo_captura).toBe('AUTOMATICA');
  });

  it('3. evento interpretativo gera evidência com status AGUARDANDO_REVISAO', async () => {
    const eventoDecisao: EventoAnalitico = {
      id_evento: 'evt_decisao_002',
      demanda_id: demandaIdA,
      projeto_id: projetoId,
      etapa_origem: EtapaOrigemEvidencia.MODELAGEM,
      categoria: 'MODELAGEM',
      tipo_evento: 'DECISAO_METODOLOGICA_REGISTRADA',
      ocorrido_em: '2026-09-30T10:10:00Z',
      executor: 'ANALISTA',
      payload: {
        tituloDecisao: 'Definição de Granularidade Diária na Fato',
        contextoProblema: 'Transações chegam com timestamp de segundo, mas BI opera por dia',
        escolhaAdotada: 'Trunk de data para 00:00:00 na dimensão Calendário',
        justificativaMetodologica: 'Reduzir cardinalidade e otimizar compressão colunar do Power BI',
      },
      versao_contrato: '1.0',
    };

    const res = await processarEventoUseCase.execute(eventoDecisao);
    expect(res.status_processamento).toBe('AGUARDANDO_REVISAO');

    const ev = await evidenciaRepo.findById(res.evidencia_gerada_id!);
    expect(ev?.status_validacao).toBe(StatusValidacaoEvidencia.AGUARDANDO_REVISAO);
    expect(ev?.metodo_captura).toBe('ASSISTIDA');
  });

  it('4. evento técnico é registrado no Event Log com status IGNORADO sem poluir o Evidence Core', async () => {
    const eventoTecnico: EventoAnalitico = {
      id_evento: 'evt_tecnico_003',
      demanda_id: demandaIdA,
      etapa_origem: EtapaOrigemEvidencia.GERAL,
      categoria: 'SISTEMA',
      tipo_evento: 'SISTEMA_LOG_TELEMETRIA',
      ocorrido_em: '2026-09-30T10:15:00Z',
      executor: 'SISTEMA',
      payload: { cpu: 14, ram_mb: 256 },
      versao_contrato: '1.0',
    };

    const res = await processarEventoUseCase.execute(eventoTecnico);
    expect(res.status_processamento).toBe('IGNORADO');
    expect(res.evidencia_gerada_id).toBeNull();

    // Log registrado no SQLite
    const log = await eventLogRepo.findByIdEvento('evt_tecnico_003');
    expect(log).not.toBeNull();
    expect(log?.status_processamento).toBe('IGNORADO');
    expect(log?.evidencia_gerada_id).toBeNull();

    // Contagem no Evidence Core permanece inalterada
    const evidenciasA = await evidenciaRepo.findByDemandaId(demandaIdA);
    expect(evidenciasA).toHaveLength(2); // Somente as 2 anteriores
  });

  it('10. isolamento estrito entre demandas (Eventos e Log da Demanda A vs. Demanda B)', async () => {
    const eventoDemandaB: EventoAnalitico = {
      id_evento: 'evt_demanda_b_001',
      demanda_id: demandaIdB,
      projeto_id: projetoId,
      etapa_origem: EtapaOrigemEvidencia.QUALIDADE,
      categoria: 'QUALIDADE',
      tipo_evento: 'QUALIDADE_REGRA_EXECUTADA',
      ocorrido_em: '2026-09-30T10:20:00Z',
      executor: 'SISTEMA',
      payload: {
        regraNome: 'Regra Exclusiva da Demanda B',
        ativoNome: 'Tabela_B',
        totalLinhasAvaliadas: 100,
        totalNaoConformidades: 0,
        taxaConformidade: 100,
      },
      versao_contrato: '1.0',
    };

    await processarEventoUseCase.execute(eventoDemandaB);

    const logA = await consultarLogEventosUseCase.execute(demandaIdA);
    const logB = await consultarLogEventosUseCase.execute(demandaIdB);

    expect(logA.length).toBe(3); // evt_idemp_001, evt_decisao_002, evt_tecnico_003
    expect(logB.length).toBe(1); // evt_demanda_b_001

    const idsLogA = logA.map((l) => l.id_evento);
    expect(idsLogA).not.toContain('evt_demanda_b_001');

    const evidenciasB = await evidenciaRepo.findByDemandaId(demandaIdB);
    expect(evidenciasB).toHaveLength(1);
    expect(evidenciasB[0].titulo).toContain('Regra Exclusiva da Demanda B');
  });

  it('16. Evidence Core existente permanece 100% funcional e operacional', async () => {
    const resA = await consultarEvidenciasUseCase.execute({ demanda_id: demandaIdA });
    expect(resA.evidencias).toHaveLength(2);
    expect(resA.metricas.total).toBe(2);
    expect(resA.metricas.por_status[StatusValidacaoEvidencia.CAPTURADA]).toBe(1);
    expect(resA.metricas.por_status[StatusValidacaoEvidencia.AGUARDANDO_REVISAO]).toBe(1);
  });
});
