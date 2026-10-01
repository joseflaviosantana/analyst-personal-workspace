import { PerguntaClarificacao } from '@/core/domain/entities/pergunta-clarificacao';
import { StatusPerguntaClarificacao } from '@/core/domain/enums/status-pergunta-clarificacao';
import { isEstadoReadOnly } from '@/core/domain/enums/estado-demanda';
import { IPerguntaClarificacaoRepository } from '@/core/domain/repositories/pergunta-clarificacao-repository.interface';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';

export interface AtualizarPerguntaClarificacaoInput {
  id: string;
  pergunta?: string;
  motivacao?: string | null;
  bloqueante?: boolean;
  status?: StatusPerguntaClarificacao;
}

export class AtualizarPerguntaClarificacaoUseCase {
  constructor(
    private perguntaRepo: IPerguntaClarificacaoRepository,
    private demandRepo?: IDemandRepository
  ) {}

  async execute(input: AtualizarPerguntaClarificacaoInput): Promise<PerguntaClarificacao> {
    const existing = await this.perguntaRepo.findById(input.id);
    if (!existing) {
      throw new Error(`Pergunta '${input.id}' não encontrada.`);
    }

    if (this.demandRepo) {
      const demanda = await this.demandRepo.findById(existing.demanda_id);
      if (demanda && isEstadoReadOnly(demanda.estado)) {
        throw new Error(
          `Demanda '${demanda.id}' está em modo somente-leitura (estado: ${demanda.estado}). Atualização de perguntas não permitida.`
        );
      }
    }

    if (input.pergunta !== undefined && input.pergunta.trim().length < 5) {
      throw new Error('A pergunta de clarificação deve conter no mínimo 5 caracteres.');
    }

    const partial: Partial<PerguntaClarificacao> = {};
    if (input.pergunta !== undefined) partial.pergunta = input.pergunta.trim();
    if (input.motivacao !== undefined) partial.motivacao = input.motivacao?.trim() || null;
    if (input.bloqueante !== undefined) partial.bloqueante = input.bloqueante;
    if (input.status !== undefined) partial.status = input.status;

    const updated = await this.perguntaRepo.update(input.id, partial);
    if (!updated) {
      throw new Error(`Falha ao atualizar pergunta '${input.id}'.`);
    }

    return updated;
  }
}
