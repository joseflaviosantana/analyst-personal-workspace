/**
 * src/core/domain/intake/intake-analysis-engine.ts
 *
 * Motor Determinístico e Heurístico do Intake Inteligente (Tier 1 — Subgate 1).
 *
 * Características Arquiteturais:
 * 1. 100% Local, Determinístico e Sem Custo: Zero dependência de rede, API externa ou credenciais pagas.
 * 2. Rigor Epistêmico Estrito: Fatos, Inferências, Lacunas e Propostas são rigorosamente segregados.
 * 3. Preservação Factual Byte-for-Byte: A solicitação original nunca é reescrita, truncada ou alterada.
 * 4. Extensibilidade para Tier 2: Implementa IIntakeAnalyzer, permitindo acoplamento futuro de analisador semântico.
 */

import {
  IIntakeAnalyzer,
  ResultadoAnaliseIntake,
  DominioNegocioIntake,
  AtivoMencionado,
  JanelaTemporalMencionada,
  EntregavelIdentificado,
  IndicadorKpiIdentificado,
  PerguntaClarificacaoIntake,
  PropostaEstruturaOperacional,
  ItemRequisitoAnalisado,
  SinteseProximaAcaoIntake,
  EstadoProntidaoIntake,
  TipoResolucaoLacuna,
  TipoConceitoAnalitico,
} from './intake-types';

export class IntakeAnalysisEngine implements IIntakeAnalyzer {
  private static readonly VERSAO_MOTOR = '1.1.0-tier1-deterministic';

  /**
   * Ponto de entrada estático para conveniência e facilidade de teste
   */
  static analisar(solicitacaoBruta: string): ResultadoAnaliseIntake {
    return new IntakeAnalysisEngine().analisar(solicitacaoBruta);
  }

  /**
   * Executa a análise determinística da solicitação bruta
   */
  analisar(solicitacaoBruta: string): ResultadoAnaliseIntake {
    // 1. Preservação factual byte-for-byte da solicitação original
    const original = solicitacaoBruta;
    const textoLimpo = solicitacaoBruta.trim();
    // Mapeamento 1-a-1 de caracteres sem acento para busca via regex com limites de palavras (\b)
    const textoSemAcento = this.removerAcentosPreservandoComprimento(textoLimpo.toLowerCase());

    const comprimento = original.length;
    const ehMuitoCurto = textoLimpo.length > 0 && textoLimpo.length < 25;

    // 2. Extração de Fatos Diretos
    const ativosDados = this.detectarAtivosDados(original, textoSemAcento);
    const janelaTemporal = this.detectarJanelaTemporal(original, textoSemAcento);
    const prazoMencionado = this.detectarPrazoMencionado(original, textoSemAcento);
    const entregaveisExplicitados = this.detectarEntregaveisExplicitados(original, textoSemAcento);
    const kpisExplicitados = this.detectarKpisExplicitados(original, textoSemAcento);

    // 3. Inferências e Interpretação do Copiloto
    const dominio = this.detectarDominio(textoSemAcento);
    const dimensoes = this.detectarDimensoes(textoSemAcento, dominio);
    const entregaveisInferidos = this.inferirEntregaveis(entregaveisExplicitados, dominio, textoSemAcento);
    const kpisSugeridos = this.inferirKpisSugeridos(kpisExplicitados, dominio);

    const { problemaAparente, objetivoProvavel, contextoIdentificado } = this.inferirProblemaEObjetivo(
      original,
      textoSemAcento,
      dominio,
      dimensoes,
      kpisExplicitados
    );

    // Avaliação de Ambiguidade
    const ehAmbiguo = this.avaliarAmbiguidade(textoSemAcento, dominio, kpisExplicitados, ativosDados);

    // 4. Mapeamento de Lacunas e Formulação de Perguntas Priorizadas
    const { itensFaltantes, perguntasPriorizadas } = this.identificarLacunasEPerguntas({
      original,
      textoSemAcento,
      dominio,
      ativosDados,
      janelaTemporal,
      prazoMencionado,
      kpisExplicitados,
      ehAmbiguo,
      ehMuitoCurto,
    });

    // 5. Classificação dos Requisitos (Feedbacks #004 e #005)
    const requisitosClassificados = this.classificarRequisitos({
      original,
      textoSemAcento,
      fatos: {
        ativosDadosMencionados: ativosDados,
        periodoJanelaTemporalMencionada: janelaTemporal,
        prazoMencionado,
        entregaveisExplicitamenteSolicitados: entregaveisExplicitados,
        indicadoresExplicitamenteMencionados: kpisExplicitados,
      },
      inferencias: {
        dominioNegocio: dominio,
        problemaAparente,
        objetivoProvavel,
        contextoIdentificado,
        dimensoesAnaliticasIdentificadas: dimensoes,
        entregaveisInferidos,
        indicadoresSugeridos: kpisSugeridos,
      },
      perguntas: perguntasPriorizadas,
    });

    // 6. Proposta de Estrutura Inicial (Projeto + Demanda + Perguntas Rascunho)
    const proposta = this.gerarPropostaEstrutural({
      dominio,
      problemaAparente,
      objetivoProvavel,
      contextoIdentificado,
      prazoMencionado,
      perguntasPriorizadas,
      textoSemAcento,
      kpisExplicitados,
      dimensoes,
    });

    // 7. Síntese Analítica, Prontidão Qualitativa e Próxima Ação (Feedback #005)
    const sinteseProximaAcao = this.gerarSinteseEProximaAcao({
      solicitacaoOriginal: original,
      fatos: {
        ativosDadosMencionados: ativosDados,
        periodoJanelaTemporalMencionada: janelaTemporal,
        prazoMencionado,
        entregaveisExplicitamenteSolicitados: entregaveisExplicitados,
        indicadoresExplicitamenteMencionados: kpisExplicitados,
      },
      inferencias: {
        dominioNegocio: dominio,
        problemaAparente,
        objetivoProvavel,
        contextoIdentificado,
        dimensoesAnaliticasIdentificadas: dimensoes,
        entregaveisInferidos,
        indicadoresSugeridos: kpisSugeridos,
      },
      requisitos: requisitosClassificados,
      perguntas: perguntasPriorizadas,
    });

    return {
      solicitacaoOriginal: original,
      fatos: {
        ativosDadosMencionados: ativosDados,
        periodoJanelaTemporalMencionada: janelaTemporal,
        prazoMencionado,
        entregaveisExplicitamenteSolicitados: entregaveisExplicitados,
        indicadoresExplicitamenteMencionados: kpisExplicitados,
      },
      inferencias: {
        dominioNegocio: dominio,
        problemaAparente,
        objetivoProvavel,
        contextoIdentificado,
        dimensoesAnaliticasIdentificadas: dimensoes,
        entregaveisInferidos,
        indicadoresSugeridos: kpisSugeridos,
      },
      lacunas: {
        itensFaltantes,
        perguntasPriorizadas,
      },
      requisitosClassificados,
      proposta,
      sinteseProximaAcao,
      metadados: {
        analisador: 'TIER_1_DETERMINISTICO',
        versaoMotor: IntakeAnalysisEngine.VERSAO_MOTOR,
        executadoEm: new Date().toISOString(),
        comprimentoTextoOriginal: comprimento,
        ehAmbiguo,
        ehMuitoCurto,
        temDadosIdentificados: ativosDados.length > 0,
      },
    };
  }

  // ==========================================================================
  // NORMALIZAÇÃO 1-PARA-1 PARA PRESERVAR ÍNDICES EXATOS DO TEXTO ORIGINAL
  // ==========================================================================

  private removerAcentosPreservandoComprimento(texto: string): string {
    const mapa: Record<string, string> = {
      á: 'a', à: 'a', ã: 'a', â: 'a', ä: 'a',
      é: 'e', è: 'e', ê: 'e', ë: 'e',
      í: 'i', ì: 'i', î: 'i', ï: 'i',
      ó: 'o', ò: 'o', õ: 'o', ô: 'o', ö: 'o',
      ú: 'u', ù: 'u', û: 'u', ü: 'u',
      ç: 'c', ñ: 'n',
    };
    return texto.replace(/[áàãâäéèêëíìîïóòõôöúùûüçñ]/gi, (c) => mapa[c.toLowerCase()] || c);
  }

  // ==========================================================================
  // DETECÇÃO DE FATOS (EXTRAÇÃO DETERMINÍSTICA DIRETA)
  // ==========================================================================

  private detectarAtivosDados(original: string, semAcento: string): AtivoMencionado[] {
    const ativos: AtivoMencionado[] = [];

    // Planilha Excel
    const matchPlanilha = semAcento.match(/\b(planilha[s]?|excel|pasta[s]? de trabalho|xlsx?|xls)\b/);
    if (matchPlanilha && matchPlanilha.index !== undefined) {
      const termo = original.slice(matchPlanilha.index, matchPlanilha.index + matchPlanilha[0].length);
      ativos.push({
        termoVerbatim: termo,
        tipoDetectado: 'PLANILHA',
        descricao: 'Arquivo tabular de planilha eletrônica (Excel / Calc / Google Sheets).',
      });
    }

    // CSV / Arquivo Texto Tabular
    const matchCsv = semAcento.match(/\b(csvs?|arquivo[s]? csv|tabela[s]? de texto|separado por virgula)\b/);
    if (matchCsv && matchCsv.index !== undefined) {
      const termo = original.slice(matchCsv.index, matchCsv.index + matchCsv[0].length);
      ativos.push({
        termoVerbatim: termo,
        tipoDetectado: 'CSV',
        descricao: 'Arquivo de valores separados por delimitador (CSV / TSV).',
      });
    }

    // Banco de Dados / SQL / DW
    const matchDb = semAcento.match(/\b(banco de dados|tabela[s]? sql|postgres|mysql|sql server|oracle|dw|data warehouse|bigquery)\b/);
    if (matchDb && matchDb.index !== undefined) {
      const termo = original.slice(matchDb.index, matchDb.index + matchDb[0].length);
      ativos.push({
        termoVerbatim: termo,
        tipoDetectado: 'BANCO_DADOS',
        descricao: 'Repositório relacional ou Data Warehouse analítico.',
      });
    }

    // Sistemas / ERP / CRM
    const matchSistema = semAcento.match(/\b(erp|crm|sistema[s]?|sap|protheus|totvs|salesforce|hubspot|omie)\b/);
    if (matchSistema && matchSistema.index !== undefined) {
      const termo = original.slice(matchSistema.index, matchSistema.index + matchSistema[0].length);
      ativos.push({
        termoVerbatim: termo,
        tipoDetectado: 'SISTEMA',
        descricao: 'Sistema transacional corporativo de origem.',
      });
    }

    return ativos;
  }

  private detectarJanelaTemporal(original: string, semAcento: string): JanelaTemporalMencionada | null {
    // Menções a "últimos meses", "último ano", etc.
    const matchUltimosMeses = semAcento.match(/\b(ultimos?\s+\d*\s*meses?|ultimo\s+mes|mes\s+passado)\b/);
    if (matchUltimosMeses && matchUltimosMeses.index !== undefined) {
      const termo = original.slice(matchUltimosMeses.index, matchUltimosMeses.index + matchUltimosMeses[0].length);
      return {
        termoVerbatim: termo,
        tipo: 'MESES',
        interpretacao: 'Janela móvel recente delimitada em meses.',
      };
    }

    // Anos explícitos (ex: 2024, 2025, 2024 a 2026)
    const matchAnos = semAcento.match(/\b(202\d(\s*(a|ate|-)\s*202\d)?)\b/);
    if (matchAnos && matchAnos.index !== undefined) {
      const termo = original.slice(matchAnos.index, matchAnos.index + matchAnos[0].length);
      return {
        termoVerbatim: termo,
        tipo: 'ANO',
        interpretacao: `Período histórico referenciando anos civis (${termo}).`,
      };
    }

    // Período relativo genérico
    const matchRelativo = semAcento.match(/\b(ano corrente|ano atual|ano passado|este ano|safra atual|semestre passado)\b/);
    if (matchRelativo && matchRelativo.index !== undefined) {
      const termo = original.slice(matchRelativo.index, matchRelativo.index + matchRelativo[0].length);
      return {
        termoVerbatim: termo,
        tipo: 'RELATIVO',
        interpretacao: `Referência temporal relativa (${termo}).`,
      };
    }

    return null;
  }

  private detectarPrazoMencionado(original: string, semAcento: string): string | null {
    const matchPrazo = semAcento.match(
      /\b(ate\s+(sexta|segunda|terca|quarta|quinta|sabado|domingo|amanha|hoje|\d{1,2}\/\d{1,2}(\/\d{2,4})?|fim de semana|final do mes))\b/
    );
    if (matchPrazo && matchPrazo.index !== undefined) {
      return original.slice(matchPrazo.index, matchPrazo.index + matchPrazo[0].length);
    }

    const matchUrgente = semAcento.match(/\b(urgente|o quanto antes|prazo imediato)\b/);
    if (matchUrgente && matchUrgente.index !== undefined) {
      return original.slice(matchUrgente.index, matchUrgente.index + matchUrgente[0].length);
    }

    const matchMarco = semAcento.match(/\b(proxima reuniao|proxima apresentacao|proximo comite|reuniao da direcao)\b/);
    if (matchMarco && matchMarco.index !== undefined) {
      return original.slice(matchMarco.index, matchMarco.index + matchMarco[0].length);
    }

    return null;
  }

  private detectarEntregaveisExplicitados(original: string, semAcento: string): EntregavelIdentificado[] {
    const entregaveis: EntregavelIdentificado[] = [];

    if (/\b(dashboard|painel|painel gerencial|bi)\b/.test(semAcento)) {
      entregaveis.push({
        nome: 'Dashboard Interativo',
        descricao: 'Painel visual interativo com filtros e KPIs executivos.',
        tipo: 'DASHBOARD',
        classificacao: 'FATO',
      });
    }

    if (/\b(relatorio|relatorios|extrato|dossie|documento consolidado)\b/.test(semAcento)) {
      entregaveis.push({
        nome: 'Relatório Analítico',
        descricao: 'Relatório formal de diagnóstico e acompanhamento de métricas.',
        tipo: 'RELATORIO',
        classificacao: 'FATO',
      });
    }

    if (/\b(planilha modelo|base consolidada|planilha final)\b/.test(semAcento)) {
      entregaveis.push({
        nome: 'Planilha Consolidada',
        descricao: 'Arquivo tabular higienizado e formatado para consumo do usuário.',
        tipo: 'PLANILHA',
        classificacao: 'FATO',
      });
    }

    return entregaveis;
  }

