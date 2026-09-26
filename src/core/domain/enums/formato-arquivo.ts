/**
 * FormatoArquivo (V1 — v1-domain-model.md Seção 4, ADR-002 e FSD CF-06)
 * Identificador descritivo do padrão técnico do arquivo tabular de insumo.
 */
export enum FormatoArquivo {
  XLSX = 'XLSX',
  XLS = 'XLS',
  CSV = 'CSV',
  TXT = 'TXT',
  TSV = 'TSV',
  BASE_TRATADA = 'BASE_TRATADA',
  OUTRO = 'OUTRO', // Fallback técnico extensível para formatos tabulares adicionais (FSD CF-06 e Domain Model 4)
}

export const ROTULOS_FORMATO_ARQUIVO: Record<FormatoArquivo, string> = {
  [FormatoArquivo.XLSX]: 'Planilha Excel (.xlsx)',
  [FormatoArquivo.XLS]: 'Planilha Excel Legada (.xls)',
  [FormatoArquivo.CSV]: 'Valores Separados por Vírgula (.csv)',
  [FormatoArquivo.TXT]: 'Texto Tabular (.txt)',
  [FormatoArquivo.TSV]: 'Valores Separados por Tabulação (.tsv)',
  [FormatoArquivo.BASE_TRATADA]: 'Base de Suporte Tratada',
  [FormatoArquivo.OUTRO]: 'Outro Formato Tabular',
};

export function normalizarFormatoArquivo(formato: string | FormatoArquivo): FormatoArquivo {
  if (!formato) return FormatoArquivo.OUTRO;
  const upper = formato.toUpperCase().trim();
  if (upper in FormatoArquivo) {
    return FormatoArquivo[upper as keyof typeof FormatoArquivo];
  }
  if (upper === '.XLSX' || upper === 'EXCEL') return FormatoArquivo.XLSX;
  if (upper === '.XLS') return FormatoArquivo.XLS;
  if (upper === '.CSV') return FormatoArquivo.CSV;
  if (upper === '.TXT') return FormatoArquivo.TXT;
  if (upper === '.TSV') return FormatoArquivo.TSV;
  return FormatoArquivo.OUTRO;
}
