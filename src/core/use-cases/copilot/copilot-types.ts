/**
 * src/core/use-cases/copilot/copilot-types.ts
 *
 * Contratos e tipos do Copiloto Proativo do Analyst Personal Workspace.
 * Núcleo determinístico, desacoplado da interface e agnóstico a modelos/fornecedores de IA.
 *
 * Suporta o modelo pedagógico de 3 níveis de progressive disclosure:
 * Nível 1: Orientação operacional imediata
 * Nível 2: Aprendizado conceitual profissional
 * Nível 3: Detalhes técnicos, regras e conformidade sob demanda
 */

import { ModeloAnaliticoCompleto } from '@/core/domain/entities/modelo-analitico';
import { DatasetAutorizadoAnalise } from '@/core/domain/entities/dataset-autorizado-analise';
import { ProntidaoModeloOutput } from '@/core/use-cases/modeling';
import { ResultadoAvaliacaoConformidade, SeveridadeRegraModelagem } from '@/core/domain/rules/modeling-rules-evaluator';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';

/**
 * Níveis pedagógicos de detalhamento para Progressive Disclosure
 */
export type NivelPedagogico = 'ORIENTACAO' | 'APRENDIZADO' | 'DETALHES_TECNICOS';

/**
 * Prioridade determinística da orientação (da mais urgente para a mais informativa)
 */
export type PrioridadeMensagemCopiloto =
  | 'BLOQUEIO'
  | 'ACAO_NECESSARIA'
  | 'PROXIMO_PASSO'
  | 'ORIENTACAO'
  | 'APRENDIZADO'
  | 'INFO';

/**
 * Classificação determinística de cenários identificados na etapa de Modelagem
 */
export type CenarioModelagemCopiloto =
  | 'SEM_DATASET_VIGENTE'
  | 'SEM_MODELO_CRIADO'
  | 'HOMOLOGACAO_REVOGADA'
  | 'HOMOLOGACAO_INVALIDADA'
  | 'BLOQUEIO_CONFORMIDADE'
  | 'SEM_ENTIDADE_FATO'
  | 'SEM_METRICAS_CADASTRADAS'
  | 'ALERTA_CRITICO_PENDENTE'
  | 'PRONTO_PARA_HOMOLOGACAO'
  | 'HOMOLOGADO_E_VIGENTE'
  | 'ESTADO_GERAL_MODELAGEM';

/**
 * Tipo de ação recomendada sugerida pelo Copiloto para guiar o usuário
 */
export type TipoAcaoRecomendada =
  | 'AUTORIZAR_DATASET'
  | 'CRIAR_MODELO'
  | 'ADICIONAR_FATO'
  | 'CADASTRAR_METRICA'
  | 'RESOLVER_BLOQUEIOS'
  | 'HOMOLOGAR_COM_JUSTIFICATIVA'
  | 'HOMOLOGAR_MODELO'
  | 'REHOMOLOGAR_MODELO'
  | 'AVANCAR_WORKFLOW'
  | 'NENHUMA';

/**
 * Ação recomendada estruturada
 */
export interface AcaoRecomendadaCopiloto {
  tipo: TipoAcaoRecomendada;
  titulo: string;
  descricao: string;
  contextoAcao?: string;
  prioritaria: boolean;
}

/**
 * Conceito do Dicionário Pedagógico de Modelagem
 */
export interface ConceitoModelagem {
  id: string;
  termo: string;
  categoria: 'ESTRUTURA' | 'INTEGRIDADE' | 'METRICA' | 'GOVERNANCA';
  definicaoSimples: string;
  porQueImporta: string;
  detalheTecnico: string;
  dicaProfissional?: string;
  regrasAssociadas?: string[];
}

/**
 * Nível 1: Orientação Curta e Operacional
 * Responde prontamente: O que está acontecendo e qual a próxima ação imediata.
 */
export interface MensagemCopilotoNivel1 {
  titulo: string;
  ondeEstou: string;
  oQueEstouFazendo: string;
  oQueDevoFazerAgora: string;
  resumoOperacional: string;
}

