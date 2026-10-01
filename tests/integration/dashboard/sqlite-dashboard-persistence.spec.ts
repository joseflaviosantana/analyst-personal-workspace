import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import fs from 'fs';
import * as schema from '@/infrastructure/db/schema';
import { SqliteProjectRepository } from '@/infrastructure/db/repositories/project-repository';
import { SqliteDemandRepository } from '@/infrastructure/db/repositories/demand-repository';
import { SqliteModeloAnaliticoRepository } from '@/infrastructure/db/repositories/sqlite-modelo-analitico-repository';
import { SqliteMetricaAnaliticaRepository } from '@/infrastructure/db/repositories/sqlite-metrica-analitica-repository';
import { SqliteDatasetAutorizadoRepository } from '@/infrastructure/db/repositories/sqlite-dataset-autorizado-repository';
import { SqliteAtivoDadosRepository } from '@/infrastructure/db/repositories/ativo-dados-repository';
import { SqliteModeloPowerBiRepository } from '@/infrastructure/db/repositories/sqlite-modelo-powerbi-repository';
import { SqliteMedidaDaxRepository } from '@/infrastructure/db/repositories/sqlite-medida-dax-repository';
import { SqlitePaginaRelatorioRepository } from '@/infrastructure/db/repositories/sqlite-pagina-relatorio-repository';
import { SqliteVisualDashboardRepository } from '@/infrastructure/db/repositories/sqlite-visual-dashboard-repository';

import { TipoFormatoModeloPowerBi } from '@/core/domain/enums/tipo-formato-modelo-powerbi';
import { StatusModeloPowerBi } from '@/core/domain/enums/status-modelo-powerbi';
import { CategoriaMedidaDax } from '@/core/domain/enums/categoria-medida-dax';
import { PublicoAlvoPagina } from '@/core/domain/enums/publico-alvo-pagina';
import { LayoutGridPagina } from '@/core/domain/enums/layout-grid-pagina';
import { TipoVisualDashboard } from '@/core/domain/enums/tipo-visual-dashboard';
import { PosicaoLayoutVisual } from '@/core/domain/enums/posicao-layout-visual';
import { TipoArquiteturaModelo } from '@/core/domain/enums/tipo-arquitetura-modelo';
import { StatusModeloAnalitico } from '@/core/domain/enums/status-modelo-analitico';
import { TipoAgregacaoMetrica } from '@/core/domain/enums/tipo-agregacao-metrica';
import { TipoAditividadeMetrica } from '@/core/domain/enums/tipo-aditividade-metrica';
import { UnidadeMedidaMetrica } from '@/core/domain/enums/unidade-medida-metrica';
import { StatusMetricaAnalitica } from '@/core/domain/enums/status-metrica-analitica';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { FormatoArquivo } from '@/core/domain/enums/formato-arquivo';
import { StatusAtivoDados } from '@/core/domain/enums/status-ativo-dados';

