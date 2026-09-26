import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import * as schema from '@/infrastructure/db/schema';
import { SqliteProjectRepository } from '@/infrastructure/db/repositories/project-repository';
import { SqliteDemandRepository } from '@/infrastructure/db/repositories/demand-repository';
import { SqliteAtivoDadosRepository } from '@/infrastructure/db/repositories/ativo-dados-repository';
import { SqliteAuditRepository } from '@/infrastructure/db/repositories/audit-repository';
import { LocalFileSystemAdapter } from '@/infrastructure/filesystem/local-file-system-adapter';
import { 
  InspectLocalFileUseCase, 
  RegisterDataAssetUseCase, 
  ListDataAssetsUseCase, 
  CheckAssetAccessibilityUseCase 
} from '@/core/use-cases/data-assets';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { FormatoArquivo } from '@/core/domain/enums/formato-arquivo';

describe('Integration: Fluxo Completo de Ativos de Dados (Unidade 3.3A)', () => {
  let sqlite: Database.Database;
  let testDb: ReturnType<typeof drizzle<typeof schema>>;
  let projectRepo: SqliteProjectRepository;
  let demandRepo: SqliteDemandRepository;
  let assetRepo: SqliteAtivoDadosRepository;
  let auditRepo: SqliteAuditRepository;
  let fsAdapter: LocalFileSystemAdapter;

  const testProjectId = 'proj_integration_assets';
  const testDemandId = 'dem_integration_assets';
  const sampleCsvPath = path.resolve(process.cwd(), 'tests', 'fixtures', 'synthetic-sample.csv');

  beforeEach(async () => {
    sqlite = new Database(':memory:');
    sqlite.pragma('foreign_keys = ON');

    testDb = drizzle(sqlite, { schema });
    const migrationsFolder = path.join(process.cwd(), 'drizzle');
    migrate(testDb, { migrationsFolder });

    projectRepo = new SqliteProjectRepository(testDb as any);
    demandRepo = new SqliteDemandRepository(testDb as any);
    assetRepo = new SqliteAtivoDadosRepository(testDb as any);
    auditRepo = new SqliteAuditRepository(testDb as any);
    fsAdapter = new LocalFileSystemAdapter();

    const now = new Date().toISOString();
    await projectRepo.create({
      id: testProjectId,
      nome: 'Projeto Teste Ativos',
      descricao: 'Descrição do projeto de teste',
      status: 'ATIVO',
      data_inicio: now,
      data_conclusao_prevista: null,
      data_conclusao_real: null,
      criado_em: now,
      atualizado_em: now,
    });

    await demandRepo.create({
      id: testDemandId,
      projeto_id: testProjectId,
      titulo: 'Demanda Teste Ativos',
      solicitacao_bruta: 'Solicitação bruta para teste',
      contexto: null,
      objetivo_inicial: null,
      prazo_esperado: null,
      restricoes_declaradas: null,
      estado: EstadoDemanda.EM_CLARIFICACAO,
      estado_anterior: null,
      criado_em: now,
      atualizado_em: now,
      data_conclusao: null,
    });
  });

  afterEach(() => {
    sqlite.close();
  });

  it('FASE 1 (Inspeção): deve inspecionar arquivo real sintético e comprovar ZERO persistência no SQLite', async () => {
    const inspectUseCase = new InspectLocalFileUseCase(fsAdapter);

    // 1. Executa a inspeção
    const resultado = await inspectUseCase.execute({
      caminhoLocal: sampleCsvPath,
    });

    expect(resultado.sucesso).toBe(true);
    expect(resultado.fisico).toBeDefined();
    expect(resultado.fisico?.nomeArquivo).toBe('synthetic-sample.csv');
    expect(resultado.fisico?.formato).toBe(FormatoArquivo.CSV);
    expect(resultado.conteudo?.totalLinhas).toBeGreaterThan(0);
    expect(resultado.conteudo?.totalColunas).toBeGreaterThan(0);
    expect(resultado.fisico?.hashSha256).toHaveLength(64);

    // 2. Prova de isolamento: NENHUM registro gravado em ativos_dados
    const totalPersistido = await assetRepo.countByDemandId(testDemandId);
    expect(totalPersistido).toBe(0);
  });

  it('FASE 2 (Confirmação): deve persistir AtivoDados canônico e registrar na Trilha de Auditoria com Opção 1', async () => {
    const inspectUseCase = new InspectLocalFileUseCase(fsAdapter);
    const registerUseCase = new RegisterDataAssetUseCase(assetRepo, demandRepo, auditRepo);
    const listUseCase = new ListDataAssetsUseCase(assetRepo);
    const checkAccessUseCase = new CheckAssetAccessibilityUseCase(assetRepo, fsAdapter);

    // 1. Inspeciona previamente
    const inspecao = await inspectUseCase.execute({ caminhoLocal: sampleCsvPath });
    expect(inspecao.sucesso).toBe(true);

    const fisico = inspecao.fisico!;
    const conteudo = inspecao.conteudo!;

    // 2. Confirmação deliberada com metadados humanos
    const novoAtivo = await registerUseCase.execute({
      demanda_id: testDemandId,
      caminho_local: fisico.caminhoNormalizado,
      nome_arquivo: fisico.nomeArquivo,
      formato: fisico.formato,
      tamanho_bytes: fisico.tamanhoBytes,
      total_linhas: conteudo.totalLinhas ?? 0,
      total_colunas: conteudo.totalColunas ?? 0,
      hash_sha256: fisico.hashSha256,
      schema_inferido: conteudo.schemaInferido ? JSON.stringify(conteudo.schemaInferido) : null,
      origem: 'Depto Financeiro Matriz',
      descricao_conteudo: 'Base sintética de clientes e transações',
      granularidade: 'Transacional',
      periodo_inicio: '2024-01-01',
      periodo_fim: '2024-12-31',
      data_recebimento: '2026-09-26',
      versao: '1.0',
    });

    expect(novoAtivo.id).toBeDefined();
    expect(novoAtivo.status).toBe('ATIVO');

    // 3. Verifica persistência no SQLite
    const ativos = await listUseCase.execute(testDemandId);
    expect(ativos).toHaveLength(1);
    expect(ativos[0].id).toBe(novoAtivo.id);
    expect(ativos[0].nome_arquivo).toBe('synthetic-sample.csv');
    expect(ativos[0].origem).toBe('Depto Financeiro Matriz');

    // 4. Verifica auditoria gravada na Opção 1
    const trilha = await auditRepo.findByDemandaId(testDemandId);
    expect(trilha).toHaveLength(1);
    expect(trilha[0].entidade).toBe('AtivoDados');
    expect(trilha[0].entidade_id).toBe(novoAtivo.id);
    expect(trilha[0].tipo_evento).toBe('CRIACAO');
    expect(trilha[0].demanda_id).toBe(testDemandId);

    // 5. Verifica checagem de acessibilidade física
    const accessCheck = await checkAccessUseCase.execute(novoAtivo.id);
    expect(accessCheck.existe).toBe(true);
    expect(accessCheck.legivel).toBe(true);
  });
});
