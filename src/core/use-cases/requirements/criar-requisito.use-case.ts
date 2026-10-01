import { RequisitoDemanda } from '@/core/domain/entities/requisito-demanda';
import { CategoriaRequisito } from '@/core/domain/enums/categoria-requisito';
import { StatusRequisito } from '@/core/domain/enums/status-requisito';
import { isEstadoReadOnly } from '@/core/domain/enums/estado-demanda';
import { IRequisitoDemandaRepository } from '@/core/domain/repositories/requisito-demanda-repository.interface';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { generateId } from '@/lib/id-generator';

export interface CriarRequisitoInput {
  demandaId: string;
  titulo: string;
  descricao?: string | null;
  categoria: CategoriaRequisito;
  prioridade?: 'OBRIGATORIO' | 'DESEJAVEL';
  origem?: 'MANUAL' | 'SUGERIDO_COPILOTO';
}

export class CriarRequisitoUseCase {
  constructor(
    private requisitoRepo: IRequisitoDemandaRepository,
    private demandRepo: IDemandRepository
  ) {}

  async execute(input: CriarRequisitoInput): Promise<RequisitoDemanda> {
    const demanda = await this.demandRepo.findById(input.demandaId);
    if (!demanda) {
      throw new Error(`Demanda '${input.demandaId}' não encontrada.`);
    }

    if (isEstadoReadOnly(demanda.estado)) {
      throw new Error(
        `Demanda '${demanda.id}' está em modo somente-leitura (estado: ${demanda.estado}). Criação de requisitos não permitida.`
      );
    }

    if (!input.titulo || input.titulo.trim().length < 3) {
      throw new Error('O título do requisito deve conter no mínimo 3 caracteres.');
    }

    const now = new Date().toISOString();
    const requisito: RequisitoDemanda = {
      id: generateId('req'),
      demanda_id: input.demandaId,
      titulo: input.titulo.trim(),
      descricao: input.descricao?.trim() || null,
      categoria: input.categoria,
      prioridade: input.prioridade || 'OBRIGATORIO',
      status: StatusRequisito.IDENTIFICADO,
      origem: input.origem || 'MANUAL',
      criado_em: now,
      atualizado_em: now,
    };

    return this.requisitoRepo.create(requisito);
  }
}
