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
import { ReplaceDataAssetUseCase } from '@/core/use-cases/data-assets/replace-data-asset';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { FormatoArquivo } from '@/core/domain/enums/formato-arquivo';
import { StatusAtivoDados } from '@/core/domain/enums/status-ativo-dados';

describe('Integration: Substituição e Versionamento de Ativos de Dados (Unidade 3.3B)', () => {
  let sqlite: Database.Database;
  let testDb: ReturnType<typeof drizzle<typeof schema>>;
  let projectRepo: SqliteProjectRepository;
  let demandRepo: SqliteDemandRepository;
  let assetRepo: SqliteAtivoDadosRepository;
  let auditRepo: SqliteAuditRepository;

  const testProjectId = 'proj_integration_replace';
  const testDemandId = 'dem_integration_replace';
  const initialAssetId = 'ast_initial_v1';

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

    const now = new Date().toISOString();
    await projectRepo.create({
      id: testProjectId,
      nome: 'Projeto Teste Substituição',
      descricao: 'Descrição do projeto',
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
      titulo: 'Demanda Teste Substituição',
      solicitacao_bruta: 'Solicitação bruta para substituição',
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

    // Cria ativo inicial v1.0
    await assetRepo.create({
      id: initialAssetId,
      demanda_id: testDemandId,
      nome_arquivo: 'vendas_q1.csv',
      caminho_local: 'C:\\Dados\\vendas.csv',
      formato: FormatoArquivo.CSV,
      origem: 'Depto Financeiro',
      descricao_conteudo: 'Base inicial de vendas Q1',
      granularidade: 'Transacional',
      periodo_inicio: '2024-01-01',
      periodo_fim: '2024-03-31',
      data_recebimento: '2026-09-20',
      versao: '1.0',
      tamanho_bytes: 1024,
      total_linhas: 50,
      total_colunas: 4,
      hash_sha256: '1'.repeat(64),
      status: StatusAtivoDados.ATIVO,
      schema_inferido: JSON.stringify({ id: 'number', valor: 'number' }),
      substitui_ativo_id: null,
      criado_em: now,
      atualizado_em: now,
    });
  });

  afterEach(() => {
    sqlite.close();
  });

  it('deve executar substituição atômica: antigo -> SUBSTITUIDO, novo -> ATIVO com substitui_ativo_id e trilha de auditoria', async () => {
    const replaceUseCase = new ReplaceDataAssetUseCase(assetRepo, demandRepo);

    const resultado = await replaceUseCase.execute({
      demanda_id: testDemandId,
      ativo_antigo_id: initialAssetId,
      caminho_local: 'C:\\Dados\\vendas.csv', // mesmo caminho físico com conteúdo atualizado
      nome_arquivo: 'vendas_q2.csv',
      formato: FormatoArquivo.CSV,
      tamanho_bytes: 2048,
      total_linhas: 120,
      total_colunas: 4,
      hash_sha256: '2'.repeat(64), // hash diferente
      origem: 'Depto Financeiro - Atualizado Q2',
      versao: '1.1',
      justificativa: 'Substituição pelo fechamento consolidado do segundo trimestre',
      data_recebimento: '2026-09-26',
    });

    expect(resultado.ativoSubstituido).toBeDefined();
    expect(resultado.novoAtivo).toBeDefined();
    expect(resultado.novoAtivo.substitui_ativo_id).toBe(initialAssetId);
    expect(resultado.novoAtivo.versao).toBe('1.1');
    expect(resultado.novoAtivo.status).toBe(StatusAtivoDados.ATIVO);

    // 1. Verifica no banco o estado do ativo anterior
    const antigoNoBanco = await assetRepo.findById(initialAssetId);
    expect(antigoNoBanco).not.toBeNull();
    expect(antigoNoBanco?.status).toBe(StatusAtivoDados.SUBSTITUIDO);

    // 2. Verifica no banco o estado do novo ativo
    const novoNoBanco = await assetRepo.findById(resultado.novoAtivo.id);
    expect(novoNoBanco).not.toBeNull();
    expect(novoNoBanco?.status).toBe(StatusAtivoDados.ATIVO);
    expect(novoNoBanco?.substitui_ativo_id).toBe(initialAssetId);
    expect(novoNoBanco?.versao).toBe('1.1');

    // 3. Verifica auditoria gravada
    const trilha = await auditRepo.findByDemandaId(testDemandId);
    expect(trilha.length).toBeGreaterThanOrEqual(1);

    const eventoSubstituicao = trilha.find(
      (e) => e.tipo_evento === 'TRANSICAO_ESTADO' && e.entidade === 'AtivoDados'
    );
    expect(eventoSubstituicao).toBeDefined();
    expect(eventoSubstituicao?.justificativa).toBe('Substituição pelo fechamento consolidado do segundo trimestre');
    expect(eventoSubstituicao?.entidade_id).toBe(initialAssetId);

    const dadosAnteriores = JSON.parse(eventoSubstituicao!.dados_anteriores!);
    const dadosNovos = JSON.parse(eventoSubstituicao!.dados_novos!);
    expect(dadosAnteriores.status).toBe('ATIVO');
    expect(dadosNovos.status_anterior_atualizado).toBe('SUBSTITUIDO');
    expect(dadosNovos.substitui_ativo_id).toBe(initialAssetId);
    expect(dadosNovos.versao).toBe('1.1');

    // 4. Verifica listagem de ativos da demanda (ambos devem ser retornados pelo repositório)
    const todosAtivos = await assetRepo.findByDemandId(testDemandId);
    expect(todosAtivos).toHaveLength(2);
    const ativosVigentes = todosAtivos.filter((a) => a.status === StatusAtivoDados.ATIVO);
    const ativosSubstituidos = todosAtivos.filter((a) => a.status === StatusAtivoDados.SUBSTITUIDO);
    expect(ativosVigentes).toHaveLength(1);
    expect(ativosSubstituidos).toHaveLength(1);
    expect(ativosVigentes[0].id).toBe(resultado.novoAtivo.id);
    expect(ativosSubstituidos[0].id).toBe(initialAssetId);
  });

  it('deve bloquear substituição e abortar sem mutação se SHA-256 for idêntico', async () => {
    const replaceUseCase = new ReplaceDataAssetUseCase(assetRepo, demandRepo);

    await expect(
      replaceUseCase.execute({
        demanda_id: testDemandId,
        ativo_antigo_id: initialAssetId,
        caminho_local: 'C:\\Dados\\vendas.csv',
        nome_arquivo: 'vendas.csv',
        formato: FormatoArquivo.CSV,
        tamanho_bytes: 1024,
        total_linhas: 50,
        total_colunas: 4,
        hash_sha256: '1'.repeat(64), // SHA-256 idêntico ao inicial
        origem: 'Depto Financeiro',
        versao: '1.1',
        justificativa: 'Tentativa de substituição com mesmo arquivo físico',
        data_recebimento: '2026-09-26',
      })
    ).rejects.toThrow(/hash SHA-256 idêntico ao ativo atual/);

    // Comprova que o ativo anterior continua ATIVO e nenhum novo ativo foi criado
    const ativoNoBanco = await assetRepo.findById(initialAssetId);
    expect(ativoNoBanco?.status).toBe(StatusAtivoDados.ATIVO);

    const contagem = await assetRepo.countByDemandId(testDemandId);
    expect(contagem).toBe(1);

    const trilha = await auditRepo.findByDemandaId(testDemandId);
    expect(trilha).toHaveLength(0);
  });

  it('deve provocar rollback integral se a atualização concorrente detectar que o ativo não está mais ATIVO', async () => {
    // Altera manualmente o ativo inicial para SUBSTITUIDO fora do use case
    await assetRepo.update(initialAssetId, { status: StatusAtivoDados.SUBSTITUIDO });

    // Testa chamada direta do método replace do repositório
    const now = new Date().toISOString();
    const novoAtivo = {
      id: 'ast_novo_falha',
      demanda_id: testDemandId,
      nome_arquivo: 'vendas_q3.csv',
      caminho_local: 'C:\\Dados\\vendas.csv',
      formato: FormatoArquivo.CSV,
      origem: 'Depto Financeiro',
      descricao_conteudo: null,
      granularidade: null,
      periodo_inicio: null,
      periodo_fim: null,
      data_recebimento: '2026-09-26',
      versao: '1.2',
      tamanho_bytes: 3000,
      total_linhas: 150,
      total_colunas: 4,
      hash_sha256: '3'.repeat(64),
      status: StatusAtivoDados.ATIVO,
      schema_inferido: null,
      substitui_ativo_id: initialAssetId,
      criado_em: now,
      atualizado_em: now,
    };

    const eventoAuditoria = {
      id: 'aud_falha',
      demanda_id: testDemandId,
      entidade: 'AtivoDados' as const,
      entidade_id: initialAssetId,
      tipo_evento: 'TRANSICAO_ESTADO' as const,
      autor_tipo: 'HUMANO' as const,
      dados_anteriores: null,
      dados_novos: null,
      justificativa: 'Justificativa de teste',
      timestamp: now,
    };

    // Tentar executar replace diretamente sobre um ativo que não está ATIVO
    await expect(
      assetRepo.replace({
        antigoId: initialAssetId,
        novoAtivo,
        eventoAuditoria,
      })
    ).rejects.toThrow(/Falha na substituição atômica: O ativo anterior 'ast_initial_v1' não foi localizado ou não está no estado ATIVO/);

    // Rollback verificado: novo ativo NÃO deve ter sido persistido
    const novoNoBanco = await assetRepo.findById('ast_novo_falha');
    expect(novoNoBanco).toBeNull();

    // Rollback verificado: evento de auditoria NÃO deve ter sido gravado
    const trilha = await auditRepo.findByDemandaId(testDemandId);
    expect(trilha).toHaveLength(0);
  });
});
