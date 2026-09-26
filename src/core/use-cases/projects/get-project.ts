import { Projeto } from '@/core/domain/entities/projeto';
import { Demanda } from '@/core/domain/entities/demanda';
import { IProjectRepository } from '@/core/domain/repositories/project-repository.interface';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';

export interface ProjectDetails {
  project: Projeto;
  demands: Demanda[];
}

export class GetProjectUseCase {
  constructor(
    private projectRepo: IProjectRepository,
    private demandRepo: IDemandRepository
  ) {}

  async execute(projectId: string): Promise<ProjectDetails | null> {
    const project = await this.projectRepo.findById(projectId);
    if (!project) return null;

    const demands = await this.demandRepo.findByProjectId(projectId);

    return {
      project,
      demands,
    };
  }
}
