import { VisualDashboard } from '../entities/visual-dashboard';

/**
 * Contrato de repositório para Visuais do Dashboard (Subunidade 3.7 / Bloco 7)
 */
export interface IVisualDashboardRepository {
  findById(id: string): Promise<VisualDashboard | null>;
  findByPaginaId(paginaId: string): Promise<VisualDashboard[]>;
  create(visual: VisualDashboard): Promise<VisualDashboard>;
  update(visual: VisualDashboard): Promise<VisualDashboard>;
  delete(id: string): Promise<void>;
}
