/**
 * src/core/use-cases/copilot/resolve-copilot-messages.ts
 *
 * Resolver determinístico e puro do Copiloto Proativo do Analyst Personal Workspace.
 * Transforma o estado operacional existente em orientação pedagógica em 3 níveis:
 * - Nível 1: Orientação operacional imediata
 * - Nível 2: Aprendizado conceitual profissional
 * - Nível 3: Detalhes técnicos, regras e métricas de conformidade
 *
 * Responde de forma consolidada às 6 perguntas fundamentais:
 * 1. Onde estou?
 * 2. O que estou fazendo?
 * 3. Por que estou fazendo isso?
 * 4. O que devo fazer agora?
 * 5. O que preciso aprender/compreender neste momento?
 * 6. Existe algum bloqueio, alerta ou condição antes de avançar?
 *
 * CARACTERÍSTICAS:
 * - Pure function (zero side effects, sem I/O, sem dependência de banco ou rede)
 * - Determinístico e previsível
 * - Desacoplado da UI e de modelos/fornecedores de IA
 */

import {
  CopilotContext,
  OrientacaoCopilotoOutput,
  CenarioModelagemCopiloto,
  PrioridadeMensagemCopiloto,
  AcaoRecomendadaCopiloto,
  MensagemCopilotoNivel1,
  MensagemCopilotoNivel2,
  MensagemCopilotoNivel3,
  DiagnosticoTecnicoCopiloto,
  HierarquiaPainelCopiloto,
  SituacaoAtualCopiloto,
  ProximoPassoCopiloto,
} from './copilot-types';
import { obterConceitosRelevantesParaCenario } from './modeling-concepts-dictionary';
import { StatusModeloAnalitico } from '@/core/domain/enums/status-modelo-analitico';
import { TipoEntidadeAnalitica } from '@/core/domain/enums/tipo-entidade-analitica';
import { StatusAutorizacaoDataset } from '@/core/domain/enums/status-autorizacao-dataset';
import { WorkflowEngine } from '@/core/domain/rules/workflow-engine';
import {
  EstadoDemanda,
  ROTULOS_ESTADO_DEMANDA,
  normalizarEstadoDemanda,
} from '@/core/domain/enums/estado-demanda';

/**
 * Extrai nominalmente as dimensões órfãs detectadas pela regra M-11
 */
function extrairDimensoesOrfasM11(context: CopilotContext): string[] {
  const diags =
    context.resultadoConformidade?.diagnosticos ??
    context.prontidao?.detalhesConformidade?.diagnosticos ??
    [];
  const m11Diags = diags.filter((d) => d.codigo_regra === 'M-11');
  if (m11Diags.length > 0) {
    const nomes: string[] = [];
    for (const d of m11Diags) {
      const match = d.titulo.match(/Dimensão\s*"([^"]+)"/i);
      if (match) {
        nomes.push(match[1]);
      } else if (d.entidade_relacionada_id && context.modelo?.entidades) {
        const ent = context.modelo.entidades.find((e) => e.id === d.entidade_relacionada_id);
        nomes.push(ent ? ent.nome : d.titulo);
      } else {
        nomes.push(d.titulo);
      }
    }
    return nomes;
  }

  // Fallback nos alertas críticos textuais de prontidão
  const alertas = context.prontidao?.alertasCriticosQueExigemJustificativa ?? [];
  const nomes: string[] = [];
  for (const a of alertas) {
    if (a.includes('M-11') && a.includes('Dimensão')) {
      const match = a.match(/Dimensão\s*"([^"]+)"/i);
      if (match) nomes.push(match[1]);
    }
  }
  return nomes;
}

/**
 * Identifica o cenário operacional de modelagem de forma determinística
 */
function identificarCenario(context: CopilotContext): CenarioModelagemCopiloto {
  const { hasDatasetAutorizado, datasetAutorizado, modelo, prontidao } = context;

  // 1. Sem dataset autorizado ou dataset com status não vigente (M-01)
  if (
    !hasDatasetAutorizado ||
    !datasetAutorizado ||
    datasetAutorizado.status !== StatusAutorizacaoDataset.VIGENTE
  ) {
    return 'SEM_DATASET_VIGENTE';
  }

  // 2. Sem modelo analítico inicializado
  if (!modelo) {
    return 'SEM_MODELO_CRIADO';
  }

  const isHomologado = modelo.status === StatusModeloAnalitico.HOMOLOGADO;
  const isRevogado = modelo.status === StatusModeloAnalitico.REVOGADO;
  const temAlteracaoPosterior = prontidao?.temAlteracaoPosteriorAHomologacao ?? false;

  // 3. Homologação revogada formalmente
  if (isRevogado) {
    return 'HOMOLOGACAO_REVOGADA';
  }

  // 4. Homologação invalidada por alteração posterior
  if (isHomologado && temAlteracaoPosterior) {
    return 'HOMOLOGACAO_INVALIDADA';
  }

  // 5. Modelo homologado e vigente (pronto para avanço de workflow)
  if (isHomologado && (prontidao?.homologacaoVigenteValida ?? false)) {
    return 'HOMOLOGADO_E_VIGENTE';
  }

  // 6. Bloqueios ativos de conformidade (M-01 a M-05)
  const totalBloqueios =
    prontidao?.motivosBloqueio?.length ??
    context.resultadoConformidade?.total_bloqueios ??
    0;
  if (totalBloqueios > 0) {
    return 'BLOQUEIO_CONFORMIDADE';
  }

  // 7. Ausência de entidade classificada como FATO
  const fatos = (modelo.entidades ?? []).filter((e) => e.tipo === TipoEntidadeAnalitica.FATO);
  if (fatos.length === 0) {
    return 'SEM_ENTIDADE_FATO';
  }

  // 8. Ausência de métricas de negócio cadastradas
  const totalMetricas = modelo.metricas?.length ?? 0;
  if (totalMetricas === 0) {
    return 'SEM_METRICAS_CADASTRADAS';
  }

  // 9. Alertas críticos pendentes de justificativa técnica (M-06 / M-07)
  const totalAlertas =
    prontidao?.alertasCriticosQueExigemJustificativa?.length ??
    context.resultadoConformidade?.total_alertas_criticos ??
    0;
  if (totalAlertas > 0) {
    return 'ALERTA_CRITICO_PENDENTE';
  }

  // 10. Pronto para homologação limpo
  if (prontidao?.prontoParaHomologacao ?? true) {
    return 'PRONTO_PARA_HOMOLOGACAO';
  }

  return 'ESTADO_GERAL_MODELAGEM';
}

