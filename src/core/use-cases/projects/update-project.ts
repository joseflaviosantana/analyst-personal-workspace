import { Projeto } from '@/core/domain/entities/projeto';
import { IProjectRepository } from '@/core/domain/repositories/project-repository.interface';
import { UpdateProjectInput, updateProjectSchema } from '@/lib/validations/project-schema';

export class UpdateProjectUseCase {
  constructor(private projectRepo: IProjectRepository) {}

  async execute(projectId: string, input: UpdateProjectInput): Promise<Projeto> {
    const validated = updateProjectSchema.parse(input);

    const existing = await this.projectRepo.findById(projectId);
    if (!existing) {
      throw new Error(`Projeto com ID '${projectId}' não foi encontrado.`);
    }

    const updated = await this.projectRepo.update(projectId, validated);
    if (!updated) {
      throw new Error(`Falha ao atualizar o projeto '${projectId}'.`);
    }

    return updated;
  }
}
