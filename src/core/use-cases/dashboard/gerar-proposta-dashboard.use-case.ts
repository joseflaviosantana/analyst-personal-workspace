/**
 * src/core/use-cases/dashboard/gerar-proposta-dashboard.use-case.ts
 *
 * Caso de Uso: Gerar Proposta Automática de Dashboard (Subgate 3.4D)
 *
 * Responsabilidade:
 * - Recuperar o contexto autorizado da demanda (perguntas, modelo analítico, métricas, DAX);
 * - Executar o DashboardPlannerEngine de forma determinística;
 * - Retornar a DashboardSpecification completa com justificativas DataViz para revisão humana.
 */

import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { IModeloPowerBiRepository } from '@/core/domain/repositories/modelo-powerbi-repository.interface';
import { IModeloAnaliticoRepository } from '@/core/domain/repositories/modelo-analitico-repository.interface';
import { IMedidaDaxRepository } from '@/core/domain/repositories/medida-dax-repository.interface';
import {
  DashboardPlannerEngine,
  ContextoPlanejamentoDashboard,
  EntidadeContextoPlanejamento,
} from '@/core/domain/dashboard-automation/dashboard-planner-engine';
import {
  DashboardSpecification,
  ModoTrabalhoDashboard,
} from '@/core/domain/dashboard-automation/dashboard-specification';
import { TipoTemplateDashboard } from '@/core/domain/dashboard-design/dashboard-template';

export interface GerarPropostaDashboardInput {
  demandaId: string;
  template?: TipoTemplateDashboard;
  modoTrabalho?: ModoTrabalhoDashboard;
}

export class GerarPropostaDashboardUseCase {
  constructor(
    private demandRepo: IDemandRepository,
    private modeloPowerBiRepo: IModeloPowerBiRepository,
    private modeloAnaliticoRepo: IModeloAnaliticoRepository,
    private medidaDaxRepo: IMedidaDaxRepository
  ) {}

  async execute(input: GerarPropostaDashboardInput): Promise<DashboardSpecification> {
    const { demandaId, template, modoTrabalho } = input;

    // 1. Obter Demanda
    const demanda = await this.demandRepo.findById(demandaId);
    if (!demanda) {
      throw new Error(`Demanda com ID "${demandaId}" não encontrada.`);
    }

    // 2. Obter Modelo Power BI vinculado
    const modelos = await this.modeloPowerBiRepo.findByDemandaId(demandaId);
    const modeloPowerBi = modelos[0];
    if (!modeloPowerBi) {
      throw new Error(
        `Nenhum Modelo Power BI registrado para a demanda "${demandaId}". Registre o modelo antes de planejar o dashboard.`
      );
    }

    // 3. Obter Modelo Analítico homologado (se houver)
    let metricasHomologadas: any[] = [];
    let entidadesContexto: EntidadeContextoPlanejamento[] = [];
    let modeloAnaliticoNome: string | null = null;

    if (modeloPowerBi.modelo_analitico_id) {
      const modeloAnalitico = await this.modeloAnaliticoRepo.findCompletoById(
        modeloPowerBi.modelo_analitico_id
      );
      if (modeloAnalitico) {
        modeloAnaliticoNome = modeloAnalitico.nome;
        metricasHomologadas = modeloAnalitico.metricas || [];
        entidadesContexto = (modeloAnalitico.entidades || []).map((e) => ({
          id: e.id,
          nome: e.nome,
          tipo: e.tipo,
          atributos: (e.atributos || []).map((a) => ({
            id: a.id,
            nome: a.nome_amigavel || a.nome_original,
            papel: a.papel,
            tipo_dado: a.tipo_dado,
          })),
        }));
      }
    }

    // 4. Obter Medidas DAX existentes no modelo
    const medidasDax = await this.medidaDaxRepo.findByModeloPowerBiId(modeloPowerBi.id);

    // 5. Montar perguntas de negócio da demanda
    const perguntasNegocio: string[] = [];
    if (demanda.objetivo_inicial) {
      perguntasNegocio.push(demanda.objetivo_inicial);
    }
    metricasHomologadas.forEach((m) => {
      if (m.pergunta_negocio_associada) {
        perguntasNegocio.push(m.pergunta_negocio_associada);
      }
    });

    // 6. Montar Contexto de Planejamento e Executar Motor
    const contexto: ContextoPlanejamentoDashboard = {
      demandaId: demanda.id,
      demandaTitulo: demanda.titulo,
      demandaObjetivo: demanda.objetivo_inicial,
      perguntasNegocio,
      modeloPowerBiId: modeloPowerBi.id,
      modeloAnaliticoNome,
      metricasHomologadas,
      medidasDaxExistentes: medidasDax,
      entidadesAnaliticas: entidadesContexto,
      templateDesejado: template,
      modoTrabalho,
    };

    return DashboardPlannerEngine.planejar(contexto);
  }
}
