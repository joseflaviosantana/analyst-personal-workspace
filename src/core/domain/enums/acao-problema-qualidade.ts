/**
 * AcaoProblemaQualidade (V1 — Subunidade 3.4C / FSD CF-07 / RF-019)
 * Decisões operacionais de governança humana sobre problemas de qualidade detectados.
 */
export enum AcaoProblemaQualidade {
  CORRIGIR_NA_FONTE = 'CORRIGIR_NA_FONTE',
  TRATAR_NO_PIPELINE = 'TRATAR_NO_PIPELINE',
  SOLICITAR_ESCLARECIMENTO = 'SOLICITAR_ESCLARECIMENTO',
  ACEITAR_COMO_RESTRICAO = 'ACEITAR_COMO_RESTRICAO',
  MONITORAR = 'MONITORAR',
}

export const ROTULOS_ACAO_PROBLEMA_QUALIDADE: Record<AcaoProblemaQualidade, string> = {
  [AcaoProblemaQualidade.CORRIGIR_NA_FONTE]: 'Corrigir na Fonte',
  [AcaoProblemaQualidade.TRATAR_NO_PIPELINE]: 'Tratar no Tratamento / Pipeline',
  [AcaoProblemaQualidade.SOLICITAR_ESCLARECIMENTO]: 'Solicitar Esclarecimento',
  [AcaoProblemaQualidade.ACEITAR_COMO_RESTRICAO]: 'Aceitar como Restrição',
  [AcaoProblemaQualidade.MONITORAR]: 'Monitorar / Acompanhar',
};
