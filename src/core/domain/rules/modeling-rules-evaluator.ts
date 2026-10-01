import { ModeloAnaliticoCompleto } from "@/core/domain/entities/modelo-analitico";
import { EntidadeAnalitica } from "@/core/domain/entities/entidade-analitica";
import { DatasetAutorizadoAnalise } from "@/core/domain/entities/dataset-autorizado-analise";
import { StatusAutorizacaoDataset } from "@/core/domain/enums/status-autorizacao-dataset";
import { TipoArquiteturaModelo } from "@/core/domain/enums/tipo-arquitetura-modelo";
import { TipoEntidadeAnalitica } from "@/core/domain/enums/tipo-entidade-analitica";
import { PapelEntidadeAnalitica } from "@/core/domain/enums/papel-entidade-analitica";
import { PapelAtributoAnalitico } from "@/core/domain/enums/papel-atributo-analitico";
import { TipoDadoAnalitico } from "@/core/domain/enums/tipo-dado-analitico";
import { CardinalidadeRelacionamento } from "@/core/domain/enums/cardinalidade-relacionamento";
import { DirecaoFiltroRelacionamento } from "@/core/domain/enums/direcao-filtro-relacionamento";
import { TipoAgregacaoMetrica } from "@/core/domain/enums/tipo-agregacao-metrica";
import { TipoAditividadeMetrica } from "@/core/domain/enums/tipo-aditividade-metrica";
import { UnidadeMedidaMetrica } from "@/core/domain/enums/unidade-medida-metrica";

export type SeveridadeRegraModelagem = "BLOQUEIO" | "ALERTA_CRITICO" | "RECOMENDACAO";

export interface DiagnosticoRegraModelagem {
  codigo_regra: "M-01" | "M-02" | "M-03" | "M-04" | "M-05" | "M-06" | "M-07" | "M-08" | "M-09" | "M-10" | "M-11";
  severidade: SeveridadeRegraModelagem;
  titulo: string;
  deteccao: string;
  explicacao: string;
  recomendacao: string;
  acao_humana_necessaria: string;
  evidencia: string;
  entidade_relacionada_id?: string;
  metrica_relacionada_id?: string;
  relacionamento_relacionado_id?: string;
}

export interface ResultadoAvaliacaoConformidade {
  modelo_id: string;
  status_geral: SeveridadeRegraModelagem | "CONFORME";
  apto_homologacao: boolean;
  total_bloqueios: number;
  total_alertas_criticos: number;
  total_recomendacoes: number;
  diagnosticos: DiagnosticoRegraModelagem[];
  avaliado_em: string;
}

export class ModelingRulesEvaluator {
  public static avaliar(
    modelo: ModeloAnaliticoCompleto,
    datasetAutorizado: DatasetAutorizadoAnalise | null
  ): ResultadoAvaliacaoConformidade {
    const diagnosticos: DiagnosticoRegraModelagem[] = [];

    // M-01 — Dataset autorizado vigente (BLOQUEIO)
    this.avaliarM01(modelo, datasetAutorizado, diagnosticos);

    // M-02 — Grão central declarado (BLOQUEIO)
    this.avaliarM02(modelo, diagnosticos);

    // M-03 — Identificador da entidade (BLOQUEIO)
    this.avaliarM03(modelo, diagnosticos);

    // M-04 — Consistência matemática de aditividade (BLOQUEIO)
    this.avaliarM04(modelo, diagnosticos);

    // M-05 — Critérios mínimos para conclusão (BLOQUEIO)
    this.avaliarM05(modelo, diagnosticos);

    // M-06 — Relacionamento N:M (ALERTA_CRITICO)
    this.avaliarM06(modelo, diagnosticos);

    // M-07 — Filtro bidirecional (ALERTA_CRITICO)
    this.avaliarM07(modelo, diagnosticos);

    // M-08 — Calendário contextual (RECOMENDACAO)
    this.avaliarM08(modelo, diagnosticos);

    // M-09 — Base de reconciliação (RECOMENDACAO)
    this.avaliarM09(modelo, diagnosticos);

    // M-10 — Descrição semântica (RECOMENDACAO)
    this.avaliarM10(modelo, diagnosticos);

    // M-11 — Integridade de conectividade dimensional (ALERTA_CRITICO)
    this.avaliarM11(modelo, diagnosticos);

    const totalBloqueios = diagnosticos.filter((d) => d.severidade === "BLOQUEIO").length;
    const totalAlertas = diagnosticos.filter((d) => d.severidade === "ALERTA_CRITICO").length;
    const totalRecomendacoes = diagnosticos.filter((d) => d.severidade === "RECOMENDACAO").length;

    let statusGeral: SeveridadeRegraModelagem | "CONFORME" = "CONFORME";
    if (totalBloqueios > 0) {
      statusGeral = "BLOQUEIO";
    } else if (totalAlertas > 0) {
      statusGeral = "ALERTA_CRITICO";
    } else if (totalRecomendacoes > 0) {
      statusGeral = "RECOMENDACAO";
    }

    return {
      modelo_id: modelo.id,
      status_geral: statusGeral,
      apto_homologacao: totalBloqueios === 0,
      total_bloqueios: totalBloqueios,
      total_alertas_criticos: totalAlertas,
      total_recomendacoes: totalRecomendacoes,
      diagnosticos,
      avaliado_em: new Date().toISOString(),
    };
  }

