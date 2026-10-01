/**
 * Público-Alvo da Página de Relatório (V1 — Subunidade 3.7 / Bloco 7)
 */
export enum PublicoAlvoPagina {
  EXECUTIVO = 'EXECUTIVO',
  GERENCIAL = 'GERENCIAL',
  OPERACIONAL = 'OPERACIONAL',
}

export const ROTULOS_PUBLICO_ALVO_PAGINA: Record<PublicoAlvoPagina, string> = {
  [PublicoAlvoPagina.EXECUTIVO]: 'Executivo / Diretoria',
  [PublicoAlvoPagina.GERENCIAL]: 'Gerencial / Tático',
  [PublicoAlvoPagina.OPERACIONAL]: 'Operacional / Analítico Detalhado',
};
