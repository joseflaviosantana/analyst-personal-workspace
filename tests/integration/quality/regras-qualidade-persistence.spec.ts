import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import * as schema from '@/infrastructure/db/schema';
import { SqliteRegrasQualidadeRepository } from '@/infrastructure/db/repositories/sqlite-regras-qualidade-repository';
import { SqliteProblemasQualidadeRepository } from '@/infrastructure/db/repositories/sqlite-problemas-qualidade-repository';
import { SqliteDiagnosticosQualidadeRepository } from '@/infrastructure/db/repositories/sqlite-diagnosticos-qualidade-repository';
import { RegraQualidade, RegraSnapshot } from '@/core/domain/entities/regra-qualidade';
import { ProblemaQualidade } from '@/core/domain/entities/problema-qualidade';
import { DiagnosticoQualidade } from '@/core/domain/entities/diagnostico-qualidade';
import { StatusRegraQualidade } from '@/core/domain/enums/status-regra-qualidade';
import { TipoRegraQualidade } from '@/core/domain/enums/tipo-regra-qualidade';
import { CategoriaProblemaQualidade } from '@/core/domain/enums/categoria-problema-qualidade';
import { SeveridadeProblema } from '@/core/domain/enums/severidade-problema';
import { StatusProblemaQualidade } from '@/core/domain/enums/status-problema-qualidade';
import { StatusExecucaoDiagnostico } from '@/core/domain/enums/status-execucao-diagnostico';

