import { IModeloAnaliticoRepository } from '@/core/domain/repositories/modelo-analitico-repository.interface';
import { IDatasetAutorizadoRepository } from '@/core/domain/repositories/dataset-autorizado-repository.interface';
import { VerificarProntidaoModeloUseCase } from './verificar-prontidao-modelo.use-case';
import { ModeloAnaliticoCompleto } from '@/core/domain/entities/modelo-analitico';
import { StatusModeloAnalitico } from '@/core/domain/enums/status-modelo-analitico';

export interface ObterModeloHomologadoVigenteInput {
  demandaId: string;
}

export interface ObterModeloHomologadoVigenteOutput {
  modelo: ModeloAnaliticoCompleto | null;
  vigente: boolean;
  motivoInvalidacao?: string;
}

export class ObterModeloHomologadoVigenteUseCase {
  private verificarProntidaoUseCase: VerificarProntidaoModeloUseCase;

  constructor(
    private modeloRepo: IModeloAnaliticoRepository,
    private datasetRepo: IDatasetAutorizadoRepository
  ) {
    this.verificarProntidaoUseCase = new VerificarProntidaoModeloUseCase(
      this.modeloRepo,
      this.datasetRepo
    );
  }

  async execute(input: ObterModeloHomologadoVigenteInput): Promise<ObterModeloHomologadoVigenteOutput> {
    const modeloHomologado = await this.modeloRepo.findHomologadoByDemandaId(input.demandaId);
    if (!modeloHomologado || modeloHomologado.status !== StatusModeloAnalitico.HOMOLOGADO) {
      return {
        modelo: null,
        vigente: false,
        motivoInvalidacao: 'A demanda não possui nenhum modelo analítico no status HOMOLOGADO.',
      };
    }

    const modeloCompleto = await this.modeloRepo.findCompletoById(modeloHomologado.id);
    if (!modeloCompleto) {
      return {
        modelo: null,
        vigente: false,
        motivoInvalidacao: `Detalhes do modelo analítico '${modeloHomologado.id}' não foram encontrados.`,
      };
    }

    // Avalia deterministamente se a homologação permanece vigente e válida
    const prontidao = await this.verificarProntidaoUseCase.execute({ modeloId: modeloCompleto.id });

    if (!prontidao.homologacaoVigenteValida) {
      const motivo = prontidao.motivosBloqueio.join('; ') || 'Homologação invalidada por perda de conformidade ou alterações materiais posteriores.';
      return {
        modelo: null,
        vigente: false,
        motivoInvalidacao: motivo,
      };
    }

    return {
      modelo: modeloCompleto,
      vigente: true,
    };
  }
}