  private detectarKpisExplicitados(original: string, semAcento: string): IndicadorKpiIdentificado[] {
    const kpis: IndicadorKpiIdentificado[] = [];
    const nomesAdicionados = new Set<string>();

    const registrar = (nome: string, descricao: string) => {
      const chave = nome.toLowerCase();
      if (!nomesAdicionados.has(chave)) {
        nomesAdicionados.add(chave);
        kpis.push({
          nome,
          descricao,
          classificacao: 'FATO',
        });
      }
    };

    // Faturamento / Receita: tolerância zero a qualificadores não declarados
    if (/\b(faturamento bruto|receita bruta)\b/.test(semAcento)) {
      registrar('Faturamento Bruto', 'Receita bruta explicitamente declarada com qualificador no pedido original.');
    } else if (/\b(faturamento liquido|receita liquida)\b/.test(semAcento)) {
      registrar('Faturamento Líquido', 'Receita líquida explicitamente declarada com qualificador no pedido original.');
    } else if (/\bfaturamento\b/.test(semAcento)) {
      registrar('Faturamento', 'Menção literal a faturamento (sem qualificador bruto/líquido no pedido original).');
    } else if (/\breceita\b/.test(semAcento)) {
      registrar('Receita', 'Menção literal a receita financeira.');
    }

    // Vendas: tolerância zero a qualificadores não declarados
    if (/\b(vendas? totais|venda total)\b/.test(semAcento)) {
      registrar('Vendas Totais', 'Total de vendas explicitamente qualificado como total no texto.');
    } else if (/\bvendas?\b/.test(semAcento)) {
      registrar('Vendas', 'Menção literal a vendas declarada pelo usuário.');
    }

    // Variação / Queda
    if (/\b(queda|queda nas? vendas?|declinio|cairam|caiu)\b/.test(semAcento)) {
      registrar('Variação / Queda de Desempenho', 'Medição de retração ou queda declarada no texto.');
    }

    // Demais métricas do catálogo sem qualificadores artificiais
    if (/\b(inadimplencia|atrasos? de pagamento)\b/.test(semAcento)) {
      registrar('Inadimplência', 'Valores ou clientes com pagamentos em atraso.');
    }
    if (/\b(fluxo de caixa|saldo de caixa)\b/.test(semAcento)) {
      registrar('Fluxo de Caixa', 'Entradas e saídas de caixa operacionais.');
    }
    if (/\b(dre|dre gerencial)\b/.test(semAcento)) {
      registrar('DRE Gerencial', 'Demonstrativo do resultado do exercício.');
    }
    if (/\b(custos?|despesas?)\b/.test(semAcento)) {
      registrar('Custos e Despesas', 'Gastos operacionais ou fixos apurados.');
    }
    if (/\b(margem|lucro|lucratividade)\b/.test(semAcento)) {
      registrar('Margem / Lucro', 'Resultado líquido ou percentual sobre a receita.');
    }
    if (/\b(ruptura|falta de produto|falta de estoque)\b/.test(semAcento)) {
      registrar('Ruptura de Estoque', 'Itens em falta ou indisponíveis para expedição.');
    }
    if (/\b(giro de estoque|giro)\b/.test(semAcento)) {
      registrar('Giro de Estoque', 'Velocidade de renovação do estoque.');
    }
    if (/\b(turnover|rotatividade|demissoes?)\b/.test(semAcento)) {
      registrar('Turnover (Rotatividade)', 'Taxa de rotatividade de colaboradores.');
    }
    if (/\b(absenteismo|faltas? ao trabalho)\b/.test(semAcento)) {
      registrar('Absenteísmo', 'Percentual de faltas e ausências no período.');
    }
    if (/\b(tempo de espera|fila|tempo de atendimento)\b/.test(semAcento)) {
      registrar('Tempo de Espera', 'Tempo médio decorrido até o atendimento.');
    }
    if (/\b(vacinacao|cobertura vacinal)\b/.test(semAcento)) {
      registrar('Cobertura Vacinal', 'Percentual da população-alvo imunizada.');
    }

    return kpis;
  }

  // ==========================================================================
  // INFERÊNCIAS ANALÍTICAS DO COPILOTO (SEGREGADAS DOS FATOS)
  // ==========================================================================

  private detectarDominio(semAcento: string): DominioNegocioIntake {
    const contar = (termos: string[]) => {
      let score = 0;
      for (const t of termos) {
        const matches = semAcento.match(new RegExp(`\\b${t}\\b`, 'g'));
        if (matches) {
          score += matches.length;
        }
      }
      return score;
    };

    const scoreVendas = contar([
      'venda', 'vendas', 'faturamento', 'comercial', 'ticket', 'pdv', 'conversao', 'churn', 'loja', 'lojas',
    ]) * 2 + (/\bprodutos?\b/.test(semAcento) ? 1 : 0);

    const scoreFinanceiro = contar([
      'financeiro', 'financeira', 'caixa', 'fluxo de caixa', 'dre', 'inadimplencia', 'custo', 'custos',
      'despesa', 'despesas', 'lucro', 'margem', 'margens', 'conciliacao', 'conciliar',
    ]) * 3;

    const scoreEstoque = contar([
      'estoque', 'estoques', 'armazem', 'armazens', 'logistica', 'logistico', 'ruptura', 'rupturas',
      'giro', 'sku', 'skus', 'deposito', 'depositos', 'frete', 'expedicao',
    ]) * 3;

    const scoreRH = contar([
      'rh', 'recursos humanos', 'colaborador', 'colaboradores', 'funcionario', 'funcionarios',
      'headcount', 'turnover', 'rotatividade', 'absenteismo', 'salario', 'salarios', 'demissao', 'admissao',
    ]) * 3;

    const scoreSaude = contar([
      'saude', 'paciente', 'pacientes', 'atendimento', 'atendimentos', 'ubs', 'leito', 'leitos',
      'vacina', 'vacinacao', 'hospital', 'hospitais', 'medico', 'medicos', 'enfermaria',
    ]) * 3;

    const ranking = [
      { dominio: 'ESTOQUE_LOGISTICA' as DominioNegocioIntake, score: scoreEstoque },
      { dominio: 'FINANCEIRO' as DominioNegocioIntake, score: scoreFinanceiro },
      { dominio: 'RH_PESSOAS' as DominioNegocioIntake, score: scoreRH },
      { dominio: 'SAUDE_PUBLICA' as DominioNegocioIntake, score: scoreSaude },
      { dominio: 'VENDAS' as DominioNegocioIntake, score: scoreVendas },
    ];

    ranking.sort((a, b) => b.score - a.score);

    if (ranking[0].score > 0) {
      return ranking[0].dominio;
    }

    return 'GERAL';
  }

  private detectarDimensoes(semAcento: string, dominio: DominioNegocioIntake): string[] {
    const dimensoes: string[] = [];

    if (/\b(produto|produtos|sku|skus|item|itens)\b/.test(semAcento)) {
      dimensoes.push('Produto / Item');
    }
    if (/\b(cliente|clientes|paciente|pacientes|stakeholder|publico|consumidor)\b/.test(semAcento)) {
      dimensoes.push('Cliente / Segmento');
    }
    if (/\b(loja|lojas|unidade|unidades|filial|filiais|ubs|posto|postos|hospital|armazem|armazens)\b/.test(semAcento)) {
      dimensoes.push('Unidade / Local');
    }
    if (/\b(regiao|regioes|estado|estados|cidade|cidades|bairro|bairros|territorio)\b/.test(semAcento)) {
      dimensoes.push('Região / Geografia');
    }
    if (/\b(mes|meses|ano|anos|semana|semanas|dia|dias|tempo|periodo|historico)\b/.test(semAcento)) {
      dimensoes.push('Tempo (Data / Mês / Ano)');
    }
    if (/\b(canal|canais|e-commerce|fisico|online|distribuicao)\b/.test(semAcento)) {
      dimensoes.push('Canal de Venda / Distribuição');
    }
    if (/\b(departamento|setor|area|cargo|cargos)\b/.test(semAcento)) {
      dimensoes.push('Departamento / Cargo');
    }

    // Se nenhuma dimensão for identificada explicitamente, deduz dimensão temporal mínima
    if (dimensoes.length === 0) {
      dimensoes.push('Tempo (Data / Mês / Ano)');
    }

    return dimensoes;
  }

  private inferirEntregaveis(
    explicitados: EntregavelIdentificado[],
    dominio: DominioNegocioIntake,
    semAcento: string
  ): EntregavelIdentificado[] {
    const inferidos: EntregavelIdentificado[] = [];

    const temDashboardExplicito = explicitados.some((e) => e.tipo === 'DASHBOARD');
    if (!temDashboardExplicito) {
      inferidos.push({
        nome: 'Painel Visual de Apoio à Decisão',
        descricao: 'Construção recomendada de dashboard gerencial interativo para responder à demanda.',
        tipo: 'DASHBOARD',
        classificacao: 'INFERENCIA',
      });
    }

    const temRelatorioExplicito = explicitados.some((e) => e.tipo === 'RELATORIO');
    if (!temRelatorioExplicito && (semAcento.includes('entender') || semAcento.includes('explicar') || semAcento.includes('motivo'))) {
      inferidos.push({
        nome: 'Relatório Executivo de Diagnóstico Causal',
        descricao: 'Documento analítico com síntese dos achados, causas-raiz e recomendações práticas.',
        tipo: 'RELATORIO',
        classificacao: 'INFERENCIA',
      });
    }

    return inferidos;
  }

