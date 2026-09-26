/**
 * Constantes e Guardrails de Segurança para o FileSystemAdapter (Unidade 3.2).
 * Centraliza os limites de memória, amostragem e thresholds técnicos para V1.
 */
export const FS_DEFAULTS = {
  /** Quantidade máxima de linhas mantidas na amostra de preview e inferência (ADR-002 Seção 5.3-A) */
  LIMITE_AMOSTRA_LINHAS: 50,

  /** Limite rígido (Hard Cap) para XLSX: 50 MB. Previne esgotamento de heap no parsing de XML */
  XLSX_HARD_CAP_BYTES: 50 * 1024 * 1024,

  /** Limite suave (Soft Cap / Aviso) para XLSX: 20 MB */
  XLSX_SOFT_CAP_BYTES: 20 * 1024 * 1024,

  /** Limite rígido (Hard Cap) para CSV/TXT/TSV: 200 MB. Previne degradação de I/O em Server Actions síncronas */
  CSV_HARD_CAP_BYTES: 200 * 1024 * 1024,

  /** Limite suave (Soft Cap / Aviso) para CSV/TXT/TSV: 50 MB */
  CSV_SOFT_CAP_BYTES: 50 * 1024 * 1024,

  /** Delimitadores padrão testados para arquivos de texto tabular */
  DELIMITADORES_SUPORTADOS: [',', ';', '\t', '|'] as const,
} as const;
