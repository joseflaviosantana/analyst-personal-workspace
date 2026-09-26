import { DemandaComProjeto } from '@/core/domain/entities/demanda';
import { EstadoDemanda, normalizarEstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { WorkflowEngine, ContextoTransicao } from '@/core/domain/rules/workflow-engine';

export interface TransitionDemandStateInput {
  demandaId: string;
  novoEstado: EstadoDemanda | string;
  justificativa?: string | null;
  autorTipo?: 'HUMANO' | 'IA';
  contextoExtra?: Omit<ContextoTransicao, 'justificativa' | 'estadoAnterior'>;
}

export class TransitionDemandStateUseCase {
  constructor(
    private demandRepo: IDemandRepository,
    private auditRepo: IAuditRepository
  ) {}

  async execute(input: TransitionDemandStateInput): Promise<DemandaComProjeto> {
    const demand = await this.demandRepo.findById(input.demandaId);
    if (!demand) {
      throw new Error(`Não é possível realizar a transição: Demanda '${input.demandaId}' não foi encontrada.`);
    }

    const estadoDestino = normalizarEstadoDemanda(input.novoEstado);
    const estadoOrigem = normalizarEstadoDemanda(demand.estado);

    // Valida transição segundo as regras do WorkflowEngine
    WorkflowEngine.validarTransicao(estadoOrigem, estadoDestino, {
      justificativa: input.justificativa,
      estadoAnterior: demand.estado_anterior,
      ...input.contextoExtra,
    });

    const now = new Date().toISOString();
    const isConcluindo = estadoDestino === EstadoDemanda.CONCLUIDA;

    // Atualiza estado no repositório de persistência
    await this.demandRepo.update(demand.id, {
      estado: estadoDestino,
      data_conclusao: isConcluindo ? now : demand.data_conclusao,
    });

    // Grava compulsoriamente o evento na trilha de auditoria (ADR-002 Seção 4.5 e 10.1)
    await this.auditRepo.record({
      demanda_id: demand.id,
      entidade: 'Demanda',
      entidade_id: demand.id,
      tipo_evento: 'TRANSICAO_ESTADO',
      autor_tipo: input.autorTipo ?? 'HUMANO',
      dados_anteriores: JSON.stringify({ estado: estadoOrigem }),
      dados_novos: JSON.stringify({ estado: estadoDestino }),
      justificativa: input.justificativa ?? 'Avanço normal de estado no workflow.',
      timestamp: now,
    });

    const updated = await this.demandRepo.findById(demand.id);
    if (!updated) {
      throw new Error('Falha ao recuperar a demanda após a transição de estado.');
    }

    return updated;
  }
}
