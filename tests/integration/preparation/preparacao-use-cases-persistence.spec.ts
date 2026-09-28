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
import { SqliteAuditRepository } from '@/infrastructure/db/repositories/audit-repository';

import { CriarReceitaPreparacaoUseCase } from '@/core/use-cases/preparation/criar-receita-preparacao.use-case';
import { AdicionarEtapaTransformacaoUseCase } from '@/core/use-cases/preparation/adicionar-etapa-transformacao.use-case';
import { ReordenarEtapasTransformacaoUseCase } from '@/core/use-cases/preparation/reordenar-etapas-transformacao.use-case';
import { AssociarProblemaEtapaUseCase } from '@/core/use-cases/preparation/associar-problema-etapa.use-case';
import { RegistrarAtivoDerivadoUseCase } from '@/core/use-cases/preparation/registrar-ativo-derivado.use-case';
import { ConsultarLinhagemUseCase } from '@/core/use-cases/preparation/consultar-linhagem.use-case';
import { CancelarEtapaTransformacaoUseCase } from '@/core/use-cases/preparation/cancelar-etapa-transformacao.use-case';

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

describe('Integration: Casos de Uso de Preparação e Atomicidade no SQLite (Subunidade 3.5B)', () => {
  let sqlite: Database.Database;
  let testDb: ReturnType<typeof drizzle<typeof schema>>;
  let projectRepo: SqliteProjectRepository;
  let demandRepo: SqliteDemandRepository;
  let assetRepo: SqliteAtivoDadosRepository;
  let problemaRepo: SqliteProblemasQualidadeRepository;
  let receitaRepo: SqliteReceitaPreparacaoRepository;
  let etapaRepo: SqliteEtapaTransformacaoRepository;
  let linhagemRepo: SqliteLinhagemAtivosRepository;
  let auditRepo: SqliteAuditRepository;

  const testProjectId = 'proj_prep_35b';
  const testDemandId = 'dem_prep_35b';
  const rawAssetId = 'ast_raw_vendas';
  const problemaId = 'prob_nulos_preco';

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
    auditRepo = new SqliteAuditRepository(testDb as any);

    const now = new Date().toISOString();

    // 1. Setup Projeto e Demanda
    projectRepo.create({
      id: testProjectId,
      nome: 'Projeto BI Vendas 3.5B',
      descricao: 'Validação de integração de casos de uso 3.5B',
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
      titulo: 'Engenharia de Dados e Higienização',
      solicitacao_bruta: 'Consolidar e limpar vendas',
      contexto: 'Contexto de BI',
      objetivo_inicial: 'Pipeline limpo',
      prazo_esperado: null,
      restricoes_declaradas: null,
      estado: EstadoDemanda.DADOS_RECEBIDOS,
      data_conclusao: null,
      criado_em: now,
      atualizado_em: now,
    });

    // 2. Setup Ativo Bruto Recebido
    assetRepo.create({
      id: rawAssetId,
      demanda_id: testDemandId,
      nome_arquivo: 'vendas_brutas.csv',
      caminho_local: '/data/vendas_brutas.csv',
      formato: FormatoArquivo.CSV,
      origem: 'ERP SAP',
      descricao_conteudo: 'Insumo bruto de vendas',
      granularidade: 'Item',
      periodo_inicio: null,
      periodo_fim: null,
      versao: '1.0',
      substitui_ativo_id: null,
      tamanho_bytes: 4096,
      total_linhas: 200,
      total_colunas: 8,
      hash_sha256: 'hash_raw_vendas_35b',
      status: StatusAtivoDados.ATIVO,
      categoria_ativo: CategoriaAtivoDados.BRUTO_RECEBIDO,
      schema_inferido: null,
      data_recebimento: now,
      criado_em: now,
      atualizado_em: now,
    });

    // 3. Setup Problema de Qualidade Deliberado para TRATAR_NO_PIPELINE
    problemaRepo.create({
      id: problemaId,
      diagnostico_id: null,
      ativo_dados_id: rawAssetId,
      demanda_id: testDemandId,
      categoria: CategoriaProblemaQualidade.NULOS_BRANCOS,
      titulo: 'Valores nulos em preço unitário',
      descricao: '10 registros sem preço unitário',
      tabela_afetada: 'vendas',
      coluna_afetada: 'preco_unitario',
      total_linhas_afetadas: 10,
      percentual_linhas_afetadas: 5.0,
      amostra_evidencias: [],
      severidade: SeveridadeProblema.ALTA,
      impacto_calculo: null,
      acao_deliberada: AcaoProblemaQualidade.TRATAR_NO_PIPELINE,
      justificativa_deliberacao: 'Tratamento via exclusão ou imputação pela mediana na etapa 1.',
      deliberado_por_humano: true,
      deliberado_em: now,
      status: StatusProblemaQualidade.ABERTO,
      origem_deteccao: 'AUTOMATICA',
      criado_em: now,
      atualizado_em: now,
    });
  });

  it('deve executar o fluxo completo de preparação: receita, etapas, vinculação e ativo derivado atômico', async () => {
    // 1. Criar Receita de Preparação (Nasce em RASCUNHO)
    const criarReceitaUseCase = new CriarReceitaPreparacaoUseCase(receitaRepo, demandRepo, auditRepo);
    const receita = await criarReceitaUseCase.execute({
      demanda_id: testDemandId,
      titulo: 'Pipeline de Tratamento de Vendas',
      descricao: 'Remoção de nulos e deduplicação de transações',
    });

    expect(receita.id).toBeDefined();
    expect(receita.status).toBe(StatusReceitaPreparacao.RASCUNHO);

    // 2. Adicionar Etapas de Transformação (Nascem em PLANEJADA e NÃO mudam status da receita)
    const adicionarEtapaUseCase = new AdicionarEtapaTransformacaoUseCase(etapaRepo, receitaRepo, auditRepo);
    const etapa1 = await adicionarEtapaUseCase.execute({
      receita_id: receita.id,
      tipo_operacao: TipoOperacaoPreparacao.TRATAR_NULOS,
      capacidade_ferramenta: CapacidadeFerramenta.MOTOR_SQL,
      ferramenta_nome: 'DuckDB',
      descricao: 'Filtrar registros sem preço unitário',
      especificacao_tecnica: 'SELECT * FROM vendas WHERE preco_unitario IS NOT NULL',
    });

    const etapa2 = await adicionarEtapaUseCase.execute({
      receita_id: receita.id,
      tipo_operacao: TipoOperacaoPreparacao.CONVERTER_TIPO,
      capacidade_ferramenta: CapacidadeFerramenta.MOTOR_SQL,
      ferramenta_nome: 'DuckDB',
      descricao: 'Converter coluna data_venda para DATE',
    });

    expect(etapa1.ordem).toBe(1);
    expect(etapa1.status).toBe(StatusEtapaTransformacao.PLANEJADA);
    expect(etapa2.ordem).toBe(2);
    expect(etapa2.status).toBe(StatusEtapaTransformacao.PLANEJADA);

    // Comprovação Decisão 1: receita continua estritamente em RASCUNHO
    const receitaAposEtapas = await receitaRepo.findById(receita.id);
    expect(receitaAposEtapas?.status).toBe(StatusReceitaPreparacao.RASCUNHO);

    // 3. Associar Problema de Qualidade à Etapa 1
    const associarProblemaUseCase = new AssociarProblemaEtapaUseCase(etapaRepo, problemaRepo, receitaRepo, auditRepo);
    await associarProblemaUseCase.execute({
      etapa_id: etapa1.id,
      problema_id: problemaId,
    });

    // Comprovação Decisão 3: o status do problema NÃO é alterado para TRATADO
    const problemaAposAssociacao = await problemaRepo.findById(problemaId);
    expect(problemaAposAssociacao?.status).toBe(StatusProblemaQualidade.ABERTO);

    const problemasDaEtapa = await etapaRepo.listarProblemasPorEtapa(etapa1.id);
    expect(problemasDaEtapa).toEqual([problemaId]);

    // 4. Registrar Ativo Derivado produzido pela Etapa 1
    const registrarDerivadoUseCase = new RegistrarAtivoDerivadoUseCase(
      linhagemRepo,
      assetRepo,
      receitaRepo,
      etapaRepo,
      demandRepo
    );

    const derivadoResult = await registrarDerivadoUseCase.execute({
      demanda_id: testDemandId,
      receita_id: receita.id,
      etapa_id: etapa1.id,
      fontes_entrada: [
        {
          ativo_origem_id: rawAssetId,
          papel: PapelEntradaLinhagem.ORIGEM_UNICA,
        },
      ],
      nome_arquivo: 'vendas_tratadas_v1.parquet',
      caminho_local: '/data/vendas_tratadas_v1.parquet',
      formato: FormatoArquivo.BASE_TRATADA,
      tamanho_bytes: 3500,
      total_linhas: 190,
      total_colunas: 8,
      hash_sha256: 'hash_derivado_parquet_190',
    });

    expect(derivadoResult.ativo.id).toBeDefined();
    expect(derivadoResult.ativo.categoria_ativo).toBe(CategoriaAtivoDados.PREPARADO_DERIVADO);
    expect(derivadoResult.ativo.status).toBe(StatusAtivoDados.ATIVO);

    // Comprovação Decisão 1 & 2:
    // A etapa 1 transicionou para EXECUTADA
    const etapa1Persistida = await etapaRepo.findById(etapa1.id);
    expect(etapa1Persistida?.status).toBe(StatusEtapaTransformacao.EXECUTADA);

    // A receita transicionou de RASCUNHO para EM_EXECUCAO!
    const receitaPersistida = await receitaRepo.findById(receita.id);
    expect(receitaPersistida?.status).toBe(StatusReceitaPreparacao.EM_EXECUCAO);

    // Linhagem persistida corretamente
    const origens = await linhagemRepo.obterOrigens(derivadoResult.ativo.id);
    expect(origens).toHaveLength(1);
    expect(origens[0].ativo.id).toBe(rawAssetId);
    expect(origens[0].papel).toBe(PapelEntradaLinhagem.ORIGEM_UNICA);
    expect(origens[0].etapa_transformacao_id).toBe(etapa1.id);

    // Auditoria gravada
    const auditorias = await auditRepo.findByDemandaId(testDemandId);
    expect(auditorias.length).toBeGreaterThan(0);
    const auditDerivado = auditorias.find((a) => a.entidade_id === derivadoResult.ativo.id);
    expect(auditDerivado).toBeDefined();
    expect(auditDerivado?.tipo_evento).toBe('CRIACAO');

    // 5. Consultas de Linhagem (Upstream / Downstream / Reconstrução)
    const consultarLinhagemUseCase = new ConsultarLinhagemUseCase(linhagemRepo, assetRepo, etapaRepo);
    const ancestrais = await consultarLinhagemUseCase.consultarAncestrais(derivadoResult.ativo.id);
    expect(ancestrais).toHaveLength(1);
    expect(ancestrais[0].ativo.id).toBe(rawAssetId);
    expect(ancestrais[0].profundidade).toBe(1);

    const descendentes = await consultarLinhagemUseCase.consultarDescendentes(rawAssetId);
    expect(descendentes).toHaveLength(1);
    expect(descendentes[0].ativo.id).toBe(derivadoResult.ativo.id);

    const caminho = await consultarLinhagemUseCase.reconstruirCaminhoTransformacao(derivadoResult.ativo.id);
    expect(caminho.nosAtivos).toHaveLength(2);
    expect(caminho.arestas).toHaveLength(1);
    expect(caminho.etapas).toHaveLength(1);

    // 6. Cancelamento Auditado da Etapa 2
    const cancelarEtapaUseCase = new CancelarEtapaTransformacaoUseCase(etapaRepo, receitaRepo, auditRepo);
    const cancelada = await cancelarEtapaUseCase.execute({
      id: etapa2.id,
      justificativa: 'Descontinuada porque a conversão de data foi resolvida no conector do Power BI.',
    });
    expect(cancelada.status).toBe(StatusEtapaTransformacao.CANCELADA);
  });

  // TESTE DE ROLLBACK OBRIGATÓRIO (HOMOLOGADO NO RELATÓRIO TÉCNICO)
  it('TESTE DE ROLLBACK OBRIGATÓRIO: deve abortar atomicamente sem deixar nenhum registro parcial em caso de falha', async () => {
    // 1. Criar Receita e Etapa
    const criarReceitaUseCase = new CriarReceitaPreparacaoUseCase(receitaRepo, demandRepo, auditRepo);
    const receita = await criarReceitaUseCase.execute({
      demanda_id: testDemandId,
      titulo: 'Receita para Teste de Falha Transacional',
    });

    const adicionarEtapaUseCase = new AdicionarEtapaTransformacaoUseCase(etapaRepo, receitaRepo, auditRepo);
    const etapa = await adicionarEtapaUseCase.execute({
      receita_id: receita.id,
      tipo_operacao: TipoOperacaoPreparacao.TRATAR_OUTLIERS,
      capacidade_ferramenta: CapacidadeFerramenta.SCRIPT_NOTEBOOK,
      ferramenta_nome: 'Python',
      descricao: 'Etapa que sofrerá falha transacional',
    });

    expect(receita.status).toBe(StatusReceitaPreparacao.RASCUNHO);
    expect(etapa.status).toBe(StatusEtapaTransformacao.PLANEJADA);

    const totalAtivosAntes = await assetRepo.countByDemandId(testDemandId);
    const totalArestasAntes = (await linhagemRepo.obterArestasPorDemanda(testDemandId)).length;
    const totalAuditoriasAntes = (await auditRepo.findByDemandaId(testDemandId)).length;

    // 2. Provocar deliberadamente falha na operação transacional
    // Vamos simular uma aresta com dependência circular ou auto-loop para disparar throw dentro de database.transaction
    const registrarDerivadoUseCase = new RegistrarAtivoDerivadoUseCase(
      linhagemRepo,
      assetRepo,
      receitaRepo,
      etapaRepo,
      demandRepo
    );

    // Forçar a falha: passamos um ativo de entrada que causará um erro durante a transação
    // Exemplo: passar ativo de origem inexistente após validação prévia OU simular falha no método de transação
    // Para testar o rollback real da transação SQLite:
    // Chamamos registrarDerivacaoTransacional diretamente com uma aresta que gera auto-loop
    // provando que a inserção do ativo ocorrida no passo 1 do bloco transacional sofre ROLLBACK integral!
    const ativoFantasmaId = 'ast_fantasma_abortado';
    const fakeNovoAtivo = {
      id: ativoFantasmaId,
      demanda_id: testDemandId,
      nome_arquivo: 'fantasma.csv',
      caminho_local: '/data/fantasma.csv',
      formato: FormatoArquivo.CSV,
      origem: null,
      descricao_conteudo: null,
      granularidade: null,
      periodo_inicio: null,
      periodo_fim: null,
      versao: '1.0',
      substitui_ativo_id: null,
      tamanho_bytes: 100,
      total_linhas: 10,
      total_colunas: 2,
      hash_sha256: 'h_fantasma',
      status: StatusAtivoDados.ATIVO,
      categoria_ativo: CategoriaAtivoDados.PREPARADO_DERIVADO,
      schema_inferido: null,
      data_recebimento: new Date().toISOString(),
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    };

    // Aresta com auto-loop deliberado que faz o SQLite/Drizzle rejeitar no passo 2 da transação
    const arestaInvalidaComErro = {
      id: 'lin_erro_deliberado',
      demanda_id: testDemandId,
      ativo_origem_id: rawAssetId,
      ativo_destino_id: rawAssetId, // Auto-loop proibido que força throw Error na transação
      etapa_transformacao_id: etapa.id,
      papel_entrada: PapelEntradaLinhagem.ORIGEM_UNICA,
      criado_em: new Date().toISOString(),
    };

    await expect(
      linhagemRepo.registrarDerivacaoTransacional({
        novoAtivo: fakeNovoAtivo,
        arestas: [arestaInvalidaComErro],
        etapaId: etapa.id,
        receitaId: receita.id,
        atualizarReceitaParaEmExecucao: true,
        eventoAuditoria: {
          id: 'aud_fantasma',
          demanda_id: testDemandId,
          entidade: 'AtivoDados',
          entidade_id: ativoFantasmaId,
          tipo_evento: 'CRIACAO',
          autor_tipo: 'HUMANO',
          dados_anteriores: null,
          dados_novos: '{}',
          justificativa: 'Auditoria que deve sofrer rollback',
          timestamp: new Date().toISOString(),
        },
      })
    ).rejects.toThrow(/Aresta de linhagem inválida: o ativo de origem não pode ser idêntico ao ativo de destino/);

    // 3. EVIDÊNCIA COMPROBATÓRIA DO ROLLBACK NO SQLITE:
    // A) Nenhum AtivoDados derivado permaneceu no banco
    const ativoAposErro = await assetRepo.findById(ativoFantasmaId);
    expect(ativoAposErro).toBeNull();
    const totalAtivosDepois = await assetRepo.countByDemandId(testDemandId);
    expect(totalAtivosDepois).toBe(totalAtivosAntes);

    // B) Nenhuma aresta de linhagem permaneceu no banco
    const arestasDepois = await linhagemRepo.obterArestasPorEtapa(etapa.id);
    expect(arestasDepois).toHaveLength(0);
    const totalArestasDepois = (await linhagemRepo.obterArestasPorDemanda(testDemandId)).length;
    expect(totalArestasDepois).toBe(totalArestasAntes);

    // C) A EtapaTransformacao NÃO ficou EXECUTADA (permaneceu em PLANEJADA)
    const etapaAposErro = await etapaRepo.findById(etapa.id);
    expect(etapaAposErro?.status).toBe(StatusEtapaTransformacao.PLANEJADA);

    // D) A ReceitaPreparacao NÃO ficou EM_EXECUCAO (permaneceu em RASCUNHO)
    const receitaAposErro = await receitaRepo.findById(receita.id);
    expect(receitaAposErro?.status).toBe(StatusReceitaPreparacao.RASCUNHO);

    // E) Nenhum evento parcial de auditoria permaneceu no banco
    const auditoriasDepois = await auditRepo.findByDemandaId(testDemandId);
    expect(auditoriasDepois.length).toBe(totalAuditoriasAntes);
    const auditFantasma = auditoriasDepois.find((a) => a.id === 'aud_fantasma');
    expect(auditFantasma).toBeUndefined();
  });
});
