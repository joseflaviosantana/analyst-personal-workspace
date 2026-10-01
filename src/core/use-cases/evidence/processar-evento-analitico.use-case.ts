/**
 * src/core/use-cases/evidence/processar-evento-analitico.use-case.ts
 *
 * Caso de Uso: Processar Evento Analítico via Evidence Event Engine (Subgate 3.5B.1).
 *
 * Orquestra:
 * 1. Garantia estrita de idempotência via Event Log;
 * 2. Avaliação de política de captura determinística;
 * 3. Transformação do evento em Candidato a Evidência com proveniência;
 * 4. Registro no Evidence Core existente quando aplicável;
 * 5. Auditoria de execução e tratamento seguro de falhas.
 */

import crypto from 'crypto';
import {
  EventoAnalitico,
  ResultadoProcessamentoEvento,
} from '@/core/domain/evidence-events/event-types';
import { EvidenceEventEngine } from '@/core/domain/evidence-events/evidence-event-engine';
import { IEventoAnaliticoLogRepository } from '@/core/domain/repositories/evento-analitico-log-repository.interface';
import { RegistrarEvidenciaUseCase } from './registrar-evidencia.use-case';
import { StatusValidacaoEvidencia } from '@/core/domain/enums/status-validacao-evidencia';
import { MetodoCapturaEvidencia } from '@/core/domain/enums/metodo-captura-evidencia';

export class ProcessarEventoAnaliticoUseCase {
  constructor(
    private readonly eventEngine: EvidenceEventEngine,
    private readonly eventLogRepo: IEventoAnaliticoLogRepository,
    private readonly registrarEvidenciaUseCase: RegistrarEvidenciaUseCase
  ) {}