/**
 * Resolve a ação recomendada e prioridade com base no cenário
 */
function resolverAcaoEPrioridade(
  cenario: CenarioModelagemCopiloto,
  context: CopilotContext
): { prioridade: PrioridadeMensagemCopiloto; acao: AcaoRecomendadaCopiloto } {
  switch (cenario) {
    case 'SEM_DATASET_VIGENTE':
      return {
        prioridade: 'BLOQUEIO',
        acao: {
          tipo: 'AUTORIZAR_DATASET',
          titulo: 'Autorizar Dataset na Preparação',
          descricao:
            'Acesse a Aba 5 (Preparação) para validar as transformações e homologar o dataset com status VIGENTE.',
          contextoAcao: 'Aba 5 — Preparação e Qualidade',
          prioritaria: true,
        },
      };

    case 'SEM_MODELO_CRIADO':
      return {
        prioridade: 'PROXIMO_PASSO',
        acao: {
          tipo: 'CRIAR_MODELO',
          titulo: 'Criar Modelo Analítico Inicial',
          descricao:
            'Inicialize o modelo dimensional. O sistema derivará a Fato inicial e seus atributos a partir do schema catalogado.',
          contextoAcao: 'Modelagem Analítica — Inicialização',
          prioritaria: true,
        },
      };

    case 'HOMOLOGACAO_REVOGADA':
      return {
        prioridade: 'BLOQUEIO',
        acao: {
          tipo: 'REHOMOLOGAR_MODELO',
          titulo: 'Reavaliar e Re-homologar Modelo',
          descricao:
            'O modelo foi revogado formalmente. Revise os requisitos e execute uma nova homologação formal.',
          contextoAcao: 'Governança — Re-homologação',
          prioritaria: true,
        },
      };

    case 'HOMOLOGACAO_INVALIDADA':
      return {
        prioridade: 'BLOQUEIO',
        acao: {
          tipo: 'REHOMOLOGAR_MODELO',
          titulo: 'Re-homologar após Alterações Estruturais',
          descricao:
            'Foram feitas alterações materiais após a homologação anterior. Uma nova homologação formal é necessária.',
          contextoAcao: 'Governança — Integridade de Versão',
          prioritaria: true,
        },
      };

    case 'BLOQUEIO_CONFORMIDADE': {
      const total =
        context.prontidao?.motivosBloqueio?.length ??
        context.resultadoConformidade?.total_bloqueios ??
        1;
      return {
        prioridade: 'BLOQUEIO',
        acao: {
          tipo: 'RESOLVER_BLOQUEIOS',
          titulo: `Resolver ${total} Bloqueio(s) de Conformidade`,
          descricao:
            'Corrija as pendências matemáticas ou estruturais apontadas pelo motor de conformidade (regras M-01 a M-05).',
          contextoAcao: 'Conformidade de Modelagem',
          prioritaria: true,
        },
      };
    }

    case 'SEM_ENTIDADE_FATO':
      return {
        prioridade: 'ACAO_NECESSARIA',
        acao: {
          tipo: 'ADICIONAR_FATO',
          titulo: 'Adicionar Entidade Fato',
          descricao:
            'Cadastre ou classifique ao menos uma entidade como FATO para registrar eventos transacionais e medições.',
          contextoAcao: 'Estrutura Dimensional — Regra M-05',
          prioritaria: true,
        },
      };

    case 'SEM_METRICAS_CADASTRADAS':
      return {
        prioridade: 'ACAO_NECESSARIA',
        acao: {
          tipo: 'CADASTRAR_METRICA',
          titulo: 'Cadastrar Primeira Métrica Analítica',
          descricao:
            'Declare as métricas e KPIs de negócio com fórmulas de agregação (SUM, AVG, etc.) e unidades de medida claras.',
          contextoAcao: 'Camada Semântica — Regra M-05',
          prioritaria: true,
        },
      };

    case 'ALERTA_CRITICO_PENDENTE': {
      const total =
        context.prontidao?.alertasCriticosQueExigemJustificativa?.length ??
        context.resultadoConformidade?.total_alertas_criticos ??
        1;
      const dimensoesOrfas = extrairDimensoesOrfasM11(context);
      if (dimensoesOrfas.length > 0) {
        return {
          prioridade: 'ACAO_NECESSARIA',
          acao: {
            tipo: 'HOMOLOGAR_COM_JUSTIFICATIVA',
            titulo: `Conectar Dimensões ou Justificar (${total} Alerta(s))`,
            descricao: `O modelo possui dimensão(ões) sem relacionamento com a Fato (${dimensoesOrfas.join(', ')}). Crie o relacionamento ou registre justificativa formal para homologar.`,
            contextoAcao: 'Integridade Dimensional — Regra M-11',
            prioritaria: true,
          },
        };
      }
      return {
        prioridade: 'ACAO_NECESSARIA',
        acao: {
          tipo: 'HOMOLOGAR_COM_JUSTIFICATIVA',
          titulo: `Homologar com Justificativa (${total} Alerta(s))`,
          descricao:
            'O modelo possui relacionamentos N:M ou filtros bidirecionais. Registre justificativa técnica formal (mínimo 15 caracteres) para homologar.',
          contextoAcao: 'Governança — Justificativa Técnica',
          prioritaria: true,
        },
      };
    }

    case 'HOMOLOGADO_E_VIGENTE':
      return {
        prioridade: 'PROXIMO_PASSO',
        acao: {
          tipo: 'AVANCAR_WORKFLOW',
          titulo: 'Avançar Demanda para Validação',
          descricao:
            'O modelo atende a todos os critérios e está homologado. O WorkflowEngine autoriza o avanço para a etapa Em Validação.',
          contextoAcao: 'Workflow da Demanda',
          prioritaria: true,
        },
      };

    case 'PRONTO_PARA_HOMOLOGACAO':
      return {
        prioridade: 'PROXIMO_PASSO',
        acao: {
          tipo: 'HOMOLOGAR_MODELO',
          titulo: 'Homologar Modelo Analítico',
          descricao:
            'Todas as regras de conformidade foram atendidas. Clique para registrar a homologação formal humana e liberar a demanda.',
          contextoAcao: 'Governança — Homologação Formal',
          prioritaria: true,
        },
      };

    case 'ESTADO_GERAL_MODELAGEM':
    default:
      return {
        prioridade: 'ORIENTACAO',
        acao: {
          tipo: 'NENHUMA',
          titulo: 'Revisar Estrutura Dimensional',
          descricao:
            'Revise entidades, relacionamentos e métricas para garantir alinhamento com os objetivos da demanda.',
          contextoAcao: 'Modelagem Analítica',
          prioritaria: false,
        },
      };
  }
}

