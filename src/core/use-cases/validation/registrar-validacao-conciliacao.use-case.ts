import { randomUUID } from 'crypto';
import { IValidacaoConciliacaoRepository } from '@/core/domain/repositories/validacao-conciliacao-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { ValidacaoConciliacao } from '@/core/domain/entities/validacao-conciliacao';
import { ResultadoValidacao } from '@/core/domain/enums/resultado-validacao';
import { calcularDivergenciaNumerica } from '@/core/domain/rules/math-precision';
import {
  createValidacaoConciliacaoSchema,
  CreateValidacaoConciliacaoInput,
} from '@/lib/validations/validation-schema';

export class RegistrarValidacaoConciliacaoUseCase {
  constructor(
    private validacaoRepo: IValidacaoConciliacaoRepository,
    private auditRepo?: IAuditRepository
  ) {}

  async execute(input: CreateValidacaoConciliacaoInput): Promise<ValidacaoConciliacao> {
    const data = createValidacaoConciliacaoSchema.parse(input);

    const now = new Date().toISOString();
    let divergenciaAbsoluta: number | null = null;
    let divergenciaPercentual: number | null = null;
    let resultado = data.resultado;

    if (data.valor_esperado !== null && data.valor_esperado !== undefined &&
        data.valor_obtido !== null && data.valor_obtido !== undefined) {
      const calc = calcularDivergenciaNumerica(
        data.valor_esperado,
        data.valor_obtido,
        data.tolerancia_permitida
      );
      divergenciaAbsoluta = calc.divergencia_absoluta;
      divergenciaPercentual = calc.divergencia_percentual;

      if (data.resultado === ResultadoValidacao.PENDENTE_RETESTE) {
        resultado = calc.dentro_da_tolerancia
          ? ResultadoValidacao.APROVADO
          : ResultadoValidacao.DIVERGENTE;
      }
    }

    const validacao: ValidacaoConciliacao = {
      id: `val_${randomUUID()}`,
      demanda_id: data.demanda_id,
      modelo_id: data.modelo_id ?? null,
      metrica_id: data.metrica_id ?? null,
      titulo: data.titulo,
      camada: data.camada,
      metodo_verificacao: data.metodo_verificacao,
      base_referencia: data.base_referencia ?? null,
      valor_esperado: data.valor_esperado ?? null,
      valor_obtido: data.valor_obtido ?? null,
      divergencia_absoluta: divergenciaAbsoluta,
      divergencia_percentual: divergenciaPercentual,
      tolerancia_permitida: data.tolerancia_permitida,
      unidade_medida: data.unidade_medida ?? null,
      resultado,
      obrigatoria: data.obrigatoria,
      acao_corretiva: data.acao_corretiva ?? null,
      notas_evidencia: data.notas_evidencia ?? null,
      executado_por: data.executado_por ?? null,
      executado_em: data.valor_obtido !== null && data.valor_obtido !== undefined ? now : null,
      criado_em: now,
      atualizado_em: now,
    };

    const criada = await this.validacaoRepo.create(validacao);

    if (this.auditRepo) {
      await this.auditRepo.record({
        demanda_id: criada.demanda_id,
        entidade: 'validacoes_conciliacao',
        entidade_id: criada.id,
        tipo_evento: 'VALIDACAO_REGISTRADA',
        autor_tipo: 'HUMANO',
        dados_anteriores: null,
        dados_novos: JSON.stringify(criada),
        justificativa: null,
        timestamp: now,
      });
    }

    return criada;
  }
}
