import { Demanda } from '@/core/domain/entities/demanda';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { IProjectRepository } from '@/core/domain/repositories/project-repository.interface';
import { generateId } from '@/lib/id-generator';
import { CreateDemandInput, createDemandSchema } from '@/lib/validations/demand-schema';

export class CreateDemandUseCase {
  constructor(
    private demandRepo: IDemandRepository,
    private projectRepo: IProjectRepository
  ) {}

  async execute(input: CreateDemandInput): Promise<Demanda> {
    const validated = createDemandSchema.parse(input);

    // Validação estrita de integridade referencial: Projeto de origem DEVE existir
    const project = await this.projectRepo.findById(validated.projeto_id);
    if (!project) {
      throw new Error(`Não é possível criar a demanda: Projeto '${validated.projeto_id}' não existe.`);
    }

    const now = new Date().toISOString();

    const demand: Demanda = {
      id: generateId('dem'),
      projeto_id: validated.projeto_id,
      titulo: validated.titulo,
      solicitacao_bruta: validated.solicitacao_bruta,
      contexto: validated.contexto ?? null,
      objetivo_inicial: validated.objetivo_inicial ?? null,
      prazo_esperado: validated.prazo_esperado ?? null,
      restricoes_declaradas: validated.restricoes_declaradas ?? null,
      estado: EstadoDemanda.BACKLOG, // Estado inicial normativo da Demanda (V1)
      criado_em: now,
      atualizado_em: now,
      data_conclusao: null,
    };

    return this.demandRepo.create(demand);
  }
}