  async execute(evento: EventoAnalitico): Promise<ResultadoProcessamentoEvento> {
    const processadoEm = new Date().toISOString();

    // 1. Verificação Estrita de Idempotência
    const logExistente = await this.eventLogRepo.findByIdEvento(evento.id_evento);
    if (logExistente) {
      return {
        id_evento: evento.id_evento,
        demanda_id: evento.demanda_id,
        tipo_evento: evento.tipo_evento,
        politica_aplicada: logExistente.politica_aplicada,
        status_processamento: 'DUPLICADO',
        ja_processado: true,
        evidencia_gerada_id: logExistente.evidencia_gerada_id,
        motivo: 'Evento já processado anteriormente. Idempotência garantida sem duplicações.',
        processado_em: logExistente.processado_em,
      };
    }

    try {
      // 2. Avaliação e Transformação pelo Motor
      const { candidato, decisao } = this.eventEngine.gerarCandidatoEvidencia(evento);

      // 3. Caso a política decida IGNORAR ou faltem dados essenciais
      if (decisao.politica === 'IGNORAR' || !candidato) {
        await this.eventLogRepo.create({
          id: crypto.randomUUID(),
          id_evento: evento.id_evento,
          demanda_id: evento.demanda_id,
          projeto_id: evento.projeto_id || null,
          tipo_evento: evento.tipo_evento,
          etapa_origem: evento.etapa_origem,
          politica_aplicada: decisao.politica,
          status_processamento: 'IGNORADO',
          evidencia_gerada_id: null,
          correlation_id: evento.correlation_id || null,
          causation_id: evento.causation_id || null,
          motivo: decisao.motivo,
          erro_detalhe: null,
          payload_snapshot: evento.payload ? { ...evento.payload } : null,
          processado_em: processadoEm,
        });

        return {
          id_evento: evento.id_evento,
          demanda_id: evento.demanda_id,
          tipo_evento: evento.tipo_evento,
          politica_aplicada: decisao.politica,
          status_processamento: 'IGNORADO',
          ja_processado: false,
          evidencia_gerada_id: null,
          motivo: decisao.motivo,
          processado_em: processadoEm,
        };
      }

      // 4. Integração Canônica com o Evidence Core Existente
      const statusValidacao =
        decisao.politica === 'REGISTRAR_AUTOMATICAMENTE'
          ? StatusValidacaoEvidencia.CAPTURADA
          : StatusValidacaoEvidencia.AGUARDANDO_REVISAO;

      const metodoCaptura =
        decisao.politica === 'REGISTRAR_AUTOMATICAMENTE'
          ? MetodoCapturaEvidencia.AUTOMATICA
          : MetodoCapturaEvidencia.ASSISTIDA;

      const evidenciaCriada = await this.registrarEvidenciaUseCase.execute({
        demanda_id: evento.demanda_id,
        projeto_id: evento.projeto_id || null,
        tipo: candidato.tipo,
        etapa_origem: candidato.etapa_origem,
        artefato_origem_tipo: candidato.artefato_origem_tipo,
        artefato_origem_id: candidato.artefato_origem_id,
        titulo: candidato.titulo,
        descricao: candidato.descricao,
        fato_observado: candidato.fato_observado,
        estado_anterior: candidato.estado_anterior,
        acao_registrada: candidato.acao_registrada,
        estado_posterior: candidato.estado_posterior,
        resultado_mensuravel: candidato.resultado_mensuravel,
        inferencia_recomendacao: candidato.inferencia_recomendacao,
        decisao_humana: candidato.decisao_humana,
        metodo_captura: metodoCaptura,
        status_validacao: statusValidacao,
        classificacao_exposicao: candidato.classificacao_exposicao,
        elegibilidade_portfolio: candidato.elegibilidade_portfolio,
        executor: evento.executor || 'SISTEMA_DETERMINISTICO',
        metadados: candidato.metadados_adicionais,
      });

      // 5. Auditoria no Event Log
      const statusFinal =
        decisao.politica === 'REGISTRAR_AUTOMATICAMENTE'
          ? 'REGISTRADO'
          : 'AGUARDANDO_REVISAO';

      await this.eventLogRepo.create({
        id: crypto.randomUUID(),
        id_evento: evento.id_evento,
        demanda_id: evento.demanda_id,
        projeto_id: evento.projeto_id || null,
        tipo_evento: evento.tipo_evento,
        etapa_origem: evento.etapa_origem,
        politica_aplicada: decisao.politica,
        status_processamento: statusFinal,
        evidencia_gerada_id: evidenciaCriada.id,
        correlation_id: evento.correlation_id || null,
        causation_id: evento.causation_id || null,
        motivo: decisao.motivo,
        erro_detalhe: null,
        payload_snapshot: evento.payload ? { ...evento.payload } : null,
        processado_em: processadoEm,
      });

      return {
        id_evento: evento.id_evento,
        demanda_id: evento.demanda_id,
        tipo_evento: evento.tipo_evento,
        politica_aplicada: decisao.politica,
        status_processamento: statusFinal,
        ja_processado: false,
        evidencia_gerada_id: evidenciaCriada.id,
        motivo: decisao.motivo,
        processado_em: processadoEm,
      };
    } catch (err: unknown) {
      // 6. Tratamento de Falhas sem Corromper o Repositório
      const mensagemErro = err instanceof Error ? err.message : 'Falha desconhecida no processamento do evento.';

      await this.eventLogRepo.create({
        id: crypto.randomUUID(),
        id_evento: evento.id_evento,
        demanda_id: evento.demanda_id,
        projeto_id: evento.projeto_id || null,
        tipo_evento: evento.tipo_evento,
        etapa_origem: evento.etapa_origem,
        politica_aplicada: 'IGNORAR',
        status_processamento: 'ERRO',
        evidencia_gerada_id: null,
        correlation_id: evento.correlation_id || null,
        causation_id: evento.causation_id || null,
        motivo: 'Erro durante execução do processador de evento analítico.',
        erro_detalhe: mensagemErro,
        payload_snapshot: evento.payload ? { ...evento.payload } : null,
        processado_em: processadoEm,
      });

      return {
        id_evento: evento.id_evento,
        demanda_id: evento.demanda_id,
        tipo_evento: evento.tipo_evento,
        politica_aplicada: 'IGNORAR',
        status_processamento: 'ERRO',
        ja_processado: false,
        evidencia_gerada_id: null,
        motivo: 'Falha durante o processamento do evento analítico.',
        processado_em: processadoEm,
        erro_detalhe: mensagemErro,
      };
    }
  }
}
