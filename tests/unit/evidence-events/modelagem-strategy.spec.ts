import { describe, it, expect } from 'vitest';
import { ModelagemStrategy } from '@/core/domain/evidence-events/default-strategies/modelagem-strategy';
import { EventoAnalitico } from '@/core/domain/evidence-events/event-types';
import { EtapaOrigemEvidencia } from '@/core/domain/enums/etapa-origem-evidencia';
import { TipoEvidenciaAnalitica } from '@/core/domain/enums/tipo-evidencia-analitica';
import { ClassificacaoExposicaoEvidencia } from '@/core/domain/enums/classificacao-exposicao-evidencia';

describe('ModelagemStrategy: Estratégia de Modelagem Analítica (Subgate 3.5B.3)', () => {
  const strategy = new ModelagemStrategy();

  // ==========================================
  // Teste A: Captura Automática != Autoria Automática (MODELAGEM_MODELO_HOMOLOGADO)
  // ==========================================
  it('A. homologação de modelo preserva autoria humana soberana na captura automática', () => {
    const evento: EventoAnalitico = {
      id_evento: 'evt_mod_homol_1',
      demanda_id: 'dem_test_mod_1',
      projeto_id: 'prj_test_1',
      etapa_origem: EtapaOrigemEvidencia.MODELAGEM,
      categoria: 'MODELAGEM',
      tipo_evento: 'MODELAGEM_MODELO_HOMOLOGADO',
      ocorrido_em: '2026-10-01T14:00:00Z',
      executor: 'ANALISTA',
      artefato_origem_tipo: 'MODELO_ANALITICO',
      artefato_origem_id: 'mod_vendas_star',
      payload: {
        modeloId: 'mod_vendas_star',
        nomeModelo: 'Modelo Dimensional de Vendas',
        tipoArquitetura: 'STAR_SCHEMA',
        datasetAutorizadoId: 'aut_dataset_final',
        homologadoPor: 'ANALISTA_SENIOR',
        justificativa: 'Modelo dimensional verificado contra todas as regras M-01 a M-12 sem violações impeditivas.',
        totalAlertasReconhecidos: 1,
        totalRecomendacoes: 0,
        homologadoEm: '2026-10-01T14:00:00Z',
      },
      versao_contrato: '1.0',
    };

    const decisao = strategy.avaliar(evento);
    expect(decisao.politica).toBe('REGISTRAR_AUTOMATICAMENTE');
    expect(decisao.requer_intervencao_humana).toBe(false);

    const candidato = strategy.transformar(evento);
    expect(candidato).not.toBeNull();
    expect(candidato.tipo).toBe(TipoEvidenciaAnalitica.MODELAGEM);
    expect(candidato.etapa_origem).toBe(EtapaOrigemEvidencia.MODELAGEM);
    expect(candidato.artefato_origem_tipo).toBe('MODELO_ANALITICO');
    expect(candidato.artefato_origem_id).toBe('mod_vendas_star');
    expect(candidato.titulo).toContain('Modelo Dimensional de Vendas');
    expect(candidato.decisao_humana).toBe(
      'Modelo dimensional verificado contra todas as regras M-01 a M-12 sem violações impeditivas.'
    );

    // Rigor Epistêmico Obrigatório:
    // A homologação é decisão humana formal do analista; o sistema apenas capturou automaticamente.
    expect(candidato.metadados_adicionais?.autor_tipo).toBe('HUMANO');
    expect(candidato.metadados_adicionais?.captura_automatica).toBe(true);
    expect(candidato.metadados_adicionais?.homologado_por).toBe('ANALISTA_SENIOR');
    expect(candidato.acao_registrada).toContain('Decisão humana formal de homologação executada pelo analista');
    expect(candidato.classificacao_exposicao).toBe(ClassificacaoExposicaoEvidencia.INTERNA);
  });

  it('ignora MODELAGEM_MODELO_HOMOLOGADO com payload incompleto', () => {
    const evento: EventoAnalitico = {
      id_evento: 'evt_mod_homol_inv',
      demanda_id: 'dem_test_1',
      etapa_origem: EtapaOrigemEvidencia.MODELAGEM,
      categoria: 'MODELAGEM',
      tipo_evento: 'MODELAGEM_MODELO_HOMOLOGADO',
      ocorrido_em: '2026-10-01T14:00:00Z',
      executor: 'ANALISTA',
      payload: {
        modeloId: '',
        justificativa: '',
      },
      versao_contrato: '1.0',
    };

    const decisao = strategy.avaliar(evento);
    expect(decisao.politica).toBe('IGNORAR');
  });

  // ==========================================
  // Teste C: Artefato Criado != Qualidade Global Certificada (Dimensão Calendário)
  // ==========================================
  it('C. dimensão calendário registra existência e decisão, sem atestar isoladamente conformidade global', () => {
    const evento: EventoAnalitico = {
      id_evento: 'evt_mod_cal_1',
      demanda_id: 'dem_test_mod_1',
      etapa_origem: EtapaOrigemEvidencia.MODELAGEM,
      categoria: 'MODELAGEM',
      tipo_evento: 'MODELAGEM_CALENDARIO_ESPECIFICADO',
      ocorrido_em: '2026-10-01T13:30:00Z',
      executor: 'ANALISTA',
      artefato_origem_tipo: 'ENTIDADE_ANALITICA',
      artefato_origem_id: 'ent_dim_tempo',
      payload: {
        entidadeId: 'ent_dim_tempo',
        modeloId: 'mod_vendas_star',
        nomeEntidade: 'd_calendario',
        dataInicio: '2024-01-01',
        dataFim: '2026-12-31',
        totalAtributosGerados: 14,
        especificadoEm: '2026-10-01T13:30:00Z',
      },
      versao_contrato: '1.0',
    };

    const decisao = strategy.avaliar(evento);
    expect(decisao.politica).toBe('REGISTRAR_AUTOMATICAMENTE');

    const candidato = strategy.transformar(evento);
    expect(candidato.titulo).toContain('d_calendario');
    expect(candidato.descricao).toContain('14 atributos temporais com cobertura temporal de 2024-01-01 a 2026-12-31');

    // Rigor Epistêmico Obrigatório:
    // O artefato criado NÃO atesta isoladamente conformidade global do modelo.
    expect(candidato.resultado_mensuravel).toContain('(Nota: não atesta isoladamente conformidade global do modelo)');
    expect(candidato.fato_observado).toContain('papel DIMENSAO_CALENDARIO');
  });

  // ==========================================
  // Teste C: Artefato Criado != Qualidade Global Certificada (Métrica Analítica)
  // ==========================================
  it('C. métrica cadastrada formaliza indicador com rastreabilidade, sem atestar isoladamente conformidade global', () => {
    const evento: EventoAnalitico = {
      id_evento: 'evt_mod_met_1',
      demanda_id: 'dem_test_mod_1',
      etapa_origem: EtapaOrigemEvidencia.MODELAGEM,
      categoria: 'MODELAGEM',
      tipo_evento: 'MODELAGEM_METRICA_CADASTRADA',
      ocorrido_em: '2026-10-01T13:40:00Z',
      executor: 'ANALISTA',
      artefato_origem_tipo: 'METRICA_ANALITICA',
      artefato_origem_id: 'met_receita_liquida',
      payload: {
        metricaId: 'met_receita_liquida',
        modeloId: 'mod_vendas_star',
        nome: 'Receita Líquida Total',
        tipoAgregacao: 'SOMA',
        tipoAditividade: 'TOTALMENTE_ADITIVA',
        formulaDeclarativa: 'SUM(f_vendas[valor_liquido])',
        unidadeMedida: 'MOEDA',
        perguntaNegocioAssociada: 'Qual o faturamento líquido consolidado?',
        objetivoNegocioAssociado: 'Monitorar a meta anual de crescimento de receita.',
        cadastradaEm: '2026-10-01T13:40:00Z',
      },
      versao_contrato: '1.0',
    };

    const decisao = strategy.avaliar(evento);
    expect(decisao.politica).toBe('REGISTRAR_AUTOMATICAMENTE');

    const candidato = strategy.transformar(evento);
    expect(candidato.titulo).toContain('Receita Líquida Total');
    expect(candidato.descricao).toContain('Qual o faturamento líquido consolidado?');

    // Rigor Epistêmico Obrigatório:
    // O artefato cadastrado NÃO atesta isoladamente conformidade global do modelo.
    expect(candidato.resultado_mensuravel).toContain('(Nota: não atesta isoladamente conformidade global do modelo)');
    expect(candidato.decisao_humana).toBe('Monitorar a meta anual de crescimento de receita.');
  });

  // ==========================================
  // Teste C: Artefato Criado != Qualidade Global Certificada (Relacionamento Analítico)
  // ==========================================
  it('C. relacionamento dimensional registra cardinalidade e filtro, sem atestar isoladamente conformidade global', () => {
    const evento: EventoAnalitico = {
      id_evento: 'evt_mod_rel_1',
      demanda_id: 'dem_test_mod_1',
      etapa_origem: EtapaOrigemEvidencia.MODELAGEM,
      categoria: 'MODELAGEM',
      tipo_evento: 'MODELAGEM_RELACIONAMENTO_CRIADO',
      ocorrido_em: '2026-10-01T13:50:00Z',
      executor: 'ANALISTA',
      artefato_origem_tipo: 'RELACIONAMENTO_ANALITICO',
      artefato_origem_id: 'rel_tempo_vendas',
      payload: {
        relacionamentoId: 'rel_tempo_vendas',
        modeloId: 'mod_vendas_star',
        entidadeOrigemNome: 'd_calendario',
        atributoOrigemNome: 'data',
        entidadeDestinoNome: 'f_vendas',
        atributoDestinoNome: 'data_venda',
        tipoRelacionamento: 'UM_PARA_MUITOS',
        direcaoFiltro: 'UNIDIRECIONAL',
        justificativa: 'Propagação temporal padrão 1:N unidirecional para f_vendas.',
        criadoEm: '2026-10-01T13:50:00Z',
      },
      versao_contrato: '1.0',
    };

    const decisao = strategy.avaliar(evento);
    expect(decisao.politica).toBe('REGISTRAR_AUTOMATICAMENTE');

    const candidato = strategy.transformar(evento);
    expect(candidato.titulo).toContain('d_calendario -> f_vendas');
    expect(candidato.descricao).toContain('cardinalidade \'UM_PARA_MUITOS\' e filtro \'UNIDIRECIONAL\'');

    // Rigor Epistêmico Obrigatório:
    // O artefato criado NÃO atesta isoladamente conformidade global do modelo.
    expect(candidato.resultado_mensuravel).toContain('(Nota: não atesta isoladamente conformidade global do modelo)');
    expect(candidato.decisao_humana).toBe('Propagação temporal padrão 1:N unidirecional para f_vendas.');
  });
});
