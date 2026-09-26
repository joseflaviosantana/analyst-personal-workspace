import crypto from 'node:crypto';
import { IAtivoDadosRepository } from '@/core/domain/repositories/ativo-dados-repository.interface';
import { IRegrasQualidadeRepository } from '@/core/domain/repositories/regras-qualidade-repository.interface';
import {
  ParametrosR1ChaveUnica,
  ParametrosR2ValorMinMax,
  ParametrosR3ValoresPermitidos,
  ParametrosR5RegraTemporal,
  ParametrosRegraQualidade,
  RegraQualidade,
} from '@/core/domain/entities/regra-qualidade';
import { StatusRegraQualidade } from '@/core/domain/enums/status-regra-qualidade';
import { TipoRegraQualidade } from '@/core/domain/enums/tipo-regra-qualidade';

export interface CriarRegraQualidadeInput {
  ativoDadosId: string;
  tipo: TipoRegraQualidade;
  coluna?: string | null;
  colunas?: string[];
  nome: string;
  descricao?: string | null;
  parametros: ParametrosRegraQualidade;
}

export class CriarRegraQualidadeUseCase {
  constructor(
    private ativoDadosRepo: IAtivoDadosRepository,
    private regrasRepo: IRegrasQualidadeRepository
  ) {}

  async execute(input: CriarRegraQualidadeInput): Promise<RegraQualidade> {
    const ativo = await this.ativoDadosRepo.findById(input.ativoDadosId);
    if (!ativo) {
      throw new Error(`Ativo de dados com ID "${input.ativoDadosId}" não encontrado.`);
    }

    if (!input.nome || input.nome.trim() === '') {
      throw new Error('O nome da regra de qualidade é obrigatório.');
    }

    this.validarParametrosRegra(input.tipo, input.coluna, input.colunas, input.parametros);

    const agora = new Date().toISOString();
    const colunasFinais = input.colunas && input.colunas.length > 0
      ? input.colunas
      : input.coluna ? [input.coluna] : [];

    // REGRA NORMATIVA INEGOCIÁVEL: Toda regra nasce ATIVA e na versão 1
    const novaRegra: RegraQualidade = {
      id: crypto.randomUUID(),
      ativo_dados_id: input.ativoDadosId,
      tipo: input.tipo,
      coluna: input.coluna ?? null,
      colunas: colunasFinais,
      nome: input.nome.trim(),
      descricao: input.descricao ? input.descricao.trim() : null,
      parametros: input.parametros,
      status: StatusRegraQualidade.ATIVA,
      versao: 1,
      criado_em: agora,
      atualizado_em: agora,
    };

    await this.regrasRepo.create(novaRegra);
    return novaRegra;
  }

  private validarParametrosRegra(
    tipo: TipoRegraQualidade,
    coluna?: string | null,
    colunas?: string[],
    parametros?: ParametrosRegraQualidade
  ): void {
    if (!parametros) {
      throw new Error('Os parâmetros da regra são obrigatórios.');
    }

    switch (tipo) {
      case TipoRegraQualidade.CHAVE_UNICA: {
        const cols = colunas && colunas.length > 0 ? colunas : coluna ? [coluna] : [];
        if (cols.length === 0) {
          throw new Error('Regra R1 (Chave Única) requer ao menos uma coluna informada.');
        }
        break;
      }
      case TipoRegraQualidade.VALOR_MIN_MAX: {
        if (!coluna || coluna.trim() === '') {
          throw new Error('Regra R2 (Limites Mínimo e Máximo) requer coluna alvo informada.');
        }
        const p = parametros as ParametrosR2ValorMinMax;
        const temMin = p.minimo !== null && p.minimo !== undefined;
        const temMax = p.maximo !== null && p.maximo !== undefined;
        if (!temMin && !temMax) {
          throw new Error('Regra R2 requer ao menos limite mínimo ou limite máximo.');
        }
        if (temMin && temMax && (p.minimo as number) > (p.maximo as number)) {
          throw new Error('Limite mínimo não pode ser maior que o limite máximo.');
        }
        break;
      }
      case TipoRegraQualidade.VALORES_PERMITIDOS: {
        if (!coluna || coluna.trim() === '') {
          throw new Error('Regra R3 (Valores Permitidos) requer coluna alvo informada.');
        }
        const p = parametros as ParametrosR3ValoresPermitidos;
        if (!p.valoresPermitidos || p.valoresPermitidos.length === 0) {
          throw new Error('Regra R3 requer ao menos um valor permitido no domínio.');
        }
        break;
      }
      case TipoRegraQualidade.OBRIGATORIEDADE: {
        if (!coluna || coluna.trim() === '') {
          throw new Error('Regra R4 (Obrigatoriedade) requer coluna alvo informada.');
        }
        break;
      }
      case TipoRegraQualidade.REGRA_TEMPORAL: {
        if (!coluna || coluna.trim() === '') {
          throw new Error('Regra R5 (Temporal) requer coluna alvo informada.');
        }
        const p = parametros as ParametrosR5RegraTemporal;
        if (!p.modo || !p.operador) {
          throw new Error('Regra R5 requer modo e operador temporal válidos.');
        }
        if (p.modo === 'COMPARAR_COM_DATA_FIXA' && (!p.dataFixa || p.dataFixa.trim() === '')) {
          throw new Error('Regra R5 no modo COMPARAR_COM_DATA_FIXA requer campo dataFixa preenchido.');
        }
        if (p.modo === 'COMPARAR_COM_COLUNA' && (!p.colunaComparada || p.colunaComparada.trim() === '')) {
          throw new Error('Regra R5 no modo COMPARAR_COM_COLUNA requer campo colunaComparada preenchido.');
        }
        break;
      }
    }
  }
}
