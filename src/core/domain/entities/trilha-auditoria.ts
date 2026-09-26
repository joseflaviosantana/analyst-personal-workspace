/**
 * Entidade de Trilha de Auditoria (ADR-002 Seção 4.5 e 10.1)
 * Registra mutações críticas e transições de estado do workflow para auditabilidade integral.
 */

export type TipoEventoAuditoria = 
  | 'CRIACAO' 
  | 'TRANSICAO_ESTADO' 
  | 'DECISAO_HUMANA' 
  | 'SUGESTAO_IA' 
  | 'RECONCILIACAO';

export type AutorTipoAuditoria = 'HUMANO' | 'IA';

export interface TrilhaAuditoria {
  id: string;
  demanda_id: string | null;
  entidade: string;
  entidade_id: string;
  tipo_evento: TipoEventoAuditoria;
  autor_tipo: AutorTipoAuditoria;
  dados_anteriores: string | null;
  dados_novos: string | null;
  justificativa: string | null;
  timestamp: string; // ISO 8601 UTC
}
