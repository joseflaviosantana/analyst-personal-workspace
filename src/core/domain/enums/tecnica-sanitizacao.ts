/**
 * src/core/domain/enums/tecnica-sanitizacao.ts
 *
 * Técnicas de sanitização proporcional ao risco para publicação de portfólio (Subgate 3.9 — Aba 11).
 */

export const TecnicaSanitizacao = {
  ANONIMIZACAO: 'ANONIMIZACAO',
  AGREGACAO: 'AGREGACAO',
  GENERALIZACAO: 'GENERALIZACAO',
  INDEXACAO: 'INDEXACAO',
  DADOS_SINTETICOS: 'DADOS_SINTETICOS',
} as const;

export type TecnicaSanitizacao =
  (typeof TecnicaSanitizacao)[keyof typeof TecnicaSanitizacao];

export const ROTULOS_TECNICA_SANITIZACAO: Record<TecnicaSanitizacao, string> = {
  [TecnicaSanitizacao.ANONIMIZACAO]: 'Anonimização (Desidentificação de clientes e stakeholders)',
  [TecnicaSanitizacao.AGREGACAO]: 'Agregação (Totalizadores e resumos em vez de microdados)',
  [TecnicaSanitizacao.GENERALIZACAO]: 'Generalização (Agrupamento em faixas e categorias amplas)',
  [TecnicaSanitizacao.INDEXACAO]: 'Indexação e Variação Relativa (Base 100, percentuais e múltiplos)',
  [TecnicaSanitizacao.DADOS_SINTETICOS]: 'Dados Sintéticos (Amostras mock estruturais)',
};
