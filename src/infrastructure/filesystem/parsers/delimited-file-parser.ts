import fs from 'node:fs';
import { parse } from 'csv-parse';
import { FS_DEFAULTS } from '../constants';
import { inferirTiposColunas } from '../type-inference';
import { MetadadosConteudoArquivo } from '../../../core/domain/adapters/file-system-adapter.interface';

export interface ResultadoParserDelimitado {
  sucesso: boolean;
  conteudo?: MetadadosConteudoArquivo;
  avisos: string[];
  erros: string[];
}

/**
 * Detecta se os primeiros bytes do arquivo violam determinismo de codificação UTF-8.
 */
function verificarCodificacaoUtf8(caminhoArquivo: string): { valido: boolean; erro?: string } {
  try {
    const fd = fs.openSync(caminhoArquivo, 'r');
    const buffer = Buffer.alloc(Math.min(65536, fs.fstatSync(fd).size));
    fs.readSync(fd, buffer, 0, buffer.length, 0);
    fs.closeSync(fd);

    const decoder = new TextDecoder('utf-8', { fatal: true });
    decoder.decode(buffer);
    return { valido: true };
  } catch {
    return {
      valido: false,
      erro: 'O arquivo contém sequência de bytes incompatível com a codificação UTF-8 (provavelmente Windows-1252, ISO-8859-1 ou formato corrompido). Na V1, a codificação determinística é estritamente UTF-8.',
    };
  }
}

/**
 * Detecta o delimitador mais provável em uma amostra inicial do arquivo.
 */
function detectarDelimitador(caminhoArquivo: string, extensao: string): string {
  if (extensao.toLowerCase() === '.tsv') {
    return '\t';
  }

  try {
    const fd = fs.openSync(caminhoArquivo, 'r');
    const buffer = Buffer.alloc(Math.min(16384, fs.fstatSync(fd).size));
    const bytesRead = fs.readSync(fd, buffer, 0, buffer.length, 0);
    fs.closeSync(fd);

    const snippet = buffer.toString('utf-8', 0, bytesRead);
    // Pega a primeira linha com conteúdo
    const linhas = snippet.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (linhas.length === 0) return ',';

    const primeiraLinha = linhas[0];

    // Contagem de ocorrências fora de aspas simples/duplas
    let emAspas = false;
    const contagens: Record<string, number> = { ',': 0, ';': 0, '\t': 0, '|': 0 };

    for (let i = 0; i < primeiraLinha.length; i++) {
      const char = primeiraLinha[i];
      if (char === '"') {
        emAspas = !emAspas;
      } else if (!emAspas && char in contagens) {
        contagens[char]++;
      }
    }

    let melhorDelimitador = ',';
    let maxOcorrencias = 0;

    for (const del of FS_DEFAULTS.DELIMITADORES_SUPORTADOS) {
      if (contagens[del] > maxOcorrencias) {
        maxOcorrencias = contagens[del];
        melhorDelimitador = del;
      }
    }

    return melhorDelimitador;
  } catch {
    return ',';
  }
}

/**
 * DelimitedFileParser
 * Encapsula o parsing streaming via csv-parse para arquivos CSV, TSV e TXT tabular.
 * A estrutura do algoritmo via streaming (fs.createReadStream + csv-parse Transform em pipeline
 * de consumo for-await com descarte imediato) sustenta memória limitada em relação ao volume
 * total de linhas, retendo na memória estritamente a amostra configurada (padrão 50 linhas).
 */
export class DelimitedFileParser {
  public static async parse(
    caminhoArquivo: string,
    extensao: string,
    limiteAmostra: number = FS_DEFAULTS.LIMITE_AMOSTRA_LINHAS
  ): Promise<ResultadoParserDelimitado> {
    const avisos: string[] = [];
    const erros: string[] = [];

    // 1. Verificação determinística de encoding UTF-8
    const checkUtf8 = verificarCodificacaoUtf8(caminhoArquivo);
    if (!checkUtf8.valido) {
      erros.push(checkUtf8.erro!);
      return { sucesso: false, avisos, erros };
    }

    // 2. Detecção de delimitador
    const delimitador = detectarDelimitador(caminhoArquivo, extensao);

    // 3. Streaming com csv-parse
    try {
      const parser = fs.createReadStream(caminhoArquivo).pipe(
        parse({
          delimiter: delimitador,
          relax_quotes: true,
          relax_column_count: true,
          skip_empty_lines: true,
          ltrim: true,
          rtrim: true,
        })
      );

      let cabecalhos: string[] = [];
      let totalLinhas = 0;
      const linhasAmostra: Array<Record<string, unknown>> = [];

      for await (const record of parser) {
        const row = record as string[];

        // A primeira linha representa os cabeçalhos
        if (cabecalhos.length === 0) {
          cabecalhos = row.map((h, idx) => {
            let nome = h.trim();
            // Remove BOM de UTF-8 se presente no primeiro cabeçalho
            if (idx === 0 && nome.startsWith('\uFEFF')) {
              nome = nome.substring(1);
            }
            return nome || `coluna_${idx + 1}`;
          });
          continue;
        }

        // Linhas de dados subsequentes
        totalLinhas++;

        if (totalLinhas <= limiteAmostra) {
          const rowObj: Record<string, unknown> = {};
          for (let i = 0; i < cabecalhos.length; i++) {
            rowObj[cabecalhos[i]] = row[i] !== undefined ? row[i] : '';
          }
          linhasAmostra.push(rowObj);
        }
        // Acima do limite de amostra, apenas conta no loop e descarta o objeto da memória imediatamente
      }

      // Arquivo sem nenhuma linha útil
      if (cabecalhos.length === 0) {
        return {
          sucesso: true,
          conteudo: {
            conteudoInspecionado: false,
            totalLinhas: 0,
            totalColunas: 0,
            colunas: [],
            schemaInferido: {},
            linhasAmostra: [],
            delimitadorDetectado: delimitador,
          },
          avisos: ['O arquivo delimitado não contém cabeçalhos ou registros tabulares.'],
          erros: [],
        };
      }

      // 4. Inferência preliminar de tipos com base na amostra retida
      const { colunas, schemaInferido } = inferirTiposColunas(cabecalhos, linhasAmostra);

      return {
        sucesso: true,
        conteudo: {
          conteudoInspecionado: true,
          totalLinhas,
          totalColunas: cabecalhos.length,
          colunas,
          schemaInferido,
          linhasAmostra,
          delimitadorDetectado: delimitador,
        },
        avisos,
        erros,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        sucesso: false,
        avisos,
        erros: [`Falha ao realizar parsing estrutural do arquivo delimitado: ${msg}`],
      };
    }
  }
}
