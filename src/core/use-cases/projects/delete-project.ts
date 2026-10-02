import { IProjectRepository } from '@/core/domain/repositories/project-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';

export interface DeleteProjectInput {
  projectId: string;
  motivo?: string;
  autorTipo?: 'HUMANO' | 'IA';
}

export interface DeleteProjectOutput {
  success: boolean;
  projectId: string;
  projetoNome: string;
  mensagem: string;
}

export class ProjetoPossuiDemandasVinculadasError extends Error {
  constructor(public readonly projectId: string, public readonly totalDemandas: number) {
    super(
      `Não é possível excluir o projeto porque existem ${totalDemandas} demanda(s) vinculada(s). Trate as demandas vinculadas antes de prosseguir.`
    );
    this.name = 'ProjetoPossuiDemandasVinculadasError';
  }
}

export class ProjetoNotFoundError extends Error {
  constructor(public readonly projectId: string) {
    super(`Projeto com ID '${projectId}' não foi encontrado.`);
    this.name = 'ProjetoNotFoundError';
  }
}

export class DeleteProjectUseCase {
  constructor(
    private projectRepo: IProjectRepository,
    private auditRepo?: IAuditRepository
  ) {}

  async execute(input: DeleteProjectInput): Promise<DeleteProjectOutput> {
    const { projectId, motivo, autorTipo = 'HUMANO' } = input;

    // 1. Verificação de existência do projeto
    const existing = await this.projectRepo.findById(projectId);
    if (!existing) {
      throw new ProjetoNotFoundError(projectId);
    }

    // 2. Salvaguarda intransponível contra cascade: bloqueio quando houver demandas vinculadas
    const totalDemandas = await this.projectRepo.countDemands(projectId);
    if (totalDemandas > 0) {
      throw new ProjetoPossuiDemandasVinculadasError(projectId, totalDemandas);
    }

    // 3. Registro auditável prévio da exclusão (garante sobrevivência na trilha mesmo após remoção)
    if (this.auditRepo) {
      await this.auditRepo.record({
        demanda_id: null,
        entidade: 'PROJETO',
        entidade_id: projectId,
        tipo_evento: 'EXCLUSAO',
        autor_tipo: autorTipo,
        dados_anteriores: JSON.stringify(existing),
        dados_novos: null,
        justificativa: motivo || 'Exclusão governada de projeto sem demandas vinculadas.',
        timestamp: new Date().toISOString(),
      });
    }

    // 4. Exclusão física governada via repositório
    const deleted = await this.projectRepo.delete(projectId);
    if (!deleted) {
      throw new Error(`Falha operacional ao excluir o projeto '${projectId}'.`);
    }

    return {
      success: true,
      projectId,
      projetoNome: existing.nome,
      mensagem: `Projeto '${existing.nome}' excluído com sucesso.`,
    };
  }
}
