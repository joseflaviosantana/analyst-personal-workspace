/**
 * src/core/domain/intake/intake-types.ts
 *
 * Contratos de Domínio do Intake Inteligente (Subgate 1).
 *
 * Princípios Fundamentais:
 * 1. Rigor Epistêmico: Diferenciação estrita entre FATO, INFERÊNCIA, LACUNA e PROPOSTA.
 * 2. Imutabilidade Factual: O texto original recebido permanece verbatim byte-a-byte.
 * 3. IA Consultiva: Toda estrutura gerada pelo motor opera como recomendação sujeita à validação humana.
 * 4. Extensibilidade: Contratos agnósticos que suportam Tier 1 (determinístico/heurístico) e futuros provedores semânticos (Tier 2).
 */

/**
 * Classificação epistêmica formal de cada item analisado
 */
export type EpistemicClassification = 'FATO' | 'INFERENCIA' | 'LACUNA' | 'PROPOSTA';

/**
 * Domínios de negócio analíticos reconhecidos pelo motor de intake
 */
export type DominioNegocioIntake =
  | 'VENDAS'
  | 'FINANCEIRO'
  | 'ESTOQUE_LOGISTICA'
  | 'RH_PESSOAS'
  | 'SAUDE_PUBLICA'
  | 'GERAL';

/**
 * Ativo de dados citado no texto bruto
 */
export interface AtivoMencionado {
  termoVerbatim: string;
  tipoDetectado: 'PLANILHA' | 'CSV' | 'BANCO_DADOS' | 'RELATORIO' | 'SISTEMA' | 'OUTRO';
  descricao: string;
}

/**
 * Janela temporal extraída do texto bruto
 */
export interface JanelaTemporalMencionada {
  termoVerbatim: string;
  tipo: 'RELATIVO' | 'ABSOLUTO' | 'ANO' | 'MESES' | 'INDETERMINADO';
  interpretacao: string;
}

/**
 * Entregável de trabalho identificado
 */
export interface EntregavelIdentificado {
  nome: string;
  descricao: string;
  tipo: 'DASHBOARD' | 'RELATORIO' | 'ANALISE_PONTUAL' | 'MODELO_DADOS' | 'PLANILHA';
  classificacao: 'FATO' | 'INFERENCIA';
}

/**
 * Indicador / Métrica identificado na solicitação ou sugerido pelo Copiloto
 */
export interface IndicadorKpiIdentificado {
  nome: string;
  descricao: string;
  classificacao: 'FATO' | 'INFERENCIA';
  /**
   * 5 Pilares de Explicabilidade Analítica do Copiloto (Feedback #003):
   * O que é, Por que estou sugerindo, O que ajuda a responder, Como calcular e O que confirmar.
   */
  oQueE?: string;
  porQueSugerido?: string;
  oQueAjudaResponder?: string;
  comoCalcular?: string;
  oQuePrecisaConfirmar?: string;

  /**
   * Evoluções do Feedback #005 (Métricas vs KPIs & Avaliação de Sugestões)
   */
  ehKpi?: boolean;
  justificativaKpi?: string;
  exemploSimples?: string;
  quandoNaoAdequado?: string;
  avaliacaoSugestao?: {
    relevanciaPedido: string;
    valorAnalitico: string;
    dependencias: string;
    complexidadeQualitativa: 'BAIXA' | 'MEDIA' | 'ALTA';
    justificativaComplexidade?: string;
    exigeEsclarecimentoContratante: boolean;
    recomendacaoFundamentada: string;
  };
}

/**
 * Categorias de perguntas de clarificação alinhadas à prioridade analítica de negócio:
 * objetivo/decisão → público/stakeholder → prazo → período → escopo → definições de indicadores → critérios de sucesso → dados disponíveis → regras/exceções → granularidade
 */
export type CategoriaPerguntaClarificacao =
  | 'OBJETIVO_DECISAO'
  | 'PUBLICO_STAKEHOLDER'
  | 'PRAZO_MARCO'
  | 'TEMPORALIDADE'
  | 'ESCOPO'
  | 'DEFINICAO_INDICADORES'
  | 'CRITERIOS_SUCESSO'
  | 'DADOS_FONTE'
  | 'REGRA_NEGOCIO'
  | 'GRANULARIDADE'
  | 'ENTREGAVEL';