  private inferirKpisSugeridos(
    explicitados: IndicadorKpiIdentificado[],
    dominio: DominioNegocioIntake
  ): IndicadorKpiIdentificado[] {
    const sugeridos: IndicadorKpiIdentificado[] = [];
    const nomesExistentes = new Set(explicitados.map((k) => k.nome.toLowerCase()));

    const addSugerido = (kpi: IndicadorKpiIdentificado) => {
      if (!nomesExistentes.has(kpi.nome.toLowerCase())) {
        sugeridos.push(kpi);
      }
    };

    switch (dominio) {
      case 'VENDAS':
        addSugerido({
          nome: 'Ticket Médio',
          descricao: 'Valor financeiro médio associado a cada venda ou transação.',
          classificacao: 'INFERENCIA',
          ehKpi: false,
          justificativaKpi: 'Métrica analítica de diagnóstico. Não deve ser tratada automaticamente como KPI a menos que vinculada a meta estratégica formal. 📘 Nome profissional: métrica analítica de diagnóstico.',
          oQueE: 'Mostra quanto, em média, cada venda gera em dinheiro. 📘 Nome profissional: ticket médio da transação.',
          porQueSugerido: 'Ajuda a descobrir se uma filial fatura mais porque realiza mais vendas ou porque cada venda tem valor maior.',
          oQueAjudaResponder: 'Diferenças de faturamento decorrem de maior volume físico de vendas, de compras com valores maiores ou de uma combinação dos dois?',
          comoCalcular: 'Faturamento total ÷ Número de vendas/pedidos (Fórmula DAX: DIVIDE([Total Faturamento], [Total Pedidos])).',
          oQuePrecisaConfirmar: 'A planilha precisa permitir identificar ou contar as vendas (coluna de ID do pedido ou cada linha representar uma venda).',
          exemploSimples: 'Se uma filial faturou R$ 10.000 em 100 pedidos, seu ticket médio foi de R$ 100 por compra.',
          quandoNaoAdequado: 'Quando houver produtos com preços discrepantes extremos (de R$ 5 a R$ 50.000), a média simples pode distorcer a realidade; a mediana ou segmentação por faixa é mais informativa.',
          avaliacaoSugestao: {
            relevanciaPedido: 'Ajuda a descobrir se uma filial fatura mais porque realiza mais vendas ou porque cada venda tem valor maior.',
            valorAnalitico: 'Diferencia se o resultado vem do número de compras ou do valor gasto em cada compra.',
            dependencias: 'A planilha precisa permitir identificar ou contar as vendas.',
            complexidadeQualitativa: 'BAIXA',
            justificativaComplexidade: 'cálculo simples se houver número do pedido ou linha por venda',
            exigeEsclarecimentoContratante: false,
            recomendacaoFundamentada: 'Manter para avaliação durante a modelagem como métrica de diagnóstico.',
          },
        });

        addSugerido({
          nome: 'Volume Físico de Vendas (Quantidade)',
          descricao: 'Total de unidades ou itens comercializados.',
          classificacao: 'INFERENCIA',
          ehKpi: false,
          justificativaKpi: 'Métrica operacional de volume. Apoia a diferenciação entre faturamento em reais e giro físico. 📘 Nome profissional: métrica de volume transacional.',
          oQueE: 'Mostra a contagem física total de unidades de produtos vendidas no período.',
          porQueSugerido: 'O pedido menciona saber quais produtos vendem mais ou menos; precisamos separar faturamento em reais da quantidade física de itens.',
          oQueAjudaResponder: 'Quais produtos lideram em saída física versus quais lideram em receita financeira?',
          comoCalcular: 'Soma da quantidade de itens vendidos (Fórmula DAX: SUM(Vendas[Quantidade])).',
          oQuePrecisaConfirmar: 'Se a planilha contém campo de quantidade confiável e se devoluções devem ficar de fora.',
          exemploSimples: 'Contar 500 peças de camisetas vendidas no mês.',
          quandoNaoAdequado: 'Quando houver produtos com unidades de medida incompatíveis (ex: somar litros com unidades de peças sem fator de conversão).',
          avaliacaoSugestao: {
            relevanciaPedido: 'Essencial para responder à dúvida sobre se "vender mais" significa mais peças ou mais dinheiro.',
            valorAnalitico: 'Isola o esforço logístico e de saída física do resultado monetário.',
            dependencias: 'Coluna de quantidade vendida na planilha.',
            complexidadeQualitativa: 'BAIXA',
            justificativaComplexidade: 'soma direta de coluna numérica',
            exigeEsclarecimentoContratante: true,
            recomendacaoFundamentada: 'Aguardar resposta sobre o critério de ranking (quantidade vs valor) antes de fixar o cálculo.',
          },
        });

        addSugerido({
          nome: 'Evolução Temporal do Faturamento (MoM / YoY)',
          descricao: 'Crescimento ou retração percentual do faturamento ao longo do tempo.',
          classificacao: 'INFERENCIA',
          ehKpi: false,
          justificativaKpi: 'Opção analítica para representar a evolução solicitada. MoM e YoY são alternativas técnicas e não requisitos pré-confirmados. 📘 Nome profissional: inteligência temporal (Time Intelligence).',
          oQueE: 'Mostra o percentual de crescimento ou queda comparando um período com o anterior. 📘 Nome profissional: MoM (Month-over-Month) ou YoY (Year-over-Year).',
          porQueSugerido: 'O pedido original pede expressamente para entender como o faturamento está evoluindo.',
          oQueAjudaResponder: 'O faturamento está em tendência de crescimento, estagnação ou queda ao longo do tempo?',
          comoCalcular: '(Faturamento Período Atual - Faturamento Período Anterior) ÷ Faturamento Período Anterior (Fórmula DAX com DATEADD).',
          oQuePrecisaConfirmar: 'Periodicidade desejada (mensal, trimestral ou anual) e amplitude de datas disponível na planilha.',
          exemploSimples: 'Comparar o faturamento de março (R$ 110.000) com fevereiro (R$ 100.000), resultando em crescimento MoM de +10%.',
          quandoNaoAdequado: 'Cálculos MoM/YoY não são aplicáveis se a planilha tiver menos de 2 meses ou menos de 1 ano de histórico.',
          avaliacaoSugestao: {
            relevanciaPedido: 'Opção técnica direta para detalhar a evolução temporal demandada no pedido.',
            valorAnalitico: 'Permite identificar tendências e variações sazonais de receita.',
            dependencias: 'Só conseguiremos fazer essa comparação se a planilha tiver dados de períodos anteriores.',
            complexidadeQualitativa: 'MEDIA',
            justificativaComplexidade: 'requer dimensão de calendário e medidas de comparação de datas',
            exigeEsclarecimentoContratante: false,
            recomendacaoFundamentada: 'Apresentar como alternativas ao analista e confirmar a viabilidade inspecionando as datas da planilha.',
          },
        });

        addSugerido({
          nome: 'Comparativo de Desempenho por Filial',
          descricao: 'Distribuição e participação de vendas entre as filiais da empresa.',
          classificacao: 'INFERENCIA',
          ehKpi: false,
          justificativaKpi: 'Formas de comparação entre filiais (absoluta vs percentual vs ticket médio) são opções analíticas. 📘 Nome profissional: análise comparativa dimensional.',
          oQueE: 'Métrica de comparação relativa de faturamento e volume entre as diferentes filiais ou unidades da empresa.',
          porQueSugerido: 'O pedido cita explicitamente o objetivo de conseguir comparar o desempenho das filiais.',
          oQueAjudaResponder: 'Quais filiais estão superando a média da empresa e quais estão com faturamento abaixo do esperado?',
          comoCalcular: 'Faturamento por Filial ÷ Faturamento Total da Empresa (ou ranking ordenado por faturamento).',
          oQuePrecisaConfirmar: 'Quais filiais estão ativas e se há metas individuais por filial para confronto.',
          exemploSimples: 'A Filial Centro faturou R$ 60.000 (60% do total) e a Filial Norte faturou R$ 40.000 (40% do total).',
          quandoNaoAdequado: 'Comparar filiais de portes muito desiguais apenas por faturamento absoluto pode ocultar a alta eficiência de lojas compactas.',
          avaliacaoSugestao: {
            relevanciaPedido: 'Atende ao pedido explícito de comparar filiais.',
            valorAnalitico: 'Revela assimetrias regionais de desempenho.',
            dependencias: 'Coluna identificando filial/loja na planilha.',
            complexidadeQualitativa: 'BAIXA',
            justificativaComplexidade: 'segmentação direta por coluna de filial',
            exigeEsclarecimentoContratante: false,
            recomendacaoFundamentada: 'Requisito confirmado no pedido; refinar a forma de comparação na modelagem.',
          },
        });

        addSugerido({
          nome: 'Concentração de Vendas (Curva ABC / Pareto)',
          descricao: 'Participação acumulada dos principais produtos no faturamento.',
          classificacao: 'INFERENCIA',
          ehKpi: false,
          justificativaKpi: 'Técnica analítica de investigação de concentração, sem presunção a priori da regra 80/20. 📘 Nome profissional: Análise de Pareto / Curva ABC.',
          oQueE: 'Mostra se uma parcela pequena dos produtos responde pela maior parte das vendas. 📘 Nome profissional: Curva ABC ou Princípio de Pareto.',
          porQueSugerido: 'Estrutura analiticamente a identificação de produtos mais e menos vendidos solicitada no pedido original.',
          oQueAjudaResponder: 'Qual percentual da receita depende dos produtos líderes e onde está a maior concentração de risco comercial?',
          comoCalcular: 'Ordenação decrescente de faturamento por produto e cálculo da participação acumulada percentual.',
          oQuePrecisaConfirmar: 'A distribuição percentual real (se 20% geram 70%, 80% ou 90%) só poderá ser calculada a partir dos dados reais da planilha.',
          exemploSimples: 'Em muitas empresas, cerca de 10 a 20 produtos respondem por mais da metade de todo o faturamento.',
          quandoNaoAdequado: 'Não é adequado quando a empresa comercializa poucos itens com volumes muito similares, ou quando todos os produtos possuem o mesmo peso comercial.',
          avaliacaoSugestao: {
            relevanciaPedido: 'Responde à necessidade de identificar os produtos vitais da empresa.',
            valorAnalitico: 'Identifica risco de dependência e direciona ações comerciais focadas nos produtos mais relevantes.',
            dependencias: 'Requer código/nome do produto e valor total faturado por produto.',
            complexidadeQualitativa: 'MEDIA',
            justificativaComplexidade: 'cálculo acumulado percentual na modelagem',
            exigeEsclarecimentoContratante: false,
            recomendacaoFundamentada: 'Manter para avaliação durante a modelagem, pois aprofunda a análise dos produtos líderes sem gerar perguntas desnecessárias ao contratante.',
          },
        });
        break;

      case 'FINANCEIRO':
        addSugerido({
          nome: 'Margem Líquida %',
          descricao: 'Percentual de lucro líquido sobre a receita operacional.',
          classificacao: 'INFERENCIA',
          oQueE: 'Proporção do faturamento que efetivamente se converte em resultado líquido após custos e despesas.',
          porQueSugerido: 'Complementa a visão de fluxo de caixa e DRE para verificar se o crescimento de receita está gerando rentabilidade.',
          oQueAjudaResponder: 'A operação está sendo lucrativa ou o aumento de custos está comprimindo o resultado?',
          comoCalcular: 'Lucro Líquido ÷ Receita Líquida Total × 100.',
          oQuePrecisaConfirmar: 'Critérios contábeis de apropriação de despesas operacionais e tributos.',
        });
        addSugerido({
          nome: 'Prazos Médios (PMR / PMP)',
          descricao: 'Prazo médio de recebimento de vendas e pagamento de fornecedores.',
          classificacao: 'INFERENCIA',
          oQueE: 'Indicadores do ciclo financeiro que medem a velocidade de entrada e saída de caixa.',
          porQueSugerido: 'Ajuda a diagnosticar se oscilações no fluxo de caixa decorrem de atrasos de clientes ou descasamento de prazos.',
          oQueAjudaResponder: 'O capital de giro está sendo drenado por clientes demorando a pagar?',
          comoCalcular: '(Duplicatas a Receber ÷ Faturamento Diário Médio).',
          oQuePrecisaConfirmar: 'Disponibilidade de datas de emissão e liquidação dos títulos na base.',
        });
        addSugerido({
          nome: 'Índice de Liquidez Corrente',
          descricao: 'Capacidade de honrar compromissos de curto prazo.',
          classificacao: 'INFERENCIA',
          oQueE: 'Relação entre os ativos circulantes e os passivos de curto prazo.',
          porQueSugerido: 'Indica a solvência da empresa diante de aumentos de inadimplência ou custos.',
          oQueAjudaResponder: 'A empresa tem folga financeira para cobrir suas obrigações imediatas?',
          comoCalcular: 'Ativo Circulante ÷ Passivo Circulante.',
          oQuePrecisaConfirmar: 'Abertura patrimonial balanceada e conciliada.',
        });
        break;

      case 'ESTOQUE_LOGISTICA':
        addSugerido({
          nome: 'Taxa de Ruptura %',
          descricao: 'Percentual de demandas não atendidas por falta imediata de estoque.',
          classificacao: 'INFERENCIA',
          oQueE: 'Frequência com que um pedido de cliente não pôde ser atendido por ausência física do produto.',
          porQueSugerido: 'Conecta a gestão de estoque às vendas perdidas.',
          oQueAjudaResponder: 'Quanto estamos deixando de faturar por falta de produto no armazém?',
          comoCalcular: '(Pedidos com Falta ÷ Total de Pedidos Solicitados) × 100.',
          oQuePrecisaConfirmar: 'Registro de pedidos não atendidos ou cancelados por falta de estoque.',
        });
        addSugerido({
          nome: 'Cobertura de Estoque em Dias',
          descricao: 'Quantos dias a posição atual de estoque suporta as vendas.',
          classificacao: 'INFERENCIA',
          oQueE: 'Autonomia do estoque atual expressa em dias de consumo ou venda média diária.',
          porQueSugerido: 'Permite identificar produtos com risco iminente de falta ou excesso de estoque imobilizado.',
          oQueAjudaResponder: 'Quais itens estão a ponto de zerar e quais têm estoque excessivo parado?',
          comoCalcular: 'Estoque Atual ÷ Venda Média Diária.',
          oQuePrecisaConfirmar: 'Janela temporal considerada para calcular a venda média diária.',
        });
        addSugerido({
          nome: 'Giro de Estoque',
          descricao: 'Velocidade de renovação do estoque no período.',
          classificacao: 'INFERENCIA',
          oQueE: 'Número de vezes que o estoque de determinado item ou categoria é vendido e reposto em um ciclo.',
          porQueSugerido: 'Mede a eficiência do capital de giro aplicado em mercadorias.',
          oQueAjudaResponder: 'Quais SKUs têm alta rotação e quais têm baixa rotatividade?',
          comoCalcular: 'Custo das Mercadorias Vendidas (CMV) ÷ Estoque Médio.',
          oQuePrecisaConfirmar: 'Informação de custo médio ponderado por SKU.',
        });
        break;

      case 'RH_PESSOAS':
        addSugerido({
          nome: 'Taxa de Turnover Geral %',
          descricao: 'Percentual de substituição de pessoal no período.',
          classificacao: 'INFERENCIA',
          oQueE: 'Índice de rotatividade de colaboradores (admissões e demissões) em relação ao quadro ativo.',
          porQueSugerido: 'Indicador padrão para dimensionar retenção e estabilidade das equipes.',
          oQueAjudaResponder: 'A empresa está perdendo talentos acima da média de mercado?',
          comoCalcular: '((Admissões + Demissões) ÷ 2) ÷ Headcount Ativo × 100.',
          oQuePrecisaConfirmar: 'Critério adotado pela empresa para a fórmula de turnover.',
        });
        addSugerido({
          nome: 'Taxa de Turnover Voluntário vs Involuntário',
          descricao: 'Separação entre saídas pedidas pelo colaborador e desligamentos pela empresa.',
          classificacao: 'INFERENCIA',
          oQueE: 'Discriminação do motivo formal da rescisão contratual.',
          porQueSugerido: 'Diferencia problemas de insatisfação interna (voluntário) de adequações de quadro (involuntário).',
          oQueAjudaResponder: 'Os desligamentos estão partindo dos colaboradores ou da gestão?',
          comoCalcular: 'Demissões Voluntárias ÷ Headcount Ativo × 100.',
          oQuePrecisaConfirmar: 'Classificação consistente dos tipos de rescisão no sistema de folha.',
        });
        addSugerido({
          nome: 'Tempo Médio de Casa (Tenure)',
          descricao: 'Permanência média dos colaboradores na empresa.',
          classificacao: 'INFERENCIA',
          oQueE: 'Tempo decorrido entre a admissão e o momento atual (ou data de desligamento).',
          porQueSugerido: 'Indica se a evasão ocorre predominantemente no período de experiência ou em colaboradores seniores.',
          oQueAjudaResponder: 'Em qual estágio da jornada o colaborador decide sair da empresa?',
          comoCalcular: 'Média da diferença em meses entre data de admissão e rescisão/data corrente.',
          oQuePrecisaConfirmar: 'Histórico de admissões e demissões sem interrupções de cadastro.',
        });
        break;

      case 'SAUDE_PUBLICA':
        addSugerido({
          nome: 'Tempo Médio de Espera',
          descricao: 'Tempo transcorrido entre a triagem e o atendimento médico.',
          classificacao: 'INFERENCIA',
          oQueE: 'Média de minutos ou horas decorridos desde a chegada do paciente até a consulta efetiva.',
          porQueSugerido: 'Principal indicador de gargalo operacional e dimensionamento de escalas de atendimento.',
          oQueAjudaResponder: 'Quais unidades de saúde ou turnos apresentam maiores filas?',
          comoCalcular: 'Média(Horário de Atendimento - Horário de Acolhimento/Triagem).',
          oQuePrecisaConfirmar: 'Carimbo de data/hora nos registros eletrônicos de prontuário.',
        });
        addSugerido({
          nome: 'Taxa de Resolutividade na Atenção Básica',
          descricao: 'Percentual de atendimentos solucionados sem encaminhamento hospitalar.',
          classificacao: 'INFERENCIA',
          oQueE: 'Proporção de demandas clínicas resolvidas diretamente nas unidades básicas.',
          porQueSugerido: 'Mede a eficácia da atenção primária em evitar sobrecarga em pronto-socorros.',
          oQueAjudaResponder: 'A atenção básica está conseguindo absorver os casos sem encaminhamentos desnecessários?',
          comoCalcular: '(Atendimentos Concluídos na UBS ÷ Total de Atendimentos) × 100.',
          oQuePrecisaConfirmar: 'Classificação padronizada de desfechos clínicos.',
        });
        addSugerido({
          nome: 'Taxa de Absenteísmo a Consultas Agendadas',
          descricao: 'Percentual de faltas de pacientes a consultas e exames marcados.',
          classificacao: 'INFERENCIA',
          oQueE: 'Índice de não comparecimento (no-show) da população aos agendamentos prévios.',
          porQueSugerido: 'Permite identificar desperdício de capacidade de atendimento e planejar confirmações ativas.',
          oQueAjudaResponder: 'Quantos horários de consulta são ociosos por falta do paciente?',
          comoCalcular: '(Consultas Não Comparecidas ÷ Total de Agendamentos) × 100.',
          oQuePrecisaConfirmar: 'Marcação explícita de comparecimento ou falta no sistema.',
        });
        break;

      case 'GERAL':
      default:
        addSugerido({
          nome: 'Indicador de Tendência Geral',
          descricao: 'Taxa de evolução período a período.',
          classificacao: 'INFERENCIA',
          oQueE: 'Medição da taxa de aceleração ou desaceleração dos números ao longo do tempo.',
          porQueSugerido: 'Oferece linha de tendência para responder se os números gerais estão melhorando ou piorando.',
          oQueAjudaResponder: 'Qual a direção de médio prazo dos resultados?',
          comoCalcular: 'Variação percentual entre médias móveis dos períodos.',
          oQuePrecisaConfirmar: 'Série histórica temporal com espaçamento regular.',
        });
        addSugerido({
          nome: 'Taxa de Atingimento de Meta %',
          descricao: 'Comparativo entre o realizado e o planejado.',
          classificacao: 'INFERENCIA',
          oQueE: 'Percentual que confronta os números realizados frente aos objetivos traçados pela gestão.',
          porQueSugerido: 'Contextualiza o resultado bruto com a expectativa da liderança.',
          oQueAjudaResponder: 'O desempenho atual está dentro do esperado ou abaixo do orçamento/meta?',
          comoCalcular: '(Resultado Realizado ÷ Meta Estabelecida) × 100.',
          oQuePrecisaConfirmar: 'Disponibilidade formal de metas cadastradas.',
        });
        break;
    }

    return sugeridos;
  }

  private inferirProblemaEObjetivo(
    original: string,
    semAcento: string,
    dominio: DominioNegocioIntake,
    dimensoes: string[],
    kpisExplicitados: IndicadorKpiIdentificado[]
  ): { problemaAparente: string; objetivoProvavel: string; contextoIdentificado: string } {
    const verbosCausais = /\b(por que|porque|por qual motivo|motivo|causa|razao|entender|investigar|descobrir|queda|cairam|caiu|baixo)\b/.test(
      semAcento
    );
    const temQueda = semAcento.includes('queda') || semAcento.includes('cairam') || semAcento.includes('caiu');
    const mencionaReuniaoDirecao = /\b(reuniao|direcao|diretoria|apresentar|apresentacao|lideranca)\b/.test(semAcento);
    const verbosMonitoramento = /\b(acompanhar|monitorar|controlar|ver diariamente|gestao a vista|painel)\b/.test(semAcento);

    let problema = 'Hipótese a confirmar: Falta de visibilidade analítica estruturada sobre os indicadores de desempenho da operação.';
    let objetivo = 'Interpretação do Copiloto: Estruturar base analítica e métricas fundamentadas para orientar decisões de gestão.';
    let contexto = 'Interpretação preliminar: Demanda operacional recebida para diagnóstico de negócio.';

    const listaKpis = kpisExplicitados.map((k) => k.nome).join(', ') || 'indicadores principais';
    const listaDimensoes = dimensoes.join(' e ') || 'dimensões relevantes';

    if (verbosCausais && temQueda) {
      problema = `Hipótese a confirmar: Retração observada nos indicadores (${listaKpis}) com incerteza sobre os fatores e produtos/segmentos causadores.`;
      objetivo = `Interpretação do Copiloto: Identificar a causa-raiz da queda observada, mensurar o impacto por ${listaDimensoes} e recomendar ações corretivas.`;
      contexto = 'Interpretação preliminar: O demandante identificou um comportamento adverso nos números e necessita de investigação causal e quantitativa.';
    } else if (mencionaReuniaoDirecao) {
      problema = `Hipótese a confirmar: Necessidade de consolidação ágil e confiável dos dados de ${listaKpis} para subsidiar tomada de decisão da direção.`;
      objetivo = `Interpretação do Copiloto: Estruturar visualização analítica de ${listaKpis} por ${listaDimensoes} (validar se de uso pontual para a reunião ou contínuo).`;
      contexto = 'Interpretação preliminar: Preparação de material analítico e visual para apresentação executiva à liderança.';
    } else if (verbosMonitoramento) {
      problema = `Hipótese a confirmar: Possível ausência ou insuficiência de visualização consolidada dos indicadores de ${listaKpis}.`;
      objetivo = `Interpretação do Copiloto: Estruturar visualização de ${listaKpis} segmentada por ${listaDimensoes} (sujeito à validação de rotina de acompanhamento).`;
      contexto = 'Interpretação preliminar: Demanda voltada ao acompanhamento estruturado de métricas operacionais.';
    } else if (dominio === 'FINANCEIRO') {
      problema = 'Hipótese a confirmar: Dificuldade de conciliação e visão consolidada dos fluxos financeiros e margens de negócio.';
      objetivo = 'Interpretação do Copiloto: Unificar os dados financeiros em modelo analítico consistente com reconciliação estrita de saldos.';
      contexto = 'Interpretação preliminar: Rotina financeira exigindo maior precisão na apuração de resultados.';
    } else if (dominio === 'ESTOQUE_LOGISTICA') {
      problema = 'Hipótese a confirmar: Inconsistência no balanceamento de estoque, gerando risco de ruptura ou capital de giro imobilizado excessivo.';
      objetivo = 'Interpretação do Copiloto: Calcular giros, cobertura e identificar itens críticos por meio de classificação em Curva ABC.';
      contexto = 'Interpretação preliminar: Gestão de materiais e cadeia logística necessitando de otimização.';
    } else if (dominio === 'RH_PESSOAS') {
      problema = 'Hipótese a confirmar: Falta de entendimento dos fatores que impulsionam a rotatividade e o absenteísmo na equipe.';
      objetivo = 'Interpretação do Copiloto: Mapear a distribuição do turnover por departamento e tempo de casa para subsidiar políticas de retenção.';
      contexto = 'Interpretação preliminar: Iniciativa de People Analytics voltada à melhoria do clima e produtividade.';
    } else if (dominio === 'SAUDE_PUBLICA') {
      problema = 'Hipótese a confirmar: Gargalos nos fluxos de atendimento ou déficit de cobertura em serviços de saúde pública.';
      objetivo = 'Interpretação do Copiloto: Mensurar tempos de fila, volumes atendidos e identificar unidades com maior sobrecarga de demanda.';
      contexto = 'Interpretação preliminar: Aprimoramento da gestão de serviços de saúde pública e eficiência operacional.';
    }

    return {
      problemaAparente: problema,
      objetivoProvavel: objetivo,
      contextoIdentificado: contexto,
    };
  }

