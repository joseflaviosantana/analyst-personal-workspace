import { Demanda } from '../entities/demanda';
import { RequisitoDemanda } from '../entities/requisito-demanda';
import { PerguntaClarificacao } from '../entities/pergunta-clarificacao';
import { StatusPerguntaClarificacao } from '../enums/status-pergunta-clarificacao';

export interface SugestaoPerguntaCopiloto {
  id: string;
  titulo: string;
  perguntaSugerida: string;
  motivacao: string;
  categoria: 'TEMPORALIDADE' | 'GRANULARIDADE' | 'REGRA_NEGOCIO' | 'STAKEHOLDER' | 'FORMATO_ENTREGA';
  bloqueanteRecomendado: boolean;
}

export interface ConceitoPedagogicoRequisitos {
  termo: string;
  definicao: string;
  porQueImporta: string;
  dicaPratica: string;
}

export interface DiagnosticoRequisitosCopiloto {
  resumoOperacional: {
    titulo: string;
    statusBriefing: 'INCOMPLETO' | 'EM_ESTRUTURACAO' | 'MADURO_PARA_DADOS';
    ondeEstou: string;
    oQueDevoFazerAgora: string;
  };
  sugestoesPedagogicas: SugestaoPerguntaCopiloto[];
  dicionarioConceitos: ConceitoPedagogicoRequisitos[];
  metricasBriefing: {
    temObjetivo: boolean;
    temPeriodo: boolean;
    temGranularidade: boolean;
    temFormatoEntrega: boolean;
    totalRequisitos: number;
    totalObrigatorios: number;
    perguntasPendentes: number;
    perguntasBloqueantes: number;
  };
}

