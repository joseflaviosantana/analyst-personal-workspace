/**
 * TipoRegraQualidade (V1 — Subunidade 3.4B)
 * Categorização formal das regras declaradas pelo analista humano.
 *
 * Escopo homologado para a V1:
 * - R1: CHAVE_UNICA (simples ou composta)
 * - R2: VALOR_MIN_MAX (mínimo e máximo numérico)
 * - R3: VALORES_PERMITIDOS (lista de categorias/valores válidos)
 * - R4: OBRIGATORIEDADE (não nulo / não em branco)
 * - R5: REGRA_TEMPORAL (comparações temporais simples)
 *
 * R6 (Integridade referencial entre múltiplos ativos) permanece FORA da V1.
 */
export enum TipoRegraQualidade {
  CHAVE_UNICA = 'CHAVE_UNICA',
  VALOR_MIN_MAX = 'VALOR_MIN_MAX',
  VALORES_PERMITIDOS = 'VALORES_PERMITIDOS',
  OBRIGATORIEDADE = 'OBRIGATORIEDADE',
  REGRA_TEMPORAL = 'REGRA_TEMPORAL',
}

export const ROTULOS_TIPO_REGRA_QUALIDADE: Record<TipoRegraQualidade, string> = {
  [TipoRegraQualidade.CHAVE_UNICA]: 'Chave Única (Simples / Composta)',
  [TipoRegraQualidade.VALOR_MIN_MAX]: 'Limites Mínimo e Máximo',
  [TipoRegraQualidade.VALORES_PERMITIDOS]: 'Valores Permitidos (Domínio Fechado)',
  [TipoRegraQualidade.OBRIGATORIEDADE]: 'Obrigatoriedade de Preenchimento',
  [TipoRegraQualidade.REGRA_TEMPORAL]: 'Regra Temporal',
};
