/**
 * CapacidadeFerramenta (V1 — Subunidade 3.5A / Domínio de Preparação)
 * Classificação por competência técnica/capacidade computacional de execução,
 * mantendo o domínio agnóstico de marcas e fornecedores.
 */
export enum CapacidadeFerramenta {
  PLANILHA = 'PLANILHA',
  MOTOR_M_POWER_QUERY = 'MOTOR_M_POWER_QUERY',
  MOTOR_SQL = 'MOTOR_SQL',
  SCRIPT_NOTEBOOK = 'SCRIPT_NOTEBOOK',
  FRAMEWORK_TRANSFORMACAO = 'FRAMEWORK_TRANSFORMACAO',
  PLATAFORMA_LAKEHOUSE = 'PLATAFORMA_LAKEHOUSE',
  MANUAL_DOCUMENTADO = 'MANUAL_DOCUMENTADO',
  OUTRO = 'OUTRO',
}

export const ROTULOS_CAPACIDADE_FERRAMENTA: Record<CapacidadeFerramenta, string> = {
  [CapacidadeFerramenta.PLANILHA]: 'Planilha Eletrônica (Excel / Calc)',
  [CapacidadeFerramenta.MOTOR_M_POWER_QUERY]: 'Motor Power Query / M',
  [CapacidadeFerramenta.MOTOR_SQL]: 'Motor de Banco de Dados / SQL',
  [CapacidadeFerramenta.SCRIPT_NOTEBOOK]: 'Script / Notebook (Python, R)',
  [CapacidadeFerramenta.FRAMEWORK_TRANSFORMACAO]: 'Framework de Transformação (dbt, Dataform)',
  [CapacidadeFerramenta.PLATAFORMA_LAKEHOUSE]: 'Plataforma Lakehouse (Fabric, Databricks)',
  [CapacidadeFerramenta.MANUAL_DOCUMENTADO]: 'Intervenção Manual Documentada',
  [CapacidadeFerramenta.OUTRO]: 'Outra Capacidade',
};
