/**
 * src/core/use-cases/evidence/consultar-log-eventos-demanda.use-case.ts
 *
 * Caso de Uso: Consultar Histórico do Event Log de uma Demanda (Subgate 3.5B.1).
 */

import { RegistroLogEventoAnalitico } from '@/core/domain/entities/evento-analitico-log';
import { IEventoAnaliticoLogRepository } from '@/core/domain/repositories/evento-analitico-log-repository.interface';

export class ConsultarLogEventosDemandaUseCase {
  constructor(private readonly eventLogRepo: IEventoAnaliticoLogRepository) {}

  async execute(demandaId: string): Promise<RegistroLogEventoAnalitico[]> {
    if (!demandaId || typeof demandaId !== 'string') {
      throw new Error('demandaId é obrigatório para consultar o log de eventos.');
    }

    return this.eventLogRepo.findByDemandaId(demandaId);
  }
}
