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
import { SqliteDiagnosticosQualidadeRepository } from '@/infrastructure/db/repositories/sqlite-diagnosticos-qualidade-repository';
import { SqliteProblemasQualidadeRepository } from '@/infrastructure/db/repositories/sqlite-problemas-qualidade-repository';
import { SqliteAuditRepository } from '@/infrastructure/db/repositories/audit-repository';
import { SqliteEvidenciaAnaliticaRepository } from '@/infrastructure/db/repositories/sqlite-evidencia-analitica-repository';
import { SqliteEventoAnaliticoLogRepository } from '@/infrastructure/db/repositories/sqlite-evento-analitico-log-repository';
import { criarEvidenceEventEnginePadrao } from '@/core/domain/evidence-events/engine-factory';
import { ProcessarEventoAnaliticoUseCase } from '@/core/use-cases/evidence/processar-evento-analitico.use-case';
import { RegistrarEvidenciaUseCase } from '@/core/use-cases/evidence/registrar-evidencia.use-case';
import { ConsultarEvidenciasDemandaUseCase } from '@/core/use-cases/evidence/consultar-evidencias-demanda.use-case';
import { RegisterDataAssetUseCase } from '@/core/use-cases/data-assets/register-data-asset';
import { ReplaceDataAssetUseCase } from '@/core/use-cases/data-assets/replace-data-asset';
import { DeliberarProblemaQualidadeUseCase } from '@/core/use-cases/quality/deliberar-problema-qualidade.use-case';
import { AtualizarStatusProblemaUseCase } from '@/core/use-cases/quality/atualizar-status-problema.use-case';
import { RegistrarProblemaManualUseCase } from '@/core/use-cases/quality/registrar-problema-manual.use-case';
import { EventoAnalitico } from '@/core/domain/evidence-events/event-types';
import { EtapaOrigemEvidencia } from '@/core/domain/enums/etapa-origem-evidencia';
import { TipoEvidenciaAnalitica } from '@/core/domain/enums/tipo-evidencia-analitica';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { StatusValidacaoEvidencia } from '@/core/domain/enums/status-validacao-evidencia';
import { SeveridadeProblema } from '@/core/domain/enums/severidade-problema';
import { AcaoProblemaQualidade } from '@/core/domain/enums/acao-problema-qualidade';
import { StatusProblemaQualidade } from '@/core/domain/enums/status-problema-qualidade';
import { FormatoArquivo } from '@/core/domain/enums/formato-arquivo';
import { StatusExecucaoDiagnostico } from '@/core/domain/enums/status-execucao-diagnostico';

