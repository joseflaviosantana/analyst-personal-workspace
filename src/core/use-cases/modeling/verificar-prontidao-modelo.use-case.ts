import { IModeloAnaliticoRepository } from '@/core/domain/repositories/modelo-analitico-repository.interface';
import { IDatasetAutorizadoRepository } from '@/core/domain/repositories/dataset-autorizado-repository.interface';
import { AvaliarConformidadeModeloUseCase } from '@/core/use-cases/modeling/avaliar-conformidade-modelo.use-case';
import {
  ResultadoAvaliacaoConformidade,
  DiagnosticoRegraModelagem,
} from '@/core/domain/rules/modeling-rules-evaluator';
import { StatusAutorizacaoDataset } from '@/core/domain/enums/status-autorizacao-dataset';
import { StatusModeloAnalitico } from '@/core/domain/enums/status-modelo-analitico';
import {
  verificarProntidaoModeloSchema,
  VerificarProntidaoModeloInput,
} from '@/lib/validations/modeling-schema';

export interface ProntidaoModeloOutput {
  modeloId: string;
  demandaId: string;
  statusModelo: StatusModeloAnalitico;
  prontoParaHomologacao: boolean;
  homologacaoVigenteValida: boolean;
  motivosBloqueio: string[];
  alertasCriticosQueExigemJustificativa: string[];
  recomendacoes: string[];
  temAlteracaoPosteriorAHomologacao: boolean;
  detalhesConformidade: ResultadoAvaliacaoConformidade;
}

export class VerificarProntidaoModeloUseCase {
  private avaliarConformidadeUseCase: AvaliarConformidadeModeloUseCase;

  constructor(
    private modeloRepo: IModeloAnaliticoRepository,
    private datasetRepo: IDatasetAutorizadoRepository
  ) {
    this.avaliarConformidadeUseCase = new AvaliarConformidadeModeloUseCase(
      this.modeloRepo,
      this.datasetRepo
    );
  }

  async execute(rawInput: VerificarProntidaoModeloInput): Promise<ProntidaoModeloOutput> {
    const input = verificarProntidaoModeloSchema.parse(rawInput);

    let modeloId = input.modeloId;

    if (!modeloId && input.demandaId) {
      const modelos = await this.modeloRepo.findByDemandaId(input.demandaId);
      if (modelos.length === 0) {
        throw new Error(`Nenhum modelo analítico encontrado para a demanda '${input.demandaId}'.`);
      }
      // Prioriza o homologado ou o mais recente
      const homologado = modelos.find((m) => m.status === StatusModeloAnalitico.HOMOLOGADO);
      modeloId = homologado ? homologado.id : modelos[modelos.length - 1].id;
    }

    if (!modeloId) {
      throw new Error('ID do modelo analítico não pôde ser determinado.');
    }

    const modeloCompleto = await this.modeloRepo.findCompletoById(modeloId);
    if (!modeloCompleto) {
      throw new Error(`Modelo analítico com ID '${modeloId}' não encontrado.`);
    }

    // 1. Avaliação Determinística das Regras M-01 a M-10
    const avaliacao = await this.avaliarConformidadeUseCase.execute({ modelo_id: modeloId });

    // 2. Coletar diagnósticos por severidade
    const bloqueios = avaliacao.diagnosticos
      .filter((d: DiagnosticoRegraModelagem) => d.severidade === 'BLOQUEIO')
      .map((d: DiagnosticoRegraModelagem) => `${d.codigo_regra}: ${d.titulo} — ${d.deteccao}`);

    const alertasCriticos = avaliacao.diagnosticos
      .filter((d: DiagnosticoRegraModelagem) => d.severidade === 'ALERTA_CRITICO')
      .map((d: DiagnosticoRegraModelagem) => `${d.codigo_regra}: ${d.titulo} — ${d.deteccao}`);

    const recomendacoes = avaliacao.diagnosticos
      .filter((d: DiagnosticoRegraModelagem) => d.severidade === 'RECOMENDACAO')
      .map((d: DiagnosticoRegraModelagem) => `${d.codigo_regra}: ${d.titulo} — ${d.recomendacao}`);

    // 3. Validação do Dataset Autorizado
    const dataset = await this.datasetRepo.findById(modeloCompleto.dataset_autorizado_id);
    if (!dataset || dataset.status !== StatusAutorizacaoDataset.VIGENTE) {
      bloqueios.push(
        `O dataset autorizado vinculado '${modeloCompleto.dataset_autorizado_id}' não possui status VIGENTE (status: ${dataset?.status ?? 'INEXISTENTE'}).`
      );
    }

    // 4. Detecção de Alteração Material Posterior à Homologação
    let temAlteracaoPosterior = false;
    if (modeloCompleto.status === StatusModeloAnalitico.HOMOLOGADO && modeloCompleto.homologado_em) {
      const tsHomologado = new Date(modeloCompleto.homologado_em).getTime();

      // Verificar entidades e atributos
      for (const ent of modeloCompleto.entidades) {
        if (new Date(ent.atualizado_em).getTime() > tsHomologado) {
          temAlteracaoPosterior = true;
          break;
        }
        for (const atr of ent.atributos) {
          if (new Date(atr.atualizado_em).getTime() > tsHomologado) {
            temAlteracaoPosterior = true;
            break;
          }
        }
        if (temAlteracaoPosterior) break;
      }

      // Verificar relacionamentos
      if (!temAlteracaoPosterior) {
        for (const rel of modeloCompleto.relacionamentos) {
          if (new Date(rel.atualizado_em).getTime() > tsHomologado) {
            temAlteracaoPosterior = true;
            break;
          }
        }
      }

      // Verificar métricas
      if (!temAlteracaoPosterior) {
        for (const met of modeloCompleto.metricas) {
          if (new Date(met.atualizado_em).getTime() > tsHomologado) {
            temAlteracaoPosterior = true;
            break;
          }
        }
      }

      if (temAlteracaoPosterior) {
        bloqueios.push(
          'O modelo possui alterações materiais em entidades, atributos, relacionamentos ou métricas realizadas após a homologação formal.'
        );
      }
    }

    const prontoParaHomologacao = bloqueios.length === 0;

    const homologacaoVigenteValida =
      modeloCompleto.status === StatusModeloAnalitico.HOMOLOGADO &&
      !temAlteracaoPosterior &&
      bloqueios.length === 0 &&
      modeloCompleto.revogado_em === null;

    return {
      modeloId: modeloCompleto.id,
      demandaId: modeloCompleto.demanda_id,
      statusModelo: modeloCompleto.status,
      prontoParaHomologacao,
      homologacaoVigenteValida,
      motivosBloqueio: bloqueios,
      alertasCriticosQueExigemJustificativa: alertasCriticos,
      recomendacoes,
      temAlteracaoPosteriorAHomologacao: temAlteracaoPosterior,
      detalhesConformidade: avaliacao,
    };
  }
}
