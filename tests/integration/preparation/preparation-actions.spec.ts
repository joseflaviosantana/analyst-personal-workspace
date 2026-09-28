import { describe, it, expect, beforeEach, vi } from 'vitest';
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
import { SqliteDatasetAutorizadoRepository } from '@/infrastructure/db/repositories/sqlite-dataset-autorizado-repository';
import { SqliteDiagnosticosQualidadeRepository } from '@/infrastructure/db/repositories/sqlite-diagnosticos-qualidade-repository';
import { SqliteAuditRepository } from '@/infrastructure/db/repositories/audit-repository';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import {
  criarReceitaPreparacaoAction,
  atualizarReceitaPreparacaoAction,
  obterReceitaPreparacaoAction,
  listarReceitasDemandaAction,
  adicionarEtapaTransformacaoAction,
  atualizarEtapaTransformacaoAction,
  reordenarEtapasTransformacaoAction,
  cancelarEtapaTransformacaoAction,
  associarProblemaEtapaAction,
  desassociarProblemaEtapaAction,
  listarProblemasEtapaAction,
  registrarAtivoDerivadoAction,
  consultarLinhagemAction,
  validarTratamentoProblemaAction,
  validarEtapaPreparacaoAction,
  concluirReceitaPreparacaoAction,
  autorizarDatasetAnaliseAction,
  revogarAutorizacaoDatasetAction,
  consultarDatasetAutorizadoVigenteAction,
  listarHistoricoAutorizacoesAction,
  verificarProntidaoParaModelagemAction,
  PreparationActionDeps,
} from '@/app/actions/preparation-actions';
import { advanceDemandAction, WorkflowActionDeps } from '@/app/actions/workflow-actions';

import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { FormatoArquivo } from '@/core/domain/enums/formato-arquivo';
import { StatusAtivoDados } from '@/core/domain/enums/status-ativo-dados';
import { CategoriaAtivoDados } from '@/core/domain/enums/categoria-ativo-dados';
import { StatusReceitaPreparacao } from '@/core/domain/enums/status-receita-preparacao';
import { StatusEtapaTransformacao } from '@/core/domain/enums/status-etapa-transformacao';
import { TipoOperacaoPreparacao } from '@/core/domain/enums/tipo-operacao-preparacao';
import { CapacidadeFerramenta } from '@/core/domain/enums/capacidade-ferramenta';
import { CategoriaProblemaQualidade } from '@/core/domain/enums/categoria-problema-qualidade';
import { SeveridadeProblema } from '@/core/domain/enums/severidade-problema';
import { StatusProblemaQualidade } from '@/core/domain/enums/status-problema-qualidade';
import { AcaoProblemaQualidade } from '@/core/domain/enums/acao-problema-qualidade';
import { StatusExecucaoDiagnostico } from '@/core/domain/enums/status-execucao-diagnostico';
import { StatusVerificacaoQualidade } from '@/core/domain/enums/status-verificacao-qualidade';
import { StatusAutorizacaoDataset } from '@/core/domain/enums/status-autorizacao-dataset';

import { PapelEntradaLinhagem } from '@/core/domain/enums/papel-entrada-linhagem';

