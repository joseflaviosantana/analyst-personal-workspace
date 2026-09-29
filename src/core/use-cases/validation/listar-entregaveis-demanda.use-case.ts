import { IEntregavelDemandaRepository } from '@/core/domain/repositories/entregavel-demanda-repository.interface';
import { EntregavelDemanda } from '@/core/domain/entities/entregavel-demanda';

export class ListarEntregaveisDemandaUseCase {
  constructor(private entregavelRepo: IEntregavelDemandaRepository) {}

  async execute(demandaId: string): Promise<EntregavelDemanda[]> {
    if (!demandaId || demandaId.trim().length === 0) {
      throw new Error('ID da demanda é obrigatório para listagem de entregáveis.');
    }
    return this.entregavelRepo.findByDemandId(demandaId);
  }
}
