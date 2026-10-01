import { PublicoAlvoPagina } from '../enums/publico-alvo-pagina';
import { LayoutGridPagina } from '../enums/layout-grid-pagina';
import { VisualDashboard } from './visual-dashboard';

/**
 * PaginaRelatorio (V1 — Subunidade 3.7 / Bloco 7)
 * Especificação de uma página ou aba visual do relatório Power BI.
 */
export interface PaginaRelatorio {
  id: string;
  modelo_powerbi_id: string;
  nome: string;
  ordem: number;
  objetivo_analitico: string | null;
  publico_alvo: PublicoAlvoPagina;
  layout_grid: LayoutGridPagina;
  criado_em: string;
  atualizado_em: string;
}

export interface PaginaRelatorioComVisuais extends PaginaRelatorio {
  visuais: VisualDashboard[];
}
