/**
 * Papel Semântico da Entidade Analítica (Subunidade 3.6A)
 * Especialização funcional de Fatos e Dimensões
 */
export enum PapelEntidadeAnalitica {
  FATO_TRANSACIONAL = 'FATO_TRANSACIONAL',
  FATO_ACUMULADA = 'FATO_ACUMULADA',
  DIMENSAO_PADRAO = 'DIMENSAO_PADRAO',
  DIMENSAO_CALENDARIO = 'DIMENSAO_CALENDARIO',
  DIMENSAO_CONFORMADA = 'DIMENSAO_CONFORMADA',
  TABELA_PONTE = 'TABELA_PONTE',
}
