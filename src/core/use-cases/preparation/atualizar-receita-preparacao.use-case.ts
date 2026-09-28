import { IReceitaPreparacaoRepository } from '@/core/domain/repositories/receita-preparacao-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { ReceitaPreparacao } from '@/core/domain/entities/receita-preparacao';
import { StatusReceitaPreparacao } from '@/core/domain/enums/status-receita-preparacao';
import { AtualizarReceitaPreparacaoInput, atualizarReceitaPreparacaoSchema } from '@/lib/validations/preparation-schema';

/**
 * Caso de Uso: Atualizar Receita de Preparação (Subunidade 3.5B)
 * Permite alteração de metadados (título e descrição) apenas em receitas em RASCUNHO ou EM_EXECUCAO.
 */
export class AtualizarReceitaPreparacaoUseCase {
  constructor(
    private receitaRepo: IReceitaPreparacaoRepository,
    private auditRepo?: IAuditRepository
  ) {}

  async execute(input: AtualizarReceitaPreparacaoInput): Promise<ReceitaPreparacao> {
    const validated = atualizarReceitaPreparacaoSchema.parse(input);

    const receita = await this.receitaRepo.findById(validated.id);
    if (!receita) {
      throw new Error(`Receita de preparação '${validated.id}' não encontrada.`);
    }

    // Regra de Governança: Receitas CONCLUIDA ou OBSOLETA possuem metadados congelados
    if (
      receita.status === StatusReceitaPreparacao.CONCLUIDA ||
      receita.status === StatusReceitaPreparacao.OBSOLETA
    ) {
      throw new Error(
        `Receitas no status '${receita.status}' não admitem alteração de metadados para preservar integridade histórica.`
      );
    }

    const dadosAnteriores = {
      titulo: receita.titulo,
      descricao: receita.descricao,
    };

    const atualizado = await this.receitaRepo.update(validated.id, {
      titulo: validated.titulo !== undefined ? validated.titulo : receita.titulo,
      descricao: validated.descricao !== undefined ? validated.descricao : receita.descricao,
    });

    if (!atualizado) {
      throw new Error(`Falha ao atualizar a receita de preparação '${validated.id}'.`);
    }

    if (this.auditRepo) {
      await this.auditRepo.record({
        demanda_id: atualizado.demanda_id,
        entidade: 'ReceitaPreparacao',
        entidade_id: atualizado.id,
        tipo_evento: 'DECISAO_HUMANA',
        autor_tipo: 'HUMANO',
        dados_anteriores: JSON.stringify(dadosAnteriores),
        dados_novos: JSON.stringify({
          titulo: atualizado.titulo,
          descricao: atualizado.descricao,
        }),
        justificativa: 'Atualização de metadados da receita de preparação.',
        timestamp: new Date().toISOString(),
      });
    }

    return atualizado;
  }
}
