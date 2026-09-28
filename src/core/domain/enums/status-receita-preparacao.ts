/**
 * StatusReceitaPreparacao (V1 — Subunidade 3.5A / Domínio de Preparação)
 * Ciclo de vida operacional da receita de preparação da demanda.
 */
export enum StatusReceitaPreparacao {
  RASCUNHO = 'RASCUNHO',
  EM_EXECUCAO = 'EM_EXECUCAO',
  CONCLUIDA = 'CONCLUIDA',
  OBSOLETA = 'OBSOLETA',
}

export const ROTULOS_STATUS_RECEITA_PREPARACAO: Record<StatusReceitaPreparacao, string> = {
  [StatusReceitaPreparacao.RASCUNHO]: 'Rascunho / Planejamento',
  [StatusReceitaPreparacao.EM_EXECUCAO]: 'Em Execução',
  [StatusReceitaPreparacao.CONCLUIDA]: 'Concluída / Homologada',
  [StatusReceitaPreparacao.OBSOLETA]: 'Obsoleta / Substituída',
};
