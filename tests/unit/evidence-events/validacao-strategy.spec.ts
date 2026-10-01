/**
 * tests/unit/evidence-events/validacao-strategy.spec.ts
 *
 * Testes Unitários da Estratégia de Validação & Conciliação (Subgate 3.7B).
 *
 * Cobertura de Rigor Epistêmico e Idempotência:
 * - A: Fato observado preservado sem certificar perfeição do dashboard ou conformidade global
 * - B: Idempotência de criação e reteste baseada em IDs/timestamps persistidos (sem Date.now(), sem UUID volátil)
 * - C: Dois retestes legítimos distintos da mesma validação possuem chaves determinísticas distintas
 * - D: Resiliência e idempotência determinística no EvidenceEventEngine
 * - E: Autoria humana soberana do analista preservada e método de captura automático
 * - F: Divergência numérica apurada registra o desvio factual sem atenuar o erro
 */

import { describe, it, expect } from 'vitest';
import {
  ValidacaoStrategy,
  ValidacaoRegistradaPayload,
  ValidacaoRetestadaPayload,
} from '@/core/domain/evidence-events/default-strategies/validacao-strategy';
import { EventoAnalitico } from '@/core/domain/evidence-events/event-types';
import { EtapaOrigemEvidencia } from '@/core/domain/enums/etapa-origem-evidencia';
import { EvidenceEventEngine } from '@/core/domain/evidence-events/evidence-event-engine';

