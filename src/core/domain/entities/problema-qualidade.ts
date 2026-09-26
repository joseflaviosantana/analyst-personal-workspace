import { CategoriaProblemaQualidade } from '../enums/categoria-problema-qualidade';
import { SeveridadeProblema } from '../enums/severidade-problema';
import { StatusProblemaQualidade } from '../enums/status-problema-qualidade';
import { RegraSnapshot } from './regra-qualidade';

/**
 * EvidenciaProblemaQualidade (V1 — Subunidades 3.4A e 3.4B)
 * Representação mínima, precisa e despersonalizada de uma ocorrência factual da anomalia.
 * Salvaguarda de Privacidade Anti-PII:
 * - Na 3.4A: Registra exclusivamente a localização física e valor resumido/mascarado.
 * - Na 3.4B: Nenhuma persistência de valores brutos das células nas evidências das regras.
 *   Registra exclusivamente número de linha, indicação estruturada da violação e detalhes sem expor PII.
 */
export interface EvidenciaProblemaQualidade {
  numeroLinha?: number;
  coluna?: string;
  valorObservado?: string;
  detalhe: string;
  linhaOriginal?: number; // Utilizado para indicar a primeira ocorrência em duplicidades
  linhaDuplicada?: number; // Utilizado para indicar a ocorrência duplicada
}

/**
 * ProblemaQualidade (V1 — v1-domain-model.md Seção 3.7 e FSD CF-07 / RF-018 a RF-022)
 * Registro formal e estruturado de uma anomalia ou inconsistência encontrada em um ativo de dados.
 * Suporta problemas automáticos do scanner (3.4A), violações de regras humanas (3.4B) e problemas manuais (3.4B).
 */
export interface ProblemaQualidade {
  id: string;
  diagnostico_id: string | null; // Anulável para problemas registrados manualmente fora de um diagnóstico
  ativo_dados_id: string;
  demanda_id: string;
  categoria: CategoriaProblemaQualidade;
  titulo: string;
  descricao: string;
  tabela_afetada: string;
  coluna_afetada: string | null;
  total_linhas_afetadas: number;
  percentual_linhas_afetadas: number;
  amostra_evidencias: EvidenciaProblemaQualidade[];
  severidade: SeveridadeProblema;
  impacto_calculo: string | null;
  acao_deliberada: string | null;
  justificativa_deliberacao: string | null;
  deliberado_por_humano: boolean;
  deliberado_em: string | null;
  status: StatusProblemaQualidade;
  origem_deteccao: 'AUTOMATICA' | 'MANUAL';
  regra_id?: string | null; // Preenchido quando o problema for gerado por violação de regra de negócio
  regra_snapshot?: RegraSnapshot | null; // Cópia imutável da regra no momento da execução
  criado_em: string;
  atualizado_em: string;
}
