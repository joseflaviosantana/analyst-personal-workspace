import { IDatasetAutorizadoRepository } from '@/core/domain/repositories/dataset-autorizado-repository.interface';
import { IAtivoDadosRepository } from '@/core/domain/repositories/ativo-dados-repository.interface';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { IDiagnosticosQualidadeRepository } from '@/core/domain/repositories/diagnosticos-qualidade-repository.interface';
import { IReceitaPreparacaoRepository } from '@/core/domain/repositories/receita-preparacao-repository.interface';
import { IProblemasQualidadeRepository } from '@/core/domain/repositories/problemas-qualidade-repository.interface';
import { AvaliarQualityGateUseCase } from '@/core/use-cases/quality/avaliar-quality-gate.use-case';
import { DatasetAutorizadoAnalise } from '@/core/domain/entities/dataset-autorizado-analise';
import { AtivoDados } from '@/core/domain/entities/ativo-dados';
import { ReceitaPreparacao } from '@/core/domain/entities/receita-preparacao';
import { ResultadoQualityGate } from '@/core/domain/rules/quality-gate';
import { StatusAtivoDados } from '@/core/domain/enums/status-ativo-dados';
import { StatusReceitaPreparacao } from '@/core/domain/enums/status-receita-preparacao';
import { StatusProblemaQualidade } from '@/core/domain/enums/status-problema-qualidade';
import { AcaoProblemaQualidade } from '@/core/domain/enums/acao-problema-qualidade';

export interface VerificarProntidaoParaModelagemInput {
  demandaId: string;
}

export interface ProntidaoModelagemOutput {
  pronto: boolean;
  motivosBloqueio: string[];
  detalhes: {
    datasetAutorizado: DatasetAutorizadoAnalise | null;
    ativoAutorizado: AtivoDados | null;
    receitaConcluida: ReceitaPreparacao | null;
    qualityGate: ResultadoQualityGate | null;
    hashValido: boolean;
    problemasPendentes: number;
    problemasNaoTratadosNoPipeline: number;
  };
}

/**
 * VerificarProntidaoParaModelagemUseCase (Subunidade 3.5C)
 *
 * Consulta determinística e factual de governança que verifica se a demanda
 * atende a todos os critérios mandatários para avançar para a fase
 * Em Modelagem e Análise (EM_QUALIDADE_E_PREPARACAO -> EM_MODELAGEM_E_ANALISE).
 */
export class VerificarProntidaoParaModelagemUseCase {
  private avaliarQualityGateUseCase: AvaliarQualityGateUseCase;

  constructor(
    private datasetAutorizadoRepo: IDatasetAutorizadoRepository,
    private ativoDadosRepo: IAtivoDadosRepository,
    private demandRepo: IDemandRepository,
    private diagnosticosRepo: IDiagnosticosQualidadeRepository,
    private receitaRepo: IReceitaPreparacaoRepository,
    private problemasRepo: IProblemasQualidadeRepository
  ) {
    this.avaliarQualityGateUseCase = new AvaliarQualityGateUseCase(
      this.ativoDadosRepo,
      this.diagnosticosRepo,
      this.problemasRepo
    );
  }

  async execute(input: VerificarProntidaoParaModelagemInput): Promise<ProntidaoModelagemOutput> {
    const motivosBloqueio: string[] = [];

    // 1. Validar existência da demanda
    const demanda = await this.demandRepo.findById(input.demandaId);
    if (!demanda) {
      throw new Error(`Demanda com ID '${input.demandaId}' não encontrada.`);
    }

    // 2. Verificar Dataset Autorizado Vigente
    const datasetVigente = await this.datasetAutorizadoRepo.findVigenteByDemandId(input.demandaId);
    if (!datasetVigente) {
      motivosBloqueio.push('A demanda não possui nenhum Dataset Autorizado para Análise no status VIGENTE.');
    }

    let ativoAutorizado: AtivoDados | null = null;
    let hashValido = false;
    let qualityGate: ResultadoQualityGate | null = null;
    let receitaConcluida: ReceitaPreparacao | null = null;

    if (datasetVigente) {
      // 3. Verificar Ativo Autorizado
      ativoAutorizado = await this.ativoDadosRepo.findById(datasetVigente.ativo_dados_id);
      if (!ativoAutorizado) {
        motivosBloqueio.push(
          `O ativo de dados '${datasetVigente.ativo_dados_id}' homologado pelo dataset autorizado não foi encontrado.`
        );
      } else if (ativoAutorizado.status !== StatusAtivoDados.ATIVO) {
        motivosBloqueio.push(
          `O ativo homologado ('${ativoAutorizado.nome_arquivo}') não é mais o ativo vigente da demanda (status atual: ${ativoAutorizado.status}).`
        );
      } else {
        // 4. Integridade Física / Drift de Hash
        if (ativoAutorizado.hash_sha256 === datasetVigente.hash_sha256_snapshot) {
          hashValido = true;
        } else {
          hashValido = false;
          motivosBloqueio.push(
            'Violação de integridade física (Drift de Hash): o hash SHA-256 atual do arquivo físico diverge do snapshot congelado na autorização.'
          );
        }

        // 5. Avaliação do Quality Gate do Ativo Homologado
        qualityGate = await this.avaliarQualityGateUseCase.execute({
          demandaId: input.demandaId,
          ativoDadosId: ativoAutorizado.id,
        });

        if (!qualityGate.liberado) {
          motivosBloqueio.push(`Quality Gate do ativo homologado bloqueado: ${qualityGate.motivo}`);
        }
      }

      // 6. Verificar Receita de Preparação (se aplicável)
      if (datasetVigente.receita_preparacao_id) {
        receitaConcluida = await this.receitaRepo.findById(datasetVigente.receita_preparacao_id);
        if (!receitaConcluida) {
          motivosBloqueio.push(
            `A receita de preparação associada '${datasetVigente.receita_preparacao_id}' não foi encontrada.`
          );
        } else if (receitaConcluida.status !== StatusReceitaPreparacao.CONCLUIDA) {
          motivosBloqueio.push(
            `A receita de preparação '${receitaConcluida.titulo}' não está concluída (status atual: ${receitaConcluida.status}).`
          );
        }
      }
    }

    // 7. Verificar problemas com severidade PENDENTE e TRATAR_NO_PIPELINE
    const problemasDemanda = await this.problemasRepo.findByDemandId(input.demandaId);

    const problemasPendentes = problemasDemanda.filter((p) => p.severidade === 'PENDENTE').length;
    if (problemasPendentes > 0) {
      motivosBloqueio.push(
        `Existem ${problemasPendentes} problema(s) com severidade PENDENTE de deliberação humana na demanda.`
      );
    }

    const problemasNaoTratadosNoPipeline = problemasDemanda.filter(
      (p) =>
        p.acao_deliberada === AcaoProblemaQualidade.TRATAR_NO_PIPELINE &&
        p.status !== StatusProblemaQualidade.TRATADO &&
        p.status !== StatusProblemaQualidade.ACEITO_COMO_RESTRICAO
    ).length;

    if (problemasNaoTratadosNoPipeline > 0) {
      motivosBloqueio.push(
        `Existem ${problemasNaoTratadosNoPipeline} problema(s) com plano de tratamento no pipeline que não foram resolvidos.`
      );
    }

    return {
      pronto: motivosBloqueio.length === 0,
      motivosBloqueio,
      detalhes: {
        datasetAutorizado: datasetVigente,
        ativoAutorizado,
        receitaConcluida,
        qualityGate,
        hashValido,
        problemasPendentes,
        problemasNaoTratadosNoPipeline,
      },
    };
  }
}
