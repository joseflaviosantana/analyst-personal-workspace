/**
 * Categoria do Padrão de Cálculo da Medida DAX (V1 — Subunidade 3.7 / Bloco 7)
 */
export enum CategoriaMedidaDax {
  AGREGACAO_SIMPLES = 'AGREGACAO_SIMPLES',
  TAXA_DIVISAO = 'TAXA_DIVISAO',
  CALCULATE_MODIFICADOR = 'CALCULATE_MODIFICADOR',
  TIME_INTELLIGENCE = 'TIME_INTELLIGENCE',
  WHAT_IF = 'WHAT_IF',
  OUTRO = 'OUTRO',
}

export const ROTULOS_CATEGORIA_MEDIDA_DAX: Record<CategoriaMedidaDax, string> = {
  [CategoriaMedidaDax.AGREGACAO_SIMPLES]: 'Agregação Simples (SUM, COUNT, etc.)',
  [CategoriaMedidaDax.TAXA_DIVISAO]: 'Taxa / Razão / Percentual (DIVIDE)',
  [CategoriaMedidaDax.CALCULATE_MODIFICADOR]: 'Modificador de Filtro (CALCULATE)',
  [CategoriaMedidaDax.TIME_INTELLIGENCE]: 'Inteligência Temporal (YTD, MTD, etc.)',
  [CategoriaMedidaDax.WHAT_IF]: 'Parâmetro / Simulação What-If',
  [CategoriaMedidaDax.OUTRO]: 'Outro Padrão Analítico',
};
