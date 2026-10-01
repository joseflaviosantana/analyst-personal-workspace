/**
 * Posicionamento e Hierarquia do Visual no Grid da Página (V1 — Subunidade 3.7 / Bloco 7)
 */
export enum PosicaoLayoutVisual {
  TOPO_KPIS = 'TOPO_KPIS',
  CENTRAL_TENDENCIAS = 'CENTRAL_TENDENCIAS',
  INFERIOR_DETALHES = 'INFERIOR_DETALHES',
  LATERAL_FILTROS = 'LATERAL_FILTROS',
}

export const ROTULOS_POSICAO_LAYOUT_VISUAL: Record<PosicaoLayoutVisual, string> = {
  [PosicaoLayoutVisual.TOPO_KPIS]: 'Topo (Síntese e Cartões KPI)',
  [PosicaoLayoutVisual.CENTRAL_TENDENCIAS]: 'Centro (Visuais Principais e Tendências)',
  [PosicaoLayoutVisual.INFERIOR_DETALHES]: 'Inferior (Detalhamento e Matrizes)',
  [PosicaoLayoutVisual.LATERAL_FILTROS]: 'Lateral (Segmentadores e Contexto)',
};
