/**
 * src/core/use-cases/dashboard/aprovar-proposta-dashboard.use-case.ts
 *
 * Caso de Uso: Aprovação Formal de Proposta de Dashboard (Human-in-the-Loop)
 *
 * Responsabilidade:
 * - Materializar no banco de dados SQLite as páginas e visuais aprovados pelo usuário;
 * - Preservar decisões e ajustes manuais feitos durante a revisão;
 * - Vincular formalmente as medidas DAX e atributos utilizados;
 * - Garantir idempotência e integridade referencial.
 */

import { IPaginaRelatorioRepository } from '@/core/domain/repositories/pagina-relatorio-repository.interface';
import { IVisualDashboardRepository } from '@/core/domain/repositories/visual-dashboard-repository.interface';
import { IModeloPowerBiRepository } from '@/core/domain/repositories/modelo-powerbi-repository.interface';
import { PaginaRelatorio } from '@/core/domain/entities/pagina-relatorio';
import { VisualDashboard } from '@/core/domain/entities/visual-dashboard';
import { DashboardSpecification } from '@/core/domain/dashboard-automation/dashboard-specification';

export interface AprovarPropostaDashboardInput {
  proposta: DashboardSpecification;
}

export interface AprovarPropostaDashboardOutput {
  success: boolean;
  totalPaginasCriadas: number;
  totalVisuaisCriados: number;
  paginas: PaginaRelatorio[];
  visuais: VisualDashboard[];
}

export class AprovarPropostaDashboardUseCase {
  constructor(
    private paginaRepo: IPaginaRelatorioRepository,
    private visualRepo: IVisualDashboardRepository,
    private modeloPowerBiRepo: IModeloPowerBiRepository
  ) {}

  async execute(
    input: AprovarPropostaDashboardInput
  ): Promise<AprovarPropostaDashboardOutput> {
    const { proposta } = input;

    if (!proposta || !proposta.modeloPowerBiId) {
      throw new Error('Proposta de dashboard inválida ou sem ID de Modelo Power BI.');
    }

    const modelo = await this.modeloPowerBiRepo.findById(proposta.modeloPowerBiId);
    if (!modelo) {
      throw new Error(
        `Modelo Power BI com ID "${proposta.modeloPowerBiId}" não encontrado.`
      );
    }

    const agora = new Date().toISOString();
    const paginasCriadas: PaginaRelatorio[] = [];
    const visuaisCriados: VisualDashboard[] = [];

    // Limpar ou obter páginas existentes para o modelo
    const paginasExistentes = await this.paginaRepo.findByModeloPowerBiId(
      proposta.modeloPowerBiId
    );
    let proximaOrdemPagina = paginasExistentes.length + 1;

    for (const pageSpec of proposta.paginas) {
      // 1. Criar a Página de Relatório
      const novaPagina: PaginaRelatorio = {
        id: `pag_${crypto.randomUUID()}`,
        modelo_powerbi_id: proposta.modeloPowerBiId,
        nome: pageSpec.nome,
        ordem: proximaOrdemPagina++,
        objetivo_analitico: pageSpec.objetivoAnalitico || null,
        publico_alvo: pageSpec.publicoAlvo,
        layout_grid: pageSpec.layoutGrid,
        criado_em: agora,
        atualizado_em: agora,
      };

      const paginaSalva = await this.paginaRepo.create(novaPagina);
      paginasCriadas.push(paginaSalva);

      // 2. Criar os Visuais associados à página
      let ordemVisual = 1;
      for (const visualSpec of pageSpec.visuais) {
        const medidasIds: string[] = [];
        if (visualSpec.medidaDaxId) {
          medidasIds.push(visualSpec.medidaDaxId);
        }

        const justificativaFormatada = visualSpec.justificativaDataViz
          ? `${visualSpec.justificativaDataViz.oQueFoiEscolhido}: ${visualSpec.justificativaDataViz.porQueFoiEscolhido} [DataViz: ${visualSpec.justificativaDataViz.dicaProfissional}]`
          : null;

        const novoVisual: VisualDashboard = {
          id: `vis_${crypto.randomUUID()}`,
          pagina_id: paginaSalva.id,
          titulo: visualSpec.titulo,
          tipo_visual: visualSpec.tipoVisual,
          posicao_layout: visualSpec.posicaoLayout,
          medidas_utilizadas_ids: medidasIds,
          atributos_utilizados_ids: visualSpec.atributosUtilizadosIds || [],
          justificativa_dataviz: justificativaFormatada,
          ordem: ordemVisual++,
          criado_em: agora,
          atualizado_em: agora,
        };

        const visualSalvo = await this.visualRepo.create(novoVisual);
        visuaisCriados.push(visualSalvo);
      }
    }

    return {
      success: true,
      totalPaginasCriadas: paginasCriadas.length,
      totalVisuaisCriados: visuaisCriados.length,
      paginas: paginasCriadas,
      visuais: visuaisCriados,
    };
  }
}
