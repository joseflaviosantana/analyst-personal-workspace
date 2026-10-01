/**
 * tests/integration/evidence-events/dashboard-evidence-integration.spec.ts
 *
 * Testes de Integração: Evidence Event Engine com Power BI / DAX / Dashboard (Subgate 3.5B.4).
 * Testa o fluxo completo real:
 * Server Actions -> Repositórios SQLite -> Evidence Event Engine -> eventos_analiticos_log + evidencias_analiticas.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import fs from 'fs';
import * as schema from '@/infrastructure/db/schema';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { SqliteProjectRepository } from '@/infrastructure/db/repositories/project-repository';
import { SqliteDemandRepository } from '@/infrastructure/db/repositories/demand-repository';
import { SqliteModeloPowerBiRepository } from '@/infrastructure/db/repositories/sqlite-modelo-powerbi-repository';
import { SqliteMedidaDaxRepository } from '@/infrastructure/db/repositories/sqlite-medida-dax-repository';
import { SqlitePaginaRelatorioRepository } from '@/infrastructure/db/repositories/sqlite-pagina-relatorio-repository';
import { SqliteVisualDashboardRepository } from '@/infrastructure/db/repositories/sqlite-visual-dashboard-repository';
import { SqliteModeloAnaliticoRepository } from '@/infrastructure/db/repositories/sqlite-modelo-analitico-repository';
import { SqliteDatasetAutorizadoRepository } from '@/infrastructure/db/repositories/sqlite-dataset-autorizado-repository';
import { SqliteEvidenciaAnaliticaRepository } from '@/infrastructure/db/repositories/sqlite-evidencia-analitica-repository';
import { SqliteEventoAnaliticoLogRepository } from '@/infrastructure/db/repositories/sqlite-evento-analitico-log-repository';

import { criarEvidenceEventEnginePadrao } from '@/core/domain/evidence-events/engine-factory';
import { ProcessarEventoAnaliticoUseCase } from '@/core/use-cases/evidence/processar-evento-analitico.use-case';
import { RegistrarEvidenciaUseCase } from '@/core/use-cases/evidence/registrar-evidencia.use-case';
import { ConsultarEvidenciasDemandaUseCase } from '@/core/use-cases/evidence/consultar-evidencias-demanda.use-case';

import {
  criarModeloPowerBiAction,
  atualizarModeloPowerBiAction,
  criarMedidaDaxAction,
  criarPaginaRelatorioAction,
  criarVisualDashboardAction,
  aprovarPropostaDashboardAction,
  DashboardActionDeps,
} from '@/app/actions/dashboard-actions';

import { TipoFormatoModeloPowerBi } from '@/core/domain/enums/tipo-formato-modelo-powerbi';
import { StatusModeloPowerBi } from '@/core/domain/enums/status-modelo-powerbi';
import { CategoriaMedidaDax } from '@/core/domain/enums/categoria-medida-dax';
import { PublicoAlvoPagina } from '@/core/domain/enums/publico-alvo-pagina';
import { LayoutGridPagina } from '@/core/domain/enums/layout-grid-pagina';
import { TipoVisualDashboard } from '@/core/domain/enums/tipo-visual-dashboard';
import { PosicaoLayoutVisual } from '@/core/domain/enums/posicao-layout-visual';
import { DashboardSpecification } from '@/core/domain/dashboard-automation/dashboard-specification';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { TipoEvidenciaAnalitica } from '@/core/domain/enums/tipo-evidencia-analitica';
import { EtapaOrigemEvidencia } from '@/core/domain/enums/etapa-origem-evidencia';

describe('Integration Tests: Evidence Event Engine com Dashboard & DAX (Subgate 3.5B.4)', () => {
  const testDbDir = path.join(process.cwd(), '.workspace', 'data');
  const testDbPath = path.join(testDbDir, 'test_subgate_35b4_dashboard.db');
  let sqliteDb: Database.Database;
  let db: ReturnType<typeof drizzle<typeof schema>>;

  let projectRepo: SqliteProjectRepository;
  let demandRepo: SqliteDemandRepository;
  let modeloPowerBiRepo: SqliteModeloPowerBiRepository;
  let medidaDaxRepo: SqliteMedidaDaxRepository;
  let paginaRepo: SqlitePaginaRelatorioRepository;
  let visualRepo: SqliteVisualDashboardRepository;
  let modeloAnaliticoRepo: SqliteModeloAnaliticoRepository;
  let datasetAutorizadoRepo: SqliteDatasetAutorizadoRepository;
  let evidenciaRepo: SqliteEvidenciaAnaliticaRepository;
  let eventLogRepo: SqliteEventoAnaliticoLogRepository;

  let eventEngine: ReturnType<typeof criarEvidenceEventEnginePadrao>;
  let registrarEvidenciaUseCase: RegistrarEvidenciaUseCase;
  let consultarEvidenciasUseCase: ConsultarEvidenciasDemandaUseCase;
  let processarEventoUseCase: ProcessarEventoAnaliticoUseCase;
  let deps: DashboardActionDeps;

  const projetoId = 'prj_integration_35b4';
  const demandaIdA = 'dem_integration_35b4_A';
  const demandaIdB = 'dem_integration_35b4_B';

  beforeAll(async () => {
    if (!fs.existsSync(testDbDir)) {
      fs.mkdirSync(testDbDir, { recursive: true });
    }
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    sqliteDb = new Database(testDbPath);
    sqliteDb.pragma('foreign_keys = ON');
    db = drizzle(sqliteDb, { schema });

    const migrationsFolder = path.join(process.cwd(), 'drizzle');
    migrate(db, { migrationsFolder });

    // Instancia os repositórios reais com injeção do db de teste
    projectRepo = new SqliteProjectRepository(db);
    demandRepo = new SqliteDemandRepository(db);
    modeloPowerBiRepo = new SqliteModeloPowerBiRepository(db);
    medidaDaxRepo = new SqliteMedidaDaxRepository(db);
    paginaRepo = new SqlitePaginaRelatorioRepository(db);
    visualRepo = new SqliteVisualDashboardRepository(db);
    modeloAnaliticoRepo = new SqliteModeloAnaliticoRepository(db);
    datasetAutorizadoRepo = new SqliteDatasetAutorizadoRepository(db);
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

    deps = {
      demandRepo,
      modeloPowerBiRepo,
      medidaDaxRepo,
      paginaRelatorioRepo: paginaRepo,
      visualDashboardRepo: visualRepo,
      modeloAnaliticoRepo,
      datasetAutorizadoRepo,
      processarEventoUseCase,
    };

    const now = new Date().toISOString();

    // Cria Projeto e Demandas
    await projectRepo.create({
      id: projetoId,
      nome: 'Projeto BI & Dashboard Subgate 3.5B.4',
      descricao: 'Validação integrada de eventos de dashboard com Evidence Core',
      status: 'ATIVO',
      data_inicio: now,
      data_conclusao_prevista: null,
      data_conclusao_real: null,
      criado_em: now,
      atualizado_em: now,
    });

    await demandRepo.create({
      id: demandaIdA,
      projeto_id: projetoId,
      titulo: 'Demanda Analítica A - Vendas',
      solicitacao_bruta: 'Construir painel executivo de vendas',
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
      titulo: 'Demanda Analítica B - Fiscal',
      solicitacao_bruta: 'Entrega tabular Excel de notas fiscais',
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
    if (sqliteDb) {
      sqliteDb.close();
    }
    if (fs.existsSync(testDbPath)) {
      try {
        fs.unlinkSync(testDbPath);
      } catch {
        // Ignora lock residual no Windows
      }
    }
  });

  // ==========================================
  // Teste 1: Registro de Modelo Power BI (.pbix)
  // ==========================================
  it('1. criarModeloPowerBiAction registra modelo .pbix e emite DASHBOARD_MODELO_REGISTRADO', async () => {
    const res = await criarModeloPowerBiAction(
      {
        demandaId: demandaIdA,
        nomeArquivo: 'RelatorioVendas2026.pbix',
        tipoFormato: TipoFormatoModeloPowerBi.PBIX,
        caminhoLocal: 'C:\\Analytics\\RelatorioVendas2026.pbix',
        tamanhoBytes: 1542000,
        status: StatusModeloPowerBi.EM_DESENVOLVIMENTO,
      },
      deps
    );

    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();

    // Consulta evidência gerada
    const { evidencias } = await consultarEvidenciasUseCase.execute({ demanda_id: demandaIdA });
    const evModelo = evidencias.find((e) => e.artefato_origem_tipo === 'MODELO_POWERBI');

    expect(evModelo).toBeDefined();
    expect(evModelo?.titulo).toContain('RelatorioVendas2026.pbix');
    expect(evModelo?.tipo).toBe(TipoEvidenciaAnalitica.DASHBOARD);
    expect(evModelo?.metadados?.autor_tipo).toBe('HUMANO');
    expect(evModelo?.metadados?.captura_automatica).toBe(true);
  });

  // ==========================================
  // Teste 2: Formalização de Isenção (Excel-Only)
  // ==========================================
  it('2. criarModeloPowerBiAction formaliza isenção Excel-Only e emite DASHBOARD_ISENCAO_FORMALIZADA', async () => {
    const res = await criarModeloPowerBiAction(
      {
        demandaId: demandaIdB,
        nomeArquivo: 'Isencao_Excel_Demanda_B',
        tipoFormato: TipoFormatoModeloPowerBi.ISENTO_EXCEL_ONLY,
        justificativaIsencao: 'Demanda de conciliação fiscal com entrega exclusivamente em planilhas Excel consolidadas.',
        status: StatusModeloPowerBi.HOMOLOGADO,
      },
      deps
    );

    expect(res.success).toBe(true);

    const { evidencias: evidenciasB } = await consultarEvidenciasUseCase.execute({ demanda_id: demandaIdB });
    const evIsencao = evidenciasB.find((e) => e.titulo.includes('Formalização de Isenção'));

    expect(evIsencao).toBeDefined();
    expect(evIsencao?.decisao_humana).toBe(
      'Demanda de conciliação fiscal com entrega exclusivamente em planilhas Excel consolidadas.'
    );
    expect(evIsencao?.metadados?.tipo_formato).toBe('ISENTO_EXCEL_ONLY');
  });

  // ==========================================
  // Teste 3: Cadastro de Medida DAX (Rigor Epistêmico: Sem atestar competência)
  // ==========================================
  it('3. criarMedidaDaxAction emite DASHBOARD_MEDIDA_DAX_CADASTRADA com registro puramente factual', async () => {
    const modelos = await modeloPowerBiRepo.findByDemandaId(demandaIdA);
    const modeloId = modelos[0].id;

    const res = await criarMedidaDaxAction(
      {
        modeloPowerBiId: modeloId,
        nome: 'Receita Total Liquida',
        tabelaHospedeira: '_Medidas',
        expressaoDax: 'SUM(fVendas[ValorTotal]) - SUM(fVendas[Desconto])',
        categoriaDax: CategoriaMedidaDax.AGREGACAO_SIMPLES,
        formatoString: 'R$ #,##0.00',
        descricao: 'Calcula receita líquida deduzindo descontos concedidos.',
      },
      demandaIdA,
      deps
    );

    expect(res.success).toBe(true);

    const { evidencias } = await consultarEvidenciasUseCase.execute({ demanda_id: demandaIdA });
    const evDax = evidencias.find((e) => e.artefato_origem_tipo === 'MEDIDA_DAX');

    expect(evDax).toBeDefined();
    expect(evDax?.titulo).toBe('Cadastro de Medida DAX: Receita Total Liquida');
    expect(evDax?.tipo).toBe(TipoEvidenciaAnalitica.DAX);

    // Rigor Epistêmico (Item 1): Registro Factual
    expect(evDax?.resultado_mensuravel).toContain('1 medida DAX cadastrada');
    expect(evDax?.resultado_mensuravel).toContain('não certifica isoladamente competência em DAX');
    expect(evDax?.descricao).not.toContain('demonstra competência');
  });

  // ==========================================
  // Teste 4: Medida DAX com DIVIDE() (Rigor Epistêmico: Fato observável sem inferir intenção)
  // ==========================================
  it('4. medida com DIVIDE() registra o fato observável de uso da função sem presumir intenção defensiva', async () => {
    const modelos = await modeloPowerBiRepo.findByDemandaId(demandaIdA);
    const modeloId = modelos[0].id;

    const res = await criarMedidaDaxAction(
      {
        modeloPowerBiId: modeloId,
        nome: 'Margem Percentual',
        tabelaHospedeira: '_Medidas',
        expressaoDax: 'DIVIDE([Lucro], [Receita], 0)',
        categoriaDax: CategoriaMedidaDax.TAXA_DIVISAO,
        formatoString: '0.0%',
        descricao: null, // Sem declaração de intenção
      },
      demandaIdA,
      deps
    );

    expect(res.success).toBe(true);

    const { evidencias } = await consultarEvidenciasUseCase.execute({ demanda_id: demandaIdA });
    const evMargem = evidencias.find((e) => e.titulo.includes('Margem Percentual'));

    expect(evMargem).toBeDefined();
    expect(evMargem?.fato_observado).toContain('A expressão utiliza a função DIVIDE().');
    expect(evMargem?.metadados?.usa_divide).toBe(true);
    expect(evMargem?.decisao_humana).toBeNull(); // Não inventou intenção defensiva
    expect(evMargem?.acao_registrada).toBe('Implementação técnica de expressão de cálculo tabular DAX pelo analista.');
  });

  // ==========================================
  // Teste 5: Criação de Página de Relatório
  // ==========================================
  it('5. criarPaginaRelatorioAction emite DASHBOARD_PAGINA_ESTRUTURADA', async () => {
    const modelos = await modeloPowerBiRepo.findByDemandaId(demandaIdA);
    const modeloId = modelos[0].id;

    const res = await criarPaginaRelatorioAction(
      {
        modeloPowerBiId: modeloId,
        nome: 'Visão Geral Executiva',
        objetivoAnalitico: 'Acompanhar o desempenho mensal consolidado de faturamento e margens.',
        publicoAlvo: PublicoAlvoPagina.EXECUTIVO,
        layoutGrid: LayoutGridPagina.PADRAO_16_9,
      },
      demandaIdA,
      deps
    );

    expect(res.success).toBe(true);

    const { evidencias } = await consultarEvidenciasUseCase.execute({ demanda_id: demandaIdA });
    const evPagina = evidencias.find((e) => e.artefato_origem_tipo === 'PAGINA_RELATORIO');

    expect(evPagina).toBeDefined();
    expect(evPagina?.titulo).toBe('Estruturação de Página de Relatório: Visão Geral Executiva');
    expect(evPagina?.resultado_mensuravel).toContain('sem certificar isoladamente competência em design');
  });

  // ==========================================
  // Teste 6: Criação de Visual com Justificativa DataViz
  // ==========================================
  it('6. criarVisualDashboardAction emite DASHBOARD_VISUAL_DEFINIDO', async () => {
    const paginas = await paginaRepo.findByModeloPowerBiId((await modeloPowerBiRepo.findByDemandaId(demandaIdA))[0].id);
    const paginaId = paginas[0].id;
    const medidas = await medidaDaxRepo.findByModeloPowerBiId((await modeloPowerBiRepo.findByDemandaId(demandaIdA))[0].id);

    const res = await criarVisualDashboardAction(
      {
        paginaId,
        titulo: 'KPI Faturamento Consolidado',
        tipoVisual: TipoVisualDashboard.CARTAO_KPI,
        posicaoLayout: PosicaoLayoutVisual.TOPO_KPIS,
        medidasUtilizadasIds: [medidas[0].id],
        atributosUtilizadosIds: [],
        justificativaDataviz: 'Cartão de KPI em destaque para leitura executiva rápida no padrão Z-pattern.',
      },
      demandaIdA,
      deps
    );

    expect(res.success).toBe(true);

    const { evidencias } = await consultarEvidenciasUseCase.execute({ demanda_id: demandaIdA });
    const evVisual = evidencias.find((e) => e.artefato_origem_tipo === 'VISUAL_DASHBOARD');

    expect(evVisual).toBeDefined();
    expect(evVisual?.titulo).toBe('Definição de Componente Visual: KPI Faturamento Consolidado');
    expect(evVisual?.resultado_mensuravel).toContain('sem certificar isoladamente competência em DataViz');
    expect(evVisual?.decisao_humana).toBe(
      'Cartão de KPI em destaque para leitura executiva rápida no padrão Z-pattern.'
    );
  });

  // ==========================================
  // Teste 7: Aprovação de Proposta Arquitetural (Idempotência e Human-in-the-Loop)
  // ==========================================
  it('7. aprovarPropostaDashboardAction emite DASHBOARD_ARQUITETURA_APROVADA usando ID de página persistida', async () => {
    const modelos = await modeloPowerBiRepo.findByDemandaId(demandaIdA);
    const modeloId = modelos[0].id;

    const propostaMock: DashboardSpecification = {
      demandaId: demandaIdA,
      modeloPowerBiId: modeloId,
      templateUtilizado: 'Executive' as any,
      modoTrabalho: 'AUTOMATICO',
      titulo: 'Dashboard Automatizado de Vendas',
      resumoExecutivo: 'Proposta gerada pelo motor planner',
      designTokens: {} as any,
      paginas: [
        {
          id: 'temp_spec_p1',
          nome: 'Desempenho Comercial por Região',
          objetivoAnalitico: 'Comparar vendas regionais',
          publicoAlvo: PublicoAlvoPagina.GERENCIAL,
          layoutGrid: LayoutGridPagina.PADRAO_16_9,
          ordem: 2,
          perguntasAtendidas: [],
          narrativa: '',
          justificativa: '',
          statusAprovacao: 'APROVADO',
          visuais: [
            {
              id: 'temp_spec_v1',
              titulo: 'Vendas por Filial',
              tipoVisual: TipoVisualDashboard.GRAFICO_BARRAS,
              posicaoLayout: PosicaoLayoutVisual.CENTRAL_TENDENCIAS,
              larguraColunas: 6,
              ordem: 1,
              medidaDaxId: null,
              medidaDaxNome: null,
              metricaAnaliticaId: null,
              metricaAnaliticaNome: null,
              atributosUtilizadosIds: [],
              justificativaDataViz: {
                oQueFoiEscolhido: 'Gráfico de barras',
                porQueFoiEscolhido: 'Facilita comparação ranking',
                perguntaRespondida: 'Qual filial vendeu mais?',
                metricaUtilizada: 'Vendas',
                dicaProfissional: 'Ordenar decrescente',
                aprendaEnquantoTrabalha: '',
              },
              alternativasRecomendadas: [],
              statusAprovacao: 'APROVADO',
              dependenciaDaxPendente: false,
            },
          ],
        },
      ],
      totalPaginas: 1,
      totalVisuais: 1,
      statusGeral: 'APROVADO',
      geradoEm: new Date().toISOString(),
    };

    const res = await aprovarPropostaDashboardAction(demandaIdA, propostaMock, deps);
    expect(res.success).toBe(true);

    const { evidencias } = await consultarEvidenciasUseCase.execute({ demanda_id: demandaIdA });
    const evArq = evidencias.find((e) => e.artefato_origem_tipo === 'ARQUITETURA_DASHBOARD');

    expect(evArq).toBeDefined();
    expect(evArq?.titulo).toBe('Aprovação Soberana da Arquitetura do Dashboard');
    expect(evArq?.metadados?.decisao_humana_soberana).toBe(true);
    expect(evArq?.metadados?.gerado_com_auxilio_copiloto).toBe(true);
    expect(evArq?.artefato_origem_id).toBe(res.data?.paginas[0].id);
  });

  // ==========================================
  // Teste 8: CONCLUIDO != HOMOLOGADO (Semântica de Estados Distintos)
  // ==========================================
  it('8. atualizarModeloPowerBiAction emite DASHBOARD_MODELO_CONCLUIDO para status CONCLUIDO', async () => {
    const modelos = await modeloPowerBiRepo.findByDemandaId(demandaIdA);
    const modeloId = modelos[0].id;

    const res = await atualizarModeloPowerBiAction(
      {
        id: modeloId,
        status: StatusModeloPowerBi.CONCLUIDO,
      },
      demandaIdA,
      deps
    );

    expect(res.success).toBe(true);

    const { evidencias } = await consultarEvidenciasUseCase.execute({ demanda_id: demandaIdA });
    const evConcluido = evidencias.find((e) => e.titulo.includes('Conclusão Técnica da Construção'));

    expect(evConcluido).toBeDefined();
    expect(evConcluido?.titulo).not.toContain('Homologação');
    expect(evConcluido?.resultado_mensuravel).toContain('sem constituir homologação formal de negócio');
  });

  it('9. atualizarModeloPowerBiAction emite DASHBOARD_MODELO_HOMOLOGADO para status HOMOLOGADO', async () => {
    const modelos = await modeloPowerBiRepo.findByDemandaId(demandaIdA);
    const modeloId = modelos[0].id;

    const res = await atualizarModeloPowerBiAction(
      {
        id: modeloId,
        status: StatusModeloPowerBi.HOMOLOGADO,
      },
      demandaIdA,
      deps
    );

    expect(res.success).toBe(true);

    const { evidencias } = await consultarEvidenciasUseCase.execute({ demanda_id: demandaIdA });
    const evHomologado = evidencias.find((e) => e.titulo.includes('Homologação Formal do Modelo de Dashboard'));

    expect(evHomologado).toBeDefined();
    expect(evHomologado?.acao_registrada).toContain('Decisão humana formal de homologação e aceitação do dashboard');
    expect(evHomologado?.metadados?.decisao_humana_soberana).toBe(true);
  });

  // ==========================================
  // Teste 10: Contenção de Falha (Isolamento do Motor de Eventos)
  // ==========================================
  it('10. falha na emissão de evento não quebra a Server Action de dashboard', async () => {
    const modelos = await modeloPowerBiRepo.findByDemandaId(demandaIdA);
    const modeloId = modelos[0].id;

    // Injeta mock com erro forçado no processarEventoUseCase
    const depsComFalha: DashboardActionDeps = {
      ...deps,
      processarEventoUseCase: {
        execute: async () => {
          throw new Error('Falha catastrófica simulada no banco de eventos analíticos');
        },
      } as any,
    };

    const res = await criarMedidaDaxAction(
      {
        modeloPowerBiId: modeloId,
        nome: 'Medida Teste Resiliencia',
        tabelaHospedeira: '_Medidas',
        expressaoDax: '1 + 1',
        categoriaDax: CategoriaMedidaDax.AGREGACAO_SIMPLES,
      },
      demandaIdA,
      depsComFalha
    );

    // A action de negócio deve concluir com sucesso!
    expect(res.success).toBe(true);
    expect(res.data?.nome).toBe('Medida Teste Resiliencia');
  });

  // ==========================================
  // Teste 11: Idempotência de Reprocessamento
  // ==========================================
  it('11. reprocessamento do mesmo evento analítico deduplica no log sem duplicar evidência', async () => {
    const idEvento = 'evt_dash_dax_idem_1';
    const evento = {
      id_evento: idEvento,
      demanda_id: demandaIdA,
      etapa_origem: EtapaOrigemEvidencia.POWERBI_DASHBOARD,
      categoria: 'DAX' as const,
      tipo_evento: 'DASHBOARD_MEDIDA_DAX_CADASTRADA',
      ocorrido_em: '2026-10-01T15:00:00Z',
      executor: 'ANALISTA',
      payload: {
        medidaId: 'med_idem_1',
        modeloPowerBiId: 'mod_1',
        nome: 'Medida Idempotente',
        tabelaHospedeira: '_Medidas',
        expressaoDax: 'COUNTROWS(tabela)',
        categoriaDax: CategoriaMedidaDax.AGREGACAO_SIMPLES,
        cadastradaEm: '2026-10-01T15:00:00Z',
      },
      versao_contrato: '1.0',
    };

    // 1º processamento: cria evidência
    const res1 = await processarEventoUseCase.execute(evento);
    expect(res1.status_processamento).toBe('REGISTRADO');
    expect(res1.ja_processado).toBe(false);

    // 2º processamento com o mesmo id_evento: deduplica
    const res2 = await processarEventoUseCase.execute(evento);
    expect(res2.status_processamento).toBe('DUPLICADO');
    expect(res2.ja_processado).toBe(true);
  });

  // ==========================================
  // Teste 12: Segregação por Demanda
  // ==========================================
  it('12. isolamento estrito: eventos da Demanda A não aparecem na Demanda B', async () => {
    const { evidencias: evsA } = await consultarEvidenciasUseCase.execute({ demanda_id: demandaIdA });
    const { evidencias: evsB } = await consultarEvidenciasUseCase.execute({ demanda_id: demandaIdB });

    expect(evsA.length).toBeGreaterThan(0);
    expect(evsB.length).toBe(1); // Somente a isenção de B

    // Nenhuma evidência de A possui demanda_id = B
    expect(evsA.every((e) => e.demanda_id === demandaIdA)).toBe(true);
    expect(evsB.every((e) => e.demanda_id === demandaIdB)).toBe(true);
  });
});
