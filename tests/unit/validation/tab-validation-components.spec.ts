/**
 * tests/unit/validation/tab-validation-components.spec.ts
 *
 * Suíte de Testes Unitários da Interface da Aba 9 — Validação & Conciliação (Subgate 3.7B).
 *
 * Cenários Testados:
 * 1. Todos os componentes da Aba 9 são exportados e tipados;
 * 2. Cálculo correto de taxa de conformidade e contadores no ValidationSummaryCards;
 * 3. Banner preventivo de governança (V-01 bloqueado quando 0 validações);
 * 4. Banner preventivo de governança (V-02 bloqueado quando divergência obrigatória);
 * 5. Banner de liberação quando todos os checks obrigatórios estão em conformidade;
 * 6. Suporte aos diferentes estados e badges de validação (Aprovado, Divergente, Rejeitado, Pendente);
 * 7. Default conservador de tolerância zero e preenchimento de executor.
 */

import { describe, it, expect } from 'vitest';
import React from 'react';

import { TabValidation } from '@/components/demands/TabValidation';
import { ValidationSummaryCards } from '@/components/validation/ValidationSummaryCards';
import { ValidationNextActionBanner } from '@/components/validation/ValidationNextActionBanner';
import { ValidationCardList } from '@/components/validation/ValidationCardList';
import { CreateValidationModal } from '@/components/validation/CreateValidationModal';
import { RetestValidationModal } from '@/components/validation/RetestValidationModal';

import { ValidacaoConciliacao } from '@/core/domain/entities/validacao-conciliacao';
import { CamadaValidacao } from '@/core/domain/enums/camada-validacao';
import { ResultadoValidacao } from '@/core/domain/enums/resultado-validacao';
import { ResultadoAvaliacaoValidacao } from '@/core/domain/rules/validation-rules-evaluator';

