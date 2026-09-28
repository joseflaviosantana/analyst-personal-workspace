/**
 * StatusEtapaTransformacao (V1 — Subunidade 3.5A / Domínio de Preparação)
 * Ciclo de vida e governança de execução de uma etapa de transformação.
 */
export enum StatusEtapaTransformacao {
  PLANEJADA = 'PLANEJADA',
  EXECUTADA = 'EXECUTADA',
  VALIDADA = 'VALIDADA',
  CANCELADA = 'CANCELADA',
}

export const ROTULOS_STATUS_ETAPA_TRANSFORMACAO: Record<StatusEtapaTransformacao, string> = {
  [StatusEtapaTransformacao.PLANEJADA]: 'Planejada / Rascunho',
  [StatusEtapaTransformacao.EXECUTADA]: 'Executada Fisicamente',
  [StatusEtapaTransformacao.VALIDADA]: 'Validada por Diagnóstico',
  [StatusEtapaTransformacao.CANCELADA]: 'Cancelada Auditada',
};
