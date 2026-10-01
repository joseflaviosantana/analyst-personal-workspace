/**
 * src/core/domain/evidence-events/default-strategies/decisao-metodologica-strategy.ts
 *
 * Estratégia plugável para eventos de decisões metodológicas ou exceções analíticas.
 * Decisão metodológica ou interpretativa -> SOLICITAR_REVISAO_HUMANA.
 */

import {
  EventoAnalitico,
  DecisaoPoliticaCaptura,
  CandidatoEvidencia,
} from '../event-types';
import { IEstrategiaProcessamentoEvento } from '../event-strategy.interface';
import { TipoEvidenciaAnalitica } from '../../enums/tipo-evidencia-analitica';
import { EtapaOrigemEvidencia } from '../../enums/etapa-origem-evidencia';
import { ClassificacaoExposicaoEvidencia } from '../../enums/classificacao-exposicao-evidencia';

export interface PayloadDecisaoMetodologica {
  tituloDecisao: string;
  contextoProblema: string;
  escolhaAdotada: string;
  justificativaMetodologica: string;
  impactoEsperado?: string;
  classificacaoExposicao?: ClassificacaoExposicaoEvidencia;
}

export class DecisaoMetodologicaStrategy implements IEstrategiaProcessamentoEvento {
  readonly codigo = 'ESTRATEGIA_DECISAO_METODOLOGICA';
  readonly tiposSuportados = [
    'DECISAO_METODOLOGICA_REGISTRADA',
    'EXCECAO_MODELAGEM_DECLARADA',
  ] as const;

  avaliar(evento: EventoAnalitico): DecisaoPoliticaCaptura {
    const payload = evento.payload as Partial<PayloadDecisaoMetodologica> | undefined;
    if (!payload || !payload.tituloDecisao || !payload.justificativaMetodologica) {
      return {
        politica: 'IGNORAR',
        motivo: 'Decisão metodológica sem dados suficientes.',
        requer_intervencao_humana: false,
      };
    }

    return {
      politica: 'SOLICITAR_REVISAO_HUMANA',
      motivo:
        'Decisão metodológica ou interpretativa relevante requer homologação humana para validação.',
      requer_intervencao_humana: true,
    };
  }

  transformar(evento: EventoAnalitico): CandidatoEvidencia | null {
    const payload = evento.payload as Partial<PayloadDecisaoMetodologica> | undefined;
    if (!payload || !payload.tituloDecisao || !payload.justificativaMetodologica) {
      return null;
    }

    const classificacao =
      payload.classificacaoExposicao || ClassificacaoExposicaoEvidencia.INTERNA;

    return {
      tipo: TipoEvidenciaAnalitica.REVISAO,
      etapa_origem: evento.etapa_origem || EtapaOrigemEvidencia.MODELAGEM,
      artefato_origem_tipo: evento.artefato_origem_tipo || 'DECISAO_ARQUITETURAL',
      artefato_origem_id: evento.artefato_origem_id || null,
      titulo: `Deliberação Metodológica: ${payload.tituloDecisao}`,
      descricao: `Registro de escolha arquitetural/analítica: ${payload.escolhaAdotada || ''}.`,
      fato_observado: `Contexto do problema: ${payload.contextoProblema || 'Não detalhado'}.`,
      estado_anterior: null,
      acao_registrada: `Adotada a solução: ${payload.escolhaAdotada || ''}.`,
      estado_posterior: null,
      resultado_mensuravel: payload.impactoEsperado || null,
      inferencia_recomendacao: `Justificativa técnica declarada: ${payload.justificativaMetodologica}.`,
      decisao_humana: null, // Será preenchido quando o humano homologar no Evidence Core
      classificacao_exposicao: classificacao,
      elegibilidade_portfolio: false, // Inicia false até revisão
      metadados_adicionais: {
        tipo_deliberacao: evento.tipo_evento,
      },
    };
  }
}
