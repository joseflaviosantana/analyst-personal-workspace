import { isEstadoReadOnly } from '@/core/domain/enums/estado-demanda';
import { IPerguntaClarificacaoRepository } from '@/core/domain/repositories/pergunta-clarificacao-repository.interface';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';

export class RemoverPerguntaClarificacaoUseCase {
  constructor(
    private perguntaRepo: IPerguntaClarificacaoRepository,
    private demandRepo?: IDemandRepository
  ) {}

  async execute(id: string): Promise<boolean> {
    const existing = await this.perguntaRepo.findById(id);
    if (!existing) {
      throw new Error(`Pergunta '${id}' não encontrada.`);
    }

    if (this.demandRepo) {
      const demanda = await this.demandRepo.findById(existing.demanda_id);
      if (demanda && isEstadoReadOnly(demanda.estado)) {
        throw new Error(
          `Demanda '${demanda.id}' está em modo somente-leitura (estado: ${demanda.estado}). Remoção de perguntas não permitida.`
        );
      }
    }

    return this.perguntaRepo.delete(id);
  }
}