  private static avaliarM01(
    modelo: ModeloAnaliticoCompleto,
    dataset: DatasetAutorizadoAnalise | null,
    diagnosticos: DiagnosticoRegraModelagem[]
  ): void {
    if (!dataset || dataset.status !== StatusAutorizacaoDataset.VIGENTE) {
      diagnosticos.push({
        codigo_regra: "M-01",
        severidade: "BLOQUEIO",
        titulo: "Dataset Autorizado Ausente ou Não Vigente",
        deteccao: `O dataset vinculado "${modelo.dataset_autorizado_id}" não está ativo ou não foi localizado. Status atual: ${dataset?.status ?? "INEXISTENTE"}.`,
        explicacao: "A modelagem analítica exige obrigatoriamente um conjunto de dados formalmente preparado, auditado e com autorização vigente.",
        recomendacao: "Homologue previamente o dataset na etapa de Preparação ou atualize o vínculo para uma autorização vigente.",
        acao_humana_necessaria: "Vincular um DatasetAutorizadoAnalise com status VIGENTE antes de prosseguir com o modelo.",
        evidencia: `dataset_autorizado_id: ${modelo.dataset_autorizado_id}, status: ${dataset?.status ?? "NULL"}`,
      });
    } else if (dataset.demanda_id !== modelo.demanda_id) {
      diagnosticos.push({
        codigo_regra: "M-01",
        severidade: "BLOQUEIO",
        titulo: "Dataset Pertence a Demanda Divergente",
        deteccao: `O dataset vinculado pertence à demanda "${dataset.demanda_id}", divergente da demanda do modelo "${modelo.demanda_id}".`,
        explicacao: "É estritamente proibido o cruzamento não governado de dados entre demandas distintas.",
        recomendacao: "Vincule exclusivamente datasets autorizados pertencentes à mesma demanda do modelo.",
        acao_humana_necessaria: "Corrigir a vinculação do modelo para o dataset da demanda correta.",
        evidencia: `modelo.demanda_id: ${modelo.demanda_id}, dataset.demanda_id: ${dataset.demanda_id}`,
      });
    }
  }

