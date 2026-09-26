import { DemandaComProjeto } from '@/core/domain/entities/demanda';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { IProjectRepository } from '@/core/domain/repositories/project-repository.interface';

export interface CockpitSummary {
  totalProjetos: number;
  projetosAtivos: number;
  totalDemandas: number;
  demandasAtivas: number;
  demandasRecentes: DemandaComProjeto[];
}

export class GetCockpitSummaryUseCase {
  constructor(
    private projectRepo: IProjectRepository,
    private demandRepo: IDemandRepository
  ) {}

  async execute(): Promise<CockpitSummary> {
    const [
      totalProjetos,
      projetosAtivos,
      totalDemandas,
      demandasAtivas,
      demandasRecentes,
    ] = await Promise.all([
      this.projectRepo.countTotal(),
      this.projectRepo.countActive(),
      this.demandRepo.countTotal(),
      this.demandRepo.countActive(),
      this.demandRepo.findRecent(5),
    ]);

    return {
      totalProjetos,
      projetosAtivos,
      totalDemandas,
      demandasAtivas,
      demandasRecentes,
    };
  }
}
