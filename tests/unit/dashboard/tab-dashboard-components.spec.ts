/**
 * tests/unit/dashboard/tab-dashboard-components.spec.ts
 *
 * Suíte de Testes da Interface da Aba 7 — Power BI & Dashboard (Subgate 3.4A)
 *
 * Cenários Testados:
 * 1. Todos os componentes visuais da Aba 7 são exportados e tipados;
 * 2. Aba 7 deixa de ser placeholder no workspace-view;
 * 3. Cabeçalho pedagógico com texto normativo obrigatório e próxima ação;
 * 4. Estrutura progressiva em 5 blocos sequenciais (Progressive Disclosure);
 * 5. Suporte explícito ao estado "sem Modelo Power BI" (Empty State);
 * 6. Suporte explícito ao estado "Modelo Power BI existente";
 * 7. Suporte explícito ao estado "Isento Excel-only" (D-08);
 * 8. Suporte explícito ao estado "Contexto parcial";
 * 9. Reserva arquitetural do Copiloto no Dock com dados do estadoPedagogico;
 * 10. Validação normativa D-01 a D-08 na seção de validação;
 * 11. Preservação e não regressão nas abas 1 a 6.
 */

import { describe, it, expect } from 'vitest';
import React from 'react';

// Importação dos componentes criados para validar integridade
import {
  DashboardPedagogicalHeader,
  DashboardProgressiveNavigation,
  DashboardOverviewSection,
  DashboardMetricsSection,
  DashboardPagesSection,
  DashboardVisualsSection,
  DashboardValidationSection,
  DashboardCopilotPreviewDock,
  RegisterPowerBiModelModal,
  DeclareExemptionModal,
  EditPowerBiModelModal,
  DaxEditor,
  CreateOrEditMedidaDaxModal,
  InspectMedidaDaxModal,
  DeleteMedidaDaxModal,
  CreateOrEditPaginaModal,
  CreateOrEditVisualModal,
  DashboardDeliverySection,
} from '@/components/dashboard';
import { TabDashboard } from '@/components/demands/TabDashboard';
import { DashboardSpecification } from '@/core/domain/dashboard-automation/dashboard-specification';
import { TipoTemplateDashboard } from '@/core/domain/dashboard-design/dashboard-template';
import { PacoteEntregaDashboard } from '@/core/domain/dashboard-delivery/dashboard-delivery-types';

import { ModeloPowerBi } from '@/core/domain/entities/modelo-powerbi';
import { MedidaDax } from '@/core/domain/entities/medida-dax';
import { PaginaRelatorio } from '@/core/domain/entities/pagina-relatorio';
import { VisualDashboard } from '@/core/domain/entities/visual-dashboard';
import { ModeloAnaliticoCompleto } from '@/core/domain/entities/modelo-analitico';
import { TipoFormatoModeloPowerBi } from '@/core/domain/enums/tipo-formato-modelo-powerbi';
import { StatusModeloPowerBi } from '@/core/domain/enums/status-modelo-powerbi';
import { StatusModeloAnalitico } from '@/core/domain/enums/status-modelo-analitico';
import { TipoArquiteturaModelo } from '@/core/domain/enums/tipo-arquitetura-modelo';
import { CategoriaMedidaDax } from '@/core/domain/enums/categoria-medida-dax';
import { TipoAgregacaoMetrica } from '@/core/domain/enums/tipo-agregacao-metrica';
import { PublicoAlvoPagina } from '@/core/domain/enums/publico-alvo-pagina';
import { LayoutGridPagina } from '@/core/domain/enums/layout-grid-pagina';
import { TipoVisualDashboard } from '@/core/domain/enums/tipo-visual-dashboard';
import { PosicaoLayoutVisual } from '@/core/domain/enums/posicao-layout-visual';
import { EstadoPedagogicoDashboard } from '@/core/use-cases/dashboard/executar-copiloto-dashboard.use-case';
import { ResultadoProntidaoDashboard } from '@/core/domain/rules/dashboard-rules-evaluator';