export class RequirementsCopilotEngine {
  static avaliar(
    demanda: Demanda,
    requisitos: RequisitoDemanda[] = [],
    perguntas: PerguntaClarificacao[] = []
  ): DiagnosticoRequisitosCopiloto {
    const textoCompleto = [
      demanda.solicitacao_bruta,
      demanda.contexto || '',
      demanda.objetivo_inicial || '',
      demanda.periodo_analise || '',
      demanda.granularidade || '',
      demanda.formato_entrega || '',
    ]
      .join(' ')
      .toLowerCase();

    const temObjetivo = Boolean(demanda.objetivo_inicial && demanda.objetivo_inicial.trim().length >= 5);
    const temPeriodo = Boolean(demanda.periodo_analise && demanda.periodo_analise.trim().length > 0);
    const temGranularidade = Boolean(demanda.granularidade && demanda.granularidade.trim().length > 0);
    const temFormatoEntrega = Boolean(demanda.formato_entrega && demanda.formato_entrega.trim().length > 0);

    const totalObrigatorios = requisitos.filter((r) => r.prioridade === 'OBRIGATORIO').length;
    const perguntasBloqueantes = perguntas.filter(
      (p) =>
        p.bloqueante &&
        (p.status === StatusPerguntaClarificacao.RASCUNHO ||
          p.status === StatusPerguntaClarificacao.ENVIADA)
    ).length;

    const perguntasPendentes = perguntas.filter(
      (p) =>
        p.status === StatusPerguntaClarificacao.RASCUNHO ||
        p.status === StatusPerguntaClarificacao.ENVIADA
    ).length;

    // Resumo Operacional
    let statusBriefing: 'INCOMPLETO' | 'EM_ESTRUTURACAO' | 'MADURO_PARA_DADOS' = 'INCOMPLETO';
    let ondeEstou = 'Início do levantamento de requisitos na Aba 2.';
    let oQueDevoFazerAgora = 'Refine o objetivo analítico e identifique as principais dúvidas de negócio.';

    if (perguntasBloqueantes > 0) {
      statusBriefing = 'EM_ESTRUTURACAO';
      ondeEstou = `Aguardando retorno do cliente para ${perguntasBloqueantes} pergunta(s) impeditiva(s).`;
      oQueDevoFazerAgora = 'Despache as dúvidas bloqueantes com o cliente e registre as respostas assim que recebidas.';
    } else if (temObjetivo && (temPeriodo || temGranularidade) && totalObrigatorios > 0) {
      statusBriefing = 'MADURO_PARA_DADOS';
      ondeEstou = 'Briefing analítico e requisitos suficientemente delimitados.';
      oQueDevoFazerAgora = demanda.requisitos_homologados_em
        ? 'Levantamento homologado. Prossiga para a recepção dos arquivos de dados na Aba 3.'
        : 'Homologue formalmente a suficiência do levantamento para liberar a transição para Dados Recebidos.';
    } else if (requisitos.length > 0 || temObjetivo) {
      statusBriefing = 'EM_ESTRUTURACAO';
      ondeEstou = 'Estruturação do briefing em andamento.';
      oQueDevoFazerAgora = 'Especifique o grão da análise (granularidade), a janela temporal e os KPIs essenciais.';
    }

    // Sugestões Pedagógicas Não Vinculantes
    const sugestoesPedagogicas: SugestaoPerguntaCopiloto[] = [];

    // Heurística consultiva: Granularidade
    const mencionaGrão = /diári|mensal|semanal|transaç|linha|grão|granularidade|pedido|item/.test(textoCompleto);
    if (!temGranularidade && !mencionaGrão) {
      sugestoesPedagogicas.push({
        id: 'sug_gran',
        titulo: 'Alinhamento de Granularidade Analítica',
        perguntaSugerida:
          'Qual o grão esperado para os números do relatório? Os dados devem ser analisados por transação individual ou consolidados mensalmente/diariamente por unidade?',
        motivacao:
          'O grão dos dados dita a estrutura da Tabela Fato no Power BI e a complexidade das transformações no Power Query.',
        categoria: 'GRANULARIDADE',
        bloqueanteRecomendado: false,
      });
    }

    // Heurística consultiva: Janela Temporal e Histórico
    const mencionaTempo = /ano|mês|período|janela|histórico|safra|desde|202\d/.test(textoCompleto);
    if (!temPeriodo && !mencionaTempo) {
      sugestoesPedagogicas.push({
        id: 'sug_tempo',
        titulo: 'Definição da Janela Temporal e Histórico',
        perguntaSugerida:
          'Qual é o período histórico relevante para esta entrega (ex.: últimos 12 meses, ano corrente completo)? Precisamos de comparação com o período homólogo anterior?',
        motivacao:
          'Delimitar a janela temporal previne importação de dados irrelevantes e orienta o dimensionamento correto da dData.',
        categoria: 'TEMPORALIDADE',
        bloqueanteRecomendado: false,
      });
    }

    // Heurística consultiva: Regras de Exclusão / Cancelamentos
    const mencionaExcecoes = /cancelad|estorn|inativ|devolu|ativo|bloquead/.test(textoCompleto);
    if (!mencionaExcecoes) {
      sugestoesPedagogicas.push({
        id: 'sug_regra',
        titulo: 'Critérios de Exclusão e Status Especiais',
        perguntaSugerida:
          'Existem pedidos cancelados, devoluções ou registros de teste que devem ser expurgados da apuração dos indicadores?',
        motivacao:
          'Divergências numéricas entre o dashboard e os relatórios operacionais do cliente frequentemente decorrem de filtros não declarados de status.',
        categoria: 'REGRA_NEGOCIO',
        bloqueanteRecomendado: false,
      });
    }

    // Dicionário Conceitual Pedagógico
    const dicionarioConceitos: ConceitoPedagogicoRequisitos[] = [
      {
        termo: 'Granularidade Analítica',
        definicao: 'O nível de detalhe atômico representado por cada linha na tabela fato.',
        porQueImporta:
          'Misturar linhas de pedidos com linhas de itens ou totais agregados quebra relacionamentos e duplica valores em medidas DAX.',
        dicaPratica:
          'Sempre pergunte: "o que uma linha representa?". Se a resposta variar na mesma base, é necessário tratamento no Power Query.',
      },
      {
        termo: 'Premissa Implícita vs. Regra Declarada',
        definicao: 'Premissa é o que o analista supõe; regra é o que o contratante homologou formalmente.',
        porQueImporta:
          'Premissas silenciosas são a causa primária de retrabalho e frustração na entrega de projetos de BI.',
        dicaPratica:
          'Nunca presuma critérios de corte contábil ou inativação de clientes. Transforme toda dúvida em uma pergunta de clarificação.',
      },
      {
        termo: 'Tolerância Zero em Reconciliação',
        definicao: 'O princípio metodológico de que números finais devem bater exatamente com a fonte ou ter divergência explicada.',
        porQueImporta:
          'Para o contratante, um desvio de 1% inexplicado gera desconfiança sobre a totalidade do modelo.',
        dicaPratica:
          'Acorde desde a largada qual é o relatório oficial do cliente que servirá de parâmetro de conferência dos KPIs.',
      },
      {
        termo: 'Fato vs Dimensão',
        definicao: 'Fatos contêm eventos numéricos mensuráveis; dimensões contêm o contexto de negócio que filtra e segmenta os fatos.',
        porQueImporta:
          'Confundir atributos dimensionais com medidas na tabela fato prejudica a performance e a legibilidade do modelo Star Schema.',
        dicaPratica:
          'Mantenha chaves e métricas na Fato; nomes, categorias, datas e status nas Dimensões.',
      },
      {
        termo: 'Métrica Aditiva vs Derivada',
        definicao: 'Métricas aditivas podem ser somadas em qualquer dimensão (ex: Faturamento); métricas derivadas exigem recalcular divisões no contexto (ex: Margem %).',
        porQueImporta:
          'Somar percentuais diretamente produz erros graves de agregação em dashboards executivos.',
        dicaPratica:
          'Nunca use SUM() sobre margens ou taxas percentuais; use DIVIDE(SUM(Lucro), SUM(Receita)).',
      },
    ];

    return {
      resumoOperacional: {
        titulo: `Status do Levantamento: ${statusBriefing}`,
        statusBriefing,
        ondeEstou,
        oQueDevoFazerAgora,
      },
      sugestoesPedagogicas,
      dicionarioConceitos,
      metricasBriefing: {
        temObjetivo,
        temPeriodo,
        temGranularidade,
        temFormatoEntrega,
        totalRequisitos: requisitos.length,
        totalObrigatorios,
        perguntasPendentes,
        perguntasBloqueantes,
      },
    };
  }
}
