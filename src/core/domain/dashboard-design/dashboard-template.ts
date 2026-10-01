/**
 * src/core/domain/dashboard-design/dashboard-template.ts
 *
 * Catálogo Inicial de Templates Estruturais Premium (Subgate 3.4D)
 *
 * Templates profissionais, estruturais e reproduzíveis:
 * 1. EXECUTIVE_PREMIUM: Síntese de alto nível para liderança estratégica.
 * 2. ANALYTICAL_PREMIUM: Densidade e detalhamento para analistas de dados e negócios.
 * 3. OPERATIONAL_PREMIUM: Acompanhamento de rotina, metas e matrizes detalhadas.
 */

import { PublicoAlvoPagina } from '@/core/domain/enums/publico-alvo-pagina';
import { PosicaoLayoutVisual } from '@/core/domain/enums/posicao-layout-visual';
import { TipoVisualDashboard } from '@/core/domain/enums/tipo-visual-dashboard';

export enum TipoTemplateDashboard {
  EXECUTIVE_PREMIUM = 'EXECUTIVE_PREMIUM',
  ANALYTICAL_PREMIUM = 'ANALYTICAL_PREMIUM',
  OPERATIONAL_PREMIUM = 'OPERATIONAL_PREMIUM',
}

export const ROTULOS_TEMPLATE_DASHBOARD: Record<TipoTemplateDashboard, string> = {
  [TipoTemplateDashboard.EXECUTIVE_PREMIUM]: 'Executive Premium (C-Level / Diretoria)',
  [TipoTemplateDashboard.ANALYTICAL_PREMIUM]: 'Analytical Premium (Gestão & Analistas)',
  [TipoTemplateDashboard.OPERATIONAL_PREMIUM]: 'Operational Premium (Operação & Rotina)',
};

export interface SlotLayoutTemplate {
  posicao: PosicaoLayoutVisual;
  tipoVisualSugerido: TipoVisualDashboard;
  tituloSugerido: string;
  larguraColunas: number; // No grid de 12 colunas
  prioridade: number;
}

export interface EstruturaPaginaTemplate {
  nomeSugerido: string;
  objetivoAnalitico: string;
  publicoAlvo: PublicoAlvoPagina;
  slots: SlotLayoutTemplate[];
}

export interface TemplateDashboardDefinicao {
  tipo: TipoTemplateDashboard;
  nome: string;
  descricao: string;
  publicoAlvoPrincipal: PublicoAlvoPagina;
  densidadeVisual: 'BAIXA' | 'MEDIA' | 'ALTA';
  paginasBase: EstruturaPaginaTemplate[];
}

export const CATALOGO_TEMPLATES_PREMIUM: Record<
  TipoTemplateDashboard,
  TemplateDashboardDefinicao
