import { IDatasetAutorizadoRepository } from '@/core/domain/repositories/dataset-autorizado-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { DatasetAutorizadoAnalise } from '@/core/domain/entities/dataset-autorizado-analise';
import { StatusAutorizacaoDataset } from '@/core/domain/enums/status-autorizacao-dataset';

export interface RevogarAutorizacaoDatasetInput {
  autorizacaoId: string;
  motivo: string; // Mínimo 15 caracteres
  autorTipo?: 'HUMANO' | 'IA';
}

/**
 * RevogarAutorizacaoDatasetUseCase (Subunidade 3.5C)
 *
 * Revoga formalmente a autorização vigente de um dataset para análise.
 * Exige justificativa formal com no mínimo 15 caracteres e registro auditável.
 */
export class RevogarAutorizacaoDatasetUseCase {
  constructor(
    private datasetAutorizadoRepo: IDatasetAutorizadoRepository,
    private auditRepo?: IAuditRepository
  ) {}

  async execute(input: RevogarAutorizacaoDatasetInput): Promise<DatasetAutorizadoAnalise> {
    const motivoLimpo = input.motivo ? input.motivo.trim() : '';
    if (motivoLimpo.length < 15) {
      throw new Error(
        'O motivo da revogação da autorização é obrigatório e deve conter no mínimo 15 caracteres explicativos.'
      );
    }

    const autorizacao = await this.datasetAutorizadoRepo.findById(input.autorizacaoId);
    if (!autorizacao) {
      throw new Error(`Autorização de dataset com ID '${input.autorizacaoId}' não encontrada.`);
    }

    if (autorizacao.status !== StatusAutorizacaoDataset.VIGENTE) {
      throw new Error(
        `Apenas autorizações no status VIGENTE podem ser revogadas. Status atual: ${autorizacao.status}.`
      );
    }

    const agora = new Date().toISOString();
    const revogada = await this.datasetAutorizadoRepo.revogar(autorizacao.id, motivoLimpo, agora);

    if (!revogada) {
      throw new Error(`Falha ao revogar a autorização de dataset '${autorizacao.id}'.`);
    }

    if (this.auditRepo) {
      await this.auditRepo.record({
        demanda_id: autorizacao.demanda_id,
        entidade: 'DatasetAutorizadoAnalise',
        entidade_id: autorizacao.id,
        tipo_evento: 'DECISAO_HUMANA',
        autor_tipo: input.autorTipo ?? 'HUMANO',
        dados_anteriores: JSON.stringify({ status: autorizacao.status }),
        dados_novos: JSON.stringify({
          status: StatusAutorizacaoDataset.REVOGADO,
          revogado_em: agora,
          motivo_revogacao: motivoLimpo,
        }),
        justificativa: motivoLimpo,
        timestamp: agora,
      });
    }

    return revogada;
  }
}
