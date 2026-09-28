import { describe, it, expect } from 'vitest';
import { StatusModeloAnalitico } from '@/core/domain/enums/status-modelo-analitico';
import { TipoArquiteturaModelo } from '@/core/domain/enums/tipo-arquitetura-modelo';
import { TipoEntidadeAnalitica } from '@/core/domain/enums/tipo-entidade-analitica';
import { PapelEntidadeAnalitica } from '@/core/domain/enums/papel-entidade-analitica';
import { TipoOrigemEntidade } from '@/core/domain/enums/tipo-origem-entidade';
import { TipoDadoAnalitico } from '@/core/domain/enums/tipo-dado-analitico';
import { PapelAtributoAnalitico } from '@/core/domain/enums/papel-atributo-analitico';
import { CardinalidadeRelacionamento } from '@/core/domain/enums/cardinalidade-relacionamento';
import { TipoRelacionamentoAnalitico } from '@/core/domain/enums/tipo-relacionamento-analitico';
import { DirecaoFiltroRelacionamento } from '@/core/domain/enums/direcao-filtro-relacionamento';
import { TipoAditividadeMetrica } from '@/core/domain/enums/tipo-aditividade-metrica';
import { TipoAgregacaoMetrica } from '@/core/domain/enums/tipo-agregacao-metrica';
import { UnidadeMedidaMetrica } from '@/core/domain/enums/unidade-medida-metrica';
import { StatusMetricaAnalitica } from '@/core/domain/enums/status-metrica-analitica';
import { ModeloAnalitico, ModeloAnaliticoCompleto } from '@/core/domain/entities/modelo-analitico';
import { EntidadeAnalitica, EntidadeAnaliticaComAtributos } from '@/core/domain/entities/entidade-analitica';
import { AtributoAnalitico } from '@/core/domain/entities/atributo-analitico';
import { RelacionamentoAnalitico } from '@/core/domain/entities/relacionamento-analitico';
import { MetricaAnalitica } from '@/core/domain/entities/metrica-analitica';

