/**
 * src/core/domain/evidence-events/default-strategies/modelagem-strategy.ts
 *
 * Estratégia plugável para processamento de eventos da etapa de Modelagem Analítica (Subgate 3.5B.3).
 * Abrange:
 * 1. MODELAGEM_MODELO_HOMOLOGADO: Decisão humana soberana de homologação do modelo após verificação de conformidade.
 * 2. MODELAGEM_CALENDARIO_ESPECIFICADO: Especificação arquitetural de dimensão temporal/calendário padronizada.
 * 3. MODELAGEM_METRICA_CADASTRADA: Formalização semântica de indicador (KPI) com rastreabilidade a objetivos.
 * 4. MODELAGEM_RELACIONAMENTO_CRIADO: Definição estrutural de relacionamento e cardinalidade entre entidades.
 *
 * Princípios Epistemológicos Vinculantes:
 * - Captura automática != Autoria automática: Homologação é decisão humana formal do analista; o sistema apenas a captura.
 * - Artefato criado != Qualidade global: Métricas, calendários e relacionamentos registram existência e decisões locais,
 *   sem atestar isoladamente conformidade global do modelo (que pertence às regras M-01 a M-12 e à homologação).
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

export interface PayloadModeloHomologado {
  modeloId: string;
  nomeModelo: string;
  tipoArquitetura: string;
  datasetAutorizadoId: string;
  homologadoPor: string;
  justificativa: string;
  totalAlertasReconhecidos: number;
  totalRecomendacoes: number;
  homologadoEm: string;
}

export interface PayloadCalendarioEspecificado {
  entidadeId: string;
  modeloId: string;
  nomeEntidade: string;
  dataInicio?: string | null;
  dataFim?: string | null;
  totalAtributosGerados: number;
  especificadoEm: string;
}

export interface PayloadMetricaCadastrada {
  metricaId: string;
  modeloId: string;
  nome: string;
  tipoAgregacao: string;
  tipoAditividade: string;
  formulaDeclarativa: string;
  unidadeMedida: string;
  perguntaNegocioAssociada?: string | null;
  objetivoNegocioAssociado?: string | null;
  cadastradaEm: string;
}

export interface PayloadRelacionamentoCriado {
  relacionamentoId: string;
  modeloId: string;
  entidadeOrigemNome: string;
  atributoOrigemNome: string;
  entidadeDestinoNome: string;
  atributoDestinoNome: string;
  tipoRelacionamento: string;
  direcaoFiltro: string;
  justificativa?: string | null;
  criadoEm: string;
}

export class ModelagemStrategy implements IEstrategiaProcessamentoEvento {
  readonly codigo = 'ESTRATEGIA_MODELAGEM';
  readonly tiposSuportados = [
    'MODELAGEM_MODELO_HOMOLOGADO',
    'MODELAGEM_CALENDARIO_ESPECIFICADO',
    'MODELAGEM_METRICA_CADASTRADA',
    'MODELAGEM_RELACIONAMENTO_CRIADO',
  ] as const;

  avaliar(evento: EventoAnalitico): DecisaoPoliticaCaptura {
    switch (evento.tipo_evento) {
      case 'MODELAGEM_MODELO_HOMOLOGADO': {
        const payload = evento.payload as Partial<PayloadModeloHomologado> | undefined;
        if (!payload?.modeloId || !payload?.justificativa) {
          return {
            politica: 'IGNORAR',
            motivo: 'Payload de homologação de modelo incompleto (modeloId ou justificativa ausentes).',
            requer_intervencao_humana: false,
          };
        }
        return {
          politica: 'REGISTRAR_AUTOMATICAMENTE',
          motivo: 'Homologação soberana do modelo analítico realizada pelo analista humano com conformidade atestada.',
          requer_intervencao_humana: false,
        };
      }

      case 'MODELAGEM_CALENDARIO_ESPECIFICADO': {
        const payload = evento.payload as Partial<PayloadCalendarioEspecificado> | undefined;
        if (!payload?.entidadeId || !payload?.modeloId) {
          return {
            politica: 'IGNORAR',
            motivo: 'Payload de especificação de calendário incompleto (entidadeId ou modeloId ausentes).',
            requer_intervencao_humana: false,
          };
        }
        return {
          politica: 'REGISTRAR_AUTOMATICAMENTE',
          motivo: 'Dimensão temporal/calendário especificada formalmente no modelo analítico.',
          requer_intervencao_humana: false,
        };
      }

      case 'MODELAGEM_METRICA_CADASTRADA': {
        const payload = evento.payload as Partial<PayloadMetricaCadastrada> | undefined;
        if (!payload?.metricaId || !payload?.nome || !payload?.formulaDeclarativa) {
          return {
            politica: 'IGNORAR',
            motivo: 'Payload de métrica incompleto (metricaId, nome ou formulaDeclarativa ausentes).',
            requer_intervencao_humana: false,
          };
        }
        return {
          politica: 'REGISTRAR_AUTOMATICAMENTE',
          motivo: 'Métrica analítica de negócio (KPI) cadastrada com fórmula e rastreabilidade formal.',
          requer_intervencao_humana: false,
        };
      }

      case 'MODELAGEM_RELACIONAMENTO_CRIADO': {
        const payload = evento.payload as Partial<PayloadRelacionamentoCriado> | undefined;
        if (!payload?.relacionamentoId || !payload?.entidadeOrigemNome || !payload?.entidadeDestinoNome) {
          return {
            politica: 'IGNORAR',
            motivo: 'Payload de relacionamento incompleto (relacionamentoId, entidadeOrigemNome ou entidadeDestinoNome ausentes).',
            requer_intervencao_humana: false,
          };
        }
        return {
          politica: 'REGISTRAR_AUTOMATICAMENTE',
          motivo: 'Conexão relacional dimensional estabelecida entre entidades analíticas.',
          requer_intervencao_humana: false,
        };
      }

      default:
        return {
          politica: 'IGNORAR',
          motivo: `Tipo de evento de modelagem desconhecido: ${evento.tipo_evento}`,
          requer_intervencao_humana: false,
        };
    }
  }

  transformar(evento: EventoAnalitico): CandidatoEvidencia {
    switch (evento.tipo_evento) {
      case 'MODELAGEM_MODELO_HOMOLOGADO':
        return this.transformarModeloHomologado(evento);
      case 'MODELAGEM_CALENDARIO_ESPECIFICADO':
        return this.transformarCalendarioEspecificado(evento);
      case 'MODELAGEM_METRICA_CADASTRADA':
        return this.transformarMetricaCadastrada(evento);
      case 'MODELAGEM_RELACIONAMENTO_CRIADO':
        return this.transformarRelacionamentoCriado(evento);
      default:
        throw new Error(`Tipo de evento não suportado pela estratégia de modelagem: ${evento.tipo_evento}`);
    }
  }

  private transformarModeloHomologado(evento: EventoAnalitico): CandidatoEvidencia {
    const payload = evento.payload as unknown as PayloadModeloHomologado;

    return {
      tipo: TipoEvidenciaAnalitica.MODELAGEM,
      etapa_origem: EtapaOrigemEvidencia.MODELAGEM,
      artefato_origem_tipo: 'MODELO_ANALITICO',
      artefato_origem_id: payload.modeloId,
      titulo: `Homologação Formal do Modelo Analítico: ${payload.nomeModelo}`,
      descricao: `O modelo analítico '${payload.nomeModelo}' (arquitetura ${payload.tipoArquitetura}) foi formalmente homologado pelo analista após validação determinística de conformidade contra as regras de modelagem.`,

      // Rigor Epistêmico (Captura Automática != Autoria Automática)
      fato_observado: `Modelo '${payload.nomeModelo}' atingiu prontidão vinculada ao dataset '${payload.datasetAutorizadoId}'. Alertas críticos justificados: ${payload.totalAlertasReconhecidos}. Recomendações: ${payload.totalRecomendacoes}.`,
      estado_anterior: 'Modelo analítico em rascunho / desenvolvimento estrutural, pendente de homologação.',
      acao_registrada: 'Decisão humana formal de homologação executada pelo analista com justificativa técnica formal.',
      estado_posterior: 'Modelo analítico no status HOMOLOGADO, estabelecendo a base semântica oficial da demanda.',
      resultado_mensuravel: `Homologação ativa atestando ausência de bloqueios estruturais (M-01 a M-12) e reconhecimento de ${payload.totalAlertasReconhecidos} alerta(s) crítico(s).`,
      decisao_humana: payload.justificativa,
      inferencia_recomendacao: 'Habilitar avanço para a etapa de Visualização e Construção de Relatórios (Power BI / DAX).',

      classificacao_exposicao: ClassificacaoExposicaoEvidencia.INTERNA,
      elegibilidade_portfolio: true,
      metadados_adicionais: {
        modelo_id: payload.modeloId,
        tipo_arquitetura: payload.tipoArquitetura,
        dataset_autorizado_id: payload.datasetAutorizadoId,
        total_alertas_reconhecidos: payload.totalAlertasReconhecidos,
        total_recomendacoes: payload.totalRecomendacoes,
        homologado_por: payload.homologadoPor,
        autor_tipo: 'HUMANO',
        captura_automatica: true,
      },
    };
  }

  private transformarCalendarioEspecificado(evento: EventoAnalitico): CandidatoEvidencia {
    const payload = evento.payload as unknown as PayloadCalendarioEspecificado;
    const periodo = payload.dataInicio && payload.dataFim
      ? ` com cobertura temporal de ${payload.dataInicio} a ${payload.dataFim}`
      : '';

    return {
      tipo: TipoEvidenciaAnalitica.MODELAGEM,
      etapa_origem: EtapaOrigemEvidencia.MODELAGEM,
      artefato_origem_tipo: 'ENTIDADE_ANALITICA',
      artefato_origem_id: payload.entidadeId,
      titulo: `Especificação de Dimensão Calendário: ${payload.nomeEntidade}`,
      descricao: `Dimensão temporal/calendário padronizada especificada no modelo com ${payload.totalAtributosGerados} atributos temporais${periodo}.`,

      // Rigor Epistêmico (Artefato Criado != Qualidade Global Certificada)
      fato_observado: `Entidade de calendário '${payload.nomeEntidade}' criada com papel DIMENSAO_CALENDARIO e ${payload.totalAtributosGerados} atributos temporais.`,
      estado_anterior: 'Modelo sem dimensão de tempo padronizada para inteligência temporal.',
      acao_registrada: `Decisão de modelagem de especificar dimensão temporal padronizada${periodo}.`,
      estado_posterior: 'Dimensão calendário integrada ao catálogo conceitual de entidades do modelo.',
      resultado_mensuravel: `${payload.totalAtributosGerados} atributos de agregação temporal estruturados. (Nota: não atesta isoladamente conformidade global do modelo).`,
      inferencia_recomendacao: 'Conectar a dimensão calendário às tabelas fato do modelo através de chaves de data.',

      classificacao_exposicao: ClassificacaoExposicaoEvidencia.INTERNA,
      elegibilidade_portfolio: true,
      metadados_adicionais: {
        entidade_id: payload.entidadeId,
        modelo_id: payload.modeloId,
        total_atributos: payload.totalAtributosGerados,
        data_inicio: payload.dataInicio ?? null,
        data_fim: payload.dataFim ?? null,
      },
    };
  }

  private transformarMetricaCadastrada(evento: EventoAnalitico): CandidatoEvidencia {
    const payload = evento.payload as unknown as PayloadMetricaCadastrada;
    const rastreabilidade = payload.perguntaNegocioAssociada
      ? ` Rastreabilidade: Pergunta de negócio associada: "${payload.perguntaNegocioAssociada}".`
      : '';

    return {
      tipo: TipoEvidenciaAnalitica.MODELAGEM,
      etapa_origem: EtapaOrigemEvidencia.MODELAGEM,
      artefato_origem_tipo: 'METRICA_ANALITICA',
      artefato_origem_id: payload.metricaId,
      titulo: `Formalização Semântica de Métrica: ${payload.nome}`,
      descricao: `Métrica analítica '${payload.nome}' cadastrada formalmente com tipo de agregação '${payload.tipoAgregacao}' e aditividade '${payload.tipoAditividade}'.${rastreabilidade}`,

      // Rigor Epistêmico (Artefato Criado != Qualidade Global Certificada)
      fato_observado: `Métrica '${payload.nome}' especificada com fórmula declarativa '${payload.formulaDeclarativa}' e unidade '${payload.unidadeMedida}'.`,
      estado_anterior: 'Indicador de negócio não formalizado no catálogo semântico do modelo.',
      acao_registrada: `Cadastro declarativo de métrica com agregação '${payload.tipoAgregacao}' e aditividade '${payload.tipoAditividade}'.`,
      estado_posterior: 'Métrica cadastrada e disponível para consumo em visualizações e medidas DAX.',
      resultado_mensuravel: `Fórmula declarativa formalizada (${payload.formulaDeclarativa}). (Nota: não atesta isoladamente conformidade global do modelo).`,
      decisao_humana: payload.objetivoNegocioAssociado ?? null,
      inferencia_recomendacao: 'Implementar a expressão DAX correspondente durante a fase de Dashboard.',

      classificacao_exposicao: ClassificacaoExposicaoEvidencia.INTERNA,
      elegibilidade_portfolio: true,
      metadados_adicionais: {
        metrica_id: payload.metricaId,
        modelo_id: payload.modeloId,
        tipo_agregacao: payload.tipoAgregacao,
        tipo_aditividade: payload.tipoAditividade,
        unidade_medida: payload.unidadeMedida,
        pergunta_negocio: payload.perguntaNegocioAssociada ?? null,
        objetivo_negocio: payload.objetivoNegocioAssociado ?? null,
      },
    };
  }

  private transformarRelacionamentoCriado(evento: EventoAnalitico): CandidatoEvidencia {
    const payload = evento.payload as unknown as PayloadRelacionamentoCriado;
    const justificativa = payload.justificativa ? ` Justificativa técnica: ${payload.justificativa}.` : '';

    return {
      tipo: TipoEvidenciaAnalitica.MODELAGEM,
      etapa_origem: EtapaOrigemEvidencia.MODELAGEM,
      artefato_origem_tipo: 'RELACIONAMENTO_ANALITICO',
      artefato_origem_id: payload.relacionamentoId,
      titulo: `Estabelecimento de Relacionamento: ${payload.entidadeOrigemNome} -> ${payload.entidadeDestinoNome}`,
      descricao: `Relacionamento analítico estabelecido entre '${payload.entidadeOrigemNome}.${payload.atributoOrigemNome}' e '${payload.entidadeDestinoNome}.${payload.atributoDestinoNome}' com cardinalidade '${payload.tipoRelacionamento}' e filtro '${payload.direcaoFiltro}'.${justificativa}`,

      // Rigor Epistêmico (Artefato Criado != Qualidade Global Certificada)
      fato_observado: `Conexão relacional criada entre '${payload.entidadeOrigemNome}' e '${payload.entidadeDestinoNome}' com cardinalidade '${payload.tipoRelacionamento}'.`,
      estado_anterior: 'Entidades analíticas sem conexão relacional explícita declarada no modelo.',
      acao_registrada: `Definição de relacionamento estrutural com cardinalidade '${payload.tipoRelacionamento}' e filtro '${payload.direcaoFiltro}'.`,
      estado_posterior: 'Relacionamento ativo inserido na malha relacional do modelo analítico.',
      resultado_mensuravel: `Caminho de propagação de filtros estabelecido (${payload.direcaoFiltro}). (Nota: não atesta isoladamente conformidade global do modelo).`,
      decisao_humana: payload.justificativa ?? null,
      inferencia_recomendacao: 'Verificar a conformidade do modelo (regras M-01 a M-12) para assegurar aciclicidade e conectividade.',

      classificacao_exposicao: ClassificacaoExposicaoEvidencia.INTERNA,
      elegibilidade_portfolio: true,
      metadados_adicionais: {
        relacionamento_id: payload.relacionamentoId,
        modelo_id: payload.modeloId,
        entidade_origem: payload.entidadeOrigemNome,
        entidade_destino: payload.entidadeDestinoNome,
        tipo_relacionamento: payload.tipoRelacionamento,
        direcao_filtro: payload.direcaoFiltro,
      },
    };
  }
}
