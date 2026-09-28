import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import * as schema from '@/infrastructure/db/schema';
import { SqliteProjectRepository } from '@/infrastructure/db/repositories/project-repository';
import { SqliteDemandRepository } from '@/infrastructure/db/repositories/demand-repository';
import { SqliteAtivoDadosRepository } from '@/infrastructure/db/repositories/ativo-dados-repository';
import { SqliteDiagnosticosQualidadeRepository } from '@/infrastructure/db/repositories/sqlite-diagnosticos-qualidade-repository';
import { SqliteReceitaPreparacaoRepository } from '@/infrastructure/db/repositories/sqlite-receita-preparacao-repository';
import { SqliteDatasetAutorizadoRepository } from '@/infrastructure/db/repositories/sqlite-dataset-autorizado-repository';
import { FormatoArquivo } from '@/core/domain/enums/formato-arquivo';
import { StatusAtivoDados } from '@/core/domain/enums/status-ativo-dados';
import { CategoriaAtivoDados } from '@/core/domain/enums/categoria-ativo-dados';
import { StatusReceitaPreparacao } from '@/core/domain/enums/status-receita-preparacao';
import { StatusAutorizacaoDataset } from '@/core/domain/enums/status-autorizacao-dataset';
import { StatusExecucaoDiagnostico } from '@/core/domain/enums/status-execucao-diagnostico';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';

