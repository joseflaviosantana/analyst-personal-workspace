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
import { SqliteDatasetAutorizadoRepository } from '@/infrastructure/db/repositories/sqlite-dataset-autorizado-repository';
import { SqliteModeloAnaliticoRepository } from '@/infrastructure/db/repositories/sqlite-modelo-analitico-repository';
import { SqliteEntidadeAnaliticaRepository } from '@/infrastructure/db/repositories/sqlite-entidade-analitica-repository';
import { SqliteAtributoAnaliticoRepository } from '@/infrastructure/db/repositories/sqlite-atributo-analitico-repository';
import { SqliteRelacionamentoAnaliticoRepository } from '@/infrastructure/db/repositories/sqlite-relacionamento-analitico-repository';
import { SqliteMetricaAnaliticaRepository } from '@/infrastructure/db/repositories/sqlite-metrica-analitica-repository';
import { FormatoArquivo } from '@/core/domain/enums/formato-arquivo';
import { StatusAtivoDados } from '@/core/domain/enums/status-ativo-dados';
import { StatusExecucaoDiagnostico } from '@/core/domain/enums/status-execucao-diagnostico';
import { CategoriaAtivoDados } from '@/core/domain/enums/categoria-ativo-dados';
import { StatusAutorizacaoDataset } from '@/core/domain/enums/status-autorizacao-dataset';
import { StatusModeloAnalitico } from '@/core/domain/enums/status-modelo-analitico';
import { TipoArquiteturaModelo } from '@/core/domain/enums/tipo-arquitetura-modelo';
import { TipoEntidadeAnalitica } from '@/core/domain/enums/tipo-entidade-analitica';
import { PapelEntidadeAnalitica } from '@/core/domain/enums/papel-entidade-analitica';
import { TipoOrigemEntidade } from '@/core/domain/enums/tipo-origem-entidade';
import { TipoDadoAnalitico } from '@/core/domain/enums/tipo-dado-analitico';
import { PapelAtributoAnalitico } from '@/core/domain/enums/papel-atributo-analitico';
import { CardinalidadeRelacionamento } from '@/core/domain/enums/cardinalidade-relacionamento';
import { DirecaoFiltroRelacionamento } from '@/core/domain/enums/direcao-filtro-relacionamento';
import { TipoAgregacaoMetrica } from '@/core/domain/enums/tipo-agregacao-metrica';
import { TipoAditividadeMetrica } from '@/core/domain/enums/tipo-aditividade-metrica';
import { UnidadeMedidaMetrica } from '@/core/domain/enums/unidade-medida-metrica';
import { StatusMetricaAnalitica } from '@/core/domain/enums/status-metrica-analitica';
import { ModeloAnalitico } from '@/core/domain/entities/modelo-analitico';
import { EntidadeAnalitica } from '@/core/domain/entities/entidade-analitica';
import { AtributoAnalitico } from '@/core/domain/entities/atributo-analitico';
import { RelacionamentoAnalitico } from '@/core/domain/entities/relacionamento-analitico';
import { MetricaAnalitica } from '@/core/domain/entities/metrica-analitica';

