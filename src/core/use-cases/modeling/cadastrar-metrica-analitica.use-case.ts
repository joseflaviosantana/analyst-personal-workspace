import { IModeloAnaliticoRepository } from '@/core/domain/repositories/modelo-analitico-repository.interface';
import { IEntidadeAnaliticaRepository } from '@/core/domain/repositories/entidade-analitica-repository.interface';
import { IAtributoAnaliticoRepository } from '@/core/domain/repositories/atributo-analitico-repository.interface';
import { IMetricaAnaliticaRepository } from '@/core/domain/repositories/metrica-analitica-repository.interface';
import { MetricaAnalitica } from '@/core/domain/entities/metrica-analitica';
import { TipoAgregacaoMetrica } from '@/core/domain/enums/tipo-agregacao-metrica';
import { TipoAditividadeMetrica } from '@/core/domain/enums/tipo-aditividade-metrica';
import { UnidadeMedidaMetrica } from '@/core/domain/enums/unidade-medida-metrica';
import { StatusMetricaAnalitica } from '@/core/domain/enums/status-metrica-analitica';
import { cadastrarMetricaSchema } from '@/lib/validations/modeling-schema';

export interface CadastrarMetricaAnaliticaInput {
  modeloId: string;
  entidadeId?: string | null;
  nome: string;
  descricao?: string;
  tipoAgregacao: TipoAgregacaoMetrica;
  tipoAditividade: TipoAditividadeMetrica;
  formulaDeclarativa: string;
  unidadeMedida: UnidadeMedidaMetrica;
  formatoExibicao?: string;
  status?: StatusMetricaAnalitica;
  atributosDependentesIds?: string[];
  metricasDependentesIds?: string[];
  perguntaNegocioAssociada?: string;
  objetivoNegocioAssociado?: string;
  ordem?: number;
}

export class CadastrarMetricaAnaliticaUseCase {
  constructor(
    private modeloRepo: IModeloAnaliticoRepository,
    private entidadeRepo: IEntidadeAnaliticaRepository,
    private atributoRepo: IAtributoAnaliticoRepository,
    private metricaRepo: IMetricaAnaliticaRepository
  ) {}

  async execute(input: CadastrarMetricaAnaliticaInput): Promise<MetricaAnalitica> {
    const validated = cadastrarMetricaSchema.parse(input);

    const modelo = await this.modeloRepo.findById(validated.modeloId);
    if (!modelo) {
      throw new Error(`Modelo analítico com ID '${validated.modeloId}' não encontrado.`);
    }

    if (validated.entidadeId) {
      const entidade = await this.entidadeRepo.findById(validated.entidadeId);
      if (!entidade || entidade.modelo_id !== validated.modeloId) {
        throw new Error('A entidade vinculada à métrica não existe ou não pertence a este modelo.');
      }
    }

    // 1. Validar atributos dependentes
    const attrDeps = validated.atributosDependentesIds ?? [];
    for (const attrId of attrDeps) {
      const attr = await this.atributoRepo.findById(attrId);
      if (!attr) {
        throw new Error(`Atributo dependente com ID '${attrId}' não encontrado.`);
      }
      const ent = await this.entidadeRepo.findById(attr.entidade_id);
      if (!ent || ent.modelo_id !== validated.modeloId) {
        throw new Error(`Atributo dependente '${attr.nome_amigavel}' pertence a outro modelo analítico.`);
      }
    }

    // 2. Validar métricas dependentes (grafo semântico de métricas)
    const metDeps = validated.metricasDependentesIds ?? [];
    const metricasExistentes = await this.metricaRepo.findByModeloId(validated.modeloId);

    const id = `met_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    for (const metId of metDeps) {
      if (metId === id) {
        throw new Error('Uma métrica não pode depender diretamente de si mesma.');
      }
      const metExistente = metricasExistentes.find((m) => m.id === metId);
      if (!metExistente) {
        throw new Error(`Métrica dependente com ID '${metId}' não encontrada no modelo.`);
      }
    }

    const now = new Date().toISOString();

    const novaMetrica: MetricaAnalitica = {
      id,
      modelo_id: validated.modeloId,
      entidade_id: validated.entidadeId ?? null,
      nome: validated.nome,
      descricao: validated.descricao ?? null,
      tipo_agregacao: validated.tipoAgregacao,
      tipo_aditividade: validated.tipoAditividade,
      formula_declarativa: validated.formulaDeclarativa,
      unidade_medida: validated.unidadeMedida,
      formato_exibicao: validated.formatoExibicao ?? null,
      status: validated.status ?? StatusMetricaAnalitica.RASCUNHO,
      atributos_dependentes_ids: attrDeps,
      metricas_dependentes_ids: metDeps,
      pergunta_negocio_associada: validated.perguntaNegocioAssociada ?? null,
      objetivo_negocio_associado: validated.objetivoNegocioAssociado ?? null,
      ordem: validated.ordem ?? metricasExistentes.length + 1,
      criado_em: now,
      atualizado_em: now,
    };

    return this.metricaRepo.create(novaMetrica);
  }
}
