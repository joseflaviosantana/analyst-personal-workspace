/**
 * src/core/domain/entities/evento-analitico-log.ts
 *
 * Entidade de auditoria e idempotência de eventos analíticos processados (Event Log).
 */

import { PoliticaCaptura } from '../evidence-events/event-types';

export type StatusProcessamentoEvento =
  | 'REGISTRADO'
  | 'AGUARDANDO_REVISAO'
  | 'IGNORADO'
  | 'DUPLICADO'
  | 'ERRO';

export interface RegistroLogEventoAnalitico {
  id: string;
  id_evento: string; // Chave de idempotência (UUID original do evento)
  demanda_id: string;
  projeto_id?: string | null;
  tipo_evento: string;
  etapa_origem: string;
  politica_aplicada: PoliticaCaptura;
  status_processamento: StatusProcessamentoEvento;
  evidencia_gerada_id?: string | null;
  correlation_id?: string | null;
  causation_id?: string | null;
  motivo?: string | null;
  erro_detalhe?: string | null;
  payload_snapshot?: Record<string, unknown> | null;
  processado_em: string;
}
