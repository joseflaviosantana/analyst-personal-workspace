import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AssociarProblemaEtapaUseCase } from '@/core/use-cases/preparation/associar-problema-etapa.use-case';
import { DesassociarProblemaEtapaUseCase } from '@/core/use-cases/preparation/desassociar-problema-etapa.use-case';
import { ListarProblemasEtapaUseCase } from '@/core/use-cases/preparation/listar-problemas-etapa.use-case';
import { IEtapaTransformacaoRepository } from '@/core/domain/repositories/etapa-transformacao-repository.interface';
import { IProblemasQualidadeRepository } from '@/core/domain/repositories/problemas-qualidade-repository.interface';
import { IReceitaPreparacaoRepository } from '@/core/domain/repositories/receita-preparacao-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { ProblemaQualidade } from '@/core/domain/entities/problema-qualidade';
import { EtapaTransformacao } from '@/core/domain/entities/etapa-transformacao';
import { ReceitaPreparacao } from '@/core/domain/entities/receita-preparacao';
import { StatusEtapaTransformacao } from '@/core/domain/enums/status-etapa-transformacao';
import { StatusReceitaPreparacao } from '@/core/domain/enums/status-receita-preparacao';
import { SeveridadeProblema } from '@/core/domain/enums/severidade-problema';
import { AcaoProblemaQualidade } from '@/core/domain/enums/acao-problema-qualidade';
import { StatusProblemaQualidade } from '@/core/domain/enums/status-problema-qualidade';
import { CategoriaProblemaQualidade } from '@/core/domain/enums/categoria-problema-qualidade';
import { TipoOperacaoPreparacao } from '@/core/domain/enums/tipo-operacao-preparacao';
import { CapacidadeFerramenta } from '@/core/domain/enums/capacidade-ferramenta';

