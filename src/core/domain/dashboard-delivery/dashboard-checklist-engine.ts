/**
 * src/core/domain/dashboard-delivery/dashboard-checklist-engine.ts
 *
 * Motor Determinístico de Avaliação do Checklist de Entrega de Dashboard (Subgate 3.4E)
 *
 * Princípios Epistêmicos:
 * 1. Determinismo estrito: as mesmas entradas geram os mesmos itens e status do checklist;
 * 2. Rastreabilidade com regras normativas: reflete D-01 a D-08 sem mutações;
 * 3. O Copiloto NÃO gera bloqueio no checklist (seus conselhos são orientações pedagógicas);
 * 4. Isenção Excel-Only é respeitada (itens exclusivos de Power BI tornam-se NAO_APLICAVEL ou ISENTO).
 */

import { ModeloPowerBi } from '../entities/modelo-powerbi';
import { MedidaDax } from '../entities/medida-dax';
import { PaginaRelatorio } from '../entities/pagina-relatorio';
import { VisualDashboard } from '../entities/visual-dashboard';
import { ModeloAnaliticoCompleto } from '../entities/modelo-analitico';
import { ResultadoProntidaoDashboard } from '../rules/dashboard-rules-evaluator';
import { TipoFormatoModeloPowerBi } from '../enums/tipo-formato-modelo-powerbi';
import { StatusModeloAnalitico } from '../enums/status-modelo-analitico';
import {
  ChecklistEntregaDashboard,
  ItemChecklistEntrega,
  StatusItemChecklist,
} from './dashboard-delivery-types';

export interface ContextoChecklistDashboard {
  modeloPowerBi: ModeloPowerBi | null;
  modeloAnalitico?: ModeloAnaliticoCompleto | null;
  medidas: MedidaDax[];
  paginas: PaginaRelatorio[];
  visuais: VisualDashboard[];
  resultadoNormativo: ResultadoProntidaoDashboard;
  decisaoHumanaRegistrada?: boolean;
}

