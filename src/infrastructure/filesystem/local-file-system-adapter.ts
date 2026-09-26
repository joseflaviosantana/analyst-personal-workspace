import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  IFileSystemAdapter,
  MetadadosFisicosArquivo,
  OpcoesInspecao,
  ResultadoAcessibilidade,
  ResultadoInspecaoArquivo,
} from '../../core/domain/adapters/file-system-adapter.interface';
import { FormatoArquivo } from '../../core/domain/enums/formato-arquivo';
import { FS_DEFAULTS } from './constants';
import { DelimitedFileParser } from './parsers/delimited-file-parser';
import { ExcelFileParser } from './parsers/excel-file-parser';

/**
 * Traduz códigos de erro nativos de sistema de arquivos (especialmente Windows) para mensagens amigáveis.
 */
function traduzirErroSistemaArquivos(err: unknown, caminho: string): string {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const code = (err as { code: string }).code;
    switch (code) {
      case 'ENOENT':
        return `Arquivo não encontrado no caminho especificado: "${caminho}".`;
      case 'EACCES':
      case 'EPERM':
        return `Sem permissão de acesso para ler o arquivo (${code}): "${caminho}".`;
      case 'EBUSY':
        return `O arquivo está em uso por outro processo ou bloqueado pelo sistema operacional (EBUSY): "${caminho}".`;
      case 'EISDIR':
        return `O caminho especificado é um diretório e não um arquivo regular: "${caminho}".`;
      case 'EMFILE':
      case 'ENFILE':
        return `Limite de descritores de arquivos abertos atingido no sistema operacional (${code}).`;
      default: {
        const msg = err instanceof Error ? err.message : String(err);
        return `Erro de sistema de arquivos (${code}): ${msg}`;
      }
    }
  }
  return err instanceof Error ? err.message : String(err);
}

/**
 * Calcula o hash SHA-256 de um arquivo via streaming, mantendo consumo de memória estritamente O(1).
 */
async function calcularHashSha256(caminhoArquivo: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(caminhoArquivo);

    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', (err) => reject(err));
  });
}

/**
 * Identifica o FormatoArquivo correspondente à extensão do arquivo no disco.
 */
function identificarFormatoPorExtensao(extensao: string): FormatoArquivo {
  const ext = extensao.toLowerCase().replace('.', '');
  switch (ext) {
    case 'xlsx':
      return FormatoArquivo.XLSX;
    case 'xls':
      return FormatoArquivo.XLS;
    case 'csv':
      return FormatoArquivo.CSV;
    case 'tsv':
      return FormatoArquivo.TSV;
    case 'txt':
      return FormatoArquivo.TXT;
    default:
      return FormatoArquivo.OUTRO;
  }
}

/**
 * LocalFileSystemAdapter
 * Implementação concreta e local-first do IFileSystemAdapter para Node.js / Windows.
 * Encapsula completamente bibliotecas de parsing e operações nativas de I/O.
 */
export class LocalFileSystemAdapter implements IFileSystemAdapter {
  /**
   * Valida existência, regularidade e permissão de leitura de um arquivo no disco.
   */
  public async verificarAcessibilidade(caminhoAbsoluto: string): Promise<ResultadoAcessibilidade> {
    if (!caminhoAbsoluto || typeof caminhoAbsoluto !== 'string' || caminhoAbsoluto.trim() === '') {
      return {
        existe: false,
        legivel: false,
        eArquivoRegular: false,
        erro: 'O caminho do arquivo não pode ser nulo ou vazio.',
      };
    }

    const caminhoNormalizado = path.resolve(path.normalize(caminhoAbsoluto.trim()));

    try {
      const stats = await fs.promises.stat(caminhoNormalizado);

      if (!stats.isFile()) {
        return {
          existe: true,
          legivel: false,
          eArquivoRegular: false,
          caminhoNormalizado,
          erro: `O caminho indicado não aponta para um arquivo regular (pode ser diretório ou dispositivo especial): "${caminhoNormalizado}".`,
        };
      }

      await fs.promises.access(caminhoNormalizado, fs.constants.R_OK);

      return {
        existe: true,
        legivel: true,
        eArquivoRegular: true,
        caminhoNormalizado,
      };
    } catch (err) {
      return {
        existe: false,
        legivel: false,
        eArquivoRegular: false,
        caminhoNormalizado,
        erro: traduzirErroSistemaArquivos(err, caminhoNormalizado),
      };
    }
  }

