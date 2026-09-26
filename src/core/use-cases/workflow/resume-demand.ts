import { DemandaComProjeto } from '@/core/domain/entities/demanda';
import { EstadoDemanda, normalizarEstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { WorkflowEngine } from '@/core/domain/rules/workflow-engine';

export interface ResumeDemandInput {
  demandaId: string;
  justificativa: string;
}

export class ResumeDemandUseCase {
  constructor(
    private demandRepo: IDemandRepository,
    private auditRepo: IAuditRepository
  ) {}

  async execute(input: ResumeDemandInput): Promise<DemandaComProjeto> {
    const demand = await this.demandRepo.findById(input.demandaId);
    if (!demand) {
      throw new Error(`Não é possível retomar: Demanda '${input.demandaId}' não foi encontrada.`);
    }

    const estadoAtual = normalizarEstadoDemanda(demand.estado);
    if (estadoAtual !== EstadoDemanda.SUSPENSA) {
      throw new Error(`Apenas demandas no estado 'Suspensa' podem ser retomadas (estado atual: '${demand.estado}').`);
    }

    if (!demand.estado_anterior) {
      throw new Error('Não há registro do estado em que a demanda foi pausada. A retomada não pode ser concluída.');
    }

    const estadoDestino = normalizarEstadoDemanda(demand.estado_anterior);

    // Valida retomada estrita para o estado anterior exato
    WorkflowEngine.validarTransicao(EstadoDemanda.SUSPENSA, estadoDestino, {
      justificativa: input.justificativa,
      estadoAnterior: demand.estado_anterior,
    });

    const now = new Date().toISOString();

    // Restaura o estado anterior e limpa o campo transitório
    await this.demandRepo.update(demand.id, {
      estado: estadoDestino,
      estado_anterior: null,
    });

    // Registra evento de retomada na trilha de auditoria
    await this.auditRepo.record({
      demanda_id: demand.id,
      entidade: 'Demanda',
      entidade_id: demand.id,
      tipo_evento: 'TRANSICAO_ESTADO',
      autor_tipo: 'HUMANO',
      dados_anteriores: JSON.stringify({ estado: EstadoDemanda.SUSPENSA, estado_anterior: demand.estado_anterior }),
      dados_novos: JSON.stringify({ estado: estadoDestino }),
      justificativa: input.justificativa,
      timestamp: now,
    });

    const updated = await this.demandRepo.findById(demand.id);
    if (!updated) {
      throw new Error('Falha ao recuperar a demanda após a retomada.');
    }

    return updated;
  }
}
