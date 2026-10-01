import { describe, it, expect } from 'vitest';
import { QualidadeDiagnosticoStrategy } from '@/core/domain/evidence-events/default-strategies/qualidade-diagnostico-strategy';
import { QualidadeProblemaStrategy } from '@/core/domain/evidence-events/default-strategies/qualidade-problema-strategy';
import { EventoAnalitico } from '@/core/domain/evidence-events/event-types';
import { EtapaOrigemEvidencia } from '@/core/domain/enums/etapa-origem-evidencia';
import { TipoEvidenciaAnalitica } from '@/core/domain/enums/tipo-evidencia-analitica';

describe('Qualidade Strategies: Diagnóstico e Problemas de Qualidade (Subgate 3.5B.2)', () => {
  const diagStrategy = new QualidadeDiagnosticoStrategy();
  const probStrategy = new QualidadeProblemaStrategy();

  describe('QualidadeDiagnosticoStrategy', () => {
    it('1. evento de diagnóstico concluído gera candidato com métricas completas', () => {
      const evento: EventoAnalitico = {
        id_evento: 'evt_diag_001',
        demanda_id: 'dem_q_1',
        etapa_origem: EtapaOrigemEvidencia.QUALIDADE,
        categoria: 'QUALIDADE',
        tipo_evento: 'QUALIDADE_DIAGNOSTICO_CONCLUIDO',
        ocorrido_em: '2026-10-01T11:00:00Z',
        executor: 'SISTEMA_DETERMINISTICO',
        artefato_origem_tipo: 'DIAGNOSTICO_QUALIDADE',
        artefato_origem_id: 'diag_123',
        payload: {
          diagnosticoId: 'diag_123',
          ativoDadosId: 'ast_456',
          tabelaNome: 'clientes.csv',
          totalLinhasAvaliadas: 8000,
          totalColunasAvaliadas: 10,
          totalProblemasDetectados: 2,
          totalVerificacoes: 6,
          duracaoMs: 45,
        },
        versao_contrato: '1.0',
      };

      const decisao = diagStrategy.avaliar(evento);
      expect(decisao.politica).toBe('REGISTRAR_AUTOMATICAMENTE');

      const candidato = diagStrategy.transformar(evento);
      expect(candidato).not.toBeNull();
      expect(candidato?.tipo).toBe(TipoEvidenciaAnalitica.QUALIDADE);
      expect(candidato?.etapa_origem).toBe(EtapaOrigemEvidencia.QUALIDADE);
      expect(candidato?.titulo).toContain('clientes.csv');
      expect(candidato?.resultado_mensuravel).toContain('2 anomalias | 8000 linhas avaliadas');
      expect(candidato?.elegibilidade_portfolio).toBe(false); // possui anomalias
    });

    it('2. diagnóstico 100% conforme é elegível para portfólio', () => {
      const eventoSemProblemas: EventoAnalitico = {
        id_evento: 'evt_diag_clean',
        demanda_id: 'dem_q_1',
        etapa_origem: EtapaOrigemEvidencia.QUALIDADE,
        categoria: 'QUALIDADE',
        tipo_evento: 'QUALIDADE_DIAGNOSTICO_CONCLUIDO',
        ocorrido_em: '2026-10-01T11:00:00Z',
        executor: 'SISTEMA_DETERMINISTICO',
        payload: {
          diagnosticoId: 'diag_clean',
          ativoDadosId: 'ast_clean',
          tabelaNome: 'dim_tempo.csv',
          totalLinhasAvaliadas: 365,
          totalColunasAvaliadas: 5,
          totalProblemasDetectados: 0,
          duracaoMs: 12,
        },
        versao_contrato: '1.0',
      };

      const candidato = diagStrategy.transformar(eventoSemProblemas);
      expect(candidato?.elegibilidade_portfolio).toBe(true);
      expect(candidato?.inferencia_recomendacao).toContain('100% de conformidade');
    });
  });

  describe('QualidadeProblemaStrategy', () => {
    it('3. QUALIDADE_PROBLEMA_DELIBERADO registra decisão humana e severidade', () => {
      const eventoDeliberacao: EventoAnalitico = {
        id_evento: 'evt_delib_prob_1',
        demanda_id: 'dem_q_1',
        etapa_origem: EtapaOrigemEvidencia.QUALIDADE,
        categoria: 'QUALIDADE',
        tipo_evento: 'QUALIDADE_PROBLEMA_DELIBERADO',
        ocorrido_em: '2026-10-01T11:15:00Z',
        executor: 'ANALISTA',
        artefato_origem_tipo: 'PROBLEMA_QUALIDADE',
        artefato_origem_id: 'prob_1',
        payload: {
          problemaId: 'prob_1',
          titulo: 'Valores nulos em CPF de cliente',
          tabelaAfetada: 'clientes.csv',
          colunaAfetada: 'cpf',
          totalLinhasAfetadas: 45,
          percentualLinhasAfetadas: 0.56,
          severidade: 'ALTA',
          acaoDeliberada: 'TRATAR_NA_PREPARACAO',
          justificativa: 'Registros com CPF nulo serão filtrados e imputados na etapa de preparação dimensional.',
          impactoCalculo: 'Poderia causar distorção na contagem de clientes únicos.',
          deliberadoEm: '2026-10-01T11:15:00Z',
        },
        versao_contrato: '1.0',
      };

      const decisao = probStrategy.avaliar(eventoDeliberacao);
      expect(decisao.politica).toBe('REGISTRAR_AUTOMATICAMENTE');

      const candidato = probStrategy.transformar(eventoDeliberacao);
      expect(candidato).not.toBeNull();
      expect(candidato?.titulo).toContain('Deliberação de Qualidade');
      expect(candidato?.decisao_humana).toContain('Registros com CPF nulo serão filtrados');
      expect(candidato?.resultado_mensuravel).toContain('Severidade: ALTA');
      expect(candidato?.resultado_mensuravel).toContain('Ação: TRATAR_NA_PREPARACAO');
    });

    it('4. QUALIDADE_PROBLEMA_RESOLVIDO registra fato de saneamento da anomalia', () => {
      const eventoResolvido: EventoAnalitico = {
        id_evento: 'evt_res_prob_1',
        demanda_id: 'dem_q_1',
        etapa_origem: EtapaOrigemEvidencia.QUALIDADE,
        categoria: 'QUALIDADE',
        tipo_evento: 'QUALIDADE_PROBLEMA_RESOLVIDO',
        ocorrido_em: '2026-10-01T11:30:00Z',
        executor: 'ANALISTA',
        payload: {
          problemaId: 'prob_1',
          titulo: 'Valores nulos em CPF de cliente',
          tabelaAfetada: 'clientes.csv',
          statusAnterior: 'ABERTO',
          novoStatus: 'RESOLVIDO',
          justificativa: 'Tratamento executado via script de sanitização com 100% das linhas corrigidas.',
          atualizadoEm: '2026-10-01T11:30:00Z',
        },
        versao_contrato: '1.0',
      };

      const decisao = probStrategy.avaliar(eventoResolvido);
      expect(decisao.politica).toBe('REGISTRAR_AUTOMATICAMENTE');

      const candidato = probStrategy.transformar(eventoResolvido);
      expect(candidato?.titulo).toContain('Problema de Qualidade Resolvido');
      expect(candidato?.estado_posterior).toBe('Status atual: RESOLVIDO.');
      expect(candidato?.decisao_humana).toContain('Tratamento executado via script');
    });

    it('5. QUALIDADE_ANOMALIA_MANUAL_REGISTRADA solicita revisão humana (SOLICITAR_REVISAO_HUMANA)', () => {
      const eventoManual: EventoAnalitico = {
        id_evento: 'evt_man_prob_99',
        demanda_id: 'dem_q_1',
        etapa_origem: EtapaOrigemEvidencia.QUALIDADE,
        categoria: 'QUALIDADE',
        tipo_evento: 'QUALIDADE_ANOMALIA_MANUAL_REGISTRADA',
        ocorrido_em: '2026-10-01T11:45:00Z',
        executor: 'ANALISTA',
        payload: {
          problemaId: 'prob_99',
          titulo: 'Datas futuras identificadas em notas de 2025',
          descricao: 'Transações com ano de 2099 encontradas em notas de devolução.',
          tabelaAfetada: 'notas_fiscais.csv',
          colunaAfetada: 'data_emissao',
          totalLinhasAfetadas: 12,
          percentualLinhasAfetadas: 0.1,
        },
        versao_contrato: '1.0',
      };

      const decisao = probStrategy.avaliar(eventoManual);
      expect(decisao.politica).toBe('SOLICITAR_REVISAO_HUMANA');
      expect(decisao.requer_intervencao_humana).toBe(true);

      const candidato = probStrategy.transformar(eventoManual);
      expect(candidato?.titulo).toContain('Anomalia Manual Registrada');
      expect(candidato?.estado_posterior).toContain('Severidade PENDENTE');
      expect(candidato?.elegibilidade_portfolio).toBe(false);
    });

    it('6. evento incompleto retorna IGNORAR sem inventar dados', () => {
      const eventoInvalido: EventoAnalitico = {
        id_evento: 'evt_invalido',
        demanda_id: 'dem_q_1',
        etapa_origem: EtapaOrigemEvidencia.QUALIDADE,
        categoria: 'QUALIDADE',
        tipo_evento: 'QUALIDADE_PROBLEMA_DELIBERADO',
        ocorrido_em: '2026-10-01T11:00:00Z',
        executor: 'ANALISTA',
        payload: {
          problemaId: 'prob_x',
          // sem severidade, acaoDeliberada, justificativa
        },
        versao_contrato: '1.0',
      };

      expect(probStrategy.avaliar(eventoInvalido).politica).toBe('IGNORAR');
      expect(probStrategy.transformar(eventoInvalido)).toBeNull();
    });
  });
});
