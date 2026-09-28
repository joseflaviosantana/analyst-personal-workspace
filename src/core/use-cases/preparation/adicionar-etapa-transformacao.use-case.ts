import { IEtapaTransformacaoRepository } from '@/core/domain/repositories/etapa-transformacao-repository.interface';
import { IReceitaPreparacaoRepository } from '@/core/domain/repositories/receita-preparacao-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { EtapaTransformacao } from '@/core/domain/entities/etapa-transformacao';
import { StatusEtapaTransformacao } from '@/core/domain/enums/status-etapa-transformacao';
import { StatusReceitaPreparacao } from '@/core/domain/enums/status-receita-preparacao';
import { generateId } from '@/lib/id-generator';
import { AdicionarEtapaTransformacaoInput, adicionarEtapaTransformacaoSchema } from '@/lib/validations/preparation-schema';

/**
 * Caso de Uso: Adicionar Etapa de Transformação (Subunidade 3.5B)
 * Adiciona uma operação planejada a uma receita de preparação existente.
 * A etapa nasce no status PLANEJADA e monotonicamente ordenada.
 * Nota Decisão 1: A adição de etapa NÃO transiciona a receita para EM_EXECUCAO.
 */
export class AdicionarEtapaTransformacaoUseCase {
  constructor(
    private etapaRepo: IEtapaTransformacaoRepository,
    private receitaRepo: IReceitaPreparacaoRepository,
    private auditRepo?: IAuditRepository
  ) {}

  async execute(input: AdicionarEtapaTransformacaoInput): Promise<EtapaTransformacao> {
    const validated = adicionarEtapaTransformacaoSchema.parse(input);

    const receita = await this.receitaRepo.findById(validated.receita_id);
    if (!receita) {
      throw new Error(`Não é possível adicionar a etapa: Receita '${validated.receita_id}' não encontrada.`);
    }

    if (
      receita.status === StatusReceitaPreparacao.CONCLUIDA ||
      receita.status === StatusReceitaPreparacao.OBSOLETA
    ) {
      throw new Error(
        `Não é permitido adicionar etapas em uma receita com status '${receita.status}'.`
      );
    }

    // Cálculo da ordem monotônica se não fornecida
    let ordemFinal = validated.ordem;
    if (ordemFinal === undefined) {
      const etapasExistentes = await this.etapaRepo.findByReceitaId(validated.receita_id);
      ordemFinal = etapasExistentes.length + 1;
    }

    const now = new Date().toISOString();

    const novaEtapa: EtapaTransformacao = {
      id: generateId('etp'),
      receita_id: validated.receita_id,
      ordem: ordemFinal,
      tipo_operacao: validated.tipo_operacao,
      capacidade_ferramenta: validated.capacidade_ferramenta,
      ferramenta_nome: validated.ferramenta_nome,
      ferramenta_versao: validated.ferramenta_versao ?? null,
      descricao: validated.descricao,
      especificacao_tecnica: validated.especificacao_tecnica ?? null,
      status: StatusEtapaTransformacao.PLANEJADA,
      justificativa: validated.justificativa ?? null,
      criado_em: now,
      atualizado_em: now,
    };

    const created = await this.etapaRepo.create(novaEtapa);

    if (this.auditRepo) {
      await this.auditRepo.record({
        demanda_id: receita.demanda_id,
        entidade: 'EtapaTransformacao',
        entidade_id: created.id,
        tipo_evento: 'CRIACAO',
        autor_tipo: 'HUMANO',
        dados_anteriores: null,
        dados_novos: JSON.stringify({
          receita_id: created.receita_id,
          ordem: created.ordem,
          tipo_operacao: created.tipo_operacao,
          ferramenta_nome: created.ferramenta_nome,
        }),
        justificativa: 'Planejamento de nova etapa de transformação no pipeline.',
        timestamp: now,
      });
    }

    return created;
  }
}
