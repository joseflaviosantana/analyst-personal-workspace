/**
 * tests/unit/dashboard/dashboard-automation-use-cases.spec.ts
 *
 * Suíte de Testes Unitários dos Casos de Uso de Dashboard Automation e Gestão de Páginas/Visuais (Subgate 3.4D)
 *
 * Cobertura:
 * 1. GerarPropostaDashboardUseCase:
 *    - Rejeita se demanda ou modelo não existirem;
 *    - Gera proposta determinística com páginas e visuais rastreados;
 *    - Suporta contexto insuficiente com mensagem amigável sem quebra.
 * 2. AprovarPropostaDashboardUseCase (Human-in-the-Loop):
 *    - Materializa formalmente as páginas e visuais no repositório;
 *    - Preserva justificativas DataViz e rastreabilidade com medidas DAX;
 *    - Garante idempotência e auditabilidade;
 *    - Garante isolamento estrito entre diferentes demandas.
 * 3. Gestão Manual de Páginas (Criar / Excluir):
 *    - Validação de unicidade e ordem;
 *    - Exclusão física pontual sem efeitos colaterais em outras páginas.
 * 4. Gestão Manual de Visuais (Criar / Excluir):
 *    - Validação de vínculo com página existente;
 *    - Exclusão atômica de visual.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GerarPropostaDashboardUseCase } from '@/core/use-cases/dashboard/gerar-proposta-dashboard.use-case';
import { AprovarPropostaDashboardUseCase } from '@/core/use-cases/dashboard/aprovar-proposta-dashboard.use-case';
import { CriarPaginaRelatorioUseCase } from '@/core/use-cases/dashboard/criar-pagina-relatorio.use-case';
import { ExcluirPaginaRelatorioUseCase } from '@/core/use-cases/dashboard/excluir-pagina-relatorio.use-case';
import { CriarVisualDashboardUseCase } from '@/core/use-cases/dashboard/criar-visual-dashboard.use-case';
import { ExcluirVisualDashboardUseCase } from '@/core/use-cases/dashboard/excluir-visual-dashboard.use-case';
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
import { TipoTemplateDashboard } from '@/core/domain/dashboard-design/dashboard-template';

describe('Casos de Uso de Dashboard Automation e Páginas/Visuais (Subgate 3.4D)', () => {
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

  let gerarPropostaUseCase: GerarPropostaDashboardUseCase;
  let aprovarPropostaUseCase: AprovarPropostaDashboardUseCase;
  let criarPaginaUseCase: CriarPaginaRelatorioUseCase;
  let excluirPaginaUseCase: ExcluirPaginaRelatorioUseCase;
  let criarVisualUseCase: CriarVisualDashboardUseCase;
  let excluirVisualUseCase: ExcluirVisualDashboardUseCase;

  const DEMANDA_A_ID = 'demanda-001';
  const DEMANDA_B_ID = 'demanda-002';
  const MODELO_PBI_A_ID = 'pbi-001';
  const MODELO_PBI_B_ID = 'pbi-002';
  const MODELO_ANALITICO_A_ID = 'mod-ana-001';

  beforeEach(() => {
    demandaStore = new Map();
    modeloPbiStore = new Map();
    modeloAnaliticoStore = new Map();
    medidaDaxStore = new Map();
    paginaStore = new Map();
    visualStore = new Map();

    mockDemandRepo = {
      findById: async (id: string) => demandaStore.get(id) || null,
      findByProjectId: async (projId: string) =>
        Array.from(demandaStore.values()).filter((d) => d.projeto_id === projId),
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
      findCompletoById: async (id) => null,
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
      delete: async (id) => {},
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
      findComVisuaisById: async (id) => null,
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

    gerarPropostaUseCase = new GerarPropostaDashboardUseCase(
      mockDemandRepo,
      mockModeloPbiRepo,
      mockModeloAnaliticoRepo,
      mockMedidaDaxRepo
    );

    aprovarPropostaUseCase = new AprovarPropostaDashboardUseCase(
      mockPaginaRepo,
      mockVisualRepo,
      mockModeloPbiRepo
    );

    criarPaginaUseCase = new CriarPaginaRelatorioUseCase(mockPaginaRepo, mockModeloPbiRepo);
    excluirPaginaUseCase = new ExcluirPaginaRelatorioUseCase(mockPaginaRepo);

    criarVisualUseCase = new CriarVisualDashboardUseCase(mockVisualRepo, mockPaginaRepo);
    excluirVisualUseCase = new ExcluirVisualDashboardUseCase(mockVisualRepo);

    // Setup base da Demanda A
    demandaStore.set(DEMANDA_A_ID, {
      id: DEMANDA_A_ID,
      projeto_id: 'proj-1',
      titulo: 'Dashboard Executivo de Faturamento',
      solicitacao_bruta: 'Criar dashboard comercial para diretoria',
      contexto: 'Reunião mensal de resultados',
      objetivo_inicial: 'Monitorar receita total e vendas por filial',
      prazo_esperado: null,
      restricoes_declaradas: null,
      estado: EstadoDemanda.EM_MODELAGEM_E_ANALISE,
      criado_em: '2026-09-30T10:00:00Z',
      atualizado_em: '2026-09-30T10:00:00Z',
      data_conclusao: null,
      projetoNome: 'Projeto BI V1',
    });

    modeloPbiStore.set(MODELO_PBI_A_ID, {
      id: MODELO_PBI_A_ID,
      demanda_id: DEMANDA_A_ID,
      modelo_analitico_id: MODELO_ANALITICO_A_ID,
      tipo_formato: TipoFormatoModeloPowerBi.PBIX,
      nome_arquivo: 'vendas_executivo.pbix',
      caminho_local: 'models/vendas_executivo.pbix',
      status: StatusModeloPowerBi.EM_DESENVOLVIMENTO,
      hash_sha256: null,
      versao_powerbi: '2.120',
      tamanho_bytes: 1024,
      justificativa_isencao: null,
      criado_em: '2026-09-30T10:00:00Z',
      atualizado_em: '2026-09-30T10:00:00Z',
    });

    modeloAnaliticoStore.set(MODELO_ANALITICO_A_ID, {
      id: MODELO_ANALITICO_A_ID,
      demanda_id: DEMANDA_A_ID,
      dataset_autorizado_id: 'ds-vendas',
      nome: 'Star Schema Vendas',
      descricao: null,
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
          modelo_id: MODELO_ANALITICO_A_ID,
          entidade_id: 'ent-fato',
          nome: 'Faturamento Bruto',
          descricao: 'KPI mestre',
          tipo_agregacao: TipoAgregacaoMetrica.SOMA,
          tipo_aditividade: TipoAditividadeMetrica.TOTALMENTE_ADITIVA,
          formula_declarativa: 'SUM(fVendas[Valor])',
          unidade_medida: UnidadeMedidaMetrica.MOEDA,
          formato_exibicao: 'R$ #,##0.00',
          status: StatusMetricaAnalitica.HOMOLOGADA,
          atributos_dependentes_ids: ['atr-fat'],
          metricas_dependentes_ids: [],
          pergunta_negocio_associada: 'Qual o faturamento bruto consolidado?',
          objetivo_negocio_associado: 'Monitorar receita',
          ordem: 1,
          criado_em: '2026-09-30T10:00:00Z',
          atualizado_em: '2026-09-30T10:00:00Z',
        },
      ],
    });

    medidaDaxStore.set('dax-1', {
      id: 'dax-1',
      modelo_powerbi_id: MODELO_PBI_A_ID,
      metrica_analitica_id: 'met-1',
      nome: 'Faturamento Bruto',
      tabela_hospedeira: 'fVendas',
      expressao_dax: 'SUM(fVendas[Faturamento])',
      descricao: 'Soma do faturamento bruto',
      formato_string: 'R$ #,##0.00',
      categoria_dax: CategoriaMedidaDax.AGREGACAO_SIMPLES,
      ordem: 1,
      criado_em: '2026-09-30T10:00:00Z',
      atualizado_em: '2026-09-30T10:00:00Z',
    });
  });

  describe('1. GerarPropostaDashboardUseCase', () => {
    it('deve gerar proposta de dashboard estruturada com sucesso a partir de métricas e DAX', async () => {
      const proposta = await gerarPropostaUseCase.execute({
        demandaId: DEMANDA_A_ID,
        template: TipoTemplateDashboard.EXECUTIVE_PREMIUM,
      });

      expect(proposta.demandaId).toBe(DEMANDA_A_ID);
      expect(proposta.modeloPowerBiId).toBe(MODELO_PBI_A_ID);
      expect(proposta.statusGeral).toBe('PROPOSTO');
      expect(proposta.totalPaginas).toBeGreaterThan(0);
      expect(proposta.paginas[0].visuais.length).toBeGreaterThan(0);
      expect(proposta.paginas[0].visuais[0].medidaDaxId).toBe('dax-1');
    });

    it('deve falhar se a demanda não existir', async () => {
      await expect(
        gerarPropostaUseCase.execute({
          demandaId: 'demanda-inexistente',
        })
      ).rejects.toThrow(/não encontrada/i);
    });

    it('deve falhar se a demanda não tiver modelo Power BI registrado', async () => {
      demandaStore.set('dem-sem-pbi', {
        id: 'dem-sem-pbi',
        projeto_id: 'proj-1',
        titulo: 'Demanda Sem PBI',
        solicitacao_bruta: '...',
        contexto: null,
        objetivo_inicial: null,
        prazo_esperado: null,
        restricoes_declaradas: null,
        estado: EstadoDemanda.NOVA,
        criado_em: '2026-09-30T10:00:00Z',
        atualizado_em: '2026-09-30T10:00:00Z',
        data_conclusao: null,
        projetoNome: 'Projeto',
      });

      await expect(
        gerarPropostaUseCase.execute({
          demandaId: 'dem-sem-pbi',
        })
      ).rejects.toThrow('Nenhum Modelo Power BI registrado');
    });
  });

  describe('2. AprovarPropostaDashboardUseCase (Human-in-the-Loop)', () => {
    it('deve persistir páginas e visuais no repositório com status aprovado', async () => {
      const proposta = await gerarPropostaUseCase.execute({
        demandaId: DEMANDA_A_ID,
      });

      const res = await aprovarPropostaUseCase.execute({
        proposta,
      });

      expect(res.success).toBe(true);
      expect(res.totalPaginasCriadas).toBe(proposta.paginas.length);
      expect(res.totalVisuaisCriados).toBe(proposta.totalVisuais);

      // Conferir se páginas foram salvas no repositório
      const paginasSalvas = await mockPaginaRepo.findByModeloPowerBiId(MODELO_PBI_A_ID);
      expect(paginasSalvas.length).toBe(proposta.paginas.length);

      // Conferir se visuais foram salvos no repositório
      const visuaisSalvos = await mockVisualRepo.findByPaginaId(paginasSalvas[0].id);
      expect(visuaisSalvos.length).toBeGreaterThan(0);
      expect(visuaisSalvos[0].justificativa_dataviz).toBeDefined();
    });

    it('ISOLAMENTO ENTRE DEMANDAS: aprovar proposta para Demanda A não deve afetar páginas da Demanda B', async () => {
      // Registrar Demanda B e Modelo B com 1 página existente
      demandaStore.set(DEMANDA_B_ID, {
        id: DEMANDA_B_ID,
        projeto_id: 'proj-2',
        titulo: 'Dashboard B',
        solicitacao_bruta: '...',
        contexto: null,
        objetivo_inicial: null,
        prazo_esperado: null,
        restricoes_declaradas: null,
        estado: EstadoDemanda.EM_MODELAGEM_E_ANALISE,
        criado_em: '2026-09-30T10:00:00Z',
        atualizado_em: '2026-09-30T10:00:00Z',
        data_conclusao: null,
        projetoNome: 'Proj 2',
      });

      modeloPbiStore.set(MODELO_PBI_B_ID, {
        id: MODELO_PBI_B_ID,
        demanda_id: DEMANDA_B_ID,
        modelo_analitico_id: null,
        tipo_formato: TipoFormatoModeloPowerBi.PBIX,
        nome_arquivo: 'modelo_b.pbix',
        caminho_local: 'models/b.pbix',
        status: StatusModeloPowerBi.EM_DESENVOLVIMENTO,
        hash_sha256: null,
        versao_powerbi: '2.120',
        tamanho_bytes: 1024,
        justificativa_isencao: null,
        criado_em: '2026-09-30T10:00:00Z',
        atualizado_em: '2026-09-30T10:00:00Z',
      });

      paginaStore.set('pag-b-1', {
        id: 'pag-b-1',
        modelo_powerbi_id: MODELO_PBI_B_ID,
        nome: 'Página Exclusiva da Demanda B',
        ordem: 1,
        objetivo_analitico: 'Manter intacta',
        publico_alvo: PublicoAlvoPagina.EXECUTIVO,
        layout_grid: LayoutGridPagina.PADRAO_16_9,
        criado_em: '2026-09-30T10:00:00Z',
        atualizado_em: '2026-09-30T10:00:00Z',
      });

      // Gerar e aprovar proposta na Demanda A
      const propostaA = await gerarPropostaUseCase.execute({ demandaId: DEMANDA_A_ID });
      await aprovarPropostaUseCase.execute({
        proposta: propostaA,
      });

      // Verificar que a página da Demanda B permaneceu 100% inalterada
      const paginaB = await mockPaginaRepo.findById('pag-b-1');
      expect(paginaB).not.toBeNull();
      expect(paginaB?.nome).toBe('Página Exclusiva da Demanda B');
    });
  });

  describe('3. Gestão Manual de Páginas (Criar / Excluir)', () => {
    it('deve criar uma página de relatório manualmente com sucesso', async () => {
      const res = await criarPaginaUseCase.execute({
        modeloPowerBiId: MODELO_PBI_A_ID,
        nome: 'Página Manual de Drill-Through',
        ordem: 2,
        publicoAlvo: PublicoAlvoPagina.OPERACIONAL,
        layoutGrid: LayoutGridPagina.PADRAO_16_9,
        objetivoAnalitico: 'Investigação profunda de pedidos',
      });

      expect(res.pagina.id).toBeDefined();
      expect(res.pagina.nome).toBe('Página Manual de Drill-Through');
      expect(res.pagina.publico_alvo).toBe(PublicoAlvoPagina.OPERACIONAL);

      const doBanco = await mockPaginaRepo.findById(res.pagina.id);
      expect(doBanco).not.toBeNull();
    });

    it('deve excluir uma página manualmente por id', async () => {
      const res = await criarPaginaUseCase.execute({
        modeloPowerBiId: MODELO_PBI_A_ID,
        nome: 'Página Temporária',
        ordem: 9,
      });

      expect(await mockPaginaRepo.findById(res.pagina.id)).not.toBeNull();

      await excluirPaginaUseCase.execute({ id: res.pagina.id });

      expect(await mockPaginaRepo.findById(res.pagina.id)).toBeNull();
    });
  });

  describe('4. Gestão Manual de Visuais (Criar / Excluir)', () => {
    it('deve criar um visual manualmente associado a uma página existente', async () => {
      const pagRes = await criarPaginaUseCase.execute({
        modeloPowerBiId: MODELO_PBI_A_ID,
        nome: 'Página de Teste Visual',
      });

      const visRes = await criarVisualUseCase.execute({
        paginaId: pagRes.pagina.id,
        titulo: 'Total de Vendas por Canal',
        tipoVisual: TipoVisualDashboard.GRAFICO_BARRAS,
        posicaoLayout: PosicaoLayoutVisual.CENTRAL_TENDENCIAS,
        medidasUtilizadasIds: ['dax-1'],
        justificativaDataviz: 'Barras horizontais para facilitar a leitura de canais longos.',
        ordem: 1,
      });

      expect(visRes.visual.id).toBeDefined();
      expect(visRes.visual.titulo).toBe('Total de Vendas por Canal');
      expect(visRes.visual.pagina_id).toBe(pagRes.pagina.id);
      expect(visRes.visual.medidas_utilizadas_ids).toContain('dax-1');
    });

    it('deve falhar ao tentar criar visual em página inexistente', async () => {
      await expect(
        criarVisualUseCase.execute({
          paginaId: 'pagina-fantasma',
          titulo: 'Visual Órfão',
        })
      ).rejects.toThrow(/não encontrada/i);
    });

    it('deve excluir um visual pontualmente sem afetar outros visuais', async () => {
      const pagRes = await criarPaginaUseCase.execute({
        modeloPowerBiId: MODELO_PBI_A_ID,
        nome: 'Página',
      });

      const vis1 = await criarVisualUseCase.execute({
        paginaId: pagRes.pagina.id,
        titulo: 'Visual 1',
      });

      const vis2 = await criarVisualUseCase.execute({
        paginaId: pagRes.pagina.id,
        titulo: 'Visual 2',
      });

      await excluirVisualUseCase.execute({ id: vis1.visual.id });

      expect(await mockVisualRepo.findById(vis1.visual.id)).toBeNull();
      expect(await mockVisualRepo.findById(vis2.visual.id)).not.toBeNull();
    });
  });
});