  private avaliarAmbiguidade(
    semAcento: string,
    dominio: DominioNegocioIntake,
    kpisExplicitados: IndicadorKpiIdentificado[],
    ativosDados: AtivoMencionado[]
  ): boolean {
    if (semAcento.length < 35 && kpisExplicitados.length === 0) {
      return true;
    }
    if (dominio === 'GERAL' && ativosDados.length === 0 && kpisExplicitados.length === 0) {
      return true;
    }
    return false;
  }

  // ==========================================================================
  // LACUNAS DE INFORMAÇÃO E PERGUNTAS DE CLARIFICAÇÃO
  // Prioridade de Negócio:
  // objetivo/decisão → público/stakeholder → prazo → período → escopo →
  // definições de indicadores → critérios de sucesso → dados disponíveis →
  // regras/exceções → granularidade/modelagem
  // ==========================================================================

  private identificarLacunasEPerguntas(params: {
    original: string;
    textoSemAcento: string;
    dominio: DominioNegocioIntake;
    ativosDados: AtivoMencionado[];
    janelaTemporal: JanelaTemporalMencionada | null;
    prazoMencionado: string | null;
    kpisExplicitados: IndicadorKpiIdentificado[];
    ehAmbiguo: boolean;
    ehMuitoCurto: boolean;
  }): { itensFaltantes: string[]; perguntasPriorizadas: PerguntaClarificacaoIntake[] } {
    const { original, textoSemAcento, dominio, ativosDados, janelaTemporal, prazoMencionado, kpisExplicitados, ehAmbiguo, ehMuitoCurto } = params;

    const itensFaltantes: string[] = [];
    const perguntas: PerguntaClarificacaoIntake[] = [];

    const mencionaReuniao = /\b(reuniao|apresentar|apresentacao|comite|diretoria|direcao)\b/.test(textoSemAcento);
    const mencionaPainel = /\b(painel|dashboard|bi)\b/.test(textoSemAcento);

    // 1. OBJETIVO / DECISÃO: Uso pontual vs rotina contínua
    if (mencionaReuniao && mencionaPainel) {
      itensFaltantes.push('Uso pretendido do painel (apresentação pontual vs rotina contínua) não definido.');
      const trechoOriginal = this.extrairTrechoVerbatim(original, textoSemAcento, /\b(painel para entender como estao as vendas|painel de vendas|painel gerencial|dashboard|painel|bi)\b/);
      perguntas.push({
        id: 'intake_perg_uso_painel',
        pergunta: 'O painel será utilizado apenas nessa apresentação ou deverá continuar sendo atualizado?',
        motivacao: 'Define a arquitetura técnica: apresentações pontuais priorizam agilidade na resposta aos dados da reunião, enquanto rotinas contínuas demandam pipeline estruturado de atualização periódica.',
        categoria: 'OBJETIVO_DECISAO',
        prioridade: 'ALTA',
        bloqueanteRecomendado: false,
        prioridadeNivel: 'EXPLORATORIA',
        justificativaPrioridade: 'Saber se o painel será usado apenas na reunião ou de forma contínua define a arquitetura técnica, mas não impede o início do trabalho imediato.',
        oQueContratantePediu: trechoOriginal || 'Não informado no Pedido Original.',
        lacunaIdentificadaCopiloto: 'Lacuna identificada pelo Copiloto: O pedido menciona uma reunião com a diretoria, mas não especifica se o painel será de uso único ou contínuo.',
        oQueAindaPrecisamosSaber: 'Se o painel será utilizado apenas nessa apresentação pontual ou se deverá ser mantido e atualizado com novos dados regularmente.',
        porQueImportaAnalise: 'Define se o pipeline de dados precisa de automação de recarga e governança de modelo ou se uma carga manual estática é suficiente para atender ao prazo.',
        perguntaSugeridaContratante: 'O painel será utilizado apenas nessa apresentação ou precisará ser consultado e atualizado de forma contínua?',
        comoExplicarContratante: 'Pergunto porque um painel preparado apenas para esta apresentação pode exigir uma solução mais simples, enquanto um painel que continuará sendo atualizado precisa considerar também como os novos dados serão incorporados.',
        seContratanteNaoEntender: 'Pergunto porque um painel preparado apenas para esta apresentação pode exigir uma solução mais simples, enquanto um painel que continuará sendo atualizado precisa considerar também como os novos dados serão incorporados.',
        oQueRespostaVaiDefinir: 'A complexidade técnica do modelo e o processo de atualização dos dados.',
        requisitoRelacionadoId: 'req_painel_visual',
        tipoResolucao: 'PERGUNTAR_CONTRATANTE',
        comoPensarComoAnalista: 'Definir a longevidade do artefato orienta a arquitetura: relatórios pontuais priorizam velocidade para a reunião; relatórios contínuos exigem governança e atualização recorrente.',
        entendaTecnicamente: 'Apresentações pontuais suportam modelo estático com carga única no Power BI; rotinas contínuas demandam pipeline com Power Query parametrizado e atualização agendada.',
        porQuePrecisoPerguntar: 'Para dimensionar o tempo de desenvolvimento e a complexidade do modelo até a data da reunião.',
        oQuePodeDarErradoSeNaoPerguntar: 'Construir uma solução pontual e o cliente esperar que ela se atualize automaticamente de forma contínua, ou gastar tempo criando automações complexas quando era apenas uma apresentação única.',
        oQueRespostaVaiMudar: 'Determina se criaremos fluxos de atualização recorrente ou um modelo de carga estática para a reunião.',
        bloqueioEspecifico: 'Não bloqueia o projeto; orienta o nível de automação do pipeline.',
      });
    }

    if (ehAmbiguo || ehMuitoCurto) {
      itensFaltantes.push('Solicitação com alto grau de concisão ou ambiguidade que requer alinhamento inicial de escopo.');
      perguntas.push({
        id: 'intake_perg_escopo_geral',
        pergunta: 'Qual é a principal decisão de negócio que a liderança pretende tomar com base nos resultados desta entrega?',
        motivacao: 'Esclarecer o objetivo final alinha o escopo e evita retrabalho em análises desconectadas da necessidade real.',
        categoria: 'OBJETIVO_DECISAO',
        prioridade: 'ALTA',
        bloqueanteRecomendado: true,
        prioridadeNivel: 'ESSENCIAL_BLOQUEANTE',
        justificativaPrioridade: 'Sem clareza sobre a decisão de negócio a ser tomada, qualquer análise corre risco de retrabalho total.',
        oQueContratantePediu: 'Não informado no Pedido Original.',
        lacunaIdentificadaCopiloto: 'Lacuna identificada pelo Copiloto: Solicitação concisa ou com escopo aberto que exige alinhamento do objetivo prático de negócio.',
        oQueAindaPrecisamosSaber: 'Qual decisão prática a liderança pretende tomar após visualizar a entrega.',
        porQueImportaAnalise: 'Alinha o objetivo analítico central, prevenindo a criação de visões e cálculos desconectados da real necessidade de negócio.',
        perguntaSugeridaContratante: 'Qual é a principal decisão prática que você ou sua equipe pretendem tomar com base nas respostas deste trabalho?',
        comoExplicarContratante: 'Isso nos ajuda a focar o painel exatamente no que é relevante para o seu negócio, sem perder tempo com informações secundárias.',
        seContratanteNaoEntender: 'Isso nos ajuda a focar o painel exatamente no que é relevante para o seu negócio, sem perder tempo com informações secundárias.',
        oQueRespostaVaiDefinir: 'O foco prioritário das telas, filtros e indicadores da entrega.',
        requisitoRelacionadoId: 'req_objetivo_decisao',
        tipoResolucao: 'PERGUNTAR_CONTRATANTE',
        comoPensarComoAnalista: 'Antes de desenhar telas ou tabelas, o analista deve entender qual problema de negócio a liderança quer resolver.',
        entendaTecnicamente: 'Alinhamento dos objetivos analíticos com as entidades de fato e dimensões a serem modeladas.',
        porQuePrecisoPerguntar: 'Para evitar retrabalho com entregas desconectadas da necessidade da diretoria.',
        oQuePodeDarErradoSeNaoPerguntar: 'Construir um painel esteticamente bonito mas inútil para a tomada de decisão.',
        oQueRespostaVaiMudar: 'Determina o layout, os KPIs principais e os filtros em destaque.',
        bloqueioEspecifico: 'Bloqueia a definição do escopo principal da demanda.',
      });
    }

    // 2. PÚBLICO / PRAZO: Data da reunião ou prazo limite
    if (mencionaReuniao) {
      const temDataExplicita = /\b(\d{1,2}\/\d{1,2}|\d{1,2}\s+de\s+[a-z]+|hoje|amanha|segunda|terca|quarta|quinta|sexta)\b/.test(textoSemAcento);
      if (!temDataExplicita) {
        itensFaltantes.push('Data da próxima reunião com a direção não informada.');
        const trechoReuniao = this.extrairTrechoVerbatim(original, textoSemAcento, /\b(preciso apresentar isso para a direcao na proxima reuniao|apresentar isso para a direcao|na proxima reuniao|proxima reuniao|reuniao da direcao|reuniao com a diretoria)\b/);
        perguntas.push({
          id: 'intake_perg_data_reuniao',
          pergunta: 'Quando ocorrerá a próxima reunião da direção?',
          motivacao: 'Determina o prazo limite real para extração, validação das regras de negócio e homologação dos números antes da apresentação executiva.',
          categoria: 'PRAZO_MARCO',
          prioridade: 'ALTA',
          bloqueanteRecomendado: true,
          prioridadeNivel: 'ESSENCIAL_BLOQUEANTE',
          justificativaPrioridade: 'A data da reunião impõe o prazo final para a validação dos números antes da apresentação, permitindo iniciar a inspeção prévia dos dados.',
          oQueContratantePediu: trechoReuniao || 'Não informado no Pedido Original.',
          lacunaIdentificadaCopiloto: 'Lacuna identificada pelo Copiloto: A reunião foi mencionada, mas a data e horário exatos não foram informados.',
          oQueAindaPrecisamosSaber: 'O dia e horário exatos em que a apresentação será realizada.',
          porQueImportaAnalise: 'Fixa o cronograma para etapas de limpeza, modelagem, cálculo de medidas e validação prévia dos números.',
          perguntaSugeridaContratante: 'Em qual dia e horário será a reunião com a diretoria em que essas informações serão apresentadas?',
          comoExplicarContratante: 'Pergunto para organizarmos o cronograma de trabalho e garantir que o material esteja pronto, testado e revisado antes do início da reunião.',
          seContratanteNaoEntender: 'Precisamos da data exata para planejar as etapas e assegurar que tudo esteja pronto e testado com antecedência.',
          oQueRespostaVaiDefinir: 'O cronograma e a viabilidade do escopo dentro do tempo disponível.',
          requisitoRelacionadoId: 'req_prazo_reuniao',
          tipoResolucao: 'PERGUNTAR_CONTRATANTE',
          comoPensarComoAnalista: 'O marco da reunião estabelece o prazo final inegociável para a validação dos números antes de qualquer apresentação a executivos.',
          entendaTecnicamente: 'Cronograma de etapas técnicas: Ingestão > Modelagem > Medidas DAX > Validação de Conciliação > Homologação.',
          porQuePrecisoPerguntar: 'Para estabelecer o cronograma e garantir a entrega antes da apresentação.',
          oQuePodeDarErradoSeNaoPerguntar: 'Descobrir que a reunião é antes do previsto e apresentar dados sem validação formal.',
          oQueRespostaVaiMudar: 'Define o prazo final da demanda e a priorização do escopo do MVP.',
          bloqueioEspecifico: 'Permite trabalhar na inspeção dos dados e estruturação inicial, mas exige definição da data antes da validação final para a reunião.',
        });
      }
    } else if (!prazoMencionado) {
      itensFaltantes.push('Prazo ou marco esperado de conclusão da entrega não informado.');
      perguntas.push({
        id: 'intake_perg_prazo',
        pergunta: 'Qual é a data limite ou o prazo esperado para disponibilização da entrega final ao cliente/área demandante?',
        motivacao: 'Determina a prioridade de alocação de tempo e a viabilidade do escopo.',
        categoria: 'PRAZO_MARCO',
        prioridade: 'MEDIA',
        bloqueanteRecomendado: false,
        prioridadeNivel: 'IMPORTANTE',
        justificativaPrioridade: 'Sem prazo formal, o trabalho pode ser dimensionado de maneira inadequada em relação às expectativas do cliente.',
        oQueContratantePediu: 'Não informado no Pedido Original.',
        lacunaIdentificadaCopiloto: 'Lacuna identificada pelo Copiloto: Não há prazo ou marco temporal de conclusão especificado no pedido.',
        oQueAindaPrecisamosSaber: 'A data ou período esperado pelo cliente para a entrega da solução.',
        porQueImportaAnalise: 'Permite dimensionar a profundidade do levantamento de requisitos e a sofisticação da modelagem.',
        perguntaSugeridaContratante: 'Qual é a data limite em que você gostaria de ter essa entrega pronta para uso?',
        comoExplicarContratante: 'Precisamos dessa data para planejar as etapas e assegurar que tudo seja entregue com qualidade no prazo que você precisa.',
        seContratanteNaoEntender: 'Precisamos dessa data para planejar as etapas e assegurar que tudo seja entregue com qualidade no prazo que você precisa.',
        oQueRespostaVaiDefinir: 'O cronograma de desenvolvimento e priorização dos entregáveis.',
        requisitoRelacionadoId: 'req_prazo_entrega',
        tipoResolucao: 'PERGUNTAR_CONTRATANTE',
        comoPensarComoAnalista: 'Sem prazo formal, o analista deve obter a expectativa temporal do cliente para calibrar a profundidade da solução.',
        entendaTecnicamente: 'Dimensionamento do esforço de engenharia e modelagem compatível com o tempo disponível.',
        porQuePrecisoPerguntar: 'Para alinhar expectativas de entrega e cronograma.',
        oQuePodeDarErradoSeNaoPerguntar: 'Subestimar ou superestimar o tempo necessário para a entrega.',
        oQueRespostaVaiMudar: 'Define a data de entrega e marcos intermediários da demanda.',
        bloqueioEspecifico: 'Não bloqueia o início das análises, mas orienta o cronograma.',
      });
    }

    // 3. PERÍODO TEMPORAL
    const temDatasExatas = janelaTemporal?.tipo === 'ANO' || janelaTemporal?.tipo === 'ABSOLUTO';
    if (!temDatasExatas) {
      itensFaltantes.push('Período das vendas a analisar não delimitado com datas exatas.');
      const trechoTemporal = this.extrairTrechoVerbatim(original, textoSemAcento, /\b(ultimo trimestre|ultimos meses|trimestre|meses|ano)\b/);
      perguntas.push({
        id: 'intake_perg_temporalidade',
        pergunta: 'Qual período das vendas deverá ser analisado?',
        motivacao: 'Definir o período histórico evita importação de dados desnecessários e orienta o desenho da dimensão calendário e análises de tendência.',
        categoria: 'TEMPORALIDADE',
        prioridade: 'ALTA',
        bloqueanteRecomendado: true,
        prioridadeNivel: 'ESSENCIAL_BLOQUEANTE',
        justificativaPrioridade: 'Sem delimitar o período, não é possível filtrar os registros nem garantir comparabilidade histórica correta.',
        oQueContratantePediu: trechoTemporal || 'Não informado no Pedido Original.',
        lacunaIdentificadaCopiloto: 'Lacuna identificada pelo Copiloto: O período histórico de vendas não foi delimitado com datas exatas.',
        oQueAindaPrecisamosSaber: 'Quais meses ou anos específicos devem ser considerados na análise.',
        porQueImportaAnalise: 'Determina a amplitude da tabela calendário, o volume de dados a carregar e a validade de cálculos comparativos.',
        perguntaSugeridaContratante: 'Qual período específico de vendas você gostaria de analisar (por exemplo, de qual mês a qual mês)?',
        comoExplicarContratante: 'Pergunto porque precisamos saber exatamente quais meses incluir para que os totais e comparações reflitam o intervalo correto de tempo.',
        seContratanteNaoEntender: 'Pergunto porque precisamos saber exatamente quais meses incluir para que os totais e comparações reflitam o intervalo correto de tempo.',
        oQueRespostaVaiDefinir: 'O filtro temporal dos dados e o intervalo de cálculo das medidas comparativas.',
        requisitoRelacionadoId: 'req_periodo_vendas',
        tipoResolucao: 'PERGUNTAR_CONTRATANTE',
        comoPensarComoAnalista: 'Definir o período histórico evita carregar dados irrelevantes e orienta a criação da dimensão calendário e análises comparativas.',
        entendaTecnicamente: 'Configuração dos limites temporais (MinDate e MaxDate) da Dimensão d_Calendario e filtro de fatos.',
        porQuePrecisoPerguntar: 'Para delimitar o corte temporal correto das vendas a serem apresentadas.',
        oQuePodeDarErradoSeNaoPerguntar: 'Carregar períodos que a liderança não quer analisar ou omitir meses importantes para a comparação.',
        oQueRespostaVaiMudar: 'Define o filtro temporal da base e o alcance das comparações.',
        bloqueioEspecifico: 'Bloqueia a definição final dos filtros temporais do painel.',
      });
    }

    // 4. ESCOPO: Filiais / Unidades a comparar
    const mencionaFiliais = /\b(filial|filiais|loja|lojas|unidade|unidades|regional|regionais)\b/.test(textoSemAcento);
    if (mencionaFiliais) {
      itensFaltantes.push('Escopo de filiais/unidades participantes da comparação não delimitado.');
      const trechoFiliais = this.extrairTrechoVerbatim(original, textoSemAcento, /\b(tambem queria conseguir comparar as filiais|queria conseguir comparar as filiais|conseguir comparar as filiais|comparar as filiais|compare as filiais|filiais)\b/);
      perguntas.push({
        id: 'intake_perg_escopo_filiais',
        pergunta: 'Quais filiais devem participar da comparação?',
        motivacao: 'Delimita o escopo operacional da análise e orienta se filtros ou hierarquias dimensionais de filial devem ser criados.',
        categoria: 'ESCOPO',
        prioridade: 'ALTA',
        bloqueanteRecomendado: false,
        prioridadeNivel: 'IMPORTANTE',
        justificativaPrioridade: 'Saber se todas as filiais entram ou se há recortes regionais/unidades inativas refina a comparação.',
        oQueContratantePediu: trechoFiliais || 'Não informado no Pedido Original.',
        lacunaIdentificadaCopiloto: 'Lacuna identificada pelo Copiloto: A comparação entre filiais foi solicitada, mas não foram informadas quais unidades devem entrar nem o critério prioritário.',
        oQueAindaPrecisamosSaber: 'Se todas as lojas/filiais devem ser consideradas ou se existem unidades excluídas, recém-inauguradas ou com regras especiais.',
        porQueImportaAnalise: 'Garante consistência na dimensão de filiais, evitando comparações desleais entre lojas maduras e lojas em fase de abertura.',
        perguntaSugeridaContratante: 'Todas as filiais ativas da empresa devem entrar nessa comparação ou existe alguma unidade que deva ficar de fora?',
        comoExplicarContratante: 'Isso nos ajuda a evitar que unidades recém-abertas ou com funcionamento atípico distorçam a comparação com as demais.',
        seContratanteNaoEntender: 'Lojas maiores costumam vender mais no total, mas lojas menores podem ter um ticket médio melhor. Podemos mostrar ambas as informações se for útil.',
        oQueRespostaVaiDefinir: 'A lista de filiais participantes e os filtros de unidade no painel.',
        requisitoRelacionadoId: 'req_comparativo_filiais',
        tipoResolucao: 'PERGUNTAR_CONTRATANTE',
        comoPensarComoAnalista: 'Comparar filiais é requisito explícito. No entanto, comparar unidades de portes diferentes apenas pelo faturamento absoluto pode gerar conclusões injustas; preparar visões de volume e participação percentual enriquece o diagnóstico.',
        entendaTecnicamente: 'Criação de hierarquia dimensional Filial/Loja e medidas DAX com ALL/CALCULATE para percentual de participação.',
        porQuePrecisoPerguntar: 'Para saber quais unidades devem entrar e se há filtros regionais específicos.',
        oQuePodeDarErradoSeNaoPerguntar: 'Incluir filiais inativas ou recém-inauguradas que distorcem o ranking e geram questionamentos na reunião.',
        oQueRespostaVaiMudar: 'Define os filtros de unidade e os visuais de comparação por filial no painel.',
        bloqueioEspecifico: 'Não bloqueia o modelo, mas orienta o layout da tela de filiais.',
      });
    }

    // 5. DEFINIÇÃO DE INDICADORES: Conceito de Faturamento & Critério de Ranking
    const mencionaFaturamento = /\b(faturamento|receita)\b/.test(textoSemAcento);
    const temQualificadorFaturamento = /\b(brut[oa]|liquid[oa]|faturad[oa]|recebid[oa])\b/.test(textoSemAcento);
    if (mencionaFaturamento && !temQualificadorFaturamento) {
      itensFaltantes.push('Definição de "faturamento" no contexto da empresa não explicitada.');
      const trechoFaturamento = this.extrairTrechoVerbatim(original, textoSemAcento, /\b(como o faturamento esta evoluindo|faturamento esta evoluindo|evolucao do faturamento|faturamento)\b/);
      perguntas.push({
        id: 'intake_perg_definicao_faturamento',
        pergunta: 'O que a empresa considera “faturamento” nesse contexto?',
        motivacao: 'Garante que os números calculados no painel sejam idênticos aos acompanhados pela contabilidade e diretoria, prevenindo divergências conceituais.',
        categoria: 'DEFINICAO_INDICADORES',
        prioridade: 'ALTA',
        bloqueanteRecomendado: true,
        prioridadeNivel: 'ESSENCIAL_BLOQUEANTE',
        justificativaPrioridade: 'Divergência conceitual entre faturamento bruto e líquido gera números que a diretoria pode rejeitar.',
        oQueContratantePediu: trechoFaturamento || 'Não informado no Pedido Original.',
        lacunaIdentificadaCopiloto: 'Lacuna identificada pelo Copiloto: O faturamento foi solicitado, mas sua definição contábil (bruto vs líquido vs recebido) não foi detalhada.',
        oQueAindaPrecisamosSaber: 'Se o valor a considerar é a soma do total das vendas, se desconta impostos ou deduções, ou se há outra definição interna.',
        porQueImportaAnalise: 'Determina a fórmula exata da medida principal de receita no modelo analítico.',
        perguntaSugeridaContratante: 'Quando você analisa o faturamento, você considera o valor total das vendas ou utiliza um valor já com deduções ou descontos?',
        comoExplicarContratante: 'Pergunto porque diferentes setores da empresa podem olhar para o faturamento de formas distintas. Queremos garantir que os números do painel batam exatamente com o que a diretoria está acostumada a acompanhar.',
        seContratanteNaoEntender: 'Pergunto porque o dinheiro total das vendas pode diferir do valor líquido se houver deduções ou devoluções que a diretoria costuma descontar.',
        oQueRespostaVaiDefinir: 'A fórmula exata de cálculo do indicador de vendas/faturamento.',
        requisitoRelacionadoId: 'req_evolucao_faturamento',
        tipoResolucao: 'PERGUNTAR_CONTRATANTE',
        comoPensarComoAnalista: 'Faturamento não é automaticamente receita. Preservar o termo utilizado pelo contratante e checar as regras contábeis adotadas pela empresa para que os números batam.',
        entendaTecnicamente: 'Define a fórmula DAX da medida principal de receita: SUM simples vs SUMX com filtros de cancelamentos e impostos.',
        porQuePrecisoPerguntar: 'Para garantir que os números do painel batam exatamente com o que a contabilidade e a diretoria acompanham.',
        oQuePodeDarErradoSeNaoPerguntar: 'Apresentar um faturamento que a diretoria considere incorreto por divergir dos relatórios oficiais da empresa.',
        oQueRespostaVaiMudar: 'Determina a fórmula DAX de cálculo da receita principal.',
        bloqueioEspecifico: 'Bloqueia a homologação final dos totais de venda da demanda.',
      });
    }

    const mencionaRankingProdutos = /\b(vendendo mais|vendendo menos|mais vendid|menos vendid|mais venderam|menos venderam|mais vendem|menos vendem|puxando essa queda|puxando|ranking)\b/.test(textoSemAcento);
    if (mencionaRankingProdutos) {
      itensFaltantes.push('Critério de ordenação de produtos (quantidade física vs faturamento financeiro) não especificado.');
      const trechoRanking = this.extrairTrechoVerbatim(
        original,
        textoSemAcento,
        /\b(queria saber quais produtos estao vendendo mais, quais estao vendendo menos|quais produtos estao vendendo mais, quais estao vendendo menos|quais produtos estao vendendo mais|quais produtos vendem mais|produtos que mais venderam e os que menos venderam|mais venderam e os que menos venderam)\b/
      );
      perguntas.push({
        id: 'intake_perg_criterio_ranking_produtos',
        pergunta: '“Produtos vendendo mais/menos” significa quantidade, faturamento ou ambos?',
        motivacao: 'Um produto pode ter alto volume de unidades mas baixo tíquete, ou vice-versa; o critério de ordenação do ranking precisa estar alinhado com a intenção analítica.',
        categoria: 'DEFINICAO_INDICADORES',
        prioridade: 'ALTA',
        bloqueanteRecomendado: true,
        prioridadeNivel: 'ESSENCIAL_BLOQUEANTE',
        justificativaPrioridade: 'A definição de "vender mais" é ambígua e orienta diretamente quais colunas são necessárias e quais medidas serão calculadas.',
        oQueContratantePediu: trechoRanking || 'Não informado no Pedido Original.',
        lacunaIdentificadaCopiloto: 'Lacuna identificada pelo Copiloto: O contratante pediu produtos mais e menos vendidos, mas o critério (quantidade vs valor) é ambíguo e precisa ser esclarecido.',
        oQueAindaPrecisamosSaber: 'Se o critério de ranking deve ser quantidade física de peças, valor total em dinheiro faturado, ou ambos.',
        porQueImportaAnalise: 'Evita distorção analítica: itens baratos de alto volume diferem completamente de itens caros de baixo volume. Define as medidas de ranking no dashboard.',
        perguntaSugeridaContratante: 'Quando você fala em produtos que vendem mais e menos, gostaria de comparar pela quantidade vendida, pelo valor das vendas ou pelas duas informações?',
        comoExplicarContratante: 'Um produto pode vender muitas unidades e gerar menos dinheiro que outro. Por isso precisamos saber qual comparação é mais importante para vocês.',
        seContratanteNaoEntender: 'Um produto pode vender muitas unidades e gerar menos dinheiro que outro. Por isso precisamos saber qual comparação é mais importante para vocês.',
        oQueRespostaVaiDefinir: 'Indicadores, dados necessários, ranking e apresentação dos produtos.',
        requisitoRelacionadoId: 'req_ranking_produtos',
        tipoResolucao: 'PERGUNTAR_CONTRATANTE',
        comoPensarComoAnalista: 'Antes de criar um ranking, determinar qual pergunta de negócio esse ranking precisa responder. Ranking por volume identifica giro e esforço operacional; ranking por valor identifica impacto financeiro.',
        entendaTecnicamente: 'Define se criaremos medidas DAX distintas para RANKX por Quantidade ([Total Itens]) e por Receita ([Total Faturamento]), ou alternância dinâmica via parâmetros de campos.',
        porQuePrecisoPerguntar: 'Porque "vender mais" pode significar giro de estoque em unidades ou receita gerada em dinheiro.',
        oQuePodeDarErradoSeNaoPerguntar: 'Montar o painel por volume e na reunião a liderança pedir para ver faturamento, invalidando a ordem apresentada.',
        oQueRespostaVaiMudar: 'Define se o visual de produtos ordenará por unidades, por reais ou terá um botão de alternância.',
        bloqueioEspecifico: 'Bloqueia o desenho definitivo do visual de ranking de produtos no painel.',
      });
    }

    // 6. DADOS DISPONÍVEIS: Campos / Colunas da fonte
    if (ativosDados.length > 0) {
      const expressaDesconhecimentoColunas = /\b(nao sei|sem saber|desconhec|nao tenho certeza|nao sei as colunas|nao sei exatamente quais colunas)\b/.test(textoSemAcento);
      const listaColunasConhecidas = /\b(colunas? (sao|de|com)|campos? (sao|de|com)|layout com)\b/.test(textoSemAcento);
      const precisaEsclarecerColunas = expressaDesconhecimentoColunas || !listaColunasConhecidas;
      if (precisaEsclarecerColunas) {
        itensFaltantes.push('Estrutura de colunas e campos disponíveis na planilha/base de vendas não informada.');
        const trechoPlanilha = this.extrairTrechoVerbatim(original, textoSemAcento, /\b(tenho uma planilha com as vendas|planilha com as vendas|planilha de vendas|planilha excel|planilha)\b/);
        perguntas.push({
          id: 'intake_perg_colunas_planilha',
          pergunta: 'Quais campos/colunas estão disponíveis na planilha?',
          motivacao: 'Permite avaliar antecipadamente a completude dos dados e planejar as etapas de engenharia e modelagem dimensional.',
          categoria: 'DADOS_FONTE',
          prioridade: 'ALTA',
          bloqueanteRecomendado: true,
          prioridadeNivel: 'ESSENCIAL_BLOQUEANTE',
          justificativaPrioridade: 'Sem acesso à planilha, é impossível verificar se os campos necessários para faturamento, produtos e filiais existem.',
          oQueContratantePediu: trechoPlanilha || 'Não informado no Pedido Original.',
          lacunaIdentificadaCopiloto: 'Lacuna identificada pelo Copiloto: A base de vendas foi citada, mas a estrutura detalhada de colunas e dados não foi informada no pedido e deverá ser investigada na fonte.',
          oQueAindaPrecisamosSaber: 'Quais colunas e tipos de dados existem na planilha fornecida (ex: data, filial, produto, valor, quantidade, etc.).',
          porQueImportaAnalise: 'Determina a viabilidade técnica de calcular cada KPI solicitado e orienta a etapa de engenharia e transformação de dados.',
          perguntaSugeridaContratante: 'Você poderia nos disponibilizar o arquivo da planilha para analisarmos as informações disponíveis?',
          comoExplicarContratante: 'Precisamos verificar quais informações estão registradas na planilha (como datas, lojas, produtos e valores) para confirmar se conseguimos calcular todos os números que você pediu.',
          seContratanteNaoEntender: 'Precisamos abrir a planilha para checar se ela contém todas as datas, nomes de produtos e valores necessários para montar o painel.',
          oQueRespostaVaiDefinir: 'A viabilidade das métricas solicitadas e a estrutura de importação dos dados.',
          requisitoRelacionadoId: 'req_base_planilha',
          tipoResolucao: 'INVESTIGAR_DADOS',
          comoPensarComoAnalista: 'Não devemos sobrecarregar o contratante com perguntas técnicas sobre nomes de colunas. Assim que o arquivo for disponibilizado, o analista investiga a estrutura diretamente nos dados.',
          entendaTecnicamente: 'Inspeção do schema tabular, validação de tipos de dados (datas, números, textos), presença de chaves primárias e detecção de nulos.',
          porQuePrecisoPerguntar: 'Para ter acesso ao arquivo físico e iniciar a inspeção técnica.',
          oQuePodeDarErradoSeNaoPerguntar: 'Prometer cálculos sem saber se a planilha possui colunas fundamentais como filial, data ou preço.',
          oQueRespostaVaiMudar: 'Permitirá ao analista inspecionar diretamente as colunas e desenhar as etapas de preparação dos dados.',
          bloqueioEspecifico: 'Bloqueia o início da ingestão e preparação dos dados até o recebimento do arquivo.',
        });
      }
    } else {
      itensFaltantes.push('Fonte de dados e formato dos arquivos não foram explicitados.');
      perguntas.push({
        id: 'intake_perg_dados_fonte',
        pergunta: 'Em qual formato e local os dados necessários estão disponíveis (planilha Excel, arquivo CSV, banco de dados ou extração de sistema)?',
        motivacao: 'É indispensável saber a origem física dos dados para dimensionar a ingestão e as validações de schema.',
        categoria: 'DADOS_FONTE',
        prioridade: 'ALTA',
        bloqueanteRecomendado: true,
        prioridadeNivel: 'ESSENCIAL_BLOQUEANTE',
        justificativaPrioridade: 'Sem acesso ou conhecimento da fonte de dados, nenhuma análise pode ser iniciada.',
        oQueContratantePediu: 'Não informado no Pedido Original.',
        lacunaIdentificadaCopiloto: 'Lacuna identificada pelo Copiloto: A fonte e o formato dos arquivos necessários não foram explicitados no pedido.',
        oQueAindaPrecisamosSaber: 'Onde estão armazenados os dados e em qual formato serão fornecidos.',
        porQueImportaAnalise: 'Define a arquitetura de conexão e os tratamentos prévios de extração.',
        perguntaSugeridaContratante: 'Em qual formato e onde os dados de vendas estão disponíveis (por exemplo, planilha Excel, relatório extraído do sistema ou banco de dados)?',
        comoExplicarContratante: 'Precisamos saber onde os dados estão guardados para entender como vamos acessá-los e carregá-los para o trabalho.',
        seContratanteNaoEntender: 'Precisamos saber onde os dados estão guardados para entender como vamos acessá-los e carregá-los para o trabalho.',
        oQueRespostaVaiDefinir: 'O método de obtenção e ingestão dos dados.',
        requisitoRelacionadoId: 'req_fonte_dados',
        tipoResolucao: 'PERGUNTAR_CONTRATANTE',
        comoPensarComoAnalista: 'Saber a origem física permite planejar o conector apropriado e o volume de tratamento necessário.',
        entendaTecnicamente: 'Configuração de conector de dados (Folder, SQL Server, Excel.Workbook, Csv.Document) no Power Query.',
        porQuePrecisoPerguntar: 'Para saber qual conector de ingestão utilizar.',
        oQuePodeDarErradoSeNaoPerguntar: 'Planejar uma carga de planilha e descobrir que os dados estão em um banco corporativo com restrição de acesso.',
        oQueRespostaVaiMudar: 'Define a arquitetura de ingestão.',
        bloqueioEspecifico: 'Bloqueia o início de qualquer atividade técnica com os dados.',
      });
    }

    // 7. REGRAS / EXCEÇÕES
    const mencionaExcecoes = /\b(cancelad|estorn|devolu|ativo|inativ|bloquead|teste)\b/.test(textoSemAcento);
    if (!mencionaExcecoes) {
      itensFaltantes.push('Critérios de exclusão e tratamento de registros excepcionais não declarados.');
      perguntas.push({
        id: 'intake_perg_excecoes',
        pergunta: 'Existem transações de teste, cancelamentos, estornos ou devoluções que devem ficar de fora da apuração das vendas?',
        motivacao: 'Evita somar vendas canceladas ou de teste e define quais registros devem ficar de fora da análise. 📘 Nome profissional: expurgo de registros e regras de negócio.',
        categoria: 'REGRA_NEGOCIO',
        prioridade: 'MEDIA',
        bloqueanteRecomendado: false,
        prioridadeNivel: 'IMPORTANTE',
        justificativaPrioridade: 'Registros cancelados ou de teste distorcem faturamento e rankings se computados indevidamente.',
        oQueContratantePediu: 'Não informado no Pedido Original.',
        lacunaIdentificadaCopiloto: 'Lacuna identificada pelo Copiloto: O pedido não menciona se existem vendas canceladas, devoluções, estornos ou registros de teste que devam ser desconsiderados.',
        oQueAindaPrecisamosSaber: 'Se a planilha contém vendas canceladas, estornos, devoluções ou registros de teste que não devem ser somados.',
        porQueImportaAnalise: 'Evita somar vendas canceladas ou de teste e define quais registros devem ficar de fora. 📘 Nome profissional: expurgo de registros.',
        perguntaSugeridaContratante: 'Existem vendas que não devem entrar nos resultados, como vendas canceladas, devoluções, estornos ou registros de teste?',
        comoExplicarContratante: 'Pergunto porque esses registros podem alterar os números apresentados se forem considerados como vendas válidas.',
        seContratanteNaoEntender: 'Pergunto porque esses registros podem alterar os números apresentados se forem considerados como vendas válidas.',
        oQueRespostaVaiDefinir: 'Os filtros de exclusão de vendas e regras de validação dos totais.',
        requisitoRelacionadoId: 'req_regras_excecao',
        tipoResolucao: 'PERGUNTAR_CONTRATANTE',
        comoPensarComoAnalista: 'Dados comerciais brutos quase sempre trazem pedidos cancelados ou testes. Se forem somados, inflam o faturamento e geram perda de credibilidade. Na linguagem profissional, chamamos a exclusão desses registros de expurgo.',
        entendaTecnicamente: 'Regras de filtragem na ingestão do Power Query e filtros nas medidas DAX (ex: Pedidos[Status] <> "Cancelado").',
        porQuePrecisoPerguntar: 'Porque as regras de cancelamento e devolução são políticas internas da empresa, não inferências técnicas.',
        oQuePodeDarErradoSeNaoPerguntar: 'Superestimar o faturamento por somar pedidos cancelados ou testes internos.',
        oQueRespostaVaiMudar: 'Define as etapas de tratamento e exclusão de linhas na preparação da base.',
        bloqueioEspecifico: 'Não bloqueia o layout, mas bloqueia a homologação dos números finais de venda.',
      });
    }

    // 8. GRANULARIDADE / MODELAGEM
    const mencionaGrao = /\b(diari|mensal|semanal|transac|linha|pedido|item|nota|cupom)\b/.test(textoSemAcento);
    if (!mencionaGrao) {
      itensFaltantes.push('Granularidade da análise não especificada (nível de detalhe por linha).');
      perguntas.push({
        id: 'intake_perg_granularidade',
        pergunta: 'Os indicadores devem ser consolidados mensalmente/diariamente ou a análise exige visibilidade até o nível de transação individual/item?',
        motivacao: 'Essa resposta ajuda a definir o nível de detalhe da análise e como os dados precisarão ser organizados. 📘 Nome profissional: granularidade dos dados e modelo dimensional.',
        categoria: 'GRANULARIDADE',
        prioridade: 'BAIXA',
        bloqueanteRecomendado: false,
        prioridadeNivel: 'EXPLORATORIA',
        justificativaPrioridade: 'Ajusta a flexibilidade de navegação no painel, mas totais gerais podem ser calculados mesmo se o detalhe for simplificado.',
        oQueContratantePediu: 'Não informado no Pedido Original.',
        lacunaIdentificadaCopiloto: 'Lacuna identificada pelo Copiloto: O nível de profundidade e detalhamento temporal/transacional não foi explicitado.',
        oQueAindaPrecisamosSaber: 'Precisamos descobrir se cada linha representa uma venda, um produto vendido, um dia ou um total mensal. 📘 Nome profissional: granularidade dos dados.',
        porQueImportaAnalise: 'Essa resposta ajuda a definir o nível de detalhe da análise e como os dados precisarão ser organizados. 📘 Nome profissional: granularidade da tabela fato.',
        perguntaSugeridaContratante: 'Você precisa apenas dos totais por dia ou mês ou também gostaria de conseguir chegar ao detalhe de cada venda e produto?',
        comoExplicarContratante: 'Isso nos ajuda a definir até que nível de detalhe o painel precisa permitir investigar os resultados.',
        seContratanteNaoEntender: 'Isso nos ajuda a definir até que nível de detalhe o painel precisa permitir investigar os resultados.',
        oQueRespostaVaiDefinir: 'A profundidade das tabelas e o nível de detalhamento disponível para exploração no painel.',
        requisitoRelacionadoId: 'req_granularidade_detalhe',
        tipoResolucao: 'PERGUNTAR_CONTRATANTE',
        comoPensarComoAnalista: 'O painel deve permitir visão macro para a diretoria, mas se houver necessidade de auditoria, o usuário precisará descer até o detalhe do item. Na linguagem profissional, chamamos esse nível de detalhe de granularidade.',
        entendaTecnicamente: 'Nível de detalhamento da Tabela Fato de Vendas e hierarquia da Dimensão Calendário no modelo dimensional.',
        porQuePrecisoPerguntar: 'Para definir a flexibilidade dos visuais de detalhamento do painel.',
        oQuePodeDarErradoSeNaoPerguntar: 'Entregar apenas números consolidados e o cliente pedir para auditar um pedido específico.',
        oQueRespostaVaiMudar: 'Define se teremos telas de detalhamento analítico no painel.',
        bloqueioEspecifico: 'Não bloqueia o projeto; orienta a navegação analítica.',
      });
    }

    // Ordenação determinística baseada na hierarquia analítica de negócio:
    const ordemPrioridade: Record<string, number> = {
      OBJETIVO_DECISAO: 1,
      PUBLICO_STAKEHOLDER: 2,
      PRAZO_MARCO: 3,
      TEMPORALIDADE: 4,
      ESCOPO: 5,
      DEFINICAO_INDICADORES: 6,
      CRITERIOS_SUCESSO: 7,
      DADOS_FONTE: 8,
      REGRA_NEGOCIO: 9,
      GRANULARIDADE: 10,
      ENTREGAVEL: 11,
    };

    perguntas.sort((a, b) => {
      const pesoA = ordemPrioridade[a.categoria] ?? 99;
      const pesoB = ordemPrioridade[b.categoria] ?? 99;
      if (pesoA !== pesoB) return pesoA - pesoB;
      if (a.bloqueanteRecomendado !== b.bloqueanteRecomendado) {
        return a.bloqueanteRecomendado ? -1 : 1;
      }
      return 0;
    });

    return { itensFaltantes, perguntasPriorizadas: perguntas };
  }

