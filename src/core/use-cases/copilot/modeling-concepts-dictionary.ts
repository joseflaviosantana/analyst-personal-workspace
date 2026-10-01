/**
 * src/core/use-cases/copilot/modeling-concepts-dictionary.ts
 *
 * Dicionário conceitual e pedagógico de Modelagem Dimensional para o Copiloto Proativo.
 * Textos em Português do Brasil com rigor profissional, sem infantilização,
 * organizados para suportar o Nível 2 (Aprendizado) e Nível 3 (Detalhes Técnicos).
 */

import { ConceitoModelagem, CenarioModelagemCopiloto } from './copilot-types';

/**
 * Base de conhecimento de conceitos fundamentais da modelagem analítica
 */
export const DICIONARIO_CONCEITOS_MODELAGEM: Record<string, ConceitoModelagem> = {
  'tabela-fato': {
    id: 'tabela-fato',
    termo: 'Tabela Fato',
    categoria: 'ESTRUTURA',
    definicaoSimples:
      'Tabela que armazena os eventos quantitativos, transações e medições numéricas do negócio (ex: vendas, cliques, atendimentos).',
    porQueImporta:
      'É o núcleo central de qualquer modelo dimensional; agrega as métricas que você deseja somar, calcular médias ou acompanhar ao longo do tempo.',
    detalheTecnico:
      'Contém chaves estrangeiras (FK) que se conectam às dimensões e colunas de medidas numéricas aditivas, semi-aditivas ou não-aditivas.',
    dicaProfissional:
      'Mantenha a fato com a menor largura possível (apenas chaves FK e colunas numéricas de medição). Textos longos e atributos descritivos devem ser isolados em dimensões para economizar memória e acelerar a compressão colunar.',
    regrasAssociadas: ['M-02', 'M-04', 'M-05'],
  },

  dimensao: {
    id: 'dimensao',
    termo: 'Tabela Dimensão',
    categoria: 'ESTRUTURA',
    definicaoSimples:
      'Tabela que fornece o contexto qualitativo dos fatos, respondendo a perguntas como "quem?", "onde?", "quando?" e "o quê?" (ex: Clientes, Produtos, Regiões).',
    porQueImporta:
      'Permite filtrar, agrupar, fatiar (slice & dice) e contextualizar os números da tabela fato em relatórios e dashboards.',
    detalheTecnico:
      'Possui chave primária (PK) com valores únicos e atributos descritivos desnormalizados para otimizar desempenho de consulta.',
    dicaProfissional:
      'Desnormalize atributos relacionados na mesma dimensão (ex: Categoria e Subcategoria dentro de DimProduto) para evitar o padrão Snowflake, simplificando o modelo para o usuário final e acelerando o tempo de consulta.',
    regrasAssociadas: ['M-03', 'M-05'],
  },

  grao: {
    id: 'grao',
    termo: 'Grão (Grain) da Fato',
    categoria: 'ESTRUTURA',
    definicaoSimples:
      'A definição exata do que representa uma única linha na tabela fato (ex: um item de pedido emitido, uma transação financeira, uma leitura de sensor).',
    porQueImporta:
      'Declarar o grão impede contagens duplicadas, soma indevida de dados em granularidades diferentes e cálculos matematicamente inconsistentes.',
    detalheTecnico:
      'A integridade do grão é garantida pela combinação de chaves que identifica univocamente cada registro de medição.',
    dicaProfissional:
      'Declare o grão por escrito antes de modelar colunas e métricas. Se precisar analisar dados em grãos distintos (ex: Venda Diária vs. Meta Mensal), crie fatos separadas em vez de misturar níveis de agregação na mesma tabela.',
    regrasAssociadas: ['M-02'],
  },

  relacionamento: {
    id: 'relacionamento',
    termo: 'Relacionamento Analítico',
    categoria: 'INTEGRIDADE',
    definicaoSimples:
      'Conexão lógica entre duas tabelas que determina como os filtros aplicados em uma tabela afetam os dados da outra.',
    porQueImporta:
      'Sem relacionamentos válidos, filtros em dimensões não conseguem selecionar ou restringir os dados da tabela fato, gerando resultados incorretos (produto cartesiano).',
    detalheTecnico:
      'Implementado via ligação entre Chave Primária (PK) de uma dimensão e Chave Estrangeira (FK) na fato.',
    dicaProfissional:
      'Garanta integridade referencial antes de criar o relacionamento: se existirem chaves órfãs na fato que não constem na dimensão, o motor de BI criará uma linha em branco artificial nas análises.',
    regrasAssociadas: ['M-06', 'M-07', 'M-08', 'M-09', 'M-11'],
  },

  cardinalidade: {
    id: 'cardinalidade',
    termo: 'Cardinalidade',
    categoria: 'INTEGRIDADE',
    definicaoSimples:
      'A proporção numérica de registros correspondentes entre duas tabelas relacionadas (típico: 1:N / Um-para-Muitos).',
    porQueImporta:
      'Em modelagem dimensional profissional, o padrão ouro é 1:N (uma linha na dimensão para várias na fato). Relacionamentos N:M (Muitos-para-Muitos) causam ambiguidade e demandam tabelas-ponte.',
    detalheTecnico:
      'A regra M-06 monitora relacionamentos N:M e exige justificativa técnica formal devido ao risco de duplicação em agregações.',
    dicaProfissional:
      'Sempre que identificar uma relação Muitos-para-Muitos (N:M), avalie se a solução ideal é uma tabela-ponte com grão intermediário bem definido, prevenindo duplicação silenciosa de totais em agregações.',
    regrasAssociadas: ['M-06'],
  },

  'chave-primaria': {
    id: 'chave-primaria',
    termo: 'Chave Primária (PK)',
    categoria: 'INTEGRIDADE',
    definicaoSimples:
      'Coluna (ou conjunto de colunas) cujo valor é único e não nulo para cada linha de uma tabela.',
    porQueImporta:
      'Garante a identidade irrepetível de cada entidade dimensional, permitindo que a fato encontre exatamente um registro associado.',
    detalheTecnico:
      'Em dimensões analíticas, prefere-se chaves substitutas (Surrogate Keys) de tipo inteiro para máxima performance e isolamento do sistema transacional de origem.',
    dicaProfissional:
      'Utilize Chaves Substitutas (Surrogate Keys) de número inteiro sequencial em vez de chaves de negócio compostas ou textuais. Chaves numéricas ocupam menos bytes e otimizam índices de junção.',
    regrasAssociadas: ['M-03'],
  },

  'chave-estrangeira': {
    id: 'chave-estrangeira',
    termo: 'Chave Estrangeira (FK)',
    categoria: 'INTEGRIDADE',
    definicaoSimples:
      'Coluna na tabela fato que referencia a chave primária de uma dimensão correspondente.',
    porQueImporta:
      'É a âncora que conecta o evento transacional ao seu contexto dimensional no modelo estrela.',
    detalheTecnico:
      'Deve possuir o mesmo tipo de dado e compatibilidade de domínio com a chave primária referenciada para evitar coerções em tempo de execução.',
    dicaProfissional:
      'Assegure que os tipos de dados e collation da FK na fato sejam rigorosamente idênticos aos da PK na dimensão; divergências de tipagem (ex: INT vs VARCHAR) invalidam junções diretas e forçam conversões lentas.',
    regrasAssociadas: ['M-03', 'M-08'],
  },

  'direcao-filtro': {
    id: 'direcao-filtro',
    termo: 'Direção de Filtro (Propagação)',
    categoria: 'INTEGRIDADE',
    definicaoSimples:
      'Indica se o filtro viaja apenas da dimensão para a fato (unidirecional) ou se também viaja da fato para a dimensão (bidirecional).',
    porQueImporta:
      'O fluxo unidirecional (Dimensão -> Fato) é a boa prática recomendada. Filtros bidirecionais podem causar ambiguidades em caminhos de relacionamento, comportamentos inesperados e degradação de desempenho.',
    detalheTecnico:
      'A regra de governança M-07 classifica filtro bidirecional como alerta crítico que exige justificativa técnica formal.',
    dicaProfissional:
      'Mantenha a direção do filtro sempre Unidirecional (Dimensão filtrando Fato). Se precisar que um filtro cruze dimensões temporariamente para um cálculo específico, use funções explícitas como CROSSFILTER em vez de habilitar bidirecional no modelo.',
    regrasAssociadas: ['M-07'],
  },

  metrica: {
    id: 'metrica',
    termo: 'Métrica Analítica (KPI)',
    categoria: 'METRICA',
    definicaoSimples:
      'Cálculo de negócio formalizado sobre colunas da tabela fato, expressando uma medida com unidade e regra clara (ex: Receita Total, Margem %, Ticket Médio).',
    porQueImporta:
      'Centraliza as regras de negócio em um único ponto, garantindo que toda a organização utilize a mesma definição matemática para o mesmo indicador.',
    detalheTecnico:
      'Especifica tipo de agregação (SUM, AVG, COUNT_DISTINCT, etc.), unidade de medida e regra de aditividade matemática.',
    dicaProfissional:
      'Nunca some colunas que representam taxas, percentuais ou médias. Calcule indicadores percentuais dividindo métricas aditivas consolidadas (ex: DIVIDE(ReceitaTotal, QtdTotal)), garantindo precisão em qualquer nível de filtro.',
    regrasAssociadas: ['M-04', 'M-05'],
  },

  'modelo-estrela': {
    id: 'modelo-estrela',
    termo: 'Modelo Estrela (Star Schema)',
    categoria: 'ESTRUTURA',
    definicaoSimples:
      'Padrão arquitetural clássico de BI onde uma tabela fato central é cercada por tabelas de dimensões conectadas diretamente.',
    porQueImporta:
      'Facilita o entendimento pelos analistas e usuários finais, reduz o número de junções (JOINs) e oferece máxima performance em ferramentas de BI e bancos colunares.',
    detalheTecnico:
      'Reduz o custo computacional de consultas agregadas em relação a modelos excessivamente normalizados (Snowflake).',
    dicaProfissional:
      'No Star Schema ideal, as dimensões conectam-se diretamente à fato em apenas um salto (1 hop). Evite encadear dimensões em cascata para garantir consultas mais rápidas e modelos intuitivos para autoatendimento.',
    regrasAssociadas: ['M-01', 'M-05'],
  },

  'dimensao-calendario': {
    id: 'dimensao-calendario',
    termo: 'Dimensão Calendário / Data',
    categoria: 'ESTRUTURA',
    definicaoSimples:
      'Tabela dimensional contínua com uma linha para cada dia do calendário, incluindo atributos como ano, mês, trimestre, dia da semana e feriados.',
    porQueImporta:
      'Essencial para cálculos de inteligência temporal (Time Intelligence), como comparações mês-a-mês (MoM), ano-a-ano (YoY) e acumulações no ano (YTD).',
    detalheTecnico:
      'Deve ser contínua, sem lacunas de datas no período analisado, para viabilizar funções de deslocamento temporal determinísticas.',
    dicaProfissional:
      'Garanta que a dimensão calendário cubra anos completos sem lacunas de datas, e configure a ordenação de nomes de meses por uma coluna numérica ("AnoMes" ou "NumeroMes") para evitar ordem alfabética indesejada em gráficos.',
    regrasAssociadas: ['M-08', 'M-10'],
  },

  homologacao: {
    id: 'homologacao',
    termo: 'Homologação do Modelo Analítico',
    categoria: 'GOVERNANCA',
    definicaoSimples:
      'Ato formal e auditável em que o analista humano revisa, aprova e sela o modelo como matematicamente consistente e apto para gerar análises e relatórios.',
    porQueImporta:
      'Impede que modelos com inconsistências ou sem verificação humana avancem para visualização e tomada de decisão estratégica.',
    detalheTecnico:
      'Registra carimbo de data/hora (timestamp), identificador do analista, hash do estado e, se houver alertas críticos (M-06/M-07), justificativa formal com no mínimo 15 caracteres.',
    dicaProfissional:
      'Antes de aprovar, verifique o checklist de conformidade e registre premissas e regras de reconciliação no parecer técnico; isso assegura rastreabilidade auditável e confiança aos consumidores dos dashboards.',
    regrasAssociadas: ['M-01', 'M-05', 'M-06', 'M-07'],
  },

  conformidade: {
    id: 'conformidade',
    termo: 'Conformidade Determinística (Regras M-01 a M-11)',
    categoria: 'GOVERNANCA',
    definicaoSimples:
      'Suíte de verificações automáticas e puras do Workspace que avaliam se o modelo segue as melhores práticas de engenharia dimensional e integridade de dados.',
    porQueImporta:
      'Garante qualidade objetiva antes de qualquer visualização, evitando retrabalho e desconfiança nos números apresentados.',
    detalheTecnico:
      'Diferencia severidades: BLOQUEIO (impede homologação), ALERTA_CRITICO (exige justificativa técnica) e RECOMENDACAO (melhoria sugerida).',
    dicaProfissional:
      'Encare os bloqueios e alertas como salvaguardas de arquitetura: corrigir inconsistências de granularidade ou relacionamentos ambíguos na modelagem custa uma fração do tempo de depurar relatórios já em produção.',
    regrasAssociadas: ['M-01', 'M-02', 'M-03', 'M-04', 'M-05', 'M-06', 'M-07', 'M-08', 'M-09', 'M-10', 'M-11'],
  },
};

