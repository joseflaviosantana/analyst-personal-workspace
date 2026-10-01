/**
 * src/core/domain/evidence-events/default-strategies/requisitos-strategy.ts
 *
 * Estratégia de Eventos do Evidence Event Engine para a Etapa de Requisitos & Clarificação (Bloco 3.8).
 *
 * Princípios Epistêmicos:
 * 1. Rigor Epistêmico: Diferencia Fato Fornecido, Pergunta formulada, Resposta do Contratante
 *    e Decisão Humana de Homologação.
 * 2. Idempotência Determinística: Baseada estritamente em identificadores estáveis e timestamps
 *    persistidos no SQLite (id da demanda/pergunta e requisitos_homologados_em / respondida_em).
 *    Zero Date.now(), zero UUID volátil e zero hash de conjunto de texto.
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

export interface RequisitosHomologadosPayload {
  [key: string]: unknown;
  demandaId: string;
  homologadoPor: string;
  homologadoEm: string;
  justificativa: string;
  ressalvas?: string | null;
  totalRequisitos: number;
  totalObrigatorios: number;
  totalPerguntasRespondidas: number;
}

export interface RequisitosRespostaRegistradaPayload {
  [key: string]: unknown;
  demandaId: string;
  perguntaId: string;
  pergunta: string;
  resposta: string;
  respondidoPor: string;
  respondidaEm: string;
  impactoDecisao?: string | null;
  bloqueante: boolean;
}

export class RequisitosStrategy implements IEstrategiaProcessamentoEvento {
  readonly codigo = 'ESTRATEGIA_REQUISITOS_CLARIFICACAO';

  readonly tiposSuportados = [
    'REQUISITOS_LEVANTAMENTO_HOMOLOGADO',
    'REQUISITOS_RESPOSTA_CONTRATANTE_REGISTRADA',
  ] as const;

  avaliar(evento: EventoAnalitico): DecisaoPoliticaCaptura {
    switch (evento.tipo_evento) {
      case 'REQUISITOS_LEVANTAMENTO_HOMOLOGADO': {
        const payload = evento.payload as Partial<RequisitosHomologadosPayload> | undefined;
        if (!payload?.demandaId || !payload?.homologadoEm || !payload?.justificativa) {
          return {
            politica: 'IGNORAR',
            motivo: 'Payload incompleto para homologação de requisitos (demandaId, homologadoEm ou justificativa ausentes).',
            requer_intervencao_humana: false,
          };
        }
        return {
          politica: 'REGISTRAR_AUTOMATICAMENTE',
          motivo: 'Homologação formal humana da suficiência do levantamento de requisitos para avanço de etapa.',
          requer_intervencao_humana: false,
        };
      }

      case 'REQUISITOS_RESPOSTA_CONTRATANTE_REGISTRADA': {
        const payload = evento.payload as Partial<RequisitosRespostaRegistradaPayload> | undefined;
        if (!payload?.perguntaId || !payload?.resposta || !payload?.respondidaEm) {
          return {
            politica: 'IGNORAR',
            motivo: 'Payload incompleto para registro de resposta do contratante (perguntaId, resposta ou respondidaEm ausentes).',
            requer_intervencao_humana: false,
          };
        }
        return {
          politica: 'REGISTRAR_AUTOMATICAMENTE',
          motivo: 'Resposta formal do contratante registrada para questionamento de clarificação de escopo.',
          requer_intervencao_humana: false,
        };
      }

      default:
        return {
          politica: 'IGNORAR',
          motivo: `Tipo de evento ${evento.tipo_evento} não suportado pela estratégia de requisitos.`,
          requer_intervencao_humana: false,
        };
    }
  }

  transformar(evento: EventoAnalitico): CandidatoEvidencia | null {
    if (evento.tipo_evento === 'REQUISITOS_LEVANTAMENTO_HOMOLOGADO') {
      const p = evento.payload as RequisitosHomologadosPayload;
      const ressalvaTexto = p.ressalvas ? ` Ressalvas assumidas: ${p.ressalvas}.` : '';

      return {
        tipo: TipoEvidenciaAnalitica.REQUISITOS,
        etapa_origem: EtapaOrigemEvidencia.REQUISITOS,
        artefato_origem_tipo: 'DEMANDA_REQUISITOS',
        artefato_origem_id: p.demandaId,
        titulo: `Homologação do Levantamento de Requisitos: Demanda ${p.demandaId}`,
        descricao: `Levantamento de requisitos analíticos formalmente homologado pelo analista como suficiente para início do trabalho com dados. Total de requisitos: ${p.totalRequisitos} (${p.totalObrigatorios} obrigatórios). Perguntas respondidas: ${p.totalPerguntasRespondidas}.${ressalvaTexto}`,
        fato_observado: `Ato de homologação formal do briefing e requisitos registrado em ${p.homologadoEm} pelo analista (${p.homologadoPor}).`,
        estado_anterior: 'EM_CLARIFICACAO',
        acao_registrada: `Homologação formal com justificativa: "${p.justificativa}".${ressalvaTexto}`,
        estado_posterior: 'PRONTO_PARA_DADOS',
        resultado_mensuravel: `${p.totalRequisitos} requisito(s) formalizado(s); ${p.totalPerguntasRespondidas} dúvida(s) de negócio esclarecida(s).`,
        decisao_humana: `Homologação profissional atestando suficiência para avanço. Justificativa: ${p.justificativa}`,
        inferencia_recomendacao: 'Requisitos e alinhamento prévio reduzem significativamente retrabalho em modelagem DAX e preparação.',
        classificacao_exposicao: ClassificacaoExposicaoEvidencia.INTERNA,
        elegibilidade_portfolio: true,
        metadados_adicionais: {
          demanda_id: p.demandaId,
          homologado_em: p.homologadoEm,
          homologado_por: p.homologadoPor,
          total_requisitos: p.totalRequisitos,
          total_obrigatorios: p.totalObrigatorios,
          total_perguntas_respondidas: p.totalPerguntasRespondidas,
          ressalvas: p.ressalvas || null,
        },
      };
    }

    if (evento.tipo_evento === 'REQUISITOS_RESPOSTA_CONTRATANTE_REGISTRADA') {
      const p = evento.payload as RequisitosRespostaRegistradaPayload;
      return {
        tipo: TipoEvidenciaAnalitica.REQUISITOS,
        etapa_origem: EtapaOrigemEvidencia.REQUISITOS,
        artefato_origem_tipo: 'PERGUNTA_CLARIFICACAO',
        artefato_origem_id: p.perguntaId,
        titulo: `Clarificação de Requisito: Resposta Registrada (${p.perguntaId})`,
        descricao: `Resposta formal recebida do contratante para a dúvida: "${p.pergunta}". Respondido por: ${p.respondidoPor} em ${p.respondidaEm}.`,
        fato_observado: `Registro documental de retorno do contratante em ${p.respondidaEm}: "${p.resposta}".`,
        estado_anterior: 'ENVIADA',
        acao_registrada: `Registro da resposta formal e impacto no escopo: ${p.impactoDecisao || 'Nenhum impacto adicional registrado'}.`,
        estado_posterior: 'RESPONDIDA',
        resultado_mensuravel: `Questionamento ${p.bloqueante ? 'BLOQUEANTE' : 'INFORMATIVO'} sanado com sucesso.`,
        decisao_humana: p.impactoDecisao || 'Aceite da resposta do contratante para direcionamento analítico.',
        inferencia_recomendacao: 'Eliminação de premissas não declaradas através de diálogo transparente com o contratante.',
        classificacao_exposicao: ClassificacaoExposicaoEvidencia.CONFIDENCIAL,
        elegibilidade_portfolio: false,
        metadados_adicionais: {
          demanda_id: p.demandaId,
          pergunta_id: p.perguntaId,
          respondido_por: p.respondidoPor,
          respondida_em: p.respondidaEm,
          bloqueante: p.bloqueante,
        },
      };
    }

    return null;
  }
}
