import { PerguntaClarificacao } from '@/core/domain/entities/pergunta-clarificacao';
import { IPerguntaClarificacaoRepository } from '@/core/domain/repositories/pergunta-clarificacao-repository.interface';

export class ListarPerguntasClarificacaoUseCase {
  constructor(private perguntaRepo: IPerguntaClarificacaoRepository) {}

  async execute(demandaId: string): Promise<PerguntaClarificacao[]> {
    return this.perguntaRepo.findByDemandId(demandaId);
  }
}
