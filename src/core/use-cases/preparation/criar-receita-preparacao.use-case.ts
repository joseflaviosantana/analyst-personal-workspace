import { IReceitaPreparacaoRepository } from '@/core/domain/repositories/receita-preparacao-repository.interface';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { ReceitaPreparacao } from '@/core/domain/entities/receita-preparacao';
import { StatusReceitaPreparacao } from '@/core/domain/enums/status-receita-preparacao';
import { EstadoDemanda, isEstadoTerminal, ROTULOS_ESTADO_DEMANDA } from '@/core/domain/enums/estado-demanda';
import { generateId } from '@/lib/id-generator';
import { CriarReceitaPreparacaoInput, criarReceitaPreparacaoSchema } from '@/lib/validations/preparation-schema';

/**
 * Caso de Uso: Criar Receita de Preparação (Subunidade 3.5B)
 * Inicializa o plano formal de transformação para uma demanda.
 * A receita nasce obrigatoriamente no status RASCUNHO e versão 1.
 */
export class CriarReceitaPreparacaoUseCase {
  constructor(
    private receitaRepo: IReceitaPreparacaoRepository,
    private demandRepo: IDemandRepository,
    private auditRepo?: IAuditRepository
  ) {}

  async execute(input: CriarReceitaPreparacaoInput): Promise<ReceitaPreparacao> {
    const validated = criarReceitaPreparacaoSchema.parse(input);

    // 1. Integridade Referencial: A demanda deve existir
    const demand = await this.demandRepo.findById(validated.demanda_id);
    if (!demand) {
      throw new Error(`Não é possível criar a receita: Demanda '${validated.demanda_id}' não encontrada.`);
    }

    // 2. Governança de Workflow: Bloqueio estrito para demandas suspensas ou terminais
    if (demand.estado === EstadoDemanda.SUSPENSA) {
      throw new Error('Não é permitido criar receitas de preparação em demandas suspensas.');
    }

    if (isEstadoTerminal(demand.estado)) {
      const rotulo = ROTULOS_ESTADO_DEMANDA[demand.estado as EstadoDemanda] || demand.estado;
      throw new Error(`Não é permitido criar receitas de preparação em demandas no estado terminal ${rotulo}.`);
    }

    // 3. Unicidade de Receita Ativa na Demanda: impede ramificações paralelas ativas
    const receitaAtiva = await this.receitaRepo.findActiveByDemandId(validated.demanda_id);
    if (receitaAtiva) {
      throw new Error(
        `Já existe uma receita de preparação ativa (${receitaAtiva.status}) para a demanda '${validated.demanda_id}'. Conclua ou descontinue a receita vigente antes de criar uma nova.`
      );
    }

    const now = new Date().toISOString();

    const novaReceita: ReceitaPreparacao = {
      id: generateId('rec'),
      demanda_id: validated.demanda_id,
      titulo: validated.titulo,
      descricao: validated.descricao ?? null,
      status: StatusReceitaPreparacao.RASCUNHO,
      versao: 1,
      criado_em: now,
      atualizado_em: now,
    };

    const created = await this.receitaRepo.create(novaReceita);

    // 4. Trilha de Auditoria
    if (this.auditRepo) {
      await this.auditRepo.record({
        demanda_id: created.demanda_id,
        entidade: 'ReceitaPreparacao',
        entidade_id: created.id,
        tipo_evento: 'CRIACAO',
        autor_tipo: 'HUMANO',
        dados_anteriores: null,
        dados_novos: JSON.stringify({
          titulo: created.titulo,
          status: created.status,
          versao: created.versao,
        }),
        justificativa: 'Inicialização de receita de preparação em rascunho.',
        timestamp: now,
      });
    }

    return created;
  }
}
