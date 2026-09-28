import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AutorizarDatasetAnaliseUseCase } from '@/core/use-cases/preparation/autorizar-dataset-analise.use-case';
import { RevogarAutorizacaoDatasetUseCase } from '@/core/use-cases/preparation/revogar-autorizacao-dataset.use-case';
import { IDatasetAutorizadoRepository } from '@/core/domain/repositories/dataset-autorizado-repository.interface';
import { IAtivoDadosRepository } from '@/core/domain/repositories/ativo-dados-repository.interface';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { IDiagnosticosQualidadeRepository } from '@/core/domain/repositories/diagnosticos-qualidade-repository.interface';
import { IReceitaPreparacaoRepository } from '@/core/domain/repositories/receita-preparacao-repository.interface';
import { IProblemasQualidadeRepository } from '@/core/domain/repositories/problemas-qualidade-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { StatusAutorizacaoDataset } from '@/core/domain/enums/status-autorizacao-dataset';
import { StatusAtivoDados } from '@/core/domain/enums/status-ativo-dados';
import { CategoriaAtivoDados } from '@/core/domain/enums/categoria-ativo-dados';
import { FormatoArquivo } from '@/core/domain/enums/formato-arquivo';
import { StatusExecucaoDiagnostico } from '@/core/domain/enums/status-execucao-diagnostico';
import { StatusReceitaPreparacao } from '@/core/domain/enums/status-receita-preparacao';
import { StatusProblemaQualidade } from '@/core/domain/enums/status-problema-qualidade';
import { AcaoProblemaQualidade } from '@/core/domain/enums/acao-problema-qualidade';
import { SeveridadeProblema } from '@/core/domain/enums/severidade-problema';
import { CategoriaProblemaQualidade } from '@/core/domain/enums/categoria-problema-qualidade';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';