  // ==========================================================================
  // GERAÇÃO DA PROPOSTA DE ESTRUTURA OPERACIONAL
  // ==========================================================================

  private gerarPropostaEstrutural(params: {
    dominio: DominioNegocioIntake;
    problemaAparente: string;
    objetivoProvavel: string;
    contextoIdentificado: string;
    prazoMencionado: string | null;
    perguntasPriorizadas: PerguntaClarificacaoIntake[];
    textoSemAcento: string;
    kpisExplicitados: IndicadorKpiIdentificado[];
    dimensoes: string[];
  }): PropostaEstruturaOperacional {
    const {
      dominio,
      problemaAparente,
      objetivoProvavel,
      contextoIdentificado,
      prazoMencionado,
      perguntasPriorizadas,
      textoSemAcento,
      kpisExplicitados,
      dimensoes,
    } = params;

    let nomeProjeto = 'Iniciativa Analítica de Negócio';
    let descProjeto = 'Projeto guarda-chuva para organização de demandas e entregáveis analíticos.';
    let justificativaNome = 'Proposta sintética derivada da intenção e domínio identificados.';

    let tituloDemanda = 'Análise Exploratória e Diagnóstico Inicial';

    switch (dominio) {
      case 'VENDAS':
        nomeProjeto = 'Diagnóstico de Vendas e Desempenho Comercial';
        descProjeto = 'Iniciativa estratégica voltada à análise do comportamento de faturamento, vendas e carteira de produtos.';
        justificativaNome = 'Identificada demanda comercial com necessidade de análise de faturamento/vendas e desempenho de produtos.';
        if (textoSemAcento.includes('queda') || textoSemAcento.includes('cairam') || textoSemAcento.includes('caiu')) {
          tituloDemanda = 'Análise Causal de Queda de Vendas e Desempenho por Produto';
        } else {
          tituloDemanda = 'Estruturação de Painel Comercial e Acompanhamento de Vendas';
        }
        break;

      case 'FINANCEIRO':
        nomeProjeto = 'Gestão Financeira e Conciliação de Resultados';
        descProjeto = 'Iniciativa analítica para consolidação de fluxos financeiros, apuração de margens e auditoria de números.';
        justificativaNome = 'Identificada solicitação com foco em indicadores financeiros, fluxo de caixa e custos/margens.';
        tituloDemanda = 'Estruturação de DRE Gerencial e Fluxo de Caixa';
        break;

      case 'ESTOQUE_LOGISTICA':
        nomeProjeto = 'Otimização de Estoque e Cadeia Logística';
        descProjeto = 'Iniciativa voltada ao balanceamento de estoques, prevenção de rupturas e cálculo de giros de materiais.';
        justificativaNome = 'Identificada solicitação com foco em estoque, estoques críticos e movimentação logística.';
        tituloDemanda = 'Diagnóstico de Ruptura, Giro e Curva ABC de Estoque';
        break;

      case 'RH_PESSOAS':
        nomeProjeto = 'People Analytics e Gestão de Pessoal';
        descProjeto = 'Iniciativa para monitoramento de indicadores de capital humano, rotatividade e absenteísmo.';
        justificativaNome = 'Identificada solicitação referente a métricas de equipe, colaboradores e desligamentos.';
        tituloDemanda = 'Diagnóstico de Turnover, Absenteísmo e Composição do Headcount';
        break;

      case 'SAUDE_PUBLICA':
        nomeProjeto = 'Gestão em Saúde e Acompanhamento de Atendimentos';
        descProjeto = 'Iniciativa pública/institucional para acompanhamento de filas, atendimentos e indicadores de saúde.';
        justificativaNome = 'Identificada solicitação envolvendo pacientes, unidades de saúde e tempos de espera.';
        tituloDemanda = 'Monitoramento de Atendimentos e Filas em Unidades de Saúde';
        break;

      case 'GERAL':
      default:
        nomeProjeto = 'Estruturação Analítica e Inteligência de Negócio';
        descProjeto = 'Iniciativa geral para organização de dados e apoio à tomada de decisão executiva.';
        justificativaNome = 'Domínio geral deduzido a partir de solicitação inicial do usuário.';
        tituloDemanda = 'Estruturação de Indicadores e Diagnóstico Inicial';
        break;
    }

    let objetivoNatural = objetivoProvavel;
    if (dominio === 'VENDAS') {
      const temFiliais = /\b(filial|filiais|loja|lojas|unidade|unidades)\b/.test(textoSemAcento);
      const temProdutos = /\b(produto|produtos|item|itens)\b/.test(textoSemAcento);
      const temFaturamento = /\b(faturamento|receita)\b/.test(textoSemAcento);
      const temVendas = /\b(venda|vendas)\b/.test(textoSemAcento);

      if (temVendas && temFaturamento && temProdutos && temFiliais) {
        objetivoNatural =
          'Criar um painel que permita acompanhar vendas e faturamento, identificar produtos com maior e menor desempenho e comparar as filiais.';
      } else if (temProdutos && temFiliais) {
        objetivoNatural =
          'Criar um painel que permita acompanhar o desempenho de vendas por produto e comparar os resultados entre filiais.';
      } else if (temProdutos) {
        objetivoNatural =
          'Criar um painel que permita acompanhar o desempenho de vendas e identificar produtos com maior e menor saída.';
      }
    }

    return {
      projetoSugerido: {
        nome: nomeProjeto,
        descricao: descProjeto,
        justificativaNome,
      },
      demandaSugerida: {
        titulo: tituloDemanda,
        objetivoInicial: objetivoProvavel,
        objetivoNatural,
        contexto: contextoIdentificado,
        restricoesDeclaradas: prazoMencionado ? `Prazo mencionado na solicitação original: ${prazoMencionado}` : null,
        prazoEsperado: prazoMencionado,
      },
      perguntasPreliminaresSugeridas: perguntasPriorizadas,
    };
  }

