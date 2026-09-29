import { IValidacaoConciliacaoRepository } from '@/core/domain/repositories/validacao-conciliacao-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { ValidacaoConciliacao } from '@/core/domain/entities/validacao-conciliacao';
import { ResultadoValidacao } from '@/core/domain/enums/resultado-validacao';
import { calcularDivergenciaNumerica } from '@/core/domain/rules/math-precision';
import {
  retestValidacaoConciliacaoSchema,
  RetestValidacaoConciliacaoInput,
} from '@/lib/validations/validation-schema';

export class RetestarValidacaoConciliacaoUseCase {
  constructor(
    private validacaoRepo: IValidacaoConciliacaoRepository,
    private auditRepo?: IAuditRepository
  ) {}

  async execute(input: RetestValidacaoConciliacaoInput): Promise<ValidacaoConciliacao> {
    const data = retestValidacaoConciliacaoSchema.parse(input);

    const existente = await this.validacaoRepo.findById(data.id);
    if (!existente) {
      throw new Error(`Validação com ID '${data.id}' não encontrada.`);
    }

    const now = new Date().toISOString();
    let divergenciaAbsoluta: number | null = null;
    let divergenciaPercentual: number | null = null;
    let resultado: ResultadoValidacao = ResultadoValidacao.APROVADO;

    if (existente.valor_esperado !== null && existente.valor_esperado !== undefined) {
      const calc = calcularDivergenciaNumerica(
        existente.valor_esperado,
        data.valor_obtido,
        existente.tolerancia_permitida
      );
      divergenciaAbsoluta = calc.divergencia_absoluta;
      divergenciaPercentual = calc.divergencia_percentual;
      resultado = calc.dentro_da_tolerancia
        ? ResultadoValidacao.APROVADO
        : ResultadoValidacao.DIVERGENTE;
    }

    const partial: Partial<ValidacaoConciliacao> = {
      valor_obtido: data.valor_obtido,
      divergencia_absoluta: divergenciaAbsoluta,
      divergencia_percentual: divergenciaPercentual,
      resultado,
      executado_por: data.executado_por,
      executado_em: now,
      notas_evidencia: data.notas_evidencia !== undefined ? data.notas_evidencia : existente.notas_evidencia,
      atualizado_em: now,
    };

    const atualizada = await this.validacaoRepo.update(data.id, partial);
    if (!atualizada) {
      throw new Error(`Falha ao registrar reteste da validação '${data.id}'.`);
    }

    if (this.auditRepo) {
      await this.auditRepo.record({
        demanda_id: atualizada.demanda_id,
        entidade: 'validacoes_conciliacao',
        entidade_id: atualizada.id,
        tipo_evento: 'VALIDACAO_RETESTADA',
        autor_tipo: 'HUMANO',
        dados_anteriores: JSON.stringify(existente),
        dados_novos: JSON.stringify(atualizada),
        justificativa: `Reteste de validação executado por ${data.executado_por}. Novo resultado: ${resultado}.`,
        timestamp: now,
      });
    }

    return atualizada;
  }
}
