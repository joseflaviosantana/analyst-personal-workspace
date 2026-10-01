import { z } from 'zod';
import { TipoFormatoModeloPowerBi } from '@/core/domain/enums/tipo-formato-modelo-powerbi';
import { StatusModeloPowerBi } from '@/core/domain/enums/status-modelo-powerbi';
import { CategoriaMedidaDax } from '@/core/domain/enums/categoria-medida-dax';
import { PublicoAlvoPagina } from '@/core/domain/enums/publico-alvo-pagina';
import { LayoutGridPagina } from '@/core/domain/enums/layout-grid-pagina';
import { TipoVisualDashboard } from '@/core/domain/enums/tipo-visual-dashboard';
import { PosicaoLayoutVisual } from '@/core/domain/enums/posicao-layout-visual';

/**
 * Validação de Modelo Power BI
 */
export const criarModeloPowerBiSchema = z
  .object({
    id: z.string().min(1, 'ID do modelo é obrigatório').optional(),
    demandaId: z.string().min(1, 'ID da demanda é obrigatório'),
    modeloAnaliticoId: z.string().nullable().optional(),
    nomeArquivo: z.string().min(1, 'Nome do arquivo é obrigatório').max(255),
    caminhoLocal: z.string().nullable().optional(),
    tipoFormato: z.nativeEnum(TipoFormatoModeloPowerBi).default(TipoFormatoModeloPowerBi.PBIX),
    status: z.nativeEnum(StatusModeloPowerBi).default(StatusModeloPowerBi.EM_DESENVOLVIMENTO),
    justificativaIsencao: z.string().nullable().optional(),
    hashSha256: z.string().nullable().optional(),
    versaoPowerBi: z.string().nullable().optional(),
    tamanhoBytes: z.number().int().min(0).default(0),
  })
  .refine(
    (data) => {
      if (data.tipoFormato === TipoFormatoModeloPowerBi.ISENTO_EXCEL_ONLY) {
        return !!data.justificativaIsencao && data.justificativaIsencao.trim().length >= 15;
      }
      return true;
    },
    {
      message:
        'A declaração de isenção de Power BI (entrega exclusiva em planilha) exige justificativa formal com no mínimo 15 caracteres.',
      path: ['justificativaIsencao'],
    }
  );

export type CriarModeloPowerBiInput = z.input<typeof criarModeloPowerBiSchema>;

export const atualizarModeloPowerBiSchema = z
  .object({
    id: z.string().min(1, 'ID do modelo é obrigatório'),
    nomeArquivo: z.string().min(1).max(255).optional(),
    caminhoLocal: z.string().nullable().optional(),
    tipoFormato: z.nativeEnum(TipoFormatoModeloPowerBi).optional(),
    status: z.nativeEnum(StatusModeloPowerBi).optional(),
    justificativaIsencao: z.string().nullable().optional(),
    hashSha256: z.string().nullable().optional(),
    versaoPowerBi: z.string().nullable().optional(),
    tamanhoBytes: z.number().int().min(0).optional(),
  })
  .refine(
    (data) => {
      if (data.tipoFormato === TipoFormatoModeloPowerBi.ISENTO_EXCEL_ONLY) {
        return !!data.justificativaIsencao && data.justificativaIsencao.trim().length >= 15;
      }
      return true;
    },
    {
      message:
        'A declaração de isenção de Power BI exige justificativa formal com no mínimo 15 caracteres.',
      path: ['justificativaIsencao'],
    }
  );

export type AtualizarModeloPowerBiInput = z.input<typeof atualizarModeloPowerBiSchema>;

/**
 * Validação de Medida DAX
 */
export const criarMedidaDaxSchema = z.object({
  id: z.string().min(1, 'ID da medida é obrigatório').optional(),
  modeloPowerBiId: z.string().min(1, 'ID do modelo Power BI é obrigatório'),
  metricaAnaliticaId: z.string().nullable().optional(),
  nome: z.string().min(1, 'Nome da medida é obrigatório').max(100),
  tabelaHospedeira: z.string().min(1, 'Tabela hospedeira é obrigatória').max(100).default('_Medidas'),
  expressaoDax: z.string().min(1, 'Expressão DAX é obrigatória'),
  descricao: z.string().nullable().optional(),
  formatoString: z.string().nullable().optional(),
  categoriaDax: z.nativeEnum(CategoriaMedidaDax).default(CategoriaMedidaDax.AGREGACAO_SIMPLES),
  ordem: z.number().int().min(0).default(0),
});