/**
 * Constrói as mensagens pedagógicas de Nível 1 (Orientação Operacional)
 */
function construirNivel1(
  cenario: CenarioModelagemCopiloto,
  context: CopilotContext
): MensagemCopilotoNivel1 {
  const datasetRotulo = context.datasetAutorizado?.versao_rotulo ?? 'Dataset Vinculado';

  switch (cenario) {
    case 'SEM_DATASET_VIGENTE':
      return {
        titulo: 'Dataset Autorizado Ausente ou Não Vigente',
        ondeEstou: 'Você está na etapa de Modelagem Analítica da demanda.',
        oQueEstouFazendo: 'Tentando modelar dados sem uma base auditada e homologada.',
        oQueDevoFazerAgora:
          'Acesse a Aba 5 (Preparação), conclua as transformações e autorize formalmente o dataset.',
        resumoOperacional:
          'Bloqueio formal M-01: A modelagem exige obrigatoriamente um dataset auditado com status VIGENTE.',
      };

    case 'SEM_MODELO_CRIADO':
      return {
        titulo: 'Próxima Ação: Criar Modelo Analítico',
        ondeEstou: 'Você está no início da etapa de Modelagem Dimensional.',
        oQueEstouFazendo:
          `O dataset "${datasetRotulo}" está vigente e pronto para servir de base dimensional.`,
        oQueDevoFazerAgora:
          'Clique em "Criar Modelo com Fato Inicial" para inicializar a arquitetura Estrela.',
        resumoOperacional:
          'O modelo será inicializado com a Entidade Fato e atributos derivados do schema catalogado.',
      };

    case 'HOMOLOGACAO_REVOGADA':
      return {
        titulo: 'Homologação Revogada Formalmente',
        ondeEstou: 'Você está visualizando um modelo cuja homologação anterior foi revogada.',
        oQueEstouFazendo: 'Avaliando correções necessárias para reabilitar o modelo.',
        oQueDevoFazerAgora:
          'Revise os relacionamentos e métricas e proceda com uma nova homologação formal.',
        resumoOperacional:
          'A homologação foi revogada. O avanço no Workflow permanece suspenso até nova aprovação.',
      };

    case 'HOMOLOGACAO_INVALIDADA':
      return {
        titulo: 'Homologação Invalidada por Alteração Material',
        ondeEstou: 'Você está trabalhando em um modelo homologado que sofreu alterações posteriores.',
        oQueEstouFazendo: 'Modificando entidades, atributos ou métricas após a homologação formal.',
        oQueDevoFazerAgora:
          'Submeta o modelo a nova avaliação de conformidade e realize a re-homologação formal.',
        resumoOperacional:
          'Regra 3.6C: Qualquer alteração estrutural posterior invalida a homologação vigente para garantir rastreabilidade.',
      };

    case 'BLOQUEIO_CONFORMIDADE': {
      const total =
        context.prontidao?.motivosBloqueio?.length ??
        context.resultadoConformidade?.total_bloqueios ??
        1;
      return {
        titulo: `Atenção: ${total} Bloqueio(s) de Conformidade Detectado(s)`,
        ondeEstou: 'Você está na validação de integridade do Modelo Analítico.',
        oQueEstouFazendo: 'Revisando as regras determinísticas de modelagem (M-01 a M-05).',
        oQueDevoFazerAgora:
          'Corrija as violações indicadas nos diagnósticos de conformidade antes de homologar.',
        resumoOperacional:
          'A homologação está bloqueada pela governança determinística até que todas as inconsistências sejam sanadas.',
      };
    }

    case 'SEM_ENTIDADE_FATO':
      return {
        titulo: 'Próxima Ação: Adicionar Entidade FATO',
        ondeEstou: 'Você está estruturando as tabelas conceituais do modelo.',
        oQueEstouFazendo: 'Definindo as entidades dimensionais, mas nenhuma FATO foi declarada.',
        oQueDevoFazerAgora:
          'Adicione ao menos uma entidade com o tipo FATO para representar transações ou medições.',
        resumoOperacional:
          'Regra M-05: Todo modelo analítico requer uma tabela Fato para ancorar métricas e medições.',
      };

    case 'SEM_METRICAS_CADASTRADAS':
      return {
        titulo: 'Próxima Ação: Cadastrar Métricas Analíticas',
        ondeEstou: 'Você definiu as tabelas e relacionamentos do modelo analítico.',
        oQueEstouFazendo: 'Finalizando a camada estrutural, restando definir as métricas de negócio.',
        oQueDevoFazerAgora:
          'Cadastre ao menos uma métrica analítica (KPI) associada às colunas numéricas da Fato.',
        resumoOperacional:
          'Regra M-05: A demanda requer indicadores semânticos formalizados para geração de relatórios confiáveis.',
      };

    case 'ALERTA_CRITICO_PENDENTE': {
      const total =
        context.prontidao?.alertasCriticosQueExigemJustificativa?.length ??
        context.resultadoConformidade?.total_alertas_criticos ??
        1;
      const dimensoesOrfas = extrairDimensoesOrfasM11(context);
      if (dimensoesOrfas.length > 0) {
        return {
          titulo: `Atenção: ${dimensoesOrfas.length} Dimensão(ões) Sem Conectividade com Fato`,
          ondeEstou: 'Você está na validação estrutural do Modelo Analítico.',
          oQueEstouFazendo: 'Verificando a integridade dos relacionamentos entre tabelas Fato e Dimensões.',
          oQueDevoFazerAgora: `Conecte a(s) dimensão(ões) ${dimensoesOrfas.join(', ')} à tabela Fato ou registre justificativa técnica na homologação.`,
          resumoOperacional:
            'Regra M-11: Dimensões desconectadas não propagam filtros nem segmentam métricas, exigindo relacionamento ou justificativa formal.',
        };
      }
      return {
        titulo: `Pronto para Homologação com ${total} Alerta(s) Crítico(s)`,
        ondeEstou: 'Você concluiu a modelagem estrutural e métricas da demanda.',
        oQueEstouFazendo:
          'Avaliando padrões complexos de relacionamento detectados (regras M-06 ou M-07).',
        oQueDevoFazerAgora:
          'Clique em Homologar e forneça uma justificativa técnica formal (mínimo 15 caracteres).',
        resumoOperacional:
          'Relacionamentos N:M ou filtros bidirecionais são permitidos mediante justificativa formal em auditoria.',
      };
    }

    case 'HOMOLOGADO_E_VIGENTE':
      return {
        titulo: 'Modelo Analítico Homologado & Vigente',
        ondeEstou: 'Você concluiu com sucesso a etapa de Modelagem Analítica.',
        oQueEstouFazendo: 'Preparando a transição da demanda para a etapa seguinte do Workflow.',
        oQueDevoFazerAgora:
          'Clique em "Avançar Demanda para Validação" para dar sequência ao atendimento profissional.',
        resumoOperacional:
          'O modelo atende a 100% dos critérios determinísticos e está selado formalmente pelo analista.',
      };

    case 'PRONTO_PARA_HOMOLOGACAO':
      return {
        titulo: 'Modelo Analítico Pronto para Homologação',
        ondeEstou: 'Você completou a especificação dimensional do modelo.',
        oQueEstouFazendo: 'Validando se todas as regras de integridade matemática foram atendidas.',
        oQueDevoFazerAgora:
          'Clique em "Homologar Modelo Analítico" para registrar a decisão humana formal.',
        resumoOperacional:
          'Conformidade 100% validada sem bloqueios. Homologação disponível imediatamente.',
      };

    case 'ESTADO_GERAL_MODELAGEM':
    default:
      return {
        titulo: 'Etapa de Modelagem Analítica',
        ondeEstou: 'Você está no editor dimensional do Analyst Personal Workspace.',
        oQueEstouFazendo: 'Organizando entidades, atributos, relacionamentos e indicadores.',
        oQueDevoFazerAgora:
          'Prossiga configurando as entidades e consulte a conformidade para validar seu progresso.',
        resumoOperacional:
          'O Copiloto acompanha cada alteração e valida automaticamente as regras determinísticas.',
      };
  }
}

