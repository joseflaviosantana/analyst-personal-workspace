/**
 * tests/unit/dashboard/dashboard-planner-engine.spec.ts
 *
 * Suíte de Testes Unitários do Dashboard Planner Engine e Design System (Subgate 3.4D)
 *
 * Cobertura:
 * 1. Geração determinística (idempotência: mesmo contexto produz a mesma especificação);
 * 2. Contexto vazio ou insuficiente: não inventar visuais sem evidências (declarar contextoInsuficiente);
 * 3. Detecção temporal: dimensão data/calendário -> GRAFICO_LINHAS em CENTRAL_TENDENCIAS;
 * 4. Comparação categórica: dimensão categórica -> GRAFICO_BARRAS com justificativa para rótulos longos;
 * 5. Métrica norteadora escalar -> CARTAO_KPI no slot TOPO_KPIS;
 * 6. Decomposição de detalhe -> MATRIZ_TABELA no slot INFERIOR_DETALHES;
 * 7. Rastreabilidade ponta a ponta: pergunta -> métrica -> medida DAX -> visual -> página;
 * 8. Sinalização de dependência DAX pendente (métrica sem medida DAX implementada);
 * 9. Regeneração granular não destrutiva de alternativas (gerarAlternativaVisual);
 * 10. Catálogo de templates premium (EXECUTIVE_PREMIUM, ANALYTICAL_PREMIUM, OPERATIONAL_PREMIUM);
 * 11. Imutabilidade e consistência dos tokens de Design System (grid 16:9, cores, espaçamento).
 */

import { describe, it, expect } from 'vitest';
import {
  DashboardPlannerEngine,
  ContextoPlanejamentoDashboard,
} from '@/core/domain/dashboard-automation/dashboard-planner-engine';
import {
  TipoTemplateDashboard,
  CATALOGO_TEMPLATES_PREMIUM,
  TEMPLATES_PREMIUM_DASHBOARD,
} from '@/core/domain/dashboard-design/dashboard-template';
import { DEFAULT_PREMIUM_DESIGN_TOKENS } from '@/core/domain/dashboard-design/design-tokens';
import { TipoVisualDashboard } from '@/core/domain/enums/tipo-visual-dashboard';
import { PosicaoLayoutVisual } from '@/core/domain/enums/posicao-layout-visual';
import { PublicoAlvoPagina } from '@/core/domain/enums/publico-alvo-pagina';
import { TipoAgregacaoMetrica } from '@/core/domain/enums/tipo-agregacao-metrica';
import { CategoriaMedidaDax } from '@/core/domain/enums/categoria-medida-dax';
import { TipoEntidadeAnalitica } from '@/core/domain/enums/tipo-entidade-analitica';
import { PapelAtributoAnalitico } from '@/core/domain/enums/papel-atributo-analitico';
import { TipoDadoAnalitico } from '@/core/domain/enums/tipo-dado-analitico';
import { StatusMetricaAnalitica } from '@/core/domain/enums/status-metrica-analitica';
import { TipoAditividadeMetrica } from '@/core/domain/enums/tipo-aditividade-metrica';
import { UnidadeMedidaMetrica } from '@/core/domain/enums/unidade-medida-metrica';
import { MetricaAnalitica } from '@/core/domain/entities/metrica-analitica';
import { MedidaDax } from '@/core/domain/entities/medida-dax';

