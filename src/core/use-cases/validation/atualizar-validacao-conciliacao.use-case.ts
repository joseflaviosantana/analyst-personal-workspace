import { IValidacaoConciliacaoRepository } from '@/core/domain/repositories/validacao-conciliacao-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { ValidacaoConciliacao } from '@/core/domain/entities/validacao-conciliacao';
import { ResultadoValidacao } from '@/core/domain/enums/resultado-validacao';
import { calcularDivergenciaNumerica } from '@/core/domain/rules/math-precision';
import {
  updateValidacaoConciliacaoSchema,
  UpdateValidacaoConciliacaoInput,
} from '@/lib/validations/validation-schema';

export class AtualizarValidacaoConciliacaoUseCase {
  constructor(
    private validacaoRepo: IValidacaoConciliacaoRepository,
    private auditRepo?: IAuditRepository
  ) {}

  async execute(input: UpdateValidacaoConciliacaoInput): Promise<ValidacaoConciliacao> {
    const data = updateValidacaoConciliacaoSchema.parse(input);

    const existente = await this.validacaoRepo.findById(data.id);
    if (!existente) {
      throw new Error(`Validação com ID '${data.id}' não encontrada.`);
    }

    const valorEsperadoFinal = data.valor_esperado !== undefined ? data.valor_esperado : existente.valor_esperado;
    const valorObtidoFinal = data.valor_obtido !== undefined ? data.valor_obtido : existente.valor_obtido;
    const toleranciaFinal = data.tolerancia_permitida !== undefined ? data.tolerancia_permitida : existente.tolerancia_permitida;

    let divergenciaAbsoluta = existente.divergencia_absoluta;
    let divergenciaPercentual = existente.divergencia_percentual;
    let resultadoFinal = data.resultado !== undefined ? data.resultado : existente.resultado;

    if (valorEsperadoFinal !== null && valorEsperadoFinal !== undefined &&
        valorObtidoFinal !== null && valorObtidoFinal !== undefined) {
      const calc = calcularDivergenciaNumerica(valorEsperadoFinal, valorObtidoFinal, toleranciaFinal);
      divergenciaAbsoluta = calc.divergencia_absoluta;
      divergenciaPercentual = calc.divergencia_percentual;

      if (data.resultado === undefined) {
        resultadoFinal = calc.dentro_da_tolerancia
          ? ResultadoValidacao.APROVADO
          : ResultadoValidacao.DIVERGENTE;
      }
    }

    const now = new Date().toISOString();
    const partial: Partial<ValidacaoConciliacao> = {
      ...data,
      divergencia_absoluta: divergenciaAbsoluta,
      divergencia_percentual: divergenciaPercentual,
      resultado: resultadoFinal,
      atualizado_em: now,
    };

    const atualizada = await this.validacaoRepo.update(data.id, partial);
    if (!atualizada) {
      throw new Error(`Falha ao atualizar validação com ID '${data.id}'.`);
    }

    if (this.auditRepo) {
      await this.auditRepo.record({
        demanda_id: atualizada.demanda_id,
        entidade: 'validacoes_conciliacao',
        entidade_id: atualizada.id,
        tipo_evento: 'DECISAO_HUMANA',
        autor_tipo: 'HUMANO',
        dados_anteriores: JSON.stringify(existente),
        dados_novos: JSON.stringify(atualizada),
        justificativa: 'Atualização de parâmetros de validação e conciliação',
        timestamp: now,
      });
    }

    return atualizada;
  }
}