describe('Integration: Persistência de Modelagem Analítica (Subunidade 3.6A)', () => {
  let sqlite: Database.Database;
  let testDb: ReturnType<typeof drizzle<typeof schema>>;

  let projectRepo: SqliteProjectRepository;
  let demandRepo: SqliteDemandRepository;
  let assetRepo: SqliteAtivoDadosRepository;
  let diagRepo: SqliteDiagnosticosQualidadeRepository;
  let datasetRepo: SqliteDatasetAutorizadoRepository;

  let modeloRepo: SqliteModeloAnaliticoRepository;
  let entidadeRepo: SqliteEntidadeAnaliticaRepository;
  let atributoRepo: SqliteAtributoAnaliticoRepository;
  let relacionamentoRepo: SqliteRelacionamentoAnaliticoRepository;
  let metricaRepo: SqliteMetricaAnaliticaRepository;

  const testProjectId = 'proj_mod_test';
  const testDemandId = 'dem_mod_test';
  const testAssetId = 'asset_mod_test';
  const testDiagId = 'diag_mod_test';
  const testDatasetId = 'dset_mod_test';

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
    diagRepo = new SqliteDiagnosticosQualidadeRepository(testDb as any);
    datasetRepo = new SqliteDatasetAutorizadoRepository(testDb as any);

    modeloRepo = new SqliteModeloAnaliticoRepository(testDb as any);
    entidadeRepo = new SqliteEntidadeAnaliticaRepository(testDb as any);
    atributoRepo = new SqliteAtributoAnaliticoRepository(testDb as any);
    relacionamentoRepo = new SqliteRelacionamentoAnaliticoRepository(testDb as any);
    metricaRepo = new SqliteMetricaAnaliticaRepository(testDb as any);

    // Bootstrap dados fundamentais pré-requisito
    await projectRepo.create({
      id: testProjectId,
      nome: 'Projeto Modelagem Teste',
      descricao: 'Teste de persistência dimensional',
      status: 'ATIVO',
      data_inicio: '2026-09-28T18:00:00.000Z',
      data_conclusao_prevista: null,
      data_conclusao_real: null,
      criado_em: '2026-09-28T18:00:00.000Z',
      atualizado_em: '2026-09-28T18:00:00.000Z',
    });

    await demandRepo.create({
      id: testDemandId,
      projeto_id: testProjectId,
      titulo: 'Demanda Modelagem Teste',
      solicitacao_bruta: 'Construir modelo analítico para dashboard',
      contexto: 'Contexto analítico para BI',
      objetivo_inicial: 'Gerar modelo dimensional',
      prazo_esperado: null,
      restricoes_declaradas: null,
      estado: 'PREPARACAO_CONCLUIDA' as any,
      data_conclusao: null,
      criado_em: '2026-09-28T18:00:00.000Z',
      atualizado_em: '2026-09-28T18:00:00.000Z',
    });

    await assetRepo.create({
      id: testAssetId,
      demanda_id: testDemandId,
      nome_arquivo: 'vendas_preparadas.csv',
      caminho_local: 'data/vendas_preparadas.csv',
      formato: FormatoArquivo.CSV,
      origem: 'Sistema ERP',
      descricao_conteudo: 'Base tratada de vendas',
      granularidade: 'Item de pedido',
      periodo_inicio: '2026-01-01',
      periodo_fim: '2026-06-30',
      versao: '1.0',
      tamanho_bytes: 50000,
      total_linhas: 1000,
      total_colunas: 6,
      hash_sha256: 'a1b2c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef',
      status: StatusAtivoDados.ATIVO,
      categoria_ativo: CategoriaAtivoDados.PREPARADO_DERIVADO,
      schema_inferido: JSON.stringify([{ nome: 'id_venda', tipo: 'TEXTO' }]),
      data_recebimento: '2026-09-28T18:00:00.000Z',
      criado_em: '2026-09-28T18:00:00.000Z',
      atualizado_em: '2026-09-28T18:00:00.000Z',
    });

    await diagRepo.create({
      id: testDiagId,
      ativo_dados_id: testAssetId,
      demanda_id: testDemandId,
      iniciado_em: '2026-09-28T18:00:00.000Z',
      concluido_em: '2026-09-28T18:00:01.000Z',
      duracao_ms: 1000,
      total_linhas_avaliadas: 1000,
      total_colunas_avaliadas: 6,
      verificacoes_executadas: [],
      total_problemas_detectados: 0,
      status_execucao: StatusExecucaoDiagnostico.CONCLUIDO,
      erro_mensagem: null,
      resumo_metricas: null,
      criado_em: '2026-09-28T18:00:00.000Z',
      atualizado_em: '2026-09-28T18:00:00.000Z',
    });

    await datasetRepo.autorizarTransacional({
      id: testDatasetId,
      demanda_id: testDemandId,
      ativo_dados_id: testAssetId,
      diagnostico_qualidade_id: testDiagId,
      receita_preparacao_id: null,
      versao_rotulo: '1.0-preparado',
      hash_sha256_snapshot: 'a1b2c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef',
      status: StatusAutorizacaoDataset.VIGENTE,
      justificativa_autorizacao: 'Base validada com qualidade máxima para modelagem',
      autorizado_por_tipo: 'HUMANO',
      restricoes_aceitas_snapshot: '[]',
      autorizado_em: '2026-09-28T18:00:00.000Z',
      revogado_em: null,
      motivo_revogacao: null,
    });
  });

  describe('CRUD e Governança do Modelo Analítico', () => {
    it('deve criar e recuperar um modelo analítico em rascunho', async () => {
      const modelo: ModeloAnalitico = {
        id: 'mod_001',
        demanda_id: testDemandId,
        dataset_autorizado_id: testDatasetId,
        nome: 'Modelo Vendas Comercial',
        descricao: 'Esquema estrela para acompanhamento de receitas',
        tipo_arquitetura: TipoArquiteturaModelo.ESTRELA,
        status: StatusModeloAnalitico.RASCUNHO,
        homologado_em: null,
        homologado_por: null,
        justificativa_homologacao: null,
        revogado_em: null,
        motivo_revogacao: null,
        criado_em: '2026-09-28T18:10:00.000Z',
        atualizado_em: '2026-09-28T18:10:00.000Z',
      };

      await modeloRepo.create(modelo);

      const recuperado = await modeloRepo.findById('mod_001');
      expect(recuperado).not.toBeNull();
      expect(recuperado?.nome).toBe('Modelo Vendas Comercial');
      expect(recuperado?.status).toBe(StatusModeloAnalitico.RASCUNHO);
      expect(recuperado?.tipo_arquitetura).toBe(TipoArquiteturaModelo.ESTRELA);

      const porDemanda = await modeloRepo.findByDemandaId(testDemandId);
      expect(porDemanda).toHaveLength(1);
      expect(porDemanda[0].id).toBe('mod_001');
    });

    it('deve atualizar metadados do modelo analítico', async () => {
      const modelo: ModeloAnalitico = {
        id: 'mod_002',
        demanda_id: testDemandId,
        dataset_autorizado_id: testDatasetId,
        nome: 'Modelo Inicial',
        descricao: 'Descricao inicial',
        tipo_arquitetura: TipoArquiteturaModelo.TABELA_UNICA,
        status: StatusModeloAnalitico.RASCUNHO,
        homologado_em: null,
        homologado_por: null,
        justificativa_homologacao: null,
        revogado_em: null,
        motivo_revogacao: null,
        criado_em: '2026-09-28T18:10:00.000Z',
        atualizado_em: '2026-09-28T18:10:00.000Z',
      };

      await modeloRepo.create(modelo);

      modelo.nome = 'Modelo Atualizado para Snowflake';
      modelo.tipo_arquitetura = TipoArquiteturaModelo.SNOWFLAKE;
      modelo.status = StatusModeloAnalitico.EM_REVISAO;
      modelo.atualizado_em = '2026-09-28T18:15:00.000Z';

      await modeloRepo.update(modelo);

      const atualizado = await modeloRepo.findById('mod_002');
      expect(atualizado?.nome).toBe('Modelo Atualizado para Snowflake');
      expect(atualizado?.tipo_arquitetura).toBe(TipoArquiteturaModelo.SNOWFLAKE);
      expect(atualizado?.status).toBe(StatusModeloAnalitico.EM_REVISAO);
    });

    it('deve impedir múltiplos modelos HOMOLOGADOS simultâneos via índice único parcial', async () => {
      const modelo1: ModeloAnalitico = {
        id: 'mod_h1',
        demanda_id: testDemandId,
        dataset_autorizado_id: testDatasetId,
        nome: 'Modelo Homologado 1',
        descricao: null,
        tipo_arquitetura: TipoArquiteturaModelo.ESTRELA,
        status: StatusModeloAnalitico.HOMOLOGADO,
        homologado_em: '2026-09-28T18:20:00.000Z',
        homologado_por: 'HUMANO',
        justificativa_homologacao: 'Primeira homologação',
        revogado_em: null,
        motivo_revogacao: null,
        criado_em: '2026-09-28T18:20:00.000Z',
        atualizado_em: '2026-09-28T18:20:00.000Z',
      };

      await modeloRepo.create(modelo1);

      const modelo2: ModeloAnalitico = {
        id: 'mod_h2',
        demanda_id: testDemandId,
        dataset_autorizado_id: testDatasetId,
        nome: 'Modelo Homologado 2 Conflitante',
        descricao: null,
        tipo_arquitetura: TipoArquiteturaModelo.ESTRELA,
        status: StatusModeloAnalitico.HOMOLOGADO,
        homologado_em: '2026-09-28T18:25:00.000Z',
        homologado_por: 'HUMANO',
        justificativa_homologacao: 'Tentativa de homologação concorrente',
        revogado_em: null,
        motivo_revogacao: null,
        criado_em: '2026-09-28T18:25:00.000Z',
        atualizado_em: '2026-09-28T18:25:00.000Z',
      };

      // Inserção direta de segundo HOMOLOGADO deve violar idx_unique_modelo_analitico_homologado
      expect(() => {
        testDb.insert(schema.modelosAnaliticos).values(modelo2).run();
      }).toThrow(/UNIQUE constraint failed/i);
    });

    it('deve homologar transacionalmente revogando modelo homologado anterior', async () => {
      const mod1: ModeloAnalitico = {
        id: 'mod_tx_1',
        demanda_id: testDemandId,
        dataset_autorizado_id: testDatasetId,
        nome: 'Modelo Versão 1',
        descricao: null,
        tipo_arquitetura: TipoArquiteturaModelo.ESTRELA,
        status: StatusModeloAnalitico.RASCUNHO,
        homologado_em: null,
        homologado_por: null,
        justificativa_homologacao: null,
        revogado_em: null,
        motivo_revogacao: null,
        criado_em: '2026-09-28T18:00:00.000Z',
        atualizado_em: '2026-09-28T18:00:00.000Z',
      };

      const mod2: ModeloAnalitico = {
        id: 'mod_tx_2',
        demanda_id: testDemandId,
        dataset_autorizado_id: testDatasetId,
        nome: 'Modelo Versão 2',
        descricao: null,
        tipo_arquitetura: TipoArquiteturaModelo.ESTRELA,
        status: StatusModeloAnalitico.RASCUNHO,
        homologado_em: null,
        homologado_por: null,
        justificativa_homologacao: null,
        revogado_em: null,
        motivo_revogacao: null,
        criado_em: '2026-09-28T18:05:00.000Z',
        atualizado_em: '2026-09-28T18:05:00.000Z',
      };

      await modeloRepo.create(mod1);
      await modeloRepo.create(mod2);

      // Homologa o modelo 1
      await modeloRepo.homologarTransacional(
        'mod_tx_1',
        'Analista Senior',
        'Aprovado modelo inicial',
        '2026-09-28T18:10:00.000Z'
      );

      let homologado = await modeloRepo.findHomologadoByDemandaId(testDemandId);
      expect(homologado?.id).toBe('mod_tx_1');

      // Agora homologa o modelo 2 transacionalmente
      await modeloRepo.homologarTransacional(
        'mod_tx_2',
        'Analista Senior',
        'Evolução do modelo dimensional com novas métricas',
        '2026-09-28T18:20:00.000Z'
      );

      homologado = await modeloRepo.findHomologadoByDemandaId(testDemandId);
      expect(homologado?.id).toBe('mod_tx_2');
      expect(homologado?.status).toBe(StatusModeloAnalitico.HOMOLOGADO);

      // Modelo 1 deve estar REVOGADO
      const mod1Revogado = await modeloRepo.findById('mod_tx_1');
      expect(mod1Revogado?.status).toBe(StatusModeloAnalitico.REVOGADO);
      expect(mod1Revogado?.revogado_em).toBe('2026-09-28T18:20:00.000Z');
      expect(mod1Revogado?.motivo_revogacao).toContain('Substituído por novo modelo');
    });

    it('deve revogar modelo analítico formalmente', async () => {
      const mod: ModeloAnalitico = {
        id: 'mod_rev',
        demanda_id: testDemandId,
        dataset_autorizado_id: testDatasetId,
        nome: 'Modelo Para Revogação',
        descricao: null,
        tipo_arquitetura: TipoArquiteturaModelo.ESTRELA,
        status: StatusModeloAnalitico.HOMOLOGADO,
        homologado_em: '2026-09-28T18:00:00.000Z',
        homologado_por: 'HUMANO',
        justificativa_homologacao: 'Válido inicialmente',
        revogado_em: null,
        motivo_revogacao: null,
        criado_em: '2026-09-28T18:00:00.000Z',
        atualizado_em: '2026-09-28T18:00:00.000Z',
      };

      await modeloRepo.create(mod);

      await modeloRepo.revogar('mod_rev', 'Alteração nos requisitos de negócio', '2026-09-28T18:30:00.000Z');

      const revogado = await modeloRepo.findById('mod_rev');
      expect(revogado?.status).toBe(StatusModeloAnalitico.REVOGADO);
      expect(revogado?.motivo_revogacao).toBe('Alteração nos requisitos de negócio');
      expect(revogado?.revogado_em).toBe('2026-09-28T18:30:00.000Z');
    });
  });

  describe('Persistência de Entidades, Atributos, Relacionamentos e Métricas', () => {
    it('deve persistir entidades analíticas e atributos em batch', async () => {
      const modelo: ModeloAnalitico = {
        id: 'mod_star',
        demanda_id: testDemandId,
        dataset_autorizado_id: testDatasetId,
        nome: 'Modelo Star Vendas',
        descricao: 'Esquema estrela completo',
        tipo_arquitetura: TipoArquiteturaModelo.ESTRELA,
        status: StatusModeloAnalitico.RASCUNHO,
        homologado_em: null,
        homologado_por: null,
        justificativa_homologacao: null,
        revogado_em: null,
        motivo_revogacao: null,
        criado_em: '2026-09-28T18:00:00.000Z',
        atualizado_em: '2026-09-28T18:00:00.000Z',
      };
      await modeloRepo.create(modelo);

      const entidades: EntidadeAnalitica[] = [
        {
          id: 'ent_fato_vendas',
          modelo_id: 'mod_star',
          ativo_dados_id: testAssetId,
          nome: 'Fato Vendas',
          tipo: TipoEntidadeAnalitica.FATO,
          papel: PapelEntidadeAnalitica.FATO_TRANSACIONAL,
          origem_tipo: TipoOrigemEntidade.DATASET_AUTORIZADO,
          descricao: 'Tabela principal de transações',
          ordem_apresentacao: 1,
          criado_em: '2026-09-28T18:00:00.000Z',
          atualizado_em: '2026-09-28T18:00:00.000Z',
        },
        {
          id: 'ent_dim_clientes',
          modelo_id: 'mod_star',
          ativo_dados_id: testAssetId,
          nome: 'Dimensão Clientes',
          tipo: TipoEntidadeAnalitica.DIMENSAO,
          papel: PapelEntidadeAnalitica.DIMENSAO_PADRAO,
          origem_tipo: TipoOrigemEntidade.DATASET_AUTORIZADO,
          descricao: 'Cadastro de clientes',
          ordem_apresentacao: 2,
          criado_em: '2026-09-28T18:00:00.000Z',
          atualizado_em: '2026-09-28T18:00:00.000Z',
        },
      ];

      await entidadeRepo.createBatch(entidades);

      const entidadesRecuperadas = await entidadeRepo.findByModeloId('mod_star');
      expect(entidadesRecuperadas).toHaveLength(2);
      expect(entidadesRecuperadas[0].nome).toBe('Fato Vendas');

      const atributosFato: AtributoAnalitico[] = [
        {
          id: 'attr_fv_id',
          entidade_id: 'ent_fato_vendas',
          nome_original: 'id_venda',
          nome_amigavel: 'ID Venda',
          tipo_dado: TipoDadoAnalitico.TEXTO,
          papel: PapelAtributoAnalitico.CHAVE_PRIMARIA,
          ordem: 1,
          oculto: false,
          descricao: null,
          formato_exibicao: null,
          criado_em: '2026-09-28T18:00:00.000Z',
          atualizado_em: '2026-09-28T18:00:00.000Z',
        },
        {
          id: 'attr_fv_cliente_fk',
          entidade_id: 'ent_fato_vendas',
          nome_original: 'id_cliente',
          nome_amigavel: 'ID Cliente (FK)',
          tipo_dado: TipoDadoAnalitico.TEXTO,
          papel: PapelAtributoAnalitico.CHAVE_ESTRANGEIRA,
          ordem: 2,
          oculto: false,
          descricao: null,
          formato_exibicao: null,
          criado_em: '2026-09-28T18:00:00.000Z',
          atualizado_em: '2026-09-28T18:00:00.000Z',
        },
        {
          id: 'attr_fv_valor',
          entidade_id: 'ent_fato_vendas',
          nome_original: 'valor_total',
          nome_amigavel: 'Valor Total Faturado',
          tipo_dado: TipoDadoAnalitico.DECIMAL,
          papel: PapelAtributoAnalitico.METRICA_BASE,
          ordem: 3,
          oculto: false,
          descricao: null,
          formato_exibicao: 'R$ #,##0.00',
          criado_em: '2026-09-28T18:00:00.000Z',
          atualizado_em: '2026-09-28T18:00:00.000Z',
        },
      ];

      await atributoRepo.createBatch(atributosFato);

      const attrsRecuperados = await atributoRepo.findByEntidadeId('ent_fato_vendas');
      expect(attrsRecuperados).toHaveLength(3);
      expect(attrsRecuperados[2].formato_exibicao).toBe('R$ #,##0.00');
      expect(attrsRecuperados[2].papel).toBe(PapelAtributoAnalitico.METRICA_BASE);
    });

    it('deve persistir relacionamentos analíticos com suporte a N:M, filtro bidirecional e justificativa (M-03)', async () => {
      const modelo: ModeloAnalitico = {
        id: 'mod_rel',
        demanda_id: testDemandId,
        dataset_autorizado_id: testDatasetId,
        nome: 'Modelo Relacionamentos',
        descricao: null,
        tipo_arquitetura: TipoArquiteturaModelo.ESTRELA,
        status: StatusModeloAnalitico.RASCUNHO,
        homologado_em: null,
        homologado_por: null,
        justificativa_homologacao: null,
        revogado_em: null,
        motivo_revogacao: null,
        criado_em: '2026-09-28T18:00:00.000Z',
        atualizado_em: '2026-09-28T18:00:00.000Z',
      };
      await modeloRepo.create(modelo);

      const ent1: EntidadeAnalitica = {
        id: 'ent_pedidos',
        modelo_id: 'mod_rel',
        ativo_dados_id: testAssetId,
        nome: 'Pedidos',
        tipo: TipoEntidadeAnalitica.FATO,
        papel: PapelEntidadeAnalitica.FATO_TRANSACIONAL,
        origem_tipo: TipoOrigemEntidade.DATASET_AUTORIZADO,
        descricao: null,
        ordem_apresentacao: 1,
        criado_em: '2026-09-28T18:00:00.000Z',
        atualizado_em: '2026-09-28T18:00:00.000Z',
      };

      const ent2: EntidadeAnalitica = {
        id: 'ent_tags',
        modelo_id: 'mod_rel',
        ativo_dados_id: testAssetId,
        nome: 'Tags de Campanha',
        tipo: TipoEntidadeAnalitica.DIMENSAO,
        papel: PapelEntidadeAnalitica.DIMENSAO_PADRAO,
        origem_tipo: TipoOrigemEntidade.DATASET_AUTORIZADO,
        descricao: null,
        ordem_apresentacao: 2,
        criado_em: '2026-09-28T18:00:00.000Z',
        atualizado_em: '2026-09-28T18:00:00.000Z',
      };

      await entidadeRepo.createBatch([ent1, ent2]);

      const attr1: AtributoAnalitico = {
        id: 'attr_p_tag_id',
        entidade_id: 'ent_pedidos',
        nome_original: 'tag_id',
        nome_amigavel: 'ID Tag',
        tipo_dado: TipoDadoAnalitico.TEXTO,
        papel: PapelAtributoAnalitico.CHAVE_ESTRANGEIRA,
        ordem: 1,
        oculto: false,
        descricao: null,
        formato_exibicao: null,
        criado_em: '2026-09-28T18:00:00.000Z',
        atualizado_em: '2026-09-28T18:00:00.000Z',
      };

      const attr2: AtributoAnalitico = {
        id: 'attr_t_id',
        entidade_id: 'ent_tags',
        nome_original: 'tag_pk',
        nome_amigavel: 'ID Tag PK',
        tipo_dado: TipoDadoAnalitico.TEXTO,
        papel: PapelAtributoAnalitico.CHAVE_PRIMARIA,
        ordem: 1,
        oculto: false,
        descricao: null,
        formato_exibicao: null,
        criado_em: '2026-09-28T18:00:00.000Z',
        atualizado_em: '2026-09-28T18:00:00.000Z',
      };

      await atributoRepo.createBatch([attr1, attr2]);

      // Relacionamento N:M com filtro bidirecional e justificativa técnica
      const relNM: RelacionamentoAnalitico = {
        id: 'rel_pedidos_tags',
        modelo_id: 'mod_rel',
        entidade_origem_id: 'ent_pedidos',
        atributo_origem_id: 'attr_p_tag_id',
        entidade_destino_id: 'ent_tags',
        atributo_destino_id: 'attr_t_id',
        tipo_relacionamento: CardinalidadeRelacionamento.MUITOS_PARA_MUITOS,
        direcao_filtro: DirecaoFiltroRelacionamento.BIDIRECIONAL,
        ativo: true,
        justificativa: 'Pedidos possuem múltiplas tags de campanha e tags filtram múltiplos pedidos.',
        criado_em: '2026-09-28T18:00:00.000Z',
        atualizado_em: '2026-09-28T18:00:00.000Z',
      };

      await relacionamentoRepo.create(relNM);

      const rels = await relacionamentoRepo.findByModeloId('mod_rel');
      expect(rels).toHaveLength(1);
      expect(rels[0].tipo_relacionamento).toBe(CardinalidadeRelacionamento.MUITOS_PARA_MUITOS);
      expect(rels[0].direcao_filtro).toBe(DirecaoFiltroRelacionamento.BIDIRECIONAL);
      expect(rels[0].justificativa).toContain('múltiplas tags');
      expect(rels[0].ativo).toBe(true);
    });

    it('deve persistir métricas com linhagem semântica explícita e rastreabilidade de negócio (Ajustes 5 e 6)', async () => {
      const modelo: ModeloAnalitico = {
        id: 'mod_kpi',
        demanda_id: testDemandId,
        dataset_autorizado_id: testDatasetId,
        nome: 'Modelo Métricas',
        descricao: null,
        tipo_arquitetura: TipoArquiteturaModelo.ESTRELA,
        status: StatusModeloAnalitico.RASCUNHO,
        homologado_em: null,
        homologado_por: null,
        justificativa_homologacao: null,
        revogado_em: null,
        motivo_revogacao: null,
        criado_em: '2026-09-28T18:00:00.000Z',
        atualizado_em: '2026-09-28T18:00:00.000Z',
      };
      await modeloRepo.create(modelo);

      const m1: MetricaAnalitica = {
        id: 'met_rec',
        modelo_id: 'mod_kpi',
        entidade_id: null,
        nome: 'Receita Líquida',
        descricao: 'Faturamento após deduções',
        tipo_agregacao: TipoAgregacaoMetrica.SOMA,
        tipo_aditividade: TipoAditividadeMetrica.TOTALMENTE_ADITIVA,
        formula_declarativa: 'SOMA(valor_liquido)',
        unidade_medida: UnidadeMedidaMetrica.MOEDA,
        formato_exibicao: 'R$ #,##0.00',
        status: StatusMetricaAnalitica.HOMOLOGADA,
        atributos_dependentes_ids: ['col_val_liq'],
        metricas_dependentes_ids: [],
        pergunta_negocio_associada: 'Qual é a receita líquida do negócio?',
        objetivo_negocio_associado: 'Atingir meta de rentabilidade',
        ordem: 1,
        criado_em: '2026-09-28T18:00:00.000Z',
        atualizado_em: '2026-09-28T18:00:00.000Z',
      };

      const m2: MetricaAnalitica = {
        id: 'met_lucro',
        modelo_id: 'mod_kpi',
        entidade_id: null,
        nome: 'Lucro Bruto',
        descricao: 'Receita líquida menos CMV',
        tipo_agregacao: TipoAgregacaoMetrica.SOMA,
        tipo_aditividade: TipoAditividadeMetrica.TOTALMENTE_ADITIVA,
        formula_declarativa: 'SOMA(lucro_bruto)',
        unidade_medida: UnidadeMedidaMetrica.MOEDA,
        formato_exibicao: 'R$ #,##0.00',
        status: StatusMetricaAnalitica.HOMOLOGADA,
        atributos_dependentes_ids: ['col_lucro_bruto'],
        metricas_dependentes_ids: [],
        pergunta_negocio_associada: 'Qual o lucro bruto gerado?',
        objetivo_negocio_associado: 'Maximização de margens',
        ordem: 2,
        criado_em: '2026-09-28T18:00:00.000Z',
        atualizado_em: '2026-09-28T18:00:00.000Z',
      };

      // Métrica composta: Margem % dependendo de m1 e m2
      const m3: MetricaAnalitica = {
        id: 'met_margem_pct',
        modelo_id: 'mod_kpi',
        entidade_id: null,
        nome: 'Margem %',
        descricao: 'Lucro Bruto / Receita Líquida',
        tipo_agregacao: TipoAgregacaoMetrica.COMPOSTA,
        tipo_aditividade: TipoAditividadeMetrica.NAO_ADITIVA,
        formula_declarativa: '[Lucro Bruto] / [Receita Líquida]',
        unidade_medida: UnidadeMedidaMetrica.PERCENTUAL,
        formato_exibicao: '0.00%',
        status: StatusMetricaAnalitica.HOMOLOGADA,
        atributos_dependentes_ids: [],
        metricas_dependentes_ids: ['met_rec', 'met_lucro'],
        pergunta_negocio_associada: 'Qual a margem percentual consolidada?',
        objetivo_negocio_associado: 'Garantir margem superior a 25%',
        ordem: 3,
        criado_em: '2026-09-28T18:00:00.000Z',
        atualizado_em: '2026-09-28T18:00:00.000Z',
      };

      await metricaRepo.create(m1);
      await metricaRepo.create(m2);
      await metricaRepo.create(m3);

      const metricasRecuperadas = await metricaRepo.findByModeloId('mod_kpi');
      expect(metricasRecuperadas).toHaveLength(3);

      const metricaComposta = metricasRecuperadas.find((m) => m.id === 'met_margem_pct');
      expect(metricaComposta).toBeDefined();
      expect(metricaComposta?.tipo_agregacao).toBe(TipoAgregacaoMetrica.COMPOSTA);
      expect(metricaComposta?.metricas_dependentes_ids).toEqual(['met_rec', 'met_lucro']);
      expect(metricaComposta?.atributos_dependentes_ids).toHaveLength(0);
      expect(metricaComposta?.pergunta_negocio_associada).toContain('margem percentual');
      expect(metricaComposta?.objetivo_negocio_associado).toContain('25%');
    });

    it('deve carregar o modelo completo com entidades, atributos, relacionamentos e métricas via findCompletoById', async () => {
      const modelo: ModeloAnalitico = {
        id: 'mod_full',
        demanda_id: testDemandId,
        dataset_autorizado_id: testDatasetId,
        nome: 'Modelo Star Completo',
        descricao: 'Agregado macro',
        tipo_arquitetura: TipoArquiteturaModelo.ESTRELA,
        status: StatusModeloAnalitico.RASCUNHO,
        homologado_em: null,
        homologado_por: null,
        justificativa_homologacao: null,
        revogado_em: null,
        motivo_revogacao: null,
        criado_em: '2026-09-28T18:00:00.000Z',
        atualizado_em: '2026-09-28T18:00:00.000Z',
      };
      await modeloRepo.create(modelo);

      const entFato: EntidadeAnalitica = {
        id: 'ef_vendas',
        modelo_id: 'mod_full',
        ativo_dados_id: testAssetId,
        nome: 'Fato Vendas',
        tipo: TipoEntidadeAnalitica.FATO,
        papel: PapelEntidadeAnalitica.FATO_TRANSACIONAL,
        origem_tipo: TipoOrigemEntidade.DATASET_AUTORIZADO,
        descricao: null,
        ordem_apresentacao: 1,
        criado_em: '2026-09-28T18:00:00.000Z',
        atualizado_em: '2026-09-28T18:00:00.000Z',
      };
      const entDim: EntidadeAnalitica = {
        id: 'ed_tempo',
        modelo_id: 'mod_full',
        ativo_dados_id: null,
        nome: 'Dimensão Calendário',
        tipo: TipoEntidadeAnalitica.DIMENSAO,
        papel: PapelEntidadeAnalitica.DIMENSAO_CALENDARIO,
        origem_tipo: TipoOrigemEntidade.DIMENSAO_SISTEMA,
        descricao: 'Calendário lógico',
        ordem_apresentacao: 2,
        criado_em: '2026-09-28T18:00:00.000Z',
        atualizado_em: '2026-09-28T18:00:00.000Z',
      };
      await entidadeRepo.createBatch([entFato, entDim]);

      const attrFato: AtributoAnalitico = {
        id: 'af_data_fk',
        entidade_id: 'ef_vendas',
        nome_original: 'data_venda',
        nome_amigavel: 'Data da Venda (FK)',
        tipo_dado: TipoDadoAnalitico.DATA,
        papel: PapelAtributoAnalitico.CHAVE_ESTRANGEIRA,
        ordem: 1,
        oculto: false,
        descricao: null,
        formato_exibicao: 'dd/MM/yyyy',
        criado_em: '2026-09-28T18:00:00.000Z',
        atualizado_em: '2026-09-28T18:00:00.000Z',
      };
      const attrDim: AtributoAnalitico = {
        id: 'ad_data_pk',
        entidade_id: 'ed_tempo',
        nome_original: 'data',
        nome_amigavel: 'Data (PK)',
        tipo_dado: TipoDadoAnalitico.DATA,
        papel: PapelAtributoAnalitico.CHAVE_PRIMARIA,
        ordem: 1,
        oculto: false,
        descricao: null,
        formato_exibicao: 'dd/MM/yyyy',
        criado_em: '2026-09-28T18:00:00.000Z',
        atualizado_em: '2026-09-28T18:00:00.000Z',
      };
      await atributoRepo.createBatch([attrFato, attrDim]);

      const rel: RelacionamentoAnalitico = {
        id: 'rel_vendas_tempo',
        modelo_id: 'mod_full',
        entidade_origem_id: 'ef_vendas',
        atributo_origem_id: 'af_data_fk',
        entidade_destino_id: 'ed_tempo',
        atributo_destino_id: 'ad_data_pk',
        tipo_relacionamento: CardinalidadeRelacionamento.MUITOS_PARA_UM,
        direcao_filtro: DirecaoFiltroRelacionamento.UNIDIRECIONAL,
        ativo: true,
        justificativa: null,
        criado_em: '2026-09-28T18:00:00.000Z',
        atualizado_em: '2026-09-28T18:00:00.000Z',
      };
      await relacionamentoRepo.create(rel);

      const met: MetricaAnalitica = {
        id: 'met_qtde_vendas',
        modelo_id: 'mod_full',
        entidade_id: 'ef_vendas',
        nome: 'Quantidade de Vendas',
        descricao: 'Total de transações realizadas',
        tipo_agregacao: TipoAgregacaoMetrica.CONTAGEM,
        tipo_aditividade: TipoAditividadeMetrica.TOTALMENTE_ADITIVA,
        formula_declarativa: 'CONTAGEM(id_venda)',
        unidade_medida: UnidadeMedidaMetrica.QUANTIDADE,
        formato_exibicao: '#,##0',
        status: StatusMetricaAnalitica.HOMOLOGADA,
        atributos_dependentes_ids: ['af_data_fk'],
        metricas_dependentes_ids: [],
        pergunta_negocio_associada: 'Quantos pedidos foram processados?',
        objetivo_negocio_associado: 'Acompanhar volume de processamento',
        ordem: 1,
        criado_em: '2026-09-28T18:00:00.000Z',
        atualizado_em: '2026-09-28T18:00:00.000Z',
      };
      await metricaRepo.create(met);

      const completo = await modeloRepo.findCompletoById('mod_full');
      expect(completo).not.toBeNull();
      expect(completo?.entidades).toHaveLength(2);
      expect(completo?.entidades[0].atributos).toHaveLength(1);
      expect(completo?.entidades[1].atributos).toHaveLength(1);
      expect(completo?.relacionamentos).toHaveLength(1);
      expect(completo?.metricas).toHaveLength(1);
      expect(completo?.metricas[0].formula_declarativa).toBe('CONTAGEM(id_venda)');
    });

    it('deve propagar exclusão em cascata ao deletar modelo analítico', async () => {
      const modelo: ModeloAnalitico = {
        id: 'mod_cascade',
        demanda_id: testDemandId,
        dataset_autorizado_id: testDatasetId,
        nome: 'Modelo Cascata',
        descricao: null,
        tipo_arquitetura: TipoArquiteturaModelo.ESTRELA,
        status: StatusModeloAnalitico.RASCUNHO,
        homologado_em: null,
        homologado_por: null,
        justificativa_homologacao: null,
        revogado_em: null,
        motivo_revogacao: null,
        criado_em: '2026-09-28T18:00:00.000Z',
        atualizado_em: '2026-09-28T18:00:00.000Z',
      };
      await modeloRepo.create(modelo);

      const ent: EntidadeAnalitica = {
        id: 'ent_casc',
        modelo_id: 'mod_cascade',
        ativo_dados_id: testAssetId,
        nome: 'Entidade Cascata',
        tipo: TipoEntidadeAnalitica.FATO,
        papel: PapelEntidadeAnalitica.FATO_TRANSACIONAL,
        origem_tipo: TipoOrigemEntidade.DATASET_AUTORIZADO,
        descricao: null,
        ordem_apresentacao: 1,
        criado_em: '2026-09-28T18:00:00.000Z',
        atualizado_em: '2026-09-28T18:00:00.000Z',
      };
      await entidadeRepo.create(ent);

      const attr: AtributoAnalitico = {
        id: 'attr_casc',
        entidade_id: 'ent_casc',
        nome_original: 'col1',
        nome_amigavel: 'Coluna 1',
        tipo_dado: TipoDadoAnalitico.TEXTO,
        papel: PapelAtributoAnalitico.ATRIBUTO_DESCRITIVO,
        ordem: 1,
        oculto: false,
        descricao: null,
        formato_exibicao: null,
        criado_em: '2026-09-28T18:00:00.000Z',
        atualizado_em: '2026-09-28T18:00:00.000Z',
      };
      await atributoRepo.create(attr);

      const met: MetricaAnalitica = {
        id: 'met_casc',
        modelo_id: 'mod_cascade',
        entidade_id: 'ent_casc',
        nome: 'Métrica Cascata',
        descricao: null,
        tipo_agregacao: TipoAgregacaoMetrica.SOMA,
        tipo_aditividade: TipoAditividadeMetrica.TOTALMENTE_ADITIVA,
        formula_declarativa: 'SOMA(col1)',
        unidade_medida: UnidadeMedidaMetrica.MOEDA,
        formato_exibicao: null,
        status: StatusMetricaAnalitica.RASCUNHO,
        atributos_dependentes_ids: [],
        metricas_dependentes_ids: [],
        pergunta_negocio_associada: null,
        objetivo_negocio_associado: null,
        ordem: 1,
        criado_em: '2026-09-28T18:00:00.000Z',
        atualizado_em: '2026-09-28T18:00:00.000Z',
      };
      await metricaRepo.create(met);

      // Deleta o modelo
      await modeloRepo.delete('mod_cascade');

      // Modelo deve ter sumido
      expect(await modeloRepo.findById('mod_cascade')).toBeNull();
      // Entidade deve ter sumido por cascata
      expect(await entidadeRepo.findById('ent_casc')).toBeNull();
      // Atributo deve ter sumido por cascata da entidade
      expect(await atributoRepo.findById('attr_casc')).toBeNull();
      // Métrica deve ter sumido por cascata do modelo
      expect(await metricaRepo.findById('met_casc')).toBeNull();
    });
  });
});
