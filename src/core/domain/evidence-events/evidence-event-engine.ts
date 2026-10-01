/**
 * src/core/domain/evidence-events/evidence-event-engine.ts
 *
 * Evidence Event Engine — Núcleo Canônico de Processamento de Eventos (Subgate 3.5B.1).
 *
 * Responsável por:
 * 1. Manter o registro plugável de estratégias de evento;
 * 2. Avaliar deterministicamente políticas de captura (IGNORAR, REGISTRAR_AUTOMATICAMENTE, SOLICITAR_REVISAO_HUMANA);
 * 3. Transformar eventos analíticos em candidatos a evidência preservando rigor epistêmico e proveniência;
 * 4. Garantir que inferências e dados incompletos nunca gerem fatos falsos ou inventados.
 */

import {
  EventoAnalitico,
  DecisaoPoliticaCaptura,
  CandidatoEvidencia,
} from './event-types';
import { IEstrategiaProcessamentoEvento } from './event-strategy.interface';
import { ClassificacaoExposicaoEvidencia } from '../enums/classificacao-exposicao-evidencia';

export class EvidenceEventEngine {
  private readonly estrategias = new Map<string, IEstrategiaProcessamentoEvento>();

  constructor(estrategiasIniciais: IEstrategiaProcessamentoEvento[] = []) {
    for (const est of estrategiasIniciais) {
      this.registrarEstrategia(est);
    }
  }

  /**
   * Registra dinamicamente uma estratégia para processamento de eventos
   */
  registrarEstrategia(estrategia: IEstrategiaProcessamentoEvento): void {
    if (!estrategia || !estrategia.tiposSuportados) {
      throw new Error('Estratégia inválida fornecida ao Evidence Event Engine.');
    }

    for (const tipo of estrategia.tiposSuportados) {
      this.estrategias.set(tipo, estrategia);
    }
  }

  /**
   * Retorna a estratégia registrada para o tipo de evento ou null
   */
  obterEstrategia(tipoEvento: string): IEstrategiaProcessamentoEvento | null {
    return this.estrategias.get(tipoEvento) || null;
  }

  /**
   * Avalia deterministicamente a política de captura para um evento analítico
   */
  avaliarPolitica(evento: EventoAnalitico): DecisaoPoliticaCaptura {
    this.validarContratoBasicoEvento(evento);

    const estrategia = this.obterEstrategia(evento.tipo_evento);
    if (!estrategia) {
      return {
        politica: 'IGNORAR',
        motivo: `Nenhuma estratégia plugável registrada para o tipo de evento "${evento.tipo_evento}".`,
        requer_intervencao_humana: false,
      };
    }

    return estrategia.avaliar(evento);
  }

  /**
   * Processa o evento e gera um Candidato a Evidência estruturado com proveniência completa
   */
  gerarCandidatoEvidencia(evento: EventoAnalitico): {
    candidato: CandidatoEvidencia | null;
    decisao: DecisaoPoliticaCaptura;
  } {
    this.validarContratoBasicoEvento(evento);

    const decisao = this.avaliarPolitica(evento);

    if (decisao.politica === 'IGNORAR') {
      return { candidato: null, decisao };
    }

    const estrategia = this.obterEstrategia(evento.tipo_evento);
    if (!estrategia) {
      return {
        candidato: null,
        decisao: {
          politica: 'IGNORAR',
          motivo: 'Estratégia não localizada na etapa de transformação.',
          requer_intervencao_humana: false,
        },
      };
    }

    const candidatoBruto = estrategia.transformar(evento);
    if (!candidatoBruto) {
      return {
        candidato: null,
        decisao: {
          politica: 'IGNORAR',
          motivo: 'Evento não gerou evidência por dados ausentes ou incompletos no payload.',
          requer_intervencao_humana: false,
        },
      };
    }

    // Regra de segurança inegociável: CONFIDENCIAL jamais vira portfólio
    const classificacao =
      candidatoBruto.classificacao_exposicao || ClassificacaoExposicaoEvidencia.INTERNA;
    const elegibilidadePortfolio =
      classificacao === ClassificacaoExposicaoEvidencia.CONFIDENCIAL
        ? false
        : Boolean(candidatoBruto.elegibilidade_portfolio);

    // Injeta metadados canônicos de proveniência
    const metadadosProveniencia: Record<string, unknown> = {
      ...(candidatoBruto.metadados_adicionais || {}),
      evento_origem_id: evento.id_evento,
      evento_tipo: evento.tipo_evento,
      etapa_origem_evento: evento.etapa_origem,
      categoria_evento: evento.categoria,
      executor_evento: evento.executor,
      ocorrido_em_evento: evento.ocorrido_em,
      correlation_id: evento.correlation_id || null,
      causation_id: evento.causation_id || null,
      versao_contrato_evento: evento.versao_contrato,
      politica_captura_aplicada: decisao.politica,
      motivo_politica: decisao.motivo,
    };

    const candidatoFinal: CandidatoEvidencia = {
      ...candidatoBruto,
      classificacao_exposicao: classificacao,
      elegibilidade_portfolio: elegibilidadePortfolio,
      metadados_adicionais: metadadosProveniencia,
    };

    return { candidato: candidatoFinal, decisao };
  }

  /**
   * Validações mínimas do contrato canônico de evento analítico
   */
  private validarContratoBasicoEvento(evento: EventoAnalitico): void {
    if (!evento) {
      throw new Error('Evento analítico não fornecido.');
    }
    if (!evento.id_evento || typeof evento.id_evento !== 'string') {
      throw new Error('Evento analítico inválido: "id_evento" é obrigatório.');
    }
    if (!evento.demanda_id || typeof evento.demanda_id !== 'string') {
      throw new Error('Evento analítico inválido: "demanda_id" é obrigatório.');
    }
    if (!evento.tipo_evento || typeof evento.tipo_evento !== 'string') {
      throw new Error('Evento analítico inválido: "tipo_evento" é obrigatório.');
    }
    if (!evento.ocorrido_em || typeof evento.ocorrido_em !== 'string') {
      throw new Error('Evento analítico inválido: "ocorrido_em" é obrigatório.');
    }
  }
}
