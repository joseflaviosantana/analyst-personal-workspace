import { Projeto, ProjetoComContadores } from '../entities/projeto';

export interface IProjectRepository {
  create(project: Projeto): Promise<Projeto>;
  findById(id: string): Promise<Projeto | null>;
  findAll(): Promise<ProjetoComContadores[]>;
  update(id: string, data: Partial<Projeto>): Promise<Projeto | null>;
  countActive(): Promise<number>;
  countTotal(): Promise<number>;
  countDemands(projectId: string): Promise<number>;
  delete(id: string): Promise<boolean>;
}