describe('Integration Tests: Integração do Evidence Event Engine com Dados + Qualidade (Subgate 3.5B.2)', () => {
  const testDbDir = path.join(process.cwd(), '.workspace', 'data');
  const testDbPath = path.join(testDbDir, 'test_subgate_35b2_dados_qualidade.db');
  let sqliteDb: Database.Database;
  let db: ReturnType<typeof drizzle<typeof schema>>;

  let projectRepo: SqliteProjectRepository;
  let demandRepo: SqliteDemandRepository;
  let assetRepo: SqliteAtivoDadosRepository;
  let diagRepo: SqliteDiagnosticosQualidadeRepository;
  let probRepo: SqliteProblemasQualidadeRepository;
  let auditRepo: SqliteAuditRepository;
  let evidenciaRepo: SqliteEvidenciaAnaliticaRepository;
  let eventLogRepo: SqliteEventoAnaliticoLogRepository;

  let eventEngine: ReturnType<typeof criarEvidenceEventEnginePadrao>;
  let registrarEvidenciaUseCase: RegistrarEvidenciaUseCase;
  let consultarEvidenciasUseCase: ConsultarEvidenciasDemandaUseCase;
  let processarEventoUseCase: ProcessarEventoAnaliticoUseCase;

  const projetoId = 'prj_integration_35b2';
  const demandaIdA = 'dem_integration_35b2_A';
  const demandaIdB = 'dem_integration_35b2_B';

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
    diagRepo = new SqliteDiagnosticosQualidadeRepository(db);
    probRepo = new SqliteProblemasQualidadeRepository(db);
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
      nome: 'Projeto BI 3.5B.2',
      descricao: 'Validação de integração de eventos',
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
      titulo: 'Demanda de Teste A',
      solicitacao_bruta: 'Análise de integridade de dados A',
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
      titulo: 'Demanda de Teste B',
      solicitacao_bruta: 'Análise de integridade de dados B',
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

  // 1. AÇÃO VÁLIDA EM ATIVOS DE DADOS GERA EVENTO E EVIDÊNCIA ESPERADA
  it('1. ação válida de registrar ativo gera evidência de dados no Evidence Core', async () => {
    const registerUseCase = new RegisterDataAssetUseCase(assetRepo, demandRepo, auditRepo);
    const ativoCriado = await registerUseCase.execute({
      demanda_id: demandaIdA,
      nome_arquivo: 'clientes_raw.csv',
      caminho_local: 'C:/dados/clientes_raw.csv',
      formato: FormatoArquivo.CSV,
      origem: 'Data Lake',
      tamanho_bytes: 204800,
      total_linhas: 5000,
      total_colunas: 8,
      hash_sha256: '1111111111222222222233333333334444444444555555555566666666667777',
      versao: '1.0',
      data_recebimento: '2026-10-01',
    });

    // Emissão do evento de catalogação
    const evento: EventoAnalitico = {
      id_evento: `evt_ast_reg_${ativoCriado.id}`,
      demanda_id: demandaIdA,
      projeto_id: projetoId,
      etapa_origem: EtapaOrigemEvidencia.DADOS,
      categoria: 'DADOS',
      tipo_evento: 'DADOS_ATIVO_REGISTRADO',
      ocorrido_em: ativoCriado.criado_em,
      executor: 'ANALISTA',
      artefato_origem_tipo: 'ATIVO_DADOS',
      artefato_origem_id: ativoCriado.id,
      payload: {
        ativoId: ativoCriado.id,
        nomeArquivo: ativoCriado.nome_arquivo,
        caminhoLocal: ativoCriado.caminho_local,
        formato: ativoCriado.formato,
        tamanhoBytes: ativoCriado.tamanho_bytes,
        totalLinhas: ativoCriado.total_linhas,
        totalColunas: ativoCriado.total_colunas,
        hashSha256: ativoCriado.hash_sha256,
        versao: ativoCriado.versao,
      },
      versao_contrato: '1.0',
    };

    const resultadoProcessamento = await processarEventoUseCase.execute(evento);
    expect(resultadoProcessamento.status_processamento).toBe('REGISTRADO');
    expect(resultadoProcessamento.evidencia_gerada_id).toBeDefined();

    // Verificação na persistência do Evidence Core
    const evidencia = await evidenciaRepo.findById(resultadoProcessamento.evidencia_gerada_id!);
    expect(evidencia).not.toBeNull();
    expect(evidencia?.tipo).toBe(TipoEvidenciaAnalitica.DADOS);
    expect(evidencia?.etapa_origem).toBe(EtapaOrigemEvidencia.DADOS);
    expect(evidencia?.titulo).toContain('clientes_raw.csv');
    expect(evidencia?.fato_observado).toContain('5000 linhas');
    expect(evidencia?.fato_observado).toContain('8 colunas');
    expect(evidencia?.status_validacao).toBe(StatusValidacaoEvidencia.CAPTURADA);
    expect(evidencia?.metodo_captura).toBe('AUTOMATICA');
  });

  // 1b. AÇÃO DE SUBSTITUIÇÃO DE ATIVO GERA EVIDÊNCIA COM DELTAS E JUSTIFICATIVA
  it('1b. substituição material de ativo gera evidência com deltas e justificativa humana', async () => {
    const ativos = await assetRepo.findByDemandId(demandaIdA);
    const ativoOriginal = ativos[0];

    const replaceUseCase = new ReplaceDataAssetUseCase(assetRepo, demandRepo);
    const justificativaSubstituicao = 'Carga complementar de fechamento com inclusão de 200 novas linhas e nova coluna de status.';

    const resultadoSubstituicao = await replaceUseCase.execute({
      demanda_id: demandaIdA,
      ativo_antigo_id: ativoOriginal.id,
      nome_arquivo: 'clientes_raw_v2.csv',
      caminho_local: 'C:/dados/clientes_raw_v2.csv',
      formato: FormatoArquivo.CSV,
      origem: 'Data Lake Fechamento',
      tamanho_bytes: 215000,
      total_linhas: 5200,
      total_colunas: 9,
      hash_sha256: '9999999999888888888877777777776666666666555555555544444444443333',
      versao: '1.1',
      data_recebimento: '2026-10-01',
      justificativa: justificativaSubstituicao,
    });

    const eventoSubstituicao: EventoAnalitico = {
      id_evento: `evt_ast_rep_${resultadoSubstituicao.novoAtivo.id}`,
      demanda_id: demandaIdA,
      projeto_id: projetoId,
      etapa_origem: EtapaOrigemEvidencia.DADOS,
      categoria: 'DADOS',
      tipo_evento: 'DADOS_ATIVO_SUBSTITUIDO',
      ocorrido_em: resultadoSubstituicao.novoAtivo.criado_em,
      executor: 'ANALISTA',
      artefato_origem_tipo: 'ATIVO_DADOS',
      artefato_origem_id: resultadoSubstituicao.novoAtivo.id,
      payload: {
        ativoAntigoId: resultadoSubstituicao.ativoSubstituido.id,
        novoAtivoId: resultadoSubstituicao.novoAtivo.id,
        nomeArquivo: resultadoSubstituicao.novoAtivo.nome_arquivo,
        caminhoLocal: resultadoSubstituicao.novoAtivo.caminho_local,
        formato: resultadoSubstituicao.novoAtivo.formato,
        versaoAntiga: resultadoSubstituicao.ativoSubstituido.versao || '1.0',
        versaoNova: resultadoSubstituicao.novoAtivo.versao || '1.1',
        hashAntigo: resultadoSubstituicao.ativoSubstituido.hash_sha256,
        hashNovo: resultadoSubstituicao.novoAtivo.hash_sha256,
        linhasAntigas: resultadoSubstituicao.ativoSubstituido.total_linhas,
        linhasNovas: resultadoSubstituicao.novoAtivo.total_linhas,
        colunasAntigas: resultadoSubstituicao.ativoSubstituido.total_colunas,
        colunasNovas: resultadoSubstituicao.novoAtivo.total_colunas,
        justificativa: justificativaSubstituicao,
      },
      versao_contrato: '1.0',
    };

    const res = await processarEventoUseCase.execute(eventoSubstituicao);
    expect(res.status_processamento).toBe('REGISTRADO');

    const ev = await evidenciaRepo.findById(res.evidencia_gerada_id!);
    expect(ev?.titulo).toContain('Substituição e Versionamento');
    expect(ev?.resultado_mensuravel).toContain('Delta Linhas: +200');
    expect(ev?.resultado_mensuravel).toContain('Delta Colunas: +1');
    expect(ev?.decisao_humana).toBe(justificativaSubstituicao);
  });

  // 2. AÇÕES VÁLIDAS EM QUALIDADE GERAM EVENTOS E EVIDÊNCIAS ESPERADAS
  it('2. diagnóstico de qualidade concluído gera evidência de qualidade com métricas', async () => {
    const ativos = await assetRepo.findByDemandId(demandaIdA);
    const ativoValido = ativos[0];
    const agora = new Date().toISOString();
    const diagnostico = await diagRepo.create({
      id: 'diag_test_qualidade_1',
      ativo_dados_id: ativoValido.id,
      demanda_id: demandaIdA,
      iniciado_em: agora,
      concluido_em: agora,
      duracao_ms: 120,
      total_linhas_avaliadas: 5200,
      total_colunas_avaliadas: 9,
      verificacoes_executadas: [],
      total_problemas_detectados: 1,
      status_execucao: StatusExecucaoDiagnostico.CONCLUIDO,
      erro_mensagem: null,
      resumo_metricas: null,
      criado_em: agora,
      atualizado_em: agora,
    });

    const evento: EventoAnalitico = {
      id_evento: `evt_diag_${diagnostico.id}`,
      demanda_id: demandaIdA,
      projeto_id: projetoId,
      etapa_origem: EtapaOrigemEvidencia.QUALIDADE,
      categoria: 'QUALIDADE',
      tipo_evento: 'QUALIDADE_DIAGNOSTICO_CONCLUIDO',
      ocorrido_em: diagnostico.concluido_em!,
      executor: 'SISTEMA_DETERMINISTICO',
      artefato_origem_tipo: 'DIAGNOSTICO_QUALIDADE',
      artefato_origem_id: diagnostico.id,
      payload: {
        diagnosticoId: diagnostico.id,
        ativoDadosId: diagnostico.ativo_dados_id,
        tabelaNome: 'clientes_raw_v2.csv',
        totalLinhasAvaliadas: diagnostico.total_linhas_avaliadas,
        totalColunasAvaliadas: diagnostico.total_colunas_avaliadas,
        totalProblemasDetectados: diagnostico.total_problemas_detectados,
        duracaoMs: diagnostico.duracao_ms,
      },
      versao_contrato: '1.0',
    };

    const res = await processarEventoUseCase.execute(evento);
    expect(res.status_processamento).toBe('REGISTRADO');

    const ev = await evidenciaRepo.findById(res.evidencia_gerada_id!);
    expect(ev?.tipo).toBe(TipoEvidenciaAnalitica.QUALIDADE);
    expect(ev?.titulo).toContain('Diagnóstico de Qualidade: clientes_raw_v2.csv');
    expect(ev?.resultado_mensuravel).toContain('1 anomalias | 5200 linhas avaliadas');
  });

  it('2b. deliberação de problema de qualidade gera evidência com justificativa e severidade', async () => {
    // Cria problema para deliberar
    const probManualUseCase = new RegistrarProblemaManualUseCase(assetRepo, probRepo);
    const ativos = await assetRepo.findByDemandId(demandaIdA);
    const ativo = ativos[0];

    const problemaCriado = await probManualUseCase.execute({
      ativoDadosId: ativo.id,
      demandaId: demandaIdA,
      titulo: 'Valores nulos em Chave Primária',
      descricao: '12 linhas com identificador ausente detectadas na base.',
      tabelaAfetada: ativo.nome_arquivo,
      colunaAfetada: 'id_cliente',
      totalLinhasAfetadas: 12,
    });

    const deliberarUseCase = new DeliberarProblemaQualidadeUseCase(probRepo, auditRepo);
    const justificativaDeliberacao = 'Linhas com chave nula serão descartadas na etapa de preparação dimensional.';
    const deliberado = await deliberarUseCase.execute({
      problemaId: problemaCriado.id,
      severidade: SeveridadeProblema.ALTA,
      acaoDeliberada: AcaoProblemaQualidade.TRATAR_NO_PIPELINE,
      justificativa: justificativaDeliberacao,
    });

    // ID determinístico derivado de dado persistido (sem Date.now())
    const timestampDeliberacao = deliberado.deliberado_em || deliberado.atualizado_em;
    const idEvento = `evt_delib_${deliberado.id}_${timestampDeliberacao}`;

    const eventoDeliberacao: EventoAnalitico = {
      id_evento: idEvento,
      demanda_id: demandaIdA,
      projeto_id: projetoId,
      etapa_origem: EtapaOrigemEvidencia.QUALIDADE,
      categoria: 'QUALIDADE',
      tipo_evento: 'QUALIDADE_PROBLEMA_DELIBERADO',
      ocorrido_em: timestampDeliberacao,
      executor: 'ANALISTA',
      artefato_origem_tipo: 'PROBLEMA_QUALIDADE',
      artefato_origem_id: deliberado.id,
      payload: {
        problemaId: deliberado.id,
        titulo: deliberado.titulo,
        tabelaAfetada: deliberado.tabela_afetada,
        colunaAfetada: deliberado.coluna_afetada,
        totalLinhasAfetadas: deliberado.total_linhas_afetadas,
        percentualLinhasAfetadas: deliberado.percentual_linhas_afetadas,
        severidade: deliberado.severidade,
        acaoDeliberada: deliberado.acao_deliberada || 'TRATAR_NO_PIPELINE',
        justificativa: deliberado.justificativa_deliberacao || justificativaDeliberacao,
        impactoCalculo: deliberado.impacto_calculo,
        deliberadoEm: timestampDeliberacao,
      },
      versao_contrato: '1.0',
    };

    const res = await processarEventoUseCase.execute(eventoDeliberacao);
    expect(res.status_processamento).toBe('REGISTRADO');

    const ev = await evidenciaRepo.findById(res.evidencia_gerada_id!);
    expect(ev?.tipo).toBe(TipoEvidenciaAnalitica.QUALIDADE);
    expect(ev?.titulo).toContain('Deliberação de Qualidade');
    expect(ev?.decisao_humana).toBe(justificativaDeliberacao);
    expect(ev?.resultado_mensuravel).toContain('Severidade: ALTA');
  });

  it('2c. resolução de problema de qualidade gera evidência de saneamento', async () => {
    const problemas = await probRepo.findByDemandId(demandaIdA);
    const problema = problemas[0];

    const updateStatusUseCase = new AtualizarStatusProblemaUseCase(probRepo, auditRepo);
    const justificativaResolucao = 'Tratamento executado e confirmado sem anomalias remanescentes.';
    const resolvido = await updateStatusUseCase.execute({
      problemaId: problema.id,
      novoStatus: StatusProblemaQualidade.TRATADO,
      justificativa: justificativaResolucao,
    });

    const timestampResolucao = resolvido.atualizado_em;
    const idEvento = `evt_res_${resolvido.id}_${timestampResolucao}`;

    const eventoResolucao: EventoAnalitico = {
      id_evento: idEvento,
      demanda_id: demandaIdA,
      projeto_id: projetoId,
      etapa_origem: EtapaOrigemEvidencia.QUALIDADE,
      categoria: 'QUALIDADE',
      tipo_evento: 'QUALIDADE_PROBLEMA_RESOLVIDO',
      ocorrido_em: timestampResolucao,
      executor: 'ANALISTA',
      artefato_origem_tipo: 'PROBLEMA_QUALIDADE',
      artefato_origem_id: resolvido.id,
      payload: {
        problemaId: resolvido.id,
        titulo: resolvido.titulo,
        tabelaAfetada: resolvido.tabela_afetada,
        statusAnterior: problema.status,
        novoStatus: 'RESOLVIDO',
        justificativa: justificativaResolucao,
        atualizadoEm: timestampResolucao,
      },
      versao_contrato: '1.0',
    };

    const res = await processarEventoUseCase.execute(eventoResolucao);
    expect(res.status_processamento).toBe('REGISTRADO');

    const ev = await evidenciaRepo.findById(res.evidencia_gerada_id!);
    expect(ev?.titulo).toContain('Problema de Qualidade Resolvido');
    expect(ev?.estado_posterior).toBe('Status atual: RESOLVIDO.');
  });

  // 3. METADADOS ESSENCIAIS SÃO PRESERVADOS
  it('3. metadados essenciais e proveniência são integralmente preservados no SQLite', async () => {
    const evidenciasA = await evidenciaRepo.findByDemandaId(demandaIdA);
    expect(evidenciasA.length).toBeGreaterThan(0);

    for (const ev of evidenciasA) {
      expect(ev.metadados).toBeDefined();
      expect(ev.metadados?.evento_origem_id).toBeDefined();
      expect(ev.metadados?.evento_tipo).toBeDefined();
      expect(ev.metadados?.politica_captura_aplicada).toBe('REGISTRAR_AUTOMATICAMENTE');
    }
  });

  // 4. SEGREGAÇÃO ENTRE DEMANDAS/PROJETOS PERMANECE CORRETA
  it('4. segregação estrita: eventos da Demanda B não afetam a Demanda A', async () => {
    const eventoDemandaB: EventoAnalitico = {
      id_evento: 'evt_ast_reg_demanda_b',
      demanda_id: demandaIdB,
      projeto_id: projetoId,
      etapa_origem: EtapaOrigemEvidencia.DADOS,
      categoria: 'DADOS',
      tipo_evento: 'DADOS_ATIVO_REGISTRADO',
      ocorrido_em: new Date().toISOString(),
      executor: 'ANALISTA',
      artefato_origem_tipo: 'ATIVO_DADOS',
      artefato_origem_id: 'ast_demanda_b',
      payload: {
        ativoId: 'ast_demanda_b',
        nomeArquivo: 'tabela_b.csv',
        caminhoLocal: 'C:/dados/tabela_b.csv',
        formato: 'csv',
        tamanhoBytes: 1000,
        totalLinhas: 100,
        totalColunas: 3,
        hashSha256: 'hash_sha256_demanda_b_112233',
        versao: '1.0',
      },
      versao_contrato: '1.0',
    };

    await processarEventoUseCase.execute(eventoDemandaB);

    const evidenciasA = await evidenciaRepo.findByDemandaId(demandaIdA);
    const evidenciasB = await evidenciaRepo.findByDemandaId(demandaIdB);

    expect(evidenciasB).toHaveLength(1);
    expect(evidenciasB[0].titulo).toContain('tabela_b.csv');

    // Nenhuma evidência de B existe em A
    const titulosA = evidenciasA.map((e) => e.titulo);
    expect(titulosA).not.toContain(evidenciasB[0].titulo);

    // Logs segregados
    const logsA = await eventLogRepo.findByDemandaId(demandaIdA);
    const logsB = await eventLogRepo.findByDemandaId(demandaIdB);

    expect(logsB).toHaveLength(1);
    expect(logsB[0].id_evento).toBe('evt_ast_reg_demanda_b');
    expect(logsA.map((l) => l.id_evento)).not.toContain('evt_ast_reg_demanda_b');
  });

  // 5. OPERAÇÃO INVÁLIDA / FALHA NÃO PRODUZ EVIDÊNCIA FALSA
  it('5. operação inválida ou payload quebrado não produz evidência falsa', async () => {
    const totalEvidenciasAntes = (await evidenciaRepo.findByDemandaId(demandaIdA)).length;

    const eventoCorrompido: EventoAnalitico = {
      id_evento: 'evt_corrompido_falha',
      demanda_id: demandaIdA,
      projeto_id: projetoId,
      etapa_origem: EtapaOrigemEvidencia.DADOS,
      categoria: 'DADOS',
      tipo_evento: 'DADOS_ATIVO_REGISTRADO',
      ocorrido_em: new Date().toISOString(),
      executor: 'ANALISTA',
      payload: {
        // Sem hashSha256 nem métricas
        nomeArquivo: 'sem_dados.csv',
      },
      versao_contrato: '1.0',
    };

    const res = await processarEventoUseCase.execute(eventoCorrompido);
    expect(res.status_processamento).toBe('IGNORADO');
    expect(res.evidencia_gerada_id).toBeNull();

    // Contagem no banco permanece estritamente idêntica
    const totalEvidenciasDepois = (await evidenciaRepo.findByDemandaId(demandaIdA)).length;
    expect(totalEvidenciasDepois).toBe(totalEvidenciasAntes);
  });

  // 6. REPETIÇÃO INDEVIDA NÃO GERA DUPLICAÇÃO (IDEMPOTÊNCIA DETERMINÍSTICA)
  it('6. repetição da mesma operação com id_evento estável não duplica evidência', async () => {
    const totalEvidenciasAntes = (await evidenciaRepo.findByDemandaId(demandaIdA)).length;

    const eventoRepetido: EventoAnalitico = {
      id_evento: 'evt_ast_reg_repeticao_teste',
      demanda_id: demandaIdA,
      projeto_id: projetoId,
      etapa_origem: EtapaOrigemEvidencia.DADOS,
      categoria: 'DADOS',
      tipo_evento: 'DADOS_ATIVO_REGISTRADO',
      ocorrido_em: new Date().toISOString(),
      executor: 'ANALISTA',
      artefato_origem_tipo: 'ATIVO_DADOS',
      artefato_origem_id: 'ast_repeticao',
      payload: {
        ativoId: 'ast_repeticao',
        nomeArquivo: 'arquivo_idempotente.csv',
        caminhoLocal: 'C:/dados/arquivo_idempotente.csv',
        formato: 'csv',
        tamanhoBytes: 5000,
        totalLinhas: 50,
        totalColunas: 2,
        hashSha256: 'hash_sha256_idempotente_99999',
      },
      versao_contrato: '1.0',
    };

    // 1ª Execução -> Registra
    const res1 = await processarEventoUseCase.execute(eventoRepetido);
    expect(res1.status_processamento).toBe('REGISTRADO');
    expect(res1.ja_processado).toBe(false);

    // 2ª Execução (mesmo id_evento determinístico) -> Duplicado detectado
    const res2 = await processarEventoUseCase.execute(eventoRepetido);
    expect(res2.status_processamento).toBe('DUPLICADO');
    expect(res2.ja_processado).toBe(true);
    expect(res2.evidencia_gerada_id).toBe(res1.evidencia_gerada_id);

    // No banco de evidências, apenas 1 evidência nova foi criada
    const totalEvidenciasDepois = (await evidenciaRepo.findByDemandaId(demandaIdA)).length;
    expect(totalEvidenciasDepois).toBe(totalEvidenciasAntes + 1);
  });

  // 7. FUNCIONALIDADES EXISTENTES DO EVIDENCE CORE CONTINUAM FUNCIONANDO
  it('7. funcionalidades existentes do Evidence Core permanecem 100% operacionais', async () => {
    const resumoA = await consultarEvidenciasUseCase.execute({ demanda_id: demandaIdA });
    expect(resumoA.evidencias.length).toBeGreaterThan(0);
    expect(resumoA.metricas.total).toBe(resumoA.evidencias.length);
    expect(resumoA.metricas.por_tipo[TipoEvidenciaAnalitica.DADOS]).toBeGreaterThan(0);
    expect(resumoA.metricas.por_tipo[TipoEvidenciaAnalitica.QUALIDADE]).toBeGreaterThan(0);
  });
});
