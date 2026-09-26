import { Demanda, DemandaComProjeto } from '../entities/demanda';

export interface IDemandRepository {
  create(demand: Demanda): Promise<Demanda>;
  findById(id: string): Promise<DemandaComProjeto | null>;
  findByProjectId(projectId: string): Promise<Demanda[]>;
  findAll(): Promise<DemandaComProjeto[]>;
  findRecent(limit: number): Promise<DemandaComProjeto[]>;
  update(id: string, data: Partial<Demanda>): Promise<Demanda | null>;
  countActive(): Promise<number>;
  countTotal(): Promise<number>;
}
