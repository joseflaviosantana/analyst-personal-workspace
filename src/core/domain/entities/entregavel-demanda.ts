import { TipoEntregavel } from '../enums/tipo-entregavel';
import { StatusEntregavel } from '../enums/status-entregavel';
import { StatusAceiteEntrega } from '../enums/status-aceite-entrega';

/**
 * Entidade de Entregável Profissional (V1 — Subunidade 3.7A / FSD CF-17 e v1-domain-model.md 3.18)
 * Representa um artefato de entrega e sua formalização de aceite pelo cliente/analista.
 */
export interface EntregavelDemanda {
  id: string; // Prefixo: ent_...
  demanda_id: string;
  titulo: string;
  tipo: TipoEntregavel;
  versao: string;
  caminho_arquivo_ou_link: string;
  descricao_sumario?: string | null;
  obrigatorio: boolean; // Se true, sua ausência ou falta de aceite bloqueia conclusão
  status: StatusEntregavel;
  aceite_status: StatusAceiteEntrega;
  aceite_justificativa?: string | null;
  aceite_por?: string | null;
  aceite_em?: string | null; // ISO 8601 UTC
  criado_em: string;
  atualizado_em: string;
}
