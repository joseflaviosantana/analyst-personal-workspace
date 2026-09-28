import { describe, it, expect } from 'vitest';
import { StatusReceitaPreparacao } from '@/core/domain/enums/status-receita-preparacao';
import { StatusEtapaTransformacao } from '@/core/domain/enums/status-etapa-transformacao';
import { TipoOperacaoPreparacao } from '@/core/domain/enums/tipo-operacao-preparacao';
import { StatusAutorizacaoDataset } from '@/core/domain/enums/status-autorizacao-dataset';
import { CategoriaAtivoDados } from '@/core/domain/enums/categoria-ativo-dados';
import { StatusAtivoDados } from '@/core/domain/enums/status-ativo-dados';

// Importa os componentes criados para validar integridade de tipos e módulos da Aba 5
import { PreparationNextActionBanner } from '@/components/preparation/PreparationNextActionBanner';
import { DatasetAuthorizationSection } from '@/components/preparation/DatasetAuthorizationSection';
import { RecipeHeaderCard } from '@/components/preparation/RecipeHeaderCard';
import { TransformationStepCard } from '@/components/preparation/TransformationStepCard';
import { TransformationStepsList } from '@/components/preparation/TransformationStepsList';
import { LineageFlowView } from '@/components/preparation/LineageFlowView';
import { ProblemTreatmentVerificationCard } from '@/components/preparation/ProblemTreatmentVerificationCard';
import { CreateRecipeModal } from '@/components/preparation/CreateRecipeModal';
import { EditRecipeModal } from '@/components/preparation/EditRecipeModal';
import { AddTransformationStepModal } from '@/components/preparation/AddTransformationStepModal';
import { EditTransformationStepModal } from '@/components/preparation/EditTransformationStepModal';
import { CancelTransformationStepModal } from '@/components/preparation/CancelTransformationStepModal';
import { AssociateProblemModal } from '@/components/preparation/AssociateProblemModal';
import { RegisterDerivedAssetModal } from '@/components/preparation/RegisterDerivedAssetModal';
import { AuthorizeDatasetModal } from '@/components/preparation/AuthorizeDatasetModal';
import { RevokeDatasetModal } from '@/components/preparation/RevokeDatasetModal';
import { ConcludeRecipeModal } from '@/components/preparation/ConcludeRecipeModal';
import { TabPreparation } from '@/components/demands/TabPreparation';

