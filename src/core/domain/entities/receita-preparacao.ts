import { StatusReceitaPreparacao } from '../enums/status-receita-preparacao';

/**
 * ReceitaPreparacao (V1 — Subunidade 3.5A / Domínio de Preparação)
 * Representa o plano e o registro formal de transformações aplicadas a dados de uma demanda.
 */
export interface ReceitaPreparacao {
  id: string;
  demanda_id: string;
  titulo: string;
  descricao: string | null;
  status: StatusReceitaPreparacao;
  versao: number;
  criado_em: string;
  atualizado_em: string;
}
