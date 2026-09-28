import { IModeloAnaliticoRepository } from '@/core/domain/repositories/modelo-analitico-repository.interface';
import { IEntidadeAnaliticaRepository } from '@/core/domain/repositories/entidade-analitica-repository.interface';
import { IAtributoAnaliticoRepository } from '@/core/domain/repositories/atributo-analitico-repository.interface';
import { IRelacionamentoAnaliticoRepository } from '@/core/domain/repositories/relacionamento-analitico-repository.interface';
import { RelacionamentoAnalitico } from '@/core/domain/entities/relacionamento-analitico';
import { CardinalidadeRelacionamento } from '@/core/domain/enums/cardinalidade-relacionamento';
import { DirecaoFiltroRelacionamento } from '@/core/domain/enums/direcao-filtro-relacionamento';
import { adicionarRelacionamentoSchema } from '@/lib/validations/modeling-schema';

export interface AdicionarRelacionamentoAnaliticoInput {
  modeloId: string;
  entidadeOrigemId: string;
  atributoOrigemId: string;
  entidadeDestinoId: string;
  atributoDestinoId: string;
  tipoRelacionamento?: CardinalidadeRelacionamento;
  direcaoFiltro?: DirecaoFiltroRelacionamento;
  justificativa?: string;
}

export class AdicionarRelacionamentoAnaliticoUseCase {
  constructor(
    private modeloRepo: IModeloAnaliticoRepository,
    private entidadeRepo: IEntidadeAnaliticaRepository,
    private atributoRepo: IAtributoAnaliticoRepository,
    private relacionamentoRepo: IRelacionamentoAnaliticoRepository
  ) {}

  async execute(input: AdicionarRelacionamentoAnaliticoInput): Promise<RelacionamentoAnalitico> {
    const validated = adicionarRelacionamentoSchema.parse(input);

    const modelo = await this.modeloRepo.findById(validated.modeloId);
    if (!modelo) {
      throw new Error(`Modelo analítico com ID '${validated.modeloId}' não encontrado.`);
    }

    const entidadeOrigem = await this.entidadeRepo.findById(validated.entidadeOrigemId);
    if (!entidadeOrigem || entidadeOrigem.modelo_id !== validated.modeloId) {
      throw new Error('A entidade de origem não existe ou não pertence a este modelo.');
    }

    const entidadeDestino = await this.entidadeRepo.findById(validated.entidadeDestinoId);
    if (!entidadeDestino || entidadeDestino.modelo_id !== validated.modeloId) {
      throw new Error('A entidade de destino não existe ou não pertence a este modelo.');
    }

    const atributoOrigem = await this.atributoRepo.findById(validated.atributoOrigemId);
    if (!atributoOrigem || atributoOrigem.entidade_id !== validated.entidadeOrigemId) {
      throw new Error('O atributo de origem não existe ou não pertence à entidade de origem declarada.');
    }

    const atributoDestino = await this.atributoRepo.findById(validated.atributoDestinoId);
    if (!atributoDestino || atributoDestino.entidade_id !== validated.entidadeDestinoId) {
      throw new Error('O atributo de destino não existe ou não pertence à entidade de destino declarada.');
    }

    if (validated.entidadeOrigemId === validated.entidadeDestinoId && validated.atributoOrigemId === validated.atributoDestinoId) {
      throw new Error('Não é permitido criar um auto-relacionamento sobre a mesma entidade e o mesmo atributo.');
    }

    const now = new Date().toISOString();
    const id = `rel_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const novoRelacionamento: RelacionamentoAnalitico = {
      id,
      modelo_id: validated.modeloId,
      entidade_origem_id: validated.entidadeOrigemId,
      atributo_origem_id: validated.atributoOrigemId,
      entidade_destino_id: validated.entidadeDestinoId,
      atributo_destino_id: validated.atributoDestinoId,
      tipo_relacionamento: validated.tipoRelacionamento ?? CardinalidadeRelacionamento.MUITOS_PARA_UM,
      direcao_filtro: validated.direcaoFiltro ?? DirecaoFiltroRelacionamento.UNIDIRECIONAL,
      ativo: true,
      justificativa: validated.justificativa ?? null,
      criado_em: now,
      atualizado_em: now,
    };

    return this.relacionamentoRepo.create(novoRelacionamento);
  }
}
