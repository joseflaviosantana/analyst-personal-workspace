/**
 * src/core/domain/dashboard-design/dataviz-pedagogy.ts
 *
 * Módulo Pedagógico de Data Visualization — "Aprenda Enquanto Trabalha"
 * (Subgate 3.4D — Analyst Personal Workspace V1)
 *
 * Fornece conceitos fundamentais, justificativas típicas, regras de boas práticas
 * e dicas profissionais para cada tipo de visual analítico no Power BI.
 */

import { TipoVisualDashboard } from '../enums/tipo-visual-dashboard';

export interface ConceitoDataViz {
  tipo: TipoVisualDashboard;
  nomeLegivel: string;
  oQueE: string;
  quandoUtilizar: string;
  quandoEvitar: string;
  dicaProfissional: string;
  alternativasComuns: { tipo: TipoVisualDashboard; motivo: string }[];
}

export const CATALOGO_CONCEITOS_DATAVIZ: Record<TipoVisualDashboard, ConceitoDataViz> = {
  [TipoVisualDashboard.CARTAO_KPI]: {
    tipo: TipoVisualDashboard.CARTAO_KPI,
    nomeLegivel: 'Cartão de KPI (Single Value / KPI Card)',
    oQueE: 'Elemento visual focado em destacar um único valor escalar com máxima ênfase visual e leitura instantânea.',
    quandoUtilizar: 'Ideal para métricas norteadoras (ex: Receita Total, Volume de Vendas, Ticket Médio, SLA) no topo da página (Slot TOPO_KPIS).',
    quandoEvitar: 'Não utilize para comparar distribuições ou exibir séries temporais sem contexto de tendência.',
    dicaProfissional: 'Mantenha os cartões de KPI no quadrante superior do dashboard. Sempre inclua contexto (ex: período de apuração ou meta comparativa) para que o número não fique isolado.',
    alternativasComuns: [
      { tipo: TipoVisualDashboard.GRAFICO_COLUNAS, motivo: 'Quando o número precisa ser decomposto por categoria' },
      { tipo: TipoVisualDashboard.GRAFICO_LINHAS, motivo: 'Quando a evolução no tempo é mais relevante que o total estático' },
    ],
  },

  [TipoVisualDashboard.GRAFICO_LINHAS]: {
    tipo: TipoVisualDashboard.GRAFICO_LINHAS,
    nomeLegivel: 'Gráfico de Linhas (Line Chart)',
    oQueE: 'Visual primordial para representar a variação de grandezas contínuas ao longo do tempo (séries temporais).',
    quandoUtilizar: 'Recomendado sempre que o eixo temporal for contínuo (dias, meses, anos) para análise de sazonalidade, aceleração ou desaceleração.',
    quandoEvitar: 'Evite utilizar para variáveis categóricas sem relação de ordem cronológica (ex: cidades, produtos, canais).',
    dicaProfissional: 'Limite a no máximo 3 ou 4 séries de linhas no mesmo gráfico para evitar o "efeito espaguete". Garanta que o eixo temporal utilize uma dimensão dCalendario contínua.',
    alternativasComuns: [
      { tipo: TipoVisualDashboard.GRAFICO_COLUNAS, motivo: 'Quando o número de períodos é reduzido (ex: últimos 3 meses) e o foco é comparar volumes' },
      { tipo: TipoVisualDashboard.MATRIZ_TABELA, motivo: 'Quando o usuário necessita auditar cada valor pontual' },
    ],
  },

  [TipoVisualDashboard.GRAFICO_BARRAS]: {
    tipo: TipoVisualDashboard.GRAFICO_BARRAS,
    nomeLegivel: 'Gráfico de Barras Horizontais (Horizontal Bar Chart)',
    oQueE: 'Visual de barras orientadas horizontalmente, perfeito para comparação e ranking entre categorias.',
    quandoUtilizar: 'Essencial quando as categorias possuem nomes ou descrições longas (ex: Categoria de Produto, Nome de Cliente, Filial) ou quando o objetivo principal é ordenar (ranking decrescente).',
    quandoEvitar: 'Evite utilizar para séries temporais cronológicas contínuas, onde o olho humano espera o tempo no eixo horizontal X.',
    dicaProfissional: 'Ordene sempre as barras de forma descendente (do maior para o menor) a menos que haja uma ordem intrínseca (ex: faixas etárias ou níveis de satisfação).',
    alternativasComuns: [
      { tipo: TipoVisualDashboard.GRAFICO_COLUNAS, motivo: 'Quando as categorias são curtas e cabem facilmente no eixo X' },
      { tipo: TipoVisualDashboard.MATRIZ_TABELA, motivo: 'Quando o público necessita auditar valores numéricos exatos de muitas métricas simultâneas' },
    ],
  },

  [TipoVisualDashboard.GRAFICO_COLUNAS]: {
    tipo: TipoVisualDashboard.GRAFICO_COLUNAS,
    nomeLegivel: 'Gráfico de Colunas Verticais (Vertical Column Chart)',
    oQueE: 'Visual de barras verticais clássico para comparação de grandezas entre poucas categorias discretas ou períodos curtos.',
    quandoUtilizar: 'Excelente para comparação entre 3 a 7 categorias com rótulos curtos ou períodos temporais discretos (ex: Trimestres Q1..Q4).',
    quandoEvitar: 'Não utilize quando houver muitas categorias ou rótulos longos que forcem o texto a ficar inclinado ou truncado no eixo X.',
    dicaProfissional: 'O eixo vertical Y deve sempre iniciar no zero (0). Quebrar o eixo distorce a percepção visual das proporções entre as colunas.',
    alternativasComuns: [
      { tipo: TipoVisualDashboard.GRAFICO_BARRAS, motivo: 'Se os rótulos das categorias ficarem inclinados ou truncados' },
      { tipo: TipoVisualDashboard.GRAFICO_LINHAS, motivo: 'Se houver mais de 12 períodos temporais sequenciais' },
    ],
  },

  [TipoVisualDashboard.MATRIZ_TABELA]: {
    tipo: TipoVisualDashboard.MATRIZ_TABELA,
    nomeLegivel: 'Matriz ou Tabela Analítica (Matrix / Table)',
    oQueE: 'Apresentação bidimensional estruturada de dados numéricos e categóricos com suporte a hierarquias de drill-down.',
    quandoUtilizar: 'Ideal para o quadrante inferior do dashboard (Slot INFERIOR_DETALHES), permitindo que analistas e gerentes confiram valores exatos e façam drill-down por dimensão.',
    quandoEvitar: 'Evite colocar no topo do dashboard para diretores que necessitam de síntese visual rápida em menos de 5 segundos.',
    dicaProfissional: 'Utilize formatação condicional sutil (barras de dados ou mapa de calor monocromático) para destacar outliers sem sobrecarregar a legibilidade da tabela.',
    alternativasComuns: [
      { tipo: TipoVisualDashboard.GRAFICO_BARRAS, motivo: 'Se a intenção for apenas comparar o ranking da principal métrica' },
      { tipo: TipoVisualDashboard.GRAFICO_COLUNAS, motivo: 'Se houver poucas categorias e poucas métricas' },
    ],
  },

  [TipoVisualDashboard.DISPERSAO]: {
    tipo: TipoVisualDashboard.DISPERSAO,
    nomeLegivel: 'Gráfico de Dispersão (Scatter Plot)',
    oQueE: 'Visual cartesiano (X vs Y) projetado para investigar correlações e identificar clusters ou outliers entre duas métricas numéricas contínuas.',
    quandoUtilizar: 'Perfeito para cruzar duas métricas distintas (ex: Margem % vs Volume de Vendas por Cliente).',
    quandoEvitar: 'Não utilize para públicos que apenas buscam totais operacionais sem interesse em análise estatística de correlação.',
    dicaProfissional: 'Adicione uma linha de tendência ou linhas de referência de quadrantes (média de X e média de Y) para contextualizar os quadrantes de oportunidade.',
    alternativasComuns: [
      { tipo: TipoVisualDashboard.GRAFICO_BARRAS, motivo: 'Se apenas uma métrica for o foco de comparação' },
      { tipo: TipoVisualDashboard.MATRIZ_TABELA, motivo: 'Se o objetivo for listar os clientes e suas margens em formato tabular' },
    ],
  },

  [TipoVisualDashboard.OUTRO]: {
    tipo: TipoVisualDashboard.OUTRO,
    nomeLegivel: 'Visual Personalizado / Outro',
    oQueE: 'Componente visual especializado para necessidades de representação não cobertas pelos gráficos padrões.',
    quandoUtilizar: 'Utilizar quando um visual customizado homologado for estritamente necessário.',
    quandoEvitar: 'Evite componentes que adicionem ruído cognitivo sem agregação de valor analítico claro.',
    dicaProfissional: 'Priorize sempre a simplicidade e a rapidez de interpretação do usuário final.',
    alternativasComuns: [
      { tipo: TipoVisualDashboard.GRAFICO_BARRAS, motivo: 'Alternativa padrão para clareza e precisão' },
      { tipo: TipoVisualDashboard.MATRIZ_TABELA, motivo: 'Alternativa para conferência tabular direta' },
    ],
  },
};

export function obterConceitoDataViz(tipo: TipoVisualDashboard): ConceitoDataViz {
  return (
    CATALOGO_CONCEITOS_DATAVIZ[tipo] ?? {
      tipo,
      nomeLegivel: tipo,
      oQueE: 'Componente visual de apresentação analítica.',
      quandoUtilizar: 'Utilizar de acordo com a pergunta de negócio correspondente.',
      quandoEvitar: 'Evite saturação visual sem função analítica.',
      dicaProfissional: 'Mantenha o foco na legibilidade, alinhamento e contraste adequados.',
      alternativasComuns: [],
    }
  );
}
