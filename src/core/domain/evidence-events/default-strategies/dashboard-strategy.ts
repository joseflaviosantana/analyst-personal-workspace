/**
 * src/core/domain/evidence-events/default-strategies/dashboard-strategy.ts
 *
 * Estratégia plugável para processamento de eventos da etapa de Power BI / DAX / Dashboard (Subgate 3.5B.4).
 * Abrange:
 * 1. DASHBOARD_MODELO_REGISTRADO: Inicialização técnica e vinculação do arquivo de modelo (.pbix / .pbip).
 * 2. DASHBOARD_ISENCAO_FORMALIZADA: Decisão metodológica de governança dispensando dashboard (ISENTO_EXCEL_ONLY).
 * 3. DASHBOARD_MEDIDA_DAX_CADASTRADA: Especificação técnica de fórmula de cálculo tabular DAX e linhagem semântica.
 * 4. DASHBOARD_PAGINA_ESTRUTURADA: Especificação de tela analítica com público-alvo e layout definidos.
 * 5. DASHBOARD_VISUAL_DEFINIDO: Definição de componente gráfico com justificativa formal de Data Visualization.
 * 6. DASHBOARD_ARQUITETURA_APROVADA: Deliberação soberana do analista aprovando o wireframe do dashboard (Human-in-the-Loop).
 * 7. DASHBOARD_MODELO_CONCLUIDO: Conclusão técnica da construção dos artefatos do dashboard.
 * 8. DASHBOARD_MODELO_HOMOLOGADO: Homologação formal de negócio e aceitação do modelo de dashboard.
 *
 * Princípios Epistemológicos Inegociáveis:
 * - Evidência de artefato != Certificação automática de competência: Registrar factual e tecnicamente o que foi feito,
 *   sem presumir ou certificar isoladamente competência em DAX, DataViz ou design.
 * - CONCLUIDO != HOMOLOGADO: Conclusão da construção técnica é distinta da homologação formal de negócio.
 * - Sintaxe != Intenção humana: Presença de DIVIDE() registra estritamente o fato observável de uso da função,
 *   sem inferir intenção defensiva a menos que haja justificativa humana explícita.
 * - Captura automática != Autoria automática: Homologações e aprovações são deliberações humanas do analista.
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

export interface PayloadModeloRegistrado {
  modeloId: string;
  nomeArquivo: string;
  tipoFormato: string;
  caminhoLocal?: string | null;
  tamanhoBytes?: number;
  modeloAnaliticoId?: string | null;
  registradoEm: string;
}

export interface PayloadIsencaoFormalizada {
  modeloId: string;
  justificativaIsencao: string;
  formalizadoPor: string;
  formalizadoEm: string;
}

export interface PayloadMedidaDaxCadastrada {
  medidaId: string;
  modeloPowerBiId: string;
  nome: string;
  tabelaHospedeira: string;
  expressaoDax: string;
  categoriaDax: string;
  formatoString?: string | null;
  metricaAnaliticaId?: string | null;
  descricao?: string | null;
  cadastradaEm: string;
}

export interface PayloadPaginaEstruturada {
  paginaId: string;
  modeloPowerBiId: string;
  nome: string;
  ordem: number;
  objetivoAnalitico?: string | null;
  publicoAlvo: string;
  layoutGrid: string;
  estruturadaEm: string;
}

export interface PayloadVisualDefinido {
  visualId: string;
  paginaId: string;
  titulo: string;
  tipoVisual: string;
  posicaoLayout: string;
  totalMedidasUtilizadas: number;
  totalAtributosUtilizados: number;
  justificativaDataViz?: string | null;
  definidoEm: string;
}

export interface PayloadArquiteturaAprovada {
  modeloPowerBiId: string;
  primeiraPaginaId: string;
  totalPaginasCriadas: number;
  totalVisuaisCriados: number;
  aprovadoPor: string;
  geradoComAuxilioCopiloto: boolean;
  aprovadoEm: string;
}

export interface PayloadModeloConcluido {
  modeloId: string;
  nomeArquivo: string;
  tipoFormato: string;
  totalMedidas: number;
  totalPaginas: number;
  totalVisuais: number;
  concluidoPor: string;
  concluidoEm: string;
}

export interface PayloadModeloHomologado {
  modeloId: string;
  nomeArquivo: string;
  tipoFormato: string;
  homologadoPor: string;
  justificativaHomologacao?: string | null;
  homologadoEm: string;
}

export class DashboardStrategy implements IEstrategiaProcessamentoEvento {
  readonly codigo = 'ESTRATEGIA_DASHBOARD';
  readonly tiposSuportados = [
    'DASHBOARD_MODELO_REGISTRADO',
    'DASHBOARD_ISENCAO_FORMALIZADA',
    'DASHBOARD_MEDIDA_DAX_CADASTRADA',
    'DASHBOARD_PAGINA_ESTRUTURADA',
    'DASHBOARD_VISUAL_DEFINIDO',
    'DASHBOARD_ARQUITETURA_APROVADA',
    'DASHBOARD_MODELO_CONCLUIDO',
    'DASHBOARD_MODELO_HOMOLOGADO',
  ] as const;

  avaliar(evento: EventoAnalitico): DecisaoPoliticaCaptura {
    switch (evento.tipo_evento) {
      case 'DASHBOARD_MODELO_REGISTRADO': {
        const payload = evento.payload as Partial<PayloadModeloRegistrado> | undefined;
        if (!payload?.modeloId || !payload?.nomeArquivo || !payload?.tipoFormato) {
          return {
            politica: 'IGNORAR',
            motivo: 'Payload de registro de modelo incompleto (modeloId, nomeArquivo ou tipoFormato ausentes).',
            requer_intervencao_humana: false,
          };
        }
        return {
          politica: 'REGISTRAR_AUTOMATICAMENTE',
          motivo: 'Modelo Power BI registrado formalmente e associado à demanda.',
          requer_intervencao_humana: false,
        };
      }

      case 'DASHBOARD_ISENCAO_FORMALIZADA': {
        const payload = evento.payload as Partial<PayloadIsencaoFormalizada> | undefined;
        if (!payload?.modeloId || !payload?.justificativaIsencao || payload.justificativaIsencao.trim().length < 15) {
          return {
            politica: 'IGNORAR',
            motivo: 'Payload de isenção incompleto ou com justificativa insuficiente (< 15 caracteres).',
            requer_intervencao_humana: false,
          };
        }
        return {
          politica: 'REGISTRAR_AUTOMATICAMENTE',
          motivo: 'Isenção de Power BI (Excel-Only) formalizada com fundamentação técnica válida.',
          requer_intervencao_humana: false,
        };
      }

      case 'DASHBOARD_MEDIDA_DAX_CADASTRADA': {
        const payload = evento.payload as Partial<PayloadMedidaDaxCadastrada> | undefined;
        if (!payload?.medidaId || !payload?.nome || !payload?.expressaoDax || !payload?.tabelaHospedeira) {
          return {
            politica: 'IGNORAR',
            motivo: 'Payload de medida DAX incompleto (medidaId, nome, expressaoDax ou tabelaHospedeira ausentes).',
            requer_intervencao_humana: false,
          };
        }
        return {
          politica: 'REGISTRAR_AUTOMATICAMENTE',
          motivo: 'Medida DAX cadastrada formalmente com expressão e tabela hospedeira definidas.',
          requer_intervencao_humana: false,
        };
      }

      case 'DASHBOARD_PAGINA_ESTRUTURADA': {
        const payload = evento.payload as Partial<PayloadPaginaEstruturada> | undefined;
        if (!payload?.paginaId || !payload?.nome) {
          return {
            politica: 'IGNORAR',
            motivo: 'Payload de página incompleto (paginaId ou nome ausentes).',
            requer_intervencao_humana: false,
          };
        }
        return {
          politica: 'REGISTRAR_AUTOMATICAMENTE',
          motivo: 'Página de relatório estruturada no modelo com objetivo e público-alvo.',
          requer_intervencao_humana: false,
        };
      }

      case 'DASHBOARD_VISUAL_DEFINIDO': {
        const payload = evento.payload as Partial<PayloadVisualDefinido> | undefined;
        if (!payload?.visualId || !payload?.titulo || !payload?.tipoVisual) {
          return {
            politica: 'IGNORAR',
            motivo: 'Payload de visual incompleto (visualId, titulo ou tipoVisual ausentes).',
            requer_intervencao_humana: false,
          };
        }
        return {
          politica: 'REGISTRAR_AUTOMATICAMENTE',
          motivo: 'Componente visual de dashboard definido com parâmetros de DataViz.',
          requer_intervencao_humana: false,
        };
      }

      case 'DASHBOARD_ARQUITETURA_APROVADA': {
        const payload = evento.payload as Partial<PayloadArquiteturaAprovada> | undefined;
        if (!payload?.modeloPowerBiId || !payload?.primeiraPaginaId) {
          return {
            politica: 'IGNORAR',
            motivo: 'Payload de aprovação de arquitetura incompleto (modeloPowerBiId ou primeiraPaginaId ausentes).',
            requer_intervencao_humana: false,
          };
        }
        return {
          politica: 'REGISTRAR_AUTOMATICAMENTE',
          motivo: 'Proposta arquitetural do dashboard deliberada e aprovada pelo analista humano.',
          requer_intervencao_humana: false,
        };
      }

      case 'DASHBOARD_MODELO_CONCLUIDO': {
        const payload = evento.payload as Partial<PayloadModeloConcluido> | undefined;
        if (!payload?.modeloId) {
          return {
            politica: 'IGNORAR',
            motivo: 'Payload de conclusão incompleto (modeloId ausente).',
            requer_intervencao_humana: false,
          };
        }
        return {
          politica: 'REGISTRAR_AUTOMATICAMENTE',
          motivo: 'Construção técnica dos artefatos do dashboard concluída pelo analista.',
          requer_intervencao_humana: false,
        };
      }

      case 'DASHBOARD_MODELO_HOMOLOGADO': {
        const payload = evento.payload as Partial<PayloadModeloHomologado> | undefined;
        if (!payload?.modeloId) {
          return {
            politica: 'IGNORAR',
            motivo: 'Payload de homologação incompleto (modeloId ausente).',
            requer_intervencao_humana: false,
          };
        }
        return {
          politica: 'REGISTRAR_AUTOMATICAMENTE',
          motivo: 'Homologação formal de negócio e aceitação do modelo de dashboard pelo analista.',
          requer_intervencao_humana: false,
        };
      }

      default:
        return {
          politica: 'IGNORAR',
          motivo: `Tipo de evento de dashboard desconhecido: ${evento.tipo_evento}`,
          requer_intervencao_humana: false,
        };
    }
  }

  transformar(evento: EventoAnalitico): CandidatoEvidencia {
    switch (evento.tipo_evento) {
      case 'DASHBOARD_MODELO_REGISTRADO':
        return this.transformarModeloRegistrado(evento);
      case 'DASHBOARD_ISENCAO_FORMALIZADA':
        return this.transformarIsencaoFormalizada(evento);
      case 'DASHBOARD_MEDIDA_DAX_CADASTRADA':
        return this.transformarMedidaDaxCadastrada(evento);
      case 'DASHBOARD_PAGINA_ESTRUTURADA':
        return this.transformarPaginaEstruturada(evento);
      case 'DASHBOARD_VISUAL_DEFINIDO':
        return this.transformarVisualDefinido(evento);
      case 'DASHBOARD_ARQUITETURA_APROVADA':
        return this.transformarArquiteturaAprovada(evento);
      case 'DASHBOARD_MODELO_CONCLUIDO':
        return this.transformarModeloConcluido(evento);
      case 'DASHBOARD_MODELO_HOMOLOGADO':
        return this.transformarModeloHomologado(evento);
      default:
        throw new Error(`Tipo de evento não suportado pela estratégia de dashboard: ${evento.tipo_evento}`);
    }
  }

  private transformarModeloRegistrado(evento: EventoAnalitico): CandidatoEvidencia {
    const payload = evento.payload as unknown as PayloadModeloRegistrado;
    const tamanhoFormatado = payload.tamanhoBytes ? ` (${payload.tamanhoBytes} bytes)` : '';
    const vinculoModelo = payload.modeloAnaliticoId ? ` vinculado ao modelo analítico '${payload.modeloAnaliticoId}'` : '';

    return {
      tipo: TipoEvidenciaAnalitica.DASHBOARD,
      etapa_origem: EtapaOrigemEvidencia.POWERBI_DASHBOARD,
      artefato_origem_tipo: 'MODELO_POWERBI',
      artefato_origem_id: payload.modeloId,
      titulo: `Registro do Modelo Power BI: ${payload.nomeArquivo}`,
      descricao: `Artefato de modelo Power BI '${payload.nomeArquivo}' (formato ${payload.tipoFormato})${tamanhoFormatado} registrado na demanda${vinculoModelo}.`,

      fato_observado: `Modelo Power BI '${payload.nomeArquivo}' cadastrado no formato ${payload.tipoFormato}.${tamanhoFormatado}`,
      estado_anterior: 'Demanda sem modelo de visualização Power BI vinculado.',
      acao_registrada: 'Registro técnico do arquivo de modelo Power BI pelo analista.',
      estado_posterior: 'Modelo ativo no workspace em status EM_DESENVOLVIMENTO.',
      resultado_mensuravel: `1 modelo Power BI registrado. (Nota: o registro de artefato não atesta isoladamente conformidade global nem prontidão para validação).`,
      inferencia_recomendacao: 'Cadastrar medidas DAX e estruturar as páginas e visuais do relatório.',

      classificacao_exposicao: ClassificacaoExposicaoEvidencia.INTERNA,
      elegibilidade_portfolio: true,
      metadados_adicionais: {
        modelo_id: payload.modeloId,
        nome_arquivo: payload.nomeArquivo,
        tipo_formato: payload.tipoFormato,
        caminho_local: payload.caminhoLocal ?? null,
        modelo_analitico_id: payload.modeloAnaliticoId ?? null,
        autor_tipo: 'HUMANO',
        captura_automatica: true,
      },
    };
  }

  private transformarIsencaoFormalizada(evento: EventoAnalitico): CandidatoEvidencia {
    const payload = evento.payload as unknown as PayloadIsencaoFormalizada;

    return {
      tipo: TipoEvidenciaAnalitica.DASHBOARD,
      etapa_origem: EtapaOrigemEvidencia.POWERBI_DASHBOARD,
      artefato_origem_tipo: 'MODELO_POWERBI',
      artefato_origem_id: payload.modeloId,
      titulo: 'Formalização de Isenção de Power BI (Excel-Only)',
      descricao: `Declaração formal de dispensa de desenvolvimento em Power BI, fundamentada pelo analista: "${payload.justificativaIsencao}".`,

      fato_observado: `Isenção de Power BI formalizada no formato ISENTO_EXCEL_ONLY com justificativa técnica de ${payload.justificativaIsencao.length} caracteres.`,
      estado_anterior: 'Demanda com escopo de visualização indefinido ou pendente de modelo Power BI.',
      acao_registrada: 'Decisão metodológica formal de isenção de Power BI registrada pelo analista.',
      estado_posterior: 'Demanda formalmente isenta de artefatos Power BI; validação prosseguirá sobre a base tabular.',
      resultado_mensuravel: 'Critério de governança D-01 / D-08 atendido via justificativa formal.',
      decisao_humana: payload.justificativaIsencao,
      inferencia_recomendacao: 'Avançar para a etapa de Validação Numérica diretamente sobre a planilha/base tabular autorizada.',

      classificacao_exposicao: ClassificacaoExposicaoEvidencia.INTERNA,
      elegibilidade_portfolio: true,
      metadados_adicionais: {
        modelo_id: payload.modeloId,
        formalizado_por: payload.formalizadoPor,
        tipo_formato: 'ISENTO_EXCEL_ONLY',
        autor_tipo: 'HUMANO',
        captura_automatica: true,
      },
    };
  }

  private transformarMedidaDaxCadastrada(evento: EventoAnalitico): CandidatoEvidencia {
    const payload = evento.payload as unknown as PayloadMedidaDaxCadastrada;
    const linhagem = payload.metricaAnaliticaId
      ? ` com linhagem vinculada à métrica '${payload.metricaAnaliticaId}'`
      : '';

    // Rigor Epistêmico (Item 4): DIVIDE() registra estritamente o fato observável de uso da função.
    // NUNCA presumir intenção defensiva humana a menos que haja justificativa explícita registrada.
    const usaDivide = payload.expressaoDax.toUpperCase().includes('DIVIDE');
    const notaSintaxe = usaDivide ? ' A expressão utiliza a função DIVIDE().' : '';

    return {
      tipo: TipoEvidenciaAnalitica.DAX,
      etapa_origem: EtapaOrigemEvidencia.POWERBI_DASHBOARD,
      artefato_origem_tipo: 'MEDIDA_DAX',
      artefato_origem_id: payload.medidaId,
      titulo: `Cadastro de Medida DAX: ${payload.nome}`,
      descricao: `Medida tabular '${payload.nome}' cadastrada na tabela hospedeira '${payload.tabelaHospedeira}' com categoria '${payload.categoriaDax}'${linhagem}.${notaSintaxe}`,

      // Rigor Epistêmico: Registro Factual sem Certificação Automática de Competência
      fato_observado: `Medida DAX '${payload.nome}' formalizada com fórmula '${payload.expressaoDax}' na tabela '${payload.tabelaHospedeira}'.${notaSintaxe}`,
      estado_anterior: 'Indicador de cálculo sem implementação técnica DAX no modelo tabular.',
      acao_registrada: 'Implementação técnica de expressão de cálculo tabular DAX pelo analista.',
      estado_posterior: 'Medida DAX cadastrada e disponível para consumo em páginas e visuais do relatório.',
      resultado_mensuravel: `1 medida DAX cadastrada. Sintaxe e tabela hospedeira verificadas deterministicamente. (Nota: o registro de artefato não certifica isoladamente competência em DAX nem conformidade global do modelo).`,
      decisao_humana: payload.descricao ?? null,
      inferencia_recomendacao: 'Vincular a medida a visuais do relatório e verificar conformidade (regras D-01 a D-08).',

      classificacao_exposicao: ClassificacaoExposicaoEvidencia.INTERNA,
      elegibilidade_portfolio: true,
      metadados_adicionais: {
        medida_id: payload.medidaId,
        modelo_powerbi_id: payload.modeloPowerBiId,
        tabela_hospedeira: payload.tabelaHospedeira,
        categoria_dax: payload.categoriaDax,
        formato_string: payload.formatoString ?? null,
        metrica_analitica_id: payload.metricaAnaliticaId ?? null,
        usa_divide: usaDivide,
        autor_tipo: 'HUMANO',
        captura_automatica: true,
      },
    };
  }

  private transformarPaginaEstruturada(evento: EventoAnalitico): CandidatoEvidencia {
    const payload = evento.payload as unknown as PayloadPaginaEstruturada;
    const objetivo = payload.objetivoAnalitico ? ` Objetivo: "${payload.objetivoAnalitico}".` : '';

    return {
      tipo: TipoEvidenciaAnalitica.DASHBOARD,
      etapa_origem: EtapaOrigemEvidencia.POWERBI_DASHBOARD,
      artefato_origem_tipo: 'PAGINA_RELATORIO',
      artefato_origem_id: payload.paginaId,
      titulo: `Estruturação de Página de Relatório: ${payload.nome}`,
      descricao: `Página de relatório '${payload.nome}' estruturada com layout '${payload.layoutGrid}' para o público-alvo '${payload.publicoAlvo}'.${objetivo}`,

      // Rigor Epistêmico: Registro Factual sem Certificação Automática de Competência
      fato_observado: `Página de relatório '${payload.nome}' criada (ordem ${payload.ordem}) com layout '${payload.layoutGrid}' e público '${payload.publicoAlvo}'.`,
      estado_anterior: 'Relatório sem a especificação estruturada desta tela de análise.',
      acao_registrada: 'Estruturação da página de relatório e definição de escopo cognitivo pelo analista.',
      estado_posterior: 'Página ativa no relatório pronta para receber componentes visuais.',
      resultado_mensuravel: `1 página analítica estruturada com público-alvo '${payload.publicoAlvo}' e layout '${payload.layoutGrid}'. (Nota: registro estrutural de tela, sem certificar isoladamente competência em design ou conformidade global).`,
      decisao_humana: payload.objetivoAnalitico ?? null,
      inferencia_recomendacao: 'Inserir visuais analíticos com medidas associadas e justificativas de DataViz.',

      classificacao_exposicao: ClassificacaoExposicaoEvidencia.INTERNA,
      elegibilidade_portfolio: true,
      metadados_adicionais: {
        pagina_id: payload.paginaId,
        modelo_powerbi_id: payload.modeloPowerBiId,
        publico_alvo: payload.publicoAlvo,
        layout_grid: payload.layoutGrid,
        ordem: payload.ordem,
        autor_tipo: 'HUMANO',
        captura_automatica: true,
      },
    };
  }

  private transformarVisualDefinido(evento: EventoAnalitico): CandidatoEvidencia {
    const payload = evento.payload as unknown as PayloadVisualDefinido;
    const justificativa = payload.justificativaDataViz ? ` Justificativa DataViz: ${payload.justificativaDataViz}` : '';

    return {
      tipo: TipoEvidenciaAnalitica.DASHBOARD,
      etapa_origem: EtapaOrigemEvidencia.POWERBI_DASHBOARD,
      artefato_origem_tipo: 'VISUAL_DASHBOARD',
      artefato_origem_id: payload.visualId,
      titulo: `Definição de Componente Visual: ${payload.titulo}`,
      descricao: `Visual '${payload.titulo}' do tipo '${payload.tipoVisual}' definido na posição '${payload.posicaoLayout}' com ${payload.totalMedidasUtilizadas} medida(s) e ${payload.totalAtributosUtilizados} atributo(s).${justificativa}`,

      // Rigor Epistêmico: Registro Factual sem Certificação Automática de Competência
      fato_observado: `Componente gráfico '${payload.titulo}' configurado com tipo '${payload.tipoVisual}' na posição '${payload.posicaoLayout}'.`,
      estado_anterior: 'Página sem este componente visual analítico cadastrado.',
      acao_registrada: 'Definição e posicionamento de elemento visual de relatório pelo analista.',
      estado_posterior: 'Visual ativo integrado à tela de relatório.',
      resultado_mensuravel: `1 visual do tipo '${payload.tipoVisual}' configurado com ${payload.totalMedidasUtilizadas} medida(s) associada(s). (Nota: registro de artefato com justificativa declarada, sem certificar isoladamente competência em DataViz).`,
      decisao_humana: payload.justificativaDataViz ?? null,
      inferencia_recomendacao: 'Avaliar consistência visual e rastreabilidade contra métricas homologadas.',

      classificacao_exposicao: ClassificacaoExposicaoEvidencia.INTERNA,
      elegibilidade_portfolio: true,
      metadados_adicionais: {
        visual_id: payload.visualId,
        pagina_id: payload.paginaId,
        tipo_visual: payload.tipoVisual,
        posicao_layout: payload.posicaoLayout,
        total_medidas: payload.totalMedidasUtilizadas,
        total_atributos: payload.totalAtributosUtilizados,
        autor_tipo: 'HUMANO',
        captura_automatica: true,
      },
    };
  }

  private transformarArquiteturaAprovada(evento: EventoAnalitico): CandidatoEvidencia {
    const payload = evento.payload as unknown as PayloadArquiteturaAprovada;
    const copilotoNota = payload.geradoComAuxilioCopiloto
      ? ' com auxílio consultivo do Copiloto de Dashboard'
      : '';

    return {
      tipo: TipoEvidenciaAnalitica.DASHBOARD,
      etapa_origem: EtapaOrigemEvidencia.POWERBI_DASHBOARD,
      artefato_origem_tipo: 'ARQUITETURA_DASHBOARD',
      artefato_origem_id: payload.primeiraPaginaId,
      titulo: 'Aprovação Soberana da Arquitetura do Dashboard',
      descricao: `Estrutura de páginas e visuais deliberada e aprovada pelo analista${copilotoNota}, materializando ${payload.totalPaginasCriadas} página(s) e ${payload.totalVisuaisCriados} visual(is).`,

      // Rigor Epistêmico: Decisão Humana com Copiloto
      fato_observado: `Proposta arquitetural materializada no banco SQLite: ${payload.totalPaginasCriadas} página(s) e ${payload.totalVisuaisCriados} visual(is) persistidos com identificador base '${payload.primeiraPaginaId}'.`,
      estado_anterior: 'Wireframe/proposta de dashboard em rascunho de planejamento.',
      acao_registrada: 'Decisão humana formal de aprovação arquitetural executada pelo analista.',
      estado_posterior: 'Páginas e visuais formalmente persistidos e integrados ao modelo Power BI.',
      resultado_mensuravel: `${payload.totalPaginasCriadas} página(s) e ${payload.totalVisuaisCriados} visual(is) persistidos após deliberação humana. (Nota: registro de deliberação humana com apoio de copiloto, sem constituir certificação automática de competência).`,
      decisao_humana: `Aprovação deliberada da proposta arquitetural pelo analista '${payload.aprovadoPor}'.`,
      inferencia_recomendacao: 'Avançar para a validação das regras D-01 a D-08 do modelo.',

      classificacao_exposicao: ClassificacaoExposicaoEvidencia.INTERNA,
      elegibilidade_portfolio: true,
      metadados_adicionais: {
        modelo_powerbi_id: payload.modeloPowerBiId,
        primeira_pagina_id: payload.primeiraPaginaId,
        total_paginas: payload.totalPaginasCriadas,
        total_visuais: payload.totalVisuaisCriados,
        aprovado_por: payload.aprovadoPor,
        gerado_com_auxilio_copiloto: payload.geradoComAuxilioCopiloto,
        decisao_humana_soberana: true,
        autor_tipo: 'HUMANO',
        captura_automatica: true,
      },
    };
  }

  private transformarModeloConcluido(evento: EventoAnalitico): CandidatoEvidencia {
    const payload = evento.payload as unknown as PayloadModeloConcluido;

    return {
      tipo: TipoEvidenciaAnalitica.DASHBOARD,
      etapa_origem: EtapaOrigemEvidencia.POWERBI_DASHBOARD,
      artefato_origem_tipo: 'MODELO_POWERBI',
      artefato_origem_id: payload.modeloId,
      titulo: `Conclusão Técnica da Construção do Dashboard: ${payload.nomeArquivo}`,
      descricao: `O analista concluiu a construção técnica do dashboard '${payload.nomeArquivo}' (${payload.totalPaginas} página(s), ${payload.totalVisuais} visual(is), ${payload.totalMedidas} medida(s) DAX).`,

      // Rigor Epistêmico (Item 2): CONCLUIDO != HOMOLOGADO
      fato_observado: `Modelo Power BI '${payload.nomeArquivo}' transitou para o status CONCLUIDO contendo ${payload.totalPaginas} página(s), ${payload.totalVisuais} visual(is) e ${payload.totalMedidas} medida(s) DAX.`,
      estado_anterior: 'Modelo em status EM_DESENVOLVIMENTO.',
      acao_registrada: 'Conclusão técnica da fase de construção e modelagem visual pelo analista.',
      estado_posterior: 'Modelo Power BI no status CONCLUIDO, pronto para homologação e verificação de conformidade.',
      resultado_mensuravel: `Estrutura técnica completa (${payload.totalMedidas} medidas, ${payload.totalPaginas} páginas, ${payload.totalVisuais} visuais). (Nota: reflete conclusão da construção técnica, sem constituir homologação formal de negócio).`,
      inferencia_recomendacao: 'Submeter o modelo à avaliação determinística de conformidade (D-01 a D-08) e deliberar homologação.',

      classificacao_exposicao: ClassificacaoExposicaoEvidencia.INTERNA,
      elegibilidade_portfolio: true,
      metadados_adicionais: {
        modelo_id: payload.modeloId,
        nome_arquivo: payload.nomeArquivo,
        tipo_formato: payload.tipoFormato,
        total_medidas: payload.totalMedidas,
        total_paginas: payload.totalPaginas,
        total_visuais: payload.totalVisuais,
        concluido_por: payload.concluidoPor,
        autor_tipo: 'HUMANO',
        captura_automatica: true,
      },
    };
  }

  private transformarModeloHomologado(evento: EventoAnalitico): CandidatoEvidencia {
    const payload = evento.payload as unknown as PayloadModeloHomologado;
    const justificativa = payload.justificativaHomologacao ? ` Justificativa: ${payload.justificativaHomologacao}` : '';

    return {
      tipo: TipoEvidenciaAnalitica.DASHBOARD,
      etapa_origem: EtapaOrigemEvidencia.POWERBI_DASHBOARD,
      artefato_origem_tipo: 'MODELO_POWERBI',
      artefato_origem_id: payload.modeloId,
      titulo: `Homologação Formal do Modelo de Dashboard: ${payload.nomeArquivo}`,
      descricao: `O modelo de dashboard '${payload.nomeArquivo}' foi formalmente aceito e homologado pelo analista.${justificativa}`,

      // Rigor Epistêmico (Item 2): HOMOLOGADO é deliberação formal soberana
      fato_observado: `Modelo Power BI '${payload.nomeArquivo}' homologado formalmente pelo analista '${payload.homologadoPor}'.`,
      estado_anterior: 'Modelo em desenvolvimento ou com construção concluída pendente de homologação.',
      acao_registrada: 'Decisão humana formal de homologação e aceitação do dashboard executada pelo analista.',
      estado_posterior: 'Modelo Power BI no status HOMOLOGADO, estabelecendo a entrega visual oficial da demanda.',
      resultado_mensuravel: 'Modelo apto para validação e reconciliação numérica final. Status HOMOLOGADO ativo.',
      decisao_humana: payload.justificativaHomologacao ?? `Homologação formal pelo analista ${payload.homologadoPor}.`,
      inferencia_recomendacao: 'Avançar para a etapa de Validação Numérica e Reconciliação (Aba 9).',

      classificacao_exposicao: ClassificacaoExposicaoEvidencia.INTERNA,
      elegibilidade_portfolio: true,
      metadados_adicionais: {
        modelo_id: payload.modeloId,
        nome_arquivo: payload.nomeArquivo,
        tipo_formato: payload.tipoFormato,
        homologado_por: payload.homologadoPor,
        decisao_humana_soberana: true,
        autor_tipo: 'HUMANO',
        captura_automatica: true,
      },
    };
  }
}
