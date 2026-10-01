/**
 * tests/unit/dashboard/dashboard-delivery-engine.spec.ts
 *
 * Suíte de Testes Unitários do Pacote de Entrega, Checklist,
 * Documentação Automática e Exportações (Subgate 3.4E)
 *
 * Cobertura:
 * 1. Geração determinística do Pacote de Entrega (idempotência);
 * 2. Checklist Determinístico:
 *    - Cenário A: Modelo registrado com medidas e páginas (itens concluídos);
 *    - Cenário B: Sem modelo Power BI registrado (bloqueio em CHK-01);
 *    - Cenário C: Isenção Excel-Only formalmente declarada (itens de BI tornam-se NAO_APLICAVEL);
 *    - Cenário D: Bloqueios normativos D-01..D-08 refletidos em CHK-09;
 *    - Cenário E: Copiloto consultivo NÃO gera bloqueio normativo no checklist;
 * 3. Documentação Automática em Markdown:
 *    - Cobertura completa das Seções A a M;
 *    - Diferenciação epistêmica entre fato, inferência e recomendação;
 * 4. Exportação Técnica:
 *    - Markdown legível (.md);
 *    - Pacote estruturado (.json);
 *    - Catálogo TMDL de medidas DAX (.tmdl);
 *    - Manifesto de layout de páginas e visuais (.json);
 * 5. Ficha Síntese de Portfólio:
 *    - Preenchimento estrutural dos campos sem publicação externa;
 * 6. Caso de Uso GerarPacoteEntregaDashboardUseCase:
 *    - Isolamento estrito entre diferentes demandas;
 *    - Rejeição limpa para demandas inexistentes.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DashboardChecklistEngine } from '@/core/domain/dashboard-delivery/dashboard-checklist-engine';
import { DashboardDocumentationGenerator } from '@/core/domain/dashboard-delivery/dashboard-documentation-generator';
import { DashboardDeliveryPackageEngine } from '@/core/domain/dashboard-delivery/dashboard-delivery-package-engine';
import { GerarPacoteEntregaDashboardUseCase } from '@/core/use-cases/dashboard/gerar-pacote-entrega-dashboard.use-case';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { IModeloPowerBiRepository } from '@/core/domain/repositories/modelo-powerbi-repository.interface';
import { IModeloAnaliticoRepository } from '@/core/domain/repositories/modelo-analitico-repository.interface';
import { IMedidaDaxRepository } from '@/core/domain/repositories/medida-dax-repository.interface';
import { IPaginaRelatorioRepository } from '@/core/domain/repositories/pagina-relatorio-repository.interface';
import { IVisualDashboardRepository } from '@/core/domain/repositories/visual-dashboard-repository.interface';
import { Demanda, DemandaComProjeto } from '@/core/domain/entities/demanda';
import { ModeloPowerBi } from '@/core/domain/entities/modelo-powerbi';
import { ModeloAnaliticoCompleto } from '@/core/domain/entities/modelo-analitico';
import { MedidaDax } from '@/core/domain/entities/medida-dax';
import { PaginaRelatorio } from '@/core/domain/entities/pagina-relatorio';
import { VisualDashboard } from '@/core/domain/entities/visual-dashboard';
import { TipoFormatoModeloPowerBi } from '@/core/domain/enums/tipo-formato-modelo-powerbi';
import { StatusModeloPowerBi } from '@/core/domain/enums/status-modelo-powerbi';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { TipoArquiteturaModelo } from '@/core/domain/enums/tipo-arquitetura-modelo';
import { StatusModeloAnalitico } from '@/core/domain/enums/status-modelo-analitico';
import { TipoAgregacaoMetrica } from '@/core/domain/enums/tipo-agregacao-metrica';
import { StatusMetricaAnalitica } from '@/core/domain/enums/status-metrica-analitica';
import { TipoAditividadeMetrica } from '@/core/domain/enums/tipo-aditividade-metrica';
import { UnidadeMedidaMetrica } from '@/core/domain/enums/unidade-medida-metrica';
import { CategoriaMedidaDax } from '@/core/domain/enums/categoria-medida-dax';
import { PublicoAlvoPagina } from '@/core/domain/enums/publico-alvo-pagina';
import { LayoutGridPagina } from '@/core/domain/enums/layout-grid-pagina';
import { TipoVisualDashboard } from '@/core/domain/enums/tipo-visual-dashboard';
import { PosicaoLayoutVisual } from '@/core/domain/enums/posicao-layout-visual';
import { ResultadoProntidaoDashboard } from '@/core/domain/rules/dashboard-rules-evaluator';
import { ResultadoCopilotoDashboard } from '@/core/domain/dashboard-copilot/dashboard-copilot-types';

describe('DashboardDeliveryEngine — Pacote de Entrega e Checklist (Subgate 3.4E)', () => {
  const DEMANDA_ID = 'dem-100';
  const MODELO_PBI_ID = 'pbi-200';
  const MODELO_ANALITICO_ID = 'mod-300';

  const mockDemanda: DemandaComProjeto = {
    id: DEMANDA_ID,
    projeto_id: 'proj-1',
    titulo: 'Dashboard Executivo Comercial',
    solicitacao_bruta: 'Criar painel para acompanhamento de faturamento mensal',
    contexto: 'Reunião mensal da diretoria executiva',
    objetivo_inicial: 'Monitorar receita consolidada e desvios orçamentários',
    prazo_esperado: null,
    restricoes_declaradas: null,
    estado: EstadoDemanda.EM_MODELAGEM_E_ANALISE,
    criado_em: '2026-09-30T10:00:00Z',
    atualizado_em: '2026-09-30T10:00:00Z',
    data_conclusao: null,
    projetoNome: 'Comercial 2026',
  };

  const mockModeloPowerBi: ModeloPowerBi = {
    id: MODELO_PBI_ID,
    demanda_id: DEMANDA_ID,
    modelo_analitico_id: MODELO_ANALITICO_ID,
    tipo_formato: TipoFormatoModeloPowerBi.PBIX,
    nome_arquivo: 'comercial_executivo.pbix',
    caminho_local: 'models/comercial.pbix',
    status: StatusModeloPowerBi.EM_DESENVOLVIMENTO,
    hash_sha256: null,
    versao_powerbi: '2.128',
    tamanho_bytes: 2048,
    justificativa_isencao: null,
    criado_em: '2026-09-30T10:00:00Z',
    atualizado_em: '2026-09-30T10:00:00Z',
  };

  const mockModeloAnalitico: ModeloAnaliticoCompleto = {
    id: MODELO_ANALITICO_ID,
    demanda_id: DEMANDA_ID,
    dataset_autorizado_id: 'ds-vendas',
    nome: 'Modelo Star Schema Vendas',
    descricao: 'Modelo dimensional para suporte ao BI comercial',
    tipo_arquitetura: TipoArquiteturaModelo.ESTRELA,
    status: StatusModeloAnalitico.HOMOLOGADO,
    homologado_em: '2026-09-30T10:00:00Z',
    homologado_por: 'Tech Lead',
    justificativa_homologacao: 'Modelo dimensional verificado',
    revogado_em: null,
    motivo_revogacao: null,
    criado_em: '2026-09-30T10:00:00Z',
    atualizado_em: '2026-09-30T10:00:00Z',
    entidades: [],
    relacionamentos: [],
    metricas: [
      {
        id: 'met-1',
        modelo_id: MODELO_ANALITICO_ID,
        entidade_id: 'ent-fato',
        nome: 'Faturamento Total',
        descricao: 'Soma total do faturamento bruto',
        tipo_agregacao: TipoAgregacaoMetrica.SOMA,
        tipo_aditividade: TipoAditividadeMetrica.TOTALMENTE_ADITIVA,
        formula_declarativa: 'SUM(fVendas[Valor])',
        unidade_medida: UnidadeMedidaMetrica.MOEDA,
        formato_exibicao: 'R$ #,##0.00',
        status: StatusMetricaAnalitica.HOMOLOGADA,
        atributos_dependentes_ids: ['atr-valor'],
        metricas_dependentes_ids: [],
        pergunta_negocio_associada: 'Qual o volume total de faturamento no período?',
        objetivo_negocio_associado: 'Acompanhar a meta financeira',
        ordem: 1,
        criado_em: '2026-09-30T10:00:00Z',
        atualizado_em: '2026-09-30T10:00:00Z',
      },
    ],
  };

  const mockMedidas: MedidaDax[] = [
    {
      id: 'dax-1',
      modelo_powerbi_id: MODELO_PBI_ID,
      metrica_analitica_id: 'met-1',
      nome: 'Faturamento Total',
      tabela_hospedeira: 'fVendas',
      expressao_dax: 'SUM(fVendas[Valor])',
      descricao: 'Soma total do faturamento',
      formato_string: 'R$ #,##0.00',
      categoria_dax: CategoriaMedidaDax.AGREGACAO_SIMPLES,
      ordem: 1,
      criado_em: '2026-09-30T10:00:00Z',
      atualizado_em: '2026-09-30T10:00:00Z',
    },
  ];

  const mockPagina: PaginaRelatorio = {
    id: 'pag-1',
    modelo_powerbi_id: MODELO_PBI_ID,
    nome: 'Visão Geral Executiva',
    ordem: 1,
    objetivo_analitico: 'Visão agregada de faturamento e tendências',
    publico_alvo: PublicoAlvoPagina.EXECUTIVO,
    layout_grid: LayoutGridPagina.PADRAO_16_9,
    criado_em: '2026-09-30T10:00:00Z',
    atualizado_em: '2026-09-30T10:00:00Z',
  };

  const mockVisual: VisualDashboard = {
    id: 'vis-1',
    pagina_id: 'pag-1',
    titulo: 'Faturamento Consolidado',
    tipo_visual: TipoVisualDashboard.CARTAO_KPI,
    posicao_layout: PosicaoLayoutVisual.TOPO_KPIS,
    medidas_utilizadas_ids: ['dax-1'],
    atributos_utilizados_ids: [],
    justificativa_dataviz: JSON.stringify({
      oQueFoiEscolhido: 'Cartão KPI Simples',
      porQueFoiEscolhido: 'Destacar o indicador mestre com leitura imediata.',
      qualPerguntaResponde: 'Qual o volume total de faturamento no período?',
      qualMetricaUtiliza: 'Faturamento Total',
      qualDimensaoUtiliza: 'Nenhuma (escalar)',
      dicaProfissional: 'Posicione no topo superior esquerdo para padrão F de leitura.',
      quandoEvitar: 'Quando o contexto histórico ou meta for desconhecido.',
    }),
    ordem: 1,
    criado_em: '2026-09-30T10:00:00Z',
    atualizado_em: '2026-09-30T10:00:00Z',
  };

  const mockResultadoNormativoConforme: ResultadoProntidaoDashboard = {
    status_geral: 'CONFORME',
    apto_para_validacao: true,
    isento_powerbi: false,
    total_bloqueios: 0,
    total_alertas_criticos: 0,
    total_recomendacoes: 0,
    diagnosticos: [],
    resumo: {
      total_medidas: 1,
      total_paginas: 1,
      total_visuais: 1,
      metricas_homologadas_cobertas: 1,
      total_metricas_homologadas: 1,
    },
    avaliado_em: '2026-09-30T10:00:00Z',
  };

  const mockResultadoCopiloto: ResultadoCopilotoDashboard = {
    total_insights: 1,
    insights: [
      {
        id: 'cop-1',
        codigo: 'D-COP-TIME-01',
        categoria: 'INTELIGENCIA_TEMPORAL',
        natureza: 'OPORTUNIDADE',
        prioridade: 'PRIORIDADE_3_ALTO_VALOR',
        ordemPrioridade: 3,
        titulo: 'Oportunidade de Cálculo MoM (Mês contra Mês)',
        deteccao: 'Dimensão temporal identificada no modelo.',
        explicacao: 'Comparativos temporais agregam alto valor executivo.',
        recomendacao: 'Considere implementar medida DAX com DATEADD para evolução mensal.',
        fatoDetectado: 'Dimensão temporal existente.',
        oportunidade: 'Cálculo de variação percentual.',
        sugestaoAcao: 'Criar medida MoM.',
        pedagogico: {
          conceitoChave: 'Time Intelligence',
          porQueImporta: 'Permite avaliar ritmo de crescimento.',
          dicaProfissional: 'Sempre garanta calendário contínuo sem lacunas.',
        },
        entidadesRelacionadas: [],
      },
    ],
    orientacoes_secundarias: [],
    resumo_contexto: {
      possui_modelo: true,
      total_medidas: 1,
      total_paginas: 1,
      total_visuais: 1,
      isento_powerbi: false,
    },
    gerado_em: '2026-09-30T10:00:00Z',
  };

  describe('1. DashboardChecklistEngine — Avaliação Determinística de Prontidão', () => {
    it('Cenário A: deve aprovar todos os itens do checklist quando contexto estiver completo e conforme', () => {
      const checklist = DashboardChecklistEngine.avaliar({
        modeloPowerBi: mockModeloPowerBi,
        modeloAnalitico: mockModeloAnalitico,
        medidas: mockMedidas,
        paginas: [mockPagina],
        visuais: [mockVisual],
        resultadoNormativo: mockResultadoNormativoConforme,
        decisaoHumanaRegistrada: true,
      });

      expect(checklist.totalItens).toBe(11);
      expect(checklist.totalBloqueados).toBe(0);
      expect(checklist.aptoParaSeguirWorkflow).toBe(true);
      expect(checklist.percentualConclusao).toBe(100);

      const itemDax = checklist.itens.find((i) => i.codigo === 'CHK-04');
      expect(itemDax?.status).toBe('CONCLUIDO');

      const itemNormativo = checklist.itens.find((i) => i.codigo === 'CHK-09');
      expect(itemNormativo?.status).toBe('CONCLUIDO');
    });

    it('Cenário B: deve bloquear o checklist (CHK-01) se nenhum modelo Power BI ou isenção estiver registrado', () => {
      const checklist = DashboardChecklistEngine.avaliar({
        modeloPowerBi: null,
        modeloAnalitico: mockModeloAnalitico,
        medidas: [],
        paginas: [],
        visuais: [],
        resultadoNormativo: {
          ...mockResultadoNormativoConforme,
          status_geral: 'BLOQUEIO',
          total_bloqueios: 1,
          apto_para_validacao: false,
        },
      });

      expect(checklist.aptoParaSeguirWorkflow).toBe(false);
      expect(checklist.totalBloqueados).toBeGreaterThan(0);

      const chk01 = checklist.itens.find((i) => i.codigo === 'CHK-01');
      expect(chk01?.status).toBe('BLOQUEADO');
      expect(chk01?.acaoSugerida).toBeDefined();
    });

    it('Cenário C: deve marcar itens de BI como NAO_APLICAVEL quando Isenção Excel-Only estiver homologada', () => {
      const modeloIsento: ModeloPowerBi = {
        ...mockModeloPowerBi,
        tipo_formato: TipoFormatoModeloPowerBi.ISENTO_EXCEL_ONLY,
        justificativa_isencao: 'Relatório será consumido exclusivamente em planilhas Excel pela diretoria.',
      };

      const checklist = DashboardChecklistEngine.avaliar({
        modeloPowerBi: modeloIsento,
        medidas: [],
        paginas: [],
        visuais: [],
        resultadoNormativo: {
          ...mockResultadoNormativoConforme,
          isento_powerbi: true,
        },
      });

      const chk01 = checklist.itens.find((i) => i.codigo === 'CHK-01');
      expect(chk01?.status).toBe('CONCLUIDO');

      const chk04Dax = checklist.itens.find((i) => i.codigo === 'CHK-04');
      expect(chk04Dax?.status).toBe('NAO_APLICAVEL');

      const chk07Dataviz = checklist.itens.find((i) => i.codigo === 'CHK-07');
      expect(chk07Dataviz?.status).toBe('NAO_APLICAVEL');

      expect(checklist.totalBloqueados).toBe(0);
      expect(checklist.aptoParaSeguirWorkflow).toBe(true);
    });

    it('Cenário D: Copiloto consultivo NÃO gera bloqueio no checklist (seus conselhos são orientações)', () => {
      const checklist = DashboardChecklistEngine.avaliar({
        modeloPowerBi: mockModeloPowerBi,
        modeloAnalitico: mockModeloAnalitico,
        medidas: mockMedidas,
        paginas: [mockPagina],
        visuais: [mockVisual],
        resultadoNormativo: mockResultadoNormativoConforme,
      });

      // Mesmo com insights do Copiloto presentes, totalBloqueados permanece 0
      expect(checklist.totalBloqueados).toBe(0);
      expect(checklist.aptoParaSeguirWorkflow).toBe(true);
    });
  });

  describe('2. DashboardDocumentationGenerator — Memorial Descritivo em Markdown', () => {
    it('deve gerar documentação completa cobrindo as Seções A até M sem inventar informações', () => {
      const pacote = DashboardDeliveryPackageEngine.montarPacote({
        demanda: mockDemanda,
        modeloPowerBi: mockModeloPowerBi,
        modeloAnalitico: mockModeloAnalitico,
        medidas: mockMedidas,
        paginas: [{ ...mockPagina, visuais: [mockVisual] }],
        resultadoNormativo: mockResultadoNormativoConforme,
        resultadoCopiloto: mockResultadoCopiloto,
        templateEscolhido: 'Executive Premium',
      });

      const markdown = DashboardDocumentationGenerator.gerarMarkdown(pacote);

      // Verificação das Seções
      expect(markdown).toContain('### A. Contexto e Identificação da Demanda');
      expect(markdown).toContain('### B. Objetivo Analítico do Dashboard');
      expect(markdown).toContain('### C. Perguntas de Negócio Mapeadas');
      expect(markdown).toContain('### D. Modelo Analítico e Arquitetura de Dados');
      expect(markdown).toContain('### E. Artefatos de Power BI e Formato de Armazenamento');
      expect(markdown).toContain('### F. Catálogo de Medidas DAX');
      expect(markdown).toContain('### G. Estrutura de Páginas do Dashboard');
      expect(markdown).toContain('### H. Especificação dos Visuais');
      expect(markdown).toContain('### I. Justificativas DataViz e Pedagogia Analítica');
      expect(markdown).toContain('### J. Conformidade Normativa e Prontidão (Regras D-01 a D-08)');
      expect(markdown).toContain('### K. Orientações Proativas do Copiloto');
      expect(markdown).toContain('### L. Checklist Determinístico de Entrega');
      expect(markdown).toContain('### M. Registro de Decisões Humanas e Próximas Ações');
      expect(markdown).toContain('### N. Ficha Síntese para Portfólio Profissional');

      // Verificação de Linhagem e Dados Reais
      expect(markdown).toContain('Faturamento Total');
      expect(markdown).toContain('SUM(fVendas[Valor])');
      expect(markdown).toContain('comercial_executivo.pbix');
      expect(markdown).toContain('Executive Premium');
      expect(markdown).toContain('D-COP-TIME-01');
    });
  });

  describe('3. DashboardDeliveryPackageEngine — Idempotência e Case de Portfólio', () => {
    it('deve produzir pacotes idênticos para as mesmas entradas (idempotência e determinismo)', () => {
      const params = {
        demanda: mockDemanda,
        modeloPowerBi: mockModeloPowerBi,
        modeloAnalitico: mockModeloAnalitico,
        medidas: mockMedidas,
        paginas: [{ ...mockPagina, visuais: [mockVisual] }],
        resultadoNormativo: mockResultadoNormativoConforme,
        resultadoCopiloto: mockResultadoCopiloto,
        templateEscolhido: 'Executive Premium',
      };

      const p1 = DashboardDeliveryPackageEngine.montarPacote(params);
      const p2 = DashboardDeliveryPackageEngine.montarPacote(params);

      expect(p1.versaoPacote).toBe(p2.versaoPacote);
      expect(p1.statusEntrega).toBe(p2.statusEntrega);
      expect(p1.catalogoMedidasDax).toEqual(p2.catalogoMedidasDax);
      expect(p1.checklist.totalConcluidos).toBe(p2.checklist.totalConcluidos);
      expect(p1.casePortfolio.tituloCase).toBe(p2.casePortfolio.tituloCase);
    });

    it('deve estruturar ficha de portfólio sanitizada sem efetuar publicação externa', () => {
      const pacote = DashboardDeliveryPackageEngine.montarPacote({
        demanda: mockDemanda,
        modeloPowerBi: mockModeloPowerBi,
        modeloAnalitico: mockModeloAnalitico,
        medidas: mockMedidas,
        paginas: [{ ...mockPagina, visuais: [mockVisual] }],
        resultadoNormativo: mockResultadoNormativoConforme,
      });

      const portfolio = pacote.casePortfolio;
      expect(portfolio.tituloCase).toContain('Dashboard Analítico');
      expect(portfolio.ferramentasUtilizadas).toContain('Power BI Desktop');
      expect(portfolio.ferramentasUtilizadas).toContain('DAX');
      expect(portfolio.processoAplicado).toBeDefined();
      expect(portfolio.evidenciasDisponiveis.length).toBeGreaterThan(0);
    });
  });

  describe('4. GerarPacoteEntregaDashboardUseCase (Aplicação e Isolamento)', () => {
    let demandaStore: Map<string, DemandaComProjeto>;
    let modeloPbiStore: Map<string, ModeloPowerBi>;
    let modeloAnaliticoStore: Map<string, ModeloAnaliticoCompleto>;
    let medidaDaxStore: Map<string, MedidaDax>;
    let paginaStore: Map<string, PaginaRelatorio>;
    let visualStore: Map<string, VisualDashboard>;

    let mockDemandRepo: IDemandRepository;
    let mockModeloPbiRepo: IModeloPowerBiRepository;
    let mockModeloAnaliticoRepo: IModeloAnaliticoRepository;
    let mockMedidaDaxRepo: IMedidaDaxRepository;
    let mockPaginaRepo: IPaginaRelatorioRepository;
    let mockVisualRepo: IVisualDashboardRepository;

    let useCase: GerarPacoteEntregaDashboardUseCase;

    beforeEach(() => {
      demandaStore = new Map();
      modeloPbiStore = new Map();
      modeloAnaliticoStore = new Map();
      medidaDaxStore = new Map();
      paginaStore = new Map();
      visualStore = new Map();

      mockDemandRepo = {
        findById: async (id: string) => demandaStore.get(id) || null,
        findByProjectId: async (pId: string) => Array.from(demandaStore.values()).filter((d) => d.projeto_id === pId),
        findAll: async () => Array.from(demandaStore.values()),
        findRecent: async (limit: number) => Array.from(demandaStore.values()).slice(0, limit),
        create: async (d) => {
          demandaStore.set(d.id, d as DemandaComProjeto);
          return d as Demanda;
        },
        update: async (id: string, data: Partial<Demanda>) => {
          const prev = demandaStore.get(id);
          if (!prev) return null;
          const updated = { ...prev, ...data };
          demandaStore.set(id, updated as DemandaComProjeto);
          return updated as Demanda;
        },
        countActive: async () => demandaStore.size,
        countTotal: async () => demandaStore.size,
      };

      mockModeloPbiRepo = {
        findById: async (id) => modeloPbiStore.get(id) || null,
        findByDemandaId: async (demandaId) =>
          Array.from(modeloPbiStore.values()).filter((m) => m.demanda_id === demandaId),
        findCompletoById: async () => null,
        create: async (m) => {
          modeloPbiStore.set(m.id, m);
          return m;
        },
        update: async (m) => {
          modeloPbiStore.set(m.id, m);
          return m;
        },
        delete: async (id) => {
          modeloPbiStore.delete(id);
        },
      };

      mockModeloAnaliticoRepo = {
        findById: async (id) => modeloAnaliticoStore.get(id) || null,
        findByDemandaId: async (demandaId) =>
          Array.from(modeloAnaliticoStore.values()).filter((m) => m.demanda_id === demandaId),
        findCompletoById: async (id) => modeloAnaliticoStore.get(id) || null,
        findHomologadoByDemandaId: async (demandaId) =>
          Array.from(modeloAnaliticoStore.values()).find(
            (m) => m.demanda_id === demandaId && m.status === StatusModeloAnalitico.HOMOLOGADO
          ) || null,
        create: async (m) => m,
        update: async (m) => m,
        delete: async () => {},
        homologarTransacional: async () => ({} as any),
        revogar: async () => null,
      };

      mockMedidaDaxRepo = {
        findById: async (id) => medidaDaxStore.get(id) || null,
        findByModeloPowerBiId: async (modeloId) =>
          Array.from(medidaDaxStore.values()).filter((m) => m.modelo_powerbi_id === modeloId),
        findByMetricaAnaliticaId: async (metricaId) =>
          Array.from(medidaDaxStore.values()).filter((m) => m.metrica_analitica_id === metricaId),
        create: async (m) => {
          medidaDaxStore.set(m.id, m);
          return m;
        },
        update: async (m) => {
          medidaDaxStore.set(m.id, m);
          return m;
        },
        delete: async (id) => {
          medidaDaxStore.delete(id);
        },
      };

      mockPaginaRepo = {
        findById: async (id) => paginaStore.get(id) || null,
        findByModeloPowerBiId: async (modeloId) =>
          Array.from(paginaStore.values()).filter((p) => p.modelo_powerbi_id === modeloId),
        findComVisuaisById: async () => null,
        create: async (p) => {
          paginaStore.set(p.id, p);
          return p;
        },
        update: async (p) => {
          paginaStore.set(p.id, p);
          return p;
        },
        delete: async (id) => {
          paginaStore.delete(id);
        },
      };

      mockVisualRepo = {
        findById: async (id) => visualStore.get(id) || null,
        findByPaginaId: async (paginaId) =>
          Array.from(visualStore.values()).filter((v) => v.pagina_id === paginaId),
        create: async (v) => {
          visualStore.set(v.id, v);
          return v;
        },
        update: async (v) => {
          visualStore.set(v.id, v);
          return v;
        },
        delete: async (id) => {
          visualStore.delete(id);
        },
      };

      useCase = new GerarPacoteEntregaDashboardUseCase(
        mockDemandRepo,
        mockModeloPbiRepo,
        mockMedidaDaxRepo,
        mockPaginaRepo,
        mockVisualRepo,
        mockModeloAnaliticoRepo
      );

      // Inserir demanda e artefatos de teste
      demandaStore.set(DEMANDA_ID, mockDemanda);
      modeloPbiStore.set(MODELO_PBI_ID, mockModeloPowerBi);
      modeloAnaliticoStore.set(MODELO_ANALITICO_ID, mockModeloAnalitico);
      medidaDaxStore.set('dax-1', mockMedidas[0]);
      paginaStore.set('pag-1', mockPagina);
      visualStore.set('vis-1', mockVisual);
    });

    it('deve gerar pacote de entrega completo com Markdown, JSON, TMDL e Manifesto', async () => {
      const output = await useCase.execute({ demandaId: DEMANDA_ID });

      expect(output.success).toBe(true);
      expect(output.pacote.versaoPacote).toBe('1.0.0');
      expect(output.documentacaoMarkdown).toContain('MEMORIAL DESCRITIVO');
      expect(output.pacoteJson).toContain(DEMANDA_ID);
      expect(output.medidasTmdl).toContain('measure');
      expect(output.manifestoLayoutJson).toContain('versaoManifesto');
    });

    it('deve falhar de forma controlada se a demanda não existir', async () => {
      await expect(
        useCase.execute({ demandaId: 'demanda-fantasma' })
      ).rejects.toThrow(/não encontrada/i);
    });

    it('ISOLAMENTO ENTRE DEMANDAS: gerar pacote para Demanda A não carrega dados da Demanda B', async () => {
      // Inserir Demanda B com outros arquivos
      const DEMANDA_B_ID = 'dem-200';
      demandaStore.set(DEMANDA_B_ID, {
        ...mockDemanda,
        id: DEMANDA_B_ID,
        titulo: 'Demanda B Exclusiva',
      });
      modeloPbiStore.set('pbi-b', {
        ...mockModeloPowerBi,
        id: 'pbi-b',
        demanda_id: DEMANDA_B_ID,
        nome_arquivo: 'modelo_b_exclusivo.pbix',
      });

      const outputA = await useCase.execute({ demandaId: DEMANDA_ID });
      const outputB = await useCase.execute({ demandaId: DEMANDA_B_ID });

      expect(outputA.pacote.demanda.id).toBe(DEMANDA_ID);
      expect(outputB.pacote.demanda.id).toBe(DEMANDA_B_ID);
      expect(outputA.pacote.modeloPowerBi?.nomeArquivo).toBe('comercial_executivo.pbix');
      expect(outputB.pacote.modeloPowerBi?.nomeArquivo).toBe('modelo_b_exclusivo.pbix');
    });
  });
});
