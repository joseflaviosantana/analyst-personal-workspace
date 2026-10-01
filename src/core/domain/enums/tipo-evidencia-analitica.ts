/**
 * src/core/domain/enums/tipo-evidencia-analitica.ts
 *
 * Classificação canônica do tipo de evidência analítica no Analyst Personal Workspace.
 * Projetado para ser extensível sem alterar o núcleo do Evidence Core.
 */

export const TipoEvidenciaAnalitica = {
  REQUISITOS: 'REQUISITOS',
  DADOS: 'DADOS',
  QUALIDADE: 'QUALIDADE',
  PREPARACAO: 'PREPARACAO',
  MODELAGEM: 'MODELAGEM',
  DAX: 'DAX',
  DASHBOARD: 'DASHBOARD',
  VALIDACAO: 'VALIDACAO',
  ENTREGA: 'ENTREGA',
  REVISAO: 'REVISAO',
} as const;

export type TipoEvidenciaAnalitica =
  (typeof TipoEvidenciaAnalitica)[keyof typeof TipoEvidenciaAnalitica];

export const ROTULOS_TIPO_EVIDENCIA: Record<TipoEvidenciaAnalitica, string> = {
  [TipoEvidenciaAnalitica.REQUISITOS]: 'Requisitos & Clarificação',
  [TipoEvidenciaAnalitica.DADOS]: 'Ativos de Dados & Ingestão',
  [TipoEvidenciaAnalitica.QUALIDADE]: 'Diagnóstico de Qualidade',
  [TipoEvidenciaAnalitica.PREPARACAO]: 'Preparação & Transformação',
  [TipoEvidenciaAnalitica.MODELAGEM]: 'Modelagem Dimensional',
  [TipoEvidenciaAnalitica.DAX]: 'Cálculo & Medida DAX',
  [TipoEvidenciaAnalitica.DASHBOARD]: 'Design & Dashboard',
  [TipoEvidenciaAnalitica.VALIDACAO]: 'Validação & Conciliação',
  [TipoEvidenciaAnalitica.ENTREGA]: 'Pacote de Entrega',
  [TipoEvidenciaAnalitica.REVISAO]: 'Supervisão & Homologação',
};
