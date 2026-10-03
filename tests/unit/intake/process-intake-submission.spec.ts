import { describe, it, expect, vi } from 'vitest';
import { ProcessIntakeSubmissionUseCase } from '@/core/use-cases/intake/process-intake-submission.use-case';
import {
  IIntakePersistenceManager,
  PersistIntakeSubmissionData,
  PersistIntakeSubmissionResult,
} from '@/core/domain/repositories/intake-persistence-manager.interface';
import { ConfirmIntakeInput } from '@/lib/validations/intake-schema';

describe('Unit Tests: ProcessIntakeSubmissionUseCase', () => {
  const mockResult: PersistIntakeSubmissionResult = {
    projeto: {
      id: 'proj_unit_test',
      nome: 'Projeto Unit Test',
      isNovo: true,
    },
    demanda: {
      id: 'dem_unit_test',
      projeto_id: 'proj_unit_test',
      titulo: 'Demanda Unit Test',
      solicitacao_bruta: 'Solicitação original de teste unitário',
      estado: 'NOVA',
      criado_em: '2026-10-02T18:00:00.000Z',
    },
    perguntasCriadasCount: 1,
    requisitosCriadosCount: 2,
    auditId: 'aud_unit_test',
  };

  it('1. Valida e delega execução transacional com sucesso para NOVO projeto', async () => {
    const mockPersistence: IIntakePersistenceManager = {
      persistAtomicSubmission: vi.fn().mockResolvedValue(mockResult),
    };

    const useCase = new ProcessIntakeSubmissionUseCase(mockPersistence);

    const input: ConfirmIntakeInput = {
      solicitacaoOriginal: 'Solicitação original de teste unitário',
      projetoDecisao: 'NOVO',
      novoProjeto: {
        nome: 'Projeto Unit Test',
        descricao: 'Descrição do projeto',
      },
      demanda: {
        titulo: 'Demanda Unit Test',
        contexto: 'Contexto de teste',
      },
      perguntasPreliminares: [
        {
          pergunta: 'Pergunta preliminar de teste',
          bloqueante: false,
          aceita: true,
        },
      ],
    };

    const output = await useCase.execute(input);

    expect(output.success).toBe(true);
    expect(output.projeto.id).toBe('proj_unit_test');
    expect(output.demanda.id).toBe('dem_unit_test');
    expect(mockPersistence.persistAtomicSubmission).toHaveBeenCalledTimes(1);
    expect(mockPersistence.persistAtomicSubmission).toHaveBeenCalledWith(
      expect.objectContaining({
        solicitacaoOriginal: 'Solicitação original de teste unitário',
        projetoDecisao: 'NOVO',
      }),
      undefined
    );
  });

  it('2. Valida e delega com sucesso para projeto EXISTENTE', async () => {
    const mockPersistence: IIntakePersistenceManager = {
      persistAtomicSubmission: vi.fn().mockResolvedValue({
        ...mockResult,
        projeto: { id: 'proj_existente_123', nome: 'Projeto Existente', isNovo: false },
      }),
    };

    const useCase = new ProcessIntakeSubmissionUseCase(mockPersistence);

    const input: ConfirmIntakeInput = {
      solicitacaoOriginal: 'Solicitação vinculada a projeto existente.',
      projetoDecisao: 'EXISTENTE',
      projetoIdExistente: 'proj_existente_123',
      demanda: {
        titulo: 'Demanda com Projeto Existente',
      },
    };

    const output = await useCase.execute(input);

    expect(output.success).toBe(true);
    expect(output.projeto.isNovo).toBe(false);
    expect(output.projeto.id).toBe('proj_existente_123');
    expect(mockPersistence.persistAtomicSubmission).toHaveBeenCalledTimes(1);
  });

  it('3. Rejeita payload com nome de NOVO projeto curto ou ausente', async () => {
    const mockPersistence: IIntakePersistenceManager = {
      persistAtomicSubmission: vi.fn(),
    };

    const useCase = new ProcessIntakeSubmissionUseCase(mockPersistence);

    const invalidInput: any = {
      solicitacaoOriginal: 'Solicitação válida com mais de cinco caracteres.',
      projetoDecisao: 'NOVO',
      novoProjeto: {
        nome: 'ab', // curto (< 3)
      },
      demanda: {
        titulo: 'Demanda Válida',
      },
    };

    await expect(useCase.execute(invalidInput)).rejects.toThrow();
    expect(mockPersistence.persistAtomicSubmission).not.toHaveBeenCalled();
  });

  it('4. Rejeita payload com projeto EXISTENTE sem ID informado', async () => {
    const mockPersistence: IIntakePersistenceManager = {
      persistAtomicSubmission: vi.fn(),
    };

    const useCase = new ProcessIntakeSubmissionUseCase(mockPersistence);

    const invalidInput: any = {
      solicitacaoOriginal: 'Solicitação válida com mais de cinco caracteres.',
      projetoDecisao: 'EXISTENTE',
      projetoIdExistente: '   ', // vazio
      demanda: {
        titulo: 'Demanda Válida',
      },
    };

    await expect(useCase.execute(invalidInput)).rejects.toThrow();
    expect(mockPersistence.persistAtomicSubmission).not.toHaveBeenCalled();
  });

  it('5. Rejeita payload com título da demanda inválido', async () => {
    const mockPersistence: IIntakePersistenceManager = {
      persistAtomicSubmission: vi.fn(),
    };

    const useCase = new ProcessIntakeSubmissionUseCase(mockPersistence);

    const invalidInput: any = {
      solicitacaoOriginal: 'Solicitação válida com mais de cinco caracteres.',
      projetoDecisao: 'NOVO',
      novoProjeto: {
        nome: 'Projeto Válido',
      },
      demanda: {
        titulo: 'ab', // curto (< 3)
      },
    };

    await expect(useCase.execute(invalidInput)).rejects.toThrow();
    expect(mockPersistence.persistAtomicSubmission).not.toHaveBeenCalled();
  });

  it('6. Repassa hooks de teste para o persistenceManager', async () => {
    const mockPersistence: IIntakePersistenceManager = {
      persistAtomicSubmission: vi.fn().mockResolvedValue(mockResult),
    };

    const useCase = new ProcessIntakeSubmissionUseCase(mockPersistence);

    const input: ConfirmIntakeInput = {
      solicitacaoOriginal: 'Solicitação para teste de repasse de hooks.',
      projetoDecisao: 'NOVO',
      novoProjeto: {
        nome: 'Projeto Com Hooks',
      },
      demanda: {
        titulo: 'Demanda Com Hooks',
      },
    };

    await useCase.execute(input, { failAtStep: 'DEMAND' });

    expect(mockPersistence.persistAtomicSubmission).toHaveBeenCalledWith(
      expect.anything(),
      { failAtStep: 'DEMAND' }
    );
  });

  it('7. Valida e delega requisitos propostos e snapshot contextual com sucesso', async () => {
    const mockPersistence: IIntakePersistenceManager = {
      persistAtomicSubmission: vi.fn().mockResolvedValue(mockResult),
    };

    const useCase = new ProcessIntakeSubmissionUseCase(mockPersistence);

    const input: ConfirmIntakeInput = {
      solicitacaoOriginal: 'Solicitação para teste de requisitos propostos.',
      projetoDecisao: 'NOVO',
      novoProjeto: {
        nome: 'Projeto Com Requisitos',
      },
      demanda: {
        titulo: 'Demanda Com Requisitos Propostos',
      },
      requisitosPropostos: [
        {
          titulo: 'Faturamento Total Líquido',
          descricao: 'Métrica essencial identificada pelo motor',
          categoria: 'METRICA_KPI',
          prioridade: 'OBRIGATORIO',
        },
        {
          titulo: 'Análise por Região Geográfica',
          descricao: 'Dimensão para análise detalhada',
          categoria: 'DIMENSAO_FILTRO',
          prioridade: 'DESEJAVEL',
        },
      ],
      intakeSnapshot: JSON.stringify({
        fatos: { ativosDados: ['vendas_2024.xlsx'] },
        sinteseProximaAcao: { proximaAcaoRecomendada: 'Clarificar com o cliente' },
      }),
    };

    const output = await useCase.execute(input);

    expect(output.success).toBe(true);
    expect(mockPersistence.persistAtomicSubmission).toHaveBeenCalledWith(
      expect.objectContaining({
        requisitosPropostos: expect.arrayContaining([
          expect.objectContaining({
            titulo: 'Faturamento Total Líquido',
            prioridade: 'OBRIGATORIO',
          }),
        ]),
        intakeSnapshot: expect.any(String),
      }),
      undefined
    );
  });

  it('8. Salvaguarda Epistêmica: Requisitos propostos são validados conforme schema e não podem conter título inválido', async () => {
    const mockPersistence: IIntakePersistenceManager = {
      persistAtomicSubmission: vi.fn(),
    };

    const useCase = new ProcessIntakeSubmissionUseCase(mockPersistence);

    const inputComTituloInvalido: ConfirmIntakeInput = {
      solicitacaoOriginal: 'Solicitação com requisito inválido.',
      projetoDecisao: 'NOVO',
      novoProjeto: { nome: 'Projeto Validação' },
      demanda: { titulo: 'Demanda Requisito Inválido' },
      requisitosPropostos: [
        {
          titulo: 'x', // Menos de 3 caracteres
          categoria: 'METRICA_KPI',
          prioridade: 'OBRIGATORIO',
        },
      ],
    };

    await expect(useCase.execute(inputComTituloInvalido)).rejects.toThrow();
    expect(mockPersistence.persistAtomicSubmission).not.toHaveBeenCalled();
  });
});
