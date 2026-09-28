import { IRelacionamentoAnaliticoRepository } from '@/core/domain/repositories/relacionamento-analitico-repository.interface';

export class RemoverRelacionamentoAnaliticoUseCase {
  constructor(private relacionamentoRepo: IRelacionamentoAnaliticoRepository) {}

  async execute(relacionamentoId: string): Promise<void> {
    const relacionamento = await this.relacionamentoRepo.findById(relacionamentoId);
    if (!relacionamento) {
      throw new Error(`Relacionamento analítico com ID '${relacionamentoId}' não encontrado.`);
    }

    await this.relacionamentoRepo.delete(relacionamentoId);
  }
}
