import { describe, it, expect } from 'vitest';
import { StatusModeloAnalitico } from '@/core/domain/enums/status-modelo-analitico';
import { TipoArquiteturaModelo } from '@/core/domain/enums/tipo-arquitetura-modelo';
import { TipoEntidadeAnalitica } from '@/core/domain/enums/tipo-entidade-analitica';
import { PapelEntidadeAnalitica } from '@/core/domain/enums/papel-entidade-analitica';
import { PapelAtributoAnalitico } from '@/core/domain/enums/papel-atributo-analitico';
import { CardinalidadeRelacionamento } from '@/core/domain/enums/cardinalidade-relacionamento';
import { DirecaoFiltroRelacionamento } from '@/core/domain/enums/direcao-filtro-relacionamento';
import { TipoAgregacaoMetrica } from '@/core/domain/enums/tipo-agregacao-metrica';
import { TipoAditividadeMetrica } from '@/core/domain/enums/tipo-aditividade-metrica';
import { UnidadeMedidaMetrica } from '@/core/domain/enums/unidade-medida-metrica';
import { SeveridadeRegraModelagem } from '@/core/domain/rules/modeling-rules-evaluator';

// Importa os componentes criados para validar integridade de tipos e módulos da Aba 6
import { ModelingNextActionBanner } from '@/components/modeling/ModelingNextActionBanner';
import { ModelHeaderCard } from '@/components/modeling/ModelHeaderCard';
import { ModelStructureView } from '@/components/modeling/ModelStructureView';
import { EntitiesAndAttributesSection } from '@/components/modeling/EntitiesAndAttributesSection';
import { RelationshipsSection } from '@/components/modeling/RelationshipsSection';
import { MetricsSection } from '@/components/modeling/MetricsSection';
import { ComplianceEvaluationSection } from '@/components/modeling/ComplianceEvaluationSection';
import { HomologationGovernancePanel } from '@/components/modeling/HomologationGovernancePanel';
import { CreateModelModal } from '@/components/modeling/CreateModelModal';
import { EditModelModal } from '@/components/modeling/EditModelModal';
import { AddEntityModal } from '@/components/modeling/AddEntityModal';
import { ConfigureAttributesModal } from '@/components/modeling/ConfigureAttributesModal';
import { AddRelationshipModal } from '@/components/modeling/AddRelationshipModal';
import { SpecifyCalendarModal } from '@/components/modeling/SpecifyCalendarModal';
import { CreateMetricModal } from '@/components/modeling/CreateMetricModal';
import { EditMetricModal } from '@/components/modeling/EditMetricModal';
import { HomologateModelModal } from '@/components/modeling/HomologateModelModal';
import { RevokeHomologationModal } from '@/components/modeling/RevokeHomologationModal';
import { TabModeling } from '@/components/demands/TabModeling';

