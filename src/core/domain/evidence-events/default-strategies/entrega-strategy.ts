/**
 * src/core/domain/evidence-events/default-strategies/entrega-strategy.ts
 *
 * Estratégia de Eventos do Evidence Event Engine para a Etapa de Entregáveis & Aceite (Aba 10 / Subgate 3.7C).
 *
 * Princípios Epistêmicos e de Governança Inegociáveis:
 * 1. Rigor Epistêmico Estrito:
 *    - Artefato cadastrado ≠ Qualidade aprovada;
 *    - Pacote disponibilizado ≠ Aceite do cliente;
 *    - Aceite formalizado ≠ Resultado de negócio comprovado;
 *    - Encerramento formalizado ≠ Certificação automática de competência.
 * 2. Autoria Humana: O aceite e encerramento são deliberações soberanas humanas;
 *    o sistema apenas captura em segundo plano o fato técnico observado e seu resultado.
 * 3. Idempotência Determinística: Baseada estritamente em identificadores estáveis e
 *    ocorrências profissionais persistidas no SQLite. Zero Date.now(), zero UUID volátil.
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

export interface EntregaArtefatoRegistradoPayload {
  [key: string]: unknown;
  entregavelId: string;
  demandaId: string;
  titulo: string;
  tipo: string;
  versao: string;
  obrigatorio: boolean;
  status: string;
  criadoEm: string;
}

export interface EntregaPacoteDisponibilizadoPayload {
  [key: string]: unknown;
  demandaId: string;
  entregavelId: string;
  titulo: string;
  versao: string;
  disponibilizadoEm: string;
}

export interface EntregaAceiteFormalizadoPayload {
  [key: string]: unknown;
  entregavelId: string;
  demandaId: string;
  titulo: string;
  versao: string;
  aceitePor: string;
  aceiteEm: string;
  aceiteJustificativa?: string | null;
}

export interface EntregaAjusteSolicitadoPayload {
  [key: string]: unknown;
  entregavelId: string;
  demandaId: string;
  titulo: string;
  versao: string;
  solicitadoPor: string;
  dataSolicitacao: string;
  ajustesDescricao: string;
}

export interface EntregaRejeitadaPayload {
  [key: string]: unknown;
  entregavelId: string;
  demandaId: string;
  titulo: string;
  versao: string;
  rejeitadoPor: string;
  dataRejeicao: string;
  motivoRejeicao: string;
}

export interface EntregaEncerramentoFormalizadoPayload {
  [key: string]: unknown;
  demandaId: string;
  demandaTitulo: string;
  dataConclusao: string;
  totalEntregaveisHomologados: number;
}

export class EntregaStrategy implements IEstrategiaProcessamentoEvento {
  readonly codigo = 'ESTRATEGIA_ENTREGA_ACEITE';

  readonly tiposSuportados = [
    'ENTREGA_ARTEFATO_REGISTRADO',
    'ENTREGA_PACOTE_DISPONIBILIZADO',
    'ENTREGA_ACEITE_FORMALIZADO',
    'ENTREGA_AJUSTE_SOLICITADO',
    'ENTREGA_REJEITADA',
    'ENTREGA_ENCERRAMENTO_FORMALIZADO',
  ] as const;

  avaliar(evento: EventoAnalitico): DecisaoPoliticaCaptura {
    switch (evento.tipo_evento) {
      case 'ENTREGA_ARTEFATO_REGISTRADO': {
        const payload = evento.payload as Partial<EntregaArtefatoRegistradoPayload> | undefined;
        if (!payload?.entregavelId || !payload?.titulo || !payload?.tipo) {
          return {
            politica: 'IGNORAR',
            motivo: 'Payload incompleto para registro de entregável (entregavelId, titulo ou tipo ausentes).',
            requer_intervencao_humana: false,
          };
        }
        return {
          politica: 'REGISTRAR_AUTOMATICAMENTE',
          motivo: 'Entregável profissional registrado formalmente no pacote da demanda.',
          requer_intervencao_humana: false,
        };
      }

      case 'ENTREGA_PACOTE_DISPONIBILIZADO': {
        const payload = evento.payload as Partial<EntregaPacoteDisponibilizadoPayload> | undefined;
        if (!payload?.entregavelId || !payload?.titulo) {
          return {
            politica: 'IGNORAR',
            motivo: 'Payload incompleto para disponibilização de entregável (entregavelId ou titulo ausentes).',
            requer_intervencao_humana: false,
          };
        }
        return {
          politica: 'REGISTRAR_AUTOMATICAMENTE',
          motivo: 'Entregável formalmente disponibilizado no pacote de entrega.',
          requer_intervencao_humana: false,
        };
      }

      case 'ENTREGA_ACEITE_FORMALIZADO': {
        const payload = evento.payload as Partial<EntregaAceiteFormalizadoPayload> | undefined;
        if (!payload?.entregavelId || !payload?.aceitePor) {
          return {
            politica: 'IGNORAR',
            motivo: 'Payload incompleto para formalização de aceite (entregavelId ou aceitePor ausentes).',
            requer_intervencao_humana: false,
          };
        }
        return {
          politica: 'REGISTRAR_AUTOMATICAMENTE',
          motivo: 'Aceite formal homologado pelo contratante/stakeholder.',
          requer_intervencao_humana: false,
        };
      }

      case 'ENTREGA_AJUSTE_SOLICITADO': {
        const payload = evento.payload as Partial<EntregaAjusteSolicitadoPayload> | undefined;
        if (!payload?.entregavelId || !payload?.solicitadoPor) {
          return {
            politica: 'IGNORAR',
            motivo: 'Payload incompleto para solicitação de ajuste (entregavelId ou solicitadoPor ausentes).',
            requer_intervencao_humana: false,
          };
        }
        return {
          politica: 'REGISTRAR_AUTOMATICAMENTE',
          motivo: 'Solicitação de ajustes formalizada pelo contratante.',
          requer_intervencao_humana: false,
        };
      }

      case 'ENTREGA_REJEITADA': {
        const payload = evento.payload as Partial<EntregaRejeitadaPayload> | undefined;
        if (!payload?.entregavelId || !payload?.rejeitadoPor) {
          return {
            politica: 'IGNORAR',
            motivo: 'Payload incompleto para rejeição de entregável (entregavelId ou rejeitadoPor ausentes).',
            requer_intervencao_humana: false,
          };
        }
        return {
          politica: 'REGISTRAR_AUTOMATICAMENTE',
          motivo: 'Rejeição formal de entregável registrada pelo contratante.',
          requer_intervencao_humana: false,
        };
      }

      case 'ENTREGA_ENCERRAMENTO_FORMALIZADO': {
        const payload = evento.payload as Partial<EntregaEncerramentoFormalizadoPayload> | undefined;
        if (!payload?.demandaId || !payload?.dataConclusao) {
          return {
            politica: 'IGNORAR',
            motivo: 'Payload incompleto para encerramento de demanda (demandaId ou dataConclusao ausentes).',
            requer_intervencao_humana: false,
          };
        }
        return {
          politica: 'REGISTRAR_AUTOMATICAMENTE',
          motivo: 'Encerramento formalizado da demanda após validação e aceite integral.',
          requer_intervencao_humana: false,
        };
      }

      default:
        return {
          politica: 'IGNORAR',
          motivo: `Tipo de evento "${evento.tipo_evento}" não reconhecido por EntregaStrategy.`,
          requer_intervencao_humana: false,
        };
    }
  }

  transformar(evento: EventoAnalitico): CandidatoEvidencia | null {
    switch (evento.tipo_evento) {
      case 'ENTREGA_ARTEFATO_REGISTRADO':
        return this.processarRegistroArtefato(evento);
      case 'ENTREGA_PACOTE_DISPONIBILIZADO':
        return this.processarDisponibilizacao(evento);
      case 'ENTREGA_ACEITE_FORMALIZADO':
        return this.processarAceite(evento);
      case 'ENTREGA_AJUSTE_SOLICITADO':
        return this.processarAjuste(evento);
      case 'ENTREGA_REJEITADA':
        return this.processarRejeicao(evento);
      case 'ENTREGA_ENCERRAMENTO_FORMALIZADO':
        return this.processarEncerramento(evento);
      default:
        return null;
    }
  }

  private processarRegistroArtefato(evento: EventoAnalitico): CandidatoEvidencia | null {
    const payload = evento.payload as unknown as EntregaArtefatoRegistradoPayload;
    if (!payload?.entregavelId) return null;

    const fatoObservado = `Entregável profissional "${payload.titulo}" (Tipo: ${payload.tipo}, Versão: ${payload.versao}) cadastrado no pacote de entrega. Obrigatório: ${payload.obrigatorio ? 'Sim' : 'Não'}. Status inicial: ${payload.status}.`;

    return {
      tipo: TipoEvidenciaAnalitica.ENTREGA,
      etapa_origem: EtapaOrigemEvidencia.ENTREGA,
      artefato_origem_tipo: 'ENTREGAVEL_DEMANDA',
      artefato_origem_id: payload.entregavelId,
      titulo: `Entregável Cadastrado: ${payload.titulo}`,
      descricao: `Registro de artefato profissional para consolidação do pacote de entrega da demanda.`,
      fato_observado: fatoObservado,
      estado_anterior: null,
      acao_registrada: `Cadastro de entregável ${payload.tipo} (versão ${payload.versao}).`,
      estado_posterior: payload.status,
      resultado_mensuravel: `Artefato catalogado no pacote de entrega. [Ressalva Epistêmica: O cadastro atesta exclusivamente a vinculação do artefato na esteira; não infere aprovação técnica nem aceite do cliente].`,
      inferencia_recomendacao: 'Manter artefato atualizado e disponibilizar para homologação formal assim que concluído.',
      decisao_humana: `Inclusão do artefato como ${payload.obrigatorio ? 'obrigatório' : 'opcional'} pelo analista.`,
      classificacao_exposicao: ClassificacaoExposicaoEvidencia.INTERNA,
      elegibilidade_portfolio: false,
      metadados_adicionais: {
        entregavel_id: payload.entregavelId,
        tipo: payload.tipo,
        versao: payload.versao,
        obrigatorio: payload.obrigatorio,
        criado_em: payload.criadoEm,
      },
    };
  }

  private processarDisponibilizacao(evento: EventoAnalitico): CandidatoEvidencia | null {
    const payload = evento.payload as unknown as EntregaPacoteDisponibilizadoPayload;
    if (!payload?.entregavelId) return null;

    const fatoObservado = `Entregável profissional "${payload.titulo}" (Versão: ${payload.versao}) formalmente disponibilizado no pacote para homologação e entrega.`;

    return {
      tipo: TipoEvidenciaAnalitica.ENTREGA,
      etapa_origem: EtapaOrigemEvidencia.ENTREGA,
      artefato_origem_tipo: 'ENTREGAVEL_DEMANDA',
      artefato_origem_id: payload.entregavelId,
      titulo: `Entregável Disponibilizado: ${payload.titulo}`,
      descricao: `Artefato profissional preparado, validado e disponibilizado para avaliação e aceite formal.`,
      fato_observado: fatoObservado,
      estado_anterior: 'RASCUNHO',
      acao_registrada: `Disponibilização de entregável para o cliente/stakeholder.`,
      estado_posterior: 'DISPONIVEL',
      resultado_mensuravel: `Entregável com status DISPONÍVEL, contribuindo para a prontidão V-03 da demanda. [Ressalva Epistêmica: Disponibilização reflete prontidão técnica interna; não equivale a aceite do cliente].`,
      inferencia_recomendacao: 'Submeter o artefato e o relatório executivo para apreciação formal do stakeholder.',
      decisao_humana: 'Declaração humana de prontidão do entregável pelo analista.',
      classificacao_exposicao: ClassificacaoExposicaoEvidencia.INTERNA,
      elegibilidade_portfolio: false,
      metadados_adicionais: {
        entregavel_id: payload.entregavelId,
        versao: payload.versao,
        disponibilizado_em: payload.disponibilizadoEm,
      },
    };
  }

  private processarAceite(evento: EventoAnalitico): CandidatoEvidencia | null {
    const payload = evento.payload as unknown as EntregaAceiteFormalizadoPayload;
    if (!payload?.entregavelId) return null;

    const fatoObservado = `Aceite formal homologado para o entregável "${payload.titulo}" (Versão: ${payload.versao}) por "${payload.aceitePor}". Data: ${payload.aceiteEm}. Observações: "${payload.aceiteJustificativa || 'Sem ressalvas'}".`;

    return {
      tipo: TipoEvidenciaAnalitica.ENTREGA,
      etapa_origem: EtapaOrigemEvidencia.ENTREGA,
      artefato_origem_tipo: 'ENTREGAVEL_DEMANDA',
      artefato_origem_id: payload.entregavelId,
      titulo: `Aceite Homologado: ${payload.titulo}`,
      descricao: `Deliberação formal soberana de aceite registrada pelo contratante/stakeholder.`,
      fato_observado: fatoObservado,
      estado_anterior: 'DISPONIVEL',
      acao_registrada: `Homologação formal de aceite por ${payload.aceitePor}.`,
      estado_posterior: 'HOMOLOGADO',
      resultado_mensuravel: `Aceite formalizado com status ACEITO, satisfazendo o requisito V-04 para este entregável. [Ressalva Epistêmica: O aceite formaliza o recebimento e aprovação do artefato conforme escopo; não infere impacto econômico futuro não mensurado].`,
      inferencia_recomendacao: 'Preservar termo de aceite na trilha de auditoria e arquivar pacote de entrega.',
      decisao_humana: `Aceite formal registrado por ${payload.aceitePor}. Justificativa: ${payload.aceiteJustificativa || 'Sem ressalvas'}.`,
      classificacao_exposicao: ClassificacaoExposicaoEvidencia.INTERNA,
      elegibilidade_portfolio: true,
      metadados_adicionais: {
        entregavel_id: payload.entregavelId,
        aceite_por: payload.aceitePor,
        aceite_em: payload.aceiteEm,
        justificativa: payload.aceiteJustificativa,
      },
    };
  }

  private processarAjuste(evento: EventoAnalitico): CandidatoEvidencia | null {
    const payload = evento.payload as unknown as EntregaAjusteSolicitadoPayload;
    if (!payload?.entregavelId) return null;

    const fatoObservado = `Ajustes formais solicitados para o entregável "${payload.titulo}" (Versão: ${payload.versao}) por "${payload.solicitadoPor}". Motivo declarado: "${payload.ajustesDescricao}".`;

    return {
      tipo: TipoEvidenciaAnalitica.ENTREGA,
      etapa_origem: EtapaOrigemEvidencia.ENTREGA,
      artefato_origem_tipo: 'ENTREGAVEL_DEMANDA',
      artefato_origem_id: payload.entregavelId,
      titulo: `Ajustes Solicitados: ${payload.titulo}`,
      descricao: `Registro de solicitação formal de refinamento/ajuste pelo contratante, bloqueando a conclusão.`,
      fato_observado: fatoObservado,
      estado_anterior: 'DISPONIVEL',
      acao_registrada: `Registro de solicitação de ajuste por ${payload.solicitadoPor}.`,
      estado_posterior: 'AJUSTES_SOLICITADOS',
      resultado_mensuravel: `Entregável em revisão com status AJUSTES_SOLICITADOS. Bloqueia avanço para CONCLUÍDA até resolução e novo aceite.`,
      inferencia_recomendacao: 'Planejar revisão técnica do entregável, gerar nova versão e submeter a nova conferência.',
      decisao_humana: `Deliberação do stakeholder ${payload.solicitadoPor} solicitando ajustes: "${payload.ajustesDescricao}".`,
      classificacao_exposicao: ClassificacaoExposicaoEvidencia.INTERNA,
      elegibilidade_portfolio: false,
      metadados_adicionais: {
        entregavel_id: payload.entregavelId,
        solicitado_por: payload.solicitadoPor,
        data_solicitacao: payload.dataSolicitacao,
        ajustes_descricao: payload.ajustesDescricao,
      },
    };
  }

  private processarRejeicao(evento: EventoAnalitico): CandidatoEvidencia | null {
    const payload = evento.payload as unknown as EntregaRejeitadaPayload;
    if (!payload?.entregavelId) return null;

    const fatoObservado = `Entregável profissional "${payload.titulo}" (Versão: ${payload.versao}) foi formalmente REJEITADO por "${payload.rejeitadoPor}". Motivo: "${payload.motivoRejeicao}".`;

    return {
      tipo: TipoEvidenciaAnalitica.ENTREGA,
      etapa_origem: EtapaOrigemEvidencia.ENTREGA,
      artefato_origem_tipo: 'ENTREGAVEL_DEMANDA',
      artefato_origem_id: payload.entregavelId,
      titulo: `Entrega Rejeitada: ${payload.titulo}`,
      descricao: `Registro formal de rejeição de entregável, bloqueando a esteira e exigindo reavaliação de escopo.`,
      fato_observado: fatoObservado,
      estado_anterior: 'DISPONIVEL',
      acao_registrada: `Rejeição formal de entregável por ${payload.rejeitadoPor}.`,
      estado_posterior: 'REJEITADO',
      resultado_mensuravel: `Status REJEITADO registrado. Bloqueia a transição para CONCLUÍDA.`,
      inferencia_recomendacao: 'Reavaliar com o stakeholder as premissas originais da demanda ou renegociar escopo.',
      decisao_humana: `Rejeição formal por ${payload.rejeitadoPor}: "${payload.motivoRejeicao}".`,
      classificacao_exposicao: ClassificacaoExposicaoEvidencia.INTERNA,
      elegibilidade_portfolio: false,
      metadados_adicionais: {
        entregavel_id: payload.entregavelId,
        rejeitado_por: payload.rejeitadoPor,
        data_rejeicao: payload.dataRejeicao,
        motivo_rejeicao: payload.motivoRejeicao,
      },
    };
  }

  private processarEncerramento(evento: EventoAnalitico): CandidatoEvidencia | null {
    const payload = evento.payload as unknown as EntregaEncerramentoFormalizadoPayload;
    if (!payload?.demandaId) return null;

    const fatoObservado = `Demanda "${payload.demandaTitulo}" formalmente CONCLUÍDA no workflow após satisfação integral dos critérios de validação e aceite de ${payload.totalEntregaveisHomologados} entregável(is) obrigatório(s). Data de encerramento: ${payload.dataConclusao}.`;

    return {
      tipo: TipoEvidenciaAnalitica.ENTREGA,
      etapa_origem: EtapaOrigemEvidencia.ENTREGA,
      artefato_origem_tipo: 'DEMANDA',
      artefato_origem_id: payload.demandaId,
      titulo: `Demanda Concluída: ${payload.demandaTitulo}`,
      descricao: `Formalização soberana de conclusão e encerramento do ciclo analítico da demanda.`,
      fato_observado: fatoObservado,
      estado_anterior: 'PRONTA_PARA_ENTREGA',
      acao_registrada: `Transição formal para CONCLUIDA via WorkflowEngine.`,
      estado_posterior: 'CONCLUIDA',
      resultado_mensuravel: `Demanda em estado terminal imutável CONCLUIDA com governança auditável completa. [Ressalva Epistêmica: A conclusão documenta a finalização do ciclo de trabalho contratado; não infere certificação automática de competência ou ROI não mensurado].`,
      inferencia_recomendacao: 'Arquivar registros da demanda e disponibilizar dossiê técnico para consulta futura.',
      decisao_humana: `Conclusão formalizada após aceite de todos os entregáveis obrigatórios.`,
      classificacao_exposicao: ClassificacaoExposicaoEvidencia.INTERNA,
      elegibilidade_portfolio: true,
      metadados_adicionais: {
        demanda_id: payload.demandaId,
        total_homologados: payload.totalEntregaveisHomologados,
        data_conclusao: payload.dataConclusao,
      },
    };
  }
}
