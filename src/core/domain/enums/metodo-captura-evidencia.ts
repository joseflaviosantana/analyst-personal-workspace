/**
 * src/core/domain/enums/metodo-captura-evidencia.ts
 *
 * Método pelo qual a evidência foi incorporada ao repositório de rastreabilidade.
 */

export const MetodoCapturaEvidencia = {
  AUTOMATICA: 'AUTOMATICA',
  ASSISTIDA: 'ASSISTIDA',
  MANUAL: 'MANUAL',
} as const;

export type MetodoCapturaEvidencia =
  (typeof MetodoCapturaEvidencia)[keyof typeof MetodoCapturaEvidencia];

export const ROTULOS_METODO_CAPTURA: Record<MetodoCapturaEvidencia, string> = {
  [MetodoCapturaEvidencia.AUTOMATICA]: 'Captura Automática (Motor do Sistema)',
  [MetodoCapturaEvidencia.ASSISTIDA]: 'Captura Assistida (Copiloto / Recomendação Aceita)',
  [MetodoCapturaEvidencia.MANUAL]: 'Captura Manual (Registrada pelo Analista)',
};