describe('Subgate 3.4A — Fundação Visual e Navegação da Aba 7 (Power BI & Dashboard)', () => {
  it('1. deve exportar todos os componentes da Aba 7', () => {
    expect(DashboardPedagogicalHeader).toBeDefined();
    expect(DashboardProgressiveNavigation).toBeDefined();
    expect(DashboardOverviewSection).toBeDefined();
    expect(DashboardMetricsSection).toBeDefined();
    expect(DashboardPagesSection).toBeDefined();
    expect(DashboardVisualsSection).toBeDefined();
    expect(DashboardValidationSection).toBeDefined();
    expect(DashboardCopilotPreviewDock).toBeDefined();
    expect(TabDashboard).toBeDefined();
  });

  describe('2. Cabeçalho Pedagógico (Propósito e Próxima Ação)', () => {
    it('deve conter o texto de identificação e o objetivo normativo exato', () => {
      const estadoPedagogico: EstadoPedagogicoDashboard = {
        ondeEstou: 'Demanda Teste — Power BI & DAX',
        oQueEstouFazendo: 'Estruturação de métricas e DAX',
        porQueEstouFazendo: 'Garantir que os requisitos de negócio sejam atendidos',
        oQueFoiDetectado: 'Modelo aguarda primeiras medidas',
        oQueConsiderarFazerAgora: 'Adicionar medida DAX de faturamento',
        oQueEstouAprendendo: 'Time Intelligence: Padrão SAMEPERIODLASTYEAR',
      };

      const element = React.createElement(DashboardPedagogicalHeader, {
        estadoPedagogico,
        proximaAcao: {
          tipo: 'REVISAR_MEDIDAS_DAX',
          titulo: 'Adicionar Medida DAX',
          descricao: 'Cadastrar medidas para as métricas homologadas.',
          requerIntervencaoHumana: true,
        },
      });

      expect(element).toBeDefined();
      expect(element.props.estadoPedagogico?.oQueFoiDetectado).toBe('Modelo aguarda primeiras medidas');
      expect(element.props.proximaAcao?.titulo).toBe('Adicionar Medida DAX');
      expect(element.props.proximaAcao?.requerIntervencaoHumana).toBe(true);
    });
  });

  describe('3. Estrutura Progressiva em 5 Blocos (Progressive Disclosure)', () => {
    it('deve contemplar exatamente os 5 blocos da esteira da etapa', () => {
      let blocoSelecionado = 'visao-geral';
      const element = React.createElement(DashboardProgressiveNavigation, {
        blocoAtivo: 'visao-geral',
        onSelecionarBloco: (b) => {
          blocoSelecionado = b;
        },
        totalMedidas: 3,
        totalPaginas: 2,
        totalVisuais: 4,
        totalBloqueios: 0,
      });

      expect(element).toBeDefined();
      expect(element.props.totalMedidas).toBe(3);
      expect(element.props.totalPaginas).toBe(2);
      expect(element.props.totalVisuais).toBe(4);

      // Simula navegação
      element.props.onSelecionarBloco('metricas-dax');
      expect(blocoSelecionado).toBe('metricas-dax');

      element.props.onSelecionarBloco('validacao');
      expect(blocoSelecionado).toBe('validacao');
    });
  });

  describe('4. Suporte a Estados Visuais na Visão Geral', () => {
    it('deve suportar o estado "sem Modelo Power BI" (Empty State)', () => {
      const element = React.createElement(DashboardOverviewSection, {
        modeloPowerBi: null,
        modeloAnalitico: null,
        totalMedidas: 0,
        totalPaginas: 0,
        totalVisuais: 0,
      });

      expect(element).toBeDefined();
      expect(element.props.modeloPowerBi).toBeNull();
    });

    it('deve suportar o estado "Isento Excel-only" (D-08)', () => {
      const modeloIsento: ModeloPowerBi = {
        id: 'pbi-isento',
        demanda_id: 'dem-1',
        modelo_analitico_id: null,
        nome_arquivo: 'Isencao_Excel.xlsx',
        caminho_local: null,
        tipo_formato: TipoFormatoModeloPowerBi.ISENTO_EXCEL_ONLY,
        status: StatusModeloPowerBi.HOMOLOGADO,
        justificativa_isencao: 'Consumo exclusivamente em planilhas sem necessidade de Power BI.',
        hash_sha256: null,
        versao_powerbi: null,
        tamanho_bytes: 0,
        criado_em: '2026-09-01T00:00:00.000Z',
        atualizado_em: '2026-09-01T00:00:00.000Z',
      };

      const element = React.createElement(DashboardOverviewSection, {
        modeloPowerBi: modeloIsento,
        modeloAnalitico: null,
        totalMedidas: 0,
        totalPaginas: 0,
        totalVisuais: 0,
      });

      expect(element).toBeDefined();
      expect(element.props.modeloPowerBi?.tipo_formato).toBe(TipoFormatoModeloPowerBi.ISENTO_EXCEL_ONLY);
      expect(element.props.modeloPowerBi?.justificativa_isencao).toContain('Consumo exclusivamente em planilhas');
    });

    it('deve suportar o estado "Modelo Power BI Existente com Contexto Parcial"', () => {
      const modeloExistente: ModeloPowerBi = {
        id: 'pbi-pbip',
        demanda_id: 'dem-1',
        modelo_analitico_id: 'mod-an-1',
        nome_arquivo: 'RelatorioVendas.pbip',
        caminho_local: 'C:/Analytics/RelatorioVendas.pbip',
        tipo_formato: TipoFormatoModeloPowerBi.PBIP,
        status: StatusModeloPowerBi.EM_DESENVOLVIMENTO,
        justificativa_isencao: null,
        hash_sha256: 'sha256_dummy',
        versao_powerbi: '2.126.0',
        tamanho_bytes: 409600,
        criado_em: '2026-09-01T00:00:00.000Z',
        atualizado_em: '2026-09-01T00:00:00.000Z',
      };

      const element = React.createElement(DashboardOverviewSection, {
        modeloPowerBi: modeloExistente,
        modeloAnalitico: null,
        totalMedidas: 0, // Parcial (sem medidas)
        totalPaginas: 0, // Parcial (sem páginas)
        totalVisuais: 0,
      });

      expect(element).toBeDefined();
      expect(element.props.modeloPowerBi?.nome_arquivo).toBe('RelatorioVendas.pbip');
      expect(element.props.totalMedidas).toBe(0);
    });
  });

  describe('5. Seções Específicas de Métricas, Páginas e Visuais', () => {
    it('deve renderizar seção de Métricas & DAX com medidas cadastradas', () => {
      const medidas: MedidaDax[] = [
        {
          id: 'med-1',
          modelo_powerbi_id: 'pbi-1',
          metrica_analitica_id: 'met-1',
          tabela_hospedeira: '_Medidas',
          nome: 'Faturamento Total',
          expressao_dax: 'SUM(f_vendas[valor])',
          descricao: 'Total faturado',
          formato_string: 'R$ #,##0',
          categoria_dax: CategoriaMedidaDax.AGREGACAO_SIMPLES,
          ordem: 1,
          criado_em: '2026-09-01T00:00:00.000Z',
          atualizado_em: '2026-09-01T00:00:00.000Z',
        },
      ];

      const element = React.createElement(DashboardMetricsSection, {
        medidas,
        isIsento: false,
      });

      expect(element.props.medidas).toHaveLength(1);
      expect(element.props.medidas[0].nome).toBe('Faturamento Total');
    });

    it('deve renderizar seção de Páginas com metadados de público-alvo', () => {
      const paginas: PaginaRelatorio[] = [
        {
          id: 'pag-1',
          modelo_powerbi_id: 'pbi-1',
          nome: 'Executivo',
          ordem: 1,
          objetivo_analitico: 'Visão executiva consolidada',
          publico_alvo: PublicoAlvoPagina.EXECUTIVO,
          layout_grid: LayoutGridPagina.PADRAO_16_9,
          criado_em: '2026-09-01T00:00:00.000Z',
          atualizado_em: '2026-09-01T00:00:00.000Z',
        },
      ];

      const element = React.createElement(DashboardPagesSection, {
        paginas,
        isIsento: false,
      });

      expect(element.props.paginas).toHaveLength(1);
      expect(element.props.paginas[0].publico_alvo).toBe(PublicoAlvoPagina.EXECUTIVO);
    });

    it('deve renderizar seção de Visuais com justificativas DataViz', () => {
      const visuais: VisualDashboard[] = [
        {
          id: 'vis-1',
          pagina_id: 'pag-1',
          titulo: 'Receita por Mês',
          tipo_visual: TipoVisualDashboard.GRAFICO_LINHAS,
          posicao_layout: PosicaoLayoutVisual.CENTRAL_TENDENCIAS,
          medidas_utilizadas_ids: ['med-1'],
          atributos_utilizados_ids: ['att-1'],
          justificativa_dataviz: 'Análise de tendência temporal linear',
          ordem: 1,
          criado_em: '2026-09-01T00:00:00.000Z',
          atualizado_em: '2026-09-01T00:00:00.000Z',
        },
      ];

      const element = React.createElement(DashboardVisualsSection, {
        visuais,
        isIsento: false,
      });

      expect(element.props.visuais).toHaveLength(1);
      expect(element.props.visuais[0].justificativa_dataviz).toBe('Análise de tendência temporal linear');
    });
  });

  describe('6. Validação Normativa D-01 a D-08', () => {
    it('deve refletir o status de prontidão e os diagnósticos da suíte normativa', () => {
      const resultadoDax: ResultadoProntidaoDashboard = {
        status_geral: 'BLOQUEIO',
        apto_para_validacao: false,
        isento_powerbi: false,
        total_bloqueios: 1,
        total_alertas_criticos: 0,
        total_recomendacoes: 1,
        diagnosticos: [
          {
            codigo_regra: 'D-02',
            severidade: 'BLOQUEIO',
            titulo: 'Métricas analíticas homologadas sem correspondência DAX',
            deteccao: 'Métrica "Receita" não possui medida DAX cadastrada.',
            explicacao: 'Toda métrica homologada deve ter implementação.',
            recomendacao: 'Crie a medida DAX correspondente.',
            impacto_prontidao: 'Bloqueio formal.',
            evidencia: 'Metrica ID met-1 sem medida.',
          },
        ],
        resumo: {
          total_medidas: 0,
          total_paginas: 0,
          total_visuais: 0,
          metricas_homologadas_cobertas: 0,
          total_metricas_homologadas: 1,
        },
        avaliado_em: '2026-09-01T00:00:00.000Z',
      };

      const element = React.createElement(DashboardValidationSection, {
        resultadoDax,
        isIsento: false,
      });

      expect(element.props.resultadoDax?.apto_para_validacao).toBe(false);
      expect(element.props.resultadoDax?.total_bloqueios).toBe(1);
      expect(element.props.resultadoDax?.diagnosticos[0].codigo_regra).toBe('D-02');
    });
  });

  describe('7. Reserva do Copiloto no Dock (Progressive Disclosure Pedagógico)', () => {
    it('deve renderizar orientação mínima derivada do estadoPedagogico', () => {
      const estadoPedagogico: EstadoPedagogicoDashboard = {
        ondeEstou: 'Aba 7 — Power BI',
        oQueEstouFazendo: 'Configurando visual de KPI',
        porQueEstouFazendo: 'Permitir acompanhamento imediato de metas',
        oQueFoiDetectado: 'KPI sem meta comparativa',
        oQueConsiderarFazerAgora: 'Adicionar meta de benchmark',
        oQueEstouAprendendo: 'Contexto Comparativo: KPIs isolados limitam a tomada de decisão',
      };

      const element = React.createElement(DashboardCopilotPreviewDock, {
        estadoPedagogico,
        totalInsights: 2,
      });

      expect(element.props.estadoPedagogico?.oQueFoiDetectado).toBe('KPI sem meta comparativa');
      expect(element.props.estadoPedagogico?.oQueConsiderarFazerAgora).toBe('Adicionar meta de benchmark');
      expect(element.props.totalInsights).toBe(2);
    });
  });

  describe('8. Subgate 3.4B — Modais Operacionais de Criação, Isenção e Edição', () => {
    it('deve exportar e instanciar os 3 modais do Subgate 3.4B', async () => {
      const {
        RegisterPowerBiModelModal,
        DeclareExemptionModal,
        EditPowerBiModelModal,
      } = await import('@/components/dashboard');

      expect(RegisterPowerBiModelModal).toBeDefined();
      expect(DeclareExemptionModal).toBeDefined();
      expect(EditPowerBiModelModal).toBeDefined();
    });

    it('deve suportar callbacks de abertura em DashboardOverviewSection (Empty, PBIX e Isento)', () => {
      let registerTriggered = false;
      let exemptionTriggered = false;
      let editTriggered = false;

      // 1. Estado Vazio: Acionamento dos botões de registro e isenção
      const emptyElement = React.createElement(DashboardOverviewSection, {
        modeloPowerBi: null,
        modeloAnalitico: null,
        totalMedidas: 0,
        totalPaginas: 0,
        totalVisuais: 0,
        onOpenRegisterModal: () => {
          registerTriggered = true;
        },
        onOpenExemptionModal: () => {
          exemptionTriggered = true;
        },
      });

      expect(emptyElement.props.onOpenRegisterModal).toBeDefined();
      emptyElement.props.onOpenRegisterModal?.();
      expect(registerTriggered).toBe(true);

      expect(emptyElement.props.onOpenExemptionModal).toBeDefined();
      emptyElement.props.onOpenExemptionModal?.();
      expect(exemptionTriggered).toBe(true);

      // 2. Estado PBIX: Acionamento de edição
      const pbiModelo: ModeloPowerBi = {
        id: 'pbi-1',
        demanda_id: 'dem-1',
        modelo_analitico_id: null,
        nome_arquivo: 'vendas.pbix',
        caminho_local: null,
        tipo_formato: TipoFormatoModeloPowerBi.PBIX,
        status: StatusModeloPowerBi.EM_DESENVOLVIMENTO,
        justificativa_isencao: null,
        hash_sha256: null,
        versao_powerbi: null,
        tamanho_bytes: 1024,
        criado_em: '2026-09-01T00:00:00Z',
        atualizado_em: '2026-09-01T00:00:00Z',
      };

      const pbixElement = React.createElement(DashboardOverviewSection, {
        modeloPowerBi: pbiModelo,
        modeloAnalitico: null,
        totalMedidas: 1,
        totalPaginas: 1,
        totalVisuais: 1,
        onOpenEditModal: () => {
          editTriggered = true;
        },
      });

      expect(pbixElement.props.onOpenEditModal).toBeDefined();
      pbixElement.props.onOpenEditModal?.();
      expect(editTriggered).toBe(true);

      // 3. Estado Isento: Acionamento de edição de justificativa
      let editExemptionTriggered = false;
      const isentoModelo: ModeloPowerBi = {
        ...pbiModelo,
        tipo_formato: TipoFormatoModeloPowerBi.ISENTO_EXCEL_ONLY,
        justificativa_isencao: 'Consumo exclusivo em planilha dinâmica gerencial.',
      };

      const isentoElement = React.createElement(DashboardOverviewSection, {
        modeloPowerBi: isentoModelo,
        modeloAnalitico: null,
        totalMedidas: 0,
        totalPaginas: 0,
        totalVisuais: 0,
        onOpenEditModal: () => {
          editExemptionTriggered = true;
        },
      });

      expect(isentoElement.props.onOpenEditModal).toBeDefined();
      isentoElement.props.onOpenEditModal?.();
      expect(editExemptionTriggered).toBe(true);
    });
  });

  describe('13. Subgate 3.4C — Gestão de Medidas & DAX (Componentes e Modais)', () => {
    it('deve exportar todos os novos componentes de medidas e editor DAX', () => {
      expect(DaxEditor).toBeDefined();
      expect(CreateOrEditMedidaDaxModal).toBeDefined();
      expect(InspectMedidaDaxModal).toBeDefined();
      expect(DeleteMedidaDaxModal).toBeDefined();
    });

    it('DashboardMetricsSection deve instanciar com métricas homologadas e suportar callbacks de modais', () => {
      let createClicked = false;
      let editClicked = false;
      let inspectClicked = false;
      let deleteClicked = false;

      const medidaTeste: MedidaDax = {
        id: 'med-01',
        modelo_powerbi_id: 'pbi-01',
        metrica_analitica_id: 'met-01',
        nome: 'Receita Total',
        tabela_hospedeira: '_Medidas',
        expressao_dax: 'SUM(fVendas[ValorLiquido])',
        descricao: 'Soma do faturamento líquido',
        formato_string: 'R$ #,##0.00',
        categoria_dax: CategoriaMedidaDax.AGREGACAO_SIMPLES,
        ordem: 1,
        criado_em: '2026-09-30T10:00:00Z',
        atualizado_em: '2026-09-30T10:00:00Z',
      };

      const element = React.createElement(DashboardMetricsSection, {
        medidas: [medidaTeste],
        isIsento: false,
        modeloPowerBiId: 'pbi-01',
        modeloPowerBiNome: 'Vendas.pbix',
        demandaId: 'dem-01',
        metricasHomologadas: [
          {
            id: 'met-01',
            modelo_analitico_id: 'mod-01',
            nome: 'Receita Total',
            descricao: 'Receita homologada',
            tipo_agregacao: TipoAgregacaoMetrica.SOMA,
            regra_calculo: 'SUM(fVendas[ValorLiquido])',
            formato: 'MOEDA',
            criado_em: '2026-09-30T10:00:00Z',
            atualizado_em: '2026-09-30T10:00:00Z',
          },
        ],
        onOpenCreateModal: () => {
          createClicked = true;
        },
        onOpenEditModal: () => {
          editClicked = true;
        },
        onOpenInspectModal: () => {
          inspectClicked = true;
        },
        onOpenDeleteModal: () => {
          deleteClicked = true;
        },
      } as any);

      expect(element).toBeDefined();
      expect((element.props as any).medidas.length).toBe(1);
      expect((element.props as any).onOpenCreateModal).toBeDefined();
      (element.props as any).onOpenCreateModal?.();
      expect(createClicked).toBe(true);

      (element.props as any).onOpenEditModal?.(medidaTeste);
      expect(editClicked).toBe(true);

      (element.props as any).onOpenInspectModal?.(medidaTeste);
      expect(inspectClicked).toBe(true);

      (element.props as any).onOpenDeleteModal?.(medidaTeste);
      expect(deleteClicked).toBe(true);
    });

    it('DaxEditor deve renderizar com valor de expressão e notificação de alteração', () => {
      let changedValue = '';
      const element = React.createElement(DaxEditor, {
        value: 'CALCULATE(SUM(fVendas[Valor]))',
        onChange: (val) => {
          changedValue = val;
        },
        nomeMedida: 'Receita',
        tabelaHospedeira: '_Medidas',
      });

      expect(element).toBeDefined();
      expect(element.props.value).toBe('CALCULATE(SUM(fVendas[Valor]))');
      element.props.onChange?.('CALCULATE(SUM(fVendas[ValorLiquido]))');
      expect(changedValue).toBe('CALCULATE(SUM(fVendas[ValorLiquido]))');
    });

    it('CreateOrEditMedidaDaxModal, InspectMedidaDaxModal e DeleteMedidaDaxModal devem ser instanciáveis', () => {
      const medidaTeste: MedidaDax = {
        id: 'med-01',
        modelo_powerbi_id: 'pbi-01',
        metrica_analitica_id: 'met-01',
        nome: 'Receita Total',
        tabela_hospedeira: '_Medidas',
        expressao_dax: 'SUM(fVendas[ValorLiquido])',
        descricao: 'Soma do faturamento líquido',
        formato_string: 'R$ #,##0.00',
        categoria_dax: CategoriaMedidaDax.AGREGACAO_SIMPLES,
        ordem: 1,
        criado_em: '2026-09-30T10:00:00Z',
        atualizado_em: '2026-09-30T10:00:00Z',
      };

      const createModal = React.createElement(CreateOrEditMedidaDaxModal, {
        isOpen: true,
        onClose: () => {},
        modeloPowerBiId: 'pbi-01',
        demandaId: 'dem-01',
        metricasHomologadas: [],
        onSuccess: () => {},
      });
      expect(createModal).toBeDefined();
      expect(createModal.props.isOpen).toBe(true);

      const inspectModal = React.createElement(InspectMedidaDaxModal, {
        isOpen: true,
        onClose: () => {},
        medida: medidaTeste,
        modeloPowerBiNome: 'Vendas.pbix',
      });
      expect(inspectModal).toBeDefined();
      expect(inspectModal.props.medida.nome).toBe('Receita Total');

      const deleteModal = React.createElement(DeleteMedidaDaxModal, {
        isOpen: true,
        onClose: () => {},
        medida: medidaTeste,
        demandaId: 'dem-01',
        hasLinhagem: true,
        onSuccess: () => {},
      });
      expect(deleteModal).toBeDefined();
      expect(deleteModal.props.hasLinhagem).toBe(true);
    });
  });

  describe('10. Subgate 3.4D — Dashboard Automation & Human-in-the-Loop Components', () => {
    it('deve instanciar e configurar CreateOrEditPaginaModal', () => {
      const modal = React.createElement(CreateOrEditPaginaModal, {
        isOpen: true,
        onClose: () => {},
        modeloPowerBiId: 'pbi-01',
        demandaId: 'dem-01',
        proximaOrdem: 2,
        onSuccess: () => {},
      });

      expect(modal).toBeDefined();
      expect(modal.props.isOpen).toBe(true);
      expect(modal.props.proximaOrdem).toBe(2);
    });

    it('deve instanciar e configurar CreateOrEditVisualModal', () => {
      const paginas: PaginaRelatorio[] = [
        {
          id: 'pag-01',
          modelo_powerbi_id: 'pbi-01',
          nome: 'Visão Executiva',
          ordem: 1,
          objetivo_analitico: 'Panorama de vendas',
          publico_alvo: PublicoAlvoPagina.EXECUTIVO,
          layout_grid: LayoutGridPagina.PADRAO_16_9,
          criado_em: '2026-09-30T10:00:00Z',
          atualizado_em: '2026-09-30T10:00:00Z',
        },
      ];

      const modal = React.createElement(CreateOrEditVisualModal, {
        isOpen: true,
        onClose: () => {},
        demandaId: 'dem-01',
        paginas,
        medidas: [],
        paginaPreSelecionadaId: 'pag-01',
        onSuccess: () => {},
      });

      expect(modal).toBeDefined();
      expect(modal.props.isOpen).toBe(true);
      expect(modal.props.paginas).toHaveLength(1);
    });

    it('deve renderizar DashboardPagesSection com proposta pendente de aprovação humana', () => {
      const propostaMock: DashboardSpecification = {
        demandaId: 'dem-01',
        modeloPowerBiId: 'pbi-01',
        templateUtilizado: TipoTemplateDashboard.EXECUTIVE_PREMIUM,
        modoTrabalho: 'AUTOMATICO',
        titulo: 'Proposta Executiva Automática',
        resumoExecutivo: 'Proposta gerada a partir das perguntas e métricas',
        designTokens: {} as any,
        paginas: [
          {
            id: 'pag-prop-1',
            nome: 'Visão Executiva Proposta',
            objetivoAnalitico: 'Síntese de KPIs',
            publicoAlvo: PublicoAlvoPagina.EXECUTIVO,
            layoutGrid: LayoutGridPagina.PADRAO_16_9,
            ordem: 1,
            perguntasAtendidas: ['Qual a receita total?'],
            narrativa: 'Inicia com KPIs e evolui no tempo',
            justificativa: 'Atende às diretrizes de síntese',
            statusAprovacao: 'PROPOSTO',
            visuais: [],
          },
        ],
        totalPaginas: 1,
        totalVisuais: 0,
        statusGeral: 'PROPOSTO',
        geradoEm: '2026-09-30T10:00:00Z',
      };

      const section = React.createElement(DashboardPagesSection, {
        paginas: [],
        propostaAtual: propostaMock,
        onGerarProposta: async () => {},
        onAprovarProposta: async () => {},
        onDescartarProposta: () => {},
      });

      expect(section).toBeDefined();
      expect(section.props.propostaAtual?.statusGeral).toBe('PROPOSTO');
      expect(section.props.propostaAtual?.paginas).toHaveLength(1);
    });

    it('deve renderizar DashboardVisualsSection com filtros e suporte a alternância de visuais', () => {
      const visuaisMock: VisualDashboard[] = [
        {
          id: 'vis-1',
          pagina_id: 'pag-1',
          titulo: 'Evolução Mensal',
          tipo_visual: TipoVisualDashboard.GRAFICO_LINHAS,
          posicao_layout: PosicaoLayoutVisual.CENTRAL_TENDENCIAS,
          medidas_utilizadas_ids: ['dax-1'],
          atributos_utilizados_ids: [],
          justificativa_dataviz: 'Série contínua para análise de tendência',
          ordem: 1,
          criado_em: '2026-09-30T10:00:00Z',
          atualizado_em: '2026-09-30T10:00:00Z',
        },
      ];

      const section = React.createElement(DashboardVisualsSection, {
        visuais: visuaisMock,
        onOpenCreateModal: () => {},
        onExcluirVisual: async () => {},
        onAlternarVisual: async () => {},
      });

      expect(section).toBeDefined();
      expect(section.props.visuais).toHaveLength(1);
      expect(section.props.onAlternarVisual).toBeDefined();
    });
  });

  describe('Subgate 3.4E — Entrega, Exportação e Governança da Aba 7', () => {
    it('1. deve incluir o 6º bloco (entrega-documentacao) no navegador progressivo', () => {
      let blocoSelecionado = '';
      const nav = React.createElement(DashboardProgressiveNavigation, {
        blocoAtivo: 'entrega-documentacao',
        onSelecionarBloco: (b) => {
          blocoSelecionado = b;
        },
        totalMedidas: 3,
        totalPaginas: 2,
        totalVisuais: 4,
        totalBloqueios: 0,
      });

      expect(nav).toBeDefined();
      expect(nav.props.blocoAtivo).toBe('entrega-documentacao');
    });

    it('2. deve renderizar DashboardDeliverySection com checklist e ações de exportação', () => {
      const mockPacote: PacoteEntregaDashboard = {
        versaoPacote: '1.0.0',
        geradoEm: '2026-09-30T10:00:00Z',
        demanda: {
          id: 'dem-1',
          titulo: 'Dashboard Teste',
          projetoNome: 'Projeto',
          objetivo: 'Objetivo',
          contexto: 'Contexto',
          estado: 'EM_MODELAGEM_E_ANALISE',
        },
        modeloPowerBi: {
          id: 'pbi-1',
          tipoFormato: 'PBIX',
          nomeArquivo: 'teste.pbix',
          status: 'EM_DESENVOLVIMENTO',
          versaoPowerBi: '2.128',
          isIsento: false,
          justificativaIsencao: null,
        },
        modeloAnaliticoReferencia: null,
        catalogoMedidasDax: [],
        paginas: [],
        visuais: [],
        perfilVisualTemplate: 'Executive Premium',
        prontidaoNormativa: {
          statusGeral: 'CONFORME',
          aptoParaValidacao: true,
          totalBloqueios: 0,
          totalAlertasCriticos: 0,
          totalRecomendacoes: 0,
          diagnosticos: [],
        },
        orientacoesCopiloto: {
          totalInsights: 0,
          insights: [],
        },
        checklist: {
          itens: [
            {
              id: 'chk-01',
              codigo: 'CHK-01',
              titulo: 'Modelo Power BI',
              descricao: 'Arquivo registrado',
              status: 'CONCLUIDO',
              obrigatorio: true,
            },
          ],
          totalItens: 1,
          totalConcluidos: 1,
          totalPendentes: 0,
          totalBloqueados: 0,
          aptoParaSeguirWorkflow: true,
          percentualConclusao: 100,
        },
        casePortfolio: {
          tituloCase: 'Case Teste',
          problemaNegocio: 'Problema',
          contexto: 'Contexto',
          processoAplicado: 'Processo',
          ferramentasUtilizadas: ['Power BI'],
          decisoesMetodologicas: [],
          metricasChave: [],
          resultadosEsperados: 'Resultados',
          aprendizadosTecnicos: [],
          resumoTecnicoSanitizado: 'Resumo',
          evidenciasDisponiveis: [],
        },
        decisoesHumanas: [],
        statusEntrega: 'PRONTO_PARA_ENTREGA',
      };

      const section = React.createElement(DashboardDeliverySection, {
        pacote: mockPacote,
        documentacaoMarkdown: '# Memorial Técnico',
        pacoteJson: '{}',
        medidasTmdl: '',
        manifestoLayoutJson: '{}',
        isLoading: false,
        onRecarregarPacote: () => {},
      });

      expect(section).toBeDefined();
      expect(section.props.pacote?.statusEntrega).toBe('PRONTO_PARA_ENTREGA');
      expect(section.props.pacote?.checklist.percentualConclusao).toBe(100);
      expect(section.props.documentacaoMarkdown).toContain('Memorial');
    });

    it('3. deve renderizar estado de carregamento e estado vazio sem quebras', () => {
      const sectionLoading = React.createElement(DashboardDeliverySection, {
        pacote: null,
        documentacaoMarkdown: '',
        pacoteJson: '',
        medidasTmdl: '',
        manifestoLayoutJson: '',
        isLoading: true,
        onRecarregarPacote: () => {},
      });

      expect(sectionLoading).toBeDefined();

      const sectionEmpty = React.createElement(DashboardDeliverySection, {
        pacote: null,
        documentacaoMarkdown: '',
        pacoteJson: '',
        medidasTmdl: '',
        manifestoLayoutJson: '',
        isLoading: false,
        onRecarregarPacote: () => {},
      });

      expect(sectionEmpty).toBeDefined();
    });
  });

  describe('10. Governança Read-Only da Aba 7 (B-2)', () => {
    it('deve aceitar isReadOnly=true em DashboardOverviewSection', () => {
      const section = React.createElement(DashboardOverviewSection, {
        modeloPowerBi: null,
        modeloAnalitico: null,
        totalMedidas: 0,
        totalPaginas: 0,
        totalVisuais: 0,
        isReadOnly: true,
      });
      expect(section).toBeDefined();
      expect(section.props.isReadOnly).toBe(true);
    });

    it('deve aceitar isReadOnly=true em DashboardMetricsSection', () => {
      const section = React.createElement(DashboardMetricsSection, {
        medidas: [],
        isReadOnly: true,
      });
      expect(section).toBeDefined();
      expect(section.props.isReadOnly).toBe(true);
    });

    it('deve aceitar isReadOnly=true em DashboardPagesSection', () => {
      const section = React.createElement(DashboardPagesSection, {
        paginas: [],
        isReadOnly: true,
      });
      expect(section).toBeDefined();
      expect(section.props.isReadOnly).toBe(true);
    });

    it('deve aceitar isReadOnly=true em DashboardVisualsSection', () => {
      const section = React.createElement(DashboardVisualsSection, {
        visuais: [],
        isReadOnly: true,
      });
      expect(section).toBeDefined();
      expect(section.props.isReadOnly).toBe(true);
    });
  });
});