  private static avaliarM02(
    modelo: ModeloAnaliticoCompleto,
    diagnosticos: DiagnosticoRegraModelagem[]
  ): void {
    const fatos = modelo.entidades.filter((e) => e.tipo === TipoEntidadeAnalitica.FATO);
    const graoModeloDeclarado = Boolean(modelo.descricao && modelo.descricao.trim().length >= 5);

    if (!graoModeloDeclarado && fatos.length === 0) {
      diagnosticos.push({
        codigo_regra: "M-02",
        severidade: "BLOQUEIO",
        titulo: "Grão Central Não Declarado no Modelo",
        deteccao: "O modelo analítico não possui declaração semântica de grão ou descrição substantiva.",
        explicacao: "Sem a definição explícita do que cada registro representa, cálculos de agregação e métricas tornam-se imprevisíveis.",
        recomendacao: "Descreva expressamente a granularidade analítica do modelo (ex: 'Uma linha por transação de venda').",
        acao_humana_necessaria: "Atualizar a descrição do modelo analítico especificando o grão central de análise.",
        evidencia: `modelo.descricao: "${modelo.descricao ?? ""}"`,
      });
      return;
    }

    // Se houver Fatos, cada uma deve ter seu grão/descrição definido
    for (const fato of fatos) {
      const graoFatoDeclarado = Boolean(fato.descricao && fato.descricao.trim().length >= 5);
      if (!graoFatoDeclarado && !graoModeloDeclarado) {
        diagnosticos.push({
          codigo_regra: "M-02",
          severidade: "BLOQUEIO",
          titulo: `Grão da Fato "${fato.nome}" Não Declarado`,
          deteccao: `A entidade fato "${fato.nome}" não possui descrição de granularidade declarada.`,
          explicacao: "Tabelas fato devem registrar expressamente o nível de detalhe de seus eventos ou transações.",
          recomendacao: "Preencha a descrição da entidade fato informando o que uma linha representa.",
          acao_humana_necessaria: `Configurar a descrição do grão da entidade "${fato.nome}".`,
          evidencia: `entidade_id: ${fato.id}, fato.descricao: "${fato.descricao ?? ""}"`,
          entidade_relacionada_id: fato.id,
        });
      }
    }
  }

  private static avaliarM03(
    modelo: ModeloAnaliticoCompleto,
    diagnosticos: DiagnosticoRegraModelagem[]
  ): void {
    for (const entidade of modelo.entidades) {
      // Entidade deve possuir ao menos 1 atributo de chave primária ou identificador
      const temChavePrimaria = entidade.atributos.some(
        (a) => a.papel === PapelAtributoAnalitico.CHAVE_PRIMARIA
      );

      if (!temChavePrimaria) {
        diagnosticos.push({
          codigo_regra: "M-03",
          severidade: "BLOQUEIO",
          titulo: `Entidade "${entidade.nome}" Sem Identificador Declarado`,
          deteccao: `A entidade "${entidade.nome}" não possui nenhum atributo configurado com papel de CHAVE_PRIMARIA.`,
          explicacao: "Toda entidade analítica (fato ou dimensão) necessita de chave de identificação primária ou de negócio para integridade referencial.",
          recomendacao: "Atribua o papel CHAVE_PRIMARIA ao atributo identificador da entidade.",
          acao_humana_necessaria: `Configurar um atributo identificador como CHAVE_PRIMARIA na entidade "${entidade.nome}".`,
          evidencia: `entidade_id: ${entidade.id}, total_atributos: ${entidade.atributos.length}`,
          entidade_relacionada_id: entidade.id,
        });
      }
    }
  }

