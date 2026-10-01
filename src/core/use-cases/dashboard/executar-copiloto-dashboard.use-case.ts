/**
 * src/core/use-cases/dashboard/executar-copiloto-dashboard.use-case.ts
 *
 * Caso de Uso Aplicacional: Orquestração do Copiloto de Dashboard e DAX (Subgate 3.3C)
 *
 * Responsabilidade:
 * - Recuperar o contexto autorizado da demanda (Modelo Power BI, Medidas DAX, Páginas, Visuais);
 * - Recuperar Modelo Analítico homologado/vigente quando existente;
 * - Mapear perguntas e requisitos de negócio rastreáveis;
 * - Avaliar regras normativas D-01 a D-08 de forma estritamente somente-leitura;
 * - Montar o ContextoAnaliseDashboardCopilot de forma imutável;
 * - Executar o DashboardCopilotEngine determinístico;
 * - Estruturar o estado pedagógico (Onde estou, O que faço, Por que faço, O que foi detectado,
 *   O que considerar fazer agora, O que estou aprendendo);
 * - Retornar o ResultadoCopilotoDashboard completo.
 *
 * Princípios Inegociáveis:
 * 1. Não duplicar regras D-01 a D-08 nem estratégias do Copiloto.
 * 2. Isolamento estrito por demanda — nunca misturar dados entre demandas.
 * 3. Tolerância segura a dados parciais ou ausentes (sem modelos, sem medidas, sem páginas).
 * 4. Sem mutação de artefatos e sem efeitos colaterais de escrita.
 * 5. Custo zero: 100% local, puramente determinístico, sem chamadas externas ou LLMs.
 */

import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { IModeloPowerBiRepository } from '@/core/domain/repositories/modelo-powerbi-repository.interface';
import { IMedidaDaxRepository } from '@/core/domain/repositories/medida-dax-repository.interface';
import { IPaginaRelatorioRepository } from '@/core/domain/repositories/pagina-relatorio-repository.interface';
import { IVisualDashboardRepository } from '@/core/domain/repositories/visual-dashboard-repository.interface';
import { IModeloAnaliticoRepository } from '@/core/domain/repositories/modelo-analitico-repository.interface';
import { IDatasetAutorizadoRepository } from '@/core/domain/repositories/dataset-autorizado-repository.interface';
import { ObterModeloHomologadoVigenteUseCase } from '@/core/use-cases/modeling/obter-modelo-homologado-vigente.use-case';
import { DashboardRulesEvaluator } from '@/core/domain/rules/dashboard-rules-evaluator';
import { DashboardCopilotEngine } from '@/core/domain/dashboard-copilot/dashboard-copilot-engine';
import {
  ContextoAnaliseDashboardCopilot,
  ResultadoCopilotoDashboard,
} from '@/core/domain/dashboard-copilot/dashboard-copilot-types';
import { ModeloPowerBi } from '@/core/domain/entities/modelo-powerbi';
import { MedidaDax } from '@/core/domain/entities/medida-dax';
import { PaginaRelatorio } from '@/core/domain/entities/pagina-relatorio';
import { VisualDashboard } from '@/core/domain/entities/visual-dashboard';
import { ModeloAnaliticoCompleto } from '@/core/domain/entities/modelo-analitico';

/**
 * Respostas estruturadas ao modelo pedagógico do Workspace
 */
export interface EstadoPedagogicoDashboard {
  ondeEstou: string;
  oQueEstouFazendo: string;
  porQueEstouFazendo: string;
  oQueFoiDetectado: string;
  oQueConsiderarFazerAgora: string;
  oQueEstouAprendendo: string | null;
}

export interface ExecutarCopilotoDashboardInput {
  demandaId: string;
}

export interface ExecutarCopilotoDashboardOutput {
  demandaId: string;
  resultado: ResultadoCopilotoDashboard;
  contextoUtilizado: ContextoAnaliseDashboardCopilot;
  estadoPedagogico: EstadoPedagogicoDashboard;
}

export class ExecutarCopilotoDashboardUseCase {
  private copilotEngine: DashboardCopilotEngine;
  private obterModeloHomologadoUseCase?: ObterModeloHomologadoVigenteUseCase;

