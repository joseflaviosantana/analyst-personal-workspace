/**
 * src/core/domain/dashboard-delivery/dashboard-delivery-package-engine.ts
 *
 * Motor Determinístico de Montagem do Pacote de Entrega de Dashboard (Subgate 3.4E)
 *
 * Responsabilidade:
 * - Consolidar todos os artefatos existentes na Aba 7 de forma determinística;
 * - Executar a avaliação do Checklist de Entrega;
 * - Estruturar os metadados do case de portfólio;
 * - Mapear decisões humanas e status geral de entrega;
 * - Produzir um pacote imutável e auditável.
 */

import { DemandaComProjeto } from '../entities/demanda';
import { ModeloPowerBi } from '../entities/modelo-powerbi';
import { ModeloAnaliticoCompleto } from '../entities/modelo-analitico';
import { MedidaDax } from '../entities/medida-dax';
import { PaginaRelatorioComVisuais } from '../entities/pagina-relatorio';
import { VisualDashboard } from '../entities/visual-dashboard';
import { ResultadoProntidaoDashboard } from '../rules/dashboard-rules-evaluator';
import { ResultadoCopilotoDashboard } from '../dashboard-copilot/dashboard-copilot-types';
import { TipoFormatoModeloPowerBi } from '../enums/tipo-formato-modelo-powerbi';
import {
  PacoteEntregaDashboard,
  CasePortfolioEstrutural,
  DecisaoHumanaRegistrada,
  StatusGeralEntregaDashboard,
} from './dashboard-delivery-types';
import { DashboardChecklistEngine } from './dashboard-checklist-engine';

export interface ParametrosMontagemPacote {
  demanda: DemandaComProjeto;
  modeloPowerBi: ModeloPowerBi | null;
  modeloAnalitico?: ModeloAnaliticoCompleto | null;
  medidas: MedidaDax[];
  paginas: PaginaRelatorioComVisuais[];
  resultadoNormativo: ResultadoProntidaoDashboard;
  resultadoCopiloto?: ResultadoCopilotoDashboard | null;
  templateEscolhido?: string;
  decisoesHumanasAdicionais?: DecisaoHumanaRegistrada[];
}

