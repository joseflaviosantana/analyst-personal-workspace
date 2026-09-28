/**
 * Tipo de Origem da Entidade Analítica (Subunidade 3.6A)
 * Distingue entidades mapeadas a partir do dataset autorizado de entidades geradas/declaradas pelo sistema (ex: Dimensão Calendário lógica)
 */
export enum TipoOrigemEntidade {
  DATASET_AUTORIZADO = 'DATASET_AUTORIZADO',
  DIMENSAO_SISTEMA = 'DIMENSAO_SISTEMA',
}
