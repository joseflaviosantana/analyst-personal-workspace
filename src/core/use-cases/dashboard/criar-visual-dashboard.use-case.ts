/**
 * src/core/use-cases/dashboard/criar-visual-dashboard.use-case.ts
 *
 * Caso de Uso: Criação de Visual do Dashboard (Subgate 3.4D)
 *
 * Responsabilidade:
 * - Validar dados do visual via Zod (criarVisualDashboardSchema);
 * - Verificar a existência da Página de Relatório vinculada;
 * - Persistir o visual no SQLite Local-First com justificativa DataViz.
 */

import { IVisualDashboardRepository } from '@/core/domain/repositories/visual-dashboard-repository.interface';
import { IPaginaRelatorioRepository } from '@/core/domain/repositories/pagina-relatorio-repository.interface';
import { VisualDashboard } from '@/core/domain/entities/visual-dashboard';
import {
  criarVisualDashboardSchema,
  CriarVisualDashboardInput,
} from '@/lib/validations/dashboard-schema';

export interface CriarVisualDashboardOutput {
  visual: VisualDashboard;
}

export class CriarVisualDashboardUseCase {
  constructor(
    private visualRepo: IVisualDashboardRepository,
    private paginaRepo: IPaginaRelatorioRepository
  ) {}

  async execute(input: CriarVisualDashboardInput): Promise<CriarVisualDashboardOutput> {
    const validated = criarVisualDashboardSchema.parse(input);

    const pagina = await this.paginaRepo.findById(validated.paginaId);
    if (!pagina) {
      throw new Error(`Página de Relatório com ID "${validated.paginaId}" não encontrada.`);
    }

    const visuaisExistentes = await this.visualRepo.findByPaginaId(validated.paginaId);
    const agora = new Date().toISOString();

    const novoVisual: VisualDashboard = {
      id: validated.id || `vis_${crypto.randomUUID()}`,
      pagina_id: validated.paginaId,
      titulo: validated.titulo.trim(),
      tipo_visual: validated.tipoVisual,
      posicao_layout: validated.posicaoLayout,
      medidas_utilizadas_ids: validated.medidasUtilizadasIds || [],
      atributos_utilizados_ids: validated.atributosUtilizadosIds || [],
      justificativa_dataviz: validated.justificativaDataviz?.trim() || null,
      ordem: validated.ordem ?? visuaisExistentes.length + 1,
      criado_em: agora,
      atualizado_em: agora,
    };

    const criado = await this.visualRepo.create(novoVisual);
    return { visual: criado };
  }
}
