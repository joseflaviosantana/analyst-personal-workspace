import { PerguntaClarificacao } from '@/core/domain/entities/pergunta-clarificacao';
import { StatusPerguntaClarificacao } from '@/core/domain/enums/status-pergunta-clarificacao';
import { isEstadoReadOnly } from '@/core/domain/enums/estado-demanda';
import { IPerguntaClarificacaoRepository } from '@/core/domain/repositories/pergunta-clarificacao-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { EtapaOrigemEvidencia } from '@/core/domain/enums/etapa-origem-evidencia';

export interface RegistrarRespostaContratanteInput {
  perguntaId: string;
  resposta: string;
  respondidoPor: string;
  impactoDecisao?: string | null;
}

export class RegistrarRespostaContratanteUseCase {
  constructor(
    private perguntaRepo: IPerguntaClarificacaoRepository,
    private auditRepo?: IAuditRepository,
    private processarEventoUseCase?: { execute: (evento: any) => Promise<unknown> },
    private demandRepo?: IDemandRepository
  ) {}

  async execute(input: RegistrarRespostaContratanteInput): Promise<PerguntaClarificacao> {
    const existing = await this.perguntaRepo.findById(input.perguntaId);
    if (!existing) {
      throw new Error(`Pergunta '${input.perguntaId}' não encontrada.`);
    }

    if (this.demandRepo) {
      const demanda = await this.demandRepo.findById(existing.demanda_id);
      if (demanda && isEstadoReadOnly(demanda.estado)) {
        throw new Error(
          `Demanda '${demanda.id}' está em modo somente-leitura (estado: ${demanda.estado}). Registro de respostas não permitido.`
        );
      }
    }

    if (!input.resposta || input.resposta.trim().length < 3) {
      throw new Error('O texto da resposta deve conter no mínimo 3 caracteres.');
    }

    if (!input.respondidoPor || input.respondidoPor.trim().length < 2) {
      throw new Error('O nome de quem respondeu deve conter no mínimo 2 caracteres.');
    }

    const now = new Date().toISOString();
    const updated = await this.perguntaRepo.update(input.perguntaId, {
      status: StatusPerguntaClarificacao.RESPONDIDA,
      resposta: input.resposta.trim(),
      respondido_por: input.respondidoPor.trim(),
      respondida_em: now,
      impacto_decisao: input.impactoDecisao?.trim() || null,
    });

    if (!updated) {
      throw new Error(`Falha ao registrar resposta para a pergunta '${input.perguntaId}'.`);
    }

    if (this.auditRepo) {
      await this.auditRepo.record({
        demanda_id: existing.demanda_id,
        entidade: 'PerguntaClarificacao',
        entidade_id: existing.id,
        tipo_evento: 'DECISAO_HUMANA',
        autor_tipo: 'HUMANO',
        dados_anteriores: JSON.stringify({ status: existing.status }),
        dados_novos: JSON.stringify({
          status: StatusPerguntaClarificacao.RESPONDIDA,
          respondido_por: input.respondidoPor.trim(),
          respondida_em: now,
        }),
        justificativa: `Resposta formal registrada do contratante: ${input.impactoDecisao || 'Esclarecimento de escopo'}.`,
        timestamp: now,
      });
    }

    // Emissão do evento de evidência com chave canônica persistida (Salvaguarda 2)
    if (this.processarEventoUseCase) {
      try {
        await this.processarEventoUseCase.execute({
          id_evento: `evento_${existing.id}_resp_${now}`,
          demanda_id: existing.demanda_id,
          etapa_origem: EtapaOrigemEvidencia.REQUISITOS,
          categoria: 'REQUISITOS',
          tipo_evento: 'REQUISITOS_RESPOSTA_CONTRATANTE_REGISTRADA',
          ocorrido_em: now,
          executor: 'ANALISTA',
          artefato_origem_tipo: 'PERGUNTA_CLARIFICACAO',
          artefato_origem_id: existing.id,
          payload: {
            demandaId: existing.demanda_id,
            perguntaId: existing.id,
            pergunta: existing.pergunta,
            resposta: input.resposta.trim(),
            respondidoPor: input.respondidoPor.trim(),
            respondidaEm: now,
            impactoDecisao: input.impactoDecisao?.trim() || null,
            bloqueante: existing.bloqueante,
          },
          versao_contrato: '1.0',
        });
      } catch (err) {
        console.error('[EVIDENCE_EVENT_ERROR] Falha ao processar evento de resposta de clarificação:', err);
      }
    }

    return updated;
  }
}
