/**
 * src/core/domain/evidence-events/default-strategies/evento-tecnico-ignorado-strategy.ts
 *
 * Estratégia plugável para eventos puramente operacionais ou de telemetria técnica.
 * Evento puramente técnico sem valor como evidência analítica -> IGNORAR.
 */

import {
  EventoAnalitico,
  DecisaoPoliticaCaptura,
  CandidatoEvidencia,
} from '../event-types';
import { IEstrategiaProcessamentoEvento } from '../event-strategy.interface';

export class EventoTecnicoIgnoradoStrategy implements IEstrategiaProcessamentoEvento {
  readonly codigo = 'ESTRATEGIA_EVENTO_TECNICO_IGNORADO';
  readonly tiposSuportados = [
    'SISTEMA_LOG_TELEMETRIA',
    'PAGINA_VISUALIZADA',
    'CACHE_INVALIDADO',
    'HEARTBEAT_STATUS',
  ] as const;

  avaliar(_evento: EventoAnalitico): DecisaoPoliticaCaptura {
    return {
      politica: 'IGNORAR',
      motivo: 'Evento estritamente técnico ou operacional sem valor factual para auditoria analítica.',
      requer_intervencao_humana: false,
    };
  }

  transformar(_evento: EventoAnalitico): CandidatoEvidencia | null {
    return null;
  }
}
