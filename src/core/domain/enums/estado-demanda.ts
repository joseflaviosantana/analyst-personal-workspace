/**
 * Estados da Demanda (V1 — v1-domain-model.md, professional-workflow.md e v1-functional-specification.md)
 * 8 Estados Normais Sequenciais + 2 Estados Excepcionais Não Sequenciais (INC-02)
 */
export enum EstadoDemanda {
  // 8 Estados Normais Sequenciais da Esteira Oficial da V1
  NOVA = 'NOVA',
  EM_CLARIFICACAO = 'EM_CLARIFICACAO',
  DADOS_RECEBIDOS = 'DADOS_RECEBIDOS',
  EM_QUALIDADE_E_PREPARACAO = 'EM_QUALIDADE_E_PREPARACAO',
  EM_MODELAGEM_E_ANALISE = 'EM_MODELAGEM_E_ANALISE',
  EM_VALIDACAO = 'EM_VALIDACAO',
  PRONTA_PARA_ENTREGA = 'PRONTA_PARA_ENTREGA',
  CONCLUIDA = 'CONCLUIDA',

  // 2 Estados Excepcionais (Não Sequenciais — INC-02, CF-22, EXC-07)
  SUSPENSA = 'SUSPENSA',
  CANCELADA = 'CANCELADA',

  // Compatibilidade transitória com registros históricos do Bloco 0/1
  BACKLOG = 'BACKLOG',
  ENTENDIMENTO = 'ENTENDIMENTO',
  PREPARACAO_DADOS = 'PREPARACAO_DADOS',
  MODELAGEM_DAX = 'MODELAGEM_DAX',
  ANALISE_EXPLORATORIA = 'ANALISE_EXPLORATORIA',
  RECONCILIACAO = 'RECONCILIACAO',
  DOCUMENTACAO_PORTFOLIO = 'DOCUMENTACAO_PORTFOLIO',
  EM_REVISAO_HOMOLOGACAO = 'EM_REVISAO_HOMOLOGACAO',
}

/**
 * Sequência oficial e ordenada dos 8 estados normais da V1
 */
export const ESTADOS_ORDENADOS_SEQUENCIAIS: EstadoDemanda[] = [
  EstadoDemanda.NOVA,
  EstadoDemanda.EM_CLARIFICACAO,
  EstadoDemanda.DADOS_RECEBIDOS,
  EstadoDemanda.EM_QUALIDADE_E_PREPARACAO,
  EstadoDemanda.EM_MODELAGEM_E_ANALISE,
  EstadoDemanda.EM_VALIDACAO,
  EstadoDemanda.PRONTA_PARA_ENTREGA,
  EstadoDemanda.CONCLUIDA,
];

/**
 * Estados excepcionais (não pertencem à esteira linear sequencial)
 */
export const ESTADOS_EXCEPCIONAIS: EstadoDemanda[] = [
  EstadoDemanda.SUSPENSA,
  EstadoDemanda.CANCELADA,
];

/**
 * Estados terminais e imutáveis da Demanda (encerramento normal ou excepcional)
 */
export const ESTADOS_TERMINAIS: EstadoDemanda[] = [
  EstadoDemanda.CONCLUIDA,
  EstadoDemanda.CANCELADA,
];

/**
 * Verifica de forma pura e centralizada se o estado é terminal/imutável (CONCLUIDA ou CANCELADA)
 */
export function isEstadoTerminal(estado: string | EstadoDemanda): boolean {
  const normalizado = normalizarEstadoDemanda(estado);
  return normalizado === EstadoDemanda.CONCLUIDA || normalizado === EstadoDemanda.CANCELADA;
}

/**
 * Verifica se a demanda está em modo estritamente somente-leitura (CONCLUIDA, CANCELADA ou SUSPENSA)
 */
