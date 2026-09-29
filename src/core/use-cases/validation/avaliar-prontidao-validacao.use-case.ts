import { IValidacaoConciliacaoRepository } from '@/core/domain/repositories/validacao-conciliacao-repository.interface';
import { IEntregavelDemandaRepository } from '@/core/domain/repositories/entregavel-demanda-repository.interface';
import {
  ValidationRulesEvaluator,
  ResultadoAvaliacaoValidacao,
} from '@/core/domain/rules/validation-rules-evaluator';

export class AvaliarProntidaoValidacaoUseCase {
  constructor(
    private validacaoRepo: IValidacaoConciliacaoRepository,
    private entregavelRepo: IEntregavelDemandaRepository
  ) {}

  async execute(demandaId: string): Promise<ResultadoAvaliacaoValidacao> {
    if (!demandaId || demandaId.trim().length === 0) {
      throw new Error('ID da demanda é obrigatório para avaliação de prontidão.');
    }

    const validacoes = await this.validacaoRepo.findByDemandId(demandaId);
    const entregaveis = await this.entregavelRepo.findByDemandId(demandaId);

    return ValidationRulesEvaluator.avaliar(validacoes, entregaveis);
  }
}
