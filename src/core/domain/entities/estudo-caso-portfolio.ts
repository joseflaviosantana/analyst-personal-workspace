/**
 * src/core/domain/entities/estudo-caso-portfolio.ts
 *
 * Entidade de domínio do Estudo de Caso Profissional para Portfólio (Subgate 3.9 — Aba 11).
 */

import { StatusEstudoCaso } from '../enums/status-estudo-caso';
import { TecnicaSanitizacao } from '../enums/tecnica-sanitizacao';

export interface ChecklistSanitizacao {
  nomesClientesOcultados: boolean;
  dadosPessoaisOcultados: boolean;
  dadosFinanceirosSigilososTratados: boolean;
  metricasFatuaisPreservadas: boolean;
  declaracaoHumanaAssinada: boolean;
}

export interface MetricaFatoCase {
  rotulo: string;
  expressaoSanitizada: string;
  impactoOuConclusao: string;
}

export interface EstudoCasoPortfolio {
  id: string;
  demanda_id: string;
  projeto_id: string | null;
  titulo: string;
  problema_negocio: string;
  processo_preparacao: string;
  modelagem_decisoes: string;
  validacao_resultados: string;
  competencias_demonstradas: string[];
  ferramentas_utilizadas: string[];
  metricas_fatos: MetricaFatoCase[];
  tecnicas_sanitizacao: TecnicaSanitizacao[];
  checklist_sanitizacao: ChecklistSanitizacao;
  status: StatusEstudoCaso;
  homologado_em: string | null;
  homologado_por: string | null;
  versao: number;
  criado_em: string;
  atualizado_em: string;
}

/**
 * Avalia se o checklist de sanitização atende a todos os critérios obrigatórios para APROV-10.
 */
export function isChecklistSanitizacaoCompleto(checklist: ChecklistSanitizacao): boolean {
  return (
    checklist.nomesClientesOcultados &&
    checklist.dadosPessoaisOcultados &&
    checklist.dadosFinanceirosSigilososTratados &&
    checklist.metricasFatuaisPreservadas &&
    checklist.declaracaoHumanaAssinada
  );
}

/**
 * Cria um checklist de sanitização inicial vazio / padrão.
 */
export function criarChecklistSanitizacaoPadrao(): ChecklistSanitizacao {
  return {
    nomesClientesOcultados: false,
    dadosPessoaisOcultados: false,
    dadosFinanceirosSigilososTratados: false,
    metricasFatuaisPreservadas: false,
    declaracaoHumanaAssinada: false,
  };
}
