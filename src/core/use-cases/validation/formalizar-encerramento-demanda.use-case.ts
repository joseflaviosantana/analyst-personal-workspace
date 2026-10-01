import { DemandaComProjeto } from '@/core/domain/entities/demanda';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { IEntregavelDemandaRepository } from '@/core/domain/repositories/entregavel-demanda-repository.interface';
import { IValidacaoConciliacaoRepository } from '@/core/domain/repositories/validacao-conciliacao-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { ProcessarEventoAnaliticoUseCase } from '@/core/use-cases/evidence';
import { ValidationRulesEvaluator } from '@/core/domain/rules/validation-rules-evaluator';
import { WorkflowEngine } from '@/core/domain/rules/workflow-engine';
import { StatusAceiteEntrega } from '@/core/domain/enums/status-aceite-entrega';
import { EtapaOrigemEvidencia } from '@/core/domain/enums/etapa-origem-evidencia';
import { EventoAnalitico } from '@/core/domain/evidence-events';

export interface FormalizarEncerramentoDemandaInput {
  demandaId: string;
  justificativa?: string | null;
  autorTipo?: 'HUMANO' | 'IA';
}

/**
 * Caso de Uso Canônico: Formalização de Encerramento da Demanda (Transição Soberana para CONCLUIDA)
 *
 * Responsabilidades:
 * 1. Avaliação factual e determinística das regras V-03 e V-04 (prontidão para conclusão);
 * 2. Validação da transição pelo WorkflowEngine;
 * 3. Garantia de deliberação humana com justificativa formal;
 * 4. Persistência atômica do estado CONCLUIDA, estado anterior e data_conclusao;
 * 5. Registro na trilha de auditoria;
 * 6. Emissão determinística do evento analítico ENTREGA_ENCERRAMENTO_FORMALIZADO para o Evidence Event Engine;
 * 7. Idempotência: caso a demanda já esteja concluída, retorna sem mutações ou eventos duplicados.
 */
export class FormalizarEncerramentoDemandaUseCase {
  constructor(
    private demandRepo: IDemandRepository,
    private entregavelRepo: IEntregavelDemandaRepository,
    private validacaoRepo: IValidacaoConciliacaoRepository,
    private auditRepo: IAuditRepository,
    private processarEventoUseCase?: ProcessarEventoAnaliticoUseCase
  ) {}

  async execute(input: FormalizarEncerramentoDemandaInput): Promise<DemandaComProjeto> {
    const demanda = await this.demandRepo.findById(input.demandaId);
    if (!demanda) {
      throw new Error(`Demanda com ID '${input.demandaId}' não encontrada.`);
    }

    // 1. Idempotência canônica: se a demanda já estiver CONCLUIDA, retorna imediatamente
    if (demanda.estado === EstadoDemanda.CONCLUIDA) {
      return demanda;
    }

    // 2. Avaliação factual de integridade das regras V-03 e V-04
    const [validacoes, entregaveis] = await Promise.all([
      this.validacaoRepo.findByDemandId(input.demandaId),
      this.entregavelRepo.findByDemandId(input.demandaId),
    ]);

    const avaliacao = ValidationRulesEvaluator.avaliar(validacoes, entregaveis);

    // 3. Validação da transição pelo motor de workflow
    WorkflowEngine.validarTransicao(demanda.estado, EstadoDemanda.CONCLUIDA, {
      justificativa: input.justificativa,
      avaliacaoValidacao: avaliacao,
    });

    const now = new Date().toISOString();
    const justificativaFinal =
      input.justificativa?.trim() || 'Encerramento formal soberano após aceite integral dos entregáveis.';

    // 4. Persistência de CONCLUIDA, estado_anterior e data_conclusao
    await this.demandRepo.update(input.demandaId, {
      estado: EstadoDemanda.CONCLUIDA,
      estado_anterior: demanda.estado,
      data_conclusao: now,
    });

    // 5. Trilha de auditoria obrigatória
    await this.auditRepo.record({
      demanda_id: input.demandaId,
      entidade: 'demandas',
      entidade_id: input.demandaId,
      tipo_evento: 'TRANSICAO_ESTADO',
      autor_tipo: input.autorTipo ?? 'HUMANO',
      dados_anteriores: JSON.stringify({ estado: demanda.estado }),
      dados_novos: JSON.stringify({ estado: EstadoDemanda.CONCLUIDA, data_conclusao: now }),
      justificativa: justificativaFinal,
      timestamp: now,
    });

    // 6. Emissão determinística de ENTREGA_ENCERRAMENTO_FORMALIZADO via Evidence Event Engine
    if (this.processarEventoUseCase) {
      try {
        const aceitos = entregaveis.filter((e) => e.aceite_status === StatusAceiteEntrega.ACEITO);
        const evento: EventoAnalitico = {
          id_evento: `evt_ent_concluida_${input.demandaId}_${now}`,
          demanda_id: input.demandaId,
          projeto_id: demanda.projeto_id || null,
          etapa_origem: EtapaOrigemEvidencia.ENTREGA,
          categoria: 'ENTREGA',
          tipo_evento: 'ENTREGA_ENCERRAMENTO_FORMALIZADO',
          ocorrido_em: now,
          executor: input.autorTipo === 'IA' ? 'SISTEMA' : 'ANALISTA',
          artefato_origem_tipo: 'DEMANDA',
          artefato_origem_id: input.demandaId,
          payload: {
            demandaId: input.demandaId,
            demandaTitulo: demanda.titulo,
            dataConclusao: now,
            totalEntregaveisHomologados: aceitos.length,
          },
          versao_contrato: '1.0',
        };

        await this.processarEventoUseCase.execute(evento);
      } catch (evtErr: unknown) {
        console.warn('[EvidenceEventEngine] Falha ao despachar evento ENTREGA_ENCERRAMENTO_FORMALIZADO:', evtErr);
      }
    }

    const updated = await this.demandRepo.findById(input.demandaId);
    if (!updated) {
      throw new Error('Falha ao recuperar a demanda após formalização do encerramento.');
    }

    return updated;
  }
}
