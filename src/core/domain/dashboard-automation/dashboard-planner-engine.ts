/**
 * src/core/domain/dashboard-automation/dashboard-planner-engine.ts
 *
 * Motor Determinístico de Planejamento de Dashboard (Subgate 3.4D)
 *
 * Princípios Epistêmicos e de Engenharia:
 * 1. Determinismo estrito: as mesmas entradas geram sempre a mesma proposta de dashboard;
 * 2. Rastreabilidade total: Pergunta de Negócio -> Métrica Homologada -> Medida DAX -> Visual -> Página;
 * 3. Justificativa DataViz para cada recomendação ("Aprenda Enquanto Trabalha");
 * 4. Human-in-the-Loop: Toda recomendação nasce com status 'PROPOSTO';
 * 5. Não inventa significado semântico ausente: Se não houver temporalidade ou categorias,
 *    declara contexto insuficiente e não alucina gráficos de linha ou dispersão.
 */

import { MetricaAnalitica } from '@/core/domain/entities/metrica-analitica';
import { MedidaDax } from '@/core/domain/entities/medida-dax';
import {
  TipoVisualDashboard,
  ROTULOS_TIPO_VISUAL_DASHBOARD,
} from '@/core/domain/enums/tipo-visual-dashboard';
import { PosicaoLayoutVisual } from '@/core/domain/enums/posicao-layout-visual';
import { PublicoAlvoPagina } from '@/core/domain/enums/publico-alvo-pagina';
import { LayoutGridPagina } from '@/core/domain/enums/layout-grid-pagina';
import {
  TipoTemplateDashboard,
  CATALOGO_TEMPLATES_PREMIUM,
} from '@/core/domain/dashboard-design/dashboard-template';
import { DEFAULT_PREMIUM_DESIGN_TOKENS } from '@/core/domain/dashboard-design/design-tokens';
import {
  DashboardSpecification,
  PageSpecification,
  VisualSpecification,
  ModoTrabalhoDashboard,
  AlternativaVisual,
} from './dashboard-specification';

export interface EntidadeContextoPlanejamento {
  id: string;
  nome: string;
  tipo: string;
  atributos: { id: string; nome: string; papel: string; tipo_dado: string }[];
}

export interface ContextoPlanejamentoDashboard {
  demandaId: string;
  demandaTitulo: string;
  demandaObjetivo?: string | null;
  perguntasNegocio?: string[];
  modeloPowerBiId: string;
  modeloAnaliticoNome?: string | null;
  metricasHomologadas: MetricaAnalitica[];
  medidasDaxExistentes: MedidaDax[];
  entidadesAnaliticas?: EntidadeContextoPlanejamento[];
  templateDesejado?: TipoTemplateDashboard;
  modoTrabalho?: ModoTrabalhoDashboard;
}

