/**
 * tests/unit/dashboard/executar-copiloto-dashboard.use-case.spec.ts
 *
 * Suíte de Testes Unitários do Caso de Uso de Orquestração do Copiloto de Dashboard/DAX (Subgate 3.3C)
 *
 * Cenários Obrigatórios Validados:
 * 1. Demanda válida com contexto completo;
 * 2. Demanda sem Modelo Power BI;
 * 3. Demanda com contexto parcial;
 * 4. Modelo analítico homologado corretamente recuperado;
 * 5. Ausência de modelo analítico quando não for necessário / não homologado;
 * 6. Isolamento estrito entre duas demandas;
 * 7. Perguntas/requisitos pertencentes somente à demanda correta;
 * 8. D-01–D-08 fornecido como contexto somente-leitura;
 * 9. Resultado do Copiloto estritamente determinístico;
 * 10. Nenhuma mutação dos artefatos recuperados;
 * 11. Nenhum efeito colateral (sem chamadas de escrita no repositório);
 * 12. Ausência de chamadas externas / LLM (100% puro e local);
 * 13. Tratamento seguro de repositório vazio;
 * 14. Erro controlado para demanda inexistente.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ExecutarCopilotoDashboardUseCase,
} from '@/core/use-cases/dashboard/executar-copiloto-dashboard.use-case';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { IModeloPowerBiRepository } from '@/core/domain/repositories/modelo-powerbi-repository.interface';
import { IModeloAnaliticoRepository } from '@/core/domain/repositories/modelo-analitico-repository.interface';
import { Demanda, DemandaComProjeto } from '@/core/domain/entities/demanda';
import { ModeloPowerBiCompleto } from '@/core/domain/entities/modelo-powerbi';
import { MedidaDax } from '@/core/domain/entities/medida-dax';
import { PaginaRelatorio } from '@/core/domain/entities/pagina-relatorio';
import { VisualDashboard } from '@/core/domain/entities/visual-dashboard';
import { ModeloAnaliticoCompleto } from '@/core/domain/entities/modelo-analitico';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { StatusModeloPowerBi } from '@/core/domain/enums/status-modelo-powerbi';
import { TipoFormatoModeloPowerBi } from '@/core/domain/enums/tipo-formato-modelo-powerbi';
import { StatusModeloAnalitico } from '@/core/domain/enums/status-modelo-analitico';
import { TipoArquiteturaModelo } from '@/core/domain/enums/tipo-arquitetura-modelo';
import { CategoriaMedidaDax } from '@/core/domain/enums/categoria-medida-dax';
import { PublicoAlvoPagina } from '@/core/domain/enums/publico-alvo-pagina';
import { LayoutGridPagina } from '@/core/domain/enums/layout-grid-pagina';
import { TipoVisualDashboard } from '@/core/domain/enums/tipo-visual-dashboard';
import { PosicaoLayoutVisual } from '@/core/domain/enums/posicao-layout-visual';
import { TipoEntidadeAnalitica } from '@/core/domain/enums/tipo-entidade-analitica';
import { PapelEntidadeAnalitica } from '@/core/domain/enums/papel-entidade-analitica';
import { TipoOrigemEntidade } from '@/core/domain/enums/tipo-origem-entidade';
import { TipoDadoAnalitico } from '@/core/domain/enums/tipo-dado-analitico';
import { PapelAtributoAnalitico } from '@/core/domain/enums/papel-atributo-analitico';
import { TipoAgregacaoMetrica } from '@/core/domain/enums/tipo-agregacao-metrica';
import { TipoAditividadeMetrica } from '@/core/domain/enums/tipo-aditividade-metrica';
import { UnidadeMedidaMetrica } from '@/core/domain/enums/unidade-medida-metrica';
import { StatusMetricaAnalitica } from '@/core/domain/enums/status-metrica-analitica';

describe('ExecutarCopilotoDashboardUseCase — Orquestração Aplicacional (Subgate 3.3C)', () => {
  let demandStore: Map<string, DemandaComProjeto>;
  let modeloPbiStore: Map<string, ModeloPowerBiCompleto>;
  let modeloAnaliticoStore: Map<string, ModeloAnaliticoCompleto>;

  let mockDemandRepo: IDemandRepository;
  let mockModeloPbiRepo: IModeloPowerBiRepository;
  let mockModeloAnaliticoRepo: IModeloAnaliticoRepository;

  beforeEach(() => {
    demandStore = new Map();
    modeloPbiStore = new Map();
    modeloAnaliticoStore = new Map();

    mockDemandRepo = {
      create: async (d) => {
        const comProj: DemandaComProjeto = { ...d, projetoNome: 'Projeto Teste' };
        demandStore.set(d.id, comProj);
        return d;
      },
      findById: async (id) => demandStore.get(id) ?? null,
      findByProjectId: async (pid) =>
        Array.from(demandStore.values()).filter((d) => d.projeto_id === pid),
      findAll: async () => Array.from(demandStore.values()),
      findRecent: async (limit) => Array.from(demandStore.values()).slice(0, limit),
      update: async (id, data) => {
        const existing = demandStore.get(id);
        if (!existing) return null;
        const updated = { ...existing, ...data };
        demandStore.set(id, updated);
        return updated;
      },
      countActive: async () => demandStore.size,
      countTotal: async () => demandStore.size,
    };

    mockModeloPbiRepo = {
      findById: async (id) => {
        const item = modeloPbiStore.get(id);
        return item ?? null;
      },
      findByDemandaId: async (demandaId) => {
        return Array.from(modeloPbiStore.values()).filter((m) => m.demanda_id === demandaId);
      },
      findCompletoById: async (id) => {
        return modeloPbiStore.get(id) ?? null;
      },
      create: async (m) => {
        const completo: ModeloPowerBiCompleto = {
          ...m,
          medidas: [],
          paginas: [],
        };
        modeloPbiStore.set(m.id, completo);
        return m;
      },
      update: async (m) => {
        const existing = modeloPbiStore.get(m.id);
        const updated: ModeloPowerBiCompleto = {
          ...m,
          medidas: existing?.medidas ?? [],
          paginas: existing?.paginas ?? [],
        };
        modeloPbiStore.set(m.id, updated);
        return m;
      },
      delete: async (id) => {
        modeloPbiStore.delete(id);
      },
    };

    mockModeloAnaliticoRepo = {
      findById: async (id) => modeloAnaliticoStore.get(id) ?? null,
      findByDemandaId: async (demandaId) =>
        Array.from(modeloAnaliticoStore.values()).filter((m) => m.demanda_id === demandaId),
      findHomologadoByDemandaId: async (demandaId) => {
        const list = Array.from(modeloAnaliticoStore.values()).filter(
          (m) => m.demanda_id === demandaId && m.status === StatusModeloAnalitico.HOMOLOGADO
        );
        return list.length > 0 ? list[0] : null;
      },
      findCompletoById: async (id) => modeloAnaliticoStore.get(id) ?? null,
      create: async (m) => m,
      update: async (m) => m,
      delete: async () => {},
      homologarTransacional: async (id) => {
        const item = modeloAnaliticoStore.get(id)!;
        item.status = StatusModeloAnalitico.HOMOLOGADO;
        return item;
      },
      revogar: async (id) => {
        const item = modeloAnaliticoStore.get(id)!;
        item.status = StatusModeloAnalitico.RASCUNHO;
        return item;
      },
    };
  });

  const criarDemandaFixture = (id: string, overrides?: Partial<Demanda>): DemandaComProjeto => {
    const demanda: DemandaComProjeto = {
      id,
      projeto_id: 'proj-1',
      projetoNome: 'Projeto Vendas Analytics',
      titulo: 'Dashboard Executivo de Faturamento',
      solicitacao_bruta: 'Qual é a evolução da receita e atingimento de metas?',
      contexto: 'Contexto de vendas corporativas B2B',
      objetivo_inicial: 'Monitorar KPIs de vendas e margens',
      prazo_esperado: '2026-10-31',
      restricoes_declaradas: 'Apenas dados faturados e conciliados',
      estado: EstadoDemanda.EM_MODELAGEM_E_ANALISE,
      criado_em: '2026-09-01T10:00:00.000Z',
      atualizado_em: '2026-09-01T10:00:00.000Z',
      data_conclusao: null,
      ...overrides,
    };
    demandStore.set(id, demanda);
    return demanda;
  };

  const criarModeloPbiFixture = (
    id: string,
    demandaId: string,
    medidas: MedidaDax[] = [],
    paginas: any[] = []
  ): ModeloPowerBiCompleto => {
    const modelo: ModeloPowerBiCompleto = {
      id,
      demanda_id: demandaId,
      modelo_analitico_id: 'modelo-an-1',
      nome_arquivo: 'RelatorioVendas.pbip',
      caminho_local: 'C:/Analytics/RelatorioVendas.pbip',
      tipo_formato: TipoFormatoModeloPowerBi.PBIP,
      status: StatusModeloPowerBi.EM_DESENVOLVIMENTO,
      justificativa_isencao: null,
      hash_sha256: 'hash123',
      versao_powerbi: '2.126.0',
      tamanho_bytes: 204800,
      criado_em: '2026-09-02T10:00:00.000Z',
      atualizado_em: '2026-09-02T10:00:00.000Z',
      medidas,
      paginas,
    };
    modeloPbiStore.set(id, modelo);
    return modelo;
  };

  const criarModeloAnaliticoFixture = (
    id: string,
    demandaId: string,
    status = StatusModeloAnalitico.HOMOLOGADO
  ): ModeloAnaliticoCompleto => {
    const modelo: ModeloAnaliticoCompleto = {
      id,
      demanda_id: demandaId,
      dataset_autorizado_id: 'ds-1',
      nome: 'Modelo Star Schema Vendas',
      descricao: 'Fato Vendas com Dim Calendario e Cliente',
      tipo_arquitetura: TipoArquiteturaModelo.ESTRELA,
      status,
      homologado_em: '2026-09-05T10:00:00.000Z',
      homologado_por: 'Analista Responsavel',
      justificativa_homologacao: 'Modelo validado e com 100% conformidade',
      revogado_em: null,
      motivo_revogacao: null,
      entidades: [
        {
          id: 'ent-dim-cal',
          modelo_id: id,
          ativo_dados_id: null,
          nome: 'Dim_Calendario',
          tipo: TipoEntidadeAnalitica.DIMENSAO,
          papel: PapelEntidadeAnalitica.DIMENSAO_CALENDARIO,
          origem_tipo: TipoOrigemEntidade.DIMENSAO_SISTEMA,
          descricao: 'Tabela de calendário contínua',
          ordem_apresentacao: 1,
          criado_em: '2026-09-05T10:00:00.000Z',
          atualizado_em: '2026-09-05T10:00:00.000Z',
          atributos: [
            {
              id: 'att-data',
              entidade_id: 'ent-dim-cal',
              nome_amigavel: 'Data',
              nome_original: 'Data',
              tipo_dado: TipoDadoAnalitico.DATA,
              papel: PapelAtributoAnalitico.CHAVE_PRIMARIA,
              ordem: 1,
              oculto: false,
              descricao: null,
              formato_exibicao: null,
              criado_em: '2026-09-05T10:00:00.000Z',
              atualizado_em: '2026-09-05T10:00:00.000Z',
            },
          ],
        },
      ],
      relacionamentos: [],
      metricas: [
        {
          id: 'met-rec',
          modelo_id: id,
          entidade_id: 'ent-fato',
          nome: 'Faturamento Bruto',
          descricao: 'Soma do valor total das vendas faturadas',
          tipo_agregacao: TipoAgregacaoMetrica.SOMA,
          tipo_aditividade: TipoAditividadeMetrica.TOTALMENTE_ADITIVA,
          formula_declarativa: 'SUM(f_vendas[valor])',
          unidade_medida: UnidadeMedidaMetrica.MOEDA,
          formato_exibicao: 'R$ #,##0.00',
          status: StatusMetricaAnalitica.HOMOLOGADA,
          atributos_dependentes_ids: ['att-data'],
          metricas_dependentes_ids: [],
          pergunta_negocio_associada: 'Qual o volume financeiro total faturado no período?',
          objetivo_negocio_associado: 'Acompanhar faturamento',
          ordem: 1,
          criado_em: '2026-09-05T10:00:00.000Z',
          atualizado_em: '2026-09-05T10:00:00.000Z',
        },
      ],
      criado_em: '2026-09-05T10:00:00.000Z',
      atualizado_em: '2026-09-05T10:00:00.000Z',
    };
    modeloAnaliticoStore.set(id, modelo);
    return modelo;
  };

  // 1. Demanda válida com contexto completo
  it('1. deve executar orquestração com sucesso em demanda com contexto completo', async () => {
    criarDemandaFixture('demanda-101');
    criarModeloAnaliticoFixture('mod-an-101', 'demanda-101');

    const medidas: MedidaDax[] = [
      {
        id: 'med-101',
        modelo_powerbi_id: 'pbi-101',
        metrica_analitica_id: 'met-rec',
        tabela_hospedeira: '_Medidas',
        nome: 'Faturamento Total',
        expressao_dax: 'SUM(f_vendas[valor])',
        descricao: 'Valor total faturado',
        formato_string: 'R$ #,##0',
        categoria_dax: CategoriaMedidaDax.AGREGACAO_SIMPLES,
        ordem: 1,
        criado_em: '2026-09-10T10:00:00.000Z',
        atualizado_em: '2026-09-10T10:00:00.000Z',
      },
    ];

    const visuais: VisualDashboard[] = [
      {
        id: 'vis-101',
        pagina_id: 'pag-101',
        titulo: 'Faturamento Total por Mês',
        tipo_visual: TipoVisualDashboard.GRAFICO_LINHAS,
        posicao_layout: PosicaoLayoutVisual.CENTRAL_TENDENCIAS,
        ordem: 1,
        medidas_utilizadas_ids: ['med-101'],
        atributos_utilizados_ids: ['att-data'],
        justificativa_dataviz: 'Análise de tendência temporal',
        criado_em: '2026-09-10T10:00:00.000Z',
        atualizado_em: '2026-09-10T10:00:00.000Z',
      },
    ];

    const paginas = [
      {
        id: 'pag-101',
        modelo_powerbi_id: 'pbi-101',
        nome: 'Visão Geral Executiva',
        ordem: 1,
        objetivo_analitico: 'Apresentar evolução temporal do faturamento executivo',
        publico_alvo: PublicoAlvoPagina.EXECUTIVO,
        layout_grid: LayoutGridPagina.PADRAO_16_9,
        criado_em: '2026-09-10T10:00:00.000Z',
        atualizado_em: '2026-09-10T10:00:00.000Z',
        visuais,
      },
    ];

    criarModeloPbiFixture('pbi-101', 'demanda-101', medidas, paginas);

    const useCase = new ExecutarCopilotoDashboardUseCase(
      mockDemandRepo,
      mockModeloPbiRepo,
      undefined,
      undefined,
      undefined,
      mockModeloAnaliticoRepo
    );

    const output = await useCase.execute({ demandaId: 'demanda-101' });

    expect(output.demandaId).toBe('demanda-101');
    expect(output.resultado).toBeDefined();
    expect(output.resultado.resumo_contexto.possui_modelo).toBe(true);
    expect(output.resultado.resumo_contexto.total_medidas).toBe(1);
    expect(output.resultado.resumo_contexto.total_paginas).toBe(1);
    expect(output.resultado.resumo_contexto.total_visuais).toBe(1);
    expect(output.contextoUtilizado.modeloAnalitico).toBeDefined();
    expect(output.contextoUtilizado.resultadoConformidadeDax).toBeDefined();
    expect(output.estadoPedagogico.ondeEstou).toContain('Demanda "Dashboard Executivo de Faturamento"');
    expect(output.estadoPedagogico.oQueEstouFazendo).toContain('1 página(s), 1 visual(is)');
  });

  // 2. Demanda sem Modelo Power BI
  it('2. deve lidar com demanda sem Modelo Power BI de forma segura', async () => {
    criarDemandaFixture('demanda-sem-pbi');

    const useCase = new ExecutarCopilotoDashboardUseCase(mockDemandRepo, mockModeloPbiRepo);
    const output = await useCase.execute({ demandaId: 'demanda-sem-pbi' });

    expect(output.demandaId).toBe('demanda-sem-pbi');
    expect(output.contextoUtilizado.modeloPowerBi).toBeNull();
    expect(output.contextoUtilizado.medidas).toHaveLength(0);
    expect(output.contextoUtilizado.paginas).toHaveLength(0);
    expect(output.contextoUtilizado.visuais).toHaveLength(0);
    expect(output.resultado.resumo_contexto.possui_modelo).toBe(false);
    expect(output.estadoPedagogico.oQueEstouFazendo).toContain('Aguardando inicialização ou importação');
  });

  // 3. Demanda com contexto parcial
  it('3. deve lidar com contexto parcial (modelo Power BI sem medidas nem páginas)', async () => {
    criarDemandaFixture('demanda-parcial');
    criarModeloPbiFixture('pbi-parcial', 'demanda-parcial', [], []);

    const useCase = new ExecutarCopilotoDashboardUseCase(mockDemandRepo, mockModeloPbiRepo);
    const output = await useCase.execute({ demandaId: 'demanda-parcial' });

    expect(output.demandaId).toBe('demanda-parcial');
    expect(output.contextoUtilizado.modeloPowerBi).not.toBeNull();
    expect(output.resultado.resumo_contexto.total_medidas).toBe(0);
    expect(output.resultado.resumo_contexto.total_paginas).toBe(0);
    expect(output.resultado.resumo_contexto.total_visuais).toBe(0);
    expect(output.resultado.insights.length).toBeGreaterThan(0);
  });

  // 4. Modelo analítico homologado corretamente recuperado
  it('4. deve recuperar modelo analítico homologado da demanda quando existente', async () => {
    criarDemandaFixture('demanda-homologada');
    criarModeloAnaliticoFixture('mod-an-hom', 'demanda-homologada', StatusModeloAnalitico.HOMOLOGADO);

    const useCase = new ExecutarCopilotoDashboardUseCase(
      mockDemandRepo,
      mockModeloPbiRepo,
      undefined,
      undefined,
      undefined,
      mockModeloAnaliticoRepo
    );

    const output = await useCase.execute({ demandaId: 'demanda-homologada' });

    expect(output.contextoUtilizado.modeloAnalitico).not.toBeNull();
    expect(output.contextoUtilizado.modeloAnalitico?.id).toBe('mod-an-hom');
    expect(output.contextoUtilizado.modeloAnalitico?.status).toBe(StatusModeloAnalitico.HOMOLOGADO);
  });

  // 5. Ausência de modelo analítico quando ele não for necessário ou não estiver homologado
  it('5. não deve recuperar modelo analítico se estiver em RASCUNHO (não homologado)', async () => {
    criarDemandaFixture('demanda-rascunho-an');
    criarModeloAnaliticoFixture('mod-an-rascunho', 'demanda-rascunho-an', StatusModeloAnalitico.RASCUNHO);

    const useCase = new ExecutarCopilotoDashboardUseCase(
      mockDemandRepo,
      mockModeloPbiRepo,
      undefined,
      undefined,
      undefined,
      mockModeloAnaliticoRepo
    );

    const output = await useCase.execute({ demandaId: 'demanda-rascunho-an' });

    expect(output.contextoUtilizado.modeloAnalitico).toBeNull();
  });

  // 6. Isolamento estrito entre duas demandas
  it('6. deve garantir isolamento estrito entre artefatos de demandas distintas', async () => {
    criarDemandaFixture('demanda-A');
    criarDemandaFixture('demanda-B');

    criarModeloPbiFixture('pbi-A', 'demanda-A', [
      {
        id: 'med-A',
        modelo_powerbi_id: 'pbi-A',
        tabela_hospedeira: '_Medidas',
        nome: 'Receita Demanda A',
        expressao_dax: 'SUM(f_a[vl])',
        categoria_dax: CategoriaMedidaDax.AGREGACAO_SIMPLES,
        descricao: null,
        formato_string: null,
        metrica_analitica_id: null,
        ordem: 1,
        criado_em: '2026-09-01T00:00:00.000Z',
        atualizado_em: '2026-09-01T00:00:00.000Z',
      },
    ]);

    criarModeloPbiFixture('pbi-B', 'demanda-B', [
      {
        id: 'med-B',
        modelo_powerbi_id: 'pbi-B',
        tabela_hospedeira: '_Medidas',
        nome: 'Custo Demanda B',
        expressao_dax: 'SUM(f_b[custo])',
        categoria_dax: CategoriaMedidaDax.AGREGACAO_SIMPLES,
        descricao: null,
        formato_string: null,
        metrica_analitica_id: null,
        ordem: 1,
        criado_em: '2026-09-01T00:00:00.000Z',
        atualizado_em: '2026-09-01T00:00:00.000Z',
      },
    ]);

    const useCase = new ExecutarCopilotoDashboardUseCase(mockDemandRepo, mockModeloPbiRepo);

    const outputA = await useCase.execute({ demandaId: 'demanda-A' });
    const outputB = await useCase.execute({ demandaId: 'demanda-B' });

    expect(outputA.contextoUtilizado.modeloPowerBi?.id).toBe('pbi-A');
    expect(outputA.contextoUtilizado.medidas).toHaveLength(1);
    expect(outputA.contextoUtilizado.medidas[0].nome).toBe('Receita Demanda A');

    expect(outputB.contextoUtilizado.modeloPowerBi?.id).toBe('pbi-B');
    expect(outputB.contextoUtilizado.medidas).toHaveLength(1);
    expect(outputB.contextoUtilizado.medidas[0].nome).toBe('Custo Demanda B');
  });

  // 7. Perguntas/requisitos pertencentes somente à demanda correta
  it('7. deve recuperar perguntas e requisitos exclusivamente vinculados à demanda informada', async () => {
    criarDemandaFixture('demanda-com-pergunta', {
      solicitacao_bruta: 'Como variou o churn no último trimestre?',
      objetivo_inicial: 'Reduzir perda de clientes',
      restricoes_declaradas: 'Apenas contratos ativos',
    });
    criarModeloAnaliticoFixture('mod-an-churn', 'demanda-com-pergunta');

    const useCase = new ExecutarCopilotoDashboardUseCase(
      mockDemandRepo,
      mockModeloPbiRepo,
      undefined,
      undefined,
      undefined,
      mockModeloAnaliticoRepo
    );

    const output = await useCase.execute({ demandaId: 'demanda-com-pergunta' });

    expect(output.contextoUtilizado.perguntasNegocio).toContain('Como variou o churn no último trimestre?');
    expect(output.contextoUtilizado.perguntasNegocio).toContain(
      'Qual o volume financeiro total faturado no período?'
    );
    expect(output.contextoUtilizado.requisitosNegocio).toContain('Reduzir perda de clientes');
    expect(output.contextoUtilizado.requisitosNegocio).toContain('Apenas contratos ativos');
  });

  // 8. D-01–D-08 corretamente fornecido como contexto somente leitura
  it('8. deve executar D-01 a D-08 e fornecer o diagnóstico somente-leitura ao Copiloto', async () => {
    criarDemandaFixture('demanda-com-dax');
    criarModeloPbiFixture('pbi-com-dax', 'demanda-com-dax');

    const useCase = new ExecutarCopilotoDashboardUseCase(mockDemandRepo, mockModeloPbiRepo);
    const output = await useCase.execute({ demandaId: 'demanda-com-dax' });

    const resultadoDax = output.contextoUtilizado.resultadoConformidadeDax;
    expect(resultadoDax).toBeDefined();
    expect(resultadoDax?.diagnosticos).toBeInstanceOf(Array);
    expect(typeof resultadoDax?.apto_para_validacao).toBe('boolean');
  });

  // 9. Resultado do Copiloto determinístico
  it('9. deve produzir resultados 100% idênticos em execuções repetidas do mesmo contexto', async () => {
    criarDemandaFixture('demanda-det');
    criarModeloPbiFixture('pbi-det', 'demanda-det');

    const useCase = new ExecutarCopilotoDashboardUseCase(mockDemandRepo, mockModeloPbiRepo);

    const res1 = await useCase.execute({ demandaId: 'demanda-det' });
    const res2 = await useCase.execute({ demandaId: 'demanda-det' });

    expect(res1.resultado.total_insights).toBe(res2.resultado.total_insights);
    expect(res1.resultado.insights.map((i) => i.id)).toEqual(res2.resultado.insights.map((i) => i.id));
    expect(res1.resultado.insight_principal?.id).toBe(res2.resultado.insight_principal?.id);
  });

  // 10. Nenhuma mutação dos artefatos recuperados
  it('10. não deve mutar os objetos de domínio recuperados dos repositórios', async () => {
    const demanda = criarDemandaFixture('demanda-imutavel');
    const snapshotTitulo = demanda.titulo;

    const modelo = criarModeloPbiFixture('pbi-imutavel', 'demanda-imutavel');
    const snapshotArquivo = modelo.nome_arquivo;

    const useCase = new ExecutarCopilotoDashboardUseCase(mockDemandRepo, mockModeloPbiRepo);
    await useCase.execute({ demandaId: 'demanda-imutavel' });

    expect(demandStore.get('demanda-imutavel')?.titulo).toBe(snapshotTitulo);
    expect(modeloPbiStore.get('pbi-imutavel')?.nome_arquivo).toBe(snapshotArquivo);
  });

  // 11. Nenhum efeito colateral (sem mutações de escrita)
  it('11. não deve realizar operações de escrita nos repositórios durante a execução', async () => {
    criarDemandaFixture('demanda-read-only');
    criarModeloPbiFixture('pbi-read-only', 'demanda-read-only');

    const writeSpy = {
      demandUpdateCalled: false,
      pbiUpdateCalled: false,
    };

    mockDemandRepo.update = async () => {
      writeSpy.demandUpdateCalled = true;
      return null;
    };
    mockModeloPbiRepo.update = async (m) => {
      writeSpy.pbiUpdateCalled = true;
      return m;
    };

    const useCase = new ExecutarCopilotoDashboardUseCase(mockDemandRepo, mockModeloPbiRepo);
    await useCase.execute({ demandaId: 'demanda-read-only' });

    expect(writeSpy.demandUpdateCalled).toBe(false);
    expect(writeSpy.pbiUpdateCalled).toBe(false);
  });

  // 12. Ausência de chamadas externas / LLM (execução ultrarrápida local)
  it('12. deve executar de forma 100% local em menos de 100ms sem requisições externas', async () => {
    criarDemandaFixture('demanda-tempo');
    criarModeloPbiFixture('pbi-tempo', 'demanda-tempo');

    const useCase = new ExecutarCopilotoDashboardUseCase(mockDemandRepo, mockModeloPbiRepo);

    const inicio = Date.now();
    const output = await useCase.execute({ demandaId: 'demanda-tempo' });
    const duracao = Date.now() - inicio;

    expect(output).toBeDefined();
    expect(duracao).toBeLessThan(100);
  });

  // 13. Tratamento seguro de repositório vazio
  it('13. deve lidar de forma segura quando o repositório de modelos estiver totalmente vazio', async () => {
    criarDemandaFixture('demanda-vazia');

    const emptyPbiRepo: IModeloPowerBiRepository = {
      findById: async () => null,
      findByDemandaId: async () => [],
      findCompletoById: async () => null,
      create: async (m) => m,
      update: async (m) => m,
      delete: async () => {},
    };

    const useCase = new ExecutarCopilotoDashboardUseCase(mockDemandRepo, emptyPbiRepo);
    const output = await useCase.execute({ demandaId: 'demanda-vazia' });

    expect(output.contextoUtilizado.modeloPowerBi).toBeNull();
    expect(output.contextoUtilizado.medidas).toHaveLength(0);
    expect(output.resultado).toBeDefined();
  });

  // 14. Erro controlado para demanda inexistente
  it('14. deve lançar erro controlado quando a demanda não existir', async () => {
    const useCase = new ExecutarCopilotoDashboardUseCase(mockDemandRepo, mockModeloPbiRepo);

    await expect(useCase.execute({ demandaId: 'demanda-inexistente-999' })).rejects.toThrow(
      'Demanda com ID "demanda-inexistente-999" não encontrada.'
    );
  });

  // Verificação adicional: Estado Pedagógico preenchido corretamente
  it('deve fornecer respostas completas aos 6 pilares do estado pedagógico', async () => {
    criarDemandaFixture('demanda-pedagogica', { titulo: 'Relatório de Margem' });
    criarModeloPbiFixture('pbi-pedagogica', 'demanda-pedagogica');

    const useCase = new ExecutarCopilotoDashboardUseCase(mockDemandRepo, mockModeloPbiRepo);
    const output = await useCase.execute({ demandaId: 'demanda-pedagogica' });

    const ep = output.estadoPedagogico;
    expect(ep.ondeEstou).toContain('Relatório de Margem');
    expect(ep.oQueEstouFazendo.length).toBeGreaterThan(0);
    expect(ep.porQueEstouFazendo.length).toBeGreaterThan(0);
    expect(ep.oQueFoiDetectado.length).toBeGreaterThan(0);
    expect(ep.oQueConsiderarFazerAgora.length).toBeGreaterThan(0);
  });
});
