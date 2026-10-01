import { RequisitoDemanda } from '@/core/domain/entities/requisito-demanda';
import { IRequisitoDemandaRepository } from '@/core/domain/repositories/requisito-demanda-repository.interface';

export class ListarRequisitosUseCase {
  constructor(private requisitoRepo: IRequisitoDemandaRepository) {}

  async execute(demandaId: string): Promise<RequisitoDemanda[]> {
    return this.requisitoRepo.findByDemandId(demandaId);
  }
}