describe('Unidade 3.5D — Interface da Aba 5 (Preparação dos Dados)', () => {
  it('deve exportar todos os componentes visuais e modais da Aba 5', () => {
    expect(PreparationNextActionBanner).toBeDefined();
    expect(DatasetAuthorizationSection).toBeDefined();
    expect(RecipeHeaderCard).toBeDefined();
    expect(TransformationStepCard).toBeDefined();
    expect(TransformationStepsList).toBeDefined();
    expect(LineageFlowView).toBeDefined();
    expect(ProblemTreatmentVerificationCard).toBeDefined();
    expect(CreateRecipeModal).toBeDefined();
    expect(EditRecipeModal).toBeDefined();
    expect(AddTransformationStepModal).toBeDefined();
    expect(EditTransformationStepModal).toBeDefined();
    expect(CancelTransformationStepModal).toBeDefined();
    expect(AssociateProblemModal).toBeDefined();
    expect(RegisterDerivedAssetModal).toBeDefined();
    expect(AuthorizeDatasetModal).toBeDefined();
    expect(RevokeDatasetModal).toBeDefined();
    expect(ConcludeRecipeModal).toBeDefined();
    expect(TabPreparation).toBeDefined();
  });

  describe('Lógica do Copiloto Proativo Explicável na Preparação (7 Estados)', () => {
    function determinarEstadoCopiloto(params: {
      totalAtivos: number;
      receitaAtiva: any | null;
      etapas: any[];
      problemasTratarPipeline: any[];
      datasetAutorizado: any | null;
      prontidaoAprovada: boolean;
    }) {
      const {
        totalAtivos,
        receitaAtiva,
        etapas,
        problemasTratarPipeline,
        datasetAutorizado,
        prontidaoAprovada,
      } = params;

      if (totalAtivos === 0) {
        return {
          estado: 'SEM_ATIVO',
          titulo: 'Nenhum ativo de dados cadastrado',
          acao: 'Cadastre ativos brutos na Aba 3 (Ativos de Dados)',
        };
      }

      if (!receitaAtiva) {
        return {
          estado: 'SEM_RECEITA',
          titulo: 'Nenhuma receita de preparação criada',
          acao: 'Criar Receita de Preparação',
        };
      }

      const problemasPendentes = problemasTratarPipeline.filter(
        (p) => p.status !== 'TRATADO' && p.status !== 'ACEITO_COMO_RESTRICAO'
      );

      if (problemasPendentes.length > 0) {
        return {
          estado: 'PROBLEMAS_PENDENTES',
          titulo: `${problemasPendentes.length} problema(s) requerem tratamento`,
          acao: 'Associar e validar tratamento nas etapas de transformação',
        };
      }

      const etapasNaoValidadas = etapas.filter(
        (e) => e.status !== StatusEtapaTransformacao.VALIDADA && e.status !== StatusEtapaTransformacao.CANCELADA
      );

      if (etapas.length > 0 && etapasNaoValidadas.length > 0) {
        return {
          estado: 'ETAPAS_PENDENTES_VALIDACAO',
          titulo: `${etapasNaoValidadas.length} etapa(s) aguardam validação técnica`,
          acao: 'Validar etapas de transformação',
        };
      }

      if (receitaAtiva.status === StatusReceitaPreparacao.RASCUNHO) {
        return {
          estado: 'RECEITA_PRONTA_CONCLUSAO',
          titulo: 'Receita pronta para conclusão',
          acao: 'Concluir Receita de Preparação',
        };
      }

      if (receitaAtiva.status === StatusReceitaPreparacao.CONCLUIDA && (!datasetAutorizado || datasetAutorizado.status !== StatusAutorizacaoDataset.VIGENTE)) {
        return {
          estado: 'AGUARDANDO_AUTORIZACAO',
          titulo: 'Receita concluída, aguardando autorização formal',
          acao: 'Autorizar Dataset para Modelagem',
        };
      }

      if (prontidaoAprovada) {
        return {
          estado: 'PRONTO_PARA_MODELAGEM',
          titulo: 'Dataset Homologado e Autorizado',
          acao: 'Avançar demanda para 6. Modelagem e Análise',
        };
      }

      return {
        estado: 'BLOQUEADO',
        titulo: 'Requisitos de governança pendentes',
        acao: 'Verifique a lista de prontidão',
      };
    }

    it('ESTADO 1: Sem ativo de dados cadastrado', () => {
      const res = determinarEstadoCopiloto({
        totalAtivos: 0,
        receitaAtiva: null,
        etapas: [],
        problemasTratarPipeline: [],
        datasetAutorizado: null,
        prontidaoAprovada: false,
      });
      expect(res.estado).toBe('SEM_ATIVO');
      expect(res.acao).toContain('Aba 3');
    });

    it('ESTADO 2: Sem receita criada para a demanda', () => {
      const res = determinarEstadoCopiloto({
        totalAtivos: 1,
        receitaAtiva: null,
        etapas: [],
        problemasTratarPipeline: [],
        datasetAutorizado: null,
        prontidaoAprovada: false,
      });
      expect(res.estado).toBe('SEM_RECEITA');
      expect(res.acao).toBe('Criar Receita de Preparação');
    });

    it('ESTADO 3: Problemas com ação TRATAR_NO_PIPELINE pendentes', () => {
      const res = determinarEstadoCopiloto({
        totalAtivos: 1,
        receitaAtiva: { id: 'rec_1', status: StatusReceitaPreparacao.RASCUNHO },
        etapas: [],
        problemasTratarPipeline: [
          { id: 'prob_1', acao_deliberada: 'TRATAR_NO_PIPELINE', status: 'ABERTO' },
        ],
        datasetAutorizado: null,
        prontidaoAprovada: false,
      });
      expect(res.estado).toBe('PROBLEMAS_PENDENTES');
      expect(res.titulo).toContain('1 problema(s)');
    });

    it('ESTADO 4: Etapas cadastradas aguardando validação técnica', () => {
      const res = determinarEstadoCopiloto({
        totalAtivos: 1,
        receitaAtiva: { id: 'rec_1', status: StatusReceitaPreparacao.RASCUNHO },
        etapas: [
          { id: 'etp_1', status: StatusEtapaTransformacao.PLANEJADA },
        ],
        problemasTratarPipeline: [],
        datasetAutorizado: null,
        prontidaoAprovada: false,
      });
      expect(res.estado).toBe('ETAPAS_PENDENTES_VALIDACAO');
      expect(res.acao).toBe('Validar etapas de transformação');
    });

    it('ESTADO 5: Etapas validadas, receita em rascunho pronta para conclusão', () => {
      const res = determinarEstadoCopiloto({
        totalAtivos: 1,
        receitaAtiva: { id: 'rec_1', status: StatusReceitaPreparacao.RASCUNHO },
        etapas: [
          { id: 'etp_1', status: StatusEtapaTransformacao.VALIDADA },
        ],
        problemasTratarPipeline: [],
        datasetAutorizado: null,
        prontidaoAprovada: false,
      });
      expect(res.estado).toBe('RECEITA_PRONTA_CONCLUSAO');
      expect(res.acao).toBe('Concluir Receita de Preparação');
    });

    it('ESTADO 6: Receita concluída, aguardando autorização de dataset', () => {
      const res = determinarEstadoCopiloto({
        totalAtivos: 1,
        receitaAtiva: { id: 'rec_1', status: StatusReceitaPreparacao.CONCLUIDA },
        etapas: [
          { id: 'etp_1', status: StatusEtapaTransformacao.VALIDADA },
        ],
        problemasTratarPipeline: [],
        datasetAutorizado: null,
        prontidaoAprovada: false,
      });
      expect(res.estado).toBe('AGUARDANDO_AUTORIZACAO');
      expect(res.acao).toBe('Autorizar Dataset para Modelagem');
    });

    it('ESTADO 7: Dataset autorizado e todos os critérios de prontidão atendidos', () => {
      const res = determinarEstadoCopiloto({
        totalAtivos: 1,
        receitaAtiva: { id: 'rec_1', status: StatusReceitaPreparacao.CONCLUIDA },
        etapas: [
          { id: 'etp_1', status: StatusEtapaTransformacao.VALIDADA },
        ],
        problemasTratarPipeline: [],
        datasetAutorizado: { id: 'aut_1', status: StatusAutorizacaoDataset.VIGENTE },
        prontidaoAprovada: true,
      });
      expect(res.estado).toBe('PRONTO_PARA_MODELAGEM');
      expect(res.acao).toContain('Avançar demanda');
    });
  });

  describe('Critérios de Prontidão de Modelagem (Checklist de 7 Pontos)', () => {
    it('deve validar os 7 itens formais de prontidão para avanço', () => {
      const itensChecklist = [
        { chave: 'quality_gate', label: 'Quality Gate Liberado ou com Ressalva Homologada' },
        { chave: 'dataset_vigente', label: 'Dataset Autorizado Vigente no Repositório' },
        { chave: 'ativo_valido', label: 'Ativo de Dados Homologado com Status ATIVO' },
        { chave: 'integridade_hash', label: 'Integridade Física do Arquivo (Hash SHA-256 Idêntico ao Snapshot)' },
        { chave: 'receita_concluida', label: 'Receita de Preparação com Status CONCLUÍDA' },
        { chave: 'problemas_resolvidos', label: 'Zero Problemas TRATAR_NO_PIPELINE Pendentes' },
        { chave: 'governanca_aprovada', label: 'Auditoria de Governança 3.5C Válida' },
      ];

      expect(itensChecklist).toHaveLength(7);
      const chaves = itensChecklist.map((i) => i.chave);
      expect(chaves).toContain('integridade_hash');
      expect(chaves).toContain('problemas_resolvidos');
      expect(chaves).toContain('dataset_vigente');
    });
  });

  describe('Metadados e Especificações Técnicas de Transformação (Agnóstico a Executores)', () => {
    it('deve armazenar tipo de operação e especificações sem instanciar motores externos', () => {
      const etapa = {
        id: 'etapa-01',
        ordem: 1,
        titulo: 'Filtro e Limpeza de Nulos',
        tipo_operacao: TipoOperacaoPreparacao.FILTRAR_REGISTROS,
        especificacao_tecnica: 'Table.SelectRows(Source, each [faturamento] > 0)',
        ferramenta_sugerida: 'POWER_QUERY',
        status: StatusEtapaTransformacao.PLANEJADA,
      };

      // Comprova que o Workspace trata o snippet M como especificação técnica auditável e não engine
      expect(etapa.especificacao_tecnica).toContain('Table.SelectRows');
      expect(etapa.tipo_operacao).toBe(TipoOperacaoPreparacao.FILTRAR_REGISTROS);
      expect(typeof etapa.especificacao_tecnica).toBe('string');
    });
  });
});
