import { IModeloAnaliticoRepository } from '@/core/domain/repositories/modelo-analitico-repository.interface';
import { ModeloAnalitico } from '@/core/domain/entities/modelo-analitico';
import { StatusModeloAnalitico } from '@/core/domain/enums/status-modelo-analitico';
import { TipoArquiteturaModelo } from '@/core/domain/enums/tipo-arquitetura-modelo';
import { atualizarModeloSchema } from '@/lib/validations/modeling-schema';

export interface AtualizarModeloAnaliticoInput {
  id: string;
  nome?: string;
  descricao?: string;
  tipoArquitetura?: TipoArquiteturaModelo;
}

export class AtualizarModeloAnaliticoUseCase {
  constructor(private modeloRepo: IModeloAnaliticoRepository) {}

  async execute(input: AtualizarModeloAnaliticoInput): Promise<ModeloAnalitico> {
    const validated = atualizarModeloSchema.parse(input);

    const modelo = await this.modeloRepo.findById(validated.id);
    if (!modelo) {
      throw new Error(`Modelo analítico com ID '${validated.id}' não encontrado.`);
    }

    if (modelo.status === StatusModeloAnalitico.HOMOLOGADO) {
      throw new Error(
        'Modelos analíticos HOMOLOGADOS não podem ser alterados diretamente. Crie uma nova revisão ou revogue o modelo existente.'
      );
    }

    const now = new Date().toISOString();
    const atualizado: ModeloAnalitico = {
      ...modelo,
      nome: validated.nome ?? modelo.nome,
      descricao: validated.descricao !== undefined ? validated.descricao : modelo.descricao,
      tipo_arquitetura: validated.tipoArquitetura ?? modelo.tipo_arquitetura,
      atualizado_em: now,
    };

    return this.modeloRepo.update(atualizado);
  }
}