describe('Integration: Server Actions da Preparação e Governança 3.5D', () => {
  let sqlite: Database.Database;
  let testDb: ReturnType<typeof drizzle<typeof schema>>;
  let projectRepo: SqliteProjectRepository;
  let demandRepo: SqliteDemandRepository;
  let assetRepo: SqliteAtivoDadosRepository;
  let problemaRepo: SqliteProblemasQualidadeRepository;
  let receitaRepo: SqliteReceitaPreparacaoRepository;
  let etapaRepo: SqliteEtapaTransformacaoRepository;
  let linhagemRepo: SqliteLinhagemAtivosRepository;
  let datasetRepo: SqliteDatasetAutorizadoRepository;
  let diagnosticosRepo: SqliteDiagnosticosQualidadeRepository;
  let auditRepo: SqliteAuditRepository;

  let prepDeps: PreparationActionDeps;
  let workflowDeps: WorkflowActionDeps;

  const projectId = 'proj_35d_actions';
  const demandId = 'dem_35d_actions';
  const rawAssetId = 'ast_raw_35d';
  const derivedAssetId = 'ast_deriv_35d';
  const problemaId = 'prob_nulo_35d';
  const derivedFixturePath = path.resolve(process.cwd(), 'tests', 'fixtures', 'synthetic-derived-sample.csv');

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
    problemaRepo = new SqliteProblemasQualidadeRepository(testDb as any);
    receitaRepo = new SqliteReceitaPreparacaoRepository(testDb as any);
    etapaRepo = new SqliteEtapaTransformacaoRepository(testDb as any);
    linhagemRepo = new SqliteLinhagemAtivosRepository(testDb as any);
    datasetRepo = new SqliteDatasetAutorizadoRepository(testDb as any);
    diagnosticosRepo = new SqliteDiagnosticosQualidadeRepository(testDb as any);
    auditRepo = new SqliteAuditRepository(testDb as any);

    prepDeps = {
      demandRepo,
      ativoDadosRepo: assetRepo,
      receitaRepo,
      etapaRepo,
      linhagemRepo,
      datasetAutorizadoRepo: datasetRepo,
      diagnosticosRepo,
      problemasRepo: problemaRepo,
      auditRepo,
    };

    workflowDeps = {
      demandRepo,
      auditRepo,
      ativoDadosRepo: assetRepo,
      diagnosticosRepo,
      problemasRepo: problemaRepo,
      datasetAutorizadoRepo: datasetRepo,
      receitaRepo,
    };

    const now = new Date().toISOString();

    // 1. Cria projeto
    await projectRepo.create({
      id: projectId,
      nome: 'Projeto BI Preparação 3.5D',
      descricao: 'Teste integrado de Server Actions',
      status: 'ATIVO',
      data_inicio: now,
      data_conclusao_prevista: null,
      data_conclusao_real: null,
      criado_em: now,
      atualizado_em: now,
    });

    // 2. Cria demanda em EM_QUALIDADE_E_PREPARACAO
    await demandRepo.create({
      id: demandId,
      projeto_id: projectId,
      titulo: 'Demanda de Vendas com Limpeza M',
      solicitacao_bruta: 'Tratar nulos e preparar dataset',
      contexto: 'Contexto de vendas',
      objetivo_inicial: 'Homologar dataset limpo para DAX',
      prazo_esperado: null,
      restricoes_declaradas: null,
      estado: EstadoDemanda.EM_QUALIDADE_E_PREPARACAO,
      estado_anterior: EstadoDemanda.EM_CLARIFICACAO,
      criado_em: now,
      atualizado_em: now,
      data_conclusao: null,
    });

    // 3. Cria ativo bruto
    await assetRepo.create({
      id: rawAssetId,
      demanda_id: demandId,
      nome_arquivo: 'raw_vendas.csv',
      caminho_local: 'C:\\Data\\raw_vendas.csv',
      formato: FormatoArquivo.CSV,
      origem: 'ERP',
      descricao_conteudo: 'Insumo bruto',
      granularidade: 'Linha',
      periodo_inicio: null,
      periodo_fim: null,
      versao: '1',
      substitui_ativo_id: null,
      tamanho_bytes: 1024,
      total_linhas: 50,
      total_colunas: 5,
      hash_sha256: 'hash_raw_original_64_chars_dummy_padding_00000000000000000000000',
      schema_inferido: JSON.stringify([{ nome: 'id', tipo: 'INTEGER' }, { nome: 'faturamento', tipo: 'DECIMAL' }]),
      categoria_ativo: CategoriaAtivoDados.BRUTO_RECEBIDO,
      status: StatusAtivoDados.ATIVO,
      data_recebimento: now,
      criado_em: now,
      atualizado_em: now,
    });

    // 4. Cria diagnóstico no ativo bruto com anomalia deliberada para TRATAR_NO_PIPELINE
    await diagnosticosRepo.create({
      id: 'diag_raw_35d',
      ativo_dados_id: rawAssetId,
      demanda_id: demandId,
      iniciado_em: now,
      concluido_em: now,
      duracao_ms: 100,
      total_linhas_avaliadas: 50,
      total_colunas_avaliadas: 5,
      verificacoes_executadas: [],
      total_problemas_detectados: 1,
      status_execucao: StatusExecucaoDiagnostico.CONCLUIDO,
      erro_mensagem: null,
      resumo_metricas: null,
      criado_em: now,
      atualizado_em: now,
    });

    await problemaRepo.create({
      id: problemaId,
      diagnostico_id: 'diag_raw_35d',
      ativo_dados_id: rawAssetId,
      demanda_id: demandId,
      categoria: CategoriaProblemaQualidade.NULOS_BRANCOS,
      titulo: 'Valores nulos em coluna financeira faturamento',
      descricao: 'Valores nulos em coluna financeira faturamento',
      tabela_afetada: 'raw_vendas.csv',
      coluna_afetada: 'faturamento',
      total_linhas_afetadas: 1,
      percentual_linhas_afetadas: 2.0,
      amostra_evidencias: [],
      severidade: SeveridadeProblema.ALTA,
      impacto_calculo: null,
      acao_deliberada: AcaoProblemaQualidade.TRATAR_NO_PIPELINE,
      justificativa_deliberacao: 'Tratamento via Power Query na etapa de preparação',
      deliberado_por_humano: true,
      deliberado_em: now,
      status: StatusProblemaQualidade.ABERTO,
      origem_deteccao: 'AUTOMATICA',
      criado_em: now,
      atualizado_em: now,
    });
  });

  it('deve executar o ciclo completo de preparação da Aba 5 via Server Actions', async () => {
    // 1. Criar Receita
    const resCriarReceita = await criarReceitaPreparacaoAction({
      demanda_id: demandId,
      titulo: 'Receita 01 - Limpeza e Normalização',
      descricao: 'Orquestração de tratamento de nulos',
    }, prepDeps);

    expect(resCriarReceita.success).toBe(true);
    if (!resCriarReceita.success) throw new Error(resCriarReceita.error);
    const receitaId = resCriarReceita.data.id;
    expect(resCriarReceita.data.status).toBe(StatusReceitaPreparacao.RASCUNHO);

    // 2. Adicionar Etapa
    const resEtapa1 = await adicionarEtapaTransformacaoAction({
      receita_id: receitaId,
      tipo_operacao: TipoOperacaoPreparacao.TRATAR_NULOS,
      capacidade_ferramenta: CapacidadeFerramenta.MOTOR_M_POWER_QUERY,
      ferramenta_nome: 'Power Query',
      descricao: 'Trata valores nulos na coluna faturamento',
      especificacao_tecnica: 'Table.ReplaceValue(Source, null, 0, Replacer.ReplaceValue, {"faturamento"})',
    }, demandId, prepDeps);

    expect(resEtapa1.success).toBe(true);
    if (!resEtapa1.success) throw new Error(resEtapa1.error);
    const etapaId = resEtapa1.data.id;
    expect(resEtapa1.data.ordem).toBe(1);

    // 3. Associar Problema à Etapa
    const resAssoc = await associarProblemaEtapaAction({
      etapa_id: etapaId,
      problema_id: problemaId,
    }, demandId, prepDeps);

    expect(resAssoc.success).toBe(true);

    const problemasEtapa = await listarProblemasEtapaAction(etapaId, prepDeps);
    expect(problemasEtapa.success).toBe(true);
    if (problemasEtapa.success) {
      expect(problemasEtapa.data).toHaveLength(1);
      expect(problemasEtapa.data[0].id).toBe(problemaId);
    }

    // 4. Registrar Ativo Derivado com Linhagem
    const resDerivado = await registrarAtivoDerivadoAction({
      demanda_id: demandId,
      receita_id: receitaId,
      etapa_id: etapaId,
      fontes_entrada: [
        {
          ativo_origem_id: rawAssetId,
          papel: PapelEntradaLinhagem.FONTE_PRINCIPAL,
        },
      ],
      nome_arquivo: 'vendas_limpas.csv',
      caminho_local: derivedFixturePath,
      formato: FormatoArquivo.CSV,
      tamanho_bytes: 320,
      total_linhas: 5,
      total_colunas: 5,
      hash_sha256: 'hash_derivado_valido_sha256_64_chars_exemplo_000000000000000000000',
      schema_inferido: JSON.stringify([{ nome: 'id_cliente', tipo: 'INTEGER' }, { nome: 'faturamento', tipo: 'DECIMAL' }]),
    }, prepDeps);

    expect(resDerivado.success).toBe(true);
    if (!resDerivado.success) throw new Error(resDerivado.error);
    const idDerivadoCriado = resDerivado.data.ativo.id;
    expect(resDerivado.data.ativo.categoria_ativo).toBe(CategoriaAtivoDados.PREPARADO_DERIVADO);

    // 5. Consultar Linhagem
    const resLinhagem = await consultarLinhagemAction(idDerivadoCriado, prepDeps);
    expect(resLinhagem.success).toBe(true);
    if (resLinhagem.success) {
      expect(resLinhagem.data.arestas).toHaveLength(1);
      expect(resLinhagem.data.arestas[0].ativo_origem_id).toBe(rawAssetId);
    }

    // 6. Criar Diagnóstico no Ativo Derivado (sem problemas) para comprovação empírica
    const now = new Date().toISOString();
    const diagDerivadoId = 'diag_derivado_35d';
    await diagnosticosRepo.create({
      id: diagDerivadoId,
      ativo_dados_id: idDerivadoCriado,
      demanda_id: demandId,
      iniciado_em: now,
      concluido_em: now,
      duracao_ms: 80,
      total_linhas_avaliadas: 5,
      total_colunas_avaliadas: 5,
      verificacoes_executadas: [],
      total_problemas_detectados: 0, // Zero problemas!
      status_execucao: StatusExecucaoDiagnostico.CONCLUIDO,
      erro_mensagem: null,
      resumo_metricas: null,
      criado_em: now,
      atualizado_em: now,
    });

    // 7. Validação Empírica do Tratamento do Problema
    const resValidacaoTratamento = await validarTratamentoProblemaAction({
      problema_id: problemaId,
    }, demandId, prepDeps);

    expect(resValidacaoTratamento.success).toBe(true);
    if (resValidacaoTratamento.success) {
      expect(resValidacaoTratamento.data.resolvido).toBe(true);
    }

    // Comprova que o problema passou para TRATADO
    const problemaAtualizado = await problemaRepo.findById(problemaId);
    expect(problemaAtualizado?.status).toBe(StatusProblemaQualidade.TRATADO);

    // 8. Validar Etapa
    const resValidarEtapa = await validarEtapaPreparacaoAction({
      etapa_id: etapaId,
      justificativa: 'Validação confirmada: 0 nulos detectados no ativo derivado',
    }, demandId, prepDeps);

    expect(resValidarEtapa.success).toBe(true);
    if (resValidarEtapa.success) {
      expect(resValidarEtapa.data.status).toBe(StatusEtapaTransformacao.VALIDADA);
    }

    // 9. Concluir Receita
    const resConcluirReceita = await concluirReceitaPreparacaoAction({
      receita_id: receitaId,
      justificativa: 'Todas as etapas foram validadas com sucesso.',
    }, demandId, prepDeps);

    expect(resConcluirReceita.success).toBe(true);
    if (resConcluirReceita.success) {
      expect(resConcluirReceita.data.status).toBe(StatusReceitaPreparacao.CONCLUIDA);
    }

    // 10. Autorizar Dataset para Modelagem
    const resAutorizar = await autorizarDatasetAnaliseAction({
      demanda_id: demandId,
      ativo_dados_id: idDerivadoCriado,
      receita_preparacao_id: receitaId,
      versao_rotulo: 'v1.0-limpo',
      justificativa_autorizacao: 'Homologação formal do dataset limpo e tratado para DAX.',
      autorizado_por_tipo: 'HUMANO',
    }, prepDeps);

    expect(resAutorizar.success).toBe(true);
    if (!resAutorizar.success) throw new Error(resAutorizar.error);
    expect(resAutorizar.data.status).toBe(StatusAutorizacaoDataset.VIGENTE);

    // 11. Verificar Prontidão para Modelagem
    const resProntidao = await verificarProntidaoParaModelagemAction(demandId, prepDeps);
    expect(resProntidao.success).toBe(true);
    if (resProntidao.success) {
      expect(resProntidao.data.pronto).toBe(true);
      expect(resProntidao.data.motivosBloqueio).toHaveLength(0);
    }

    // 12. Avanço de Estado da Demanda no Workflow (Integração Total com 3.5C)
    const resAvanco = await advanceDemandAction(demandId, undefined, workflowDeps);
    expect(resAvanco.success).toBe(true);
    if (resAvanco.success) {
      expect(resAvanco.data.estado).toBe(EstadoDemanda.EM_MODELAGEM_E_ANALISE);
    }

    const demFinal = await demandRepo.findById(demandId);
    expect(demFinal?.estado).toBe(EstadoDemanda.EM_MODELAGEM_E_ANALISE);
  });

  it('deve revogar autorização com justificativa >= 15 caracteres', async () => {
    // Cria autorização inicial
    const aut = await datasetRepo.autorizarTransacional({
      id: 'aut_teste_revogar',
      demanda_id: demandId,
      ativo_dados_id: rawAssetId,
      diagnostico_qualidade_id: 'diag_raw_35d',
      receita_preparacao_id: null,
      versao_rotulo: '1.0-revogar',
      hash_sha256_snapshot: 'hash_raw_original_64_chars_dummy_padding_00000000000000000000000',
      status: StatusAutorizacaoDataset.VIGENTE,
      justificativa_autorizacao: 'Homologação para teste de revogação.',
      autorizado_por_tipo: 'HUMANO',
      restricoes_aceitas_snapshot: '[]',
      autorizado_em: new Date().toISOString(),
      revogado_em: null,
      motivo_revogacao: null,
    });

    // 1. Tentativa de revogação com justificativa muito curta
    const resCurto = await revogarAutorizacaoDatasetAction({
      autorizacao_id: aut.id,
      motivo_revogacao: 'Curto',
    }, demandId, prepDeps);

    expect(resCurto.success).toBe(false);

    // 2. Revogação com justificativa válida
    const resValido = await revogarAutorizacaoDatasetAction({
      autorizacao_id: aut.id,
      motivo_revogacao: 'Revogação formal devido à necessidade de nova versão tratada.',
    }, demandId, prepDeps);

    expect(resValido.success).toBe(true);
    if (resValido.success) {
      expect(resValido.data.status).toBe(StatusAutorizacaoDataset.REVOGADO);
      expect(resValido.data.motivo_revogacao).toContain('Revogação formal');
    }
  });
});
