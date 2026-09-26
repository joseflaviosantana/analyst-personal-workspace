/**
 * Status do ciclo de vida de uma Regra de Qualidade de Dados (Subunidade 3.4B)
 *
 * Ciclo de vida formal:
 * ATIVA --desativar--> INATIVA
 * INATIVA --reativar--> ATIVA
 *
 * Regra inegociável da V1: Não existe exclusão física de regras.
 */
export enum StatusRegraQualidade {
  ATIVA = 'ATIVA',
  INATIVA = 'INATIVA',
}