  private static avaliarM04(
    modelo: ModeloAnaliticoCompleto,
    diagnosticos: DiagnosticoRegraModelagem[]
  ): void {
    for (const metrica of modelo.metricas) {
      const ehPercentualOuRazao =
        metrica.unidade_medida === UnidadeMedidaMetrica.PERCENTUAL ||
        metrica.unidade_medida === UnidadeMedidaMetrica.INDICE ||
        metrica.tipo_agregacao === TipoAgregacaoMetrica.MEDIA ||
        metrica.formula_declarativa.includes("/");

      const ehDeclaradaTotalmenteAditivaComSoma =
        metrica.tipo_aditividade === TipoAditividadeMetrica.TOTALMENTE_ADITIVA &&
        (metrica.tipo_agregacao === TipoAgregacaoMetrica.SOMA || metrica.formula_declarativa.toUpperCase().includes("SUM"));

      if (ehPercentualOuRazao && ehDeclaradaTotalmenteAditivaComSoma) {
        diagnosticos.push({
          codigo_regra: "M-04",
          severidade: "BLOQUEIO",
          titulo: `Inconsistência Matemática na Métrica "${metrica.nome}"`,
          deteccao: `A métrica "${metrica.nome}" é percentual/razão/média mas foi configurada como TOTALMENTE_ADITIVA com agregação por soma.`,
          explicacao: "Métricas percentuais, médias e razões produzem distorções graves e valores matematicamente inválidos se somadas diretamente.",
          recomendacao: "Classifique a métrica como NAO_ADITIVA e utilize agregação apropriada ou cálculo ponderado composto.",
          acao_humana_necessaria: `Ajustar tipo_aditividade para NAO_ADITIVA na métrica "${metrica.nome}".`,
          evidencia: `metrica_id: ${metrica.id}, unidade: ${metrica.unidade_medida}, aditividade: ${metrica.tipo_aditividade}, agregacao: ${metrica.tipo_agregacao}`,
          metrica_relacionada_id: metrica.id,
        });
      }
    }
  }

  private static avaliarM05(
    modelo: ModeloAnaliticoCompleto,
    diagnosticos: DiagnosticoRegraModelagem[]
  ): void {
    const fatos = modelo.entidades.filter((e) => e.tipo === TipoEntidadeAnalitica.FATO);
    if (fatos.length === 0) {
      diagnosticos.push({
        codigo_regra: "M-05",
        severidade: "BLOQUEIO",
        titulo: "Modelo Sem Nenhuma Entidade Fato",
        deteccao: "O modelo analítico não possui nenhuma entidade classificada como FATO.",
        explicacao: "Um modelo dimensional requer ao menos uma tabela Fato para ancorar medições e métricas do negócio.",
        recomendacao: "Adicione ou classifique uma entidade como FATO.",
        acao_humana_necessaria: "Criar ao menos uma entidade FATO no modelo analítico.",
        evidencia: `total_entidades: ${modelo.entidades.length}, fatos: 0`,
      });
    }

    if (modelo.metricas.length === 0) {
      diagnosticos.push({
        codigo_regra: "M-05",
        severidade: "BLOQUEIO",
        titulo: "Modelo Sem Nenhuma Métrica Cadastrada",
        deteccao: "O modelo analítico não possui nenhuma métrica analítica cadastrada.",
        explicacao: "Para sustentação de análises e relatórios, o modelo precisa declarar seus indicadores de negócio.",
        recomendacao: "Cadastre ao menos uma métrica semântica no modelo analítico.",
        acao_humana_necessaria: "Cadastrar as métricas principais do modelo analítico.",
        evidencia: `total_metricas: 0`,
      });
    }
  }

  private static avaliarM06(
    modelo: ModeloAnaliticoCompleto,
    diagnosticos: DiagnosticoRegraModelagem[]
  ): void {
    for (const rel of modelo.relacionamentos) {
      if (rel.tipo_relacionamento === CardinalidadeRelacionamento.MUITOS_PARA_MUITOS) {
        diagnosticos.push({
          codigo_regra: "M-06",
          severidade: "ALERTA_CRITICO",
          titulo: "Relacionamento Muitos-para-Muitos (N:M)",
          deteccao: `O relacionamento entre entidades "${rel.entidade_origem_id}" e "${rel.entidade_destino_id}" possui cardinalidade N:M.`,
          explicacao: "Relacionamentos N:M podem gerar duplicação inadvertida de linhas em agregações, ambiguidade de granularidade e perda de performance.",
          recomendacao: "Se indispensável, registre a justificativa técnica. Onde aplicável, utilize uma tabela ponte ou dimensão conformada intermediária.",
          acao_humana_necessaria: rel.justificativa
            ? "Revisar a justificativa técnica do relacionamento N:M durante a homologação."
            : "Registrar formalmente a justificativa técnica para o relacionamento N:M.",
          evidencia: `relacionamento_id: ${rel.id}, tipo: ${rel.tipo_relacionamento}, justificativa: "${rel.justificativa ?? ""}"`,
          relacionamento_relacionado_id: rel.id,
        });
      }
    }
  }

