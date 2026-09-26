import fs from 'node:fs';
import crypto from 'node:crypto';
import { parse } from 'csv-parse';
import { readSheet } from 'read-excel-file/node';
import { FS_DEFAULTS } from '../filesystem/constants';
import { FormatoArquivo } from '@/core/domain/enums/formato-arquivo';
import { CategoriaProblemaQualidade } from '@/core/domain/enums/categoria-problema-qualidade';
import { SeveridadeProblema } from '@/core/domain/enums/severidade-problema';
import { StatusProblemaQualidade } from '@/core/domain/enums/status-problema-qualidade';
import { StatusExecucaoDiagnostico } from '@/core/domain/enums/status-execucao-diagnostico';
import { StatusVerificacaoQualidade } from '@/core/domain/enums/status-verificacao-qualidade';
import { EvidenciaProblemaQualidade, ProblemaQualidade } from '@/core/domain/entities/problema-qualidade';
import { ResultadoItemVerificacao } from '@/core/domain/entities/diagnostico-qualidade';

export interface ParametrosVarredura {
  diagnosticoId: string;
  ativoDadosId: string;
  demandaId: string;
  caminhoArquivo: string;
  formato: FormatoArquivo;
  tabelaNome: string;
  schemaInferido?: Record<string, string> | null;
  abaAlvoXlsx?: string;
  limiteLinhasDuplicidade?: number;
}

export interface ResultadoVarredura {
  sucesso: boolean;
  totalLinhas: number;
  totalColunas: number;
  problemas: ProblemaQualidade[];
  verificacoes: ResultadoItemVerificacao[];
  statusExecucao: StatusExecucaoDiagnostico;
  resumoMetricas: Record<string, unknown>;
  erroMensagem?: string;
}

/** Limite máximo de amostras de evidência por problema para respeitar privacidade */
const MAX_AMOSTRAS_EVIDENCIA = 5;

/** Limite operacional de linhas para verificação global de duplicidades em memória */
const LIMITE_LINHAS_DUPLICIDADE = 300_000;

/**
 * Heurística técnica determinística da V1 para mitigação da circularidade do schema inferido.
 * Define a taxa mínima de prevalência (90%) para identificar colunas preliminarmente inferidas como 'string'
 * que se revelam materialmente numéricas ou temporais no universo integral da varredura.
 *
 * NOTA METODOLÓGICA NORMATIVA (V1):
 * - Esta heurística constitui estritamente uma evidência preliminar automatizada;
 * - NÃO equivale a regra de negócio;
 * - NÃO equivale a verdade semântica sobre a coluna;
 * - Permanece plenamente sujeita à futura deliberação humana (Unidades 3.4B / 3.4C);
 * - Todos os problemas gerados sob esta heurística mantêm severidade PENDENTE e status ABERTO;
 * - Não é configurável via UI nesta unidade.
 */
export const THRESHOLD_PREVALENCIA_TIPO_PRELIMINAR = 0.90;

/** Quantidade mínima de valores não nulos para aplicação segura da heurística de prevalência */
export const MINIMO_AMOSTRAS_INFERENCIA_CIRCULARIDADE = 5;

/** Strings comuns de omissão tratadas como nulas */
const LITERAIS_OMISSAO = new Set(['', 'null', 'undefined', 'n/d', 'na', 'n/a', '#n/a', 'nan', 'none', '-']);

// Padrões de identificadores que NÃO devem ser convertidos em números
const REGEX_CPF = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
const REGEX_CNPJ = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
const REGEX_CEP = /^\d{5}-\d{3}$/;
const REGEX_TELEFONE = /^\(?\d{2}\)?\s*\d{4,5}-?\d{4}$/;
const REGEX_CODIGO_COM_MASCARA = /^[a-zA-Z0-9]+[-_/][a-zA-Z0-9]+/;

// Padrões numéricos aceitos
const REGEX_INT = /^[+-]?\d+$/;
const REGEX_DEC_PONTO = /^[+-]?\d+\.\d+$/;
const REGEX_DEC_VIRGULA = /^[+-]?\d+,\d+$/;
const REGEX_BR_MILHAR = /^[+-]?\d{1,3}(\.\d{3})*(,\d+)?$/;
const REGEX_INT_MILHAR = /^[+-]?\d{1,3}(,\d{3})*(\.\d+)?$/;

/**
 * Canonicalização determinística e tipada de linha antes do cálculo de hash SHA-256.
 * Utiliza codificação Type-Length-Value (TLV) com length prefixing para strings.
 * Preserva distinção estrita entre:
 * - null ('Z')
 * - undefined ('U')
 * - boolean ('B:1' | 'B:0')
 * - number ('N:...')
 * - Date ('D:ISO')
 * - string ('S:length:value')
 *
 * Imune a colisões estruturais decorrentes de delimitadores presentes no conteúdo das células.
 */
export function canonicalizarLinha(row: unknown[]): string {
  const partes: string[] = [`R:${row.length}`];
  for (let i = 0; i < row.length; i++) {
    const cel = row[i];
    if (cel === null) {
      partes.push('Z');
    } else if (cel === undefined) {
      partes.push('U');
    } else if (typeof cel === 'boolean') {
      partes.push(cel ? 'B:1' : 'B:0');
    } else if (typeof cel === 'number') {
      partes.push(`N:${isNaN(cel) ? 'NaN' : isFinite(cel) ? cel : cel > 0 ? 'Inf' : '-Inf'}`);
    } else if (cel instanceof Date) {
      partes.push(`D:${isNaN(cel.getTime()) ? 'Invalid' : cel.toISOString()}`);
    } else {
      const str = String(cel);
      partes.push(`S:${str.length}:${str}`);
    }
  }
  return partes.join('|');
}

