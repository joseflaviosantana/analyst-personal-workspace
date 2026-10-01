/**
 * src/core/use-cases/portfolio/curar-ativo-aprendizado.use-case.ts
 *
 * Promove e arquiva um Ativo de Aprendizado derivado da demanda para a Memória Operacional (Subgate 3.9 — Aba 11).
 *
 * Regras:
 * 1. Demandas SUSPENSA e CANCELADA bloqueiam a curadoria.
 * 2. Demanda CONCLUIDA é permitida para retroalimentação de aprendizados.
 * 3. Registra o ato no Event Log analítico (ATIVO_APRENDIZADO_CURADO) e na trilha de auditoria.
 */

import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { IAtivoAprendizadoRepository } from '@/core/domain/repositories/ativo-aprendizado-repository.interface';
import { IEventoAnaliticoLogRepository } from '@/core/domain/repositories/evento-analitico-log-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { AtivoAprendizado } from '@/core/domain/entities/ativo-aprendizado';
import { CategoriaAtivoAprendizado } from '@/core/domain/enums/categoria-ativo-aprendizado';
import { EstadoDemanda, normalizarEstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { EtapaOrigemEvidencia } from '@/core/domain/enums/etapa-origem-evidencia';
import { PoliticaCaptura } from '@/core/domain/evidence-events/event-types';

export interface CurarAtivoAprendizadoInput {
  demandaId?: string | null;
  titulo: string;
  categoria: CategoriaAtivoAprendizado;
  descricao?: string | null;
  procedimento_padrao: string;
  contexto_aplicacao?: string | null;
  tags?: string[];
  ator?: string;
}

export class CurarAtivoAprendizadoUseCase {
  constructor(
    private ativoRepo: IAtivoAprendizadoRepository,
    private demandRepo: IDemandRepository,
    private eventLogRepo: IEventoAnaliticoLogRepository,
    private auditRepo: IAuditRepository
  ) {}

  async execute(input: CurarAtivoAprendizadoInput): Promise<AtivoAprendizado> {
    if (!input.titulo?.trim()) {
      throw new Error('O título do ativo de aprendizado é obrigatório.');
    }
    if (!input.procedimento_padrao?.trim()) {
      throw new Error('O procedimento padrão (código DAX, fórmula M ou padrão) é obrigatório.');
    }

    let projetoId: string | null = null;

    if (input.demandaId) {
      const demanda = await this.demandRepo.findById(input.demandaId);
      if (!demanda) {
        throw new Error(`Demanda vinculada '${input.demandaId}' não encontrada.`);
      }

      const estadoNorm = normalizarEstadoDemanda(demanda.estado);
      if (estadoNorm === EstadoDemanda.SUSPENSA || estadoNorm === EstadoDemanda.CANCELADA) {
        throw new Error(
          `Não é permitido curar ativos de aprendizado para demandas ${estadoNorm}.`
        );
      }
      projetoId = demanda.projeto_id ?? null;
    }

    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    const novoAtivo: AtivoAprendizado = {
      id,
      demanda_id: input.demandaId ?? null,
      titulo: input.titulo.trim(),
      categoria: input.categoria,
      descricao: input.descricao?.trim() || null,
      procedimento_padrao: input.procedimento_padrao.trim(),
      contexto_aplicacao: input.contexto_aplicacao?.trim() || null,
      tags: input.tags || [],
      criado_em: now,
      atualizado_em: now,
    };

    await this.ativoRepo.save(novoAtivo);

    // Registra evento no Event Log analítico se vinculado a uma demanda
    if (input.demandaId) {
      await this.eventLogRepo.create({
        id: crypto.randomUUID(),
        id_evento: `EVT_APRENDIZADO_${novoAtivo.id}`,
        demanda_id: input.demandaId,
        projeto_id: projetoId,
        tipo_evento: 'ATIVO_APRENDIZADO_CURADO',
        etapa_origem: EtapaOrigemEvidencia.REVISAO,
        politica_aplicada: PoliticaCaptura.REGISTRAR_AUTOMATICAMENTE,
        status_processamento: 'REGISTRADO',
        payload_snapshot: {
          ativoId: novoAtivo.id,
          titulo: novoAtivo.titulo,
          categoria: novoAtivo.categoria,
        },
        processado_em: now,
      });

      // Registra na Trilha de Auditoria
      await this.auditRepo.record({
        demanda_id: input.demandaId,
        entidade: 'ATIVO_APRENDIZADO',
        entidade_id: novoAtivo.id,
        tipo_evento: 'DECISAO_HUMANA',
        autor_tipo: 'HUMANO',
        dados_anteriores: null,
        dados_novos: JSON.stringify({
          titulo: novoAtivo.titulo,
          categoria: novoAtivo.categoria,
        }),
        justificativa: `Ativo de aprendizado [${novoAtivo.categoria}] "${novoAtivo.titulo}" curado e promovido para a memória operacional.`,
        timestamp: now,
      });
    }

    return novoAtivo;
  }
}
