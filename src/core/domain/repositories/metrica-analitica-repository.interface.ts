import { MetricaAnalitica } from '../entities/metrica-analitica';

/**
 * Contrato de repositório para Métricas Analíticas (Subunidade 3.6A)
 */
export interface IMetricaAnaliticaRepository {
  findById(id: string): Promise<MetricaAnalitica | null>;
  findByModeloId(modeloId: string): Promise<MetricaAnalitica[]>;
  create(metrica: MetricaAnalitica): Promise<MetricaAnalitica>;
  update(metrica: MetricaAnalitica): Promise<MetricaAnalitica>;
  delete(id: string): Promise<void>;
}
