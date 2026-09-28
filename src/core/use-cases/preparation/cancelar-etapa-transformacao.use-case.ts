import { IEtapaTransformacaoRepository } from '@/core/domain/repositories/etapa-transformacao-repository.interface';
import { IReceitaPreparacaoRepository } from '@/core/domain/repositories/receita-preparacao-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { EtapaTransformacao } from '@/core/domain/entities/etapa-transformacao';
import { StatusEtapaTransformacao } from '@/core/domain/enums/status-etapa-transformacao';
import { CancelarEtapaInput, cancelarEtapaSchema } from '@/lib/validations/preparation-schema';

/**
 * Caso de Uso: Cancelar Etapa de Transformação (Subunidade 3.5B)
 * Descontinua uma etapa executada ou validada preservando a rastreabilidade histórica.
 * Exige justificativa formal obrigatória de no mínimo 15 caracteres.
 */
export class CancelarEtapaTransformacaoUseCase {
  constructor(
    private etapaRepo: IEtapaTransformacaoRepository,
    private receitaRepo: IReceitaPreparacaoRepository,
    private auditRepo?: IAuditRepository
  ) {}

  async execute(input: CancelarEtapaInput): Promise<EtapaTransformacao> {
    const validated = cancelarEtapaSchema.parse(input);

    const etapa = await this.etapaRepo.findById(validated.id);
    if (!etapa) {
      throw new Error(`Etapa de transformação '${validated.id}' não encontrada.`);
    }

    if (etapa.status === StatusEtapaTransformacao.CANCELADA) {
      throw new Error('A etapa de transformação já se encontra cancelada.');
    }

    const receita = await this.receitaRepo.findById(etapa.receita_id);

    const cancelada = await this.etapaRepo.cancelar(validated.id, validated.justificativa);
    if (!cancelada) {
      throw new Error(`Falha ao cancelar a etapa de transformação '${validated.id}'.`);
    }

    if (this.auditRepo && receita) {
      await this.auditRepo.record({
        demanda_id: receita.demanda_id,
        entidade: 'EtapaTransformacao',
        entidade_id: cancelada.id,
        tipo_evento: 'DECISAO_HUMANA',
        autor_tipo: 'HUMANO',
        dados_anteriores: JSON.stringify({
          status: etapa.status,
          descricao: etapa.descricao,
        }),
        dados_novos: JSON.stringify({
          status: cancelada.status,
          descricao: cancelada.descricao,
          justificativa: cancelada.justificativa,
        }),
        justificativa: validated.justificativa,
        timestamp: new Date().toISOString(),
      });
    }

    return cancelada;
  }
}
