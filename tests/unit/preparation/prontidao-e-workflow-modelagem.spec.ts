import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VerificarProntidaoParaModelagemUseCase } from '@/core/use-cases/preparation/verificar-prontidao-para-modelagem.use-case';
import { WorkflowEngine, WorkflowTransitionError } from '@/core/domain/rules/workflow-engine';
import { IDatasetAutorizadoRepository } from '@/core/domain/repositories/dataset-autorizado-repository.interface';
import { IAtivoDadosRepository } from '@/core/domain/repositories/ativo-dados-repository.interface';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { IDiagnosticosQualidadeRepository } from '@/core/domain/repositories/diagnosticos-qualidade-repository.interface';
import { IReceitaPreparacaoRepository } from '@/core/domain/repositories/receita-preparacao-repository.interface';
import { IProblemasQualidadeRepository } from '@/core/domain/repositories/problemas-qualidade-repository.interface';
import { StatusAutorizacaoDataset } from '@/core/domain/enums/status-autorizacao-dataset';
import { StatusAtivoDados } from '@/core/domain/enums/status-ativo-dados';
import { FormatoArquivo } from '@/core/domain/enums/formato-arquivo';
import { CategoriaAtivoDados } from '@/core/domain/enums/categoria-ativo-dados';
import { StatusReceitaPreparacao } from '@/core/domain/enums/status-receita-preparacao';
import { StatusExecucaoDiagnostico } from '@/core/domain/enums/status-execucao-diagnostico';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { StatusProblemaQualidade } from '@/core/domain/enums/status-problema-qualidade';
import { AcaoProblemaQualidade } from '@/core/domain/enums/acao-problema-qualidade';
import { SeveridadeProblema } from '@/core/domain/enums/severidade-problema';
import { CategoriaProblemaQualidade } from '@/core/domain/enums/categoria-problema-qualidade';

