import { describe, it, expect } from 'vitest';
import {
  resolveCopilotMessages,
  CopilotContext,
} from '@/core/use-cases/copilot';
import { StatusAutorizacaoDataset } from '@/core/domain/enums/status-autorizacao-dataset';
import { StatusModeloAnalitico } from '@/core/domain/enums/status-modelo-analitico';
import { TipoArquiteturaModelo } from '@/core/domain/enums/tipo-arquitetura-modelo';
import { TipoEntidadeAnalitica } from '@/core/domain/enums/tipo-entidade-analitica';
import { PapelEntidadeAnalitica } from '@/core/domain/enums/papel-entidade-analitica';
import { TipoOrigemEntidade } from '@/core/domain/enums/tipo-origem-entidade';
import { TipoAgregacaoMetrica } from '@/core/domain/enums/tipo-agregacao-metrica';
import { TipoAditividadeMetrica } from '@/core/domain/enums/tipo-aditividade-metrica';
import { UnidadeMedidaMetrica } from '@/core/domain/enums/unidade-medida-metrica';
import { StatusMetricaAnalitica } from '@/core/domain/enums/status-metrica-analitica';
import { ModeloAnaliticoCompleto } from '@/core/domain/entities/modelo-analitico';
import { DatasetAutorizadoAnalise } from '@/core/domain/entities/dataset-autorizado-analise';
import { ProntidaoModeloOutput } from '@/core/use-cases/modeling';

