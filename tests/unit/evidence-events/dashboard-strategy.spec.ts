/**
 * tests/unit/evidence-events/dashboard-strategy.spec.ts
 *
 * Testes Unitários: Estratégia de Dashboard & DAX (Subgate 3.5B.4).
 * Cobre estritamente os requisitos epistêmicos e regras vinculantes homologadas:
 * A. Medida criada gera evidência factual sem certificar automaticamente competência.
 * B. CONCLUIDO não é descrito como HOMOLOGADO (estados semanticamente distintos).
 * C. Homologação real preserva decisão humana e resultado determinístico.
 * D. Duas arquiteturas diferentes com mesmas contagens de páginas/visuais não colidem na idempotência.
 * E. DIVIDE() registra somente fato observável quando não existe justificativa humana.
 * F. Sugestão do Copiloto sem aprovação humana não gera evidência.
 * G. Aprovação humana persistida gera evidência estruturada.
 * H. Falha operacional / payload incompleto é ignorado e não produz evidência falsa.
 * I. Retry da mesma ocorrência permanece idempotente.
 */

import { describe, it, expect } from 'vitest';
import { DashboardStrategy } from '@/core/domain/evidence-events/default-strategies/dashboard-strategy';
import { EventoAnalitico } from '@/core/domain/evidence-events/event-types';
import { EtapaOrigemEvidencia } from '@/core/domain/enums/etapa-origem-evidencia';
import { TipoEvidenciaAnalitica } from '@/core/domain/enums/tipo-evidencia-analitica';
import { ClassificacaoExposicaoEvidencia } from '@/core/domain/enums/classificacao-exposicao-evidencia';

