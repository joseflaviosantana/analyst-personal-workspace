/**
 * StatusProblemaQualidade (V1 — FSD RF-021 e v1-domain-model.md Seção 3.7)
 * Ciclo de vida e governança de resolução da anomalia de qualidade.
 */
export enum StatusProblemaQualidade {
  ABERTO = 'ABERTO',
  EM_INVESTIGACAO = 'EM_INVESTIGACAO',
  TRATADO = 'TRATADO',
  ACEITO_COMO_RESTRICAO = 'ACEITO_COMO_RESTRICAO',
}

export const ROTULOS_STATUS_PROBLEMA_QUALIDADE: Record<StatusProblemaQualidade, string> = {
  [StatusProblemaQualidade.ABERTO]: 'Aberto',
  [StatusProblemaQualidade.EM_INVESTIGACAO]: 'Em Investigação',
  [StatusProblemaQualidade.TRATADO]: 'Tratado / Resolvido',
  [StatusProblemaQualidade.ACEITO_COMO_RESTRICAO]: 'Aceito como Restrição',
};