describe('DashboardPlannerEngine — Automação Determinística e Dataviz (Subgate 3.4D)', () => {
  const DEMANDA_ID = 'dem-100';
  const MODELO_PBI_ID = 'pbi-200';

  const metricaReceita: MetricaAnalitica = {
    id: 'met-1',
    modelo_id: 'mod-1',
    entidade_id: 'ent-fato-vendas',
    nome: 'Receita Total',
    descricao: 'Indicador essencial de faturamento.',
    tipo_agregacao: TipoAgregacaoMetrica.SOMA,
    tipo_aditividade: TipoAditividadeMetrica.TOTALMENTE_ADITIVA,
    formula_declarativa: 'SUM(fVendas[ValorVenda])',
    unidade_medida: UnidadeMedidaMetrica.MOEDA,
    formato_exibicao: 'R$ #,##0.00',
    status: StatusMetricaAnalitica.HOMOLOGADA,
    atributos_dependentes_ids: ['atr-valor-venda'],
    metricas_dependentes_ids: [],
    pergunta_negocio_associada: 'Qual o volume total de vendas gerado?',
    objetivo_negocio_associado: 'Acompanhar faturamento',
    ordem: 1,
    criado_em: '2026-09-30T10:00:00Z',
    atualizado_em: '2026-09-30T10:00:00Z',
  };

  const medidaReceitaDax: MedidaDax = {
    id: 'dax-1',
    modelo_powerbi_id: MODELO_PBI_ID,
    metrica_analitica_id: 'met-1',
    nome: 'Receita Total',
    tabela_hospedeira: 'fVendas',
    expressao_dax: 'SUM(fVendas[ValorVenda])',
    descricao: 'Soma total do valor das vendas',
    formato_string: 'R$ #,##0.00',
    categoria_dax: CategoriaMedidaDax.AGREGACAO_SIMPLES,
    ordem: 1,
    criado_em: '2026-09-30T10:00:00Z',
    atualizado_em: '2026-09-30T10:00:00Z',
  };

  const dimCalendario = {
    id: 'ent-dim-tempo',
    nome: 'dCalendario',
    tipo: TipoEntidadeAnalitica.DIMENSAO,
    atributos: [
      {
        id: 'atr-data',
        nome: 'Data',
        papel: PapelAtributoAnalitico.DIMENSAO_TEMPO,
        tipo_dado: TipoDadoAnalitico.DATA,
      },
      {
        id: 'atr-mes-ano',
        nome: 'MesAno',
        papel: PapelAtributoAnalitico.ATRIBUTO_DESCRITIVO,
        tipo_dado: TipoDadoAnalitico.TEXTO,
      },
    ],
  };

  const dimCliente = {
    id: 'ent-dim-cliente',
    nome: 'dCliente',
    tipo: TipoEntidadeAnalitica.DIMENSAO,
    atributos: [
      {
        id: 'atr-nome-cliente',
        nome: 'Nome do Cliente',
        papel: PapelAtributoAnalitico.ATRIBUTO_DESCRITIVO,
        tipo_dado: TipoDadoAnalitico.TEXTO,
      },
      {
        id: 'atr-segmento',
        nome: 'Segmento',
        papel: PapelAtributoAnalitico.ATRIBUTO_DESCRITIVO,
        tipo_dado: TipoDadoAnalitico.TEXTO,
      },
    ],
  };

  it('1. GERAÇÃO DETERMINÍSTICA: executar 2 vezes com o mesmo contexto produz propostas idênticas', () => {
    const contexto: ContextoPlanejamentoDashboard = {
      demandaId: DEMANDA_ID,
      demandaTitulo: 'Dashboard de Vendas Corporativas',
      demandaObjetivo: 'Acompanhar faturamento e evolução por cliente.',
      perguntasNegocio: ['Qual o faturamento mensal?', 'Quais os clientes líderes?'],
      modeloPowerBiId: MODELO_PBI_ID,
      modeloAnaliticoNome: 'Modelo Vendas Star Schema',
      metricasHomologadas: [metricaReceita],
      medidasDaxExistentes: [medidaReceitaDax],
      entidadesAnaliticas: [dimCalendario, dimCliente],
      templateDesejado: TipoTemplateDashboard.EXECUTIVE_PREMIUM,
      modoTrabalho: 'AUTOMATICO',
    };

    const proposta1 = DashboardPlannerEngine.planejar(contexto);
    const proposta2 = DashboardPlannerEngine.planejar(contexto);

    expect(proposta1.totalPaginas).toBe(proposta2.totalPaginas);
    expect(proposta1.totalVisuais).toBe(proposta2.totalVisuais);
    expect(proposta1.templateUtilizado).toBe(proposta2.templateUtilizado);
    expect(proposta1.paginas[0].nome).toBe(proposta2.paginas[0].nome);
    expect(proposta1.paginas[0].visuais.map((v) => v.tipoVisual)).toEqual(
      proposta2.paginas[0].visuais.map((v) => v.tipoVisual)
    );
  });

  it('2. CONTEXTO INSUFICIENTE: quando não há métricas nem medidas, declara contextoInsuficiente e não inventa visuais', () => {
    const contextoVazio: ContextoPlanejamentoDashboard = {
      demandaId: DEMANDA_ID,
      demandaTitulo: 'Projeto sem dados ainda',
      perguntasNegocio: [],
      modeloPowerBiId: MODELO_PBI_ID,
      metricasHomologadas: [],
      medidasDaxExistentes: [],
      entidadesAnaliticas: [],
      modoTrabalho: 'AUTOMATICO',
    };

    const proposta = DashboardPlannerEngine.planejar(contextoVazio);

    expect(proposta.contextoInsuficiente).toBe(true);
    expect(proposta.totalVisuais).toBe(0);
    expect(proposta.mensagemContexto).toContain('Nenhuma métrica analítica homologada');
  });

  it('3. DETECÇÃO TEMPORAL: presença de dimensão temporal gera GRAFICO_LINHAS com justificativa de série contínua', () => {
    const contexto: ContextoPlanejamentoDashboard = {
      demandaId: DEMANDA_ID,
      demandaTitulo: 'Painel Comercial',
      perguntasNegocio: ['Como a receita evoluiu ao longo do tempo?'],
      modeloPowerBiId: MODELO_PBI_ID,
      metricasHomologadas: [metricaReceita],
      medidasDaxExistentes: [medidaReceitaDax],
      entidadesAnaliticas: [dimCalendario],
      templateDesejado: TipoTemplateDashboard.EXECUTIVE_PREMIUM,
    };

    const proposta = DashboardPlannerEngine.planejar(contexto);
    const visualLinhas = proposta.paginas[0].visuais.find(
      (v) => v.tipoVisual === TipoVisualDashboard.GRAFICO_LINHAS
    );

    expect(visualLinhas).toBeDefined();
    expect(visualLinhas?.posicaoLayout).toBe(PosicaoLayoutVisual.CENTRAL_TENDENCIAS);
    expect(visualLinhas?.justificativaDataViz.oQueFoiEscolhido).toContain('Gráfico de Linhas');
    expect(visualLinhas?.justificativaDataViz.dicaProfissional).toContain('eixo Y com escala iniciando em zero');
    expect(visualLinhas?.medidaDaxId).toBe(medidaReceitaDax.id);
  });

  it('4. COMPARAÇÃO CATEGÓRICA: presença de dimensão de texto gera GRAFICO_BARRAS com justificativa de rótulos longos', () => {
    const contexto: ContextoPlanejamentoDashboard = {
      demandaId: DEMANDA_ID,
      demandaTitulo: 'Painel Comercial',
      perguntasNegocio: ['Qual o ranking por cliente?'],
      modeloPowerBiId: MODELO_PBI_ID,
      metricasHomologadas: [metricaReceita],
      medidasDaxExistentes: [medidaReceitaDax],
      entidadesAnaliticas: [dimCliente],
      templateDesejado: TipoTemplateDashboard.EXECUTIVE_PREMIUM,
    };

    const proposta = DashboardPlannerEngine.planejar(contexto);
    const visualBarras = proposta.paginas[0].visuais.find(
      (v) => v.tipoVisual === TipoVisualDashboard.GRAFICO_BARRAS
    );

    expect(visualBarras).toBeDefined();
    expect(visualBarras?.justificativaDataViz.oQueFoiEscolhido).toContain('Barras Horizontais');
    expect(visualBarras?.justificativaDataViz.dicaProfissional).toContain('decrescente');
    expect(visualBarras?.medidaDaxId).toBe(medidaReceitaDax.id);
  });

  it('5. VALOR ESCALAR / KPI: métrica primária gera CARTAO_KPI no topo da página', () => {
    const contexto: ContextoPlanejamentoDashboard = {
      demandaId: DEMANDA_ID,
      demandaTitulo: 'Painel Executivo',
      perguntasNegocio: ['Qual o total faturado no período?'],
      modeloPowerBiId: MODELO_PBI_ID,
      metricasHomologadas: [metricaReceita],
      medidasDaxExistentes: [medidaReceitaDax],
      entidadesAnaliticas: [dimCalendario],
      templateDesejado: TipoTemplateDashboard.EXECUTIVE_PREMIUM,
    };

    const proposta = DashboardPlannerEngine.planejar(contexto);
    const kpiVisual = proposta.paginas[0].visuais.find(
      (v) => v.tipoVisual === TipoVisualDashboard.CARTAO_KPI
    );

    expect(kpiVisual).toBeDefined();
    expect(kpiVisual?.posicaoLayout).toBe(PosicaoLayoutVisual.TOPO_KPIS);
    expect(kpiVisual?.justificativaDataViz.oQueFoiEscolhido).toContain('Cartão');
  });

  it('6. DETALHE TABULAR: template analítico gera MATRIZ_TABELA no slot INFERIOR_DETALHES', () => {
    const contexto: ContextoPlanejamentoDashboard = {
      demandaId: DEMANDA_ID,
      demandaTitulo: 'Painel Analítico Detalhado',
      perguntasNegocio: ['Conferência de vendas por cliente e período'],
      modeloPowerBiId: MODELO_PBI_ID,
      metricasHomologadas: [metricaReceita],
      medidasDaxExistentes: [medidaReceitaDax],
      entidadesAnaliticas: [dimCalendario, dimCliente],
      templateDesejado: TipoTemplateDashboard.ANALYTICAL_PREMIUM,
    };

    const proposta = DashboardPlannerEngine.planejar(contexto);
    const matrizVisual = proposta.paginas[0].visuais.find(
      (v) => v.tipoVisual === TipoVisualDashboard.MATRIZ_TABELA
    );

    expect(matrizVisual).toBeDefined();
    expect(matrizVisual?.posicaoLayout).toBe(PosicaoLayoutVisual.INFERIOR_DETALHES);
    expect(matrizVisual?.justificativaDataViz.oQueFoiEscolhido).toContain('Matriz');
  });

  it('7. RASTREABILIDADE E DEPENDÊNCIA DAX PENDENTE: marca dependenciaDaxPendente quando não há medida criada', () => {
    const metricaSemDax: MetricaAnalitica = {
      ...metricaReceita,
      id: 'met-sem-dax',
      nome: 'Margem de Contribuição',
    };

    const contexto: ContextoPlanejamentoDashboard = {
      demandaId: DEMANDA_ID,
      demandaTitulo: 'Painel com Métrica Pendente',
      perguntasNegocio: ['Qual a margem de contribuição?'],
      modeloPowerBiId: MODELO_PBI_ID,
      metricasHomologadas: [metricaSemDax],
      medidasDaxExistentes: [], // Nenhuma medida implementada ainda
      entidadesAnaliticas: [dimCalendario],
      templateDesejado: TipoTemplateDashboard.EXECUTIVE_PREMIUM,
    };

    const proposta = DashboardPlannerEngine.planejar(contexto);
    const visual = proposta.paginas[0].visuais[0];

    expect(visual.dependenciaDaxPendente).toBe(true);
    expect(visual.medidaDaxId).toBeNull();
    expect(visual.metricaAnaliticaId).toBe('met-sem-dax');
  });

  it('8. REGENERAÇÃO GRANULAR: trocar tipo de visual mantém identificador e rastreabilidade da métrica/medida', () => {
    const contexto: ContextoPlanejamentoDashboard = {
      demandaId: DEMANDA_ID,
      demandaTitulo: 'Painel Comercial',
      perguntasNegocio: ['Evolução de faturamento'],
      modeloPowerBiId: MODELO_PBI_ID,
      metricasHomologadas: [metricaReceita],
      medidasDaxExistentes: [medidaReceitaDax],
      entidadesAnaliticas: [dimCalendario],
    };

    const proposta = DashboardPlannerEngine.planejar(contexto);
    const visualOriginal = proposta.paginas[0].visuais.find(
      (v) => v.tipoVisual === TipoVisualDashboard.GRAFICO_LINHAS
    )!;

    expect(visualOriginal).toBeDefined();

    // Regenerar visual especificamente para GRAFICO_COLUNAS
    const visualRegenerado = DashboardPlannerEngine.gerarAlternativaVisual(
      visualOriginal,
      TipoVisualDashboard.GRAFICO_COLUNAS
    );

    expect(visualRegenerado.id).toBe(visualOriginal.id);
    expect(visualRegenerado.medidaDaxId).toBe(visualOriginal.medidaDaxId);
    expect(visualRegenerado.tipoVisual).toBe(TipoVisualDashboard.GRAFICO_COLUNAS);
    expect(visualRegenerado.justificativaDataViz.oQueFoiEscolhido).toContain('Colunas');
    expect(visualRegenerado.statusAprovacao).toBe('EM_REVISAO');
  });

  it('9. TEMPLATES PREMIUM: todos os templates do catálogo são estruturais e definem densidade e público-alvo', () => {
    expect(TEMPLATES_PREMIUM_DASHBOARD.length).toBe(3);

    const exec = CATALOGO_TEMPLATES_PREMIUM[TipoTemplateDashboard.EXECUTIVE_PREMIUM];
    expect(exec.publicoAlvoPrincipal).toBe(PublicoAlvoPagina.EXECUTIVO);
    expect(exec.densidadeVisual).toBe('BAIXA');
    expect(exec.paginasBase.length).toBeGreaterThan(0);

    const analitico = CATALOGO_TEMPLATES_PREMIUM[TipoTemplateDashboard.ANALYTICAL_PREMIUM];
    expect(analitico.publicoAlvoPrincipal).toBe(PublicoAlvoPagina.GERENCIAL);
    expect(analitico.densidadeVisual).toBe('MEDIA');

    const operacional = CATALOGO_TEMPLATES_PREMIUM[TipoTemplateDashboard.OPERATIONAL_PREMIUM];
    expect(operacional.publicoAlvoPrincipal).toBe(PublicoAlvoPagina.OPERACIONAL);
    expect(operacional.densidadeVisual).toBe('ALTA');
  });

  it('10. DESIGN SYSTEM TOKENS: tokens determinísticos respeitam proporção 16:9 e diretrizes dark mode', () => {
    const tokens = DEFAULT_PREMIUM_DESIGN_TOKENS;

    expect(tokens.grid.baseWidth).toBe(1280);
    expect(tokens.grid.baseHeight).toBe(720);
    expect(tokens.grid.aspectRatio).toBe('16:9');
    expect(tokens.grid.columns).toBe(12);
    expect(tokens.grid.margin).toBe(24);
    expect(tokens.grid.gutter).toBe(16);
    expect(tokens.surface.backgroundCanvas).toBe('#0b0f19');
    expect(tokens.surface.backgroundCard).toBe('#111827');
  });
});
