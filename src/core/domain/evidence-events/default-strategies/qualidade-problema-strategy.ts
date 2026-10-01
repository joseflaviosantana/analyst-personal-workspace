/**
 * src/core/domain/evidence-events/default-strategies/qualidade-problema-strategy.ts
 *
 * Estratégia plugável para eventos de Problemas de Qualidade (Subgate 3.5B.2).
 * Cobre:
 * - QUALIDADE_PROBLEMA_DELIBERADO (deliberação humana de severidade e ação)
 * - QUALIDADE_PROBLEMA_RESOLVIDO (saneamento de anomalia)
 * - QUALIDADE_ANOMALIA_MANUAL_REGISTRADA (apontamento manual aguardando deliberação)
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

export interface PayloadProblemaDeliberado {
  problemaId: string;
  titulo: string;
  tabelaAfetada: string;
  colunaAfetada?: string | null;
  totalLinhasAfetadas?: number;
  percentualLinhasAfetadas?: number;
  severidade: string;
  acaoDeliberada: string;
  justificativa: string;
  impactoCalculo?: string | null;
  deliberadoEm: string;
  classificacaoExposicao?: ClassificacaoExposicaoEvidencia;
}

export interface PayloadProblemaResolvido {
  problemaId: string;
  titulo: string;
  tabelaAfetada: string;
  statusAnterior: string;
  novoStatus: string;
  justificativa: string;
  atualizadoEm: string;
  classificacaoExposicao?: ClassificacaoExposicaoEvidencia;
}

export interface PayloadAnomaliaManualRegistrada {
  problemaId: string;
  titulo: string;
  descricao: string;
  tabelaAfetada: string;
  colunaAfetada?: string | null;
  totalLinhasAfetadas?: number;
  percentualLinhasAfetadas?: number;
  classificacaoExposicao?: ClassificacaoExposicaoEvidencia;
}

export class QualidadeProblemaStrategy implements IEstrategiaProcessamentoEvento {
  readonly codigo = 'ESTRATEGIA_QUALIDADE_PROBLEMA';
  readonly tiposSuportados = [
    'QUALIDADE_PROBLEMA_DELIBERADO',
    'QUALIDADE_PROBLEMA_RESOLVIDO',
    'QUALIDADE_ANOMALIA_MANUAL_REGISTRADA',
  ] as const;

  avaliar(evento: EventoAnalitico): DecisaoPoliticaCaptura {
    if (evento.tipo_evento === 'QUALIDADE_PROBLEMA_DELIBERADO') {
      const payload = evento.payload as Partial<PayloadProblemaDeliberado> | undefined;
      if (
        !payload ||
        !payload.problemaId ||
        !payload.severidade ||
        !payload.acaoDeliberada ||
        !payload.justificativa
      ) {
        return {
          politica: 'IGNORAR',
          motivo: 'Evento de deliberação de problema sem dados essenciais ou justificativa.',
          requer_intervencao_humana: false,
        };
      }

      return {
        politica: 'REGISTRAR_AUTOMATICAMENTE',
        motivo: 'Deliberação humana soberana concluída com severidade definitiva e justificativa técnica formal.',
        requer_intervencao_humana: false,
      };
    }

    if (evento.tipo_evento === 'QUALIDADE_PROBLEMA_RESOLVIDO') {
      const payload = evento.payload as Partial<PayloadProblemaResolvido> | undefined;
      if (
        !payload ||
        !payload.problemaId ||
        !payload.justificativa ||
        (payload.novoStatus !== 'RESOLVIDO' && payload.novoStatus !== 'TRATADO')
      ) {
        return {
          politica: 'IGNORAR',
          motivo: 'Evento de resolução de anomalia sem payload válido ou status não resolvido/tratado.',
          requer_intervencao_humana: false,
        };
      }

      return {
        politica: 'REGISTRAR_AUTOMATICAMENTE',
        motivo: 'Fato de saneamento e resolução de anomalia de qualidade comprovada com justificativa.',
        requer_intervencao_humana: false,
      };
    }

    if (evento.tipo_evento === 'QUALIDADE_ANOMALIA_MANUAL_REGISTRADA') {
      const payload = evento.payload as Partial<PayloadAnomaliaManualRegistrada> | undefined;
      if (!payload || !payload.problemaId || !payload.titulo || !payload.descricao) {
        return {
          politica: 'IGNORAR',
          motivo: 'Evento de anomalia manual sem identificador, título ou descrição.',
          requer_intervencao_humana: false,
        };
      }

      return {
        politica: 'SOLICITAR_REVISAO_HUMANA',
        motivo: 'Anomalia de qualidade registrada manualmente com severidade PENDENTE requer deliberação técnica.',
        requer_intervencao_humana: true,
      };
    }

    return {
      politica: 'IGNORAR',
      motivo: `Tipo de evento "${evento.tipo_evento}" não reconhecido por QualidadeProblemaStrategy.`,
      requer_intervencao_humana: false,
    };
  }

  transformar(evento: EventoAnalitico): CandidatoEvidencia | null {
    if (evento.tipo_evento === 'QUALIDADE_PROBLEMA_DELIBERADO') {
      const payload = evento.payload as Partial<PayloadProblemaDeliberado> | undefined;
      if (
        !payload ||
        !payload.problemaId ||
        !payload.severidade ||
        !payload.acaoDeliberada ||
        !payload.justificativa
      ) {
        return null;
      }

      const classificacao =
        payload.classificacaoExposicao || ClassificacaoExposicaoEvidencia.INTERNA;

      return {
        tipo: TipoEvidenciaAnalitica.QUALIDADE,
        etapa_origem: EtapaOrigemEvidencia.QUALIDADE,
        artefato_origem_tipo: 'PROBLEMA_QUALIDADE',
        artefato_origem_id: payload.problemaId,
        titulo: `Deliberação de Qualidade: ${payload.titulo || 'Anomalia'}`,
        descricao: `Deliberação humana formal sobre anomalia na tabela "${payload.tabelaAfetada || 'Geral'}".`,
        fato_observado: `Anomalia "${payload.titulo || 'Sem título'}" identificada na tabela "${payload.tabelaAfetada || 'Geral'}"${payload.colunaAfetada ? `, coluna "${payload.colunaAfetada}"` : ''}, afetando ${payload.totalLinhasAfetadas ?? 0} linha(s) (${payload.percentualLinhasAfetadas ?? 0}%).`,
        estado_anterior: 'Severidade PENDENTE | Sem deliberação formal.',
        acao_registrada: `Deliberação soberana: Severidade definida como "${payload.severidade}" e Ação designada como "${payload.acaoDeliberada}".`,
        estado_posterior: `Severidade definitiva: ${payload.severidade}. Deliberado por humano.`,
        resultado_mensuravel: `Severidade: ${payload.severidade} | Ação: ${payload.acaoDeliberada}${payload.impactoCalculo ? ` | Impacto: ${payload.impactoCalculo}` : ''}`,
        inferencia_recomendacao: 'Seguir com o tratamento ou aceite da anomalia conforme a ação deliberada.',
        decisao_humana: payload.justificativa,
        classificacao_exposicao: classificacao,
        elegibilidade_portfolio: classificacao !== ClassificacaoExposicaoEvidencia.CONFIDENCIAL,
        metadados_adicionais: {
          problema_id: payload.problemaId,
          severidade: payload.severidade,
          acao_deliberada: payload.acaoDeliberada,
          justificativa: payload.justificativa,
          impacto_calculo: payload.impactoCalculo || null,
          deliberado_em: payload.deliberadoEm,
        },
      };
    }

    if (evento.tipo_evento === 'QUALIDADE_PROBLEMA_RESOLVIDO') {
      const payload = evento.payload as Partial<PayloadProblemaResolvido> | undefined;
      if (!payload || !payload.problemaId || !payload.justificativa) {
        return null;
      }

      const classificacao =
        payload.classificacaoExposicao || ClassificacaoExposicaoEvidencia.INTERNA;

      return {
        tipo: TipoEvidenciaAnalitica.QUALIDADE,
        etapa_origem: EtapaOrigemEvidencia.QUALIDADE,
        artefato_origem_tipo: 'PROBLEMA_QUALIDADE',
        artefato_origem_id: payload.problemaId,
        titulo: `Problema de Qualidade Resolvido: ${payload.titulo || 'Anomalia'}`,
        descricao: `Encerramento e saneamento de problema de qualidade na tabela "${payload.tabelaAfetada || 'Geral'}".`,
        fato_observado: `Problema "${payload.titulo || 'Anomalia'}" na tabela "${payload.tabelaAfetada || 'Geral'}" teve sua resolução concluída.`,
        estado_anterior: `Status anterior: ${payload.statusAnterior || 'ABERTO'}.`,
        acao_registrada: `Atualização de status para RESOLVIDO com justificativa formal: "${payload.justificativa}".`,
        estado_posterior: 'Status atual: RESOLVIDO.',
        resultado_mensuravel: `Problema saneado. Status: RESOLVIDO.`,
        inferencia_recomendacao: 'Anomalia tratada e verificada com sucesso.',
        decisao_humana: payload.justificativa,
        classificacao_exposicao: classificacao,
        elegibilidade_portfolio: classificacao !== ClassificacaoExposicaoEvidencia.CONFIDENCIAL,
        metadados_adicionais: {
          problema_id: payload.problemaId,
          status_anterior: payload.statusAnterior,
          novo_status: payload.novoStatus,
          justificativa: payload.justificativa,
          atualizado_em: payload.atualizadoEm,
        },
      };
    }

    if (evento.tipo_evento === 'QUALIDADE_ANOMALIA_MANUAL_REGISTRADA') {
      const payload = evento.payload as Partial<PayloadAnomaliaManualRegistrada> | undefined;
      if (!payload || !payload.problemaId || !payload.titulo || !payload.descricao) {
        return null;
      }

      const classificacao =
        payload.classificacaoExposicao || ClassificacaoExposicaoEvidencia.INTERNA;

      return {
        tipo: TipoEvidenciaAnalitica.QUALIDADE,
        etapa_origem: EtapaOrigemEvidencia.QUALIDADE,
        artefato_origem_tipo: 'PROBLEMA_QUALIDADE',
        artefato_origem_id: payload.problemaId,
        titulo: `Anomalia Manual Registrada: ${payload.titulo}`,
        descricao: `Apontamento manual de anomalia de qualidade sobre o ativo/tabela "${payload.tabelaAfetada}".`,
        fato_observado: `Anomalia identificada pelo analista: "${payload.titulo}" na tabela "${payload.tabelaAfetada}"${payload.colunaAfetada ? `, coluna "${payload.colunaAfetada}"` : ''}. Descrição: ${payload.descricao}`,
        estado_anterior: null,
        acao_registrada: `Registro manual de problema de qualidade no catálogo da demanda.`,
        estado_posterior: `Severidade PENDENTE | Status ABERTO aguardando deliberação humana formal.`,
        resultado_mensuravel: `${payload.totalLinhasAfetadas ?? 0} linhas afetadas (${payload.percentualLinhasAfetadas ?? 0}%).`,
        inferencia_recomendacao: 'Anomalia requer atribuição de severidade definitiva e plano de ação na deliberação.',
        decisao_humana: null,
        classificacao_exposicao: classificacao,
        elegibilidade_portfolio: false, // Inicia false até deliberação humana
        metadados_adicionais: {
          problema_id: payload.problemaId,
          titulo: payload.titulo,
          descricao: payload.descricao,
          tabela_afetada: payload.tabelaAfetada,
          coluna_afetada: payload.colunaAfetada || null,
        },
      };
    }

    return null;
  }
}