export function isEstadoReadOnly(estado: string | EstadoDemanda): boolean {
  const normalizado = normalizarEstadoDemanda(estado);
  return (
    normalizado === EstadoDemanda.CONCLUIDA ||
    normalizado === EstadoDemanda.CANCELADA ||
    normalizado === EstadoDemanda.SUSPENSA
  );
}

/**
 * Rótulos oficiais em português conforme documentação normativa
 */
export const ROTULOS_ESTADO_DEMANDA: Record<EstadoDemanda, string> = {
  [EstadoDemanda.NOVA]: 'Nova',
  [EstadoDemanda.EM_CLARIFICACAO]: 'Em Clarificação',
  [EstadoDemanda.DADOS_RECEBIDOS]: 'Dados Recebidos',
  [EstadoDemanda.EM_QUALIDADE_E_PREPARACAO]: 'Em Qualidade e Preparação',
  [EstadoDemanda.EM_MODELAGEM_E_ANALISE]: 'Em Modelagem e Análise',
  [EstadoDemanda.EM_VALIDACAO]: 'Em Validação',
  [EstadoDemanda.PRONTA_PARA_ENTREGA]: 'Pronta para Entrega',
  [EstadoDemanda.CONCLUIDA]: 'Concluída',
  [EstadoDemanda.SUSPENSA]: 'Suspensa',
  [EstadoDemanda.CANCELADA]: 'Cancelada',
  // Legados
  [EstadoDemanda.BACKLOG]: 'Nova',
  [EstadoDemanda.ENTENDIMENTO]: 'Em Clarificação',
  [EstadoDemanda.PREPARACAO_DADOS]: 'Em Qualidade e Preparação',
  [EstadoDemanda.MODELAGEM_DAX]: 'Em Modelagem e Análise',
  [EstadoDemanda.ANALISE_EXPLORATORIA]: 'Em Modelagem e Análise',
  [EstadoDemanda.RECONCILIACAO]: 'Em Validação',
  [EstadoDemanda.DOCUMENTACAO_PORTFOLIO]: 'Pronta para Entrega',
  [EstadoDemanda.EM_REVISAO_HOMOLOGACAO]: 'Suspensa',
};

/**
 * Mapeamento de cores para badges de estado da UX
 */
export const ESTILOS_BADGE_ESTADO: Record<
  EstadoDemanda,
  { bg: string; text: string; border: string; dot: string }
