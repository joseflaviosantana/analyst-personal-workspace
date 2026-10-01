/**
 * src/core/use-cases/portfolio/atualizar-estudo-caso.use-case.ts
 *
 * Atualiza o conteúdo ou sanitização de um estudo de caso de portfólio (Subgate 3.9 — Aba 11).
 *
 * Salvaguardas Críticas (Gate 1B):
 * 1. Demandas SUSPENSA e CANCELADA bloqueiam qualquer mutação.
 * 2. Demanda CONCLUIDA permite edição e revisão do case.
 * 3. Invalidação Soberana Server-Side: Qualquer edição material em um case no estado
 *    HOMOLOGADO_APROV_10 invalida deterministicamente a homologação, retornando o case
 *    para RASCUNHO, limpando os dados de homologação, incrementando a versão e
 *    bloqueando a exportação pública até nova APROV-10 formal.
 */

import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { IEstudoCasoPortfolioRepository } from '@/core/domain/repositories/estudo-caso-portfolio-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import {
  EstudoCasoPortfolio,
  ChecklistSanitizacao,
  MetricaFatoCase,
} from '@/core/domain/entities/estudo-caso-portfolio';
import { StatusEstudoCaso } from '@/core/domain/enums/status-estudo-caso';
import { TecnicaSanitizacao } from '@/core/domain/enums/tecnica-sanitizacao';
import { EstadoDemanda, normalizarEstadoDemanda } from '@/core/domain/enums/estado-demanda';

export interface AtualizarEstudoCasoInput {
  caseId: string;
  titulo?: string;
  problema_negocio?: string;
  processo_preparacao?: string;
  modelagem_decisoes?: string;
  validacao_resultados?: string;
  competencias_demonstradas?: string[];
  ferramentas_utilizadas?: string[];
  metricas_fatos?: MetricaFatoCase[];
  tecnicas_sanitizacao?: TecnicaSanitizacao[];
  checklist_sanitizacao?: Partial<ChecklistSanitizacao>;
  ator?: string;
}

export class AtualizarEstudoCasoUseCase {
  constructor(
    private caseRepo: IEstudoCasoPortfolioRepository,
    private demandRepo: IDemandRepository,
    private auditRepo?: IAuditRepository
  ) {}

  async execute(input: AtualizarEstudoCasoInput): Promise<EstudoCasoPortfolio> {
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
        `Não é permitido alterar estudos de caso para demandas ${estadoNorm}.`
      );
    }

    const wasHomologated = existing.status === StatusEstudoCaso.HOMOLOGADO_APROV_10;

    // Detecta se houve edição material
    const isMaterialEdit =
      (input.titulo !== undefined && input.titulo !== existing.titulo) ||
      (input.problema_negocio !== undefined && input.problema_negocio !== existing.problema_negocio) ||
      (input.processo_preparacao !== undefined && input.processo_preparacao !== existing.processo_preparacao) ||
      (input.modelagem_decisoes !== undefined && input.modelagem_decisoes !== existing.modelagem_decisoes) ||
      (input.validacao_resultados !== undefined && input.validacao_resultados !== existing.validacao_resultados) ||
      (input.competencias_demonstradas !== undefined &&
        JSON.stringify(input.competencias_demonstradas) !== JSON.stringify(existing.competencias_demonstradas)) ||
      (input.ferramentas_utilizadas !== undefined &&
        JSON.stringify(input.ferramentas_utilizadas) !== JSON.stringify(existing.ferramentas_utilizadas)) ||
      (input.metricas_fatos !== undefined &&
        JSON.stringify(input.metricas_fatos) !== JSON.stringify(existing.metricas_fatos)) ||
      (input.tecnicas_sanitizacao !== undefined &&
        JSON.stringify(input.tecnicas_sanitizacao) !== JSON.stringify(existing.tecnicas_sanitizacao)) ||
      (input.checklist_sanitizacao !== undefined);

    let newStatus = existing.status;
    let newHomologadoEm = existing.homologado_em;
    let newHomologadoPor = existing.homologado_por;
    let newVersao = existing.versao;

    // Salvaguarda 1: Se o case estava homologado e houve edição material, invalida server-side
    if (wasHomologated && isMaterialEdit) {
      newStatus = StatusEstudoCaso.RASCUNHO;
      newHomologadoEm = null;
      newHomologadoPor = null;
      newVersao = existing.versao + 1;

      if (this.auditRepo) {
        await this.auditRepo.record({
          demanda_id: existing.demanda_id,
          entidade: 'ESTUDO_CASO_PORTFOLIO',
          entidade_id: existing.id,
          tipo_evento: 'DECISAO_HUMANA',
          autor_tipo: 'HUMANO',
          dados_anteriores: JSON.stringify({ status: existing.status, versao: existing.versao }),
          dados_novos: JSON.stringify({ status: StatusEstudoCaso.RASCUNHO, versao: newVersao }),
          justificativa: `Homologação anterior (APROV-10) invalidada por alteração de conteúdo material na versão ${existing.versao}. Status revertido para RASCUNHO (v${newVersao}).`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    const updatedChecklist: ChecklistSanitizacao = {
      ...existing.checklist_sanitizacao,
      ...(input.checklist_sanitizacao || {}),
    };

    const updatedEntity: EstudoCasoPortfolio = {
      ...existing,
      titulo: input.titulo !== undefined ? input.titulo : existing.titulo,
      problema_negocio: input.problema_negocio !== undefined ? input.problema_negocio : existing.problema_negocio,
      processo_preparacao: input.processo_preparacao !== undefined ? input.processo_preparacao : existing.processo_preparacao,
      modelagem_decisoes: input.modelagem_decisoes !== undefined ? input.modelagem_decisoes : existing.modelagem_decisoes,
      validacao_resultados: input.validacao_resultados !== undefined ? input.validacao_resultados : existing.validacao_resultados,
      competencias_demonstradas: input.competencias_demonstradas !== undefined ? input.competencias_demonstradas : existing.competencias_demonstradas,
      ferramentas_utilizadas: input.ferramentas_utilizadas !== undefined ? input.ferramentas_utilizadas : existing.ferramentas_utilizadas,
      metricas_fatos: input.metricas_fatos !== undefined ? input.metricas_fatos : existing.metricas_fatos,
      tecnicas_sanitizacao: input.tecnicas_sanitizacao !== undefined ? input.tecnicas_sanitizacao : existing.tecnicas_sanitizacao,
      checklist_sanitizacao: updatedChecklist,
      status: newStatus,
      homologado_em: newHomologadoEm,
      homologado_por: newHomologadoPor,
      versao: newVersao,
      atualizado_em: new Date().toISOString(),
    };

    await this.caseRepo.save(updatedEntity);
    return updatedEntity;
  }
}
