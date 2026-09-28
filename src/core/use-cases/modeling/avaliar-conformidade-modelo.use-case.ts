import { IModeloAnaliticoRepository } from "@/core/domain/repositories/modelo-analitico-repository.interface";
import { IDatasetAutorizadoRepository } from "@/core/domain/repositories/dataset-autorizado-repository.interface";
import {
  ModelingRulesEvaluator,
  ResultadoAvaliacaoConformidade,
} from "@/core/domain/rules/modeling-rules-evaluator";
import {
  avaliarConformidadeModeloSchema,
  AvaliarConformidadeModeloInput,
} from "@/lib/validations/modeling-schema";

export class AvaliarConformidadeModeloUseCase {
  constructor(
    private readonly modeloRepo: IModeloAnaliticoRepository,
    private readonly datasetRepo: IDatasetAutorizadoRepository
  ) {}

  async execute(rawInput: AvaliarConformidadeModeloInput): Promise<ResultadoAvaliacaoConformidade> {
    const input = avaliarConformidadeModeloSchema.parse(rawInput);

    const modeloCompleto = await this.modeloRepo.findCompletoById(input.modelo_id);
    if (!modeloCompleto) {
      throw new Error(`Modelo analítico com ID "${input.modelo_id}" não encontrado.`);
    }

    const dataset = await this.datasetRepo.findById(modeloCompleto.dataset_autorizado_id);

    return ModelingRulesEvaluator.avaliar(modeloCompleto, dataset);
  }
}
