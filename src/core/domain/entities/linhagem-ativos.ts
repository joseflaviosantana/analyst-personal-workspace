import { PapelEntradaLinhagem } from '../enums/papel-entrada-linhagem';

/**
 * LinhagemAtivos (V1 — Subunidade 3.5A / Domínio de Preparação)
 * Modela a aresta direcionada de procedência estrutural (De onde o dado veio -> Para onde foi)
 * no grafo acíclico de dados da demanda.
 */
export interface LinhagemAtivos {
  id: string;
  demanda_id: string;
  ativo_origem_id: string;
  ativo_destino_id: string;
  etapa_transformacao_id: string | null; // Nulo se for derivação direta/cópia sem etapa formal
  papel_entrada: PapelEntradaLinhagem;
  criado_em: string;
}
