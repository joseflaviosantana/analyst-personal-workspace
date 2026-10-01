/**
 * src/core/domain/enums/categoria-ativo-aprendizado.ts
 *
 * Categorias temáticas dos Ativos de Aprendizado e Memória Operacional (Subgate 3.9 — Aba 11).
 */

export const CategoriaAtivoAprendizado = {
  DAX: 'DAX',
  POWER_QUERY_M: 'POWER_QUERY_M',
  QUALIDADE_DADOS: 'QUALIDADE_DADOS',
  MODELAGEM: 'MODELAGEM',
  NEGOCIO: 'NEGOCIO',
} as const;

export type CategoriaAtivoAprendizado =
  (typeof CategoriaAtivoAprendizado)[keyof typeof CategoriaAtivoAprendizado];

export const ROTULOS_CATEGORIA_ATIVO_APRENDIZADO: Record<CategoriaAtivoAprendizado, string> = {
  [CategoriaAtivoAprendizado.DAX]: 'Medida / Expressão DAX',
  [CategoriaAtivoAprendizado.POWER_QUERY_M]: 'Tratamento / Fórmula Power Query M',
  [CategoriaAtivoAprendizado.QUALIDADE_DADOS]: 'Padrão de Qualidade e Higienização',
  [CategoriaAtivoAprendizado.MODELAGEM]: 'Padrão Dimensional / Tabela Calendário',
  [CategoriaAtivoAprendizado.NEGOCIO]: 'Regra Analítica / Lógica de Negócio',
};
