/**
 * Resultado da Validação Analítica (V1 — FSD CF-16 e v1-domain-model.md Seção 3.16)
 * Representa o estado formal de conferência de um check ou teste de conciliação.
 */
export enum ResultadoValidacao {
  APROVADO = 'APROVADO',
  DIVERGENTE = 'DIVERGENTE',
  REJEITADO = 'REJEITADO',
  PENDENTE_RETESTE = 'PENDENTE_RETESTE',
}

export const ROTULOS_RESULTADO_VALIDACAO: Record<ResultadoValidacao, string> = {
  [ResultadoValidacao.APROVADO]: 'Aprovado',
  [ResultadoValidacao.DIVERGENTE]: 'Divergente',
  [ResultadoValidacao.REJEITADO]: 'Rejeitado',
  [ResultadoValidacao.PENDENTE_RETESTE]: 'Pendente de Reteste',
};
