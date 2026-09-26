import fs from 'node:fs';
import crypto from 'node:crypto';
import { parse } from 'csv-parse';
import { readSheet } from 'read-excel-file/node';
import { FS_DEFAULTS } from '../filesystem/constants';
import { FormatoArquivo } from '@/core/domain/enums/formato-arquivo';
import { CategoriaProblemaQualidade } from '@/core/domain/enums/categoria-problema-qualidade';
import { SeveridadeProblema } from '@/core/domain/enums/severidade-problema';
import { StatusProblemaQualidade } from '@/core/domain/enums/status-problema-qualidade';
import { TipoRegraQualidade } from '@/core/domain/enums/tipo-regra-qualidade';
import { EvidenciaProblemaQualidade, ProblemaQualidade } from '@/core/domain/entities/problema-qualidade';
import {
  ParametrosR1ChaveUnica,
  ParametrosR2ValorMinMax,
  ParametrosR3ValoresPermitidos,
  ParametrosR4Obrigatoriedade,
  ParametrosR5RegraTemporal,
  RegraQualidade,
  RegraSnapshot,
} from '@/core/domain/entities/regra-qualidade';

export interface ParametrosAvaliacaoRegras {
  diagnosticoId: string | null;
  ativoDadosId: string;
  demandaId: string;
  tabelaNome: string;
  caminhoArquivo: string;
  formato: FormatoArquivo;
  regras: RegraQualidade[];
  abaAlvoXlsx?: string;
  limiteLinhasR1?: number; // Guardrail operacional para R1 (default: 300.000)
  dataReferencia?: Date; // Injetável para controle determinístico de datas relativas (ex: HOJE em R5)
}

export interface ResultadoAvaliacaoRegras {
  problemas: ProblemaQualidade[];
  totalRegrasAvaliadas: number;
  totalRegrasVioladas: number;
}

const MAX_AMOSTRAS_EVIDENCIA = 10;
const LIMITE_OPERACIONAL_R1_DEFAULT = 300_000;

// Regex para parsing numérico robusto (padrões brasileiro e internacional)
const REGEX_INT = /^[+-]?\d+$/;
const REGEX_DEC_PONTO = /^[+-]?\d+\.\d+$/;
const REGEX_DEC_VIRGULA = /^[+-]?\d+,\d+$/;
const REGEX_BR_MILHAR = /^[+-]?\d{1,3}(\.\d{3})*(,\d+)?$/;
const REGEX_INT_MILHAR = /^[+-]?\d{1,3}(,\d{3})*(\.\d+)?$/;

/**
 * Canonicalização determinística Type-Length-Value (TLV) para chaves de dados (R1).
 *
 * NOTA METODOLÓGICA NORMATIVA SOBRE R1 E COLISÕES:
 * A canonicalização TLV evita ambiguidades estruturais de serialização e o SHA-256
 * completo de 256 bits torna colisões criptográficas acidentais desprezíveis para o contexto
 * operacional, sem alegar impossibilidade matemática.
 */
export function canonicalizarChaveTLV(valores: unknown[]): string {
  const partes: string[] = [`K:${valores.length}`];
  for (let i = 0; i < valores.length; i++) {
    const v = valores[i];
    if (v === null) {
      partes.push('Z');
    } else if (v === undefined) {
      partes.push('U');
    } else if (typeof v === 'boolean') {
      partes.push(v ? 'B:1' : 'B:0');
    } else if (typeof v === 'number') {
      partes.push(`N:${isNaN(v) ? 'NaN' : isFinite(v) ? v : v > 0 ? 'Inf' : '-Inf'}`);
    } else if (v instanceof Date) {
      partes.push(`D:${isNaN(v.getTime()) ? 'Invalid' : v.toISOString()}`);
    } else {
      const str = String(v);
      partes.push(`S:${str.length}:${str}`);
    }
  }
  return partes.join('|');
}

/**
 * Converte com segurança string para número com suporte a formatos brasileiro e internacional.
 */
