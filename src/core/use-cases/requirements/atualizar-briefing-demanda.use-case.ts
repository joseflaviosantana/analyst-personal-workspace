import { Demanda } from '@/core/domain/entities/demanda';
import { isEstadoReadOnly } from '@/core/domain/enums/estado-demanda';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';

export interface AtualizarBriefingDemandaInput {
  demandaId: string;
  contexto?: string | null;
  objetivoInicial?: string | null;
  periodoAnalise?: string | null;
  granularidade?: string | null;
  formatoEntrega?: string | null;
  restricoesDeclaradas?: string | null;
  prazoEsperado?: string | null;
}

export class AtualizarBriefingDemandaUseCase {
  constructor(
    private demandRepo: IDemandRepository,
    private auditRepo?: IAuditRepository
  ) {}

  async execute(input: AtualizarBriefingDemandaInput): Promise<Demanda> {
    const existing = await this.demandRepo.findById(input.demandaId);
    if (!existing) {
      throw new Error(`Demanda '${input.demandaId}' não encontrada.`);
    }

    if (isEstadoReadOnly(existing.estado)) {
      throw new Error(
        `Demanda '${existing.id}' está em modo somente-leitura (estado: ${existing.estado}). Atualização de briefing não permitida.`
      );
    }

    const partial: Partial<Demanda> = {};
    if (input.contexto !== undefined) partial.contexto = input.contexto?.trim() || null;
    if (input.objetivoInicial !== undefined) partial.objetivo_inicial = input.objetivoInicial?.trim() || null;
    if (input.periodoAnalise !== undefined) partial.periodo_analise = input.periodoAnalise?.trim() || null;
    if (input.granularidade !== undefined) partial.granularidade = input.granularidade?.trim() || null;
    if (input.formatoEntrega !== undefined) partial.formato_entrega = input.formatoEntrega?.trim() || null;
    if (input.restricoesDeclaradas !== undefined) partial.restricoes_declaradas = input.restricoesDeclaradas?.trim() || null;
    if (input.prazoEsperado !== undefined) partial.prazo_esperado = input.prazoEsperado?.trim() || null;

    const updated = await this.demandRepo.update(input.demandaId, partial);
    if (!updated) {
      throw new Error(`Falha ao atualizar briefing da demanda '${input.demandaId}'.`);
    }

    if (this.auditRepo) {
      await this.auditRepo.record({
        demanda_id: existing.id,
        entidade: 'Demanda',
        entidade_id: existing.id,
        tipo_evento: 'DECISAO_HUMANA',
        autor_tipo: 'HUMANO',
        dados_anteriores: JSON.stringify({
          contexto: existing.contexto,
          objetivo_inicial: existing.objetivo_inicial,
        }),
        dados_novos: JSON.stringify(partial),
        justificativa: 'Refinamento e estruturação do briefing analítico na Aba 2.',
        timestamp: new Date().toISOString(),
      });
    }

    return updated;
  }
}
