/**
 * src/core/use-cases/evidence/consultar-evidencias-demanda.use-case.ts
 *
 * Caso de uso: Consultar Evidências de uma Demanda e gerar resumo quantitativo.
 */

import {
  EvidenciaAnalitica,
  ResumoMetricasEvidencias,
} from '@/core/domain/entities/evidencia-analitica';
import { StatusValidacaoEvidencia } from '@/core/domain/enums/status-validacao-evidencia';
import { ClassificacaoExposicaoEvidencia } from '@/core/domain/enums/classificacao-exposicao-evidencia';
import { TipoEvidenciaAnalitica } from '@/core/domain/enums/tipo-evidencia-analitica';
import {
  IEvidenciaAnaliticaRepository,
  FiltrosConsultaEvidencias,
} from '@/core/domain/repositories/evidencia-analitica-repository.interface';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';

export interface ConsultarEvidenciasDemandaInput {
  demanda_id: string;
  filtros?: FiltrosConsultaEvidencias;
}

export interface ConsultarEvidenciasDemandaOutput {
  evidencias: EvidenciaAnalitica[];
  metricas: ResumoMetricasEvidencias;
}

export class ConsultarEvidenciasDemandaUseCase {
  constructor(
    private readonly evidenciaRepo: IEvidenciaAnaliticaRepository,
    private readonly demandRepo: IDemandRepository
  ) {}

  async execute(
    input: ConsultarEvidenciasDemandaInput
  ): Promise<ConsultarEvidenciasDemandaOutput> {
    if (!input.demanda_id || typeof input.demanda_id !== 'string') {
      throw new Error('demanda_id é obrigatório para consultar evidências.');
    }

    const demanda = await this.demandRepo.findById(input.demanda_id);
    if (!demanda) {
      throw new Error(`Demanda com ID "${input.demanda_id}" não encontrada.`);
    }

    // Busca todas as evidências da demanda para cálculo das métricas completas
    const todasEvidencias = await this.evidenciaRepo.findByDemandaId(input.demanda_id);

    const metricas: ResumoMetricasEvidencias = {
      total: todasEvidencias.length,
      por_status: {
        [StatusValidacaoEvidencia.CAPTURADA]: 0,
        [StatusValidacaoEvidencia.AGUARDANDO_REVISAO]: 0,
        [StatusValidacaoEvidencia.CONFIRMADA]: 0,
        [StatusValidacaoEvidencia.REJEITADA]: 0,
      },
      por_classificacao: {
        [ClassificacaoExposicaoEvidencia.INTERNA]: 0,
        [ClassificacaoExposicaoEvidencia.CONFIDENCIAL]: 0,
        [ClassificacaoExposicaoEvidencia.SANITIZAVEL]: 0,
        [ClassificacaoExposicaoEvidencia.PUBLICA]: 0,
      },
      por_tipo: {},
      total_elegiveis_portfolio: 0,
    };

    for (const ev of todasEvidencias) {
      if (metricas.por_status[ev.status_validacao] !== undefined) {
        metricas.por_status[ev.status_validacao]++;
      }
      if (metricas.por_classificacao[ev.classificacao_exposicao] !== undefined) {
        metricas.por_classificacao[ev.classificacao_exposicao]++;
      }
      metricas.por_tipo[ev.tipo] = (metricas.por_tipo[ev.tipo] || 0) + 1;
      if (ev.elegibilidade_portfolio) {
        metricas.total_elegiveis_portfolio++;
      }
    }

    // Se houver filtros, recupera a lista filtrada; caso contrário, usa a lista completa
    const evidencias = input.filtros
      ? await this.evidenciaRepo.findByDemandaId(input.demanda_id, input.filtros)
      : todasEvidencias;

    return {
      evidencias,
      metricas,
    };
  }
}