/**
 * Nível 2: Aprendizado Conceitual Profissional
 * Explica o motivo e o princípio de BI/Data aplicado à situação real.
 */
export interface MensagemCopilotoNivel2 {
  porQueEstouFazendoIsso: string;
  oQuePrecisoCompreender: string;
  conceitosChave: ConceitoModelagem[];
  dicaProfissional?: string;
}

/**
 * Diagnóstico técnico extraído do motor de conformidade existente
 */
export interface DiagnosticoTecnicoCopiloto {
  codigo: string;
  severidade: SeveridadeRegraModelagem;
  titulo: string;
  detalhe: string;
  acaoNecessaria?: string;
}

/**
 * Nível 3: Detalhes Técnicos e Conformidade sob Demanda
 * Fornece metadados, regras M-01..M-11, diagnósticos e contadores analíticos.
 */
export interface MensagemCopilotoNivel3 {
  regrasAplicaveis: string[];
  diagnosticos: DiagnosticoTecnicoCopiloto[];
  metricasEstruturais: {
    totalEntidades: number;
    totalFatos: number;
    totalDimensoes: number;
    totalRelacionamentos: number;
    totalMetricas: number;
    totalBloqueios: number;
    totalAlertasCriticos: number;
    totalRecomendacoes: number;
    statusModelo?: string;
    statusDataset?: string;
  };
}

/**
 * As 6 Perguntas Fundamentais respondidas de forma consolidada
 */
export interface PerguntasChaveCopiloto {
  ondeEstou: string;
  oQueEstouFazendo: string;
  porQueEstouFazendoIsso: string;
  oQueDevoFazerAgora: string;
  oQuePrecisoCompreender: string;
  condicoesEBloqueios: string;
}

/**
 * Situação atual explícita e governada do trabalho
 */
export interface SituacaoAtualCopiloto {
  rotulo: string;
  descricao: string;
  impedeAvanco: boolean;
  temBloqueio: boolean;
  temAlertaCritico: boolean;
  statusVisual: 'SUCESSO' | 'ALERTA' | 'BLOQUEIO' | 'INFO';
  mensagemBloqueio?: string;
}

/**
 * Próximo passo unificado com CTA harmonizado com o WorkflowEngine
 */
export interface ProximoPassoCopiloto {
  descricao: string;
  acaoTitulo: string;
  acaoTipo: TipoAcaoRecomendada;
  podeExecutar: boolean;
  requerConfirmacaoHumana: boolean;
}

/**
 * Nova Hierarquia Informacional Refinada do Copiloto (Gate 2B.1)
 */
export interface HierarquiaPainelCopiloto {
  ondeVoceEsta: string;
  oQueEstamosFazendo: string;
  porQueEstamosFazendo: string;
  situacaoAtual: SituacaoAtualCopiloto;
  proximoPasso: ProximoPassoCopiloto;
}

/**
 * Saída completa e estruturada gerada pelo resolver determinístico
 */
export interface OrientacaoCopilotoOutput {
  cenario: CenarioModelagemCopiloto;
  prioridade: PrioridadeMensagemCopiloto;
  temBloqueio: boolean;
  temAlertaCritico: boolean;
  prontoParaAvanco: boolean;
  acaoRecomendada: AcaoRecomendadaCopiloto;
  hierarquia: HierarquiaPainelCopiloto;
  nivel1: MensagemCopilotoNivel1;
  nivel2: MensagemCopilotoNivel2;
  nivel3: MensagemCopilotoNivel3;
  perguntasChave: PerguntasChaveCopiloto;
  geradoEm: string;
}

/**
 * Contexto de entrada para o resolver determinístico do Copiloto.
 * Agrupa exclusivamente dados já fornecidos pelo domínio existente.
 */
export interface CopilotContext {
  demandaId?: string;
  estadoDemanda?: EstadoDemanda | string;
  hasDatasetAutorizado: boolean;
  datasetAutorizado?: DatasetAutorizadoAnalise | null;
  modelo?: ModeloAnaliticoCompleto | null;
  prontidao?: ProntidaoModeloOutput | null;
  resultadoConformidade?: ResultadoAvaliacaoConformidade | null;
  isReadOnly?: boolean;
}