> = {
  [EstadoDemanda.NOVA]: {
    bg: 'bg-blue-950/60',
    text: 'text-blue-300',
    border: 'border-blue-800/80',
    dot: 'bg-blue-400',
  },
  [EstadoDemanda.EM_CLARIFICACAO]: {
    bg: 'bg-indigo-950/60',
    text: 'text-indigo-300',
    border: 'border-indigo-800/80',
    dot: 'bg-indigo-400',
  },
  [EstadoDemanda.DADOS_RECEBIDOS]: {
    bg: 'bg-cyan-950/60',
    text: 'text-cyan-300',
    border: 'border-cyan-800/80',
    dot: 'bg-cyan-400',
  },
  [EstadoDemanda.EM_QUALIDADE_E_PREPARACAO]: {
    bg: 'bg-teal-950/60',
    text: 'text-teal-300',
    border: 'border-teal-800/80',
    dot: 'bg-teal-400',
  },
  [EstadoDemanda.EM_MODELAGEM_E_ANALISE]: {
    bg: 'bg-purple-950/60',
    text: 'text-purple-300',
    border: 'border-purple-800/80',
    dot: 'bg-purple-400',
  },
  [EstadoDemanda.EM_VALIDACAO]: {
    bg: 'bg-amber-950/60',
    text: 'text-amber-300',
    border: 'border-amber-800/80',
    dot: 'bg-amber-400',
  },
  [EstadoDemanda.PRONTA_PARA_ENTREGA]: {
    bg: 'bg-emerald-950/60',
    text: 'text-emerald-300',
    border: 'border-emerald-800/80',
    dot: 'bg-emerald-400',
  },
  [EstadoDemanda.CONCLUIDA]: {
    bg: 'bg-green-950/70',
    text: 'text-green-300',
    border: 'border-green-800/80',
    dot: 'bg-green-400',
  },
  [EstadoDemanda.SUSPENSA]: {
    bg: 'bg-amber-950/80',
    text: 'text-amber-300',
    border: 'border-amber-700',
    dot: 'bg-amber-400',
  },
  [EstadoDemanda.CANCELADA]: {
    bg: 'bg-rose-950/80',
    text: 'text-rose-300',
    border: 'border-rose-800',
    dot: 'bg-rose-400',
  },
  // Legados
  [EstadoDemanda.BACKLOG]: {
    bg: 'bg-blue-950/60',
    text: 'text-blue-300',
    border: 'border-blue-800/80',
    dot: 'bg-blue-400',
  },
  [EstadoDemanda.ENTENDIMENTO]: {
    bg: 'bg-indigo-950/60',
    text: 'text-indigo-300',
    border: 'border-indigo-800/80',
    dot: 'bg-indigo-400',
  },
  [EstadoDemanda.PREPARACAO_DADOS]: {
    bg: 'bg-teal-950/60',
    text: 'text-teal-300',
    border: 'border-teal-800/80',
    dot: 'bg-teal-400',
  },
  [EstadoDemanda.MODELAGEM_DAX]: {
    bg: 'bg-purple-950/60',
    text: 'text-purple-300',
    border: 'border-purple-800/80',
    dot: 'bg-purple-400',
  },
  [EstadoDemanda.ANALISE_EXPLORATORIA]: {
    bg: 'bg-purple-950/60',
    text: 'text-purple-300',
    border: 'border-purple-800/80',
    dot: 'bg-purple-400',
  },
  [EstadoDemanda.RECONCILIACAO]: {
    bg: 'bg-amber-950/60',
    text: 'text-amber-300',
    border: 'border-amber-800/80',
    dot: 'bg-amber-400',
  },
  [EstadoDemanda.DOCUMENTACAO_PORTFOLIO]: {
    bg: 'bg-emerald-950/60',
    text: 'text-emerald-300',
    border: 'border-emerald-800/80',
    dot: 'bg-emerald-400',
  },
  [EstadoDemanda.EM_REVISAO_HOMOLOGACAO]: {
    bg: 'bg-amber-950/80',
    text: 'text-amber-300',
    border: 'border-amber-700',
    dot: 'bg-amber-400',
  },
};

/**
 * Normaliza qualquer valor para o EstadoDemanda oficial correspondente
 */
export function normalizarEstadoDemanda(estado: string | EstadoDemanda): EstadoDemanda {
  if (estado === 'BACKLOG') return EstadoDemanda.NOVA;
  if (estado === 'ENTENDIMENTO') return EstadoDemanda.EM_CLARIFICACAO;
  if (estado === 'PREPARACAO_DADOS') return EstadoDemanda.EM_QUALIDADE_E_PREPARACAO;
  if (estado === 'MODELAGEM_DAX' || estado === 'ANALISE_EXPLORATORIA') return EstadoDemanda.EM_MODELAGEM_E_ANALISE;
  if (estado === 'RECONCILIACAO') return EstadoDemanda.EM_VALIDACAO;
  if (estado === 'DOCUMENTACAO_PORTFOLIO') return EstadoDemanda.PRONTA_PARA_ENTREGA;
  if (estado === 'EM_REVISAO_HOMOLOGACAO') return EstadoDemanda.SUSPENSA;
  if (Object.values(EstadoDemanda).includes(estado as EstadoDemanda)) {
    return estado as EstadoDemanda;
  }
  return EstadoDemanda.NOVA;
}

/**
 * Validador puro de transições simples (compatibilidade de API direta)
 */
export function isTransicaoPermitida(origem: EstadoDemanda, destino: EstadoDemanda): boolean {
  if (origem === destino) return false;
  if (isEstadoTerminal(origem)) return false;
  return true;
}
