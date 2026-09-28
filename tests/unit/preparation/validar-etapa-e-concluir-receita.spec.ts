import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ValidarEtapaPreparacaoUseCase } from '@/core/use-cases/preparation/validar-etapa-preparacao.use-case';
import { ConcluirReceitaPreparacaoUseCase } from '@/core/use-cases/preparation/concluir-receita-preparacao.use-case';
import { IEtapaTransformacaoRepository } from '@/core/domain/repositories/etapa-transformacao-repository.interface';
import { IReceitaPreparacaoRepository } from '@/core/domain/repositories/receita-preparacao-repository.interface';
import { ILinhagemAtivosRepository } from '@/core/domain/repositories/linhagem-ativos-repository.interface';
import { IAtivoDadosRepository } from '@/core/domain/repositories/ativo-dados-repository.interface';
import { IDiagnosticosQualidadeRepository } from '@/core/domain/repositories/diagnosticos-qualidade-repository.interface';
import { IProblemasQualidadeRepository } from '@/core/domain/repositories/problemas-qualidade-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { StatusEtapaTransformacao } from '@/core/domain/enums/status-etapa-transformacao';
import { StatusReceitaPreparacao } from '@/core/domain/enums/status-receita-preparacao';
import { StatusProblemaQualidade } from '@/core/domain/enums/status-problema-qualidade';
import { AcaoProblemaQualidade } from '@/core/domain/enums/acao-problema-qualidade';
import { StatusExecucaoDiagnostico } from '@/core/domain/enums/status-execucao-diagnostico';
import { StatusAtivoDados } from '@/core/domain/enums/status-ativo-dados';
import { FormatoArquivo } from '@/core/domain/enums/formato-arquivo';
import { CategoriaAtivoDados } from '@/core/domain/enums/categoria-ativo-dados';
import { TipoOperacaoPreparacao } from '@/core/domain/enums/tipo-operacao-preparacao';
import { CapacidadeFerramenta } from '@/core/domain/enums/capacidade-ferramenta';
import { PapelEntradaLinhagem } from '@/core/domain/enums/papel-entrada-linhagem';
import { CategoriaProblemaQualidade } from '@/core/domain/enums/categoria-problema-qualidade';
import { SeveridadeProblema } from '@/core/domain/enums/severidade-problema';

