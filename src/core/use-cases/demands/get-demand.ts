import { DemandaComProjeto } from '@/core/domain/entities/demanda';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';

export class GetDemandUseCase {
  constructor(private demandRepo: IDemandRepository) {}

  async execute(id: string): Promise<DemandaComProjeto | null> {
    return this.demandRepo.findById(id);
  }
}
