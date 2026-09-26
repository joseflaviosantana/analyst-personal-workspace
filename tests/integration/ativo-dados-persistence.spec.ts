import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import * as schema from '@/infrastructure/db/schema';
import { SqliteProjectRepository } from '@/infrastructure/db/repositories/project-repository';
import { SqliteDemandRepository } from '@/infrastructure/db/repositories/demand-repository';
import { SqliteAtivoDadosRepository } from '@/infrastructure/db/repositories/ativo-dados-repository';
import { FormatoArquivo } from '@/core/domain/enums/formato-arquivo';
import { StatusAtivoDados } from '@/core/domain/enums/status-ativo-dados';
import { AtivoDados } from '@/core/domain/entities/ativo-dados';

describe('Integration: Persistência de Ativos de Dados (Bloco 3.1)', () => {
  let sqlite: Database.Database;
  let testDb: ReturnType<typeof drizzle<typeof schema>>;
  let projectRepo: SqliteProjectRepository;
  let demandRepo: SqliteDemandRepository;
  let assetRepo: SqliteAtivoDadosRepository;

  const testProjectId = 'proj_test_assets';
  const testDemandId = 'dem_test_assets';

  beforeEach(async () => {
    sqlite = new Database(':memory:');
    sqlite.pragma('foreign_keys = ON');
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('synchronous = NORMAL');
    sqlite.pragma('busy_timeout = 5000');

    testDb = drizzle(sqlite, { schema });

    const migrationsFolder = path.join(process.cwd(), 'drizzle');
    migrate(testDb, { migrationsFolder });

    projectRepo = new SqliteProjectRepository(testDb as any);
    demandRepo = new SqliteDemandRepository(testDb as any);
    assetRepo = new SqliteAtivoDadosRepository(testDb as any);

    // Setup: cria projeto e demanda base para integridade referencial
    const now = new Date().toISOString();
    await projectRepo.create({
      id: testProjectId,
      nome: 'Projeto Teste Ativos de Dados',
      descricao: 'Validação de persistência de ativos locais',
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
      titulo: 'Demanda de Vendas 2026',
      solicitacao_bruta: 'Recebemos a planilha vendas.xlsx do cliente.',
      contexto: 'Contexto analítico',
      objetivo_inicial: 'Validar integridade de arquivos locais',
      prazo_esperado: null,
      restricoes_declaradas: null,
      estado: 'NOVA' as any,
      criado_em: now,
      atualizado_em: now,
      data_conclusao: null,
    });
  });

  afterEach(() => {
    sqlite.close();
  });

  it('deve persistir um ativo de dados com todos os metadados canônicos', async () => {
    const now = new Date().toISOString();
    const asset: AtivoDados = {
      id: 'asset_001',
      demanda_id: testDemandId,
      nome_arquivo: 'vendas_2026.xlsx',
      caminho_local: 'C:\\Clientes\\Alfa\\vendas_2026.xlsx',
      formato: FormatoArquivo.XLSX,
      origem: 'Sistema de Faturamento SAP',
      descricao_conteudo: 'Base bruta de notas fiscais emitidas',
      granularidade: 'Item de nota fiscal',
      periodo_inicio: '2026-01-01',
      periodo_fim: '2026-06-30',
      versao: 'v1.0',
      tamanho_bytes: 5242880,
      total_linhas: 48200,
      total_colunas: 24,
      hash_sha256: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
      status: StatusAtivoDados.CADASTRADO,
      schema_inferido: JSON.stringify([
        { nome: 'NumeroNF', tipoAparente: 'NUMERO' },
        { nome: 'DataEmissao', tipoAparente: 'DATA' },
      ]),
      data_recebimento: now,
      criado_em: now,
      atualizado_em: now,
    };

    const created = await assetRepo.create(asset);
    expect(created.id).toBe('asset_001');

    const retrieved = await assetRepo.findById('asset_001');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.nome_arquivo).toBe('vendas_2026.xlsx');
    expect(retrieved?.caminho_local).toBe('C:\\Clientes\\Alfa\\vendas_2026.xlsx');
    expect(retrieved?.formato).toBe(FormatoArquivo.XLSX);
    expect(retrieved?.tamanho_bytes).toBe(5242880);
    expect(retrieved?.total_linhas).toBe(48200);
    expect(retrieved?.total_colunas).toBe(24);
    expect(retrieved?.hash_sha256).toBe(asset.hash_sha256);
    expect(retrieved?.status).toBe(StatusAtivoDados.CADASTRADO);
  });

  it('deve listar ativos vinculados a uma demanda e ordenar por criado_em desc', async () => {
    const t1 = new Date(Date.now() - 2000).toISOString();
    const t2 = new Date().toISOString();

    await assetRepo.create({
      id: 'asset_csv_001',
      demanda_id: testDemandId,
      nome_arquivo: 'clientes.csv',
      caminho_local: 'C:\\Clientes\\Alfa\\clientes.csv',
      formato: FormatoArquivo.CSV,
      origem: 'CRM Hubspot',
      descricao_conteudo: 'Cadastro de clientes',
      granularidade: 'Cliente',
      periodo_inicio: null,
      periodo_fim: null,
      versao: null,
      tamanho_bytes: 102400,
      total_linhas: 1200,
      total_colunas: 8,
      hash_sha256: 'hash_csv_clientes_1234567890abcdef1234567890abcdef1234567890abcdef',
      status: StatusAtivoDados.ATIVO,
      schema_inferido: null,
      data_recebimento: t1,
      criado_em: t1,
      atualizado_em: t1,
    });

    await assetRepo.create({
      id: 'asset_xlsx_002',
      demanda_id: testDemandId,
      nome_arquivo: 'metas.xlsx',
      caminho_local: 'C:\\Clientes\\Alfa\\metas.xlsx',
      formato: FormatoArquivo.XLSX,
      origem: 'Planejamento Financeiro',
      descricao_conteudo: 'Metas orçadas 2026',
      granularidade: 'Filial por mês',
      periodo_inicio: '2026-01-01',
      periodo_fim: '2026-12-31',
      versao: 'final',
      tamanho_bytes: 204800,
      total_linhas: 240,
      total_colunas: 6,
      hash_sha256: 'hash_xlsx_metas_1234567890abcdef1234567890abcdef1234567890abcdef',
      status: StatusAtivoDados.ATIVO,
      schema_inferido: null,
      data_recebimento: t2,
      criado_em: t2,
      atualizado_em: t2,
    });

    const assets = await assetRepo.findByDemandId(testDemandId);
    expect(assets).toHaveLength(2);
    expect(assets[0].id).toBe('asset_xlsx_002'); // Mais recente primeiro
    expect(assets[1].id).toBe('asset_csv_001');

    const total = await assetRepo.countByDemandId(testDemandId);
    expect(total).toBe(2);
  });

  it('deve buscar ativo pelo caminho local exato', async () => {
    const caminho = 'D:\\Dados\\transacoes.tsv';
    const now = new Date().toISOString();

    await assetRepo.create({
      id: 'asset_tsv_003',
      demanda_id: testDemandId,
      nome_arquivo: 'transacoes.tsv',
      caminho_local: caminho,
      formato: FormatoArquivo.TSV,
      origem: null,
      descricao_conteudo: null,
      granularidade: null,
      periodo_inicio: null,
      periodo_fim: null,
      versao: null,
      tamanho_bytes: 50000,
      total_linhas: 500,
      total_colunas: 5,
      hash_sha256: 'hash_tsv_transacoes_1234567890abcdef1234567890abcdef1234567890abcdef',
      status: StatusAtivoDados.CADASTRADO,
      schema_inferido: null,
      data_recebimento: now,
      criado_em: now,
      atualizado_em: now,
    });

    const found = await assetRepo.findByPath(caminho);
    expect(found).not.toBeNull();
    expect(found?.id).toBe('asset_tsv_003');
    expect(found?.formato).toBe(FormatoArquivo.TSV);
  });

  it('deve atualizar metadados e status de um ativo existente', async () => {
    const now = new Date().toISOString();
    await assetRepo.create({
      id: 'asset_update_001',
      demanda_id: testDemandId,
      nome_arquivo: 'dados.csv',
      caminho_local: 'C:\\temp\\dados.csv',
      formato: FormatoArquivo.CSV,
      origem: null,
      descricao_conteudo: null,
      granularidade: null,
      periodo_inicio: null,
      periodo_fim: null,
      versao: null,
      tamanho_bytes: 1000,
      total_linhas: 10,
      total_colunas: 2,
      hash_sha256: 'hash_inicial_1234567890abcdef1234567890abcdef1234567890abcdef1234',
      status: StatusAtivoDados.EM_INSPECAO,
      schema_inferido: null,
      data_recebimento: now,
      criado_em: now,
      atualizado_em: now,
    });

    const updated = await assetRepo.update('asset_update_001', {
      status: StatusAtivoDados.ATIVO,
      total_linhas: 15000,
      total_colunas: 12,
      granularidade: 'Linha por fatura',
      schema_inferido: JSON.stringify([{ nome: 'ID', tipoAparente: 'NUMERO' }]),
    });

    expect(updated).not.toBeNull();
    expect(updated?.status).toBe(StatusAtivoDados.ATIVO);
    expect(updated?.total_linhas).toBe(15000);
    expect(updated?.total_colunas).toBe(12);
    expect(updated?.granularidade).toBe('Linha por fatura');
    expect(updated?.schema_inferido).toContain('NUMERO');
  });

  it('deve preservar o histórico marcando ativo como SUBSTITUIDO em vez de exclusão física', async () => {
    const now = new Date().toISOString();
    await assetRepo.create({
      id: 'asset_obsoleto_001',
      demanda_id: testDemandId,
      nome_arquivo: 'versao_antiga.csv',
      caminho_local: 'C:\\temp\\versao_antiga.csv',
      formato: FormatoArquivo.CSV,
      origem: null,
      descricao_conteudo: null,
      granularidade: null,
      periodo_inicio: null,
      periodo_fim: null,
      versao: 'v1.0',
      tamanho_bytes: 10,
      total_linhas: 1,
      total_colunas: 1,
      hash_sha256: 'hash_subst_1234567890abcdef1234567890abcdef1234567890abcdef12345678',
      status: StatusAtivoDados.ATIVO,
      schema_inferido: null,
      data_recebimento: now,
      criado_em: now,
      atualizado_em: now,
    });

    // Desativação auditável via atualização de status (soft status)
    const updated = await assetRepo.update('asset_obsoleto_001', {
      status: StatusAtivoDados.SUBSTITUIDO,
    });

    expect(updated).not.toBeNull();
    expect(updated?.status).toBe(StatusAtivoDados.SUBSTITUIDO);

    // O registro permanece no banco para garantir auditabilidade e integridade referencial
    const check = await assetRepo.findById('asset_obsoleto_001');
    expect(check).not.toBeNull();
    expect(check?.status).toBe(StatusAtivoDados.SUBSTITUIDO);
  });

  it('deve excluir ativos em cascata quando a demanda correspondente for excluída', async () => {
    const now = new Date().toISOString();
    await assetRepo.create({
      id: 'asset_cascade_001',
      demanda_id: testDemandId,
      nome_arquivo: 'cascata.csv',
      caminho_local: 'C:\\temp\\cascata.csv',
      formato: FormatoArquivo.CSV,
      origem: null,
      descricao_conteudo: null,
      granularidade: null,
      periodo_inicio: null,
      periodo_fim: null,
      versao: null,
      tamanho_bytes: 10,
      total_linhas: 1,
      total_colunas: 1,
      hash_sha256: 'hash_cascata_1234567890abcdef1234567890abcdef1234567890abcdef1234',
      status: StatusAtivoDados.CADASTRADO,
      schema_inferido: null,
      data_recebimento: now,
      criado_em: now,
      atualizado_em: now,
    });

    // Exclui a demanda pai
    sqlite.prepare('DELETE FROM demandas WHERE id = ?').run(testDemandId);

    // O ativo deve ter sido excluído via ON DELETE CASCADE
    const check = await assetRepo.findById('asset_cascade_001');
    expect(check).toBeNull();
  });
});