  private static avaliarM07(
    modelo: ModeloAnaliticoCompleto,
    diagnosticos: DiagnosticoRegraModelagem[]
  ): void {
    for (const rel of modelo.relacionamentos) {
      if (rel.direcao_filtro === DirecaoFiltroRelacionamento.BIDIRECIONAL) {
        diagnosticos.push({
          codigo_regra: "M-07",
          severidade: "ALERTA_CRITICO",
          titulo: "Filtro Bidirecional Configurado",
          deteccao: `O relacionamento "${rel.id}" está configurado com propagação de filtro BIDIRECIONAL.`,
          explicacao: "Filtros bidirecionais podem introduzir caminhos circulares de filtragem, ambiguidades contextuais e degradação de processamento.",
          recomendacao: "Avalie se a propagação unidirecional tradicional atende à análise. Se bidirecional for indispensável, documente a justificativa.",
          acao_humana_necessaria: rel.justificativa
            ? "Revisar a necessidade técnica do filtro bidirecional na homologação."
            : "Registrar justificativa formal explicitando por que o filtro cruzado bidirecional é necessário.",
          evidencia: `relacionamento_id: ${rel.id}, direcao_filtro: ${rel.direcao_filtro}, justificativa: "${rel.justificativa ?? ""}"`,
          relacionamento_relacionado_id: rel.id,
        });
      }
    }
  }

  private static avaliarM08(
    modelo: ModeloAnaliticoCompleto,
    diagnosticos: DiagnosticoRegraModelagem[]
  ): void {
    const fatos = modelo.entidades.filter((e) => e.tipo === TipoEntidadeAnalitica.FATO);
    let temAtributoTemporal = false;

    for (const fato of fatos) {
      const temTemporal = fato.atributos.some(
        (a) =>
          a.tipo_dado === TipoDadoAnalitico.DATA ||
          a.tipo_dado === TipoDadoAnalitico.DATA_HORA ||
          a.papel === PapelAtributoAnalitico.DIMENSAO_TEMPO
      );
      if (temTemporal) {
        temAtributoTemporal = true;
        break;
      }
    }

    if (temAtributoTemporal) {
      const temCalendario = modelo.entidades.some(
        (e) =>
          e.papel === PapelEntidadeAnalitica.DIMENSAO_CALENDARIO ||
          e.nome.toLowerCase().includes("calendario") ||
          e.nome.toLowerCase().includes("calendar") ||
          e.nome.toLowerCase().includes("tempo")
      );

      if (!temCalendario) {
        diagnosticos.push({
          codigo_regra: "M-08",
          severidade: "RECOMENDACAO",
          titulo: "Ausência de Dimensão Calendário Dedicada",
          deteccao: "Existem atributos temporais (DATA/DATA_HORA) na Fato mas nenhuma dimensão calendário dedicada foi especificada no modelo.",
          explicacao: "Uma dimensão de calendário dedicada padroniza agregações cronológicas (ano, mês, trimestre, dia útil) e viabiliza inteligência temporal sem duplicar cálculos.",
          recomendacao: "Especifique uma dimensão calendário declarativa para ancorar a análise temporal.",
          acao_humana_necessaria: "Avaliar a adição de uma entidade de dimensão calendário ao modelo.",
          evidencia: `temAtributoTemporal: true, entidades_calendario: 0`,
        });
      }
    }
  }

