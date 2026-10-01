/**
 * src/core/use-cases/evidence/deliberar-evidencia.use-case.ts
 *
 * Caso de uso: Deliberar Evidência Analítica (Confirmar, Rejeitar ou Solicitar Revisão).
 *
 * Preserva a proveniência e integridade dos fatos observados, registrando a
 * deliberação humana com timestamp sem mutações destrutivas no histórico.
 */

import { EvidenciaAnalitica } from '@/core/domain/entities/evidencia-analitica';
import { StatusValidacaoEvidencia } from '@/core/domain/enums/status-validacao-evidencia';
import { IEvidenciaAnaliticaRepository } from '@/core/domain/repositories/evidencia-analitica-repository.interface';

export interface DeliberarEvidenciaInput {
  id: string;
  status: 'CONFIRMADA' | 'REJEITADA' | 'AGUARDANDO_REVISAO';
  decisao_humana: string;
  revisor?: string;
}

export class DeliberarEvidenciaUseCase {
  constructor(private readonly evidenciaRepo: IEvidenciaAnaliticaRepository) {}

  async execute(input: DeliberarEvidenciaInput): Promise<EvidenciaAnalitica> {
    if (!input.id || typeof input.id !== 'string') {
      throw new Error('ID da evidência é obrigatório para deliberação.');
    }

    const evidencia = await this.evidenciaRepo.findById(input.id);
    if (!evidencia) {
      throw new Error(`Evidência com ID "${input.id}" não encontrada.`);
    }

    const decisaoTexto = input.decisao_humana?.trim();
    if (!decisaoTexto || decisaoTexto.length < 3) {
      throw new Error('Justificativa da decisão humana é obrigatória (mínimo 3 caracteres).');
    }

    const statusValido = Object.values(StatusValidacaoEvidencia).includes(
      input.status as StatusValidacaoEvidencia
    );
    if (!statusValido) {
      throw new Error(`Status de validação inválido: "${input.status}".`);
    }

    const now = new Date().toISOString();
    const revisorNome = input.revisor?.trim() || 'ANALISTA';

    // Rastreabilidade cumulativa da decisão humana
    const entradaDecisao = `[${now}] (${revisorNome} — ${input.status}): ${decisaoTexto}`;
    const decisaoHumanaConsolidada = evidencia.decisao_humana
      ? `${evidencia.decisao_humana}\n${entradaDecisao}`
      : entradaDecisao;

    const evidenciaAtualizada: EvidenciaAnalitica = {
      ...evidencia,
      status_validacao: input.status as StatusValidacaoEvidencia,
      decisao_humana: decisaoHumanaConsolidada,
      atualizado_em: now,
    };

    return this.evidenciaRepo.update(evidenciaAtualizada);
  }
}
