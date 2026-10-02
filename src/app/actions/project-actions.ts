'use server';

import { revalidatePath } from 'next/cache';
import { SqliteProjectRepository } from '@/infrastructure/db/repositories/project-repository';
import { SqliteAuditRepository } from '@/infrastructure/db/repositories/audit-repository';
import { CreateProjectUseCase } from '@/core/use-cases/projects/create-project';
import { UpdateProjectUseCase } from '@/core/use-cases/projects/update-project';
import { DeleteProjectUseCase } from '@/core/use-cases/projects/delete-project';
import { CreateProjectInput, UpdateProjectInput } from '@/lib/validations/project-schema';
import { IProjectRepository } from '@/core/domain/repositories/project-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';

const defaultProjectRepo = new SqliteProjectRepository();
const defaultAuditRepo = new SqliteAuditRepository();

export interface ProjectActionDeps {
  projectRepo?: IProjectRepository;
  auditRepo?: IAuditRepository;
}

export async function createProjectAction(data: CreateProjectInput, deps?: ProjectActionDeps) {
  try {
    const repo = deps?.projectRepo ?? defaultProjectRepo;
    const useCase = new CreateProjectUseCase(repo);
    const project = await useCase.execute(data);
    revalidatePath('/cockpit');
    revalidatePath('/projects');
    return { success: true, data: project };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro ao criar projeto.',
    };
  }
}

export async function updateProjectAction(
  id: string,
  data: UpdateProjectInput,
  deps?: ProjectActionDeps
) {
  try {
    const repo = deps?.projectRepo ?? defaultProjectRepo;
    const useCase = new UpdateProjectUseCase(repo);
    const project = await useCase.execute(id, data);
    revalidatePath('/cockpit');
    revalidatePath('/projects');
    revalidatePath(`/projects/${id}`);
    return { success: true, data: project };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro ao atualizar projeto.',
    };
  }
}

export async function deleteProjectAction(
  projectId: string,
  motivo?: string,
  deps?: ProjectActionDeps
) {
  try {
    const repo = deps?.projectRepo ?? defaultProjectRepo;
    const audit = deps?.auditRepo ?? defaultAuditRepo;
    const useCase = new DeleteProjectUseCase(repo, audit);
    const result = await useCase.execute({
      projectId,
      motivo,
      autorTipo: 'HUMANO',
    });
    revalidatePath('/cockpit');
    revalidatePath('/projects');
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro ao excluir projeto.',
    };
  }
}