describe('RegrasQualidadePersistence (Integração SQLite / Drizzle — Subunidade 3.4B)', () => {
  let sqlite: InstanceType<typeof Database>;
  let testDb: ReturnType<typeof drizzle>;
  let regrasRepo: SqliteRegrasQualidadeRepository;
  let problemasRepo: SqliteProblemasQualidadeRepository;
  let diagnosticosRepo: SqliteDiagnosticosQualidadeRepository;

  const projetoId = 'proj-integ-34b';
  const demandaId = 'dem-integ-34b';
  const ativoId = 'ativo-integ-34b';

  beforeAll(() => {
    sqlite = new Database(':memory:');
    sqlite.pragma('foreign_keys = ON');
    testDb = drizzle(sqlite, { schema });

    const migrationsFolder = path.join(process.cwd(), 'drizzle');
    migrate(testDb, { migrationsFolder });

    regrasRepo = new SqliteRegrasQualidadeRepository(testDb as any);
    problemasRepo = new SqliteProblemasQualidadeRepository(testDb as any);
    diagnosticosRepo = new SqliteDiagnosticosQualidadeRepository(testDb as any);

    // Insere dados-base: projeto, demanda e ativo de dados
    const agora = new Date().toISOString();
    sqlite.prepare(`
      INSERT INTO projetos (id, nome, status, criado_em, atualizado_em)
      VALUES (?, ?, ?, ?, ?)
    `).run(projetoId, 'Projeto Teste 3.4B', 'ATIVO', agora, agora);

    sqlite.prepare(`
      INSERT INTO demandas (id, projeto_id, titulo, solicitacao_bruta, estado, criado_em, atualizado_em)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(demandaId, projetoId, 'Demanda Teste 3.4B', 'Solicitação', 'DADOS_RECEBIDOS', agora, agora);

    sqlite.prepare(`
      INSERT INTO ativos_dados (id, demanda_id, nome_arquivo, caminho_local, formato, hash_sha256, status, data_recebimento, criado_em, atualizado_em)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(ativoId, demandaId, 'base-v1.csv', 'C:\\data\\base-v1.csv', 'CSV', 'hash34b', 'ATIVO', agora, agora, agora);
  });

  afterAll(() => {
    sqlite.close();
  });

  it('deve validar integridade de foreign keys do SQLite após aplicação das migrations', () => {
    const fkErrors = sqlite.pragma('foreign_key_check') as unknown[];
    expect(fkErrors).toHaveLength(0);
  });

  it('deve persistir, atualizar e listar regras de qualidade no SQLite', async () => {
    const agora = new Date().toISOString();
    const regraId = 'regra-pers-1';

    const regra: RegraQualidade = {
      id: regraId,
      ativo_dados_id: ativoId,
      tipo: TipoRegraQualidade.VALOR_MIN_MAX,
      coluna: 'valor',
      colunas: ['valor'],
      nome: 'Valor Mínimo 100',
      descricao: 'Valores de transação devem ser superiores a 100',
      parametros: {
        tipo: TipoRegraQualidade.VALOR_MIN_MAX,
        minimo: 100,
        maximo: 50000,
      },
      status: StatusRegraQualidade.ATIVA,
      versao: 1,
      criado_em: agora,
      atualizado_em: agora,
    };

    await regrasRepo.create(regra);

    const salva = await regrasRepo.findById(regraId);
    expect(salva).toBeDefined();
    expect(salva?.id).toBe(regraId);
    expect(salva?.status).toBe(StatusRegraQualidade.ATIVA);
    expect(salva?.versao).toBe(1);
    expect(salva?.colunas).toEqual(['valor']);

    // Atualização com incremento de versão
    const regraAtualizada: RegraQualidade = {
      ...salva!,
      parametros: {
        tipo: TipoRegraQualidade.VALOR_MIN_MAX,
        minimo: 200,
        maximo: 50000,
      },
      versao: 2,
      atualizado_em: new Date().toISOString(),
    };

    await regrasRepo.update(regraAtualizada);

    const recarregada = await regrasRepo.findById(regraId);
    expect(recarregada?.versao).toBe(2);
    expect((recarregada?.parametros as any).minimo).toBe(200);

    const lista = await regrasRepo.findByAssetId(ativoId, StatusRegraQualidade.ATIVA);
    expect(lista).toHaveLength(1);
    expect(lista[0].id).toBe(regraId);
  });

  it('deve persistir um problema manual sem diagnóstico vinculado (diagnostico_id = null) preservando integridade', async () => {
    const agora = new Date().toISOString();
    const probId = 'prob-manual-sem-diag';

    const problemaManual: ProblemaQualidade = {
      id: probId,
      diagnostico_id: null, // Anulável
      ativo_dados_id: ativoId,
      demanda_id: demandaId,
      categoria: CategoriaProblemaQualidade.ANOMALIA_MANUAL_DECLARADA,
      titulo: 'Coluna data_vencimento com formato truncado',
      descricao: 'Data truncada observada manualmente em lote importado',
      tabela_afetada: 'base-v1.csv',
      coluna_afetada: 'data_vencimento',
      total_linhas_afetadas: 5,
      percentual_linhas_afetadas: 5,
      amostra_evidencias: [{ numeroLinha: 14, coluna: 'data_vencimento', detalhe: 'Data com 8 dígitos sem separador' }],
      severidade: SeveridadeProblema.PENDENTE,
      impacto_calculo: null,
      acao_deliberada: null,
      justificativa_deliberacao: null,
      deliberado_por_humano: false,
      deliberado_em: null,
      status: StatusProblemaQualidade.ABERTO,
      origem_deteccao: 'MANUAL',
      regra_id: null,
      regra_snapshot: null,
      criado_em: agora,
      atualizado_em: agora,
    };

    await problemasRepo.create(problemaManual);

    const salvo = await problemasRepo.findById(probId);
    expect(salvo).toBeDefined();
    expect(salvo?.diagnostico_id).toBeNull();
    expect(salvo?.origem_deteccao).toBe('MANUAL');
    expect(salvo?.severidade).toBe(SeveridadeProblema.PENDENTE);

    // Integridade de foreign keys confirmada
    const fkErrors = sqlite.pragma('foreign_key_check') as unknown[];
    expect(fkErrors).toHaveLength(0);
  });

  it('deve persistir atomicamente na transação SQLite diagnóstico e problemas gerados por regras com snapshots imutáveis', async () => {
    const agora = new Date().toISOString();
    const diagId = 'diag-regras-tx-1';
    const regraId = 'regra-pers-1';

    // 1. Cria diagnóstico inicial
    await diagnosticosRepo.create({
      id: diagId,
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

    const snapshot: RegraSnapshot = {
      id: regraId,
      nome: 'Valor Mínimo 100',
      tipo: TipoRegraQualidade.VALOR_MIN_MAX,
      versao: 2,
      coluna: 'valor',
      colunas: ['valor'],
      parametros: {
        tipo: TipoRegraQualidade.VALOR_MIN_MAX,
        minimo: 200,
        maximo: 50000,
      },
    };

    const problemaRegra: ProblemaQualidade = {
      id: 'prob-violacao-regra-tx',
      diagnostico_id: diagId,
      ativo_dados_id: ativoId,
      demanda_id: demandaId,
      categoria: CategoriaProblemaQualidade.REGRA_NEGOCIO_VIOLADA,
      titulo: 'Violação da Regra: "Valor Mínimo 100"',
      descricao: '2 registros com valor abaixo de 200',
      tabela_afetada: 'base-v1.csv',
      coluna_afetada: 'valor',
      total_linhas_afetadas: 2,
      percentual_linhas_afetadas: 4.0,
      amostra_evidencias: [{ numeroLinha: 10, coluna: 'valor', detalhe: 'Valor abaixo do mínimo estipulado (200)' }],
      severidade: SeveridadeProblema.PENDENTE,
      impacto_calculo: null,
      acao_deliberada: null,
      justificativa_deliberacao: null,
      deliberado_por_humano: false,
      deliberado_em: null,
      status: StatusProblemaQualidade.ABERTO,
      origem_deteccao: 'AUTOMATICA',
      regra_id: regraId,
      regra_snapshot: snapshot,
      criado_em: agora,
      atualizado_em: agora,
    };

    await diagnosticosRepo.salvarConclusaoTransacional(
      diagId,
      {
        concluido_em: agora,
        duracao_ms: 120,
        total_linhas_avaliadas: 50,
        total_colunas_avaliadas: 5,
        total_problemas_detectados: 1,
        status_execucao: StatusExecucaoDiagnostico.CONCLUIDO,
      },
      [problemaRegra]
    );

    const probNoBanco = await problemasRepo.findById('prob-violacao-regra-tx');
    expect(probNoBanco).toBeDefined();
    expect(probNoBanco?.regra_id).toBe(regraId);
    expect(probNoBanco?.regra_snapshot).toBeDefined();
    expect(probNoBanco?.regra_snapshot?.versao).toBe(2);
    expect(probNoBanco?.regra_snapshot?.nome).toBe('Valor Mínimo 100');

    // Integridade de foreign keys confirmada
    const fkErrors = sqlite.pragma('foreign_key_check') as unknown[];
    expect(fkErrors).toHaveLength(0);
  });
});