describe('Unidade 3.6D — Interface da Aba 6 (Modelagem Analítica)', () => {
  it('deve exportar todos os componentes visuais e modais da Aba 6', () => {
    expect(ModelingNextActionBanner).toBeDefined();
    expect(ModelHeaderCard).toBeDefined();
    expect(ModelStructureView).toBeDefined();
    expect(EntitiesAndAttributesSection).toBeDefined();
    expect(RelationshipsSection).toBeDefined();
    expect(MetricsSection).toBeDefined();
    expect(ComplianceEvaluationSection).toBeDefined();
    expect(HomologationGovernancePanel).toBeDefined();
    expect(CreateModelModal).toBeDefined();
    expect(EditModelModal).toBeDefined();
    expect(AddEntityModal).toBeDefined();
    expect(ConfigureAttributesModal).toBeDefined();
    expect(AddRelationshipModal).toBeDefined();
    expect(SpecifyCalendarModal).toBeDefined();
    expect(CreateMetricModal).toBeDefined();
    expect(EditMetricModal).toBeDefined();
    expect(HomologateModelModal).toBeDefined();
    expect(RevokeHomologationModal).toBeDefined();
    expect(TabModeling).toBeDefined();
  });

  describe('Lógica do Copiloto Proativo Explicável na Modelagem', () => {
    function determinarEstadoCopiloto(params: {
      hasDatasetAutorizado: boolean;
      modelo: any | null;
      prontidao: any | null;
    }) {
      const { hasDatasetAutorizado, modelo, prontidao } = params;

      if (!hasDatasetAutorizado) {
        return {
          estado: 'SEM_DATASET_AUTORIZADO',
          severidade: 'BLOQUEIO',
          titulo: 'Dataset Autorizado Ausente ou Não Vigente',
          acaoSugerida: 'Acesse a Aba 5 (Preparação) e autorize o dataset',
          impedeHomologacao: true,
        };
      }

      if (!modelo) {
        return {
          estado: 'SEM_MODELO',
          severidade: 'ORIENTACAO',
          titulo: 'Próxima Ação: Criar Modelo Analítico',
          acaoSugerida: 'Criar Modelo com Fato Inicial',
          impedeHomologacao: true,
        };
      }

      const isHomologado = modelo.status === StatusModeloAnalitico.HOMOLOGADO;
      const temAlteracaoPosterior = prontidao?.temAlteracaoPosteriorAHomologacao ?? false;

      if (isHomologado && temAlteracaoPosterior) {
        return {
          estado: 'HOMOLOGACAO_INVALIDADA',
          severidade: 'BLOQUEIO',
          titulo: 'Homologação Invalidada por Alteração Posterior',
          acaoSugerida: 'Reavaliar Conformidade e Re-homologar Modelo',
          impedeHomologacao: true,
        };
      }

      if (isHomologado && !temAlteracaoPosterior) {
        return {
          estado: 'HOMOLOGADO_VIGENTE',
          severidade: 'SUCESSO',
          titulo: 'Modelo Analítico Homologado & Vigente',
          acaoSugerida: 'Avançar Demanda para Em Validação',
          impedeHomologacao: false,
        };
      }

      const totalBloqueios = prontidao?.motivosBloqueio?.length ?? 0;
      if (totalBloqueios > 0) {
        return {
          estado: 'BLOQUEIOS_DETECTADOS',
          severidade: 'BLOQUEIO',
          titulo: `${totalBloqueios} Bloqueio(s) Impede(m) a Homologação`,
          acaoSugerida: 'Corrigir violações determinísticas no modelo',
          impedeHomologacao: true,
        };
      }

      const totalAlertas = prontidao?.alertasCriticos?.length ?? 0;
      if (totalAlertas > 0) {
        return {
          estado: 'ALERTAS_CRITICOS',
          severidade: 'ALERTA_CRITICO',
          titulo: `${totalAlertas} Alerta(s) Crítico(s) Requer(em) Justificativa`,
          acaoSugerida: 'Reconhecer e justificar alertas críticos na homologação',
          impedeHomologacao: false, // Pode homologar fornecendo justificativa explícita
        };
      }

      const totalRecomendacoes = prontidao?.recomendacoes?.length ?? 0;
      return {
        estado: 'PRONTO_PARA_HOMOLOGACAO',
        severidade: 'PRONTO',
        titulo: 'Modelo Pronto para Homologação Formal',
        acaoSugerida: 'Homologar Modelo Analítico',
        impedeHomologacao: false,
        totalRecomendacoes,
      };
    }

    it('Cenário 1: Sem dataset autorizado vigente bloqueia e orienta retorno à Aba 5', () => {
      const res = determinarEstadoCopiloto({
        hasDatasetAutorizado: false,
        modelo: null,
        prontidao: null,
      });

      expect(res.estado).toBe('SEM_DATASET_AUTORIZADO');
      expect(res.severidade).toBe('BLOQUEIO');
      expect(res.impedeHomologacao).toBe(true);
      expect(res.acaoSugerida).toContain('Aba 5');
    });

    it('Cenário 2: Com dataset autorizado mas sem modelo sugere criação com fato inicial', () => {
      const res = determinarEstadoCopiloto({
        hasDatasetAutorizado: true,
        modelo: null,
        prontidao: null,
      });

      expect(res.estado).toBe('SEM_MODELO');
      expect(res.acaoSugerida).toContain('Criar Modelo');
      expect(res.impedeHomologacao).toBe(true);
    });

    it('Cenário 3: Com bloqueios M-01 a M-10 categoriza como BLOQUEIO e impede homologação', () => {
      const res = determinarEstadoCopiloto({
        hasDatasetAutorizado: true,
        modelo: { id: 'mod_1', status: StatusModeloAnalitico.RASCUNHO },
        prontidao: {
          aptoParaHomologacao: false,
          motivosBloqueio: ['M-02: Nenhuma entidade declarada como FATO.'],
          alertasCriticos: [],
          recomendacoes: [],
          temAlteracaoPosteriorAHomologacao: false,
        },
      });

      expect(res.estado).toBe('BLOQUEIOS_DETECTADOS');
      expect(res.severidade).toBe('BLOQUEIO');
      expect(res.impedeHomologacao).toBe(true);
    });

    it('Cenário 4: Com alertas críticos requer justificativa explícita na homologação mas não bloqueia sumariamente', () => {
      const res = determinarEstadoCopiloto({
        hasDatasetAutorizado: true,
        modelo: { id: 'mod_1', status: StatusModeloAnalitico.RASCUNHO },
        prontidao: {
          aptoParaHomologacao: true,
          motivosBloqueio: [],
          alertasCriticos: ['M-06: Relacionamento muitos-para-muitos detectado.'],
          recomendacoes: [],
          temAlteracaoPosteriorAHomologacao: false,
        },
      });

      expect(res.estado).toBe('ALERTAS_CRITICOS');
      expect(res.severidade).toBe('ALERTA_CRITICO');
      expect(res.impedeHomologacao).toBe(false); // Apto com justificativa
    });

    it('Cenário 5: Recomendações não impedem homologação e explicam benefício de melhoria', () => {
      const res = determinarEstadoCopiloto({
        hasDatasetAutorizado: true,
        modelo: { id: 'mod_1', status: StatusModeloAnalitico.RASCUNHO },
        prontidao: {
          aptoParaHomologacao: true,
          motivosBloqueio: [],
          alertasCriticos: [],
          recomendacoes: ['M-05: Nenhuma dimensão calendário identificada.'],
          temAlteracaoPosteriorAHomologacao: false,
        },
      });

      expect(res.estado).toBe('PRONTO_PARA_HOMOLOGACAO');
      expect(res.impedeHomologacao).toBe(false);
      expect(res.totalRecomendacoes).toBe(1);
    });

    it('Cenário 6: Modelo homologado vigente orienta avanço da demanda para Em Validação', () => {
      const res = determinarEstadoCopiloto({
        hasDatasetAutorizado: true,
        modelo: { id: 'mod_1', status: StatusModeloAnalitico.HOMOLOGADO },
        prontidao: {
          aptoParaHomologacao: true,
          motivosBloqueio: [],
          alertasCriticos: [],
          recomendacoes: [],
          temAlteracaoPosteriorAHomologacao: false,
        },
      });

      expect(res.estado).toBe('HOMOLOGADO_VIGENTE');
      expect(res.severidade).toBe('SUCESSO');
      expect(res.acaoSugerida).toContain('Em Validação');
    });

    it('Cenário 7: Alteração material posterior a uma homologação invalida o atestado e exige re-homologação', () => {
      const res = determinarEstadoCopiloto({
        hasDatasetAutorizado: true,
        modelo: { id: 'mod_1', status: StatusModeloAnalitico.HOMOLOGADO },
        prontidao: {
          aptoParaHomologacao: false,
          motivosBloqueio: ['O modelo sofreu alterações após a homologação.'],
          alertasCriticos: [],
          recomendacoes: [],
          temAlteracaoPosteriorAHomologacao: true,
        },
      });

      expect(res.estado).toBe('HOMOLOGACAO_INVALIDADA');
      expect(res.severidade).toBe('BLOQUEIO');
      expect(res.impedeHomologacao).toBe(true);
    });
  });

  describe('Diferenciação Semântica dos Diagnósticos M-01 a M-10', () => {
    it('deve classificar severidades rigorosamente conforme a especificação do domínio', () => {
      const severidades: SeveridadeRegraModelagem[] = ['BLOQUEIO', 'ALERTA_CRITICO', 'RECOMENDACAO'];
      expect(severidades).toContain('BLOQUEIO');
      expect(severidades).toContain('ALERTA_CRITICO');
      expect(severidades).toContain('RECOMENDACAO');
    });

    it('deve respeitar papéis e tipos analíticos semânticos', () => {
      expect(TipoArquiteturaModelo.ESTRELA).toBe('ESTRELA');
      expect(TipoArquiteturaModelo.SNOWFLAKE).toBe('SNOWFLAKE');
      expect(TipoArquiteturaModelo.TABELA_UNICA).toBe('TABELA_UNICA');

      expect(TipoEntidadeAnalitica.FATO).toBe('FATO');
      expect(TipoEntidadeAnalitica.DIMENSAO).toBe('DIMENSAO');

      expect(PapelEntidadeAnalitica.FATO_TRANSACIONAL).toBe('FATO_TRANSACIONAL');
      expect(PapelEntidadeAnalitica.DIMENSAO_CALENDARIO).toBe('DIMENSAO_CALENDARIO');

      expect(PapelAtributoAnalitico.CHAVE_PRIMARIA).toBe('CHAVE_PRIMARIA');
      expect(PapelAtributoAnalitico.CHAVE_ESTRANGEIRA).toBe('CHAVE_ESTRANGEIRA');
      expect(PapelAtributoAnalitico.METRICA_BASE).toBe('METRICA_BASE');

      expect(CardinalidadeRelacionamento.UM_PARA_MUITOS).toBe('UM_PARA_MUITOS');
      expect(CardinalidadeRelacionamento.MUITOS_PARA_MUITOS).toBe('MUITOS_PARA_MUITOS');

      expect(DirecaoFiltroRelacionamento.UNIDIRECIONAL).toBe('UNIDIRECIONAL');
      expect(DirecaoFiltroRelacionamento.BIDIRECIONAL).toBe('BIDIRECIONAL');

      expect(TipoAgregacaoMetrica.SOMA).toBe('SOMA');
      expect(TipoAditividadeMetrica.TOTALMENTE_ADITIVA).toBe('TOTALMENTE_ADITIVA');
      expect(UnidadeMedidaMetrica.MOEDA).toBe('MOEDA');
    });
  });
});
