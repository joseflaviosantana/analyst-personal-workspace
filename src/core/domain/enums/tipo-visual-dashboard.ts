/**
 * Tipos de Visuais Suportados para Dashboard (V1 — Subunidade 3.7 / Bloco 7)
 */
export enum TipoVisualDashboard {
  CARTAO_KPI = 'CARTAO_KPI',
  GRAFICO_LINHAS = 'GRAFICO_LINHAS',
  GRAFICO_BARRAS = 'GRAFICO_BARRAS',
  GRAFICO_COLUNAS = 'GRAFICO_COLUNAS',
  MATRIZ_TABELA = 'MATRIZ_TABELA',
  DISPERSAO = 'DISPERSAO',
  OUTRO = 'OUTRO',
}

export const ROTULOS_TIPO_VISUAL_DASHBOARD: Record<TipoVisualDashboard, string> = {
  [TipoVisualDashboard.CARTAO_KPI]: 'Cartão / Indicador KPI',
  [TipoVisualDashboard.GRAFICO_LINHAS]: 'Gráfico de Linhas (Tendência)',
  [TipoVisualDashboard.GRAFICO_BARRAS]: 'Gráfico de Barras Horizontais (Ranking/Comparação)',
  [TipoVisualDashboard.GRAFICO_COLUNAS]: 'Gráfico de Colunas (Distribuição/Período)',
  [TipoVisualDashboard.MATRIZ_TABELA]: 'Tabela / Matriz Detalhada',
  [TipoVisualDashboard.DISPERSAO]: 'Gráfico de Dispersão (Correlação)',
  [TipoVisualDashboard.OUTRO]: 'Outro Tipo Visual',
};
