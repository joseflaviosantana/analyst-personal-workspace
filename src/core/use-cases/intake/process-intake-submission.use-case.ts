import {
  IIntakePersistenceManager,
  IntakePersistenceHooks,
  PersistIntakeSubmissionResult,
} from '@/core/domain/repositories/intake-persistence-manager.interface';
import { ConfirmIntakeInput, confirmIntakeSchema } from '@/lib/validations/intake-schema';

export interface ProcessIntakeSubmissionOutput extends PersistIntakeSubmissionResult {
  success: boolean;
}

/**
 * Caso de Uso: Processar Submissão e Materialização do Intake Inteligente.
 *
 * Responsável por:
 * 1. Validar rigorosamente o payload de submissão pós-revisão humana via schema Zod.
 * 2. Orquestrar a persistência transacional atômica via IIntakePersistenceManager.
 * 3. Garantir preservação epistêmica de solicitacao_bruta e rollback integral em caso de falha.
 */
export class ProcessIntakeSubmissionUseCase {
  constructor(private persistenceManager: IIntakePersistenceManager) {}

  async execute(
    input: ConfirmIntakeInput,
    hooks?: IntakePersistenceHooks
  ): Promise<ProcessIntakeSubmissionOutput> {
    // 1. Validação server-side estrita com Zod (não confia exclusivamente na UI)
    const validated = confirmIntakeSchema.parse(input);

    // 2. Execução transacional atômica indivisível
    const result = await this.persistenceManager.persistAtomicSubmission(validated, hooks);

    return {
      success: true,
      ...result,
    };
  }
}
