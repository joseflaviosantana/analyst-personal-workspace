import { DemandaComProjeto } from '@/core/domain/entities/demanda';
import { EstadoDemanda, normalizarEstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { WorkflowEngine } from '@/core/domain/rules/workflow-engine';

export interface CancelDemandInput {
  demandaId: string;
  justificativa: string;
}

export class CancelDemandUseCase {
  constructor(
    private demandRepo: IDemandRepository,
    private auditRepo: IAuditRepository
  ) {}

  async execute(input: CancelDemandInput): Promise<DemandaComProjeto> {
    const demand = await this.demandRepo.findById(input.demandaId);
    if (!demand) {
      throw new Error(`Não é possível cancelar: Demanda '${input.demandaId}' não foi encontrada.`);
    }

    const estadoAtual = normalizarEstadoDemanda(demand.estado);

    // Valida cancelamento pelo WorkflowEngine (exige justificativa mandatória e impede cancelar demanda concluída/já cancelada)
    WorkflowEngine.validarTransicao(estadoAtual, EstadoDemanda.CANCELADA, {
      justificativa: input.justificativa,
    });

    const now = new Date().toISOString();

    // Atualiza demanda para o estado terminal CANCELADA e encerra data
    await this.demandRepo.update(demand.id, {
      estado: EstadoDemanda.CANCELADA,
      data_conclusao: now,
    });

    // Grava cancelamento e congelamento de histórico na trilha de auditoria
    await this.auditRepo.record({
      demanda_id: demand.id,
      entidade: 'Demanda',
      entidade_id: demand.id,
      tipo_evento: 'TRANSICAO_ESTADO',
      autor_tipo: 'HUMANO',
      dados_anteriores: JSON.stringify({ estado: estadoAtual }),
      dados_novos: JSON.stringify({ estado: EstadoDemanda.CANCELADA }),
      justificativa: input.justificativa,
      timestamp: now,
    });

    const updated = await this.demandRepo.findById(demand.id);
    if (!updated) {
      throw new Error('Falha ao recuperar a demanda após o cancelamento.');
    }

    return updated;
  }
}