export class DeterministicQualityScanner {
  /**
   * Executa a varredura completa de qualidade determinística sobre o ativo de dados
   */
  public static async escanear(params: ParametrosVarredura): Promise<ResultadoVarredura> {
    try {
      if (params.formato === FormatoArquivo.XLSX) {
        return await this.escanearXlsx(params);
      }
      return await this.escanearDelimitado(params);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        sucesso: false,
        totalLinhas: 0,
        totalColunas: 0,
        problemas: [],
        verificacoes: [],
        statusExecucao: StatusExecucaoDiagnostico.FALHA,
        resumoMetricas: {},
        erroMensagem: `Falha catastrófica durante a varredura de qualidade: ${msg}`,
      };
    }
  }

  // =========================================================================
  // PROCESSAMENTO STREAMING PARA CSV / TSV / TXT
  // =========================================================================
  private static async escanearDelimitado(params: ParametrosVarredura): Promise<ResultadoVarredura> {
    if (!fs.existsSync(params.caminhoArquivo)) {
      throw new Error(`Arquivo não encontrado no caminho: ${params.caminhoArquivo}`);
    }

    const stat = fs.statSync(params.caminhoArquivo);
    if (stat.size > FS_DEFAULTS.CSV_HARD_CAP_BYTES) {
      throw new Error(
        `Arquivo delimitado excede o limite rígido de segurança de ${FS_DEFAULTS.CSV_HARD_CAP_BYTES / (1024 * 1024)} MB.`
      );
    }

    const delimitador = this.detectarDelimitador(params.caminhoArquivo, params.formato);

    const parser = fs.createReadStream(params.caminhoArquivo).pipe(
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
    let duplicidadesLimitadasPorGuardrail = false;

    // Estruturas de métricas
    const nulosPorColuna: number[] = [];
    const tiposInconsistentesPorColuna: number[] = [];
    const datasInvalidasPorColuna: number[] = [];
    const numerosInvalidosPorColuna: number[] = [];

    // Contadores para mitigação da circularidade do schema inferido
    const totalValoresNaoNulos: number[] = [];
    const contagemNumerosValidos: number[] = [];
    const contagemDatasValidas: number[] = [];

    const evidenciasNulosPorColuna: EvidenciaProblemaQualidade[][] = [];
    const evidenciasTiposPorColuna: EvidenciaProblemaQualidade[][] = [];
    const evidenciasDatasPorColuna: EvidenciaProblemaQualidade[][] = [];
    const evidenciasNumerosPorColuna: EvidenciaProblemaQualidade[][] = [];

    const linhasVistas = new Map<string, number>();
    let totalLinhasDuplicadas = 0;
    const evidenciasDuplicidades: EvidenciaProblemaQualidade[] = [];

    const limiteDuplicidade = params.limiteLinhasDuplicidade ?? LIMITE_LINHAS_DUPLICIDADE;
    const schemaEsperado = params.schemaInferido ?? {};

    for await (const record of parser) {
      const row = record as string[];

      // Cabeçalhos (primeira linha)
      if (cabecalhos.length === 0) {
        cabecalhos = row.map((h, idx) => {
          let nome = h.trim();
          if (idx === 0 && nome.startsWith('\uFEFF')) {
            nome = nome.substring(1);
          }
          return nome || `coluna_${idx + 1}`;
        });

        for (let i = 0; i < cabecalhos.length; i++) {
          nulosPorColuna[i] = 0;
          tiposInconsistentesPorColuna[i] = 0;
          datasInvalidasPorColuna[i] = 0;
          numerosInvalidosPorColuna[i] = 0;

          totalValoresNaoNulos[i] = 0;
          contagemNumerosValidos[i] = 0;
          contagemDatasValidas[i] = 0;

          evidenciasNulosPorColuna[i] = [];
          evidenciasTiposPorColuna[i] = [];
          evidenciasDatasPorColuna[i] = [];
          evidenciasNumerosPorColuna[i] = [];
        }
        continue;
      }

      totalLinhas++;
      const numeroLinhaFisica = totalLinhas + 1;

      // V3: Duplicidade de Linha Inteira com canonicalização tipada e SHA-256 completo
      if (totalLinhas <= limiteDuplicidade) {
        const linhaCanonica = canonicalizarLinha(row);
        const hashLinha = crypto.createHash('sha256').update(linhaCanonica).digest('hex');

        if (linhasVistas.has(hashLinha)) {
          totalLinhasDuplicadas++;
          const linhaOriginal = linhasVistas.get(hashLinha)!;
          if (evidenciasDuplicidades.length < MAX_AMOSTRAS_EVIDENCIA) {
            evidenciasDuplicidades.push({
              linhaDuplicada: numeroLinhaFisica,
              linhaOriginal,
              detalhe: `Conteúdo idêntico ao registro da linha ${linhaOriginal}`,
            });
          }
        } else {
          linhasVistas.set(hashLinha, numeroLinhaFisica);
        }
      } else {
        duplicidadesLimitadasPorGuardrail = true;
      }

      // Verificações por coluna (V1, V4, V5, V6)
      for (let c = 0; c < cabecalhos.length; c++) {
        const colNome = cabecalhos[c];
        const valRaw = row[c];
        const valStr = valRaw !== undefined && valRaw !== null ? String(valRaw).trim() : '';

        // V1: Nulos e Brancos
        if (this.isValorNulo(valStr)) {
          nulosPorColuna[c]++;
          if (evidenciasNulosPorColuna[c].length < MAX_AMOSTRAS_EVIDENCIA) {
            evidenciasNulosPorColuna[c].push({
              numeroLinha: numeroLinhaFisica,
              coluna: colNome,
              valorObservado: '[VAZIO]',
              detalhe: 'Valor ausente, nulo ou preenchido com indicador de omissão',
            });
          }
          continue;
        }

        totalValoresNaoNulos[c]++;
        const eNumero = this.isNumeroValido(valStr);
        const resData = this.validarData(valStr);

        if (eNumero) contagemNumerosValidos[c]++;
        if (resData.valida) contagemDatasValidas[c]++;

        const tipoEsperado = schemaEsperado[colNome];

        // Se o schema da 3.2 já determinava o tipo:
        if (tipoEsperado === 'number') {
          if (!eNumero) {
            numerosInvalidosPorColuna[c]++;
            if (evidenciasNumerosPorColuna[c].length < MAX_AMOSTRAS_EVIDENCIA) {
              evidenciasNumerosPorColuna[c].push({
                numeroLinha: numeroLinhaFisica,
                coluna: colNome,
                valorObservado: `[TEXTO_NAO_NUMERICO: ${valStr.length} caracteres]`,
                detalhe: 'Formato numérico incompatível ou caractere não numérico',
              });
            }
          }
        } else if (tipoEsperado === 'date') {
          if (!resData.valida) {
            datasInvalidasPorColuna[c]++;
            if (evidenciasDatasPorColuna[c].length < MAX_AMOSTRAS_EVIDENCIA) {
              evidenciasDatasPorColuna[c].push({
                numeroLinha: numeroLinhaFisica,
                coluna: colNome,
                valorObservado: `[DATA_INVALIDA: ${valStr.length} caracteres]`,
                detalhe: resData.motivo ?? 'Data inválida ou corrompida',
              });
            }
          }
        } else if (tipoEsperado === 'boolean') {
          if (!this.isBooleanValido(valStr)) {
            tiposInconsistentesPorColuna[c]++;
            if (evidenciasTiposPorColuna[c].length < MAX_AMOSTRAS_EVIDENCIA) {
              evidenciasTiposPorColuna[c].push({
                numeroLinha: numeroLinhaFisica,
                coluna: colNome,
                valorObservado: `[TIPO_INESPERADO: string (${valStr.length} chars)]`,
                detalhe: 'Valor não booleano em coluna esperada como booleana',
              });
            }
          }
        }
      }
    }

    // Mitigação da Circularidade do Schema Inferido:
    // Se uma coluna não tinha tipo ou estava como 'string' na amostra de 50 linhas, mas a varredura
    // completa aponta prevalência >= 90% de números ou datas, apontamos as anomalias restantes
    this.mitigarCircularidadeSchema({
      cabecalhos,
      schemaEsperado,
      totalValoresNaoNulos,
      contagemNumerosValidos,
      contagemDatasValidas,
      numerosInvalidosPorColuna,
      datasInvalidasPorColuna,
      evidenciasNumerosPorColuna,
      evidenciasDatasPorColuna,
    });

    return this.consolidarResultados({
      params,
      cabecalhos,
      totalLinhas,
      nulosPorColuna,
      tiposInconsistentesPorColuna,
      datasInvalidasPorColuna,
      numerosInvalidosPorColuna,
      evidenciasNulosPorColuna,
      evidenciasTiposPorColuna,
      evidenciasDatasPorColuna,
      evidenciasNumerosPorColuna,
      totalLinhasDuplicadas,
      evidenciasDuplicidades,
      duplicidadesLimitadasPorGuardrail,
    });
  }

  // =========================================================================
  // PROCESSAMENTO SINGLE-SHEET MATERIALIZADO PARA XLSX
  // =========================================================================
  private static async escanearXlsx(params: ParametrosVarredura): Promise<ResultadoVarredura> {
    if (!fs.existsSync(params.caminhoArquivo)) {
      throw new Error(`Planilha Excel não encontrada no caminho: ${params.caminhoArquivo}`);
    }

    const stat = fs.statSync(params.caminhoArquivo);
    if (stat.size > FS_DEFAULTS.XLSX_HARD_CAP_BYTES) {
      throw new Error(
        `Planilha Excel excede o limite rígido de segurança de ${FS_DEFAULTS.XLSX_HARD_CAP_BYTES / (1024 * 1024)} MB.`
      );
    }

    const sheetIdentificador: string | number =
      params.abaAlvoXlsx && params.abaAlvoXlsx.trim() !== '' ? params.abaAlvoXlsx.trim() : 1;

    const rows = await readSheet(params.caminhoArquivo, sheetIdentificador);
    if (!rows || rows.length === 0) {
      return {
        sucesso: true,
        totalLinhas: 0,
        totalColunas: 0,
        problemas: [],
        verificacoes: [],
        statusExecucao: StatusExecucaoDiagnostico.CONCLUIDO,
        resumoMetricas: { aviso: 'Aba vazia' },
      };
    }

    const cabecalhosRaw = rows[0] ?? [];
    const cabecalhos = cabecalhosRaw.map((h, idx) => {
      const texto = h !== null && h !== undefined ? String(h).trim() : '';
      return texto || `coluna_${idx + 1}`;
    });

    const dataRows = rows.slice(1);
    const totalLinhas = dataRows.length;

    const nulosPorColuna: number[] = new Array(cabecalhos.length).fill(0);
    const tiposInconsistentesPorColuna: number[] = new Array(cabecalhos.length).fill(0);
    const datasInvalidasPorColuna: number[] = new Array(cabecalhos.length).fill(0);
    const numerosInvalidosPorColuna: number[] = new Array(cabecalhos.length).fill(0);

    const totalValoresNaoNulos: number[] = new Array(cabecalhos.length).fill(0);
    const contagemNumerosValidos: number[] = new Array(cabecalhos.length).fill(0);
    const contagemDatasValidas: number[] = new Array(cabecalhos.length).fill(0);

    const evidenciasNulosPorColuna: EvidenciaProblemaQualidade[][] = Array.from({ length: cabecalhos.length }, () => []);
    const evidenciasTiposPorColuna: EvidenciaProblemaQualidade[][] = Array.from({ length: cabecalhos.length }, () => []);
    const evidenciasDatasPorColuna: EvidenciaProblemaQualidade[][] = Array.from({ length: cabecalhos.length }, () => []);
    const evidenciasNumerosPorColuna: EvidenciaProblemaQualidade[][] = Array.from({ length: cabecalhos.length }, () => []);

    const linhasVistas = new Map<string, number>();
    let totalLinhasDuplicadas = 0;
    const evidenciasDuplicidades: EvidenciaProblemaQualidade[] = [];
    let duplicidadesLimitadasPorGuardrail = false;

    const limiteDuplicidade = params.limiteLinhasDuplicidade ?? LIMITE_LINHAS_DUPLICIDADE;
    const schemaEsperado = params.schemaInferido ?? {};

    for (let r = 0; r < dataRows.length; r++) {
      const row = dataRows[r];
      const numeroLinhaFisica = r + 2;

      // V3: Duplicidades de Linha Inteira com canonicalização tipada e SHA-256 completo
      if (r < limiteDuplicidade) {
        const linhaCanonica = canonicalizarLinha(row);
        const hashLinha = crypto.createHash('sha256').update(linhaCanonica).digest('hex');

        if (linhasVistas.has(hashLinha)) {
          totalLinhasDuplicadas++;
          const linhaOriginal = linhasVistas.get(hashLinha)!;
          if (evidenciasDuplicidades.length < MAX_AMOSTRAS_EVIDENCIA) {
            evidenciasDuplicidades.push({
              linhaDuplicada: numeroLinhaFisica,
              linhaOriginal,
              detalhe: `Conteúdo idêntico ao registro da linha ${linhaOriginal}`,
            });
          }
        } else {
          linhasVistas.set(hashLinha, numeroLinhaFisica);
        }
      } else {
        duplicidadesLimitadasPorGuardrail = true;
      }

      // Verificações por coluna
      for (let c = 0; c < cabecalhos.length; c++) {
        const colNome = cabecalhos[c];
        const valRaw = row[c];
        const valStr = valRaw !== undefined && valRaw !== null ? String(valRaw).trim() : '';

        // V1: Nulos e Brancos
        if (this.isValorNulo(valStr)) {
          nulosPorColuna[c]++;
          if (evidenciasNulosPorColuna[c].length < MAX_AMOSTRAS_EVIDENCIA) {
            evidenciasNulosPorColuna[c].push({
              numeroLinha: numeroLinhaFisica,
              coluna: colNome,
              valorObservado: '[VAZIO]',
              detalhe: 'Valor ausente, nulo ou preenchido com indicador de omissão',
            });
          }
          continue;
        }

        totalValoresNaoNulos[c]++;
        const eNumero = typeof valRaw === 'number' ? !isNaN(valRaw) && isFinite(valRaw) : this.isNumeroValido(valStr);

        let resData: { valida: boolean; motivo?: string } = { valida: false };
        if (valRaw instanceof Date) {
          const ano = valRaw.getFullYear();
          if (isNaN(valRaw.getTime()) || ano === 1900 || ano < 1900 || ano > 2100) {
            resData = {
              valida: false,
              motivo: ano === 1900 ? 'Data anômala com ano 1900 (serial zero do Excel)' : 'Data fora do período plausível',
            };
          } else {
            resData = { valida: true };
          }
        } else {
          resData = this.validarData(valStr);
        }

        if (eNumero) contagemNumerosValidos[c]++;
        if (resData.valida) contagemDatasValidas[c]++;

        const tipoEsperado = schemaEsperado[colNome];

        if (tipoEsperado === 'number') {
          if (!eNumero) {
            numerosInvalidosPorColuna[c]++;
            if (evidenciasNumerosPorColuna[c].length < MAX_AMOSTRAS_EVIDENCIA) {
              evidenciasNumerosPorColuna[c].push({
                numeroLinha: numeroLinhaFisica,
                coluna: colNome,
                valorObservado: `[TEXTO_NAO_NUMERICO: ${valStr.length} caracteres]`,
                detalhe: 'Formato numérico incompatível ou caractere não numérico',
              });
            }
          }
        } else if (tipoEsperado === 'date') {
          if (!resData.valida) {
            datasInvalidasPorColuna[c]++;
            if (evidenciasDatasPorColuna[c].length < MAX_AMOSTRAS_EVIDENCIA) {
              evidenciasDatasPorColuna[c].push({
                numeroLinha: numeroLinhaFisica,
                coluna: colNome,
                valorObservado: `[DATA_INVALIDA: ${valStr.length} caracteres]`,
                detalhe: resData.motivo ?? 'Data inválida ou corrompida',
              });
            }
          }
        } else if (tipoEsperado === 'boolean') {
          if (!this.isBooleanValido(valStr)) {
            tiposInconsistentesPorColuna[c]++;
            if (evidenciasTiposPorColuna[c].length < MAX_AMOSTRAS_EVIDENCIA) {
              evidenciasTiposPorColuna[c].push({
                numeroLinha: numeroLinhaFisica,
                coluna: colNome,
                valorObservado: `[TIPO_INESPERADO: string (${valStr.length} chars)]`,
                detalhe: 'Valor não booleano em coluna esperada como booleana',
              });
            }
          }
        }
      }
    }

    // Mitigação de circularidade
    this.mitigarCircularidadeSchema({
      cabecalhos,
      schemaEsperado,
      totalValoresNaoNulos,
      contagemNumerosValidos,
      contagemDatasValidas,
      numerosInvalidosPorColuna,
      datasInvalidasPorColuna,
      evidenciasNumerosPorColuna,
      evidenciasDatasPorColuna,
    });

    return this.consolidarResultados({
      params,
      cabecalhos,
      totalLinhas,
      nulosPorColuna,
      tiposInconsistentesPorColuna,
      datasInvalidasPorColuna,
      numerosInvalidosPorColuna,
      evidenciasNulosPorColuna,
      evidenciasTiposPorColuna,
      evidenciasDatasPorColuna,
      evidenciasNumerosPorColuna,
      totalLinhasDuplicadas,
      evidenciasDuplicidades,
      duplicidadesLimitadasPorGuardrail,
    });
  }

  // =========================================================================
  // MITIGAÇÃO DETERMINÍSTICA DA CIRCULARIDADE DO SCHEMA
  // =========================================================================
  private static mitigarCircularidadeSchema(dados: {
    cabecalhos: string[];
    schemaEsperado: Record<string, string>;
    totalValoresNaoNulos: number[];
    contagemNumerosValidos: number[];
    contagemDatasValidas: number[];
    numerosInvalidosPorColuna: number[];
    datasInvalidasPorColuna: number[];
    evidenciasNumerosPorColuna: EvidenciaProblemaQualidade[][];
    evidenciasDatasPorColuna: EvidenciaProblemaQualidade[][];
  }): void {
    for (let c = 0; c < dados.cabecalhos.length; c++) {
      const colNome = dados.cabecalhos[c];
      const tipoDefinido = dados.schemaEsperado[colNome];

      // Só age se o tipo era 'string' (ou indefinido) na amostra inicial da 3.2
      if (tipoDefinido && tipoDefinido !== 'string') {
        continue;
      }

      const totalNaoNulos = dados.totalValoresNaoNulos[c];
      if (totalNaoNulos < MINIMO_AMOSTRAS_INFERENCIA_CIRCULARIDADE) continue; // Amostra muito pequena para inferência estatística segura

      const pctNumeros = dados.contagemNumerosValidos[c] / totalNaoNulos;
      const pctDatas = dados.contagemDatasValidas[c] / totalNaoNulos;

      // Heurística V1: se prevalência atingir o threshold mínimo e houver algum valor divergente
      if (pctNumeros >= THRESHOLD_PREVALENCIA_TIPO_PRELIMINAR && pctNumeros < 1.0) {
        const invalidos = totalNaoNulos - dados.contagemNumerosValidos[c];
        dados.numerosInvalidosPorColuna[c] = invalidos;
        if (dados.evidenciasNumerosPorColuna[c].length === 0) {
          dados.evidenciasNumerosPorColuna[c].push({
            coluna: colNome,
            valorObservado: `[TEXTO_NAO_NUMERICO: ${invalidos} ocorrências]`,
            detalhe: 'Coluna predominantemente numérica contém valores que não puderam ser convertidos',
          });
        }
      } else if (pctDatas >= THRESHOLD_PREVALENCIA_TIPO_PRELIMINAR && pctDatas < 1.0) {
        // Heurística V1 para datas anômalas em coluna predominantemente temporal
        const invalidos = totalNaoNulos - dados.contagemDatasValidas[c];
        dados.datasInvalidasPorColuna[c] = invalidos;
        if (dados.evidenciasDatasPorColuna[c].length === 0) {
          dados.evidenciasDatasPorColuna[c].push({
            coluna: colNome,
            valorObservado: `[DATA_INVALIDA: ${invalidos} ocorrências]`,
            detalhe: 'Coluna predominantemente temporal contém valores com datas corrompidas ou anômalas',
          });
        }
      }
    }
  }

  // =========================================================================
  // CONSOLIDAÇÃO DE PROBLEMAS E CRITÉRIOS EPISTÊMICOS (UNICIDADE V4/V5/V6)
  // =========================================================================
  private static consolidarResultados(dados: {
    params: ParametrosVarredura;
    cabecalhos: string[];
    totalLinhas: number;
    nulosPorColuna: number[];
    tiposInconsistentesPorColuna: number[];
    datasInvalidasPorColuna: number[];
    numerosInvalidosPorColuna: number[];
    evidenciasNulosPorColuna: EvidenciaProblemaQualidade[][];
    evidenciasTiposPorColuna: EvidenciaProblemaQualidade[][];
    evidenciasDatasPorColuna: EvidenciaProblemaQualidade[][];
    evidenciasNumerosPorColuna: EvidenciaProblemaQualidade[][];
    totalLinhasDuplicadas: number;
    evidenciasDuplicidades: EvidenciaProblemaQualidade[];
    duplicidadesLimitadasPorGuardrail: boolean;
  }): ResultadoVarredura {
    const problemas: ProblemaQualidade[] = [];
    const agora = new Date().toISOString();
    const { params, cabecalhos, totalLinhas } = dados;

    // 1. Verificação V7: Cabeçalhos Problemáticos
    let problemasCabecalho = 0;
    const nomesVistos = new Set<string>();
    const evidenciasCabecalhos: EvidenciaProblemaQualidade[] = [];

    for (let c = 0; c < cabecalhos.length; c++) {
      const nome = cabecalhos[c];
      const nomeLower = nome.toLowerCase().trim();

      if (nomesVistos.has(nomeLower)) {
        problemasCabecalho++;
        evidenciasCabecalhos.push({
          coluna: nome,
          detalhe: `Cabeçalho duplicado detectado: "${nome}"`,
        });
      } else {
        nomesVistos.add(nomeLower);
      }

      if (nome.startsWith('coluna_') || nome.trim() === '') {
        problemasCabecalho++;
        evidenciasCabecalhos.push({
          coluna: nome,
          detalhe: `Cabeçalho ausente ou gerado automaticamente: "${nome}"`,
        });
      }
    }

    if (problemasCabecalho > 0) {
      problemas.push({
        id: crypto.randomUUID(),
        diagnostico_id: params.diagnosticoId,
        ativo_dados_id: params.ativoDadosId,
        demanda_id: params.demandaId,
        categoria: CategoriaProblemaQualidade.CABECALHOS_PROBLEMATICOS,
        titulo: 'Cabeçalhos duplicados ou problemáticos',
        descricao: `Foram identificados ${problemasCabecalho} cabeçalhos vazios ou com nomes duplicados no ativo.`,
        tabela_afetada: params.tabelaNome,
        coluna_afetada: null,
        total_linhas_afetadas: problemasCabecalho,
        percentual_linhas_afetadas: Number(((problemasCabecalho / cabecalhos.length) * 100).toFixed(2)),
        amostra_evidencias: evidenciasCabecalhos.slice(0, MAX_AMOSTRAS_EVIDENCIA),
        severidade: SeveridadeProblema.PENDENTE,
        impacto_calculo: 'Pode quebrar nomes de medidas e referências em transformações',
        acao_deliberada: null,
        justificativa_deliberacao: null,
        deliberado_por_humano: false,
        deliberado_em: null,
        status: StatusProblemaQualidade.ABERTO,
        origem_deteccao: 'AUTOMATICA',
        criado_em: agora,
        atualizado_em: agora,
      });
    }

    // 2. Verificação V3: Duplicidades de Linha Inteira
    if (dados.totalLinhasDuplicadas > 0) {
      const pct = totalLinhas > 0 ? Number(((dados.totalLinhasDuplicadas / totalLinhas) * 100).toFixed(2)) : 0;
      problemas.push({
        id: crypto.randomUUID(),
        diagnostico_id: params.diagnosticoId,
        ativo_dados_id: params.ativoDadosId,
        demanda_id: params.demandaId,
        categoria: CategoriaProblemaQualidade.DUPLICIDADES_LINHA,
        titulo: 'Linhas inteiras duplicadas',
        descricao: `Foram encontradas ${dados.totalLinhasDuplicadas} linhas exatamente idênticas a registros anteriores (${pct}% do total).`,
        tabela_afetada: params.tabelaNome,
        coluna_afetada: null,
        total_linhas_afetadas: dados.totalLinhasDuplicadas,
        percentual_linhas_afetadas: pct,
        amostra_evidencias: dados.evidenciasDuplicidades,
        severidade: SeveridadeProblema.PENDENTE,
        impacto_calculo: 'Risco de contagem duplicada e distorção em agregações numéricas',
        acao_deliberada: null,
        justificativa_deliberacao: null,
        deliberado_por_humano: false,
        deliberado_em: null,
        status: StatusProblemaQualidade.ABERTO,
        origem_deteccao: 'AUTOMATICA',
        criado_em: agora,
        atualizado_em: agora,
      });
    }

    // 3. Verificações por coluna (V1, V2, V4, V5, V6 com UNICIDADE de classificação)
    let totalColunasVazias = 0;
    let totalProblemasNulos = 0;
    let totalProblemasTipos = 0;
    let totalProblemasDatas = 0;
    let totalProblemasNumeros = 0;

    for (let c = 0; c < cabecalhos.length; c++) {
      const colNome = cabecalhos[c];
      const nulos = dados.nulosPorColuna[c];

      // V2: Coluna 100% vazia
      if (totalLinhas > 0 && nulos === totalLinhas) {
        totalColunasVazias++;
        problemas.push({
          id: crypto.randomUUID(),
          diagnostico_id: params.diagnosticoId,
          ativo_dados_id: params.ativoDadosId,
          demanda_id: params.demandaId,
          categoria: CategoriaProblemaQualidade.COLUNAS_VAZIAS,
          titulo: `Coluna 100% vazia: "${colNome}"`,
          descricao: `A coluna "${colNome}" não possui nenhum valor preenchido em todos os ${totalLinhas} registros.`,
          tabela_afetada: params.tabelaNome,
          coluna_afetada: colNome,
          total_linhas_afetadas: totalLinhas,
          percentual_linhas_afetadas: 100,
          amostra_evidencias: dados.evidenciasNulosPorColuna[c].slice(0, MAX_AMOSTRAS_EVIDENCIA),
          severidade: SeveridadeProblema.PENDENTE,
          impacto_calculo: 'Coluna inútil que ocupa espaço no modelo sem agregar informação analítica',
          acao_deliberada: null,
          justificativa_deliberacao: null,
          deliberado_por_humano: false,
          deliberado_em: null,
          status: StatusProblemaQualidade.ABERTO,
          origem_deteccao: 'AUTOMATICA',
          criado_em: agora,
          atualizado_em: agora,
        });
      } else if (nulos > 0) {
        // V1: Nulos parciais
        totalProblemasNulos++;
        const pct = totalLinhas > 0 ? Number(((nulos / totalLinhas) * 100).toFixed(2)) : 0;
        problemas.push({
          id: crypto.randomUUID(),
          diagnostico_id: params.diagnosticoId,
          ativo_dados_id: params.ativoDadosId,
          demanda_id: params.demandaId,
          categoria: CategoriaProblemaQualidade.NULOS_BRANCOS,
          titulo: `Valores ausentes/nulos na coluna "${colNome}"`,
          descricao: `A coluna "${colNome}" possui ${nulos} registros nulos ou em branco (${pct}% das linhas).`,
          tabela_afetada: params.tabelaNome,
          coluna_afetada: colNome,
          total_linhas_afetadas: nulos,
          percentual_linhas_afetadas: pct,
          amostra_evidencias: dados.evidenciasNulosPorColuna[c],
          severidade: SeveridadeProblema.PENDENTE,
          impacto_calculo: 'Valores nulos podem distorcer médias ou quebrar relacionamentos se a coluna for chave',
          acao_deliberada: null,
          justificativa_deliberacao: null,
          deliberado_por_humano: false,
          deliberado_em: null,
          status: StatusProblemaQualidade.ABERTO,
          origem_deteccao: 'AUTOMATICA',
          criado_em: agora,
          atualizado_em: agora,
        });
      }

      // V6: Números Inválidos Específicos (Classificação prioritária sobre Tipos)
      const numerosInvalidos = dados.numerosInvalidosPorColuna[c];
      if (numerosInvalidos > 0) {
        totalProblemasNumeros++;
        const pct = totalLinhas > 0 ? Number(((numerosInvalidos / totalLinhas) * 100).toFixed(2)) : 0;
        problemas.push({
          id: crypto.randomUUID(),
          diagnostico_id: params.diagnosticoId,
          ativo_dados_id: params.ativoDadosId,
          demanda_id: params.demandaId,
          categoria: CategoriaProblemaQualidade.NUMEROS_INVALIDOS,
          titulo: `Valores numéricos inválidos ou NaN na coluna "${colNome}"`,
          descricao: `A coluna "${colNome}" contém ${numerosInvalidos} registros que não puderam ser convertidos em número (${pct}%).`,
          tabela_afetada: params.tabelaNome,
          coluna_afetada: colNome,
          total_linhas_afetadas: numerosInvalidos,
          percentual_linhas_afetadas: pct,
          amostra_evidencias: dados.evidenciasNumerosPorColuna[c].slice(0, MAX_AMOSTRAS_EVIDENCIA),
          severidade: SeveridadeProblema.PENDENTE,
          impacto_calculo: 'Provoca erro em somatórios, médias e agregações numéricas',
          acao_deliberada: null,
          justificativa_deliberacao: null,
          deliberado_por_humano: false,
          deliberado_em: null,
          status: StatusProblemaQualidade.ABERTO,
          origem_deteccao: 'AUTOMATICA',
          criado_em: agora,
          atualizado_em: agora,
        });
      }

      // V5: Datas Inválidas Específicas (Classificação prioritária sobre Tipos)
      const datasInvalidas = dados.datasInvalidasPorColuna[c];
      if (datasInvalidas > 0) {
        totalProblemasDatas++;
        const pct = totalLinhas > 0 ? Number(((datasInvalidas / totalLinhas) * 100).toFixed(2)) : 0;
        problemas.push({
          id: crypto.randomUUID(),
          diagnostico_id: params.diagnosticoId,
          ativo_dados_id: params.ativoDadosId,
          demanda_id: params.demandaId,
          categoria: CategoriaProblemaQualidade.DATAS_INVALIDAS,
          titulo: `Datas inválidas ou corrompidas na coluna "${colNome}"`,
          descricao: `A coluna "${colNome}" contém ${datasInvalidas} valores de data inválidos, corrompidos ou com ano 1900.`,
          tabela_afetada: params.tabelaNome,
          coluna_afetada: colNome,
          total_linhas_afetadas: datasInvalidas,
          percentual_linhas_afetadas: pct,
          amostra_evidencias: dados.evidenciasDatasPorColuna[c].slice(0, MAX_AMOSTRAS_EVIDENCIA),
          severidade: SeveridadeProblema.PENDENTE,
          impacto_calculo: 'Quebra inteligência temporal (Time Intelligence) e relacionamentos com dData',
          acao_deliberada: null,
          justificativa_deliberacao: null,
          deliberado_por_humano: false,
          deliberado_em: null,
          status: StatusProblemaQualidade.ABERTO,
          origem_deteccao: 'AUTOMATICA',
          criado_em: agora,
          atualizado_em: agora,
        });
      }

      // V4: Tipos Inconsistentes Residuais (somente o que não for data ou número inválido)
      const tiposInconsistentes = dados.tiposInconsistentesPorColuna[c];
      if (tiposInconsistentes > 0) {
        totalProblemasTipos++;
        const pct = totalLinhas > 0 ? Number(((tiposInconsistentes / totalLinhas) * 100).toFixed(2)) : 0;
        problemas.push({
          id: crypto.randomUUID(),
          diagnostico_id: params.diagnosticoId,
          ativo_dados_id: params.ativoDadosId,
          demanda_id: params.demandaId,
          categoria: CategoriaProblemaQualidade.TIPOS_INCONSISTENTES,
          titulo: `Inconsistência de tipo na coluna "${colNome}"`,
          descricao: `A coluna "${colNome}" possui ${tiposInconsistentes} registros com tipo estrutural divergente do esperado (${pct}%).`,
          tabela_afetada: params.tabelaNome,
          coluna_afetada: colNome,
          total_linhas_afetadas: tiposInconsistentes,
          percentual_linhas_afetadas: pct,
          amostra_evidencias: dados.evidenciasTiposPorColuna[c].slice(0, MAX_AMOSTRAS_EVIDENCIA),
          severidade: SeveridadeProblema.PENDENTE,
          impacto_calculo: 'Incompatibilidade de tipo impede conversão de dados e cálculos no Power BI',
          acao_deliberada: null,
          justificativa_deliberacao: null,
          deliberado_por_humano: false,
          deliberado_em: null,
          status: StatusProblemaQualidade.ABERTO,
          origem_deteccao: 'AUTOMATICA',
          criado_em: agora,
          atualizado_em: agora,
        });
      }
    }

    // 4. Mapeamento Epistêmico das 7 Verificações Executadas
    const verificacoes: ResultadoItemVerificacao[] = [
      {
        categoria: CategoriaProblemaQualidade.CABECALHOS_PROBLEMATICOS,
        nome: 'Validação Estrutural de Cabeçalhos',
        status: problemasCabecalho === 0
          ? StatusVerificacaoQualidade.EXECUTADA_SEM_PROBLEMAS
          : StatusVerificacaoQualidade.EXECUTADA_COM_PROBLEMAS,
        totalProblemas: problemasCabecalho,
      },
      {
        categoria: CategoriaProblemaQualidade.DUPLICIDADES_LINHA,
        nome: 'Detecção de Linhas Inteiras Duplicadas',
        status: dados.duplicidadesLimitadasPorGuardrail
          ? StatusVerificacaoQualidade.LIMITADA_POR_GUARDRAIL
          : dados.totalLinhasDuplicadas === 0
          ? StatusVerificacaoQualidade.EXECUTADA_SEM_PROBLEMAS
          : StatusVerificacaoQualidade.EXECUTADA_COM_PROBLEMAS,
        totalProblemas: dados.totalLinhasDuplicadas,
        observacao: dados.duplicidadesLimitadasPorGuardrail
          ? `Verificação suspensa após ${dados.params.limiteLinhasDuplicidade ?? LIMITE_LINHAS_DUPLICIDADE} linhas por guardrail operacional.`
          : undefined,
      },
      {
        categoria: CategoriaProblemaQualidade.NULOS_BRANCOS,
        nome: 'Detecção de Valores Ausentes e Nulos',
        status: totalProblemasNulos === 0
          ? StatusVerificacaoQualidade.EXECUTADA_SEM_PROBLEMAS
          : StatusVerificacaoQualidade.EXECUTADA_COM_PROBLEMAS,
        totalProblemas: totalProblemasNulos,
      },
      {
        categoria: CategoriaProblemaQualidade.COLUNAS_VAZIAS,
        nome: 'Detecção de Colunas 100% Vazias',
        status: totalColunasVazias === 0
          ? StatusVerificacaoQualidade.EXECUTADA_SEM_PROBLEMAS
          : StatusVerificacaoQualidade.EXECUTADA_COM_PROBLEMAS,
        totalProblemas: totalColunasVazias,
      },
      {
        categoria: CategoriaProblemaQualidade.TIPOS_INCONSISTENTES,
        nome: 'Conformidade de Tipos com o Schema',
        status: totalProblemasTipos === 0
          ? StatusVerificacaoQualidade.EXECUTADA_SEM_PROBLEMAS
          : StatusVerificacaoQualidade.EXECUTADA_COM_PROBLEMAS,
        totalProblemas: totalProblemasTipos,
      },
      {
        categoria: CategoriaProblemaQualidade.DATAS_INVALIDAS,
        nome: 'Integridade de Formatos de Datas',
        status: totalProblemasDatas === 0
          ? StatusVerificacaoQualidade.EXECUTADA_SEM_PROBLEMAS
          : StatusVerificacaoQualidade.EXECUTADA_COM_PROBLEMAS,
        totalProblemas: totalProblemasDatas,
      },
      {
        categoria: CategoriaProblemaQualidade.NUMEROS_INVALIDOS,
        nome: 'Integridade de Formatos Numéricos',
        status: totalProblemasNumeros === 0
          ? StatusVerificacaoQualidade.EXECUTADA_SEM_PROBLEMAS
          : StatusVerificacaoQualidade.EXECUTADA_COM_PROBLEMAS,
        totalProblemas: totalProblemasNumeros,
      },
    ];

    const statusExecucao = dados.duplicidadesLimitadasPorGuardrail
      ? StatusExecucaoDiagnostico.CONCLUIDO_PARCIALMENTE
      : StatusExecucaoDiagnostico.CONCLUIDO;

    const resumoMetricas = {
      totalLinhas,
      totalColunas: cabecalhos.length,
      totalProblemasDetectados: problemas.length,
      duplicidadesLimitadasPorGuardrail: dados.duplicidadesLimitadasPorGuardrail,
      nulosPorColuna: cabecalhos.reduce<Record<string, number>>((acc, col, idx) => {
        acc[col] = dados.nulosPorColuna[idx];
        return acc;
      }, {}),
    };

    return {
      sucesso: true,
      totalLinhas,
      totalColunas: cabecalhos.length,
      problemas,
      verificacoes,
      statusExecucao,
      resumoMetricas,
    };
  }

  // =========================================================================
  // AUXILIARES DETERMINÍSTICOS
  // =========================================================================
  public static isValorNulo(valor: string): boolean {
    if (!valor) return true;
    const lower = valor.toLowerCase().trim();
    return LITERAIS_OMISSAO.has(lower);
  }

  /**
   * Reconhecimento numérico determinístico robusto com suporte a padrões brasileiros e internacionais.
   * Não converte identificadores (CPF, CEP, telefone, códigos com máscara) em números.
   */
  public static isNumeroValido(valor: string): boolean {
    if (this.isValorNulo(valor)) return true;
    let v = valor.trim();

    // 1. Exclusão imediata de identificadores conhecidos
    if (
      REGEX_CPF.test(v) ||
      REGEX_CNPJ.test(v) ||
      REGEX_CEP.test(v) ||
      REGEX_TELEFONE.test(v) ||
      REGEX_CODIGO_COM_MASCARA.test(v)
    ) {
      return false;
    }

    // 2. Tratamento de prefixo monetário brasileiro 'R$'
    if (/^R\$\s*/i.test(v)) {
      v = v.replace(/^R\$\s*/i, '').trim();
    }

    // 3. Casamento com padrões numéricos estruturados
    // Inteiro simples (1500)
    if (REGEX_INT.test(v)) {
      const n = Number(v);
      return !isNaN(n) && isFinite(n);
    }

    // Decimal internacional simples (1500.50)
    if (REGEX_DEC_PONTO.test(v)) {
      const n = Number(v);
      return !isNaN(n) && isFinite(n);
    }

    // Decimal brasileiro simples (1500,50)
    if (REGEX_DEC_VIRGULA.test(v)) {
      const n = Number(v.replace(',', '.'));
      return !isNaN(n) && isFinite(n);
    }

    // Padrão brasileiro com milhar (1.500 ou 1.500,50 ou 12.345.678,90)
    if (REGEX_BR_MILHAR.test(v)) {
      const normalizado = v.replace(/\./g, '').replace(',', '.');
      const n = Number(normalizado);
      return !isNaN(n) && isFinite(n);
    }

    // Padrão internacional com milhar (1,500 ou 1,500.50 ou 12,345,678.90)
    if (REGEX_INT_MILHAR.test(v)) {
      const normalizado = v.replace(/,/g, '');
      const n = Number(normalizado);
      return !isNaN(n) && isFinite(n);
    }

    return false;
  }

  public static isBooleanValido(valor: string): boolean {
    if (this.isValorNulo(valor)) return true;
    const lower = valor.toLowerCase().trim();
    return ['true', 'false', '1', '0', 'sim', 'nao', 'não', 's', 'n', 'v', 'f'].includes(lower);
  }

  public static validarData(valor: string): { valida: boolean; motivo?: string } {
    if (this.isValorNulo(valor)) return { valida: true };

    const parsed = Date.parse(valor);
    if (isNaN(parsed)) {
      // Tenta formato brasileiro DD/MM/YYYY
      const parts = valor.split(/[/.-]/);
      if (parts.length === 3) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[2], 10);
        const dateObj = new Date(y, m, d);
        if (dateObj.getFullYear() === y && dateObj.getMonth() === m && dateObj.getDate() === d) {
          if (y === 1900) {
            return { valida: false, motivo: 'Data anômala com ano 1900 (serial zero do Excel)' };
          }
          if (y < 1900 || y > 2100) {
            return { valida: false, motivo: `Ano fora da faixa cronológica plausível (${y})` };
          }
          return { valida: true };
        }
      }
      return { valida: false, motivo: 'Formato de data inválido ou não reconhecido' };
    }

    const d = new Date(parsed);
    const ano = d.getFullYear();
    if (ano === 1900) {
      return { valida: false, motivo: 'Data anômala com ano 1900 (serial zero do Excel)' };
    }
    if (ano < 1900 || ano > 2100) {
      return { valida: false, motivo: `Ano fora da faixa cronológica plausível (${ano})` };
    }

    return { valida: true };
  }

  private static detectarDelimitador(caminhoArquivo: string, formato: FormatoArquivo): string {
    if (formato === FormatoArquivo.TSV) return '\t';

    try {
      const fd = fs.openSync(caminhoArquivo, 'r');
      const buffer = Buffer.alloc(Math.min(16384, fs.fstatSync(fd).size));
      const bytesRead = fs.readSync(fd, buffer, 0, buffer.length, 0);
      fs.closeSync(fd);

      const snippet = buffer.toString('utf-8', 0, bytesRead);
      const linhas = snippet.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (linhas.length === 0) return ',';

      const primeiraLinha = linhas[0];
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

      let melhor = ',';
      let max = 0;
      for (const del of FS_DEFAULTS.DELIMITADORES_SUPORTADOS) {
        if (contagens[del] > max) {
          max = contagens[del];
          melhor = del;
        }
      }
      return melhor;
    } catch {
      return ',';
    }
  }
}
