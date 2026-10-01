import { StatusPerguntaClarificacao } from '../enums/status-pergunta-clarificacao';

/**
 * Entidade de Pergunta de Clarificação ao Contratante (V1 — v1-domain-model.md 3.5 e CF-05)
 * Registra dúvidas, questionamentos, respostas e impactos no escopo sem comunicação autônoma.
 */
export interface PerguntaClarificacao {
  id: string; // Prefixo: perg_...
  demanda_id: string;
  requisito_id: string | null;
  pergunta: string;
  motivacao: string | null;
  bloqueante: boolean;
  status: StatusPerguntaClarificacao;
  enviada_em: string | null;
  resposta: string | null;
  respondido_por: string | null;
  respondida_em: string | null;
  impacto_decisao: string | null;
  criado_em: string;
  atualizado_em: string;
}