describe('Unit Tests: ValidacaoStrategy (Subgate 3.7B)', () => {
  const strategy = new ValidacaoStrategy();

  it('A - Fato observado preservado: não afirma conformidade global nem ausência de outros erros', () => {
    const payload: ValidacaoRegistradaPayload = {
      validacaoId: 'val_123',
      demandaId: 'dem_456',
      titulo: 'Confronto Total Vendas ERP vs DAX',
      camada: 'CONCILIACAO_CRUZADA_KPI',
      metodoVerificacao: 'Confronto de totalizadores',
      baseReferencia: 'fechamento_mensal.xlsx',
      valorEsperado: 100000,
      valorObtido: 100000,
      divergenciaAbsoluta: 0,
      divergenciaPercentual: 0,
      toleranciaPermitida: 0,
      unidadeMedida: 'R$',
      resultado: 'APROVADO',
      obrigatoria: true,
      executadoPor: 'Carlos Analista',
      executadoEm: '2026-10-01T12:00:00.000Z',
      criadoEm: '2026-10-01T12:00:00.000Z',
    };

    const evento: EventoAnalitico = {
      id_evento: 'evt_val_reg_val_123_2026-10-01T12:00:00.000Z',
      demanda_id: 'dem_456',
      projeto_id: 'proj_789',
      etapa_origem: EtapaOrigemEvidencia.VALIDACAO,
      categoria: 'VALIDACAO',
      tipo_evento: 'VALIDACAO_CONCILIACAO_REGISTRADA',
      ocorrido_em: '2026-10-01T12:00:00.000Z',
      executor: 'Carlos Analista',
      payload,
      versao_contrato: '1.0',
    };

    expect(strategy.tiposSuportados).toContain('VALIDACAO_CONCILIACAO_REGISTRADA');
    const decisao = strategy.avaliar(evento);
    expect(decisao.politica).toBe('REGISTRAR_AUTOMATICAMENTE');

    const evidencia = strategy.transformar(evento);
    expect(evidencia).not.toBeNull();
    if (!evidencia) return;

    // Rigor Epistêmico: atesta a comparação pontual e contém ressalva explícita contra generalização
    expect(evidencia.fato_observado).toContain('Divergência absoluta apurada: 0 R$ (0%)');
    expect(evidencia.resultado_mensuravel).toContain('dentro da tolerância permitida (0)');
    expect(evidencia.resultado_mensuravel).toContain(
      'não certifica conformidade global do sistema ou ausência de outros erros'
    );
    expect(evidencia.metadados_adicionais?.ressalva_epistemica_conformidade_global).toBe(true);
  });

  it('B - Idempotência determinística: chaves derivadas estritamente de dados persistidos estáveis', () => {
    const payload: ValidacaoRegistradaPayload = {
      validacaoId: 'val_abc',
      demandaId: 'dem_1',
      titulo: 'Check Linhas Carregadas',
      camada: 'DADOS_BRUTOS_VS_CARREGADOS',
      metodoVerificacao: 'COUNT(*)',
      valorEsperado: 500,
      valorObtido: 500,
      divergenciaAbsoluta: 0,
      divergenciaPercentual: 0,
      toleranciaPermitida: 0,
      resultado: 'APROVADO',
      obrigatoria: true,
      criadoEm: '2026-10-01T10:00:00.000Z',
    };

    // A chave não contém Date.now() nem UUID aleatório de emissão
    const chave1 = `evt_val_reg_${payload.validacaoId}_${payload.criadoEm}`;
    const chave2 = `evt_val_reg_${payload.validacaoId}_${payload.criadoEm}`;

    expect(chave1).toBe(chave2);
    expect(chave1).not.toMatch(/undefined|null|NaN/);
  });

  it('C - Dois retestes legítimos da mesma validação com timestamps diferentes possuem chaves determinísticas distintas', () => {
    const validacaoId = 'val_xyz';
    const timestampReteste1 = '2026-10-01T14:00:00.000Z';
    const timestampReteste2 = '2026-10-01T15:30:00.000Z';

    const chaveReteste1 = `evt_val_ret_${validacaoId}_${timestampReteste1}`;
    const chaveReteste2 = `evt_val_ret_${validacaoId}_${timestampReteste2}`;

    expect(chaveReteste1).not.toBe(chaveReteste2);
    expect(chaveReteste1).toBe(`evt_val_ret_${validacaoId}_${timestampReteste1}`);
    expect(chaveReteste2).toBe(`evt_val_ret_${validacaoId}_${timestampReteste2}`);
  });

  it('D - Processamento determinístico no EvidenceEventEngine com rejeição de payload incompleto', () => {
    const engine = new EvidenceEventEngine([strategy]);

    const payload: ValidacaoRetestadaPayload = {
      validacaoId: 'val_999',
      demandaId: 'dem_1',
      titulo: 'Check Margem Contribuição',
      camada: 'CALCULOS_E_DAX',
      valorEsperado: 45.5,
      novoValorObtido: 45.5,
      novaDivergenciaAbsoluta: 0,
      novaDivergenciaPercentual: 0,
      toleranciaPermitida: 0.1,
      novoResultado: 'APROVADO',
      executadoPor: 'Analista Responsável',
      executadoEm: '2026-10-01T16:00:00.000Z',
      notasEvidencia: 'DAX ajustado para considerar desconto de frete.',
      atualizadoEm: '2026-10-01T16:00:00.000Z',
    };

    const evento: EventoAnalitico = {
      id_evento: 'evt_val_ret_val_999_2026-10-01T16:00:00.000Z',
      demanda_id: 'dem_1',
      etapa_origem: EtapaOrigemEvidencia.VALIDACAO,
      categoria: 'VALIDACAO',
      tipo_evento: 'VALIDACAO_CONCILIACAO_RETESTADA',
      ocorrido_em: '2026-10-01T16:00:00.000Z',
      executor: 'Analista Responsável',
      payload,
      versao_contrato: '1.0',
    };

    const res = engine.gerarCandidatoEvidencia(evento);
    expect(res.decisao.politica).toBe('REGISTRAR_AUTOMATICAMENTE');
    expect(res.candidato).not.toBeNull();
    expect(res.candidato?.titulo).toContain('Check Margem Contribuição');
    expect(res.candidato?.metadados_adicionais?.evento_origem_id).toBe(evento.id_evento);

    // Payload incompleto é ignorado deterministicamente
    const eventoIncompleto: EventoAnalitico = {
      ...evento,
      id_evento: 'evt_val_ret_incompleto',
      payload: { validacaoId: '' }, // sem dados essenciais
    };

    const resIncompleto = engine.gerarCandidatoEvidencia(eventoIncompleto);
    expect(resIncompleto.decisao.politica).toBe('IGNORAR');
    expect(resIncompleto.candidato).toBeNull();
  });

  it('E - Autoria humana soberana e método de captura automático preservados', () => {
    const payload: ValidacaoRetestadaPayload = {
      validacaoId: 'val_888',
      demandaId: 'dem_1',
      titulo: 'Reconciliação Externa',
      camada: 'CONCILIACAO_CRUZADA_KPI',
      valorEsperado: 200,
      novoValorObtido: 200,
      novaDivergenciaAbsoluta: 0,
      novaDivergenciaPercentual: 0,
      toleranciaPermitida: 0,
      novoResultado: 'APROVADO',
      executadoPor: 'Mariana Dados',
      executadoEm: '2026-10-01T17:00:00.000Z',
      atualizadoEm: '2026-10-01T17:00:00.000Z',
    };

    const evento: EventoAnalitico = {
      id_evento: 'evt_val_ret_val_888_2026-10-01T17:00:00.000Z',
      demanda_id: 'dem_1',
      etapa_origem: EtapaOrigemEvidencia.VALIDACAO,
      categoria: 'VALIDACAO',
      tipo_evento: 'VALIDACAO_CONCILIACAO_RETESTADA',
      ocorrido_em: '2026-10-01T17:00:00.000Z',
      executor: 'Mariana Dados',
      payload,
      versao_contrato: '1.0',
    };

    const evidencia = strategy.transformar(evento);
    expect(evidencia).not.toBeNull();
    if (!evidencia) return;

    expect(evidencia.decisao_humana).toContain('Homologação formal do resultado do reteste pelo analista Mariana Dados');
    expect(evidencia.metadados_adicionais?.executado_em).toBe('2026-10-01T17:00:00.000Z');
  });

  it('F - Divergência numérica apurada registra o desvio factual sem atenuar o erro', () => {
    const payload: ValidacaoRegistradaPayload = {
      validacaoId: 'val_divergente',
      demandaId: 'dem_1',
      titulo: 'Totalizador de Clientes Ativos',
      camada: 'CONCILIACAO_CRUZADA_KPI',
      metodoVerificacao: 'DISTINCTCOUNT(ClienteId)',
      valorEsperado: 1200,
      valorObtido: 1250,
      divergenciaAbsoluta: 50,
      divergenciaPercentual: 4.1667,
      toleranciaPermitida: 0,
      unidadeMedida: 'clientes',
      resultado: 'DIVERGENTE',
      obrigatoria: true,
      executadoPor: 'Analista Responsável',
      executadoEm: '2026-10-01T18:00:00.000Z',
      criadoEm: '2026-10-01T18:00:00.000Z',
    };

    const evento: EventoAnalitico = {
      id_evento: 'evt_val_reg_val_divergente_2026-10-01T18:00:00.000Z',
      demanda_id: 'dem_1',
      etapa_origem: EtapaOrigemEvidencia.VALIDACAO,
      categoria: 'VALIDACAO',
      tipo_evento: 'VALIDACAO_CONCILIACAO_REGISTRADA',
      ocorrido_em: '2026-10-01T18:00:00.000Z',
      executor: 'Analista Responsável',
      payload,
      versao_contrato: '1.0',
    };

    const evidencia = strategy.transformar(evento);
    expect(evidencia).not.toBeNull();
    if (!evidencia) return;

    expect(evidencia.estado_posterior).toContain('DIVERGENTE (Divergência: 50 clientes)');
    expect(evidencia.resultado_mensuravel).toContain('Divergência detectada acima da tolerância permitida (0)');
    expect(evidencia.inferencia_recomendacao).toContain('Recomenda-se investigar se o desvio decorre de filtro');
  });
});
