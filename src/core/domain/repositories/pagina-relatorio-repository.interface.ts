import { PaginaRelatorio, PaginaRelatorioComVisuais } from '../entities/pagina-relatorio';

/**
 * Contrato de repositório para Páginas de Relatório (Subunidade 3.7 / Bloco 7)
 */
export interface IPaginaRelatorioRepository {
  findById(id: string): Promise<PaginaRelatorio | null>;
  findByModeloPowerBiId(modeloPowerBiId: string): Promise<PaginaRelatorio[]>;
  findComVisuaisById(id: string): Promise<PaginaRelatorioComVisuais | null>;
  create(pagina: PaginaRelatorio): Promise<PaginaRelatorio>;
  update(pagina: PaginaRelatorio): Promise<PaginaRelatorio>;
  delete(id: string): Promise<void>;
}
