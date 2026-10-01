import { describe, it, expect } from 'vitest';
import { RequisitosStrategy } from '@/core/domain/evidence-events/default-strategies/requisitos-strategy';
import { EventoAnalitico } from '@/core/domain/evidence-events/event-types';
import { TipoEvidenciaAnalitica } from '@/core/domain/enums/tipo-evidencia-analitica';
import { EtapaOrigemEvidencia } from '@/core/domain/enums/etapa-origem-evidencia';
import { ClassificacaoExposicaoEvidencia } from '@/core/domain/enums/classificacao-exposicao-evidencia';

describe('Unit Tests: RequisitosStrategy (Evidence Event Engine — Bloco 3.8)', () => {
  const strategy = new RequisitosStrategy();

  describe('Avaliação e Captura de Homologação de Requisitos', () => {
    it('deve aprovar captura automática de REQUISITOS_LEVANTAMENTO_HOMOLOGADO válido', () => {
      const evento: EventoAnalitico = {
        id_evento: 'evento_dem_1_req_homolog_2026-10-01T15:00:00Z',
        tipo_evento: 'REQUISITOS_LEVANTAMENTO_HOMOLOGADO',
        demanda_id: 'dem_1',
        etapa_origem: EtapaOrigemEvidencia.REQUISITOS,
        categoria: 'SISTEMA',
        ocorrido_em: '2026-10-01T15:00:00Z',
        executor: 'ANALISTA',
        versao_contrato: '1.0',
        payload: {
          demandaId: 'dem_1',
          homologadoEm: '2026-10-01T15:00:00Z',
          homologadoPor: 'Analista Sênior',
          justificativa: 'Levantamento finalizado e formalizado.',
          ressalvas: null,
          totalRequisitos: 5,
          totalObrigatorios: 3,
          totalPerguntasRespondidas: 2,
        },
      };

      const decisao = strategy.avaliar(evento);
      expect(decisao.politica).toBe('REGISTRAR_AUTOMATICAMENTE');

      const candidato = strategy.transformar(evento);
      expect(candidato).not.toBeNull();
      expect(candidato?.tipo).toBe(TipoEvidenciaAnalitica.REQUISITOS);
      expect(candidato?.etapa_origem).toBe(EtapaOrigemEvidencia.REQUISITOS);
      expect(candidato?.classificacao_exposicao).toBe(ClassificacaoExposicaoEvidencia.INTERNA);
      expect(candidato?.decisao_humana).toContain('Levantamento finalizado e formalizado.');
      expect(candidato?.artefato_origem_tipo).toBe('DEMANDA_REQUISITOS');
      expect(candidato?.artefato_origem_id).toBe('dem_1');
    });

    it('deve ignorar evento de homologação com payload incompleto', () => {
      const eventoIncompleto: EventoAnalitico = {
        id_evento: 'evento_invalido',
        tipo_evento: 'REQUISITOS_LEVANTAMENTO_HOMOLOGADO',
        demanda_id: 'dem_1',
        etapa_origem: EtapaOrigemEvidencia.REQUISITOS,
        categoria: 'SISTEMA',
        ocorrido_em: '2026-10-01T15:00:00Z',
        executor: 'ANALISTA',
        versao_contrato: '1.0',
        payload: {
          demandaId: 'dem_1',
          // sem justificativa e sem homologadoEm
        },
      };

      const decisao = strategy.avaliar(eventoIncompleto);
      expect(decisao.politica).toBe('IGNORAR');
      expect(decisao.motivo).toContain('incompleto');
    });
  });

  describe('Avaliação e Captura de Resposta do Contratante', () => {
    it('deve transformar REQUISITOS_RESPOSTA_CONTRATANTE_REGISTRADA com classificação CONFIDENCIAL', () => {
      const evento: EventoAnalitico = {
        id_evento: 'evento_perg_123_resp_2026-10-01T14:30:00Z',
        tipo_evento: 'REQUISITOS_RESPOSTA_CONTRATANTE_REGISTRADA',
        demanda_id: 'dem_1',
        etapa_origem: EtapaOrigemEvidencia.REQUISITOS,
        categoria: 'SISTEMA',
        ocorrido_em: '2026-10-01T14:30:00Z',
        executor: 'ANALISTA',
        versao_contrato: '1.0',
        payload: {
          demandaId: 'dem_1',
          perguntaId: 'perg_123',
          pergunta: 'Devoluções devem ser deduzidas?',
          resposta: 'Sim, abater integralmente na data da emissão da nota de devolução.',
          respondidoPor: 'Gerente Financeiro',
          respondidaEm: '2026-10-01T14:30:00Z',
          impactoDecisao: 'Ajuste de fórmula DAX na tabela fato de vendas',
          bloqueante: true,
        },
      };

      const decisao = strategy.avaliar(evento);
      expect(decisao.politica).toBe('REGISTRAR_AUTOMATICAMENTE');

      const candidato = strategy.transformar(evento);
      expect(candidato).not.toBeNull();
      expect(candidato?.tipo).toBe(TipoEvidenciaAnalitica.REQUISITOS);
      expect(candidato?.classificacao_exposicao).toBe(ClassificacaoExposicaoEvidencia.CONFIDENCIAL);
      expect(candidato?.elegibilidade_portfolio).toBe(false);
      expect(candidato?.artefato_origem_tipo).toBe('PERGUNTA_CLARIFICACAO');
      expect(candidato?.artefato_origem_id).toBe('perg_123');
      expect(candidato?.fato_observado).toContain('Sim, abater integralmente');
    });

    it('deve ignorar tipos de evento não suportados', () => {
      const eventoEstranho: EventoAnalitico = {
        id_evento: 'evento_outro',
        tipo_evento: 'EVENTO_DESCONHECIDO' as any,
        demanda_id: 'dem_1',
        etapa_origem: EtapaOrigemEvidencia.REQUISITOS,
        categoria: 'SISTEMA',
        ocorrido_em: '2026-10-01T15:00:00Z',
        executor: 'ANALISTA',
        versao_contrato: '1.0',
        payload: {},
      };

      const decisao = strategy.avaliar(eventoEstranho);
      expect(decisao.politica).toBe('IGNORAR');
      expect(strategy.transformar(eventoEstranho)).toBeNull();
    });
  });
});