describe('Unit: Domínio de Modelagem Analítica (Subunidade 3.6A)', () => {
  describe('Enums de Domínio', () => {
    it('deve conter todos os status do ciclo de vida do modelo analítico', () => {
      expect(StatusModeloAnalitico.RASCUNHO).toBe('RASCUNHO');
      expect(StatusModeloAnalitico.EM_REVISAO).toBe('EM_REVISAO');
      expect(StatusModeloAnalitico.HOMOLOGADO).toBe('HOMOLOGADO');
      expect(StatusModeloAnalitico.REVOGADO).toBe('REVOGADO');
    });

    it('deve contemplar padrões de arquitetura analítica dimensional', () => {
      expect(TipoArquiteturaModelo.ESTRELA).toBe('ESTRELA');
      expect(TipoArquiteturaModelo.SNOWFLAKE).toBe('SNOWFLAKE');
      expect(TipoArquiteturaModelo.TABELA_UNICA).toBe('TABELA_UNICA');
    });

    it('deve classificar entidades em Fato e Dimensão', () => {
      expect(TipoEntidadeAnalitica.FATO).toBe('FATO');
      expect(TipoEntidadeAnalitica.DIMENSAO).toBe('DIMENSAO');
    });

    it('deve categorizar papéis semânticos de entidades', () => {
      expect(PapelEntidadeAnalitica.FATO_TRANSACIONAL).toBe('FATO_TRANSACIONAL');
      expect(PapelEntidadeAnalitica.FATO_ACUMULADA).toBe('FATO_ACUMULADA');
      expect(PapelEntidadeAnalitica.DIMENSAO_PADRAO).toBe('DIMENSAO_PADRAO');
      expect(PapelEntidadeAnalitica.DIMENSAO_CALENDARIO).toBe('DIMENSAO_CALENDARIO');
      expect(PapelEntidadeAnalitica.DIMENSAO_CONFORMADA).toBe('DIMENSAO_CONFORMADA');
      expect(PapelEntidadeAnalitica.TABELA_PONTE).toBe('TABELA_PONTE');
    });

    it('deve distinguir origem do dataset autorizado vs dimensão gerada pelo sistema', () => {
      expect(TipoOrigemEntidade.DATASET_AUTORIZADO).toBe('DATASET_AUTORIZADO');
      expect(TipoOrigemEntidade.DIMENSAO_SISTEMA).toBe('DIMENSAO_SISTEMA');
    });

    it('deve suportar tipos conceituais agnósticos de dados', () => {
      expect(TipoDadoAnalitico.TEXTO).toBe('TEXTO');
      expect(TipoDadoAnalitico.INTEIRO).toBe('INTEIRO');
      expect(TipoDadoAnalitico.DECIMAL).toBe('DECIMAL');
      expect(TipoDadoAnalitico.DATA).toBe('DATA');
      expect(TipoDadoAnalitico.DATA_HORA).toBe('DATA_HORA');
      expect(TipoDadoAnalitico.BOOLEANO).toBe('BOOLEANO');
    });

    it('deve suportar cardinalidades e manter equivalência entre TipoRelacionamentoAnalitico e CardinalidadeRelacionamento', () => {
      expect(CardinalidadeRelacionamento.UM_PARA_UM).toBe('UM_PARA_UM');
      expect(CardinalidadeRelacionamento.UM_PARA_MUITOS).toBe('UM_PARA_MUITOS');
      expect(CardinalidadeRelacionamento.MUITOS_PARA_UM).toBe('MUITOS_PARA_UM');
      expect(CardinalidadeRelacionamento.MUITOS_PARA_MUITOS).toBe('MUITOS_PARA_MUITOS');
      expect(TipoRelacionamentoAnalitico.MUITOS_PARA_MUITOS).toBe(CardinalidadeRelacionamento.MUITOS_PARA_MUITOS);
    });

    it('deve suportar direções de filtro unidirecional e bidirecional', () => {
      expect(DirecaoFiltroRelacionamento.UNIDIRECIONAL).toBe('UNIDIRECIONAL');
      expect(DirecaoFiltroRelacionamento.BIDIRECIONAL).toBe('BIDIRECIONAL');
    });

    it('deve suportar classificações de aditividade e agregação de métricas', () => {
      expect(TipoAditividadeMetrica.TOTALMENTE_ADITIVA).toBe('TOTALMENTE_ADITIVA');
      expect(TipoAditividadeMetrica.SEMI_ADITIVA).toBe('SEMI_ADITIVA');
      expect(TipoAditividadeMetrica.NAO_ADITIVA).toBe('NAO_ADITIVA');

      expect(TipoAgregacaoMetrica.SOMA).toBe('SOMA');
      expect(TipoAgregacaoMetrica.MEDIA).toBe('MEDIA');
      expect(TipoAgregacaoMetrica.COMPOSTA).toBe('COMPOSTA');
    });
  });

  describe('Entidades e Agregado Completo', () => {
    it('deve montar a estrutura de um ModeloAnalitico básico', () => {
      const modelo: ModeloAnalitico = {
        id: 'mod_01',
        demanda_id: 'dem_01',
        dataset_autorizado_id: 'dset_01',
        nome: 'Modelo Vendas e Clientes',
        descricao: 'Modelo dimensional para análise de receita',
        tipo_arquitetura: TipoArquiteturaModelo.ESTRELA,
        status: StatusModeloAnalitico.RASCUNHO,
        homologado_em: null,
        homologado_por: null,
        justificativa_homologacao: null,
        revogado_em: null,
        motivo_revogacao: null,
        criado_em: '2026-09-28T18:00:00.000Z',
        atualizado_em: '2026-09-28T18:00:00.000Z',
      };

      expect(modelo.id).toBe('mod_01');
      expect(modelo.status).toBe(StatusModeloAnalitico.RASCUNHO);
      expect(modelo.tipo_arquitetura).toBe(TipoArquiteturaModelo.ESTRELA);
    });

    it('deve permitir relacionamentos N:M e filtro bidirecional com justificativa técnica (M-03)', () => {
      const relNM: RelacionamentoAnalitico = {
        id: 'rel_01',
        modelo_id: 'mod_01',
        entidade_origem_id: 'ent_vendas',
        atributo_origem_id: 'attr_promocao_id',
        entidade_destino_id: 'ent_promocoes',
        atributo_destino_id: 'attr_promocao_pk',
        tipo_relacionamento: CardinalidadeRelacionamento.MUITOS_PARA_MUITOS,
        direcao_filtro: DirecaoFiltroRelacionamento.BIDIRECIONAL,
        ativo: true,
        justificativa: 'Múltiplas promoções aplicadas a múltiplos itens de venda simultaneamente.',
        criado_em: '2026-09-28T18:00:00.000Z',
        atualizado_em: '2026-09-28T18:00:00.000Z',
      };

      expect(relNM.tipo_relacionamento).toBe(CardinalidadeRelacionamento.MUITOS_PARA_MUITOS);
      expect(relNM.direcao_filtro).toBe(DirecaoFiltroRelacionamento.BIDIRECIONAL);
      expect(relNM.justificativa).toBeDefined();
      expect(relNM.justificativa?.length).toBeGreaterThan(10);
    });

    it('deve estruturar métricas com linhagem semântica explícita e vínculo com pergunta de negócio (Ajustes 5 e 6)', () => {
      const metricaBase1: MetricaAnalitica = {
        id: 'met_01',
        modelo_id: 'mod_01',
        entidade_id: 'ent_fato_vendas',
        nome: 'Receita Bruta',
        descricao: 'Soma do valor total faturado',
        tipo_agregacao: TipoAgregacaoMetrica.SOMA,
        tipo_aditividade: TipoAditividadeMetrica.TOTALMENTE_ADITIVA,
        formula_declarativa: 'SOMA(valor_bruto)',
        unidade_medida: UnidadeMedidaMetrica.MOEDA,
        formato_exibicao: 'R$ #,##0.00',
        status: StatusMetricaAnalitica.HOMOLOGADA,
        atributos_dependentes_ids: ['attr_valor_bruto'],
        metricas_dependentes_ids: [],
        pergunta_negocio_associada: 'Qual é o volume total faturado no período?',
        objetivo_negocio_associado: 'Acompanhar a meta trimestral de vendas',
        ordem: 1,
        criado_em: '2026-09-28T18:00:00.000Z',
        atualizado_em: '2026-09-28T18:00:00.000Z',
      };

      const metricaBase2: MetricaAnalitica = {
        id: 'met_02',
        modelo_id: 'mod_01',
        entidade_id: 'ent_fato_vendas',
        nome: 'Custo Total',
        descricao: 'Soma dos custos das mercadorias vendidas',
        tipo_agregacao: TipoAgregacaoMetrica.SOMA,
        tipo_aditividade: TipoAditividadeMetrica.TOTALMENTE_ADITIVA,
        formula_declarativa: 'SOMA(custo_mercadoria)',
        unidade_medida: UnidadeMedidaMetrica.MOEDA,
        formato_exibicao: 'R$ #,##0.00',
        status: StatusMetricaAnalitica.HOMOLOGADA,
        atributos_dependentes_ids: ['attr_custo_mercadoria'],
        metricas_dependentes_ids: [],
        pergunta_negocio_associada: 'Qual foi o custo total dos produtos vendidos?',
        objetivo_negocio_associado: 'Otimizar despesas operacionais',
        ordem: 2,
        criado_em: '2026-09-28T18:00:00.000Z',
        atualizado_em: '2026-09-28T18:00:00.000Z',
      };

      // Métrica composta: Margem % = (Receita Bruta - Custo Total) / Receita Bruta
      const metricaComposta: MetricaAnalitica = {
        id: 'met_03',
        modelo_id: 'mod_01',
        entidade_id: 'ent_fato_vendas',
        nome: 'Margem Bruta %',
        descricao: 'Percentual de rentabilidade sobre a receita',
        tipo_agregacao: TipoAgregacaoMetrica.COMPOSTA,
        tipo_aditividade: TipoAditividadeMetrica.NAO_ADITIVA,
        formula_declarativa: '([Receita Bruta] - [Custo Total]) / [Receita Bruta]',
        unidade_medida: UnidadeMedidaMetrica.PERCENTUAL,
        formato_exibicao: '0.0%',
        status: StatusMetricaAnalitica.HOMOLOGADA,
        atributos_dependentes_ids: [],
        metricas_dependentes_ids: ['met_01', 'met_02'],
        pergunta_negocio_associada: 'Qual a rentabilidade percentual das vendas?',
        objetivo_negocio_associado: 'Monitorar sustentabilidade da operação',
        ordem: 3,
        criado_em: '2026-09-28T18:00:00.000Z',
        atualizado_em: '2026-09-28T18:00:00.000Z',
      };

      expect(metricaComposta.tipo_agregacao).toBe(TipoAgregacaoMetrica.COMPOSTA);
      expect(metricaComposta.metricas_dependentes_ids).toEqual(['met_01', 'met_02']);
      expect(metricaComposta.atributos_dependentes_ids).toHaveLength(0);
      expect(metricaComposta.pergunta_negocio_associada).toContain('rentabilidade');
    });

    it('deve montar o grafo completo de um ModeloAnaliticoCompleto', () => {
      const atributo1: AtributoAnalitico = {
        id: 'attr_venda_id',
        entidade_id: 'ent_fato',
        nome_original: 'id_venda',
        nome_amigavel: 'ID Venda',
        tipo_dado: TipoDadoAnalitico.TEXTO,
        papel: PapelAtributoAnalitico.CHAVE_PRIMARIA,
        ordem: 1,
        oculto: false,
        descricao: null,
        formato_exibicao: null,
        criado_em: '2026-09-28T18:00:00.000Z',
        atualizado_em: '2026-09-28T18:00:00.000Z',
      };

      const entidadeFato: EntidadeAnaliticaComAtributos = {
        id: 'ent_fato',
        modelo_id: 'mod_01',
        ativo_dados_id: 'ativo_raw',
        nome: 'Fato Vendas',
        tipo: TipoEntidadeAnalitica.FATO,
        papel: PapelEntidadeAnalitica.FATO_TRANSACIONAL,
        origem_tipo: TipoOrigemEntidade.DATASET_AUTORIZADO,
        descricao: null,
        ordem_apresentacao: 1,
        criado_em: '2026-09-28T18:00:00.000Z',
        atualizado_em: '2026-09-28T18:00:00.000Z',
        atributos: [atributo1],
      };

      const modeloCompleto: ModeloAnaliticoCompleto = {
        id: 'mod_01',
        demanda_id: 'dem_01',
        dataset_autorizado_id: 'dset_01',
        nome: 'Modelo Dimensional Completo',
        descricao: null,
        tipo_arquitetura: TipoArquiteturaModelo.ESTRELA,
        status: StatusModeloAnalitico.RASCUNHO,
        homologado_em: null,
        homologado_por: null,
        justificativa_homologacao: null,
        revogado_em: null,
        motivo_revogacao: null,
        criado_em: '2026-09-28T18:00:00.000Z',
        atualizado_em: '2026-09-28T18:00:00.000Z',
        entidades: [entidadeFato],
        relacionamentos: [],
        metricas: [],
      };

      expect(modeloCompleto.entidades).toHaveLength(1);
      expect(modeloCompleto.entidades[0].atributos).toHaveLength(1);
      expect(modeloCompleto.entidades[0].atributos[0].nome_amigavel).toBe('ID Venda');
    });
  });
});
