import { IReceitaPreparacaoRepository } from '@/core/domain/repositories/receita-preparacao-repository.interface';
import { ReceitaPreparacao } from '@/core/domain/entities/receita-preparacao';

/**
 * Caso de Uso: Listar Receitas de uma Demanda (Subunidade 3.5B)
 * Retorna o histórico de receitas cadastradas para a demanda informada.
 */
export class ListarReceitasDemandaUseCase {
  constructor(private receitaRepo: IReceitaPreparacaoRepository) {}

  async execute(demandaId: string): Promise<ReceitaPreparacao[]> {
    if (!demandaId || demandaId.trim() === '') {
      throw new Error('ID da demanda é obrigatório.');
    }

    return this.receitaRepo.findByDemandId(demandaId);
  }
}
