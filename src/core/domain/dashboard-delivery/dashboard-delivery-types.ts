/**
 * src/core/domain/dashboard-delivery/dashboard-delivery-types.ts
 *
 * Contratos e Tipos Formais do Pacote de Entrega, Checklist,
 * Documentação Automática e Preparação Estrutural para Portfólio (Subgate 3.4E)
 */

import { DiagnosticoRegraDashboard, SeveridadeRegraDashboard } from '../rules/dashboard-rules-evaluator';
import { InsightDashboardCopilot } from '../dashboard-copilot/dashboard-copilot-types';

export type StatusItemChecklist = 'CONCLUIDO' | 'PENDENTE' | 'BLOQUEADO' | 'NAO_APLICAVEL';

export type StatusGeralEntregaDashboard = 'PRONTO_PARA_ENTREGA' | 'BLOQUEADO' | 'EM_DESENVOLVIMENTO';

export interface ItemChecklistEntrega {
  id: string;
  codigo: string;
  titulo: string;
  descricao: string;
  status: StatusItemChecklist;
  obrigatorio: boolean;
  evidencia?: string;
  acaoSugerida?: string;
}

export interface ChecklistEntregaDashboard {
  itens: ItemChecklistEntrega[];
  totalItens: number;
  totalConcluidos: number;
  totalPendentes: number;
  totalBloqueados: number;
  aptoParaSeguirWorkflow: boolean;
  percentualConclusao: number;
}

export interface CasePortfolioEstrutural {
  tituloCase: string;
  problemaNegocio: string;
  contexto: string;
  processoAplicado: string;
  ferramentasUtilizadas: string[];
  decisoesMetodologicas: string[];
  metricasChave: string[];
  resultadosEsperados: string;
  aprendizadosTecnicos: string[];
  resumoTecnicoSanitizado: string;
  evidenciasDisponiveis: { tipo: string; descricao: string }[];
}

export interface DecisaoHumanaRegistrada {
  tipo: string;
  descricao: string;
  autor?: string;
  dataHora: string;
}

export interface PacoteEntregaDashboard {
  versaoPacote: string;
  geradoEm: string;
  demanda: {
    id: string;
    titulo: string;
    projetoNome?: string;
    objetivo?: string | null;
    contexto?: string | null;
    estado: string;
  };
  modeloPowerBi: {
    id: string;
    tipoFormato: string;
    nomeArquivo: string;
    status: string;
    versaoPowerBi?: string | null;
    isIsento: boolean;
    justificativaIsencao?: string | null;
  } | null;
  modeloAnaliticoReferencia?: {
    id: string;
    nome: string;
    status: string;
    totalMetricas: number;
  } | null;
  catalogoMedidasDax: {
    id: string;
    nome: string;
    tabelaHospedeira: string;
    expressaoDax: string;
    formatoString?: string | null;
    categoriaDax: string;
    metricaOrigemNome?: string | null;
    descricao?: string | null;
  }[];
  paginas: {
    id: string;
    nome: string;
    objetivoAnalitico?: string | null;
    publicoAlvo: string;
    layoutGrid: string;
    ordem: number;
    totalVisuais: number;
  }[];
  visuais: {
    id: string;
    paginaId: string;
    paginaNome: string;
    titulo: string;
    tipoVisual: string;
    posicaoLayout: string;
    medidasAssociadas: string[];
    justificativaDataviz?: {
      oQueFoiEscolhido: string;
      porQueFoiEscolhido: string;
      qualPerguntaResponde: string;
      qualMetricaUtiliza: string;
      qualDimensaoUtiliza: string;
      dicaProfissional: string;
      quandoEvitar: string;
    };
    statusAprovacao?: string;
  }[];
  perfilVisualTemplate: string;
  prontidaoNormativa: {
    statusGeral: SeveridadeRegraDashboard | 'CONFORME';
    aptoParaValidacao: boolean;
    totalBloqueios: number;
    totalAlertasCriticos: number;
    totalRecomendacoes: number;
    diagnosticos: DiagnosticoRegraDashboard[];
  };
  orientacoesCopiloto: {
    totalInsights: number;
    insights: {
      codigo?: string;
      categoria: string;
      natureza: string;
      titulo: string;
      recomendacao: string;
      explicacao?: string;
    }[];
  };
  checklist: ChecklistEntregaDashboard;
  casePortfolio: CasePortfolioEstrutural;
  decisoesHumanas: DecisaoHumanaRegistrada[];
  statusEntrega: StatusGeralEntregaDashboard;
}
