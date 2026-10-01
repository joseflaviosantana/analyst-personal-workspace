import { CategoriaMedidaDax } from '../enums/categoria-medida-dax';

/**
 * MedidaDax (V1 — Subunidade 3.7 / Bloco 7)
 * Especificação e implementação técnica de fórmulas DAX associadas a um modelo Power BI
 * e opcionalmente a uma métrica analítica homologada.
 */
export interface MedidaDax {
  id: string;
  modelo_powerbi_id: string;
  metrica_analitica_id: string | null;
  nome: string;
  tabela_hospedeira: string;
  expressao_dax: string;
  descricao: string | null;
  formato_string: string | null;
  categoria_dax: CategoriaMedidaDax;
  ordem: number;
  criado_em: string;
  atualizado_em: string;
}
