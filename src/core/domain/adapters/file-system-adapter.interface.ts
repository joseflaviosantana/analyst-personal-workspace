import { FormatoArquivo } from '../enums/formato-arquivo';

/**
 * Metadados físicos fundamentais extraídos diretamente do sistema de arquivos.
 */
export interface MetadadosFisicosArquivo {
  caminhoNormalizado: string;
  nomeArquivo: string;
  extensao: string;
  formato: FormatoArquivo;
  tamanhoBytes: number;
  hashSha256: string;
  criadoEm?: Date;
  modificadoEm?: Date;
}

/**
 * Representação de uma coluna inspecionada do arquivo tabular.
 */
export interface ColunaInspecionada {
  nome: string;
  indice: number;
  tipoInferido: string; // 'string' | 'number' | 'boolean' | 'date'
}

/**
 * Representação de uma worksheet (aba) inspecionada.
 * Nota V1: A inspeção XLSX opera deliberadamente no modo single-sheet para assegurar
 * proteção estrita de memória (evitando materializar todas as abas simultaneamente).
 * Retorna exclusivamente a worksheet efetivamente inspecionada (a aba solicitada ou a primeira por padrão).
 */
export interface WorksheetInspecionada {
  nome: string;
  indice: number;
  totalLinhas?: number;
}

/**
 * Metadados estruturais e amostra de dados extraídos da inspeção do conteúdo.
 * No caso de XLSX na V1, 'worksheets' representa a worksheet única efetivamente inspecionada.
 */
export interface MetadadosConteudoArquivo {
  conteudoInspecionado: boolean;
  totalLinhas?: number;
  totalColunas?: number;
  colunas?: ColunaInspecionada[];
  schemaInferido?: Record<string, string>;
  linhasAmostra?: Array<Record<string, unknown>>;
  worksheets?: WorksheetInspecionada[];
  worksheetAtiva?: string;
  delimitadorDetectado?: string;
}

/**
 * Resultado completo retornado pela inspeção de um arquivo.
 */
export interface ResultadoInspecaoArquivo {
  sucesso: boolean;
  fisico?: MetadadosFisicosArquivo;
  conteudo?: MetadadosConteudoArquivo;
  avisos: string[];
  erros: string[];
}

/**
 * Diagnóstico de acessibilidade do arquivo no sistema de arquivos.
 */
export interface ResultadoAcessibilidade {
  existe: boolean;
  legivel: boolean;
  eArquivoRegular: boolean;
  caminhoNormalizado?: string;
  erro?: string;
}

/**
 * Guardrails e opções de controle da inspeção física e estrutural.
 */
export interface OpcoesInspecao {
  limiteAmostraLinhas?: number;      // Padrão: 50 (ADR-002 Seção 5.3-A)
  limiteMaximoBytesXlsx?: number;    // Hard cap padrão: 50 MB
  limiteMaximoBytesCsv?: number;     // Hard cap padrão: 200 MB
  limiteAvisoBytesXlsx?: number;     // Soft cap padrão: 20 MB
  limiteAvisoBytesCsv?: number;      // Soft cap padrão: 50 MB
  abaAlvoXlsx?: string;              // Seleção explícita de worksheet para XLSX
}

/**
 * IFileSystemAdapter
 * Contrato de domínio para inspeção física e estrutural de arquivos no workspace local-first.
 * Completamente agnóstico de bibliotecas concretas de leitura e persistência.
 */
export interface IFileSystemAdapter {
  verificarAcessibilidade(caminhoAbsoluto: string): Promise<ResultadoAcessibilidade>;
  inspecionarArquivo(caminhoAbsoluto: string, opcoes?: OpcoesInspecao): Promise<ResultadoInspecaoArquivo>;
}
