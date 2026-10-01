/**
 * src/core/domain/evidence-events/default-strategies/qualidade-diagnostico-strategy.ts
 *
 * Estratégia plugável para diagnósticos de qualidade concluídos (Subgate 3.5B.2).
 * Fato objetivo de varredura e auditoria determinística de dados.
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

export interface PayloadDiagnosticoConcluido {
  diagnosticoId: string;
  ativoDadosId: string;
  tabelaNome: string;
  totalLinhasAvaliadas: number;
  totalColunasAvaliadas: number;
  totalProblemasDetectados: number;
  totalVerificacoes?: number;
  duracaoMs: number;
  classificacaoExposicao?: ClassificacaoExposicaoEvidencia;
}

export class QualidadeDiagnosticoStrategy implements IEstrategiaProcessamentoEvento {
  readonly codigo = 'ESTRATEGIA_QUALIDADE_DIAGNOSTICO';
  readonly tiposSuportados = ['QUALIDADE_DIAGNOSTICO_CONCLUIDO'] as const;

  avaliar(evento: EventoAnalitico): DecisaoPoliticaCaptura {
    const payload = evento.payload as Partial<PayloadDiagnosticoConcluido> | undefined;
    if (
      !payload ||
      !payload.diagnosticoId ||
      !payload.ativoDadosId ||
      typeof payload.totalLinhasAvaliadas !== 'number' ||
      typeof payload.totalProblemasDetectados !== 'number'
    ) {
      return {
        politica: 'IGNORAR',
        motivo: 'Evento de diagnóstico concluído sem payload estruturado válido.',
        requer_intervencao_humana: false,
      };
    }

    return {
      politica: 'REGISTRAR_AUTOMATICAMENTE',
      motivo: 'Fato objetivo de execução e conclusão de diagnóstico determinístico de qualidade.',
      requer_intervencao_humana: false,
    };
  }

  transformar(evento: EventoAnalitico): CandidatoEvidencia | null {
    const payload = evento.payload as Partial<PayloadDiagnosticoConcluido> | undefined;
    if (
      !payload ||
      !payload.diagnosticoId ||
      !payload.ativoDadosId ||
      typeof payload.totalLinhasAvaliadas !== 'number' ||
      typeof payload.totalProblemasDetectados !== 'number'
    ) {
      return null;
    }

    const classificacao =
      payload.classificacaoExposicao || ClassificacaoExposicaoEvidencia.INTERNA;

    return {
      tipo: TipoEvidenciaAnalitica.QUALIDADE,
      etapa_origem: EtapaOrigemEvidencia.QUALIDADE,
      artefato_origem_tipo: 'DIAGNOSTICO_QUALIDADE',
      artefato_origem_id: payload.diagnosticoId,
      titulo: `Diagnóstico de Qualidade: ${payload.tabelaNome || 'Ativo de Dados'}`,
      descricao: `Varredura determinística de qualidade sobre o ativo "${payload.tabelaNome || 'Ativo de Dados'}".`,
      fato_observado: `Diagnóstico concluído sobre "${payload.tabelaNome || 'Ativo'}": ${payload.totalLinhasAvaliadas} linhas e ${payload.totalColunasAvaliadas ?? 0} colunas inspecionadas, com ${payload.totalProblemasDetectados} anomalia(s) detectada(s).`,
      estado_anterior: null,
      acao_registrada: `Execução completa do scanner determinístico de regras de integridade e regras de negócio.`,
      estado_posterior: `${payload.totalProblemasDetectados} anomalia(s) catalogada(s) para avaliação e deliberação.`,
      resultado_mensuravel: `${payload.totalProblemasDetectados} anomalias | ${payload.totalLinhasAvaliadas} linhas avaliadas | Duração: ${payload.duracaoMs ?? 0}ms`,
      inferencia_recomendacao:
        payload.totalProblemasDetectados === 0
          ? 'Ativo com 100% de conformidade nas verificações executadas.'
          : 'Recomenda-se deliberação humana soberana sobre as anomalias detectadas antes da modelagem.',
      decisao_humana: null,
      classificacao_exposicao: classificacao,
      elegibilidade_portfolio:
        classificacao !== ClassificacaoExposicaoEvidencia.CONFIDENCIAL &&
        payload.totalProblemasDetectados === 0,
      metadados_adicionais: {
        diagnostico_id: payload.diagnosticoId,
        ativo_dados_id: payload.ativoDadosId,
        tabela_nome: payload.tabelaNome,
        total_linhas_avaliadas: payload.totalLinhasAvaliadas,
        total_colunas_avaliadas: payload.totalColunasAvaliadas,
        total_problemas_detectados: payload.totalProblemasDetectados,
        duracao_ms: payload.duracaoMs,
      },
    };
  }
}
