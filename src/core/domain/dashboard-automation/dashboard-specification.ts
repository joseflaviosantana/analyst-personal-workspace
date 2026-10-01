/**
 * src/core/domain/dashboard-automation/dashboard-specification.ts
 *
 * Contratos Oficiais de Especificação do Dashboard Automation (Subgate 3.4D)
 *
 * Arquitetura de Especificação em Pipeline:
 * DashboardSpecification -> PageSpecification -> VisualSpecification -> DesignTokens -> (Power BI Adapter Futuro)
 *
 * Totalmente desacoplado de bibliotecas visuais ou fornecedores externos.
 */

import { TipoVisualDashboard } from '@/core/domain/enums/tipo-visual-dashboard';
import { PosicaoLayoutVisual } from '@/core/domain/enums/posicao-layout-visual';
import { PublicoAlvoPagina } from '@/core/domain/enums/publico-alvo-pagina';
import { LayoutGridPagina } from '@/core/domain/enums/layout-grid-pagina';
import { TipoTemplateDashboard } from '@/core/domain/dashboard-design/dashboard-template';
import { DashboardDesignSystemTokens } from '@/core/domain/dashboard-design/design-tokens';

export type StatusAprovacaoItem =
  | 'PROPOSTO'
  | 'EM_REVISAO'
  | 'APROVADO'
  | 'REJEITADO'
  | 'AJUSTE_SOLICITADO';

export type ModoTrabalhoDashboard = 'AUTOMATICO' | 'ASSISTIDO' | 'MANUAL';

export interface JustificativaDataViz {
  oQueFoiEscolhido: string;
  porQueFoiEscolhido: string;
  perguntaRespondida: string;
  metricaUtilizada: string;
  dimensaoUtilizada?: string | null;
  dicaProfissional: string;
  aprendaEnquantoTrabalha: string;
}

export interface AlternativaVisual {
  tipoVisual: TipoVisualDashboard;
  titulo: string;
  justificativaAlternativa: string;
  vantagem: string;
  desvantagem: string;
}

export interface VisualSpecification {
  id: string;
  titulo: string;
  tipoVisual: TipoVisualDashboard;
  posicaoLayout: PosicaoLayoutVisual;
  larguraColunas: number;
  ordem: number;
  medidaDaxId: string | null;
  medidaDaxNome: string | null;
  metricaAnaliticaId: string | null;
  metricaAnaliticaNome: string | null;
  atributosUtilizadosIds: string[];
  justificativaDataViz: JustificativaDataViz;
  alternativasRecomendadas: AlternativaVisual[];
  statusAprovacao: StatusAprovacaoItem;
  dependenciaDaxPendente: boolean;
}

export interface PageSpecification {
  id: string;
  nome: string;
  objetivoAnalitico: string;
  publicoAlvo: PublicoAlvoPagina;
  layoutGrid: LayoutGridPagina;
  ordem: number;
  perguntasAtendidas: string[];
  narrativa: string;
  justificativa: string;
  statusAprovacao: StatusAprovacaoItem;
  visuais: VisualSpecification[];
}

export interface DashboardSpecification {
  demandaId: string;
  modeloPowerBiId: string;
  templateUtilizado: TipoTemplateDashboard;
  modoTrabalho: ModoTrabalhoDashboard;
  titulo: string;
  resumoExecutivo: string;
  designTokens: DashboardDesignSystemTokens;
  paginas: PageSpecification[];
  totalPaginas: number;
  totalVisuais: number;
  statusGeral: StatusAprovacaoItem;
  geradoEm: string;
  contextoInsuficiente?: boolean;
  mensagemContexto?: string;
}
