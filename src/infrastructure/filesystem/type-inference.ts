import { ColunaInspecionada } from '../../core/domain/adapters/file-system-adapter.interface';

/**
 * Expressões regulares para detecção preliminar de tipos primitivos em amostras textuais.
 */
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;
const BR_DATE_REGEX = /^\d{1,2}\/\d{1,2}\/\d{4}(?: \d{2}:\d{2}(?::\d{2})?)?$/;
const DASH_DATE_REGEX = /^\d{1,2}-\d{1,2}-\d{4}(?: \d{2}:\d{2}(?::\d{2})?)?$/;

/**
 * Verifica se um valor individual representa um booleano.
 */
function isBooleanValue(val: unknown): boolean {
  if (typeof val === 'boolean') return true;
  if (typeof val === 'string') {
    const lower = val.trim().toLowerCase();
    return ['true', 'false', 'sim', 'nao', 'não', 's', 'n'].includes(lower);
  }
  return false;
}

/**
 * Verifica se um valor individual representa um número (inteiro ou decimal com . ou ,).
 */
function isNumberValue(val: unknown): boolean {
  if (typeof val === 'number') return !Number.isNaN(val);
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed === '') return false;
    // Evita falsos positivos com datas ou strings que começam com números
    if (ISO_DATE_REGEX.test(trimmed) || BR_DATE_REGEX.test(trimmed) || DASH_DATE_REGEX.test(trimmed)) {
      return false;
    }
    // Suporta formato brasileiro (ex: 1.234,56 ou 123,45) e formato padrão (1234.56 ou 123.45)
    let normalized = trimmed;
    if (/^-?\d{1,3}(?:\.\d{3})*,\d+$/.test(trimmed)) {
      normalized = trimmed.replace(/\./g, '').replace(',', '.');
    } else if (/^-?\d+,\d+$/.test(trimmed)) {
      normalized = trimmed.replace(',', '.');
    }
    const num = Number(normalized);
    return !Number.isNaN(num) && /^-?\d+(\.\d+)?$/.test(normalized);
  }
  return false;
}

/**
 * Verifica se um valor individual representa uma data válida.
 */
function isDateValue(val: unknown): boolean {
  if (val instanceof Date) {
    return !Number.isNaN(val.getTime());
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed === '') return false;

    if (ISO_DATE_REGEX.test(trimmed)) {
      const parsed = Date.parse(trimmed);
      return !Number.isNaN(parsed);
    }

    if (BR_DATE_REGEX.test(trimmed)) {
      const [datePart] = trimmed.split(' ');
      const [dia, mes, ano] = datePart.split('/').map(Number);
      if (mes >= 1 && mes <= 12 && dia >= 1 && dia <= 31 && ano >= 1900 && ano <= 2100) {
        const d = new Date(ano, mes - 1, dia);
        return d.getFullYear() === ano && d.getMonth() === mes - 1 && d.getDate() === dia;
      }
      return false;
    }

    if (DASH_DATE_REGEX.test(trimmed)) {
      const [datePart] = trimmed.split(' ');
      const [dia, mes, ano] = datePart.split('-').map(Number);
      if (mes >= 1 && mes <= 12 && dia >= 1 && dia <= 31 && ano >= 1900 && ano <= 2100) {
        const d = new Date(ano, mes - 1, dia);
        return d.getFullYear() === ano && d.getMonth() === mes - 1 && d.getDate() === dia;
      }
      return false;
    }
  }
  return false;
}

/**
 * Infere os tipos de dados para uma lista de colunas com base nas primeiras N linhas de amostra.
 * Retorna as colunas com tipos inferidos e o mapa schemaInferido correspondente.
 */
export function inferirTiposColunas(
  cabecalhos: string[],
  linhasAmostra: Array<Record<string, unknown>>
): {
  colunas: ColunaInspecionada[];
  schemaInferido: Record<string, string>;
} {
  const colunas: ColunaInspecionada[] = [];
  const schemaInferido: Record<string, string> = {};

  for (let i = 0; i < cabecalhos.length; i++) {
    const nome = cabecalhos[i];
    const valoresNaoNulos: unknown[] = [];

    for (const linha of linhasAmostra) {
      const val = linha[nome];
      if (val !== null && val !== undefined && val !== '') {
        valoresNaoNulos.push(val);
      }
    }

    let tipo = 'string';

    if (valoresNaoNulos.length > 0) {
      if (valoresNaoNulos.every(isBooleanValue)) {
        tipo = 'boolean';
      } else if (valoresNaoNulos.every(isNumberValue)) {
        tipo = 'number';
      } else if (valoresNaoNulos.every(isDateValue)) {
        tipo = 'date';
      } else {
        tipo = 'string';
      }
    }

    colunas.push({
      nome,
      indice: i,
      tipoInferido: tipo,
    });
    schemaInferido[nome] = tipo;
  }

  return { colunas, schemaInferido };
}
