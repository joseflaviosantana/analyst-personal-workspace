import { StatusRegraQualidade } from '../enums/status-regra-qualidade';
import { TipoRegraQualidade } from '../enums/tipo-regra-qualidade';

/**
 * Parâmetros de R1 — Chave Única Simples ou Composta
 */
export interface ParametrosR1ChaveUnica {
  colunas: string[];
  ignorarNulos?: boolean; // Se true, linhas onde qualquer coluna da chave for nula são desconsideradas
}

/**
 * Parâmetros de R2 — Limites Mínimo e Máximo Numérico
 * - permitirIgualMinimo: true -> limite inclusivo (>= min, padrão); false -> limite exclusivo (> min)
 * - permitirIgualMaximo: true -> limite inclusivo (<= max, padrão); false -> limite exclusivo (< max)
 */
export interface ParametrosR2ValorMinMax {
  minimo?: number | null;
  maximo?: number | null;
  permitirIgualMinimo?: boolean; // default: true (limite inclusivo)
  permitirIgualMaximo?: boolean; // default: true (limite inclusivo)
}

/**
 * Parâmetros de R3 — Valores Permitidos (Domínio Fechado / Categorias)
 */
export interface ParametrosR3ValoresPermitidos {
  valoresPermitidos: string[];
  caseSensitive?: boolean; // default: false
  ignorarEspacosBordas?: boolean; // default: true (trim)
}

/**
 * Parâmetros de R4 — Obrigatoriedade de Preenchimento
 */
export interface ParametrosR4Obrigatoriedade {
  permitirEspacosEmBranco?: boolean; // default: false (espaços puros contam como ausente)
}

/**
 * Operadores para Regras Temporais
 */
export type OperadorTemporal = 'MENOR' | 'MENOR_OU_IGUAL' | 'MAIOR' | 'MAIOR_OU_IGUAL' | 'IGUAL';

/**
 * Parâmetros de R5 — Regras Temporais Simples
 */
export interface ParametrosR5RegraTemporal {
  modo: 'COMPARAR_COM_HOJE' | 'COMPARAR_COM_DATA_FIXA' | 'COMPARAR_COM_COLUNA';
  operador: OperadorTemporal;
  dataFixa?: string; // Formato YYYY-MM-DD
  colunaComparada?: string; // Nome da segunda coluna de data
}

/**
 * União discriminada dos parâmetros tipados de cada regra
 */
export type ParametrosRegraQualidade =
  | ({ tipo: TipoRegraQualidade.CHAVE_UNICA } & ParametrosR1ChaveUnica)
  | ({ tipo: TipoRegraQualidade.VALOR_MIN_MAX } & ParametrosR2ValorMinMax)
  | ({ tipo: TipoRegraQualidade.VALORES_PERMITIDOS } & ParametrosR3ValoresPermitidos)
  | ({ tipo: TipoRegraQualidade.OBRIGATORIEDADE } & ParametrosR4Obrigatoriedade)
  | ({ tipo: TipoRegraQualidade.REGRA_TEMPORAL } & ParametrosR5RegraTemporal);

/**
 * Snapshot Imutável da Regra anexado a cada Problema de Qualidade gerado por regra.
 * Garante auditabilidade histórica: se a regra for editada posteriormente, o diagnóstico
 * histórico preserva exatamente a regra como ela era no momento da avaliação.
 */
export interface RegraSnapshot {
  id: string;
  nome: string;
  tipo: TipoRegraQualidade;
  versao: number;
  coluna: string | null;
  colunas: string[];
  parametros: ParametrosRegraQualidade;
}

/**
 * RegraQualidade (V1 — Subunidade 3.4B / FSD RF-018 e v1-domain-model.md)
 * Regra declarada pelo analista humano para avaliação determinística sobre um ativo de dados.
 *
 * Modelo normativo homologado:
 * RegraQualidade -> AtivoDados -> Demanda
 * A demanda de uma regra é derivada por essa relação referencial, sem redundância física de demanda_id.
 */
export interface RegraQualidade {
  id: string;
  ativo_dados_id: string;
  tipo: TipoRegraQualidade;
  coluna: string | null; // Nulo quando a regra for sobre múltiplas colunas (ex: R1 composta)
  colunas: string[]; // Lista de colunas envolvidas
  nome: string;
  descricao: string | null;
  parametros: ParametrosRegraQualidade;
  status: StatusRegraQualidade;
  versao: number;
  criado_em: string;
  atualizado_em: string;
}

/**
 * Determina se uma alteração proposta entre uma regra existente e novos dados
 * constitui uma alteração semântica/comportamental (que exige incremento de versão)
 * ou se é exclusivamente descritiva (que preserva a versão atual).
 */
export function isAlteracaoSemantica(
  regraAtual: RegraQualidade,
  proposta: {
    tipo?: TipoRegraQualidade;
    coluna?: string | null;
    colunas?: string[];
    parametros?: ParametrosRegraQualidade;
  }
): boolean {
  if (proposta.tipo && proposta.tipo !== regraAtual.tipo) {
    return true;
  }
  if (proposta.coluna !== undefined && proposta.coluna !== regraAtual.coluna) {
    return true;
  }
  if (proposta.colunas !== undefined) {
    const colunasAtuais = [...regraAtual.colunas].sort().join(',');
    const novasColunas = [...proposta.colunas].sort().join(',');
    if (colunasAtuais !== novasColunas) {
      return true;
    }
  }
  if (proposta.parametros !== undefined) {
    const paramsAtuais = JSON.stringify(regraAtual.parametros);
    const novosParams = JSON.stringify(proposta.parametros);
    if (paramsAtuais !== novosParams) {
      return true;
    }
  }
  return false;
}
