/**
 * StatusExecucaoDiagnostico (V1 — Subunidade 3.4A)
 * Estado da execução do diagnóstico de qualidade sobre o ativo de dados.
 */
export enum StatusExecucaoDiagnostico {
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  CONCLUIDO = 'CONCLUIDO',
  CONCLUIDO_PARCIALMENTE = 'CONCLUIDO_PARCIALMENTE',
  FALHA = 'FALHA',
}

export const ROTULOS_STATUS_EXECUCAO_DIAGNOSTICO: Record<StatusExecucaoDiagnostico, string> = {
  [StatusExecucaoDiagnostico.EM_ANDAMENTO]: 'Em Andamento',
  [StatusExecucaoDiagnostico.CONCLUIDO]: 'Concluído',
  [StatusExecucaoDiagnostico.CONCLUIDO_PARCIALMENTE]: 'Concluído Parcialmente (com limitações)',
  [StatusExecucaoDiagnostico.FALHA]: 'Falha na Execução',
};
