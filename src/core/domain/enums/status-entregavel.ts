/**
 * Status do Entregável Profissional (V1 — FSD CF-17 e v1-domain-model.md Seção 3.18)
 * Ciclo de vida do artefato na esteira de entrega.
 */
export enum StatusEntregavel {
  RASCUNHO = 'RASCUNHO',
  DISPONIVEL = 'DISPONIVEL',
  HOMOLOGADO = 'HOMOLOGADO',
  SUBSTITUIDO = 'SUBSTITUIDO',
}

export const ROTULOS_STATUS_ENTREGAVEL: Record<StatusEntregavel, string> = {
  [StatusEntregavel.RASCUNHO]: 'Rascunho',
  [StatusEntregavel.DISPONIVEL]: 'Disponível para Entrega',
  [StatusEntregavel.HOMOLOGADO]: 'Homologado',
  [StatusEntregavel.SUBSTITUIDO]: 'Substituído',
};
