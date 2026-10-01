/**
 * src/core/domain/enums/etapa-origem-evidencia.ts
 *
 * Etapa do workflow analítico de onde se originou o artefato ou fato da evidência.
 */

export const EtapaOrigemEvidencia = {
  REQUISITOS: 'REQUISITOS',
  DADOS: 'DADOS',
  QUALIDADE: 'QUALIDADE',
  PREPARACAO: 'PREPARACAO',
  MODELAGEM: 'MODELAGEM',
  POWERBI_DASHBOARD: 'POWERBI_DASHBOARD',
  VALIDACAO: 'VALIDACAO',
  ENTREGA: 'ENTREGA',
  REVISAO: 'REVISAO',
  GERAL: 'GERAL',
} as const;

export type EtapaOrigemEvidencia =
  (typeof EtapaOrigemEvidencia)[keyof typeof EtapaOrigemEvidencia];

export const ROTULOS_ETAPA_ORIGEM_EVIDENCIA: Record<EtapaOrigemEvidencia, string> = {
  [EtapaOrigemEvidencia.REQUISITOS]: 'Aba 2 — Requisitos & Clarificação',
  [EtapaOrigemEvidencia.DADOS]: 'Aba 3 — Ativos de Dados',
  [EtapaOrigemEvidencia.QUALIDADE]: 'Aba 4 — Qualidade',
  [EtapaOrigemEvidencia.PREPARACAO]: 'Aba 5 — Preparação',
  [EtapaOrigemEvidencia.MODELAGEM]: 'Aba 6 — Modelagem',
  [EtapaOrigemEvidencia.POWERBI_DASHBOARD]: 'Aba 7 — Power BI & DAX',
  [EtapaOrigemEvidencia.VALIDACAO]: 'Aba 9 — Validação',
  [EtapaOrigemEvidencia.ENTREGA]: 'Aba 10 — Entregáveis',
  [EtapaOrigemEvidencia.REVISAO]: 'Aba 11 — Dossiê & Portfólio',
  [EtapaOrigemEvidencia.GERAL]: 'Fluxo Geral da Demanda',
};
