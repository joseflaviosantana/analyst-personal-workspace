import { CategoriaProblemaQualidade } from '../enums/categoria-problema-qualidade';
import { StatusExecucaoDiagnostico } from '../enums/status-execucao-diagnostico';
import { StatusVerificacaoQualidade } from '../enums/status-verificacao-qualidade';

/**
 * ResultadoItemVerificacao (V1 — Subunidade 3.4A)
 * Registra o estado epistêmico e volumetria de cada regra avaliada no diagnóstico.
 */
export interface ResultadoItemVerificacao {
  categoria: CategoriaProblemaQualidade;
  nome: string;
  status: StatusVerificacaoQualidade;
  totalProblemas: number;
  observacao?: string;
}

/**
 * DiagnosticoQualidade (V1 — Subunidade 3.4A / ADR-002 Seção 5.3-B)
 * Entidade de primeira classe que encapsula a execução formal de uma varredura de qualidade sobre um ativo.
 * Preserva o histórico imutável das execuções sem sobrescrita.
 */
export interface DiagnosticoQualidade {
  id: string;
  ativo_dados_id: string;
  demanda_id: string;
  iniciado_em: string;
  concluido_em: string | null;
  duracao_ms: number;
  total_linhas_avaliadas: number;
  total_colunas_avaliadas: number;
  verificacoes_executadas: ResultadoItemVerificacao[];
  total_problemas_detectados: number;
  status_execucao: StatusExecucaoDiagnostico;
  erro_mensagem: string | null;
  resumo_metricas: Record<string, unknown> | null;
  criado_em: string;
  atualizado_em: string;
}
