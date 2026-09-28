import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdicionarEtapaTransformacaoUseCase } from '@/core/use-cases/preparation/adicionar-etapa-transformacao.use-case';
import { AtualizarEtapaTransformacaoUseCase } from '@/core/use-cases/preparation/atualizar-etapa-transformacao.use-case';
import { ReordenarEtapasTransformacaoUseCase } from '@/core/use-cases/preparation/reordenar-etapas-transformacao.use-case';
import { ExcluirEtapaTransformacaoUseCase } from '@/core/use-cases/preparation/excluir-etapa-transformacao.use-case';
import { CancelarEtapaTransformacaoUseCase } from '@/core/use-cases/preparation/cancelar-etapa-transformacao.use-case';
import { IEtapaTransformacaoRepository } from '@/core/domain/repositories/etapa-transformacao-repository.interface';
import { IReceitaPreparacaoRepository } from '@/core/domain/repositories/receita-preparacao-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { EtapaTransformacao } from '@/core/domain/entities/etapa-transformacao';
import { StatusEtapaTransformacao } from '@/core/domain/enums/status-etapa-transformacao';
import { StatusReceitaPreparacao } from '@/core/domain/enums/status-receita-preparacao';
import { TipoOperacaoPreparacao } from '@/core/domain/enums/tipo-operacao-preparacao';
import { CapacidadeFerramenta } from '@/core/domain/enums/capacidade-ferramenta';

