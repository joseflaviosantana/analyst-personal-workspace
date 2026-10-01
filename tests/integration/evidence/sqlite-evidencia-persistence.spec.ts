import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { eq } from 'drizzle-orm';
import path from 'path';
import fs from 'fs';
import * as schema from '@/infrastructure/db/schema';
import { SqliteProjectRepository } from '@/infrastructure/db/repositories/project-repository';
import { SqliteDemandRepository } from '@/infrastructure/db/repositories/demand-repository';
import { SqliteEvidenciaAnaliticaRepository } from '@/infrastructure/db/repositories/sqlite-evidencia-analitica-repository';
import { TipoEvidenciaAnalitica } from '@/core/domain/enums/tipo-evidencia-analitica';
import { EtapaOrigemEvidencia } from '@/core/domain/enums/etapa-origem-evidencia';
import { MetodoCapturaEvidencia } from '@/core/domain/enums/metodo-captura-evidencia';
import { StatusValidacaoEvidencia } from '@/core/domain/enums/status-validacao-evidencia';
import { ClassificacaoExposicaoEvidencia } from '@/core/domain/enums/classificacao-exposicao-evidencia';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { EvidenciaAnalitica } from '@/core/domain/entities/evidencia-analitica';

describe('Integration Tests: Persistência SQLite de Evidências Analíticas (Subgate 3.5A)', () => {
  const testDbDir = path.join(process.cwd(), '.workspace', 'data');
  const testDbPath = path.join(testDbDir, 'test_evidence_persistence_subgate35a.db');
  let sqliteDb: Database.Database;
  let db: ReturnType<typeof drizzle<typeof schema>>;

  let projectRepo: SqliteProjectRepository;
  let demandRepo: SqliteDemandRepository;
  let evidenciaRepo: SqliteEvidenciaAnaliticaRepository;

  const projetoId = 'prj_evi_test_1';
  const demandaIdA = 'dem_evi_test_A';
  const demandaIdB = 'dem_evi_test_B';

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

    const now = new Date().toISOString();

    // 1. Seed de Projeto
    await projectRepo.create({
      id: projetoId,
      nome: 'Projeto de Governança e Rastreabilidade',
      descricao: null,
      status: 'ATIVO',
      data_inicio: now,
      data_conclusao_prevista: null,
      data_conclusao_real: null,
      criado_em: now,
      atualizado_em: now,
    });

    // 2. Seed de Demandas A e B
    await demandRepo.create({
      id: demandaIdA,
      projeto_id: projetoId,
      titulo: 'Demanda de Evidências A',
      solicitacao_bruta: 'Auditoria de dados para Demanda A',
      contexto: null,
      objetivo_inicial: null,
      prazo_esperado: null,
      restricoes_declaradas: null,
      estado: EstadoDemanda.NOVA,
      estado_anterior: null,
      criado_em: now,
      atualizado_em: now,
      data_conclusao: null,
    });

    await demandRepo.create({
      id: demandaIdB,
      projeto_id: projetoId,
      titulo: 'Demanda de Evidências B',
      solicitacao_bruta: 'Auditoria de dados para Demanda B',
      contexto: null,
      objetivo_inicial: null,
      prazo_esperado: null,
      restricoes_declaradas: null,
      estado: EstadoDemanda.NOVA,
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
      // Ignora erro de cleanup se arquivo ainda estiver em uso
    }
  });

  it('1. deve persistir e recuperar uma evidência analítica com metadados JSON', async () => {
    const now = new Date().toISOString();
    const novaEvidencia: EvidenciaAnalitica = {
      id: 'evi_001',
      demanda_id: demandaIdA,
      projeto_id: projetoId,
      tipo: TipoEvidenciaAnalitica.QUALIDADE,
      etapa_origem: EtapaOrigemEvidencia.QUALIDADE,
      artefato_origem_tipo: 'DIAGNOSTICO_QUALIDADE',
      artefato_origem_id: 'diag_123',
      titulo: 'Remoção de Duplicidades na Tabela de Vendas',
      descricao: 'Identificação e expurgo de 45 registros duplicados por hash',
      fato_observado: '45 chaves duplicadas detectadas no carregamento.',
      estado_anterior: '10.045 registros brutos',
      acao_registrada: 'Execução de deduplicação determinística.',
      estado_posterior: '10.000 registros únicos',
      resultado_mensuravel: 'Unicidade = 100%, 0 duplicatas.',
      inferencia_recomendacao: 'Alinhar pipeline com a equipe de engenharia de dados.',
      decisao_humana: null,
      metodo_captura: MetodoCapturaEvidencia.AUTOMATICA,
      status_validacao: StatusValidacaoEvidencia.CAPTURADA,
      classificacao_exposicao: ClassificacaoExposicaoEvidencia.INTERNA,
      elegibilidade_portfolio: false,
      executor: 'SISTEMA_DETERMINISTICO',
      metadados: { hash_checksum: 'a1b2c3d4', linhas_afetadas: 45 },
      criado_em: now,
      atualizado_em: now,
    };

    await evidenciaRepo.create(novaEvidencia);

    const recuperada = await evidenciaRepo.findById('evi_001');
    expect(recuperada).not.toBeNull();
    expect(recuperada?.id).toBe('evi_001');
    expect(recuperada?.titulo).toBe('Remoção de Duplicidades na Tabela de Vendas');
    expect(recuperada?.metodo_captura).toBe(MetodoCapturaEvidencia.AUTOMATICA);
    expect(recuperada?.elegibilidade_portfolio).toBe(false);
    expect(recuperada?.metadados).toEqual({ hash_checksum: 'a1b2c3d4', linhas_afetadas: 45 });
  });

  it('2. deve atualizar status de validação, decisão humana e classificação de exposição', async () => {
    const ev = await evidenciaRepo.findById('evi_001');
    expect(ev).not.toBeNull();

    const now = new Date().toISOString();
    const atualizada: EvidenciaAnalitica = {
      ...ev!,
      status_validacao: StatusValidacaoEvidencia.CONFIRMADA,
      decisao_humana: `[${now}] (ANALISTA): Evidência aprovada e verificada em produção.`,
      classificacao_exposicao: ClassificacaoExposicaoEvidencia.PUBLICA,
      elegibilidade_portfolio: true,
      atualizado_em: now,
    };

    await evidenciaRepo.update(atualizada);

    const reconsultada = await evidenciaRepo.findById('evi_001');
    expect(reconsultada?.status_validacao).toBe(StatusValidacaoEvidencia.CONFIRMADA);
    expect(reconsultada?.decisao_humana).toContain('Evidência aprovada');
    expect(reconsultada?.classificacao_exposicao).toBe(ClassificacaoExposicaoEvidencia.PUBLICA);
    expect(reconsultada?.elegibilidade_portfolio).toBe(true);
  });

  it('3. deve consultar evidências da demanda com filtros de status e classificação', async () => {
    // Insere uma segunda evidência na Demanda A
    const now = new Date().toISOString();
    await evidenciaRepo.create({
      id: 'evi_002',
      demanda_id: demandaIdA,
      projeto_id: projetoId,
      tipo: TipoEvidenciaAnalitica.DAX,
      etapa_origem: EtapaOrigemEvidencia.POWERBI_DASHBOARD,
      titulo: 'Medida DAX de Ticket Médio',
      descricao: 'Cálculo de receita sobre pedidos',
      fato_observado: 'Expressão [Receita] / [Pedidos].',
      acao_registrada: 'Criação de medida com DIVIDE seguro.',
      metodo_captura: MetodoCapturaEvidencia.MANUAL,
      status_validacao: StatusValidacaoEvidencia.AGUARDANDO_REVISAO,
      classificacao_exposicao: ClassificacaoExposicaoEvidencia.INTERNA,
      elegibilidade_portfolio: false,
      executor: 'ANALISTA',
      criado_em: now,
      atualizado_em: now,
    });

    const todas = await evidenciaRepo.findByDemandaId(demandaIdA);
    expect(todas.length).toBe(2);

    const confirmadas = await evidenciaRepo.findByDemandaId(demandaIdA, {
      status_validacao: StatusValidacaoEvidencia.CONFIRMADA,
    });
    expect(confirmadas.length).toBe(1);
    expect(confirmadas[0].id).toBe('evi_001');

    const dax = await evidenciaRepo.findByDemandaId(demandaIdA, {
      tipo: TipoEvidenciaAnalitica.DAX,
    });
    expect(dax.length).toBe(1);
    expect(dax[0].id).toBe('evi_002');
  });

  it('4. deve assegurar isolamento estrito entre demandas (Demanda A vs. Demanda B)', async () => {
    const now = new Date().toISOString();
    // Insere evidência na Demanda B
    await evidenciaRepo.create({
      id: 'evi_demanda_b_1',
      demanda_id: demandaIdB,
      projeto_id: projetoId,
      tipo: TipoEvidenciaAnalitica.DADOS,
      etapa_origem: EtapaOrigemEvidencia.DADOS,
      titulo: 'Evidência Exclusiva da Demanda B',
      descricao: 'Descrição B',
      fato_observado: 'Fato B',
      acao_registrada: 'Ação B',
      metodo_captura: MetodoCapturaEvidencia.MANUAL,
      status_validacao: StatusValidacaoEvidencia.CAPTURADA,
      classificacao_exposicao: ClassificacaoExposicaoEvidencia.CONFIDENCIAL,
      elegibilidade_portfolio: false,
      executor: 'ANALISTA',
      criado_em: now,
      atualizado_em: now,
    });

    const evidenciasA = await evidenciaRepo.findByDemandaId(demandaIdA);
    const evidenciasB = await evidenciaRepo.findByDemandaId(demandaIdB);

    expect(evidenciasA.length).toBe(2);
    expect(evidenciasB.length).toBe(1);
    expect(evidenciasB[0].id).toBe('evi_demanda_b_1');

    // Nenhum ID de A deve constar em B
    const idsB = evidenciasB.map((e) => e.id);
    for (const evA of evidenciasA) {
      expect(idsB).not.toContain(evA.id);
    }
  });

  it('5. deve suportar deleção em cascata (ao deletar a demanda, suas evidências são excluídas)', async () => {
    // Demanda B possui evi_demanda_b_1
    const eviB = await evidenciaRepo.findById('evi_demanda_b_1');
    expect(eviB).not.toBeNull();

    // Deleta Demanda B diretamente no banco para validar o cascade no SQLite
    db.delete(schema.demandas).where(eq(schema.demandas.id, demandaIdB)).run();

    const eviBPosDelete = await evidenciaRepo.findById('evi_demanda_b_1');
    expect(eviBPosDelete).toBeNull(); // Exclusão em cascata confirmada!
  });
});
