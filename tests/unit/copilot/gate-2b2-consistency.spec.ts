import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import {
  DICIONARIO_CONCEITOS_MODELAGEM,
  listarTodosConceitosModelagem,
  obterConceitosRelevantesParaCenario,
} from '@/core/use-cases/copilot/modeling-concepts-dictionary';
import { HomologationGovernancePanel } from '@/components/modeling/HomologationGovernancePanel';
import { CopilotConceptCard } from '@/components/copilot/CopilotConceptCard';
import { ModelingRulesEvaluator } from '@/core/domain/rules/modeling-rules-evaluator';
import { StatusModeloAnalitico } from '@/core/domain/enums/status-modelo-analitico';
import { TipoArquiteturaModelo } from '@/core/domain/enums/tipo-arquitetura-modelo';
import { TipoEntidadeAnalitica } from '@/core/domain/enums/tipo-entidade-analitica';
import { PapelEntidadeAnalitica } from '@/core/domain/enums/papel-entidade-analitica';
import { PapelAtributoAnalitico } from '@/core/domain/enums/papel-atributo-analitico';
import { TipoDadoAnalitico } from '@/core/domain/enums/tipo-dado-analitico';
import { TipoAgregacaoMetrica } from '@/core/domain/enums/tipo-agregacao-metrica';
import { TipoAditividadeMetrica } from '@/core/domain/enums/tipo-aditividade-metrica';
import { UnidadeMedidaMetrica } from '@/core/domain/enums/unidade-medida-metrica';
import { StatusAutorizacaoDataset } from '@/core/domain/enums/status-autorizacao-dataset';
import { StatusMetricaAnalitica } from '@/core/domain/enums/status-metrica-analitica';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { ModeloAnaliticoCompleto } from '@/core/domain/entities/modelo-analitico';
import { DatasetAutorizadoAnalise } from '@/core/domain/entities/dataset-autorizado-analise';

/**
 * Busca recursiva de nós por data-testid na árvore de elementos React
 */
function findByTestId(node: any, testId: string): any {
  if (!node) return null;
  if (node.props?.['data-testid'] === testId) return node;
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findByTestId(child, testId);
      if (found) return found;
    }
  }
  if (node.props?.children) {
    return findByTestId(node.props.children, testId);
  }
  return null;
}

