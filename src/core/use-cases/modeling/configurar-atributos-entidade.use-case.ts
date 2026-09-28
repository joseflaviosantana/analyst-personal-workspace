import { IEntidadeAnaliticaRepository } from '@/core/domain/repositories/entidade-analitica-repository.interface';
import { IAtributoAnaliticoRepository } from '@/core/domain/repositories/atributo-analitico-repository.interface';
import { AtributoAnalitico } from '@/core/domain/entities/atributo-analitico';
import { TipoDadoAnalitico } from '@/core/domain/enums/tipo-dado-analitico';
import { PapelAtributoAnalitico } from '@/core/domain/enums/papel-atributo-analitico';
import { configurarAtributosSchema } from '@/lib/validations/modeling-schema';

export interface AtributoConfigItemInput {
  id?: string;
  nomeOriginal: string;
  nomeAmigavel: string;
  tipoDado: TipoDadoAnalitico;
  papel: PapelAtributoAnalitico;
  ordem?: number;
  oculto?: boolean;
  descricao?: string | null;
  formatoExibicao?: string | null;
}

export interface ConfigurarAtributosEntidadeInput {
  entidadeId: string;
  atributos: AtributoConfigItemInput[];
}

export class ConfigurarAtributosEntidadeUseCase {
  constructor(
    private entidadeRepo: IEntidadeAnaliticaRepository,
    private atributoRepo: IAtributoAnaliticoRepository
  ) {}

  async execute(input: ConfigurarAtributosEntidadeInput): Promise<AtributoAnalitico[]> {
    const validated = configurarAtributosSchema.parse(input);

    const entidade = await this.entidadeRepo.findById(validated.entidadeId);
    if (!entidade) {
      throw new Error(`Entidade analítica com ID '${validated.entidadeId}' não encontrada.`);
    }

    const now = new Date().toISOString();
    const atributosExistentes = await this.atributoRepo.findByEntidadeId(validated.entidadeId);
    const idsRecebidos = new Set<string>();

    const resultado: AtributoAnalitico[] = [];

    let ordemContador = 1;
    for (const item of validated.atributos) {
      const ordem = item.ordem ?? ordemContador++;

      if (item.id) {
        const existente = atributosExistentes.find((a) => a.id === item.id);
        if (existente) {
          idsRecebidos.add(item.id);
          const atualizado: AtributoAnalitico = {
            ...existente,
            nome_original: item.nomeOriginal,
            nome_amigavel: item.nomeAmigavel,
            tipo_dado: item.tipoDado,
            papel: item.papel,
            ordem,
            oculto: item.oculto ?? false,
            descricao: item.descricao ?? null,
            formato_exibicao: item.formatoExibicao ?? null,
            atualizado_em: now,
          };
          await this.atributoRepo.update(atualizado);
          resultado.push(atualizado);
          continue;
        }
      }

      // Novo atributo
      const novoId = item.id || `attr_${Date.now()}_${ordem}_${Math.random().toString(36).substring(2, 6)}`;
      idsRecebidos.add(novoId);

      const novoAtributo: AtributoAnalitico = {
        id: novoId,
        entidade_id: validated.entidadeId,
        nome_original: item.nomeOriginal,
        nome_amigavel: item.nomeAmigavel,
        tipo_dado: item.tipoDado,
        papel: item.papel,
        ordem,
        oculto: item.oculto ?? false,
        descricao: item.descricao ?? null,
        formato_exibicao: item.formatoExibicao ?? null,
        criado_em: now,
        atualizado_em: now,
      };

      await this.atributoRepo.create(novoAtributo);
      resultado.push(novoAtributo);
    }

    // Remove atributos que não estão mais presentes na lista configurada
    for (const existente of atributosExistentes) {
      if (!idsRecebidos.has(existente.id)) {
        await this.atributoRepo.delete(existente.id);
      }
    }

    return resultado;
  }
}