export class DashboardDeliveryPackageEngine {
  public static montarPacote(params: ParametrosMontagemPacote): PacoteEntregaDashboard {
    const {
      demanda,
      modeloPowerBi,
      modeloAnalitico,
      medidas,
      paginas,
      resultadoNormativo,
      resultadoCopiloto,
      templateEscolhido = 'Executive Premium',
      decisoesHumanasAdicionais = [],
    } = params;

    const agora = new Date().toISOString();
    const isIsento =
      modeloPowerBi?.tipo_formato === TipoFormatoModeloPowerBi.ISENTO_EXCEL_ONLY;

    // Extrair todos os visuais planos
    const todosVisuais: VisualDashboard[] = paginas.flatMap((p) => p.visuais || []);

    // 1. Mapear Decisões Humanas
    const decisoesHumanas: DecisaoHumanaRegistrada[] = [...decisoesHumanasAdicionais];

    if (modeloPowerBi) {
      if (isIsento) {
        decisoesHumanas.push({
          tipo: 'ISENCAO_POWERBI',
          descricao: `Declaração formal de Isenção Excel-Only: "${modeloPowerBi.justificativa_isencao}"`,
          dataHora: modeloPowerBi.criado_em,
        });
      } else {
        decisoesHumanas.push({
          tipo: 'REGISTRO_MODELO',
          descricao: `Vinculação do modelo de relatório "${modeloPowerBi.nome_arquivo}"`,
          dataHora: modeloPowerBi.criado_em,
        });
      }
    }

    paginas.forEach((p) => {
      decisoesHumanas.push({
        tipo: 'ESTRUTURACAO_PAGINA',
        descricao: `Página "${p.nome}" (${p.publico_alvo}) vinculada ao modelo`,
        dataHora: p.atualizado_em || p.criado_em,
      });
    });

    // 2. Avaliar Checklist de Entrega
    const checklist = DashboardChecklistEngine.avaliar({
      modeloPowerBi,
      modeloAnalitico,
      medidas,
      paginas,
      visuais: todosVisuais,
      resultadoNormativo,
      decisaoHumanaRegistrada: decisoesHumanas.length > 0,
    });

    // 3. Status Geral de Entrega
    let statusEntrega: StatusGeralEntregaDashboard = 'EM_DESENVOLVIMENTO';
    if (checklist.totalBloqueados > 0) {
      statusEntrega = 'BLOQUEADO';
    } else if (checklist.aptoParaSeguirWorkflow) {
      statusEntrega = 'PRONTO_PARA_ENTREGA';
    }

    // 4. Estruturar Case de Portfólio (Sem Publicação Externa)
    const metricasNomes = (modeloAnalitico?.metricas || []).map((m) => m.nome);
    const ferramentas = ['Power BI Desktop', 'DAX', 'SQLite Local-First', 'Design System Panorâmico (16:9)'];
    if (isIsento) {
      ferramentas.unshift('Microsoft Excel / Planilha Analítica');
    }

    const decisoesMetodologicas: string[] = [
      `Padrão visual estrutural baseado no template ${templateEscolhido}`,
      'Separação entre modelagem analítica e apresentação visual',
    ];
    if (isIsento) {
      decisoesMetodologicas.push('Adoção de isenção formal de BI em favor de entrega ágil em planilha');
    } else {
      decisoesMetodologicas.push('Organização de medidas DAX em tabelas hospedeiras formais com tipagem estrita');
    }

    const casePortfolio: CasePortfolioEstrutural = {
      tituloCase: `Dashboard Analítico — ${demanda.titulo}`,
      problemaNegocio: demanda.solicitacao_bruta || 'Otimização e monitoramento analítico de indicadores de negócio.',
      contexto: demanda.contexto || `Projeto analítico desenvolvido no âmbito de ${demanda.projetoNome || 'Analytics'}.`,
      processoAplicado:
        'Pipeline analítico de ponta a ponta: Entendimento do negócio -> Qualidade de dados -> Modelagem Dimensional -> Medidas DAX -> Planejamento Automático de Dashboard com Supervisão Humana -> Homologação.',
      ferramentasUtilizadas: ferramentas,
      decisoesMetodologicas,
      metricasChave: metricasNomes.length > 0 ? metricasNomes : medidas.map((m) => m.nome),
      resultadosEsperados:
        demanda.objetivo_inicial ||
        'Fornecer visibilidade executiva e operacional com alta densidade analítica, rastreabilidade e governança.',
      aprendizadosTecnicos: [
        'Adoção do princípio "Aprenda enquanto trabalha" com justificativas formais de DataViz por visual',
        'Avaliação determinística contínua de integridade pelas regras D-01 a D-08',
        'Controle estrito de linhagem semântica entre perguntas de negócio, KPIs e visualizações',
      ],
      resumoTecnicoSanitizado: `Case de Business Intelligence desenvolvido para ${demanda.titulo}, compreendendo ${medidas.length} medida(s) DAX e ${paginas.length} página(s) estruturada(s) em grid de 12 colunas 16:9.`,
      evidenciasDisponiveis: [
        {
          tipo: 'CATALOGO_DAX',
          descricao: `${medidas.length} medida(s) DAX documentadas em sintaxe TMDL formal`,
        },
        {
          tipo: 'MAPA_VISUAL',
          descricao: `${todosVisuais.length} visual(is) com coordenadas semânticas e justificativas pedagógicas`,
        },
        {
          tipo: 'RELATORIO_CONFORMIDADE',
          descricao: `Avaliação de prontidão D-01..D-08 com status ${resultadoNormativo.status_geral}`,
        },
      ],
    };

    // 5. Mapear Catálogo de Medidas DAX
    const catalogoMedidasDax = medidas.map((m) => {
      const metricaOrigem = modeloAnalitico?.metricas?.find(
        (met) => met.id === m.metrica_analitica_id
      );
      return {
        id: m.id,
        nome: m.nome,
        tabelaHospedeira: m.tabela_hospedeira,
        expressaoDax: m.expressao_dax,
        formatoString: m.formato_string,
        categoriaDax: m.categoria_dax,
        metricaOrigemNome: metricaOrigem?.nome || null,
        descricao: m.descricao,
      };
    });

    // 6. Mapear Páginas
    const paginasFormatadas = paginas.map((p) => ({
      id: p.id,
      nome: p.nome,
      objetivoAnalitico: p.objetivo_analitico,
      publicoAlvo: p.publico_alvo,
      layoutGrid: p.layout_grid,
      ordem: p.ordem,
      totalVisuais: p.visuais?.length || 0,
    }));

    // 7. Mapear Visuais
    const visuaisFormatados = paginas.flatMap((p) =>
      (p.visuais || []).map((v) => {
        let justDataViz: any = undefined;
        if (v.justificativa_dataviz) {
          try {
            justDataViz = JSON.parse(v.justificativa_dataviz);
          } catch {
            justDataViz = {
              oQueFoiEscolhido: v.tipo_visual,
              porQueFoiEscolhido: v.justificativa_dataviz,
              qualPerguntaResponde: 'Pergunta associada ao visual',
              qualMetricaUtiliza: 'Medida associada',
              qualDimensaoUtiliza: 'Dimensão associada',
              dicaProfissional: 'Consulte boas práticas de DataViz no workspace',
              quandoEvitar: 'Quando houver excesso de categorias simultâneas',
            };
          }
        }

        return {
          id: v.id,
          paginaId: p.id,
          paginaNome: p.nome,
          titulo: v.titulo,
          tipoVisual: v.tipo_visual,
          posicaoLayout: v.posicao_layout,
          medidasAssociadas: v.medidas_utilizadas_ids || [],
          justificativaDataviz: justDataViz,
          statusAprovacao: 'HOMOLOGADO',
        };
      })
    );

    // 8. Mapear Orientações do Copiloto
    const insightsFormatados = (resultadoCopiloto?.insights || []).map((ins) => ({
      codigo: ins.codigo,
      categoria: ins.categoria,
      natureza: ins.natureza,
      titulo: ins.titulo,
      recomendacao: ins.recomendacao,
      explicacao: ins.explicacao,
    }));

    return {
      versaoPacote: '1.0.0',
      geradoEm: agora,
      demanda: {
        id: demanda.id,
        titulo: demanda.titulo,
        projetoNome: demanda.projetoNome,
        objetivo: demanda.objetivo_inicial,
        contexto: demanda.contexto,
        estado: demanda.estado,
      },
      modeloPowerBi: modeloPowerBi
        ? {
            id: modeloPowerBi.id,
            tipoFormato: modeloPowerBi.tipo_formato,
            nomeArquivo: modeloPowerBi.nome_arquivo,
            status: modeloPowerBi.status,
            versaoPowerBi: modeloPowerBi.versao_powerbi,
            isIsento,
            justificativaIsencao: modeloPowerBi.justificativa_isencao,
          }
        : null,
      modeloAnaliticoReferencia: modeloAnalitico
        ? {
            id: modeloAnalitico.id,
            nome: modeloAnalitico.nome,
            status: modeloAnalitico.status,
            totalMetricas: modeloAnalitico.metricas?.length || 0,
          }
        : null,
      catalogoMedidasDax,
      paginas: paginasFormatadas,
      visuais: visuaisFormatados,
      perfilVisualTemplate: templateEscolhido,
      prontidaoNormativa: {
        statusGeral: resultadoNormativo.status_geral,
        aptoParaValidacao: resultadoNormativo.apto_para_validacao,
        totalBloqueios: resultadoNormativo.total_bloqueios,
        totalAlertasCriticos: resultadoNormativo.total_alertas_criticos,
        totalRecomendacoes: resultadoNormativo.total_recomendacoes,
        diagnosticos: resultadoNormativo.diagnosticos,
      },
      orientacoesCopiloto: {
        totalInsights: resultadoCopiloto?.total_insights || 0,
        insights: insightsFormatados,
      },
      checklist,
      casePortfolio,
      decisoesHumanas,
      statusEntrega,
    };
  }
}
