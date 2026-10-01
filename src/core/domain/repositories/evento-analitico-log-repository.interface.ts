/**
 * src/core/domain/repositories/evento-analitico-log-repository.interface.ts
 *
 * Contrato do repositório para o Event Log (Subgate 3.5B.1).
 */

import { RegistroLogEventoAnalitico } from '../entities/evento-analitico-log';

export interface IEventoAnaliticoLogRepository {
  /**
   * Busca registro pelo ID original do evento (garantia de idempotência)
   */
  findByIdEvento(idEvento: string): Promise<RegistroLogEventoAnalitico | null>;

  /**
   * Lista todos os eventos processados para uma demanda em ordem cronológica decrescente
   */
  findByDemandaId(demandaId: string): Promise<RegistroLogEventoAnalitico[]>;

  /**
   * Registra a execução no Event Log
   */
  create(registro: RegistroLogEventoAnalitico): Promise<RegistroLogEventoAnalitico>;
}
