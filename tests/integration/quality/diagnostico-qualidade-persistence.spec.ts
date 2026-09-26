import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import * as schema from '@/infrastructure/db/schema';
import { SqliteDiagnosticosQualidadeRepository } from '@/infrastructure/db/repositories/sqlite-diagnosticos-qualidade-repository';
import { SqliteProblemasQualidadeRepository } from '@/infrastructure/db/repositories/sqlite-problemas-qualidade-repository';
import { DiagnosticoQualidade } from '@/core/domain/entities/diagnostico-qualidade';
import { ProblemaQualidade } from '@/core/domain/entities/problema-qualidade';
import { CategoriaProblemaQualidade } from '@/core/domain/enums/categoria-problema-qualidade';
import { SeveridadeProblema } from '@/core/domain/enums/severidade-problema';
import { StatusProblemaQualidade } from '@/core/domain/enums/status-problema-qualidade';
import { StatusExecucaoDiagnostico } from '@/core/domain/enums/status-execucao-diagnostico';
import { StatusVerificacaoQualidade } from '@/core/domain/enums/status-verificacao-qualidade';

describe('DiagnosticoQualidadePersistence (Integração SQLite / Drizzle)', () => {
  let sqlite: InstanceType<typeof Database>;
  let testDb: ReturnType<typeof drizzle>;
  let diagnosticosRepo: SqliteDiagnosticosQualidadeRepository;
  let problemasRepo: SqliteProblemasQualidadeRepository;

  const projetoId = 'proj-test-quality';
  const demandaId = 'dem-test-quality';
  const ativoId = 'ativo-test-quality';

  beforeAll(() => {
    // Cria banco em memória e roda migrations
    sqlite = new Database(':memory:');
    sqlite.pragma('foreign_keys = ON');
    testDb = drizzle(sqlite, { schema });

    const migrationsFolder = path.join(process.cwd(), 'drizzle');
    migrate(testDb, { migrationsFolder });

    diagnosticosRepo = new SqliteDiagnosticosQualidadeRepository(testDb as any);
    problemasRepo = new SqliteProblemasQualidadeRepository(testDb as any);

    // Insere dados-base: projeto, demanda e ativo de dados
    const agora = new Date().toISOString();
    sqlite.prepare(`
      INSERT INTO projetos (id, nome, status, criado_em, atualizado_em)
      VALUES (?, ?, ?, ?, ?)
    `).run(projetoId, 'Projeto Teste Qualidade', 'ATIVO', agora, agora);

    sqlite.prepare(`
      INSERT INTO demandas (id, projeto_id, titulo, solicitacao_bruta, estado, criado_em, atualizado_em)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(demandaId, projetoId, 'Demanda Teste Qualidade', 'Solicitação', 'DADOS_RECEBIDOS', agora, agora);

    sqlite.prepare(`
      INSERT INTO ativos_dados (id, demanda_id, nome_arquivo, caminho_local, formato, hash_sha256, status, data_recebimento, criado_em, atualizado_em)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(ativoId, demandaId, 'base-v1.csv', 'C:\\data\\base-v1.csv', 'CSV', 'hash123', 'ATIVO', agora, agora, agora);
  });

  afterAll(() => {
    sqlite.close();
  });

  it('deve persistir um diagnóstico completo e seus problemas no SQLite', async () => {
    const diagId = 'diag-pers-1';
    const agora = new Date().toISOString();

    const diagnostico: DiagnosticoQualidade = {
      id: diagId,
      ativo_dados_id: ativoId,
      demanda_id: demandaId,
      iniciado_em: agora,
      concluido_em: agora,
      duracao_ms: 125,
      total_linhas_avaliadas: 1000,
      total_colunas_avaliadas: 10,
      verificacoes_executadas: [
        {
          categoria: CategoriaProblemaQualidade.NULOS_BRANCOS,
          nome: 'Detecção de Nulos',
          status: StatusVerificacaoQualidade.EXECUTADA_COM_PROBLEMAS,
          totalProblemas: 1,
        },
      ],
      total_problemas_detectados: 1,
      status_execucao: StatusExecucaoDiagnostico.CONCLUIDO,
      erro_mensagem: null,
      resumo_metricas: { nulosPorColuna: { cpf: 15 } },
      criado_em: agora,
      atualizado_em: agora,
    };

    await diagnosticosRepo.create(diagnostico);

    const problema: ProblemaQualidade = {
      id: 'prob-pers-1',
      diagnostico_id: diagId,
      ativo_dados_id: ativoId,
      demanda_id: demandaId,
      categoria: CategoriaProblemaQualidade.NULOS_BRANCOS,
      titulo: 'Nulos em CPF',
      descricao: '15 nulos na coluna CPF',
      tabela_afetada: 'base-v1.csv',
      coluna_afetada: 'cpf',
      total_linhas_afetadas: 15,
      percentual_linhas_afetadas: 1.5,
      amostra_evidencias: [{ numeroLinha: 12, coluna: 'cpf', valorObservado: '[VAZIO]', detalhe: 'Ausente' }],
      severidade: SeveridadeProblema.PENDENTE,
      impacto_calculo: 'Quebra relacionamentos',
      acao_deliberada: null,
      justificativa_deliberacao: null,
      deliberado_por_humano: false,
      deliberado_em: null,
      status: StatusProblemaQualidade.ABERTO,
      origem_deteccao: 'AUTOMATICA',
      criado_em: agora,
      atualizado_em: agora,
    };

    await problemasRepo.createMany([problema]);

    // Consulta e validação
    const salvo = await diagnosticosRepo.findById(diagId);
    expect(salvo).toBeDefined();
    expect(salvo?.id).toBe(diagId);
    expect(salvo?.status_execucao).toBe(StatusExecucaoDiagnostico.CONCLUIDO);
    expect(salvo?.verificacoes_executadas).toHaveLength(1);
    expect(salvo?.verificacoes_executadas[0].categoria).toBe(CategoriaProblemaQualidade.NULOS_BRANCOS);

    const probsSalvos = await problemasRepo.findByDiagnosticId(diagId);
    expect(probsSalvos).toHaveLength(1);
    expect(probsSalvos[0].id).toBe('prob-pers-1');
    expect(probsSalvos[0].severidade).toBe(SeveridadeProblema.PENDENTE);
    expect(probsSalvos[0].amostra_evidencias).toHaveLength(1);
  });

  it('deve preservar o histórico e NÃO sobrescrever o diagnóstico anterior em nova execução', async () => {
    const diagId2 = 'diag-pers-2';
    const timestampPosterior = new Date(Date.now() + 5000).toISOString();

    const segundoDiagnostico: DiagnosticoQualidade = {
      id: diagId2,
      ativo_dados_id: ativoId,
      demanda_id: demandaId,
      iniciado_em: timestampPosterior,
      concluido_em: timestampPosterior,
      duracao_ms: 80,
      total_linhas_avaliadas: 1000,
      total_colunas_avaliadas: 10,
      verificacoes_executadas: [],
      total_problemas_detectados: 0,
      status_execucao: StatusExecucaoDiagnostico.CONCLUIDO,
      erro_mensagem: null,
      resumo_metricas: {},
      criado_em: timestampPosterior,
      atualizado_em: timestampPosterior,
    };

    await diagnosticosRepo.create(segundoDiagnostico);

    // Deve conter os 2 diagnósticos na lista histórica
    const historico = await diagnosticosRepo.findByAssetId(ativoId);
    expect(historico).toHaveLength(2);

    // O mais recente deve ser diagId2
    const ultimo = await diagnosticosRepo.findLatestByAssetId(ativoId);
    expect(ultimo?.id).toBe(diagId2);

    // O primeiro diagnóstico (diagId1) continua perfeitamente intacto
    const primeiro = await diagnosticosRepo.findById('diag-pers-1');
    expect(primeiro).toBeDefined();
    expect(primeiro?.total_problemas_detectados).toBe(1);
  });

  it('deve executar salvarConclusaoTransacional atomicamente no SQLite, persistindo problemas e atualizando diagnóstico', async () => {
    const diagIdTx = 'diag-pers-tx-1';
    const agora = new Date().toISOString();

    // 1. Cria diagnóstico inicial com status EM_ANDAMENTO
    const diagnosticoInicial: DiagnosticoQualidade = {
      id: diagIdTx,
      ativo_dados_id: ativoId,
      demanda_id: demandaId,
      iniciado_em: agora,
      concluido_em: null,
      duracao_ms: 0,
      total_linhas_avaliadas: 0,
      total_colunas_avaliadas: 0,
      verificacoes_executadas: [],
      total_problemas_detectados: 0,
      status_execucao: StatusExecucaoDiagnostico.EM_ANDAMENTO,
      erro_mensagem: null,
      resumo_metricas: null,
      criado_em: agora,
      atualizado_em: agora,
    };
    await diagnosticosRepo.create(diagnosticoInicial);

    const problemaTx: ProblemaQualidade = {
      id: 'prob-pers-tx-1',
      diagnostico_id: diagIdTx,
      ativo_dados_id: ativoId,
      demanda_id: demandaId,
      categoria: CategoriaProblemaQualidade.NUMEROS_INVALIDOS,
      titulo: 'Número corrompido',
      descricao: 'Valor alfanumérico em campo numérico',
      tabela_afetada: 'base-v1.csv',
      coluna_afetada: 'valor',
      total_linhas_afetadas: 1,
      percentual_linhas_afetadas: 0.1,
      amostra_evidencias: [{ numeroLinha: 5, coluna: 'valor', valorObservado: '[TEXTO_NAO_NUMERICO: 10 caracteres]', detalhe: 'Formato numérico incompatível' }],
      severidade: SeveridadeProblema.PENDENTE,
      impacto_calculo: 'Erro em soma',
      acao_deliberada: null,
      justificativa_deliberacao: null,
      deliberado_por_humano: false,
      deliberado_em: null,
      status: StatusProblemaQualidade.ABERTO,
      origem_deteccao: 'AUTOMATICA',
      criado_em: agora,
      atualizado_em: agora,
    };

    // Executa a transação atômica
    const resultado = await diagnosticosRepo.salvarConclusaoTransacional(
      diagIdTx,
      {
        concluido_em: agora,
        duracao_ms: 150,
        total_linhas_avaliadas: 500,
        total_colunas_avaliadas: 5,
        total_problemas_detectados: 1,
        status_execucao: StatusExecucaoDiagnostico.CONCLUIDO,
      },
      [problemaTx]
    );

    expect(resultado.diagnostico.status_execucao).toBe(StatusExecucaoDiagnostico.CONCLUIDO);
    expect(resultado.problemas).toHaveLength(1);

    // Consulta no banco para confirmar persistência atômica
    const diagNoBanco = await diagnosticosRepo.findById(diagIdTx);
    expect(diagNoBanco?.status_execucao).toBe(StatusExecucaoDiagnostico.CONCLUIDO);
    expect(diagNoBanco?.total_problemas_detectados).toBe(1);

    const probsNoBanco = await problemasRepo.findByDiagnosticId(diagIdTx);
    expect(probsNoBanco).toHaveLength(1);
    expect(probsNoBanco[0].id).toBe('prob-pers-tx-1');
  });

  it('deve realizar rollback atômico integral no SQLite se a transação de conclusão falhar, impedindo problemas órfãos', async () => {
    const diagIdRollback = 'diag-pers-rollback';
    const agora = new Date().toISOString();

    // 1. Cria diagnóstico que permanece EM_ANDAMENTO
    await diagnosticosRepo.create({
      id: diagIdRollback,
      ativo_dados_id: ativoId,
      demanda_id: demandaId,
      iniciado_em: agora,
      concluido_em: null,
      duracao_ms: 0,
      total_linhas_avaliadas: 0,
      total_colunas_avaliadas: 0,
      verificacoes_executadas: [],
      total_problemas_detectados: 0,
      status_execucao: StatusExecucaoDiagnostico.EM_ANDAMENTO,
      erro_mensagem: null,
      resumo_metricas: null,
      criado_em: agora,
      atualizado_em: agora,
    });

    // 2. Dois problemas com mesmo ID para provocar violação de Primary Key no SQLite dentro do lote
    const problemaValido: ProblemaQualidade = {
      id: 'prob-duplicado-pk',
      diagnostico_id: diagIdRollback,
      ativo_dados_id: ativoId,
      demanda_id: demandaId,
      categoria: CategoriaProblemaQualidade.DATAS_INVALIDAS,
      titulo: 'Data corrompida 1',
      descricao: 'Data inválida 1',
      tabela_afetada: 'base-v1.csv',
      coluna_afetada: 'data',
      total_linhas_afetadas: 1,
      percentual_linhas_afetadas: 0.1,
      amostra_evidencias: [],
      severidade: SeveridadeProblema.PENDENTE,
      impacto_calculo: null,
      acao_deliberada: null,
      justificativa_deliberacao: null,
      deliberado_por_humano: false,
      deliberado_em: null,
      status: StatusProblemaQualidade.ABERTO,
      origem_deteccao: 'AUTOMATICA',
      criado_em: agora,
      atualizado_em: agora,
    };

    const problemaConflitante: ProblemaQualidade = {
      ...problemaValido,
      titulo: 'Data corrompida 2 com mesma PK para forçar falha no lote',
    };

    // A transação atômica deve ser abortada por violação de constraint no SQLite
    await expect(
      diagnosticosRepo.salvarConclusaoTransacional(
        diagIdRollback,
        {
          concluido_em: agora,
          status_execucao: StatusExecucaoDiagnostico.CONCLUIDO,
        },
        [problemaValido, problemaConflitante]
      )
    ).rejects.toThrow(/UNIQUE constraint failed/);

    // Confirmação de Rollback: ZERO problemas foram persistidos no SQLite para este diagnóstico
    const probNoBanco = await problemasRepo.findById('prob-duplicado-pk');
    expect(probNoBanco).toBeNull();

    const probsPorDiag = await problemasRepo.findByDiagnosticId(diagIdRollback);
    expect(probsPorDiag).toHaveLength(0);

    // O diagnóstico NÃO foi atualizado para CONCLUIDO na transação abortada
    const diagNoBanco = await diagnosticosRepo.findById(diagIdRollback);
    expect(diagNoBanco?.status_execucao).toBe(StatusExecucaoDiagnostico.EM_ANDAMENTO);
  });
});
