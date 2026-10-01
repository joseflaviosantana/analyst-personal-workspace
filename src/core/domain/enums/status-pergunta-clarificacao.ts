/**
 * Status da Pergunta de Clarificação ao Contratante (V1 — v1-domain-model.md 3.5 e CF-05)
 */
export enum StatusPerguntaClarificacao {
  RASCUNHO = 'RASCUNHO',
  ENVIADA = 'ENVIADA',
  RESPONDIDA = 'RESPONDIDA',
  DESCARTADA = 'DESCARTADA',
}

export const ROTULOS_STATUS_PERGUNTA: Record<StatusPerguntaClarificacao, string> = {
  [StatusPerguntaClarificacao.RASCUNHO]: 'Rascunho',
  [StatusPerguntaClarificacao.ENVIADA]: 'Enviada ao Cliente',
  [StatusPerguntaClarificacao.RESPONDIDA]: 'Respondida',
  [StatusPerguntaClarificacao.DESCARTADA]: 'Descartada',
};