describe('ValidarEtapaPreparacaoUseCase e ConcluirReceitaPreparacaoUseCase (Subunidade 3.5C)', () => {
  let etapaRepo: IEtapaTransformacaoRepository;
  let receitaRepo: IReceitaPreparacaoRepository;
  let linhagemRepo: ILinhagemAtivosRepository;
  let ativoDadosRepo: IAtivoDadosRepository;
  let diagnosticosRepo: IDiagnosticosQualidadeRepository;
  let problemasRepo: IProblemasQualidadeRepository;
  let auditRepo: IAuditRepository;

  const etapaBase = {
    id: 'etp_01',
    receita_id: 'rec_01',
    ordem: 1,
    tipo_operacao: TipoOperacaoPreparacao.TRATAR_NULOS,
    capacidade_ferramenta: CapacidadeFerramenta.MOTOR_SQL,
    ferramenta_nome: 'DuckDB',
    ferramenta_versao: null,
    descricao: 'Preenche nulos',
    especificacao_tecnica: null,
    status: StatusEtapaTransformacao.EXECUTADA,
    justificativa: null,
    criado_em: '2026-09-28T00:00:00Z',
    atualizado_em: '2026-09-28T00:00:00Z',
  };

  const receitaBase = {
    id: 'rec_01',
    demanda_id: 'dem_01',
    titulo: 'Receita de Preparação',
    descricao: null,
    status: StatusReceitaPreparacao.EM_EXECUCAO,
    versao: 1,
    criado_em: '2026-09-28T00:00:00Z',
    atualizado_em: '2026-09-28T00:00:00Z',
  };

  const ativoDerivado = {
    id: 'ativo_deriv_01',
    demanda_id: 'dem_01',
    nome_arquivo: 'tratado.parquet',
    caminho_local: 'c:/dados/tratado.parquet',
    formato: FormatoArquivo.CSV,
    origem: null,
    descricao_conteudo: 'Tratado',
    granularidade: null,
    periodo_inicio: null,
    periodo_fim: null,
    versao: '1.0',
    substitui_ativo_id: null,
    tamanho_bytes: 1000,
    total_linhas: 100,
    total_colunas: 4,
    hash_sha256: 'sha256_hash',
    status: StatusAtivoDados.ATIVO,
    categoria_ativo: CategoriaAtivoDados.PREPARADO_DERIVADO,
    schema_inferido: null,
    data_recebimento: '2026-09-28T00:00:00Z',
    criado_em: '2026-09-28T00:00:00Z',
    atualizado_em: '2026-09-28T00:00:00Z',
  };

  const diagnosticoOk = {
    id: 'diag_01',
    ativo_dados_id: 'ativo_deriv_01',
    demanda_id: 'dem_01',
    iniciado_em: '2026-09-28T00:00:00Z',
    concluido_em: '2026-09-28T00:01:00Z',
    duracao_ms: 100,
    total_linhas_avaliadas: 100,
    total_colunas_avaliadas: 4,
    verificacoes_executadas: [],
    total_problemas_detectados: 0,
    status_execucao: StatusExecucaoDiagnostico.CONCLUIDO,
    erro_mensagem: null,
    resumo_metricas: null,
    criado_em: '2026-09-28T00:00:00Z',
    atualizado_em: '2026-09-28T00:01:00Z',
  };

  beforeEach(() => {
    etapaRepo = {
      findById: vi.fn((id) => Promise.resolve(id === 'etp_01' ? { ...etapaBase } : null)),
      findByReceitaId: vi.fn(() => Promise.resolve([{ ...etapaBase, status: StatusEtapaTransformacao.VALIDADA }])),
      create: vi.fn(),
      update: vi.fn((id, data) => Promise.resolve({ ...etapaBase, id, ...data })),
      reordenar: vi.fn(),
      deleteDraftOnly: vi.fn(),
      cancelar: vi.fn(),
      vincularProblema: vi.fn(),
      desvincularProblema: vi.fn(),
      listarProblemasPorEtapa: vi.fn(() => Promise.resolve([])),
      listarEtapasPorProblema: vi.fn(() => Promise.resolve([])),
    };

    receitaRepo = {
      findById: vi.fn((id) => Promise.resolve(id === 'rec_01' ? { ...receitaBase } : null)),
      findByDemandId: vi.fn(),
      findActiveByDemandId: vi.fn(),
      create: vi.fn(),
      update: vi.fn((id, data) => Promise.resolve({ ...receitaBase, id, ...data })),
      deleteDraftOnly: vi.fn(),
    };

    linhagemRepo = {
      registrarVinculo: vi.fn(),
      obterOrigens: vi.fn(),
      obterDestinos: vi.fn(),
      obterArestasPorDemanda: vi.fn(),
      obterArestasPorEtapa: vi.fn((id) =>
        Promise.resolve([
          {
            id: 'edge_01',
            demanda_id: 'dem_01',
            ativo_origem_id: 'ativo_orig',
            ativo_destino_id: 'ativo_deriv_01',
            papel_entrada: PapelEntradaLinhagem.ORIGEM_UNICA,
            etapa_transformacao_id: id,
            criado_em: '2026-09-28T00:00:00Z',
          },
        ])
      ),
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
      findLatestByAssetId: vi.fn(() => Promise.resolve({ ...diagnosticoOk })),
      findByAssetId: vi.fn(),
      findByDemandId: vi.fn(),
      update: vi.fn(),
      salvarConclusaoTransacional: vi.fn(),
    };

    problemasRepo = {
      create: vi.fn(),
      createMany: vi.fn(),
      findById: vi.fn(),
      findByDiagnosticId: vi.fn(),
      findByAssetId: vi.fn(),
      findByDemandId: vi.fn(() => Promise.resolve([])),
      update: vi.fn(),
    };

    auditRepo = {
      record: vi.fn(),
      findByDemandaId: vi.fn(),
    };
  });

  describe('ValidarEtapaPreparacaoUseCase', () => {
    it('deve rejeitar validação de etapa com status PLANEJADA', async () => {
      vi.mocked(etapaRepo.findById).mockResolvedValue({
        ...etapaBase,
        status: StatusEtapaTransformacao.PLANEJADA,
      });

      const useCase = new ValidarEtapaPreparacaoUseCase(
        etapaRepo,
        linhagemRepo,
        ativoDadosRepo,
        diagnosticosRepo,
        problemasRepo,
        auditRepo
      );

      await expect(useCase.execute({ etapaId: 'etp_01' })).rejects.toThrow(
        /está apenas planejada/
      );
    });

    it('deve rejeitar validação de etapa cancelada', async () => {
      vi.mocked(etapaRepo.findById).mockResolvedValue({
        ...etapaBase,
        status: StatusEtapaTransformacao.CANCELADA,
      });

      const useCase = new ValidarEtapaPreparacaoUseCase(
        etapaRepo,
        linhagemRepo,
        ativoDadosRepo,
        diagnosticosRepo,
        problemasRepo,
        auditRepo
      );

      await expect(useCase.execute({ etapaId: 'etp_01' })).rejects.toThrow(
        /Não é possível validar uma etapa que se encontra cancelada/
      );
    });

    it('deve rejeitar validação se houver problemas vinculados ainda não tratados', async () => {
      vi.mocked(etapaRepo.listarProblemasPorEtapa).mockResolvedValue(['prob_01']);
      vi.mocked(problemasRepo.findById).mockResolvedValue({
        id: 'prob_01',
        diagnostico_id: 'diag_orig',
        ativo_dados_id: 'ativo_orig',
        demanda_id: 'dem_01',
        categoria: CategoriaProblemaQualidade.NULOS_BRANCOS,
        titulo: 'Nulos',
        descricao: '50 nulos',
        tabela_afetada: 'tab',
        coluna_afetada: 'col',
        total_linhas_afetadas: 50,
        percentual_linhas_afetadas: 10,
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
      });

      const useCase = new ValidarEtapaPreparacaoUseCase(
        etapaRepo,
        linhagemRepo,
        ativoDadosRepo,
        diagnosticosRepo,
        problemasRepo,
        auditRepo
      );

      await expect(useCase.execute({ etapaId: 'etp_01' })).rejects.toThrow(
        /existem 1 problema\(s\) vinculado\(s\) que ainda não foram tratados/
      );
    });

    it('deve validar etapa com sucesso quando preenchidos todos os critérios', async () => {
      const useCase = new ValidarEtapaPreparacaoUseCase(
        etapaRepo,
        linhagemRepo,
        ativoDadosRepo,
        diagnosticosRepo,
        problemasRepo,
        auditRepo
      );

      const res = await useCase.execute({
        etapaId: 'etp_01',
        justificativa: 'Validação técnica comprovada',
      });

      expect(res.status).toBe(StatusEtapaTransformacao.VALIDADA);
      expect(etapaRepo.update).toHaveBeenCalledWith('etp_01', expect.objectContaining({
        status: StatusEtapaTransformacao.VALIDADA,
      }));
      expect(auditRepo.record).toHaveBeenCalledTimes(1);
    });
  });

  describe('ConcluirReceitaPreparacaoUseCase', () => {
    it('deve rejeitar conclusão de receita que ainda esteja em RASCUNHO', async () => {
      vi.mocked(receitaRepo.findById).mockResolvedValue({
        ...receitaBase,
        status: StatusReceitaPreparacao.RASCUNHO,
      });

      const useCase = new ConcluirReceitaPreparacaoUseCase(
        receitaRepo,
        etapaRepo,
        problemasRepo,
        auditRepo
      );

      await expect(useCase.execute({ receitaId: 'rec_01' })).rejects.toThrow(
        /Apenas receitas no status EM_EXECUCAO podem ser concluídas/
      );
    });

    it('deve rejeitar conclusão se a receita não tiver etapas', async () => {
      vi.mocked(etapaRepo.findByReceitaId).mockResolvedValue([]);

      const useCase = new ConcluirReceitaPreparacaoUseCase(
        receitaRepo,
        etapaRepo,
        problemasRepo,
        auditRepo
      );

      await expect(useCase.execute({ receitaId: 'rec_01' })).rejects.toThrow(
        /não possui etapas cadastradas/
      );
    });

    it('deve rejeitar conclusão se houver etapas ainda em PLANEJADA ou EXECUTADA', async () => {
      vi.mocked(etapaRepo.findByReceitaId).mockResolvedValue([
        { ...etapaBase, status: StatusEtapaTransformacao.VALIDADA },
        { ...etapaBase, id: 'etp_02', ordem: 2, status: StatusEtapaTransformacao.EXECUTADA },
      ]);

      const useCase = new ConcluirReceitaPreparacaoUseCase(
        receitaRepo,
        etapaRepo,
        problemasRepo,
        auditRepo
      );

      await expect(useCase.execute({ receitaId: 'rec_01' })).rejects.toThrow(
        /existem 1 etapa\(s\) ainda não validadas/
      );
    });

    it('deve rejeitar conclusão se houver problemas TRATAR_NO_PIPELINE não resolvidos', async () => {
      vi.mocked(etapaRepo.findByReceitaId).mockResolvedValue([
        { ...etapaBase, status: StatusEtapaTransformacao.VALIDADA },
      ]);

      vi.mocked(problemasRepo.findByDemandId).mockResolvedValue([
        {
          id: 'prob_aberto',
          diagnostico_id: 'diag_orig',
          ativo_dados_id: 'ativo_orig',
          demanda_id: 'dem_01',
          categoria: CategoriaProblemaQualidade.NULOS_BRANCOS,
          titulo: 'Nulos',
          descricao: 'Desc',
          tabela_afetada: 'tab',
          coluna_afetada: 'col',
          total_linhas_afetadas: 10,
          percentual_linhas_afetadas: 1,
          amostra_evidencias: [],
          severidade: SeveridadeProblema.ALTA,
          impacto_calculo: null,
          acao_deliberada: AcaoProblemaQualidade.TRATAR_NO_PIPELINE,
          justificativa_deliberacao: 'Tratar',
          deliberado_por_humano: true,
          deliberado_em: '2026-09-28T00:00:00Z',
          status: StatusProblemaQualidade.EM_INVESTIGACAO, // Pendente de resolução!
          origem_deteccao: 'AUTOMATICA',
          criado_em: '2026-09-28T00:00:00Z',
          atualizado_em: '2026-09-28T00:00:00Z',
        },
      ]);

      const useCase = new ConcluirReceitaPreparacaoUseCase(
        receitaRepo,
        etapaRepo,
        problemasRepo,
        auditRepo
      );

      await expect(useCase.execute({ receitaId: 'rec_01' })).rejects.toThrow(
        /existem 1 problema\(s\) com plano de tratamento no pipeline que ainda não foram empiricamente resolvidos/
      );
    });

    it('deve concluir receita com sucesso quando todas as etapas forem VALIDADA ou CANCELADA', async () => {
      vi.mocked(etapaRepo.findByReceitaId).mockResolvedValue([
        { ...etapaBase, id: 'etp_01', ordem: 1, status: StatusEtapaTransformacao.VALIDADA },
        { ...etapaBase, id: 'etp_02', ordem: 2, status: StatusEtapaTransformacao.CANCELADA },
      ]);

      vi.mocked(problemasRepo.findByDemandId).mockResolvedValue([]);

      const useCase = new ConcluirReceitaPreparacaoUseCase(
        receitaRepo,
        etapaRepo,
        problemasRepo,
        auditRepo
      );

      const res = await useCase.execute({
        receitaId: 'rec_01',
        justificativa: 'Pipeline de tratamento concluído e homologado',
      });

      expect(res.status).toBe(StatusReceitaPreparacao.CONCLUIDA);
      expect(receitaRepo.update).toHaveBeenCalledWith('rec_01', expect.objectContaining({
        status: StatusReceitaPreparacao.CONCLUIDA,
      }));
      expect(auditRepo.record).toHaveBeenCalledTimes(1);
    });
  });
});
