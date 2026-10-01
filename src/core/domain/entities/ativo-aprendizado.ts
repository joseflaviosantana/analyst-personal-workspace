/**
 * src/core/domain/entities/ativo-aprendizado.ts
 *
 * Entidade de domínio de Ativos de Aprendizado e Memória Operacional (Subgate 3.9 — Aba 11).
 */

import { CategoriaAtivoAprendizado } from '../enums/categoria-ativo-aprendizado';

export interface AtivoAprendizado {
  id: string;
  demanda_id: string | null;
  titulo: string;
  categoria: CategoriaAtivoAprendizado;
  descricao: string | null;
  procedimento_padrao: string;
  contexto_aplicacao: string | null;
  tags: string[];
  criado_em: string;
  atualizado_em: string;
}
