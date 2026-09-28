import { IModeloAnaliticoRepository } from '@/core/domain/repositories/modelo-analitico-repository.interface';
import { IEntidadeAnaliticaRepository } from '@/core/domain/repositories/entidade-analitica-repository.interface';
import { IAtributoAnaliticoRepository } from '@/core/domain/repositories/atributo-analitico-repository.interface';
import { EntidadeAnaliticaComAtributos } from '@/core/domain/entities/entidade-analitica';
import { AtributoAnalitico } from '@/core/domain/entities/atributo-analitico';
import { TipoEntidadeAnalitica } from '@/core/domain/enums/tipo-entidade-analitica';
import { PapelEntidadeAnalitica } from '@/core/domain/enums/papel-entidade-analitica';
import { TipoOrigemEntidade } from '@/core/domain/enums/tipo-origem-entidade';
import { TipoDadoAnalitico } from '@/core/domain/enums/tipo-dado-analitico';
import { PapelAtributoAnalitico } from '@/core/domain/enums/papel-atributo-analitico';
import { especificarCalendarioSchema } from '@/lib/validations/modeling-schema';

export interface EspecificarDimensaoCalendarioInput {
  modeloId: string;
  nome?: string;
  dataInicio?: string;
  dataFim?: string;
}

export class EspecificarDimensaoCalendarioUseCase {
  constructor(
    private modeloRepo: IModeloAnaliticoRepository,
    private entidadeRepo: IEntidadeAnaliticaRepository,
    private atributoRepo: IAtributoAnaliticoRepository
  ) {}

