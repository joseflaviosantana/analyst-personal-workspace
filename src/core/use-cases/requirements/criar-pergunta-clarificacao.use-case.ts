import { PerguntaClarificacao } from '@/core/domain/entities/pergunta-clarificacao';
import { StatusPerguntaClarificacao } from '@/core/domain/enums/status-pergunta-clarificacao';
import { isEstadoReadOnly } from '@/core/domain/enums/estado-demanda';
import { IPerguntaClarificacaoRepository } from '@/core/domain/repositories/pergunta-clarificacao-repository.interface';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { generateId } from '@/lib/id-generator';

export interface CriarPerguntaClarificacaoInput {
  demandaId: string;
  requisitoId?: string | null;
  pergunta: string;
  motivacao?: string | null;
  bloqueante?: boolean;
}

export class CriarPerguntaClarificacaoUseCase {
  constructor(
    private perguntaRepo: IPerguntaClarificacaoRepository,
    private demandRepo: IDemandRepository
  ) {}

  async execute(input: CriarPerguntaClarificacaoInput): Promise<PerguntaClarificacao> {
    const demanda = await this.demandRepo.findById(input.demandaId);
    if (!demanda) {
      throw new Error(`Demanda '${input.demandaId}' não encontrada.`);
    }

    if (isEstadoReadOnly(demanda.estado)) {
      throw new Error(
        `Demanda '${demanda.id}' está em modo somente-leitura (estado: ${demanda.estado}). Criação de perguntas de clarificação não permitida.`
      );
    }

    if (!input.pergunta || input.pergunta.trim().length < 5) {
      throw new Error('A pergunta de clarificação deve conter no mínimo 5 caracteres.');
    }

    const now = new Date().toISOString();
    const pergunta: PerguntaClarificacao = {
      id: generateId('perg'),
      demanda_id: input.demandaId,
      requisito_id: input.requisitoId || null,
      pergunta: input.pergunta.trim(),
      motivacao: input.motivacao?.trim() || null,
      bloqueante: input.bloqueante ?? false,
      status: StatusPerguntaClarificacao.RASCUNHO,
      enviada_em: null,
      resposta: null,
      respondido_por: null,
      respondida_em: null,
      impacto_decisao: null,
      criado_em: now,
      atualizado_em: now,
    };

    return this.perguntaRepo.create(pergunta);
  }
}
