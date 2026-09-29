/**
 * Camadas de Validação Analítica (V1 — FSD CF-16 e v1-domain-model.md Seção 3.16)
 * Categoriza as diferentes dimensões de verificação de integridade da entrega.
 */
export enum CamadaValidacao {
  DADOS_BRUTOS_VS_CARREGADOS = 'DADOS_BRUTOS_VS_CARREGADOS',
  TRANSFORMACOES_POWER_QUERY = 'TRANSFORMACOES_POWER_QUERY',
  CALCULOS_E_DAX = 'CALCULOS_E_DAX',
  CONCILIACAO_CRUZADA_KPI = 'CONCILIACAO_CRUZADA_KPI',
  VISUAL_E_USABILIDADE = 'VISUAL_E_USABILIDADE',
  ATENDIMENTO_REQUISITOS = 'ATENDIMENTO_REQUISITOS',
}

export const ROTULOS_CAMADA_VALIDACAO: Record<CamadaValidacao, string> = {
  [CamadaValidacao.DADOS_BRUTOS_VS_CARREGADOS]: 'Dados Brutos vs. Carregados',
  [CamadaValidacao.TRANSFORMACOES_POWER_QUERY]: 'Transformações (Power Query)',
  [CamadaValidacao.CALCULOS_E_DAX]: 'Cálculos & Medidas DAX',
  [CamadaValidacao.CONCILIACAO_CRUZADA_KPI]: 'Conciliação Cruzada de KPIs',
  [CamadaValidacao.VISUAL_E_USABILIDADE]: 'Visual & Usabilidade',
  [CamadaValidacao.ATENDIMENTO_REQUISITOS]: 'Atendimento aos Requisitos',
};
