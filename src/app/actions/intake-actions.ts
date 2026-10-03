'use server';

import { revalidatePath } from 'next/cache';
import { IntakeAnalysisEngine } from '@/core/domain/intake/intake-analysis-engine';
import { ResultadoAnaliseIntake } from '@/core/domain/intake/intake-types';
import {
  IIntakePersistenceManager,
  IntakePersistenceHooks,
} from '@/core/domain/repositories/intake-persistence-manager.interface';
import { SqliteIntakePersistenceManager } from '@/infrastructure/db/repositories/sqlite-intake-persistence-manager';
import {
  ProcessIntakeSubmissionUseCase,
  ProcessIntakeSubmissionOutput,
} from '@/core/use-cases/intake/process-intake-submission.use-case';
import {
  ConfirmIntakeInput,
  analyzeIntakeSchema,
} from '@/lib/validations/intake-schema';

export interface IntakeActionDeps {
  persistenceManager?: IIntakePersistenceManager;
}

const defaultPersistenceManager = new SqliteIntakePersistenceManager();

/**
 * Server Action: Análise preliminar do texto bruto de Intake (Tier 1 Heurístico Local).
 *
 * PROPRIEDADE ARQUITETURAL:
 * - Read/Compute-Only: Não executa nenhuma gravação, mutação ou persistência no banco de dados.
 * - Determinístico e Local: Não consome serviços externos nem efetua chamadas a LLMs remotas.
 */
export async function analyzeIntakeAction(
  input: string | { solicitacaoOriginal: string }
): Promise<{ success: boolean; data?: ResultadoAnaliseIntake; error?: string }> {
  try {
    const rawText = typeof input === 'string' ? input : input?.solicitacaoOriginal;
    const validated = analyzeIntakeSchema.parse({ solicitacaoOriginal: rawText });

    const engine = new IntakeAnalysisEngine();
    const analise = engine.analisar(validated.solicitacaoOriginal);

    return {
      success: true,
      data: analise,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro ao analisar solicitação no Intake.',
    };
  }
}

/**
 * Server Action: Confirmação e materialização transacional atômica da estrutura de Intake.
 *
 * PROPRIEDADE ARQUITETURAL:
 * - Executa a persistência de Projeto + Demanda + Perguntas Preliminares + Auditoria em uma ÚNICA transação SQLite real.
 * - Aplica validação estrita server-side antes de qualquer operação no banco.
 * - Em caso de falha em qualquer etapa, executa ROLLBACK INTEGRAL sem deixar órfãos ou dados parciais.
 */
export async function confirmIntakeAction(
  data: ConfirmIntakeInput,
  deps?: IntakeActionDeps,
  hooks?: IntakePersistenceHooks
): Promise<{ success: boolean; data?: ProcessIntakeSubmissionOutput; error?: string }> {
  try {
    const persistenceManager = deps?.persistenceManager ?? defaultPersistenceManager;
    const useCase = new ProcessIntakeSubmissionUseCase(persistenceManager);

    const result = await useCase.execute(data, hooks);

    // Revalidação de rotas afetadas pela inserção atômica
    revalidatePath('/cockpit');
    revalidatePath('/projects');
    revalidatePath('/demands');
    revalidatePath('/intake');
    revalidatePath(`/projects/${result.projeto.id}`);
    revalidatePath(`/demands/${result.demanda.id}`);

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro ao confirmar submissão do Intake.',
    };
  }
}