export class DashboardPlannerEngine {
  public static planejar(
    contexto: ContextoPlanejamentoDashboard
  ): DashboardSpecification {
    const {
      demandaId,
      demandaTitulo,
      demandaObjetivo,
      perguntasNegocio = [],
      modeloPowerBiId,
      metricasHomologadas = [],
      medidasDaxExistentes = [],
      entidadesAnaliticas = [],
      templateDesejado = TipoTemplateDashboard.EXECUTIVE_PREMIUM,
      modoTrabalho = 'AUTOMATICO',
    } = contexto;

    const agora = new Date().toISOString();

    // 1. Verificação de Evidências Suficientes
    if (metricasHomologadas.length === 0 && medidasDaxExistentes.length === 0) {
      return {
        demandaId,
        modeloPowerBiId,
        templateUtilizado: templateDesejado,
        modoTrabalho,
        titulo: `Dashboard — ${demandaTitulo}`,
        resumoExecutivo:
          'Contexto analítico insuficiente para planejar automaticamente páginas e visuais. É necessário definir métricas de negócio na Aba 6 ou cadastrar medidas DAX no Bloco 2.',
        designTokens: DEFAULT_PREMIUM_DESIGN_TOKENS,
        paginas: [],
        totalPaginas: 0,
        totalVisuais: 0,
        statusGeral: 'PROPOSTO',
        geradoEm: agora,
        contextoInsuficiente: true,
        mensagemContexto:
          'Nenhuma métrica analítica homologada ou medida DAX foi encontrada. Cadastre ao menos um indicador para habilitar o planejamento automático.',
      };
    }

    // 2. Identificação de Capacidades Dimensionais no Modelo
    const temTemporalidade = entidadesAnaliticas.some(
      (e) =>
        e.nome.toLowerCase().includes('calend') ||
        e.nome.toLowerCase().includes('data') ||
        e.atributos.some(
          (a) =>
            a.papel === 'TEMPORAL' ||
            a.tipo_dado === 'DATA' ||
            a.nome.toLowerCase().includes('data') ||
            a.nome.toLowerCase().includes('mes') ||
            a.nome.toLowerCase().includes('ano')
        )
    );

    const entidadesCategoricas = entidadesAnaliticas.filter(
      (e) =>
        !e.nome.toLowerCase().includes('calend') &&
        !e.nome.toLowerCase().includes('fato') &&
        e.tipo !== 'FATO'
    );

    const templateDef =
      CATALOGO_TEMPLATES_PREMIUM[templateDesejado] ||
      CATALOGO_TEMPLATES_PREMIUM[TipoTemplateDashboard.EXECUTIVE_PREMIUM];

    // 3. Mapear Métrica / Medida Primária
    const metricaPrimaria = metricasHomologadas[0];
    const medidaDaxPrimaria = medidasDaxExistentes.find(
      (m) => m.metrica_analitica_id === metricaPrimaria?.id
    ) || medidasDaxExistentes[0];

    const nomeMetricaPrimaria =
      medidaDaxPrimaria?.nome || metricaPrimaria?.nome || 'Indicador Principal';

    // 4. Construir Páginas e Visuais Conforme Template e Evidências
    const paginasPropostas: PageSpecification[] = [];

    // --- PÁGINA 1: VISÃO GERAL EXECUTIVA ---
    const visuaisPagina1: VisualSpecification[] = [];
    let ordemVisual = 1;

    // 4.1 KPIs de Topo
    const metricasParaKpi = metricasHomologadas.slice(0, 3);
    const medidasParaKpi = medidasDaxExistentes.slice(0, 3);

    const totalKpis = Math.max(metricasParaKpi.length, medidasParaKpi.length, 1);
    const larguraKpi = totalKpis >= 3 ? 4 : totalKpis === 2 ? 6 : 12;

    if (metricasParaKpi.length > 0) {
      metricasParaKpi.forEach((metrica, idx) => {
        const medidaCorrespondente = medidasDaxExistentes.find(
          (m) => m.metrica_analitica_id === metrica.id
        );
        const pergunta =
          perguntasNegocio[idx] ||
          metrica.pergunta_negocio_associada ||
          `Qual é o valor consolidado de ${metrica.nome}?`;

        visuaisPagina1.push({
          id: `vis_spec_${demandaId}_kpi_${idx + 1}`,
          titulo: `KPI: ${metrica.nome}`,
          tipoVisual: TipoVisualDashboard.CARTAO_KPI,
          posicaoLayout: PosicaoLayoutVisual.TOPO_KPIS,
          larguraColunas: larguraKpi,
          ordem: ordemVisual++,
          medidaDaxId: medidaCorrespondente?.id ?? null,
          medidaDaxNome: medidaCorrespondente?.nome ?? null,
          metricaAnaliticaId: metrica.id,
          metricaAnaliticaNome: metrica.nome,
          atributosUtilizadosIds: [],
          statusAprovacao: 'PROPOSTO',
          dependenciaDaxPendente: !medidaCorrespondente,
          justificativaDataViz: {
            oQueFoiEscolhido: 'Cartão / Indicador KPI',
            porQueFoiEscolhido:
              'Cartões de KPI apresentam números agregados de forma direta e sem distrações visuais, permitindo leitura instantânea do status do negócio.',
            perguntaRespondida: pergunta,
            metricaUtilizada: metrica.nome,
            dicaProfissional:
              'KPIs executivos devem conter valor formatado com unidade monetária ou percentual legível e, sempre que possível, contexto comparativo com período anterior ou meta.',
            aprendaEnquantoTrabalha:
              'Um cartão KPI foca a atenção cognitiva na magnitude absoluta da métrica antes de entrar em decomposições dimensionais.',
          },
          alternativasRecomendadas: [
            {
              tipoVisual: TipoVisualDashboard.GRAFICO_COLUNAS,
              titulo: 'Cartão com Sparkline ou Mini-Gráfico',
              justificativaAlternativa:
                'Útil quando for essencial ver a direção da tendência recente junto com o valor atual.',
              vantagem: 'Mostra tendência sem ocupar área de gráfico completo.',
              desvantagem: 'Maior carga visual para leitura rápida em reuniões de diretoria.',
            },
          ],
        });
      });
    } else {
      // Se só houver medidas DAX sem métricas homologadas
      medidasParaKpi.forEach((medida, idx) => {
        visuaisPagina1.push({
          id: `vis_spec_${demandaId}_kpi_dax_${idx + 1}`,
          titulo: `KPI: ${medida.nome}`,
          tipoVisual: TipoVisualDashboard.CARTAO_KPI,
          posicaoLayout: PosicaoLayoutVisual.TOPO_KPIS,
          larguraColunas: larguraKpi,
          ordem: ordemVisual++,
          medidaDaxId: medida.id,
          medidaDaxNome: medida.nome,
          metricaAnaliticaId: null,
          metricaAnaliticaNome: null,
          atributosUtilizadosIds: [],
          statusAprovacao: 'PROPOSTO',
          dependenciaDaxPendente: false,
          justificativaDataViz: {
            oQueFoiEscolhido: 'Cartão / Indicador KPI',
            porQueFoiEscolhido:
              'Exibe a medida DAX agregada como número-chave de abertura da página.',
            perguntaRespondida: `Qual é o resultado de ${medida.nome}?`,
            metricaUtilizada: medida.nome,
            dicaProfissional: 'Mantenha consistência de arredondamento em todos os cartões de topo.',
            aprendaEnquantoTrabalha:
              'Cartões KPI funcionam como âncora de atenção e síntese executiva.',
          },
          alternativasRecomendadas: [],
        });
      });
    }

    // 4.2 Tendência Temporal (Gráfico de Linhas) — Apenas se houver temporalidade
    if (temTemporalidade) {
      visuaisPagina1.push({
        id: `vis_spec_${demandaId}_temporal_1`,
        titulo: `Evolução Temporal — ${nomeMetricaPrimaria}`,
        tipoVisual: TipoVisualDashboard.GRAFICO_LINHAS,
        posicaoLayout: PosicaoLayoutVisual.CENTRAL_TENDENCIAS,
        larguraColunas: entidadesCategoricas.length > 0 ? 8 : 12,
        ordem: ordemVisual++,
        medidaDaxId: medidaDaxPrimaria?.id ?? null,
        medidaDaxNome: medidaDaxPrimaria?.nome ?? null,
        metricaAnaliticaId: metricaPrimaria?.id ?? null,
        metricaAnaliticaNome: metricaPrimaria?.nome ?? null,
        atributosUtilizadosIds: [],
        statusAprovacao: 'PROPOSTO',
        dependenciaDaxPendente: !medidaDaxPrimaria,
        justificativaDataViz: {
          oQueFoiEscolhido: 'Gráfico de Linhas Contínuas',
          porQueFoiEscolhido:
            'A evolução temporal é uma relação contínua. Gráficos de linha conectam pontos no tempo preservando a percepção de fluxo, aceleração e inflexões de trajetória.',
          perguntaRespondida:
            perguntasNegocio.find((p) => /tempo|mês|ano|evolu|hist/i.test(p)) ||
            `Como evoluiu ${nomeMetricaPrimaria} ao longo dos períodos registrados?`,
          metricaUtilizada: nomeMetricaPrimaria,
          dimensaoUtilizada: 'Dimensão Temporal (dCalendario / Data)',
          dicaProfissional:
            'Evite marcar todos os pontos de dados individuais com rótulos de dados se houver mais de 12 meses; use marcadores sutis e mantenha o eixo Y com escala iniciando em zero para não distorcer variações percentuais.',
          aprendaEnquantoTrabalha:
            'DataViz Guideline: Linhas representam continuidade e tempo; barras representam categorias discretas.',
        },
        alternativasRecomendadas: [
          {
            tipoVisual: TipoVisualDashboard.GRAFICO_COLUNAS,
            titulo: 'Gráfico de Colunas Verticais',
            justificativaAlternativa:
              'Mais indicado se os períodos forem poucos (ex: 4 trimestres ou meses isolados) e a ênfase for a comparação individual período a período.',
            vantagem: 'Melhor separação visual de valores de cada mês isolado.',
            desvantagem: 'Menor clareza na percepção de inclinação de tendência contínua.',
          },
        ],
      });
    }

    // 4.3 Comparação Categórica / Ranking (Gráfico de Barras) — Se houver dimensão categórica
    if (entidadesCategoricas.length > 0) {
      const dim = entidadesCategoricas[0];
      visuaisPagina1.push({
        id: `vis_spec_${demandaId}_categoria_1`,
        titulo: `Ranking por ${dim.nome} — ${nomeMetricaPrimaria}`,
        tipoVisual: TipoVisualDashboard.GRAFICO_BARRAS,
        posicaoLayout: PosicaoLayoutVisual.CENTRAL_TENDENCIAS,
        larguraColunas: temTemporalidade ? 4 : 12,
        ordem: ordemVisual++,
        medidaDaxId: medidaDaxPrimaria?.id ?? null,
        medidaDaxNome: medidaDaxPrimaria?.nome ?? null,
        metricaAnaliticaId: metricaPrimaria?.id ?? null,
        metricaAnaliticaNome: metricaPrimaria?.nome ?? null,
        atributosUtilizadosIds: [dim.atributos[0]?.id || dim.id],
        statusAprovacao: 'PROPOSTO',
        dependenciaDaxPendente: !medidaDaxPrimaria,
        justificativaDataViz: {
          oQueFoiEscolhido: 'Gráfico de Barras Horizontais',
          porQueFoiEscolhido:
            'Barras horizontais são o padrão ouro para rankings de categorias porque acomodam nomes textuais de qualquer tamanho sem inclinação ou truncamento de rótulos.',
          perguntaRespondida:
            perguntasNegocio.find((p) => /categoria|segmento|ranking|qual|quem/i.test(p)) ||
            `Quais ${dim.nome} representam o maior volume de ${nomeMetricaPrimaria}?`,
          metricaUtilizada: nomeMetricaPrimaria,
          dimensaoUtilizada: dim.nome,
          dicaProfissional:
            'Ordene sempre as barras do maior para o menor valor (ordem decrescente) para facilitar identificação imediata dos líderes de resultado.',
          aprendaEnquantoTrabalha:
            'O cérebro humano compara comprimentos em uma linha de base comum com maior precisão do que ângulos ou áreas.',
        },
        alternativasRecomendadas: [
          {
            tipoVisual: TipoVisualDashboard.GRAFICO_COLUNAS,
            titulo: 'Gráfico de Colunas Verticais',
            justificativaAlternativa: 'Adequado somente quando os nomes das categorias forem muito curtos (ex: siglas de 2 ou 3 letras).',
            vantagem: 'Familiaridade com formato vertical.',
            desvantagem: 'Texto inclinado ou truncado prejudica ergonomia de leitura.',
          },
          {
            tipoVisual: TipoVisualDashboard.MATRIZ_TABELA,
            titulo: 'Tabela com Barra de Dados Embutida',
            justificativaAlternativa: 'Excelente para quando os usuários precisarem ver tanto o valor exato quanto a proporção visual.',
            vantagem: 'Precisão tabular com sinal visual gráfico.',
            desvantagem: 'Maior densidade de números na tela.',
          },
        ],
      });
    }

    // 4.4 Detalhamento em Matriz (se template analítico ou operacional)
    if (
      templateDesejado === TipoTemplateDashboard.ANALYTICAL_PREMIUM ||
      templateDesejado === TipoTemplateDashboard.OPERATIONAL_PREMIUM
    ) {
      visuaisPagina1.push({
        id: `vis_spec_${demandaId}_matriz_detalhe`,
        titulo: `Detalhamento Multidimensional de ${nomeMetricaPrimaria}`,
        tipoVisual: TipoVisualDashboard.MATRIZ_TABELA,
        posicaoLayout: PosicaoLayoutVisual.INFERIOR_DETALHES,
        larguraColunas: 12,
        ordem: ordemVisual++,
        medidaDaxId: medidaDaxPrimaria?.id ?? null,
        medidaDaxNome: medidaDaxPrimaria?.nome ?? null,
        metricaAnaliticaId: metricaPrimaria?.id ?? null,
        metricaAnaliticaNome: metricaPrimaria?.nome ?? null,
        atributosUtilizadosIds: [],
        statusAprovacao: 'PROPOSTO',
        dependenciaDaxPendente: !medidaDaxPrimaria,
        justificativaDataViz: {
          oQueFoiEscolhido: 'Tabela / Matriz Estruturada',
          porQueFoiEscolhido:
            'Permite conciliar valores exatos, múltiplos indicadores simultâneos e hierarquias com capacidade de drill-down para auditoria detalhada.',
          perguntaRespondida:
            perguntasNegocio[perguntasNegocio.length - 1] ||
            'Qual é a abertura completa dos registros e indicadores?',
          metricaUtilizada: nomeMetricaPrimaria,
          dicaProfissional:
            'Use formatação condicional sutil (como gradientes suaves de fundo ou barras de dados) para guiar o olhar para desvios sem transformar a tabela em poluição visual.',
          aprendaEnquantoTrabalha:
            'Matrizes são ferramentas de consulta e detalhamento analítico, enquanto gráficos são instrumentos de descoberta de padrões e tendências.',
        },
        alternativasRecomendadas: [],
      });
    }

    // Adiciona Página 1
    paginasPropostas.push({
      id: `pag_spec_${demandaId}_visao_geral`,
      nome: templateDef.paginasBase[0]?.nomeSugerido || 'Visão Executiva',
      objetivoAnalitico:
        demandaObjetivo ||
        templateDef.paginasBase[0]?.objetivoAnalitico ||
        `Síntese gerencial de indicadores para apoiar decisões estratégicas sobre ${demandaTitulo}.`,
      publicoAlvo: templateDef.publicoAlvoPrincipal,
      layoutGrid: LayoutGridPagina.PADRAO_16_9,
      ordem: 1,
      perguntasAtendidas:
        perguntasNegocio.length > 0
          ? perguntasNegocio
          : [`Qual o status e desempenho consolidado de ${nomeMetricaPrimaria}?`],
      narrativa:
        'A página inicia com síntese de cartões de topo para resposta executiva imediata, conecta a trajetória temporal de evolução e decompõe o resultado por categorias principais.',
      justificativa:
        'Segue o princípio de pirâmide invertida de DataViz: Resumo no topo -> Contexto no centro -> Detalhes na base.',
      statusAprovacao: 'PROPOSTO',
      visuais: visuaisPagina1,
    });

    const totalVisuais = paginasPropostas.reduce((acc, p) => acc + p.visuais.length, 0);

    return {
      demandaId,
      modeloPowerBiId,
      templateUtilizado: templateDesejado,
      modoTrabalho,
      titulo: `Dashboard — ${demandaTitulo}`,
      resumoExecutivo: `Proposta gerada automaticamente com base em ${metricasHomologadas.length} métrica(s) homologada(s), ${medidasDaxExistentes.length} medida(s) DAX e ${entidadesAnaliticas.length} entidade(s) dimensional(is).`,
      designTokens: DEFAULT_PREMIUM_DESIGN_TOKENS,
      paginas: paginasPropostas,
      totalPaginas: paginasPropostas.length,
      totalVisuais,
      statusGeral: 'PROPOSTO',
      geradoEm: agora,
    };
  }

