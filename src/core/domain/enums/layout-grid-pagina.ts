/**
 * Padrão de Layout e Grid da Página do Dashboard (V1 — Subunidade 3.7 / Bloco 7)
 */
export enum LayoutGridPagina {
  PADRAO_16_9 = 'PADRAO_16_9',
  TOOLTIP = 'TOOLTIP',
  MOBILE = 'MOBILE',
}

export const ROTULOS_LAYOUT_GRID_PAGINA: Record<LayoutGridPagina, string> = {
  [LayoutGridPagina.PADRAO_16_9]: 'Padrão Panorâmico (16:9)',
  [LayoutGridPagina.TOOLTIP]: 'Dica de Ferramenta (Tooltip Page)',
  [LayoutGridPagina.MOBILE]: 'Layout Vertical (Mobile)',
};