/**
 * Nível de prioridade da pergunta de clarificação (Feedback #004)
 */
export type PrioridadePerguntaClarificacao =
  | 'ESSENCIAL_BLOQUEANTE'
  | 'IMPORTANTE'
  | 'EXPLORATORIA';

/**
 * Classificação da resolução de uma lacuna (Feedback #005 - Item 10):
 * - PERGUNTAR_CONTRATANTE: depende de decisão ou regra de negócio
 * - INVESTIGAR_DADOS: pode ser descoberto inspecionando a fonte
 * - DECISAO_TECNICA_ANALISTA: decisão técnica de engenharia/modelagem do analista
 */
export type TipoResolucaoLacuna =
  | 'PERGUNTAR_CONTRATANTE'
  | 'INVESTIGAR_DADOS'
  | 'DECISAO_TECNICA_ANALISTA';

/**
 * Pergunta de clarificação sugerida para resolver lacunas (Card de Clarificação Assistida)
 */
export interface PerguntaClarificacaoIntake {
  id: string;
  pergunta: string;
  motivacao: string;
  categoria: CategoriaPerguntaClarificacao;
  prioridade: 'ALTA' | 'MEDIA' | 'BAIXA';
  bloqueanteRecomendado: boolean;

  /**
   * Novos campos do Card de Clarificação Assistida (Feedback #004)
   */
  prioridadeNivel?: PrioridadePerguntaClarificacao;
  justificativaPrioridade?: string;
  oQueContratantePediu?: string;
  oQueAindaPrecisamosSaber?: string;
  porQueImportaAnalise?: string;
  perguntaSugeridaContratante?: string;
  comoExplicarContratante?: string;
  oQueRespostaVaiDefinir?: string;
  requisitoRelacionadoId?: string;

  /**
   * Evoluções do Feedback #005: Raciocínio Aumentado e Resolução
   */
  tipoResolucao?: TipoResolucaoLacuna;
  comoPensarComoAnalista?: string;
  seContratanteNaoEntender?: string;
  entendaTecnicamente?: string;
  porQuePrecisoPerguntar?: string;
  oQuePodeDarErradoSeNaoPerguntar?: string;
  oQueRespostaVaiMudar?: string;
  bloqueioEspecifico?: string;
  lacunaIdentificadaCopiloto?: string;
}

/**
 * Os 4 conceitos fundamentais do raciocínio analítico (Feedback #005 - Item 2):
 * A. Requisito de Negócio
 * B. Definição Pendente
 * C. Sugestão Analítica
 * D. Solução Técnica Proposta
 */
export type TipoConceitoAnalitico =
  | 'REQUISITO_NEGOCIO'
  | 'DEFINICAO_PENDENTE'
  | 'SUGESTAO_ANALITICA'
  | 'SOLUCAO_TECNICA';

/**
 * Classificação formal de requisitos segundo os Feedbacks #004 e #005
 */
export type TipoClassificacaoRequisito =
  | 'REQUISITO_ESSENCIAL'
  | 'REQUISITO_PENDENTE_ESCLARECIMENTO'
  | 'SUGESTAO_ANALITICA_ADICIONAL'
  | 'NAO_DEFINIDO_INVESTIGAR'
  | 'SOLUCAO_TECNICA_PROPOSTA';

/**
 * Item de requisito analisado a partir do Pedido Original e fatos observados
 */
export interface ItemRequisitoAnalisado {
  id: string;
  titulo: string;
  descricao: string;
  classificacao: TipoClassificacaoRequisito;
  conceito?: TipoConceitoAnalitico;
  justificativaClassificacao: string; // "Por que classifiquei assim?"
  origemPedidoOriginal: string | null; // Trecho verbatim estritamente presente ou null
  lacunaIdentificadaCopiloto?: string; // Se inferida pelo copiloto: "Lacuna identificada pelo Copiloto: ..."
  rastreabilidade: {
    necessidadeIdentificada: string;
    perguntaRelacionadaId?: string;
    impactoAnalise: string;
  };
}

/**
 * Proposta de estruturação inicial de entidades operacionais
 */
