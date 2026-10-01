/**
 * Categoria do Requisito Analítico (V1 — v1-domain-model.md 3.4)
 */
export enum CategoriaRequisito {
  METRICA_KPI = 'METRICA_KPI',
  DIMENSAO_FILTRO = 'DIMENSAO_FILTRO',
  ENTREGA_FORMATO = 'ENTREGA_FORMATO',
  REGRA_NEGOCIO = 'REGRA_NEGOCIO',
  CONFORMIDADE = 'CONFORMIDADE',
}

export const ROTULOS_CATEGORIA_REQUISITO: Record<CategoriaRequisito, string> = {
  [CategoriaRequisito.METRICA_KPI]: 'Métrica / KPI',
  [CategoriaRequisito.DIMENSAO_FILTRO]: 'Dimensão / Filtro',
  [CategoriaRequisito.ENTREGA_FORMATO]: 'Formato de Entrega',
  [CategoriaRequisito.REGRA_NEGOCIO]: 'Regra de Negócio',
  [CategoriaRequisito.CONFORMIDADE]: 'Conformidade / Sigilo',
};
