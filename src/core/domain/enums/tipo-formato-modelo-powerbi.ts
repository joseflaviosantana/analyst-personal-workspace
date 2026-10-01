/**
 * Formato do Modelo Power BI (V1 — Subunidade 3.7 / Bloco 7)
 * Identifica o tipo de arquivo ou declaração de isenção da demanda.
 */
export enum TipoFormatoModeloPowerBi {
  PBIX = 'PBIX',
  PBIP = 'PBIP',
  ISENTO_EXCEL_ONLY = 'ISENTO_EXCEL_ONLY',
}

export const ROTULOS_TIPO_FORMATO_POWERBI: Record<TipoFormatoModeloPowerBi, string> = {
  [TipoFormatoModeloPowerBi.PBIX]: 'Arquivo Binário Power BI (.pbix)',
  [TipoFormatoModeloPowerBi.PBIP]: 'Projeto Power BI / TMDL (.pbip)',
  [TipoFormatoModeloPowerBi.ISENTO_EXCEL_ONLY]: 'Isento de Power BI (Entrega exclusiva em planilha)',
};
