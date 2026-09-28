import { IMetricaAnaliticaRepository } from "@/core/domain/repositories/metrica-analitica-repository.interface";
import { IModeloAnaliticoRepository } from "@/core/domain/repositories/modelo-analitico-repository.interface";
import { removerMetricaAnaliticaSchema, RemoverMetricaAnaliticaInput } from "@/lib/validations/modeling-schema";

export class RemoverMetricaAnaliticaUseCase {
  constructor(
    private readonly metricaRepo: IMetricaAnaliticaRepository,
    private readonly modeloRepo: IModeloAnaliticoRepository
  ) {}

  async execute(rawInput: RemoverMetricaAnaliticaInput): Promise<{ success: true }> {
    const input = removerMetricaAnaliticaSchema.parse(rawInput);

    const metrica = await this.metricaRepo.findById(input.id);
    if (!metrica) {
      throw new Error(`Métrica analítica com ID "${input.id}" não encontrada.`);
    }

    const modelo = await this.modeloRepo.findById(metrica.modelo_id);
    if (!modelo) {
      throw new Error(`Modelo analítico associado "${metrica.modelo_id}" não encontrado.`);
    }

    // Verificar se outras métricas do mesmo modelo dependem desta métrica
    const metricasDoModelo = await this.metricaRepo.findByModeloId(metrica.modelo_id);
    const metricasDependentes = metricasDoModelo.filter(
      (m) => m.id !== metrica.id && m.metricas_dependentes_ids.includes(metrica.id)
    );

    if (metricasDependentes.length > 0) {
      const nomes = metricasDependentes.map((m) => `"${m.nome}"`).join(", ");
      throw new Error(
        `Não é possível remover a métrica "${metrica.nome}" porque ela é referenciada como dependência pela(s) métrica(s): ${nomes}.`
      );
    }

    await this.metricaRepo.delete(metrica.id);
    return { success: true };
  }
}
