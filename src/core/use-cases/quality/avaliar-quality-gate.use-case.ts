import { IAtivoDadosRepository } from '@/core/domain/repositories/ativo-dados-repository.interface';
import { IDiagnosticosQualidadeRepository } from '@/core/domain/repositories/diagnosticos-qualidade-repository.interface';
import { IProblemasQualidadeRepository } from '@/core/domain/repositories/problemas-qualidade-repository.interface';
import { StatusAtivoDados } from '@/core/domain/enums/status-ativo-dados';
import { QualityWorkflowGate, ResultadoQualityGate } from '@/core/domain/rules/quality-gate';
import { ProblemaQualidade } from '@/core/domain/entities/problema-qualidade';

export interface AvaliarQualityGateInput {
  demandaId: string;
  ativoDadosId?: string;
}

export class AvaliarQualityGateUseCase {
  constructor(
    private ativoDadosRepo: IAtivoDadosRepository,
    private diagnosticosRepo: IDiagnosticosQualidadeRepository,
    private problemasRepo: IProblemasQualidadeRepository
  ) {}

  async execute(input: AvaliarQualityGateInput): Promise<ResultadoQualityGate> {
    const assets = await this.ativoDadosRepo.findByDemandId(input.demandaId);

    let ativoAtivo = null;

    if (input.ativoDadosId) {
      ativoAtivo = assets.find((a) => a.id === input.ativoDadosId) ?? null;
      if (!ativoAtivo) {
        throw new Error(
          `Ativo de dados com ID "${input.ativoDadosId}" não encontrado na demanda "${input.demandaId}".`
        );
      }
      if (ativoAtivo.status !== StatusAtivoDados.ATIVO) {
        return {
          decisao: 'BLOQUEADO',
          liberado: false,
          bloqueante: true,
          exigeJustificativa: false,
          motivo: 'O ativo informado é histórico (substituído) e não pode ser avaliado como ativo vigente.',
          detalhes: {
            totalProblemasAvaliados: 0,
            totalPendentes: 0,
            totalCriticosBloqueantes: 0,
            totalAltosBloqueantes: 0,
            totalCriticosAceitos: 0,
            totalAltosAceitos: 0,
            totalTratados: 0,
            totalMediosBaixos: 0,
            verificacoesLimitadas: [],
          },
        };
      }
    } else {
      // Localiza o ativo de dados com status ATIVO na demanda
      const ativosVigentes = assets.filter((a) => a.status === StatusAtivoDados.ATIVO);
      if (ativosVigentes.length === 0) {
        return {
          decisao: 'BLOQUEADO',
          liberado: false,
          bloqueante: true,
          exigeJustificativa: false,
          motivo: 'Nenhum ativo de dados ativo encontrado para a demanda.',
          detalhes: {
            totalProblemasAvaliados: 0,
            totalPendentes: 0,
            totalCriticosBloqueantes: 0,
            totalAltosBloqueantes: 0,
            totalCriticosAceitos: 0,
            totalAltosAceitos: 0,
            totalTratados: 0,
            totalMediosBaixos: 0,
            verificacoesLimitadas: [],
          },
        };
      }
      // Considera o ativo vigente mais recente
      ativoAtivo = ativosVigentes[ativosVigentes.length - 1];
    }

    // 1. Autoridade Operacional Estrita: Diagnóstico mais recente do ativo ATIVO (Zero Fallback)
    const diagnosticoRecente = await this.diagnosticosRepo.findLatestByAssetId(ativoAtivo.id);

    // 2. Universo de Problemas do Gate:
    // a) Problemas da execução recente
    let problemasDiagnostico: ProblemaQualidade[] = [];
    if (diagnosticoRecente) {
      problemasDiagnostico = await this.problemasRepo.findByDiagnosticId(diagnosticoRecente.id);
    }

    // b) Problemas manuais avulsos do ativo (diagnostico_id === null && origem_deteccao === 'MANUAL')
    const problemasDoAtivo = await this.problemasRepo.findByAssetId(ativoAtivo.id);
    const problemasManuaisAvulsos = problemasDoAtivo.filter(
      (p) => p.diagnostico_id === null && p.origem_deteccao === 'MANUAL'
    );

    // Universo consolidado (problemas de diagnósticos anteriores são estritamente excluídos)
    const problemasUniverso = [...problemasDiagnostico, ...problemasManuaisAvulsos];

    // 3. Avaliação determinística pura pelo QualityWorkflowGate
    return QualityWorkflowGate.avaliar({
      diagnosticoRecente,
      problemasUniverso,
    });
  }
}
