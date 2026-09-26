import { DemandaComProjeto } from '@/core/domain/entities/demanda';
import { EstadoDemanda, normalizarEstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { WorkflowEngine } from '@/core/domain/rules/workflow-engine';

export interface SuspendDemandInput {
  demandaId: string;
  justificativa: string;
}

export class SuspendDemandUseCase {
  constructor(
    private demandRepo: IDemandRepository,
    private auditRepo: IAuditRepository
  ) {}

  async execute(input: SuspendDemandInput): Promise<DemandaComProjeto> {
    const demand = await this.demandRepo.findById(input.demandaId);
    if (!demand) {
      throw new Error(`Não é possível suspender: Demanda '${input.demandaId}' não foi encontrada.`);
    }

    const estadoAtual = normalizarEstadoDemanda(demand.estado);

    // Valida suspensão pelo WorkflowEngine (exige justificativa mandatória e estado não terminal)
    WorkflowEngine.validarTransicao(estadoAtual, EstadoDemanda.SUSPENSA, {
      justificativa: input.justificativa,
    });

    const now = new Date().toISOString();

    // Salva o estado atual em estado_anterior e move para SUSPENSA
    await this.demandRepo.update(demand.id, {
      estado: EstadoDemanda.SUSPENSA,
      estado_anterior: estadoAtual,
    });

    // Grava o evento na trilha de auditoria
    await this.auditRepo.record({
      demanda_id: demand.id,
      entidade: 'Demanda',
      entidade_id: demand.id,
      tipo_evento: 'TRANSICAO_ESTADO',
      autor_tipo: 'HUMANO',
      dados_anteriores: JSON.stringify({ estado: estadoAtual }),
      dados_novos: JSON.stringify({ estado: EstadoDemanda.SUSPENSA, estado_anterior: estadoAtual }),
      justificativa: input.justificativa,
      timestamp: now,
    });

    const updated = await this.demandRepo.findById(demand.id);
    if (!updated) {
      throw new Error('Falha ao recuperar a demanda após a suspensão.');
    }

    return updated;
  }
}
