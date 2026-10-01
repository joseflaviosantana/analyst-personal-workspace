import { describe, it, expect } from 'vitest';
import {
  criarModeloPowerBiSchema,
  atualizarModeloPowerBiSchema,
  criarMedidaDaxSchema,
  atualizarMedidaDaxSchema,
  criarPaginaRelatorioSchema,
  atualizarPaginaRelatorioSchema,
  criarVisualDashboardSchema,
  atualizarVisualDashboardSchema,
} from '@/lib/validations/dashboard-schema';
import { TipoFormatoModeloPowerBi } from '@/core/domain/enums/tipo-formato-modelo-powerbi';
import { StatusModeloPowerBi } from '@/core/domain/enums/status-modelo-powerbi';
import { CategoriaMedidaDax } from '@/core/domain/enums/categoria-medida-dax';
import { PublicoAlvoPagina } from '@/core/domain/enums/publico-alvo-pagina';
import { LayoutGridPagina } from '@/core/domain/enums/layout-grid-pagina';
import { TipoVisualDashboard } from '@/core/domain/enums/tipo-visual-dashboard';
import { PosicaoLayoutVisual } from '@/core/domain/enums/posicao-layout-visual';

describe('Unit Tests: Validações de Domínio de Dashboard e DAX (Subgate 3.1)', () => {
  describe('Modelo Power BI Schema', () => {
    it('deve validar com sucesso um modelo .pbix padrão', () => {
      const input = {
        demandaId: 'dem_123',
        nomeArquivo: 'vendas_executivo.pbix',
        tipoFormato: TipoFormatoModeloPowerBi.PBIX,
        status: StatusModeloPowerBi.EM_DESENVOLVIMENTO,
      };

      const result = criarModeloPowerBiSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tipoFormato).toBe(TipoFormatoModeloPowerBi.PBIX);
        expect(result.data.tamanhoBytes).toBe(0);
      }
    });

    it('deve validar com sucesso um projeto .pbip', () => {
      const input = {
        demandaId: 'dem_123',
        modeloAnaliticoId: 'mod_456',
        nomeArquivo: 'vendas_projeto.pbip',
        caminhoLocal: 'C:\\Projetos\\BI\\vendas_projeto.pbip',
        tipoFormato: TipoFormatoModeloPowerBi.PBIP,
        status: StatusModeloPowerBi.CONCLUIDO,
        versaoPowerBi: '2.128.100.0',
        tamanhoBytes: 154200,
      };

      const result = criarModeloPowerBiSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('deve aceitar ISENTO_EXCEL_ONLY quando acompanhado de justificativa formal com >= 15 caracteres', () => {
      const input = {
        demandaId: 'dem_123',
        nomeArquivo: 'isencao_powerbi.txt',
        tipoFormato: TipoFormatoModeloPowerBi.ISENTO_EXCEL_ONLY,
        justificativaIsencao: 'Entrega acordada exclusivamente em planilha tratada com Power Query.',
      };

      const result = criarModeloPowerBiSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('deve rejeitar ISENTO_EXCEL_ONLY quando a justificativa de isenção estiver ausente ou tiver menos de 15 caracteres', () => {
      const inputSemJust = {
        demandaId: 'dem_123',
        nomeArquivo: 'isencao_powerbi.txt',
        tipoFormato: TipoFormatoModeloPowerBi.ISENTO_EXCEL_ONLY,
      };
      const resultSemJust = criarModeloPowerBiSchema.safeParse(inputSemJust);
      expect(resultSemJust.success).toBe(false);

      const inputCurta = {
        demandaId: 'dem_123',
        nomeArquivo: 'isencao_powerbi.txt',
        tipoFormato: TipoFormatoModeloPowerBi.ISENTO_EXCEL_ONLY,
        justificativaIsencao: 'Não precisa.',
      };
      const resultCurta = criarModeloPowerBiSchema.safeParse(inputCurta);
      expect(resultCurta.success).toBe(false);
    });

    it('deve validar atualização de modelo Power BI', () => {
      const input = {
        id: 'pbi_1',
        status: StatusModeloPowerBi.HOMOLOGADO,
      };
      const result = atualizarModeloPowerBiSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe('Medida DAX Schema', () => {
    it('deve validar criação de medida DAX com parâmetros mínimos', () => {
      const input = {
        modeloPowerBiId: 'pbi_1',
        nome: 'Faturamento Total',
        expressaoDax: 'SUM(fVendas[valor_total])',
      };

      const result = criarMedidaDaxSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tabelaHospedeira).toBe('_Medidas');
        expect(result.data.categoriaDax).toBe(CategoriaMedidaDax.AGREGACAO_SIMPLES);
      }
    });

    it('deve validar criação de medida com inteligência temporal e formato customizado', () => {
      const input = {
        modeloPowerBiId: 'pbi_1',
        metricaAnaliticaId: 'met_456',
        nome: 'Faturamento YTD',
        tabelaHospedeira: '_Medidas',
        expressaoDax: 'TOTALYTD([Faturamento Total], dCalendario[Data])',
        descricao: 'Acumulado no ano até a data atual',
        formatoString: 'R$ #,##0.00',
        categoriaDax: CategoriaMedidaDax.TIME_INTELLIGENCE,
        ordem: 2,
      };

      const result = criarMedidaDaxSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('deve rejeitar medida sem nome ou sem expressão DAX', () => {
      const inputSemExpressao = {
        modeloPowerBiId: 'pbi_1',
        nome: 'Faturamento',
        expressaoDax: '',
      };
      expect(criarMedidaDaxSchema.safeParse(inputSemExpressao).success).toBe(false);

      const inputSemNome = {
        modeloPowerBiId: 'pbi_1',
        nome: '',
        expressaoDax: '1 + 1',
      };
      expect(criarMedidaDaxSchema.safeParse(inputSemNome).success).toBe(false);
    });

    it('deve validar atualização parcial de medida DAX', () => {
      const input = {
        id: 'dax_1',
        expressaoDax: 'CALCULATE(SUM(fVendas[valor_total]))',
        categoriaDax: CategoriaMedidaDax.CALCULATE_MODIFICADOR,
      };
      expect(atualizarMedidaDaxSchema.safeParse(input).success).toBe(true);
    });
  });

  describe('Página de Relatório Schema', () => {
    it('deve validar criação de página com valores padrão', () => {
      const input = {
        modeloPowerBiId: 'pbi_1',
        nome: 'Visão Geral Executiva',
      };

      const result = criarPaginaRelatorioSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.publicoAlvo).toBe(PublicoAlvoPagina.EXECUTIVO);
        expect(result.data.layoutGrid).toBe(LayoutGridPagina.PADRAO_16_9);
      }
    });

    it('deve validar página tooltip ou mobile', () => {
      const input = {
        modeloPowerBiId: 'pbi_1',
        nome: 'Tooltip Vendas Canal',
        publicoAlvo: PublicoAlvoPagina.OPERACIONAL,
        layoutGrid: LayoutGridPagina.TOOLTIP,
        ordem: 4,
      };

      expect(criarPaginaRelatorioSchema.safeParse(input).success).toBe(true);
    });

    it('deve validar atualização de página', () => {
      const input = {
        id: 'pag_1',
        nome: 'Visão Atualizada',
        publicoAlvo: PublicoAlvoPagina.GERENCIAL,
      };
      expect(atualizarPaginaRelatorioSchema.safeParse(input).success).toBe(true);
    });
  });

  describe('Visual Dashboard Schema', () => {
    it('deve validar criação de visual com posicionamento e justificativa de Data Viz', () => {
      const input = {
        paginaId: 'pag_1',
        titulo: 'Faturamento Mensal por Canal',
        tipoVisual: TipoVisualDashboard.GRAFICO_LINHAS,
        posicaoLayout: PosicaoLayoutVisual.CENTRAL_TENDENCIAS,
        medidasUtilizadasIds: ['dax_1'],
        atributosUtilizadosIds: ['att_data', 'att_canal'],
        justificativaDataviz: 'Gráfico de linha contínua é o padrão cognitivo mais eficiente para séries temporais.',
      };

      const result = criarVisualDashboardSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ordem).toBe(0);
        expect(result.data.medidasUtilizadasIds).toHaveLength(1);
      }
    });

    it('deve rejeitar visual sem título ou sem página de vínculo', () => {
      const semTitulo = {
        paginaId: 'pag_1',
        titulo: '',
      };
      expect(criarVisualDashboardSchema.safeParse(semTitulo).success).toBe(false);

      const semPagina = {
        paginaId: '',
        titulo: 'Cartão KPI',
      };
      expect(criarVisualDashboardSchema.safeParse(semPagina).success).toBe(false);
    });

    it('deve validar atualização de visual', () => {
      const input = {
        id: 'vis_1',
        titulo: 'Novo Título do Gráfico',
        posicaoLayout: PosicaoLayoutVisual.TOPO_KPIS,
      };
      expect(atualizarVisualDashboardSchema.safeParse(input).success).toBe(true);
    });
  });
});
