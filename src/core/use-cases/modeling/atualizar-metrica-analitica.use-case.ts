import { IMetricaAnaliticaRepository } from '@/core/domain/repositories/metrica-analitica-repository.interface';
import { IEntidadeAnaliticaRepository } from '@/core/domain/repositories/entidade-analitica-repository.interface';
import { IAtributoAnaliticoRepository } from '@/core/domain/repositories/atributo-analitico-repository.interface';
import { MetricaAnalitica } from '@/core/domain/entities/metrica-analitica';
import { TipoAgregacaoMetrica } from '@/core/domain/enums/tipo-agregacao-metrica';
import { TipoAditividadeMetrica } from '@/core/domain/enums/tipo-aditividade-metrica';
import { UnidadeMedidaMetrica } from '@/core/domain/enums/unidade-medida-metrica';
import { StatusMetricaAnalitica } from '@/core/domain/enums/status-metrica-analitica';
import { atualizarMetricaSchema } from '@/lib/validations/modeling-schema';

export interface AtualizarMetricaAnaliticaInput {
  id: string;
  entidadeId?: string | null;
  nome?: string;
  descricao?: string;
  tipoAgregacao?: TipoAgregacaoMetrica;
  tipoAditividade?: TipoAditividadeMetrica;
  formulaDeclarativa?: string;
  unidadeMedida?: UnidadeMedidaMetrica;
  formatoExibicao?: string;
  status?: StatusMetricaAnalitica;
  atributosDependentesIds?: string[];
  metricasDependentesIds?: string[];
  perguntaNegocioAssociada?: string;
  objetivoNegocioAssociado?: string;
  ordem?: number;
}

export class AtualizarMetricaAnaliticaUseCase {
  constructor(
    private metricaRepo: IMetricaAnaliticaRepository,
    private entidadeRepo: IEntidadeAnaliticaRepository,
    private atributoRepo: IAtributoAnaliticoRepository
  ) {}

  async execute(input: AtualizarMetricaAnaliticaInput): Promise<MetricaAnalitica> {
    const validated = atualizarMetricaSchema.parse(input);

    const metrica = await this.metricaRepo.findById(validated.id);
    if (!metrica) {
      throw new Error(`Métrica analítica com ID '${validated.id}' não encontrada.`);
    }

    if (validated.entidadeId !== undefined && validated.entidadeId !== null) {
      const entidade = await this.entidadeRepo.findById(validated.entidadeId);
      if (!entidade || entidade.modelo_id !== metrica.modelo_id) {
        throw new Error('A entidade vinculada à métrica não existe ou não pertence a este modelo.');
      }
    }

    // 1. Validar atributos dependentes
    const attrDeps = validated.atributosDependentesIds ?? metrica.atributos_dependentes_ids;
    for (const attrId of attrDeps) {
      const attr = await this.atributoRepo.findById(attrId);
      if (!attr) {
        throw new Error(`Atributo dependente com ID '${attrId}' não encontrado.`);
      }
      const ent = await this.entidadeRepo.findById(attr.entidade_id);
      if (!ent || ent.modelo_id !== metrica.modelo_id) {
        throw new Error(`Atributo dependente '${attr.nome_amigavel}' pertence a outro modelo analítico.`);
      }
    }

    // 2. Validar métricas dependentes e ciclos
    const metDeps = validated.metricasDependentesIds ?? metrica.metricas_dependentes_ids;
    const metricasDoModelo = await this.metricaRepo.findByModeloId(metrica.modelo_id);

    // Auto-dependência direta
    if (metDeps.includes(metrica.id)) {
      throw new Error('Uma métrica não pode depender diretamente de si mesma.');
    }

    // Validação de existência
    for (const depId of metDeps) {
      const existe = metricasDoModelo.some((m) => m.id === depId);
      if (!existe) {
        throw new Error(`Métrica dependente com ID '${depId}' não encontrada no modelo.`);
      }
    }

    // Detecção determinística de ciclos transitivos via DFS
    // Um ciclo ocorreria se qualquer uma das métricas dependentes já depender (transitiva ou diretamente) da métrica atual
    const detectaCiclo = (
      inicioId: string,
      alvoId: string,
      todasMetricas: MetricaAnalitica[],
      visitados: Set<string>
    ): boolean => {
      if (inicioId === alvoId) return true;
      if (visitados.has(inicioId)) return false;
      visitados.add(inicioId);

      const m = todasMetricas.find((item) => item.id === inicioId);
      if (!m) return false;

      for (const proximoId of m.metricas_dependentes_ids) {
        if (detectaCiclo(proximoId, alvoId, todasMetricas, visitados)) {
          return true;
        }
      }
      return false;
    };

    for (const depId of metDeps) {
      const visitados = new Set<string>();
      if (detectaCiclo(depId, metrica.id, metricasDoModelo, visitados)) {
        throw new Error(
          `Dependência circular detectada no grafo de métricas: a métrica '${depId}' já possui dependência direta ou transitiva da métrica '${metrica.id}'.`
        );
      }
    }

    const now = new Date().toISOString();

    const atualizada: MetricaAnalitica = {
      ...metrica,
      entidade_id: validated.entidadeId !== undefined ? validated.entidadeId : metrica.entidade_id,
      nome: validated.nome ?? metrica.nome,
      descricao: validated.descricao !== undefined ? validated.descricao : metrica.descricao,
      tipo_agregacao: validated.tipoAgregacao ?? metrica.tipo_agregacao,
      tipo_aditividade: validated.tipoAditividade ?? metrica.tipo_aditividade,
      formula_declarativa: validated.formulaDeclarativa ?? metrica.formula_declarativa,
      unidade_medida: validated.unidadeMedida ?? metrica.unidade_medida,
      formato_exibicao: validated.formatoExibicao !== undefined ? validated.formatoExibicao : metrica.formato_exibicao,
      status: validated.status ?? metrica.status,
      atributos_dependentes_ids: attrDeps,
      metricas_dependentes_ids: metDeps,
      pergunta_negocio_associada:
        validated.perguntaNegocioAssociada !== undefined
          ? validated.perguntaNegocioAssociada
          : metrica.pergunta_negocio_associada,
      objetivo_negocio_associado:
        validated.objetivoNegocioAssociado !== undefined
          ? validated.objetivoNegocioAssociado
          : metrica.objetivo_negocio_associado,
      ordem: validated.ordem ?? metrica.ordem,
      atualizado_em: now,
    };

    return this.metricaRepo.update(atualizada);
  }
}
