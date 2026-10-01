/**
 * src/core/domain/enums/status-validacao-evidencia.ts
 *
 * Status do ciclo de vida e homologação de uma evidência analítica.
 */

export const StatusValidacaoEvidencia = {
  CAPTURADA: 'CAPTURADA',
  AGUARDANDO_REVISAO: 'AGUARDANDO_REVISAO',
  CONFIRMADA: 'CONFIRMADA',
  REJEITADA: 'REJEITADA',
} as const;

export type StatusValidacaoEvidencia =
  (typeof StatusValidacaoEvidencia)[keyof typeof StatusValidacaoEvidencia];

export const ROTULOS_STATUS_VALIDACAO_EVIDENCIA: Record<StatusValidacaoEvidencia, string> = {
  [StatusValidacaoEvidencia.CAPTURADA]: 'Capturada (Em Triagem)',
  [StatusValidacaoEvidencia.AGUARDANDO_REVISAO]: 'Aguardando Revisão',
  [StatusValidacaoEvidencia.CONFIRMADA]: 'Confirmada / Homologada',
  [StatusValidacaoEvidencia.REJEITADA]: 'Rejeitada / Descartada',
};