describe('GATE 2B.2 — Consistência de UX, Governança e Dicionário Pedagógico', () => {
  describe('Problema 2 — Governança: CTA de Avanço Respeita o Estado Real da Demanda', () => {
    const modeloHomologado: ModeloAnaliticoCompleto = {
      id: 'mod-1',
      demanda_id: 'dem-1',
      dataset_autorizado_id: 'ds-1',
      nome: 'Modelo Homologado',
      descricao: 'Grão central do modelo para testes.',
      tipo_arquitetura: TipoArquiteturaModelo.ESTRELA,
      status: StatusModeloAnalitico.HOMOLOGADO,
      homologado_em: '2026-03-30T10:00:00Z',
      homologado_por: 'Analista Responsável',
      justificativa_homologacao: 'Homologação aprovada.',
      revogado_em: null,
      motivo_revogacao: null,
      criado_em: '2026-03-30T10:00:00Z',
      atualizado_em: '2026-03-30T10:00:00Z',
      entidades: [],
      relacionamentos: [],
      metricas: [],
    };

    const prontidaoVigente: any = {
      prontoParaHomologacao: true,
      homologacaoVigenteValida: true,
      temAlteracaoPosteriorAHomologacao: false,
      motivosBloqueio: [],
      alertasCriticosQueExigemJustificativa: [],
    };

    it('deve exibir "Avançar para Em Validação" quando demanda está em EM_MODELAGEM_E_ANALISE', () => {
      const handleAdvance = vi.fn();
      const tree = HomologationGovernancePanel({
        modelo: modeloHomologado,
        prontidao: prontidaoVigente,
        estadoDemanda: EstadoDemanda.EM_MODELAGEM_E_ANALISE,
        onOpenHomologateModal: vi.fn(),
        onOpenRevokeModal: vi.fn(),
        onAdvanceDemand: handleAdvance,
      });

      const btnAdvance = findByTestId(tree, 'btn-advance-from-panel');
      expect(btnAdvance).not.toBeNull();
      expect(btnAdvance.props['data-testid']).toBe('btn-advance-from-panel');
    });

    it('NÃO deve exibir "Avançar para Em Validação" quando demanda JÁ ESTÁ em EM_VALIDACAO', () => {
      const handleAdvance = vi.fn();
      const tree = HomologationGovernancePanel({
        modelo: modeloHomologado,
        prontidao: prontidaoVigente,
        estadoDemanda: EstadoDemanda.EM_VALIDACAO,
        onOpenHomologateModal: vi.fn(),
        onOpenRevokeModal: vi.fn(),
        onAdvanceDemand: handleAdvance,
      });

      const btnAdvance = findByTestId(tree, 'btn-advance-from-panel');
      expect(btnAdvance).toBeNull();

      // Botão de revogação continua acessível para governança auditável
      const btnRevoke = findByTestId(tree, 'btn-open-revoke-homologation');
      expect(btnRevoke).not.toBeNull();
    });

    it('NÃO deve exibir "Avançar para Em Validação" quando demanda está em PRONTA_PARA_ENTREGA ou CONCLUIDA', () => {
      const treePronta = HomologationGovernancePanel({
        modelo: modeloHomologado,
        prontidao: prontidaoVigente,
        estadoDemanda: EstadoDemanda.PRONTA_PARA_ENTREGA,
        onOpenHomologateModal: vi.fn(),
        onOpenRevokeModal: vi.fn(),
        onAdvanceDemand: vi.fn(),
      });
      expect(findByTestId(treePronta, 'btn-advance-from-panel')).toBeNull();

      const treeConcluida = HomologationGovernancePanel({
        modelo: modeloHomologado,
        prontidao: prontidaoVigente,
        estadoDemanda: EstadoDemanda.CONCLUIDA,
        onOpenHomologateModal: vi.fn(),
        onOpenRevokeModal: vi.fn(),
        onAdvanceDemand: vi.fn(),
      });
      expect(findByTestId(treeConcluida, 'btn-advance-from-panel')).toBeNull();
    });
  });

  describe('Problema 4 — Qualidade Contextual do "Aprenda Enquanto Trabalha"', () => {
    it('deve conter todos os 13 conceitos pedagógicos com campos obrigatórios preenchidos', () => {
      const conceitos = listarTodosConceitosModelagem();
      expect(conceitos).toHaveLength(13);

      for (const conceito of conceitos) {
        expect(conceito.id).toBeTruthy();
        expect(conceito.termo).toBeTruthy();
        expect(conceito.categoria).toBeTruthy();
        expect(conceito.definicaoSimples.length).toBeGreaterThan(20);
        expect(conceito.porQueImporta.length).toBeGreaterThan(20);
        expect(conceito.detalheTecnico.length).toBeGreaterThan(20);
        expect(conceito.dicaProfissional).toBeDefined();
        expect(conceito.dicaProfissional!.length).toBeGreaterThan(30);
      }
    });

    it('cada conceito deve possuir uma dicaProfissional única e específica ao seu contexto', () => {
      const conceitos = listarTodosConceitosModelagem();
      const todasDicas = conceitos.map((c) => c.dicaProfissional!);
      const dicasUnicas = new Set(todasDicas);

      // Nenhuma dica duplicada entre os 13 conceitos
      expect(dicasUnicas.size).toBe(13);
    });

    it('"Dimensão Calendário / Data" deve ter dica focada em calendário e não em homologação genérica', () => {
      const conceito = DICIONARIO_CONCEITOS_MODELAGEM['dimensao-calendario'];
      expect(conceito).toBeDefined();
      expect(conceito.dicaProfissional).toContain('calendário');
      expect(conceito.dicaProfissional).toContain('ordenação');
      expect(conceito.dicaProfissional).not.toContain('homologação formal');
      expect(conceito.regrasAssociadas).toContain('M-08');
    });

    it('"Homologação do Modelo Analítico" deve ter dica focada em conformidade, premissas e auditoria', () => {
      const conceito = DICIONARIO_CONCEITOS_MODELAGEM['homologacao'];
      expect(conceito).toBeDefined();
      expect(conceito.dicaProfissional).toContain('checklist');
      expect(conceito.dicaProfissional).toContain('reconciliação');
    });

    it('CopilotConceptCard deve ser um componente React válido que aceita conceitos e dica', () => {
      const conceitos = obterConceitosRelevantesParaCenario('HOMOLOGADO_E_VIGENTE');
      expect(conceitos.map((c) => c.id)).toEqual(['homologacao', 'dimensao-calendario']);

      const element = React.createElement(CopilotConceptCard, {
        conceitos,
        dicaProfissional: 'Dica genérica global de fallback',
      });

      expect(element).toBeDefined();
      expect(element.props.conceitos).toHaveLength(2);
      expect(element.props.conceitos[1].dicaProfissional).toContain('calendário');
      expect(element.props.conceitos[0].dicaProfissional).toContain('checklist');
    });
  });

  describe('Problema 3 — Investigação: 1 Fato + 1 Dimensão + 0 Relacionamentos', () => {
    it('verifica o comportamento exato das regras M-01 a M-10 para 1 Fato + 1 Dimensão + 0 Relacionamentos', () => {
      const now = new Date().toISOString();
      const datasetVigente: DatasetAutorizadoAnalise = {
        id: 'ds-vig',
        demanda_id: 'dem-investigacao',
        ativo_dados_id: 'atv-1',
        diagnostico_qualidade_id: 'diag-1',
        receita_preparacao_id: null,
        versao_rotulo: '1.0',
        hash_sha256_snapshot: 'hash',
        status: StatusAutorizacaoDataset.VIGENTE,
        justificativa_autorizacao: 'Autorizado para investigação',
        autorizado_por_tipo: 'HUMANO',
        restricoes_aceitas_snapshot: '[]',
        autorizado_em: now,
        revogado_em: null,
        motivo_revogacao: null,
      };

      const modeloInvestigacao: ModeloAnaliticoCompleto = {
        id: 'mod-investigacao',
        demanda_id: 'dem-investigacao',
        dataset_autorizado_id: 'ds-vig',
        nome: 'Modelo Star com Dimensão Desconectada',
        descricao: 'Grão central: Uma linha por venda realizada.',
        tipo_arquitetura: TipoArquiteturaModelo.ESTRELA,
        status: StatusModeloAnalitico.RASCUNHO,
        homologado_em: null,
        homologado_por: null,
        justificativa_homologacao: null,
        revogado_em: null,
        motivo_revogacao: null,
        criado_em: now,
        atualizado_em: now,
        entidades: [
          {
            id: 'ent-fato',
            modelo_id: 'mod-investigacao',
            ativo_dados_id: 'atv-1',
            nome: 'FatoVendas',
            tipo: TipoEntidadeAnalitica.FATO,
            papel: PapelEntidadeAnalitica.FATO_TRANSACIONAL,
            origem_tipo: 'DATASET_AUTORIZADO' as any,
            descricao: 'Granularidade: uma linha por venda.',
            ordem_apresentacao: 1,
            criado_em: now,
            atualizado_em: now,
            atributos: [
              {
                id: 'atr-pk-fato',
                entidade_id: 'ent-fato',
                nome_original: 'id_venda',
                nome_amigavel: 'ID Venda',
                tipo_dado: TipoDadoAnalitico.INTEIRO,
                papel: PapelAtributoAnalitico.CHAVE_PRIMARIA,
                descricao: 'PK da venda',
                formato_exibicao: null,
                oculto: false,
                ordem: 1,
                criado_em: now,
                atualizado_em: now,
              },
            ],
          },
          {
            id: 'ent-dim',
            modelo_id: 'mod-investigacao',
            ativo_dados_id: null,
            nome: 'DimCliente',
            tipo: TipoEntidadeAnalitica.DIMENSAO,
            papel: PapelEntidadeAnalitica.DIMENSAO_PADRAO,
            origem_tipo: 'DATASET_AUTORIZADO' as any,
            descricao: 'Dimensão de clientes cadastrados.',
            ordem_apresentacao: 2,
            criado_em: now,
            atualizado_em: now,
            atributos: [
              {
                id: 'atr-pk-dim',
                entidade_id: 'ent-dim',
                nome_original: 'id_cliente',
                nome_amigavel: 'ID Cliente',
                tipo_dado: TipoDadoAnalitico.INTEIRO,
                papel: PapelAtributoAnalitico.CHAVE_PRIMARIA,
                descricao: 'PK do cliente',
                formato_exibicao: null,
                oculto: false,
                ordem: 1,
                criado_em: now,
                atualizado_em: now,
              },
            ],
          },
        ],
        relacionamentos: [], // 0 Relacionamentos!
        metricas: [
          {
            id: 'met-1',
            modelo_id: 'mod-investigacao',
            entidade_id: 'ent-fato',
            nome: 'Total Vendas',
            descricao: 'Soma total. Reconciliação: ERP.',
            formula_declarativa: 'COUNT(FatoVendas.id_venda)',
            tipo_agregacao: TipoAgregacaoMetrica.CONTAGEM,
            tipo_aditividade: TipoAditividadeMetrica.TOTALMENTE_ADITIVA,
            unidade_medida: UnidadeMedidaMetrica.QUANTIDADE,
            formato_exibicao: '#,##0',
            status: StatusMetricaAnalitica.HOMOLOGADA,
            ordem: 1,
            pergunta_negocio_associada: null,
            objetivo_negocio_associado: null,
            atributos_dependentes_ids: ['atr-pk-fato'],
            metricas_dependentes_ids: [],
            criado_em: now,
            atualizado_em: now,
          },
        ],
      };

      const resultado = ModelingRulesEvaluator.avaliar(modeloInvestigacao, datasetVigente);

      // Comprova a detecção da regra M-11 implementada no Gate 2B.4:
      // O modelo estrela com Fato + Dimensão + 0 relacionamentos agora gera ALERTA_CRITICO
      expect(resultado.total_bloqueios).toBe(0);
      expect(resultado.total_alertas_criticos).toBe(1);
      const diagM11 = resultado.diagnosticos.find((d) => d.codigo_regra === 'M-11');
      expect(diagM11).toBeDefined();
      expect(diagM11?.severidade).toBe('ALERTA_CRITICO');
      expect(diagM11?.entidade_relacionada_id).toBe('ent-dim');
      expect(resultado.status_geral).toBe('ALERTA_CRITICO');
      expect(resultado.apto_homologacao).toBe(true);
    });
  });
});
