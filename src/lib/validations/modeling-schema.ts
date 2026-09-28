import { z } from 'zod';
import { TipoArquiteturaModelo } from '@/core/domain/enums/tipo-arquitetura-modelo';
import { TipoEntidadeAnalitica } from '@/core/domain/enums/tipo-entidade-analitica';
import { PapelEntidadeAnalitica } from '@/core/domain/enums/papel-entidade-analitica';
import { TipoOrigemEntidade } from '@/core/domain/enums/tipo-origem-entidade';
import { TipoDadoAnalitico } from '@/core/domain/enums/tipo-dado-analitico';
import { PapelAtributoAnalitico } from '@/core/domain/enums/papel-atributo-analitico';
import { CardinalidadeRelacionamento } from '@/core/domain/enums/cardinalidade-relacionamento';
import { DirecaoFiltroRelacionamento } from '@/core/domain/enums/direcao-filtro-relacionamento';
import { TipoAgregacaoMetrica } from '@/core/domain/enums/tipo-agregacao-metrica';
import { TipoAditividadeMetrica } from '@/core/domain/enums/tipo-aditividade-metrica';
import { UnidadeMedidaMetrica } from '@/core/domain/enums/unidade-medida-metrica';
import { StatusMetricaAnalitica } from '@/core/domain/enums/status-metrica-analitica';

export const criarModeloSchema = z.object({
  demandaId: z.string().min(1, 'ID da demanda é obrigatório'),
  datasetAutorizadoId: z.string().min(1, 'ID do dataset autorizado é obrigatório'),
  nome: z.string().min(3, 'Nome do modelo deve ter ao menos 3 caracteres').max(100),
  descricao: z.string().optional(),
  tipoArquitetura: z.nativeEnum(TipoArquiteturaModelo).optional().default(TipoArquiteturaModelo.ESTRELA),
  proporEntidadeFato: z.boolean().optional().default(true),
});

export const atualizarModeloSchema = z.object({
  id: z.string().min(1, 'ID do modelo é obrigatório'),
  nome: z.string().min(3, 'Nome deve ter ao menos 3 caracteres').max(100).optional(),
  descricao: z.string().optional(),
  tipoArquitetura: z.nativeEnum(TipoArquiteturaModelo).optional(),
});

export const adicionarEntidadeSchema = z.object({
  modeloId: z.string().min(1, 'ID do modelo é obrigatório'),
  ativoDadosId: z.string().nullable().optional(),
  nome: z.string().min(2, 'Nome da entidade deve ter ao menos 2 caracteres').max(80),
  tipo: z.nativeEnum(TipoEntidadeAnalitica),
  papel: z.nativeEnum(PapelEntidadeAnalitica).optional().default(PapelEntidadeAnalitica.DIMENSAO_PADRAO),
  origemTipo: z.nativeEnum(TipoOrigemEntidade).optional().default(TipoOrigemEntidade.DATASET_AUTORIZADO),
  descricao: z.string().optional(),
  ordemApresentacao: z.number().int().min(0).optional().default(0),
});

export const atributoConfigItemSchema = z.object({
  id: z.string().optional(),
  nomeOriginal: z.string().min(1, 'Nome original é obrigatório'),
  nomeAmigavel: z.string().min(1, 'Nome amigável é obrigatório'),
  tipoDado: z.nativeEnum(TipoDadoAnalitico).default(TipoDadoAnalitico.TEXTO),
  papel: z.nativeEnum(PapelAtributoAnalitico).default(PapelAtributoAnalitico.ATRIBUTO_DESCRITIVO),
  ordem: z.number().int().min(0).optional().default(0),
  oculto: z.boolean().optional().default(false),
  descricao: z.string().nullable().optional(),
  formatoExibicao: z.string().nullable().optional(),
});

export const configurarAtributosSchema = z.object({
  entidadeId: z.string().min(1, 'ID da entidade é obrigatório'),
  atributos: z.array(atributoConfigItemSchema).min(1, 'Ao menos um atributo deve ser configurado'),
});

