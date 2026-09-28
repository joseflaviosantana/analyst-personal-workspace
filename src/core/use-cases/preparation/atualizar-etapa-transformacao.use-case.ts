import { IEtapaTransformacaoRepository } from '@/core/domain/repositories/etapa-transformacao-repository.interface';
import { IReceitaPreparacaoRepository } from '@/core/domain/repositories/receita-preparacao-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { EtapaTransformacao } from '@/core/domain/entities/etapa-transformacao';
import { StatusEtapaTransformacao } from '@/core/domain/enums/status-etapa-transformacao';
import { StatusReceitaPreparacao } from '@/core/domain/enums/status-receita-preparacao';
import { AtualizarEtapaTransformacaoInput, atualizarEtapaTransformacaoSchema } from '@/lib/validations/preparation-schema';

/**
 * Caso de Uso: Atualizar Etapa de Transformação (Subunidade 3.5B)
 * Permite ajustar configurações técnicas e descrições de etapas em planejamento ou execução.
 * Bloqueia alteração estrutural de etapas já validadas ou canceladas.
 */
export class AtualizarEtapaTransformacaoUseCase {
  constructor(
    private etapaRepo: IEtapaTransformacaoRepository,
    private receitaRepo: IReceitaPreparacaoRepository,
    private auditRepo?: IAuditRepository
  ) {}

  async execute(input: AtualizarEtapaTransformacaoInput): Promise<EtapaTransformacao> {
    const validated = atualizarEtapaTransformacaoSchema.parse(input);

    const etapa = await this.etapaRepo.findById(validated.id);
    if (!etapa) {
      throw new Error(`Etapa de transformação '${validated.id}' não encontrada.`);
    }

    const receita = await this.receitaRepo.findById(etapa.receita_id);
    if (!receita) {
      throw new Error(`Receita associada '${etapa.receita_id}' não encontrada.`);
    }

    if (
      receita.status === StatusReceitaPreparacao.CONCLUIDA ||
      receita.status === StatusReceitaPreparacao.OBSOLETA
    ) {
      throw new Error(
        `Não é permitido atualizar etapas em uma receita no status '${receita.status}'.`
      );
    }

    // Regra de Governança: Etapas validadas ou canceladas não admitem alterações técnicas
    if (etapa.status === StatusEtapaTransformacao.VALIDADA) {
      throw new Error(
        'Etapas com status VALIDADA não admitem alteração de parâmetros técnicos para preservar a comprovação de qualidade.'
      );
    }

    if (etapa.status === StatusEtapaTransformacao.CANCELADA) {
      throw new Error('Etapas com status CANCELADA possuem histórico imutável e não admitem atualizações.');
    }

    const dadosAnteriores = {
      descricao: etapa.descricao,
      especificacao_tecnica: etapa.especificacao_tecnica,
      ferramenta_nome: etapa.ferramenta_nome,
      ferramenta_versao: etapa.ferramenta_versao,
      capacidade_ferramenta: etapa.capacidade_ferramenta,
      tipo_operacao: etapa.tipo_operacao,
      justificativa: etapa.justificativa,
    };

    const atualizada = await this.etapaRepo.update(validated.id, {
      descricao: validated.descricao !== undefined ? validated.descricao : etapa.descricao,
      especificacao_tecnica:
        validated.especificacao_tecnica !== undefined ? validated.especificacao_tecnica : etapa.especificacao_tecnica,
      ferramenta_nome:
        validated.ferramenta_nome !== undefined ? validated.ferramenta_nome : etapa.ferramenta_nome,
      ferramenta_versao:
        validated.ferramenta_versao !== undefined ? validated.ferramenta_versao : etapa.ferramenta_versao,
      capacidade_ferramenta:
        validated.capacidade_ferramenta !== undefined ? validated.capacidade_ferramenta : etapa.capacidade_ferramenta,
      tipo_operacao:
        validated.tipo_operacao !== undefined ? validated.tipo_operacao : etapa.tipo_operacao,
      justificativa:
        validated.justificativa !== undefined ? validated.justificativa : etapa.justificativa,
    });

    if (!atualizada) {
      throw new Error(`Falha ao atualizar a etapa de transformação '${validated.id}'.`);
    }

    if (this.auditRepo) {
      await this.auditRepo.record({
        demanda_id: receita.demanda_id,
        entidade: 'EtapaTransformacao',
        entidade_id: atualizada.id,
        tipo_evento: 'DECISAO_HUMANA',
        autor_tipo: 'HUMANO',
        dados_anteriores: JSON.stringify(dadosAnteriores),
        dados_novos: JSON.stringify({
          descricao: atualizada.descricao,
          especificacao_tecnica: atualizada.especificacao_tecnica,
          ferramenta_nome: atualizada.ferramenta_nome,
          tipo_operacao: atualizada.tipo_operacao,
        }),
        justificativa: 'Atualização de especificações da etapa de transformação.',
        timestamp: new Date().toISOString(),
      });
    }

    return atualizada;
  }
}
