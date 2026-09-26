/**
 * StatusVerificacaoQualidade (V1 — Subunidade 3.4A)
 * Representa o estado epistêmico e resultado individual de cada verificação avaliada no diagnóstico.
 * Permite que a UI da Aba 4 e a auditoria distingam com precisão entre:
 * - verificação executada e limpa (sem anomalias);
 * - verificação executada com anomalias detectadas;
 * - verificação deliberadamente limitada/interrompida por guardrail;
 * - verificação não executada (ex.: precondição estrutural ausente).
 */
export enum StatusVerificacaoQualidade {
  EXECUTADA_SEM_PROBLEMAS = 'EXECUTADA_SEM_PROBLEMAS',
  EXECUTADA_COM_PROBLEMAS = 'EXECUTADA_COM_PROBLEMAS',
  LIMITADA_POR_GUARDRAIL = 'LIMITADA_POR_GUARDRAIL',
  NAO_EXECUTADA = 'NAO_EXECUTADA',
}

export const ROTULOS_STATUS_VERIFICACAO_QUALIDADE: Record<StatusVerificacaoQualidade, string> = {
  [StatusVerificacaoQualidade.EXECUTADA_SEM_PROBLEMAS]: 'Executada — Nenhum problema encontrado',
  [StatusVerificacaoQualidade.EXECUTADA_COM_PROBLEMAS]: 'Executada — Problemas identificados',
  [StatusVerificacaoQualidade.LIMITADA_POR_GUARDRAIL]: 'Limitada por Guardrail Operacional',
  [StatusVerificacaoQualidade.NAO_EXECUTADA]: 'Não Executada',
};
