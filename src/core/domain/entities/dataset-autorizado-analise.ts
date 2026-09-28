import { StatusAutorizacaoDataset } from '../enums/status-autorizacao-dataset';

/**
 * DatasetAutorizadoAnalise (V1 — Subunidade 3.5A / Domínio de Preparação)
 * Contrato formal e atestado persistente de homologação do conjunto de dados
 * liberado para alimentar a Fase de Modelagem e Análise.
 */
export interface DatasetAutorizadoAnalise {
  id: string;
  demanda_id: string;
  ativo_dados_id: string;
  diagnostico_qualidade_id: string; // Diagnóstico formal que certificou o dataset
  receita_preparacao_id: string | null; // Nulo se o ativo autorizado for o bruto original
  versao_rotulo: string; // ex: "1.0-bruto", "2.0-preparado"
  hash_sha256_snapshot: string;
  status: StatusAutorizacaoDataset; // VIGENTE | REVOGADO | SUBSTITUIDO
  justificativa_autorizacao: string; // Mínimo 15 caracteres
  autorizado_por_tipo: 'HUMANO';
  restricoes_aceitas_snapshot: string; // JSON de anomalias formalmente aceitas como restrição
  autorizado_em: string;
  revogado_em: string | null;
  motivo_revogacao: string | null;
}
