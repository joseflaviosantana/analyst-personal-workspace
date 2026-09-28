import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import * as schema from '@/infrastructure/db/schema';
import { SqliteProjectRepository } from '@/infrastructure/db/repositories/project-repository';
import { SqliteDemandRepository } from '@/infrastructure/db/repositories/demand-repository';
import { SqliteAtivoDadosRepository } from '@/infrastructure/db/repositories/ativo-dados-repository';
import { SqliteProblemasQualidadeRepository } from '@/infrastructure/db/repositories/sqlite-problemas-qualidade-repository';
import { SqliteReceitaPreparacaoRepository } from '@/infrastructure/db/repositories/sqlite-receita-preparacao-repository';
import { SqliteEtapaTransformacaoRepository } from '@/infrastructure/db/repositories/sqlite-etapa-transformacao-repository';
import { SqliteLinhagemAtivosRepository } from '@/infrastructure/db/repositories/sqlite-linhagem-ativos-repository';
import { FormatoArquivo } from '@/core/domain/enums/formato-arquivo';
import { StatusAtivoDados } from '@/core/domain/enums/status-ativo-dados';
import { CategoriaAtivoDados } from '@/core/domain/enums/categoria-ativo-dados';
import { StatusReceitaPreparacao } from '@/core/domain/enums/status-receita-preparacao';
import { StatusEtapaTransformacao } from '@/core/domain/enums/status-etapa-transformacao';
import { CapacidadeFerramenta } from '@/core/domain/enums/capacidade-ferramenta';
import { TipoOperacaoPreparacao } from '@/core/domain/enums/tipo-operacao-preparacao';
import { PapelEntradaLinhagem } from '@/core/domain/enums/papel-entrada-linhagem';
import { CategoriaProblemaQualidade } from '@/core/domain/enums/categoria-problema-qualidade';
import { SeveridadeProblema } from '@/core/domain/enums/severidade-problema';
import { StatusProblemaQualidade } from '@/core/domain/enums/status-problema-qualidade';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';