describe('Unit: Associação Problema de Qualidade → Etapa de Transformação (Subunidade 3.5B)', () => {
  let etapaRepo: IEtapaTransformacaoRepository;
  let problemaRepo: IProblemasQualidadeRepository;
  let receitaRepo: IReceitaPreparacaoRepository;
  let auditRepo: IAuditRepository;

  const receitaValida: ReceitaPreparacao = {
    id: 'rec_01',
    demanda_id: 'dem_01',
    titulo: 'Receita Demanda 01',
    descricao: null,
    status: StatusReceitaPreparacao.RASCUNHO,
    versao: 1,
    criado_em: '2026-09-28T00:00:00Z',
    atualizado_em: '2026-09-28T00:00:00Z',
  };

  const etapaValida: EtapaTransformacao = {
    id: 'etp_01',
    receita_id: 'rec_01',
    ordem: 1,
    tipo_operacao: TipoOperacaoPreparacao.TRATAR_NULOS,
    capacidade_ferramenta: CapacidadeFerramenta.MOTOR_SQL,
    ferramenta_nome: 'DuckDB',
    ferramenta_versao: null,
    descricao: 'Tratar valores nulos na coluna preco',
    especificacao_tecnica: null,
    status: StatusEtapaTransformacao.PLANEJADA,
    justificativa: null,
    criado_em: '2026-09-28T00:00:00Z',
    atualizado_em: '2026-09-28T00:00:00Z',
  };

  const problemaDeliberadoPipeline: ProblemaQualidade = {
    id: 'prob_01',
    diagnostico_id: 'diag_01',
    ativo_dados_id: 'ast_01',
    demanda_id: 'dem_01',
    categoria: CategoriaProblemaQualidade.NULOS_BRANCOS,
    titulo: 'Preço unitário nulo',
    descricao: '10 registros sem preço',
    tabela_afetada: 'vendas',
    coluna_afetada: 'preco',
    total_linhas_afetadas: 10,
    percentual_linhas_afetadas: 2.0,
    amostra_evidencias: [],
    severidade: SeveridadeProblema.ALTA,
    impacto_calculo: null,
    acao_deliberada: AcaoProblemaQualidade.TRATAR_NO_PIPELINE,
    justificativa_deliberacao: 'Tratamento via imputação pela mediana na etapa de preparação.',
    deliberado_por_humano: true,
    deliberado_em: '2026-09-28T00:00:00Z',
    status: StatusProblemaQualidade.ABERTO,
    origem_deteccao: 'AUTOMATICA',
    criado_em: '2026-09-28T00:00:00Z',
    atualizado_em: '2026-09-28T00:00:00Z',
  };

  beforeEach(() => {
    etapaRepo = {
      findById: vi.fn((id) => Promise.resolve(id === 'etp_01' ? etapaValida : null)),
      findByReceitaId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      reordenar: vi.fn(),
      deleteDraftOnly: vi.fn(),
      cancelar: vi.fn(),
      vincularProblema: vi.fn(() => Promise.resolve()),
      desvincularProblema: vi.fn(() => Promise.resolve()),
      listarProblemasPorEtapa: vi.fn(() => Promise.resolve(['prob_01'])),
      listarEtapasPorProblema: vi.fn(() => Promise.resolve(['etp_01'])),
    };

    problemaRepo = {
      create: vi.fn(),
      createMany: vi.fn(),
      findById: vi.fn((id) => Promise.resolve(id === 'prob_01' ? problemaDeliberadoPipeline : null)),
      findByDiagnosticId: vi.fn(),
      findByAssetId: vi.fn(),
      findByDemandId: vi.fn(),
      update: vi.fn(),
    };

    receitaRepo = {
      findById: vi.fn((id) => Promise.resolve(id === 'rec_01' ? receitaValida : null)),
      findByDemandId: vi.fn(),
      findActiveByDemandId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteDraftOnly: vi.fn(),
    };

    auditRepo = {
      record: vi.fn(),
      findByDemandaId: vi.fn(),
    };
  });

  describe('AssociarProblemaEtapaUseCase', () => {
    it('deve associar problema com ação TRATAR_NO_PIPELINE e deliberado por humano', async () => {
      const useCase = new AssociarProblemaEtapaUseCase(etapaRepo, problemaRepo, receitaRepo, auditRepo);
      await useCase.execute({
        etapa_id: 'etp_01',
        problema_id: 'prob_01',
      });

      expect(etapaRepo.vincularProblema).toHaveBeenCalledWith('etp_01', 'prob_01');
      expect(auditRepo.record).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo_evento: 'DECISAO_HUMANA',
          entidade: 'EtapaProblemaQualidade',
        })
      );
      // Garantia inviolável da Decisão 3: o status do problema NÃO é alterado para TRATADO
      expect(problemaRepo.update).not.toHaveBeenCalled();
    });

    it('deve rejeitar associação se o problema não foi deliberado por humano ou severidade PENDENTE', async () => {
      vi.mocked(problemaRepo.findById).mockResolvedValue({
        ...problemaDeliberadoPipeline,
        deliberado_por_humano: false,
        severidade: SeveridadeProblema.PENDENTE,
      });

      const useCase = new AssociarProblemaEtapaUseCase(etapaRepo, problemaRepo, receitaRepo, auditRepo);
      await expect(
        useCase.execute({
          etapa_id: 'etp_01',
          problema_id: 'prob_01',
        })
      ).rejects.toThrow(/Apenas problemas formalmente deliberados por humano/);
    });

    it('deve rejeitar qualquer ação diferente de TRATAR_NO_PIPELINE (Decisão 3 estrita)', async () => {
      const acoesInvalidas = [
        AcaoProblemaQualidade.MONITORAR,
        AcaoProblemaQualidade.ACEITAR_COMO_RESTRICAO,
        AcaoProblemaQualidade.CORRIGIR_NA_FONTE,
        AcaoProblemaQualidade.SOLICITAR_ESCLARECIMENTO,
      ];

      for (const acao of acoesInvalidas) {
        vi.mocked(problemaRepo.findById).mockResolvedValue({
          ...problemaDeliberadoPipeline,
          acao_deliberada: acao,
        });

        const useCase = new AssociarProblemaEtapaUseCase(etapaRepo, problemaRepo, receitaRepo, auditRepo);
        await expect(
          useCase.execute({
            etapa_id: 'etp_01',
            problema_id: 'prob_01',
          })
        ).rejects.toThrow(/Apenas problemas com a ação deliberada 'TRATAR_NO_PIPELINE'/);
      }
    });

    it('deve rejeitar associação entre problema e receita de demandas diferentes', async () => {
      vi.mocked(problemaRepo.findById).mockResolvedValue({
        ...problemaDeliberadoPipeline,
        demanda_id: 'dem_outra',
      });

      const useCase = new AssociarProblemaEtapaUseCase(etapaRepo, problemaRepo, receitaRepo, auditRepo);
      await expect(
        useCase.execute({
          etapa_id: 'etp_01',
          problema_id: 'prob_01',
        })
      ).rejects.toThrow(/devem pertencer à mesma demanda/);
    });

    it('deve rejeitar associação se a etapa estiver cancelada', async () => {
      vi.mocked(etapaRepo.findById).mockResolvedValue({
        ...etapaValida,
        status: StatusEtapaTransformacao.CANCELADA,
      });

      const useCase = new AssociarProblemaEtapaUseCase(etapaRepo, problemaRepo, receitaRepo, auditRepo);
      await expect(
        useCase.execute({
          etapa_id: 'etp_01',
          problema_id: 'prob_01',
        })
      ).rejects.toThrow(/etapas canceladas/);
    });
  });

  describe('DesassociarProblemaEtapaUseCase', () => {
    it('deve desassociar problema da etapa com sucesso', async () => {
      const useCase = new DesassociarProblemaEtapaUseCase(etapaRepo, receitaRepo, auditRepo);
      await useCase.execute({
        etapa_id: 'etp_01',
        problema_id: 'prob_01',
      });

      expect(etapaRepo.desvincularProblema).toHaveBeenCalledWith('etp_01', 'prob_01');
      expect(auditRepo.record).toHaveBeenCalledOnce();
    });

    it('deve bloquear desassociação se a etapa já estiver VALIDADA', async () => {
      vi.mocked(etapaRepo.findById).mockResolvedValue({
        ...etapaValida,
        status: StatusEtapaTransformacao.VALIDADA,
      });

      const useCase = new DesassociarProblemaEtapaUseCase(etapaRepo, receitaRepo, auditRepo);
      await expect(
        useCase.execute({
          etapa_id: 'etp_01',
          problema_id: 'prob_01',
        })
      ).rejects.toThrow(/status VALIDADA/);
    });
  });

  describe('ListarProblemasEtapaUseCase', () => {
    it('deve retornar lista completa de problemas associados', async () => {
      const useCase = new ListarProblemasEtapaUseCase(etapaRepo, problemaRepo);
      const resultado = await useCase.execute('etp_01');

      expect(resultado).toHaveLength(1);
      expect(resultado[0].id).toBe('prob_01');
      expect(resultado[0].titulo).toBe('Preço unitário nulo');
    });
  });
});
