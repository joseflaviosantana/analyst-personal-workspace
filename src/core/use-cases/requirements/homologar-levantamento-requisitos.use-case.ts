import { Demanda } from '@/core/domain/entities/demanda';
import { isEstadoReadOnly } from '@/core/domain/enums/estado-demanda';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { IRequisitoDemandaRepository } from '@/core/domain/repositories/requisito-demanda-repository.interface';
import { IPerguntaClarificacaoRepository } from '@/core/domain/repositories/pergunta-clarificacao-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { AvaliarProntidaoRequisitosUseCase } from './avaliar-prontidao-requisitos.use-case';
import { EtapaOrigemEvidencia } from '@/core/domain/enums/etapa-origem-evidencia';
import { StatusPerguntaClarificacao } from '@/core/domain/enums/status-pergunta-clarificacao';

export interface HomologarLevantamentoRequisitosInput {
  demandaId: string;
  justificativa: string;
  ressalvas?: string | null;
  homologadoPor?: string;
}

export class HomologarLevantamentoRequisitosUseCase {
  private prontidaoUseCase: AvaliarProntidaoRequisitosUseCase;

  constructor(
    private demandRepo: IDemandRepository,
    private requisitoRepo: IRequisitoDemandaRepository,
    private perguntaRepo: IPerguntaClarificacaoRepository,
    private auditRepo?: IAuditRepository,
    private processarEventoUseCase?: { execute: (evento: any) => Promise<unknown> }
  ) {
    this.prontidaoUseCase = new AvaliarProntidaoRequisitosUseCase(
      demandRepo,
      requisitoRepo,
      perguntaRepo
    );
  }

  async execute(input: HomologarLevantamentoRequisitosInput): Promise<Demanda> {
    const demanda = await this.demandRepo.findById(input.demandaId);
    if (!demanda) {
      throw new Error(`Demanda '${input.demandaId}' não encontrada.`);
    }

    if (isEstadoReadOnly(demanda.estado)) {
      throw new Error(
        `Demanda '${demanda.id}' está em modo somente-leitura (estado: ${demanda.estado}). Homologação de requisitos não permitida.`
      );
    }

    if (!input.justificativa || input.justificativa.trim().length < 15) {
      throw new Error(
        'A homologação formal do levantamento exige justificativa com no mínimo 15 caracteres.'
      );
    }

    const prontidao = await this.prontidaoUseCase.execute(input.demandaId);
    if (prontidao.bloqueado) {
      throw new Error(
        `Não é possível homologar o levantamento de requisitos: ${prontidao.motivosBloqueio.join(' ')}`
      );
    }

    const now = new Date().toISOString();
    const homologadoPor = input.homologadoPor?.trim() || 'ANALISTA';

    const updated = await this.demandRepo.update(input.demandaId, {
      requisitos_homologados_em: now,
      requisitos_homologados_por: homologadoPor,
      requisitos_justificativa_homologacao: input.justificativa.trim(),
      requisitos_ressalvas: input.ressalvas?.trim() || null,
    });

    if (!updated) {
      throw new Error(`Falha ao persistir homologação dos requisitos da demanda '${input.demandaId}'.`);
    }

    // Registro na Trilha de Auditoria
    if (this.auditRepo) {
      await this.auditRepo.record({
        demanda_id: demanda.id,
        entidade: 'Demanda',
        entidade_id: demanda.id,
        tipo_evento: 'DECISAO_HUMANA',
        autor_tipo: 'HUMANO',
        dados_anteriores: JSON.stringify({
          requisitos_homologados_em: demanda.requisitos_homologados_em,
        }),
        dados_novos: JSON.stringify({
          requisitos_homologados_em: now,
          requisitos_homologados_por: homologadoPor,
          requisitos_justificativa_homologacao: input.justificativa.trim(),
          requisitos_ressalvas: input.ressalvas?.trim() || null,
        }),
        justificativa: input.justificativa.trim(),
        timestamp: now,
      });
    }

    // Emissão do Evento de Evidência com identidade determinística ancorada no timestamp persistido (Salvaguarda 2)
    if (this.processarEventoUseCase) {
      const perguntas = await this.perguntaRepo.findByDemandId(input.demandaId);
      const perguntasRespondidas = perguntas.filter((p) => p.status === StatusPerguntaClarificacao.RESPONDIDA).length;

      try {
        await this.processarEventoUseCase.execute({
          id_evento: `evento_${demanda.id}_req_homolog_${now}`,
          demanda_id: demanda.id,
          etapa_origem: EtapaOrigemEvidencia.REQUISITOS,
          categoria: 'REQUISITOS',
          tipo_evento: 'REQUISITOS_LEVANTAMENTO_HOMOLOGADO',
          ocorrido_em: now,
          executor: homologadoPor,
          artefato_origem_tipo: 'DEMANDA_REQUISITOS',
          artefato_origem_id: demanda.id,
          payload: {
            demandaId: demanda.id,
            homologadoPor,
            homologadoEm: now,
            justificativa: input.justificativa.trim(),
            ressalvas: input.ressalvas?.trim() || null,
            totalRequisitos: prontidao.totalRequisitos,
            totalObrigatorios: prontidao.totalObrigatorios,
            totalPerguntasRespondidas: perguntasRespondidas,
          },
          versao_contrato: '1.0',
        });
      } catch (err) {
        console.error('[EVIDENCE_EVENT_ERROR] Falha ao processar evento de homologação de requisitos:', err);
      }
    }

    return updated;
  }
}
