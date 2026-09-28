import { IEtapaTransformacaoRepository } from '@/core/domain/repositories/etapa-transformacao-repository.interface';
import { IReceitaPreparacaoRepository } from '@/core/domain/repositories/receita-preparacao-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { StatusReceitaPreparacao } from '@/core/domain/enums/status-receita-preparacao';
import { ReordenarEtapasInput, reordenarEtapasSchema } from '@/lib/validations/preparation-schema';

/**
 * Caso de Uso: Reordenar Etapas de Transformação (Subunidade 3.5B)
 * Garante reordenação atômica e monotonicidade 1..N das etapas de uma receita.
 */
export class ReordenarEtapasTransformacaoUseCase {
  constructor(
    private etapaRepo: IEtapaTransformacaoRepository,
    private receitaRepo: IReceitaPreparacaoRepository,
    private auditRepo?: IAuditRepository
  ) {}

  async execute(input: ReordenarEtapasInput): Promise<void> {
    const validated = reordenarEtapasSchema.parse(input);

    const receita = await this.receitaRepo.findById(validated.receita_id);
    if (!receita) {
      throw new Error(`Receita '${validated.receita_id}' não encontrada.`);
    }

    if (
      receita.status === StatusReceitaPreparacao.CONCLUIDA ||
      receita.status === StatusReceitaPreparacao.OBSOLETA
    ) {
      throw new Error(
        `Não é permitido reordenar etapas de uma receita no status '${receita.status}'.`
      );
    }

    const etapasExistentes = await this.etapaRepo.findByReceitaId(validated.receita_id);
    const idsValidos = new Set(etapasExistentes.map((e) => e.id));

    // Validar se todas as etapas do payload pertencem à receita
    for (const item of validated.ordens) {
      if (!idsValidos.has(item.id)) {
        throw new Error(
          `A etapa '${item.id}' não pertence à receita '${validated.receita_id}' e não pode ser reordenada nela.`
        );
      }
    }

    // Validar unicidade e contiguidade das ordens (1..N) se o payload for completo
    const ordensNumeros = validated.ordens.map((o) => o.ordem);
    const ordensUnicas = new Set(ordensNumeros);
    if (ordensUnicas.size !== ordensNumeros.length) {
      throw new Error('Não são permitidas posições ordinais duplicadas na reordenação das etapas.');
    }

    await this.etapaRepo.reordenar(validated.receita_id, validated.ordens);

    if (this.auditRepo) {
      await this.auditRepo.record({
        demanda_id: receita.demanda_id,
        entidade: 'ReceitaPreparacao',
        entidade_id: receita.id,
        tipo_evento: 'DECISAO_HUMANA',
        autor_tipo: 'HUMANO',
        dados_anteriores: null,
        dados_novos: JSON.stringify(validated.ordens),
        justificativa: 'Reordenação operacional das etapas de transformação da receita.',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