describe('AutorizarDatasetAnaliseUseCase e RevogarAutorizacaoDatasetUseCase (Subunidade 3.5C)', () => {
  let datasetRepo: IDatasetAutorizadoRepository;
  let ativoRepo: IAtivoDadosRepository;
  let demandRepo: IDemandRepository;
  let diagnosticosRepo: IDiagnosticosQualidadeRepository;
  let receitaRepo: IReceitaPreparacaoRepository;
  let problemasRepo: IProblemasQualidadeRepository;
  let auditRepo: IAuditRepository;

  const demandaValida = {
    id: 'dem_01',
    projeto_id: 'proj_01',
    projetoNome: 'Projeto Teste',
    titulo: 'Demanda Teste Autorização',
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

  const ativoBruto = {
    id: 'ativo_bruto_01',
    demanda_id: 'dem_01',
    nome_arquivo: 'vendas_raw.csv',
    caminho_local: 'c:/dados/vendas_raw.csv',
    formato: FormatoArquivo.CSV,
    origem: null,
    descricao_conteudo: 'Bruto',
    granularidade: null,
    periodo_inicio: null,
    periodo_fim: null,
    versao: '1.0',
    substitui_ativo_id: null,
    tamanho_bytes: 1000,
    total_linhas: 100,
    total_colunas: 5,
    hash_sha256: 'hash_bruto_123',
    status: StatusAtivoDados.ATIVO,
    categoria_ativo: CategoriaAtivoDados.BRUTO_RECEBIDO,
    schema_inferido: null,
    data_recebimento: '2026-09-28T00:00:00Z',
    criado_em: '2026-09-28T00:00:00Z',
    atualizado_em: '2026-09-28T00:00:00Z',
  };

  const ativoPreparado = {
    id: 'ativo_prep_01',
    demanda_id: 'dem_01',
    nome_arquivo: 'vendas_curated.parquet',
    caminho_local: 'c:/dados/vendas_curated.parquet',
    formato: FormatoArquivo.CSV,
    origem: null,
    descricao_conteudo: 'Preparado',
    granularidade: null,
    periodo_inicio: null,
    periodo_fim: null,
    versao: '2.0',
    substitui_ativo_id: null,
    tamanho_bytes: 800,
    total_linhas: 95,
    total_colunas: 5,
    hash_sha256: 'hash_prep_456',
    status: StatusAtivoDados.ATIVO,
    categoria_ativo: CategoriaAtivoDados.PREPARADO_DERIVADO,
    schema_inferido: null,
    data_recebimento: '2026-09-28T00:00:00Z',
    criado_em: '2026-09-28T00:00:00Z',
    atualizado_em: '2026-09-28T00:00:00Z',
  };

  const diagnosticoValido = {
    id: 'diag_valido',
    ativo_dados_id: 'ativo_bruto_01',
    demanda_id: 'dem_01',
    iniciado_em: '2026-09-28T00:00:00Z',
    concluido_em: '2026-09-28T00:01:00Z',
    duracao_ms: 100,
    total_linhas_avaliadas: 100,
    total_colunas_avaliadas: 5,
    verificacoes_executadas: [],
    total_problemas_detectados: 0,
    status_execucao: StatusExecucaoDiagnostico.CONCLUIDO,
    erro_mensagem: null,
    resumo_metricas: null,
    criado_em: '2026-09-28T00:00:00Z',
    atualizado_em: '2026-09-28T00:01:00Z',
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

  beforeEach(() => {
    datasetRepo = {
      findById: vi.fn(),
      findVigenteByDemandId: vi.fn(),
      listarHistorico: vi.fn(),
      autorizarTransacional: vi.fn((a) => Promise.resolve(a)),
      revogar: vi.fn((id, motivo, ts) =>
        Promise.resolve({
          id,
          demanda_id: 'dem_01',
          ativo_dados_id: 'ativo_bruto_01',
          diagnostico_qualidade_id: 'diag_valido',
          receita_preparacao_id: null,
          versao_rotulo: '1.0-bruto',
          hash_sha256_snapshot: 'hash_bruto_123',
          status: StatusAutorizacaoDataset.REVOGADO,
          justificativa_autorizacao: 'Homologação inicial válida',
          autorizado_por_tipo: 'HUMANO' as const,
          restricoes_aceitas_snapshot: '[]',
          autorizado_em: '2026-09-28T00:00:00Z',
          revogado_em: ts,
          motivo_revogacao: motivo,
        })
      ),
    };

    ativoRepo = {
      create: vi.fn(),
      findById: vi.fn((id) => {
        if (id === 'ativo_bruto_01') return Promise.resolve({ ...ativoBruto });
        if (id === 'ativo_prep_01') return Promise.resolve({ ...ativoPreparado });
        return Promise.resolve(null);
      }),
      findByDemandId: vi.fn(() => Promise.resolve([{ ...ativoBruto }, { ...ativoPreparado }])),
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
      findLatestByAssetId: vi.fn((assetId) =>
        Promise.resolve({
          ...diagnosticoValido,
          ativo_dados_id: assetId,
        })
      ),
      findByAssetId: vi.fn(),
      findByDemandId: vi.fn(),
      update: vi.fn(),
      salvarConclusaoTransacional: vi.fn(),
    };

    receitaRepo = {
      findById: vi.fn((id) => Promise.resolve(id === 'rec_01' ? { ...receitaConcluida } : null)),
      findByDemandId: vi.fn(),
      findActiveByDemandId: vi.fn(() => Promise.resolve(null)),
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

    auditRepo = {
      record: vi.fn(),
      findByDemandaId: vi.fn(),
    };
  });

  describe('AutorizarDatasetAnaliseUseCase', () => {
    it('deve rejeitar autorização com justificativa menor que 15 caracteres', async () => {
      const useCase = new AutorizarDatasetAnaliseUseCase(
        datasetRepo,
        ativoRepo,
        demandRepo,
        diagnosticosRepo,
        receitaRepo,
        problemasRepo,
        auditRepo
      );

      await expect(
        useCase.execute({
          demandaId: 'dem_01',
          ativoDadosId: 'ativo_bruto_01',
          versaoRotulo: '1.0-bruto',
          justificativa: 'Muito curta',
        })
      ).rejects.toThrow(/mínimo 15 caracteres explicativos/);
    });

    it('deve rejeitar autorização quando o ativo informado não for encontrado ou estiver inativo', async () => {
      vi.mocked(ativoRepo.findById).mockResolvedValue({
        ...ativoBruto,
        status: StatusAtivoDados.SUBSTITUIDO,
      });

      const useCase = new AutorizarDatasetAnaliseUseCase(
        datasetRepo,
        ativoRepo,
        demandRepo,
        diagnosticosRepo,
        receitaRepo,
        problemasRepo,
        auditRepo
      );

      await expect(
        useCase.execute({
          demandaId: 'dem_01',
          ativoDadosId: 'ativo_bruto_01',
          versaoRotulo: '1.0-bruto',
          justificativa: 'Homologação formal do dataset bruto para análise exploratória.',
        })
      ).rejects.toThrow(/Apenas ativos com status ATIVO podem ser autorizados/);
    });

    it('deve rejeitar autorização de ativo bruto se existir receita de preparação em execução', async () => {
      vi.mocked(receitaRepo.findActiveByDemandId).mockResolvedValue({
        id: 'rec_ativa',
        demanda_id: 'dem_01',
        titulo: 'Receita Ativa',
        descricao: null,
        status: StatusReceitaPreparacao.EM_EXECUCAO,
        versao: 1,
        criado_em: '2026-09-28T00:00:00Z',
        atualizado_em: '2026-09-28T00:00:00Z',
      });

      const useCase = new AutorizarDatasetAnaliseUseCase(
        datasetRepo,
        ativoRepo,
        demandRepo,
        diagnosticosRepo,
        receitaRepo,
        problemasRepo,
        auditRepo
      );

      await expect(
        useCase.execute({
          demandaId: 'dem_01',
          ativoDadosId: 'ativo_bruto_01',
          versaoRotulo: '1.0-bruto',
          justificativa: 'Tentando autorizar bruto enquanto receita está em execução.',
        })
      ).rejects.toThrow(/Existe uma receita de preparação em execução/);
    });

    it('deve rejeitar autorização de ativo derivado se a receita não estiver CONCLUIDA', async () => {
      vi.mocked(receitaRepo.findById).mockResolvedValue({
        ...receitaConcluida,
        status: StatusReceitaPreparacao.EM_EXECUCAO,
      });

      const useCase = new AutorizarDatasetAnaliseUseCase(
        datasetRepo,
        ativoRepo,
        demandRepo,
        diagnosticosRepo,
        receitaRepo,
        problemasRepo,
        auditRepo
      );

      await expect(
        useCase.execute({
          demandaId: 'dem_01',
          ativoDadosId: 'ativo_prep_01',
          receitaPreparacaoId: 'rec_01',
          versaoRotulo: '2.0-preparado',
          justificativa: 'Autorização formal do ativo preparado para modelagem estatística.',
        })
      ).rejects.toThrow(/deve estar no status CONCLUIDA/);
    });

    it('deve autorizar com sucesso ativo derivado com receita concluída e congelar snapshots', async () => {
      // Configura um problema com status ACEITO_COMO_RESTRICAO
      vi.mocked(problemasRepo.findByDemandId).mockResolvedValue([
        {
          id: 'prob_restricao',
          diagnostico_id: 'diag_valido',
          ativo_dados_id: 'ativo_prep_01',
          demanda_id: 'dem_01',
          categoria: CategoriaProblemaQualidade.NULOS_BRANCOS,
          titulo: 'Nulos aceitos',
          descricao: 'Desc',
          tabela_afetada: 'vendas_curated.parquet',
          coluna_afetada: 'observacao',
          total_linhas_afetadas: 10,
          percentual_linhas_afetadas: 10,
          amostra_evidencias: [],
          severidade: SeveridadeProblema.MEDIA,
          impacto_calculo: null,
          acao_deliberada: AcaoProblemaQualidade.ACEITAR_COMO_RESTRICAO,
          justificativa_deliberacao: 'Coluna observacao não é usada nas métricas',
          deliberado_por_humano: true,
          deliberado_em: '2026-09-28T00:00:00Z',
          status: StatusProblemaQualidade.ACEITO_COMO_RESTRICAO,
          origem_deteccao: 'AUTOMATICA',
          criado_em: '2026-09-28T00:00:00Z',
          atualizado_em: '2026-09-28T00:00:00Z',
        },
      ]);

      const useCase = new AutorizarDatasetAnaliseUseCase(
        datasetRepo,
        ativoRepo,
        demandRepo,
        diagnosticosRepo,
        receitaRepo,
        problemasRepo,
        auditRepo
      );

      const res = await useCase.execute({
        demandaId: 'dem_01',
        ativoDadosId: 'ativo_prep_01',
        receitaPreparacaoId: 'rec_01',
        versaoRotulo: '2.0-preparado',
        justificativa: 'Homologação e atesto formal do dataset preparado após validação determinística.',
      });

      expect(res.status).toBe(StatusAutorizacaoDataset.VIGENTE);
      expect(res.hash_sha256_snapshot).toBe('hash_prep_456');
      expect(res.receita_preparacao_id).toBe('rec_01');
      expect(res.autorizado_por_tipo).toBe('HUMANO');

      // Verifica snapshot de restrições aceitas
      const restricoes = JSON.parse(res.restricoes_aceitas_snapshot);
      expect(restricoes).toHaveLength(1);
      expect(restricoes[0].id).toBe('prob_restricao');

      expect(datasetRepo.autorizarTransacional).toHaveBeenCalledTimes(1);
      expect(auditRepo.record).toHaveBeenCalledTimes(1);
    });

    it('deve autorizar com sucesso ativo bruto original quando não houver preparação', async () => {
      const useCase = new AutorizarDatasetAnaliseUseCase(
        datasetRepo,
        ativoRepo,
        demandRepo,
        diagnosticosRepo,
        receitaRepo,
        problemasRepo,
        auditRepo
      );

      const res = await useCase.execute({
        demandaId: 'dem_01',
        ativoDadosId: 'ativo_bruto_01',
        versaoRotulo: '1.0-bruto',
        justificativa: 'Homologação formal do arquivo bruto original que atende todos os critérios de qualidade.',
      });

      expect(res.status).toBe(StatusAutorizacaoDataset.VIGENTE);
      expect(res.hash_sha256_snapshot).toBe('hash_bruto_123');
      expect(res.receita_preparacao_id).toBeNull();
    });
  });

  describe('RevogarAutorizacaoDatasetUseCase', () => {
    it('deve rejeitar revogação com motivo menor que 15 caracteres', async () => {
      const useCase = new RevogarAutorizacaoDatasetUseCase(datasetRepo, auditRepo);

      await expect(
        useCase.execute({
          autorizacaoId: 'aut_01',
          motivo: 'Curto demais',
        })
      ).rejects.toThrow(/mínimo 15 caracteres explicativos/);
    });

    it('deve rejeitar revogação de autorização não encontrada', async () => {
      vi.mocked(datasetRepo.findById).mockResolvedValue(null);

      const useCase = new RevogarAutorizacaoDatasetUseCase(datasetRepo, auditRepo);

      await expect(
        useCase.execute({
          autorizacaoId: 'aut_inexistente',
          motivo: 'Revogação formal por alteração nos requisitos de negócio do projeto.',
        })
      ).rejects.toThrow(/não encontrada/);
    });

    it('deve rejeitar revogação de autorização que não seja VIGENTE', async () => {
      vi.mocked(datasetRepo.findById).mockResolvedValue({
        id: 'aut_01',
        demanda_id: 'dem_01',
        ativo_dados_id: 'ativo_bruto_01',
        diagnostico_qualidade_id: 'diag_valido',
        receita_preparacao_id: null,
        versao_rotulo: '1.0-bruto',
        hash_sha256_snapshot: 'hash_bruto_123',
        status: StatusAutorizacaoDataset.SUBSTITUIDO,
        justificativa_autorizacao: 'Homologação inicial',
        autorizado_por_tipo: 'HUMANO',
        restricoes_aceitas_snapshot: '[]',
        autorizado_em: '2026-09-28T00:00:00Z',
        revogado_em: null,
        motivo_revogacao: null,
      });

      const useCase = new RevogarAutorizacaoDatasetUseCase(datasetRepo, auditRepo);

      await expect(
        useCase.execute({
          autorizacaoId: 'aut_01',
          motivo: 'Tentativa de revogar autorização que já estava substituída.',
        })
      ).rejects.toThrow(/Apenas autorizações no status VIGENTE podem ser revogadas/);
    });

    it('deve revogar com sucesso autorização vigente e registrar auditoria', async () => {
      vi.mocked(datasetRepo.findById).mockResolvedValue({
        id: 'aut_01',
        demanda_id: 'dem_01',
        ativo_dados_id: 'ativo_bruto_01',
        diagnostico_qualidade_id: 'diag_valido',
        receita_preparacao_id: null,
        versao_rotulo: '1.0-bruto',
        hash_sha256_snapshot: 'hash_bruto_123',
        status: StatusAutorizacaoDataset.VIGENTE,
        justificativa_autorizacao: 'Homologação inicial',
        autorizado_por_tipo: 'HUMANO',
        restricoes_aceitas_snapshot: '[]',
        autorizado_em: '2026-09-28T00:00:00Z',
        revogado_em: null,
        motivo_revogacao: null,
      });

      const useCase = new RevogarAutorizacaoDatasetUseCase(datasetRepo, auditRepo);

      const res = await useCase.execute({
        autorizacaoId: 'aut_01',
        motivo: 'Revogação necessária devido à detecção de falha de granularidade no arquivo.',
      });

      expect(res.status).toBe(StatusAutorizacaoDataset.REVOGADO);
      expect(datasetRepo.revogar).toHaveBeenCalledTimes(1);
      expect(auditRepo.record).toHaveBeenCalledTimes(1);
    });
  });
});