/**
 * Constrói o Nível 2 (Aprendizado Conceitual Profissional)
 */
function construirNivel2(
  cenario: CenarioModelagemCopiloto,
  context?: CopilotContext
): MensagemCopilotoNivel2 {
  const conceitos = obterConceitosRelevantesParaCenario(cenario);

  switch (cenario) {
    case 'SEM_DATASET_VIGENTE':
      return {
        porQueEstouFazendoIsso:
          'Em ambientes analíticos profissionais, nenhum modelo dimensional deve ser construído sobre dados voláteis ou não auditados. A ancoragem em um dataset autorizado garante reprodutibilidade matemática e governança.',
        oQuePrecisoCompreender:
          'A regra M-01 conecta o modelo ao hash SHA-256 do dataset, assegurando que as conclusões de negócio estejam fundamentadas em dados com rastreabilidade completa.',
        conceitosChave: conceitos,
        dicaProfissional:
          'Trabalhar com dados não autorizados gera retrabalho quando schemas mudam ou quando métricas precisam ser reauditadas pela governança.',
      };

    case 'SEM_MODELO_CRIADO':
      return {
        porQueEstouFazendoIsso:
          'Transformamos tabelas brutas ou preparadas em um Modelo Estrela (Star Schema) para desacoplar as medidas numéricas dos contextos descritivos, otimizando consultas e simplificando o entendimento do usuário.',
        oQuePrecisoCompreender:
          'O Modelo Estrela é o padrão ouro de BI: uma tabela Fato central conectada a tabelas Dimensões via relacionamentos 1:N. Essa arquitetura viabiliza agregações rápidas e fatiamento flexível de dados.',
        conceitosChave: conceitos,
        dicaProfissional:
          'Antes de criar o modelo, defina claramente qual evento do mundo real você está medindo. Isso determina o grão correto da sua tabela Fato.',
      };

    case 'HOMOLOGACAO_REVOGADA':
    case 'HOMOLOGACAO_INVALIDADA':
      return {
        porQueEstouFazendoIsso:
          'A revogação ou invalidação garante que relatórios executivos não consumam modelos que sofreram mutações descontroladas ou que perderam o aval técnico formal do analista.',
        oQuePrecisoCompreender:
          'Em governança corporativa de dados, qualquer alteração material (novas colunas, mudanças em métricas ou relacionamentos) invalida a assinatura anterior para prevenir divergência entre relatórios e o modelo homologado.',
        conceitosChave: conceitos,
        dicaProfissional:
          'Ao re-homologar, revise os diagnósticos para confirmar que nenhuma alteração acidental quebrou o alinhamento com as regras M-01 a M-11.',
      };

    case 'BLOQUEIO_CONFORMIDADE':
      return {
        porQueEstouFazendoIsso:
          'Bloqueios de conformidade (M-01 a M-05) protegem a integridade do seu trabalho. Eles impedem que modelos matematicamente incorretos (como soma de percentuais ou ausência de grão) cheguem à produção.',
        oQuePrecisoCompreender:
          'Regras determinísticas funcionam como um linter de engenharia de dados: avaliam grão declarado, unicidade de identificadores e consistência aditiva antes que qualquer gráfico seja gerado.',
        conceitosChave: conceitos,
        dicaProfissional:
          'Corrija primeiro os bloqueios de grão (M-02) e identificador (M-03); muitas vezes, solucionar a chave primária resolve automaticamente problemas de relacionamento e aditividade.',
      };

    case 'SEM_ENTIDADE_FATO':
      return {
        porQueEstouFazendoIsso:
          'A tabela Fato é onde moram os números. Sem ela, o modelo conteria apenas categorias descritivas sem nada a ser mensurado, calculado ou acompanhado.',
        oQuePrecisoCompreender:
          'Em modelagem dimensional, a separação Fato vs Dimensão é obrigatória. A Fato guarda medições quantitativas (quantidades, valores, durações) e chaves estrangeiras que apontam para as dimensões de contexto.',
        conceitosChave: conceitos,
        dicaProfissional:
          'Evite colocar atributos textuais descritivos dentro da Fato. Mantenha nela apenas chaves e colunas numéricas de medição.',
      };

    case 'SEM_METRICAS_CADASTRADAS':
      return {
        porQueEstouFazendoIsso:
          'Métricas formalizadas encapsulam a lógica de negócio em um único ponto da esteira analítica, eliminando divergências em que diferentes departamentos calculam o mesmo indicador com fórmulas distintas.',
        oQuePrecisoCompreender:
          'Cada métrica deve declarar seu tipo de agregação (SUM, AVG, COUNT, etc.), sua unidade de medida (R$, %, unidades) e seu comportamento de aditividade matemática.',
        conceitosChave: conceitos,
        dicaProfissional:
          'Métricas de taxa ou margem percentual são não-aditivas: você nunca deve somar percentuais, mas sim somar o numerador, somar o denominador e então dividir.',
      };

    case 'ALERTA_CRITICO_PENDENTE': {
      const dimensoesOrfas = context ? extrairDimensoesOrfasM11(context) : [];
      if (dimensoesOrfas.length > 0) {
        return {
          porQueEstouFazendoIsso:
            'Uma dimensão desconectada da tabela Fato normalmente não consegue filtrar nem segmentar os dados transacionais, gerando produtos cartesianos ou agregações repetidas em relatórios e dashboards.',
          oQuePrecisoCompreender:
            'Em esquemas dimensionais (Estrela e Snowflake), a integridade referencial através de relacionamentos PK/FK orienta a propagação de filtros. Tabelas deliberadamente desconectadas (como parâmetros What-If em DAX com SELECTEDVALUE) são permitidas mediante justificativa técnica formal.',
          conceitosChave: conceitos,
          dicaProfissional:
            'Se a dimensão desconectada foi criada para servir como parâmetro What-If ou tabela de seleção dinâmica, registre expressamente essa justificativa técnica formal para homologar com total rastreabilidade.',
        };
      }
      return {
        porQueEstouFazendoIsso:
          'Relacionamentos N:M (Muitos-para-Muitos) e filtros bidirecionais são fontes comuns de duplicidade e lentidão em ferramentas de BI. Exigir justificativa técnica formal assegura que a escolha foi consciente e documentada.',
        oQuePrecisoCompreender:
          'Filtros bidirecionais fazem com que seleções na Fato afetem outras dimensões através de caminhos múltiplos. Se houver ambiguidades, cálculos de totais podem gerar números inconsistentes.',
        conceitosChave: conceitos,
        dicaProfissional:
          'Se possível, substitua relacionamentos N:M por uma tabela-ponte dimensional com grão intermediário bem definido e use sempre filtros unidirecionais por padrão.',
      };
    }

    case 'HOMOLOGADO_E_VIGENTE':
    case 'PRONTO_PARA_HOMOLOGACAO':
      return {
        porQueEstouFazendoIsso:
          'A homologação formal sela o contrato analítico entre a engenharia de dados e os consumidores da informação. Ela atesta que o modelo foi validado pelo analista humano e está pronto para responder perguntas estratégicas.',
        oQuePrecisoCompreender:
          'Modelos homologados servem como alicerce confiável para a camada de visualização (dashboards, relatórios executivos e exploração analítica) sem risco de inconsistências de cálculo.',
        conceitosChave: conceitos,
        dicaProfissional:
          'Documente sucintamente no histórico da homologação as premissas adotadas para facilitar auditorias futuras ou manutenções por outros membros da equipe.',
      };

    case 'ESTADO_GERAL_MODELAGEM':
    default:
      return {
        porQueEstouFazendoIsso:
          'A modelagem analítica organiza os dados para que sejam facilmente compreensíveis pelos usuários de negócio e eficientemente consultados pelas ferramentas de BI.',
        oQuePrecisoCompreender:
          'A chave para uma boa modelagem é o equilíbrio entre normalização e simplicidade analítica, priorizando a arquitetura estrela sempre que possível.',
        conceitosChave: conceitos,
      };
  }
}