  // ==========================================================================
  // CLASSIFICAÇÃO DOS REQUISITOS (Feedback Operacional #004)
  // Segregação estrita em:
  // - REQUISITO_ESSENCIAL
  // - REQUISITO_PENDENTE_ESCLARECIMENTO
  // - SUGESTAO_ANALITICA_ADICIONAL
  // - NAO_DEFINIDO_INVESTIGAR
  // Cada item inclui:
  // - "Por que classifiquei assim?" (justificativaClassificacao)
  // - Origem no Pedido Original (trecho verbatim ou null)
  // - Rastreabilidade (necessidade → pergunta → impacto)
  // ==========================================================================

  private classificarRequisitos(params: {
    original: string;
    textoSemAcento: string;
    fatos: ResultadoAnaliseIntake['fatos'];
    inferencias: ResultadoAnaliseIntake['inferencias'];
    perguntas: PerguntaClarificacaoIntake[];
  }): ItemRequisitoAnalisado[] {
    const { original, textoSemAcento, fatos, inferencias, perguntas } = params;
    const requisitos: ItemRequisitoAnalisado[] = [];

    const temPergunta = (id: string) => perguntas.some((p) => p.id === id);

    // ========================================================================
    // CONCEITO A: REQUISITOS DE NEGÓCIO (Explicitamente solicitados)
    // ========================================================================

    // 1. Entregável: Painel de Vendas
    const dashboardExplicito = fatos.entregaveisExplicitamenteSolicitados.find((e) => e.tipo === 'DASHBOARD');
    if (dashboardExplicito) {
      const trechoPainel = this.extrairTrechoVerbatim(
        original,
        textoSemAcento,
        /\b(painel para entender como estao as vendas da empresa|painel para entender como estao as vendas|painel de vendas|painel gerencial|dashboard|painel|bi)\b/
      );
      requisitos.push({
        id: 'req_painel_visual',
        titulo: 'Painel para Análise das Vendas',
        descricao: 'Construção de painel visual para acompanhamento e entendimento do desempenho de vendas da empresa.',
        classificacao: 'REQUISITO_ESSENCIAL',
        conceito: 'REQUISITO_NEGOCIO',
        justificativaClassificacao: 'Item explicitamente solicitado pelo contratante no Pedido Original como entregável principal da demanda. Precisamos disso para atender ao pedido. 📘 Nome profissional: requisito essencial de negócio.',
        origemPedidoOriginal: trechoPainel,
        rastreabilidade: {
          necessidadeIdentificada: 'Visualização estruturada e acessível para apoiar o entendimento das vendas pela liderança.',
          perguntaRelacionadaId: temPergunta('intake_perg_uso_painel') ? 'intake_perg_uso_painel' : undefined,
          impactoAnalise: 'Estruturação do painel visual, dimensionamento de telas e definição de filtros interativos.',
        },
      });
    }

    // 2. Indicador: Evolução do Faturamento ao Longo do Tempo
    const temFaturamento = textoSemAcento.includes('faturamento') || textoSemAcento.includes('receita');
    if (temFaturamento) {
      const trechoFaturamento = this.extrairTrechoVerbatim(
        original,
        textoSemAcento,
        /\b(como o faturamento esta evoluindo|faturamento esta evoluindo|evolucao do faturamento|faturamento)\b/
      );
      requisitos.push({
        id: 'req_evolucao_faturamento',
        titulo: 'Evolução do Faturamento ao Longo do Tempo',
        descricao: 'Apuração e apresentação visual da curva temporal de faturamento nos períodos registrados, preservando a terminologia utilizada pelo contratante.',
        classificacao: 'REQUISITO_ESSENCIAL',
        conceito: 'REQUISITO_NEGOCIO',
        justificativaClassificacao: 'Métrica essencial explicitamente demandada pelo contratante no Pedido Original para entender o comportamento das vendas ao longo do tempo. Precisamos disso para atender ao pedido. 📘 Nome profissional: requisito essencial de negócio.',
        origemPedidoOriginal: trechoFaturamento,
        rastreabilidade: {
          necessidadeIdentificada: 'Acompanhar a trajetória temporal de crescimento, estabilidade ou retração do faturamento.',
          perguntaRelacionadaId: temPergunta('intake_perg_definicao_faturamento') ? 'intake_perg_definicao_faturamento' : undefined,
          impactoAnalise: 'Criação da medida temporal principal e gráficos de linha com análise de tendência.',
        },
      });
    }

    // 3. Comparativo de Desempenho entre Filiais
    const temFiliais = /\b(filial|filiais|loja|lojas|unidade|unidades)\b/.test(textoSemAcento);
    if (temFiliais) {
      const trechoFiliais = this.extrairTrechoVerbatim(
        original,
        textoSemAcento,
        /\b(tambem queria conseguir comparar as filiais|queria conseguir comparar as filiais|conseguir comparar as filiais|comparar as filiais|filiais)\b/
      );
      requisitos.push({
        id: 'req_comparativo_filiais',
        titulo: 'Comparativo de Desempenho entre Filiais',
        descricao: 'Segmentação e confrontação dos resultados de vendas entre as diferentes unidades da empresa.',
        classificacao: 'REQUISITO_ESSENCIAL',
        conceito: 'REQUISITO_NEGOCIO',
        justificativaClassificacao: 'Comparação entre filiais explicitamente solicitada pelo contratante no Pedido Original. Precisamos disso para atender ao pedido. 📘 Nome profissional: requisito essencial de negócio.',
        origemPedidoOriginal: trechoFiliais,
        rastreabilidade: {
          necessidadeIdentificada: 'Identificar assimetrias de desempenho entre filiais para apoiar a gestão comercial.',
          perguntaRelacionadaId: temPergunta('intake_perg_escopo_filiais') ? 'intake_perg_escopo_filiais' : undefined,
          impactoAnalise: 'Criação de visualizações comparativas por filial e segmentação na dimensão de unidades.',
        },
      });
    }

    // 4. Ativo de Dados: Disponibilização da Planilha de Vendas
    if (fatos.ativosDadosMencionados.length > 0) {
      const ativo = fatos.ativosDadosMencionados[0];
      const trechoPlanilha = this.extrairTrechoVerbatim(
        original,
        textoSemAcento,
        /\b(tenho uma planilha com as vendas|planilha com as vendas|planilha excel|planilha)\b/
      );
      requisitos.push({
        id: 'req_base_planilha',
        titulo: `Disponibilização da Planilha de Vendas (${ativo.termoVerbatim})`,
        descricao: 'Fornecimento da planilha de vendas mencionada pelo contratante como insumo para a base analítica.',
        classificacao: 'REQUISITO_ESSENCIAL',
        conceito: 'REQUISITO_NEGOCIO',
        justificativaClassificacao: 'Insumo de dados indispensável citado pelo contratante para viabilizar as análises. Precisamos disso para atender ao pedido. 📘 Nome profissional: requisito essencial de negócio.',
        origemPedidoOriginal: trechoPlanilha,
        rastreabilidade: {
          necessidadeIdentificada: 'Obtenção dos registros comerciais para processamento e modelagem analítica.',
          perguntaRelacionadaId: temPergunta('intake_perg_colunas_planilha') ? 'intake_perg_colunas_planilha' : undefined,
          impactoAnalise: 'Ingestão física, validação de integridade e preparação da base tabular.',
        },
      });
    }

    // ========================================================================
    // CONCEITO D: SOLUÇÕES TÉCNICAS PROPOSTAS (Propostas pelo Workspace)
    // ========================================================================

    requisitos.push({
      id: 'req_solucao_powerbi',
      titulo: 'Solução Técnica Proposta pelo Workspace: Power BI',
      descricao: 'Ferramenta proposta pelo Workspace para construir o painel visual, organizar os dados e calcular os indicadores. 📘 Nome profissional: Microsoft Power BI com modelagem e fórmulas DAX.',
      classificacao: 'SOLUCAO_TECNICA_PROPOSTA',
      conceito: 'SOLUCAO_TECNICA',
      justificativaClassificacao: 'O contratante solicitou um painel, sem especificar ferramenta. O Power BI é a solução técnica recomendada pelo Workspace para entrega analítica de BI. 📘 Nome profissional: solução técnica proposta.',
      origemPedidoOriginal: null,
      lacunaIdentificadaCopiloto: 'Lacuna identificada pelo Copiloto: A ferramenta técnica de visualização (Power BI, Excel, etc.) não foi especificada no Pedido Original.',
      rastreabilidade: {
        necessidadeIdentificada: 'Plataforma técnica para construção do painel de BI.',
        impactoAnalise: 'Estruturação do arquivo PBIX, modelo em estrela e medidas em linguagem DAX.',
      },
    });

    // ========================================================================
    // CONCEITO B: DEFINIÇÕES PENDENTES (Informações para tornar o requisito preciso)
    // ========================================================================

    // 1. Ranking de Produtos: Quantidade vs Faturamento vs Ambos
    const temRanking = /\b(vendendo mais|vendendo menos|mais vendid|menos vendid|mais venderam|menos venderam|mais vendem|menos vendem|ranking)\b/.test(textoSemAcento);
    if (temRanking) {
      const trechoRanking = this.extrairTrechoVerbatim(
        original,
        textoSemAcento,
        /\b(queria saber quais produtos estao vendendo mais, quais estao vendendo menos|quais produtos estao vendendo mais, quais estao vendendo menos|quais produtos estao vendendo mais|quais produtos vendem mais|produtos que mais venderam e os que menos venderam|mais venderam e os que menos venderam)\b/
      );
      requisitos.push({
        id: 'req_ranking_produtos',
        titulo: 'Critério de Ranking dos Produtos Mais e Menos Vendidos',
        descricao: 'Esclarecimento sobre o critério de ordenação de produtos: quantidade física de unidades vendidas, valor monetário do faturamento ou ambas as informações.',
        classificacao: 'REQUISITO_PENDENTE_ESCLARECIMENTO',
        conceito: 'DEFINICAO_PENDENTE',
        justificativaClassificacao: 'Existe ambiguidade no significado de "vender mais" no Pedido Original (pode significar giro em peças ou receita em reais); mantido como definição pendente até validação humana. 📘 Nome profissional: definição pendente de negócio.',
        origemPedidoOriginal: trechoRanking,
        rastreabilidade: {
          necessidadeIdentificada: 'Determinar qual pergunta de negócio o ranking de produtos precisa responder.',
          perguntaRelacionadaId: temPergunta('intake_perg_criterio_ranking_produtos') ? 'intake_perg_criterio_ranking_produtos' : undefined,
          impactoAnalise: 'Determina se as medidas de ranking ordenarão por quantidade física, faturamento financeiro ou permitirão alternância dinâmica.',
        },
      });
    }

    // 2. Formas Específicas de Comparação entre Filiais
    if (temFiliais) {
      requisitos.push({
        id: 'req_formas_comparacao_filiais',
        titulo: 'Critérios e Formas de Comparação entre Filiais',
        descricao: 'Definição dos critérios específicos de comparação entre unidades (faturamento absoluto, quantidade vendida, ticket médio, participação percentual).',
        classificacao: 'REQUISITO_PENDENTE_ESCLARECIMENTO',
        conceito: 'DEFINICAO_PENDENTE',
        justificativaClassificacao: 'Comparar filiais é requisito explícito do contratante, mas as formas específicas de comparação (absoluto, percentual, ticket) constituem definições pendentes.',
        origemPedidoOriginal: null,
        lacunaIdentificadaCopiloto: 'Lacuna identificada pelo Copiloto: O Pedido Original solicita comparar filiais, mas não detalha se a comparação deve ser por faturamento absoluto, volume físico, ticket médio ou participação percentual.',
        rastreabilidade: {
          necessidadeIdentificada: 'Definir as métricas comparativas que comporão a tela de filiais.',
          perguntaRelacionadaId: temPergunta('intake_perg_escopo_filiais') ? 'intake_perg_escopo_filiais' : undefined,
          impactoAnalise: 'Construção de visuais de ranking, participação no total e ticket médio por unidade.',
        },
      });
    }

    // 3. Mapeamento da Estrutura de Colunas da Planilha (Investigar nos dados)
    if (fatos.ativosDadosMencionados.length > 0 && temPergunta('intake_perg_colunas_planilha')) {
      const trechoColunas = this.extrairTrechoVerbatim(
        original,
        textoSemAcento,
        /\b(nao sei exatamente quais colunas ela tem|nao sei as colunas exatas)\b/
      );
      requisitos.push({
        id: 'req_estrutura_colunas',
        titulo: 'Mapeamento da Estrutura de Colunas da Planilha',
        descricao: 'Identificação dos nomes, tipos de dados e formatos das colunas existentes na planilha de vendas.',
        classificacao: 'REQUISITO_PENDENTE_ESCLARECIMENTO',
        conceito: 'DEFINICAO_PENDENTE',
        justificativaClassificacao: 'A base de vendas foi citada, mas a estrutura e completude de campos não foram informadas no Pedido Original e deverão ser investigadas diretamente nos dados após o recebimento do arquivo.',
        origemPedidoOriginal: trechoColunas,
        lacunaIdentificadaCopiloto: trechoColunas ? undefined : 'Lacuna identificada pelo Copiloto: A estrutura detalhada de colunas não foi informada no Pedido Original e deverá ser investigada diretamente nos dados após o recebimento da planilha.',
        rastreabilidade: {
          necessidadeIdentificada: 'Validar a presença dos campos necessários (data, filial, produto, valor, quantidade) na fonte.',
          perguntaRelacionadaId: 'intake_perg_colunas_planilha',
          impactoAnalise: 'Define as etapas de transformação no Power Query e validação de consistência dos tipos de dados.',
        },
      });
    }

    // 4. Período Histórico de Vendas
    const temPeriodoVendas = fatos.periodoJanelaTemporalMencionada !== null || textoSemAcento.includes('trimestre') || textoSemAcento.includes('mes');
    if (temPeriodoVendas) {
      const trechoPeriodo = fatos.periodoJanelaTemporalMencionada?.termoVerbatim || this.extrairTrechoVerbatim(original, textoSemAcento, /\b(ultimo trimestre|ultimos meses|trimestre)\b/);
      requisitos.push({
        id: 'req_periodo_vendas',
        titulo: 'Delimitação Exata do Período Histórico de Vendas',
        descricao: 'Definição das datas exatas de início e fim da janela de vendas a analisar.',
        classificacao: 'REQUISITO_PENDENTE_ESCLARECIMENTO',
        conceito: 'DEFINICAO_PENDENTE',
        justificativaClassificacao: 'Existe um período mencionado ou inferido, mas falta confirmação das datas específicas de início e fim.',
        origemPedidoOriginal: trechoPeriodo,
        lacunaIdentificadaCopiloto: trechoPeriodo ? undefined : 'Lacuna identificada pelo Copiloto: O período histórico das vendas não foi delimitado com datas específicas.',
        rastreabilidade: {
          necessidadeIdentificada: 'Delimitar o corte temporal exato para os cálculos comparativos.',
          perguntaRelacionadaId: temPergunta('intake_perg_temporalidade') ? 'intake_perg_temporalidade' : undefined,
          impactoAnalise: 'Configuração da dimensão calendário e filtros temporais do painel.',
        },
      });
    }

    // 5. Granularidade e Regras de Exceção (Ainda não definidos / A investigar)
    requisitos.push({
      id: 'req_granularidade_detalhe',
      titulo: 'Nível de Detalhamento Transacional dos Dados (Granularidade)',
      descricao: 'Decisão sobre se a análise deve ser consolidada (diária/mensal) ou detalhada por item/transação individual. Precisamos descobrir se cada linha representa uma venda, um produto vendido, um dia ou um total mensal. 📘 Nome profissional: granularidade dos dados.',
      classificacao: 'NAO_DEFINIDO_INVESTIGAR',
      conceito: 'DEFINICAO_PENDENTE',
      justificativaClassificacao: 'Ainda não existe evidência no Pedido Original se a liderança precisa apenas de números consolidados ou se necessita investigar até a linha da transação. 📘 Nome profissional: definição pendente de granularidade.',
      origemPedidoOriginal: null,
      lacunaIdentificadaCopiloto: 'Lacuna identificada pelo Copiloto: Nível de detalhamento e granularidade (diário, mensal ou transacional) não informado no Pedido Original.',
      rastreabilidade: {
        necessidadeIdentificada: 'Definir o nível de detalhe analítico necessário.',
        perguntaRelacionadaId: temPergunta('intake_perg_granularidade') ? 'intake_perg_granularidade' : undefined,
        impactoAnalise: 'Essa resposta ajuda a definir o nível de detalhe da análise e como os dados precisarão ser organizados. 📘 Nome profissional: granularidade da tabela fato e modelo dimensional.',
      },
    });

    requisitos.push({
      id: 'req_regras_excecao',
      titulo: 'Regras de Expurgo e Tratamento de Exceções (Cancelamentos / Devoluções)',
      descricao: 'Definição sobre a inclusão ou exclusão de registros de teste, cancelamentos, devoluções e estornos. Identifica quais registros devem ficar de fora. 📘 Nome profissional: expurgo de registros e regras de negócio.',
      classificacao: 'NAO_DEFINIDO_INVESTIGAR',
      conceito: 'DEFINICAO_PENDENTE',
      justificativaClassificacao: 'Ainda não existe evidência no Pedido Original sobre ocorrência de vendas canceladas, testes ou estornos que devam ser expurgados da apuração. 📘 Nome profissional: expurgo de registros.',
      origemPedidoOriginal: null,
      lacunaIdentificadaCopiloto: 'Lacuna identificada pelo Copiloto: Critérios de cancelamentos, estornos ou registros de teste não mencionados no Pedido Original.',
      rastreabilidade: {
        necessidadeIdentificada: 'Garantir integridade dos números contra registros cancelados ou testes.',
        perguntaRelacionadaId: temPergunta('intake_perg_excecoes') ? 'intake_perg_excecoes' : undefined,
        impactoAnalise: 'Criação de filtros de status na camada de transformação para conciliação dos números.',
      },
    });

    // ========================================================================
    // CONCEITO C: SUGESTÕES ANALÍTICAS (Valor agregado proposto pelo Copiloto)
    // ========================================================================

    // Opções Analíticas de Evolução Temporal (MoM / YoY / Mensal)
    if (temFaturamento) {
      requisitos.push({
        id: 'req_opcoes_evolucao_faturamento',
        titulo: 'Opções Analíticas de Evolução Temporal (MoM / YoY / Mensal)',
        descricao: 'Alternativas analíticas para mensurar a evolução solicitada (Mês a Mês, Ano a Ano ou diário). Só conseguiremos fazer essa comparação se a planilha tiver dados de períodos anteriores. 📘 Nome profissional: cálculo de evolução período a período (MoM / YoY).',
        classificacao: 'SUGESTAO_ANALITICA_ADICIONAL',
        conceito: 'SUGESTAO_ANALITICA',
        justificativaClassificacao: 'MoM e YoY são técnicas analíticas possíveis recomendadas pelo Copiloto para detalhar a evolução temporal solicitada, sujeitas à deliberação humana e não constituindo requisitos pré-confirmados. 📘 Nome profissional: sugestão analítica adicional.',
        origemPedidoOriginal: null,
        rastreabilidade: {
          necessidadeIdentificada: 'Oferecer opções técnicas para enriquecer o requisito essencial de evolução do faturamento.',
          impactoAnalise: 'Criação de medidas DAX comparativas dependentes de histórico suficiente na base.',
        },
      });
    }

    const sugestoesKpi = inferencias.indicadoresSugeridos;
    for (const sug of sugestoesKpi) {
      requisitos.push({
        id: `req_sugestao_${this.slugify(sug.nome)}`,
        titulo: `${sug.nome} (Sugestão Copiloto)`,
        descricao: sug.oQueE || sug.descricao,
        classificacao: 'SUGESTAO_ANALITICA_ADICIONAL',
        conceito: 'SUGESTAO_ANALITICA',
        justificativaClassificacao: `Não foi solicitado explicitamente no Pedido Original, mas é uma recomendação analítica do Copiloto (${sug.porQueSugerido || 'agrega valor ao diagnóstico'}) sujeita à deliberação humana.`,
        origemPedidoOriginal: null,
        rastreabilidade: {
          necessidadeIdentificada: sug.oQueAjudaResponder || 'Enriquecer o diagnóstico com métricas analíticas complementares.',
          impactoAnalise: sug.comoCalcular ? `Cálculo de medida adicional: ${sug.comoCalcular}` : 'Cálculo de métrica analítica complementar.',
        },
      });
    }

    return requisitos;
  }