describe('Integration Tests: Persistência SQLite de Dashboard e DAX (Subgate 3.1)', () => {
  const testDbDir = path.join(process.cwd(), '.workspace', 'data');
  const testDbPath = path.join(testDbDir, 'test_dashboard_persistence_subgate31.db');
  let sqliteDb: Database.Database;
  let db: ReturnType<typeof drizzle<typeof schema>>;

  let projectRepo: SqliteProjectRepository;
  let demandRepo: SqliteDemandRepository;
  let ativoRepo: SqliteAtivoDadosRepository;
  let datasetRepo: SqliteDatasetAutorizadoRepository;
  let modeloAnaliticoRepo: SqliteModeloAnaliticoRepository;
  let metricaAnaliticaRepo: SqliteMetricaAnaliticaRepository;

  let modeloPowerBiRepo: SqliteModeloPowerBiRepository;
  let medidaDaxRepo: SqliteMedidaDaxRepository;
  let paginaRelatorioRepo: SqlitePaginaRelatorioRepository;
  let visualDashboardRepo: SqliteVisualDashboardRepository;

  const projetoId = 'prj_dash_test_1';
  const demandaIdA = 'dem_dash_test_A';
  const demandaIdB = 'dem_dash_test_B';
  const ativoId = 'atv_dash_test_1';
  const datasetId = 'dts_dash_test_1';
  const modeloAnaliticoId = 'mod_dim_test_1';
  const metricaId = 'met_dim_test_1';

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
    ativoRepo = new SqliteAtivoDadosRepository(db);
    datasetRepo = new SqliteDatasetAutorizadoRepository(db);
    modeloAnaliticoRepo = new SqliteModeloAnaliticoRepository(db);
    metricaAnaliticaRepo = new SqliteMetricaAnaliticaRepository(db);

    modeloPowerBiRepo = new SqliteModeloPowerBiRepository(db);
    medidaDaxRepo = new SqliteMedidaDaxRepository(db);
    paginaRelatorioRepo = new SqlitePaginaRelatorioRepository(db);
    visualDashboardRepo = new SqliteVisualDashboardRepository(db);

    const now = new Date().toISOString();

    // 1. Seed de Projeto
    await projectRepo.create({
      id: projetoId,
      nome: 'Projeto BI Dashboard Test',
      descricao: null,
      status: 'ATIVO',
      data_inicio: now,
      data_conclusao_prevista: null,
      data_conclusao_real: null,
      criado_em: now,
      atualizado_em: now,
    });

    // 2. Seed de Demandas A e B
    await demandRepo.create({
      id: demandaIdA,
      projeto_id: projetoId,
      titulo: 'Demanda Dashboard A',
      solicitacao_bruta: 'Construir Dashboard Executivo A',
      contexto: null,
      objetivo_inicial: null,
      prazo_esperado: null,
      restricoes_declaradas: null,
      estado: EstadoDemanda.EM_VALIDACAO,
      estado_anterior: EstadoDemanda.EM_MODELAGEM_E_ANALISE,
      criado_em: now,
      atualizado_em: now,
      data_conclusao: null,
    });

    await demandRepo.create({
      id: demandaIdB,
      projeto_id: projetoId,
      titulo: 'Demanda Dashboard B',
      solicitacao_bruta: 'Construir Dashboard B',
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

    // 3. Seed de Ativo e Dataset Autorizado
    await ativoRepo.create({
      id: ativoId,
      demanda_id: demandaIdA,
      nome_arquivo: 'vendas.csv',
      caminho_local: 'data/vendas.csv',
      formato: FormatoArquivo.CSV,
      origem: null,
      descricao_conteudo: null,
      granularidade: null,
      periodo_inicio: null,
      periodo_fim: null,
      versao: '1.0',
      tamanho_bytes: 1000,
      total_linhas: 50,
      total_colunas: 5,
      hash_sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      status: StatusAtivoDados.ATIVO,
      schema_inferido: null,
      data_recebimento: now,
      criado_em: now,
      atualizado_em: now,
    });

    const diagId = 'diag_dash_test_1';
    await db.insert(schema.diagnosticosQualidade).values({
      id: diagId,
      ativo_dados_id: ativoId,
      demanda_id: demandaIdA,
      iniciado_em: now,
      concluido_em: now,
      status_execucao: 'CONCLUIDO',
      criado_em: now,
      atualizado_em: now,
    }).run();

    await db.insert(schema.datasetsAutorizados).values({
      id: datasetId,
      demanda_id: demandaIdA,
      ativo_dados_id: ativoId,
      diagnostico_qualidade_id: diagId,
      receita_preparacao_id: null,
      versao_rotulo: 'v1.0',
      hash_sha256_snapshot: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      status: 'VIGENTE',
      autorizado_por_tipo: 'HUMANO',
      autorizado_em: now,
      justificativa_autorizacao: 'Dataset autorizado para testes com justificativa completa.',
    }).run();

    // 4. Seed de Modelo Analítico Homologado
    await modeloAnaliticoRepo.create({
      id: modeloAnaliticoId,
      demanda_id: demandaIdA,
      dataset_autorizado_id: datasetId,
      nome: 'Modelo Star Vendas',
      descricao: 'Modelo dimensional para testes de integração',
      tipo_arquitetura: TipoArquiteturaModelo.ESTRELA,
      status: StatusModeloAnalitico.HOMOLOGADO,
      homologado_em: now,
      homologado_por: 'HUMANO',
      justificativa_homologacao: 'Modelo homologado com conformidade integral.',
      revogado_em: null,
      motivo_revogacao: null,
      criado_em: now,
      atualizado_em: now,
    });

    // 5. Seed de Métrica Analítica
    await metricaAnaliticaRepo.create({
      id: metricaId,
      modelo_id: modeloAnaliticoId,
      entidade_id: null,
      nome: 'Faturamento Total',
      descricao: 'Soma dos valores faturados',
      tipo_agregacao: TipoAgregacaoMetrica.SOMA,
      tipo_aditividade: TipoAditividadeMetrica.TOTALMENTE_ADITIVA,
      formula_declarativa: 'SUM(fVendas[valor])',
      unidade_medida: UnidadeMedidaMetrica.MOEDA,
      formato_exibicao: 'R$ #,##0.00',
      status: StatusMetricaAnalitica.HOMOLOGADA,
      atributos_dependentes_ids: [],
      metricas_dependentes_ids: [],
      pergunta_negocio_associada: 'Qual o faturamento?',
      objetivo_negocio_associado: 'Acompanhar receita',
      ordem: 1,
      criado_em: now,
      atualizado_em: now,
    });
  });

  afterAll(() => {
    try {
      sqliteDb.close();
      if (fs.existsSync(testDbPath)) {
        fs.unlinkSync(testDbPath);
      }
    } catch {
      // Ignora erro de cleanup de arquivo em SO Windows
    }
  });

  it('deve realizar CRUD completo de ModeloPowerBi', async () => {
    const now = new Date().toISOString();
    const pbiId = 'pbi_crud_1';

    // Create
    const novoModelo = await modeloPowerBiRepo.create({
      id: pbiId,
      demanda_id: demandaIdA,
      modelo_analitico_id: modeloAnaliticoId,
      nome_arquivo: 'dashboard_vendas.pbix',
      caminho_local: 'C:\\Projetos\\dashboard_vendas.pbix',
      tipo_formato: TipoFormatoModeloPowerBi.PBIX,
      status: StatusModeloPowerBi.EM_DESENVOLVIMENTO,
      justificativa_isencao: null,
      hash_sha256: 'abc123hash',
      versao_powerbi: '2.128.0',
      tamanho_bytes: 409600,
      criado_em: now,
      atualizado_em: now,
    });

    expect(novoModelo.id).toBe(pbiId);

    // Read by ID
    const recuperado = await modeloPowerBiRepo.findById(pbiId);
    expect(recuperado).not.toBeNull();
    expect(recuperado?.nome_arquivo).toBe('dashboard_vendas.pbix');
    expect(recuperado?.tipo_formato).toBe(TipoFormatoModeloPowerBi.PBIX);

    // Update
    recuperado!.status = StatusModeloPowerBi.HOMOLOGADO;
    recuperado!.atualizado_em = new Date().toISOString();
    const atualizado = await modeloPowerBiRepo.update(recuperado!);
    expect(atualizado.status).toBe(StatusModeloPowerBi.HOMOLOGADO);

    // Delete
    await modeloPowerBiRepo.delete(pbiId);
    const posDelete = await modeloPowerBiRepo.findById(pbiId);
    expect(posDelete).toBeNull();
  });

  it('deve suportar modelo ISENTO_EXCEL_ONLY com justificativa', async () => {
    const now = new Date().toISOString();
    const isentoId = 'pbi_isento_1';

    await modeloPowerBiRepo.create({
      id: isentoId,
      demanda_id: demandaIdB,
      modelo_analitico_id: null,
      nome_arquivo: 'isencao_powerbi.txt',
      caminho_local: null,
      tipo_formato: TipoFormatoModeloPowerBi.ISENTO_EXCEL_ONLY,
      status: StatusModeloPowerBi.CONCLUIDO,
      justificativa_isencao: 'Entrega acordada estritamente em planilhas Excel tratadas.',
      hash_sha256: null,
      versao_powerbi: null,
      tamanho_bytes: 0,
      criado_em: now,
      atualizado_em: now,
    });

    const isentoRecuperado = await modeloPowerBiRepo.findById(isentoId);
    expect(isentoRecuperado).not.toBeNull();
    expect(isentoRecuperado?.tipo_formato).toBe(TipoFormatoModeloPowerBi.ISENTO_EXCEL_ONLY);
    expect(isentoRecuperado?.justificativa_isencao).toContain('planilhas Excel');
  });

  it('deve realizar CRUD de MedidaDax vinculada ao modelo e à métrica analítica', async () => {
    const now = new Date().toISOString();
    const pbiId = 'pbi_medidas_test';

    await modeloPowerBiRepo.create({
      id: pbiId,
      demanda_id: demandaIdA,
      modelo_analitico_id: modeloAnaliticoId,
      nome_arquivo: 'vendas.pbix',
      caminho_local: null,
      tipo_formato: TipoFormatoModeloPowerBi.PBIX,
      status: StatusModeloPowerBi.EM_DESENVOLVIMENTO,
      justificativa_isencao: null,
      hash_sha256: null,
      versao_powerbi: null,
      tamanho_bytes: 0,
      criado_em: now,
      atualizado_em: now,
    });

    const daxId = 'dax_fat_total';
    await medidaDaxRepo.create({
      id: daxId,
      modelo_powerbi_id: pbiId,
      metrica_analitica_id: metricaId,
      nome: 'Faturamento Total',
      tabela_hospedeira: '_Medidas',
      expressao_dax: 'SUM(fVendas[valor_total])',
      descricao: 'Total faturado no período',
      formato_string: 'R$ #,##0.00',
      categoria_dax: CategoriaMedidaDax.AGREGACAO_SIMPLES,
      ordem: 1,
      criado_em: now,
      atualizado_em: now,
    });

    const daxRecuperada = await medidaDaxRepo.findById(daxId);
    expect(daxRecuperada).not.toBeNull();
    expect(daxRecuperada?.nome).toBe('Faturamento Total');
    expect(daxRecuperada?.categoria_dax).toBe(CategoriaMedidaDax.AGREGACAO_SIMPLES);

    // Consulta por Modelo Power BI
    const medidasDoModelo = await medidaDaxRepo.findByModeloPowerBiId(pbiId);
    expect(medidasDoModelo).toHaveLength(1);

    // Consulta por Métrica Analítica
    const medidasDaMetrica = await medidaDaxRepo.findByMetricaAnaliticaId(metricaId);
    expect(medidasDaMetrica).toHaveLength(1);
    expect(medidasDaMetrica[0].id).toBe(daxId);
  });

  it('deve realizar CRUD de PaginaRelatorio e VisualDashboard', async () => {
    const now = new Date().toISOString();
    const pbiId = 'pbi_pag_test';

    await modeloPowerBiRepo.create({
      id: pbiId,
      demanda_id: demandaIdA,
      modelo_analitico_id: modeloAnaliticoId,
      nome_arquivo: 'relatorio.pbix',
      caminho_local: null,
      tipo_formato: TipoFormatoModeloPowerBi.PBIX,
      status: StatusModeloPowerBi.EM_DESENVOLVIMENTO,
      justificativa_isencao: null,
      hash_sha256: null,
      versao_powerbi: null,
      tamanho_bytes: 0,
      criado_em: now,
      atualizado_em: now,
    });

    const pagId = 'pag_executiva_1';
    await paginaRelatorioRepo.create({
      id: pagId,
      modelo_powerbi_id: pbiId,
      nome: 'Visão Executiva',
      ordem: 1,
      objetivo_analitico: 'Visão macro para diretores',
      publico_alvo: PublicoAlvoPagina.EXECUTIVO,
      layout_grid: LayoutGridPagina.PADRAO_16_9,
      criado_em: now,
      atualizado_em: now,
    });

    const visId = 'vis_kpi_1';
    await visualDashboardRepo.create({
      id: visId,
      pagina_id: pagId,
      titulo: 'Total Faturado',
      tipo_visual: TipoVisualDashboard.CARTAO_KPI,
      posicao_layout: PosicaoLayoutVisual.TOPO_KPIS,
      medidas_utilizadas_ids: ['dax_fat_total'],
      atributos_utilizados_ids: [],
      justificativa_dataviz: 'Cartão de número grande para visualização imediata do KPI principal.',
      ordem: 1,
      criado_em: now,
      atualizado_em: now,
    });

    // Recupera página com visuais aninhados
    const pagComVisuais = await paginaRelatorioRepo.findComVisuaisById(pagId);
    expect(pagComVisuais).not.toBeNull();
    expect(pagComVisuais?.nome).toBe('Visão Executiva');
    expect(pagComVisuais?.visuais).toHaveLength(1);
    expect(pagComVisuais?.visuais[0].titulo).toBe('Total Faturado');
    expect(pagComVisuais?.visuais[0].posicao_layout).toBe(PosicaoLayoutVisual.TOPO_KPIS);
  });

  it('deve carregar o modelo completo (ModeloPowerBiCompleto) com medidas, páginas e visuais aninhados', async () => {
    const now = new Date().toISOString();
    const pbiId = 'pbi_completo_test';

    await modeloPowerBiRepo.create({
      id: pbiId,
      demanda_id: demandaIdA,
      modelo_analitico_id: modeloAnaliticoId,
      nome_arquivo: 'dashboard_completo.pbix',
      caminho_local: 'C:\\BI\\completo.pbix',
      tipo_formato: TipoFormatoModeloPowerBi.PBIX,
      status: StatusModeloPowerBi.EM_DESENVOLVIMENTO,
      justificativa_isencao: null,
      hash_sha256: null,
      versao_powerbi: null,
      tamanho_bytes: 1024,
      criado_em: now,
      atualizado_em: now,
    });

    await medidaDaxRepo.create({
      id: 'dax_c1',
      modelo_powerbi_id: pbiId,
      metrica_analitica_id: null,
      nome: 'Qtd Vendas',
      tabela_hospedeira: '_Medidas',
      expressao_dax: 'COUNTROWS(fVendas)',
      descricao: null,
      formato_string: '#,##0',
      categoria_dax: CategoriaMedidaDax.AGREGACAO_SIMPLES,
      ordem: 1,
      criado_em: now,
      atualizado_em: now,
    });

    await paginaRelatorioRepo.create({
      id: 'pag_c1',
      modelo_powerbi_id: pbiId,
      nome: 'Página 1',
      ordem: 1,
      objetivo_analitico: 'Geral',
      publico_alvo: PublicoAlvoPagina.GERENCIAL,
      layout_grid: LayoutGridPagina.PADRAO_16_9,
      criado_em: now,
      atualizado_em: now,
    });

    await visualDashboardRepo.create({
      id: 'vis_c1',
      pagina_id: 'pag_c1',
      titulo: 'Tendência Mensal',
      tipo_visual: TipoVisualDashboard.GRAFICO_LINHAS,
      posicao_layout: PosicaoLayoutVisual.CENTRAL_TENDENCIAS,
      medidas_utilizadas_ids: ['dax_c1'],
      atributos_utilizados_ids: ['col_data'],
      justificativa_dataviz: 'Apresenta evolução temporal.',
      ordem: 1,
      criado_em: now,
      atualizado_em: now,
    });

    const modeloCompleto = await modeloPowerBiRepo.findCompletoById(pbiId);
    expect(modeloCompleto).not.toBeNull();
    expect(modeloCompleto?.medidas).toHaveLength(1);
    expect(modeloCompleto?.medidas[0].nome).toBe('Qtd Vendas');
    expect(modeloCompleto?.paginas).toHaveLength(1);
    expect(modeloCompleto?.paginas[0].visuais).toHaveLength(1);
    expect(modeloCompleto?.paginas[0].visuais[0].titulo).toBe('Tendência Mensal');
  });

  it('deve assegurar integridade referencial: CASCADE delete ao excluir o ModeloPowerBi', async () => {
    const now = new Date().toISOString();
    const pbiId = 'pbi_cascade_test';
    const pagId = 'pag_cascade_test';
    const daxId = 'dax_cascade_test';
    const visId = 'vis_cascade_test';

    await modeloPowerBiRepo.create({
      id: pbiId,
      demanda_id: demandaIdA,
      modelo_analitico_id: null,
      nome_arquivo: 'cascade.pbix',
      caminho_local: null,
      tipo_formato: TipoFormatoModeloPowerBi.PBIX,
      status: StatusModeloPowerBi.EM_DESENVOLVIMENTO,
      justificativa_isencao: null,
      hash_sha256: null,
      versao_powerbi: null,
      tamanho_bytes: 0,
      criado_em: now,
      atualizado_em: now,
    });

    await medidaDaxRepo.create({
      id: daxId,
      modelo_powerbi_id: pbiId,
      metrica_analitica_id: null,
      nome: 'M1',
      tabela_hospedeira: '_Medidas',
      expressao_dax: '1',
      descricao: null,
      formato_string: null,
      categoria_dax: CategoriaMedidaDax.OUTRO,
      ordem: 1,
      criado_em: now,
      atualizado_em: now,
    });

    await paginaRelatorioRepo.create({
      id: pagId,
      modelo_powerbi_id: pbiId,
      nome: 'P1',
      ordem: 1,
      objetivo_analitico: null,
      publico_alvo: PublicoAlvoPagina.OPERACIONAL,
      layout_grid: LayoutGridPagina.PADRAO_16_9,
      criado_em: now,
      atualizado_em: now,
    });

    await visualDashboardRepo.create({
      id: visId,
      pagina_id: pagId,
      titulo: 'V1',
      tipo_visual: TipoVisualDashboard.CARTAO_KPI,
      posicao_layout: PosicaoLayoutVisual.TOPO_KPIS,
      medidas_utilizadas_ids: [],
      atributos_utilizados_ids: [],
      justificativa_dataviz: null,
      ordem: 1,
      criado_em: now,
      atualizado_em: now,
    });

    // Exclui o Modelo Power BI
    await modeloPowerBiRepo.delete(pbiId);

    // Valida que as medidas, páginas e visuais foram removidos em cascata
    expect(await medidaDaxRepo.findById(daxId)).toBeNull();
    expect(await paginaRelatorioRepo.findById(pagId)).toBeNull();
    expect(await visualDashboardRepo.findById(visId)).toBeNull();
  });

  it('deve assegurar comportamento SET NULL ao excluir ModeloAnalitico ou MetricaAnalitica vinculada', async () => {
    const now = new Date().toISOString();

    // Cria modelo analítico temporário
    const modTempId = 'mod_temp_setnull';
    await modeloAnaliticoRepo.create({
      id: modTempId,
      demanda_id: demandaIdA,
      dataset_autorizado_id: datasetId,
      nome: 'Modelo Temp',
      descricao: null,
      tipo_arquitetura: TipoArquiteturaModelo.TABELA_UNICA,
      status: StatusModeloAnalitico.RASCUNHO,
      homologado_em: null,
      homologado_por: null,
      justificativa_homologacao: null,
      revogado_em: null,
      motivo_revogacao: null,
      criado_em: now,
      atualizado_em: now,
    });

    // Cria métrica temporária
    const metTempId = 'met_temp_setnull';
    await metricaAnaliticaRepo.create({
      id: metTempId,
      modelo_id: modTempId,
      entidade_id: null,
      nome: 'Métrica Temp',
      descricao: null,
      tipo_agregacao: TipoAgregacaoMetrica.SOMA,
      tipo_aditividade: TipoAditividadeMetrica.TOTALMENTE_ADITIVA,
      formula_declarativa: '1',
      unidade_medida: UnidadeMedidaMetrica.QUANTIDADE,
      formato_exibicao: null,
      status: StatusMetricaAnalitica.RASCUNHO,
      atributos_dependentes_ids: [],
      metricas_dependentes_ids: [],
      pergunta_negocio_associada: null,
      objetivo_negocio_associado: null,
      ordem: 1,
      criado_em: now,
      atualizado_em: now,
    });

    // Cria modelo Power BI e Medida vinculados aos itens temporários
    const pbiSetNullId = 'pbi_setnull_test';
    await modeloPowerBiRepo.create({
      id: pbiSetNullId,
      demanda_id: demandaIdA,
      modelo_analitico_id: modTempId,
      nome_arquivo: 'setnull.pbix',
      caminho_local: null,
      tipo_formato: TipoFormatoModeloPowerBi.PBIX,
      status: StatusModeloPowerBi.EM_DESENVOLVIMENTO,
      justificativa_isencao: null,
      hash_sha256: null,
      versao_powerbi: null,
      tamanho_bytes: 0,
      criado_em: now,
      atualizado_em: now,
    });

    const daxSetNullId = 'dax_setnull_test';
    await medidaDaxRepo.create({
      id: daxSetNullId,
      modelo_powerbi_id: pbiSetNullId,
      metrica_analitica_id: metTempId,
      nome: 'Medida Vinculada Temp',
      tabela_hospedeira: '_Medidas',
      expressao_dax: '10',
      descricao: null,
      formato_string: null,
      categoria_dax: CategoriaMedidaDax.OUTRO,
      ordem: 1,
      criado_em: now,
      atualizado_em: now,
    });

    // Exclui a métrica analítica temporária
    await metricaAnaliticaRepo.delete(metTempId);
    const daxPosDelete = await medidaDaxRepo.findById(daxSetNullId);
    expect(daxPosDelete).not.toBeNull();
    expect(daxPosDelete?.metrica_analitica_id).toBeNull(); // Set null confirmado!

    // Exclui o modelo analítico temporário
    await modeloAnaliticoRepo.delete(modTempId);
    const pbiPosDelete = await modeloPowerBiRepo.findById(pbiSetNullId);
    expect(pbiPosDelete).not.toBeNull();
    expect(pbiPosDelete?.modelo_analitico_id).toBeNull(); // Set null confirmado!
  });

  it('deve assegurar isolamento entre demandas (dados da demanda A não vazam para demanda B)', async () => {
    const modelosDemandaA = await modeloPowerBiRepo.findByDemandaId(demandaIdA);
    const modelosDemandaB = await modeloPowerBiRepo.findByDemandaId(demandaIdB);

    expect(modelosDemandaA.length).toBeGreaterThan(0);
    expect(modelosDemandaB.length).toBe(1);
    expect(modelosDemandaB[0].id).toBe('pbi_isento_1');

    // Nenhum ID de A deve estar presente na lista de B
    const idsB = modelosDemandaB.map((m) => m.id);
    for (const modA of modelosDemandaA) {
      expect(idsB).not.toContain(modA.id);
    }
  });
});