/**
 * Constrói o Nível 3 (Detalhes Técnicos, Métricas e Diagnósticos de Conformidade)
 */
function construirNivel3(
  cenario: CenarioModelagemCopiloto,
  context: CopilotContext
): MensagemCopilotoNivel3 {
  const { modelo, prontidao, resultadoConformidade } = context;

  const totalEntidades = modelo?.entidades?.length ?? 0;
  const totalFatos = (modelo?.entidades ?? []).filter(
    (e) => e.tipo === TipoEntidadeAnalitica.FATO
  ).length;
  const totalDimensoes = (modelo?.entidades ?? []).filter(
    (e) => e.tipo === TipoEntidadeAnalitica.DIMENSAO
  ).length;
  const totalRelacionamentos = modelo?.relacionamentos?.length ?? 0;
  const totalMetricas = modelo?.metricas?.length ?? 0;

  const motivosBloqueio = prontidao?.motivosBloqueio ?? [];
  const alertasCriticos = prontidao?.alertasCriticosQueExigemJustificativa ?? [];
  const recomendacoes = prontidao?.recomendacoes ?? [];

  const totalBloqueios =
    prontidao?.motivosBloqueio?.length ??
    resultadoConformidade?.total_bloqueios ??
    0;
  const totalAlertasCriticos =
    prontidao?.alertasCriticosQueExigemJustificativa?.length ??
    resultadoConformidade?.total_alertas_criticos ??
    0;
  const totalRecomendacoes =
    prontidao?.recomendacoes?.length ??
    resultadoConformidade?.total_recomendacoes ??
    0;

  // Extrair diagnósticos estruturados
  const diagnosticos: DiagnosticoTecnicoCopiloto[] = [];

  if (resultadoConformidade?.diagnosticos) {
    for (const d of resultadoConformidade.diagnosticos) {
      diagnosticos.push({
        codigo: d.codigo_regra,
        severidade: d.severidade,
        titulo: d.titulo,
        detalhe: `${d.deteccao} — ${d.explicacao}`,
        acaoNecessaria: d.acao_humana_necessaria,
      });
    }
  } else {
    // Fallback estruturado a partir do prontidao
    for (const b of motivosBloqueio) {
      const match = b.match(/^(M-\d{2}):\s*(.*?)\s*—\s*(.*)$/);
      diagnosticos.push({
        codigo: match ? match[1] : 'BLOQUEIO',
        severidade: 'BLOQUEIO',
        titulo: match ? match[2] : 'Bloqueio de Conformidade',
        detalhe: match ? match[3] : b,
        acaoNecessaria: 'Corrigir no editor de modelagem.',
      });
    }

    for (const a of alertasCriticos) {
      const match = a.match(/^(M-\d{2}):\s*(.*?)\s*—\s*(.*)$/);
      diagnosticos.push({
        codigo: match ? match[1] : 'ALERTA_CRITICO',
        severidade: 'ALERTA_CRITICO',
        titulo: match ? match[2] : 'Alerta Crítico de Modelagem',
        detalhe: match ? match[3] : a,
        acaoNecessaria: 'Fornecer justificativa técnica formal na homologação.',
      });
    }
  }

  // Regras aplicáveis conforme o cenário
  const regrasPorCenario: Record<CenarioModelagemCopiloto, string[]> = {
    SEM_DATASET_VIGENTE: ['M-01: Dataset Autorizado Vigente'],
    SEM_MODELO_CRIADO: ['M-01: Dataset Autorizado', 'M-05: Critérios Mínimos de Modelagem'],
    HOMOLOGACAO_REVOGADA: ['Regra 3.6B: Revogação de Homologação', 'M-01 a M-11: Conformidade'],
    HOMOLOGACAO_INVALIDADA: [
      'Regra 3.6C: Invalidação por Alteração Material',
      'M-01 a M-11: Conformidade',
    ],
    BLOQUEIO_CONFORMIDADE: ['M-01 a M-05: Regras de Severidade BLOQUEIO'],
    SEM_ENTIDADE_FATO: ['M-05: Ao menos uma Entidade FATO obrigatória'],
    SEM_METRICAS_CADASTRADAS: ['M-05: Ao menos uma Métrica Analítica cadastrada'],
    ALERTA_CRITICO_PENDENTE: [
      'M-06: Cardinalidade N:M exige justificativa',
      'M-07: Filtro Bidirecional exige justificativa',
      'M-11: Integridade de Conectividade Dimensional exige relacionamento ou justificativa',
    ],
    PRONTO_PARA_HOMOLOGACAO: ['M-01 a M-11: 100% Conforme'],
    HOMOLOGADO_E_VIGENTE: ['M-01 a M-11: Homologado & Vigente'],
    ESTADO_GERAL_MODELAGEM: ['M-01 a M-11: Avaliação Contínua'],
  };

  return {
    regrasAplicaveis: regrasPorCenario[cenario] ?? ['M-01 a M-11'],
    diagnosticos,
    metricasEstruturais: {
      totalEntidades,
      totalFatos,
      totalDimensoes,
      totalRelacionamentos,
      totalMetricas,
      totalBloqueios,
      totalAlertasCriticos,
      totalRecomendacoes,
      statusModelo: modelo?.status,
      statusDataset: context.datasetAutorizado?.status,
    },
  };
}

