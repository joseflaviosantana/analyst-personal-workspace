/**
 * Status de Governança do Modelo Power BI (V1 — Subunidade 3.7 / Bloco 7)
 */
export enum StatusModeloPowerBi {
  EM_DESENVOLVIMENTO = 'EM_DESENVOLVIMENTO',
  CONCLUIDO = 'CONCLUIDO',
  HOMOLOGADO = 'HOMOLOGADO',
}

export const ROTULOS_STATUS_MODELO_POWERBI: Record<StatusModeloPowerBi, string> = {
  [StatusModeloPowerBi.EM_DESENVOLVIMENTO]: 'Em Desenvolvimento',
  [StatusModeloPowerBi.CONCLUIDO]: 'Concluído',
  [StatusModeloPowerBi.HOMOLOGADO]: 'Homologado',
};
