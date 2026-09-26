'use server';

import { revalidatePath } from 'next/cache';
import { SqliteDemandRepository } from '@/infrastructure/db/repositories/demand-repository';
import { SqliteAuditRepository } from '@/infrastructure/db/repositories/audit-repository';
import { 
  TransitionDemandStateUseCase,
  SuspendDemandUseCase,
  ResumeDemandUseCase,
  CancelDemandUseCase,
  GetDemandTimelineUseCase,
} from '@/core/use-cases/workflow';
import { WorkflowEngine } from '@/core/domain/rules/workflow-engine';
import { 
  transitionDemandSchema,
  suspendDemandSchema,
  resumeDemandSchema,
  cancelDemandSchema,
  TransitionDemandInput,
  SuspendDemandInput,
  ResumeDemandInput,
  CancelDemandInput,
} from '@/lib/validations/demand-schema';

const demandRepo = new SqliteDemandRepository();
const auditRepo = new SqliteAuditRepository();

const transitionUseCase = new TransitionDemandStateUseCase(demandRepo, auditRepo);
const suspendUseCase = new SuspendDemandUseCase(demandRepo, auditRepo);
const resumeUseCase = new ResumeDemandUseCase(demandRepo, auditRepo);
const cancelUseCase = new CancelDemandUseCase(demandRepo, auditRepo);
const timelineUseCase = new GetDemandTimelineUseCase(auditRepo);

function revalidateAllPaths(demandaId: string, projetoId?: string) {
  revalidatePath('/cockpit');
  revalidatePath('/demands');
  revalidatePath('/pipeline');
  revalidatePath(`/demands/${demandaId}`);
  if (projetoId) {
    revalidatePath(`/projects/${projetoId}`);
  }
}

export async function advanceDemandAction(demandaId: string, justificativa?: string) {
  try {
    const demand = await demandRepo.findById(demandaId);
    if (!demand) {
      return { success: false, error: 'Demanda não encontrada.' };
    }

    const proximoEstado = WorkflowEngine.proximoEstadoNormal(demand.estado);
    if (!proximoEstado) {
      return { success: false, error: 'Não há próximo estado sequencial disponível a partir do estado atual.' };
    }

    const updated = await transitionUseCase.execute({
      demandaId,
      novoEstado: proximoEstado,
      justificativa: justificativa ?? null,
      autorTipo: 'HUMANO',
    });

    revalidateAllPaths(demandaId, updated.projeto_id);
    return { success: true, data: updated };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro ao avançar estado da demanda.',
    };
  }
}

export async function transitionDemandAction(data: TransitionDemandInput) {
  try {
    const parsed = transitionDemandSchema.parse(data);
    const updated = await transitionUseCase.execute({
      demandaId: parsed.demandaId,
      novoEstado: parsed.novoEstado,
      justificativa: parsed.justificativa,
      autorTipo: 'HUMANO',
    });

    revalidateAllPaths(parsed.demandaId, updated.projeto_id);
    return { success: true, data: updated };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro ao realizar transição de estado.',
    };
  }
}

export async function suspendDemandAction(data: SuspendDemandInput) {
  try {
    const parsed = suspendDemandSchema.parse(data);
    const updated = await suspendUseCase.execute(parsed);

    revalidateAllPaths(parsed.demandaId, updated.projeto_id);
    return { success: true, data: updated };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro ao suspender demanda.',
    };
  }
}

export async function resumeDemandAction(data: ResumeDemandInput) {
  try {
    const parsed = resumeDemandSchema.parse(data);
    const updated = await resumeUseCase.execute(parsed);

    revalidateAllPaths(parsed.demandaId, updated.projeto_id);
    return { success: true, data: updated };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro ao retomar demanda.',
    };
  }
}

export async function cancelDemandAction(data: CancelDemandInput) {
  try {
    const parsed = cancelDemandSchema.parse(data);
    const updated = await cancelUseCase.execute(parsed);

    revalidateAllPaths(parsed.demandaId, updated.projeto_id);
    return { success: true, data: updated };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro ao cancelar demanda.',
    };
  }
}

export async function getDemandTimelineAction(demandaId: string) {
  try {
    const timeline = await timelineUseCase.execute(demandaId);
    return { success: true, data: timeline };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro ao carregar linha do tempo de auditoria.',
    };
  }
}