> = {
  [TipoTemplateDashboard.EXECUTIVE_PREMIUM]: {
    tipo: TipoTemplateDashboard.EXECUTIVE_PREMIUM,
    nome: 'Executive Premium',
    descricao:
      'Painel de síntese estratégica voltado para tomada de decisão rápida por diretores e C-Level. Destaca KPIs de faturamento e resultado, tendência temporal clara e drivers principais.',
    publicoAlvoPrincipal: PublicoAlvoPagina.EXECUTIVO,
    densidadeVisual: 'BAIXA',
    paginasBase: [
      {
        nomeSugerido: 'Visão Geral Executiva',
        objetivoAnalitico:
          'Apresentar o panorama consolidado dos principais KPIs do negócio e a trajetória temporal recente.',
        publicoAlvo: PublicoAlvoPagina.EXECUTIVO,
        slots: [
          {
            posicao: PosicaoLayoutVisual.TOPO_KPIS,
            tipoVisualSugerido: TipoVisualDashboard.CARTAO_KPI,
            tituloSugerido: 'KPI Principal (Receita / Total)',
            larguraColunas: 4,
            prioridade: 1,
          },
          {
            posicao: PosicaoLayoutVisual.TOPO_KPIS,
            tipoVisualSugerido: TipoVisualDashboard.CARTAO_KPI,
            tituloSugerido: 'KPI Secundário (Volume / Transações)',
            larguraColunas: 4,
            prioridade: 2,
          },
          {
            posicao: PosicaoLayoutVisual.TOPO_KPIS,
            tipoVisualSugerido: TipoVisualDashboard.CARTAO_KPI,
            tituloSugerido: 'Taxa / Eficiência (Margem / Ticket Médio)',
            larguraColunas: 4,
            prioridade: 3,
          },
          {
            posicao: PosicaoLayoutVisual.CENTRAL_TENDENCIAS,
            tipoVisualSugerido: TipoVisualDashboard.GRAFICO_LINHAS,
            tituloSugerido: 'Evolução Temporal do Indicador Principal',
            larguraColunas: 8,
            prioridade: 4,
          },
          {
            posicao: PosicaoLayoutVisual.CENTRAL_TENDENCIAS,
            tipoVisualSugerido: TipoVisualDashboard.GRAFICO_BARRAS,
            tituloSugerido: 'Composição por Categoria / Segmento',
            larguraColunas: 4,
            prioridade: 5,
          },
        ],
      },
    ],
  },

  [TipoTemplateDashboard.ANALYTICAL_PREMIUM]: {
    tipo: TipoTemplateDashboard.ANALYTICAL_PREMIUM,
    nome: 'Analytical Premium',
    descricao:
      'Projetado para analistas e líderes operacionais que necessitam investigar correlações, distribuições, sazonalidades e causas-raiz dos resultados.',
    publicoAlvoPrincipal: PublicoAlvoPagina.GERENCIAL,
    densidadeVisual: 'MEDIA',
    paginasBase: [
      {
        nomeSugerido: 'Visão Geral Analítica',
        objetivoAnalitico:
          'Monitorar os indicadores chave e decompor o resultado por dimensões de negócio e tempo.',
        publicoAlvo: PublicoAlvoPagina.GERENCIAL,
        slots: [
          {
            posicao: PosicaoLayoutVisual.TOPO_KPIS,
            tipoVisualSugerido: TipoVisualDashboard.CARTAO_KPI,
            tituloSugerido: 'Indicador Primário',
            larguraColunas: 3,
            prioridade: 1,
          },
          {
            posicao: PosicaoLayoutVisual.TOPO_KPIS,
            tipoVisualSugerido: TipoVisualDashboard.CARTAO_KPI,
            tituloSugerido: 'Indicador Secundário',
            larguraColunas: 3,
            prioridade: 2,
          },
          {
            posicao: PosicaoLayoutVisual.TOPO_KPIS,
            tipoVisualSugerido: TipoVisualDashboard.CARTAO_KPI,
            tituloSugerido: 'Taxa ou Margem',
            larguraColunas: 3,
            prioridade: 3,
          },
          {
            posicao: PosicaoLayoutVisual.TOPO_KPIS,
            tipoVisualSugerido: TipoVisualDashboard.CARTAO_KPI,
            tituloSugerido: 'Métrica Comparativa',
            larguraColunas: 3,
            prioridade: 4,
          },
          {
            posicao: PosicaoLayoutVisual.CENTRAL_TENDENCIAS,
            tipoVisualSugerido: TipoVisualDashboard.GRAFICO_LINHAS,
            tituloSugerido: 'Série Histórica e Tendência',
            larguraColunas: 6,
            prioridade: 5,
          },
          {
            posicao: PosicaoLayoutVisual.CENTRAL_TENDENCIAS,
            tipoVisualSugerido: TipoVisualDashboard.GRAFICO_BARRAS,
            tituloSugerido: 'Ranking por Dimensão Principal',
            larguraColunas: 6,
            prioridade: 6,
          },
          {
            posicao: PosicaoLayoutVisual.INFERIOR_DETALHES,
            tipoVisualSugerido: TipoVisualDashboard.MATRIZ_TABELA,
            tituloSugerido: 'Detalhamento Multidimensional',
            larguraColunas: 12,
            prioridade: 7,
          },
        ],
      },
    ],
  },

  [TipoTemplateDashboard.OPERATIONAL_PREMIUM]: {
    tipo: TipoTemplateDashboard.OPERATIONAL_PREMIUM,
    nome: 'Operational Premium',
    descricao:
      'Foco em acompanhamento diário, desvios e lista operacional de registros para intervenção tática imediata.',
    publicoAlvoPrincipal: PublicoAlvoPagina.OPERACIONAL,
    densidadeVisual: 'ALTA',
    paginasBase: [
      {
        nomeSugerido: 'Acompanhamento Operacional',
        objetivoAnalitico:
          'Monitorar volume, execução de metas e matriz de casos pendentes para ação operacional.',
        publicoAlvo: PublicoAlvoPagina.OPERACIONAL,
        slots: [
          {
            posicao: PosicaoLayoutVisual.TOPO_KPIS,
            tipoVisualSugerido: TipoVisualDashboard.CARTAO_KPI,
            tituloSugerido: 'Volume Operacional Total',
            larguraColunas: 6,
            prioridade: 1,
          },
          {
            posicao: PosicaoLayoutVisual.TOPO_KPIS,
            tipoVisualSugerido: TipoVisualDashboard.CARTAO_KPI,
            tituloSugerido: 'Casos Críticos / Exceções',
            larguraColunas: 6,
            prioridade: 2,
          },
          {
            posicao: PosicaoLayoutVisual.CENTRAL_TENDENCIAS,
            tipoVisualSugerido: TipoVisualDashboard.GRAFICO_COLUNAS,
            tituloSugerido: 'Distribuição por Status / Etapa',
            larguraColunas: 6,
            prioridade: 3,
          },
          {
            posicao: PosicaoLayoutVisual.CENTRAL_TENDENCIAS,
            tipoVisualSugerido: TipoVisualDashboard.GRAFICO_BARRAS,
            tituloSugerido: 'Desempenho por Unidade / Responsável',
            larguraColunas: 6,
            prioridade: 4,
          },
          {
            posicao: PosicaoLayoutVisual.INFERIOR_DETALHES,
            tipoVisualSugerido: TipoVisualDashboard.MATRIZ_TABELA,
            tituloSugerido: 'Matriz Detalhada de Casos',
            larguraColunas: 12,
            prioridade: 5,
          },
        ],
      },
    ],
  },
};

export const ID_TEMPLATE_EXECUTIVE_PREMIUM = TipoTemplateDashboard.EXECUTIVE_PREMIUM;
export const ID_TEMPLATE_ANALYTICAL_PREMIUM = TipoTemplateDashboard.ANALYTICAL_PREMIUM;
export const ID_TEMPLATE_OPERATIONAL_PREMIUM = TipoTemplateDashboard.OPERATIONAL_PREMIUM;
export const TEMPLATES_PREMIUM_DASHBOARD: TemplateDashboardDefinicao[] = Object.values(
  CATALOGO_TEMPLATES_PREMIUM
);