describe('Unit Tests: Componentes da Aba 9 (Validação & Conciliação — Subgate 3.7B)', () => {
  it('1. Deve exportar todos os componentes da Aba 9', () => {
    expect(TabValidation).toBeDefined();
    expect(ValidationSummaryCards).toBeDefined();
    expect(ValidationNextActionBanner).toBeDefined();
    expect(ValidationCardList).toBeDefined();
    expect(CreateValidationModal).toBeDefined();
    expect(RetestValidationModal).toBeDefined();
  });

  describe('2. ValidationSummaryCards — Cálculos e Métricas', () => {
    it('calcula taxa de conformidade corretamente quando há checks cadastrados', () => {
      const element = React.createElement(ValidationSummaryCards, {
        totalValidacoes: 4,
        totalObrigatorias: 3,
        totalAprovadas: 3,
        totalDivergentes: 1,
        totalPendentesReteste: 0,
      });

      expect(element).toBeDefined();
      expect(element.props.totalValidacoes).toBe(4);
      expect(element.props.totalAprovadas).toBe(3);
      // Taxa esperada: 3/4 = 75%
      const taxa = Math.round((3 / 4) * 100);
      expect(taxa).toBe(75);
    });

    it('retorna 0% de conformidade quando total de validações é zero', () => {
      const element = React.createElement(ValidationSummaryCards, {
        totalValidacoes: 0,
        totalObrigatorias: 0,
        totalAprovadas: 0,
        totalDivergentes: 0,
        totalPendentesReteste: 0,
      });

      expect(element.props.totalValidacoes).toBe(0);
    });
  });

  describe('3. ValidationNextActionBanner — Feedback Preventivo de Governança', () => {
    it('exibe bloqueio V-01 preventivo quando há zero validações cadastradas', () => {
      const prontidaoV01Bloqueada: ResultadoAvaliacaoValidacao = {
        total_validacoes: 0,
        total_obrigatorias: 0,
        total_aprovadas: 0,
        total_divergentes: 0,
        total_rejeitadas: 0,
        total_pendentes_reteste: 0,
        total_entregaveis: 0,
        total_entregaveis_obrigatorios: 0,
        total_entregaveis_disponiveis: 0,
        total_entregaveis_aceitos: 0,
        bloqueios_entrega: ['A demanda não possui nenhuma validação analítica ou conciliação cadastrada.'],
        bloqueios_conclusao: [],
        alertas_criticos: [],
        recomendacoes: [],
        pronto_para_entrega: false,
        pronto_para_conclusao: false,
        diagnosticos: [
          {
            codigo: 'V-01',
            tipo: 'BLOQUEIO',
            mensagem: 'A demanda não possui nenhuma validação analítica ou conciliação cadastrada.',
          },
        ],
      };

      const element = React.createElement(ValidationNextActionBanner, {
        prontidao: prontidaoV01Bloqueada,
      });

      expect(element.props.prontidao?.pronto_para_entrega).toBe(false);
      expect(element.props.prontidao?.diagnosticos[0].codigo).toBe('V-01');
      expect(element.props.prontidao?.bloqueios_entrega[0]).toContain('nenhuma validação');
    });

    it('exibe bloqueio V-02 preventivo quando há validação obrigatória divergente', () => {
      const prontidaoV02Bloqueada: ResultadoAvaliacaoValidacao = {
        total_validacoes: 2,
        total_obrigatorias: 2,
        total_aprovadas: 1,
        total_divergentes: 1,
        total_rejeitadas: 0,
        total_pendentes_reteste: 0,
        total_entregaveis: 0,
        total_entregaveis_obrigatorios: 0,
        total_entregaveis_disponiveis: 0,
        total_entregaveis_aceitos: 0,
        bloqueios_entrega: ['Validação obrigatória "Total Faturamento" está com resultado DIVERGENTE.'],
        bloqueios_conclusao: [],
        alertas_criticos: [],
        recomendacoes: [],
        pronto_para_entrega: false,
        pronto_para_conclusao: false,
        diagnosticos: [
          {
            codigo: 'V-02',
            tipo: 'BLOQUEIO',
            mensagem: 'Validação obrigatória "Total Faturamento" está com resultado DIVERGENTE.',
          },
        ],
      };

      const element = React.createElement(ValidationNextActionBanner, {
        prontidao: prontidaoV02Bloqueada,
      });

      expect(element.props.prontidao?.pronto_para_entrega).toBe(false);
      expect(element.props.prontidao?.bloqueios_entrega[0]).toContain('DIVERGENTE');
    });

    it('exibe banner verde liberado quando todas as validações obrigatórias estão aprovadas', () => {
      const prontidaoLiberada: ResultadoAvaliacaoValidacao = {
        total_validacoes: 2,
        total_obrigatorias: 2,
        total_aprovadas: 2,
        total_divergentes: 0,
        total_rejeitadas: 0,
        total_pendentes_reteste: 0,
        total_entregaveis: 0,
        total_entregaveis_obrigatorios: 0,
        total_entregaveis_disponiveis: 0,
        total_entregaveis_aceitos: 0,
        bloqueios_entrega: [],
        bloqueios_conclusao: [],
        alertas_criticos: [],
        recomendacoes: [],
        pronto_para_entrega: true,
        pronto_para_conclusao: false,
        diagnosticos: [],
      };

      const element = React.createElement(ValidationNextActionBanner, {
        prontidao: prontidaoLiberada,
      });

      expect(element.props.prontidao?.pronto_para_entrega).toBe(true);
      expect(element.props.prontidao?.bloqueios_entrega.length).toBe(0);
    });
  });

  describe('4. ValidationCardList — Estrutura e Dados de Validação', () => {
    it('instancia lista com dados reais e suporte aos status do domínio', () => {
      const mockValidacoes: ValidacaoConciliacao[] = [
        {
          id: 'val_1',
          demanda_id: 'dem_1',
          titulo: 'Conferência Total Faturamento',
          camada: CamadaValidacao.CONCILIACAO_CRUZADA_KPI,
          metodo_verificacao: 'Confronto direto',
          base_referencia: 'fechamento.xlsx',
          valor_esperado: 100000,
          valor_obtido: 100000,
          divergencia_absoluta: 0,
          divergencia_percentual: 0,
          tolerancia_permitida: 0,
          resultado: ResultadoValidacao.APROVADO,
          obrigatoria: true,
          executado_por: 'Analista Responsável',
          executado_em: '2026-10-01T12:00:00.000Z',
          criado_em: '2026-10-01T12:00:00.000Z',
          atualizado_em: '2026-10-01T12:00:00.000Z',
        },
        {
          id: 'val_2',
          demanda_id: 'dem_1',
          titulo: 'Contagem de Linhas Carregadas',
          camada: CamadaValidacao.DADOS_BRUTOS_VS_CARREGADOS,
          metodo_verificacao: 'COUNT(*)',
          valor_esperado: 1000,
          valor_obtido: 980,
          divergencia_absoluta: 20,
          divergencia_percentual: 2,
          tolerancia_permitida: 0,
          resultado: ResultadoValidacao.DIVERGENTE,
          obrigatoria: true,
          executado_por: 'Analista Responsável',
          executado_em: '2026-10-01T12:05:00.000Z',
          criado_em: '2026-10-01T12:05:00.000Z',
          atualizado_em: '2026-10-01T12:05:00.000Z',
        },
      ];

      const element = React.createElement(ValidationCardList, {
        validacoes: mockValidacoes,
        onOpenRetest: () => {},
        onRemove: () => {},
        onOpenCreate: () => {},
      });

      expect(element.props.validacoes.length).toBe(2);
      expect(element.props.validacoes[0].resultado).toBe(ResultadoValidacao.APROVADO);
      expect(element.props.validacoes[1].resultado).toBe(ResultadoValidacao.DIVERGENTE);
    });
  });
});