  /**
   * Regeneração granular determinística de uma alternativa para visual específico
   */
  public static gerarAlternativaVisual(
    visualAtual: VisualSpecification,
    tipoAlternativo: TipoVisualDashboard
  ): VisualSpecification {
    let novaJustificativa: string;
    let novaPosicao = visualAtual.posicaoLayout;

    if (tipoAlternativo === TipoVisualDashboard.GRAFICO_COLUNAS) {
      novaJustificativa =
        'Gráfico de Colunas Verticais selecionado como alternativa. Ideal para séries temporais curtas ou categorias com nomes curtos.';
    } else if (tipoAlternativo === TipoVisualDashboard.GRAFICO_BARRAS) {
      novaJustificativa =
        'Gráfico de Barras Horizontais selecionado como alternativa. Proporciona melhor legibilidade para rankings e comparações de categorias com rótulos longos.';
    } else if (tipoAlternativo === TipoVisualDashboard.GRAFICO_LINHAS) {
      novaJustificativa =
        'Gráfico de Linhas selecionado como alternativa. Enfatiza a taxa de variação contínua entre pontos no tempo.';
    } else if (tipoAlternativo === TipoVisualDashboard.MATRIZ_TABELA) {
      novaJustificativa =
        'Matriz Tabela selecionada como alternativa. Prioriza precisão numérica exata e múltiplos indicadores.';
      novaPosicao = PosicaoLayoutVisual.INFERIOR_DETALHES;
    } else {
      novaJustificativa = `Visual alterado para ${tipoAlternativo} sob solicitação do usuário.`;
    }

    return {
      ...visualAtual,
      tipoVisual: tipoAlternativo,
      posicaoLayout: novaPosicao,
      statusAprovacao: 'EM_REVISAO',
      justificativaDataViz: {
        ...visualAtual.justificativaDataViz,
        oQueFoiEscolhido:
          ROTULOS_TIPO_VISUAL_DASHBOARD[tipoAlternativo] || `Alternativa: ${tipoAlternativo}`,
        porQueFoiEscolhido: novaJustificativa,
      },
    };
  }
}
