/**
 * src/core/domain/dashboard-copilot/strategies/baseline-orientacao.strategy.ts
 *
 * Estratégia de acolhimento e orientação fundamental de estrutura para a Aba 7.
 */

import {
  ContextoAnaliseDashboardCopilot,
  EstrategiaInsightDashboard,
  InsightDashboardCopilot,
} from "../dashboard-copilot-types";
import { TipoFormatoModeloPowerBi } from "@/core/domain/enums/tipo-formato-modelo-powerbi";

export class EstrategiaBaselineOrientacaoDashboard implements EstrategiaInsightDashboard {
  public readonly codigo = "D-COP-BASELINE";

  public executar(contexto: Readonly<ContextoAnaliseDashboardCopilot>): InsightDashboardCopilot[] {
    const insights: InsightDashboardCopilot[] = [];

    // Caso 1: Sem modelo Power BI cadastrado
    if (!contexto.modeloPowerBi) {
      const contextoId = contexto.demandaId ?? "global";
      insights.push({
        id: `d-cop-baseline-sem-modelo:${contextoId}`,
        codigo: "D-COP-BASELINE-01",
        categoria: "PRONTIDAO_OPERACIONAL",
        natureza: "ORIENTACAO",
        prioridade: "PRIORIDADE_2_ELEMENTO_FALTANTE",
        ordemPrioridade: 2,
        titulo: "Iniciação da Camada de Visualização e DAX",
        deteccao: "A demanda ainda não possui um modelo Power BI (.pbix/.pbip) vinculado nem isenção formal registrada.",
        explicacao:
          "A etapa de Dashboard e DAX consolida os dados preparados e o modelo semântico em artefatos visuais navegáveis. Antes de construir visuais, define-se o formato de entrega (PBIX tradicional, PBIP com controle de versão TMDL ou isenção em Excel).",
        recomendacao:
          "Defina o formato do modelo Power BI a ser desenvolvido para liberar a estruturação das páginas e o catálogo de medidas DAX.",
        fatoDetectado: "Nenhum arquivo .pbip/.pbix associado e nenhuma declaração formal de isenção presente.",
        oportunidade: "Estruturar o projeto de visualização desde o início com rastreabilidade de código.",
        sugestaoAcao: "Cadastre o arquivo de modelo ou formalize a justificativa de isenção na Aba 7.",
        proximaAcaoSugerida: {
          tipo: "AVALIAR_PRONTIDAO",
          titulo: "Vincular Modelo Power BI ou Registrar Isenção",
          descricao: "Defina o arquivo de modelo (.pbip recomendado) ou formalize a isenção de dashboard.",
          requerIntervencaoHumana: true,
        },
        pedagogico: {
          conceitoChave: "Desacoplamento entre Semântica e Visualização",
          porQueImporta:
            "Separar a modelagem semântica (tabelas e relacionamentos) da camada de visualização garante governança e evita retrabalho analítico.",
          dicaProfissional:
            "Para novos relatórios em equipe, prefira o formato PBIP (Power BI Project), pois ele serializa metadados em TMDL e permite versionamento limpo via Git.",
          termoDicionario: "PBIP e TMDL",
        },
        entidadesRelacionadas: [],
      });
      return insights;
    }

    const { modeloPowerBi, paginas, visuais } = contexto;
    const ehIsento = modeloPowerBi.tipo_formato === TipoFormatoModeloPowerBi.ISENTO_EXCEL_ONLY;

    // Caso 2: Modelo Isento (Excel Only)
    if (ehIsento) {
      insights.push({
        id: `d-cop-baseline-isento:${modeloPowerBi.id}`,
        codigo: "D-COP-BASELINE-02",
        categoria: "GOVERNANCA_METRICA",
        natureza: "ORIENTACAO",
        prioridade: "PRIORIDADE_6_REFINAMENTO",
        ordemPrioridade: 6,
        titulo: "Fluxo Direcionado para Entrega em Planilha Excel",
        deteccao: "O modelo Power BI foi declarado como isento (ISENTO_EXCEL_ONLY).",
        explicacao:
          "Demandas com entrega exclusiva em planilha não necessitam de painéis visuais ou medidas DAX no Power BI, mas exigem governança formal de reconciliação de dados na etapa de Validação.",
        recomendacao:
          "Assegure que as abas e fórmulas da planilha atendam rigorosamente às métricas analíticas aprovadas na etapa de Modelagem.",
        fatoDetectado: "Declaração de ISENTO_EXCEL_ONLY ativa para a demanda.",
        oportunidade: "Avançar diretamente para a reconciliação numérica sobre a base autorizada.",
        sugestaoAcao: "Valide as fórmulas e totais na planilha antes da submissão formal.",
        proximaAcaoSugerida: {
          tipo: "AVALIAR_PRONTIDAO",
          titulo: "Confirmar Justificativa de Isenção",
          descricao: "Revise a fundamentação técnica registrada para auditoria da entrega analítica.",
          requerIntervencaoHumana: true,
        },
        pedagogico: {
          conceitoChave: "Conformidade e Isenção Governada",
          porQueImporta:
            "Nem toda entrega analítica demanda um dashboard interativo. Registrar a isenção formal evita falsos bloqueios e documenta a decisão de negócio.",
          dicaProfissional:
            "Mesmo em Excel, mantenha um glossário das métricas e utilize tabelas dinâmicas estruturadas para assegurar rastreabilidade dos totais.",
          termoDicionario: "Entrega Tabular Isenta",
        },
        entidadesRelacionadas: [
          {
            tipo: "MODELO_POWERBI",
            id: modeloPowerBi.id,
            nome: modeloPowerBi.nome_arquivo || "Modelo Isento",
          },
        ],
      });
      return insights;
    }

    // Caso 3: Modelo normal sem páginas estruturadas
    if (paginas.length === 0) {
      insights.push({
        id: `d-cop-baseline-sem-paginas:${modeloPowerBi.id}`,
        codigo: "D-COP-BASELINE-03",
        categoria: "ESTRUTURA_PAGINA",
        natureza: "OPORTUNIDADE",
        prioridade: "PRIORIDADE_2_ELEMENTO_FALTANTE",
        ordemPrioridade: 2,
        titulo: "Estruturação das Páginas Analíticas do Relatório",
        deteccao: "O modelo Power BI está cadastrado, porém ainda não possui páginas analíticas definidas.",
        explicacao:
          "Um relatório executivo de BI deve organizar o fluxo narrativo em páginas temáticas com objetivos analíticos e públicos-alvo bem estabelecidos.",
        recomendacao:
          "Planeje e crie as páginas principais do relatório (ex: 'Visão Geral Executiva' e 'Detalhamento Operacional').",
        fatoDetectado: "Total de páginas de relatório cadastradas é 0.",
        oportunidade: "Construir uma arquitetura de informação limpa e intuitiva desde a primeira tela.",
        sugestaoAcao: "Cadastre as páginas do relatório indicando público-alvo e objetivo.",
        proximaAcaoSugerida: {
          tipo: "ESTRUTURAR_PAGINAS",
          titulo: "Definir Primeira Página de Relatório",
          descricao: "Cadastre ao menos uma página definindo seu objetivo analítico e público-alvo.",
          requerIntervencaoHumana: true,
        },
        pedagogico: {
          conceitoChave: "Storytelling com Dados e Hierarquia Visual",
          porQueImporta:
            "Dashboards eficazes partem de uma visão macro (nível estratégico) e oferecem caminhos de detalhamento (nível tático/operacional).",
          dicaProfissional:
            "Mantenha a primeira página focada nos 3 a 5 principais KPIs de negócio antes de abrir gráficos densos de detalhamento.",
          termoDicionario: "Hierarquia de Telas Analíticas",
        },
        entidadesRelacionadas: [
          {
            tipo: "MODELO_POWERBI",
            id: modeloPowerBi.id,
            nome: modeloPowerBi.nome_arquivo || "Modelo Power BI",
          },
        ],
      });
    }

    // Caso 4: Páginas existentes mas sem visuais
    if (paginas.length > 0 && visuais.length === 0) {
      insights.push({
        id: `d-cop-baseline-sem-visuais:${paginas[0].id}`,
        codigo: "D-COP-BASELINE-04",
        categoria: "EXPERIENCIA_VISUAL",
        natureza: "OPORTUNIDADE",
        prioridade: "PRIORIDADE_2_ELEMENTO_FALTANTE",
        ordemPrioridade: 2,
        titulo: "Composição dos Componentes Gráficos nas Páginas",
        deteccao: `Existem ${paginas.length} página(s) cadastrada(s), mas nenhum componente visual foi registrado.`,
        explicacao:
          "Cada página necessita de visuais coerentes (cartões de KPI, gráficos de evolução temporal, gráficos de comparação) para comunicar os resultados.",
        recomendacao:
          "Adicione componentes gráficos justificando a escolha do tipo visual para cada indicador.",
        fatoDetectado: `Páginas cadastradas (${paginas.length}), porém total de visuais é 0.`,
        oportunidade: "Preencher as telas com gráficos orientados aos objetivos de cada página.",
        sugestaoAcao: "Adicione componentes visuais às páginas registradas.",
        proximaAcaoSugerida: {
          tipo: "ENRIQUECER_VISUAIS",
          titulo: "Cadastrar Visuais Analíticos",
          descricao: "Conecte os indicadores às páginas utilizando a taxonomia adequada de DataViz.",
          requerIntervencaoHumana: true,
        },
        pedagogico: {
          conceitoChave: "Justificativa de Data Visualization (DataViz)",
          porQueImporta:
            "A escolha do gráfico deve ser ditada pela pergunta que ele responde: cartões para valores pontuais, linhas para tendências temporais e barras para comparação categórica.",
          dicaProfissional:
            "Evite excesso de cores e saturação visual. Priorize o contraste intencional para destacar anomalias ou metas alcançadas.",
          termoDicionario: "Gramática de Gráficos em BI",
        },
        entidadesRelacionadas: [
          {
            tipo: "PAGINA_RELATORIO",
            id: paginas[0].id,
            nome: paginas[0].nome,
          },
        ],
      });
    }

    return insights;
  }
}