/**
 * Constrói a Hierarquia Informacional Refinada do Copiloto (Gate 2B.1)
 * Responde de forma explícita e estruturada:
 * 1. Onde você está
 * 2. O que estamos fazendo
 * 3. Por que estamos fazendo isso
 * 4. Situação atual (com status de bloqueio explícito)
 * 5. Próximo passo (com CTA harmonizado com o WorkflowEngine)
 */
function construirHierarquia(
  cenario: CenarioModelagemCopiloto,
  context: CopilotContext,
  acao: AcaoRecomendadaCopiloto,
  nivel1: MensagemCopilotoNivel1,
  nivel3: MensagemCopilotoNivel3
): HierarquiaPainelCopiloto {
  const estadoNormalizado = context.estadoDemanda
    ? normalizarEstadoDemanda(context.estadoDemanda)
    : EstadoDemanda.EM_MODELAGEM_E_ANALISE;

  const proximoEstadoWorkflow = WorkflowEngine.proximoEstadoNormal(estadoNormalizado);
  const rotuloProximoEstado = proximoEstadoWorkflow
    ? ROTULOS_ESTADO_DEMANDA[proximoEstadoWorkflow]
    : null;
  const rotuloEstadoAtual =
    ROTULOS_ESTADO_DEMANDA[estadoNormalizado] || 'Em Modelagem e Análise';

  const jaAvancouAlemDaModelagem =
    estadoNormalizado === EstadoDemanda.EM_VALIDACAO ||
    estadoNormalizado === EstadoDemanda.PRONTA_PARA_ENTREGA ||
    estadoNormalizado === EstadoDemanda.CONCLUIDA;

  // 1. 📍 ONDE VOCÊ ESTÁ
  let ondeVoceEsta = 'Modelagem Dimensional — Etapa 6 do fluxo analítico';
  if (jaAvancouAlemDaModelagem) {
    ondeVoceEsta = `Modelagem Dimensional — Etapa 6 (Demanda em: ${rotuloEstadoAtual})`;
  }

  // 2. 🎯 O QUE ESTAMOS FAZENDO
  let oQueEstamosFazendo = nivel1.oQueEstouFazendo;
  if (cenario === 'HOMOLOGADO_E_VIGENTE') {
    if (jaAvancouAlemDaModelagem) {
      oQueEstamosFazendo = `A etapa de modelagem foi concluída com sucesso. A demanda está ativa na etapa de ${rotuloEstadoAtual}.`;
    } else {
      oQueEstamosFazendo = 'Finalizando a modelagem analítica antes da validação.';
    }
  }

  // 3. 💡 POR QUE ESTAMOS FAZENDO ISSO
  let porQueEstamosFazendo =
    'Esta etapa garante que fatos, dimensões, relacionamentos e métricas estejam estruturados corretamente antes de os dados serem utilizados em análises e dashboards.';

  switch (cenario) {
    case 'SEM_DATASET_VIGENTE':
      porQueEstamosFazendo =
        'Garantir a integridade da esteira: nenhum modelo analítico deve ser construído sobre dados não homologados ou sem qualidade atestada formalmente.';
      break;
    case 'SEM_MODELO_CRIADO':
      porQueEstamosFazendo =
        'A modelagem dimensional organiza os dados brutos em esquemas analíticos (como Star Schema), facilitando a escrita de DAX e acelerando o tempo de resposta das consultas analíticas.';
      break;
    case 'SEM_ENTIDADE_FATO':
      porQueEstamosFazendo =
        'A tabela Fato é o coração da modelagem dimensional; sem ela, não há histórico transacional ou medições numéricas para alimentar relatórios e KPIs.';
      break;
    case 'SEM_METRICAS_CADASTRADAS':
      porQueEstamosFazendo =
        'Centralizar métricas no modelo de dados garante uma "única fonte da verdade", evitando que diferentes áreas criem fórmulas divergentes para o mesmo indicador.';
      break;
    case 'BLOQUEIO_CONFORMIDADE':
      porQueEstamosFazendo =
        'Resolver violações de integridade antes da entrega evita erros de granularidade, duplicação de valores na agregação e relacionamentos circulares no Power BI.';
      break;
    case 'ALERTA_CRITICO_PENDENTE': {
      const dimensoesOrfas = extrairDimensoesOrfasM11(context);
      porQueEstamosFazendo = dimensoesOrfas.length > 0
        ? 'Uma dimensão desconectada normalmente não consegue filtrar corretamente a Fato, o que impede a análise segmentada e pode gerar produtos cartesianos ou agregações incorretas.'
        : 'Relacionamentos N:M e filtros bidirecionais podem degradar a performance e produzir totais ambíguos. Justificá-los garante que o trade-off foi tecnicamente avaliado.';
      break;
    }
    case 'PRONTO_PARA_HOMOLOGACAO':
      porQueEstamosFazendo =
        'A homologação formal estabelece a governança e o rastreamento técnico, certificando que o modelo atende aos padrões de arquitetura antes de ser consumido.';
      break;
    case 'HOMOLOGACAO_REVOGADA':
      porQueEstamosFazendo =
        'Preservar a governança auditável: revogações exigem nova revisão formal para evitar consumo de dados fora de conformidade.';
      break;
    case 'HOMOLOGACAO_INVALIDADA':
      porQueEstamosFazendo =
        'Preservar a governança auditável: alterações estruturais posteriores à homologação invalidam a aprovação vigente e exigem nova validação formal.';
      break;
    case 'HOMOLOGADO_E_VIGENTE':
    default:
      porQueEstamosFazendo =
        'Esta etapa garante que fatos, dimensões, relacionamentos e métricas estejam estruturados corretamente antes de os dados serem utilizados em análises e dashboards.';
      break;
  }

  // 4. ✅ SITUAÇÃO ATUAL (Responde: "Existe algo me impedindo de avançar?")
  const totalBloqueios = nivel3.metricasEstruturais.totalBloqueios;
  const totalAlertas = nivel3.metricasEstruturais.totalAlertasCriticos;

  let situacaoAtual: SituacaoAtualCopiloto;

  if (cenario === 'SEM_DATASET_VIGENTE') {
    situacaoAtual = {
      rotulo: 'Bloqueio de Governança',
      descricao:
        'A demanda não possui dataset autorizado com status VIGENTE. Pela regra M-01, a modelagem exige dados auditados.',
      impedeAvanco: true,
      temBloqueio: true,
      temAlertaCritico: false,
      statusVisual: 'BLOQUEIO',
      mensagemBloqueio: '⛔ Bloqueio de governança: O modelo não pode ser criado sem dataset autorizado vigente.',
    };
  } else if (cenario === 'SEM_MODELO_CRIADO') {
    situacaoAtual = {
      rotulo: 'Aguardando Inicialização',
      descricao:
        'Dataset autorizado vigente pronto para uso. O modelo analítico ainda não foi inicializado.',
      impedeAvanco: true,
      temBloqueio: false,
      temAlertaCritico: false,
      statusVisual: 'INFO',
      mensagemBloqueio: 'ℹ️ Inicialização necessária: Crie o modelo analítico inicial para começar a modelagem.',
    };
  } else if (cenario === 'HOMOLOGACAO_REVOGADA') {
    situacaoAtual = {
      rotulo: 'Homologação Revogada',
      descricao:
        'O modelo foi formalmente revogado. Uma nova homologação humana é necessária para liberar o avanço.',
      impedeAvanco: true,
      temBloqueio: true,
      temAlertaCritico: false,
      statusVisual: 'BLOQUEIO',
      mensagemBloqueio: '⛔ Bloqueio ativo: Homologação revogada. O avanço está bloqueado até nova homologação formal.',
    };
  } else if (cenario === 'HOMOLOGACAO_INVALIDADA') {
    situacaoAtual = {
      rotulo: 'Homologação Invalidada',
      descricao:
        'Foram detectadas alterações estruturais posteriores à homologação (Regra 3.6C). O modelo precisa ser re-homologado.',
      impedeAvanco: true,
      temBloqueio: true,
      temAlertaCritico: false,
      statusVisual: 'BLOQUEIO',
      mensagemBloqueio: '⛔ Bloqueio ativo: O modelo sofreu alterações materiais pós-homologação e precisa ser re-homologado.',
    };
  } else if (totalBloqueios > 0) {
    situacaoAtual = {
      rotulo: `${totalBloqueios} Bloqueio(s) Ativo(s)`,
      descricao: `Existem ${totalBloqueios} pendência(s) de integridade (regras M-01 a M-05) que precisam ser corrigidas antes da homologação.`,
      impedeAvanco: true,
      temBloqueio: true,
      temAlertaCritico: totalAlertas > 0,
      statusVisual: 'BLOQUEIO',
      mensagemBloqueio: `⛔ Bloqueio ativo: Antes de avançar, resolva ${totalBloqueios} pendência(s) de conformidade.`,
    };
  } else if (cenario === 'SEM_ENTIDADE_FATO') {
    situacaoAtual = {
      rotulo: 'Requisito Mínimo Pendente',
      descricao:
        'O modelo possui entidades conceituais, mas nenhuma classificada como FATO (Regra M-05).',
      impedeAvanco: true,
      temBloqueio: false,
      temAlertaCritico: false,
      statusVisual: 'ALERTA',
      mensagemBloqueio: '⚠️ Requisito pendente: O modelo ainda não pode ser homologado sem ao menos uma tabela FATO (M-05).',
    };
  } else if (cenario === 'SEM_METRICAS_CADASTRADAS') {
    situacaoAtual = {
      rotulo: 'Requisito Mínimo Pendente',
      descricao:
        'A estrutura dimensional está definida, mas nenhuma métrica analítica foi cadastrada (Regra M-05).',
      impedeAvanco: true,
      temBloqueio: false,
      temAlertaCritico: false,
      statusVisual: 'ALERTA',
      mensagemBloqueio: '⚠️ Requisito pendente: O modelo ainda não pode ser homologado sem métricas analíticas cadastradas (M-05).',
    };
  } else if (totalAlertas > 0) {
    const dimensoesOrfas = extrairDimensoesOrfasM11(context);
    if (dimensoesOrfas.length > 0) {
      situacaoAtual = {
        rotulo: `${totalAlertas} Alerta(s) Crítico(s) — Conectividade Dimensional`,
        descricao: `Dimensão(ões) desconectada(s) detectada(s): ${dimensoesOrfas.join(', ')}. Uma dimensão sem relacionamento com a Fato não consegue propagar filtros analíticos.`,
        impedeAvanco: false,
        temBloqueio: false,
        temAlertaCritico: true,
        statusVisual: 'ALERTA',
        mensagemBloqueio: `⚠️ Atenção: A(s) dimensão(ões) ${dimensoesOrfas.join(', ')} não possui(em) relacionamento com a Fato. Crie os relacionamentos necessários ou registre justificativa formal na homologação.`,
      };
    } else {
      situacaoAtual = {
        rotulo: `${totalAlertas} Alerta(s) Crítico(s)`,
        descricao:
          'O modelo está matematicamente apto, mas contém padrões (N:M ou bidirecionais) que exigem justificativa formal na homologação.',
        impedeAvanco: false,
        temBloqueio: false,
        temAlertaCritico: true,
        statusVisual: 'ALERTA',
        mensagemBloqueio: `⚠️ Atenção: Antes de avançar, forneça justificativa formal para ${totalAlertas} alerta(s) crítico(s).`,
      };
    }
  } else if (cenario === 'PRONTO_PARA_HOMOLOGACAO') {
    situacaoAtual = {
      rotulo: 'Conformidade 100% Validada',
      descricao:
        'Nenhum bloqueio impede o avanço. A homologação formal humana do analista é necessária para liberar a próxima etapa.',
      impedeAvanco: false,
      temBloqueio: false,
      temAlertaCritico: false,
      statusVisual: 'SUCESSO',
      mensagemBloqueio: '⚠️ Homologação pendente: O modelo está pronto, mas a homologação humana formal é necessária antes de avançar.',
    };
  } else if (cenario === 'HOMOLOGADO_E_VIGENTE') {
    situacaoAtual = {
      rotulo: 'Modelo Homologado & Vigente',
      descricao: jaAvancouAlemDaModelagem
        ? `Modelo homologado com conformidade total. A demanda já avançou no workflow para a etapa de ${rotuloEstadoAtual}.`
        : 'Modelo homologado com conformidade total. Nenhum bloqueio impede o avanço no Workflow.',
      impedeAvanco: false,
      temBloqueio: false,
      temAlertaCritico: false,
      statusVisual: 'SUCESSO',
      mensagemBloqueio: '✅ Nenhum bloqueio impede o avanço.',
    };
  } else {
    situacaoAtual = {
      rotulo: 'Em Modelagem',
      descricao:
        'Estruturação analítica em andamento. Consulte os diagnósticos para orientar seu trabalho.',
      impedeAvanco: false,
      temBloqueio: false,
      temAlertaCritico: false,
      statusVisual: 'INFO',
      mensagemBloqueio: 'ℹ️ Estruturação em andamento: Nenhum bloqueio impeditivo detectado.',
    };
  }

  // 5. ➡️ PRÓXIMO PASSO & AÇÃO GOVERNADA
  let proximoPassoDescricao = nivel1.oQueDevoFazerAgora;
  let acaoTitulo = acao.titulo;

  if (cenario === 'HOMOLOGADO_E_VIGENTE') {
    if (jaAvancouAlemDaModelagem) {
      proximoPassoDescricao = `Etapa de modelagem concluída. O trabalho analítico ativo está ocorrendo na etapa de ${rotuloEstadoAtual} (Aba correspondente).`;
      acaoTitulo = 'Consultar Modelo Vigente';
    } else {
      proximoPassoDescricao = 'Avançar a demanda para a etapa de Validação.';
      acaoTitulo = rotuloProximoEstado
        ? `Avançar para ${rotuloProximoEstado}`
        : 'Avançar para Em Validação';
    }
  }

  const proximoPasso: ProximoPassoCopiloto = {
    descricao: proximoPassoDescricao,
    acaoTitulo,
    acaoTipo: acao.tipo,
    podeExecutar:
      !context.isReadOnly &&
      acao.tipo !== 'NENHUMA' &&
      (!jaAvancouAlemDaModelagem || cenario !== 'HOMOLOGADO_E_VIGENTE'),
    requerConfirmacaoHumana: true,
  };

  return {
    ondeVoceEsta,
    oQueEstamosFazendo,
    porQueEstamosFazendo,
    situacaoAtual,
    proximoPasso,
  };
}

