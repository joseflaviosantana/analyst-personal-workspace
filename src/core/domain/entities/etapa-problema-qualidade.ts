/**
 * EtapaProblemaQualidade (V1 — Subunidade 3.5A / Domínio de Preparação)
 * Associação relacional N:M entre EtapaTransformacao e ProblemaQualidade,
 * permitindo mapear quais transformações atuam sobre quais problemas e vice-versa.
 */
export interface EtapaProblemaQualidade {
  id: string;
  etapa_transformacao_id: string;
  problema_qualidade_id: string;
  criado_em: string;
}
