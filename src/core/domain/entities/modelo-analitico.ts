import { StatusModeloAnalitico } from '../enums/status-modelo-analitico';
import { TipoArquiteturaModelo } from '../enums/tipo-arquitetura-modelo';
import { EntidadeAnaliticaComAtributos } from './entidade-analitica';
import { RelacionamentoAnalitico } from './relacionamento-analitico';
import { MetricaAnalitica } from './metrica-analitica';

/**
 * ModeloAnalitico (V1 — Subunidade 3.6A / Domínio de Modelagem)
 * Raiz do agregado de modelagem dimensional e semântica de uma demanda.
 * Mapeia os dados do dataset autorizado em entidades (fatos/dimensões),
 * atributos, relacionamentos e métricas de negócio.
 */
export interface ModeloAnalitico {
  id: string;
  demanda_id: string;
  dataset_autorizado_id: string;
  nome: string;
  descricao: string | null;
  tipo_arquitetura: TipoArquiteturaModelo;
  status: StatusModeloAnalitico;
  homologado_em: string | null;
  homologado_por: string | null;
  justificativa_homologacao: string | null;
  revogado_em: string | null;
  motivo_revogacao: string | null;
  criado_em: string;
  atualizado_em: string;
}

/**
 * ModeloAnaliticoCompleto
 * Visão agregada completa contendo entidades com seus atributos,
 * relacionamentos estruturais e métricas analíticas.
 */
export interface ModeloAnaliticoCompleto extends ModeloAnalitico {
  entidades: EntidadeAnaliticaComAtributos[];
  relacionamentos: RelacionamentoAnalitico[];
  metricas: MetricaAnalitica[];
}
