import { TipoVisualDashboard } from '../enums/tipo-visual-dashboard';
import { PosicaoLayoutVisual } from '../enums/posicao-layout-visual';

/**
 * VisualDashboard (V1 — Subunidade 3.7 / Bloco 7)
 * Especificação de um elemento visual do dashboard com justificativa de Data Viz.
 */
export interface VisualDashboard {
  id: string;
  pagina_id: string;
  titulo: string;
  tipo_visual: TipoVisualDashboard;
  posicao_layout: PosicaoLayoutVisual;
  medidas_utilizadas_ids: string[];
  atributos_utilizados_ids: string[];
  justificativa_dataviz: string | null;
  ordem: number;
  criado_em: string;
  atualizado_em: string;
}
