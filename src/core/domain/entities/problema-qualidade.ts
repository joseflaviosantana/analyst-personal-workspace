import { CategoriaProblemaQualidade } from '../enums/categoria-problema-qualidade';
import { SeveridadeProblema } from '../enums/severidade-problema';
import { StatusProblemaQualidade } from '../enums/status-problema-qualidade';

/**
 * EvidenciaProblemaQualidade (V1 — Subunidade 3.4A)
 * Representação mínima, precisa e despersonalizada de uma ocorrência factual da anomalia.
 * Salvaguarda de Privacidade: NÃO serializa a linha bruta completa do cliente no banco de dados.
 * Registra exclusivamente a localização física (linha, coluna) e o valor discrepante.
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
 */
export interface ProblemaQualidade {
  id: string;
  diagnostico_id: string;
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
  criado_em: string;
  atualizado_em: string;
}
