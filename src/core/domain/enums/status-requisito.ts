/**
 * Status do Requisito Analítico (V1 — v1-domain-model.md 3.4)
 */
export enum StatusRequisito {
  IDENTIFICADO = 'IDENTIFICADO',
  CLARIFICADO = 'CLARIFICADO',
  ATENDIDO = 'ATENDIDO',
  DESCARTADO = 'DESCARTADO',
}

export const ROTULOS_STATUS_REQUISITO: Record<StatusRequisito, string> = {
  [StatusRequisito.IDENTIFICADO]: 'Identificado',
  [StatusRequisito.CLARIFICADO]: 'Clarificado',
  [StatusRequisito.ATENDIDO]: 'Atendido',
  [StatusRequisito.DESCARTADO]: 'Descartado',
};