export const especificarCalendarioSchema = z.object({
  modeloId: z.string().min(1, 'ID do modelo é obrigatório'),
  nome: z.string().optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
});

export const adicionarRelacionamentoSchema = z.object({
  modeloId: z.string().min(1, 'ID do modelo é obrigatório'),
  entidadeOrigemId: z.string().min(1, 'ID da entidade de origem é obrigatório'),
  atributoOrigemId: z.string().min(1, 'ID do atributo de origem é obrigatório'),
  entidadeDestinoId: z.string().min(1, 'ID da entidade de destino é obrigatório'),
  atributoDestinoId: z.string().min(1, 'ID do atributo de destino é obrigatório'),
  tipoRelacionamento: z.nativeEnum(CardinalidadeRelacionamento).optional().default(CardinalidadeRelacionamento.MUITOS_PARA_UM),
  direcaoFiltro: z.nativeEnum(DirecaoFiltroRelacionamento).optional().default(DirecaoFiltroRelacionamento.UNIDIRECIONAL),
  justificativa: z.string().optional(),
});

export const cadastrarMetricaSchema = z.object({
  modeloId: z.string().min(1, 'ID do modelo é obrigatório'),
  entidadeId: z.string().nullable().optional(),
  nome: z.string().min(2, 'Nome da métrica deve ter ao menos 2 caracteres').max(100),
  descricao: z.string().optional(),
  tipoAgregacao: z.nativeEnum(TipoAgregacaoMetrica),
  tipoAditividade: z.nativeEnum(TipoAditividadeMetrica),
  formulaDeclarativa: z.string().min(1, 'Fórmula declarativa é obrigatória'),
  unidadeMedida: z.nativeEnum(UnidadeMedidaMetrica),
  formatoExibicao: z.string().optional(),
  status: z.nativeEnum(StatusMetricaAnalitica).optional().default(StatusMetricaAnalitica.RASCUNHO),
  atributosDependentesIds: z.array(z.string()).optional().default([]),
  metricasDependentesIds: z.array(z.string()).optional().default([]),
  perguntaNegocioAssociada: z.string().optional(),
  objetivoNegocioAssociado: z.string().optional(),
  ordem: z.number().int().min(0).optional().default(0),
});

export const atualizarMetricaSchema = z.object({
  id: z.string().min(1, 'ID da métrica é obrigatório'),
  entidadeId: z.string().nullable().optional(),
  nome: z.string().min(2, 'Nome deve ter ao menos 2 caracteres').max(100).optional(),
  descricao: z.string().optional(),
  tipoAgregacao: z.nativeEnum(TipoAgregacaoMetrica).optional(),
  tipoAditividade: z.nativeEnum(TipoAditividadeMetrica).optional(),
  formulaDeclarativa: z.string().min(1).optional(),
  unidadeMedida: z.nativeEnum(UnidadeMedidaMetrica).optional(),
  formatoExibicao: z.string().optional(),
  status: z.nativeEnum(StatusMetricaAnalitica).optional(),
  atributosDependentesIds: z.array(z.string()).optional(),
  metricasDependentesIds: z.array(z.string()).optional(),
  perguntaNegocioAssociada: z.string().optional(),
  objetivoNegocioAssociado: z.string().optional(),
  ordem: z.number().int().min(0).optional(),
});

export const removerMetricaAnaliticaSchema = z.object({
  id: z.string().min(1, 'ID da métrica é obrigatório'),
});

export const avaliarConformidadeModeloSchema = z.object({
  modeloId: z.string().optional(),
  modelo_id: z.string().optional(),
}).refine(
  (data) => Boolean(data.modeloId || data.modelo_id),
  { message: "ID do modelo é obrigatório" }
).transform((data) => ({
  modelo_id: (data.modelo_id || data.modeloId) as string,
}));

export type RemoverMetricaAnaliticaInput = z.infer<typeof removerMetricaAnaliticaSchema>;
export type AvaliarConformidadeModeloInput = { modeloId?: string; modelo_id?: string };
