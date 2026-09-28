import { CapacidadeFerramenta } from '../enums/capacidade-ferramenta';
import { StatusEtapaTransformacao } from '../enums/status-etapa-transformacao';
import { TipoOperacaoPreparacao } from '../enums/tipo-operacao-preparacao';

/**
 * EtapaTransformacao (V1 — Subunidade 3.5A / Domínio de Preparação)
 * Representa uma operação individual de tratamento pertencente a uma receita.
 */
export interface EtapaTransformacao {
  id: string;
  receita_id: string;
  ordem: number;
  tipo_operacao: TipoOperacaoPreparacao;
  capacidade_ferramenta: CapacidadeFerramenta;
  ferramenta_nome: string; // ex: "Power Query M", "DuckDB", "dbt-core", "Pandas"
  ferramenta_versao: string | null; // ex: "3.11", "v1.8.0", "Desktop 2026.02"
  descricao: string;
  especificacao_tecnica: string | null; // Script M, query SQL, código Python ou fórmula aplicada
  status: StatusEtapaTransformacao;
  justificativa: string | null;
  criado_em: string;
  atualizado_em: string;
}
