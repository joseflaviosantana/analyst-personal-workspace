/**
 * Tipos de Entregáveis Profissionais (V1 — FSD CF-17 e v1-domain-model.md Seção 3.18)
 * Identifica a natureza técnica do artefato preparado para a entrega.
 */
export enum TipoEntregavel {
  DASHBOARD_POWERBI = 'DASHBOARD_POWERBI',
  RELATORIO_PDF = 'RELATORIO_PDF',
  PLANILHA_CONSOLIDADA = 'PLANILHA_CONSOLIDADA',
  DATASET_TRATADO = 'DATASET_TRATADO',
  DOCUMENTO_TECNICO = 'DOCUMENTO_TECNICO',
  APRESENTACAO_EXECUTIVA = 'APRESENTACAO_EXECUTIVA',
  OUTRO = 'OUTRO',
}

export const ROTULOS_TIPO_ENTREGAVEL: Record<TipoEntregavel, string> = {
  [TipoEntregavel.DASHBOARD_POWERBI]: 'Dashboard Power BI (.pbix / Link)',
  [TipoEntregavel.RELATORIO_PDF]: 'Relatório Executivo (.pdf)',
  [TipoEntregavel.PLANILHA_CONSOLIDADA]: 'Planilha Consolidada (.xlsx)',
  [TipoEntregavel.DATASET_TRATADO]: 'Dataset Tratado Final (.csv / .parquet)',
  [TipoEntregavel.DOCUMENTO_TECNICO]: 'Documentação Técnica / Dicionário',
  [TipoEntregavel.APRESENTACAO_EXECUTIVA]: 'Apresentação Executiva',
  [TipoEntregavel.OUTRO]: 'Outro Artefato',
};
