/**
 * src/core/domain/evidence-events/event-strategy.interface.ts
 *
 * Contrato de Estratégia Plugável para processamento de Eventos Analíticos.
 * Permite que novos tipos e regras de eventos sejam acoplados sem modificar
 * o núcleo do Evidence Event Engine.
 */

import {
  EventoAnalitico,
  DecisaoPoliticaCaptura,
  CandidatoEvidencia,
} from './event-types';

export interface IEstrategiaProcessamentoEvento {
  /**
   * Código de identificação único da estratégia
   */
  readonly codigo: string;

  /**
   * Lista de tipos de evento que esta estratégia é responsável por processar
   */
  readonly tiposSuportados: readonly string[];

  /**
   * Avalia deterministicamente a política de captura para o evento
   */
  avaliar(evento: EventoAnalitico): DecisaoPoliticaCaptura;

  /**
   * Transforma o evento em um candidato estruturado a evidência.
   * Se o evento for incompleto ou não produzir evidência, retorna null sem inventar dados.
   */
  transformar(evento: EventoAnalitico): CandidatoEvidencia | null;
}
