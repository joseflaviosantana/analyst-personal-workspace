import { asc, eq } from 'drizzle-orm';
import { db } from '../client';
import { paginasRelatorio } from '../schema';
import { PaginaRelatorio, PaginaRelatorioComVisuais } from '@/core/domain/entities/pagina-relatorio';
import { PublicoAlvoPagina } from '@/core/domain/enums/publico-alvo-pagina';
import { LayoutGridPagina } from '@/core/domain/enums/layout-grid-pagina';
import { IPaginaRelatorioRepository } from '@/core/domain/repositories/pagina-relatorio-repository.interface';
import { SqliteVisualDashboardRepository } from './sqlite-visual-dashboard-repository';

export class SqlitePaginaRelatorioRepository implements IPaginaRelatorioRepository {
  private database: typeof db;
  private visualRepo: SqliteVisualDashboardRepository;

  constructor(customDb?: typeof db) {
    this.database = customDb ?? db;
    this.visualRepo = new SqliteVisualDashboardRepository(this.database);
  }

  private mapRowToEntity(row: typeof paginasRelatorio.$inferSelect): PaginaRelatorio {
    return {
      id: row.id,
      modelo_powerbi_id: row.modelo_powerbi_id,
      nome: row.nome,
      ordem: row.ordem,
      objetivo_analitico: row.objetivo_analitico ?? null,
      publico_alvo: row.publico_alvo as PublicoAlvoPagina,
      layout_grid: row.layout_grid as LayoutGridPagina,
      criado_em: row.criado_em,
      atualizado_em: row.atualizado_em,
    };
  }

  async findById(id: string): Promise<PaginaRelatorio | null> {
    const row = this.database
      .select()
      .from(paginasRelatorio)
      .where(eq(paginasRelatorio.id, id))
      .get();

    if (!row) return null;
    return this.mapRowToEntity(row);
  }

  async findByModeloPowerBiId(modeloPowerBiId: string): Promise<PaginaRelatorio[]> {
    const rows = this.database
      .select()
      .from(paginasRelatorio)
      .where(eq(paginasRelatorio.modelo_powerbi_id, modeloPowerBiId))
      .orderBy(asc(paginasRelatorio.ordem))
      .all();

    return rows.map((r) => this.mapRowToEntity(r));
  }

  async findComVisuaisById(id: string): Promise<PaginaRelatorioComVisuais | null> {
    const pagina = await this.findById(id);
    if (!pagina) return null;

    const visuais = await this.visualRepo.findByPaginaId(id);

    return {
      ...pagina,
      visuais,
    };
  }

  async create(pagina: PaginaRelatorio): Promise<PaginaRelatorio> {
    this.database
      .insert(paginasRelatorio)
      .values({
        id: pagina.id,
        modelo_powerbi_id: pagina.modelo_powerbi_id,
        nome: pagina.nome,
        ordem: pagina.ordem,
        objetivo_analitico: pagina.objetivo_analitico,
        publico_alvo: pagina.publico_alvo,
        layout_grid: pagina.layout_grid,
        criado_em: pagina.criado_em,
        atualizado_em: pagina.atualizado_em,
      })
      .run();

    return pagina;
  }

  async update(pagina: PaginaRelatorio): Promise<PaginaRelatorio> {
    this.database
      .update(paginasRelatorio)
      .set({
        nome: pagina.nome,
        ordem: pagina.ordem,
        objetivo_analitico: pagina.objetivo_analitico,
        publico_alvo: pagina.publico_alvo,
        layout_grid: pagina.layout_grid,
        atualizado_em: pagina.atualizado_em,
      })
      .where(eq(paginasRelatorio.id, pagina.id))
      .run();

    return pagina;
  }

  async delete(id: string): Promise<void> {
    this.database
      .delete(paginasRelatorio)
      .where(eq(paginasRelatorio.id, id))
      .run();
  }
}
