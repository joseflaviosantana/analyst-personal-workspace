/**
 * src/core/domain/evidence-events/default-strategies/qualidade-regra-strategy.ts
 *
 * Estratégia plugável para eventos de regras de qualidade executadas.
 * Fato objetivo e verificável -> REGISTRAR_AUTOMATICAMENTE.
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

export interface PayloadRegraQualidade {
  regraNome: string;
  ativoNome: string;
  totalLinhasAvaliadas: number;
  totalNaoConformidades: number;
  taxaConformidade: number; // 0 a 100
  severidade?: string;
  detalheFato?: string;
  acaoExecutada?: string;
  classificacaoExposicao?: ClassificacaoExposicaoEvidencia;
}

export class QualidadeRegraStrategy implements IEstrategiaProcessamentoEvento {
  readonly codigo = 'ESTRATEGIA_QUALIDADE_REGRA_EXECUTADA';
  readonly tiposSuportados = ['QUALIDADE_REGRA_EXECUTADA'] as const;

  avaliar(evento: EventoAnalitico): DecisaoPoliticaCaptura {
    const payload = evento.payload as Partial<PayloadRegraQualidade> | undefined;
    if (
      !payload ||
      typeof payload.regraNome !== 'string' ||
      typeof payload.taxaConformidade !== 'number'
    ) {
      return {
        politica: 'IGNORAR',
        motivo: 'Evento de qualidade sem payload estruturado válido.',
        requer_intervencao_humana: false,
      };
    }

    return {
      politica: 'REGISTRAR_AUTOMATICAMENTE',
      motivo: 'Fato objetivo e verificável de conformidade de qualidade de dados.',
      requer_intervencao_humana: false,
    };
  }

  transformar(evento: EventoAnalitico): CandidatoEvidencia | null {
    const payload = evento.payload as Partial<PayloadRegraQualidade> | undefined;
    if (
      !payload ||
      !payload.regraNome ||
      typeof payload.taxaConformidade !== 'number' ||
      typeof payload.totalLinhasAvaliadas !== 'number'
    ) {
      // Rigor epistêmico: se dados faltam, não inventa
      return null;
    }

    const classificacao =
      payload.classificacaoExposicao || ClassificacaoExposicaoEvidencia.INTERNA;

    // Salvaguarda: CONFIDENCIAL nunca vira portfólio
    const elegivelPortfolio =
      classificacao === ClassificacaoExposicaoEvidencia.CONFIDENCIAL
        ? false
        : payload.taxaConformidade === 100;

    return {
      tipo: TipoEvidenciaAnalitica.QUALIDADE,
      etapa_origem: EtapaOrigemEvidencia.QUALIDADE,
      artefato_origem_tipo: evento.artefato_origem_tipo || 'REGRA_QUALIDADE',
      artefato_origem_id: evento.artefato_origem_id || null,
      titulo: `Conformidade da Regra de Qualidade: ${payload.regraNome}`,
      descricao: `Avaliação automatizada de qualidade sobre o ativo "${payload.ativoNome || 'Ativo de Dados'}".`,
      fato_observado:
        payload.detalheFato ||
        `Regra "${payload.regraNome}" executada sobre ${payload.totalLinhasAvaliadas} registros com taxa de conformidade de ${payload.taxaConformidade}%.`,
      estado_anterior: null,
      acao_registrada:
        payload.acaoExecutada ||
        `Execução de verificação estática de regra de negócio "${payload.regraNome}".`,
      estado_posterior: `${payload.totalNaoConformidades ?? 0} não conformidades detectadas.`,
      resultado_mensuravel: `Taxa = ${payload.taxaConformidade}% | Linhas avaliadas = ${payload.totalLinhasAvaliadas}`,
      inferencia_recomendacao:
        payload.taxaConformidade < 100
          ? 'Recomenda-se tratamento e deliberação humana na esteira de Preparação.'
          : 'Regra plenamente conforme com os padrões analíticos.',
      decisao_humana: null,
      classificacao_exposicao: classificacao,
      elegibilidade_portfolio: elegivelPortfolio,
      metadados_adicionais: {
        total_avaliado: payload.totalLinhasAvaliadas,
        total_inconforme: payload.totalNaoConformidades,
        taxa_conformidade: payload.taxaConformidade,
      },
    };
  }
}