describe('VerificarProntidaoParaModelagemUseCase e Workflow Governance (Subunidade 3.5C)', () => {
  let datasetRepo: IDatasetAutorizadoRepository;
  let ativoRepo: IAtivoDadosRepository;
  let demandRepo: IDemandRepository;
  let diagnosticosRepo: IDiagnosticosQualidadeRepository;
  let receitaRepo: IReceitaPreparacaoRepository;
  let problemasRepo: IProblemasQualidadeRepository;

  const demandaValida = {
    id: 'dem_01',
    projeto_id: 'proj_01',
    projetoNome: 'Projeto Teste',
    titulo: 'Demanda Prontidão',
    solicitacao_bruta: 'Bruta',
    contexto: 'Contexto',
    objetivo_inicial: 'Objetivo',
    prazo_esperado: null,
    restricoes_declaradas: null,
    estado: EstadoDemanda.EM_QUALIDADE_E_PREPARACAO,
    data_conclusao: null,
    criado_em: '2026-09-28T00:00:00Z',
    atualizado_em: '2026-09-28T00:00:00Z',
  };

  const ativoAutorizado = {
    id: 'ativo_01',
    demanda_id: 'dem_01',
    nome_arquivo: 'dataset_pronto.parquet',
    caminho_local: 'c:/dados/dataset_pronto.parquet',
    formato: FormatoArquivo.CSV,
    origem: null,
    descricao_conteudo: 'Dataset Homologado',
    granularidade: null,
    periodo_inicio: null,
    periodo_fim: null,
    versao: '1.0',
    substitui_ativo_id: null,
    tamanho_bytes: 1000,
    total_linhas: 200,
    total_colunas: 6,
    hash_sha256: 'sha256_hash_correto_123',
    status: StatusAtivoDados.ATIVO,
    categoria_ativo: CategoriaAtivoDados.PREPARADO_DERIVADO,
    schema_inferido: null,
    data_recebimento: '2026-09-28T00:00:00Z',
    criado_em: '2026-09-28T00:00:00Z',
    atualizado_em: '2026-09-28T00:00:00Z',
  };

  const datasetVigente = {
    id: 'aut_01',
    demanda_id: 'dem_01',
    ativo_dados_id: 'ativo_01',
    diagnostico_qualidade_id: 'diag_01',
    receita_preparacao_id: 'rec_01',
    versao_rotulo: '1.0-preparado',
    hash_sha256_snapshot: 'sha256_hash_correto_123',
    status: StatusAutorizacaoDataset.VIGENTE,
    justificativa_autorizacao: 'Homologação formal do dataset para modelagem.',
    autorizado_por_tipo: 'HUMANO' as const,
    restricoes_aceitas_snapshot: '[]',
    autorizado_em: '2026-09-28T00:00:00Z',
    revogado_em: null,
    motivo_revogacao: null,
  };

  const receitaConcluida = {
    id: 'rec_01',
    demanda_id: 'dem_01',
    titulo: 'Receita Concluída',
    descricao: null,
    status: StatusReceitaPreparacao.CONCLUIDA,
    versao: 1,
    criado_em: '2026-09-28T00:00:00Z',
    atualizado_em: '2026-09-28T00:00:00Z',
  };

  const diagnosticoOk = {
    id: 'diag_01',
    ativo_dados_id: 'ativo_01',
    demanda_id: 'dem_01',
    iniciado_em: '2026-09-28T00:00:00Z',
    concluido_em: '2026-09-28T00:01:00Z',
    duracao_ms: 100,
    total_linhas_avaliadas: 200,
    total_colunas_avaliadas: 6,
    verificacoes_executadas: [],
    total_problemas_detectados: 0,
    status_execucao: StatusExecucaoDiagnostico.CONCLUIDO,
    erro_mensagem: null,
    resumo_metricas: null,
    criado_em: '2026-09-28T00:00:00Z',
    atualizado_em: '2026-09-28T00:01:00Z',
  };

  beforeEach(() => {
    datasetRepo = {
      findById: vi.fn(),
      findVigenteByDemandId: vi.fn(() => Promise.resolve({ ...datasetVigente })),
      listarHistorico: vi.fn(),
      autorizarTransacional: vi.fn(),
      revogar: vi.fn(),
    };

    ativoRepo = {
      create: vi.fn(),
      findById: vi.fn((id) => Promise.resolve(id === 'ativo_01' ? { ...ativoAutorizado } : null)),
      findByDemandId: vi.fn(() => Promise.resolve([{ ...ativoAutorizado }])),
      findByPath: vi.fn(),
      findActiveByPath: vi.fn(),
      update: vi.fn(),
      countByDemandId: vi.fn(),
      replace: vi.fn(),
    };

    demandRepo = {
      create: vi.fn(),
      findById: vi.fn((id) => Promise.resolve(id === 'dem_01' ? { ...demandaValida } : null)),
      findByProjectId: vi.fn(),
      findAll: vi.fn(),
      findRecent: vi.fn(),
      update: vi.fn(),
      countActive: vi.fn(),
      countTotal: vi.fn(),
    };

    diagnosticosRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findLatestByAssetId: vi.fn(() => Promise.resolve({ ...diagnosticoOk })),
      findByAssetId: vi.fn(),
      findByDemandId: vi.fn(),
      update: vi.fn(),
      salvarConclusaoTransacional: vi.fn(),
    };

    receitaRepo = {
      findById: vi.fn((id) => Promise.resolve(id === 'rec_01' ? { ...receitaConcluida } : null)),
      findByDemandId: vi.fn(),
      findActiveByDemandId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteDraftOnly: vi.fn(),
    };

    problemasRepo = {
      create: vi.fn(),
      createMany: vi.fn(),
      findById: vi.fn(),
      findByDiagnosticId: vi.fn(() => Promise.resolve([])),
      findByAssetId: vi.fn(() => Promise.resolve([])),
      findByDemandId: vi.fn(() => Promise.resolve([])),
      update: vi.fn(),
    };
  });

  describe('VerificarProntidaoParaModelagemUseCase', () => {
    it('deve apontar bloqueio quando a demanda não tiver dataset autorizado vigente', async () => {
      vi.mocked(datasetRepo.findVigenteByDemandId).mockResolvedValue(null);

      const useCase = new VerificarProntidaoParaModelagemUseCase(
        datasetRepo,
        ativoRepo,
        demandRepo,
        diagnosticosRepo,
        receitaRepo,
        problemasRepo
      );

      const res = await useCase.execute({ demandaId: 'dem_01' });

      expect(res.pronto).toBe(false);
      expect(res.motivosBloqueio).toContain(
        'A demanda não possui nenhum Dataset Autorizado para Análise no status VIGENTE.'
      );
    });

    it('deve apontar bloqueio diante de divergência de hash (Drift de Hash)', async () => {
      // Simula que o arquivo físico no disco foi alterado e seu hash mudou
      vi.mocked(ativoRepo.findById).mockResolvedValue({
        ...ativoAutorizado,
        hash_sha256: 'sha256_adulterado_999',
      });

      const useCase = new VerificarProntidaoParaModelagemUseCase(
        datasetRepo,
        ativoRepo,
        demandRepo,
        diagnosticosRepo,
        receitaRepo,
        problemasRepo
      );

      const res = await useCase.execute({ demandaId: 'dem_01' });

      expect(res.pronto).toBe(false);
      expect(res.detalhes.hashValido).toBe(false);
      expect(res.motivosBloqueio.some((m) => m.includes('Drift de Hash'))).toBe(true);
    });

    it('deve apontar bloqueio quando a receita associada ao dataset não estiver concluída', async () => {
      vi.mocked(receitaRepo.findById).mockResolvedValue({
        ...receitaConcluida,
        status: StatusReceitaPreparacao.EM_EXECUCAO,
      });

      const useCase = new VerificarProntidaoParaModelagemUseCase(
        datasetRepo,
        ativoRepo,
        demandRepo,
        diagnosticosRepo,
        receitaRepo,
        problemasRepo
      );

      const res = await useCase.execute({ demandaId: 'dem_01' });

      expect(res.pronto).toBe(false);
      expect(res.motivosBloqueio.some((m) => m.includes('não está concluída'))).toBe(true);
    });

    it('deve apontar bloqueio quando houver problemas com TRATAR_NO_PIPELINE não resolvidos', async () => {
      vi.mocked(problemasRepo.findByDemandId).mockResolvedValue([
        {
          id: 'prob_pendente',
          diagnostico_id: 'diag_01',
          ativo_dados_id: 'ativo_01',
          demanda_id: 'dem_01',
          categoria: CategoriaProblemaQualidade.NULOS_BRANCOS,
          titulo: 'Nulos',
          descricao: 'Desc',
          tabela_afetada: 'tab',
          coluna_afetada: 'col',
          total_linhas_afetadas: 5,
          percentual_linhas_afetadas: 1,
          amostra_evidencias: [],
          severidade: SeveridadeProblema.ALTA,
          impacto_calculo: null,
          acao_deliberada: AcaoProblemaQualidade.TRATAR_NO_PIPELINE,
          justificativa_deliberacao: 'Tratar',
          deliberado_por_humano: true,
          deliberado_em: '2026-09-28T00:00:00Z',
          status: StatusProblemaQualidade.EM_INVESTIGACAO, // Não resolvido!
          origem_deteccao: 'AUTOMATICA',
          criado_em: '2026-09-28T00:00:00Z',
          atualizado_em: '2026-09-28T00:00:00Z',
        },
      ]);

      const useCase = new VerificarProntidaoParaModelagemUseCase(
        datasetRepo,
        ativoRepo,
        demandRepo,
        diagnosticosRepo,
        receitaRepo,
        problemasRepo
      );

      const res = await useCase.execute({ demandaId: 'dem_01' });

      expect(res.pronto).toBe(false);
      expect(res.detalhes.problemasNaoTratadosNoPipeline).toBe(1);
      expect(res.motivosBloqueio.some((m) => m.includes('não foram resolvidos'))).toBe(true);
    });

    it('deve confirmar prontidão quando todos os critérios de governança forem satisfeitos', async () => {
      const useCase = new VerificarProntidaoParaModelagemUseCase(
        datasetRepo,
        ativoRepo,
        demandRepo,
        diagnosticosRepo,
        receitaRepo,
        problemasRepo
      );

      const res = await useCase.execute({ demandaId: 'dem_01' });

      expect(res.pronto).toBe(true);
      expect(res.motivosBloqueio).toHaveLength(0);
      expect(res.detalhes.hashValido).toBe(true);
      expect(res.detalhes.qualityGate?.liberado).toBe(true);
      expect(res.detalhes.datasetAutorizado?.status).toBe(StatusAutorizacaoDataset.VIGENTE);
      expect(res.detalhes.receitaConcluida?.status).toBe(StatusReceitaPreparacao.CONCLUIDA);
    });
  });

  describe('WorkflowEngine Governance Gate', () => {
    const qualityGateLiberado = {
      decisao: 'LIBERADO' as const,
      liberado: true,
      bloqueante: false,
      exigeJustificativa: false,
      motivo: 'Quality Gate liberado',
      detalhes: {} as any,
    };

    it('deve bloquear avanço para EM_MODELAGEM_E_ANALISE se datasetAutorizado for nulo', () => {
      const res = WorkflowEngine.podeTransitar(
        EstadoDemanda.EM_QUALIDADE_E_PREPARACAO,
        EstadoDemanda.EM_MODELAGEM_E_ANALISE,
        {
          qualityGate: qualityGateLiberado,
          datasetAutorizado: null, // Explícito nulo
        }
      );

      expect(res.valida).toBe(false);
      expect(res.mensagem).toContain('sem um Dataset Autorizado para Análise no status VIGENTE');
      expect(() =>
        WorkflowEngine.validarTransicao(
          EstadoDemanda.EM_QUALIDADE_E_PREPARACAO,
          EstadoDemanda.EM_MODELAGEM_E_ANALISE,
          {
            qualityGate: qualityGateLiberado,
            datasetAutorizado: null,
          }
        )
      ).toThrow(WorkflowTransitionError);
    });

    it('deve bloquear avanço se o datasetAutorizado estiver REVOGADO ou SUBSTITUIDO', () => {
      const res = WorkflowEngine.podeTransitar(
        EstadoDemanda.EM_QUALIDADE_E_PREPARACAO,
        EstadoDemanda.EM_MODELAGEM_E_ANALISE,
        {
          qualityGate: qualityGateLiberado,
          datasetAutorizado: {
            id: 'aut_01',
            status: StatusAutorizacaoDataset.REVOGADO,
            ativo_dados_id: 'ativo_01',
            hash_sha256_snapshot: 'hash_correto',
          },
        }
      );

      expect(res.valida).toBe(false);
      expect(res.mensagem).toContain('status VIGENTE');
    });

    it('deve bloquear avanço se o ativo autorizado não tiver status ATIVO', () => {
      const res = WorkflowEngine.podeTransitar(
        EstadoDemanda.EM_QUALIDADE_E_PREPARACAO,
        EstadoDemanda.EM_MODELAGEM_E_ANALISE,
        {
          qualityGate: qualityGateLiberado,
          datasetAutorizado: {
            id: 'aut_01',
            status: StatusAutorizacaoDataset.VIGENTE,
            ativo_dados_id: 'ativo_01',
            hash_sha256_snapshot: 'hash_correto',
          },
          ativoAutorizado: {
            id: 'ativo_01',
            status: StatusAtivoDados.SUBSTITUIDO,
            hash_sha256: 'hash_correto',
          },
        }
      );

      expect(res.valida).toBe(false);
      expect(res.mensagem).toContain('não é o ativo vigente da demanda');
    });

    it('deve bloquear avanço diante de divergência entre hash do ativo e snapshot do dataset', () => {
      const res = WorkflowEngine.podeTransitar(
        EstadoDemanda.EM_QUALIDADE_E_PREPARACAO,
        EstadoDemanda.EM_MODELAGEM_E_ANALISE,
        {
          qualityGate: qualityGateLiberado,
          datasetAutorizado: {
            id: 'aut_01',
            status: StatusAutorizacaoDataset.VIGENTE,
            ativo_dados_id: 'ativo_01',
            hash_sha256_snapshot: 'hash_original',
          },
          ativoAutorizado: {
            id: 'ativo_01',
            status: StatusAtivoDados.ATIVO,
            hash_sha256: 'hash_adulterado',
          },
        }
      );

      expect(res.valida).toBe(false);
      expect(res.mensagem).toContain('Violação de integridade física');
    });

    it('deve bloquear avanço se a receita de preparação associada não estiver CONCLUIDA', () => {
      const res = WorkflowEngine.podeTransitar(
        EstadoDemanda.EM_QUALIDADE_E_PREPARACAO,
        EstadoDemanda.EM_MODELAGEM_E_ANALISE,
        {
          qualityGate: qualityGateLiberado,
          datasetAutorizado: {
            id: 'aut_01',
            status: StatusAutorizacaoDataset.VIGENTE,
            ativo_dados_id: 'ativo_01',
            hash_sha256_snapshot: 'hash_correto',
            receita_preparacao_id: 'rec_01',
          },
          ativoAutorizado: {
            id: 'ativo_01',
            status: StatusAtivoDados.ATIVO,
            hash_sha256: 'hash_correto',
          },
          receitaPreparacao: {
            id: 'rec_01',
            status: StatusReceitaPreparacao.EM_EXECUCAO, // Não concluída!
          },
        }
      );

      expect(res.valida).toBe(false);
      expect(res.mensagem).toContain('deve estar no status CONCLUIDA');
    });

    it('deve bloquear avanço se existirem problemas com TRATAR_NO_PIPELINE pendentes', () => {
      const res = WorkflowEngine.podeTransitar(
        EstadoDemanda.EM_QUALIDADE_E_PREPARACAO,
        EstadoDemanda.EM_MODELAGEM_E_ANALISE,
        {
          qualityGate: qualityGateLiberado,
          datasetAutorizado: {
            id: 'aut_01',
            status: StatusAutorizacaoDataset.VIGENTE,
            ativo_dados_id: 'ativo_01',
            hash_sha256_snapshot: 'hash_correto',
            receita_preparacao_id: 'rec_01',
          },
          ativoAutorizado: {
            id: 'ativo_01',
            status: StatusAtivoDados.ATIVO,
            hash_sha256: 'hash_correto',
          },
          receitaPreparacao: {
            id: 'rec_01',
            status: StatusReceitaPreparacao.CONCLUIDA,
          },
          problemasPendentesDeTratamento: 2, // 2 problemas não tratados!
        }
      );

      expect(res.valida).toBe(false);
      expect(res.mensagem).toContain('com plano de tratamento no pipeline que não foram empiricamente resolvidos');
    });

    it('deve permitir avanço para EM_MODELAGEM_E_ANALISE quando todos os requisitos da 3.5C forem satisfeitos', () => {
      const res = WorkflowEngine.podeTransitar(
        EstadoDemanda.EM_QUALIDADE_E_PREPARACAO,
        EstadoDemanda.EM_MODELAGEM_E_ANALISE,
        {
          qualityGate: qualityGateLiberado,
          datasetAutorizado: {
            id: 'aut_01',
            status: StatusAutorizacaoDataset.VIGENTE,
            ativo_dados_id: 'ativo_01',
            hash_sha256_snapshot: 'hash_correto',
            receita_preparacao_id: 'rec_01',
          },
          ativoAutorizado: {
            id: 'ativo_01',
            status: StatusAtivoDados.ATIVO,
            hash_sha256: 'hash_correto',
          },
          receitaPreparacao: {
            id: 'rec_01',
            status: StatusReceitaPreparacao.CONCLUIDA,
          },
          problemasPendentesDeTratamento: 0,
        }
      );

      expect(res.valida).toBe(true);
      expect(() =>
        WorkflowEngine.validarTransicao(
          EstadoDemanda.EM_QUALIDADE_E_PREPARACAO,
          EstadoDemanda.EM_MODELAGEM_E_ANALISE,
          {
            qualityGate: qualityGateLiberado,
            datasetAutorizado: {
              id: 'aut_01',
              status: StatusAutorizacaoDataset.VIGENTE,
              ativo_dados_id: 'ativo_01',
              hash_sha256_snapshot: 'hash_correto',
              receita_preparacao_id: 'rec_01',
            },
            ativoAutorizado: {
              id: 'ativo_01',
              status: StatusAtivoDados.ATIVO,
              hash_sha256: 'hash_correto',
            },
            receitaPreparacao: {
              id: 'rec_01',
              status: StatusReceitaPreparacao.CONCLUIDA,
            },
            problemasPendentesDeTratamento: 0,
          }
        )
      ).not.toThrow();
    });
  });
});