  // ==========================================================================
  // SÍNTESE ANALÍTICA, ESTADO DE PRONTIDÃO E PRÓXIMA AÇÃO (Feedback #005)
  // Sem scores artificiais ou porcentagens; baseada em raciocínio explicável
  // ==========================================================================

  private gerarSinteseEProximaAcao(params: {
    solicitacaoOriginal: string;
    fatos: ResultadoAnaliseIntake['fatos'];
    inferencias: ResultadoAnaliseIntake['inferencias'];
    requisitos: ItemRequisitoAnalisado[];
    perguntas: PerguntaClarificacaoIntake[];
  }): SinteseProximaAcaoIntake {
    const { fatos, inferencias, requisitos, perguntas } = params;

    const oQueJaSabemos: string[] = [];
    if (fatos.entregaveisExplicitamenteSolicitados.some((e) => e.tipo === 'DASHBOARD')) {
      oQueJaSabemos.push('Construção de painel para acompanhamento das vendas explicitamente solicitada.');
    }
    if (fatos.indicadoresExplicitamenteMencionados.some((i) => i.nome.toLowerCase().includes('faturamento'))) {
      oQueJaSabemos.push('A evolução do faturamento ao longo do tempo é requisito essencial de negócio.');
    }
    if (requisitos.some((r) => r.id === 'req_comparativo_filiais')) {
      oQueJaSabemos.push('A comparação de desempenho entre filiais é requisito essencial de negócio.');
    }
    if (fatos.ativosDadosMencionados.length > 0) {
      oQueJaSabemos.push(`Existe uma fonte de dados identificada (${fatos.ativosDadosMencionados.map((a) => a.termoVerbatim).join(', ')}).`);
    }
    if (fatos.prazoMencionado) {
      oQueJaSabemos.push(`Marco de entrega mencionado: ${fatos.prazoMencionado}.`);
    }
    if (oQueJaSabemos.length === 0) {
      oQueJaSabemos.push('Solicitação inicial registrada e preservada verbatim.');
    }

    const oQueAindaPrecisamosEsclarecer: string[] = [];
    const oQuePodemosInvestigarNosDados: string[] = [];
    const oQueAindaNaoDevemosDefinir: string[] = [
      'Não promover métricas analíticas adicionais (MoM, YoY, Curva ABC) a requisitos definitivos antes de inspecionar a base.',
      'Não assumir regra 80/20 como fato presumido; a concentração real deve ser calculada a partir dos dados.',
      'Não substituir silenciosamente "faturamento" por "receita" nem pré-fixar conceitos contábeis sem confirmação.',
      'Não impor ferramentas técnicas específicas (Power BI) ao contratante sem alinhamento prévio.',
    ];

    for (const p of perguntas) {
      if (p.tipoResolucao === 'INVESTIGAR_DADOS') {
        oQuePodemosInvestigarNosDados.push(p.oQueAindaPrecisamosSaber || p.pergunta);
      } else if (
        p.tipoResolucao === 'PERGUNTAR_CONTRATANTE' &&
        (p.prioridadeNivel === 'ESSENCIAL_BLOQUEANTE' || p.prioridadeNivel === 'IMPORTANTE')
      ) {
        oQueAindaPrecisamosEsclarecer.push(p.oQueAindaPrecisamosSaber || p.pergunta);
      }
    }

    const temPerguntasBloqueantesContratante = perguntas.some(
      (p) => p.tipoResolucao === 'PERGUNTAR_CONTRATANTE' && p.prioridadeNivel === 'ESSENCIAL_BLOQUEANTE'
    );
    const temInvestigacaoDados = perguntas.some((p) => p.tipoResolucao === 'INVESTIGAR_DADOS');

    let estadoProntidao: EstadoProntidaoIntake;
    let estadoProntidaoRotulo: string;
    let motivoEstadoProntidao: string;
    let proximaAcaoRecomendada: string;
    let porQueEstaEaProximaAcao: string;

    if (temPerguntasBloqueantesContratante) {
      estadoProntidao = 'AINDA_PRECISAMOS_ESCLARECER';
      estadoProntidaoRotulo = 'Ainda precisamos esclarecer';
      motivoEstadoProntidao = 'Existem definições pendentes de negócio que bloqueiam o fechamento do escopo (ex.: critério de ranking de produtos, definição de faturamento e data da reunião).';
      proximaAcaoRecomendada = 'Alinhar com o contratante as perguntas essenciais de negócio e solicitar o envio da planilha.';
      porQueEstaEaProximaAcao = 'Esclarecer se "produtos que vendem mais" significa volume físico ou faturamento em reais evita retrabalho e orienta a inspeção correta dos dados.';
    } else if (temInvestigacaoDados) {
      estadoProntidao = 'PRONTO_INSPECIONAR_DADOS';
      estadoProntidaoRotulo = 'Pronto para inspecionar os dados';
      motivoEstadoProntidao = 'Requisitos de negócio principais estão delineados, aguardando acesso e inspeção da base de dados.';
      proximaAcaoRecomendada = 'Carregar e inspecionar a planilha para verificar colunas, tipos de dados e volume.';
      porQueEstaEaProximaAcao = 'A inspeção direta da planilha revelará se as colunas necessárias para faturamento, filiais e produtos existem de fato.';
    } else {
      estadoProntidao = 'PRONTO_CONSOLIDAR_REQUISITOS';
      estadoProntidaoRotulo = 'Pronto para consolidar requisitos';
      motivoEstadoProntidao = 'Evidências suficientes coletadas para formalizar o escopo da primeira demanda.';
      proximaAcaoRecomendada = 'Consolidar requisitos confirmados e preparar estrutura de projeto/demanda.';
      porQueEstaEaProximaAcao = 'Com as dúvidas sanadas e dados inspecionados, o projeto pode ser materializado com baixo risco.';
    }

    return {
      oQueJaSabemos,
      oQueAindaPrecisamosEsclarecer,
      oQuePodemosInvestigarNosDados,
      oQueAindaNaoDevemosDefinir,
      estadoProntidao: {
        estado: estadoProntidao,
        label: estadoProntidaoRotulo,
        motivo: motivoEstadoProntidao,
      },
      proximaAcaoRecomendada: {
        acao: proximaAcaoRecomendada,
        porQueEstaAcao: porQueEstaEaProximaAcao,
      },
    };
  }

