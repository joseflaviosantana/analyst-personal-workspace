/**
 * src/core/domain/repositories/evidencia-analitica-repository.interface.ts
 *
 * Contrato de repositório para o Evidence Core (Subgate 3.5A).
 */

import { EvidenciaAnalitica } from '../entities/evidencia-analitica';
import { TipoEvidenciaAnalitica } from '../enums/tipo-evidencia-analitica';
import { EtapaOrigemEvidencia } from '../enums/etapa-origem-evidencia';
import { StatusValidacaoEvidencia } from '../enums/status-validacao-evidencia';
import { ClassificacaoExposicaoEvidencia } from '../enums/classificacao-exposicao-evidencia';

export interface FiltrosConsultaEvidencias {
  tipo?: TipoEvidenciaAnalitica;
  etapa_origem?: EtapaOrigemEvidencia;
  status_validacao?: StatusValidacaoEvidencia;
  classificacao_exposicao?: ClassificacaoExposicaoEvidencia;
  elegibilidade_portfolio?: boolean;
}

export interface IEvidenciaAnaliticaRepository {
  findById(id: string): Promise<EvidenciaAnalitica | null>;
  findByDemandaId(demandaId: string, filtros?: FiltrosConsultaEvidencias): Promise<EvidenciaAnalitica[]>;
  findByProjetoId(projetoId: string): Promise<EvidenciaAnalitica[]>;
  create(evidencia: EvidenciaAnalitica): Promise<EvidenciaAnalitica>;
  update(evidencia: EvidenciaAnalitica): Promise<EvidenciaAnalitica>;
  delete(id: string): Promise<void>;
}
