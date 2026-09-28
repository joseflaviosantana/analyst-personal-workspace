/**
 * TipoOperacaoPreparacao (V1 — Subunidade 3.5A / Domínio de Preparação)
 * Catálogo canônico e tipado de transformações e tratamentos de dados suportados.
 */
export enum TipoOperacaoPreparacao {
  REMOVER_DUPLICIDADES = 'REMOVER_DUPLICIDADES',
  TRATAR_NULOS = 'TRATAR_NULOS',
  CONVERTER_TIPO = 'CONVERTER_TIPO',
  PADRONIZAR_TEXTO = 'PADRONIZAR_TEXTO',
  NORMALIZAR_DATAS = 'NORMALIZAR_DATAS',
  FILTRAR_REGISTROS = 'FILTRAR_REGISTROS',
  CRIAR_COLUNA_DERIVADA = 'CRIAR_COLUNA_DERIVADA',
  TRATAR_OUTLIERS = 'TRATAR_OUTLIERS',
  JOIN_MERGE = 'JOIN_MERGE',
  UNION_CONCATENACAO = 'UNION_CONCATENACAO',
  AGREGACAO_RESUMO = 'AGREGACAO_RESUMO',
  REGRA_NEGOCIO_CUSTOM = 'REGRA_NEGOCIO_CUSTOM',
  OUTRA = 'OUTRA',
}

export const ROTULOS_TIPO_OPERACAO_PREPARACAO: Record<TipoOperacaoPreparacao, string> = {
  [TipoOperacaoPreparacao.REMOVER_DUPLICIDADES]: 'Remoção de Duplicidades',
  [TipoOperacaoPreparacao.TRATAR_NULOS]: 'Tratamento de Nulos / Ausentes',
  [TipoOperacaoPreparacao.CONVERTER_TIPO]: 'Conversão / Correção de Tipo',
  [TipoOperacaoPreparacao.PADRONIZAR_TEXTO]: 'Padronização Textual (Trim/Case)',
  [TipoOperacaoPreparacao.NORMALIZAR_DATAS]: 'Normalização / Parsing de Datas',
  [TipoOperacaoPreparacao.FILTRAR_REGISTROS]: 'Filtragem / Seleção de Escopo',
  [TipoOperacaoPreparacao.CRIAR_COLUNA_DERIVADA]: 'Criação de Coluna Derivada / Cálculo',
  [TipoOperacaoPreparacao.TRATAR_OUTLIERS]: 'Tratamento de Outliers / Extremos',
  [TipoOperacaoPreparacao.JOIN_MERGE]: 'Junção / Cruzamento de Tabelas (Join/Merge)',
  [TipoOperacaoPreparacao.UNION_CONCATENACAO]: 'União / Concatenação de Linhas (Union)',
  [TipoOperacaoPreparacao.AGREGACAO_RESUMO]: 'Agregação / Resumo Numérico (Group By)',
  [TipoOperacaoPreparacao.REGRA_NEGOCIO_CUSTOM]: 'Regra de Negócio Específica',
  [TipoOperacaoPreparacao.OUTRA]: 'Outra Operação de Transformação',
};
