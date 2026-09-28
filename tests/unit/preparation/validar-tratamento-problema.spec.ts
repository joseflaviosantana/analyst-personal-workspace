import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ValidarTratamentoProblemaUseCase } from '@/core/use-cases/preparation/validar-tratamento-problema.use-case';
import { IProblemasQualidadeRepository } from '@/core/domain/repositories/problemas-qualidade-repository.interface';
import { IEtapaTransformacaoRepository } from '@/core/domain/repositories/etapa-transformacao-repository.interface';
import { ILinhagemAtivosRepository } from '@/core/domain/repositories/linhagem-ativos-repository.interface';
import { IAtivoDadosRepository } from '@/core/domain/repositories/ativo-dados-repository.interface';
import { IDiagnosticosQualidadeRepository } from '@/core/domain/repositories/diagnosticos-qualidade-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { ProblemaQualidade } from '@/core/domain/entities/problema-qualidade';
import { StatusProblemaQualidade } from '@/core/domain/enums/status-problema-qualidade';
import { AcaoProblemaQualidade } from '@/core/domain/enums/acao-problema-qualidade';
import { CategoriaProblemaQualidade } from '@/core/domain/enums/categoria-problema-qualidade';
import { SeveridadeProblema } from '@/core/domain/enums/severidade-problema';
import { StatusEtapaTransformacao } from '@/core/domain/enums/status-etapa-transformacao';
import { StatusExecucaoDiagnostico } from '@/core/domain/enums/status-execucao-diagnostico';
import { StatusVerificacaoQualidade } from '@/core/domain/enums/status-verificacao-qualidade';
import { StatusAtivoDados } from '@/core/domain/enums/status-ativo-dados';
import { FormatoArquivo } from '@/core/domain/enums/formato-arquivo';
import { CategoriaAtivoDados } from '@/core/domain/enums/categoria-ativo-dados';
import { TipoOperacaoPreparacao } from '@/core/domain/enums/tipo-operacao-preparacao';
import { CapacidadeFerramenta } from '@/core/domain/enums/capacidade-ferramenta';
import { PapelEntradaLinhagem } from '@/core/domain/enums/papel-entrada-linhagem';

