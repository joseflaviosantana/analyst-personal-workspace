'use server';

import { revalidatePath } from 'next/cache';
import { SqliteProjectRepository } from '@/infrastructure/db/repositories/project-repository';
import { CreateProjectUseCase } from '@/core/use-cases/projects/create-project';
import { UpdateProjectUseCase } from '@/core/use-cases/projects/update-project';
import { CreateProjectInput, UpdateProjectInput } from '@/lib/validations/project-schema';

const projectRepo = new SqliteProjectRepository();
const createProjectUseCase = new CreateProjectUseCase(projectRepo);
const updateProjectUseCase = new UpdateProjectUseCase(projectRepo);

export async function createProjectAction(data: CreateProjectInput) {
  try {
    const project = await createProjectUseCase.execute(data);
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

export async function updateProjectAction(id: string, data: UpdateProjectInput) {
  try {
    const project = await updateProjectUseCase.execute(id, data);
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