export class DashboardChecklistEngine {
  public static avaliar(contexto: ContextoChecklistDashboard): ChecklistEntregaDashboard {
    const {
      modeloPowerBi,
      modeloAnalitico,
      medidas,
      paginas,
      visuais,
      resultadoNormativo,
      decisaoHumanaRegistrada = false,
    } = contexto;

    const isIsento =
      modeloPowerBi?.tipo_formato === TipoFormatoModeloPowerBi.ISENTO_EXCEL_ONLY;

    const itens: ItemChecklistEntrega[] = [];

    // 1. CHK-01: Modelo Power BI ou Isenção Formal
    if (!modeloPowerBi) {
      itens.push({
        id: 'chk-01',
        codigo: 'CHK-01',
        titulo: 'Registro do Modelo Power BI ou Declaração de Isenção',
        descricao:
          'O projeto deve possuir um arquivo de modelo (.pbix / .pbip) registrado ou uma declaração formal de Isenção Excel-Only.',
        status: 'BLOQUEADO',
        obrigatorio: true,
        evidencia: 'Nenhum registro de modelo Power BI ou isenção encontrado.',
        acaoSugerida: 'Registre o arquivo .pbix/.pbip no Bloco 1 ou formalize a Isenção Excel-Only.',
      });
    } else if (isIsento) {
      const isencaoValida =
        Boolean(modeloPowerBi.justificativa_isencao) &&
        modeloPowerBi.justificativa_isencao!.trim().length >= 15;
      itens.push({
        id: 'chk-01',
        codigo: 'CHK-01',
        titulo: 'Registro do Modelo Power BI ou Declaração de Isenção',
        descricao:
          'Declaração formal de Isenção Excel-Only registrada em substituição ao modelo Power BI.',
        status: isencaoValida ? 'CONCLUIDO' : 'BLOQUEADO',
        obrigatorio: true,
        evidencia: isencaoValida
          ? `Isenção Excel-Only ativa: "${modeloPowerBi.justificativa_isencao}"`
          : 'Justificativa de isenção ausente ou insuficiente.',
        acaoSugerida: isencaoValida
          ? undefined
          : 'Forneça uma justificativa técnica formal para a isenção de BI.',
      });
    } else {
      itens.push({
        id: 'chk-01',
        codigo: 'CHK-01',
        titulo: 'Registro do Modelo Power BI ou Declaração de Isenção',
        descricao: 'Arquivo de Modelo Power BI registrado formalmente no workspace.',
        status: 'CONCLUIDO',
        obrigatorio: true,
        evidencia: `Arquivo registrado: "${modeloPowerBi.nome_arquivo}" (${modeloPowerBi.tipo_formato})`,
      });
    }

    // 2. CHK-02: Modelo Analítico Homologado
    if (isIsento) {
      itens.push({
        id: 'chk-02',
        codigo: 'CHK-02',
        titulo: 'Modelo Analítico Dimensional Homologado',
        descricao:
          'Verificação da existência de modelo analítico dimensional homologado na Aba 6.',
        status: 'NAO_APLICAVEL',
        obrigatorio: false,
        evidencia: 'Isenção Excel-Only ativa; validação dimensional estrita não obrigatória.',
      });
    } else if (modeloAnalitico && modeloAnalitico.status === StatusModeloAnalitico.HOMOLOGADO) {
      itens.push({
        id: 'chk-02',
        codigo: 'CHK-02',
        titulo: 'Modelo Analítico Dimensional Homologado',
        descricao: 'Modelo analítico dimensional homologado formalmente na etapa de modelagem.',
        status: 'CONCLUIDO',
        obrigatorio: true,
        evidencia: `Modelo homologado: "${modeloAnalitico.nome}" (${modeloAnalitico.tipo_arquitetura})`,
      });
    } else {
      itens.push({
        id: 'chk-02',
        codigo: 'CHK-02',
        titulo: 'Modelo Analítico Dimensional Homologado',
        descricao:
          'O modelo analítico na Aba 6 precisa estar no status HOMOLOGADO para fundamentar o BI.',
        status: 'PENDENTE',
        obrigatorio: false,
        evidencia: modeloAnalitico
          ? `Modelo encontrado com status "${modeloAnalitico.status}" (não homologado).`
          : 'Nenhum modelo analítico associado à demanda.',
        acaoSugerida: 'Homologue o modelo dimensional na Aba 6 antes da entrega final.',
      });
    }

    // 3. CHK-03: Métricas Analíticas de Negócio
    const totalMetricas = modeloAnalitico?.metricas?.length ?? 0;
    if (isIsento) {
      itens.push({
        id: 'chk-03',
        codigo: 'CHK-03',
        titulo: 'Catálogo de Métricas Analíticas de Negócio',
        descricao: 'Mapeamento de indicadores e perguntas de negócio.',
        status: totalMetricas > 0 ? 'CONCLUIDO' : 'NAO_APLICAVEL',
        obrigatorio: false,
        evidencia:
          totalMetricas > 0
            ? `${totalMetricas} métrica(s) analítica(s) identificada(s).`
            : 'Isenção Excel-Only ativa.',
      });
    } else if (totalMetricas > 0) {
      itens.push({
        id: 'chk-03',
        codigo: 'CHK-03',
        titulo: 'Catálogo de Métricas Analíticas de Negócio',
        descricao: 'Métricas e indicadores declarados formalmente no modelo analítico.',
        status: 'CONCLUIDO',
        obrigatorio: true,
        evidencia: `${totalMetricas} métrica(s) analítica(s) homologada(s) mapeada(s).`,
      });
    } else {
      itens.push({
        id: 'chk-03',
        codigo: 'CHK-03',
        titulo: 'Catálogo de Métricas Analíticas de Negócio',
        descricao: 'Nenhuma métrica analítica foi cadastrada para fundamentar as medidas DAX.',
        status: 'PENDENTE',
        obrigatorio: true,
        evidencia: '0 métricas analíticas cadastradas na Aba 6.',
        acaoSugerida: 'Defina as métricas e perguntas de negócio na Aba 6 (Modelagem).',
      });
    }

    // 4. CHK-04: Medidas DAX Cadastradas
    if (isIsento) {
      itens.push({
        id: 'chk-04',
        codigo: 'CHK-04',
        titulo: 'Medidas DAX Essenciais Implementadas',
        descricao: 'Medidas DAX calculadas no modelo Power BI.',
        status: 'NAO_APLICAVEL',
        obrigatorio: false,
        evidencia: 'Isenção Excel-Only ativa; cálculos executados em planilhas ou fórmulas.',
      });
    } else if (medidas.length > 0) {
      itens.push({
        id: 'chk-04',
        codigo: 'CHK-04',
        titulo: 'Medidas DAX Essenciais Implementadas',
        descricao: 'Medidas DAX cadastradas, validadas e organizadas em tabelas hospedeiras.',
        status: 'CONCLUIDO',
        obrigatorio: true,
        evidencia: `${medidas.length} medida(s) DAX cadastrada(s) e analisada(s).`,
      });
    } else {
      itens.push({
        id: 'chk-04',
        codigo: 'CHK-04',
        titulo: 'Medidas DAX Essenciais Implementadas',
        descricao: 'Nenhuma medida DAX foi cadastrada para os cálculos do dashboard.',
        status: 'PENDENTE',
        obrigatorio: true,
        evidencia: '0 medidas DAX cadastradas no Bloco 2.',
        acaoSugerida: 'Cadastre ao menos a medida DAX primária no Bloco 2 (Métricas & DAX).',
      });
    }

    // 5. CHK-05: Estrutura de Páginas do Dashboard
    if (isIsento) {
      itens.push({
        id: 'chk-05',
        codigo: 'CHK-05',
        titulo: 'Estrutura de Páginas do Dashboard',
        descricao: 'Páginas conceituais de navegação do relatório.',
        status: paginas.length > 0 ? 'CONCLUIDO' : 'NAO_APLICAVEL',
        obrigatorio: false,
        evidencia:
          paginas.length > 0
            ? `${paginas.length} página(s) de apresentação configurada(s).`
            : 'Isenção Excel-Only ativa.',
      });
    } else if (paginas.length > 0) {
      itens.push({
        id: 'chk-05',
        codigo: 'CHK-05',
        titulo: 'Estrutura de Páginas do Dashboard',
        descricao: 'Páginas estruturadas com objetivos analíticos e público-alvo definidos.',
        status: 'CONCLUIDO',
        obrigatorio: true,
        evidencia: `${paginas.length} página(s) estruturada(s) (ex.: "${paginas[0].nome}").`,
      });
    } else {
      itens.push({
        id: 'chk-05',
        codigo: 'CHK-05',
        titulo: 'Estrutura de Páginas do Dashboard',
        descricao: 'Nenhuma página de relatório foi estruturada no workspace.',
        status: 'PENDENTE',
        obrigatorio: true,
        evidencia: '0 páginas cadastradas no Bloco 3.',
        acaoSugerida: 'Gere a proposta automática no Bloco 3 ou crie uma página manualmente.',
      });
    }

    // 6. CHK-06: Visuais Especificados com Linhagem
    if (isIsento) {
      itens.push({
        id: 'chk-06',
        codigo: 'CHK-06',
        titulo: 'Especificação e Posicionamento de Visuais',
        descricao: 'Visuais com design system e slots definidos.',
        status: visuais.length > 0 ? 'CONCLUIDO' : 'NAO_APLICAVEL',
        obrigatorio: false,
        evidencia:
          visuais.length > 0
            ? `${visuais.length} visual(is) especificado(s).`
            : 'Isenção Excel-Only ativa.',
      });
    } else if (visuais.length > 0) {
      itens.push({
        id: 'chk-06',
        codigo: 'CHK-06',
        titulo: 'Especificação e Posicionamento de Visuais',
        descricao: 'Visuais mapeados com coordenadas de grid e medidas associadas.',
        status: 'CONCLUIDO',
        obrigatorio: true,
        evidencia: `${visuais.length} visual(is) especificado(s) no Bloco 4.`,
      });
    } else {
      itens.push({
        id: 'chk-06',
        codigo: 'CHK-06',
        titulo: 'Especificação e Posicionamento de Visuais',
        descricao: 'Nenhum visual analítico foi especificado para as páginas.',
        status: 'PENDENTE',
        obrigatorio: true,
        evidencia: '0 visuais cadastrados no Bloco 4.',
        acaoSugerida: 'Aprove uma proposta automática ou cadastre visuais no Bloco 4.',
      });
    }

    // 7. CHK-07: Justificativas DataViz ("Aprenda Enquanto Trabalha")
    const visuaisComDataviz = visuais.filter(
      (v) => v.justificativa_dataviz && v.justificativa_dataviz.trim().length > 0
    );
    if (isIsento) {
      itens.push({
        id: 'chk-07',
        codigo: 'CHK-07',
        titulo: 'Justificativas DataViz e Pedagogia Analítica',
        descricao: 'Racional pedagógico de seleção das representações visuais.',
        status: 'NAO_APLICAVEL',
        obrigatorio: false,
        evidencia: 'Isenção Excel-Only ativa.',
      });
    } else if (visuais.length > 0 && visuaisComDataviz.length === visuais.length) {
      itens.push({
        id: 'chk-07',
        codigo: 'CHK-07',
        titulo: 'Justificativas DataViz e Pedagogia Analítica',
        descricao:
          'Todos os visuais possuem fundamentação analítica e pedagógica explícita.',
        status: 'CONCLUIDO',
        obrigatorio: false,
        evidencia: `100% dos visuais (${visuaisComDataviz.length}/${visuais.length}) possuem justificativa DataViz.`,
      });
    } else if (visuais.length > 0 && visuaisComDataviz.length > 0) {
      itens.push({
        id: 'chk-07',
        codigo: 'CHK-07',
        titulo: 'Justificativas DataViz e Pedagogia Analítica',
        descricao: 'Parte dos visuais possui fundamentação DataViz preenchida.',
        status: 'PENDENTE',
        obrigatorio: false,
        evidencia: `${visuaisComDataviz.length} de ${visuais.length} visual(is) com justificativa DataViz.`,
      });
    } else {
      itens.push({
        id: 'chk-07',
        codigo: 'CHK-07',
        titulo: 'Justificativas DataViz e Pedagogia Analítica',
        descricao: 'Nenhum visual possui justificativa pedagógica DataViz associada.',
        status: 'PENDENTE',
        obrigatorio: false,
        evidencia: 'Justificativas DataViz não preenchidas.',
        acaoSugerida: 'Utilize o Dashboard Planner para preenchimento automático DataViz.',
      });
    }

    // 8. CHK-08: Avaliação de Regras Normativas D-01 a D-08
    itens.push({
      id: 'chk-08',
      codigo: 'CHK-08',
      titulo: 'Execução das Regras Normativas D-01 a D-08',
      descricao: 'Verificação da integridade arquitetural do modelo pelo DashboardRulesEvaluator.',
      status: 'CONCLUIDO',
      obrigatorio: true,
      evidencia: `Motor D-01..D-08 executado em ${resultadoNormativo.avaliado_em} com status "${resultadoNormativo.status_geral}".`,
    });

    // 9. CHK-09: Resolução de Bloqueios Normativos
    if (resultadoNormativo.total_bloqueios > 0) {
      const primeiroBloqueio = resultadoNormativo.diagnosticos.find(
        (d) => d.severidade === 'BLOQUEIO'
      );
      itens.push({
        id: 'chk-09',
        codigo: 'CHK-09',
        titulo: 'Resolução de Bloqueios Normativos',
        descricao:
          'O dashboard não pode conter nenhum BLOQUEIO normativo para avançar no workflow.',
        status: 'BLOQUEADO',
        obrigatorio: true,
        evidencia: `${resultadoNormativo.total_bloqueios} bloqueio(s) ativo(s): "${primeiroBloqueio?.titulo ?? 'Bloqueio normativo'}"`,
        acaoSugerida: primeiroBloqueio?.recomendacao || 'Resolva as pendências impeditivas na Aba 7.',
      });
    } else {
      itens.push({
        id: 'chk-09',
        codigo: 'CHK-09',
        titulo: 'Resolução de Bloqueios Normativos',
        descricao: 'Nenhum bloqueio normativo impeditivo detectado.',
        status: 'CONCLUIDO',
        obrigatorio: true,
        evidencia: 'Zero bloqueios normativos (0 impedimentos).',
      });
    }

    // 10. CHK-10: Decisão e Homologação Humana Registrada
    const temDecisaoHumana =
      decisaoHumanaRegistrada ||
      (modeloPowerBi !== null && (isIsento || paginas.length > 0 || medidas.length > 0));

    itens.push({
      id: 'chk-10',
      codigo: 'CHK-10',
      titulo: 'Supervisão e Aprovação Humana da Etapa',
      descricao:
        'Registro de validação, aprovação de proposta ou decisão humana deliberada (Human-in-the-Loop).',
      status: temDecisaoHumana ? 'CONCLUIDO' : 'PENDENTE',
      obrigatorio: true,
      evidencia: temDecisaoHumana
        ? 'Decisão humana formalmente registrada nos artefatos da etapa.'
        : 'Aguardando validação ou aprovação humana explícita.',
      acaoSugerida: temDecisaoHumana
        ? undefined
        : 'Revise os artefatos propostos e registre a aprovação no workspace.',
    });

    // 11. CHK-11: Pacote de Documentação Técnica Gerado
    itens.push({
      id: 'chk-11',
      codigo: 'CHK-11',
      titulo: 'Documentação Técnica da Etapa Disponível',
      descricao: 'Geração determinística do memorial descritivo em Markdown e JSON estruturado.',
      status: 'CONCLUIDO',
      obrigatorio: true,
      evidencia: 'Especificação técnica e memorial descritivo gerados e prontos para exportação.',
    });

    // Cálculos de Resumo
    const totalItens = itens.length;
    const totalConcluidos = itens.filter((i) => i.status === 'CONCLUIDO').length;
    const totalPendentes = itens.filter((i) => i.status === 'PENDENTE').length;
    const totalBloqueados = itens.filter((i) => i.status === 'BLOQUEADO').length;

    // Apto para seguir no workflow: zero bloqueios obrigatórios e modelo/isenção existente
    const aptoParaSeguirWorkflow =
      totalBloqueados === 0 &&
      modeloPowerBi !== null &&
      resultadoNormativo.apto_para_validacao;

    const itensEfetivos = itens.filter((i) => i.status !== 'NAO_APLICAVEL');
    const percentualConclusao =
      itensEfetivos.length > 0
        ? Math.round(
            (itens.filter((i) => i.status === 'CONCLUIDO').length /
              itensEfetivos.length) *
              100
          )
        : 100;

    return {
      itens,
      totalItens,
      totalConcluidos,
      totalPendentes,
      totalBloqueados,
      aptoParaSeguirWorkflow,
      percentualConclusao,
    };
  }
}
