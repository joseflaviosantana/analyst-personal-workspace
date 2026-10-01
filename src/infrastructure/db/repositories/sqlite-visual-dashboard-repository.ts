import { asc, eq } from 'drizzle-orm';
import { db } from '../client';
import { visuaisDashboard } from '../schema';
import { VisualDashboard } from '@/core/domain/entities/visual-dashboard';
import { TipoVisualDashboard } from '@/core/domain/enums/tipo-visual-dashboard';
import { PosicaoLayoutVisual } from '@/core/domain/enums/posicao-layout-visual';
import { IVisualDashboardRepository } from '@/core/domain/repositories/visual-dashboard-repository.interface';

export class SqliteVisualDashboardRepository implements IVisualDashboardRepository {
  private database: typeof db;

  constructor(customDb?: typeof db) {
    this.database = customDb ?? db;
  }

  private mapRowToEntity(row: typeof visuaisDashboard.$inferSelect): VisualDashboard {
    let medidas: string[] = [];
    let atributos: string[] = [];

    try {
      medidas = JSON.parse(row.medidas_utilizadas_ids);
    } catch {
      medidas = [];
    }

    try {
      atributos = JSON.parse(row.atributos_utilizados_ids);
    } catch {
      atributos = [];
    }

    return {
      id: row.id,
      pagina_id: row.pagina_id,
      titulo: row.titulo,
      tipo_visual: row.tipo_visual as TipoVisualDashboard,
      posicao_layout: row.posicao_layout as PosicaoLayoutVisual,
      medidas_utilizadas_ids: medidas,
      atributos_utilizados_ids: atributos,
      justificativa_dataviz: row.justificativa_dataviz ?? null,
      ordem: row.ordem,
      criado_em: row.criado_em,
      atualizado_em: row.atualizado_em,
    };
  }

  async findById(id: string): Promise<VisualDashboard | null> {
    const row = this.database
      .select()
      .from(visuaisDashboard)
      .where(eq(visuaisDashboard.id, id))
      .get();

    if (!row) return null;
    return this.mapRowToEntity(row);
  }

  async findByPaginaId(paginaId: string): Promise<VisualDashboard[]> {
    const rows = this.database
      .select()
      .from(visuaisDashboard)
      .where(eq(visuaisDashboard.pagina_id, paginaId))
      .orderBy(asc(visuaisDashboard.ordem))
      .all();

    return rows.map((r) => this.mapRowToEntity(r));
  }

  async create(visual: VisualDashboard): Promise<VisualDashboard> {
    this.database
      .insert(visuaisDashboard)
      .values({
        id: visual.id,
        pagina_id: visual.pagina_id,
        titulo: visual.titulo,
        tipo_visual: visual.tipo_visual,
        posicao_layout: visual.posicao_layout,
        medidas_utilizadas_ids: JSON.stringify(visual.medidas_utilizadas_ids ?? []),
        atributos_utilizados_ids: JSON.stringify(visual.atributos_utilizados_ids ?? []),
        justificativa_dataviz: visual.justificativa_dataviz,
        ordem: visual.ordem,
        criado_em: visual.criado_em,
        atualizado_em: visual.atualizado_em,
      })
      .run();

    return visual;
  }

  async update(visual: VisualDashboard): Promise<VisualDashboard> {
    this.database
      .update(visuaisDashboard)
      .set({
        titulo: visual.titulo,
        tipo_visual: visual.tipo_visual,
        posicao_layout: visual.posicao_layout,
        medidas_utilizadas_ids: JSON.stringify(visual.medidas_utilizadas_ids ?? []),
        atributos_utilizados_ids: JSON.stringify(visual.atributos_utilizados_ids ?? []),
        justificativa_dataviz: visual.justificativa_dataviz,
        ordem: visual.ordem,
        atualizado_em: visual.atualizado_em,
      })
      .where(eq(visuaisDashboard.id, visual.id))
      .run();

    return visual;
  }

  async delete(id: string): Promise<void> {
    this.database
      .delete(visuaisDashboard)
      .where(eq(visuaisDashboard.id, id))
      .run();
  }
}