export type CriarMedidaDaxInput = z.input<typeof criarMedidaDaxSchema>;

export const atualizarMedidaDaxSchema = z.object({
  id: z.string().min(1, 'ID da medida é obrigatório'),
  metricaAnaliticaId: z.string().nullable().optional(),
  nome: z.string().min(1).max(100).optional(),
  tabelaHospedeira: z.string().min(1).max(100).optional(),
  expressaoDax: z.string().min(1).optional(),
  descricao: z.string().nullable().optional(),
  formatoString: z.string().nullable().optional(),
  categoriaDax: z.nativeEnum(CategoriaMedidaDax).optional(),
  ordem: z.number().int().min(0).optional(),
});

export type AtualizarMedidaDaxInput = z.input<typeof atualizarMedidaDaxSchema>;

/**
 * Validação de Página de Relatório
 */
export const criarPaginaRelatorioSchema = z.object({
  id: z.string().min(1, 'ID da página é obrigatório').optional(),
  modeloPowerBiId: z.string().min(1, 'ID do modelo Power BI é obrigatório'),
  nome: z.string().min(1, 'Nome da página é obrigatório').max(100),
  ordem: z.number().int().min(0).default(0),
  objetivoAnalitico: z.string().nullable().optional(),
  publicoAlvo: z.nativeEnum(PublicoAlvoPagina).default(PublicoAlvoPagina.EXECUTIVO),
  layoutGrid: z.nativeEnum(LayoutGridPagina).default(LayoutGridPagina.PADRAO_16_9),
});

export type CriarPaginaRelatorioInput = z.input<typeof criarPaginaRelatorioSchema>;

export const atualizarPaginaRelatorioSchema = z.object({
  id: z.string().min(1, 'ID da página é obrigatório'),
  nome: z.string().min(1).max(100).optional(),
  ordem: z.number().int().min(0).optional(),
  objetivoAnalitico: z.string().nullable().optional(),
  publicoAlvo: z.nativeEnum(PublicoAlvoPagina).optional(),
  layoutGrid: z.nativeEnum(LayoutGridPagina).optional(),
});

export type AtualizarPaginaRelatorioInput = z.input<typeof atualizarPaginaRelatorioSchema>;

/**
 * Validação de Visual do Dashboard
 */
export const criarVisualDashboardSchema = z.object({
  id: z.string().min(1, 'ID do visual é obrigatório').optional(),
  paginaId: z.string().min(1, 'ID da página é obrigatório'),
  titulo: z.string().min(1, 'Título do visual é obrigatório').max(150),
  tipoVisual: z.nativeEnum(TipoVisualDashboard).default(TipoVisualDashboard.CARTAO_KPI),
  posicaoLayout: z.nativeEnum(PosicaoLayoutVisual).default(PosicaoLayoutVisual.CENTRAL_TENDENCIAS),
  medidasUtilizadasIds: z.array(z.string()).default([]),
  atributosUtilizadosIds: z.array(z.string()).default([]),
  justificativaDataviz: z.string().nullable().optional(),
  ordem: z.number().int().min(0).default(0),
});

export type CriarVisualDashboardInput = z.input<typeof criarVisualDashboardSchema>;

export const atualizarVisualDashboardSchema = z.object({
  id: z.string().min(1, 'ID do visual é obrigatório'),
  titulo: z.string().min(1).max(150).optional(),
  tipoVisual: z.nativeEnum(TipoVisualDashboard).optional(),
  posicaoLayout: z.nativeEnum(PosicaoLayoutVisual).optional(),
  medidasUtilizadasIds: z.array(z.string()).optional(),
  atributosUtilizadosIds: z.array(z.string()).optional(),
  justificativaDataviz: z.string().nullable().optional(),
  ordem: z.number().int().min(0).optional(),
});

export type AtualizarVisualDashboardInput = z.input<typeof atualizarVisualDashboardSchema>;

/**
 * Validação de Geração do Pacote de Entrega do Dashboard
 */
export const gerarPacoteEntregaDashboardSchema = z.object({
  demandaId: z.string().min(1, 'ID da demanda é obrigatório'),
  templateEscolhido: z.string().optional().default('Executive Premium'),
});

export type GerarPacoteEntregaDashboardInputSchema = z.input<
  typeof gerarPacoteEntregaDashboardSchema
>;
