import { PerguntaClarificacao } from '@/core/domain/entities/pergunta-clarificacao';
import { StatusPerguntaClarificacao } from '@/core/domain/enums/status-pergunta-clarificacao';
import { isEstadoReadOnly } from '@/core/domain/enums/estado-demanda';
import { IPerguntaClarificacaoRepository } from '@/core/domain/repositories/pergunta-clarificacao-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';

export class DespacharPerguntaClarificacaoUseCase {
  constructor(
    private perguntaRepo: IPerguntaClarificacaoRepository,
    private auditRepo?: IAuditRepository,
    private demandRepo?: IDemandRepository
  ) {}

  async execute(id: string): Promise<PerguntaClarificacao> {
    const existing = await this.perguntaRepo.findById(id);
    if (!existing) {
      throw new Error(`Pergunta '${id}' não encontrada.`);
    }

    if (this.demandRepo) {
      const demanda = await this.demandRepo.findById(existing.demanda_id);
      if (demanda && isEstadoReadOnly(demanda.estado)) {
        throw new Error(
          `Demanda '${demanda.id}' está em modo somente-leitura (estado: ${demanda.estado}). Despacho de perguntas não permitido.`
        );
      }
    }

    if (existing.status === StatusPerguntaClarificacao.RESPONDIDA) {
      throw new Error('A pergunta já foi respondida e não pode ser reenviada.');
    }

    const now = new Date().toISOString();
    const updated = await this.perguntaRepo.update(id, {
      status: StatusPerguntaClarificacao.ENVIADA,
      enviada_em: now,
    });

    if (!updated) {
      throw new Error(`Falha ao despachar pergunta '${id}'.`);
    }

    if (this.auditRepo) {
      await this.auditRepo.record({
        demanda_id: existing.demanda_id,
        entidade: 'PerguntaClarificacao',
        entidade_id: existing.id,
        tipo_evento: 'DECISAO_HUMANA',
        autor_tipo: 'HUMANO',
        dados_anteriores: JSON.stringify({ status: existing.status }),
        dados_novos: JSON.stringify({ status: StatusPerguntaClarificacao.ENVIADA, enviada_em: now }),
        justificativa: 'Pergunta de clarificação aprovada pelo analista e despachada para o contratante.',
        timestamp: now,
      });
    }

    return updated;
  }
}