  /**
   * Especifica logicamente uma Dimensão Calendário.
   * Não gera dados físicos, CSV ou tabelas externas: opera puramente como metadados conceituais.
   */
  async execute(input: EspecificarDimensaoCalendarioInput): Promise<EntidadeAnaliticaComAtributos> {
    const validated = especificarCalendarioSchema.parse(input);

    const modelo = await this.modeloRepo.findById(validated.modeloId);
    if (!modelo) {
      throw new Error(`Modelo analítico com ID '${validated.modeloId}' não encontrado.`);
    }

    const entidades = await this.entidadeRepo.findByModeloId(validated.modeloId);
    let entidadeCalendario = entidades.find(
      (e) => e.papel === PapelEntidadeAnalitica.DIMENSAO_CALENDARIO
    );

    const now = new Date().toISOString();
    const periodoDesc =
      validated.dataInicio && validated.dataFim
        ? ` (Período: ${validated.dataInicio} a ${validated.dataFim})`
        : '';
    const descricao = `Dimensão temporal lógica de calendário padronizada${periodoDesc}.`;

    if (!entidadeCalendario) {
      const novaEntidadeId = `ent_cal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      entidadeCalendario = await this.entidadeRepo.create({
        id: novaEntidadeId,
        modelo_id: validated.modeloId,
        ativo_dados_id: null, // Sem ativo físico direto; dimensão gerada conceitualmente
        nome: validated.nome || 'Dimensão Calendário',
        tipo: TipoEntidadeAnalitica.DIMENSAO,
        papel: PapelEntidadeAnalitica.DIMENSAO_CALENDARIO,
        origem_tipo: TipoOrigemEntidade.DIMENSAO_SISTEMA,
        descricao,
        ordem_apresentacao: entidades.length + 1,
        criado_em: now,
        atualizado_em: now,
      });
    } else {
      entidadeCalendario = await this.entidadeRepo.update({
        ...entidadeCalendario,
        nome: validated.nome || entidadeCalendario.nome,
        descricao,
        atualizado_em: now,
      });
    }

    // Especificação canônica dos atributos da Dimensão Calendário
    const definicoesAtributos = [
      {
        nomeOriginal: 'data',
        nomeAmigavel: 'Data',
        tipoDado: TipoDadoAnalitico.DATA,
        papel: PapelAtributoAnalitico.CHAVE_PRIMARIA,
        formatoExibicao: 'dd/MM/yyyy',
        descricao: 'Chave primária temporal representando a data do dia',
      },
      {
        nomeOriginal: 'ano',
        nomeAmigavel: 'Ano',
        tipoDado: TipoDadoAnalitico.INTEIRO,
        papel: PapelAtributoAnalitico.ATRIBUTO_DESCRITIVO,
        formatoExibicao: 'yyyy',
        descricao: 'Ano numérico de 4 dígitos',
      },
      {
        nomeOriginal: 'mes',
        nomeAmigavel: 'Mês',
        tipoDado: TipoDadoAnalitico.TEXTO,
        papel: PapelAtributoAnalitico.ATRIBUTO_DESCRITIVO,
        formatoExibicao: null,
        descricao: 'Nome por extenso do mês (ex: Janeiro)',
      },
      {
        nomeOriginal: 'numero_mes',
        nomeAmigavel: 'Número do Mês',
        tipoDado: TipoDadoAnalitico.INTEIRO,
        papel: PapelAtributoAnalitico.ATRIBUTO_DESCRITIVO,
        formatoExibicao: '00',
        descricao: 'Número ordinal do mês (1 a 12)',
      },
      {
        nomeOriginal: 'ano_mes',
        nomeAmigavel: 'Ano-Mês',
        tipoDado: TipoDadoAnalitico.TEXTO,
        papel: PapelAtributoAnalitico.ATRIBUTO_DESCRITIVO,
        formatoExibicao: 'yyyy-MM',
        descricao: 'Identificador composto de ano e mês para ordenação e agrupamento',
      },
      {
        nomeOriginal: 'trimestre',
        nomeAmigavel: 'Trimestre',
        tipoDado: TipoDadoAnalitico.TEXTO,
        papel: PapelAtributoAnalitico.ATRIBUTO_DESCRITIVO,
        formatoExibicao: null,
        descricao: 'Trimestre do ano (ex: T1, T2, T3, T4)',
      },
      {
        nomeOriginal: 'dia_semana',
        nomeAmigavel: 'Dia da Semana',
        tipoDado: TipoDadoAnalitico.TEXTO,
        papel: PapelAtributoAnalitico.ATRIBUTO_DESCRITIVO,
        formatoExibicao: null,
        descricao: 'Dia da semana por extenso (ex: Segunda-feira)',
      },
      {
        nomeOriginal: 'eh_dia_util',
        nomeAmigavel: 'É Dia Útil',
        tipoDado: TipoDadoAnalitico.BOOLEANO,
        papel: PapelAtributoAnalitico.ATRIBUTO_DESCRITIVO,
        formatoExibicao: null,
        descricao: 'Indicador lógico booleano de dia útil corporativo',
      },
    ];

    const atributosExistentes = await this.atributoRepo.findByEntidadeId(entidadeCalendario.id);
    const atributosResultado: AtributoAnalitico[] = [];

    let ordem = 1;
    for (const def of definicoesAtributos) {
      const existente = atributosExistentes.find((a) => a.nome_original === def.nomeOriginal);

      if (existente) {
        const atualizado: AtributoAnalitico = {
          ...existente,
          nome_amigavel: def.nomeAmigavel,
          tipo_dado: def.tipoDado,
          papel: def.papel,
          ordem: ordem++,
          descricao: def.descricao,
          formato_exibicao: def.formatoExibicao,
          atualizado_em: now,
        };
        await this.atributoRepo.update(atualizado);
        atributosResultado.push(atualizado);
      } else {
        const novoAttr: AtributoAnalitico = {
          id: `attr_cal_${def.nomeOriginal}_${Math.random().toString(36).substring(2, 6)}`,
          entidade_id: entidadeCalendario.id,
          nome_original: def.nomeOriginal,
          nome_amigavel: def.nomeAmigavel,
          tipo_dado: def.tipoDado,
          papel: def.papel,
          ordem: ordem++,
          oculto: false,
          descricao: def.descricao,
          formato_exibicao: def.formatoExibicao,
          criado_em: now,
          atualizado_em: now,
        };
        await this.atributoRepo.create(novoAttr);
        atributosResultado.push(novoAttr);
      }
    }

    return {
      ...entidadeCalendario,
      atributos: atributosResultado,
    };
  }
}
