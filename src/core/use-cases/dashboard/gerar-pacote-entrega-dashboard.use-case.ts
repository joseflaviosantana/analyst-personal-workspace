/**
 * src/core/use-cases/dashboard/gerar-pacote-entrega-dashboard.use-case.ts
 *
 * Caso de Uso Aplicacional: Geração do Pacote de Entrega, Documentação e Exportação (Subgate 3.4E)
 *
 * Responsabilidade:
 * - Recuperar todo o contexto persistido da demanda e da etapa Power BI & Dashboard;
 * - Executar a avaliação determinística do motor normativo D-01 a D-08;
 * - Executar a avaliação consultiva do Copiloto;
 * - Montar o Pacote de Entrega estruturado com checklist e case de portfólio;
 * - Gerar as representações exportáveis:
 *   1. Memorial descritivo completo em Markdown (Seções A até M);
 *   2. Pacote completo estruturado em JSON;
 *   3. Catálogo de medidas em sintaxe TMDL formal;
 *   4. Manifesto de páginas e visuais em JSON.
 *
 * Princípios:
 * - Totalmente em memória e estritamente somente-leitura (zero mutação no banco);
 * - 100% determinístico e auditável;
 * - Custo zero: sem dependência de LLM ou serviços externos.
 */

import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { IModeloPowerBiRepository } from '@/core/domain/repositories/modelo-powerbi-repository.interface';
import { IMedidaDaxRepository } from '@/core/domain/repositories/medida-dax-repository.interface';
import { IPaginaRelatorioRepository } from '@/core/domain/repositories/pagina-relatorio-repository.interface';
import { IVisualDashboardRepository } from '@/core/domain/repositories/visual-dashboard-repository.interface';
import { IModeloAnaliticoRepository } from '@/core/domain/repositories/modelo-analitico-repository.interface';
import { DashboardRulesEvaluator } from '@/core/domain/rules/dashboard-rules-evaluator';
import { DashboardCopilotEngine } from '@/core/domain/dashboard-copilot/dashboard-copilot-engine';
import { ContextoAnaliseDashboardCopilot } from '@/core/domain/dashboard-copilot/dashboard-copilot-types';
import { TmdlMeasureSerializer } from '@/core/domain/tmdl/tmdl-measure-serializer';
import { PacoteEntregaDashboard } from '@/core/domain/dashboard-delivery/dashboard-delivery-types';
import { DashboardDeliveryPackageEngine } from '@/core/domain/dashboard-delivery/dashboard-delivery-package-engine';
import { DashboardDocumentationGenerator } from '@/core/domain/dashboard-delivery/dashboard-documentation-generator';
import { PaginaRelatorioComVisuais } from '@/core/domain/entities/pagina-relatorio';
import { ModeloAnaliticoCompleto } from '@/core/domain/entities/modelo-analitico';

export interface GerarPacoteEntregaDashboardInput {
  demandaId: string;
  templateEscolhido?: string;
}

export interface GerarPacoteEntregaDashboardOutput {
  success: boolean;
  pacote: PacoteEntregaDashboard;
  documentacaoMarkdown: string;
  pacoteJson: string;
  medidasTmdl: string;
  manifestoLayoutJson: string;
}

export class GerarPacoteEntregaDashboardUseCase {
  constructor(
    private demandRepo: IDemandRepository,
    private modeloPowerBiRepo: IModeloPowerBiRepository,
    private medidaDaxRepo: IMedidaDaxRepository,
    private paginaRepo: IPaginaRelatorioRepository,
    private visualRepo: IVisualDashboardRepository,
    private modeloAnaliticoRepo: IModeloAnaliticoRepository
  ) {}

