/**
 * tests/unit/intake/intake-analysis-engine.spec.ts
 *
 * Suíte de Testes Unitários do Core do Intake Inteligente (Tier 1 Determinístico).
 *
 * Cobre rigorosamente os 11 cenários obrigatórios e diretrizes epistêmicas:
 * 1. Vendas (caso canônico do usuário);
 * 2. Financeiro;
 * 3. Estoque e Logística;
 * 4. RH e Pessoas;
 * 5. Saúde e Políticas Públicas;
 * 6. Solicitação muito curta;
 * 7. Solicitação ambígua;
 * 8. Solicitação com prazo explícito;
 * 9. Solicitação com período temporal delimitado;
 * 10. Solicitação mencionando Excel e CSV;
 * 11. Solicitação sem dados mencionados (tolerância zero a fatos inventados);
 * 12. Preservação fidedigna byte-for-byte da solicitação original;
 * 13. Determinismo absoluto entre execuções repetidas.
 */

import { describe, it, expect } from 'vitest';
import { IntakeAnalysisEngine } from '@/core/domain/intake/intake-analysis-engine';

describe('IntakeAnalysisEngine — Tier 1 Determinístico (Subgate 1)', () => {
  it('1. Vendas: deve analisar perfeitamente a solicitação canônica do usuário', () => {
    const input =
      'Tenho uma planilha de vendas e queria entender por que minhas vendas caíram nos últimos meses e quais produtos estão puxando essa queda.';

    const resultado = IntakeAnalysisEngine.analisar(input);

    // Rigor factual
    expect(resultado.solicitacaoOriginal).toBe(input);
    expect(resultado.metadados.analisador).toBe('TIER_1_DETERMINISTICO');

    // Fatos identificados
    expect(resultado.fatos.ativosDadosMencionados).toHaveLength(1);
    expect(resultado.fatos.ativosDadosMencionados[0].tipoDetectado).toBe('PLANILHA');
    expect(resultado.fatos.periodoJanelaTemporalMencionada?.tipo).toBe('MESES');
    expect(resultado.fatos.periodoJanelaTemporalMencionada?.termoVerbatim.toLowerCase()).toContain('últimos meses');

    // Inferências do Copiloto
    expect(resultado.inferencias.dominioNegocio).toBe('VENDAS');
    expect(resultado.inferencias.dimensoesAnaliticasIdentificadas).toContain('Produto / Item');
    expect(resultado.inferencias.dimensoesAnaliticasIdentificadas).toContain('Tempo (Data / Mês / Ano)');
    expect(resultado.inferencias.problemaAparente).toContain('Retração observada nos indicadores');
    expect(resultado.inferencias.objetivoProvavel).toContain('causa-raiz da queda');

    // Indicadores Fato vs Sugeridos
    const kpisFato = resultado.fatos.indicadoresExplicitamenteMencionados.map((k) => k.nome);
    expect(kpisFato).toContain('Vendas');
    expect(kpisFato).toContain('Variação / Queda de Desempenho');

    const kpisSugeridos = resultado.inferencias.indicadoresSugeridos.map((k) => k.nome);
    expect(kpisSugeridos).toContain('Ticket Médio');
    expect(kpisSugeridos).toContain('Concentração de Vendas (Curva ABC / Pareto)');
    expect(resultado.inferencias.indicadoresSugeridos.every((k) => k.classificacao === 'INFERENCIA')).toBe(true);

    // Proposta operacional
    expect(resultado.proposta.projetoSugerido.nome).toBe('Diagnóstico de Vendas e Desempenho Comercial');
    expect(resultado.proposta.demandaSugerida.titulo).toBe('Análise Causal de Queda de Vendas e Desempenho por Produto');
    expect(resultado.proposta.demandaSugerida.objetivoInicial).toBe(resultado.inferencias.objetivoProvavel);
  });

  it('2. Financeiro: deve classificar domínio financeiro e sugerir métricas de liquidez e margens', () => {
    const input =
      'Precisamos fechar o fluxo de caixa e analisar o DRE gerencial porque a inadimplência subiu bastante no último mês.';

    const resultado = IntakeAnalysisEngine.analisar(input);

    expect(resultado.solicitacaoOriginal).toBe(input);
    expect(resultado.inferencias.dominioNegocio).toBe('FINANCEIRO');

    const kpisFato = resultado.fatos.indicadoresExplicitamenteMencionados.map((k) => k.nome);
    expect(kpisFato).toContain('Fluxo de Caixa');
    expect(kpisFato).toContain('Inadimplência');

    const kpisSugeridos = resultado.inferencias.indicadoresSugeridos.map((k) => k.nome);
    expect(kpisSugeridos).toContain('Margem Líquida %');
    expect(kpisSugeridos).toContain('Índice de Liquidez Corrente');

    expect(resultado.proposta.projetoSugerido.nome).toBe('Gestão Financeira e Conciliação de Resultados');
    expect(resultado.proposta.demandaSugerida.titulo).toBe('Estruturação de DRE Gerencial e Fluxo de Caixa');
  });

  it('3. Estoque e Logística: deve identificar ruptura, giro e sugerir Curva ABC', () => {
    const input =
      'Temos um arquivo CSV com o estoque e precisamos calcular a ruptura de produtos nos armazéns e o giro de estoque dos SKUs.';

    const resultado = IntakeAnalysisEngine.analisar(input);

    expect(resultado.fatos.ativosDadosMencionados[0].tipoDetectado).toBe('CSV');
    expect(resultado.inferencias.dominioNegocio).toBe('ESTOQUE_LOGISTICA');
    expect(resultado.inferencias.dimensoesAnaliticasIdentificadas).toContain('Produto / Item');
    expect(resultado.inferencias.dimensoesAnaliticasIdentificadas).toContain('Unidade / Local');

    const kpisSugeridos = resultado.inferencias.indicadoresSugeridos.map((k) => k.nome);
    expect(kpisSugeridos).toContain('Taxa de Ruptura %');
    expect(kpisSugeridos).toContain('Cobertura de Estoque em Dias');

    expect(resultado.proposta.projetoSugerido.nome).toBe('Otimização de Estoque e Cadeia Logística');
    expect(resultado.proposta.demandaSugerida.titulo).toBe('Diagnóstico de Ruptura, Giro e Curva ABC de Estoque');
  });

  it('4. RH e Pessoas: deve identificar turnover, absenteísmo e entregável de dashboard explícito', () => {
    const input =
      'O turnover e o absenteísmo na fábrica estão altos. Precisamos de um dashboard para acompanhar a rotatividade por departamento.';

    const resultado = IntakeAnalysisEngine.analisar(input);

    expect(resultado.inferencias.dominioNegocio).toBe('RH_PESSOAS');

    // Entregável explícito vs inferido
    expect(resultado.fatos.entregaveisExplicitamenteSolicitados).toHaveLength(1);
    expect(resultado.fatos.entregaveisExplicitamenteSolicitados[0].tipo).toBe('DASHBOARD');
    expect(resultado.fatos.entregaveisExplicitamenteSolicitados[0].classificacao).toBe('FATO');

    const kpisFato = resultado.fatos.indicadoresExplicitamenteMencionados.map((k) => k.nome);
    expect(kpisFato).toContain('Turnover (Rotatividade)');
    expect(kpisFato).toContain('Absenteísmo');

    expect(resultado.proposta.projetoSugerido.nome).toBe('People Analytics e Gestão de Pessoal');
    expect(resultado.proposta.demandaSugerida.titulo).toBe('Diagnóstico de Turnover, Absenteísmo e Composição do Headcount');
  });

  it('5. Saúde Pública: deve reconhecer atendimentos, UBS, filas e cobertura vacinal', () => {
    const input =
      'A secretaria municipal de saúde quer avaliar a fila e o tempo de espera dos pacientes nas UBS e a cobertura vacinal dos bairros.';

    const resultado = IntakeAnalysisEngine.analisar(input);

    expect(resultado.inferencias.dominioNegocio).toBe('SAUDE_PUBLICA');
    expect(resultado.inferencias.dimensoesAnaliticasIdentificadas).toContain('Cliente / Segmento'); // Pacientes
    expect(resultado.inferencias.dimensoesAnaliticasIdentificadas).toContain('Unidade / Local'); // UBS

    const kpisFato = resultado.fatos.indicadoresExplicitamenteMencionados.map((k) => k.nome);
    expect(kpisFato).toContain('Tempo de Espera');
    expect(kpisFato).toContain('Cobertura Vacinal');

    expect(resultado.proposta.projetoSugerido.nome).toBe('Gestão em Saúde e Acompanhamento de Atendimentos');
    expect(resultado.proposta.demandaSugerida.titulo).toBe('Monitoramento de Atendimentos e Filas em Unidades de Saúde');
  });

  it('6. Solicitação muito curta: deve sinalizar metadado e formular perguntas de escopo', () => {
    const input = 'Painel de vendas';

    const resultado = IntakeAnalysisEngine.analisar(input);

    expect(resultado.metadados.ehMuitoCurto).toBe(true);
    expect(resultado.solicitacaoOriginal).toBe(input);
    expect(resultado.lacunas.itensFaltantes.some((i) => i.includes('concisão ou ambiguidade'))).toBe(true);

    const perguntaEscopo = resultado.lacunas.perguntasPriorizadas.find((p) => p.id === 'intake_perg_escopo_geral');
    expect(perguntaEscopo).toBeDefined();
    expect(perguntaEscopo?.bloqueanteRecomendado).toBe(true);
  });

  it('7. Solicitação ambígua: deve sinalizar ambiguidade e priorizar clarificação conceitual', () => {
    const input = 'Preciso melhorar meus números urgente.';

    const resultado = IntakeAnalysisEngine.analisar(input);

    expect(resultado.metadados.ehAmbiguo).toBe(true);
    expect(resultado.lacunas.perguntasPriorizadas.some((p) => p.id === 'intake_perg_escopo_geral')).toBe(true);
  });

  it('8. Solicitação com prazo explícito: deve capturar prazo sem inventar datas adicionais', () => {
    const input =
      'Tenho uma planilha de custos e preciso de um relatório até sexta para a diretoria.';

    const resultado = IntakeAnalysisEngine.analisar(input);

    expect(resultado.fatos.prazoMencionado?.toLowerCase()).toContain('até sexta');
    expect(resultado.proposta.demandaSugerida.prazoEsperado?.toLowerCase()).toContain('até sexta');
    expect(resultado.proposta.demandaSugerida.restricoesDeclaradas).toContain('até sexta');
  });

  it('9. Solicitação com período temporal delimitado em anos: deve extrair janela temporal fidedigna', () => {
    const input =
      'Gostaria de analisar o histórico de vendas de 2024 a 2026 para projetar a demanda do ano que vem.';

    const resultado = IntakeAnalysisEngine.analisar(input);

    expect(resultado.fatos.periodoJanelaTemporalMencionada).not.toBeNull();
    expect(resultado.fatos.periodoJanelaTemporalMencionada?.tipo).toBe('ANO');
    expect(resultado.fatos.periodoJanelaTemporalMencionada?.termoVerbatim).toBe('2024 a 2026');
  });

  it('10. Solicitação mencionando Excel e CSV: deve extrair ambos os ativos de dados sem duplicidade', () => {
    const input =
      'Tenho uma planilha Excel com as vendas e um arquivo CSV exportado do sistema contendo os clientes.';

    const resultado = IntakeAnalysisEngine.analisar(input);

    expect(resultado.fatos.ativosDadosMencionados).toHaveLength(3); // Planilha, CSV, Sistema
    const tipos = resultado.fatos.ativosDadosMencionados.map((a) => a.tipoDetectado);
    expect(tipos).toContain('PLANILHA');
    expect(tipos).toContain('CSV');
    expect(tipos).toContain('SISTEMA');
    expect(resultado.metadados.temDadosIdentificados).toBe(true);
  });

  it('11. Solicitação sem dados mencionados: NUNCA deve inventar arquivos e deve registrar lacuna crítica', () => {
    const input =
      'Quero entender a satisfação dos meus clientes e identificar os principais motivos de insatisfação.';

    const resultado = IntakeAnalysisEngine.analisar(input);

    // Rigor: zero arquivos inventados
    expect(resultado.fatos.ativosDadosMencionados).toHaveLength(0);
    expect(resultado.metadados.temDadosIdentificados).toBe(false);

    // Lacuna de fonte de dados identificada
    expect(resultado.lacunas.itensFaltantes).toContain('Fonte de dados e formato dos arquivos não foram explicitados.');

    const pergDados = resultado.lacunas.perguntasPriorizadas.find((p) => p.id === 'intake_perg_dados_fonte');
    expect(pergDados).toBeDefined();
    expect(pergDados?.categoria).toBe('DADOS_FONTE');
    expect(pergDados?.bloqueanteRecomendado).toBe(true);
  });

  it('12. Preservação byte-for-byte: caracteres especiais, quebras de linha e pontuações devem permanecer intocados', () => {
    const inputComplexo = `   Solicitação recebida via WhatsApp (10:45):
    - "Preciso ver as vendas de 2025!"
    - Planilha em anexo: Vendas_2025_v2.xlsx
    Atenção: Margens precisam bater 100% com a DRE.
    Prazo: até amanhã.   `;

    const resultado = IntakeAnalysisEngine.analisar(inputComplexo);

    // Byte-for-byte fidedigno ao input recebido
    expect(resultado.solicitacaoOriginal).toBe(inputComplexo);
    expect(resultado.solicitacaoOriginal.length).toBe(inputComplexo.length);
  });

  it('13. Determinismo absoluto: múltiplas chamadas consecutivas devem gerar resultados idênticos', () => {
    const input = 'Tenho uma planilha de vendas e queria entender por que minhas vendas caíram nos últimos meses.';

    const res1 = IntakeAnalysisEngine.analisar(input);
    const res2 = IntakeAnalysisEngine.analisar(input);

    expect(res1.solicitacaoOriginal).toBe(res2.solicitacaoOriginal);
    expect(res1.inferencias.dominioNegocio).toBe(res2.inferencias.dominioNegocio);
    expect(res1.fatos.ativosDadosMencionados).toEqual(res2.fatos.ativosDadosMencionados);
    expect(res1.lacunas.perguntasPriorizadas).toEqual(res2.lacunas.perguntasPriorizadas);
    expect(res1.proposta).toEqual(res2.proposta);
  });

  it('14. Feedback #003 — Regressão Obrigatória: rigor analítico, fronteira epistêmica, explicabilidade e clarificação de negócio', () => {
    const promptRegressao =
      'Preciso de um painel para entender como estão as vendas da empresa. Tenho uma planilha com as vendas e queria saber quais produtos estão vendendo mais, quais estão vendendo menos e como o faturamento está evoluindo. Também queria conseguir comparar as filiais. Preciso apresentar isso para a direção na próxima reunião.';

    const resultado = IntakeAnalysisEngine.analisar(promptRegressao);

    // 1. Preservação factual íntegra byte-a-byte do Pedido Original
    expect(resultado.solicitacaoOriginal).toBe(promptRegressao);
    expect(resultado.solicitacaoOriginal.length).toBe(promptRegressao.length);

    // 2. Fronteira epistemológica rigorosa: tolerância zero a qualificadores inventados
    const nomesFato = resultado.fatos.indicadoresExplicitamenteMencionados.map((k) => k.nome);
    expect(nomesFato).toContain('Vendas');
    expect(nomesFato).toContain('Faturamento');
    // "Faturamento Bruto" NÃO foi declarado pelo usuário, logo NÃO pode aparecer como fato!
    expect(nomesFato).not.toContain('Faturamento Bruto');
    expect(nomesFato).not.toContain('Vendas Totais');

    // 3. Fatos adicionais extraídos com fidelidade
    expect(resultado.fatos.ativosDadosMencionados).toHaveLength(1);
    expect(resultado.fatos.ativosDadosMencionados[0].tipoDetectado).toBe('PLANILHA');
    expect(resultado.fatos.ativosDadosMencionados[0].termoVerbatim).toContain('planilha');
    expect(resultado.fatos.entregaveisExplicitamenteSolicitados[0].tipo).toBe('DASHBOARD');
    expect(resultado.fatos.prazoMencionado?.toLowerCase()).toContain('próxima reunião');

    // 4. Inferências e Hipóteses claramente identificadas
    expect(resultado.inferencias.dominioNegocio).toBe('VENDAS');
    expect(resultado.inferencias.dimensoesAnaliticasIdentificadas).toContain('Produto / Item');
    expect(resultado.inferencias.dimensoesAnaliticasIdentificadas).toContain('Unidade / Local');
    expect(resultado.inferencias.problemaAparente).toContain('Hipótese a confirmar:');
    expect(resultado.inferencias.objetivoProvavel).toContain('Interpretação do Copiloto:');
    expect(resultado.inferencias.contextoIdentificado).toContain('Interpretação preliminar:');
    // Expressões como "mecanismo contínuo" não podem ser afirmadas como certezas
    expect(resultado.inferencias.objetivoProvavel).toContain('validar se de uso pontual para a reunião ou contínuo');

    // 5. Explicabilidade analítica completa dos KPIs sugeridos (5 pilares)
    expect(resultado.inferencias.indicadoresSugeridos.length).toBeGreaterThanOrEqual(4);
    for (const kpi of resultado.inferencias.indicadoresSugeridos) {
      expect(kpi.classificacao).toBe('INFERENCIA');
      expect(kpi.oQueE).toBeDefined();
      expect(kpi.oQueE!.length).toBeGreaterThan(10);
      expect(kpi.porQueSugerido).toBeDefined();
      expect(kpi.porQueSugerido!.length).toBeGreaterThan(10);
      expect(kpi.oQueAjudaResponder).toBeDefined();
      expect(kpi.oQueAjudaResponder!.length).toBeGreaterThan(10);
      expect(kpi.comoCalcular).toBeDefined();
      expect(kpi.comoCalcular!.length).toBeGreaterThan(5);
      expect(kpi.oQuePrecisaConfirmar).toBeDefined();
      expect(kpi.oQuePrecisaConfirmar!.length).toBeGreaterThan(10);
    }

    const nomesSugeridos = resultado.inferencias.indicadoresSugeridos.map((k) => k.nome);
    expect(nomesSugeridos).toContain('Ticket Médio');
    expect(nomesSugeridos).toContain('Volume Físico de Vendas (Quantidade)');
    expect(nomesSugeridos).toContain('Evolução Temporal do Faturamento (MoM / YoY)');
    expect(nomesSugeridos).toContain('Comparativo de Desempenho por Filial');
    expect(nomesSugeridos).toContain('Concentração de Vendas (Curva ABC / Pareto)');

    // 6. Clarificação orientada primeiro ao negócio (Prioridade de Perguntas)
    const perguntas = resultado.lacunas.perguntasPriorizadas;
    const textosPerguntas = perguntas.map((p) => p.pergunta);

    // Perguntas essenciais de negócio identificadas
    expect(textosPerguntas).toContain('O painel será utilizado apenas nessa apresentação ou deverá continuar sendo atualizado?');
    expect(textosPerguntas).toContain('Quando ocorrerá a próxima reunião da direção?');
    expect(textosPerguntas).toContain('Qual período das vendas deverá ser analisado?');
    expect(textosPerguntas).toContain('Quais filiais devem participar da comparação?');
    expect(textosPerguntas).toContain('O que a empresa considera “faturamento” nesse contexto?');
    expect(textosPerguntas).toContain('“Produtos vendendo mais/menos” significa quantidade, faturamento ou ambos?');
    expect(textosPerguntas).toContain('Quais campos/colunas estão disponíveis na planilha?');

    // Ordem de prioridade estrita: objetivo e prazo/reunião antes de granularidade técnica
    const idxPainel = perguntas.findIndex((p) => p.id === 'intake_perg_uso_painel');
    const idxReuniao = perguntas.findIndex((p) => p.id === 'intake_perg_data_reuniao');
    const idxPeriodo = perguntas.findIndex((p) => p.id === 'intake_perg_temporalidade');
    const idxGranularidade = perguntas.findIndex((p) => p.id === 'intake_perg_granularidade');

    expect(idxPainel).toBeLessThan(idxGranularidade);
    expect(idxReuniao).toBeLessThan(idxGranularidade);
    expect(idxPeriodo).toBeLessThan(idxGranularidade);
  });

  // ==========================================================================
  // FEEDBACK OPERACIONAL #004: REQUISITOS ESSENCIAIS, CLARIFICAÇÃO ASSISTIDA E ROTEIRO
  // ==========================================================================

  describe('Feedback Operacional #004 — Requisitos Essenciais e Clarificação Assistida', () => {
    const inputPiloto =
      'O diretor comercial quer entender por que as vendas caíram no último trimestre. Ele me pediu um painel no Power BI que mostre a evolução do faturamento, compare as filiais e liste os produtos que mais venderam e os que menos venderam. Ele tem uma planilha com as vendas, mas não sei exatamente quais colunas ela tem. A próxima reunião com a diretoria é na sexta-feira. Preciso organizar essa demanda.';

    it('15. Classificação dos Requisitos em 4 categorias formais com justificativa e rastreabilidade', () => {
      const resultado = IntakeAnalysisEngine.analisar(inputPiloto);
      const reqs = resultado.requisitosClassificados;

      expect(reqs).toBeDefined();
      expect(reqs.length).toBeGreaterThanOrEqual(6);

      // Grupos de classificação
      const essenciais = reqs.filter((r) => r.classificacao === 'REQUISITO_ESSENCIAL');
      const pendentes = reqs.filter((r) => r.classificacao === 'REQUISITO_PENDENTE_ESCLARECIMENTO');
      const sugestoes = reqs.filter((r) => r.classificacao === 'SUGESTAO_ANALITICA_ADICIONAL');
      const indefinidos = reqs.filter((r) => r.classificacao === 'NAO_DEFINIDO_INVESTIGAR');

      expect(essenciais.length).toBeGreaterThanOrEqual(3);
      expect(pendentes.length).toBeGreaterThanOrEqual(2);
      expect(sugestoes.length).toBeGreaterThanOrEqual(1);
      expect(indefinidos.length).toBeGreaterThanOrEqual(2);

      // Requisitos Essenciais: devem ter trecho no Pedido Original
      const idsEssenciais = essenciais.map((r) => r.id);
      expect(idsEssenciais).toContain('req_painel_visual');
      expect(idsEssenciais).toContain('req_evolucao_faturamento');
      expect(idsEssenciais).toContain('req_comparativo_filiais');
      expect(idsEssenciais).toContain('req_base_planilha');

      for (const e of essenciais) {
        expect(e.origemPedidoOriginal).not.toBeNull();
        expect(e.origemPedidoOriginal!.length).toBeGreaterThan(0);
        expect(e.justificativaClassificacao.length).toBeGreaterThan(10);
        expect(e.rastreabilidade.necessidadeIdentificada.length).toBeGreaterThan(5);
        expect(e.rastreabilidade.impactoAnalise.length).toBeGreaterThan(5);
      }

      // Requisitos Pendentes de Esclarecimento
      const idsPendentes = pendentes.map((r) => r.id);
      expect(idsPendentes).toContain('req_ranking_produtos');
      expect(idsPendentes).toContain('req_estrutura_colunas');

      const reqRanking = pendentes.find((r) => r.id === 'req_ranking_produtos');
      expect(reqRanking?.justificativaClassificacao).toMatch(/falta definir o critério de ordenação|ambiguidade no significado de "vender mais"/i);
      expect(reqRanking?.rastreabilidade.perguntaRelacionadaId).toBe('intake_perg_criterio_ranking_produtos');

      // Sugestões Analíticas: NUNCA promovidas automaticamente (origemPedidoOriginal === null)
      for (const s of sugestoes) {
        expect(s.origemPedidoOriginal).toBeNull();
        expect(s.justificativaClassificacao).toContain('Copiloto');
        expect(s.justificativaClassificacao).toContain('deliberação humana');
      }

      // Não Definido / Investigar
      const idsIndefinidos = indefinidos.map((r) => r.id);
      expect(idsIndefinidos).toContain('req_granularidade_detalhe');
      expect(idsIndefinidos).toContain('req_regras_excecao');

      for (const i of indefinidos) {
        expect(i.origemPedidoOriginal).toBeNull();
        expect(i.justificativaClassificacao).toContain('evidência');
      }
    });

    it('16. Card de Clarificação Assistida: deve conter os 8 campos enriquecidos para todas as perguntas', () => {
      const resultado = IntakeAnalysisEngine.analisar(inputPiloto);
      const perguntas = resultado.lacunas.perguntasPriorizadas;

      expect(perguntas.length).toBeGreaterThanOrEqual(4);

      for (const p of perguntas) {
        // 1. Prioridade e justificativa
        expect(p.prioridadeNivel).toBeDefined();
        expect(['ESSENCIAL_BLOQUEANTE', 'IMPORTANTE', 'EXPLORATORIA']).toContain(p.prioridadeNivel);
        expect(p.justificativaPrioridade).toBeDefined();
        expect(p.justificativaPrioridade!.length).toBeGreaterThan(10);

        // 2. Camada para o analista
        expect(p.oQueContratantePediu).toBeDefined();
        expect(p.oQueContratantePediu!.length).toBeGreaterThan(5);
        expect(p.oQueAindaPrecisamosSaber).toBeDefined();
        expect(p.oQueAindaPrecisamosSaber!.length).toBeGreaterThan(5);
        expect(p.porQueImportaAnalise).toBeDefined();
        expect(p.porQueImportaAnalise!.length).toBeGreaterThan(15);
        expect(p.oQueRespostaVaiDefinir).toBeDefined();
        expect(p.oQueRespostaVaiDefinir!.length).toBeGreaterThan(10);

        // 3. Camada para o contratante
        expect(p.perguntaSugeridaContratante).toBeDefined();
        expect(p.perguntaSugeridaContratante!.length).toBeGreaterThan(10);
        expect(p.comoExplicarContratante).toBeDefined();
        expect(p.comoExplicarContratante!.length).toBeGreaterThan(15);

        // 4. Rastreabilidade com requisito
        expect(p.requisitoRelacionadoId).toBeDefined();
      }
    });

    it('17. Regra Estrita de Linguagem: Tolerância zero a jargões técnicos na comunicação destinada ao contratante', () => {
      const resultado = IntakeAnalysisEngine.analisar(inputPiloto);
      const perguntas = resultado.lacunas.perguntasPriorizadas;

      // Jargões expressamente proibidos pelo contratante:
      const termosProibidos = [
        'granularidade',
        'tabela fato',
        'dimensao',
        'dimensão',
        'dimensões',
        'cardinalidade',
        'dax',
        'expurgo',
        'temporalidade',
        'modelagem dimensional',
        'medida',
        'schema',
        'agregacao',
        'agregação',
        'agregações',
      ];

      for (const p of perguntas) {
        const textoPergunta = (p.perguntaSugeridaContratante || '').toLowerCase();
        const textoExplicacao = (p.comoExplicarContratante || '').toLowerCase();

        for (const termo of termosProibidos) {
          const regexTermo = new RegExp(`\\b${termo}\\b`, 'i');
          expect(
            regexTermo.test(textoPergunta),
            `Jargão proibido "${termo}" encontrado em perguntaSugeridaContratante da pergunta "${p.id}": "${p.perguntaSugeridaContratante}"`
          ).toBe(false);

          expect(
            regexTermo.test(textoExplicacao),
            `Jargão proibido "${termo}" encontrado em comoExplicarContratante da pergunta "${p.id}": "${p.comoExplicarContratante}"`
          ).toBe(false);
        }
      }
    });

    it('18. Exemplos canônicos de comportamento de perguntas e explicações em linguagem simples', () => {
      const resultado = IntakeAnalysisEngine.analisar(inputPiloto);
      const perguntas = resultado.lacunas.perguntasPriorizadas;

      // 1. Exemplo do Ranking de Produtos
      const pergRanking = perguntas.find((p) => p.id === 'intake_perg_criterio_ranking_produtos');
      expect(pergRanking).toBeDefined();
      expect(pergRanking?.perguntaSugeridaContratante).toMatch(/quantidade vendida.*valor das vendas|vendem mais unidades.*dinheiro em vendas/i);
      expect(pergRanking?.comoExplicarContratante).toMatch(/Um produto.*vender muitas unidades e gerar menos dinheiro/i);

      // 2. Exemplo de Expurgo / Exceções
      const pergExcecoes = perguntas.find((p) => p.id === 'intake_perg_excecoes');
      expect(pergExcecoes).toBeDefined();
      expect(pergExcecoes?.perguntaSugeridaContratante).toContain('vendas canceladas, devoluções, estornos ou registros de teste');
      expect(pergExcecoes?.comoExplicarContratante).toContain('esses registros podem alterar os números apresentados');

      // 3. Exemplo de Granularidade
      const pergGranularidade = perguntas.find((p) => p.id === 'intake_perg_granularidade');
      expect(pergGranularidade).toBeDefined();
      expect(pergGranularidade?.perguntaSugeridaContratante).toContain('totais por dia ou mês ou também gostaria de conseguir chegar ao detalhe');
      expect(pergGranularidade?.comoExplicarContratante).toContain('até que nível de detalhe o painel precisa permitir investigar');
    });

    it('19. Preparar perguntas para o contratante: deve gerar roteiro com apenas perguntas selecionadas', () => {
      const resultado = IntakeAnalysisEngine.analisar(inputPiloto);
      const todas = resultado.lacunas.perguntasPriorizadas;

      // Caso 1: Nenhuma selecionada
      const roteiroVazio = IntakeAnalysisEngine.gerarRoteiroContratante([]);
      expect(roteiroVazio).toContain('Nenhuma pergunta foi selecionada');

      // Caso 2: Apenas 2 perguntas selecionadas
      const selecionadas = [todas[0], todas[1]];
      const roteiro = IntakeAnalysisEngine.gerarRoteiroContratante(selecionadas, 'Painel Comercial 2026');

      expect(roteiro).toContain('Roteiro de Alinhamento com o Contratante');
      expect(roteiro).toContain('Painel Comercial 2026');
      expect(roteiro).toContain('1. ' + (selecionadas[0].perguntaSugeridaContratante || selecionadas[0].pergunta));
      expect(roteiro).toContain('2. ' + (selecionadas[1].perguntaSugeridaContratante || selecionadas[1].pergunta));

      // Perguntas NÃO selecionadas não devem estar no roteiro
      if (todas.length > 2) {
        const naoSelecionada = todas[2];
        const textoNaoSelecionada = naoSelecionada.perguntaSugeridaContratante || naoSelecionada.pergunta;
        expect(roteiro).not.toContain(textoNaoSelecionada);
      }
    });

    it('20. Preservação integral do Pedido Original e conformidade epistêmica', () => {
      const resultado = IntakeAnalysisEngine.analisar(inputPiloto);

      // Preservação byte-for-byte
      expect(resultado.solicitacaoOriginal).toBe(inputPiloto);
      expect(resultado.fatos.entregaveisExplicitamenteSolicitados[0].nome).toBe('Dashboard Interativo');
      expect(resultado.fatos.ativosDadosMencionados[0].termoVerbatim).toContain('planilha');
    });
  });

  // ==========================================================================
  // FEEDBACK OPERACIONAL #005 — RACIOCÍNIO AUMENTADO E INTEGRIDADE EPISTEMOLÓGICA
  // ==========================================================================
  describe('Feedback Operacional #005 — Regressão Obrigatória Canônica', () => {
    const inputCanonico005 =
      'Preciso de um painel para entender como estão as vendas da empresa. Tenho uma planilha com as vendas e queria saber quais produtos estão vendendo mais, quais estão vendendo menos e como o faturamento está evoluindo. Também queria conseguir comparar as filiais. Preciso apresentar isso para a direção na próxima reunião.';

    it('Validação determinística dos 20 critérios obrigatórios', () => {
      const resultado = IntakeAnalysisEngine.analisar(inputCanonico005);

      // 1. Pedido Original preservado verbatim byte-a-byte
      expect(resultado.solicitacaoOriginal).toBe(inputCanonico005);

      // 2. Nenhuma falsa citação: qualquer citação literal deve existir verbatim no Pedido Original
      for (const req of resultado.requisitosClassificados) {
        if (req.origemPedidoOriginal !== null) {
          expect(
            inputCanonico005.includes(req.origemPedidoOriginal),
            `Falsa citação detectada no requisito ${req.id}: "${req.origemPedidoOriginal}" não existe no Pedido Original`
          ).toBe(true);
        }
      }
      for (const p of resultado.lacunas.perguntasPriorizadas) {
        if (p.oQueContratantePediu && p.oQueContratantePediu !== 'Não informado no Pedido Original.') {
          expect(
            inputCanonico005.includes(p.oQueContratantePediu),
            `Falsa citação detectada na pergunta ${p.id}: "${p.oQueContratantePediu}" não existe no Pedido Original`
          ).toBe(true);
        }
      }
      // Checagem específica: a frase falsa do piloto NÃO deve estar atribuída em lugar nenhum
      const stringified = JSON.stringify(resultado);
      expect(stringified).not.toContain('não sei exatamente quais colunas ela tem');

      // 3. Power BI NÃO atribuído ao contratante (trata-se de Solução Técnica Proposta)
      const reqPowerBi = resultado.requisitosClassificados.find((r) => r.id === 'req_solucao_powerbi');
      expect(reqPowerBi).toBeDefined();
      expect(reqPowerBi?.classificacao).toBe('SOLUCAO_TECNICA_PROPOSTA');
      expect(reqPowerBi?.conceito).toBe('SOLUCAO_TECNICA');
      expect(reqPowerBi?.origemPedidoOriginal).toBeNull();
      expect(reqPowerBi?.titulo).toContain('Solução Técnica Proposta pelo Workspace: Power BI');
      expect(reqPowerBi?.justificativaClassificacao).toContain('O contratante solicitou um painel, sem especificar ferramenta');

      // 4. Painel reconhecido como requisito de negócio essencial
      const reqPainel = resultado.requisitosClassificados.find((r) => r.id === 'req_painel_visual');
      expect(reqPainel).toBeDefined();
      expect(reqPainel?.classificacao).toBe('REQUISITO_ESSENCIAL');
      expect(reqPainel?.conceito).toBe('REQUISITO_NEGOCIO');
      expect(reqPainel?.titulo).toBe('Painel para Análise das Vendas');
      expect(reqPainel?.origemPedidoOriginal).not.toBeNull();
      expect(inputCanonico005).toContain(reqPainel!.origemPedidoOriginal!);

      // 5. Evolução do faturamento reconhecida como requisito de negócio essencial
      const reqFaturamento = resultado.requisitosClassificados.find((r) => r.id === 'req_evolucao_faturamento');
      expect(reqFaturamento).toBeDefined();
      expect(reqFaturamento?.classificacao).toBe('REQUISITO_ESSENCIAL');
      expect(reqFaturamento?.conceito).toBe('REQUISITO_NEGOCIO');
      expect(reqFaturamento?.titulo).toBe('Evolução do Faturamento ao Longo do Tempo');
      expect(reqFaturamento?.origemPedidoOriginal).not.toBeNull();
      expect(inputCanonico005).toContain(reqFaturamento!.origemPedidoOriginal!);

      // 6. MoM / YoY tratados como opções analíticas adicionais
      const reqMoM = resultado.requisitosClassificados.find((r) => r.id === 'req_opcoes_evolucao_faturamento');
      expect(reqMoM).toBeDefined();
      expect(reqMoM?.classificacao).toBe('SUGESTAO_ANALITICA_ADICIONAL');
      expect(reqMoM?.conceito).toBe('SUGESTAO_ANALITICA');
      expect(reqMoM?.origemPedidoOriginal).toBeNull();

      // 7. Comparação entre filiais reconhecida como requisito de negócio essencial
      const reqFiliais = resultado.requisitosClassificados.find((r) => r.id === 'req_comparativo_filiais');
      expect(reqFiliais).toBeDefined();
      expect(reqFiliais?.classificacao).toBe('REQUISITO_ESSENCIAL');
      expect(reqFiliais?.conceito).toBe('REQUISITO_NEGOCIO');
      expect(reqFiliais?.origemPedidoOriginal).not.toBeNull();
      expect(inputCanonico005).toContain(reqFiliais!.origemPedidoOriginal!);

      // 8. Formas específicas de comparação separadas como definição pendente
      const reqFormasFiliais = resultado.requisitosClassificados.find((r) => r.id === 'req_formas_comparacao_filiais');
      expect(reqFormasFiliais).toBeDefined();
      expect(reqFormasFiliais?.classificacao).toBe('REQUISITO_PENDENTE_ESCLARECIMENTO');
      expect(reqFormasFiliais?.conceito).toBe('DEFINICAO_PENDENTE');
      expect(reqFormasFiliais?.origemPedidoOriginal).toBeNull();

      // 9. Produtos mais/menos reconhecidos como requisito com definição pendente
      const reqRanking = resultado.requisitosClassificados.find((r) => r.id === 'req_ranking_produtos');
      expect(reqRanking).toBeDefined();
      expect(reqRanking?.classificacao).toBe('REQUISITO_PENDENTE_ESCLARECIMENTO');
      expect(reqRanking?.conceito).toBe('DEFINICAO_PENDENTE');
      expect(reqRanking?.origemPedidoOriginal).not.toBeNull();
      expect(inputCanonico005).toContain(reqRanking!.origemPedidoOriginal!);

      // 10. Quantidade não promovida silenciosamente a requisito nem mero descarte
      const pergRanking = resultado.lacunas.perguntasPriorizadas.find((p) => p.id === 'intake_perg_criterio_ranking_produtos');
      expect(pergRanking).toBeDefined();
      expect(pergRanking?.comoPensarComoAnalista).toMatch(/antes de criar um ranking, determinar qual pergunta de negócio esse ranking precisa responder/i);
      expect(pergRanking?.perguntaSugeridaContratante).toContain('quantidade vendida, pelo valor das vendas ou pelas duas informações');

      // 11. Faturamento não substituído silenciosamente por receita
      const fatKpi = resultado.fatos.indicadoresExplicitamenteMencionados.find((k) => k.nome === 'Faturamento');
      expect(fatKpi).toBeDefined();
      const temReceitaSilenciosa = resultado.fatos.indicadoresExplicitamenteMencionados.some((k) => k.nome === 'Receita');
      expect(temReceitaSilenciosa).toBe(false);

      // 12. Pareto não presumido como 80/20 real
      const kpiPareto = resultado.inferencias.indicadoresSugeridos.find((k) => k.nome.includes('Pareto'));
      expect(kpiPareto).toBeDefined();
      expect(kpiPareto?.ehKpi).toBe(false);
      expect(kpiPareto?.justificativaKpi).toContain('sem presunção a priori da regra 80/20');
      expect(kpiPareto?.oQuePrecisaConfirmar).toContain('só poderá ser calculada a partir dos dados reais');

      // 13. Métricas diferenciadas de KPIs
      for (const kpiSugerido of resultado.inferencias.indicadoresSugeridos) {
        expect(kpiSugerido.ehKpi).toBe(false);
        expect(kpiSugerido.justificativaKpi).toBeDefined();
        expect(kpiSugerido.justificativaKpi!.length).toBeGreaterThan(15);
      }

      // 14. Cards pedagógicos presentes (8 campos + 'Como pensar como analista')
      for (const p of resultado.lacunas.perguntasPriorizadas) {
        expect(p.comoPensarComoAnalista).toBeDefined();
        expect(p.comoPensarComoAnalista!.length).toBeGreaterThan(10);
        expect(p.porQuePrecisoPerguntar).toBeDefined();
        expect(p.oQuePodeDarErradoSeNaoPerguntar).toBeDefined();
        expect(p.oQueRespostaVaiMudar).toBeDefined();
      }

      // 15. Linguagem simples ao contratante
      for (const p of resultado.lacunas.perguntasPriorizadas) {
        expect(p.perguntaSugeridaContratante).toBeDefined();
        expect(p.comoExplicarContratante).toBeDefined();
        expect(p.comoExplicarContratante!.toLowerCase()).not.toContain('dax');
        expect(p.comoExplicarContratante!.toLowerCase()).not.toContain('tabela fato');
      }

      // 16. Explicação técnica segregada
      for (const p of resultado.lacunas.perguntasPriorizadas) {
        expect(p.entendaTecnicamente).toBeDefined();
        expect(p.entendaTecnicamente!.length).toBeGreaterThan(10);
      }

      // 17. Perguntar × Investigar × Decisão técnica diferenciados
      const tiposResolucao = new Set(resultado.lacunas.perguntasPriorizadas.map((p) => p.tipoResolucao));
      expect(tiposResolucao.has('PERGUNTAR_CONTRATANTE')).toBe(true);
      expect(tiposResolucao.has('INVESTIGAR_DADOS')).toBe(true);

      const pergColunas = resultado.lacunas.perguntasPriorizadas.find((p) => p.id === 'intake_perg_colunas_planilha');
      expect(pergColunas?.tipoResolucao).toBe('INVESTIGAR_DADOS');

      // 18. Sugestões não promovidas automaticamente
      const sugestoesRequisitos = resultado.requisitosClassificados.filter((r) => r.classificacao === 'SUGESTAO_ANALITICA_ADICIONAL');
      expect(sugestoesRequisitos.length).toBeGreaterThan(0);
      for (const sug of sugestoesRequisitos) {
        expect(sug.conceito).toBe('SUGESTAO_ANALITICA');
        expect(sug.origemPedidoOriginal).toBeNull();
      }

      // 19. Próxima ação recomendada explicável com estado qualitativo sem score
      expect(resultado.sinteseProximaAcao).toBeDefined();
      const sintese = resultado.sinteseProximaAcao!;
      expect(sintese.oQueJaSabemos.length).toBeGreaterThan(0);
      expect(sintese.oQueAindaPrecisamosEsclarecer.length).toBeGreaterThan(0);
      expect(sintese.oQuePodemosInvestigarNosDados.length).toBeGreaterThan(0);
      expect(sintese.oQueAindaNaoDevemosDefinir.length).toBeGreaterThan(0);
      expect(sintese.estadoProntidao.estado).toBe('AINDA_PRECISAMOS_ESCLARECER');
      expect(sintese.estadoProntidao.motivo.length).toBeGreaterThan(15);
      expect(sintese.proximaAcaoRecomendada.acao.length).toBeGreaterThan(10);
      expect(sintese.proximaAcaoRecomendada.porQueEstaAcao.length).toBeGreaterThan(10);

      // 20. Nenhum Projeto/Demanda criado durante a regressão (análise é pura e determinística em memória)
      expect(resultado.proposta).toBeDefined();
      expect(resultado.metadados.analisador).toBe('TIER_1_DETERMINISTICO');

      // 21. Objetivo em linguagem natural simplificada e fiel ao pedido
      const inputCanonico =
        'Preciso de um painel para entender como estão as vendas da empresa. Tenho uma planilha com as vendas e queria saber quais produtos estão vendendo mais, quais estão vendendo menos e como o faturamento está evoluindo. Também queria conseguir comparar as filiais. Preciso apresentar isso para a direção na próxima reunião.';
      const resCanonico = IntakeAnalysisEngine.analisar(inputCanonico);
      expect(resCanonico.proposta.demandaSugerida.objetivoNatural).toBe(
        'Criar um painel que permita acompanhar vendas e faturamento, identificar produtos com maior e menor desempenho e comparar as filiais.'
      );
      expect(resCanonico.proposta.demandaSugerida.objetivoInicial).toBe(resCanonico.inferencias.objetivoProvavel);
    });
  });
});


