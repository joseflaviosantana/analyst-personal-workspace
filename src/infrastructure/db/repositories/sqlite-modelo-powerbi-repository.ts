import { asc, eq } from 'drizzle-orm';
import { db } from '../client';
import { modelosPowerBi } from '../schema';
import { ModeloPowerBi, ModeloPowerBiCompleto } from '@/core/domain/entities/modelo-powerbi';
import { TipoFormatoModeloPowerBi } from '@/core/domain/enums/tipo-formato-modelo-powerbi';
import { StatusModeloPowerBi } from '@/core/domain/enums/status-modelo-powerbi';
import { IModeloPowerBiRepository } from '@/core/domain/repositories/modelo-powerbi-repository.interface';
import { SqliteMedidaDaxRepository } from './sqlite-medida-dax-repository';
import { SqlitePaginaRelatorioRepository } from './sqlite-pagina-relatorio-repository';
import { SqliteVisualDashboardRepository } from './sqlite-visual-dashboard-repository';

export class SqliteModeloPowerBiRepository implements IModeloPowerBiRepository {
  private database: typeof db;
  private medidaRepo: SqliteMedidaDaxRepository;
  private paginaRepo: SqlitePaginaRelatorioRepository;
  private visualRepo: SqliteVisualDashboardRepository;

  constructor(customDb?: typeof db) {
    this.database = customDb ?? db;
    this.medidaRepo = new SqliteMedidaDaxRepository(this.database);
    this.paginaRepo = new SqlitePaginaRelatorioRepository(this.database);
    this.visualRepo = new SqliteVisualDashboardRepository(this.database);
  }

  private mapRowToEntity(row: typeof modelosPowerBi.$inferSelect): ModeloPowerBi {
    return {
      id: row.id,
      demanda_id: row.demanda_id,
      modelo_analitico_id: row.modelo_analitico_id ?? null,
      nome_arquivo: row.nome_arquivo,
      caminho_local: row.caminho_local ?? null,
      tipo_formato: row.tipo_formato as TipoFormatoModeloPowerBi,
      status: row.status as StatusModeloPowerBi,
      justificativa_isencao: row.justificativa_isencao ?? null,
      hash_sha256: row.hash_sha256 ?? null,
      versao_powerbi: row.versao_powerbi ?? null,
      tamanho_bytes: row.tamanho_bytes,
      criado_em: row.criado_em,
      atualizado_em: row.atualizado_em,
    };
  }

  async findById(id: string): Promise<ModeloPowerBi | null> {
    const row = this.database
      .select()
      .from(modelosPowerBi)
      .where(eq(modelosPowerBi.id, id))
      .get();

    if (!row) return null;
    return this.mapRowToEntity(row);
  }

  async findByDemandaId(demandaId: string): Promise<ModeloPowerBi[]> {
    const rows = this.database
      .select()
      .from(modelosPowerBi)
      .where(eq(modelosPowerBi.demanda_id, demandaId))
      .orderBy(asc(modelosPowerBi.criado_em))
      .all();

    return rows.map((r) => this.mapRowToEntity(r));
  }

  async findCompletoById(id: string): Promise<ModeloPowerBiCompleto | null> {
    const modelo = await this.findById(id);
    if (!modelo) return null;

    const medidas = await this.medidaRepo.findByModeloPowerBiId(id);
    const paginasSimples = await this.paginaRepo.findByModeloPowerBiId(id);

    const paginasComVisuais = await Promise.all(
      paginasSimples.map(async (pagina) => {
        const visuais = await this.visualRepo.findByPaginaId(pagina.id);
        return {
          ...pagina,
          visuais,
        };
      })
    );

    return {
      ...modelo,
      medidas,
      paginas: paginasComVisuais,
    };
  }

  async create(modelo: ModeloPowerBi): Promise<ModeloPowerBi> {
    this.database
      .insert(modelosPowerBi)
      .values({
        id: modelo.id,
        demanda_id: modelo.demanda_id,
        modelo_analitico_id: modelo.modelo_analitico_id,
        nome_arquivo: modelo.nome_arquivo,
        caminho_local: modelo.caminho_local,
        tipo_formato: modelo.tipo_formato,
        status: modelo.status,
        justificativa_isencao: modelo.justificativa_isencao,
        hash_sha256: modelo.hash_sha256,
        versao_powerbi: modelo.versao_powerbi,
        tamanho_bytes: modelo.tamanho_bytes,
        criado_em: modelo.criado_em,
        atualizado_em: modelo.atualizado_em,
      })
      .run();

    return modelo;
  }

  async update(modelo: ModeloPowerBi): Promise<ModeloPowerBi> {
    this.database
      .update(modelosPowerBi)
      .set({
        modelo_analitico_id: modelo.modelo_analitico_id,
        nome_arquivo: modelo.nome_arquivo,
        caminho_local: modelo.caminho_local,
        tipo_formato: modelo.tipo_formato,
        status: modelo.status,
        justificativa_isencao: modelo.justificativa_isencao,
        hash_sha256: modelo.hash_sha256,
        versao_powerbi: modelo.versao_powerbi,
        tamanho_bytes: modelo.tamanho_bytes,
        atualizado_em: modelo.atualizado_em,
      })
      .where(eq(modelosPowerBi.id, modelo.id))
      .run();

    return modelo;
  }

  async delete(id: string): Promise<void> {
    this.database
      .delete(modelosPowerBi)
      .where(eq(modelosPowerBi.id, id))
      .run();
  }
}
