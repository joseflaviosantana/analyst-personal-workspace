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
import { SqliteDatasetAutorizadoRepository } from '@/infrastructure/db/repositories/sqlite-dataset-autorizado-repository';
import { SqliteDiagnosticosQualidadeRepository } from '@/infrastructure/db/repositories/sqlite-diagnosticos-qualidade-repository';
import { SqliteAuditRepository } from '@/infrastructure/db/repositories/audit-repository';

import { ValidarTratamentoProblemaUseCase } from '@/core/use-cases/preparation/validar-tratamento-problema.use-case';
import { ValidarEtapaPreparacaoUseCase } from '@/core/use-cases/preparation/validar-etapa-preparacao.use-case';
import { ConcluirReceitaPreparacaoUseCase } from '@/core/use-cases/preparation/concluir-receita-preparacao.use-case';
import { AutorizarDatasetAnaliseUseCase } from '@/core/use-cases/preparation/autorizar-dataset-analise.use-case';
import { RevogarAutorizacaoDatasetUseCase } from '@/core/use-cases/preparation/revogar-autorizacao-dataset.use-case';
import { VerificarProntidaoParaModelagemUseCase } from '@/core/use-cases/preparation/verificar-prontidao-para-modelagem.use-case';

import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { FormatoArquivo } from '@/core/domain/enums/formato-arquivo';
import { StatusAtivoDados } from '@/core/domain/enums/status-ativo-dados';
import { CategoriaAtivoDados } from '@/core/domain/enums/categoria-ativo-dados';
import { StatusReceitaPreparacao } from '@/core/domain/enums/status-receita-preparacao';
import { StatusEtapaTransformacao } from '@/core/domain/enums/status-etapa-transformacao';
import { TipoOperacaoPreparacao } from '@/core/domain/enums/tipo-operacao-preparacao';
import { CapacidadeFerramenta } from '@/core/domain/enums/capacidade-ferramenta';
import { PapelEntradaLinhagem } from '@/core/domain/enums/papel-entrada-linhagem';
import { CategoriaProblemaQualidade } from '@/core/domain/enums/categoria-problema-qualidade';
import { SeveridadeProblema } from '@/core/domain/enums/severidade-problema';
import { StatusProblemaQualidade } from '@/core/domain/enums/status-problema-qualidade';
import { AcaoProblemaQualidade } from '@/core/domain/enums/acao-problema-qualidade';
import { StatusExecucaoDiagnostico } from '@/core/domain/enums/status-execucao-diagnostico';
import { StatusVerificacaoQualidade } from '@/core/domain/enums/status-verificacao-qualidade';
import { StatusAutorizacaoDataset } from '@/core/domain/enums/status-autorizacao-dataset';

