/**
 * src/core/use-cases/portfolio/homologar-estudo-caso-portfolio.use-case.ts
 *
 * Homologa formalmente o estudo de caso de portfólio (APROV-10) — (Subgate 3.9 — Aba 11).
 *
 * Trava Soberana Inegociável:
 * 1. O checklist de sanitização e a declaração de revisão humana devem estar 100% validados.
 * 2. Demandas SUSPENSA e CANCELADA bloqueiam a homologação.
 * 3. Demanda CONCLUIDA é permitida para homologação de case de portfólio.
 * 4. Registra o ato no Event Log analítico (PORTFOLIO_CASO_HOMOLOGADO_APROV_10) e na trilha de auditoria.
 */

import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { IEstudoCasoPortfolioRepository } from '@/core/domain/repositories/estudo-caso-portfolio-repository.interface';
import { IEventoAnaliticoLogRepository } from '@/core/domain/repositories/evento-analitico-log-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import {
  EstudoCasoPortfolio,
  isChecklistSanitizacaoCompleto,
} from '@/core/domain/entities/estudo-caso-portfolio';
import { StatusEstudoCaso } from '@/core/domain/enums/status-estudo-caso';
import { EstadoDemanda, normalizarEstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { EtapaOrigemEvidencia } from '@/core/domain/enums/etapa-origem-evidencia';
import { PoliticaCaptura } from '@/core/domain/evidence-events/event-types';

export interface HomologarEstudoCasoPortfolioInput {
  caseId: string;
  autor: string;
  justificativa?: string;
}

export class HomologarEstudoCasoPortfolioUseCase {
  constructor(
    private caseRepo: IEstudoCasoPortfolioRepository,
    private demandRepo: IDemandRepository,
    private eventLogRepo: IEventoAnaliticoLogRepository,
    private auditRepo: IAuditRepository
  ) {}

  async execute(input: HomologarEstudoCasoPortfolioInput): Promise<EstudoCasoPortfolio> {
    const existing = await this.caseRepo.findById(input.caseId);
    if (!existing) {
      throw new Error(`Estudo de caso com ID '${input.caseId}' não encontrado.`);
    }

    const demanda = await this.demandRepo.findById(existing.demanda_id);
    if (!demanda) {
      throw new Error(`Demanda vinculada '${existing.demanda_id}' não encontrada.`);
    }

    const estadoNorm = normalizarEstadoDemanda(demanda.estado);
    if (estadoNorm === EstadoDemanda.SUSPENSA || estadoNorm === EstadoDemanda.CANCELADA) {
      throw new Error(
        `Não é permitido homologar estudos de caso para demandas ${estadoNorm}.`
      );
    }

    // Trava APROV-10: Checklist deve estar 100% completo
    if (!isChecklistSanitizacaoCompleto(existing.checklist_sanitizacao)) {
      throw new Error(
        'A homologação soberana APROV-10 exige que todos os itens do checklist de sanitização e a declaração de revisão humana estejam atestados como verdadeiros.'
      );
    }

    const now = new Date().toISOString();

    const homologado: EstudoCasoPortfolio = {
      ...existing,
      status: StatusEstudoCaso.HOMOLOGADO_APROV_10,
      homologado_em: now,
      homologado_por: input.autor.trim() || 'ANALISTA',
      atualizado_em: now,
    };

    await this.caseRepo.save(homologado);

    // Registra evento no Event Log analítico
    await this.eventLogRepo.create({
      id: crypto.randomUUID(),
      id_evento: `EVT_PORTFOLIO_${homologado.id}_V${homologado.versao}`,
      demanda_id: homologado.demanda_id,
      projeto_id: homologado.projeto_id,
      tipo_evento: 'PORTFOLIO_CASO_HOMOLOGADO_APROV_10',
      etapa_origem: EtapaOrigemEvidencia.REVISAO,
      politica_aplicada: PoliticaCaptura.REGISTRAR_AUTOMATICAMENTE,
      status_processamento: 'REGISTRADO',
      payload_snapshot: {
        caseId: homologado.id,
        versao: homologado.versao,
        titulo: homologado.titulo,
        homologado_por: homologado.homologado_por,
        tecnicas_sanitizacao: homologado.tecnicas_sanitizacao,
      },
      processado_em: now,
    });

    // Registra na Trilha de Auditoria Soberana
    await this.auditRepo.record({
      demanda_id: homologado.demanda_id,
      entidade: 'ESTUDO_CASO_PORTFOLIO',
      entidade_id: homologado.id,
      tipo_evento: 'DECISAO_HUMANA',
      autor_tipo: 'HUMANO',
      dados_anteriores: JSON.stringify({ status: existing.status }),
      dados_novos: JSON.stringify({ status: homologado.status, versao: homologado.versao }),
      justificativa:
        input.justificativa ||
        `Estudo de caso higienizado v${homologado.versao} homologado formalmente via APROV-10 para camada pública de portfólio.`,
      timestamp: now,
    });

    return homologado;
  }
}
