import { MedidaDax } from '../entities/medida-dax';

/**
 * Contrato de repositório para Medidas DAX (Subunidade 3.7 / Bloco 7)
 */
export interface IMedidaDaxRepository {
  findById(id: string): Promise<MedidaDax | null>;
  findByModeloPowerBiId(modeloPowerBiId: string): Promise<MedidaDax[]>;
  findByMetricaAnaliticaId(metricaAnaliticaId: string): Promise<MedidaDax[]>;
  create(medida: MedidaDax): Promise<MedidaDax>;
  update(medida: MedidaDax): Promise<MedidaDax>;
  delete(id: string): Promise<void>;
}
