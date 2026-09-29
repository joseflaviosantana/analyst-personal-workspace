import { CamadaValidacao } from '../enums/camada-validacao';
import { ResultadoValidacao } from '../enums/resultado-validacao';

/**
 * Entidade de Validação e Conciliação Numérica (V1 — Subunidade 3.7A / FSD CF-16 e v1-domain-model.md 3.16)
 * Representa um teste, conciliação ou check formal de integridade executado sobre o projeto.
 */
export interface ValidacaoConciliacao {
  id: string; // Prefixo: val_...
  demanda_id: string;
  modelo_id?: string | null;
  metrica_id?: string | null;
  titulo: string;
  camada: CamadaValidacao;
  metodo_verificacao: string;
  base_referencia?: string | null;
  valor_esperado?: number | null;
  valor_obtido?: number | null;
  divergencia_absoluta?: number | null;
  divergencia_percentual?: number | null;
  tolerancia_permitida: number; // Padrão: 0 (tolerância zero)
  unidade_medida?: string | null;
  resultado: ResultadoValidacao;
  obrigatoria: boolean; // Se true, bloqueia avanço para PRONTA_PARA_ENTREGA enquanto não for APROVADO
  acao_corretiva?: string | null;
  notas_evidencia?: string | null;
  executado_por?: string | null;
  executado_em?: string | null; // ISO 8601 UTC
  criado_em: string;
  atualizado_em: string;
}
