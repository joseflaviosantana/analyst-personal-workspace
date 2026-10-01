import { RequisitoDemanda } from '@/core/domain/entities/requisito-demanda';
import { CategoriaRequisito } from '@/core/domain/enums/categoria-requisito';
import { StatusRequisito } from '@/core/domain/enums/status-requisito';
import { isEstadoReadOnly } from '@/core/domain/enums/estado-demanda';
import { IRequisitoDemandaRepository } from '@/core/domain/repositories/requisito-demanda-repository.interface';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';

export interface AtualizarRequisitoInput {
  id: string;
  titulo?: string;
  descricao?: string | null;
  categoria?: CategoriaRequisito;
  prioridade?: 'OBRIGATORIO' | 'DESEJAVEL';
  status?: StatusRequisito;
}

export class AtualizarRequisitoUseCase {
  constructor(
    private requisitoRepo: IRequisitoDemandaRepository,
    private demandRepo?: IDemandRepository
  ) {}

  async execute(input: AtualizarRequisitoInput): Promise<RequisitoDemanda> {
    const existing = await this.requisitoRepo.findById(input.id);
    if (!existing) {
      throw new Error(`Requisito '${input.id}' não encontrado.`);
    }

    if (this.demandRepo) {
      const demanda = await this.demandRepo.findById(existing.demanda_id);
      if (demanda && isEstadoReadOnly(demanda.estado)) {
        throw new Error(
          `Demanda '${demanda.id}' está em modo somente-leitura (estado: ${demanda.estado}). Atualização de requisitos não permitida.`
        );
      }
    }

    if (input.titulo !== undefined && input.titulo.trim().length < 3) {
      throw new Error('O título do requisito deve conter no mínimo 3 caracteres.');
    }

    const partial: Partial<RequisitoDemanda> = {};
    if (input.titulo !== undefined) partial.titulo = input.titulo.trim();
    if (input.descricao !== undefined) partial.descricao = input.descricao?.trim() || null;
    if (input.categoria !== undefined) partial.categoria = input.categoria;
    if (input.prioridade !== undefined) partial.prioridade = input.prioridade;
    if (input.status !== undefined) partial.status = input.status;

    const updated = await this.requisitoRepo.update(input.id, partial);
    if (!updated) {
      throw new Error(`Falha ao atualizar requisito '${input.id}'.`);
    }

    return updated;
  }
}
