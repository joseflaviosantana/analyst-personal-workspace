import { IRegrasQualidadeRepository } from '@/core/domain/repositories/regras-qualidade-repository.interface';
import {
  isAlteracaoSemantica,
  ParametrosRegraQualidade,
  RegraQualidade,
} from '@/core/domain/entities/regra-qualidade';
import { TipoRegraQualidade } from '@/core/domain/enums/tipo-regra-qualidade';

export interface AtualizarRegraQualidadeInput {
  id: string;
  nome?: string;
  descricao?: string | null;
  tipo?: TipoRegraQualidade;
  coluna?: string | null;
  colunas?: string[];
  parametros?: ParametrosRegraQualidade;
}

export class AtualizarRegraQualidadeUseCase {
  constructor(private regrasRepo: IRegrasQualidadeRepository) {}

  async execute(input: AtualizarRegraQualidadeInput): Promise<RegraQualidade> {
    const regraExistente = await this.regrasRepo.findById(input.id);
    if (!regraExistente) {
      throw new Error(`Regra de qualidade com ID "${input.id}" não encontrada.`);
    }

    if (input.nome !== undefined && input.nome.trim() === '') {
      throw new Error('O nome da regra de qualidade não pode ser vazio.');
    }

    // REGRA NORMATIVA INEGOCIÁVEL DE VERSIONAMENTO:
    // Se a alteração afetar o comportamento da validação (tipo, coluna, colunas ou parâmetros),
    // a versão DEVE ser obrigatoriamente incrementada.
    // Se for exclusivamente descritiva (nome, descrição), a versão é preservada.
    const houveAlteracaoSemantica = isAlteracaoSemantica(regraExistente, {
      tipo: input.tipo,
      coluna: input.coluna,
      colunas: input.colunas,
      parametros: input.parametros,
    });

    const novaVersao = houveAlteracaoSemantica ? regraExistente.versao + 1 : regraExistente.versao;
    const agora = new Date().toISOString();

    const colunasAtualizadas = input.colunas !== undefined
      ? input.colunas
      : input.coluna !== undefined
      ? input.coluna ? [input.coluna] : []
      : regraExistente.colunas;

    const regraAtualizada: RegraQualidade = {
      ...regraExistente,
      nome: input.nome !== undefined ? input.nome.trim() : regraExistente.nome,
      descricao: input.descricao !== undefined ? (input.descricao ? input.descricao.trim() : null) : regraExistente.descricao,
      tipo: input.tipo ?? regraExistente.tipo,
      coluna: input.coluna !== undefined ? input.coluna : regraExistente.coluna,
      colunas: colunasAtualizadas,
      parametros: input.parametros ?? regraExistente.parametros,
      versao: novaVersao,
      atualizado_em: agora,
    };

    await this.regrasRepo.update(regraAtualizada);
    return regraAtualizada;
  }
}
