import { Demanda } from '@/core/domain/entities/demanda';
import { EstadoDemanda, isEstadoTerminal, normalizarEstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { UpdateDemandInput, updateDemandSchema } from '@/lib/validations/demand-schema';

export class UpdateDemandUseCase {
  constructor(private demandRepo: IDemandRepository) {}

  async execute(demandId: string, input: UpdateDemandInput): Promise<Demanda> {
    const validated = updateDemandSchema.parse(input);

    const existing = await this.demandRepo.findById(demandId);
    if (!existing) {
      throw new Error(`Demanda com ID '${demandId}' não foi encontrada.`);
    }

    const estadoNormalizado = normalizarEstadoDemanda(existing.estado);
    if (isEstadoTerminal(estadoNormalizado)) {
      const rotulo = estadoNormalizado === EstadoDemanda.CANCELADA ? 'canceladas' : 'concluídas';
      throw new Error(`Demandas ${rotulo} possuem histórico congelado e não permitem alteração de dados operacionais.`);
    }

    const updated = await this.demandRepo.update(demandId, validated);
    if (!updated) {
      throw new Error(`Falha ao atualizar a demanda '${demandId}'.`);
    }

    return updated;
  }
}