  private static avaliarM09(
    modelo: ModeloAnaliticoCompleto,
    diagnosticos: DiagnosticoRegraModelagem[]
  ): void {
    for (const metrica of modelo.metricas) {
      // Verifica se a métrica possui documentação de reconciliação ou base de conferência em sua descrição
      const temReconciliacao =
        Boolean(metrica.descricao) &&
        (metrica.descricao!.toLowerCase().includes("reconcili") ||
          metrica.descricao!.toLowerCase().includes("conferência") ||
          metrica.descricao!.toLowerCase().includes("erp") ||
          metrica.descricao!.toLowerCase().includes("origem") ||
          metrica.descricao!.toLowerCase().includes("fonte"));

      if (!temReconciliacao) {
        diagnosticos.push({
          codigo_regra: "M-09",
          severidade: "RECOMENDACAO",
          titulo: `Métrica "${metrica.nome}" Sem Base de Reconciliação Declarada`,
          deteccao: `A métrica "${metrica.nome}" não referencia explicitamente sua fonte de reconciliação contábil/operacional na documentação.`,
          explicacao: "Declarar a base de reconciliação permite que o analista audite divergências contra relatórios oficiais do sistema transacional.",
          recomendacao: "Documente na descrição da métrica a base ou sistema de referência para batimento e conferência.",
          acao_humana_necessaria: `Descrever a base de reconciliação na documentação da métrica "${metrica.nome}".`,
          evidencia: `metrica_id: ${metrica.id}, descricao: "${metrica.descricao ?? ""}"`,
          metrica_relacionada_id: metrica.id,
        });
      }
    }
  }

  private static avaliarM10(
    modelo: ModeloAnaliticoCompleto,
    diagnosticos: DiagnosticoRegraModelagem[]
  ): void {
    for (const entidade of modelo.entidades) {
      for (const atr of entidade.atributos) {
        // Atributos não ocultos devem ter descrição semântica clara
        if (!atr.oculto && (!atr.descricao || atr.descricao.trim().length < 5)) {
          diagnosticos.push({
            codigo_regra: "M-10",
            severidade: "RECOMENDACAO",
            titulo: `Atributo "${atr.nome_amigavel}" Sem Descrição Semântica`,
            deteccao: `O atributo visível "${atr.nome_amigavel}" (${entidade.nome}.${atr.nome_original}) não possui descrição negocial substantiva.`,
            explicacao: "Descrições amigáveis enriquecem o dicionário semântico e evitam interpretações ambíguas dos dados pelo analista e por assistentes de IA.",
            recomendacao: "Forneça uma descrição clara e objetiva do significado do atributo para o negócio.",
            acao_humana_necessaria: `Adicionar descrição de negócio para o atributo "${atr.nome_amigavel}".`,
            evidencia: `entidade: "${entidade.nome}", atributo: "${atr.nome_original}", descricao: "${atr.descricao ?? ""}"`,
            entidade_relacionada_id: entidade.id,
          });
        }
      }
    }
  }