describe('CopilotMessageResolver — Núcleo Determinístico do Copiloto', () => {
  // Helper para criar mock de dataset autorizado vigente
  const criarDatasetMock = (
    status = StatusAutorizacaoDataset.VIGENTE
  ): DatasetAutorizadoAnalise => ({
    id: 'ds-01',
    demanda_id: 'dem-01',
    ativo_dados_id: 'ativo-01',
    diagnostico_qualidade_id: 'diag-01',
    receita_preparacao_id: 'rec-01',
    versao_rotulo: 'v1.0-autorizada',
    hash_sha256_snapshot: 'sha256-mock-hash-1234567890abcdef',
    status,
    justificativa_autorizacao: 'Dataset auditado e com integridade confirmada.',
    autorizado_por_tipo: 'HUMANO',
    restricoes_aceitas_snapshot: '[]',
    autorizado_em: '2026-03-30T10:00:00.000Z',
    revogado_em: null,
    motivo_revogacao: null,
  });

  // Helper para criar mock de modelo analítico básico
  const criarModeloMock = (
    overrides?: Partial<ModeloAnaliticoCompleto>
  ): ModeloAnaliticoCompleto => ({
    id: 'mod-01',
    demanda_id: 'dem-01',
    dataset_autorizado_id: 'ds-01',
    nome: 'Modelo Vendas Mensais',
    descricao: 'Modelo de vendas do primeiro trimestre',
    tipo_arquitetura: TipoArquiteturaModelo.ESTRELA,
    status: StatusModeloAnalitico.RASCUNHO,
    homologado_por: null,
    homologado_em: null,
    justificativa_homologacao: null,
    revogado_em: null,
    motivo_revogacao: null,
    criado_em: '2026-03-30T10:30:00.000Z',
    atualizado_em: '2026-03-30T10:30:00.000Z',
    entidades: [
      {
        id: 'ent-fato-01',
        modelo_id: 'mod-01',
        ativo_dados_id: 'ativo-01',
        nome: 'FatoVendas',
        tipo: TipoEntidadeAnalitica.FATO,
        papel: PapelEntidadeAnalitica.FATO_TRANSACIONAL,
        origem_tipo: TipoOrigemEntidade.DATASET_AUTORIZADO,
        descricao: 'Eventos de vendas realizadas',
        ordem_apresentacao: 1,
        criado_em: '2026-03-30T10:30:00.000Z',
        atualizado_em: '2026-03-30T10:30:00.000Z',
        atributos: [],
      },
    ],
    relacionamentos: [],
    metricas: [
      {
        id: 'met-01',
        modelo_id: 'mod-01',
        entidade_id: 'ent-fato-01',
        nome: 'Receita Total',
        descricao: 'Soma dos valores transacionados',
        tipo_agregacao: TipoAgregacaoMetrica.SOMA,
        tipo_aditividade: TipoAditividadeMetrica.TOTALMENTE_ADITIVA,
        formula_declarativa: 'SUM(valor)',
        unidade_medida: UnidadeMedidaMetrica.MOEDA,
        formato_exibicao: 'R$ #,##0.00',
        status: StatusMetricaAnalitica.HOMOLOGADA,
        atributos_dependentes_ids: [],
        metricas_dependentes_ids: [],
        pergunta_negocio_associada: 'Qual a receita total?',
        objetivo_negocio_associado: 'Monitorar faturamento',
        ordem: 1,
        criado_em: '2026-03-30T10:35:00.000Z',
        atualizado_em: '2026-03-30T10:35:00.000Z',
      },
    ],
    ...overrides,
  });

  // Helper para criar mock de prontidão
  const criarProntidaoMock = (
    overrides?: Partial<ProntidaoModeloOutput>
  ): ProntidaoModeloOutput => ({
    modeloId: 'mod-01',
    demandaId: 'dem-01',
    statusModelo: StatusModeloAnalitico.RASCUNHO,
    prontoParaHomologacao: true,
    homologacaoVigenteValida: false,
    motivosBloqueio: [],
    alertasCriticosQueExigemJustificativa: [],
    recomendacoes: [],
    temAlteracaoPosteriorAHomologacao: false,
    detalhesConformidade: {
      modelo_id: 'mod-01',
      status_geral: 'CONFORME',
      apto_homologacao: true,
      total_bloqueios: 0,
      total_alertas_criticos: 0,
      total_recomendacoes: 0,
      diagnosticos: [],
      avaliado_em: '2026-03-30T10:40:00.000Z',
    },
    ...overrides,
  });

  describe('Cenário 1: Sem Dataset Autorizado Vigente', () => {
    it('deve priorizar bloqueio formal M-01 quando não houver dataset autorizado', () => {
      const context: CopilotContext = {
        hasDatasetAutorizado: false,
        datasetAutorizado: null,
        modelo: null,
      };

      const resultado = resolveCopilotMessages(context);

      expect(resultado.cenario).toBe('SEM_DATASET_VIGENTE');
      expect(resultado.prioridade).toBe('BLOQUEIO');
      expect(resultado.temBloqueio).toBe(true);
      expect(resultado.prontoParaAvanco).toBe(false);
      expect(resultado.acaoRecomendada.tipo).toBe('AUTORIZAR_DATASET');
      expect(resultado.acaoRecomendada.prioritaria).toBe(true);

      // Verificação das 6 perguntas
      expect(resultado.perguntasChave.ondeEstou).toContain('Modelagem');
      expect(resultado.perguntasChave.oQueDevoFazerAgora).toContain('Preparação');
      expect(resultado.perguntasChave.condicoesEBloqueios).toContain('bloqueio');

      // 3 Níveis
      expect(resultado.nivel1.resumoOperacional).toContain('M-01');
      expect(resultado.nivel2.conceitosChave.length).toBeGreaterThan(0);
      expect(resultado.nivel3.regrasAplicaveis).toContain('M-01: Dataset Autorizado Vigente');
    });

    it('deve bloquear caso o dataset exista mas esteja REVOGADO', () => {
      const context: CopilotContext = {
        hasDatasetAutorizado: true,
        datasetAutorizado: criarDatasetMock(StatusAutorizacaoDataset.REVOGADO),
        modelo: null,
      };

      const resultado = resolveCopilotMessages(context);
      expect(resultado.cenario).toBe('SEM_DATASET_VIGENTE');
      expect(resultado.prioridade).toBe('BLOQUEIO');
    });
  });

  describe('Cenário 2: Sem Modelo Criado', () => {
    it('deve guiar o usuário a inicializar o modelo estrela quando o dataset estiver vigente', () => {
      const context: CopilotContext = {
        hasDatasetAutorizado: true,
        datasetAutorizado: criarDatasetMock(),
        modelo: null,
      };

      const resultado = resolveCopilotMessages(context);

      expect(resultado.cenario).toBe('SEM_MODELO_CRIADO');
      expect(resultado.prioridade).toBe('PROXIMO_PASSO');
      expect(resultado.temBloqueio).toBe(false);
      expect(resultado.acaoRecomendada.tipo).toBe('CRIAR_MODELO');
      expect(resultado.nivel1.titulo).toContain('Criar Modelo');
      expect(resultado.nivel2.porQueEstouFazendoIsso).toContain('Modelo Estrela');
      expect(resultado.nivel2.conceitosChave.some((c) => c.id === 'modelo-estrela')).toBe(true);
    });
  });

  describe('Cenário 3: Homologação Revogada', () => {
    it('deve sinalizar bloqueio e ação para re-homologar quando o modelo estiver revogado', () => {
      const context: CopilotContext = {
        hasDatasetAutorizado: true,
        datasetAutorizado: criarDatasetMock(),
        modelo: criarModeloMock({
          status: StatusModeloAnalitico.REVOGADO,
          revogado_em: '2026-03-30T11:00:00.000Z',
          motivo_revogacao: 'Mudança de requisitos',
        }),
        prontidao: criarProntidaoMock({
          statusModelo: StatusModeloAnalitico.REVOGADO,
          homologacaoVigenteValida: false,
        }),
      };

      const resultado = resolveCopilotMessages(context);

      expect(resultado.cenario).toBe('HOMOLOGACAO_REVOGADA');
      expect(resultado.prioridade).toBe('BLOQUEIO');
      expect(resultado.temBloqueio).toBe(true);
      expect(resultado.acaoRecomendada.tipo).toBe('REHOMOLOGAR_MODELO');
      expect(resultado.nivel1.resumoOperacional).toContain('revogada');
    });
  });

  describe('Cenário 4: Homologação Invalidada por Alteração Posterior', () => {
    it('deve detectar alteração material posterior e exigir re-homologação (Regra 3.6C)', () => {
      const context: CopilotContext = {
        hasDatasetAutorizado: true,
        datasetAutorizado: criarDatasetMock(),
        modelo: criarModeloMock({
          status: StatusModeloAnalitico.HOMOLOGADO,
          homologado_em: '2026-03-30T10:00:00.000Z',
        }),
        prontidao: criarProntidaoMock({
          statusModelo: StatusModeloAnalitico.HOMOLOGADO,
          temAlteracaoPosteriorAHomologacao: true,
          homologacaoVigenteValida: false,
          motivosBloqueio: [
            'O modelo possui alterações materiais em entidades ou métricas após a homologação.',
          ],
        }),
      };

      const resultado = resolveCopilotMessages(context);

      expect(resultado.cenario).toBe('HOMOLOGACAO_INVALIDADA');
      expect(resultado.prioridade).toBe('BLOQUEIO');
      expect(resultado.temBloqueio).toBe(true);
      expect(resultado.acaoRecomendada.tipo).toBe('REHOMOLOGAR_MODELO');
      expect(resultado.nivel1.titulo).toContain('Invalidada por Alteração Material');
      expect(resultado.nivel3.regrasAplicaveis).toContain(
        'Regra 3.6C: Invalidação por Alteração Material'
      );
    });
  });

  describe('Cenário 5: Bloqueios Ativos de Conformidade (M-01 a M-05)', () => {
    it('deve priorizar a resolução de bloqueios e detalhar diagnósticos no Nível 3', () => {
      const context: CopilotContext = {
        hasDatasetAutorizado: true,
        datasetAutorizado: criarDatasetMock(),
        modelo: criarModeloMock(),
        prontidao: criarProntidaoMock({
          prontoParaHomologacao: false,
          motivosBloqueio: [
            'M-02: Grão Central Não Declarado — A entidade FatoVendas não possui grão especificado.',
            'M-04: Consistência Aditiva — A métrica margem_pct utiliza agregação não-aditiva inválida.',
          ],
        }),
      };

      const resultado = resolveCopilotMessages(context);

      expect(resultado.cenario).toBe('BLOQUEIO_CONFORMIDADE');
      expect(resultado.prioridade).toBe('BLOQUEIO');
      expect(resultado.temBloqueio).toBe(true);
      expect(resultado.acaoRecomendada.tipo).toBe('RESOLVER_BLOQUEIOS');
      expect(resultado.nivel3.metricasEstruturais.totalBloqueios).toBe(2);
      expect(resultado.nivel3.diagnosticos.length).toBe(2);
      expect(resultado.nivel3.diagnosticos[0].codigo).toBe('M-02');
    });
  });

  describe('Cenário 6: Ausência de Entidade FATO', () => {
    it('deve exigir a criação de uma entidade Fato para viabilizar a modelagem dimensional', () => {
      const context: CopilotContext = {
        hasDatasetAutorizado: true,
        datasetAutorizado: criarDatasetMock(),
        modelo: criarModeloMock({
          entidades: [
            {
              id: 'dim-01',
              modelo_id: 'mod-01',
              ativo_dados_id: 'ativo-01',
              nome: 'DimCliente',
              tipo: TipoEntidadeAnalitica.DIMENSAO,
              papel: PapelEntidadeAnalitica.DIMENSAO_PADRAO,
              origem_tipo: TipoOrigemEntidade.DATASET_AUTORIZADO,
              descricao: 'Clientes cadastrados',
              ordem_apresentacao: 2,
              criado_em: '2026-03-30T10:00:00.000Z',
              atualizado_em: '2026-03-30T10:00:00.000Z',
              atributos: [],
            },
          ],
        }),
        prontidao: criarProntidaoMock(),
      };

      const resultado = resolveCopilotMessages(context);

      expect(resultado.cenario).toBe('SEM_ENTIDADE_FATO');
      expect(resultado.prioridade).toBe('ACAO_NECESSARIA');
      expect(resultado.acaoRecomendada.tipo).toBe('ADICIONAR_FATO');
      expect(resultado.nivel1.titulo).toContain('Adicionar Entidade FATO');
      expect(resultado.nivel2.conceitosChave.some((c) => c.id === 'tabela-fato')).toBe(true);
    });
  });

  describe('Cenário 7: Ausência de Métricas Cadastradas', () => {
    it('deve solicitar o cadastro da primeira métrica de negócio', () => {
      const context: CopilotContext = {
        hasDatasetAutorizado: true,
        datasetAutorizado: criarDatasetMock(),
        modelo: criarModeloMock({ metricas: [] }),
        prontidao: criarProntidaoMock(),
      };

      const resultado = resolveCopilotMessages(context);

      expect(resultado.cenario).toBe('SEM_METRICAS_CADASTRADAS');
      expect(resultado.prioridade).toBe('ACAO_NECESSARIA');
      expect(resultado.acaoRecomendada.tipo).toBe('CADASTRAR_METRICA');
      expect(resultado.nivel1.titulo).toContain('Cadastrar Métricas Analíticas');
      expect(resultado.nivel2.porQueEstouFazendoIsso).toContain('Métricas formalizadas');
    });
  });

  describe('Cenário 8: Alertas Críticos Pendentes de Justificativa (M-06 / M-07)', () => {
    it('deve orientar homologação com justificativa formal quando houver alertas críticos', () => {
      const context: CopilotContext = {
        hasDatasetAutorizado: true,
        datasetAutorizado: criarDatasetMock(),
        modelo: criarModeloMock(),
        prontidao: criarProntidaoMock({
          alertasCriticosQueExigemJustificativa: [
            'M-06: Cardinalidade N:M — Relacionamento entre Fato e Dimensão possui cardinalidade muitos-para-muitos.',
          ],
        }),
      };

      const resultado = resolveCopilotMessages(context);

      expect(resultado.cenario).toBe('ALERTA_CRITICO_PENDENTE');
      expect(resultado.prioridade).toBe('ACAO_NECESSARIA');
      expect(resultado.temAlertaCritico).toBe(true);
      expect(resultado.acaoRecomendada.tipo).toBe('HOMOLOGAR_COM_JUSTIFICATIVA');
      expect(resultado.nivel1.titulo).toContain('Homologação com 1 Alerta(s) Crítico(s)');
      expect(resultado.nivel2.dicaProfissional).toContain('filtros unidirecionais');
    });
  });

  describe('Cenário 9: Modelo Pronto para Homologação Limpo', () => {
    it('deve indicar prontidão plena quando todos os critérios de governança forem satisfeitos', () => {
      const context: CopilotContext = {
        hasDatasetAutorizado: true,
        datasetAutorizado: criarDatasetMock(),
        modelo: criarModeloMock(),
        prontidao: criarProntidaoMock({
          prontoParaHomologacao: true,
          motivosBloqueio: [],
          alertasCriticosQueExigemJustificativa: [],
        }),
      };

      const resultado = resolveCopilotMessages(context);

      expect(resultado.cenario).toBe('PRONTO_PARA_HOMOLOGACAO');
      expect(resultado.prioridade).toBe('PROXIMO_PASSO');
      expect(resultado.temBloqueio).toBe(false);
      expect(resultado.temAlertaCritico).toBe(false);
      expect(resultado.prontoParaAvanco).toBe(true);
      expect(resultado.acaoRecomendada.tipo).toBe('HOMOLOGAR_MODELO');
      expect(resultado.nivel1.titulo).toContain('Pronto para Homologação');
    });
  });

  describe('Cenário 10: Modelo Homologado e Vigente', () => {
    it('deve instruir o avanço para a etapa Em Validação no Workflow', () => {
      const context: CopilotContext = {
        hasDatasetAutorizado: true,
        datasetAutorizado: criarDatasetMock(),
        modelo: criarModeloMock({
          status: StatusModeloAnalitico.HOMOLOGADO,
          homologado_por: 'ANALISTA_HUMANO',
          homologado_em: '2026-03-30T10:00:00.000Z',
        }),
        prontidao: criarProntidaoMock({
          statusModelo: StatusModeloAnalitico.HOMOLOGADO,
          homologacaoVigenteValida: true,
        }),
      };

      const resultado = resolveCopilotMessages(context);

      expect(resultado.cenario).toBe('HOMOLOGADO_E_VIGENTE');
      expect(resultado.prioridade).toBe('PROXIMO_PASSO');
      expect(resultado.prontoParaAvanco).toBe(true);
      expect(resultado.acaoRecomendada.tipo).toBe('AVANCAR_WORKFLOW');
      expect(resultado.nivel1.ondeEstou).toContain('concluiu com sucesso');
    });
  });

  describe('Garantias de Determinismo e Resiliência', () => {
    it('deve produzir exatamente o mesmo output para as mesmas entradas (pure function)', () => {
      const context: CopilotContext = {
        hasDatasetAutorizado: true,
        datasetAutorizado: criarDatasetMock(),
        modelo: criarModeloMock(),
        prontidao: criarProntidaoMock(),
      };

      const r1 = resolveCopilotMessages(context);
      const r2 = resolveCopilotMessages(context);

      expect(r1.cenario).toBe(r2.cenario);
      expect(r1.prioridade).toBe(r2.prioridade);
      expect(r1.temBloqueio).toBe(r2.temBloqueio);
      expect(r1.acaoRecomendada).toEqual(r2.acaoRecomendada);
      expect(r1.nivel1).toEqual(r2.nivel1);
      expect(r1.nivel2).toEqual(r2.nivel2);
      expect(r1.nivel3.metricasEstruturais).toEqual(r2.nivel3.metricasEstruturais);
      expect(r1.perguntasChave).toEqual(r2.perguntasChave);
    });

    it('deve ter fallback seguro mesmo se o contexto estiver vazio ou com valores nulos', () => {
      const context: CopilotContext = {
        hasDatasetAutorizado: false,
      };

      const resultado = resolveCopilotMessages(context);

      expect(resultado).toBeDefined();
      expect(resultado.cenario).toBe('SEM_DATASET_VIGENTE');
      expect(resultado.prioridade).toBe('BLOQUEIO');
      expect(resultado.perguntasChave.ondeEstou).toBeTruthy();
      expect(resultado.perguntasChave.oQueDevoFazerAgora).toBeTruthy();
      expect(resultado.nivel1.resumoOperacional).toBeTruthy();
      expect(resultado.nivel2.porQueEstouFazendoIsso).toBeTruthy();
      expect(resultado.nivel3.regrasAplicaveis.length).toBeGreaterThan(0);
    });
  });

  describe('Hierarquia Informacional e Harmonização de CTAs (Gate 2B.1)', () => {
    it('deve derivar hierarquia de 5 seções com Onde você está (Etapa 6) e CTA harmonizado para Em Validação', () => {
      const context: CopilotContext = {
        estadoDemanda: 'EM_MODELAGEM_E_ANALISE',
        hasDatasetAutorizado: true,
        datasetAutorizado: criarDatasetMock(),
        modelo: criarModeloMock({
          status: StatusModeloAnalitico.HOMOLOGADO,
          homologado_por: 'ANALISTA_HUMANO',
          homologado_em: '2026-03-30T10:00:00.000Z',
        }),
        prontidao: criarProntidaoMock({
          statusModelo: StatusModeloAnalitico.HOMOLOGADO,
          homologacaoVigenteValida: true,
        }),
      };

      const resultado = resolveCopilotMessages(context);
      const h = resultado.hierarquia;

      expect(h).toBeDefined();
      // 1. Onde você está
      expect(h.ondeVoceEsta).toContain('Etapa 6');
      expect(h.ondeVoceEsta).toContain('Modelagem Dimensional');

      // 2. O que estamos fazendo
      expect(h.oQueEstamosFazendo).toBe('Finalizando a modelagem analítica antes da validação.');

      // 3. Por que estamos fazendo isso
      expect(h.porQueEstamosFazendo).toContain('fatos, dimensões, relacionamentos e métricas');

      // 4. Situação atual
      expect(h.situacaoAtual.statusVisual).toBe('SUCESSO');
      expect(h.situacaoAtual.impedeAvanco).toBe(false);
      expect(h.situacaoAtual.mensagemBloqueio).toBe('✅ Nenhum bloqueio impede o avanço.');

      // 5. Próximo passo & CTA harmonizado com o WorkflowEngine
      expect(h.proximoPasso.descricao).toBe('Avançar a demanda para a etapa de Validação.');
      expect(h.proximoPasso.acaoTitulo).toBe('Avançar para Em Validação');
      expect(h.proximoPasso.podeExecutar).toBe(true);
    });

    it('quando a demanda já avançou além da modelagem (ex: EM_VALIDACAO), Copilot não deve oferecer CTA conflitante', () => {
      const context: CopilotContext = {
        estadoDemanda: 'EM_VALIDACAO',
        hasDatasetAutorizado: true,
        datasetAutorizado: criarDatasetMock(),
        modelo: criarModeloMock({
          status: StatusModeloAnalitico.HOMOLOGADO,
          homologado_por: 'ANALISTA_HUMANO',
          homologado_em: '2026-03-30T10:00:00.000Z',
        }),
        prontidao: criarProntidaoMock({
          statusModelo: StatusModeloAnalitico.HOMOLOGADO,
          homologacaoVigenteValida: true,
        }),
      };

      const resultado = resolveCopilotMessages(context);
      const h = resultado.hierarquia;

      expect(h.ondeVoceEsta).toContain('Demanda em: Em Validação');
      expect(h.oQueEstamosFazendo).toContain('A demanda está ativa na etapa de Em Validação');
      expect(h.proximoPasso.podeExecutar).toBe(false);
      expect(h.proximoPasso.acaoTitulo).toBe('Consultar Modelo Vigente');
    });

    it('deve responder explicitamente se existe algo impedindo de avançar quando há bloqueio de conformidade', () => {
      const context: CopilotContext = {
        hasDatasetAutorizado: true,
        datasetAutorizado: criarDatasetMock(),
        modelo: criarModeloMock(),
        prontidao: criarProntidaoMock({
          prontoParaHomologacao: false,
          motivosBloqueio: [
            'M-02: Chave Primária Ausente — A entidade requer PK.',
            'M-04: Relacionamento sem Cardinalidade — Cardinalidade obrigatória.',
          ],
        }),
      };

      const resultado = resolveCopilotMessages(context);
      const h = resultado.hierarquia;

      expect(resultado.cenario).toBe('BLOQUEIO_CONFORMIDADE');
      expect(h.situacaoAtual.impedeAvanco).toBe(true);
      expect(h.situacaoAtual.temBloqueio).toBe(true);
      expect(h.situacaoAtual.statusVisual).toBe('BLOQUEIO');
      expect(h.situacaoAtual.mensagemBloqueio).toContain('Bloqueio ativo');
      expect(h.situacaoAtual.mensagemBloqueio).toContain('2 pendência(s)');
      expect(h.porQueEstamosFazendo).toContain('Resolver violações de integridade');
    });
  });
});
