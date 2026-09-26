import { ProjetoComContadores } from '@/core/domain/entities/projeto';
import { IProjectRepository } from '@/core/domain/repositories/project-repository.interface';

export class ListProjectsUseCase {
  constructor(private projectRepo: IProjectRepository) {}

  async execute(): Promise<ProjetoComContadores[]> {
    return this.projectRepo.findAll();
  }
}
