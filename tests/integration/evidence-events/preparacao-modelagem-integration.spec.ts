import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import fs from 'fs';
import * as schema from '@/infrastructure/db/schema';

import { SqliteProjectRepository } from '@/infrastructure/db/repositories/project-repository';
import { SqliteDemandRepository } from '@/infrastructure/db/repositories/demand-repository';
import { SqliteAtivoDadosRepository } from '@/infrastructure/db/repositories/ativo-dados-repository';
import { SqliteReceitaPreparacaoRepository } from '@/infrastructure/db/repositories/sqlite-receita-preparacao-repository';
import { SqliteEtapaTransformacaoRepository } from '@/infrastructure/db/repositories/sqlite-etapa-transformacao-repository';
import { SqliteLinhagemAtivosRepository } from '@/infrastructure/db/repositories/sqlite-linhagem-ativos-repository';
import { SqliteDatasetAutorizadoRepository } from '@/infrastructure/db/repositories/sqlite-dataset-autorizado-repository';
import { SqliteDiagnosticosQualidadeRepository } from '@/infrastructure/db/repositories/sqlite-diagnosticos-qualidade-repository';
import { SqliteProblemasQualidadeRepository } from '@/infrastructure/db/repositories/sqlite-problemas-qualidade-repository';
import { SqliteModeloAnaliticoRepository } from '@/infrastructure/db/repositories/sqlite-modelo-analitico-repository';
import { SqliteEntidadeAnaliticaRepository } from '@/infrastructure/db/repositories/sqlite-entidade-analitica-repository';
import { SqliteAtributoAnaliticoRepository } from '@/infrastructure/db/repositories/sqlite-atributo-analitico-repository';
import { SqliteRelacionamentoAnaliticoRepository } from '@/infrastructure/db/repositories/sqlite-relacionamento-analitico-repository';
import { SqliteMetricaAnaliticaRepository } from '@/infrastructure/db/repositories/sqlite-metrica-analitica-repository';
import { SqliteAuditRepository } from '@/infrastructure/db/repositories/audit-repository';
import { SqliteEvidenciaAnaliticaRepository } from '@/infrastructure/db/repositories/sqlite-evidencia-analitica-repository';
import { SqliteEventoAnaliticoLogRepository } from '@/infrastructure/db/repositories/sqlite-evento-analitico-log-repository';

import { criarEvidenceEventEnginePadrao } from '@/core/domain/evidence-events/engine-factory';
import { ProcessarEventoAnaliticoUseCase } from '@/core/use-cases/evidence/processar-evento-analitico.use-case';
import { RegistrarEvidenciaUseCase } from '@/core/use-cases/evidence/registrar-evidencia.use-case';
import { ConsultarEvidenciasDemandaUseCase } from '@/core/use-cases/evidence/consultar-evidencias-demanda.use-case';

import { EventoAnalitico } from '@/core/domain/evidence-events/event-types';
import { EtapaOrigemEvidencia } from '@/core/domain/enums/etapa-origem-evidencia';
import { TipoEvidenciaAnalitica } from '@/core/domain/enums/tipo-evidencia-analitica';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { StatusValidacaoEvidencia } from '@/core/domain/enums/status-validacao-evidencia';