describe('ValidarTratamentoProblemaUseCase (Subunidade 3.5C)', () => {
  let problemasRepo: IProblemasQualidadeRepository;
  let etapaRepo: IEtapaTransformacaoRepository;
  let linhagemRepo: ILinhagemAtivosRepository;
  let ativoDadosRepo: IAtivoDadosRepository;
  let diagnosticosRepo: IDiagnosticosQualidadeRepository;
  let auditRepo: IAuditRepository;

  const problemaBase: ProblemaQualidade = {
    id: 'prob_01',
    diagnostico_id: 'diag_orig',
    ativo_dados_id: 'ativo_orig',
    demanda_id: 'dem_01',
    categoria: CategoriaProblemaQualidade.NULOS_BRANCOS,
    titulo: 'Valores nulos na coluna email',
    descricao: 'Encontrados 50 nulos',
    tabela_afetada: 'clientes.csv',
    coluna_afetada: 'email',
    total_linhas_afetadas: 50,
    percentual_linhas_afetadas: 10,
    amostra_evidencias: [],
    severidade: SeveridadeProblema.ALTA,
    impacto_calculo: null,
    acao_deliberada: AcaoProblemaQualidade.TRATAR_NO_PIPELINE,
    justificativa_deliberacao: 'Tratar preenchendo com valor default',
    deliberado_por_humano: true,
    deliberado_em: '2026-09-28T00:00:00Z',
    status: StatusProblemaQualidade.EM_INVESTIGACAO,
    origem_deteccao: 'AUTOMATICA',
    criado_em: '2026-09-28T00:00:00Z',
    atualizado_em: '2026-09-28T00:00:00Z',
  };

  const etapaExecutada = {
    id: 'etp_01',
    receita_id: 'rec_01',
    ordem: 1,
    tipo_operacao: TipoOperacaoPreparacao.TRATAR_NULOS,
    capacidade_ferramenta: CapacidadeFerramenta.MOTOR_SQL,
    ferramenta_nome: 'DuckDB',
    ferramenta_versao: null,
    descricao: 'Preenche nulos na coluna email',
    especificacao_tecnica: 'COALESCE(email, "desconhecido@exemplo.com")',
    status: StatusEtapaTransformacao.EXECUTADA,
    justificativa: null,
    criado_em: '2026-09-28T00:00:00Z',
    atualizado_em: '2026-09-28T00:00:00Z',
  };

  const ativoDerivado = {
    id: 'ativo_deriv_01',
    demanda_id: 'dem_01',
    nome_arquivo: 'clientes_tratado.parquet',
    caminho_local: 'c:/dados/clientes_tratado.parquet',
    formato: FormatoArquivo.CSV,
    origem: null,
    descricao_conteudo: 'Clientes tratados',
    granularidade: null,
    periodo_inicio: null,
    periodo_fim: null,
    versao: '2.0',
    substitui_ativo_id: null,
    tamanho_bytes: 50000,
    total_linhas: 500,
    total_colunas: 6,
    hash_sha256: 'sha256_derivado',
    status: StatusAtivoDados.ATIVO,
    categoria_ativo: CategoriaAtivoDados.PREPARADO_DERIVADO,
    schema_inferido: JSON.stringify({ id: 'INTEGER', email: 'VARCHAR' }),
    data_recebimento: '2026-09-28T00:00:00Z',
    criado_em: '2026-09-28T00:00:00Z',
    atualizado_em: '2026-09-28T00:00:00Z',
  };

  const arestaLinhagem = {
    id: 'edge_01',
    demanda_id: 'dem_01',
    ativo_origem_id: 'ativo_orig',
    ativo_destino_id: 'ativo_deriv_01',
    papel_entrada: PapelEntradaLinhagem.ORIGEM_UNICA,
    etapa_transformacao_id: 'etp_01',
    criado_em: '2026-09-28T00:00:00Z',
  };

  const diagnosticoLimpo = {
    id: 'diag_deriv_limpo',
    ativo_dados_id: 'ativo_deriv_01',
    demanda_id: 'dem_01',
    iniciado_em: '2026-09-28T01:00:00Z',
    concluido_em: '2026-09-28T01:01:00Z',
    duracao_ms: 200,
    total_linhas_avaliadas: 500,
    total_colunas_avaliadas: 6,
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
    criado_em: '2026-09-28T01:00:00Z',
    atualizado_em: '2026-09-28T01:01:00Z',
  };

  beforeEach(() => {
    problemasRepo = {
      create: vi.fn(),
      createMany: vi.fn(),
      findById: vi.fn((id) => Promise.resolve(id === 'prob_01' ? { ...problemaBase } : null)),
      findByDiagnosticId: vi.fn(() => Promise.resolve([])), // padrão: sem anomalias
      findByAssetId: vi.fn(),
      findByDemandId: vi.fn(),
      update: vi.fn((id, data) => Promise.resolve({ ...problemaBase, id, ...data })),
    };

    etapaRepo = {
      findById: vi.fn((id) => Promise.resolve(id === 'etp_01' ? { ...etapaExecutada } : null)),
      findByReceitaId: vi.fn(),
      create: vi.fn(),
      update: vi.fn((id, data) => Promise.resolve({ ...etapaExecutada, id, ...data })),
      reordenar: vi.fn(),
      deleteDraftOnly: vi.fn(),
      cancelar: vi.fn(),
      vincularProblema: vi.fn(),
      desvincularProblema: vi.fn(),
      listarProblemasPorEtapa: vi.fn(() => Promise.resolve(['prob_01'])),
      listarEtapasPorProblema: vi.fn((probId) => Promise.resolve(probId === 'prob_01' ? ['etp_01'] : [])),
    };

    linhagemRepo = {
      registrarVinculo: vi.fn(),
      obterOrigens: vi.fn(),
      obterDestinos: vi.fn(),
      obterArestasPorDemanda: vi.fn(),
      obterArestasPorEtapa: vi.fn((etpId) => Promise.resolve(etpId === 'etp_01' ? [{ ...arestaLinhagem }] : [])),
      deleteDraftEdgeOnly: vi.fn(),
      registrarDerivacaoTransacional: vi.fn(),
    };

    ativoDadosRepo = {
      create: vi.fn(),
      findById: vi.fn((id) => Promise.resolve(id === 'ativo_deriv_01' ? { ...ativoDerivado } : null)),
      findByDemandId: vi.fn(),
      findByPath: vi.fn(),
      findActiveByPath: vi.fn(),
      update: vi.fn(),
      countByDemandId: vi.fn(),
      replace: vi.fn(),
    };

    diagnosticosRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findLatestByAssetId: vi.fn((assetId) => Promise.resolve(assetId === 'ativo_deriv_01' ? { ...diagnosticoLimpo } : null)),
      findByAssetId: vi.fn(),
      findByDemandId: vi.fn(),
      update: vi.fn(),
      salvarConclusaoTransacional: vi.fn(),
    };

    auditRepo = {
      record: vi.fn(),
      findByDemandaId: vi.fn(),
    };
  });

  it('deve rejeitar validação se a ação deliberada não for TRATAR_NO_PIPELINE', async () => {
    vi.mocked(problemasRepo.findById).mockResolvedValue({
      ...problemaBase,
      acao_deliberada: AcaoProblemaQualidade.ACEITAR_COMO_RESTRICAO,
    });

    const useCase = new ValidarTratamentoProblemaUseCase(
      problemasRepo,
      etapaRepo,
      linhagemRepo,
      ativoDadosRepo,
      diagnosticosRepo,
      auditRepo
    );

    await expect(useCase.execute({ problemaId: 'prob_01' })).rejects.toThrow(
      /Apenas problemas com ação deliberada TRATAR_NO_PIPELINE/
    );
  });

  it('deve rejeitar validação se o problema não tiver etapa de transformação vinculada', async () => {
    vi.mocked(etapaRepo.listarEtapasPorProblema).mockResolvedValue([]);

    const useCase = new ValidarTratamentoProblemaUseCase(
      problemasRepo,
      etapaRepo,
      linhagemRepo,
      ativoDadosRepo,
      diagnosticosRepo,
      auditRepo
    );

    await expect(useCase.execute({ problemaId: 'prob_01' })).rejects.toThrow(
      /não possui nenhuma etapa de transformação vinculada/
    );
  });

  it('deve rejeitar validação se a etapa de transformação ainda estiver PLANEJADA', async () => {
    vi.mocked(etapaRepo.findById).mockResolvedValue({
      ...etapaExecutada,
      status: StatusEtapaTransformacao.PLANEJADA,
    });

    const useCase = new ValidarTratamentoProblemaUseCase(
      problemasRepo,
      etapaRepo,
      linhagemRepo,
      ativoDadosRepo,
      diagnosticosRepo,
      auditRepo
    );

    await expect(useCase.execute({ problemaId: 'prob_01' })).rejects.toThrow(
      /Nenhuma etapa vinculada ao problema .* foi executada ainda/
    );
  });

  it('deve rejeitar validação se a etapa não possuir ativo derivado no lineage', async () => {
    vi.mocked(linhagemRepo.obterArestasPorEtapa).mockResolvedValue([]);

    const useCase = new ValidarTratamentoProblemaUseCase(
      problemasRepo,
      etapaRepo,
      linhagemRepo,
      ativoDadosRepo,
      diagnosticosRepo,
      auditRepo
    );

    await expect(useCase.execute({ problemaId: 'prob_01' })).rejects.toThrow(
      /não possui ativo de dados derivado registrado no lineage/
    );
  });

  it('deve rejeitar validação se o ativo derivado não possuir diagnóstico pós-preparação', async () => {
    vi.mocked(diagnosticosRepo.findLatestByAssetId).mockResolvedValue(null);

    const useCase = new ValidarTratamentoProblemaUseCase(
      problemasRepo,
      etapaRepo,
      linhagemRepo,
      ativoDadosRepo,
      diagnosticosRepo,
      auditRepo
    );

    await expect(useCase.execute({ problemaId: 'prob_01' })).rejects.toThrow(
      /não possui diagnóstico de qualidade pós-preparação executado/
    );
  });

  it('deve rejeitar validação se o diagnóstico pós-preparação falhou ou ainda estiver em andamento', async () => {
    vi.mocked(diagnosticosRepo.findLatestByAssetId).mockResolvedValue({
      ...diagnosticoLimpo,
      status_execucao: StatusExecucaoDiagnostico.FALHA,
      erro_mensagem: 'Memória insuficiente',
    });

    const useCase = new ValidarTratamentoProblemaUseCase(
      problemasRepo,
      etapaRepo,
      linhagemRepo,
      ativoDadosRepo,
      diagnosticosRepo,
      auditRepo
    );

    await expect(useCase.execute({ problemaId: 'prob_01' })).rejects.toThrow(
      /diagnóstico de qualidade mais recente do ativo derivado falhou/
    );

    vi.mocked(diagnosticosRepo.findLatestByAssetId).mockResolvedValue({
      ...diagnosticoLimpo,
      status_execucao: StatusExecucaoDiagnostico.EM_ANDAMENTO,
    });

    await expect(useCase.execute({ problemaId: 'prob_01' })).rejects.toThrow(
      /ainda está em execução/
    );
  });

  it('deve rejeitar validação se diagnóstico parcial limitou por guardrail a verificação da anomalia', async () => {
    vi.mocked(diagnosticosRepo.findLatestByAssetId).mockResolvedValue({
      ...diagnosticoLimpo,
      status_execucao: StatusExecucaoDiagnostico.CONCLUIDO_PARCIALMENTE,
      verificacoes_executadas: [
        {
          categoria: CategoriaProblemaQualidade.NULOS_BRANCOS,
          nome: 'Valores Nulos por Coluna (email)',
          status: StatusVerificacaoQualidade.LIMITADA_POR_GUARDRAIL,
          totalProblemas: 0,
        },
      ],
    });

    const useCase = new ValidarTratamentoProblemaUseCase(
      problemasRepo,
      etapaRepo,
      linhagemRepo,
      ativoDadosRepo,
      diagnosticosRepo,
      auditRepo
    );

    await expect(useCase.execute({ problemaId: 'prob_01' })).rejects.toThrow(
      /limitação por guardrail/
    );
  });

  it('não deve marcar TRATADO nem VALIDADA se a anomalia ainda persistir no ativo derivado', async () => {
    // Diagnóstico detectou que o problema de nulos na coluna email continua ocorrendo
    vi.mocked(problemasRepo.findByDiagnosticId).mockResolvedValue([
      {
        ...problemaBase,
        id: 'prob_novo_pos',
        diagnostico_id: 'diag_deriv_limpo',
        ativo_dados_id: 'ativo_deriv_01',
        total_linhas_afetadas: 15, // Ainda há 15 nulos
      },
    ]);

    const useCase = new ValidarTratamentoProblemaUseCase(
      problemasRepo,
      etapaRepo,
      linhagemRepo,
      ativoDadosRepo,
      diagnosticosRepo,
      auditRepo
    );

    const result = await useCase.execute({ problemaId: 'prob_01' });

    expect(result.resolvido).toBe(false);
    expect(result.motivo).toContain("A anomalia 'NULOS_BRANCOS' ainda foi detectada");
    expect(result.etapaValidada).toBeFalsy();
    expect(problemasRepo.update).not.toHaveBeenCalled();
    expect(etapaRepo.update).not.toHaveBeenCalled();
  });

  it('deve validar com sucesso, transicionar problema para TRATADO e etapa para VALIDADA quando a anomalia for eliminada', async () => {
    // Diagnóstico pós-preparação com 0 problemas
    vi.mocked(problemasRepo.findByDiagnosticId).mockResolvedValue([]);

    const useCase = new ValidarTratamentoProblemaUseCase(
      problemasRepo,
      etapaRepo,
      linhagemRepo,
      ativoDadosRepo,
      diagnosticosRepo,
      auditRepo
    );

    const result = await useCase.execute({ problemaId: 'prob_01' });

    expect(result.resolvido).toBe(true);
    expect(result.etapaValidada).toBe(true);
    expect(result.motivo).toContain('Anomalia eliminada com sucesso');

    // Confirma atualização do problema para TRATADO
    expect(problemasRepo.update).toHaveBeenCalledWith('prob_01', expect.objectContaining({
      status: StatusProblemaQualidade.TRATADO,
    }));

    // Confirma atualização da etapa para VALIDADA
    expect(etapaRepo.update).toHaveBeenCalledWith('etp_01', expect.objectContaining({
      status: StatusEtapaTransformacao.VALIDADA,
    }));

    // Confirma auditoria
    expect(auditRepo.record).toHaveBeenCalledTimes(2);
  });
});