export function extrairNumero(valor: unknown): number | null {
  if (valor === null || valor === undefined) return null;
  if (typeof valor === 'number') return isNaN(valor) ? null : valor;

  let str = String(valor).trim();
  if (str === '') return null;

  if (/^R\$\s*/i.test(str)) {
    str = str.replace(/^R\$\s*/i, '').trim();
  }

  if (REGEX_INT.test(str)) {
    const n = Number(str);
    return isFinite(n) ? n : null;
  }
  if (REGEX_DEC_PONTO.test(str)) {
    const n = Number(str);
    return isFinite(n) ? n : null;
  }
  if (REGEX_DEC_VIRGULA.test(str)) {
    const n = Number(str.replace(',', '.'));
    return isFinite(n) ? n : null;
  }
  if (REGEX_BR_MILHAR.test(str)) {
    const n = Number(str.replace(/\./g, '').replace(',', '.'));
    return isFinite(n) ? n : null;
  }
  if (REGEX_INT_MILHAR.test(str)) {
    const n = Number(str.replace(/,/g, ''));
    return isFinite(n) ? n : null;
  }

  return null;
}

/**
 * Converte data para representação lexicográfica YYYY-MM-DD para comparações determinísticas.
 */
export function extrairDataISO(valor: unknown): string | null {
  if (valor === null || valor === undefined) return null;
  if (valor instanceof Date) {
    if (isNaN(valor.getTime())) return null;
    const y = valor.getFullYear();
    const m = String(valor.getMonth() + 1).padStart(2, '0');
    const d = String(valor.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const str = String(valor).trim();
  if (!str) return null;

  // Formato ISO: YYYY-MM-DD
  const matchIso = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (matchIso) {
    const y = parseInt(matchIso[1], 10);
    const m = parseInt(matchIso[2], 10);
    const d = parseInt(matchIso[3], 10);
    const dateObj = new Date(y, m - 1, d);
    if (dateObj.getFullYear() === y && dateObj.getMonth() === m - 1 && dateObj.getDate() === d) {
      return `${matchIso[1]}-${matchIso[2]}-${matchIso[3]}`;
    }
  }

  // Formato Brasileiro: DD/MM/YYYY ou DD.MM.YYYY ou DD-MM-YYYY
  const matchBr = str.match(/^(\d{2})[/.-](\d{2})[/.-](\d{4})/);
  if (matchBr) {
    const d = parseInt(matchBr[1], 10);
    const m = parseInt(matchBr[2], 10);
    const y = parseInt(matchBr[3], 10);
    const dateObj = new Date(y, m - 1, d);
    if (dateObj.getFullYear() === y && dateObj.getMonth() === m - 1 && dateObj.getDate() === d) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }

  // Fallback Date.parse
  const parsed = Date.parse(str);
  if (!isNaN(parsed)) {
    const dateObj = new Date(parsed);
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return null;
}

/**
 * Cria snapshot imutável de uma Regra de Qualidade para auditabilidade histórica.
 */
export function criarSnapshotRegra(regra: RegraQualidade): RegraSnapshot {
  return {
    id: regra.id,
    nome: regra.nome,
    tipo: regra.tipo,
    versao: regra.versao,
    coluna: regra.coluna,
    colunas: [...regra.colunas],
    parametros: JSON.parse(JSON.stringify(regra.parametros)),
  };
}

/**
 * BusinessRulesEvaluator (V1 — Subunidade 3.4B)
 * Motor determinístico de avaliação de Regras Humanas/de Negócio sobre ativos de dados tabulares.
 */
export class BusinessRulesEvaluator {
  /**
   * Avalia todas as regras de qualidade fornecidas contra o arquivo do ativo de dados.
   */
  public static async avaliar(params: ParametrosAvaliacaoRegras): Promise<ResultadoAvaliacaoRegras> {
    if (!params.regras || params.regras.length === 0) {
      return {
        problemas: [],
        totalRegrasAvaliadas: 0,
        totalRegrasVioladas: 0,
      };
    }

    if (params.formato === FormatoArquivo.XLSX) {
      return await this.avaliarXlsx(params);
    }

    return await this.avaliarDelimitado(params);
  }

  // =========================================================================
  // AVALIAÇÃO STREAMING PARA ARQUIVOS DELIMITADOS (CSV / TSV)
  // =========================================================================
  private static async avaliarDelimitado(params: ParametrosAvaliacaoRegras): Promise<ResultadoAvaliacaoRegras> {
    if (!fs.existsSync(params.caminhoArquivo)) {
      throw new Error(`Arquivo não encontrado no caminho: ${params.caminhoArquivo}`);
    }

    const delimitador = params.formato === FormatoArquivo.TSV ? '\t' : this.detectarDelimitador(params.caminhoArquivo);

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
    const mapaIndicesColunas = new Map<string, number>();

    // Inicialização do estado de avaliação de cada regra
    const estadosRegras = params.regras.map((regra) => this.inicializarEstadoRegra(regra, params));

    let totalLinhas = 0;
    const limiteR1 = params.limiteLinhasR1 ?? LIMITE_OPERACIONAL_R1_DEFAULT;

    for await (const record of parser) {
      const row = record as string[];

      // Primeira linha: cabeçalhos
      if (cabecalhos.length === 0) {
        cabecalhos = row.map((h, idx) => {
          let nome = h.trim();
          if (idx === 0 && nome.startsWith('\uFEFF')) {
            nome = nome.substring(1);
          }
          return nome || `coluna_${idx + 1}`;
        });

        cabecalhos.forEach((c, idx) => mapaIndicesColunas.set(c, idx));
        continue;
      }

      totalLinhas++;
      const numeroLinhaFisica = totalLinhas + 1; // 1-indexed, considerando cabeçalho na linha 1

      // Avaliação de cada regra nesta linha
      for (const estado of estadosRegras) {
        this.avaliarLinhaRegra(estado, row, numeroLinhaFisica, mapaIndicesColunas, totalLinhas, limiteR1);
      }
    }

    return this.consolidarProblemasRegras(params, estadosRegras, totalLinhas);
  }

  // =========================================================================
  // AVALIAÇÃO PARA ARQUIVOS XLSX
  // =========================================================================
  private static async avaliarXlsx(params: ParametrosAvaliacaoRegras): Promise<ResultadoAvaliacaoRegras> {
    if (!fs.existsSync(params.caminhoArquivo)) {
      throw new Error(`Arquivo não encontrado no caminho: ${params.caminhoArquivo}`);
    }

    const sheetIdentificador: string | number =
      params.abaAlvoXlsx && params.abaAlvoXlsx.trim() !== '' ? params.abaAlvoXlsx.trim() : 1;

    const rows = await readSheet(params.caminhoArquivo, sheetIdentificador);
    if (!rows || rows.length === 0) {
      return {
        problemas: [],
        totalRegrasAvaliadas: params.regras.length,
        totalRegrasVioladas: 0,
      };
    }

    const cabecalhosRaw = rows[0] ?? [];
    const cabecalhos = cabecalhosRaw.map((h, idx) => {
      const texto = h !== null && h !== undefined ? String(h).trim() : '';
      return texto || `coluna_${idx + 1}`;
    });

    const mapaIndicesColunas = new Map<string, number>();
    cabecalhos.forEach((c, idx) => mapaIndicesColunas.set(c, idx));

    const dataRows = rows.slice(1);
    const totalLinhas = dataRows.length;
    const limiteR1 = params.limiteLinhasR1 ?? LIMITE_OPERACIONAL_R1_DEFAULT;

    const estadosRegras = params.regras.map((regra) => this.inicializarEstadoRegra(regra, params));

    for (let r = 0; r < totalLinhas; r++) {
      const row = dataRows[r];
      const numeroLinhaFisica = r + 2;

      for (const estado of estadosRegras) {
        this.avaliarLinhaRegra(estado, row, numeroLinhaFisica, mapaIndicesColunas, r + 1, limiteR1);
      }
    }

    return this.consolidarProblemasRegras(params, estadosRegras, totalLinhas);
  }

  // =========================================================================
  // CONTROLE DE ESTADO E PROCESSAMENTO DAS REGRAS R1 - R5
  // =========================================================================
  private static inicializarEstadoRegra(regra: RegraQualidade, params: ParametrosAvaliacaoRegras) {
    const dataRefObj = params.dataReferencia ?? new Date();
    const dataRefISO = extrairDataISO(dataRefObj) ?? new Date().toISOString().substring(0, 10);

    return {
      regra,
      linhasAfetadas: 0,
      evidencias: [] as EvidenciaProblemaQualidade[],
      limitadaPorGuardrail: false,
      // Estado R1
      chavesVistas: new Map<string, number>(),
      // Contexto R5
      dataRefISO,
    };
  }

  private static avaliarLinhaRegra(
    estado: ReturnType<typeof BusinessRulesEvaluator.inicializarEstadoRegra>,
    row: unknown[],
    numeroLinhaFisica: number,
    mapaColunas: Map<string, number>,
    linhaSequencial: number,
    limiteR1: number
  ): void {
    const { regra } = estado;

    switch (regra.tipo) {
      case TipoRegraQualidade.CHAVE_UNICA: {
        this.avaliarR1ChaveUnica(estado, row, numeroLinhaFisica, mapaColunas, linhaSequencial, limiteR1);
        break;
      }
      case TipoRegraQualidade.VALOR_MIN_MAX: {
        this.avaliarR2ValorMinMax(estado, row, numeroLinhaFisica, mapaColunas);
        break;
      }
      case TipoRegraQualidade.VALORES_PERMITIDOS: {
        this.avaliarR3ValoresPermitidos(estado, row, numeroLinhaFisica, mapaColunas);
        break;
      }
      case TipoRegraQualidade.OBRIGATORIEDADE: {
        this.avaliarR4Obrigatoriedade(estado, row, numeroLinhaFisica, mapaColunas);
        break;
      }
      case TipoRegraQualidade.REGRA_TEMPORAL: {
        this.avaliarR5RegraTemporal(estado, row, numeroLinhaFisica, mapaColunas);
        break;
      }
    }
  }

  // R1: Chave Única Simples ou Composta
  private static avaliarR1ChaveUnica(
    estado: ReturnType<typeof BusinessRulesEvaluator.inicializarEstadoRegra>,
    row: unknown[],
    numeroLinhaFisica: number,
    mapaColunas: Map<string, number>,
    linhaSequencial: number,
    limiteR1: number
  ): void {
    if (linhaSequencial > limiteR1) {
      estado.limitadaPorGuardrail = true;
      return;
    }

    const params = estado.regra.parametros as ParametrosR1ChaveUnica;
    const colunas = estado.regra.colunas && estado.regra.colunas.length > 0
      ? estado.regra.colunas
      : estado.regra.coluna ? [estado.regra.coluna] : [];

    if (colunas.length === 0) return;

    const valoresChave: unknown[] = [];
    let contemNulo = false;

    for (const col of colunas) {
      const idx = mapaColunas.get(col);
      const val = idx !== undefined && idx < row.length ? row[idx] : null;
      if (val === null || val === undefined || String(val).trim() === '') {
        contemNulo = true;
      }
      valoresChave.push(val);
    }

    if (params.ignorarNulos && contemNulo) {
      return; // Linha ignorada por conter nulo na chave
    }

    // Canonicalização TLV e hash SHA-256 completo de 256 bits
    const chaveCanonica = canonicalizarChaveTLV(valoresChave);
    const hash = crypto.createHash('sha256').update(chaveCanonica).digest('hex');

    if (estado.chavesVistas.has(hash)) {
      estado.linhasAfetadas++;
      const primeiraLinha = estado.chavesVistas.get(hash)!;
      if (estado.evidencias.length < MAX_AMOSTRAS_EVIDENCIA) {
        // Salvaguarda Anti-PII: não expõe os valores das células da chave na evidência
        estado.evidencias.push({
          linhaOriginal: primeiraLinha,
          linhaDuplicada: numeroLinhaFisica,
          coluna: colunas.join(', '),
          detalhe: `Chave idêntica encontrada na linha original ${primeiraLinha}`,
        });
      }
    } else {
      estado.chavesVistas.set(hash, numeroLinhaFisica);
    }
  }

  // R2: Limites Mínimo e Máximo
  private static avaliarR2ValorMinMax(
    estado: ReturnType<typeof BusinessRulesEvaluator.inicializarEstadoRegra>,
    row: unknown[],
    numeroLinhaFisica: number,
    mapaColunas: Map<string, number>
  ): void {
    const col = estado.regra.coluna;
    if (!col) return;

    const idx = mapaColunas.get(col);
    if (idx === undefined || idx >= row.length) return;

    const val = row[idx];
    if (val === null || val === undefined || String(val).trim() === '') return;

    const num = extrairNumero(val);
    if (num === null) return; // Valores não numéricos são tratados pelo scanner de tipos

    const params = estado.regra.parametros as ParametrosR2ValorMinMax;
    let violado = false;
    let motivo = '';

    if (params.minimo !== null && params.minimo !== undefined) {
      const permitirIgualMin = params.permitirIgualMinimo ?? true;
      if (permitirIgualMin ? num < params.minimo : num <= params.minimo) {
        violado = true;
        motivo = `Valor abaixo do mínimo estipulado (${params.minimo})`;
      }
    }

    if (!violado && params.maximo !== null && params.maximo !== undefined) {
      const permitirIgualMax = params.permitirIgualMaximo ?? true;
      if (permitirIgualMax ? num > params.maximo : num >= params.maximo) {
        violado = true;
        motivo = `Valor acima do máximo estipulado (${params.maximo})`;
      }
    }

    if (violado) {
      estado.linhasAfetadas++;
      if (estado.evidencias.length < MAX_AMOSTRAS_EVIDENCIA) {
        // Salvaguarda Anti-PII: registra localização e motivo sem persistir o dado bruto da célula
        estado.evidencias.push({
          numeroLinha: numeroLinhaFisica,
          coluna: col,
          detalhe: motivo,
        });
      }
    }
  }

  // R3: Valores Permitidos
  private static avaliarR3ValoresPermitidos(
    estado: ReturnType<typeof BusinessRulesEvaluator.inicializarEstadoRegra>,
    row: unknown[],
    numeroLinhaFisica: number,
    mapaColunas: Map<string, number>
  ): void {
    const col = estado.regra.coluna;
    if (!col) return;

    const idx = mapaColunas.get(col);
    if (idx === undefined || idx >= row.length) return;

    const val = row[idx];
    if (val === null || val === undefined) return;

    let str = String(val);
    const params = estado.regra.parametros as ParametrosR3ValoresPermitidos;
    const ignorarEspacos = params.ignorarEspacosBordas ?? true;
    const caseSensitive = params.caseSensitive ?? false;

    if (ignorarEspacos) str = str.trim();
    if (str === '') return; // Nulos/vazios avaliados por R4

    const permitidos = params.valoresPermitidos || [];
    let valido = false;

    if (caseSensitive) {
      valido = permitidos.includes(str);
    } else {
      const strLower = str.toLowerCase();
      valido = permitidos.some((p) => (ignorarEspacos ? p.trim() : p).toLowerCase() === strLower);
    }

    if (!valido) {
      estado.linhasAfetadas++;
      if (estado.evidencias.length < MAX_AMOSTRAS_EVIDENCIA) {
        // Salvaguarda Anti-PII: registra detalhe sem expor o valor potencialmente sensível
        estado.evidencias.push({
          numeroLinha: numeroLinhaFisica,
          coluna: col,
          detalhe: 'Valor não pertence ao conjunto de valores permitidos pela regra',
        });
      }
    }
  }

  // R4: Obrigatoriedade
  private static avaliarR4Obrigatoriedade(
    estado: ReturnType<typeof BusinessRulesEvaluator.inicializarEstadoRegra>,
    row: unknown[],
    numeroLinhaFisica: number,
    mapaColunas: Map<string, number>
  ): void {
    const col = estado.regra.coluna;
    if (!col) return;

    const idx = mapaColunas.get(col);
    const val = idx !== undefined && idx < row.length ? row[idx] : null;

    const params = estado.regra.parametros as ParametrosR4Obrigatoriedade;
    const permitirEspacosEmBranco = params.permitirEspacosEmBranco ?? false;

    let ausente = false;
    if (val === null || val === undefined) {
      ausente = true;
    } else {
      const str = String(val);
      if (str === '') {
        ausente = true;
      } else if (!permitirEspacosEmBranco && /^\s+$/.test(str)) {
        ausente = true;
      }
    }

    if (ausente) {
      estado.linhasAfetadas++;
      if (estado.evidencias.length < MAX_AMOSTRAS_EVIDENCIA) {
        estado.evidencias.push({
          numeroLinha: numeroLinhaFisica,
          coluna: col,
          detalhe: 'Campo obrigatório ausente ou preenchido exclusivamente com espaços em branco',
        });
      }
    }
  }

  // R5: Regras Temporais Simples
  private static avaliarR5RegraTemporal(
    estado: ReturnType<typeof BusinessRulesEvaluator.inicializarEstadoRegra>,
    row: unknown[],
    numeroLinhaFisica: number,
    mapaColunas: Map<string, number>
  ): void {
    const col = estado.regra.coluna;
    if (!col) return;

    const idx = mapaColunas.get(col);
    if (idx === undefined || idx >= row.length) return;

    const val = row[idx];
    if (val === null || val === undefined || String(val).trim() === '') return;

    const dataAlvoISO = extrairDataISO(val);
    if (!dataAlvoISO) return; // Datas ilegíveis tratadas no scanner geral

    const params = estado.regra.parametros as ParametrosR5RegraTemporal;
    let dataReferenciaISO: string | null = null;
    let descricaoRef = '';

    if (params.modo === 'COMPARAR_COM_HOJE') {
      dataReferenciaISO = estado.dataRefISO;
      descricaoRef = `HOJE (${dataReferenciaISO})`;
    } else if (params.modo === 'COMPARAR_COM_DATA_FIXA') {
      dataReferenciaISO = params.dataFixa ? extrairDataISO(params.dataFixa) : null;
      descricaoRef = `data fixa (${dataReferenciaISO})`;
    } else if (params.modo === 'COMPARAR_COM_COLUNA') {
      if (!params.colunaComparada) return;
      const idxComp = mapaColunas.get(params.colunaComparada);
      if (idxComp === undefined || idxComp >= row.length) return;
      const valComp = row[idxComp];
      if (valComp === null || valComp === undefined || String(valComp).trim() === '') return;
      dataReferenciaISO = extrairDataISO(valComp);
      descricaoRef = `coluna "${params.colunaComparada}"`;
    }

    if (!dataReferenciaISO) return;

    let conforme = false;
    switch (params.operador) {
      case 'MENOR':
        conforme = dataAlvoISO < dataReferenciaISO;
        break;
      case 'MENOR_OU_IGUAL':
        conforme = dataAlvoISO <= dataReferenciaISO;
        break;
      case 'MAIOR':
        conforme = dataAlvoISO > dataReferenciaISO;
        break;
      case 'MAIOR_OU_IGUAL':
        conforme = dataAlvoISO >= dataReferenciaISO;
        break;
      case 'IGUAL':
        conforme = dataAlvoISO === dataReferenciaISO;
        break;
    }

    if (!conforme) {
      estado.linhasAfetadas++;
      if (estado.evidencias.length < MAX_AMOSTRAS_EVIDENCIA) {
        // Salvaguarda Anti-PII: registra incoerência temporal sem expor dados confidenciais
        estado.evidencias.push({
          numeroLinha: numeroLinhaFisica,
          coluna: col,
          detalhe: `Violação temporal: data deve ser ${params.operador} que ${descricaoRef}`,
        });
      }
    }
  }

  // =========================================================================
  // CONSOLIDAÇÃO DOS RESULTADOS EM PROBLEMAS FORMALIZADOS
  // =========================================================================
  private static consolidarProblemasRegras(
    params: ParametrosAvaliacaoRegras,
    estadosRegras: ReturnType<typeof BusinessRulesEvaluator.inicializarEstadoRegra>[],
    totalLinhas: number
  ): ResultadoAvaliacaoRegras {
    const problemas: ProblemaQualidade[] = [];
    const agora = new Date().toISOString();
    let totalVioladas = 0;

    for (const estado of estadosRegras) {
      const { regra, linhasAfetadas, evidencias, limitadaPorGuardrail } = estado;

      if (limitadaPorGuardrail) {
        // Gera problema específico comunicando suspensão da verificação por guardrail operacional
        problemas.push({
          id: crypto.randomUUID(),
          diagnostico_id: params.diagnosticoId,
          ativo_dados_id: params.ativoDadosId,
          demanda_id: params.demandaId,
          categoria: CategoriaProblemaQualidade.REGRA_NEGOCIO_VIOLADA,
          titulo: `Regra de Chave Única suspensa por guardrail: "${regra.nome}"`,
          descricao: `A verificação da regra foi suspensa após atingir o limite operacional de ${params.limiteLinhasR1 ?? LIMITE_OPERACIONAL_R1_DEFAULT} linhas para proteção do ambiente.`,
          tabela_afetada: params.tabelaNome,
          coluna_afetada: regra.coluna ?? regra.colunas.join(', '),
          total_linhas_afetadas: 0,
          percentual_linhas_afetadas: 0,
          amostra_evidencias: [
            {
              detalhe: `Verificação suspensa por guardrail de proteção operacional (linhas > ${params.limiteLinhasR1 ?? LIMITE_OPERACIONAL_R1_DEFAULT}).`,
            },
          ],
          severidade: SeveridadeProblema.PENDENTE,
          impacto_calculo: 'A integridade da chave única não pôde ser integralmente verificada em memória.',
          acao_deliberada: null,
          justificativa_deliberacao: null,
          deliberado_por_humano: false,
          deliberado_em: null,
          status: StatusProblemaQualidade.ABERTO,
          origem_deteccao: 'AUTOMATICA',
          regra_id: regra.id,
          regra_snapshot: criarSnapshotRegra(regra),
          criado_em: agora,
          atualizado_em: agora,
        });
      }

      if (linhasAfetadas > 0) {
        totalVioladas++;
        const pct = totalLinhas > 0 ? Number(((linhasAfetadas / totalLinhas) * 100).toFixed(2)) : 0;
        const colunaAfetada = regra.coluna ?? (regra.colunas && regra.colunas.length > 0 ? regra.colunas.join(', ') : null);

        problemas.push({
          id: crypto.randomUUID(),
          diagnostico_id: params.diagnosticoId,
          ativo_dados_id: params.ativoDadosId,
          demanda_id: params.demandaId,
          categoria: CategoriaProblemaQualidade.REGRA_NEGOCIO_VIOLADA,
          titulo: `Violação da Regra: "${regra.nome}"`,
          descricao: `A regra "${regra.nome}" foi violada em ${linhasAfetadas} registros (${pct}% das linhas avaliadas).`,
          tabela_afetada: params.tabelaNome,
          coluna_afetada: colunaAfetada,
          total_linhas_afetadas: linhasAfetadas,
          percentual_linhas_afetadas: pct,
          amostra_evidencias: evidencias,
          severidade: SeveridadeProblema.PENDENTE, // Toda violação nasce invariavelmente com severidade PENDENTE
          impacto_calculo: 'Violação de expectativa de negócio declarada pelo analista humano.',
          acao_deliberada: null,
          justificativa_deliberacao: null,
          deliberado_por_humano: false,
          deliberado_em: null,
          status: StatusProblemaQualidade.ABERTO,
          origem_deteccao: 'AUTOMATICA',
          regra_id: regra.id,
          regra_snapshot: criarSnapshotRegra(regra),
          criado_em: agora,
          atualizado_em: agora,
        });
      }
    }

    return {
      problemas,
      totalRegrasAvaliadas: params.regras.length,
      totalRegrasVioladas: totalVioladas,
    };
  }

  private static detectarDelimitador(caminhoArquivo: string): string {
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
