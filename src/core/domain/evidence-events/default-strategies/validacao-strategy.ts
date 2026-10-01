/**
 * src/core/domain/evidence-events/default-strategies/validacao-strategy.ts
 *
 * Estratégia de Eventos do Evidence Event Engine para a Etapa de Validação & Conciliação (Subgate 3.7B).
 *
 * Princípios Epistêmicos e de Governança Inegociáveis:
 * 1. Rigor Epistêmico: Uma validação APROVADA significa exclusivamente que o teste registrado
 *    apresentou resultado numérico/técnico dentro da tolerância definida para aquela comparação pontual.
 *    NÃO inferir automaticamente: conformidade global, modelo perfeito, ausência de outros erros
 *    ou qualidade global certificada.
 * 2. Autoria Humana vs. Captura Automática: A ação de teste e reteste é conduzida pelo analista humano;
 *    o sistema apenas captura em segundo plano o fato técnico observado e seu resultado.
 * 3. Idempotência Determinística: Baseada estritamente em identificadores estáveis e timestamps
 *    persistidos no SQLite (id da validação e criado_em/atualizado_em). Zero Date.now(), zero UUID volátil.
 * 4. Tolerância Zero como Default Conservador: A tolerância é um parâmetro conservador e editável
 *    pelo analista conforme a natureza da métrica, fonte e regra de negócio.
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

export interface ValidacaoRegistradaPayload {
  [key: string]: unknown;
  validacaoId: string;
  demandaId: string;
  titulo: string;
  camada: string;
  metodoVerificacao: string;
  baseReferencia?: string | null;
  metricaId?: string | null;
  valorEsperado?: number | null;
  valorObtido?: number | null;
  divergenciaAbsoluta?: number | null;
  divergenciaPercentual?: number | null;
  toleranciaPermitida: number;
  unidadeMedida?: string | null;
  resultado: string; // 'APROVADO' | 'DIVERGENTE' | 'REJEITADO' | 'PENDENTE_RETESTE'
  obrigatoria: boolean;
  executadoPor?: string | null;
  executadoEm?: string | null;
  criadoEm: string;
}

export interface ValidacaoRetestadaPayload {
  [key: string]: unknown;
  validacaoId: string;
  demandaId: string;
  titulo: string;
  camada: string;
  baseReferencia?: string | null;
  valorEsperado?: number | null;
  novoValorObtido: number;
  novaDivergenciaAbsoluta?: number | null;
  novaDivergenciaPercentual?: number | null;
  toleranciaPermitida: number;
  novoResultado: string; // 'APROVADO' | 'DIVERGENTE' | 'REJEITADO'
  executadoPor: string;
  executadoEm: string;
  notasEvidencia?: string | null;
  atualizadoEm: string;
}

export class ValidacaoStrategy implements IEstrategiaProcessamentoEvento {
  readonly codigo = 'ESTRATEGIA_VALIDACAO_CONCILIACAO';

  readonly tiposSuportados = [
    'VALIDACAO_CONCILIACAO_REGISTRADA',
    'VALIDACAO_CONCILIACAO_RETESTADA',
  ] as const;

  avaliar(evento: EventoAnalitico): DecisaoPoliticaCaptura {
    switch (evento.tipo_evento) {
      case 'VALIDACAO_CONCILIACAO_REGISTRADA': {
        const payload = evento.payload as Partial<ValidacaoRegistradaPayload> | undefined;
        if (!payload?.validacaoId || !payload?.titulo || !payload?.camada) {
          return {
            politica: 'IGNORAR',
            motivo: 'Payload incompleto para registro de validação (validacaoId, titulo ou camada ausentes).',
            requer_intervencao_humana: false,
          };
        }
        return {
          politica: 'REGISTRAR_AUTOMATICAMENTE',
          motivo: 'Validação de conciliação multicamadas registrada formalmente com critérios técnicos definidos.',
          requer_intervencao_humana: false,
        };
      }

      case 'VALIDACAO_CONCILIACAO_RETESTADA': {
        const payload = evento.payload as Partial<ValidacaoRetestadaPayload> | undefined;
        if (!payload?.validacaoId || !payload?.titulo || payload?.novoValorObtido === undefined) {
          return {
            politica: 'IGNORAR',
            motivo: 'Payload incompleto para reteste de validação (validacaoId, titulo ou novoValorObtido ausentes).',
            requer_intervencao_humana: false,
          };
        }
        return {
          politica: 'REGISTRAR_AUTOMATICAMENTE',
          motivo: 'Reteste de validação/conciliação registrado formalmente com apuração de novo valor e desvio.',
          requer_intervencao_humana: false,
        };
      }

      default:
        return {
          politica: 'IGNORAR',
          motivo: `Tipo de evento "${evento.tipo_evento}" não reconhecido por ValidacaoStrategy.`,
          requer_intervencao_humana: false,
        };
    }
  }

  transformar(evento: EventoAnalitico): CandidatoEvidencia | null {
    if (evento.tipo_evento === 'VALIDACAO_CONCILIACAO_REGISTRADA') {
      return this.processarRegistro(evento);
    }
    if (evento.tipo_evento === 'VALIDACAO_CONCILIACAO_RETESTADA') {
      return this.processarReteste(evento);
    }
    return null;
  }

  private processarRegistro(evento: EventoAnalitico): CandidatoEvidencia | null {
    const payload = evento.payload as unknown as ValidacaoRegistradaPayload;
    if (!payload?.validacaoId) return null;

    const isAprovado = payload.resultado === 'APROVADO';

    const divAbsStr = payload.divergenciaAbsoluta !== null && payload.divergenciaAbsoluta !== undefined
      ? `${payload.divergenciaAbsoluta} ${payload.unidadeMedida || ''}`.trim()
      : 'não calculada';

    const divPctStr = payload.divergenciaPercentual !== null && payload.divergenciaPercentual !== undefined
      ? `${payload.divergenciaPercentual}%`
      : 'não calculada';

    const valoresStr = payload.valorEsperado !== null && payload.valorEsperado !== undefined &&
                       payload.valorObtido !== null && payload.valorObtido !== undefined
      ? `Esperado: ${payload.valorEsperado} | Obtido: ${payload.valorObtido} | Tolerância: ${payload.toleranciaPermitida}.`
      : 'Valores numéricos de confronto não totalmente informados.';

    const fatoObservado = `Validação de conciliação registrada: "${payload.titulo}" (Camada: ${payload.camada}). ${valoresStr} Divergência absoluta apurada: ${divAbsStr} (${divPctStr}). Status inicial: ${payload.resultado}.`;

    const resultadoMensuravel = isAprovado
      ? `O teste registrado apresentou resultado dentro da tolerância permitida (${payload.toleranciaPermitida}). [Ressalva Epistêmica: Esta validação atesta exclusivamente a aderência desta comparação pontual e não certifica conformidade global do sistema ou ausência de outros erros].`
      : `Divergência detectada acima da tolerância permitida (${payload.toleranciaPermitida}). Divergência absoluta: ${divAbsStr}. Check requer investigação, ajuste e reteste formal.`;

    return {
      tipo: TipoEvidenciaAnalitica.VALIDACAO,
      etapa_origem: EtapaOrigemEvidencia.VALIDACAO,
      artefato_origem_tipo: 'VALIDACAO_CONCILIACAO',
      artefato_origem_id: payload.validacaoId,
      titulo: `Check de Validação: ${payload.titulo}`,
      descricao: `Registro e execução de teste de conciliação na camada '${payload.camada}', com confronto contra a referência '${payload.baseReferencia || 'Base de Controle'}'.`,
      fato_observado: fatoObservado,
      estado_anterior: null,
      acao_registrada: `Execução de teste de validação/conciliação com critério determinístico por ${payload.executadoPor || 'ANALISTA'}.`,
      estado_posterior: `Resultado do check: ${payload.resultado} (Divergência: ${divAbsStr}).`,
      resultado_mensuravel: resultadoMensuravel,
      inferencia_recomendacao: isAprovado
        ? 'Validação em conformidade com o critério aceito para este teste pontual.'
        : 'Recomenda-se investigar se o desvio decorre de filtro no relatório, tratamento na preparação ou inconsistência na base de controle.',
      decisao_humana: `Definição da regra de confronto pelo analista com tolerância permitida de ${payload.toleranciaPermitida}.`,
      classificacao_exposicao: ClassificacaoExposicaoEvidencia.INTERNA,
      elegibilidade_portfolio: false,
      metadados_adicionais: {
        validacao_id: payload.validacaoId,
        camada: payload.camada,
        resultado: payload.resultado,
        obrigatoria: payload.obrigatoria,
        tolerancia_permitida: payload.toleranciaPermitida,
        valor_esperado: payload.valorEsperado,
        valor_obtido: payload.valorObtido,
        divergencia_absoluta: payload.divergenciaAbsoluta,
        divergencia_percentual: payload.divergenciaPercentual,
        executado_em: payload.executadoEm || payload.criadoEm,
        ressalva_epistemica_conformidade_global: true,
      },
    };
  }

  private processarReteste(evento: EventoAnalitico): CandidatoEvidencia | null {
    const payload = evento.payload as unknown as ValidacaoRetestadaPayload;
    if (!payload?.validacaoId) return null;

    const isAprovado = payload.novoResultado === 'APROVADO';

    const divAbsStr = payload.novaDivergenciaAbsoluta !== null && payload.novaDivergenciaAbsoluta !== undefined
      ? `${payload.novaDivergenciaAbsoluta}`
      : 'não calculada';

    const divPctStr = payload.novaDivergenciaPercentual !== null && payload.novaDivergenciaPercentual !== undefined
      ? `${payload.novaDivergenciaPercentual}%`
      : 'não calculada';

    const fatoObservado = `Reteste formal da validação "${payload.titulo}" executado por ${payload.executadoPor}. Novo valor apurado: ${payload.novoValorObtido}. Valor de referência: ${payload.valorEsperado}. Nova divergência absoluta: ${divAbsStr} (${divPctStr}) contra tolerância de ${payload.toleranciaPermitida}. Novo resultado: ${payload.novoResultado}.`;

    const resultadoMensuravel = isAprovado
      ? `Reteste concluído com sucesso: resultado dentro da tolerância permitida (${payload.toleranciaPermitida}). [Ressalva Epistêmica: Atesta estritamente que a nova apuração desta comparação pontual atingiu conformidade].`
      : `Reteste executado, porém a divergência (${divAbsStr}) permanece além da tolerância permitida (${payload.toleranciaPermitida}). Status: DIVERGENTE.`;

    return {
      tipo: TipoEvidenciaAnalitica.VALIDACAO,
      etapa_origem: EtapaOrigemEvidencia.VALIDACAO,
      artefato_origem_tipo: 'VALIDACAO_CONCILIACAO',
      artefato_origem_id: payload.validacaoId,
      titulo: `Reteste de Validação: ${payload.titulo}`,
      descricao: `Execução de novo ciclo de verificação para a validação '${payload.titulo}' após ajustes técnicos realizados no pipeline.`,
      fato_observado: fatoObservado,
      estado_anterior: 'Status anterior: DIVERGENTE / PENDENTE_RETESTE.',
      acao_registrada: `Reteste de validação executado pelo analista ${payload.executadoPor} com conferência matemática de aderência.`,
      estado_posterior: `Resultado do reteste: ${payload.novoResultado} (Divergência: ${divAbsStr}).`,
      resultado_mensuravel: resultadoMensuravel,
      inferencia_recomendacao: isAprovado
        ? 'Desvio previamente registrado foi sanado nesta conferência pontual.'
        : 'Persistência de desvio numérico. Reavaliar lógica da fórmula ou regras de saneamento.',
      decisao_humana: `Homologação formal do resultado do reteste pelo analista ${payload.executadoPor}.${payload.notasEvidencia ? ` Notas: "${payload.notasEvidencia}".` : ''}`,
      classificacao_exposicao: ClassificacaoExposicaoEvidencia.INTERNA,
      elegibilidade_portfolio: false,
      metadados_adicionais: {
        validacao_id: payload.validacaoId,
        camada: payload.camada,
        resultado_anterior: 'DIVERGENTE_OU_PENDENTE',
        novo_resultado: payload.novoResultado,
        novo_valor_obtido: payload.novoValorObtido,
        valor_esperado: payload.valorEsperado,
        nova_divergencia_absoluta: payload.novaDivergenciaAbsoluta,
        nova_divergencia_percentual: payload.novaDivergenciaPercentual,
        tolerancia_permitida: payload.toleranciaPermitida,
        executado_em: payload.executadoEm,
        atualizado_em: payload.atualizadoEm,
        ressalva_epistemica_conformidade_global: true,
      },
    };
  }
}
