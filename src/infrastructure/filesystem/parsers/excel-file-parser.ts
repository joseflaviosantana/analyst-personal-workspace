import { readSheet } from 'read-excel-file/node';
import { FS_DEFAULTS } from '../constants';
import { inferirTiposColunas } from '../type-inference';
import {
  MetadadosConteudoArquivo,
  WorksheetInspecionada,
} from '../../../core/domain/adapters/file-system-adapter.interface';

export interface ResultadoParserExcel {
  sucesso: boolean;
  conteudo?: MetadadosConteudoArquivo;
  avisos: string[];
  erros: string[];
}

/**
 * ExcelFileParser
 * Encapsula a inspeção e extração estrutural de planilhas XLSX utilizando a API pública readSheet do read-excel-file.
 * Na V1, a inspeção é estritamente single-sheet por salvaguarda de memória: materializa exclusivamente a worksheet
 * ativa (a aba solicitada ou a primeira por padrão), sem carregar desnecessariamente os dados de outras abas.
 */
export class ExcelFileParser {
  public static async parse(
    caminhoArquivo: string,
    abaAlvo?: string,
    limiteAmostra: number = FS_DEFAULTS.LIMITE_AMOSTRA_LINHAS
  ): Promise<ResultadoParserExcel> {
    const avisos: string[] = [];
    const erros: string[] = [];

    // Se abaAlvo for especificada, pesquisa por nome; caso contrário, pesquisa pela 1ª aba (índice 1-based da lib)
    const sheetIdentificador: string | number =
      abaAlvo && abaAlvo.trim() !== '' ? abaAlvo.trim() : 1;
    const nomeWorksheet = typeof sheetIdentificador === 'string' ? sheetIdentificador : 'Planilha 1';

    try {
      // Executa a leitura exclusivamente da worksheet selecionada
      const rows = await readSheet(caminhoArquivo, sheetIdentificador);

      if (!rows || rows.length === 0) {
        const worksheetsVazia: WorksheetInspecionada[] = [
          {
            nome: nomeWorksheet,
            indice: 0,
            totalLinhas: 0,
          },
        ];

        return {
          sucesso: true,
          conteudo: {
            conteudoInspecionado: false,
            totalLinhas: 0,
            totalColunas: 0,
            colunas: [],
            schemaInferido: {},
            linhasAmostra: [],
            worksheets: worksheetsVazia,
            worksheetAtiva: nomeWorksheet,
          },
          avisos: [`A aba "${nomeWorksheet}" da planilha Excel está vazia.`],
          erros: [],
        };
      }

      // Primeira linha como cabeçalhos
      const cabecalhosRaw = rows[0] ?? [];
      const cabecalhos = cabecalhosRaw.map((h, idx) => {
        const texto = h !== null && h !== undefined ? String(h).trim() : '';
        return texto || `coluna_${idx + 1}`;
      });

      const dataRows = rows.slice(1);
      const totalLinhas = dataRows.length;

      // Amostra limitada a limiteAmostra registros
      const linhasAmostra: Array<Record<string, unknown>> = [];
      const totalAmostra = Math.min(dataRows.length, limiteAmostra);

      for (let r = 0; r < totalAmostra; r++) {
        const row = dataRows[r];
        const rowObj: Record<string, unknown> = {};
        for (let c = 0; c < cabecalhos.length; c++) {
          const val = row[c];
          rowObj[cabecalhos[c]] = val !== null && val !== undefined ? val : '';
        }
        linhasAmostra.push(rowObj);
      }

      // Inferência preliminar de tipos com base na amostra da aba ativa
      const { colunas, schemaInferido } = inferirTiposColunas(cabecalhos, linhasAmostra);

      // Na V1, worksheets representa deliberadamente a única worksheet efetivamente inspecionada
      const worksheets: WorksheetInspecionada[] = [
        {
          nome: nomeWorksheet,
          indice: 0,
          totalLinhas,
        },
      ];

      return {
        sucesso: true,
        conteudo: {
          conteudoInspecionado: true,
          totalLinhas,
          totalColunas: cabecalhos.length,
          colunas,
          schemaInferido,
          linhasAmostra,
          worksheets,
          worksheetAtiva: nomeWorksheet,
        },
        avisos,
        erros,
      };
    } catch (err) {
      // Captura de erro quando a aba solicitada não existe na planilha
      if (
        (typeof err === 'object' && err !== null && 'name' in err && (err as { name: string }).name === 'SheetNotFoundError') ||
        (err instanceof Error && err.name === 'SheetNotFoundError')
      ) {
        erros.push(`Aba solicitada "${abaAlvo}" não foi encontrada na planilha Excel.`);
        return { sucesso: false, avisos, erros };
      }

      const msg = err instanceof Error ? err.message : String(err);
      return {
        sucesso: false,
        avisos,
        erros: [`Arquivo Excel (.xlsx) corrompido, bloqueado ou em formato inválido: ${msg}`],
      };
    }
  }
}