describe('Integration: Persistência de Preparação e Lineage (Subunidade 3.5A)', () => {
  let sqlite: Database.Database;
  let testDb: ReturnType<typeof drizzle<typeof schema>>;
  let projectRepo: SqliteProjectRepository;
  let demandRepo: SqliteDemandRepository;
  let assetRepo: SqliteAtivoDadosRepository;
  let problemaRepo: SqliteProblemasQualidadeRepository;
  let receitaRepo: SqliteReceitaPreparacaoRepository;
  let etapaRepo: SqliteEtapaTransformacaoRepository;
  let linhagemRepo: SqliteLinhagemAtivosRepository;

  const testProjectId = 'proj_prep_test';
  const testDemandId = 'dem_prep_test';
  const rawAssetId = 'asset_raw_01';
  const preparedAssetId = 'asset_prep_01';
  const problemaId = 'prob_qual_01';

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
    problemaRepo = new SqliteProblemasQualidadeRepository(testDb as any);
    receitaRepo = new SqliteReceitaPreparacaoRepository(testDb as any);
    etapaRepo = new SqliteEtapaTransformacaoRepository(testDb as any);
    linhagemRepo = new SqliteLinhagemAtivosRepository(testDb as any);

    const now = new Date().toISOString();

    // 1. Setup Projeto e Demanda
    projectRepo.create({
      id: testProjectId,
      nome: 'Projeto Teste Preparação',
      descricao: 'Validação de persistência da subunidade 3.5A',
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
      titulo: 'Demanda de Engenharia e Limpeza de Dados',
      solicitacao_bruta: 'Consolidar e limpar arquivos brutos de vendas',
      contexto: 'Contexto analítico para BI',
      objetivo_inicial: 'Gerar dataset único e higienizado',
      prazo_esperado: null,
      restricoes_declaradas: null,
      estado: EstadoDemanda.DADOS_RECEBIDOS,
      data_conclusao: null,
      criado_em: now,
      atualizado_em: now,
    });

    // 2. Setup Ativos (Bruto e Preparado)
    assetRepo.create({
      id: rawAssetId,
      demanda_id: testDemandId,
      nome_arquivo: 'raw_vendas.csv',
      caminho_local: '/data/raw_vendas.csv',
      formato: FormatoArquivo.CSV,
      origem: 'ERP',
      descricao_conteudo: 'Insumo bruto recebido',
      granularidade: 'Item',
      periodo_inicio: null,
      periodo_fim: null,
      versao: '1',
      substitui_ativo_id: null,
      tamanho_bytes: 2048,
      total_linhas: 50,
      total_colunas: 6,
      hash_sha256: 'hash_raw_123',
      status: StatusAtivoDados.ATIVO,
      categoria_ativo: CategoriaAtivoDados.BRUTO_RECEBIDO,
      schema_inferido: null,
      data_recebimento: now,
      criado_em: now,
      atualizado_em: now,
    });

    assetRepo.create({
      id: preparedAssetId,
      demanda_id: testDemandId,
      nome_arquivo: 'clean_vendas.csv',
      caminho_local: '/data/clean_vendas.csv',
      formato: FormatoArquivo.BASE_TRATADA,
      origem: 'Pipeline Preparação',
      descricao_conteudo: 'Artefato derivado limpo',
      granularidade: 'Item',
      periodo_inicio: null,
      periodo_fim: null,
      versao: '1',
      substitui_ativo_id: null,
      tamanho_bytes: 1024,
      total_linhas: 48,
      total_colunas: 6,
      hash_sha256: 'hash_prep_456',
      status: StatusAtivoDados.ATIVO,
      categoria_ativo: CategoriaAtivoDados.PREPARADO_DERIVADO,
      schema_inferido: null,
      data_recebimento: now,
      criado_em: now,
      atualizado_em: now,
    });

    // 3. Setup Problema de Qualidade
    problemaRepo.create({
      id: problemaId,
      diagnostico_id: null,
      ativo_dados_id: rawAssetId,
      demanda_id: testDemandId,
      categoria: CategoriaProblemaQualidade.NULOS_BRANCOS,
      titulo: 'Valores unitários nulos',
      descricao: 'Valores unitários nulos identificados na carga bruta',
      tabela_afetada: 'vendas',
      coluna_afetada: 'valor_unitario',
      total_linhas_afetadas: 2,
      percentual_linhas_afetadas: 4.0,
      amostra_evidencias: [],
      severidade: SeveridadeProblema.ALTA,
      impacto_calculo: null,
      acao_deliberada: null,
      justificativa_deliberacao: null,
      deliberado_por_humano: false,
      deliberado_em: null,
      status: StatusProblemaQualidade.ABERTO,
      origem_deteccao: 'AUTOMATICA',
      criado_em: now,
      atualizado_em: now,
    });
  });

  describe('ReceitaPreparacao & EtapasTransformacao', () => {
    it('deve persistir uma receita de preparação e suas etapas', async () => {
      const now = new Date().toISOString();
      const receita = await receitaRepo.create({
        id: 'rec_vendas',
        demanda_id: testDemandId,
        titulo: 'Receita de Higienização de Vendas',
        descricao: 'Tratamento de nulos e tipagem de campos',
        status: StatusReceitaPreparacao.RASCUNHO,
        versao: 1,
        criado_em: now,
        atualizado_em: now,
      });

      expect(receita.id).toBe('rec_vendas');
      expect(receita.status).toBe(StatusReceitaPreparacao.RASCUNHO);

      const etapa1 = await etapaRepo.create({
        id: 'etapa_1',
        receita_id: 'rec_vendas',
        ordem: 1,
        tipo_operacao: TipoOperacaoPreparacao.TRATAR_NULOS,
        descricao: 'Filtro de Registros Nulos',
        capacidade_ferramenta: CapacidadeFerramenta.MOTOR_SQL,
        ferramenta_nome: 'DuckDB',
        ferramenta_versao: '0.10.0',
        especificacao_tecnica: 'Filtrar linhas com valor_unitario IS NOT NULL',
        status: StatusEtapaTransformacao.PLANEJADA,
        justificativa: null,
        criado_em: now,
        atualizado_em: now,
      });

      expect(etapa1.id).toBe('etapa_1');
      expect(etapa1.ordem).toBe(1);

      const etapas = await etapaRepo.findByReceitaId('rec_vendas');
      expect(etapas).toHaveLength(1);
      expect(etapas[0].descricao).toBe('Filtro de Registros Nulos');
    });

    it('deve reordenar etapas de uma receita com integridade', async () => {
      const now = new Date().toISOString();
      await receitaRepo.create({
        id: 'rec_reordena',
        demanda_id: testDemandId,
        titulo: 'Receita Teste Reordenação',
        descricao: null,
        status: StatusReceitaPreparacao.RASCUNHO,
        versao: 1,
        criado_em: now,
        atualizado_em: now,
      });

      await etapaRepo.create({
        id: 'etapa_a',
        receita_id: 'rec_reordena',
        ordem: 1,
        tipo_operacao: TipoOperacaoPreparacao.CONVERTER_TIPO,
        descricao: 'Etapa A',
        capacidade_ferramenta: CapacidadeFerramenta.MOTOR_M_POWER_QUERY,
        ferramenta_nome: 'Power Query',
        ferramenta_versao: null,
        especificacao_tecnica: null,
        status: StatusEtapaTransformacao.PLANEJADA,
        justificativa: null,
        criado_em: now,
        atualizado_em: now,
      });

      await etapaRepo.create({
        id: 'etapa_b',
        receita_id: 'rec_reordena',
        ordem: 2,
        tipo_operacao: TipoOperacaoPreparacao.REMOVER_DUPLICIDADES,
        descricao: 'Etapa B',
        capacidade_ferramenta: CapacidadeFerramenta.MOTOR_M_POWER_QUERY,
        ferramenta_nome: 'Power Query',
        ferramenta_versao: null,
        especificacao_tecnica: null,
        status: StatusEtapaTransformacao.PLANEJADA,
        justificativa: null,
        criado_em: now,
        atualizado_em: now,
      });

      await etapaRepo.reordenar('rec_reordena', [
        { id: 'etapa_a', ordem: 2 },
        { id: 'etapa_b', ordem: 1 },
      ]);

      const reordenadas = await etapaRepo.findByReceitaId('rec_reordena');
      expect(reordenadas[0].id).toBe('etapa_b');
      expect(reordenadas[0].ordem).toBe(1);
      expect(reordenadas[1].id).toBe('etapa_a');
      expect(reordenadas[1].ordem).toBe(2);
    });

    it('deve associar e desassociar etapas a problemas de qualidade (relação N:M)', async () => {
      const now = new Date().toISOString();
      await receitaRepo.create({
        id: 'rec_assoc',
        demanda_id: testDemandId,
        titulo: 'Receita com Associação',
        descricao: null,
        status: StatusReceitaPreparacao.RASCUNHO,
        versao: 1,
        criado_em: now,
        atualizado_em: now,
      });

      await etapaRepo.create({
        id: 'etapa_trata_nulo',
        receita_id: 'rec_assoc',
        ordem: 1,
        tipo_operacao: TipoOperacaoPreparacao.TRATAR_NULOS,
        descricao: 'Tratamento de Nulos',
        capacidade_ferramenta: CapacidadeFerramenta.MOTOR_SQL,
        ferramenta_nome: 'DuckDB',
        ferramenta_versao: null,
        especificacao_tecnica: null,
        status: StatusEtapaTransformacao.PLANEJADA,
        justificativa: null,
        criado_em: now,
        atualizado_em: now,
      });

      await etapaRepo.vincularProblema('etapa_trata_nulo', problemaId);

      const problemasDaEtapa = await etapaRepo.listarProblemasPorEtapa('etapa_trata_nulo');
      expect(problemasDaEtapa).toEqual([problemaId]);

      const etapasDoProblema = await etapaRepo.listarEtapasPorProblema(problemaId);
      expect(etapasDoProblema).toEqual(['etapa_trata_nulo']);

      await etapaRepo.desvincularProblema('etapa_trata_nulo', problemaId);
      const problemasPosDesvinculo = await etapaRepo.listarProblemasPorEtapa('etapa_trata_nulo');
      expect(problemasPosDesvinculo).toEqual([]);
    });

    it('deve permitir deleteDraftOnly em rascunhos sem etapas executadas', async () => {
      const now = new Date().toISOString();
      await receitaRepo.create({
        id: 'rec_draft',
        demanda_id: testDemandId,
        titulo: 'Receita Rascunho Descartável',
        descricao: null,
        status: StatusReceitaPreparacao.RASCUNHO,
        versao: 1,
        criado_em: now,
        atualizado_em: now,
      });

      await etapaRepo.create({
        id: 'etapa_draft',
        receita_id: 'rec_draft',
        ordem: 1,
        tipo_operacao: TipoOperacaoPreparacao.CONVERTER_TIPO,
        descricao: 'Etapa Planejada',
        capacidade_ferramenta: CapacidadeFerramenta.MOTOR_SQL,
        ferramenta_nome: 'DuckDB',
        ferramenta_versao: null,
        especificacao_tecnica: null,
        status: StatusEtapaTransformacao.PLANEJADA,
        justificativa: null,
        criado_em: now,
        atualizado_em: now,
      });

      const deleted = await receitaRepo.deleteDraftOnly('rec_draft');
      expect(deleted).toBe(true);

      const findRec = await receitaRepo.findById('rec_draft');
      expect(findRec).toBeNull();

      const findEtapa = await etapaRepo.findById('etapa_draft');
      expect(findEtapa).toBeNull();
    });

    it('deve impedir deleteDraftOnly se a etapa já tiver sido executada fisicamente', async () => {
      const now = new Date().toISOString();
      await receitaRepo.create({
        id: 'rec_executada',
        demanda_id: testDemandId,
        titulo: 'Receita Executada',
        descricao: null,
        status: StatusReceitaPreparacao.RASCUNHO,
        versao: 1,
        criado_em: now,
        atualizado_em: now,
      });

      await etapaRepo.create({
        id: 'etapa_executada',
        receita_id: 'rec_executada',
        ordem: 1,
        tipo_operacao: TipoOperacaoPreparacao.CONVERTER_TIPO,
        descricao: 'Etapa com Execução Física',
        capacidade_ferramenta: CapacidadeFerramenta.MOTOR_SQL,
        ferramenta_nome: 'DuckDB',
        ferramenta_versao: null,
        especificacao_tecnica: null,
        status: StatusEtapaTransformacao.EXECUTADA,
        justificativa: null,
        criado_em: now,
        atualizado_em: now,
      });

      await expect(receitaRepo.deleteDraftOnly('rec_executada')).rejects.toThrow(
        /executada\(s\) ou validada\(s\)/
      );

      await expect(etapaRepo.deleteDraftOnly('etapa_executada')).rejects.toThrow(
        /Apenas etapas com status PLANEJADA podem ser excluídas fisicamente/
      );
    });

    it('deve permitir cancelar etapas executadas de forma auditada', async () => {
      const now = new Date().toISOString();
      await receitaRepo.create({
        id: 'rec_cancelamento',
        demanda_id: testDemandId,
        titulo: 'Receita com Etapa Cancelada',
        descricao: null,
        status: StatusReceitaPreparacao.EM_EXECUCAO,
        versao: 1,
        criado_em: now,
        atualizado_em: now,
      });

      await etapaRepo.create({
        id: 'etapa_para_cancelar',
        receita_id: 'rec_cancelamento',
        ordem: 1,
        tipo_operacao: TipoOperacaoPreparacao.AGREGACAO_RESUMO,
        descricao: 'Etapa que se tornou obsoleta',
        capacidade_ferramenta: CapacidadeFerramenta.SCRIPT_NOTEBOOK,
        ferramenta_nome: 'Pandas',
        ferramenta_versao: null,
        especificacao_tecnica: null,
        status: StatusEtapaTransformacao.EXECUTADA,
        justificativa: null,
        criado_em: now,
        atualizado_em: now,
      });

      const cancelada = await etapaRepo.cancelar(
        'etapa_para_cancelar',
        'Etapa descontinuada por mudança no critério de agregação solicitado pelo negócio.'
      );

      expect(cancelada).not.toBeNull();
      expect(cancelada?.status).toBe(StatusEtapaTransformacao.CANCELADA);
      expect(cancelada?.descricao).toContain('[CANCELADA]: Etapa descontinuada por mudança');
    });
  });

  describe('Grafo de Linhagem e Integridade Referencial', () => {
    it('deve registrar arestas direcionadas e consultar origens e destinos com seus papéis', async () => {
      const now = new Date().toISOString();
      await linhagemRepo.registrarVinculo({
        id: 'edge_vendas_01',
        demanda_id: testDemandId,
        ativo_origem_id: rawAssetId,
        ativo_destino_id: preparedAssetId,
        papel_entrada: PapelEntradaLinhagem.ORIGEM_UNICA,
        etapa_transformacao_id: null,
        criado_em: now,
      });

      const origens = await linhagemRepo.obterOrigens(preparedAssetId);
      expect(origens).toHaveLength(1);
      expect(origens[0].ativo.id).toBe(rawAssetId);
      expect(origens[0].ativo.categoria_ativo).toBe(CategoriaAtivoDados.BRUTO_RECEBIDO);
      expect(origens[0].papel).toBe(PapelEntradaLinhagem.ORIGEM_UNICA);

      const destinos = await linhagemRepo.obterDestinos(rawAssetId);
      expect(destinos).toHaveLength(1);
      expect(destinos[0].id).toBe(preparedAssetId);
      expect(destinos[0].categoria_ativo).toBe(CategoriaAtivoDados.PREPARADO_DERIVADO);
    });

    it('deve rejeitar auto-laços (self-loops) na linhagem', async () => {
      const now = new Date().toISOString();
      await expect(
        linhagemRepo.registrarVinculo({
          id: 'edge_self_loop',
          demanda_id: testDemandId,
          ativo_origem_id: rawAssetId,
          ativo_destino_id: rawAssetId,
          papel_entrada: PapelEntradaLinhagem.ORIGEM_UNICA,
          etapa_transformacao_id: null,
          criado_em: now,
        })
      ).rejects.toThrow(/não pode ser idêntico ao ativo de destino/);
    });

    it('deve detectar e rejeitar ciclos no grafo direcionado (anti-loop)', async () => {
      const now = new Date().toISOString();

      // Cria terceiro ativo para encadeamento A -> B -> C
      await assetRepo.create({
        id: 'asset_terceiro',
        demanda_id: testDemandId,
        nome_arquivo: 'final_vendas.csv',
        caminho_local: '/data/final_vendas.csv',
        formato: FormatoArquivo.BASE_TRATADA,
        origem: 'Pipeline',
        descricao_conteudo: 'Ativo C final',
        granularidade: 'Item',
        periodo_inicio: null,
        periodo_fim: null,
        versao: '1',
        substitui_ativo_id: null,
        tamanho_bytes: 512,
        total_linhas: 48,
        total_colunas: 6,
        hash_sha256: 'hash_c_789',
        status: StatusAtivoDados.ATIVO,
        categoria_ativo: CategoriaAtivoDados.PREPARADO_DERIVADO,
        schema_inferido: null,
        data_recebimento: now,
        criado_em: now,
        atualizado_em: now,
      });

      // A -> B
      await linhagemRepo.registrarVinculo({
        id: 'edge_a_b',
        demanda_id: testDemandId,
        ativo_origem_id: rawAssetId,
        ativo_destino_id: preparedAssetId,
        papel_entrada: PapelEntradaLinhagem.FONTE_PRINCIPAL,
        etapa_transformacao_id: null,
        criado_em: now,
      });

      // B -> C
      await linhagemRepo.registrarVinculo({
        id: 'edge_b_c',
        demanda_id: testDemandId,
        ativo_origem_id: preparedAssetId,
        ativo_destino_id: 'asset_terceiro',
        papel_entrada: PapelEntradaLinhagem.FONTE_PRINCIPAL,
        etapa_transformacao_id: null,
        criado_em: now,
      });

      // Tentativa de fechar ciclo: C -> A
      await expect(
        linhagemRepo.registrarVinculo({
          id: 'edge_c_a',
          demanda_id: testDemandId,
          ativo_origem_id: 'asset_terceiro',
          ativo_destino_id: rawAssetId,
          papel_entrada: PapelEntradaLinhagem.FONTE_PRINCIPAL,
          etapa_transformacao_id: null,
          criado_em: now,
        })
      ).rejects.toThrow(/Ciclo detectado no grafo de linhagem/);
    });

    it('deve rejeitar ciclo direto A -> B -> A', async () => {
      const now = new Date().toISOString();
      await linhagemRepo.registrarVinculo({
        id: 'edge_dir_a_b',
        demanda_id: testDemandId,
        ativo_origem_id: rawAssetId,
        ativo_destino_id: preparedAssetId,
        papel_entrada: PapelEntradaLinhagem.FONTE_PRINCIPAL,
        etapa_transformacao_id: null,
        criado_em: now,
      });

      await expect(
        linhagemRepo.registrarVinculo({
          id: 'edge_dir_b_a',
          demanda_id: testDemandId,
          ativo_origem_id: preparedAssetId,
          ativo_destino_id: rawAssetId,
          papel_entrada: PapelEntradaLinhagem.FONTE_PRINCIPAL,
          etapa_transformacao_id: null,
          criado_em: now,
        })
      ).rejects.toThrow(/Ciclo detectado no grafo de linhagem/);
    });

    it('deve permitir DAG legítimo convergente e divergente (diamante A->B->C e A->C)', async () => {
      const now = new Date().toISOString();
      await assetRepo.create({
        id: 'asset_diamante_c',
        demanda_id: testDemandId,
        nome_arquivo: 'c_diamante.csv',
        caminho_local: '/data/c_diamante.csv',
        formato: FormatoArquivo.BASE_TRATADA,
        origem: 'Pipeline',
        descricao_conteudo: 'Ativo C Diamante',
        granularidade: 'Item',
        periodo_inicio: null,
        periodo_fim: null,
        versao: '1',
        substitui_ativo_id: null,
        tamanho_bytes: 512,
        total_linhas: 48,
        total_colunas: 6,
        hash_sha256: 'hash_diamante_c',
        status: StatusAtivoDados.ATIVO,
        categoria_ativo: CategoriaAtivoDados.PREPARADO_DERIVADO,
        schema_inferido: null,
        data_recebimento: now,
        criado_em: now,
        atualizado_em: now,
      });

      // A -> B
      await linhagemRepo.registrarVinculo({
        id: 'edge_dia_ab',
        demanda_id: testDemandId,
        ativo_origem_id: rawAssetId,
        ativo_destino_id: preparedAssetId,
        papel_entrada: PapelEntradaLinhagem.FONTE_PRINCIPAL,
        etapa_transformacao_id: null,
        criado_em: now,
      });

      // B -> C
      await linhagemRepo.registrarVinculo({
        id: 'edge_dia_bc',
        demanda_id: testDemandId,
        ativo_origem_id: preparedAssetId,
        ativo_destino_id: 'asset_diamante_c',
        papel_entrada: PapelEntradaLinhagem.FONTE_PRINCIPAL,
        etapa_transformacao_id: null,
        criado_em: now,
      });

      // A -> C (atalho / bypass legítimo em DAG)
      const edgeAc = await linhagemRepo.registrarVinculo({
        id: 'edge_dia_ac',
        demanda_id: testDemandId,
        ativo_origem_id: rawAssetId,
        ativo_destino_id: 'asset_diamante_c',
        papel_entrada: PapelEntradaLinhagem.LOOKUP_SECUNDARIA,
        etapa_transformacao_id: null,
        criado_em: now,
      });

      expect(edgeAc.id).toBe('edge_dia_ac');

      const origensDeC = await linhagemRepo.obterOrigens('asset_diamante_c');
      expect(origensDeC).toHaveLength(2);
      expect(origensDeC.map((o) => o.ativo.id).sort()).toEqual([preparedAssetId, rawAssetId].sort());
    });

    it('deve lidar corretamente com grafo vazio e nós isolados sem arestas', async () => {
      const origensVazio = await linhagemRepo.obterOrigens('no_inexistente_ou_isolado');
      expect(origensVazio).toEqual([]);

      const destinosVazio = await linhagemRepo.obterDestinos('no_inexistente_ou_isolado');
      expect(destinosVazio).toEqual([]);

      const arestasDemandaVazia = await linhagemRepo.obterArestasPorDemanda('demanda_sem_arestas');
      expect(arestasDemandaVazia).toEqual([]);
    });

    it('deve acionar ON DELETE RESTRICT ao tentar deletar ativo de dados referenciado em linhagem', async () => {
      const now = new Date().toISOString();
      await linhagemRepo.registrarVinculo({
        id: 'edge_restrict_test',
        demanda_id: testDemandId,
        ativo_origem_id: rawAssetId,
        ativo_destino_id: preparedAssetId,
        papel_entrada: PapelEntradaLinhagem.ORIGEM_UNICA,
        etapa_transformacao_id: null,
        criado_em: now,
      });

      // Tentativa de exclusão física direta do ativo origem no SQLite
      expect(() => {
        sqlite.prepare('DELETE FROM ativos_dados WHERE id = ?').run(rawAssetId);
      }).toThrow(/FOREIGN KEY constraint failed/);

      // Tentativa de exclusão física direta do ativo destino no SQLite
      expect(() => {
        sqlite.prepare('DELETE FROM ativos_dados WHERE id = ?').run(preparedAssetId);
      }).toThrow(/FOREIGN KEY constraint failed/);
    });
  });
});