describe('Integration Tests: Integração do Evidence Event Engine com Preparação + Modelagem (Subgate 3.5B.3)', () => {
  const testDbDir = path.join(process.cwd(), '.workspace', 'data');
  const testDbPath = path.join(testDbDir, 'test_subgate_35b3_prep_modelagem.db');
  let sqliteDb: Database.Database;
  let db: ReturnType<typeof drizzle<typeof schema>>;

  let projectRepo: SqliteProjectRepository;
  let demandRepo: SqliteDemandRepository;
  let assetRepo: SqliteAtivoDadosRepository;
  let receitaRepo: SqliteReceitaPreparacaoRepository;
  let etapaRepo: SqliteEtapaTransformacaoRepository;
  let linhagemRepo: SqliteLinhagemAtivosRepository;
  let datasetAutorizadoRepo: SqliteDatasetAutorizadoRepository;
  let diagRepo: SqliteDiagnosticosQualidadeRepository;
  let probRepo: SqliteProblemasQualidadeRepository;
  let modeloRepo: SqliteModeloAnaliticoRepository;
  let entidadeRepo: SqliteEntidadeAnaliticaRepository;
  let atributoRepo: SqliteAtributoAnaliticoRepository;
  let relacionamentoRepo: SqliteRelacionamentoAnaliticoRepository;
  let metricaRepo: SqliteMetricaAnaliticaRepository;
  let auditRepo: SqliteAuditRepository;
  let evidenciaRepo: SqliteEvidenciaAnaliticaRepository;
  let eventLogRepo: SqliteEventoAnaliticoLogRepository;

  let eventEngine: ReturnType<typeof criarEvidenceEventEnginePadrao>;
  let registrarEvidenciaUseCase: RegistrarEvidenciaUseCase;
  let consultarEvidenciasUseCase: ConsultarEvidenciasDemandaUseCase;
  let processarEventoUseCase: ProcessarEventoAnaliticoUseCase;

  const projetoId = 'prj_integration_35b3';
  const demandaIdA = 'dem_integration_35b3_A';
  const demandaIdB = 'dem_integration_35b3_B';

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
    assetRepo = new SqliteAtivoDadosRepository(db);
    receitaRepo = new SqliteReceitaPreparacaoRepository(db);
    etapaRepo = new SqliteEtapaTransformacaoRepository(db);
    linhagemRepo = new SqliteLinhagemAtivosRepository(db);
    datasetAutorizadoRepo = new SqliteDatasetAutorizadoRepository(db);
    diagRepo = new SqliteDiagnosticosQualidadeRepository(db);
    probRepo = new SqliteProblemasQualidadeRepository(db);
    modeloRepo = new SqliteModeloAnaliticoRepository(db);
    entidadeRepo = new SqliteEntidadeAnaliticaRepository(db);
    atributoRepo = new SqliteAtributoAnaliticoRepository(db);
    relacionamentoRepo = new SqliteRelacionamentoAnaliticoRepository(db);
    metricaRepo = new SqliteMetricaAnaliticaRepository(db);
    auditRepo = new SqliteAuditRepository(db);
    evidenciaRepo = new SqliteEvidenciaAnaliticaRepository(db);
    eventLogRepo = new SqliteEventoAnaliticoLogRepository(db);

    eventEngine = criarEvidenceEventEnginePadrao();
    registrarEvidenciaUseCase = new RegistrarEvidenciaUseCase(evidenciaRepo, demandRepo);
    consultarEvidenciasUseCase = new ConsultarEvidenciasDemandaUseCase(evidenciaRepo, demandRepo);
    processarEventoUseCase = new ProcessarEventoAnaliticoUseCase(
      eventEngine,
      eventLogRepo,
      registrarEvidenciaUseCase
    );

    const now = new Date().toISOString();

    // 1. Seed Projeto
    await projectRepo.create({
      id: projetoId,
      nome: 'Projeto BI 3.5B.3',
      descricao: 'Validação de integração de eventos de Preparação e Modelagem',
      status: 'ATIVO',
      data_inicio: now,
      data_conclusao_prevista: null,
      data_conclusao_real: null,
      criado_em: now,
      atualizado_em: now,
    });

    // 2. Seed Demandas A e B
    await demandRepo.create({
      id: demandaIdA,
      projeto_id: projetoId,
      titulo: 'Demanda de Preparação e Modelagem A',
      solicitacao_bruta: 'Construção de modelo dimensional A',
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
      titulo: 'Demanda de Preparação e Modelagem B',
      solicitacao_bruta: 'Construção de modelo dimensional B',
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
      // Ignora falha de exclusão
    }
  });

  // ==========================================
  // BLOCO 1: EVENTOS DE PREPARAÇÃO
  // ==========================================

  it('1. PREPARACAO_DATASET_HOMOLOGADO: captura automática preserva autoria humana formal no banco', async () => {
    const evento: EventoAnalitico = {
      id_evento: 'evt_prep_aut_integration_01',
      demanda_id: demandaIdA,
      projeto_id: projetoId,
      etapa_origem: EtapaOrigemEvidencia.PREPARACAO,
      categoria: 'PREPARACAO',
      tipo_evento: 'PREPARACAO_DATASET_HOMOLOGADO',
      ocorrido_em: '2026-10-01T12:00:00Z',
      executor: 'ANALISTA',
      artefato_origem_tipo: 'DATASET_AUTORIZADO',
      artefato_origem_id: 'aut_dataset_01',
      payload: {
        autorizacaoId: 'aut_dataset_01',
        ativoDadosId: 'ast_dados_01',
        nomeArquivo: 'dataset_vendas_consolidado.parquet',
        versaoRotulo: '1.0',
        hashSha256Snapshot: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        diagnosticoId: 'diag_prep_01',
        receitaId: 'rec_prep_01',
        justificativa: 'Dataset com volumetria e tipos validados deterministamente.',
        totalRestricoesAceitas: 0,
        autorTipo: 'HUMANO',
        autorizadoEm: '2026-10-01T12:00:00Z',
      },
      versao_contrato: '1.0',
    };

    const resultado = await processarEventoUseCase.execute(evento);
    expect(resultado.status_processamento).toBe('REGISTRADO');
    expect(resultado.evidencia_gerada_id).toBeDefined();

    // Consulta no SQLite
    const evidencia = await evidenciaRepo.findById(resultado.evidencia_gerada_id!);
    expect(evidencia).not.toBeNull();
    expect(evidencia?.tipo).toBe(TipoEvidenciaAnalitica.PREPARACAO);
    expect(evidencia?.etapa_origem).toBe(EtapaOrigemEvidencia.PREPARACAO);
    expect(evidencia?.titulo).toContain('Homologação Formal de Dataset para Modelagem');
    expect(evidencia?.decisao_humana).toBe('Dataset com volumetria e tipos validados deterministamente.');

    // Rigor Epistêmico A: Captura automática != Autoria automática
    expect(evidencia?.metadados?.autor_tipo).toBe('HUMANO');
    expect(evidencia?.metadados?.captura_automatica).toBe(true);
  });

  it('2. PREPARACAO_RECEITA_CONCLUIDA: registra conclusão com etapas validadas', async () => {
    const evento: EventoAnalitico = {
      id_evento: 'evt_prep_rec_integration_01',
      demanda_id: demandaIdA,
      projeto_id: projetoId,
      etapa_origem: EtapaOrigemEvidencia.PREPARACAO,
      categoria: 'PREPARACAO',
      tipo_evento: 'PREPARACAO_RECEITA_CONCLUIDA',
      ocorrido_em: '2026-10-01T12:10:00Z',
      executor: 'ANALISTA',
      artefato_origem_tipo: 'RECEITA_PREPARACAO',
      artefato_origem_id: 'rec_prep_01',
      payload: {
        receitaId: 'rec_prep_01',
        titulo: 'Receita de Higienização de Vendas',
        totalEtapasValidadas: 3,
        totalEtapasCanceladas: 0,
        justificativa: 'Todas as etapas validadas deterministamente.',
        concluidaEm: '2026-10-01T12:10:00Z',
      },
      versao_contrato: '1.0',
    };

    const resultado = await processarEventoUseCase.execute(evento);
    expect(resultado.status_processamento).toBe('REGISTRADO');

    const evidencia = await evidenciaRepo.findById(resultado.evidencia_gerada_id!);
    expect(evidencia?.titulo).toContain('Receita de Higienização de Vendas');
    expect(evidencia?.resultado_mensuravel).toContain('3 etapa(s) de transformação validadas');
  });

  it('3. PREPARACAO_ATIVO_DERIVADO_REGISTRADO: calcula variação volumétrica real e persiste', async () => {
    const evento: EventoAnalitico = {
      id_evento: 'evt_prep_deriv_integration_01',
      demanda_id: demandaIdA,
      projeto_id: projetoId,
      etapa_origem: EtapaOrigemEvidencia.PREPARACAO,
      categoria: 'PREPARACAO',
      tipo_evento: 'PREPARACAO_ATIVO_DERIVADO_REGISTRADO',
      ocorrido_em: '2026-10-01T12:15:00Z',
      executor: 'ANALISTA',
      artefato_origem_tipo: 'ATIVO_DADOS',
      artefato_origem_id: 'ast_deriv_100',
      payload: {
        ativoId: 'ast_deriv_100',
        nomeArquivo: 'vendas_limpas.parquet',
        caminhoLocal: '/data/vendas_limpas.parquet',
        formato: 'parquet',
        tamanhoBytes: 500000,
        totalLinhas: 8000,
        totalColunas: 8,
        hashSha256: '11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff',
        receitaId: 'rec_prep_01',
        etapaId: 'etp_prep_01',
        tipoOperacao: 'FILTRAR_LINHAS',
        ferramentaNome: 'DuckDB',
        linhasOrigemPrincipal: 10000, // 10.000 -> 8.000 (-20%)
      },
      versao_contrato: '1.0',
    };

    const resultado = await processarEventoUseCase.execute(evento);
    expect(resultado.status_processamento).toBe('REGISTRADO');

    const evidencia = await evidenciaRepo.findById(resultado.evidencia_gerada_id!);
    expect(evidencia?.resultado_mensuravel).toContain('-2.000 linhas (-20% em relação à origem)');
    expect(evidencia?.metadados?.variacao_linhas).toBe(-2000);
  });

  it('4. PREPARACAO_TRATAMENTO_VALIDADO: tratamento sem métricas não fabrica delta; com métricas calcula real', async () => {
    // 4A: Sem métricas
    const eventoSemMetricas: EventoAnalitico = {
      id_evento: 'evt_prep_trat_sem_met_int',
      demanda_id: demandaIdA,
      projeto_id: projetoId,
      etapa_origem: EtapaOrigemEvidencia.PREPARACAO,
      categoria: 'PREPARACAO',
      tipo_evento: 'PREPARACAO_TRATAMENTO_VALIDADO',
      ocorrido_em: '2026-10-01T12:20:00Z',
      executor: 'ANALISTA',
      artefato_origem_tipo: 'PROBLEMA_QUALIDADE',
      artefato_origem_id: 'prob_qual_sem_met',
      payload: {
        problemaId: 'prob_qual_sem_met',
        titulo: 'Espaços em Branco no Nome',
        colunaAfetada: 'nm_cliente',
        etapaId: 'etp_trim',
        diagnosticoId: 'diag_01',
        ativoDerivadoId: 'ast_deriv_100',
        motivo: 'Regra determinística de trim aplicada.',
      },
      versao_contrato: '1.0',
    };

    const resSem = await processarEventoUseCase.execute(eventoSemMetricas);
    expect(resSem.status_processamento).toBe('REGISTRADO');

    const evSem = await evidenciaRepo.findById(resSem.evidencia_gerada_id!);
    expect(evSem?.resultado_mensuravel).toBe(
      'Tratamento validado e aprovado segundo a regra determinística aplicável no ativo derivado.'
    );

    // 4B: Com métricas reais
    const eventoComMetricas: EventoAnalitico = {
      id_evento: 'evt_prep_trat_com_met_int',
      demanda_id: demandaIdA,
      projeto_id: projetoId,
      etapa_origem: EtapaOrigemEvidencia.PREPARACAO,
      categoria: 'PREPARACAO',
      tipo_evento: 'PREPARACAO_TRATAMENTO_VALIDADO',
      ocorrido_em: '2026-10-01T12:25:00Z',
      executor: 'ANALISTA',
      artefato_origem_tipo: 'PROBLEMA_QUALIDADE',
      artefato_origem_id: 'prob_qual_com_met',
      payload: {
        problemaId: 'prob_qual_com_met',
        titulo: 'Preços Negativos',
        colunaAfetada: 'vl_unitario',
        etapaId: 'etp_filtro_preco',
        diagnosticoId: 'diag_02',
        ativoDerivadoId: 'ast_deriv_100',
        linhasAfetadasAntes: 40,
        linhasAfetadasDepois: 0,
        motivo: 'Registros com valores corrompidos eliminados.',
      },
      versao_contrato: '1.0',
    };

    const resCom = await processarEventoUseCase.execute(eventoComMetricas);
    expect(resCom.status_processamento).toBe('REGISTRADO');

    const evCom = await evidenciaRepo.findById(resCom.evidencia_gerada_id!);
    expect(evCom?.resultado_mensuravel).toContain('Redução comprovada de 40 ocorrência(s) (100.0% de saneamento)');
    expect(evCom?.resultado_mensuravel).toContain('restando 0 ocorrência(s)');
  });

  // ==========================================
  // BLOCO 2: EVENTOS DE MODELAGEM
  // ==========================================

  it('5. MODELAGEM_MODELO_HOMOLOGADO: preserva autoria humana formal na homologação de modelo', async () => {
    const evento: EventoAnalitico = {
      id_evento: 'evt_mod_homol_int_01',
      demanda_id: demandaIdA,
      projeto_id: projetoId,
      etapa_origem: EtapaOrigemEvidencia.MODELAGEM,
      categoria: 'MODELAGEM',
      tipo_evento: 'MODELAGEM_MODELO_HOMOLOGADO',
      ocorrido_em: '2026-10-01T13:00:00Z',
      executor: 'ANALISTA',
      artefato_origem_tipo: 'MODELO_ANALITICO',
      artefato_origem_id: 'mod_vendas_prod',
      payload: {
        modeloId: 'mod_vendas_prod',
        nomeModelo: 'Star Schema Vendas e Metas',
        tipoArquitetura: 'STAR_SCHEMA',
        datasetAutorizadoId: 'aut_dataset_01',
        homologadoPor: 'ANALISTA_LEAD',
        justificativa: 'Validação determinística total M-01 a M-12 aprovada formalmente.',
        totalAlertasReconhecidos: 0,
        totalRecomendacoes: 1,
        homologadoEm: '2026-10-01T13:00:00Z',
      },
      versao_contrato: '1.0',
    };

    const resultado = await processarEventoUseCase.execute(evento);
    expect(resultado.status_processamento).toBe('REGISTRADO');

    const evidencia = await evidenciaRepo.findById(resultado.evidencia_gerada_id!);
    expect(evidencia?.tipo).toBe(TipoEvidenciaAnalitica.MODELAGEM);
    expect(evidencia?.titulo).toContain('Star Schema Vendas e Metas');
    expect(evidencia?.decisao_humana).toBe('Validação determinística total M-01 a M-12 aprovada formalmente.');
    expect(evidencia?.metadados?.autor_tipo).toBe('HUMANO');
    expect(evidencia?.metadados?.captura_automatica).toBe(true);
    expect(evidencia?.metadados?.homologado_por).toBe('ANALISTA_LEAD');
  });

  it('6. MODELAGEM_CALENDARIO_ESPECIFICADO: especificação de calendário não atesta isoladamente conformidade global', async () => {
    const evento: EventoAnalitico = {
      id_evento: 'evt_mod_cal_int_01',
      demanda_id: demandaIdA,
      projeto_id: projetoId,
      etapa_origem: EtapaOrigemEvidencia.MODELAGEM,
      categoria: 'MODELAGEM',
      tipo_evento: 'MODELAGEM_CALENDARIO_ESPECIFICADO',
      ocorrido_em: '2026-10-01T13:10:00Z',
      executor: 'ANALISTA',
      artefato_origem_tipo: 'ENTIDADE_ANALITICA',
      artefato_origem_id: 'ent_calendario_int',
      payload: {
        entidadeId: 'ent_calendario_int',
        modeloId: 'mod_vendas_prod',
        nomeEntidade: 'd_calendario',
        dataInicio: '2024-01-01',
        dataFim: '2026-12-31',
        totalAtributosGerados: 12,
        especificadoEm: '2026-10-01T13:10:00Z',
      },
      versao_contrato: '1.0',
    };

    const resultado = await processarEventoUseCase.execute(evento);
    expect(resultado.status_processamento).toBe('REGISTRADO');

    const ev = await evidenciaRepo.findById(resultado.evidencia_gerada_id!);
    expect(ev?.resultado_mensuravel).toContain('(Nota: não atesta isoladamente conformidade global do modelo)');
  });

  it('7. MODELAGEM_METRICA_CADASTRADA: cadastro de métrica formaliza indicador sem atestar conformidade global', async () => {
    const evento: EventoAnalitico = {
      id_evento: 'evt_mod_met_int_01',
      demanda_id: demandaIdA,
      projeto_id: projetoId,
      etapa_origem: EtapaOrigemEvidencia.MODELAGEM,
      categoria: 'MODELAGEM',
      tipo_evento: 'MODELAGEM_METRICA_CADASTRADA',
      ocorrido_em: '2026-10-01T13:15:00Z',
      executor: 'ANALISTA',
      artefato_origem_tipo: 'METRICA_ANALITICA',
      artefato_origem_id: 'met_margem_int',
      payload: {
        metricaId: 'met_margem_int',
        modeloId: 'mod_vendas_prod',
        nome: 'Margem Bruta Percentual',
        tipoAgregacao: 'DIVISAO',
        tipoAditividade: 'NAO_ADITIVA',
        formulaDeclarativa: 'DIVIDE([Lucro Bruto], [Receita Total], 0)',
        unidadeMedida: 'PERCENTUAL',
        perguntaNegocioAssociada: 'Qual a rentabilidade operacional bruta por linha de produto?',
        objetivoNegocioAssociado: 'Assegurar rentabilidade mínima de 25%.',
        cadastradaEm: '2026-10-01T13:15:00Z',
      },
      versao_contrato: '1.0',
    };

    const resultado = await processarEventoUseCase.execute(evento);
    expect(resultado.status_processamento).toBe('REGISTRADO');

    const ev = await evidenciaRepo.findById(resultado.evidencia_gerada_id!);
    expect(ev?.titulo).toContain('Margem Bruta Percentual');
    expect(ev?.resultado_mensuravel).toContain('(Nota: não atesta isoladamente conformidade global do modelo)');
    expect(ev?.decisao_humana).toBe('Assegurar rentabilidade mínima de 25%.');
  });

  it('8. MODELAGEM_RELACIONAMENTO_CRIADO: relacionamento estrutural dimensional não atesta conformidade global isolada', async () => {
    const evento: EventoAnalitico = {
      id_evento: 'evt_mod_rel_int_01',
      demanda_id: demandaIdA,
      projeto_id: projetoId,
      etapa_origem: EtapaOrigemEvidencia.MODELAGEM,
      categoria: 'MODELAGEM',
      tipo_evento: 'MODELAGEM_RELACIONAMENTO_CRIADO',
      ocorrido_em: '2026-10-01T13:20:00Z',
      executor: 'ANALISTA',
      artefato_origem_tipo: 'RELACIONAMENTO_ANALITICO',
      artefato_origem_id: 'rel_cal_vendas_int',
      payload: {
        relacionamentoId: 'rel_cal_vendas_int',
        modeloId: 'mod_vendas_prod',
        entidadeOrigemNome: 'd_calendario',
        atributoOrigemNome: 'id_data',
        entidadeDestinoNome: 'f_vendas',
        atributoDestinoNome: 'data_key',
        tipoRelacionamento: 'UM_PARA_MUITOS',
        direcaoFiltro: 'UNIDIRECIONAL',
        justificativa: 'Propagação dimensional de filtro temporal para tabela fato.',
        criadoEm: '2026-10-01T13:20:00Z',
      },
      versao_contrato: '1.0',
    };

    const resultado = await processarEventoUseCase.execute(evento);
    expect(resultado.status_processamento).toBe('REGISTRADO');

    const ev = await evidenciaRepo.findById(resultado.evidencia_gerada_id!);
    expect(ev?.titulo).toContain('d_calendario -> f_vendas');
    expect(ev?.resultado_mensuravel).toContain('(Nota: não atesta isoladamente conformidade global do modelo)');
  });

  // ==========================================
  // BLOCO 3: GARANTIAS ARQUITETURAIS (E, F, G)
  // ==========================================

  // Teste E: Retries permanecem idempotentes
  it('E. retries de eventos analíticos são estritamente idempotentes', async () => {
    const eventoIdempotente: EventoAnalitico = {
      id_evento: 'evt_idempotente_check_01',
      demanda_id: demandaIdA,
      projeto_id: projetoId,
      etapa_origem: EtapaOrigemEvidencia.PREPARACAO,
      categoria: 'PREPARACAO',
      tipo_evento: 'PREPARACAO_DATASET_HOMOLOGADO',
      ocorrido_em: '2026-10-01T13:30:00Z',
      executor: 'ANALISTA',
      artefato_origem_tipo: 'DATASET_AUTORIZADO',
      artefato_origem_id: 'aut_dataset_idem',
      payload: {
        autorizacaoId: 'aut_dataset_idem',
        ativoDadosId: 'ast_dados_idem',
        nomeArquivo: 'dataset_idem.parquet',
        versaoRotulo: '1.0',
        hashSha256Snapshot: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        diagnosticoId: 'diag_idem',
        receitaId: 'rec_idem',
        justificativa: 'Justificativa de teste de idempotência.',
        totalRestricoesAceitas: 0,
        autorTipo: 'HUMANO',
        autorizadoEm: '2026-10-01T13:30:00Z',
      },
      versao_contrato: '1.0',
    };

    // Primeira execução -> REGISTRADO
    const primExec = await processarEventoUseCase.execute(eventoIdempotente);
    expect(primExec.status_processamento).toBe('REGISTRADO');

    // Contar evidências com este id de artefato
    const { evidencias: todasAntes } = await consultarEvidenciasUseCase.execute({ demanda_id: demandaIdA });
    const contagemAntes = todasAntes.filter((e) => e.artefato_origem_id === 'aut_dataset_idem').length;
    expect(contagemAntes).toBe(1);

    // Segunda execução (Retry idêntico) -> DUPLICADO
    const segExec = await processarEventoUseCase.execute(eventoIdempotente);
    expect(segExec.status_processamento).toBe('DUPLICADO');
    expect(segExec.ja_processado).toBe(true);
    expect(segExec.motivo).toContain('Evento já processado anteriormente');

    // Verificar que a tabela evidencias_analiticas não duplicou o registro
    const { evidencias: todasDepois } = await consultarEvidenciasUseCase.execute({ demanda_id: demandaIdA });
    const contagemDepois = todasDepois.filter((e) => e.artefato_origem_id === 'aut_dataset_idem').length;
    expect(contagemDepois).toBe(1);
  });

  // Teste F: Falha operacional não produz evidência falsa
  it('F. falha operacional no processamento de evento não produz evidência falsa', async () => {
    const eventoComPayloadInvalido: EventoAnalitico = {
      id_evento: 'evt_falha_payload_invalido',
      demanda_id: demandaIdA,
      projeto_id: projetoId,
      etapa_origem: EtapaOrigemEvidencia.MODELAGEM,
      categoria: 'MODELAGEM',
      tipo_evento: 'MODELAGEM_MODELO_HOMOLOGADO',
      ocorrido_em: '2026-10-01T13:40:00Z',
      executor: 'ANALISTA',
      payload: {
        modeloId: '', // Payload deliberadamente corrompido/incompleto
        justificativa: '',
      },
      versao_contrato: '1.0',
    };

    const resultado = await processarEventoUseCase.execute(eventoComPayloadInvalido);
    expect(resultado.status_processamento).toBe('IGNORADO');

    // Verificar log persistido com status IGNORADO
    const log = await eventLogRepo.findByIdEvento('evt_falha_payload_invalido');
    expect(log).not.toBeNull();
    expect(log?.status_processamento).toBe('IGNORADO');

    // Nenhuma evidência gerada
    expect(resultado.evidencia_gerada_id).toBeNull();
  });

  // Teste G: Isolamento entre demandas permanece preservado
  it('G. isolamento rigoroso entre demandas é preservado nas consultas de evidência', async () => {
    // Registrar evento para a Demanda B
    const eventoDemandaB: EventoAnalitico = {
      id_evento: 'evt_prep_demanda_b_01',
      demanda_id: demandaIdB,
      projeto_id: projetoId,
      etapa_origem: EtapaOrigemEvidencia.PREPARACAO,
      categoria: 'PREPARACAO',
      tipo_evento: 'PREPARACAO_RECEITA_CONCLUIDA',
      ocorrido_em: '2026-10-01T13:50:00Z',
      executor: 'ANALISTA',
      artefato_origem_tipo: 'RECEITA_PREPARACAO',
      artefato_origem_id: 'rec_demanda_b',
      payload: {
        receitaId: 'rec_demanda_b',
        titulo: 'Receita Exclusiva da Demanda B',
        totalEtapasValidadas: 2,
        totalEtapasCanceladas: 0,
        justificativa: 'Isolamento de demanda testado.',
        concluidaEm: '2026-10-01T13:50:00Z',
      },
      versao_contrato: '1.0',
    };

    const resB = await processarEventoUseCase.execute(eventoDemandaB);
    expect(resB.status_processamento).toBe('REGISTRADO');

    // Consultas separadas
    const { evidencias: evsDemandaA } = await consultarEvidenciasUseCase.execute({ demanda_id: demandaIdA });
    const { evidencias: evsDemandaB } = await consultarEvidenciasUseCase.execute({ demanda_id: demandaIdB });

    // A evidência da Demanda B NUNCA deve aparecer na Demanda A
    const vazamento = evsDemandaA.find((e) => e.id === resB.evidencia_gerada_id);
    expect(vazamento).toBeUndefined();

    // A evidência da Demanda B DEVE estar na Demanda B
    const presenteB = evsDemandaB.find((e) => e.id === resB.evidencia_gerada_id);
    expect(presenteB).toBeDefined();
    expect(presenteB?.demanda_id).toBe(demandaIdB);
  });
});