  constructor(
    private demandRepo: IDemandRepository,
    private modeloPowerBiRepo: IModeloPowerBiRepository,
    private medidaDaxRepo?: IMedidaDaxRepository,
    private paginaRelatorioRepo?: IPaginaRelatorioRepository,
    private visualDashboardRepo?: IVisualDashboardRepository,
    private modeloAnaliticoRepo?: IModeloAnaliticoRepository,
    private datasetAutorizadoRepo?: IDatasetAutorizadoRepository,
    obterModeloHomologadoUseCase?: ObterModeloHomologadoVigenteUseCase,
    engine?: DashboardCopilotEngine
  ) {
    this.copilotEngine = engine ?? new DashboardCopilotEngine();

    if (obterModeloHomologadoUseCase) {
      this.obterModeloHomologadoUseCase = obterModeloHomologadoUseCase;
    } else if (this.modeloAnaliticoRepo && this.datasetAutorizadoRepo) {
      this.obterModeloHomologadoUseCase = new ObterModeloHomologadoVigenteUseCase(
        this.modeloAnaliticoRepo,
        this.datasetAutorizadoRepo
      );
    }
  }

  async execute(input: ExecutarCopilotoDashboardInput): Promise<ExecutarCopilotoDashboardOutput> {
    const { demandaId } = input;

    // 1. Recuperar e validar a demanda autorizada (erro controlado para demanda inexistente)
    const demanda = await this.demandRepo.findById(demandaId);
    if (!demanda) {
      throw new Error(`Demanda com ID "${demandaId}" não encontrada.`);
    }

    // 2. Recuperar Modelos Power BI estritamente vinculados a esta demanda
    const modelosDemanda = await this.modeloPowerBiRepo.findByDemandaId(demandaId);
    const modelosFiltrados = (modelosDemanda ?? []).filter((m) => m.demanda_id === demandaId);

    let modeloPowerBi: ModeloPowerBi | null = null;
    let medidas: MedidaDax[] = [];
    let paginas: PaginaRelatorio[] = [];
    let visuais: VisualDashboard[] = [];

    if (modelosFiltrados.length > 0) {
      // Considera o modelo ativo/mais recente da demanda
      const modeloPrincipal = modelosFiltrados[modelosFiltrados.length - 1];
      modeloPowerBi = modeloPrincipal;

      // Recupera estrutura completa preferindo findCompletoById se disponível
      if (typeof this.modeloPowerBiRepo.findCompletoById === 'function') {
        const modeloCompleto = await this.modeloPowerBiRepo.findCompletoById(modeloPrincipal.id);
        if (modeloCompleto && modeloCompleto.demanda_id === demandaId) {
          modeloPowerBi = modeloCompleto;
          medidas = modeloCompleto.medidas ? [...modeloCompleto.medidas] : [];
          paginas = modeloCompleto.paginas ? [...modeloCompleto.paginas] : [];
          visuais = modeloCompleto.paginas
            ? modeloCompleto.paginas.flatMap((p) => (p.visuais ? [...p.visuais] : []))
            : [];
        }
      }

      // Se medidas ou páginas ainda não foram carregadas, tenta repositórios específicos (se fornecidos)
      if (medidas.length === 0 && this.medidaDaxRepo) {
        const medidasCarregadas = await this.medidaDaxRepo.findByModeloPowerBiId(modeloPrincipal.id);
        medidas = (medidasCarregadas ?? []).filter((m) => m.modelo_powerbi_id === modeloPrincipal.id);
      }

      if (paginas.length === 0 && this.paginaRelatorioRepo) {
        const paginasCarregadas = await this.paginaRelatorioRepo.findByModeloPowerBiId(modeloPrincipal.id);
        paginas = (paginasCarregadas ?? []).filter((p) => p.modelo_powerbi_id === modeloPrincipal.id);

        if (visuais.length === 0 && this.visualDashboardRepo) {
          const visuaisPorPagina = await Promise.all(
            paginas.map((pag) => this.visualDashboardRepo!.findByPaginaId(pag.id))
          );
          visuais = visuaisPorPagina.flatMap((list) => list ?? []);
        }
      }
    }

    // 3. Recuperar Modelo Analítico homologado/vigente da demanda (se aplicável)
    let modeloAnalitico: ModeloAnaliticoCompleto | null = null;

    if (this.obterModeloHomologadoUseCase) {
      const resModeloHomologado = await this.obterModeloHomologadoUseCase.execute({ demandaId });
      if (resModeloHomologado.vigente && resModeloHomologado.modelo) {
        if (resModeloHomologado.modelo.demanda_id === demandaId) {
          modeloAnalitico = resModeloHomologado.modelo;
        }
      }
    } else if (this.modeloAnaliticoRepo) {
      const modeloHomologado = await this.modeloAnaliticoRepo.findHomologadoByDemandaId(demandaId);
      if (modeloHomologado && modeloHomologado.demanda_id === demandaId) {
        const completo = await this.modeloAnaliticoRepo.findCompletoById(modeloHomologado.id);
        if (completo && completo.demanda_id === demandaId) {
          modeloAnalitico = completo;
        }
      }
    }

    // 4. Mapear perguntas e requisitos de negócio disponíveis e segregados à demanda
    const perguntasNegocio: string[] = [];
    if (demanda.solicitacao_bruta && demanda.solicitacao_bruta.trim().length > 0) {
      perguntasNegocio.push(demanda.solicitacao_bruta.trim());
    }

    if (modeloAnalitico?.metricas) {
      for (const metrica of modeloAnalitico.metricas) {
        const pergunta = metrica.pergunta_negocio_associada?.trim();
        if (pergunta && pergunta.length > 0 && !perguntasNegocio.includes(pergunta)) {
          perguntasNegocio.push(pergunta);
        }
      }
    }

    const requisitosNegocio: string[] = [];
    if (demanda.objetivo_inicial && demanda.objetivo_inicial.trim().length > 0) {
      requisitosNegocio.push(demanda.objetivo_inicial.trim());
    }
    if (demanda.restricoes_declaradas && demanda.restricoes_declaradas.trim().length > 0) {
      requisitosNegocio.push(demanda.restricoes_declaradas.trim());
    }

    // 5. Avaliar regras normativas D-01 a D-08 (estritamente somente-leitura, sem mutação)
    const resultadoConformidadeDax = DashboardRulesEvaluator.avaliar({
      modeloPowerBi,
      medidas,
      paginas,
      visuais,
      modeloAnalitico,
    });

    // 6. Montar ContextoAnaliseDashboardCopilot imutável
    const contextoUtilizado: ContextoAnaliseDashboardCopilot = Object.freeze({
      demandaId: demanda.id,
      estadoDemanda: demanda.estado,
      modeloPowerBi,
      medidas,
      paginas,
      visuais,
      modeloAnalitico,
      resultadoConformidadeDax,
      perguntasNegocio,
      requisitosNegocio,
    });

    // 7. Executar DashboardCopilotEngine determinístico
    const resultado = this.copilotEngine.avaliar(contextoUtilizado);

    // 8. Estruturar o Estado Pedagógico (respostas aos 6 pilares de orientação)
    const estadoPedagogico: EstadoPedagogicoDashboard = {
      ondeEstou: `Demanda "${demanda.titulo}" — Etapa de Dashboard & DAX (Aba 7)`,
      oQueEstouFazendo: modeloPowerBi
        ? modeloPowerBi.tipo_formato === 'ISENTO_EXCEL_ONLY'
          ? 'Acompanhando modelo formalmente isento de Power BI (foco em entrega tabular/Excel).'
          : `Modelando e auditando dashboard Power BI (${paginas.length} página(s), ${visuais.length} visual(is), ${medidas.length} medida(s) DAX).`
        : 'Aguardando inicialização ou importação do modelo Power BI para esta demanda.',
      porQueEstouFazendo:
        'Garantir que os requisitos de negócio e métricas homologadas sejam plenamente atendidos com alta qualidade técnica, conformidade DAX e storytelling eficaz.',
      oQueFoiDetectado: resultado.insight_principal
        ? resultado.insight_principal.deteccao
        : 'Nenhuma inconformidade ou oportunidade prioritária detectada no contexto atual.',
      oQueConsiderarFazerAgora: resultado.proxima_acao_principal
        ? `${resultado.proxima_acao_principal.titulo}: ${resultado.proxima_acao_principal.descricao}`
        : 'Continuar o desenvolvimento ou submeter o dashboard à validação.',
      oQueEstouAprendendo: resultado.insight_principal?.pedagogico
        ? `${resultado.insight_principal.pedagogico.conceitoChave}: ${resultado.insight_principal.pedagogico.porQueImporta}`
        : null,
    };

    return {
      demandaId: demanda.id,
      resultado,
      contextoUtilizado,
      estadoPedagogico,
    };
  }
}
