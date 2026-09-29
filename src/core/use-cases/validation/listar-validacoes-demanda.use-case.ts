import { IValidacaoConciliacaoRepository } from '@/core/domain/repositories/validacao-conciliacao-repository.interface';
import { ValidacaoConciliacao } from '@/core/domain/entities/validacao-conciliacao';

export class ListarValidacoesDemandaUseCase {
  constructor(private validacaoRepo: IValidacaoConciliacaoRepository) {}

  async execute(demandaId: string): Promise<ValidacaoConciliacao[]> {
    if (!demandaId || demandaId.trim().length === 0) {
      throw new Error('ID da demanda é obrigatório para listagem de validações.');
    }
    return this.validacaoRepo.findByDemandId(demandaId);
  }
}