  async execute(input: GerarPacoteEntregaDashboardInput): Promise<GerarPacoteEntregaDashboardOutput> {
    const { demandaId, templateEscolhido = 'Executive Premium' } = input;

    // 1. Recuperar a demanda
    const demanda = await this.demandRepo.findById(demandaId);
    if (!demanda) {
      throw new Error(`Demanda com ID "${demandaId}" não encontrada no workspace.`);
    }

    // 2. Recuperar Modelo Power BI
    const modelos = await this.modeloPowerBiRepo.findByDemandaId(demandaId);
    const modeloPowerBi = modelos[0] || null;

    // 3. Recuperar Medidas DAX
    const medidas = modeloPowerBi
      ? await this.medidaDaxRepo.findByModeloPowerBiId(modeloPowerBi.id)
      : [];

    // 4. Recuperar Páginas e Visuais
    let paginasComVisuais: PaginaRelatorioComVisuais[] = [];
    if (modeloPowerBi) {
      const paginasBanco = await this.paginaRepo.findByModeloPowerBiId(modeloPowerBi.id);
      paginasComVisuais = await Promise.all(
        paginasBanco.map(async (p) => {
          const visuaisPagina = await this.visualRepo.findByPaginaId(p.id);
          return {
            ...p,
            visuais: visuaisPagina,
          };
        })
      );
    }

    // 5. Recuperar Modelo Analítico Homologado / Vigente
    let modeloAnalitico: ModeloAnaliticoCompleto | null = null;
    const modeloHomologado = await this.modeloAnaliticoRepo.findHomologadoByDemandaId(demandaId);
    if (modeloHomologado) {
      modeloAnalitico = await this.modeloAnaliticoRepo.findCompletoById(modeloHomologado.id);
    } else {
      const todosModelos = await this.modeloAnaliticoRepo.findByDemandaId(demandaId);
      if (todosModelos.length > 0) {
        modeloAnalitico = await this.modeloAnaliticoRepo.findCompletoById(todosModelos[0].id);
      }
    }

    // 6. Executar Avaliação Normativa D-01 a D-08
    const todosVisuais = paginasComVisuais.flatMap((p) => p.visuais);
    const resultadoNormativo = DashboardRulesEvaluator.avaliar({
      modeloPowerBi,
      medidas,
      paginas: paginasComVisuais,
      visuais: todosVisuais,
      modeloAnalitico,
    });

    // 7. Executar Avaliação Consultiva do Copiloto
    const contextoCopiloto: ContextoAnaliseDashboardCopilot = {
      demandaId,
      modeloPowerBi,
      medidas,
      paginas: paginasComVisuais,
      visuais: todosVisuais,
      modeloAnalitico,
      resultadoConformidadeDax: resultadoNormativo,
    };
    const resultadoCopiloto = DashboardCopilotEngine.analisar(contextoCopiloto);

    // 8. Montar o Pacote de Entrega Determinístico
    const pacote = DashboardDeliveryPackageEngine.montarPacote({
      demanda,
      modeloPowerBi,
      modeloAnalitico,
      medidas,
      paginas: paginasComVisuais,
      resultadoNormativo,
      resultadoCopiloto,
      templateEscolhido,
    });

    // 9. Gerar Documentação em Markdown
    const documentacaoMarkdown = DashboardDocumentationGenerator.gerarMarkdown(pacote);

    // 10. Gerar Exportação em JSON
    const pacoteJson = JSON.stringify(pacote, null, 2);

    // 11. Gerar Especificação TMDL das Medidas DAX
    const medidasTmdl =
      medidas.length > 0
        ? TmdlMeasureSerializer.serializeAllMeasuresGrouped(medidas)
        : '// Nenhuma medida DAX cadastrada no modelo.';

    // 12. Gerar Manifesto de Layout (PBIP/PBIR Ready)
    const manifestoLayoutJson = JSON.stringify(
      {
        versaoManifesto: '1.0.0',
        demandaId,
        template: pacote.perfilVisualTemplate,
        designTokens: {
          canvas: { width: 1280, height: 720, aspectRatio: '16:9' },
          grid: { columns: 12, margin: 24, gutter: 16 },
        },
        paginas: pacote.paginas.map((p) => {
          const visuaisDaPagina = pacote.visuais.filter((v) => v.paginaId === p.id);
          return {
            id: p.id,
            nome: p.nome,
            publicoAlvo: p.publicoAlvo,
            layoutGrid: p.layoutGrid,
            ordem: p.ordem,
            visuais: visuaisDaPagina.map((v) => ({
              id: v.id,
              titulo: v.titulo,
              tipoVisual: v.tipoVisual,
              posicaoLayout: v.posicaoLayout,
              medidas: v.medidasAssociadas,
              justificativaDataViz: v.justificativaDataviz,
            })),
          };
        }),
      },
      null,
      2
    );

    return {
      success: true,
      pacote,
      documentacaoMarkdown,
      pacoteJson,
      medidasTmdl,
      manifestoLayoutJson,
    };
  }
}
