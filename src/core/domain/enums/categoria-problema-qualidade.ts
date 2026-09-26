/**
 * CategoriaProblemaQualidade (V1 — FSD RF-018 e v1-domain-model.md Seção 3.7)
 * Categorização formal e tipada das anomalias e verificações estruturais de qualidade de dados.
 */
export enum CategoriaProblemaQualidade {
  NULOS_BRANCOS = 'NULOS_BRANCOS',
  COLUNAS_VAZIAS = 'COLUNAS_VAZIAS',
  DUPLICIDADES_LINHA = 'DUPLICIDADES_LINHA',
  TIPOS_INCONSISTENTES = 'TIPOS_INCONSISTENTES',
  DATAS_INVALIDAS = 'DATAS_INVALIDAS',
  NUMEROS_INVALIDOS = 'NUMEROS_INVALIDOS',
  CABECALHOS_PROBLEMATICOS = 'CABECALHOS_PROBLEMATICOS',
  REGRA_NEGOCIO_VIOLADA = 'REGRA_NEGOCIO_VIOLADA',
  ANOMALIA_MANUAL_DECLARADA = 'ANOMALIA_MANUAL_DECLARADA',
}

export const ROTULOS_CATEGORIA_PROBLEMA_QUALIDADE: Record<CategoriaProblemaQualidade, string> = {
  [CategoriaProblemaQualidade.NULOS_BRANCOS]: 'Valores Nulos e Brancos',
  [CategoriaProblemaQualidade.COLUNAS_VAZIAS]: 'Colunas 100% Vazias',
  [CategoriaProblemaQualidade.DUPLICIDADES_LINHA]: 'Linhas Inteiras Duplicadas',
  [CategoriaProblemaQualidade.TIPOS_INCONSISTENTES]: 'Tipos Inconsistentes com Schema',
  [CategoriaProblemaQualidade.DATAS_INVALIDAS]: 'Datas Inválidas ou Corrompidas',
  [CategoriaProblemaQualidade.NUMEROS_INVALIDOS]: 'Números Inválidos ou NaN',
  [CategoriaProblemaQualidade.CABECALHOS_PROBLEMATICOS]: 'Cabeçalhos Problemáticos',
  [CategoriaProblemaQualidade.REGRA_NEGOCIO_VIOLADA]: 'Violação de Regra de Negócio',
  [CategoriaProblemaQualidade.ANOMALIA_MANUAL_DECLARADA]: 'Anomalia Registrada Manualmente',
};