describe('Integration: Dataset Autorizado e Restrição Parcial Único VIGENTE (Subunidade 3.5A)', () => {
  let sqlite: Database.Database;
  let testDb: ReturnType<typeof drizzle<typeof schema>>;
  let projectRepo: SqliteProjectRepository;
  let demandRepo: SqliteDemandRepository;
  let assetRepo: SqliteAtivoDadosRepository;
  let diagRepo: SqliteDiagnosticosQualidadeRepository;
  let receitaRepo: SqliteReceitaPreparacaoRepository;
  let datasetRepo: SqliteDatasetAutorizadoRepository;

  const testProjectId = 'proj_auth_test';
  const testDemandId = 'dem_auth_test';
  const testDemandId2 = 'dem_auth_test_2';
  const assetId1 = 'asset_prep_v1';
  const assetId2 = 'asset_prep_v2';
  const diagId1 = 'diag_prep_v1';
  const diagId2 = 'diag_prep_v2';
  const receitaId = 'rec_prep_vendas';

  beforeEach(() => {
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
    diagRepo = new SqliteDiagnosticosQualidadeRepository(testDb as any);
    receitaRepo = new SqliteReceitaPreparacaoRepository(testDb as any);
    datasetRepo = new SqliteDatasetAutorizadoRepository(testDb as any);

    const now = new Date().toISOString();

    // 1. Projeto e Demandas
    projectRepo.create({
      id: testProjectId,
      nome: 'Projeto Homologação',
      descricao: 'Validação de autorizações e constraints',
      status: 'ATIVO',
      data_inicio: now,
      data_conclusao_prevista: null,
      data_conclusao_real: null,
      criado_em: now,
      atualizado_em: now,
    });

    demandRepo.create({
      id: testDemandId,
      projeto_id: testProjectId,
      titulo: 'Demanda Autorização Vendas',
      solicitacao_bruta: 'Autorizar dataset de vendas limpo',
      contexto: 'Contexto analítico',
      objetivo_inicial: 'Autorizar dataset para BI',
      prazo_esperado: null,
      restricoes_declaradas: null,
      estado: EstadoDemanda.DADOS_RECEBIDOS,
      data_conclusao: null,
      criado_em: now,
      atualizado_em: now,
    });

    demandRepo.create({
      id: testDemandId2,
      projeto_id: testProjectId,
      titulo: 'Demanda Secundária',
      solicitacao_bruta: 'Outra demanda para validação isolada',
      contexto: 'Contexto analítico 2',
      objetivo_inicial: 'Validar concorrência entre demandas',
      prazo_esperado: null,
      restricoes_declaradas: null,
      estado: EstadoDemanda.DADOS_RECEBIDOS,
      data_conclusao: null,
      criado_em: now,
      atualizado_em: now,
    });

    // 2. Ativos preparados
    assetRepo.create({
      id: assetId1,
      demanda_id: testDemandId,
      nome_arquivo: 'vendas_preparadas_v1.csv',
      caminho_local: '/data/vendas_preparadas_v1.csv',
      formato: FormatoArquivo.BASE_TRATADA,
      origem: 'Pipeline Preparação',
      descricao_conteudo: 'Dataset preparado v1',
      granularidade: 'Item',
      periodo_inicio: null,
      periodo_fim: null,
      versao: '1',
      substitui_ativo_id: null,
      tamanho_bytes: 2048,
      total_linhas: 100,
      total_colunas: 8,
      hash_sha256: 'hash_v1_123',
      status: StatusAtivoDados.ATIVO,
      categoria_ativo: CategoriaAtivoDados.PREPARADO_DERIVADO,
      schema_inferido: '{"colunas": ["id", "data", "valor"]}',
      data_recebimento: now,
      criado_em: now,
      atualizado_em: now,
    });

    assetRepo.create({
      id: assetId2,
      demanda_id: testDemandId,
      nome_arquivo: 'vendas_preparadas_v2.csv',
      caminho_local: '/data/vendas_preparadas_v2.csv',
      formato: FormatoArquivo.BASE_TRATADA,
      origem: 'Pipeline Preparação',
      descricao_conteudo: 'Dataset preparado v2 refinado',
      granularidade: 'Item',
      periodo_inicio: null,
      periodo_fim: null,
      versao: '2',
      substitui_ativo_id: assetId1,
      tamanho_bytes: 2100,
      total_linhas: 105,
      total_colunas: 9,
      hash_sha256: 'hash_v2_456',
      status: StatusAtivoDados.ATIVO,
      categoria_ativo: CategoriaAtivoDados.PREPARADO_DERIVADO,
      schema_inferido: '{"colunas": ["id", "data", "valor", "categoria"]}',
      data_recebimento: now,
      criado_em: now,
      atualizado_em: now,
    });

    // 3. Receita
    receitaRepo.create({
      id: receitaId,
      demanda_id: testDemandId,
      titulo: 'Pipeline Principal de Vendas',
      descricao: null,
      status: StatusReceitaPreparacao.CONCLUIDA,
      versao: 1,
      criado_em: now,
      atualizado_em: now,
    });

    // 4. Diagnósticos de Qualidade
    diagRepo.create({
      id: diagId1,
      ativo_dados_id: assetId1,
      demanda_id: testDemandId,
      iniciado_em: now,
      concluido_em: now,
      duracao_ms: 150,
      total_linhas_avaliadas: 100,
      total_colunas_avaliadas: 8,
      verificacoes_executadas: [],
      total_problemas_detectados: 0,
      status_execucao: StatusExecucaoDiagnostico.CONCLUIDO,
      erro_mensagem: null,
      resumo_metricas: { score_qualidade: 100 },
      criado_em: now,
      atualizado_em: now,
    });

    diagRepo.create({
      id: diagId2,
      ativo_dados_id: assetId2,
      demanda_id: testDemandId,
      iniciado_em: now,
      concluido_em: now,
      duracao_ms: 160,
      total_linhas_avaliadas: 105,
      total_colunas_avaliadas: 9,
      verificacoes_executadas: [],
      total_problemas_detectados: 0,
      status_execucao: StatusExecucaoDiagnostico.CONCLUIDO,
      erro_mensagem: null,
      resumo_metricas: { score_qualidade: 100 },
      criado_em: now,
      atualizado_em: now,
    });
  });

  describe('Índice Único Parcial (WHERE status = "VIGENTE")', () => {
    it('deve impedir a inserção de dois registros VIGENTES para a mesma demanda no SQLite', () => {
      const now = new Date().toISOString();
      const insertStmt = sqlite.prepare(`
        INSERT INTO datasets_autorizados (
          id, demanda_id, ativo_dados_id, diagnostico_qualidade_id, receita_preparacao_id,
          versao_rotulo, hash_sha256_snapshot, status, justificativa_autorizacao, autorizado_por_tipo,
          restricoes_aceitas_snapshot, autorizado_em
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      // 1ª inserção VIGENTE: deve passar
      insertStmt.run(
        'ds_auth_01',
        testDemandId,
        assetId1,
        diagId1,
        receitaId,
        '1.0-preparado',
        'hash_v1_123',
        'VIGENTE',
        'Justificativa de homologação do dataset versão 1.',
        'HUMANO',
        '[]',
        now
      );

      // 2ª inserção VIGENTE para a MESMA demanda: deve violar o índice parcial único
      expect(() => {
        insertStmt.run(
          'ds_auth_02',
          testDemandId,
          assetId2,
          diagId2,
          receitaId,
          '2.0-preparado',
          'hash_v2_456',
          'VIGENTE',
          'Segunda tentativa simultânea de manter dois vigentes.',
          'HUMANO',
          '[]',
          now
        );
      }).toThrow(/UNIQUE constraint failed/);
    });

    it('deve permitir múltiplos registros SUBSTITUIDO ou REVOGADO para a mesma demanda', () => {
      const now = new Date().toISOString();
      const insertStmt = sqlite.prepare(`
        INSERT INTO datasets_autorizados (
          id, demanda_id, ativo_dados_id, diagnostico_qualidade_id, receita_preparacao_id,
          versao_rotulo, hash_sha256_snapshot, status, justificativa_autorizacao, autorizado_por_tipo,
          restricoes_aceitas_snapshot, autorizado_em
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      // Inserção 1: SUBSTITUIDO
      insertStmt.run(
        'ds_sub_01',
        testDemandId,
        assetId1,
        diagId1,
        receitaId,
        '1.0-preparado',
        'hash_v1_123',
        'SUBSTITUIDO',
        'Versão 1 anterior substituída.',
        'HUMANO',
        '[]',
        now
      );

      // Inserção 2: SUBSTITUIDO (mesma demanda) -> deve ter sucesso
      insertStmt.run(
        'ds_sub_02',
        testDemandId,
        assetId1,
        diagId1,
        receitaId,
        '1.1-preparado',
        'hash_v1_123',
        'SUBSTITUIDO',
        'Versão 1.1 anterior também substituída.',
        'HUMANO',
        '[]',
        now
      );

      // Inserção 3: REVOGADO (mesma demanda) -> deve ter sucesso
      insertStmt.run(
        'ds_rev_01',
        testDemandId,
        assetId1,
        diagId1,
        receitaId,
        '1.2-preparado',
        'hash_v1_123',
        'REVOGADO',
        'Versão 1.2 revogada pelo analista.',
        'HUMANO',
        '[]',
        now
      );

      // Inserção 4: VIGENTE (mesma demanda) -> exatamente um vigente permitido
      insertStmt.run(
        'ds_vig_01',
        testDemandId,
        assetId2,
        diagId2,
        receitaId,
        '2.0-preparado',
        'hash_v2_456',
        'VIGENTE',
        'Versão 2 atualmente vigente com sucesso.',
        'HUMANO',
        '[]',
        now
      );

      const rows = sqlite.prepare('SELECT id, status FROM datasets_autorizados WHERE demanda_id = ?').all(testDemandId);
      expect(rows).toHaveLength(4);
    });

    it('deve permitir registros VIGENTES simultâneos para demandas DISTINTAS', async () => {
      const now = new Date().toISOString();
      const insertStmt = sqlite.prepare(`
        INSERT INTO datasets_autorizados (
          id, demanda_id, ativo_dados_id, diagnostico_qualidade_id, receita_preparacao_id,
          versao_rotulo, hash_sha256_snapshot, status, justificativa_autorizacao, autorizado_por_tipo,
          restricoes_aceitas_snapshot, autorizado_em
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      // Demanda 1 VIGENTE
      insertStmt.run(
        'ds_dem1_vig',
        testDemandId,
        assetId1,
        diagId1,
        receitaId,
        '1.0-preparado',
        'hash_v1_123',
        'VIGENTE',
        'Demanda 1 possui seu dataset autorizado.',
        'HUMANO',
        '[]',
        now
      );

      // Demanda 2 VIGENTE
      insertStmt.run(
        'ds_dem2_vig',
        testDemandId2,
        assetId1,
        diagId1,
        receitaId,
        '1.0-preparado',
        'hash_v1_123',
        'VIGENTE',
        'Demanda 2 possui seu dataset autorizado de forma independente.',
        'HUMANO',
        '[]',
        now
      );

      const vig1 = await datasetRepo.findVigenteByDemandId(testDemandId);
      const vig2 = await datasetRepo.findVigenteByDemandId(testDemandId2);
      expect(vig1).not.toBeNull();
      expect(vig2).not.toBeNull();
    });
  });

  describe('autorizarTransacional & Ciclo de Vida do Dataset', () => {
    it('deve autorizar v1 e depois substituir atomicamente por v2 mantendo exatamente 1 vigente', async () => {
      const now = new Date().toISOString();

      // 1. Autorização da v1
      const authV1 = await datasetRepo.autorizarTransacional({
        id: 'ds_v1',
        demanda_id: testDemandId,
        ativo_dados_id: assetId1,
        diagnostico_qualidade_id: diagId1,
        receita_preparacao_id: receitaId,
        versao_rotulo: '1.0-preparado',
        hash_sha256_snapshot: 'hash_v1_123',
        status: StatusAutorizacaoDataset.VIGENTE,
        justificativa_autorizacao: 'Primeira versão do dataset de vendas devidamente homologada.',
        autorizado_por_tipo: 'HUMANO',
        restricoes_aceitas_snapshot: '[]',
        autorizado_em: now,
        revogado_em: null,
        motivo_revogacao: null,
      });

      expect(authV1.status).toBe(StatusAutorizacaoDataset.VIGENTE);

      const vigente1 = await datasetRepo.findVigenteByDemandId(testDemandId);
      expect(vigente1?.id).toBe('ds_v1');

      // 2. Autorização transacional da v2
      const authV2 = await datasetRepo.autorizarTransacional({
        id: 'ds_v2',
        demanda_id: testDemandId,
        ativo_dados_id: assetId2,
        diagnostico_qualidade_id: diagId2,
        receita_preparacao_id: receitaId,
        versao_rotulo: '2.0-preparado',
        hash_sha256_snapshot: 'hash_v2_456',
        status: StatusAutorizacaoDataset.VIGENTE,
        justificativa_autorizacao: 'Segunda versão do dataset com adição do atributo categoria homologada.',
        autorizado_por_tipo: 'HUMANO',
        restricoes_aceitas_snapshot: '[]',
        autorizado_em: now,
        revogado_em: null,
        motivo_revogacao: null,
      });

      expect(authV2.status).toBe(StatusAutorizacaoDataset.VIGENTE);

      // O ativo vigente atual agora DEVE ser a v2
      const vigente2 = await datasetRepo.findVigenteByDemandId(testDemandId);
      expect(vigente2?.id).toBe('ds_v2');
      expect(vigente2?.versao_rotulo).toBe('2.0-preparado');

      // A v1 DEVE ter sido marcada como SUBSTITUIDO
      const v1Atualizada = await datasetRepo.findById('ds_v1');
      expect(v1Atualizada?.status).toBe(StatusAutorizacaoDataset.SUBSTITUIDO);
      expect(v1Atualizada?.motivo_revogacao).toContain("Substituído pela versão autorizada '2.0-preparado'");

      // Histórico completo deve conter ambos
      const historico = await datasetRepo.listarHistorico(testDemandId);
      expect(historico).toHaveLength(2);
    });

    it('deve revogar uma autorização vigente auditadamente', async () => {
      const now = new Date().toISOString();

      await datasetRepo.autorizarTransacional({
        id: 'ds_para_revogar',
        demanda_id: testDemandId,
        ativo_dados_id: assetId1,
        diagnostico_qualidade_id: diagId1,
        receita_preparacao_id: receitaId,
        versao_rotulo: '1.0-preparado',
        hash_sha256_snapshot: 'hash_v1_123',
        status: StatusAutorizacaoDataset.VIGENTE,
        justificativa_autorizacao: 'Homologação temporária para validação preliminar do analista.',
        autorizado_por_tipo: 'HUMANO',
        restricoes_aceitas_snapshot: '[]',
        autorizado_em: now,
        revogado_em: null,
        motivo_revogacao: null,
      });

      const revogado = await datasetRepo.revogar(
        'ds_para_revogar',
        'Revogado devido a inconsistência identificada posteriormente nas metas comerciais.',
        now
      );

      expect(revogado?.status).toBe(StatusAutorizacaoDataset.REVOGADO);
      expect(revogado?.motivo_revogacao).toContain('Revogado devido a inconsistência');

      // Após a revogação, nenhum dataset está VIGENTE para a demanda
      const vigente = await datasetRepo.findVigenteByDemandId(testDemandId);
      expect(vigente).toBeNull();
    });

    it('deve exigir justificativa mínima de 15 caracteres na homologação', async () => {
      const now = new Date().toISOString();
      await expect(
        datasetRepo.autorizarTransacional({
          id: 'ds_just_curta',
          demanda_id: testDemandId,
          ativo_dados_id: assetId1,
          diagnostico_qualidade_id: diagId1,
          receita_preparacao_id: receitaId,
          versao_rotulo: '1.0-preparado',
          hash_sha256_snapshot: 'hash_v1_123',
          status: StatusAutorizacaoDataset.VIGENTE,
          justificativa_autorizacao: 'Muito curto',
          autorizado_por_tipo: 'HUMANO',
          restricoes_aceitas_snapshot: '[]',
          autorizado_em: now,
          revogado_em: null,
          motivo_revogacao: null,
        })
      ).rejects.toThrow(/mínimo 15 caracteres explicativos/);
    });

    it('deve acionar ON DELETE RESTRICT ao tentar deletar ativo de dados referenciado em dataset autorizado', async () => {
      const now = new Date().toISOString();
      await datasetRepo.autorizarTransacional({
        id: 'ds_restrict_check',
        demanda_id: testDemandId,
        ativo_dados_id: assetId1,
        diagnostico_qualidade_id: diagId1,
        receita_preparacao_id: receitaId,
        versao_rotulo: '1.0-preparado',
        hash_sha256_snapshot: 'hash_v1_123',
        status: StatusAutorizacaoDataset.VIGENTE,
        justificativa_autorizacao: 'Homologação para teste rigoroso de integridade referencial RESTRICT.',
        autorizado_por_tipo: 'HUMANO',
        restricoes_aceitas_snapshot: '[]',
        autorizado_em: now,
        revogado_em: null,
        motivo_revogacao: null,
      });

      // Tentativa de exclusão física do ativo referenciado
      expect(() => {
        sqlite.prepare('DELETE FROM ativos_dados WHERE id = ?').run(assetId1);
      }).toThrow(/FOREIGN KEY constraint failed/);

      // Tentativa de exclusão física do diagnóstico de qualidade referenciado
      expect(() => {
        sqlite.prepare('DELETE FROM diagnosticos_qualidade WHERE id = ?').run(diagId1);
      }).toThrow(/FOREIGN KEY constraint failed/);

      // Tentativa de exclusão física da receita referenciada
      expect(() => {
        sqlite.prepare('DELETE FROM receitas_preparacao WHERE id = ?').run(receitaId);
      }).toThrow(/FOREIGN KEY constraint failed/);
    });
  });
});
