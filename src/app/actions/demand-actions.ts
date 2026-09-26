'use server';

import { revalidatePath } from 'next/cache';
import { SqliteDemandRepository } from '@/infrastructure/db/repositories/demand-repository';
import { SqliteProjectRepository } from '@/infrastructure/db/repositories/project-repository';
import { SqliteAuditRepository } from '@/infrastructure/db/repositories/audit-repository';
import { CreateDemandUseCase } from '@/core/use-cases/demands/create-demand';
import { UpdateDemandUseCase } from '@/core/use-cases/demands/update-demand';
import { CreateDemandInput, UpdateDemandInput } from '@/lib/validations/demand-schema';

const demandRepo = new SqliteDemandRepository();
const projectRepo = new SqliteProjectRepository();
const auditRepo = new SqliteAuditRepository();
const createDemandUseCase = new CreateDemandUseCase(demandRepo, projectRepo, auditRepo);
const updateDemandUseCase = new UpdateDemandUseCase(demandRepo);

export async function createDemandAction(data: CreateDemandInput) {
  try {
    const demand = await createDemandUseCase.execute(data);
    revalidatePath('/cockpit');
    revalidatePath('/demands');
    revalidatePath('/projects');
    revalidatePath(`/projects/${demand.projeto_id}`);
    return { success: true, data: demand };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro ao criar demanda.',
    };
  }
}

export async function updateDemandAction(id: string, data: UpdateDemandInput) {
  try {
    const demand = await updateDemandUseCase.execute(id, data);
    revalidatePath('/cockpit');
    revalidatePath('/demands');
    revalidatePath(`/demands/${id}`);
    revalidatePath('/projects');
    return { success: true, data: demand };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro ao atualizar demanda.',
    };
  }
}