describe('Integration: Governança Integrada da Preparação, Revalidação e Autorização (Subunidade 3.5C)', () => {
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

  const projectId = 'proj_35c_integ';
  const demandId = 'dem_35c_integ';
  const rawAssetId = 'ast_raw_integ';
  const derivedAssetId = 'ast_deriv_integ';
  const receitaId = 'rec_35c_integ';
  const etapaId = 'etp_35c_integ';
  const problemaId = 'prob_nulos_email';

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

    const now = new Date().toISOString();

    // 1. Projeto e Demanda em EM_QUALIDADE_E_PREPARACAO
    await projectRepo.create({
      id: projectId,
      nome: 'Projeto Governança 3.5C',
      descricao: 'Teste integrado de governança e autorização',
      status: 'ATIVO',
      data_inicio: now,
      data_conclusao_prevista: null,
      data_conclusao_real: null,
      criado_em: now,
      atualizado_em: now,
    });

    await demandRepo.create({
      id: demandId,
      projeto_id: projectId,
      titulo: 'Demanda Governança Integrada',
      solicitacao_bruta: 'Bruta',
      contexto: 'Contexto',
      objetivo_inicial: 'Objetivo',
      prazo_esperado: null,
      restricoes_declaradas: null,
      estado: EstadoDemanda.EM_QUALIDADE_E_PREPARACAO,
      data_conclusao: null,
      criado_em: now,
      atualizado_em: now,
    });

    // 2. Ativo Bruto Original
    await assetRepo.create({
      id: rawAssetId,
      demanda_id: demandId,
      nome_arquivo: 'clientes_raw.csv',
      caminho_local: 'c:/dados/clientes_raw.csv',
      formato: FormatoArquivo.CSV,
      origem: null,
      descricao_conteudo: 'Bruto recebido',
      granularidade: null,
      periodo_inicio: null,
      periodo_fim: null,
      versao: '1.0',
      substitui_ativo_id: null,
      tamanho_bytes: 10000,
      total_linhas: 100,
      total_colunas: 5,
      hash_sha256: 'hash_raw_sha256',
      status: StatusAtivoDados.ATIVO,
      categoria_ativo: CategoriaAtivoDados.BRUTO_RECEBIDO,
      schema_inferido: JSON.stringify({ id: 'INTEGER', email: 'VARCHAR' }),
      data_recebimento: now,
      criado_em: now,
      atualizado_em: now,
    });

    // 2.1 Diagnóstico do ativo bruto
    const rawDiagId = 'diag_raw_01';
    await diagnosticosRepo.create({
      id: rawDiagId,
      ativo_dados_id: rawAssetId,
      demanda_id: demandId,
      iniciado_em: now,
      concluido_em: now,
      duracao_ms: 100,
      total_linhas_avaliadas: 100,
      total_colunas_avaliadas: 5,
      verificacoes_executadas: [],
      total_problemas_detectados: 1,
      status_execucao: StatusExecucaoDiagnostico.CONCLUIDO,
      erro_mensagem: null,
      resumo_metricas: null,
      criado_em: now,
      atualizado_em: now,
    });

    // 3. Problema de qualidade com deliberação TRATAR_NO_PIPELINE
    await problemaRepo.create({
      id: problemaId,
      diagnostico_id: rawDiagId,
      ativo_dados_id: rawAssetId,
      demanda_id: demandId,
      categoria: CategoriaProblemaQualidade.NULOS_BRANCOS,
      titulo: 'Valores nulos em email',
      descricao: '20 emails nulos',
      tabela_afetada: 'clientes_raw.csv',
      coluna_afetada: 'email',
      total_linhas_afetadas: 20,
      percentual_linhas_afetadas: 20,
      amostra_evidencias: [],
      severidade: SeveridadeProblema.ALTA,
      impacto_calculo: null,
      acao_deliberada: AcaoProblemaQualidade.TRATAR_NO_PIPELINE,
      justificativa_deliberacao: 'Tratar preenchendo valor padrão no pipeline',
      deliberado_por_humano: true,
      deliberado_em: now,
      status: StatusProblemaQualidade.EM_INVESTIGACAO,
      origem_deteccao: 'AUTOMATICA',
      criado_em: now,
      atualizado_em: now,
    });

    // 4. Receita de Preparação em RASCUNHO e Etapa em PLANEJADA
    await receitaRepo.create({
      id: receitaId,
      demanda_id: demandId,
      titulo: 'Pipeline de Tratamento de Clientes',
      descricao: null,
      status: StatusReceitaPreparacao.RASCUNHO,
      versao: 1,
      criado_em: now,
      atualizado_em: now,
    });

    await etapaRepo.create({
      id: etapaId,
      receita_id: receitaId,
      ordem: 1,
      tipo_operacao: TipoOperacaoPreparacao.TRATAR_NULOS,
      capacidade_ferramenta: CapacidadeFerramenta.MOTOR_SQL,
      ferramenta_nome: 'DuckDB',
      ferramenta_versao: null,
      descricao: 'Preencher nulos de email',
      especificacao_tecnica: 'COALESCE(email, "sem_email@empresa.com")',
      status: StatusEtapaTransformacao.PLANEJADA,
      justificativa: null,
      criado_em: now,
      atualizado_em: now,
    });

    // 5. Vincula o problema à etapa
    await etapaRepo.vincularProblema(etapaId, problemaId);
  });

  it('deve executar o ciclo completo de revalidação, fechamento empírico, conclusão e autorização de dataset', async () => {
    const now = new Date().toISOString();

    // A) Registro do Ativo Derivado e Transição Atômica da Etapa para EXECUTADA e Receita para EM_EXECUCAO
    await linhagemRepo.registrarDerivacaoTransacional({
      novoAtivo: {
        id: derivedAssetId,
        demanda_id: demandId,
        nome_arquivo: 'clientes_curated.parquet',
        caminho_local: 'c:/dados/clientes_curated.parquet',
        formato: FormatoArquivo.CSV,
        origem: null,
        descricao_conteudo: 'Clientes tratados sem nulos',
        granularidade: null,
        periodo_inicio: null,
        periodo_fim: null,
        versao: '2.0',
        substitui_ativo_id: null,
        tamanho_bytes: 8500,
        total_linhas: 100,
        total_colunas: 5,
        hash_sha256: 'sha256_curated_999',
        status: StatusAtivoDados.ATIVO,
        categoria_ativo: CategoriaAtivoDados.PREPARADO_DERIVADO,
        schema_inferido: JSON.stringify({ id: 'INTEGER', email: 'VARCHAR' }),
        data_recebimento: now,
        criado_em: now,
        atualizado_em: now,
      },
      arestas: [
        {
          id: 'edge_integ_01',
          demanda_id: demandId,
          ativo_origem_id: rawAssetId,
          ativo_destino_id: derivedAssetId,
          papel_entrada: PapelEntradaLinhagem.ORIGEM_UNICA,
          etapa_transformacao_id: etapaId,
          criado_em: now,
        },
      ],
      etapaId,
      receitaId,
      atualizarReceitaParaEmExecucao: true,
      eventoAuditoria: {
        id: 'aud_deriv_01',
        demanda_id: demandId,
        entidade: 'AtivoDados',
        entidade_id: derivedAssetId,
        tipo_evento: 'CRIACAO',
        autor_tipo: 'HUMANO',
        dados_anteriores: null,
        dados_novos: JSON.stringify({ id: derivedAssetId }),
        justificativa: 'Ativo derivado gerado com sucesso',
        timestamp: now,
      },
    });

    // B) Criação do Diagnóstico Pós-Preparação (0 problemas detectados)
    const diagPosId = 'diag_pos_preparacao';
    await diagnosticosRepo.create({
      id: diagPosId,
      ativo_dados_id: derivedAssetId,
      demanda_id: demandId,
      iniciado_em: now,
      concluido_em: now,
      duracao_ms: 120,
      total_linhas_avaliadas: 100,
      total_colunas_avaliadas: 5,
      verificacoes_executadas: [
        {
          categoria: CategoriaProblemaQualidade.NULOS_BRANCOS,
          nome: 'Valores Nulos por Coluna',
          status: StatusVerificacaoQualidade.EXECUTADA_SEM_PROBLEMAS,
          totalProblemas: 0,
        },
      ],
      total_problemas_detectados: 0,
      status_execucao: StatusExecucaoDiagnostico.CONCLUIDO,
      erro_mensagem: null,
      resumo_metricas: null,
      criado_em: now,
      atualizado_em: now,
    });

    // C) Fechamento Empírico do Problema
    const validarProblemaUseCase = new ValidarTratamentoProblemaUseCase(
      problemaRepo,
      etapaRepo,
      linhagemRepo,
      assetRepo,
      diagnosticosRepo,
      auditRepo
    );

    const resultadoValidacao = await validarProblemaUseCase.execute({
      problemaId,
      autorTipo: 'HUMANO',
    });

    expect(resultadoValidacao.resolvido).toBe(true);
    expect(resultadoValidacao.etapaValidada).toBe(true);

    // Confere no SQLite que o problema está TRATADO
    const problemaAtualizado = await problemaRepo.findById(problemaId);
    expect(problemaAtualizado?.status).toBe(StatusProblemaQualidade.TRATADO);

    // Confere no SQLite que a etapa está VALIDADA
    const etapaAtualizada = await etapaRepo.findById(etapaId);
    expect(etapaAtualizada?.status).toBe(StatusEtapaTransformacao.VALIDADA);

    // D) Conclusão da Receita de Preparação
    const concluirReceitaUseCase = new ConcluirReceitaPreparacaoUseCase(
      receitaRepo,
      etapaRepo,
      problemaRepo,
      auditRepo
    );

    const receitaAtualizada = await concluirReceitaUseCase.execute({
      receitaId,
      justificativa: 'Receita concluída após validação determinística de todas as etapas.',
    });

    expect(receitaAtualizada.status).toBe(StatusReceitaPreparacao.CONCLUIDA);

    // E) Autorização Formal do Dataset para Análise
    const autorizarUseCase = new AutorizarDatasetAnaliseUseCase(
      datasetRepo,
      assetRepo,
      demandRepo,
      diagnosticosRepo,
      receitaRepo,
      problemaRepo,
      auditRepo
    );

    const autorizacao = await autorizarUseCase.execute({
      demandaId: demandId,
      ativoDadosId: derivedAssetId,
      receitaPreparacaoId: receitaId,
      versaoRotulo: '2.0-preparado',
      justificativa: 'Dataset preparado homologado formalmente para avanço para modelagem estatística.',
      autorTipo: 'HUMANO',
    });

    expect(autorizacao.status).toBe(StatusAutorizacaoDataset.VIGENTE);
    expect(autorizacao.hash_sha256_snapshot).toBe('sha256_curated_999');

    // F) Verificação de Prontidão para Modelagem
    const prontidaoUseCase = new VerificarProntidaoParaModelagemUseCase(
      datasetRepo,
      assetRepo,
      demandRepo,
      diagnosticosRepo,
      receitaRepo,
      problemaRepo
    );

    const prontidao = await prontidaoUseCase.execute({ demandaId: demandId });
    expect(prontidao.pronto).toBe(true);
    expect(prontidao.motivosBloqueio).toHaveLength(0);
    expect(prontidao.detalhes.hashValido).toBe(true);
    expect(prontidao.detalhes.qualityGate?.liberado).toBe(true);

    // G) Segunda Autorização (Substituição Atômica)
    const autorizacao2 = await autorizarUseCase.execute({
      demandaId: demandId,
      ativoDadosId: derivedAssetId,
      receitaPreparacaoId: receitaId,
      versaoRotulo: '2.1-revisado',
      justificativa: 'Atualização de homologação com nova versão de rótulo para modelagem.',
      autorTipo: 'HUMANO',
    });

    expect(autorizacao2.status).toBe(StatusAutorizacaoDataset.VIGENTE);

    // A autorização anterior deve ter virado SUBSTITUIDO
    const autorizacao1Apos = await datasetRepo.findById(autorizacao.id);
    expect(autorizacao1Apos?.status).toBe(StatusAutorizacaoDataset.SUBSTITUIDO);

    // H) Revogação Formal da Autorização Vigente
    const revogarUseCase = new RevogarAutorizacaoDatasetUseCase(datasetRepo, auditRepo);
    const revogada = await revogarUseCase.execute({
      autorizacaoId: autorizacao2.id,
      motivo: 'Revogação formal devido à alteração nos objetivos analíticos da demanda.',
    });

    expect(revogada.status).toBe(StatusAutorizacaoDataset.REVOGADO);

    // Prontidão após revogação deve ser BLOQUEADA
    const prontidaoPosRevogacao = await prontidaoUseCase.execute({ demandaId: demandId });
    expect(prontidaoPosRevogacao.pronto).toBe(false);
    expect(prontidaoPosRevogacao.motivosBloqueio).toContain(
      'A demanda não possui nenhum Dataset Autorizado para Análise no status VIGENTE.'
    );
  });

  it('deve garantir rollback transacional integral caso ocorra falha na autorização transacional', async () => {
    // Configura autorização vigente prévia válida
    const now = new Date().toISOString();
    const primeiraAutorizacao = await datasetRepo.autorizarTransacional({
      id: 'aut_vigente_original',
      demanda_id: demandId,
      ativo_dados_id: rawAssetId,
      diagnostico_qualidade_id: 'diag_raw_01',
      receita_preparacao_id: null,
      versao_rotulo: '1.0-bruto',
      hash_sha256_snapshot: 'hash_raw_sha256',
      status: StatusAutorizacaoDataset.VIGENTE,
      justificativa_autorizacao: 'Homologação inicial para comprovar rollback transacional.',
      autorizado_por_tipo: 'HUMANO',
      restricoes_aceitas_snapshot: '[]',
      autorizado_em: now,
      revogado_em: null,
      motivo_revogacao: null,
    });

    expect(primeiraAutorizacao.status).toBe(StatusAutorizacaoDataset.VIGENTE);

    // Provoca deliberadamente uma falha de chave estrangeira ao tentar autorizar com ativo inexistente
    await expect(
      datasetRepo.autorizarTransacional({
        id: 'aut_com_falha',
        demanda_id: demandId,
        ativo_dados_id: 'ativo_que_nao_existe_fk_violation', // FK violation!
        diagnostico_qualidade_id: 'diag_raw_01',
        receita_preparacao_id: null,
        versao_rotulo: '2.0-invalido',
        hash_sha256_snapshot: 'hash_fake',
        status: StatusAutorizacaoDataset.VIGENTE,
        justificativa_autorizacao: 'Tentativa de homologação com ativo inexistente.',
        autorizado_por_tipo: 'HUMANO',
        restricoes_aceitas_snapshot: '[]',
        autorizado_em: now,
        revogado_em: null,
        motivo_revogacao: null,
      })
    ).rejects.toThrow();

    // Verificação pós-rollback:
    // 1. O registro com falha NÃO existe
    const autComFalha = await datasetRepo.findById('aut_com_falha');
    expect(autComFalha).toBeNull();

    // 2. A autorização original NÃO foi marcada como SUBSTITUIDO (permaneceu intacta como VIGENTE)
    const autOriginalPos = await datasetRepo.findById('aut_vigente_original');
    expect(autOriginalPos?.status).toBe(StatusAutorizacaoDataset.VIGENTE);
    expect(autOriginalPos?.revogado_em).toBeNull();

    // 3. Permanece exatamente 1 autorização no histórico da demanda
    const historico = await datasetRepo.listarHistorico(demandId);
    expect(historico).toHaveLength(1);
    expect(historico[0].id).toBe('aut_vigente_original');
  });
});