describe('DashboardStrategy: Estratégia de Dashboard e DAX (Subgate 3.5B.4)', () => {
  const strategy = new DashboardStrategy();

  // ==========================================
  // Teste A: Medida criada gera evidência factual sem certificar competência
  // ==========================================
  it('A. medida DAX criada gera evidência factual sem certificar automaticamente competência em DAX', () => {
    const evento: EventoAnalitico = {
      id_evento: 'evt_dash_dax_101',
      demanda_id: 'dem_pbi_1',
      projeto_id: 'prj_pbi_1',
      etapa_origem: EtapaOrigemEvidencia.POWERBI_DASHBOARD,
      categoria: 'DAX',
      tipo_evento: 'DASHBOARD_MEDIDA_DAX_CADASTRADA',
      ocorrido_em: '2026-10-01T14:30:00Z',
      executor: 'ANALISTA',
      artefato_origem_tipo: 'MEDIDA_DAX',
      artefato_origem_id: 'med_total_vendas',
      payload: {
        medidaId: 'med_total_vendas',
        modeloPowerBiId: 'mod_pbi_vendas',
        nome: 'Total Vendas',
        tabelaHospedeira: '_Medidas',
        expressaoDax: 'SUM(fVendas[ValorLiquido])',
        categoriaDax: 'CALCULO_SIMPLES',
        formatoString: 'R$ #,##0.00',
        metricaAnaliticaId: 'met_vendas_brutas',
        descricao: 'Soma do valor líquido das faturas emitidas.',
        cadastradaEm: '2026-10-01T14:30:00Z',
      },
      versao_contrato: '1.0',
    };

    const decisao = strategy.avaliar(evento);
    expect(decisao.politica).toBe('REGISTRAR_AUTOMATICAMENTE');
    expect(decisao.requer_intervencao_humana).toBe(false);

    const candidato = strategy.transformar(evento);
    expect(candidato).not.toBeNull();
    expect(candidato.tipo).toBe(TipoEvidenciaAnalitica.DAX);
    expect(candidato.etapa_origem).toBe(EtapaOrigemEvidencia.POWERBI_DASHBOARD);
    expect(candidato.artefato_origem_tipo).toBe('MEDIDA_DAX');
    expect(candidato.artefato_origem_id).toBe('med_total_vendas');

    // Factual e técnico:
    expect(candidato.fato_observado).toContain('Medida DAX \'Total Vendas\' formalizada com fórmula \'SUM(fVendas[ValorLiquido])\'');
    expect(candidato.fato_observado).toContain('tabela \'_Medidas\'');

    // Rigor Epistêmico Obrigatório (Item 1): NÃO afirmar competência em DAX
    expect(candidato.resultado_mensuravel).toContain('1 medida DAX cadastrada');
    expect(candidato.resultado_mensuravel).toContain('não certifica isoladamente competência em DAX');
    expect(candidato.descricao).not.toContain('demonstra competência');
    expect(candidato.titulo).toBe('Cadastro de Medida DAX: Total Vendas');

    // Autoria humana com captura automática:
    expect(candidato.metadados_adicionais?.autor_tipo).toBe('HUMANO');
    expect(candidato.metadados_adicionais?.captura_automatica).toBe(true);
  });

  // ==========================================
  // Teste B: CONCLUIDO não é descrito como HOMOLOGADO
  // ==========================================
  it('B. CONCLUIDO representa término da construção técnica e não é descrito como HOMOLOGADO', () => {
    const eventoConcluido: EventoAnalitico = {
      id_evento: 'evt_dash_conc_mod_1',
      demanda_id: 'dem_pbi_1',
      etapa_origem: EtapaOrigemEvidencia.POWERBI_DASHBOARD,
      categoria: 'DASHBOARD',
      tipo_evento: 'DASHBOARD_MODELO_CONCLUIDO',
      ocorrido_em: '2026-10-01T15:00:00Z',
      executor: 'ANALISTA',
      artefato_origem_tipo: 'MODELO_POWERBI',
      artefato_origem_id: 'mod_pbi_vendas',
      payload: {
        modeloId: 'mod_pbi_vendas',
        nomeArquivo: 'RelatorioVendasExecutivo.pbip',
        tipoFormato: 'PBIP',
        totalMedidas: 5,
        totalPaginas: 2,
        totalVisuais: 8,
        concluidoPor: 'ANALISTA',
        concluidoEm: '2026-10-01T15:00:00Z',
      },
      versao_contrato: '1.0',
    };

    const decisao = strategy.avaliar(eventoConcluido);
    expect(decisao.politica).toBe('REGISTRAR_AUTOMATICAMENTE');

    const candidato = strategy.transformar(eventoConcluido);
    expect(candidato.titulo).toContain('Conclusão Técnica da Construção do Dashboard');
    expect(candidato.titulo).not.toContain('Homologação');
    expect(candidato.fato_observado).toContain('transitou para o status CONCLUIDO');
    expect(candidato.resultado_mensuravel).toContain('sem constituir homologação formal de negócio');
  });

  // ==========================================
  // Teste C: Homologação real preserva decisão humana e resultado determinístico
  // ==========================================
  it('C. homologação real preserva decisão humana soberana e aceitação formal do dashboard', () => {
    const eventoHomologado: EventoAnalitico = {
      id_evento: 'evt_dash_homol_mod_1',
      demanda_id: 'dem_pbi_1',
      etapa_origem: EtapaOrigemEvidencia.POWERBI_DASHBOARD,
      categoria: 'DASHBOARD',
      tipo_evento: 'DASHBOARD_MODELO_HOMOLOGADO',
      ocorrido_em: '2026-10-01T16:00:00Z',
      executor: 'ANALISTA',
      artefato_origem_tipo: 'MODELO_POWERBI',
      artefato_origem_id: 'mod_pbi_vendas',
      payload: {
        modeloId: 'mod_pbi_vendas',
        nomeArquivo: 'RelatorioVendasExecutivo.pbip',
        tipoFormato: 'PBIP',
        homologadoPor: 'ANALISTA_LEAD',
        justificativaHomologacao: 'Dashboard validado contra o checklist D-01 a D-08 sem bloqueios e aprovado pelos stakeholders.',
        homologadoEm: '2026-10-01T16:00:00Z',
      },
      versao_contrato: '1.0',
    };

    const decisao = strategy.avaliar(eventoHomologado);
    expect(decisao.politica).toBe('REGISTRAR_AUTOMATICAMENTE');

    const candidato = strategy.transformar(eventoHomologado);
    expect(candidato.titulo).toContain('Homologação Formal do Modelo de Dashboard');
    expect(candidato.decisao_humana).toBe(
      'Dashboard validado contra o checklist D-01 a D-08 sem bloqueios e aprovado pelos stakeholders.'
    );
    expect(candidato.acao_registrada).toContain('Decisão humana formal de homologação e aceitação do dashboard');
    expect(candidato.metadados_adicionais?.decisao_humana_soberana).toBe(true);
  });

  // ==========================================
  // Teste D: Idempotência de Arquitetura Aprovada com páginas persistidas
  // ==========================================
  it('D. duas arquiteturas diferentes com mesmas contagens de páginas e visuais possuem chaves distintas', () => {
    // Proposta 1: criou pag_alpha_1
    const idEvento1 = 'evt_dash_arq_pag_alpha_1';
    // Proposta 2: criou pag_beta_1
    const idEvento2 = 'evt_dash_arq_pag_beta_1';

    expect(idEvento1).not.toBe(idEvento2);

    const evento1: EventoAnalitico = {
      id_evento: idEvento1,
      demanda_id: 'dem_pbi_1',
      etapa_origem: EtapaOrigemEvidencia.POWERBI_DASHBOARD,
      categoria: 'DASHBOARD',
      tipo_evento: 'DASHBOARD_ARQUITETURA_APROVADA',
      ocorrido_em: '2026-10-01T11:00:00Z',
      executor: 'ANALISTA',
      payload: {
        modeloPowerBiId: 'mod_1',
        primeiraPaginaId: 'pag_alpha_1',
        totalPaginasCriadas: 1,
        totalVisuaisCriados: 2,
        aprovadoPor: 'ANALISTA',
        geradoComAuxilioCopiloto: true,
        aprovadoEm: '2026-10-01T11:00:00Z',
      },
      versao_contrato: '1.0',
    };

    const evento2: EventoAnalitico = {
      id_evento: idEvento2,
      demanda_id: 'dem_pbi_1',
      etapa_origem: EtapaOrigemEvidencia.POWERBI_DASHBOARD,
      categoria: 'DASHBOARD',
      tipo_evento: 'DASHBOARD_ARQUITETURA_APROVADA',
      ocorrido_em: '2026-10-01T11:30:00Z',
      executor: 'ANALISTA',
      payload: {
        modeloPowerBiId: 'mod_1',
        primeiraPaginaId: 'pag_beta_1',
        totalPaginasCriadas: 1,
        totalVisuaisCriados: 2,
        aprovadoPor: 'ANALISTA',
        geradoComAuxilioCopiloto: true,
        aprovadoEm: '2026-10-01T11:30:00Z',
      },
      versao_contrato: '1.0',
    };

    const cand1 = strategy.transformar(evento1);
    const cand2 = strategy.transformar(evento2);

    expect(cand1.artefato_origem_id).toBe('pag_alpha_1');
    expect(cand2.artefato_origem_id).toBe('pag_beta_1');
    expect(cand1.artefato_origem_id).not.toBe(cand2.artefato_origem_id);
  });

  // ==========================================
  // Teste E: DIVIDE() registra somente fato observável sem inferir intenção
  // ==========================================
  it('E. DIVIDE() registra estritamente o fato observável de uso da função quando não há justificativa humana', () => {
    const eventoComDivide: EventoAnalitico = {
      id_evento: 'evt_dash_dax_div_1',
      demanda_id: 'dem_pbi_1',
      etapa_origem: EtapaOrigemEvidencia.POWERBI_DASHBOARD,
      categoria: 'DAX',
      tipo_evento: 'DASHBOARD_MEDIDA_DAX_CADASTRADA',
      ocorrido_em: '2026-10-01T14:40:00Z',
      executor: 'ANALISTA',
      payload: {
        medidaId: 'med_margem',
        modeloPowerBiId: 'mod_1',
        nome: 'Margem Bruta %',
        tabelaHospedeira: '_Medidas',
        expressaoDax: 'DIVIDE([LucroBruto], [ReceitaLiquida], 0)',
        categoriaDax: 'PERCENTUAL_RATIO',
        descricao: null, // Analista não declarou intenção
        cadastradaEm: '2026-10-01T14:40:00Z',
      },
      versao_contrato: '1.0',
    };

    const cand = strategy.transformar(eventoComDivide);

    // Fato observável: apenas constata que a expressão utiliza DIVIDE()
    expect(cand.fato_observado).toContain('A expressão utiliza a função DIVIDE().');
    expect(cand.metadados_adicionais?.usa_divide).toBe(true);

    // NÃO infere intenção humana defensiva se não foi fornecida:
    expect(cand.decisao_humana).toBeNull();
    expect(cand.acao_registrada).toBe('Implementação técnica de expressão de cálculo tabular DAX pelo analista.');
    expect(cand.acao_registrada).not.toContain('tratamento defensivo');
  });

  // ==========================================
  // Teste F: Sugestão do Copiloto sem aprovação humana não gera evidência
  // ==========================================
  it('F. eventos desconhecidos ou sugestões isoladas de IA/Copiloto são ignorados pela política', () => {
    const eventoSugestaoCopiloto: EventoAnalitico = {
      id_evento: 'evt_copilot_sugestao_efemera',
      demanda_id: 'dem_pbi_1',
      etapa_origem: EtapaOrigemEvidencia.POWERBI_DASHBOARD,
      categoria: 'DASHBOARD',
      tipo_evento: 'DASHBOARD_SUGESTAO_COPILOTO_GERADA', // Evento não homologado
      ocorrido_em: '2026-10-01T12:00:00Z',
      executor: 'COPILOTO',
      payload: {
        sugestaoVisual: 'GRAFICO_BARRAS',
      },
      versao_contrato: '1.0',
    };

    const decisao = strategy.avaliar(eventoSugestaoCopiloto);
    expect(decisao.politica).toBe('IGNORAR');
    expect(decisao.motivo).toContain('Tipo de evento de dashboard desconhecido');
  });

  // ==========================================
  // Teste G: Aprovação humana persistida gera evidência estruturada
  // ==========================================
  it('G. aprovação humana formal da arquitetura gera evidência com metadados de deliberação soberana', () => {
    const eventoAprovacao: EventoAnalitico = {
      id_evento: 'evt_dash_arq_pag_1',
      demanda_id: 'dem_pbi_1',
      etapa_origem: EtapaOrigemEvidencia.POWERBI_DASHBOARD,
      categoria: 'DASHBOARD',
      tipo_evento: 'DASHBOARD_ARQUITETURA_APROVADA',
      ocorrido_em: '2026-10-01T13:00:00Z',
      executor: 'ANALISTA',
      payload: {
        modeloPowerBiId: 'mod_1',
        primeiraPaginaId: 'pag_1',
        totalPaginasCriadas: 3,
        totalVisuaisCriados: 12,
        aprovadoPor: 'ANALISTA_SENIOR',
        geradoComAuxilioCopiloto: true,
        aprovadoEm: '2026-10-01T13:00:00Z',
      },
      versao_contrato: '1.0',
    };

    const decisao = strategy.avaliar(eventoAprovacao);
    expect(decisao.politica).toBe('REGISTRAR_AUTOMATICAMENTE');

    const cand = strategy.transformar(eventoAprovacao);
    expect(cand.titulo).toBe('Aprovação Soberana da Arquitetura do Dashboard');
    expect(cand.decisao_humana).toContain('Aprovação deliberada da proposta arquitetural pelo analista \'ANALISTA_SENIOR\'');
    expect(cand.metadados_adicionais?.gerado_com_auxilio_copiloto).toBe(true);
    expect(cand.metadados_adicionais?.decisao_humana_soberana).toBe(true);
    expect(cand.metadados_adicionais?.autor_tipo).toBe('HUMANO');
  });

  // ==========================================
  // Teste H: Falha operacional / payload incompleto não produz evidência falsa
  // ==========================================
  it('H. payload incompleto ou corrompido é ignorado deterministicamente', () => {
    const eventoInvalido: EventoAnalitico = {
      id_evento: 'evt_dash_inv_1',
      demanda_id: 'dem_pbi_1',
      etapa_origem: EtapaOrigemEvidencia.POWERBI_DASHBOARD,
      categoria: 'DAX',
      tipo_evento: 'DASHBOARD_MEDIDA_DAX_CADASTRADA',
      ocorrido_em: '2026-10-01T13:00:00Z',
      executor: 'ANALISTA',
      payload: {
        medidaId: '', // Vazio
        nome: '',
        expressaoDax: '',
      },
      versao_contrato: '1.0',
    };

    const decisao = strategy.avaliar(eventoInvalido);
    expect(decisao.politica).toBe('IGNORAR');
    expect(decisao.motivo).toContain('incompleto');
  });

  // ==========================================
  // Teste I: Isenção de BI formalizada (Excel-Only)
  // ==========================================
  it('I. isenção formalizada com justificativa >= 15 chars gera evidência de governança', () => {
    const eventoIsencao: EventoAnalitico = {
      id_evento: 'evt_dash_isen_mod_ex',
      demanda_id: 'dem_pbi_1',
      etapa_origem: EtapaOrigemEvidencia.POWERBI_DASHBOARD,
      categoria: 'DASHBOARD',
      tipo_evento: 'DASHBOARD_ISENCAO_FORMALIZADA',
      ocorrido_em: '2026-10-01T13:10:00Z',
      executor: 'ANALISTA',
      payload: {
        modeloId: 'mod_ex',
        justificativaIsencao: 'Demanda de conciliação fiscal com entrega estritamente em pasta de trabalho Excel.',
        formalizadoPor: 'ANALISTA',
        formalizadoEm: '2026-10-01T13:10:00Z',
      },
      versao_contrato: '1.0',
    };

    const decisao = strategy.avaliar(eventoIsencao);
    expect(decisao.politica).toBe('REGISTRAR_AUTOMATICAMENTE');

    const cand = strategy.transformar(eventoIsencao);
    expect(cand.titulo).toContain('Formalização de Isenção de Power BI (Excel-Only)');
    expect(cand.decisao_humana).toBe(
      'Demanda de conciliação fiscal com entrega estritamente em pasta de trabalho Excel.'
    );
  });
});
