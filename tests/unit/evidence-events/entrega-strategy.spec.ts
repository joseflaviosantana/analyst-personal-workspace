import { describe, it, expect } from 'vitest';
import { EntregaStrategy } from '@/core/domain/evidence-events/default-strategies/entrega-strategy';
import { EventoAnalitico } from '@/core/domain/evidence-events/event-types';
import { TipoEvidenciaAnalitica } from '@/core/domain/enums/tipo-evidencia-analitica';
import { EtapaOrigemEvidencia } from '@/core/domain/enums/etapa-origem-evidencia';
import { ClassificacaoExposicaoEvidencia } from '@/core/domain/enums/classificacao-exposicao-evidencia';

describe('EntregaStrategy (Evidence Event Engine — Subgate 3.7C)', () => {
  const strategy = new EntregaStrategy();

  it('deve apoiar exatamente os 6 tipos de eventos profissionais de entrega', () => {
    expect(strategy.tiposSuportados).toContain('ENTREGA_ARTEFATO_REGISTRADO');
    expect(strategy.tiposSuportados).toContain('ENTREGA_PACOTE_DISPONIBILIZADO');
    expect(strategy.tiposSuportados).toContain('ENTREGA_ACEITE_FORMALIZADO');
    expect(strategy.tiposSuportados).toContain('ENTREGA_AJUSTE_SOLICITADO');
    expect(strategy.tiposSuportados).toContain('ENTREGA_REJEITADA');
    expect(strategy.tiposSuportados).toContain('ENTREGA_ENCERRAMENTO_FORMALIZADO');

    expect(strategy.tiposSuportados).not.toContain('VALIDACAO_CONCILIACAO_EXECUTADA');
    expect(strategy.tiposSuportados).toHaveLength(6);
  });

  // 1. ENTREGA_ARTEFATO_REGISTRADO
  it('1. deve processar ENTREGA_ARTEFATO_REGISTRADO com ressalva epistêmica (cadastro ≠ aprovação)', () => {
    const evento: EventoAnalitico = {
      id_evento: 'evt_ent_reg_ent_001',
      demanda_id: 'dem_01',
      projeto_id: 'proj_01',
      etapa_origem: EtapaOrigemEvidencia.ENTREGA,
      categoria: 'ENTREGA',
      tipo_evento: 'ENTREGA_ARTEFATO_REGISTRADO',
      ocorrido_em: '2026-03-01T10:00:00.000Z',
      executor: 'ANALISTA',
      artefato_origem_tipo: 'ENTREGAVEL_DEMANDA',
      artefato_origem_id: 'ent_001',
      payload: {
        entregavelId: 'ent_001',
        demandaId: 'dem_01',
        titulo: 'Dashboard Operacional',
        tipo: 'DASHBOARD_POWERBI',
        versao: '1.0',
        obrigatorio: true,
        status: 'DISPONIVEL',
        criadoEm: '2026-03-01T10:00:00.000Z',
      },
      versao_contrato: '1.0',
    };

    const decisao = strategy.avaliar(evento);
    expect(decisao.politica).toBe('REGISTRAR_AUTOMATICAMENTE');

    const candidato = strategy.transformar(evento);
    expect(candidato).not.toBeNull();
    expect(candidato?.tipo).toBe(TipoEvidenciaAnalitica.ENTREGA);
    expect(candidato?.resultado_mensuravel).toContain('Artefato catalogado no pacote de entrega');
    expect(candidato?.resultado_mensuravel).toContain('[Ressalva Epistêmica: O cadastro atesta exclusivamente a vinculação do artefato na esteira; não infere aprovação técnica nem aceite do cliente]');
    expect(candidato?.classificacao_exposicao).toBe(ClassificacaoExposicaoEvidencia.INTERNA);
  });

  // 2. ENTREGA_PACOTE_DISPONIBILIZADO
  it('2. deve processar ENTREGA_PACOTE_DISPONIBILIZADO com ressalva epistêmica (disponibilização ≠ aceite)', () => {
    const evento: EventoAnalitico = {
      id_evento: 'evt_ent_disp_dem_01_ent_001_v1.0',
      demanda_id: 'dem_01',
      projeto_id: 'proj_01',
      etapa_origem: EtapaOrigemEvidencia.ENTREGA,
      categoria: 'ENTREGA',
      tipo_evento: 'ENTREGA_PACOTE_DISPONIBILIZADO',
      ocorrido_em: '2026-03-02T11:00:00.000Z',
      executor: 'ANALISTA',
      artefato_origem_tipo: 'ENTREGAVEL_DEMANDA',
      artefato_origem_id: 'ent_001',
      payload: {
        demandaId: 'dem_01',
        entregavelId: 'ent_001',
        titulo: 'Dashboard Operacional',
        versao: '1.0',
        disponibilizadoEm: '2026-03-02T11:00:00.000Z',
      },
      versao_contrato: '1.0',
    };

    const decisao = strategy.avaliar(evento);
    expect(decisao.politica).toBe('REGISTRAR_AUTOMATICAMENTE');

    const candidato = strategy.transformar(evento);
    expect(candidato).not.toBeNull();
    expect(candidato?.tipo).toBe(TipoEvidenciaAnalitica.ENTREGA);
    expect(candidato?.resultado_mensuravel).toContain('[Ressalva Epistêmica: Disponibilização reflete prontidão técnica interna; não equivale a aceite do cliente]');
  });

  // 3. ENTREGA_ACEITE_FORMALIZADO
  it('3. deve processar ENTREGA_ACEITE_FORMALIZADO com deliberação humana e elegibilidade de portfólio', () => {
    const evento: EventoAnalitico = {
      id_evento: 'evt_ent_aceito_ent_001_2026-03-05T14:00:00.000Z',
      demanda_id: 'dem_01',
      projeto_id: 'proj_01',
      etapa_origem: EtapaOrigemEvidencia.ENTREGA,
      categoria: 'ENTREGA',
      tipo_evento: 'ENTREGA_ACEITE_FORMALIZADO',
      ocorrido_em: '2026-03-05T14:00:00.000Z',
      executor: 'HUMANO',
      artefato_origem_tipo: 'ENTREGAVEL_DEMANDA',
      artefato_origem_id: 'ent_001',
      payload: {
        entregavelId: 'ent_001',
        demandaId: 'dem_01',
        titulo: 'Dashboard Operacional',
        versao: '1.0',
        aceitePor: 'Roberto Prado (Gerente de Operações)',
        aceiteEm: '2026-03-05T14:00:00.000Z',
        aceiteJustificativa: 'Valores conferidos e homologados com êxito.',
      },
      versao_contrato: '1.0',
    };

    const decisao = strategy.avaliar(evento);
    expect(decisao.politica).toBe('REGISTRAR_AUTOMATICAMENTE');

    const candidato = strategy.transformar(evento);
    expect(candidato).not.toBeNull();
    expect(candidato?.tipo).toBe(TipoEvidenciaAnalitica.ENTREGA);
    expect(candidato?.decisao_humana).toContain('Roberto Prado (Gerente de Operações)');
    expect(candidato?.decisao_humana).toContain('Valores conferidos e homologados com êxito.');
    expect(candidato?.elegibilidade_portfolio).toBe(true);
    expect(candidato?.resultado_mensuravel).toContain('[Ressalva Epistêmica: O aceite formaliza o recebimento e aprovação do artefato conforme escopo; não infere impacto econômico futuro não mensurado]');
  });

  // 4. ENTREGA_AJUSTE_SOLICITADO
  it('4. deve processar ENTREGA_AJUSTE_SOLICITADO com captura soberana de apontamentos', () => {
    const evento: EventoAnalitico = {
      id_evento: 'evt_ent_ajustes_ent_001_2026-03-04T16:00:00.000Z',
      demanda_id: 'dem_01',
      projeto_id: 'proj_01',
      etapa_origem: EtapaOrigemEvidencia.ENTREGA,
      categoria: 'ENTREGA',
      tipo_evento: 'ENTREGA_AJUSTE_SOLICITADO',
      ocorrido_em: '2026-03-04T16:00:00.000Z',
      executor: 'HUMANO',
      artefato_origem_tipo: 'ENTREGAVEL_DEMANDA',
      artefato_origem_id: 'ent_001',
      payload: {
        entregavelId: 'ent_001',
        demandaId: 'dem_01',
        titulo: 'Dashboard Operacional',
        versao: '1.0',
        solicitadoPor: 'Roberto Prado',
        solicitadoEm: '2026-03-04T16:00:00.000Z',
        ajustesDescricao: 'Ajustar cálculo da meta diária.',
      },
      versao_contrato: '1.0',
    };

    const decisao = strategy.avaliar(evento);
    expect(decisao.politica).toBe('REGISTRAR_AUTOMATICAMENTE');

    const candidato = strategy.transformar(evento);
    expect(candidato).not.toBeNull();
    expect(candidato?.tipo).toBe(TipoEvidenciaAnalitica.ENTREGA);
    expect(candidato?.resultado_mensuravel).toContain('Entregável em revisão com status AJUSTES_SOLICITADOS');
    expect(candidato?.decisao_humana).toContain('Ajustar cálculo da meta diária.');
    expect(candidato?.elegibilidade_portfolio).toBe(false);
  });

  // 5. ENTREGA_REJEITADA
  it('5. deve processar ENTREGA_REJEITADA registrando o desvio com honestidade técnica', () => {
    const evento: EventoAnalitico = {
      id_evento: 'evt_ent_rejeitado_ent_001_2026-03-04T17:00:00.000Z',
      demanda_id: 'dem_01',
      projeto_id: 'proj_01',
      etapa_origem: EtapaOrigemEvidencia.ENTREGA,
      categoria: 'ENTREGA',
      tipo_evento: 'ENTREGA_REJEITADA',
      ocorrido_em: '2026-03-04T17:00:00.000Z',
      executor: 'HUMANO',
      artefato_origem_tipo: 'ENTREGAVEL_DEMANDA',
      artefato_origem_id: 'ent_001',
      payload: {
        entregavelId: 'ent_001',
        demandaId: 'dem_01',
        titulo: 'Dashboard Operacional',
        versao: '1.0',
        rejeitadoPor: 'Roberto Prado',
        rejeitadoEm: '2026-03-04T17:00:00.000Z',
        motivoRejeicao: 'Escopo divergente do briefing.',
      },
      versao_contrato: '1.0',
    };

    const decisao = strategy.avaliar(evento);
    expect(decisao.politica).toBe('REGISTRAR_AUTOMATICAMENTE');

    const candidato = strategy.transformar(evento);
    expect(candidato).not.toBeNull();
    expect(candidato?.tipo).toBe(TipoEvidenciaAnalitica.ENTREGA);
    expect(candidato?.resultado_mensuravel).toContain('Status REJEITADO registrado');
    expect(candidato?.decisao_humana).toContain('Escopo divergente do briefing.');
    expect(candidato?.elegibilidade_portfolio).toBe(false);
  });

  // 6. ENTREGA_ENCERRAMENTO_FORMALIZADO
  it('6. deve processar ENTREGA_ENCERRAMENTO_FORMALIZADO com ressalva (encerramento ≠ certificação de competência)', () => {
    const evento: EventoAnalitico = {
      id_evento: 'evt_ent_concluida_dem_01_2026-03-10T18:00:00.000Z',
      demanda_id: 'dem_01',
      projeto_id: 'proj_01',
      etapa_origem: EtapaOrigemEvidencia.ENTREGA,
      categoria: 'ENTREGA',
      tipo_evento: 'ENTREGA_ENCERRAMENTO_FORMALIZADO',
      ocorrido_em: '2026-03-10T18:00:00.000Z',
      executor: 'ANALISTA',
      artefato_origem_tipo: 'DEMANDA',
      artefato_origem_id: 'dem_01',
      payload: {
        demandaId: 'dem_01',
        projetoId: 'proj_01',
        titulo: 'Modernização de Painel Comercial',
        dataConclusao: '2026-03-10T18:00:00.000Z',
        totalEntregaveis: 2,
        totalAceitos: 2,
        justificativa: 'Entregáveis homologados integralmente.',
      },
      versao_contrato: '1.0',
    };

    const decisao = strategy.avaliar(evento);
    expect(decisao.politica).toBe('REGISTRAR_AUTOMATICAMENTE');

    const candidato = strategy.transformar(evento);
    expect(candidato).not.toBeNull();
    expect(candidato?.tipo).toBe(TipoEvidenciaAnalitica.ENTREGA);
    expect(candidato?.resultado_mensuravel).toContain('Demanda em estado terminal imutável CONCLUIDA');
    expect(candidato?.resultado_mensuravel).toContain('[Ressalva Epistêmica: A conclusão documenta a finalização do ciclo de trabalho contratado; não infere certificação automática de competência ou ROI não mensurado]');
    expect(candidato?.elegibilidade_portfolio).toBe(true);
  });

  it('deve retornar null e IGNORAR para eventos desconhecidos ou payloads incompletos', () => {
    const eventoInvalido: EventoAnalitico = {
      id_evento: 'evt_x',
      demanda_id: 'dem_x',
      projeto_id: null,
      etapa_origem: EtapaOrigemEvidencia.ENTREGA,
      categoria: 'ENTREGA',
      tipo_evento: 'TIPO_INEXISTENTE',
      ocorrido_em: '2026-03-01T00:00:00.000Z',
      executor: 'ANALISTA',
      artefato_origem_tipo: 'X',
      artefato_origem_id: 'x',
      payload: {},
      versao_contrato: '1.0',
    };

    expect(strategy.avaliar(eventoInvalido).politica).toBe('IGNORAR');
    expect(strategy.transformar(eventoInvalido)).toBeNull();
  });
});