/**
 * Retorna um conceito específico por sua chave
 */
export function getConceitoModelagem(id: string): ConceitoModelagem | undefined {
  return DICIONARIO_CONCEITOS_MODELAGEM[id];
}

/**
 * Retorna todos os conceitos cadastrados no dicionário
 */
export function listarTodosConceitosModelagem(): ConceitoModelagem[] {
  return Object.values(DICIONARIO_CONCEITOS_MODELAGEM);
}

/**
 * Retorna a lista de conceitos mais relevantes para um dado cenário de modelagem
 */
export function obterConceitosRelevantesParaCenario(
  cenario: CenarioModelagemCopiloto
): ConceitoModelagem[] {
  const mapeamento: Record<CenarioModelagemCopiloto, string[]> = {
    SEM_DATASET_VIGENTE: ['conformidade', 'homologacao'],
    SEM_MODELO_CRIADO: ['modelo-estrela', 'tabela-fato', 'grao'],
    HOMOLOGACAO_REVOGADA: ['homologacao', 'conformidade'],
    HOMOLOGACAO_INVALIDADA: ['homologacao', 'conformidade'],
    BLOQUEIO_CONFORMIDADE: ['conformidade', 'grao', 'chave-primaria'],
    SEM_ENTIDADE_FATO: ['tabela-fato', 'grao', 'modelo-estrela'],
    SEM_METRICAS_CADASTRADAS: ['metrica', 'tabela-fato'],
    ALERTA_CRITICO_PENDENTE: ['relacionamento', 'cardinalidade', 'direcao-filtro', 'homologacao'],
    PRONTO_PARA_HOMOLOGACAO: ['homologacao', 'conformidade', 'modelo-estrela'],
    HOMOLOGADO_E_VIGENTE: ['homologacao', 'dimensao-calendario'],
    ESTADO_GERAL_MODELAGEM: ['modelo-estrela', 'tabela-fato', 'dimensao'],
  };

  const chaves = mapeamento[cenario] ?? ['modelo-estrela', 'conformidade'];
  return chaves
    .map((k) => DICIONARIO_CONCEITOS_MODELAGEM[k])
    .filter((c): c is ConceitoModelagem => Boolean(c));
}
