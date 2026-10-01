import { isEstadoReadOnly } from '@/core/domain/enums/estado-demanda';
import { IRequisitoDemandaRepository } from '@/core/domain/repositories/requisito-demanda-repository.interface';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';

export class RemoverRequisitoUseCase {
  constructor(
    private requisitoRepo: IRequisitoDemandaRepository,
    private demandRepo?: IDemandRepository
  ) {}

  async execute(id: string): Promise<boolean> {
    const existing = await this.requisitoRepo.findById(id);
    if (!existing) {
      throw new Error(`Requisito '${id}' não encontrado.`);
    }

    if (this.demandRepo) {
      const demanda = await this.demandRepo.findById(existing.demanda_id);
      if (demanda && isEstadoReadOnly(demanda.estado)) {
        throw new Error(
          `Demanda '${demanda.id}' está em modo somente-leitura (estado: ${demanda.estado}). Remoção de requisitos não permitida.`
        );
      }
    }

    return this.requisitoRepo.delete(id);
  }
}