/**
 * Função pura principal do Copiloto: transforma o estado do Workspace em orientação pedagógica
 */
export function resolveCopilotMessages(context: CopilotContext): OrientacaoCopilotoOutput {
  // 1. Identificar cenário operacional
  const cenario = identificarCenario(context);

  // 2. Determinar ação recomendada e prioridade
  const { prioridade, acao } = resolverAcaoEPrioridade(cenario, context);

  // 3. Montar mensagens nos 3 níveis pedagógicos
  const nivel1 = construirNivel1(cenario, context);
  const nivel2 = construirNivel2(cenario, context);
  const nivel3 = construirNivel3(cenario, context);

  // 4. Determinar flags booleanas de apoio
  const temBloqueio =
    prioridade === 'BLOQUEIO' || nivel3.metricasEstruturais.totalBloqueios > 0;
  const temAlertaCritico = nivel3.metricasEstruturais.totalAlertasCriticos > 0;
  const prontoParaAvanco =
    cenario === 'HOMOLOGADO_E_VIGENTE' ||
    (cenario === 'PRONTO_PARA_HOMOLOGACAO' && !temBloqueio);

  // 5. Sintetizar respostas consolidadas para as 6 Perguntas Fundamentais
  const condicoesEBloqueios = temBloqueio
    ? `Existem ${nivel3.metricasEstruturais.totalBloqueios} bloqueio(s) impedindo o avanço.`
    : temAlertaCritico
    ? `Existem ${nivel3.metricasEstruturais.totalAlertasCriticos} alerta(s) crítico(s) que exigem justificativa técnica formal.`
    : 'Nenhum bloqueio detectado. Condições plenamente satisfeitas.';

  const perguntasChave = {
    ondeEstou: nivel1.ondeEstou,
    oQueEstouFazendo: nivel1.oQueEstouFazendo,
    porQueEstouFazendoIsso: nivel2.porQueEstouFazendoIsso,
    oQueDevoFazerAgora: nivel1.oQueDevoFazerAgora,
    oQuePrecisoCompreender: nivel2.oQuePrecisoCompreender,
    condicoesEBloqueios,
  };

  // 6. Construir hierarquia informacional refinada (Gate 2B.1)
  const hierarquia = construirHierarquia(cenario, context, acao, nivel1, nivel3);

  return {
    cenario,
    prioridade,
    temBloqueio,
    temAlertaCritico,
    prontoParaAvanco,
    acaoRecomendada: acao,
    hierarquia,
    nivel1,
    nivel2,
    nivel3,
    perguntasChave,
    geradoEm: new Date().toISOString(),
  };
}
