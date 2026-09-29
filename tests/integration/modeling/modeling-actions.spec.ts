import { describe, it, expect, beforeEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import * as schema from '@/infrastructure/db/schema';
import { SqliteProjectRepository } from '@/infrastructure/db/repositories/project-repository';
import { SqliteDemandRepository } from '@/infrastructure/db/repositories/demand-repository';
import { SqliteAtivoDadosRepository } from '@/infrastructure/db/repositories/ativo-dados-repository';
import { SqliteDatasetAutorizadoRepository } from '@/infrastructure/db/repositories/sqlite-dataset-autorizado-repository';
import { SqliteModeloAnaliticoRepository } from '@/infrastructure/db/repositories/sqlite-modelo-analitico-repository';
import { SqliteEntidadeAnaliticaRepository } from '@/infrastructure/db/repositories/sqlite-entidade-analitica-repository';
import { SqliteAtributoAnaliticoRepository } from '@/infrastructure/db/repositories/sqlite-atributo-analitico-repository';
import { SqliteRelacionamentoAnaliticoRepository } from '@/infrastructure/db/repositories/sqlite-relacionamento-analitico-repository';
import { SqliteMetricaAnaliticaRepository } from '@/infrastructure/db/repositories/sqlite-metrica-analitica-repository';
import { SqliteDiagnosticosQualidadeRepository } from '@/infrastructure/db/repositories/sqlite-diagnosticos-qualidade-repository';
import { SqliteAuditRepository } from '@/infrastructure/db/repositories/audit-repository';
import { StatusExecucaoDiagnostico } from '@/core/domain/enums/status-execucao-diagnostico';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import {
  criarModeloAnaliticoAction,
  atualizarModeloAnaliticoAction,
  obterModeloCompletoAction,
  listarModelosDemandaAction,
  adicionarEntidadeAnaliticaAction,
  configurarAtributosEntidadeAction,
  removerEntidadeAnaliticaAction,
  especificarDimensaoCalendarioAction,
  adicionarRelacionamentoAnaliticoAction,
  removerRelacionamentoAnaliticoAction,
  cadastrarMetricaAnaliticaAction,
  atualizarMetricaAnaliticaAction,
  removerMetricaAnaliticaAction,
  avaliarConformidadeModeloAction,
  verificarProntidaoModeloAction,
  homologarModeloAnaliticoAction,
  revogarHomologacaoModeloAction,
  obterModeloHomologadoVigenteAction,
  ModelingActionDeps,
} from '@/app/actions/modeling-actions';

import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { FormatoArquivo } from '@/core/domain/enums/formato-arquivo';
import { StatusAtivoDados } from '@/core/domain/enums/status-ativo-dados';
import { CategoriaAtivoDados } from '@/core/domain/enums/categoria-ativo-dados';
import { StatusAutorizacaoDataset } from '@/core/domain/enums/status-autorizacao-dataset';
import { StatusModeloAnalitico } from '@/core/domain/enums/status-modelo-analitico';
import { TipoArquiteturaModelo } from '@/core/domain/enums/tipo-arquitetura-modelo';
import { TipoEntidadeAnalitica } from '@/core/domain/enums/tipo-entidade-analitica';
import { PapelEntidadeAnalitica } from '@/core/domain/enums/papel-entidade-analitica';
import { PapelAtributoAnalitico } from '@/core/domain/enums/papel-atributo-analitico';
import { CardinalidadeRelacionamento } from '@/core/domain/enums/cardinalidade-relacionamento';
import { DirecaoFiltroRelacionamento } from '@/core/domain/enums/direcao-filtro-relacionamento';
import { TipoAgregacaoMetrica } from '@/core/domain/enums/tipo-agregacao-metrica';
import { TipoAditividadeMetrica } from '@/core/domain/enums/tipo-aditividade-metrica';
import { UnidadeMedidaMetrica } from '@/core/domain/enums/unidade-medida-metrica';
import { TipoDadoAnalitico } from '@/core/domain/enums/tipo-dado-analitico';

describe('Integration: Server Actions da Modelagem Analítica (Subunidade 3.6D)', () => {
  let sqlite: Database.Database;
  let testDb: ReturnType<typeof drizzle<typeof schema>>;
  let projectRepo: SqliteProjectRepository;
  let demandRepo: SqliteDemandRepository;
  let ativoDadosRepo: SqliteAtivoDadosRepository;
  let datasetRepo: SqliteDatasetAutorizadoRepository;
  let modeloRepo: SqliteModeloAnaliticoRepository;
  let entidadeRepo: SqliteEntidadeAnaliticaRepository;
  let atributoRepo: SqliteAtributoAnaliticoRepository;
  let relacionamentoRepo: SqliteRelacionamentoAnaliticoRepository;
  let metricaRepo: SqliteMetricaAnaliticaRepository;
  let diagRepo: SqliteDiagnosticosQualidadeRepository;
  let auditRepo: SqliteAuditRepository;

  let modelingDeps: ModelingActionDeps;

  const projectId = 'proj_36d_actions';
  const demandId = 'dem_36d_actions';
  const demandaId = demandId;
  const assetId = 'ast_36d_actions';
  const datasetId = 'dts_36d_actions';

  beforeEach(async () => {
    sqlite = new Database(':memory:');
    sqlite.pragma('foreign_keys = ON');
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('synchronous = NORMAL');
    sqlite.pragma('busy_timeout = 5000');

    testDb = drizzle(sqlite, { schema });
    const migrationsFolder = path.join(process.cwd(), 'drizzle');
    migrate(testDb, { migrationsFolder });

    projectRepo = new SqliteProjectRepository(testDb);
    demandRepo = new SqliteDemandRepository(testDb);
    ativoDadosRepo = new SqliteAtivoDadosRepository(testDb);
    diagRepo = new SqliteDiagnosticosQualidadeRepository(testDb);
    datasetRepo = new SqliteDatasetAutorizadoRepository(testDb);
    modeloRepo = new SqliteModeloAnaliticoRepository(testDb);
    entidadeRepo = new SqliteEntidadeAnaliticaRepository(testDb);
    atributoRepo = new SqliteAtributoAnaliticoRepository(testDb);
    relacionamentoRepo = new SqliteRelacionamentoAnaliticoRepository(testDb);
    metricaRepo = new SqliteMetricaAnaliticaRepository(testDb);
    auditRepo = new SqliteAuditRepository(testDb);

    modelingDeps = {
      demandRepo,
      ativoDadosRepo,
      datasetAutorizadoRepo: datasetRepo,
      modeloRepo,
      entidadeRepo,
      atributoRepo,
      relacionamentoRepo,
      metricaRepo,
      auditRepo,
    };

    // Setup base de Projeto e Demanda
    await projectRepo.create({
      id: projectId,
      nome: 'Projeto 3.6D Teste',
      descricao: 'Testes de integração das Server Actions',
      status: 'ATIVO',
      data_inicio: null,
      data_conclusao_prevista: null,
      data_conclusao_real: null,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    });

    await demandRepo.create({
      id: demandId,
      projeto_id: projectId,
      titulo: 'Demanda Modelagem 3.6D',
      solicitacao_bruta: 'Criar modelo estrela e homologar governança.',
      contexto: null,
      objetivo_inicial: null,
      prazo_esperado: null,
      restricoes_declaradas: null,
      estado: EstadoDemanda.EM_MODELAGEM_E_ANALISE,
      estado_anterior: null,
      data_conclusao: null,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    });

    // Ativo de dados catalogado
    await ativoDadosRepo.create({
      id: assetId,
      demanda_id: demandId,
      nome_arquivo: 'vendas_preparadas.csv',
      caminho_local: '/mock/vendas_preparadas.csv',
      formato: FormatoArquivo.CSV,
      origem: 'Pipeline Preparação',
      descricao_conteudo: 'Base preparada de vendas',
      granularidade: 'TRANSACOES',
      periodo_inicio: '2025-01-01',
      periodo_fim: '2025-12-31',
      versao: '2.0',
      substitui_ativo_id: null,
      tamanho_bytes: 1024,
      total_linhas: 50,
      total_colunas: 5,
      hash_sha256: 'mocksha256vendas',
      status: StatusAtivoDados.ATIVO,
      categoria_ativo: CategoriaAtivoDados.PREPARADO_DERIVADO,
      schema_inferido: JSON.stringify([
        { nome: 'venda_id', tipo: 'INTEGER', nulo: false },
        { nome: 'cliente_id', tipo: 'INTEGER', nulo: false },
        { nome: 'data_venda', tipo: 'DATE', nulo: false },
        { nome: 'valor_total', tipo: 'REAL', nulo: false },
        { nome: 'quantidade', tipo: 'INTEGER', nulo: false },
      ]),
      data_recebimento: new Date().toISOString(),
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    });

    // Diagnóstico de qualidade homologado pré-requisito
    await diagRepo.create({
      id: 'diag_mock_1',
      ativo_dados_id: assetId,
      demanda_id: demandId,
      iniciado_em: new Date().toISOString(),
      concluido_em: new Date().toISOString(),
      duracao_ms: 100,
      total_linhas_avaliadas: 50,
      total_colunas_avaliadas: 5,
      verificacoes_executadas: [],
      total_problemas_detectados: 0,
      status_execucao: StatusExecucaoDiagnostico.CONCLUIDO,
      erro_mensagem: null,
      resumo_metricas: null,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    });

    // Dataset autorizado vigente
    await datasetRepo.autorizarTransacional({
      id: datasetId,
      demanda_id: demandId,
      ativo_dados_id: assetId,
      diagnostico_qualidade_id: 'diag_mock_1',
      receita_preparacao_id: null,
      versao_rotulo: '2.0-preparado',
      hash_sha256_snapshot: 'mocksha256vendas',
      status: StatusAutorizacaoDataset.VIGENTE,
      justificativa_autorizacao: 'Dataset preparado aprovado para modelagem.',
      autorizado_por_tipo: 'HUMANO',
      restricoes_aceitas_snapshot: '[]',
      autorizado_em: new Date().toISOString(),
      revogado_em: null,
      motivo_revogacao: null,
    });
  });

  it('deve criar modelo analítico com fato inicial e seus atributos derivados do dataset autorizado', async () => {
    const res = await criarModeloAnaliticoAction(
      {
        demandaId,
        datasetAutorizadoId: datasetId,
        nome: 'Modelo Star Vendas',
        descricao: 'Modelo dimensional de vendas no grão item/transação',
        tipoArquitetura: TipoArquiteturaModelo.ESTRELA,
        proporEntidadeFato: true,
      },
      modelingDeps
    );

    expect(res.success).toBe(true);
    if (!res.success) return;

    expect(res.data.modelo.id).toBeDefined();
    expect(res.data.modelo.nome).toBe('Modelo Star Vendas');
    expect(res.data.entidadeFatoInicial).toBeDefined();
    expect(res.data.entidadeFatoInicial?.nome).toContain('Fato');
    expect(res.data.entidadeFatoInicial?.atributos.length).toBe(5);

    // Consulta completa
    const completo = await obterModeloCompletoAction(res.data.modelo.id, modelingDeps);
    expect(completo.success).toBe(true);
    if (completo.success) {
      expect(completo.data?.entidades.length).toBe(1);
      expect(completo.data?.entidades[0].atributos.length).toBe(5);
    }
  });

  it('deve adicionar entidade dimensão e configurar seus atributos com chave primária', async () => {
    // 1. Criar modelo
    const modelRes = await criarModeloAnaliticoAction(
      {
        demandaId,
        datasetAutorizadoId: datasetId,
        nome: 'Modelo Comercial',
        tipoArquitetura: TipoArquiteturaModelo.ESTRELA,
      },
      modelingDeps
    );
    expect(modelRes.success).toBe(true);
    if (!modelRes.success) return;
    const modeloId = modelRes.data.modelo.id;

    // 2. Adicionar dimensão cliente
    const entRes = await adicionarEntidadeAnaliticaAction(
      {
        modeloId,
        nome: 'DimCliente',
        tipo: TipoEntidadeAnalitica.DIMENSAO,
        papel: PapelEntidadeAnalitica.DIMENSAO_PADRAO,
        descricao: 'Dimensão de clientes cadastrados',
      },
      demandaId,
      modelingDeps
    );
    expect(entRes.success).toBe(true);
    if (!entRes.success) return;
    const entidadeId = entRes.data.id;

    // 3. Configurar atributos com Chave Primária
    const attrRes = await configurarAtributosEntidadeAction(
      {
        entidadeId,
        atributos: [
          {
            nomeOriginal: 'cliente_id',
            nomeAmigavel: 'ID do Cliente',
            papel: PapelAtributoAnalitico.CHAVE_PRIMARIA,
            tipoDado: TipoDadoAnalitico.INTEIRO,
            oculto: false,
          },
          {
            nomeOriginal: 'nome_cliente',
            nomeAmigavel: 'Nome do Cliente',
            papel: PapelAtributoAnalitico.ATRIBUTO_DESCRITIVO,
            tipoDado: TipoDadoAnalitico.TEXTO,
            oculto: false,
          },
        ],
      },
      demandaId,
      modelingDeps
    );
    expect(attrRes.success).toBe(true);

    const completo = await obterModeloCompletoAction(modeloId, modelingDeps);
    expect(completo.success).toBe(true);
    if (completo.success) {
      const dim = completo.data?.entidades.find((e) => e.nome === 'DimCliente');
      expect(dim).toBeDefined();
      expect(dim?.atributos.length).toBe(2);
      expect(dim?.atributos.some((a) => a.papel === PapelAtributoAnalitico.CHAVE_PRIMARIA)).toBe(true);
    }
  });

  it('deve especificar dimensão calendário formal com colunas temporais padronizadas', async () => {
    const modelRes = await criarModeloAnaliticoAction(
      {
        demandaId,
        datasetAutorizadoId: datasetId,
        nome: 'Modelo com Calendario',
        tipoArquitetura: TipoArquiteturaModelo.ESTRELA,
      },
      modelingDeps
    );
    if (!modelRes.success) return;
    const modeloId = modelRes.data.modelo.id;

    const calRes = await especificarDimensaoCalendarioAction(
      {
        modeloId,
        nome: 'DimCalendario',
        dataInicio: '2025-01-01',
        dataFim: '2025-12-31',
      },
      demandaId,
      modelingDeps
    );

    expect(calRes.success).toBe(true);
    if (!calRes.success) return;

    expect(calRes.data.papel).toBe(PapelEntidadeAnalitica.DIMENSAO_CALENDARIO);
    expect(calRes.data.atributos.length).toBeGreaterThanOrEqual(5);
    expect(calRes.data.atributos.some((a) => a.papel === PapelAtributoAnalitico.CHAVE_PRIMARIA)).toBe(true);
  });

  it('deve criar e gerenciar métricas analíticas e relacionamentos', async () => {
    // 1. Criar modelo com fato
    const modelRes = await criarModeloAnaliticoAction(
      {
        demandaId,
        datasetAutorizadoId: datasetId,
        nome: 'Modelo Métricas',
        tipoArquitetura: TipoArquiteturaModelo.ESTRELA,
        proporEntidadeFato: true,
      },
      modelingDeps
    );
    if (!modelRes.success) return;
    const modeloId = modelRes.data.modelo.id;

    // 2. Cadastrar métrica analítica
    const metricaRes = await cadastrarMetricaAnaliticaAction(
      {
        modeloId,
        nome: 'Faturamento Total',
        formulaDeclarativa: 'SUM(FatoVendas[valor_total])',
        tipoAgregacao: TipoAgregacaoMetrica.SOMA,
        tipoAditividade: TipoAditividadeMetrica.TOTALMENTE_ADITIVA,
        unidadeMedida: UnidadeMedidaMetrica.MOEDA,
        descricao: 'Faturamento consolidado bruto',
      },
      demandaId,
      modelingDeps
    );

    expect(metricaRes.success).toBe(true);
    if (!metricaRes.success) return;
    const metricaId = metricaRes.data.id;

    // 3. Atualizar métrica
    const updRes = await atualizarMetricaAnaliticaAction(
      {
        id: metricaId,
        nome: 'Receita Bruta Total',
        formulaDeclarativa: 'SUM(FatoVendas[valor_total])',
        tipoAgregacao: TipoAgregacaoMetrica.SOMA,
        tipoAditividade: TipoAditividadeMetrica.TOTALMENTE_ADITIVA,
        unidadeMedida: UnidadeMedidaMetrica.MOEDA,
        descricao: 'Receita bruta atualizada',
      },
      demandaId,
      modelingDeps
    );
    expect(updRes.success).toBe(true);

    // 4. Remover métrica
    const delRes = await removerMetricaAnaliticaAction(
      { id: metricaId },
      demandaId,
      modelingDeps
    );
    expect(delRes.success).toBe(true);
  });

  it('deve avaliar conformidade determinística e detectar bloqueios de integridade', async () => {
    // Cria modelo vazio (sem fato, sem atributos, etc.)
    const modelRes = await criarModeloAnaliticoAction(
      {
        demandaId,
        datasetAutorizadoId: datasetId,
        nome: 'Modelo Incompleto',
        tipoArquitetura: TipoArquiteturaModelo.ESTRELA,
        proporEntidadeFato: false,
      },
      modelingDeps
    );
    if (!modelRes.success) return;
    const modeloId = modelRes.data.modelo.id;

    // Avaliação de conformidade
    const avaliacao = await avaliarConformidadeModeloAction(modeloId, modelingDeps);
    expect(avaliacao.success).toBe(true);
    if (!avaliacao.success) return;

    expect(avaliacao.data.apto_homologacao).toBe(false);
    expect(avaliacao.data.total_bloqueios).toBeGreaterThan(0);

    // Prontidão para homologação deve retornar aptoParaHomologacao = false
    const prontidao = await verificarProntidaoModeloAction(
      { modeloId },
      modelingDeps
    );
    expect(prontidao.success).toBe(true);
    if (!prontidao.success) return;
    expect(prontidao.data.prontoParaHomologacao).toBe(false);
    expect(prontidao.data.motivosBloqueio.length).toBeGreaterThan(0);

    // Tentativa de homologação deve falhar com erro
    const homRes = await homologarModeloAnaliticoAction(
      {
        modeloId,
        justificativa: 'Tentando homologar modelo incompleto sem fato.',
      },
      demandaId,
      modelingDeps
    );
    expect(homRes.success).toBe(false);
    if (!homRes.success) {
      expect(homRes.error).toBeDefined();
    }
  });

  it('deve homologar modelo válido, permitir consulta de vigência e suportar revogação', async () => {
    // 1. Criar modelo com fato inicial
    const modelRes = await criarModeloAnaliticoAction(
      {
        demandaId,
        datasetAutorizadoId: datasetId,
        nome: 'Modelo Pronto Star',
        descricao: 'Grão de venda por item transacional formalmente descrito',
        tipoArquitetura: TipoArquiteturaModelo.ESTRELA,
        proporEntidadeFato: true,
      },
      modelingDeps
    );
    if (!modelRes.success) return;
    const modeloId = modelRes.data.modelo.id;
    const fatoId = modelRes.data.entidadeFatoInicial!.id;

    // 2. Configurar chave primária na Fato
    await configurarAtributosEntidadeAction(
      {
        entidadeId: fatoId,
        atributos: [
          {
            nomeOriginal: 'venda_id',
            nomeAmigavel: 'ID Venda',
            papel: PapelAtributoAnalitico.CHAVE_PRIMARIA,
            tipoDado: TipoDadoAnalitico.INTEIRO,
            oculto: false,
          },
          {
            nomeOriginal: 'valor_total',
            nomeAmigavel: 'Valor Total',
            papel: PapelAtributoAnalitico.METRICA_BASE,
            tipoDado: TipoDadoAnalitico.DECIMAL,
            oculto: false,
          },
        ],
      },
      demandaId,
      modelingDeps
    );

    // 3. Cadastrar métrica analítica
    await cadastrarMetricaAnaliticaAction(
      {
        modeloId,
        nome: 'Faturamento Líquido',
        formulaDeclarativa: 'SUM(FatoVendas[valor_total])',
        tipoAgregacao: TipoAgregacaoMetrica.SOMA,
        tipoAditividade: TipoAditividadeMetrica.TOTALMENTE_ADITIVA,
        unidadeMedida: UnidadeMedidaMetrica.MOEDA,
      },
      demandaId,
      modelingDeps
    );

    // 4. Homologação formal com justificativa humana >= 15 chars
    const homRes = await homologarModeloAnaliticoAction(
      {
        modeloId,
        justificativa: 'Modelo analítico devidamente verificado e validado para a esteira de Validação.',
      },
      demandaId,
      modelingDeps
    );

    expect(homRes.success).toBe(true);
    if (!homRes.success) return;
    expect(homRes.data.status).toBe(StatusModeloAnalitico.HOMOLOGADO);

    // 5. Verificar modelo homologado vigente
    const vigenteRes = await obterModeloHomologadoVigenteAction(demandaId, modelingDeps);
    expect(vigenteRes.success).toBe(true);
    if (vigenteRes.success) {
      expect(vigenteRes.data.vigente).toBe(true);
      expect(vigenteRes.data.modelo?.id).toBe(modeloId);
      expect(vigenteRes.data.modelo?.status).toBe(StatusModeloAnalitico.HOMOLOGADO);
    }

    // 6. Revogação formal
    const revRes = await revogarHomologacaoModeloAction(
      {
        modeloId,
        motivo: 'Revogação para inclusão de novas dimensões solicitadas pelo negócio.',
      },
      demandaId,
      modelingDeps
    );
    expect(revRes.success).toBe(true);
    if (!revRes.success) return;
    expect(revRes.data.status).toBe(StatusModeloAnalitico.REVOGADO);

    // 7. Não há mais modelo vigente
    const posRevRes = await obterModeloHomologadoVigenteAction(demandaId, modelingDeps);
    expect(posRevRes.success).toBe(true);
    if (posRevRes.success) {
      expect(posRevRes.data.vigente).toBe(false);
      expect(posRevRes.data.modelo).toBeNull();
    }
  });
});
