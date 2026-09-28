/**
 * StatusAutorizacaoDataset (V1 — Subunidade 3.5A / Domínio de Preparação)
 * Estado da homologação e autorização de um ativo de dados para alimentar a Fase de Modelagem e Análise.
 */
export enum StatusAutorizacaoDataset {
  VIGENTE = 'VIGENTE',
  REVOGADO = 'REVOGADO',
  SUBSTITUIDO = 'SUBSTITUIDO',
}

export const ROTULOS_STATUS_AUTORIZACAO_DATASET: Record<StatusAutorizacaoDataset, string> = {
  [StatusAutorizacaoDataset.VIGENTE]: 'Vigente / Autorizado',
  [StatusAutorizacaoDataset.REVOGADO]: 'Revogado pelo Analista',
  [StatusAutorizacaoDataset.SUBSTITUIDO]: 'Substituído por Nova Versão',
};
