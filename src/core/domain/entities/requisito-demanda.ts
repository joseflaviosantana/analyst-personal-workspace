import { CategoriaRequisito } from '../enums/categoria-requisito';
import { StatusRequisito } from '../enums/status-requisito';

/**
 * Entidade de Requisito Analítico (V1 — v1-domain-model.md 3.4)
 * Representa um critério de escopo, métrica esperada, dimensão ou restrição acordada.
 */
export interface RequisitoDemanda {
  id: string; // Prefixo: req_...
  demanda_id: string;
  titulo: string;
  descricao: string | null;
  categoria: CategoriaRequisito;
  prioridade: 'OBRIGATORIO' | 'DESEJAVEL';
  status: StatusRequisito;
  origem: 'MANUAL' | 'SUGERIDO_COPILOTO';
  criado_em: string;
  atualizado_em: string;
}
