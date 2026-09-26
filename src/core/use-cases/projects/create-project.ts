import { Projeto } from '@/core/domain/entities/projeto';
import { IProjectRepository } from '@/core/domain/repositories/project-repository.interface';
import { generateId } from '@/lib/id-generator';
import { CreateProjectInput, createProjectSchema } from '@/lib/validations/project-schema';

export class CreateProjectUseCase {
  constructor(private projectRepo: IProjectRepository) {}

  async execute(input: CreateProjectInput): Promise<Projeto> {
    const validated = createProjectSchema.parse(input);
    const now = new Date().toISOString();

    const project: Projeto = {
      id: generateId('proj'),
      nome: validated.nome,
      descricao: validated.descricao ?? null,
      status: validated.status ?? 'ATIVO',
      data_inicio: validated.data_inicio ?? null,
      data_conclusao_prevista: validated.data_conclusao_prevista ?? null,
      data_conclusao_real: null,
      criado_em: now,
      atualizado_em: now,
    };

    return this.projectRepo.create(project);
  }
}
