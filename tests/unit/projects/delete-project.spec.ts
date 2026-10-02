import { describe, it, expect, vi } from 'vitest';
import {
  DeleteProjectUseCase,
  ProjetoPossuiDemandasVinculadasError,
  ProjetoNotFoundError,
} from '@/core/use-cases/projects/delete-project';
import { IProjectRepository } from '@/core/domain/repositories/project-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { Projeto } from '@/core/domain/entities/projeto';

describe('Unit Tests: DeleteProjectUseCase (Subgate 1 — Core da Exclusão Segura)', () => {
  const projetoExemplo: Projeto = {
    id: 'proj_test_123',
    nome: 'Projeto Sem Demandas',
    descricao: 'Descrição para teste de exclusão',
    status: 'ATIVO',
    data_inicio: '2026-01-01',
    data_conclusao_prevista: '2026-06-30',
    data_conclusao_real: null,
    criado_em: '2026-01-01T00:00:00.000Z',
    atualizado_em: '2026-01-01T00:00:00.000Z',
  };

  const createMockProjectRepo = (overrides?: Partial<IProjectRepository>): IProjectRepository => ({
    create: vi.fn(),
    findById: vi.fn().mockResolvedValue({ ...projetoExemplo }),
    findAll: vi.fn().mockResolvedValue([]),
    update: vi.fn(),
    countActive: vi.fn().mockResolvedValue(1),
    countTotal: vi.fn().mockResolvedValue(1),
    countDemands: vi.fn().mockResolvedValue(0),
    delete: vi.fn().mockResolvedValue(true),
    ...overrides,
  });

  const createMockAuditRepo = (overrides?: Partial<IAuditRepository>): IAuditRepository => ({
    record: vi.fn().mockResolvedValue({} as any),
    findByDemandaId: vi.fn().mockResolvedValue([]),
    findByEntidade: vi.fn().mockResolvedValue([]),
    ...overrides,
  });

  it('1. deve excluir projeto com 0 demandas e registrar na trilha de auditoria', async () => {
    const projectRepo = createMockProjectRepo({
      countDemands: vi.fn().mockResolvedValue(0),
      delete: vi.fn().mockResolvedValue(true),
    });
    const auditRepo = createMockAuditRepo();
    const useCase = new DeleteProjectUseCase(projectRepo, auditRepo);

    const result = await useCase.execute({
      projectId: 'proj_test_123',
      motivo: 'Projeto criado por engano',
      autorTipo: 'HUMANO',
    });

    expect(result.success).toBe(true);
    expect(result.projectId).toBe('proj_test_123');
    expect(result.projetoNome).toBe('Projeto Sem Demandas');

    // Verifica que countDemands foi chamado com o id correto
    expect(projectRepo.countDemands).toHaveBeenCalledWith('proj_test_123');

    // Verifica que a auditoria registrou a exclusão com os dados anteriores
    expect(auditRepo.record).toHaveBeenCalledTimes(1);
    expect(auditRepo.record).toHaveBeenCalledWith(
      expect.objectContaining({
        demanda_id: null,
        entidade: 'PROJETO',
        entidade_id: 'proj_test_123',
        tipo_evento: 'EXCLUSAO',
        autor_tipo: 'HUMANO',
        justificativa: 'Projeto criado por engano',
        dados_anteriores: JSON.stringify(projetoExemplo),
        dados_novos: null,
      })
    );

    // Verifica que delete foi invocado
    expect(projectRepo.delete).toHaveBeenCalledWith('proj_test_123');
  });

  it('2. deve impedir terminantemente a exclusão de projeto com 1 demanda vinculada', async () => {
    const projectRepo = createMockProjectRepo({
      countDemands: vi.fn().mockResolvedValue(1),
    });
    const auditRepo = createMockAuditRepo();
    const useCase = new DeleteProjectUseCase(projectRepo, auditRepo);

    await expect(
      useCase.execute({ projectId: 'proj_test_123' })
    ).rejects.toThrow(ProjetoPossuiDemandasVinculadasError);

    // Salvaguarda: nem auditoria nem delete podem ser chamados
    expect(auditRepo.record).not.toHaveBeenCalled();
    expect(projectRepo.delete).not.toHaveBeenCalled();
  });

  it('3. deve impedir exclusão de projeto com múltiplas demandas vinculadas com mensagem explicativa', async () => {
    const projectRepo = createMockProjectRepo({
      countDemands: vi.fn().mockResolvedValue(5),
    });
    const auditRepo = createMockAuditRepo();
    const useCase = new DeleteProjectUseCase(projectRepo, auditRepo);

    await expect(
      useCase.execute({ projectId: 'proj_test_123' })
    ).rejects.toThrow(
      'Não é possível excluir o projeto porque existem 5 demanda(s) vinculada(s). Trate as demandas vinculadas antes de prosseguir.'
    );

    expect(auditRepo.record).not.toHaveBeenCalled();
    expect(projectRepo.delete).not.toHaveBeenCalled();
  });

  it('4. deve lançar ProjetoNotFoundError se o projeto não for encontrado', async () => {
    const projectRepo = createMockProjectRepo({
      findById: vi.fn().mockResolvedValue(null),
    });
    const auditRepo = createMockAuditRepo();
    const useCase = new DeleteProjectUseCase(projectRepo, auditRepo);

    await expect(
      useCase.execute({ projectId: 'proj_inexistente' })
    ).rejects.toThrow(ProjetoNotFoundError);

    expect(projectRepo.countDemands).not.toHaveBeenCalled();
    expect(auditRepo.record).not.toHaveBeenCalled();
    expect(projectRepo.delete).not.toHaveBeenCalled();
  });

  it('5. deve lançar erro se o repositório falhar na exclusão física', async () => {
    const projectRepo = createMockProjectRepo({
      countDemands: vi.fn().mockResolvedValue(0),
      delete: vi.fn().mockResolvedValue(false),
    });
    const auditRepo = createMockAuditRepo();
    const useCase = new DeleteProjectUseCase(projectRepo, auditRepo);

    await expect(
      useCase.execute({ projectId: 'proj_test_123' })
    ).rejects.toThrow("Falha operacional ao excluir o projeto 'proj_test_123'.");
  });

  it('6. deve executar a exclusão com sucesso mesmo se auditRepo for omitido', async () => {
    const projectRepo = createMockProjectRepo({
      countDemands: vi.fn().mockResolvedValue(0),
      delete: vi.fn().mockResolvedValue(true),
    });
    const useCase = new DeleteProjectUseCase(projectRepo);

    const result = await useCase.execute({ projectId: 'proj_test_123' });

    expect(result.success).toBe(true);
    expect(projectRepo.delete).toHaveBeenCalledWith('proj_test_123');
  });
});
