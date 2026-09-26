import { DemandaComProjeto } from '@/core/domain/entities/demanda';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';

export class ListDemandsUseCase {
  constructor(private demandRepo: IDemandRepository) {}

  async execute(): Promise<DemandaComProjeto[]> {
    return this.demandRepo.findAll();
  }
}
