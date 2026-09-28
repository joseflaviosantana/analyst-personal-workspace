import { IReceitaPreparacaoRepository } from '@/core/domain/repositories/receita-preparacao-repository.interface';
import { IEtapaTransformacaoRepository } from '@/core/domain/repositories/etapa-transformacao-repository.interface';
import { ReceitaPreparacao } from '@/core/domain/entities/receita-preparacao';
import { EtapaTransformacao } from '@/core/domain/entities/etapa-transformacao';

export interface ReceitaComEtapas {
  receita: ReceitaPreparacao;
  etapas: EtapaTransformacao[];
}

/**
 * Caso de Uso: Obter Receita de Preparação (Subunidade 3.5B)
 * Retorna os dados da receita e suas etapas ordenadas determinísticamente por ordem crescente.
 */
export class ObterReceitaPreparacaoUseCase {
  constructor(
    private receitaRepo: IReceitaPreparacaoRepository,
    private etapaRepo: IEtapaTransformacaoRepository
  ) {}

  async execute(receitaId: string): Promise<ReceitaComEtapas | null> {
    if (!receitaId || receitaId.trim() === '') {
      throw new Error('ID da receita é obrigatório.');
    }

    const receita = await this.receitaRepo.findById(receitaId);
    if (!receita) {
      return null;
    }

    const etapas = await this.etapaRepo.findByReceitaId(receitaId);

    return {
      receita,
      etapas,
    };
  }
}