  /**
   * Realiza a inspeção física e, quando aplicável, estrutural de um arquivo tabular.
   */
  public async inspecionarArquivo(
    caminhoAbsoluto: string,
    opcoes?: OpcoesInspecao
  ): Promise<ResultadoInspecaoArquivo> {
    const avisos: string[] = [];
    const erros: string[] = [];

    // 1. Verificação preliminar de acessibilidade e existência
    const acessibilidade = await this.verificarAcessibilidade(caminhoAbsoluto);
    if (!acessibilidade.existe || !acessibilidade.legivel || !acessibilidade.eArquivoRegular) {
      return {
        sucesso: false,
        avisos,
        erros: [acessibilidade.erro ?? 'Arquivo inacessível no sistema de arquivos.'],
      };
    }

    const caminhoNormalizado = acessibilidade.caminhoNormalizado!;

    try {
      // 2. Extração de metadados físicos
      const stats = await fs.promises.stat(caminhoNormalizado);
      const nomeArquivo = path.basename(caminhoNormalizado);
      const extensao = path.extname(caminhoNormalizado).toLowerCase();
      const formato = identificarFormatoPorExtensao(extensao);

      // Cálculo de SHA-256 via streaming O(1)
      const hashSha256 = await calcularHashSha256(caminhoNormalizado);

      const fisico: MetadadosFisicosArquivo = {
        caminhoNormalizado,
        nomeArquivo,
        extensao,
        formato,
        tamanhoBytes: stats.size,
        hashSha256,
        criadoEm: stats.birthtime,
        modificadoEm: stats.mtime,
      };

      // 3. Caso especial: Arquivo de 0 bytes (vazio)
      if (stats.size === 0) {
        return {
          sucesso: true,
          fisico,
          conteudo: {
            conteudoInspecionado: false,
            totalLinhas: 0,
            totalColunas: 0,
            colunas: [],
            schemaInferido: {},
            linhasAmostra: [],
          },
          avisos: ['O arquivo está completamente vazio (0 bytes). Nenhum dado foi lido.'],
          erros: [],
        };
      }

      // 4. Configuração de limites e guardrails
      const limiteAmostra = opcoes?.limiteAmostraLinhas ?? FS_DEFAULTS.LIMITE_AMOSTRA_LINHAS;
      const limiteMaxXlsx = opcoes?.limiteMaximoBytesXlsx ?? FS_DEFAULTS.XLSX_HARD_CAP_BYTES;
      const limiteMaxCsv = opcoes?.limiteMaximoBytesCsv ?? FS_DEFAULTS.CSV_HARD_CAP_BYTES;
      const limiteAvisoXlsx = opcoes?.limiteAvisoBytesXlsx ?? FS_DEFAULTS.XLSX_SOFT_CAP_BYTES;
      const limiteAvisoCsv = opcoes?.limiteAvisoBytesCsv ?? FS_DEFAULTS.CSV_SOFT_CAP_BYTES;

      // 5. Roteamento por formato
      switch (formato) {
        case FormatoArquivo.XLSX: {
          // Guardrail: Soft Cap (Aviso de volumetria)
          if (stats.size > limiteAvisoXlsx) {
            avisos.push(
              `Planilha XLSX volumosa (${(stats.size / 1024 / 1024).toFixed(1)} MB). A inspeção de conteúdo pode levar alguns segundos adicionais.`
            );
          }

          // Guardrail: Hard Cap (Bloqueio de inspeção de conteúdo para proteção de heap OOM)
          if (stats.size > limiteMaxXlsx) {
            avisos.push(
              `O arquivo XLSX (${(stats.size / 1024 / 1024).toFixed(1)} MB) excede o limite máximo de segurança para leitura de conteúdo (${(limiteMaxXlsx / 1024 / 1024).toFixed(0)} MB). A catalogação física foi concluída, mas o parsing de conteúdo foi bloqueado para proteger a estabilidade do sistema.`
            );
            return {
              sucesso: true,
              fisico,
              conteudo: { conteudoInspecionado: false },
              avisos,
              erros,
            };
          }

          // Executa parsing do XLSX
          const resExcel = await ExcelFileParser.parse(
            caminhoNormalizado,
            opcoes?.abaAlvoXlsx,
            limiteAmostra
          );
          avisos.push(...resExcel.avisos);
          erros.push(...resExcel.erros);

          return {
            sucesso: resExcel.sucesso,
            fisico,
            conteudo: resExcel.conteudo,
            avisos,
            erros,
          };
        }

        case FormatoArquivo.CSV:
        case FormatoArquivo.TSV:
        case FormatoArquivo.TXT: {
          // Guardrail: Soft Cap (Aviso de volumetria)
          if (stats.size > limiteAvisoCsv) {
            avisos.push(
              `Arquivo delimitado volumoso (${(stats.size / 1024 / 1024).toFixed(1)} MB). A leitura pode levar alguns segundos adicionais.`
            );
          }

          // Guardrail: Hard Cap (Bloqueio para evitar travamento de I/O em Server Actions)
          if (stats.size > limiteMaxCsv) {
            avisos.push(
              `O arquivo delimitado (${(stats.size / 1024 / 1024).toFixed(1)} MB) excede o limite máximo de segurança para leitura de conteúdo (${(limiteMaxCsv / 1024 / 1024).toFixed(0)} MB). A catalogação física foi concluída, mas a inspeção de linhas foi bloqueada para proteger o desempenho do sistema.`
            );
            return {
              sucesso: true,
              fisico,
              conteudo: { conteudoInspecionado: false },
              avisos,
              erros,
            };
          }

          // Executa parsing do arquivo delimitado via csv-parse streaming
          const resDelimitado = await DelimitedFileParser.parse(
            caminhoNormalizado,
            extensao,
            limiteAmostra
          );
          avisos.push(...resDelimitado.avisos);
          erros.push(...resDelimitado.erros);

          return {
            sucesso: resDelimitado.sucesso,
            fisico,
            conteudo: resDelimitado.conteudo,
            avisos,
            erros,
          };
        }

        case FormatoArquivo.XLS: {
          // Formato legado: catalogação física obrigatória + SHA-256 + aviso explícito de conversão
          avisos.push(
            'Planilhas em formato Excel legado (.xls / BIFF8) possuem catalogação física na V1, mas não suportam inspeção de conteúdo direta. Recomenda-se a conversão para formato .xlsx ou .csv antes do processamento analítico.'
          );
          return {
            sucesso: true,
            fisico,
            conteudo: { conteudoInspecionado: false },
            avisos,
            erros,
          };
        }

        case FormatoArquivo.OUTRO:
        default: {
          // Outro formato tabular ou não reconhecido: apenas catalogação física + SHA-256
          avisos.push(
            'Formato de arquivo não suportado para inspeção estrutural de tabelas na V1. Apenas a catalogação física e o cálculo do hash SHA-256 foram realizados.'
          );
          return {
            sucesso: true,
            fisico,
            conteudo: { conteudoInspecionado: false },
            avisos,
            erros,
          };
        }
      }
    } catch (err) {
      return {
        sucesso: false,
        avisos,
        erros: [traduzirErroSistemaArquivos(err, caminhoNormalizado)],
      };
    }
  }
}
