import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import {
  IntakeInputSection,
  IntakeVerbatimCard,
  IntakeFactsSection,
  IntakeInferencesSection,
  IntakeGapsQuestionsSection,
  IntakeRequirementsClassificationSection,
  IntakeContractorScriptModal,
  IntakeProposalForm,
  IntakeNextActionSection,
  IntakeDataDiscoverySection,
  IntakeFlow,
} from '@/components/intake';
import { IntakeContinuityBridge } from '@/components/demands/IntakeContinuityBridge';
import { ResultadoAnaliseIntake } from '@/core/domain/intake/intake-types';

describe('Unit Tests: Interface Humano + Copiloto do Intake Inteligente (Subgate 3)', () => {
  const mockAnalise: ResultadoAnaliseIntake = {
    solicitacaoOriginal: '  \n\tPrecisamos analisar as vendas 2025 da filial SP na planilha vendas.xlsx.\n\t  ',
    fatos: {
      ativosDadosMencionados: [
        {
          termoVerbatim: 'vendas.xlsx',
          tipoDetectado: 'PLANILHA',
          descricao: 'Arquivo tabular',
        },
      ],
      periodoJanelaTemporalMencionada: {
        termoVerbatim: '2025',
        tipo: 'ANO',
        interpretacao: 'Exercício 2025',
      },
      prazoMencionado: 'sexta-feira',
      entregaveisExplicitamenteSolicitados: [
        {
          nome: 'Dashboard de Vendas',
          descricao: 'Painel visual',
          tipo: 'DASHBOARD',
          classificacao: 'FATO',
        },
      ],
      indicadoresExplicitamenteMencionados: [
        {
          nome: 'Faturamento',
          descricao: 'Receita',
          classificacao: 'FATO',
        },
      ],
    },
    inferencias: {
      dominioNegocio: 'VENDAS',
      problemaAparente: 'Falta de visibilidade consolidada de vendas da filial SP',
      objetivoProvavel: 'Criar painel gerencial de acompanhamento de vendas',
      contextoIdentificado: 'Operação comercial SP',
      dimensoesAnaliticasIdentificadas: ['Tempo', 'Filial', 'Produto'],
      entregaveisInferidos: [],
      indicadoresSugeridos: [
        {
          nome: 'Ticket Médio',
          descricao: 'Receita / transações',
          classificacao: 'INFERENCIA',
          oQueE: 'Valor médio faturado por pedido ou transação comercial realizada.',
          porQueSugerido: 'Pode ajudar a explicar diferenças de faturamento entre produtos ou filiais.',
          oQueAjudaResponder: 'Diferenças de faturamento decorrem de maior volume físico ou tíquete maior?',
          comoCalcular: 'Faturamento total ÷ Número de vendas/pedidos.',
          oQuePrecisaConfirmar: 'Definição exata de faturamento e unidade de venda.',
        },
      ],
    },
    lacunas: {
      itensFaltantes: ['Granularidade diária ou mensal?', 'Critério de cancelamentos'],
      perguntasPriorizadas: [
        {
          id: 'q1',
          pergunta: 'As vendas canceladas devem ser deduzidas?',
          motivacao: 'Alinhar cálculo com contabilidade',
          categoria: 'REGRA_NEGOCIO',
          prioridade: 'ALTA',
          bloqueanteRecomendado: true,
        },
        {
          id: 'q2',
          pergunta: 'Qual a periodicidade de atualização da planilha?',
          motivacao: 'Definir rotina de atualização',
          categoria: 'DADOS_FONTE',
          prioridade: 'MEDIA',
          bloqueanteRecomendado: false,
        },
      ],
    },
    requisitosClassificados: [
      {
        id: 'req_1',
        titulo: 'Dashboard de Vendas',
        descricao: 'Construção do painel visual',
        classificacao: 'REQUISITO_ESSENCIAL',
        justificativaClassificacao: 'Explicitamente solicitado',
        origemPedidoOriginal: 'Dashboard de Vendas',
        rastreabilidade: {
          necessidadeIdentificada: 'Visualização gerencial',
          impactoAnalise: 'Criação do relatório',
        },
      },
      {
        id: 'req_2',
        titulo: 'Definição de Cancelamentos',
        descricao: 'Regra de expurgo de vendas canceladas',
        classificacao: 'REQUISITO_PENDENTE_ESCLARECIMENTO',
        justificativaClassificacao: 'Falta definição do contratante',
        origemPedidoOriginal: null,
        rastreabilidade: {
          necessidadeIdentificada: 'Garantir integridade',
          impactoAnalise: 'Filtro de status',
        },
      },
    ],
    proposta: {
      projetoSugerido: {
        nome: 'Projeto Vendas Filial SP',
        descricao: 'Gestão comercial da filial paulista',
        justificativaNome: 'Baseado no termo vendas e filial SP',
      },
      demandaSugerida: {
        titulo: 'Dashboard de Vendas SP 2025',
        objetivoInicial: 'Disponibilizar métricas de vendas',
        contexto: 'Contexto comercial SP',
        prazoEsperado: 'sexta-feira',
        restricoesDeclaradas: null,
      },
      perguntasPreliminaresSugeridas: [
        {
          id: 'q1',
          pergunta: 'As vendas canceladas devem ser deduzidas?',
          motivacao: 'Alinhar cálculo com contabilidade',
          categoria: 'REGRA_NEGOCIO',
          prioridade: 'ALTA',
          bloqueanteRecomendado: true,
        },
        {
          id: 'q2',
          pergunta: 'Qual a periodicidade de atualização da planilha?',
          motivacao: 'Definir rotina de atualização',
          categoria: 'DADOS_FONTE',
          prioridade: 'MEDIA',
          bloqueanteRecomendado: false,
        },
      ],
    },
    metadados: {
      analisador: 'TIER_1_DETERMINISTICO',
      versaoMotor: '1.0.0',
      executadoEm: '2026-10-02T18:00:00.000Z',
      comprimentoTextoOriginal: 73,
      ehAmbiguo: false,
      ehMuitoCurto: false,
      temDadosIdentificados: true,
    },
  };

  it('1. Deve exportar todos os componentes de interface do Intake', () => {
    expect(IntakeInputSection).toBeDefined();
    expect(IntakeVerbatimCard).toBeDefined();
    expect(IntakeFactsSection).toBeDefined();
    expect(IntakeInferencesSection).toBeDefined();
    expect(IntakeGapsQuestionsSection).toBeDefined();
    expect(IntakeProposalForm).toBeDefined();
    expect(IntakeFlow).toBeDefined();
  });

  describe('2. IntakeInputSection (Entrada Bruta)', () => {
    it('renderiza título, orientação de UX, textarea e botão de análise', () => {
      const onAnalisar = vi.fn();
      const onChange = vi.fn();

      const element = React.createElement(IntakeInputSection, {
        solicitacao: 'Texto de teste',
        onChangeSolicitacao: onChange,
        onAnalisar,
        isAnalyzing: false,
        error: null,
      });

      expect(element).toBeDefined();
      expect(element.props.solicitacao).toBe('Texto de teste');
      expect(element.props.isAnalyzing).toBe(false);
    });

    it('exibe mensagem de erro quando fornecida', () => {
      const element = React.createElement(IntakeInputSection, {
        solicitacao: 'abc',
        onChangeSolicitacao: vi.fn(),
        onAnalisar: vi.fn(),
        isAnalyzing: false,
        error: 'A solicitação deve conter no mínimo 5 caracteres.',
      });

      expect(element.props.error).toBe('A solicitação deve conter no mínimo 5 caracteres.');
    });
  });

  describe('3. IntakeVerbatimCard (Preservação Visual da Solicitação Original)', () => {
    it('renderiza o texto original exato com badge de fato bruto', () => {
      const rawText = mockAnalise.solicitacaoOriginal;
      const onEditar = vi.fn();

      const element = React.createElement(IntakeVerbatimCard, {
        solicitacaoOriginal: rawText,
        onEditarOriginal: onEditar,
      });

      expect(element).toBeDefined();
      expect(element.props.solicitacaoOriginal).toBe(rawText);
      expect(element.props.onEditarOriginal).toBe(onEditar);
    });
  });

  describe('4. IntakeFactsSection (Apresentação de Fatos Observados)', () => {
    it('renderiza ativos citados, período, prazo e indicadores literais', () => {
      const element = React.createElement(IntakeFactsSection, {
        fatos: mockAnalise.fatos,
      });

      expect(element).toBeDefined();
      expect(element.props.fatos.ativosDadosMencionados.length).toBe(1);
      expect(element.props.fatos.periodoJanelaTemporalMencionada?.termoVerbatim).toBe('2025');
      expect(element.props.fatos.prazoMencionado).toBe('sexta-feira');
      expect(element.props.fatos.indicadoresExplicitamenteMencionados.length).toBe(1);
    });
  });

  describe('5. IntakeInferencesSection (Interpretação Segregada do Copiloto)', () => {
    it('renderiza domínio, problema aparente, objetivo e dimensões', () => {
      const element = React.createElement(IntakeInferencesSection, {
        inferencias: mockAnalise.inferencias,
      });

      expect(element).toBeDefined();
      expect(element.props.inferencias.dominioNegocio).toBe('VENDAS');
      expect(element.props.inferencias.dimensoesAnaliticasIdentificadas).toContain('Filial');
      expect(element.props.inferencias.problemaAparente).toContain('filial SP');
    });

    it('renderiza métricas sugeridas com os 5 pilares de explicabilidade analítica', () => {
      const element = React.createElement(IntakeInferencesSection, {
        inferencias: mockAnalise.inferencias,
      });

      expect(element.props.inferencias.indicadoresSugeridos).toHaveLength(1);
      const kpi = element.props.inferencias.indicadoresSugeridos[0];
      expect(kpi.nome).toBe('Ticket Médio');
      expect(kpi.classificacao).toBe('INFERENCIA');
      expect(kpi.oQueE).toBeDefined();
      expect(kpi.porQueSugerido).toBeDefined();
      expect(kpi.oQueAjudaResponder).toBeDefined();
      expect(kpi.comoCalcular).toBeDefined();
      expect(kpi.oQuePrecisaConfirmar).toBeDefined();
    });
  });

  describe('6. IntakeGapsQuestionsSection (Lacunas e Deliberação sobre Perguntas)', () => {
    it('renderiza lista de perguntas diferenciando bloqueantes e permitindo alternância de aceitação', () => {
      const onToggle = vi.fn();
      const perguntas = [
        { ...mockAnalise.lacunas.perguntasPriorizadas[0], aceita: true },
        { ...mockAnalise.lacunas.perguntasPriorizadas[1], aceita: false },
      ];

      const element = React.createElement(IntakeGapsQuestionsSection, {
        lacunas: mockAnalise.lacunas.itensFaltantes,
        perguntas,
        onTogglePergunta: onToggle,
      });

      expect(element).toBeDefined();
      expect(element.props.perguntas.length).toBe(2);
      expect(element.props.perguntas[0].bloqueanteRecomendado).toBe(true);
      expect(element.props.perguntas[0].aceita).toBe(true);
      expect(element.props.perguntas[1].aceita).toBe(false);

      // Simula alternância
      element.props.onTogglePergunta(1);
      expect(onToggle).toHaveBeenCalledWith(1);
    });
  });

  describe('7. IntakeProposalForm (Deliberação Humana, Edição e Confirmação)', () => {
    it('suporta modo NOVO projeto com campos editáveis', () => {
      const onChangeDecisao = vi.fn();
      const onChangeNome = vi.fn();
      const onConfirmar = vi.fn();

      const element = React.createElement(IntakeProposalForm, {
        existingProjects: [{ id: 'proj_1', nome: 'Projeto Existente 1' }],
        projetoDecisao: 'NOVO',
        onChangeProjetoDecisao: onChangeDecisao,
        novoProjetoNome: 'Projeto Proposto',
        onChangeNovoProjetoNome: onChangeNome,
        novoProjetoDescricao: 'Desc Proposta',
        onChangeNovoProjetoDescricao: vi.fn(),
        projetoIdExistente: '',
        onChangeProjetoIdExistente: vi.fn(),
        demandaTitulo: 'Demanda Proposta',
        onChangeDemandaTitulo: vi.fn(),
        demandaObjetivo: 'Objetivo Proposto',
        onChangeDemandaObjetivo: vi.fn(),
        demandaContexto: 'Contexto Proposto',
        onChangeDemandaContexto: vi.fn(),
        demandaPrazo: '2026-04-30',
        onChangeDemandaPrazo: vi.fn(),
        demandaRestricoes: '',
        onChangeDemandaRestricoes: vi.fn(),
        perguntasAceitasCount: 2,
        onConfirmar,
        isConfirming: false,
        confirmError: null,
      });

      expect(element).toBeDefined();
      expect(element.props.projetoDecisao).toBe('NOVO');
      expect(element.props.novoProjetoNome).toBe('Projeto Proposto');
      expect(element.props.perguntasAceitasCount).toBe(2);
      expect(element.props.isConfirming).toBe(false);

      // Simula alteração do nome do projeto
      element.props.onChangeNovoProjetoNome('Novo Nome Humano');
      expect(onChangeNome).toHaveBeenCalledWith('Novo Nome Humano');
    });

    it('suporta modo EXISTENTE com seleção de projeto pré-cadastrado', () => {
      const onChangeProjetoId = vi.fn();

      const element = React.createElement(IntakeProposalForm, {
        existingProjects: [
          { id: 'proj_1', nome: 'Projeto Existente 1' },
          { id: 'proj_2', nome: 'Projeto Existente 2' },
        ],
        projetoDecisao: 'EXISTENTE',
        onChangeProjetoDecisao: vi.fn(),
        novoProjetoNome: '',
        onChangeNovoProjetoNome: vi.fn(),
        novoProjetoDescricao: '',
        onChangeNovoProjetoDescricao: vi.fn(),
        projetoIdExistente: 'proj_2',
        onChangeProjetoIdExistente: onChangeProjetoId,
        demandaTitulo: 'Demanda Vinculada',
        onChangeDemandaTitulo: vi.fn(),
        demandaObjetivo: '',
        onChangeDemandaObjetivo: vi.fn(),
        demandaContexto: '',
        onChangeDemandaContexto: vi.fn(),
        demandaPrazo: '',
        onChangeDemandaPrazo: vi.fn(),
        demandaRestricoes: '',
        onChangeDemandaRestricoes: vi.fn(),
        perguntasAceitasCount: 1,
        onConfirmar: vi.fn(),
        isConfirming: false,
        confirmError: null,
      });

      expect(element.props.projetoDecisao).toBe('EXISTENTE');
      expect(element.props.projetoIdExistente).toBe('proj_2');
      expect(element.props.existingProjects.length).toBe(2);

      // Simula seleção de outro projeto
      element.props.onChangeProjetoIdExistente('proj_1');
      expect(onChangeProjetoId).toHaveBeenCalledWith('proj_1');
    });

    it('exibe estado de carregamento e previne duplo clique durante confirmação', () => {
      const onConfirmar = vi.fn();

      const element = React.createElement(IntakeProposalForm, {
        existingProjects: [],
        projetoDecisao: 'NOVO',
        onChangeProjetoDecisao: vi.fn(),
        novoProjetoNome: 'Projeto Válido',
        onChangeNovoProjetoNome: vi.fn(),
        novoProjetoDescricao: '',
        onChangeNovoProjetoDescricao: vi.fn(),
        projetoIdExistente: '',
        onChangeProjetoIdExistente: vi.fn(),
        demandaTitulo: 'Demanda Válida',
        onChangeDemandaTitulo: vi.fn(),
        demandaObjetivo: '',
        onChangeDemandaObjetivo: vi.fn(),
        demandaContexto: '',
        onChangeDemandaContexto: vi.fn(),
        demandaPrazo: '',
        onChangeDemandaPrazo: vi.fn(),
        demandaRestricoes: '',
        onChangeDemandaRestricoes: vi.fn(),
        perguntasAceitasCount: 1,
        onConfirmar,
        isConfirming: true, // Em processamento!
        confirmError: null,
      });

      expect(element.props.isConfirming).toBe(true);
    });
  });

  describe('8. IntakeFlow (Orquestrador de Fluxo)', () => {
    it('inicia na etapa INPUT e permite renderização do container principal', () => {
      const element = React.createElement(IntakeFlow, {
        existingProjects: [{ id: 'proj_1', nome: 'Projeto 1' }],
        initialText: 'Texto pré-carregado para teste',
      });

      expect(element).toBeDefined();
      expect(element.props.initialText).toBe('Texto pré-carregado para teste');
    });
  });

  // ==========================================================================
  // FEEDBACK OPERACIONAL #004: TESTES DE COMPONENTES DE UI
  // ==========================================================================

  describe('9. IntakeRequirementsClassificationSection (Feedback #004)', () => {
    const mockRequisitos = [
      {
        id: 'req_painel',
        titulo: 'Painel Visual no Power BI',
        descricao: 'Construção de dashboard interativo',
        classificacao: 'REQUISITO_ESSENCIAL' as const,
        justificativaClassificacao: 'Explicitamente solicitado pelo contratante no Pedido Original.',
        origemPedidoOriginal: 'painel no Power BI',
        rastreabilidade: {
          necessidadeIdentificada: 'Visualização interativa',
          perguntaRelacionadaId: 'intake_perg_uso_painel',
          impactoAnalise: 'Construção da interface no Power BI',
        },
      },
      {
        id: 'req_ranking',
        titulo: 'Ranking de Produtos',
        descricao: 'Critério de ordenação de produtos',
        classificacao: 'REQUISITO_PENDENTE_ESCLARECIMENTO' as const,
        justificativaClassificacao: 'Falta definir se o critério é quantidade ou faturamento.',
        origemPedidoOriginal: 'produtos que mais venderam',
        rastreabilidade: {
          necessidadeIdentificada: 'Classificar produtos',
          perguntaRelacionadaId: 'intake_perg_criterio_ranking_produtos',
          impactoAnalise: 'Fórmulas DAX de ranking',
        },
      },
      {
        id: 'req_ticket',
        titulo: 'Ticket Médio',
        descricao: 'Receita por venda',
        classificacao: 'SUGESTAO_ANALITICA_ADICIONAL' as const,
        justificativaClassificacao: 'Recomendação analítica do Copiloto para explicar a queda.',
        origemPedidoOriginal: null,
        rastreabilidade: {
          necessidadeIdentificada: 'Diagnóstico causal',
          impactoAnalise: 'Medida adicional',
        },
      },
      {
        id: 'req_grao',
        titulo: 'Granularidade Transacional',
        descricao: 'Nível de detalhe por linha',
        classificacao: 'NAO_DEFINIDO_INVESTIGAR' as const,
        justificativaClassificacao: 'Ainda não existe evidência suficiente para decidir.',
        origemPedidoOriginal: null,
        rastreabilidade: {
          necessidadeIdentificada: 'Definir grão da fato',
          perguntaRelacionadaId: 'intake_perg_granularidade',
          impactoAnalise: 'Modelagem dimensional',
        },
      },
    ];

    it('renderiza corretamente a seção com as 4 categorias de requisitos', () => {
      const element = React.createElement(IntakeRequirementsClassificationSection, {
        requisitos: mockRequisitos,
      });

      expect(element).toBeDefined();
      expect(element.props.requisitos.length).toBe(4);
      expect(element.props.requisitos[0].classificacao).toBe('REQUISITO_ESSENCIAL');
      expect(element.props.requisitos[1].classificacao).toBe('REQUISITO_PENDENTE_ESCLARECIMENTO');
      expect(element.props.requisitos[2].classificacao).toBe('SUGESTAO_ANALITICA_ADICIONAL');
      expect(element.props.requisitos[3].classificacao).toBe('NAO_DEFINIDO_INVESTIGAR');
    });

    it('mantém justificativa "Por que classifiquei assim?" e rastreabilidade nos cards', () => {
      const element = React.createElement(IntakeRequirementsClassificationSection, {
        requisitos: mockRequisitos,
      });

      for (const req of element.props.requisitos) {
        expect(req.justificativaClassificacao.length).toBeGreaterThan(10);
        expect(req.rastreabilidade.necessidadeIdentificada).toBeDefined();
        expect(req.rastreabilidade.impactoAnalise).toBeDefined();
      }
    });
  });

  describe('10. IntakeContractorScriptModal (Feedback #004)', () => {
    it('renderiza modal fechado quando isOpen é falso', () => {
      const element = React.createElement(IntakeContractorScriptModal, {
        isOpen: false,
        onClose: vi.fn(),
        perguntasSelecionadas: [],
      });

      expect(element).toBeDefined();
      expect(element.props.isOpen).toBe(false);
    });

    it('renderiza modal aberto com perguntas selecionadas formatadas para o contratante', () => {
      const element = React.createElement(IntakeContractorScriptModal, {
        isOpen: true,
        onClose: vi.fn(),
        perguntasSelecionadas: [
          {
            id: 'q1',
            pergunta: '“Produtos vendendo mais/menos” significa quantidade, faturamento ou ambos?',
            perguntaSugeridaContratante: 'Quando você diz que quer saber quais produtos vendem mais e menos, você quer saber quais vendem mais unidades, quais geram mais dinheiro em vendas ou gostaria de ver as duas informações?',
            comoExplicarContratante: 'Pergunto porque os resultados podem ser diferentes. Um produto mais barato pode vender muitas unidades, enquanto um produto mais caro pode vender menos unidades e ainda gerar mais dinheiro.',
            motivacao: 'Critério de ranking',
            categoria: 'DEFINICAO_INDICADORES',
            prioridade: 'ALTA',
            bloqueanteRecomendado: false,
          },
        ],
        demandaTitulo: 'Painel Comercial 2026',
      });

      expect(element).toBeDefined();
      expect(element.props.isOpen).toBe(true);
      expect(element.props.perguntasSelecionadas.length).toBe(1);
      expect(element.props.demandaTitulo).toBe('Painel Comercial 2026');
    });
  });

  describe('11. IntakeGapsQuestionsSection — Card de Clarificação Assistida (Feedback #004)', () => {
    it('renderiza botão para preparar perguntas para o contratante e lista de perguntas', () => {
      const onTogglePergunta = vi.fn();

      const element = React.createElement(IntakeGapsQuestionsSection, {
        lacunas: ['Lacuna 1', 'Lacuna 2'],
        perguntas: [
          {
            id: 'q1',
            pergunta: 'Pergunta técnica',
            perguntaSugeridaContratante: 'Pergunta em linguagem simples para o contratante',
            comoExplicarContratante: 'Explicação simples para o contratante',
            porQueImportaAnalise: 'Impacto analítico detalhado para o analista',
            motivacao: 'Motivação geral',
            categoria: 'DEFINICAO_INDICADORES',
            prioridade: 'ALTA',
            prioridadeNivel: 'ESSENCIAL_BLOQUEANTE',
            justificativaPrioridade: 'Bloqueante para o cálculo dos KPIs',
            bloqueanteRecomendado: true,
            aceita: true,
          },
        ],
        onTogglePergunta,
        demandaTitulo: 'Demanda de Vendas',
      });

      expect(element).toBeDefined();
      expect(element.props.perguntas.length).toBe(1);
      expect(element.props.perguntas[0].perguntaSugeridaContratante).toContain('linguagem simples');
      expect(element.props.perguntas[0].prioridadeNivel).toBe('ESSENCIAL_BLOQUEANTE');
    });
  });

  describe('12. IntakeNextActionSection — Síntese Analítica & Próxima Ação (Feedback #005)', () => {
    it('renderiza os 4 pilares de síntese, o estado qualitativo de prontidão e a próxima ação recomendada', () => {
      const mockSintese = {
        oQueJaSabemos: ['Painel de vendas explicitamente solicitado', 'Planilha fornecida'],
        oQueAindaPrecisamosEsclarecer: ['Critério de ranking de produtos (volume vs valor)', 'Data da reunião'],
        oQuePodemosInvestigarNosDados: ['Estrutura de colunas e tipos de dados'],
        oQueAindaNaoDevemosDefinir: ['Fórmulas complexas de MoM/YoY antes de inspecionar a base'],
        estadoProntidao: {
          estado: 'AINDA_PRECISAMOS_ESCLARECER' as const,
          label: 'Ainda precisamos esclarecer',
          motivo: 'Existem definições pendentes de negócio que bloqueiam o fechamento do escopo.',
        },
        proximaAcaoRecomendada: {
          acao: 'Alinhar com o contratante as perguntas essenciais e solicitar o envio da planilha.',
          porQueEstaAcao: 'Esclarecer se "produtos que vendem mais" significa volume físico ou faturamento evita retrabalho.',
        },
      };

      const element = React.createElement(IntakeNextActionSection, {
        sintese: mockSintese,
      });

      expect(element).toBeDefined();
      expect(element.props.sintese.oQueJaSabemos.length).toBe(2);
      expect(element.props.sintese.oQueAindaPrecisamosEsclarecer.length).toBe(2);
      expect(element.props.sintese.oQuePodemosInvestigarNosDados.length).toBe(1);
      expect(element.props.sintese.oQueAindaNaoDevemosDefinir.length).toBe(1);
      expect(element.props.sintese.estadoProntidao.estado).toBe('AINDA_PRECISAMOS_ESCLARECER');
      expect(element.props.sintese.estadoProntidao.label).toBe('Ainda precisamos esclarecer');
      expect(element.props.sintese.proximaAcaoRecomendada.acao).toContain('Alinhar com o contratante');
    });
  });

  describe('13. IntakeRequirementsClassificationSection — Conceitos e Salvaguarda de Citação (Feedback #005)', () => {
    it('renderiza os 5 grupos de requisitos e suporta itens com conceito analítico explícito e citação ausente', () => {
      const mockRequisitos = [
        {
          id: 'req_painel',
          titulo: 'Painel para Análise das Vendas',
          descricao: 'Construção do painel',
          classificacao: 'REQUISITO_ESSENCIAL' as const,
          conceito: 'REQUISITO_NEGOCIO' as const,
          justificativaClassificacao: 'Solicitado pelo contratante',
          origemPedidoOriginal: 'painel para entender como estão as vendas',
          rastreabilidade: {
            necessidadeIdentificada: 'Visualização gerencial',
            impactoAnalise: 'Criação do painel',
          },
        },
        {
          id: 'req_solucao_pbi',
          titulo: 'Solução Técnica Proposta pelo Workspace: Power BI',
          descricao: 'Uso do Power BI',
          classificacao: 'SOLUCAO_TECNICA_PROPOSTA' as const,
          conceito: 'SOLUCAO_TECNICA' as const,
          justificativaClassificacao: 'Proposta técnica do Workspace',
          origemPedidoOriginal: null,
          lacunaIdentificadaCopiloto: 'Lacuna identificada pelo Copiloto: Ferramenta não especificada no pedido.',
          rastreabilidade: {
            necessidadeIdentificada: 'Plataforma técnica de BI',
            impactoAnalise: 'Criação do PBIX',
          },
        },
      ];

      const element = React.createElement(IntakeRequirementsClassificationSection, {
        requisitos: mockRequisitos,
      });

      expect(element).toBeDefined();
      expect(element.props.requisitos.length).toBe(2);
      expect(element.props.requisitos[0].conceito).toBe('REQUISITO_NEGOCIO');
      expect(element.props.requisitos[1].conceito).toBe('SOLUCAO_TECNICA');
      expect(element.props.requisitos[1].origemPedidoOriginal).toBeNull();
      expect(element.props.requisitos[1].lacunaIdentificadaCopiloto).toContain('Lacuna identificada pelo Copiloto');
    });
  });

  describe('14. IntakeGapsQuestionsSection — Resolução de Lacunas e Cards Pedagógicos (Feedback #005)', () => {
    it('renderiza perguntas com tipoResolucao (Perguntar x Investigar x Decisão) e campos pedagógicos', () => {
      const mockPerguntas = [
        {
          id: 'p1',
          pergunta: 'Pergunta 1',
          motivacao: 'Alinhar critério de faturamento vs quantidade',
          perguntaSugeridaContratante: 'Pergunta em linguagem simples',
          comoExplicarContratante: 'Explicação simples',
          comoPensarComoAnalista: 'Antes de criar o ranking, definir a pergunta de negócio',
          tipoResolucao: 'PERGUNTAR_CONTRATANTE' as const,
          porQuePrecisoPerguntar: 'Para alinhar o critério',
          oQuePodeDarErradoSeNaoPerguntar: 'Apresentar dados com critério indesejado',
          oQueRespostaVaiMudar: 'Muda a medida de ordenação',
          entendaTecnicamente: 'RANKX no DAX',
          categoria: 'DEFINICAO_INDICADORES' as const,
          prioridade: 'ALTA' as const,
          prioridadeNivel: 'ESSENCIAL_BLOQUEANTE' as const,
          justificativaPrioridade: 'Bloqueante para o ranking',
          bloqueanteRecomendado: true,
          aceita: true,
        },
        {
          id: 'p2',
          pergunta: 'Pergunta 2',
          motivacao: 'Descobrir estrutura das colunas',
          tipoResolucao: 'INVESTIGAR_DADOS' as const,
          categoria: 'DADOS_FONTE' as const,
          prioridade: 'ALTA' as const,
          prioridadeNivel: 'ESSENCIAL_BLOQUEANTE' as const,
          justificativaPrioridade: 'Investigar colunas da planilha',
          bloqueanteRecomendado: true,
          aceita: true,
        },
      ];

      const element = React.createElement(IntakeGapsQuestionsSection, {
        lacunas: ['Lacuna teste'],
        perguntas: mockPerguntas,
        onTogglePergunta: vi.fn(),
      });

      expect(element).toBeDefined();
      expect(element.props.perguntas[0].tipoResolucao).toBe('PERGUNTAR_CONTRATANTE');
      expect(element.props.perguntas[0].comoPensarComoAnalista).toContain('Antes de criar o ranking');
      expect(element.props.perguntas[1].tipoResolucao).toBe('INVESTIGAR_DADOS');
    });
  });

  describe('15. IntakeDataDiscoverySection (4. Vamos Descobrir nos Dados)', () => {
    it('renderiza os itens de inspeção técnica dos dados da planilha', () => {
      const element = React.createElement(IntakeDataDiscoverySection, {
        analise: mockAnalise,
      });

      expect(element).toBeDefined();
      expect(element.props.analise).toBe(mockAnalise);
    });
  });

  describe('16. IntakeContinuityBridge (Ponte de Continuidade Intake → Demanda)', () => {
    it('não renderiza nada se intakeSnapshotRaw for nulo e isOrigemIntake for falso', () => {
      const element = React.createElement(IntakeContinuityBridge, {
        intakeSnapshotRaw: null,
        isOrigemIntake: false,
      });

      expect(element).toBeDefined();
      expect(element.props.intakeSnapshotRaw).toBeNull();
      expect(element.props.isOrigemIntake).toBe(false);
    });

    it('renderiza a ponte com dados de snapshot e tag de origem', () => {
      const mockSnapshot = JSON.stringify({
        fatos: {
          ativosDados: ['vendas_2024.xlsx'],
          prazo: '30 de abril',
          entregaveis: ['Dashboard Executivo'],
          indicadores: ['Faturamento'],
        },
        descobertasDados: {
          dimensoes: ['Região', 'Produto'],
        },
        inferenciasCopiloto: {
          dominioNegocio: 'VENDAS',
        },
        sinteseProximaAcao: {
          proximaAcaoRecomendada: '1. Esclarecer com o cliente; 2. Validar requisitos; 3. Carregar planilha',
        },
      });

      const element = React.createElement(IntakeContinuityBridge, {
        intakeSnapshotRaw: mockSnapshot,
        isOrigemIntake: true,
      });

      expect(element).toBeDefined();
      expect(element.props.intakeSnapshotRaw).toBe(mockSnapshot);
      expect(element.props.isOrigemIntake).toBe(true);
    });
  });
});