export interface PropostaEstruturaOperacional {
  projetoSugerido: {
    nome: string;
    descricao: string;
    justificativaNome: string;
  };
  demandaSugerida: {
    titulo: string;
    objetivoInicial: string;
    objetivoNatural?: string;
    contexto: string;
    restricoesDeclaradas: string | null;
    prazoEsperado: string | null;
  };
  perguntasPreliminaresSugeridas: PerguntaClarificacaoIntake[];
}

/**
 * Resultado completo e tipado da análise de uma solicitação bruta
 */
export interface ResultadoAnaliseIntake {
  /**
   * 1. Fato Imutável: Solicitação original exatamente como fornecida (byte-for-byte)
   */
  solicitacaoOriginal: string;

  /**
   * Fatos diretamente extraídos da mensagem (sem inferências)
   */
  fatos: {
    ativosDadosMencionados: AtivoMencionado[];
    periodoJanelaTemporalMencionada: JanelaTemporalMencionada | null;
    prazoMencionado: string | null;
    entregaveisExplicitamenteSolicitados: EntregavelIdentificado[];
    indicadoresExplicitamenteMencionados: IndicadorKpiIdentificado[];
  };

  /**
   * 2. Inferências do Copiloto (claramente segregadas dos fatos)
   */
  inferencias: {
    dominioNegocio: DominioNegocioIntake;
    problemaAparente: string;
    objetivoProvavel: string;
    contextoIdentificado: string;
    dimensoesAnaliticasIdentificadas: string[];
    entregaveisInferidos: EntregavelIdentificado[];
    indicadoresSugeridos: IndicadorKpiIdentificado[];
  };

  /**
   * 3. Lacunas de Informação (O que ainda precisamos saber)
   */
  lacunas: {
    itensFaltantes: string[];
    perguntasPriorizadas: PerguntaClarificacaoIntake[];
  };

  /**
   * 4. Classificação dos Requisitos (Feedback #004)
   * Requisitos Essenciais vs Pendentes vs Sugestões Adicionais vs Não Definidos
   */
  requisitosClassificados: ItemRequisitoAnalisado[];

  /**
   * 5. Proposta de Estrutura Inicial (Para revisão e deliberação humana)
   */
  proposta: PropostaEstruturaOperacional;

  /**
   * 6. Metadados de Execução e Auditoria do Motor
   */
  metadados: {
    analisador: 'TIER_1_DETERMINISTICO' | 'TIER_2_SEMANTICO';
    versaoMotor: string;
    executadoEm: string;
    comprimentoTextoOriginal: number;
    ehAmbiguo: boolean;
    ehMuitoCurto: boolean;
    temDadosIdentificados: boolean;
  };

  /**
   * 7. Síntese Analítica, Estado de Prontidão e Próxima Ação Recomendada (Feedback #005)
   */
  sinteseProximaAcao?: SinteseProximaAcaoIntake;
}

/**
 * Estados qualitativos e explicáveis de prontidão analítica (Feedback #005 - Item 17)
 */
export type EstadoProntidaoIntake =
  | 'AINDA_PRECISAMOS_ESCLARECER'
  | 'PRONTO_INSPECIONAR_DADOS'
  | 'PRONTO_CONSOLIDAR_REQUISITOS'
  | 'PRONTO_AVANCAR';

/**
 * Síntese final com raciocínio aumentado e próxima ação recomendada (Feedback #005 - Item 16)
 */
export interface SinteseProximaAcaoIntake {
  oQueJaSabemos: string[];
  oQueAindaPrecisamosEsclarecer: string[];
  oQuePodemosInvestigarNosDados: string[];
  oQueAindaNaoDevemosDefinir: string[];
  estadoProntidao: {
    estado: EstadoProntidaoIntake;
    label: string;
    motivo: string;
  };
  proximaAcaoRecomendada: {
    acao: string;
    porQueEstaAcao: string;
  };
}

/**
 * Contrato abstrato para analisadores de Intake (suporta Tier 1 e futuros Tier 2)
 */
export interface IIntakeAnalyzer {
  analisar(solicitacaoBruta: string): Promise<ResultadoAnaliseIntake> | ResultadoAnaliseIntake;
}
