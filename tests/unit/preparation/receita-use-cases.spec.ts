import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CriarReceitaPreparacaoUseCase } from '@/core/use-cases/preparation/criar-receita-preparacao.use-case';
import { ObterReceitaPreparacaoUseCase } from '@/core/use-cases/preparation/obter-receita-preparacao.use-case';
import { ListarReceitasDemandaUseCase } from '@/core/use-cases/preparation/listar-receitas-demanda.use-case';
import { AtualizarReceitaPreparacaoUseCase } from '@/core/use-cases/preparation/atualizar-receita-preparacao.use-case';
import { IReceitaPreparacaoRepository } from '@/core/domain/repositories/receita-preparacao-repository.interface';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { IEtapaTransformacaoRepository } from '@/core/domain/repositories/etapa-transformacao-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { ReceitaPreparacao } from '@/core/domain/entities/receita-preparacao';
import { StatusReceitaPreparacao } from '@/core/domain/enums/status-receita-preparacao';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';

describe('Unit: Casos de Uso de Receita de Preparação (Subunidade 3.5B)', () => {
  let receitaRepo: IReceitaPreparacaoRepository;
  let demandRepo: IDemandRepository;
  let etapaRepo: IEtapaTransformacaoRepository;
  let auditRepo: IAuditRepository;

  const demandaValida = {
    id: 'dem_01',
    projeto_id: 'proj_01',
    projetoNome: 'Projeto Teste',
    titulo: 'Demanda Teste',
    solicitacao_bruta: 'Solicitacao',
    contexto: 'Contexto',
    objetivo_inicial: 'Objetivo',
    prazo_esperado: null,
    restricoes_declaradas: null,
    estado: EstadoDemanda.DADOS_RECEBIDOS,
    data_conclusao: null,
    criado_em: '2026-09-28T00:00:00Z',
    atualizado_em: '2026-09-28T00:00:00Z',
  };

  beforeEach(() => {
    receitaRepo = {
      findById: vi.fn(),
      findByDemandId: vi.fn(),
      findActiveByDemandId: vi.fn(),
      create: vi.fn((r) => Promise.resolve(r)),
      update: vi.fn((id, dados) => Promise.resolve({ id, ...dados } as ReceitaPreparacao)),
      deleteDraftOnly: vi.fn(),
    };

    demandRepo = {
      create: vi.fn(),
      findById: vi.fn((id) => Promise.resolve(id === 'dem_01' ? demandaValida : null)),
      findByProjectId: vi.fn(),
      findAll: vi.fn(),
      findRecent: vi.fn(),
      update: vi.fn(),
      countActive: vi.fn(),
      countTotal: vi.fn(),
    };

    etapaRepo = {
      findById: vi.fn(),
      findByReceitaId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      reordenar: vi.fn(),
      deleteDraftOnly: vi.fn(),
      cancelar: vi.fn(),
      vincularProblema: vi.fn(),
      desvincularProblema: vi.fn(),
      listarProblemasPorEtapa: vi.fn(),
      listarEtapasPorProblema: vi.fn(),
    };

    auditRepo = {
      record: vi.fn(),
      findByDemandaId: vi.fn(),
    };
  });

  describe('CriarReceitaPreparacaoUseCase', () => {
    it('deve criar receita com status RASCUNHO, versão 1 e registrar auditoria', async () => {
      vi.mocked(receitaRepo.findActiveByDemandId).mockResolvedValue(null);

      const useCase = new CriarReceitaPreparacaoUseCase(receitaRepo, demandRepo, auditRepo);
      const resultado = await useCase.execute({
        demanda_id: 'dem_01',
        titulo: 'Pipeline de Limpeza de Vendas',
        descricao: 'Trata nulos e formata datas',
      });

      expect(resultado.id).toBeDefined();
      expect(resultado.demanda_id).toBe('dem_01');
      expect(resultado.status).toBe(StatusReceitaPreparacao.RASCUNHO);
      expect(resultado.versao).toBe(1);
      expect(resultado.titulo).toBe('Pipeline de Limpeza de Vendas');
      expect(receitaRepo.create).toHaveBeenCalledOnce();
      expect(auditRepo.record).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo_evento: 'CRIACAO',
          entidade: 'ReceitaPreparacao',
        })
      );
    });

    it('deve bloquear criação se a demanda não for encontrada', async () => {
      const useCase = new CriarReceitaPreparacaoUseCase(receitaRepo, demandRepo, auditRepo);
      await expect(
        useCase.execute({
          demanda_id: 'dem_inexistente',
          titulo: 'Pipeline Inválido',
        })
      ).rejects.toThrow(/não encontrada/);
    });

    it('deve bloquear criação em demandas suspensas ou terminais', async () => {
      vi.mocked(demandRepo.findById).mockResolvedValue({
        ...demandaValida,
        estado: EstadoDemanda.SUSPENSA,
      });

      const useCase = new CriarReceitaPreparacaoUseCase(receitaRepo, demandRepo, auditRepo);
      await expect(
        useCase.execute({
          demanda_id: 'dem_01',
          titulo: 'Pipeline Suspenso',
        })
      ).rejects.toThrow(/demandas suspensas/);

      vi.mocked(demandRepo.findById).mockResolvedValue({
        ...demandaValida,
        estado: EstadoDemanda.CONCLUIDA,
      });
      await expect(
        useCase.execute({
          demanda_id: 'dem_01',
          titulo: 'Pipeline Concluído',
        })
      ).rejects.toThrow(/estado terminal/);
    });

    it('deve impedir criação de duas receitas ativas na mesma demanda', async () => {
      vi.mocked(receitaRepo.findActiveByDemandId).mockResolvedValue({
        id: 'rec_existente',
        demanda_id: 'dem_01',
        titulo: 'Receita Atual',
        descricao: null,
        status: StatusReceitaPreparacao.RASCUNHO,
        versao: 1,
        criado_em: '2026-09-28T00:00:00Z',
        atualizado_em: '2026-09-28T00:00:00Z',
      });

      const useCase = new CriarReceitaPreparacaoUseCase(receitaRepo, demandRepo, auditRepo);
      await expect(
        useCase.execute({
          demanda_id: 'dem_01',
          titulo: 'Nova Receita Concorrente',
        })
      ).rejects.toThrow(/Já existe uma receita de preparação ativa/);
    });
  });

  describe('AtualizarReceitaPreparacaoUseCase', () => {
    it('deve atualizar metadados em receita RASCUNHO', async () => {
      vi.mocked(receitaRepo.findById).mockResolvedValue({
        id: 'rec_01',
        demanda_id: 'dem_01',
        titulo: 'Titulo Antigo',
        descricao: 'Desc Antiga',
        status: StatusReceitaPreparacao.RASCUNHO,
        versao: 1,
        criado_em: '2026-09-28T00:00:00Z',
        atualizado_em: '2026-09-28T00:00:00Z',
      });

      const useCase = new AtualizarReceitaPreparacaoUseCase(receitaRepo, auditRepo);
      const atualizada = await useCase.execute({
        id: 'rec_01',
        titulo: 'Titulo Novo',
      });

      expect(receitaRepo.update).toHaveBeenCalledWith('rec_01', {
        titulo: 'Titulo Novo',
        descricao: 'Desc Antiga',
      });
      expect(auditRepo.record).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo_evento: 'DECISAO_HUMANA',
          entidade: 'ReceitaPreparacao',
        })
      );
    });

    it('deve bloquear atualização de metadados em receitas CONCLUIDAS ou OBSOLETAS', async () => {
      vi.mocked(receitaRepo.findById).mockResolvedValue({
        id: 'rec_concluida',
        demanda_id: 'dem_01',
        titulo: 'Receita Fechada',
        descricao: null,
        status: StatusReceitaPreparacao.CONCLUIDA,
        versao: 1,
        criado_em: '2026-09-28T00:00:00Z',
        atualizado_em: '2026-09-28T00:00:00Z',
      });

      const useCase = new AtualizarReceitaPreparacaoUseCase(receitaRepo, auditRepo);
      await expect(
        useCase.execute({
          id: 'rec_concluida',
          titulo: 'Tentativa de Alteração',
        })
      ).rejects.toThrow(/não admitem alteração de metadados/);
    });
  });

  describe('ObterReceitaPreparacaoUseCase & ListarReceitasDemandaUseCase', () => {
    it('deve retornar receita com etapas ordenadas', async () => {
      vi.mocked(receitaRepo.findById).mockResolvedValue({
        id: 'rec_01',
        demanda_id: 'dem_01',
        titulo: 'Receita Completa',
        descricao: null,
        status: StatusReceitaPreparacao.RASCUNHO,
        versao: 1,
        criado_em: '2026-09-28T00:00:00Z',
        atualizado_em: '2026-09-28T00:00:00Z',
      });

      vi.mocked(etapaRepo.findByReceitaId).mockResolvedValue([
        { id: 'etp_1', ordem: 1 } as any,
        { id: 'etp_2', ordem: 2 } as any,
      ]);

      const useCase = new ObterReceitaPreparacaoUseCase(receitaRepo, etapaRepo);
      const resultado = await useCase.execute('rec_01');

      expect(resultado).not.toBeNull();
      expect(resultado?.receita.id).toBe('rec_01');
      expect(resultado?.etapas).toHaveLength(2);
    });

    it('deve listar receitas da demanda', async () => {
      vi.mocked(receitaRepo.findByDemandId).mockResolvedValue([
        { id: 'rec_01' } as any,
        { id: 'rec_02' } as any,
      ]);

      const useCase = new ListarReceitasDemandaUseCase(receitaRepo);
      const lista = await useCase.execute('dem_01');

      expect(lista).toHaveLength(2);
      expect(receitaRepo.findByDemandId).toHaveBeenCalledWith('dem_01');
    });
  });
});