describe('Unit: Casos de Uso de Etapas de Transformação (Subunidade 3.5B)', () => {
  let etapaRepo: IEtapaTransformacaoRepository;
  let receitaRepo: IReceitaPreparacaoRepository;
  let auditRepo: IAuditRepository;

  const receitaValida = {
    id: 'rec_01',
    demanda_id: 'dem_01',
    titulo: 'Receita Ativa',
    descricao: null,
    status: StatusReceitaPreparacao.RASCUNHO,
    versao: 1,
    criado_em: '2026-09-28T00:00:00Z',
    atualizado_em: '2026-09-28T00:00:00Z',
  };

  const etapaPlanejada: EtapaTransformacao = {
    id: 'etp_01',
    receita_id: 'rec_01',
    ordem: 1,
    tipo_operacao: TipoOperacaoPreparacao.TRATAR_NULOS,
    capacidade_ferramenta: CapacidadeFerramenta.MOTOR_SQL,
    ferramenta_nome: 'DuckDB',
    ferramenta_versao: '1.0',
    descricao: 'Filtrar registros com valor_unitario nulo',
    especificacao_tecnica: 'SELECT * FROM t WHERE valor IS NOT NULL',
    status: StatusEtapaTransformacao.PLANEJADA,
    justificativa: null,
    criado_em: '2026-09-28T00:00:00Z',
    atualizado_em: '2026-09-28T00:00:00Z',
  };

  beforeEach(() => {
    etapaRepo = {
      findById: vi.fn((id) => Promise.resolve(id === 'etp_01' ? etapaPlanejada : null)),
      findByReceitaId: vi.fn(() => Promise.resolve([etapaPlanejada])),
      create: vi.fn((e) => Promise.resolve(e)),
      update: vi.fn((id, dados) => Promise.resolve({ ...etapaPlanejada, ...dados })),
      reordenar: vi.fn(() => Promise.resolve()),
      deleteDraftOnly: vi.fn(() => Promise.resolve(true)),
      cancelar: vi.fn((id, just) =>
        Promise.resolve({
          ...etapaPlanejada,
          status: StatusEtapaTransformacao.CANCELADA,
          justificativa: just,
        })
      ),
      vincularProblema: vi.fn(),
      desvincularProblema: vi.fn(),
      listarProblemasPorEtapa: vi.fn(),
      listarEtapasPorProblema: vi.fn(),
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

  describe('AdicionarEtapaTransformacaoUseCase', () => {
    it('deve adicionar etapa com status PLANEJADA e calcular ordem monotônica', async () => {
      const useCase = new AdicionarEtapaTransformacaoUseCase(etapaRepo, receitaRepo, auditRepo);
      const resultado = await useCase.execute({
        receita_id: 'rec_01',
        tipo_operacao: TipoOperacaoPreparacao.REMOVER_DUPLICIDADES,
        capacidade_ferramenta: CapacidadeFerramenta.MOTOR_M_POWER_QUERY,
        ferramenta_nome: 'Power Query M',
        descricao: 'Remover duplicidades de clientes',
      });

      expect(resultado.id).toBeDefined();
      expect(resultado.status).toBe(StatusEtapaTransformacao.PLANEJADA);
      // Como já havia 1 etapa, a nova recebe ordem 2
      expect(resultado.ordem).toBe(2);
      expect(etapaRepo.create).toHaveBeenCalledOnce();
      expect(auditRepo.record).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo_evento: 'CRIACAO',
          entidade: 'EtapaTransformacao',
        })
      );
    });

    it('deve bloquear adição em receitas com status CONCLUIDA ou OBSOLETA', async () => {
      vi.mocked(receitaRepo.findById).mockResolvedValue({
        ...receitaValida,
        status: StatusReceitaPreparacao.CONCLUIDA,
      });

      const useCase = new AdicionarEtapaTransformacaoUseCase(etapaRepo, receitaRepo, auditRepo);
      await expect(
        useCase.execute({
          receita_id: 'rec_01',
          tipo_operacao: TipoOperacaoPreparacao.CONVERTER_TIPO,
          capacidade_ferramenta: CapacidadeFerramenta.MOTOR_SQL,
          ferramenta_nome: 'DuckDB',
          descricao: 'Conversão de colunas de data',
        })
      ).rejects.toThrow(/Não é permitido adicionar etapas/);
    });
  });

  describe('AtualizarEtapaTransformacaoUseCase', () => {
    it('deve atualizar parâmetros técnicos de etapa PLANEJADA', async () => {
      const useCase = new AtualizarEtapaTransformacaoUseCase(etapaRepo, receitaRepo, auditRepo);
      const atualizada = await useCase.execute({
        id: 'etp_01',
        descricao: 'Descrição atualizada com sucesso',
        especificacao_tecnica: 'SELECT * FROM t WHERE x IS NOT NULL',
      });

      expect(etapaRepo.update).toHaveBeenCalledWith(
        'etp_01',
        expect.objectContaining({
          descricao: 'Descrição atualizada com sucesso',
        })
      );
      expect(auditRepo.record).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo_evento: 'DECISAO_HUMANA',
          entidade: 'EtapaTransformacao',
        })
      );
    });

    it('deve bloquear alteração técnica de etapa VALIDADA ou CANCELADA', async () => {
      vi.mocked(etapaRepo.findById).mockResolvedValue({
        ...etapaPlanejada,
        status: StatusEtapaTransformacao.VALIDADA,
      });

      const useCase = new AtualizarEtapaTransformacaoUseCase(etapaRepo, receitaRepo, auditRepo);
      await expect(
        useCase.execute({
          id: 'etp_01',
          descricao: 'Tentativa de alteração em etapa validada',
        })
      ).rejects.toThrow(/status VALIDADA não admitem alteração/);
    });
  });

  describe('ReordenarEtapasTransformacaoUseCase', () => {
    it('deve reordenar etapas com integridade sequencial', async () => {
      const useCase = new ReordenarEtapasTransformacaoUseCase(etapaRepo, receitaRepo, auditRepo);
      await useCase.execute({
        receita_id: 'rec_01',
        ordens: [{ id: 'etp_01', ordem: 1 }],
      });

      expect(etapaRepo.reordenar).toHaveBeenCalledWith('rec_01', [{ id: 'etp_01', ordem: 1 }]);
      expect(auditRepo.record).toHaveBeenCalledOnce();
    });

    it('deve rejeitar reordenação com etapas que não pertencem à receita', async () => {
      const useCase = new ReordenarEtapasTransformacaoUseCase(etapaRepo, receitaRepo, auditRepo);
      await expect(
        useCase.execute({
          receita_id: 'rec_01',
          ordens: [{ id: 'etp_alienigena', ordem: 1 }],
        })
      ).rejects.toThrow(/não pertence à receita/);
    });

    it('deve rejeitar reordenação com posições ordinais duplicadas', async () => {
      vi.mocked(etapaRepo.findByReceitaId).mockResolvedValue([
        etapaPlanejada,
        { ...etapaPlanejada, id: 'etp_02', ordem: 2 },
      ]);

      const useCase = new ReordenarEtapasTransformacaoUseCase(etapaRepo, receitaRepo, auditRepo);
      await expect(
        useCase.execute({
          receita_id: 'rec_01',
          ordens: [
            { id: 'etp_01', ordem: 1 },
            { id: 'etp_02', ordem: 1 }, // duplicata
          ],
        })
      ).rejects.toThrow(/posições ordinais duplicadas/);
    });
  });

  describe('ExcluirEtapaTransformacaoUseCase & CancelarEtapaTransformacaoUseCase', () => {
    it('deve permitir exclusão física apenas para etapa PLANEJADA', async () => {
      const useCase = new ExcluirEtapaTransformacaoUseCase(etapaRepo, receitaRepo, auditRepo);
      const resultado = await useCase.execute('etp_01');

      expect(resultado).toBe(true);
      expect(etapaRepo.deleteDraftOnly).toHaveBeenCalledWith('etp_01');
    });

    it('deve bloquear exclusão física de etapa EXECUTADA', async () => {
      vi.mocked(etapaRepo.findById).mockResolvedValue({
        ...etapaPlanejada,
        status: StatusEtapaTransformacao.EXECUTADA,
      });

      const useCase = new ExcluirEtapaTransformacaoUseCase(etapaRepo, receitaRepo, auditRepo);
      await expect(useCase.execute('etp_01')).rejects.toThrow(
        /Apenas etapas no status PLANEJADA podem ser excluídas fisicamente/
      );
    });

    it('deve cancelar auditadamente etapa executada com justificativa >= 15 caracteres', async () => {
      vi.mocked(etapaRepo.findById).mockResolvedValue({
        ...etapaPlanejada,
        status: StatusEtapaTransformacao.EXECUTADA,
      });

      const useCase = new CancelarEtapaTransformacaoUseCase(etapaRepo, receitaRepo, auditRepo);
      const cancelada = await useCase.execute({
        id: 'etp_01',
        justificativa: 'Cancelamento formal da etapa por mudança na regra de negócio.',
      });

      expect(cancelada.status).toBe(StatusEtapaTransformacao.CANCELADA);
      expect(etapaRepo.cancelar).toHaveBeenCalledWith(
        'etp_01',
        'Cancelamento formal da etapa por mudança na regra de negócio.'
      );
      expect(auditRepo.record).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo_evento: 'DECISAO_HUMANA',
          entidade: 'EtapaTransformacao',
        })
      );
    });

    it('deve rejeitar cancelamento se a justificativa for menor que 15 caracteres', async () => {
      const useCase = new CancelarEtapaTransformacaoUseCase(etapaRepo, receitaRepo, auditRepo);
      await expect(
        useCase.execute({
          id: 'etp_01',
          justificativa: 'Curta',
        })
      ).rejects.toThrow(/mínimo 15 caracteres/);
    });
  });
});
