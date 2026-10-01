/**
 * src/core/domain/enums/status-estudo-caso.ts
 *
 * Estados do ciclo de vida do Estudo de Caso de Portfólio (Subgate 3.9 — Aba 11).
 */

export const StatusEstudoCaso = {
  RASCUNHO: 'RASCUNHO',
  HOMOLOGADO_APROV_10: 'HOMOLOGADO_APROV_10',
} as const;

export type StatusEstudoCaso =
  (typeof StatusEstudoCaso)[keyof typeof StatusEstudoCaso];

export const ROTULOS_STATUS_ESTUDO_CASO: Record<StatusEstudoCaso, string> = {
  [StatusEstudoCaso.RASCUNHO]: 'Rascunho Privado (Em Elaboração)',
  [StatusEstudoCaso.HOMOLOGADO_APROV_10]: 'Homologado por Decisão Humana (APROV-10)',
};