  // ==========================================================================
  // ROTEIRO PARA CONVERSA COM O CONTRATANTE (Feedback Operacional #004)
  // Gera texto limpo e organizado com apenas as perguntas selecionadas
  // ==========================================================================

  static gerarRoteiroContratante(
    perguntasSelecionadas: PerguntaClarificacaoIntake[],
    demandaTitulo?: string
  ): string {
    if (!perguntasSelecionadas || perguntasSelecionadas.length === 0) {
      return 'Nenhuma pergunta foi selecionada para o roteiro com o contratante.';
    }

    const titulo = demandaTitulo?.trim() || 'Alinhamento de Requisitos da Demanda';
    const linhas: string[] = [];

    linhas.push(`# Roteiro de Alinhamento com o Contratante`);
    linhas.push(`**Demanda:** ${titulo}`);
    linhas.push(`**Data:** ${new Date().toLocaleDateString('pt-BR')}`);
    linhas.push('');
    linhas.push(
      'Olá! Para estruturarmos o trabalho com precisão e garantir que os resultados atendam exatamente ao que você precisa, separamos algumas perguntas rápidas sobre as informações necessárias:'
    );
    linhas.push('');

    perguntasSelecionadas.forEach((p, index) => {
      const textoPergunta = p.perguntaSugeridaContratante || p.pergunta;
      linhas.push(`### ${index + 1}. ${textoPergunta}`);
      if (p.comoExplicarContratante) {
        linhas.push(`*Por que precisamos saber disso:* ${p.comoExplicarContratante}`);
      } else if (p.motivacao) {
        linhas.push(`*Contexto:* ${p.motivacao}`);
      }
      linhas.push('');
    });

    linhas.push('---');
    linhas.push('Ficamos à disposição para esclarecer qualquer ponto. Muito obrigado!');

    return linhas.join('\n');
  }

  private extrairTrechoVerbatim(original: string, semAcento: string, regex: RegExp): string | null {
    const match = semAcento.match(regex);
    if (match && match.index !== undefined) {
      const trecho = original.slice(match.index, match.index + match[0].length);
      if (original.includes(trecho)) {
        return trecho;
      }
    }
    return null;
  }

  private slugify(texto: string): string {
    return this.removerAcentosPreservandoComprimento(texto)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }
}

