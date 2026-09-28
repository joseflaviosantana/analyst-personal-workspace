import { IEtapaTransformacaoRepository } from '@/core/domain/repositories/etapa-transformacao-repository.interface';
import { ILinhagemAtivosRepository } from '@/core/domain/repositories/linhagem-ativos-repository.interface';
import { IAtivoDadosRepository } from '@/core/domain/repositories/ativo-dados-repository.interface';
import { IDiagnosticosQualidadeRepository } from '@/core/domain/repositories/diagnosticos-qualidade-repository.interface';
import { IProblemasQualidadeRepository } from '@/core/domain/repositories/problemas-qualidade-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { EtapaTransformacao } from '@/core/domain/entities/etapa-transformacao';
import { StatusEtapaTransformacao } from '@/core/domain/enums/status-etapa-transformacao';
import { StatusExecucaoDiagnostico } from '@/core/domain/enums/status-execucao-diagnostico';
import { StatusProblemaQualidade } from '@/core/domain/enums/status-problema-qualidade';

export interface ValidarEtapaPreparacaoInput {
  etapaId: string;
  justificativa?: string;
  autorTipo?: 'HUMANO' | 'IA';
}

/**
 * ValidarEtapaPreparacaoUseCase (Subunidade 3.5C)
 *
 * Promove uma etapa de transformação de EXECUTADA para VALIDADA.
 * Invariante Inegociável: A validação não pode ser meramente declarativa.
 * Exige comprovação de ativo derivado associado, diagnóstico de qualidade pós-preparação
 * e resolução integral (TRATADO ou ACEITO_COMO_RESTRICAO) de todos os problemas vinculados.
 */
export class ValidarEtapaPreparacaoUseCase {
  constructor(
    private etapaRepo: IEtapaTransformacaoRepository,
    private linhagemRepo: ILinhagemAtivosRepository,
    private ativoDadosRepo: IAtivoDadosRepository,
    private diagnosticosRepo: IDiagnosticosQualidadeRepository,
    private problemasRepo: IProblemasQualidadeRepository,
    private auditRepo?: IAuditRepository
  ) {}

  async execute(input: ValidarEtapaPreparacaoInput): Promise<EtapaTransformacao> {
    const etapa = await this.etapaRepo.findById(input.etapaId);
    if (!etapa) {
      throw new Error(`Etapa de transformação com ID '${input.etapaId}' não encontrada.`);
    }

    if (etapa.status === StatusEtapaTransformacao.VALIDADA) {
      return etapa;
    }

    if (etapa.status === StatusEtapaTransformacao.CANCELADA) {
      throw new Error(`Não é possível validar uma etapa que se encontra cancelada.`);
    }

    if (etapa.status === StatusEtapaTransformacao.PLANEJADA) {
      throw new Error(
        `A etapa '${etapa.id}' está apenas planejada. Ela deve ser executada fisicamente e registrar um ativo derivado antes da validação.`
      );
    }

    // 1. Verificar ativo derivado via linhagem
    const arestas = await this.linhagemRepo.obterArestasPorEtapa(etapa.id);
    if (arestas.length === 0) {
      throw new Error(
        `A etapa de transformação '${etapa.id}' não possui ativo de dados derivado registrado no lineage.`
      );
    }

    const ativoDerivadoId = arestas[0].ativo_destino_id;
    const ativoDerivado = await this.ativoDadosRepo.findById(ativoDerivadoId);
    if (!ativoDerivado) {
      throw new Error(`Ativo de dados derivado com ID '${ativoDerivadoId}' não encontrado.`);
    }

    // 2. Verificar diagnóstico pós-preparação
    const diagnostico = await this.diagnosticosRepo.findLatestByAssetId(ativoDerivado.id);
    if (!diagnostico) {
      throw new Error(
        `O ativo derivado '${ativoDerivado.id}' da etapa não possui diagnóstico de qualidade executado.`
      );
    }

    if (diagnostico.status_execucao === StatusExecucaoDiagnostico.FALHA) {
      throw new Error(
        `O diagnóstico de qualidade mais recente do ativo derivado falhou. Não é possível validar a etapa.`
      );
    }

    if (diagnostico.status_execucao === StatusExecucaoDiagnostico.EM_ANDAMENTO) {
      throw new Error(
        `O diagnóstico de qualidade do ativo derivado ainda está em execução. Aguarde a conclusão.`
      );
    }

    // 3. Verificar problemas vinculados à etapa
    const problemaIds = await this.etapaRepo.listarProblemasPorEtapa(etapa.id);
    if (problemaIds.length > 0) {
      const problemas = (
        await Promise.all(problemaIds.map((id) => this.problemasRepo.findById(id)))
      ).filter((p): p is NonNullable<typeof p> => p !== null);

      const problemasPendentes = problemas.filter(
        (p) =>
          p.status !== StatusProblemaQualidade.TRATADO &&
          p.status !== StatusProblemaQualidade.ACEITO_COMO_RESTRICAO
      );

      if (problemasPendentes.length > 0) {
        throw new Error(
          `A etapa não pode ser validada: existem ${problemasPendentes.length} problema(s) vinculado(s) que ainda não foram tratados empiricamente ou aceitos como restrição.`
        );
      }
    }

    // 4. Promove a etapa para VALIDADA
    const agora = new Date().toISOString();
    const atualizada = await this.etapaRepo.update(etapa.id, {
      status: StatusEtapaTransformacao.VALIDADA,
      atualizado_em: agora,
    });

    if (!atualizada) {
      throw new Error(`Falha ao atualizar etapa '${etapa.id}' para status VALIDADA.`);
    }

    if (this.auditRepo) {
      await this.auditRepo.record({
        demanda_id: arestas[0].demanda_id,
        entidade: 'EtapaTransformacao',
        entidade_id: etapa.id,
        tipo_evento: 'TRANSICAO_ESTADO',
        autor_tipo: input.autorTipo ?? 'HUMANO',
        dados_anteriores: JSON.stringify({ status: etapa.status }),
        dados_novos: JSON.stringify({ status: StatusEtapaTransformacao.VALIDADA }),
        justificativa:
          input.justificativa?.trim() ||
          `Etapa validada com base no diagnóstico '${diagnostico.id}' do ativo derivado '${ativoDerivado.id}'.`,
        timestamp: agora,
      });
    }

    return atualizada;
  }
}
