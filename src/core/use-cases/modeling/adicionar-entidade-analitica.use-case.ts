import { IModeloAnaliticoRepository } from '@/core/domain/repositories/modelo-analitico-repository.interface';
import { IEntidadeAnaliticaRepository } from '@/core/domain/repositories/entidade-analitica-repository.interface';
import { IAtivoDadosRepository } from '@/core/domain/repositories/ativo-dados-repository.interface';
import { EntidadeAnalitica } from '@/core/domain/entities/entidade-analitica';
import { TipoEntidadeAnalitica } from '@/core/domain/enums/tipo-entidade-analitica';
import { PapelEntidadeAnalitica } from '@/core/domain/enums/papel-entidade-analitica';
import { TipoOrigemEntidade } from '@/core/domain/enums/tipo-origem-entidade';
import { adicionarEntidadeSchema } from '@/lib/validations/modeling-schema';

export interface AdicionarEntidadeAnaliticaInput {
  modeloId: string;
  ativoDadosId?: string | null;
  nome: string;
  tipo: TipoEntidadeAnalitica;
  papel?: PapelEntidadeAnalitica;
  origemTipo?: TipoOrigemEntidade;
  descricao?: string;
  ordemApresentacao?: number;
}

export class AdicionarEntidadeAnaliticaUseCase {
  constructor(
    private modeloRepo: IModeloAnaliticoRepository,
    private entidadeRepo: IEntidadeAnaliticaRepository,
    private ativoRepo: IAtivoDadosRepository
  ) {}

  async execute(input: AdicionarEntidadeAnaliticaInput): Promise<EntidadeAnalitica> {
    const validated = adicionarEntidadeSchema.parse(input);

    const modelo = await this.modeloRepo.findById(validated.modeloId);
    if (!modelo) {
      throw new Error(`Modelo analítico com ID '${validated.modeloId}' não encontrado.`);
    }

    if (validated.ativoDadosId) {
      const ativo = await this.ativoRepo.findById(validated.ativoDadosId);
      if (!ativo) {
        throw new Error(`Ativo de dados com ID '${validated.ativoDadosId}' não encontrado.`);
      }
      if (ativo.demanda_id !== modelo.demanda_id) {
        throw new Error('O ativo de dados selecionado pertence a uma demanda diferente da demanda do modelo.');
      }
    }

    const now = new Date().toISOString();
    const id = `ent_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const novaEntidade: EntidadeAnalitica = {
      id,
      modelo_id: validated.modeloId,
      ativo_dados_id: validated.ativoDadosId ?? null,
      nome: validated.nome,
      tipo: validated.tipo,
      papel: validated.papel ?? PapelEntidadeAnalitica.DIMENSAO_PADRAO,
      origem_tipo: validated.origemTipo ?? TipoOrigemEntidade.DATASET_AUTORIZADO,
      descricao: validated.descricao ?? null,
      ordem_apresentacao: validated.ordemApresentacao ?? 0,
      criado_em: now,
      atualizado_em: now,
    };

    return this.entidadeRepo.create(novaEntidade);
  }
}
