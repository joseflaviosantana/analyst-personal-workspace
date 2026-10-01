/**
 * src/core/use-cases/dashboard/criar-pagina-relatorio.use-case.ts
 *
 * Caso de Uso: Criação de Página de Relatório (Subgate 3.4D)
 *
 * Responsabilidade:
 * - Validar dados via Zod (criarPaginaRelatorioSchema);
 * - Verificar a existência do Modelo Power BI;
 * - Prevenir duplicidade de nomes de página no mesmo modelo;
 * - Persistir a página no SQLite Local-First.
 */

import { IPaginaRelatorioRepository } from '@/core/domain/repositories/pagina-relatorio-repository.interface';
import { IModeloPowerBiRepository } from '@/core/domain/repositories/modelo-powerbi-repository.interface';
import { PaginaRelatorio } from '@/core/domain/entities/pagina-relatorio';
import {
  criarPaginaRelatorioSchema,
  CriarPaginaRelatorioInput,
} from '@/lib/validations/dashboard-schema';

export interface CriarPaginaRelatorioOutput {
  pagina: PaginaRelatorio;
}

export class CriarPaginaRelatorioUseCase {
  constructor(
    private paginaRepo: IPaginaRelatorioRepository,
    private modeloPowerBiRepo: IModeloPowerBiRepository
  ) {}

  async execute(input: CriarPaginaRelatorioInput): Promise<CriarPaginaRelatorioOutput> {
    const validated = criarPaginaRelatorioSchema.parse(input);

    const modelo = await this.modeloPowerBiRepo.findById(validated.modeloPowerBiId);
    if (!modelo) {
      throw new Error(
        `Modelo Power BI com ID "${validated.modeloPowerBiId}" não encontrado.`
      );
    }

    const paginasExistentes = await this.paginaRepo.findByModeloPowerBiId(
      validated.modeloPowerBiId
    );
    const nomeNorm = validated.nome.trim().toLowerCase();
    const jaExiste = paginasExistentes.some(
      (p) => p.nome.trim().toLowerCase() === nomeNorm
    );
    if (jaExiste) {
      throw new Error(
        `Já existe uma página com o nome "${validated.nome.trim()}" neste Modelo Power BI.`
      );
    }

    const agora = new Date().toISOString();
    const novaPagina: PaginaRelatorio = {
      id: validated.id || `pag_${crypto.randomUUID()}`,
      modelo_powerbi_id: validated.modeloPowerBiId,
      nome: validated.nome.trim(),
      ordem: validated.ordem ?? paginasExistentes.length + 1,
      objetivo_analitico: validated.objetivoAnalitico?.trim() || null,
      publico_alvo: validated.publicoAlvo,
      layout_grid: validated.layoutGrid,
      criado_em: agora,
      atualizado_em: agora,
    };

    const criada = await this.paginaRepo.create(novaPagina);
    return { pagina: criada };
  }
}