  private static avaliarM11(
    modelo: ModeloAnaliticoCompleto,
    diagnosticos: DiagnosticoRegraModelagem[]
  ): void {
    // 1. Se a arquitetura for TABELA_UNICA, não há exigência de relacionamentos nem dimensões
    if (modelo.tipo_arquitetura === TipoArquiteturaModelo.TABELA_UNICA) {
      return;
    }

    // 2. Extrair entidades Fato e Dimensões
    const fatos = modelo.entidades.filter((e) => e.tipo === TipoEntidadeAnalitica.FATO);
    const dimensoes = modelo.entidades.filter((e) => e.tipo === TipoEntidadeAnalitica.DIMENSAO);

    // Se não há dimensões no modelo, não há dimensões órfãs a reportar
    if (dimensoes.length === 0) {
      return;
    }

    const fatoIds = new Set(fatos.map((f) => f.id));
    const relacionamentosAtivos = (modelo.relacionamentos ?? []).filter((r) => r.ativo !== false);

    // Se não há nenhuma Fato cadastrada, dimensões não possuem onde se ancorar
    if (fatoIds.size === 0) {
      for (const dim of dimensoes) {
        diagnosticos.push(this.criarDiagnosticoM11(modelo, dim));
      }
      return;
    }

    // 3. Validação topológica conforme a arquitetura declarada
    if (modelo.tipo_arquitetura === TipoArquiteturaModelo.SNOWFLAKE) {
      // SNOWFLAKE: Permite conectividade indireta via caminho relacional até uma Fato.
      // Construir grafo não-direcionado de relacionamentos ativos entre entidades.
      const adjacencias = new Map<string, Set<string>>();

      for (const ent of modelo.entidades) {
        adjacencias.set(ent.id, new Set<string>());
      }

      for (const rel of relacionamentosAtivos) {
        if (adjacencias.has(rel.entidade_origem_id) && adjacencias.has(rel.entidade_destino_id)) {
          adjacencias.get(rel.entidade_origem_id)!.add(rel.entidade_destino_id);
          adjacencias.get(rel.entidade_destino_id)!.add(rel.entidade_origem_id);
        }
      }

      // BFS para encontrar todas as entidades alcançáveis a partir de qualquer Fato
      const alcancaveis = new Set<string>();
      const fila: string[] = [];

      for (const fatoId of fatoIds) {
        alcancaveis.add(fatoId);
        fila.push(fatoId);
      }

      while (fila.length > 0) {
        const atual = fila.shift()!;
        const vizinhos = adjacencias.get(atual);
        if (vizinhos) {
          for (const vizinho of vizinhos) {
            if (!alcancaveis.has(vizinho)) {
              alcancaveis.add(vizinho);
              fila.push(vizinho);
            }
          }
        }
      }

      // Dimensões que não alcançam nenhuma Fato são consideradas órfãs
      for (const dim of dimensoes) {
        if (!alcancaveis.has(dim.id)) {
          diagnosticos.push(this.criarDiagnosticoM11(modelo, dim, true));
        }
      }
    } else {
      // ESTRELA (ou fallback padrão): Cada dimensão deve possuir relacionamento ativo direto com ao menos uma entidade FATO
      for (const dim of dimensoes) {
        const conectadaDiretamenteAFato = relacionamentosAtivos.some(
          (r) =>
            (r.entidade_origem_id === dim.id && fatoIds.has(r.entidade_destino_id)) ||
            (r.entidade_destino_id === dim.id && fatoIds.has(r.entidade_origem_id))
        );

        if (!conectadaDiretamenteAFato) {
          diagnosticos.push(this.criarDiagnosticoM11(modelo, dim, false));
        }
      }
    }
  }

  private static criarDiagnosticoM11(
    modelo: ModeloAnaliticoCompleto,
    dimensao: EntidadeAnalitica,
    ehSnowflake: boolean = false
  ): DiagnosticoRegraModelagem {
    const detalheConectividade = ehSnowflake
      ? `caminho relacional até uma entidade Fato no esquema SNOWFLAKE`
      : `relacionamento direto ativo com uma entidade Fato no esquema ESTRELA`;

    return {
      codigo_regra: "M-11",
      severidade: "ALERTA_CRITICO",
      titulo: `Dimensão "${dimensao.nome}" Sem Conectividade com Fato`,
      deteccao: `A dimensão analítica "${dimensao.nome}" não possui ${detalheConectividade}.`,
      explicacao:
        "Em modelos dimensionais, dimensões desconectadas da estrutura de Fatos não propagam filtros analíticos nem segmentam métricas, podendo gerar produtos cartesianos ou agregações incorretas. Tabelas desconectadas deliberadas (ex: parâmetros What-If) exigem justificativa formal na homologação.",
      recomendacao:
        `Conecte a dimensão "${dimensao.nome}" à tabela Fato por meio de chaves primárias e estrangeiras, ou registre justificativa técnica formal se for uma tabela deliberadamente desconectada.`,
      acao_humana_necessaria:
        `Criar relacionamento válido para a dimensão "${dimensao.nome}" ou registrar justificativa técnica formal de exceção na homologação.`,
      evidencia: `arquitetura: ${modelo.tipo_arquitetura}, dimensao_orfa_id: "${dimensao.id}", dimensao_nome: "${dimensao.nome}", papel: ${dimensao.papel}`,
      entidade_relacionada_id: dimensao.id,
    };
  }
}
